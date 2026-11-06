"""Corrupt-file safety scan (#19), read-only.

``file_scan.sniff`` is checked against tiny synthetic files of each container.
``file_scan.scan`` is checked against a temporary library whose tracks point
at those files. The library file and the audio files must be unchanged.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import struct
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import wave
from collections.abc import Iterator
from contextlib import closing
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import error_codes
import file_scan
import library
import server
import waveform
from tests.fixture import TempLibrary

# An MPEG-1 Layer III frame header: sync, 128 kbps, 44.1 kHz.
_MPEG_FRAME = b"\xff\xfb\x90\x64" + bytes(413)


def _id3(padding: int) -> bytes:
    """Return an empty ID3v2.3 tag with ``padding`` bytes of padding."""
    size = bytes(((padding >> shift) & 0x7F) for shift in (21, 14, 7, 0))
    return b"ID3\x03\x00\x00" + size + bytes(padding)


def _wav(path: Path, seconds: float, *, rate: int = 8000) -> Path:
    """Write a mono 16-bit WAV of a quiet tone."""
    frames = int(seconds * rate)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes(b"".join(struct.pack("<h", (i % 50) * 20) for i in range(frames)))
    return path


def _aiff_head() -> bytes:
    """Return the start of an AIFF file."""
    return b"FORM" + struct.pack(">I", 4) + b"AIFF"


def _digest(path: Path) -> str:
    """Return the SHA-256 of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _symlinks_work() -> bool:
    """Return whether this OS lets the test create a symlink."""
    with tempfile.TemporaryDirectory() as tmp:
        try:
            os.symlink(Path(tmp) / "target", Path(tmp) / "link")
        except (OSError, NotImplementedError):
            return False
    return True


