"""Quality line and sticky Not a problem dismiss (#416).

Bitrate comes from ``bitrate_check.estimate_kbps`` on decoded audio.
An extension is not a bitrate. Dismiss writes ``quality-dismissals.json``
beside settings and does not change the audio or the library file.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

import numpy as np

import app_config
import library
import library_health
import quality_line
import server
from tests.fixture import TempLibrary, open_database
from tests.test_bitrate_check import _noise, _wav

LOW_HZ = 15_000
HIGH_HZ = 18_200
LOW_KBPS = 128
HIGH_KBPS = 192


def _pin(path: Path, samples: np.ndarray) -> Path:
    """Write ``samples`` with one shared int16 peak so only the cliff changes."""
    audio = np.asarray(samples, dtype=np.float64)
    audio = audio / np.max(np.abs(audio)) * (8000 / 32767)
    return _wav(path, audio.astype(np.float32))


def _digest(path: Path) -> str:
    """Return the SHA-256 of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _inside(child: Path, parent: Path) -> bool:
    """Return True when ``child`` is ``parent`` or a file inside it."""
    try:
        child.resolve().relative_to(parent.resolve())
    except ValueError:
        return False
    return True


def _add(conn: sqlite3.Connection, asset_id: int, name: str, path: Path) -> None:
    """Insert one Serato Library track that points at ``path``."""
    conn.execute(
        """
        INSERT INTO asset
            (id, name, artist, bpm, key, genre, is_missing, length_ms, file_name, portable_id)
        VALUES (?, ?, 'DJ', 128, '8A', 'House', 0, 180000, ?, ?)
        """,
        (asset_id, name, path.name, str(path)),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


def _ids(body: dict[str, object]) -> list[int]:
    """Return quality-section track ids."""
    section = body["quality"]
    assert isinstance(section, dict)
    tracks = section["tracks"]
    assert isinstance(tracks, list)
    return [int(row["id"]) for row in tracks if isinstance(row, dict)]


def _row(body: dict[str, object], asset_id: int) -> dict[str, object]:
    """Return one quality track."""
    section = body["quality"]
    assert isinstance(section, dict)
    tracks = section["tracks"]
    assert isinstance(tracks, list)
    for row in tracks:
        if isinstance(row, dict) and int(row["id"]) == asset_id:
            return row
    raise AssertionError(f"track {asset_id} not in quality")


def _quality(body: dict[str, object], asset_id: int) -> dict[str, object]:
    """Return the quality object on one track."""
    quality = _row(body, asset_id)["quality"]
    assert isinstance(quality, dict)
    return quality


class MeasureTests(unittest.TestCase):
    """Bitrate is measured. The extension does not invent one."""

    def test_two_files_get_two_measured_bitrates(self) -> None:
        """A 15 kHz cliff and an 18.2 kHz cliff are not the same number."""
        with TempLibrary() as temp:
            low = _wav(temp.root / "low.wav", _noise(8, LOW_HZ, seed=1))
            high = _wav(temp.root / "high.wav", _noise(8, HIGH_HZ, seed=2))
            with open_database(temp.db) as conn:
                _add(conn, 40, "Low", low)
                _add(conn, 41, "High", high)
            before = _digest(temp.db)
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(_digest(temp.db), before)
        self.assertEqual(_quality(body, 40)["bitrate_kbps"], LOW_KBPS)
        self.assertEqual(_quality(body, 41)["bitrate_kbps"], HIGH_KBPS)
        self.assertNotEqual(_quality(body, 40)["bitrate_kbps"], _quality(body, 41)["bitrate_kbps"])
        self.assertEqual(_quality(body, 40)["format"], "wav")
        self.assertIsInstance(_quality(body, 40)["peak_db"], float)
        self.assertIsInstance(_quality(body, 41)["peak_db"], float)

    def test_extension_rename_does_not_invent_a_bitrate(self) -> None:
        """A renamed blob stays empty. A WAV renamed to FLAC keeps the cliff."""
        with TempLibrary() as temp:
            blob = temp.root / "notes.mp3"
            blob.write_bytes(b"this is text, not an mp3 frame")
            empty = quality_line.measure(blob)
            self.assertIsNone(empty["format"])
            self.assertIsNone(empty["bitrate_kbps"])
            self.assertIsNone(empty["peak_db"])
            for suffix in (".flac", ".wav", ".m4a"):
                renamed_blob = temp.root / f"notes{suffix}"
                renamed_blob.write_bytes(blob.read_bytes())
                again = quality_line.measure(renamed_blob)
                self.assertIsNone(again["bitrate_kbps"], suffix)
                self.assertIsNone(again["peak_db"], suffix)
            low = _wav(temp.root / "low.wav", _noise(8, LOW_HZ, seed=3))
            measured = quality_line.measure(low)
            copied = temp.root / "low.flac"
            copied.write_bytes(low.read_bytes())
            renamed = quality_line.measure(copied)
        self.assertEqual(measured["bitrate_kbps"], LOW_KBPS)
        self.assertIn(renamed["bitrate_kbps"], (None, LOW_KBPS))
        self.assertNotEqual(renamed["bitrate_kbps"], 1411)
        self.assertNotEqual(renamed["format"], "flac")
        self.assertEqual(renamed["format"], "wav")

    def test_missing_file_quality_is_empty(self) -> None:
        """A missing path is nulls, and the report does not invent a bitrate."""
        with TempLibrary() as temp:
            gone = temp.root / "missing" / "gone.wav"
            with open_database(temp.db) as conn:
                _add(conn, 42, "Gone", gone)
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        reading = quality_line.measure(gone)
        self.assertEqual(
            (reading["format"], reading["bitrate_kbps"], reading["peak_db"]),
            (None, None, None),
        )
        self.assertNotIn(42, _ids(body))
        for row in body["quality"]["tracks"]:
            assert isinstance(row, dict)
            quality = row["quality"]
            assert isinstance(quality, dict)
            self.assertNotEqual(quality["bitrate_kbps"], 320)

    def test_crate_scope_skips_tracks_outside_the_crate(self) -> None:
        """A crate report measures that crate only."""
        with TempLibrary() as temp:
            low = _wav(temp.root / "low.wav", _noise(8, LOW_HZ, seed=4))
            high = _wav(temp.root / "high.wav", _noise(8, HIGH_HZ, seed=5))
            with open_database(temp.db) as conn:
                _add(conn, 40, "Low", low)
                _add(conn, 41, "High", high)
                conn.execute(
                    "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Gig', 1, 1)"
                )
                conn.execute(
                    "INSERT INTO container_asset (asset_id, container_id) VALUES (40, 5)"
                )
            body = library_health.report(temp.db, library.LIBRARY_SPACE, 5)
        self.assertEqual(_ids(body), [40])
        self.assertEqual(body["crate"], 5)


class DismissTests(unittest.TestCase):
    """Dismiss hides a row until the fact changes or the DJ clears it."""

    def tearDown(self) -> None:
        """Drop the dismiss file so later tests do not see this path."""
        store = quality_line.dismiss_path()
        store.unlink(missing_ok=True)
        store.with_suffix(".json.tmp").unlink(missing_ok=True)

    def _library(self, temp: TempLibrary) -> tuple[Path, Path]:
        """Point track 40 at a 128 kbps cliff and return the file and its bytes."""
        path = _wav(temp.root / "low.wav", _noise(8, LOW_HZ, seed=6))
        with open_database(temp.db) as conn:
            _add(conn, 40, "Low", path)
        return path, path.read_bytes()

    def _restore_mtime(self, path: Path, mtime_ns: int) -> None:
        """Put the modification time back without changing the bytes."""
        os.utime(path, ns=(mtime_ns, mtime_ns))

    def test_dismiss_hides_row_outside_the_library_and_clear_shows_it(self) -> None:
        """The JSON sits beside settings. Audio bytes and the library stay put."""
        with TempLibrary() as temp:
            path, audio = self._library(temp)
            names = sorted(item.relative_to(temp.root).as_posix() for item in temp.root.rglob("*"))
            db_before = _digest(temp.db)
            quality_line.dismiss(temp.db, library.LIBRARY_SPACE, 40)
            hidden = library_health.report(temp.db, library.LIBRARY_SPACE)
            store = app_config.config_dir() / "quality-dismissals.json"
            self.assertTrue(store.is_file())
            self.assertFalse(_inside(store, temp.root))
            self.assertEqual(path.read_bytes(), audio)
            self.assertEqual(_digest(temp.db), db_before)
            self.assertEqual(
                sorted(item.relative_to(temp.root).as_posix() for item in temp.root.rglob("*")),
                names,
            )
            self.assertNotIn(40, _ids(hidden))
            self.assertGreaterEqual(int(hidden["quality"]["dismissed"]), 1)
            quality_line.clear(temp.db, library.LIBRARY_SPACE, 40)
            shown = library_health.report(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(path.read_bytes(), audio)
            self.assertIn(40, _ids(shown))
            self.assertFalse(_inside(store, temp.root))

    def test_size_change_shows_the_row_again(self) -> None:
        """Extra trailing bytes change size only. Bitrate and peak stay."""
        with TempLibrary() as temp:
            path, _audio = self._library(temp)
            quality_line.dismiss(temp.db, library.LIBRARY_SPACE, 40)
            before = quality_line.measure(path)
            mtime_ns = int(before["mtime_ns"] or 0)
            path.write_bytes(path.read_bytes() + (b"\x00" * 64))
            self._restore_mtime(path, mtime_ns)
            after = quality_line.measure(path)
            self.assertNotEqual(after["size"], before["size"])
            self.assertEqual(after["mtime_ns"], before["mtime_ns"])
            self.assertEqual(after["bitrate_kbps"], before["bitrate_kbps"])
            self.assertEqual(after["peak_db"], before["peak_db"])
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertIn(40, _ids(body))

    def test_mtime_change_shows_the_row_again(self) -> None:
        """A new modification time, with the same bytes, shows the row."""
        with TempLibrary() as temp:
            path, audio = self._library(temp)
            quality_line.dismiss(temp.db, library.LIBRARY_SPACE, 40)
            before = quality_line.measure(path)
            mtime_ns = int(before["mtime_ns"] or 0)
            os.utime(path, ns=(mtime_ns, mtime_ns + 1_000_000_000))
            after = quality_line.measure(path)
            self.assertEqual(path.read_bytes(), audio)
            self.assertEqual(after["size"], before["size"])
            self.assertNotEqual(after["mtime_ns"], before["mtime_ns"])
            self.assertEqual(after["bitrate_kbps"], before["bitrate_kbps"])
            self.assertEqual(after["peak_db"], before["peak_db"])
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertIn(40, _ids(body))

    def test_bitrate_change_shows_the_row_again(self) -> None:
        """A different cliff, at the same size and mtime, shows the row."""
        with TempLibrary() as temp:
            path, _audio = self._library(temp)
            _pin(path, _noise(4, LOW_HZ, seed=6))
            quality_line.dismiss(temp.db, library.LIBRARY_SPACE, 40)
            before = quality_line.measure(path)
            mtime_ns = int(before["mtime_ns"] or 0)
            _pin(path, _noise(4, HIGH_HZ, seed=9))
            self._restore_mtime(path, mtime_ns)
            after = quality_line.measure(path)
            self.assertEqual(after["size"], before["size"])
            self.assertEqual(after["mtime_ns"], before["mtime_ns"])
            self.assertEqual(after["peak_db"], before["peak_db"])
            self.assertNotEqual(after["bitrate_kbps"], before["bitrate_kbps"])
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertIn(40, _ids(body))

    def test_peak_change_shows_the_row_again(self) -> None:
        """A quieter file, with the same cliff, size, and mtime, shows the row."""
        with TempLibrary() as temp:
            path, _audio = self._library(temp)
            quality_line.dismiss(temp.db, library.LIBRARY_SPACE, 40)
            before = quality_line.measure(path)
            mtime_ns = int(before["mtime_ns"] or 0)
            _wav(path, _noise(8, LOW_HZ, seed=6) * 0.2)
            self._restore_mtime(path, mtime_ns)
            after = quality_line.measure(path)
            self.assertEqual(after["size"], before["size"])
            self.assertEqual(after["mtime_ns"], before["mtime_ns"])
            self.assertEqual(after["bitrate_kbps"], before["bitrate_kbps"])
            self.assertNotEqual(after["peak_db"], before["peak_db"])
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertIn(40, _ids(body))


class PhraseTests(unittest.TestCase):
    """The catalogs do not use the rival product name."""

    def test_banned_phrases_are_absent(self) -> None:
        """English and Spanish never say Performance Readiness."""
        root = Path(__file__).resolve().parents[1]
        for name in ("locales/en.json", "locales/es.json"):
            text = (root / name).read_text(encoding="utf-8")
            self.assertNotIn("DJ Performance Readiness", text, name)
            self.assertNotIn("Performance Readiness", text, name)


class ApiTests(unittest.TestCase):
    """POST /api/library-health writes only the dismiss JSON."""

    def tearDown(self) -> None:
        """Drop the dismiss file so later tests do not see this path."""
        store = quality_line.dismiss_path()
        store.unlink(missing_ok=True)
        store.with_suffix(".json.tmp").unlink(missing_ok=True)

    def _post(self, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"http://{host!s}:{port}/api/library-health",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        try:
            try:
                with urllib.request.urlopen(request) as response:
                    return response.status, json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, json.loads(error.read().decode("utf-8"))
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)

    def test_post_dismiss_leaves_audio_and_the_library_alone(self) -> None:
        """The route stores the fact hash outside the library directory."""
        with TempLibrary() as temp:
            path = _wav(temp.root / "low.wav", _noise(8, LOW_HZ, seed=8))
            audio = path.read_bytes()
            with open_database(temp.db) as conn:
                _add(conn, 40, "Low", path)
            db_before = _digest(temp.db)
            status, body = self._post(
                {"action": "dismiss", "id": 40, "space": library.LIBRARY_SPACE}
            )
            self.assertEqual(status, 200, body)
            self.assertEqual(body["action"], "dismiss")
            report = library_health.report(temp.db, library.LIBRARY_SPACE)
            store = quality_line.dismiss_path()
            self.assertNotIn(40, _ids(report))
            self.assertTrue(store.is_file())
            self.assertFalse(_inside(store, temp.root))
            self.assertEqual(path.read_bytes(), audio)
            self.assertEqual(_digest(temp.db), db_before)
            status, cleared = self._post(
                {"action": "clear", "id": 40, "space": library.LIBRARY_SPACE}
            )
            self.assertEqual(status, 200, cleared)
            shown = library_health.report(temp.db, library.LIBRARY_SPACE)
            self.assertIn(40, _ids(shown))
            self.assertEqual(path.read_bytes(), audio)


if __name__ == "__main__":
    raise SystemExit(unittest.main())
