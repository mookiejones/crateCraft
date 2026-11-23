"""Half-tempo and double-tempo BPM flags (#474).

Detection is pure. Apply tests use a temporary library and patch
``snapshots.serato_dj_running`` so a running Serato DJ does not block the
write. One test leaves that patch true and asserts nothing is written.
"""

from __future__ import annotations

import hashlib
import json
import math
import sqlite3
import threading
import unittest
import urllib.error
import urllib.request
from contextlib import closing
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import bpm_sanity
import error_codes
import library
import server
from tests.fixture import TempLibrary


def _track(asset_id: int, bpm: object, name: str | None = None) -> bpm_sanity.TrackBpm:
    title = name or f"Track {asset_id}"
    return bpm_sanity.TrackBpm(asset_id, title, "DJ", f"{title}.mp3", bpm)


def _ids(report: dict[str, object]) -> list[int]:
    flags = report["flags"]
    assert isinstance(flags, list)
    return [int(row["id"]) for row in flags]


class ClassifyTests(unittest.TestCase):
    """Median, octave, and majority rules. No database."""

    def test_half_tempo_is_doubled(self) -> None:
        tracks = [_track(index, 128, f"House {index}") for index in range(1, 5)]
        tracks.append(_track(9, 64, "Half"))
        report = bpm_sanity.classify(tracks)
        self.assertEqual(_ids(report), [9])
        flag = report["flags"][0]  # type: ignore[index]
        self.assertEqual(flag["kind"], "half")
        self.assertEqual(flag["fix"], "x2")
        self.assertEqual(flag["suggested"], 128)
        self.assertEqual(flag["file"], "Half.mp3")
        self.assertEqual(report["beatgrid"], "unchanged")
        self.assertEqual(report["anchor"], 128)

    def test_double_tempo_is_halved(self) -> None:
        tracks = [_track(index, 128, f"House {index}") for index in range(1, 5)]
        tracks.append(_track(9, 256, "Double"))
        report = bpm_sanity.classify(tracks)
        self.assertEqual(_ids(report), [9])
        flag = report["flags"][0]  # type: ignore[index]
        self.assertEqual(flag["kind"], "double")
        self.assertEqual(flag["fix"], "div2")
        self.assertEqual(flag["suggested"], 128)

    def test_in_family_bpm_is_not_flagged(self) -> None:
        tracks = [_track(index, 128, f"House {index}") for index in range(1, 4)]
        tracks.append(_track(9, 125, "Close"))
        report = bpm_sanity.classify(tracks)
        self.assertEqual(_ids(report), [])
        self.assertTrue(report["ready"])

    def test_even_mix_is_not_flagged(self) -> None:
        tracks = [_track(1, 64), _track(2, 64), _track(3, 128), _track(4, 128)]
        report = bpm_sanity.classify(tracks)
        self.assertEqual(_ids(report), [])
        self.assertEqual(report["anchor"], 96)
        self.assertTrue(report["ready"])

    def test_equal_flag_count_is_not_a_majority(self) -> None:
        tracks = [_track(index, 128, f"House {index}") for index in range(1, 6)]
        tracks.extend(_track(index, 64, f"Half {index}") for index in range(6, 11))
        tracks.append(_track(11, 200, "Other"))
        report = bpm_sanity.classify(tracks)
        self.assertEqual(report["anchor"], 128)
        self.assertEqual(_ids(report), [])

    def test_majority_flags_only_the_halves(self) -> None:
        tracks = [_track(index, 128, f"House {index}") for index in range(1, 6)]
        tracks.extend(_track(index, 64, f"Half {index}") for index in range(6, 10))
        tracks.append(_track(11, 200, "Other"))
        report = bpm_sanity.classify(tracks)
        self.assertEqual(_ids(report), [6, 7, 8, 9])
        self.assertTrue(all(row["fix"] == "x2" for row in report["flags"]))  # type: ignore[union-attr]

    def test_four_and_two_flags_the_halves(self) -> None:
        tracks = [_track(index, 128, f"House {index}") for index in range(1, 5)]
        tracks.extend(_track(index, 64, f"Half {index}") for index in range(5, 7))
        report = bpm_sanity.classify(tracks)
        self.assertEqual(_ids(report), [5, 6])

    def test_blank_zero_and_non_finite_are_skipped(self) -> None:
        tracks = [_track(index, 128, f"House {index}") for index in range(1, 4)]
        tracks.extend(
            [
                _track(10, None, "Blank"),
                _track(11, 0, "Zero"),
                _track(12, -4, "Negative"),
                _track(13, math.nan, "Nan"),
                _track(14, math.inf, "Inf"),
                _track(15, True, "Bool"),
            ]
        )
        report = bpm_sanity.classify(tracks)
        self.assertEqual(report["checked"], 3)
        self.assertEqual(report["skipped"], 6)
        self.assertEqual(_ids(report), [])

    def test_fewer_than_three_bpms_are_not_flagged(self) -> None:
        report = bpm_sanity.classify([_track(1, 128), _track(2, 64)])
        self.assertFalse(report["ready"])
        self.assertEqual(_ids(report), [])
        self.assertIsNone(report["anchor"])

    def test_suggested_bpm_outside_range_is_not_flagged(self) -> None:
        tracks = [_track(1, 2000), _track(2, 2000), _track(3, 1000, "Half")]
        report = bpm_sanity.classify(tracks)
        self.assertEqual(report["anchor"], 2000)
        self.assertEqual(_ids(report), [])

    def test_windows_and_posix_file_names(self) -> None:
        windows = bpm_sanity.TrackBpm(1, "Win", "DJ", "", None)
        self.assertEqual(bpm_sanity._file_name("", r"C:\Music\half.mp3"), "half.mp3")
        self.assertEqual(bpm_sanity._file_name(None, "/Volumes/USB/Music/half.mp3"), "half.mp3")
        self.assertEqual(bpm_sanity._file_name("kept.mp3", r"D:\secret\kept.mp3"), "kept.mp3")
        self.assertNotIn("\\", bpm_sanity._file_name("", r"C:\Music\half.mp3"))
        self.assertEqual(windows.file, "")