class SniffTests(unittest.TestCase):
    """The first bytes of a file must match its extension."""

    def setUp(self) -> None:
        self._dir = tempfile.TemporaryDirectory()
        self.root = Path(self._dir.name)

    def tearDown(self) -> None:
        self._dir.cleanup()

    def _file(self, name: str, data: bytes) -> Path:
        path = self.root / name
        path.write_bytes(data)
        return path

    def test_each_container_is_ok(self) -> None:
        cases = {
            "tagged.mp3": _id3(64) + _MPEG_FRAME,
            "bare.mp3": _MPEG_FRAME,
            "upper.MP3": _MPEG_FRAME,
            "t.flac": b"fLaC" + bytes(64),
            "tagged.flac": _id3(32) + b"fLaC" + bytes(64),
            "t.aiff": _aiff_head() + bytes(32),
            "t.aif": _aiff_head() + bytes(32),
            "t.m4a": struct.pack(">I", 24) + b"ftypM4A " + bytes(16),
            "t.mp4": struct.pack(">I", 24) + b"ftypisom" + bytes(16),
            "t.ogg": b"OggS" + bytes(64),
            "t.aac": b"\xff\xf1\x50\x80" + bytes(64),
        }
        for name, data in cases.items():
            with self.subTest(name=name):
                self.assertEqual(file_scan.sniff(self._file(name, data)), ("ok", ""))
        self.assertEqual(file_scan.sniff(_wav(self.root / "t.wav", 0.1)), ("ok", ""))

    def test_audio_after_a_large_id3_tag_is_found(self) -> None:
        """A tag bigger than the read window is skipped, not read."""
        path = self._file("art.mp3", _id3(300_000) + _MPEG_FRAME)
        self.assertEqual(file_scan.sniff(path), ("ok", ""))

    def test_empty_file(self) -> None:
        self.assertEqual(file_scan.sniff(self._file("e.mp3", b"")), ("empty", ""))

    def test_another_format_under_this_name(self) -> None:
        cases = {
            "page.mp3": (b"<!DOCTYPE html><html>" + bytes(64), "html"),
            "lower.mp3": (b"<html><body>" + bytes(64), "html"),
            "zip.m4a": (b"PK\x03\x04" + bytes(64), "zip"),
            "flac.mp3": (b"fLaC" + bytes(64), "flac"),
            "mp3.wav": (_MPEG_FRAME, "mpeg"),
            "wav.flac": (b"RIFF" + struct.pack("<I", 4) + b"WAVE" + bytes(32), "wav"),
        }
        for name, (data, actual) in cases.items():
            with self.subTest(name=name):
                self.assertEqual(file_scan.sniff(self._file(name, data)), ("wrong_format", actual))

    def test_no_audio_header(self) -> None:
        """Zeros after a tag, or a header cut short, have no audio start."""
        self.assertEqual(file_scan.sniff(self._file("z.mp3", bytes(4096))), ("wrong_format", "unknown"))
        self.assertEqual(file_scan.sniff(self._file("cut.mp3", _id3(64))), ("wrong_format", "unknown"))
        self.assertEqual(file_scan.sniff(self._file("cut.flac", b"fLa")), ("wrong_format", "unknown"))

    def test_bad_mpeg_header_bits_are_not_audio(self) -> None:
        """0xFF then a reserved version, or layer 00 without the ADTS sync, is no frame."""
        reserved_version = b"\xff\xeb\x90\x64" + bytes(64)  # version bits 01
        layer_zero = b"\xff\xe1\x90\x64" + bytes(64)  # layer 00, only an 11-bit sync
        for data in (reserved_version, layer_zero):
            with self.subTest(data=data[:2].hex()):
                self.assertEqual(file_scan.sniff(self._file("r.mp3", data)), ("wrong_format", "unknown"))

    def test_aac_and_mp3_frames_are_told_apart(self) -> None:
        """An ADTS AAC stream saved as .mp3, or an MP3 saved as .aac, is the wrong format."""
        adts = b"\xff\xf9\x50\x80" + bytes(64)
        self.assertEqual(file_scan.sniff(self._file("aac.mp3", adts)), ("wrong_format", "adts"))
        self.assertEqual(file_scan.sniff(self._file("mp3.aac", _MPEG_FRAME)), ("wrong_format", "mpeg"))
        self.assertEqual(file_scan.sniff(self._file("tagged.aac", _id3(16) + adts)), ("ok", ""))

    def test_other_extensions_are_not_checked(self) -> None:
        self.assertEqual(file_scan.sniff(self._file("notes.txt", b"hello")), ("unchecked", ""))
        self.assertEqual(file_scan.sniff(self._file("noext", b"hello")), ("unchecked", ""))

    def test_unreadable(self) -> None:
        folder = self.root / "folder.mp3"
        folder.mkdir()
        self.assertEqual(file_scan.sniff(folder), ("unreadable", ""))

    def test_file_is_opened_read_only(self) -> None:
        path = self._file("t.mp3", _MPEG_FRAME)
        real_open = open
        modes: list[str] = []

        def spy(file: object, mode: str = "r", *args: object, **kwargs: object) -> object:
            modes.append(mode)
            return real_open(file, mode, *args, **kwargs)  # type: ignore[call-overload]

        with mock.patch("builtins.open", spy):
            file_scan.sniff(path)
        self.assertEqual(modes, ["rb"])


