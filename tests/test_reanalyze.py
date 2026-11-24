"""Mark tracks unanalyzed so Serato rebuilds grids (#473).

Synthetic MP3 GEOB frames only. Apply clears analysis_flags bit 2 and
BeatGrid/Autotags while Markers2 stays. Verify failure rolls back.
"""

from __future__ import annotations

import base64
import json
import sqlite3
import struct
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import library
import reanalyze
import server
import snapshot_frames
import tags
from tests.fixture import TempLibrary, open_database


def _geob(description: str, payload: bytes) -> bytes:
    """Build one Latin-1 GEOB frame."""
    body = bytes([0]) + b"application/octet-stream\x00\x00" + description.encode("latin-1") + b"\x00" + payload
    return b"GEOB" + len(body).to_bytes(4, "big") + b"\x00\x00" + body


def _id3(frames: list[bytes], audio: bytes) -> bytes:
    """Build an ID3v2.3 tag followed by audio bytes."""
    body = b"".join(frames)
    size = len(body)
    synchsafe = bytes((
        (size >> 21) & 0x7F,
        (size >> 14) & 0x7F,
        (size >> 7) & 0x7F,
        size & 0x7F,
    ))
    return b"ID3" + bytes([3, 0, 0]) + synchsafe + body + audio


def _markers() -> bytes:
    """Markers2 payload with one cue named Drop."""
    cue = bytearray(16)
    cue[1] = 3
    cue[2:6] = (1500).to_bytes(4, "big")
    cue[7:10] = b"\xcc\x00\x00"
    cue[12:16] = b"Drop"
    entry = b"CUE\x00" + len(cue).to_bytes(4, "big") + bytes(cue)
    return b"\x01\x01" + base64.b64encode(entry)


def _grid() -> bytes:
    """One-marker BeatGrid at 128 BPM."""
    return bytes([1, 0]) + (1).to_bytes(4, "big") + struct.pack(">f", 1.0) + struct.pack(">f", 128.0)


def _autotags() -> bytes:
    """Distinctive Autotags payload."""
    return b"\x01AUTOTAGS-TEST"


def _audio(path: Path, *, with_grid: bool = True, with_auto: bool = True) -> bytes:
    """Write an MP3-shaped file with Markers2 and optional analysis frames."""
    audio = b"AUDIOFRAME" * 8
    frames = [_geob("Serato Markers2", _markers())]
    if with_grid:
        frames.append(_geob("Serato BeatGrid", _grid()))
    if with_auto:
        frames.append(_geob("Serato Autotags", _autotags()))
    path.write_bytes(_id3(frames, audio))
    return audio


def _file_uri(path: Path) -> str:
    """Return a connection URI, using the Windows ``file:///C:/...`` form.

    A path with a drive letter is spelled ``file:///C:/...``. Any other
    path uses ``Path.as_uri``. That Windows form is what hid the location
    file when the slash before the drive letter was kept.

    Args:
        path: Location database file.

    Returns:
        The URI stored in ``connection.database_uri``.
    """
    posix = path.resolve().as_posix()
    if len(posix) >= 2 and posix[1] == ":":
        return "file:///" + posix
    return path.resolve().as_uri()


def _seed(db: Path, rows: list[tuple[int, Path, int, int]]) -> None:
    """Put tracks in crate 5 with analysis_flags and lock."""
    with open_database(db) as conn:
        conn.execute("DELETE FROM container_asset")
        conn.execute("DELETE FROM location_container")
        conn.execute("DELETE FROM space_asset")
        conn.execute("DELETE FROM asset")
        conn.execute("DELETE FROM container WHERE id = 5")
        conn.execute(
            "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Gig', 1, 1)"
        )
        conn.execute(
            "INSERT INTO location_container (id, container_id, location_id) VALUES (50, 5, 1)"
        )
        for asset_id, path, flags, locked in rows:
            stored = str(path)
            conn.execute(
                """
                INSERT INTO asset
                    (id, name, artist, file_name, portable_id, analysis_flags, is_beatgrid_locked)
                VALUES (?, ?, 'A', ?, ?, ?, ?)
                """,
                (asset_id, path.name, path.name, stored, flags, locked),
            )
            conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))
            conn.execute(
                "INSERT INTO container_asset (asset_id, location_container_id) VALUES (?, 50)",
                (asset_id,),
            )
        conn.commit()