def _point(
    conn: sqlite3.Connection,
    asset_id: int,
    *,
    name: str,
    bpm: object,
    portable: str = "Music/track.mp3",
    file_name: str | None = None,
) -> None:
    conn.execute(
        "INSERT INTO asset (id, name, artist, album, key, comments, bpm, file_name, portable_id, "
        "is_missing) VALUES (?, ?, 'DJ', 'Album', '8A', 'note', ?, ?, ?, 0)",
        (asset_id, name, bpm, file_name if file_name is not None else f"{name}.mp3", portable),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


def _crate(conn: sqlite3.Connection, crate_id: int, parent_id: int, *asset_ids: int) -> None:
    conn.execute(
        "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (?, ?, 'Gig', 1, 1)",
        (crate_id, parent_id),
    )
    for asset_id in asset_ids:
        conn.execute(
            "INSERT INTO container_asset (asset_id, container_id) VALUES (?, ?)",
            (asset_id, crate_id),
        )


def _bpm(path: Path, asset_id: int) -> object:
    with closing(sqlite3.connect(path)) as conn:
        row = conn.execute(
            "SELECT name, artist, album, key, comments, bpm, file_name FROM asset WHERE id = ?",
            (asset_id,),
        ).fetchone()
    return row


class ScanTests(unittest.TestCase):
    """Crate membership, including a subcrate and a Windows file name."""

    def test_subcrate_and_windows_name(self) -> None:
        with TempLibrary() as temp:
            with closing(sqlite3.connect(temp.db)) as conn:
                for asset_id in range(10, 14):
                    _point(conn, asset_id, name=f"House {asset_id}", bpm=128)
                _point(
                    conn,
                    14,
                    name="Half",
                    bpm=64,
                    portable="C:\\Music\\half.mp3",
                    file_name="",
                )
                _point(conn, 15, name="Outside", bpm=64)
                _crate(conn, 5, 1, 10, 11, 12, 13)
                _crate(conn, 6, 5, 14)
                conn.commit()
            report = bpm_sanity.scan(temp.db, library.LIBRARY_SPACE, 5)
            self.assertEqual(_ids(report), [14])
            self.assertEqual(report["flags"][0]["file"], "half.mp3")  # type: ignore[index]
            self.assertNotIn("Outside", [row["name"] for row in report["flags"]])  # type: ignore[union-attr, index]

    def test_unknown_crate_and_space(self) -> None:
        with TempLibrary() as temp:
            with self.assertRaises(library.LibraryError) as missing:
                bpm_sanity.scan(temp.db, library.LIBRARY_SPACE, 999)
            self.assertEqual(missing.exception.status, 404)
            with self.assertRaises(library.LibraryError) as space:
                bpm_sanity.scan(temp.db, "Nope", 1)
            self.assertIn("space", space.exception.message.lower())

    def test_empty_crate_is_not_ready(self) -> None:
        with TempLibrary() as temp:
            with closing(sqlite3.connect(temp.db)) as conn:
                _crate(conn, 5, 1)
                conn.commit()
            report = bpm_sanity.scan(temp.db, library.LIBRARY_SPACE, 5)
            self.assertFalse(report["ready"])
            self.assertEqual(report["flags"], [])


class ApplyTests(unittest.TestCase):
    """Writes go through save_track. A bad read-back restores the snapshot."""

    def _plant(self, temp: TempLibrary) -> Path:
        audio = temp.root / "half.mp3"
        audio.write_bytes(b"not-audio-but-stable")
        with closing(sqlite3.connect(temp.db)) as conn:
            for asset_id in range(10, 14):
                _point(conn, asset_id, name=f"House {asset_id}", bpm=128)
            _point(conn, 14, name="Half", bpm=64, portable=str(audio), file_name="half.mp3")
            _crate(conn, 5, 1, 10, 11, 12, 13, 14)
            conn.commit()
        return audio

    def test_apply_writes_only_bpm(self) -> None:
        with TempLibrary() as temp:
            audio = self._plant(temp)
            before_audio = hashlib.sha256(audio.read_bytes()).hexdigest()
            before = _bpm(temp.db, 14)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                result = bpm_sanity.apply(library.LIBRARY_SPACE, 5, 14, "x2")
            after = _bpm(temp.db, 14)
            self.assertEqual(result["bpm"], 128)
            self.assertEqual(result["beatgrid"], "unchanged")
            self.assertEqual(after[5], 128)
            self.assertEqual(before[:5], after[:5])
            self.assertEqual(before[6], after[6])
            self.assertEqual(hashlib.sha256(audio.read_bytes()).hexdigest(), before_audio)

    def test_readback_mismatch_restores_the_bpm(self) -> None:
        with TempLibrary() as temp:
            self._plant(temp)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                with mock.patch("bpm_sanity._read_bpm", return_value=1.0):
                    with self.assertRaises(library.LibraryError) as caught:
                        bpm_sanity.apply(library.LIBRARY_SPACE, 5, 14, "x2")
            self.assertEqual(caught.exception.message, bpm_sanity.DID_NOT_STICK)
            self.assertEqual(caught.exception.status, 409)
            self.assertEqual(_bpm(temp.db, 14)[5], 64)

    def test_serato_open_writes_nothing(self) -> None:
        with TempLibrary() as temp:
            self._plant(temp)
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                with self.assertRaises(library.SeratoOpen):
                    bpm_sanity.apply(library.LIBRARY_SPACE, 5, 14, "x2")
            self.assertEqual(_bpm(temp.db, 14)[5], 64)

    def test_wrong_fix_and_unflagged_track_do_not_write(self) -> None:
        with TempLibrary() as temp:
            self._plant(temp)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                with self.assertRaises(library.LibraryError) as wrong:
                    bpm_sanity.apply(library.LIBRARY_SPACE, 5, 14, "div2")
                with self.assertRaises(library.LibraryError) as quiet:
                    bpm_sanity.apply(library.LIBRARY_SPACE, 5, 10, "x2")
            self.assertEqual(wrong.exception.message, bpm_sanity.FIX_MISMATCH)
            self.assertEqual(quiet.exception.message, bpm_sanity.NOT_FLAGGED)
            self.assertEqual(_bpm(temp.db, 14)[5], 64)
            self.assertEqual(_bpm(temp.db, 10)[5], 128)

    def test_preview_names_the_beatgrid_and_does_not_write(self) -> None:
        with TempLibrary() as temp:
            self._plant(temp)
            before = _bpm(temp.db, 14)
            result = bpm_sanity.preview(library.LIBRARY_SPACE, 5, 14, "x2")
            self.assertTrue(result["preview"])
            self.assertIn("beatgrid", str(result["message"]).lower())
            self.assertEqual(result["beatgrid"], "unchanged")
            self.assertEqual(_bpm(temp.db, 14), before)

    def test_client_bpm_is_ignored(self) -> None:
        with TempLibrary() as temp:
            self._plant(temp)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                result = bpm_sanity.action(
                    {
                        "id": 14,
                        "fix": "x2",
                        "crate": 5,
                        "confirm": True,
                        "bpm": 999,
                    }
                )
            self.assertEqual(result["bpm"], 128)
            self.assertEqual(_bpm(temp.db, 14)[5], 128)


class ApiTests(unittest.TestCase):
    """``GET`` and ``POST /api/bpm-sanity``."""

    def _request(self, method: str, path: str, body: dict[str, object] | None = None) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        data = None if body is None else json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            f"http://{host!s}:{port}{path}",
            data=data,
            method=method,
            headers={} if data is None else {"Content-Type": "application/json"},
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

    def test_routes(self) -> None:
        with TempLibrary() as temp:
            with closing(sqlite3.connect(temp.db)) as conn:
                for asset_id in range(10, 14):
                    _point(conn, asset_id, name=f"House {asset_id}", bpm=128)
                _point(conn, 14, name="Half", bpm=64)
                _crate(conn, 5, 1, 10, 11, 12, 13, 14)
                conn.commit()
            before = hashlib.sha256(temp.db.read_bytes()).hexdigest()
            status, body = self._request("GET", "/api/bpm-sanity?crate=5")
            self.assertEqual(status, 200)
            self.assertEqual(_ids(body), [14])
            self.assertEqual(body["beatgrid"], "unchanged")
            status, missing = self._request("GET", "/api/bpm-sanity")
            self.assertEqual((missing.get("code"), status), ("bpm_needs_crate", 400))
            status, _unknown = self._request("GET", "/api/bpm-sanity?crate=999")
            self.assertEqual(status, 404)
            status, _bad = self._request("GET", "/api/bpm-sanity?crate=x")
            self.assertEqual(status, 400)
            status, preview = self._request(
                "POST",
                "/api/bpm-sanity",
                {"id": 14, "fix": "x2", "crate": 5},
            )
            self.assertEqual(status, 200)
            self.assertTrue(preview["preview"])
            self.assertEqual(hashlib.sha256(temp.db.read_bytes()).hexdigest(), before)
            status, refused = self._request(
                "POST",
                "/api/bpm-sanity",
                {"id": 14, "fix": "x2", "crate": 5, "action": "apply"},
            )
            self.assertEqual((refused.get("code"), status), ("bpm_needs_confirm", 400))
            self.assertEqual(hashlib.sha256(temp.db.read_bytes()).hexdigest(), before)

    def test_sentences_have_codes_in_every_locale(self) -> None:
        pairs = {
            bpm_sanity.NEEDS_CRATE: "bpm_needs_crate",
            bpm_sanity.NOT_FLAGGED: "bpm_not_flagged",
            bpm_sanity.FIX_MISMATCH: "bpm_fix_mismatch",
            bpm_sanity.NEEDS_CONFIRM: "bpm_needs_confirm",
            bpm_sanity.DID_NOT_STICK: "bpm_did_not_stick",
        }
        for message, code in pairs.items():
            self.assertEqual(error_codes.ERROR_CODES[message], code)
        root = Path(__file__).resolve().parent.parent
        for locale in ("en", "es"):
            catalog = json.loads((root / "locales" / f"{locale}.json").read_text(encoding="utf-8"))
            for code in pairs.values():
                self.assertTrue(catalog.get(f"error.{code}"))


class CliTests(unittest.TestCase):
    def test_main_is_read_only(self) -> None:
        with TempLibrary() as temp:
            before = hashlib.sha256(temp.db.read_bytes()).hexdigest()
            with mock.patch("sys.stdout") as out:
                self.assertEqual(bpm_sanity.main(["--database", str(temp.db)]), 0)
            printed = "".join(call.args[0] for call in out.write.call_args_list)
            self.assertIn("flags", json.loads(printed))
            self.assertEqual(hashlib.sha256(temp.db.read_bytes()).hexdigest(), before)
            with mock.patch("sys.stderr"):
                self.assertEqual(bpm_sanity.main(["--database", str(temp.root / "none.sqlite")]), 1)


if __name__ == "__main__":
    unittest.main()