class DecodeTests(unittest.TestCase):
    """A full check decodes the whole file."""

    def setUp(self) -> None:
        self._dir = tempfile.TemporaryDirectory()
        self.root = Path(self._dir.name)

    def tearDown(self) -> None:
        self._dir.cleanup()

    def test_good_file(self) -> None:
        path = _wav(self.root / "good.wav", 1.0)
        self.assertEqual(file_scan.decode_check(path, 1000), ("ok", ""))
        self.assertEqual(file_scan.decode_check(path, None), ("ok", ""))

    def test_short_compared_with_the_library_length(self) -> None:
        """Ten seconds in the library and one on disk is a cut-off file.

        ``detail`` is decoded/expected whole seconds, so the page can word it.
        """
        path = _wav(self.root / "cut.wav", 1.0)
        problem, detail = file_scan.decode_check(path, 10_000)
        self.assertEqual(problem, "short")
        self.assertEqual(detail, "1/10")

    def test_small_differences_are_not_short(self) -> None:
        """Encoder padding is a few hundred milliseconds, not a problem."""
        path = _wav(self.root / "pad.wav", 1.0)
        self.assertEqual(file_scan.decode_check(path, 1400), ("ok", ""))
        # Under 90 % of the length but within 5 seconds of it (30 of 34 s).
        within_slack = _wav(self.root / "slack.wav", 30.0, rate=2000)
        self.assertEqual(file_scan.decode_check(within_slack, 34_000), ("ok", ""))
        # More than 5 seconds short but still over 90 % of it (60 of 66 s).
        over_ratio = _wav(self.root / "ratio.wav", 60.0, rate=2000)
        self.assertEqual(file_scan.decode_check(over_ratio, 66_000), ("ok", ""))

    def test_no_decoder(self) -> None:
        def refuse(_path: Path) -> Iterator[object]:
            raise waveform.WaveformUnavailable()
            yield  # pragma: no cover

        with mock.patch.object(waveform, "iter_pcm", refuse):
            self.assertEqual(file_scan.decode_check(self.root / "x.mp3", 1000), ("undecodable", ""))

    def test_no_samples(self) -> None:
        def silent(_path: Path) -> Iterator[object]:
            return iter(())

        with mock.patch.object(waveform, "iter_pcm", silent):
            self.assertEqual(file_scan.decode_check(self.root / "x.mp3", 1000), ("undecodable", ""))

    def test_error_part_way_through(self) -> None:
        import numpy as np

        def broken(_path: Path) -> Iterator[object]:
            yield np.zeros(44100, dtype=np.float32)
            raise RuntimeError("bad frame")

        with mock.patch.object(waveform, "iter_pcm", broken):
            self.assertEqual(file_scan.decode_check(self.root / "x.mp3", 5000), ("decode_error", "1"))