class BitTests(unittest.TestCase):
    """analysis_flags bit helpers."""

    def test_analyzed_bit(self) -> None:
        self.assertTrue(reanalyze.analyzed_bit_set(4))
        self.assertTrue(reanalyze.analyzed_bit_set(4 | 1))
        self.assertFalse(reanalyze.analyzed_bit_set(0))
        self.assertFalse(reanalyze.analyzed_bit_set(1))
        self.assertFalse(reanalyze.analyzed_bit_set(None))
        self.assertEqual(reanalyze.clear_analyzed_bit(5), 1)
        self.assertEqual(reanalyze.clear_analyzed_bit(4), 0)


class ClearFramesTests(unittest.TestCase):
    """snapshot_frames.clear_analysis_frames keeps Markers2."""

    def test_clears_beatgrid_and_autotags_keeps_markers2(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            path = Path(raw) / "track.mp3"
            _audio(path)
            before = snapshot_frames.read_stored_frames(path)
            markers = before["Markers2"]
            snapshot_frames.clear_analysis_frames(path)
            after = snapshot_frames.read_stored_frames(path)
            self.assertEqual(after.get("Markers2"), markers)
            self.assertNotIn("BeatGrid", after)
            self.assertNotIn("Autotags", after)
            self.assertTrue(snapshot_frames.analysis_frames_cleared(path))
            cues = tags.read_serato_tags(str(path))["cues"]
            self.assertEqual([cue["name"] for cue in cues], ["Drop"])


class PreviewApplyTests(unittest.TestCase):
    """preview / apply through safe_write."""

    def test_needs_crate(self) -> None:
        with self.assertRaises(library.LibraryError) as raised:
            reanalyze.require_crate(None)
        self.assertEqual(raised.exception.message, reanalyze.NEEDS_CRATE)

    def test_preview_lists_analyzed_tracks(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            _seed(temp.db, [(10, path, 4, 0)])
            plan = reanalyze.preview(library.LIBRARY_SPACE, 5)
            self.assertTrue(plan["preview"])
            self.assertFalse(plan["written"])
            self.assertEqual(plan["count"], 1)
            self.assertEqual(plan["tracks"][0]["id"], 10)
            self.assertEqual(plan["tracks"][0]["cleared"], ["BeatGrid", "Autotags"])
            self.assertEqual(plan["markers2"], "unchanged")

    def test_preview_db_only_skips_frame_list(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            _seed(temp.db, [(10, path, 4, 0)])
            plan = reanalyze.preview(library.LIBRARY_SPACE, 5, clear_frames=False)
            self.assertEqual(plan["tracks"][0]["cleared"], [])
            self.assertTrue(plan["tracks"][0]["has_beatgrid"])

    def test_locked_refused_without_include(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "locked.mp3"
            _audio(path)
            _seed(temp.db, [(11, path, 4, 1)])
            plan = reanalyze.preview(library.LIBRARY_SPACE, 5)
            self.assertEqual(plan["count"], 0)
            self.assertEqual(len(plan["locked"]), 1)
            original = path.read_bytes()
            with self.assertRaises(library.LibraryError) as raised:
                reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertEqual(raised.exception.message, reanalyze.LOCKED)
            self.assertEqual(path.read_bytes(), original)
            with open_database(temp.db) as conn:
                flags = conn.execute("SELECT analysis_flags FROM asset WHERE id = 11").fetchone()[0]
            self.assertTrue(reanalyze.analyzed_bit_set(flags))

    def test_apply_skips_locked_and_marks_the_rest(self) -> None:
        with TempLibrary() as temp:
            locked_path = temp.root / "locked.mp3"
            ready_path = temp.root / "ready.mp3"
            _audio(locked_path)
            _audio(ready_path)
            locked_bytes = locked_path.read_bytes()
            _seed(temp.db, [(11, locked_path, 4, 1), (12, ready_path, 4, 0)])
            result = reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertTrue(result["written"])
            self.assertEqual(result["count"], 1)
            self.assertEqual(result["tracks"][0]["id"], 12)
            self.assertEqual(len(result["locked"]), 1)
            self.assertEqual(locked_path.read_bytes(), locked_bytes)
            with open_database(temp.db) as conn:
                rows = {
                    int(row[0]): row
                    for row in conn.execute(
                        "SELECT id, analysis_flags, is_beatgrid_locked FROM asset WHERE id IN (11, 12)"
                    )
                }
            self.assertTrue(reanalyze.analyzed_bit_set(rows[11][1]))
            self.assertEqual(int(rows[11][2] or 0), 1)
            self.assertFalse(reanalyze.analyzed_bit_set(rows[12][1]))
            self.assertNotIn("BeatGrid", snapshot_frames.read_stored_frames(ready_path))
            self.assertIn("Markers2", snapshot_frames.read_stored_frames(ready_path))
            self.assertIn("BeatGrid", snapshot_frames.read_stored_frames(locked_path))

    def test_apply_clears_flags_and_frames_keeps_cues(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            original = path.read_bytes()
            markers = snapshot_frames.read_stored_frames(path)["Markers2"]
            _seed(temp.db, [(12, path, 4 | 1, 0)])
            result = reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertTrue(result["written"])
            self.assertEqual(result["count"], 1)
            with open_database(temp.db) as conn:
                row = conn.execute(
                    "SELECT analysis_flags, is_beatgrid_locked FROM asset WHERE id = 12"
                ).fetchone()
            self.assertEqual(int(row[0]), 1)
            self.assertFalse(reanalyze.analyzed_bit_set(row[0]))
            after = snapshot_frames.read_stored_frames(path)
            self.assertEqual(after.get("Markers2"), markers)
            self.assertNotIn("BeatGrid", after)
            self.assertNotIn("Autotags", after)
            self.assertNotEqual(path.read_bytes(), original)
            cues = tags.read_serato_tags(str(path))["cues"]
            self.assertEqual([cue["name"] for cue in cues], ["Drop"])

    def test_apply_db_only_leaves_frames(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            original = path.read_bytes()
            _seed(temp.db, [(13, path, 4, 0)])
            result = reanalyze.apply(library.LIBRARY_SPACE, 5, clear_frames=False)
            self.assertTrue(result["written"])
            self.assertEqual(path.read_bytes(), original)
            with open_database(temp.db) as conn:
                flags = conn.execute("SELECT analysis_flags FROM asset WHERE id = 13").fetchone()[0]
            self.assertFalse(reanalyze.analyzed_bit_set(flags))

    def test_apply_include_locked_unlocks(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "locked.mp3"
            _audio(path)
            _seed(temp.db, [(14, path, 4, 1)])
            result = reanalyze.apply(library.LIBRARY_SPACE, 5, include_locked=True)
            self.assertTrue(result["written"])
            with open_database(temp.db) as conn:
                row = conn.execute(
                    "SELECT analysis_flags, is_beatgrid_locked FROM asset WHERE id = 14"
                ).fetchone()
            self.assertFalse(reanalyze.analyzed_bit_set(row[0]))
            self.assertEqual(int(row[1] or 0), 0)

    def test_empty_plan_does_not_write(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "clean.mp3"
            _audio(path, with_grid=False, with_auto=False)
            _seed(temp.db, [(15, path, 0, 0)])
            with mock.patch("safe_write.run", side_effect=AssertionError("wrote")):
                result = reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertFalse(result["written"])

    def test_apply_without_confirm_refuses(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            _seed(temp.db, [(16, path, 4, 0)])
            original = path.read_bytes()
            with self.assertRaises(library.LibraryError) as raised:
                reanalyze.action(
                    {
                        "action": "apply",
                        "space": library.LIBRARY_SPACE,
                        "crate": 5,
                    }
                )
            self.assertEqual(raised.exception.message, reanalyze.NEEDS_CONFIRM)
            self.assertEqual(path.read_bytes(), original)

    def test_verify_failure_rolls_back(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            original = path.read_bytes()
            _seed(temp.db, [(17, path, 4, 0)])
            cleared = snapshot_frames.analysis_frames_cleared
            call_count = {"n": 0}

            def flaky(p: Path) -> bool:
                call_count["n"] += 1
                if call_count["n"] <= 1:
                    return cleared(p)
                return False

            with mock.patch("snapshot_frames.analysis_frames_cleared", side_effect=flaky):
                with self.assertRaises(library.LibraryError) as raised:
                    reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertIn(reanalyze.DID_NOT_STICK, raised.exception.message)
            self.assertEqual(path.read_bytes(), original)
            with open_database(temp.db) as conn:
                flags = conn.execute("SELECT analysis_flags FROM asset WHERE id = 17").fetchone()[0]
            self.assertTrue(reanalyze.analyzed_bit_set(flags))

    def test_apply_copies_the_mark_into_the_location_database(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            markers = snapshot_frames.read_stored_frames(path)["Markers2"]
            _seed(temp.db, [(12, path, 4 | 1, 0)])
            root = temp.db.parent / "root.sqlite"
            with open_database(root) as conn:
                conn.executescript(
                    """
                    CREATE TABLE serato (revision INTEGER);
                    CREATE TABLE asset (
                        id INTEGER PRIMARY KEY,
                        analysis_flags INTEGER,
                        is_beatgrid_locked INTEGER,
                        revision INTEGER
                    );
                    INSERT INTO serato (revision) VALUES (3);
                    INSERT INTO asset (id, analysis_flags, is_beatgrid_locked, revision)
                    VALUES (201, 5, 0, 3);
                    """
                )
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET location_id = 3, external_id = 201 WHERE id = 12")
                conn.execute(
                    "INSERT INTO connection (location_id, database_uri) VALUES (3, ?)",
                    (root.resolve().as_uri(),),
                )
            result = reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertTrue(result["written"])
            self.assertNotIn("drive_absent", result)
            with open_database(root) as conn:
                row = conn.execute(
                    "SELECT analysis_flags, is_beatgrid_locked, revision FROM asset WHERE id = 201"
                ).fetchone()
                serato_rev = conn.execute("SELECT revision FROM serato").fetchone()[0]
            self.assertFalse(reanalyze.analyzed_bit_set(row[0]))
            self.assertEqual(int(row[0]), 1)
            self.assertEqual(int(row[1] or 0), 0)
            self.assertGreater(int(serato_rev), 3)
            self.assertEqual(snapshot_frames.read_stored_frames(path).get("Markers2"), markers)
            self.assertNotIn("BeatGrid", snapshot_frames.read_stored_frames(path))

    def test_absent_drive_keeps_the_laptop_mark(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            _seed(temp.db, [(12, path, 4, 0)])
            missing = temp.db.parent / "gone.sqlite"
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET location_id = 9, external_id = 201 WHERE id = 12")
                conn.execute(
                    "INSERT INTO connection (location_id, database_uri) VALUES (9, ?)",
                    (missing.resolve().as_uri(),),
                )
            result = reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertTrue(result["written"])
            self.assertTrue(result["drive_absent"])
            with open_database(temp.db) as conn:
                flags = conn.execute("SELECT analysis_flags FROM asset WHERE id = 12").fetchone()[0]
            self.assertFalse(reanalyze.analyzed_bit_set(flags))

    def test_location_readback_failure_rolls_back(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            original = path.read_bytes()
            _seed(temp.db, [(18, path, 4, 0)])
            root = temp.db.parent / "root.sqlite"
            with open_database(root) as conn:
                conn.executescript(
                    """
                    CREATE TABLE serato (revision INTEGER);
                    CREATE TABLE asset (
                        id INTEGER PRIMARY KEY,
                        analysis_flags INTEGER,
                        is_beatgrid_locked INTEGER,
                        revision INTEGER
                    );
                    INSERT INTO serato (revision) VALUES (1);
                    INSERT INTO asset (id, analysis_flags, is_beatgrid_locked, revision)
                    VALUES (201, 4, 0, 1);
                    CREATE TRIGGER keep_analyzed
                    AFTER UPDATE OF analysis_flags ON asset
                    WHEN (NEW.analysis_flags & 4) = 0
                    BEGIN
                        UPDATE asset SET analysis_flags = NEW.analysis_flags | 4 WHERE id = NEW.id;
                    END;
                    """
                )
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET location_id = 3, external_id = 201 WHERE id = 18")
                conn.execute(
                    "INSERT INTO connection (location_id, database_uri) VALUES (3, ?)",
                    (root.resolve().as_uri(),),
                )
            with self.assertRaises(library.LibraryError) as raised:
                reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertIn(reanalyze.DID_NOT_STICK, raised.exception.message)
            self.assertEqual(path.read_bytes(), original)
            with open_database(temp.db) as conn:
                flags = conn.execute("SELECT analysis_flags FROM asset WHERE id = 18").fetchone()[0]
            self.assertTrue(reanalyze.analyzed_bit_set(flags))
            with open_database(root) as conn:
                loc = conn.execute("SELECT analysis_flags FROM asset WHERE id = 201").fetchone()[0]
            self.assertTrue(reanalyze.analyzed_bit_set(loc))

    def test_location_write_failure_rolls_back(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            original = path.read_bytes()
            _seed(temp.db, [(17, path, 4, 0)])
            bad = temp.db.parent / "drive.sqlite"
            bad.write_bytes(b"not a database")
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET location_id = 9, external_id = 201 WHERE id = 17")
                conn.execute(
                    "INSERT INTO connection (location_id, database_uri) VALUES (9, ?)",
                    (_file_uri(bad),),
                )
            with self.assertRaises(library.LibraryError) as raised:
                reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertIn(reanalyze.DID_NOT_STICK, raised.exception.message)
            self.assertEqual(path.read_bytes(), original)
            with open_database(temp.db) as conn:
                flags = conn.execute("SELECT analysis_flags FROM asset WHERE id = 17").fetchone()[0]
            self.assertTrue(reanalyze.analyzed_bit_set(flags))

    def test_parse_db_path_keeps_windows_drive_letter(self) -> None:
        """A file:///C:/ URI must not keep the slash urlparse puts before C:."""
        cases = (
            ("file:///C:/Music/location.sqlite", "C:/Music/location.sqlite"),
            ("file:///Z:/Music/My%20Library/location.sqlite", "Z:/Music/My Library/location.sqlite"),
            ("file:///Volumes/GIG%20DRIVE/location.sqlite", "/Volumes/GIG DRIVE/location.sqlite"),
            ("file:///Users/dj/Library/location.sqlite", "/Users/dj/Library/location.sqlite"),
        )
        for uri, expected in cases:
            with self.subTest(uri=uri):
                parsed = library._parse_db_path(uri)
                self.assertIsNotNone(parsed)
                assert parsed is not None
                self.assertEqual(parsed.as_posix(), expected)

    def test_location_paths_follows_a_windows_uri(self) -> None:
        """A Windows file URI names the location file that is on disk."""
        with TempLibrary() as temp:
            loc = temp.db.parent / "drive.sqlite"
            loc.write_bytes(b"")
            resolved = loc.resolve()
            found_uri = _file_uri(resolved)
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO connection (location_id, database_uri) VALUES (9, ?)",
                    (found_uri,),
                )
                conn.row_factory = sqlite3.Row
                found = library._location_paths(conn)
            self.assertIn(9, found)
            self.assertEqual(found[9].resolve(), resolved)

    def test_location_without_lock_column_still_marks(self) -> None:
        """A location table without is_beatgrid_locked still takes the flag clear."""
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            markers = snapshot_frames.read_stored_frames(path)["Markers2"]
            _seed(temp.db, [(19, path, 4, 0)])
            root = temp.db.parent / "root.sqlite"
            with open_database(root) as conn:
                conn.executescript(
                    """
                    CREATE TABLE serato (revision INTEGER);
                    CREATE TABLE asset (
                        id INTEGER PRIMARY KEY,
                        analysis_flags INTEGER,
                        revision INTEGER
                    );
                    INSERT INTO serato (revision) VALUES (1);
                    INSERT INTO asset (id, analysis_flags, revision) VALUES (201, 4, 1);
                    """
                )
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET location_id = 3, external_id = 201 WHERE id = 19")
                conn.execute(
                    "INSERT INTO connection (location_id, database_uri) VALUES (3, ?)",
                    (_file_uri(root),),
                )
            result = reanalyze.apply(library.LIBRARY_SPACE, 5)
            self.assertTrue(result["written"])
            with open_database(root) as conn:
                flags = conn.execute("SELECT analysis_flags FROM asset WHERE id = 201").fetchone()[0]
            self.assertFalse(reanalyze.analyzed_bit_set(flags))
            self.assertEqual(snapshot_frames.read_stored_frames(path).get("Markers2"), markers)

    def test_public_plan_omits_paths(self) -> None:
        """Preview JSON names the file, not the absolute path."""
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            _seed(temp.db, [(21, path, 4, 0)])
            plan = reanalyze.preview(library.LIBRARY_SPACE, 5)
            self.assertEqual(plan["count"], 1)
            row = plan["tracks"][0]
            self.assertEqual(row["file"], "ready.mp3")
            self.assertNotIn("path", row)


class RouteTests(unittest.TestCase):
    """GET and POST /api/reanalyze."""

    def test_get_and_post(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "ready.mp3"
            _audio(path)
            _seed(temp.db, [(20, path, 4, 0)])
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            host, port = httpd.server_address[:2]
            try:
                with urllib.request.urlopen(
                    f"http://{host}:{port}/api/reanalyze?space=Serato%20Library&crate=5",
                    timeout=10,
                ) as response:
                    body = json.loads(response.read().decode())
                self.assertEqual(body["count"], 1)
                self.assertTrue(body["preview"])
                request = urllib.request.Request(
                    f"http://{host}:{port}/api/reanalyze",
                    data=json.dumps(
                        {
                            "action": "apply",
                            "confirm": True,
                            "space": "Serato Library",
                            "crate": 5,
                        }
                    ).encode(),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(request, timeout=30) as response:
                    posted = json.loads(response.read().decode())
                self.assertTrue(posted["written"])
                self.assertFalse(posted["preview"])
            except urllib.error.HTTPError as exc:
                self.fail(exc.read().decode())
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join(timeout=5)


if __name__ == "__main__":
    unittest.main()