def _point(conn: sqlite3.Connection, asset_id: int, path: Path | str, *, name: str, length_ms: int | None = 1000) -> None:
    """Add a library track that points at ``path``."""
    conn.execute(
        "INSERT INTO asset (id, name, artist, file_name, portable_id, length_ms, is_missing) VALUES (?, ?, 'DJ', ?, ?, ?, 0)",
        (asset_id, name, Path(path).name, str(path), length_ms),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


class ScanTests(unittest.TestCase):
    """The scan reads the library and the files and writes nothing."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        self.music = self.fixture.root / "music"
        self.music.mkdir()
        good = self.music / "good.mp3"
        good.write_bytes(_MPEG_FRAME)
        (self.music / "empty.mp3").write_bytes(b"")
        (self.music / "page.mp3").write_bytes(b"<html>" + bytes(32))
        (self.music / "flagged.mp3").write_bytes(_MPEG_FRAME)
        (self.music / "notes.txt").write_bytes(b"hi")
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            # The fixture's two tracks point at files that are not on disk.
            _point(conn, 10, good, name="Good")
            _point(conn, 11, self.music / "empty.mp3", name="Empty")
            _point(conn, 12, self.music / "page.mp3", name="Page")
            _point(conn, 13, self.music / "flagged.mp3", name="Flagged")
            _point(conn, 14, self.music / "notes.txt", name="Notes")
            _point(conn, 15, self.fixture.root / "unplugged" / "gone.mp3", name="Gone")
            conn.execute("UPDATE asset SET is_corrupt = 1, corrupt_description = 'Bad frames' WHERE id = 13")
            conn.commit()

    def tearDown(self) -> None:
        self.fixture.__exit__(None, None, None)

    def _state(self) -> dict[str, str]:
        state = {path.name: _digest(path) for path in self.music.iterdir()}
        state["master.sqlite"] = _digest(self.fixture.db)
        return state

    def test_quick_scan_reports_each_problem(self) -> None:
        before = self._state()
        report = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual(self._state(), before)
        self.assertEqual(report["depth"], "quick")
        self.assertIsNone(report["crate"])
        self.assertEqual(report["checked"], 4)
        self.assertEqual(report["not_found"], 3)
        self.assertEqual(report["unchecked"], 1)
        problems = {row["id"]: (row["problem"], row["detail"]) for row in report["problems"]}  # type: ignore[index, union-attr]
        self.assertEqual(
            problems,
            {11: ("empty", ""), 12: ("wrong_format", "html"), 13: ("serato_flagged", "Bad frames")},
        )
        self.assertEqual(report["counts"], {"empty": 1, "wrong_format": 1, "serato_flagged": 1})
        row = next(row for row in report["problems"] if row["id"] == 12)  # type: ignore[index, union-attr]
        self.assertEqual(row, {"id": 12, "name": "Page", "artist": "DJ", "file": "page.mp3", "problem": "wrong_format", "detail": "html"})
        self.assertNotIn(str(self.music), json.dumps(report))

    def test_file_problem_comes_before_the_serato_flag(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("UPDATE asset SET is_corrupt = 1 WHERE id = 12")
            conn.commit()
        report = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE)
        row = next(row for row in report["problems"] if row["id"] == 12)  # type: ignore[index, union-attr]
        self.assertEqual(row["problem"], "wrong_format")  # type: ignore[index]

    def test_database_without_the_corrupt_columns(self) -> None:
        """An older schema has no ``is_corrupt``; the file checks still run."""
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("ALTER TABLE asset DROP COLUMN corrupt_description")
            conn.execute("ALTER TABLE asset DROP COLUMN is_corrupt")
            conn.commit()
        report = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual(report["counts"], {"empty": 1, "wrong_format": 1})

    def test_full_scan_decodes(self) -> None:
        _wav(self.music / "cut.wav", 1.0)
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 16, self.music / "cut.wav", name="Cut", length_ms=20_000)
            conn.commit()
        report = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE, depth="full")
        problems = {row["id"]: row["problem"] for row in report["problems"]}  # type: ignore[index, union-attr]
        self.assertEqual(problems[16], "short")
        self.assertEqual(problems[13], "serato_flagged")
        # A file that fails the quick check is not decoded as well.
        self.assertEqual(problems[12], "wrong_format")

    def test_crate_and_its_subcrates(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Gig', 1, 1)")
            conn.execute("INSERT INTO container (id, parent_id, name, type, space_id) VALUES (6, 5, 'Encore', 1, 1)")
            conn.execute("INSERT INTO location_container (id, container_id, location_id) VALUES (50, 5, 1)")
            # Serato links membership through location_container; the test schema also has container_id.
            conn.execute("INSERT INTO container_asset (asset_id, location_container_id) VALUES (11, 50)")
            conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (12, 6)")
            conn.commit()
        report = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE, crate_id=5)
        self.assertEqual(report["crate"], 5)
        self.assertEqual(report["checked"], 2)
        self.assertEqual(report["not_found"], 0)
        self.assertEqual({row["id"] for row in report["problems"]}, {11, 12})  # type: ignore[index, union-attr]
        child = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE, crate_id=6)
        self.assertEqual({row["id"] for row in child["problems"]}, {12})  # type: ignore[index, union-attr]

    def test_crate_in_another_space_is_refused(self) -> None:
        with self.assertRaises(library.LibraryError) as caught:
            file_scan.scan(self.fixture.db, library.LIBRARY_SPACE, crate_id=2)
        self.assertEqual(caught.exception.status, 404)

    def test_bad_depth_and_space(self) -> None:
        with self.assertRaises(library.LibraryError) as depth:
            file_scan.scan(self.fixture.db, library.LIBRARY_SPACE, depth="deep")
        self.assertEqual((depth.exception.status, depth.exception.message), (400, file_scan.BAD_DEPTH))
        with self.assertRaises(library.LibraryError):
            file_scan.scan(self.fixture.db, "Nope")

    def test_missing_library(self) -> None:
        with self.assertRaises(library.LibraryError) as caught:
            file_scan.scan(self.fixture.root / "none" / "master.sqlite", library.LIBRARY_SPACE)
        self.assertEqual(caught.exception.status, 404)

    def test_empty_library(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("DELETE FROM space_asset")
            conn.commit()
        report = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual((report["checked"], report["not_found"], report["problems"]), (0, 0, []))

    @unittest.skipUnless(_symlinks_work(), "symlinks are not available")
    def test_symlinks(self) -> None:
        """A link to a good file is checked; a link to nothing is not found."""
        os.symlink(self.music / "good.mp3", self.music / "link.mp3")
        os.symlink(self.music / "nothing.mp3", self.music / "dangling.mp3")
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 20, self.music / "link.mp3", name="Link")
            _point(conn, 21, self.music / "dangling.mp3", name="Dangling")
            conn.commit()
        report = file_scan.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual(report["checked"], 5)
        self.assertEqual(report["not_found"], 4)
        self.assertNotIn(20, {row["id"] for row in report["problems"]})  # type: ignore[index, union-attr]


class FullNeedsCrateTests(unittest.TestCase):
    """A full decode over the whole library is the CLI's job, not a page request."""

    def test_require_crate_for_full(self) -> None:
        file_scan.require_crate_for_full("quick", None)
        file_scan.require_crate_for_full("full", 5)
        with self.assertRaises(library.LibraryError) as caught:
            file_scan.require_crate_for_full("full", None)
        self.assertEqual((caught.exception.status, caught.exception.message), (400, file_scan.FULL_NEEDS_CRATE))

    def test_sentences_have_codes_in_every_locale(self) -> None:
        root = Path(__file__).resolve().parent.parent
        for sentence, code in ((file_scan.BAD_DEPTH, "scan_depth"), (file_scan.FULL_NEEDS_CRATE, "scan_full_needs_crate")):
            with self.subTest(code=code):
                self.assertEqual(error_codes.ERROR_CODES[sentence], code)
                for locale in ("en", "es"):
                    catalog = json.loads((root / "locales" / f"{locale}.json").read_text(encoding="utf-8"))
                    self.assertTrue(catalog.get(f"error.{code}"))


class ApiTests(unittest.TestCase):
    """``GET /api/file-scan``."""

    def _get(self, query: str) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/file-scan{query}") as response:
                    return response.status, json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, json.loads(error.read().decode("utf-8"))
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)

    def test_routes(self) -> None:
        with TempLibrary() as fixture:
            empty = fixture.root / "empty.mp3"
            empty.write_bytes(b"")
            with closing(sqlite3.connect(fixture.db)) as conn:
                _point(conn, 10, empty, name="Empty")
                conn.execute("INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Gig', 1, 1)")
                conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (10, 5)")
                conn.commit()
            before = _digest(fixture.db)
            status, body = self._get("")
            self.assertEqual(status, 200)
            self.assertEqual(body["counts"], {"empty": 1})
            status, body = self._get("?crate=5&depth=full")
            self.assertEqual((status, body["depth"], body["crate"]), (200, "full", 5))
            status, body = self._get("?depth=full")
            self.assertEqual((status, body["code"]), (400, "scan_full_needs_crate"))
            status, body = self._get("?depth=deep&crate=5")
            self.assertEqual((status, body["code"]), (400, "scan_depth"))
            status, _body = self._get("?crate=999")
            self.assertEqual(status, 404)
            status, _body = self._get("?crate=nope")
            self.assertEqual(status, 400)
            self.assertEqual(_digest(fixture.db), before)


class CliTests(unittest.TestCase):
    """``python3 file_scan.py`` prints the report."""

    def test_main(self) -> None:
        with TempLibrary() as fixture:
            with mock.patch("sys.stdout") as out:
                self.assertEqual(file_scan.main(["--database", str(fixture.db)]), 0)
            printed = "".join(call.args[0] for call in out.write.call_args_list)
            self.assertEqual(json.loads(printed)["not_found"], 2)
            with mock.patch("sys.stderr"):
                self.assertEqual(file_scan.main(["--database", str(fixture.root / "none.sqlite")]), 1)


if __name__ == "__main__":
    unittest.main()
