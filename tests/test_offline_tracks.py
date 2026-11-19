"""Serato's missing flag on an unplugged drive is offline, not missing (#208).

Tracks sit in a temporary library. Audio files are temp paths or invented
unplugged-drive paths. The live Serato library is never opened.
"""

from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path

import library
import server
from tests.fixture import TempLibrary


def _unplugged_path() -> tuple[str, str]:
    """Return a stored path on a drive that is not connected, and its name."""
    if sys.platform == "win32":
        return r"Z:\Music\cut.mp3", "Z:"
    return "/Volumes/OFFLINE208/Music/cut.mp3", "OFFLINE208"


def _seed(db: Path, rows: list[tuple[int, str, str, int]]) -> None:
    """Replace fixture tracks with ``(id, name, portable_id, is_missing)``."""
    with closing(sqlite3.connect(db)) as conn:
        conn.execute("DELETE FROM space_asset")
        conn.execute("DELETE FROM asset")
        for asset_id, name, stored, missing in rows:
            conn.execute(
                "INSERT INTO asset (id, name, artist, file_name, portable_id, is_missing) "
                "VALUES (?, ?, 'Artist', ?, ?, ?)",
                (asset_id, name, Path(stored).name, stored, missing),
            )
            conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))
        conn.commit()


class LibraryListTests(unittest.TestCase):
    """GET /api/library splits unplugged drives from missing files."""

    def test_unplugged_drive_is_offline_and_a_gone_file_stays_missing(self) -> None:
        """Serato marked both missing; only the connected-drive file stays missing."""
        unplugged, drive = _unplugged_path()
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            gone = Path(raw) / "gone.mp3"
            here = Path(raw) / "here.mp3"
            here.write_bytes(b"audio")
            _seed(
                temp.db,
                [
                    (1, "USB cut", unplugged, 1),
                    (2, "Gone", str(gone), 1),
                    (3, "Here", str(here), 0),
                ],
            )
            before = temp.db.read_bytes()
            server.invalidate()
            payload = server.load_library(library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)
        by_name = {track["name"]: track for track in payload["tracks"]}
        cut = by_name["USB cut"]
        missing = by_name["Gone"]
        present = by_name["Here"]
        self.assertEqual(cut["missing"], 0)
        self.assertEqual(cut["offline"], 1)
        self.assertEqual(cut["offline_drive"], drive)
        self.assertEqual(missing["missing"], 1)
        self.assertNotIn("offline", missing)
        self.assertEqual(present["missing"], 0)
        self.assertNotIn("offline", present)

    def test_crate_of_only_offline_tracks_is_not_connected(self) -> None:
        """A crate whose tracks are all on an unplugged drive stays in the tree.

        Returns:
            None. The test fails if the crate is missing or marked as a missing file.
        """
        unplugged, drive = _unplugged_path()
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            here = Path(raw) / "here.mp3"
            here.write_bytes(b"audio")
            _seed(
                temp.db,
                [
                    (1, "USB cut", unplugged, 1),
                    (3, "Here", str(here), 0),
                ],
            )
            with closing(sqlite3.connect(temp.db)) as conn:
                conn.execute(
                    """
                    INSERT INTO container
                        (id, parent_id, name, type, list_order, space_id, time_added, expanded, portable_id)
                    VALUES (5, 1, 'Friday', 1, 0, 1, 1, 0, ''),
                           (6, 1, 'Mixed', 1, 1, 1, 1, 0, '')
                    """
                )
                conn.execute(
                    "INSERT INTO location_container (id, container_id, location_id) VALUES (1, 5, 1), (2, 6, 1)"
                )
                conn.execute(
                    """
                    INSERT INTO container_asset
                        (id, asset_id, location_container_id, space_asset_id, list_order)
                    VALUES (1, 1, 1, 1, 0), (2, 1, 2, 1, 0), (3, 3, 2, 2, 1)
                    """
                )
                conn.commit()
            server.invalidate()
            payload = server.load_library(library.LIBRARY_SPACE)
        by_name = {crate["name"]: crate for crate in payload["crates"]}
        friday = by_name["Friday"]
        mixed = by_name["Mixed"]
        self.assertEqual(friday["drive_status"], "not_connected")
        self.assertEqual(friday["drive_name"], drive)
        self.assertNotIn("drive_status", mixed)

    def test_present_file_is_not_offline_when_serato_did_not_mark_it(self) -> None:
        """An unplugged path that Serato did not mark missing stays unmarked."""
        unplugged, _drive = _unplugged_path()
        with TempLibrary() as temp:
            _seed(temp.db, [(1, "Quiet", unplugged, 0)])
            server.invalidate()
            payload = server.load_library(library.LIBRARY_SPACE)
        track = payload["tracks"][0]
        self.assertEqual(track["missing"], 0)
        self.assertNotIn("offline", track)


class TrackDetailTests(unittest.TestCase):
    """GET /api/track uses the same split."""

    def test_detail_marks_an_unplugged_drive_offline(self) -> None:
        """The detail payload is offline, not missing, and does not rewrite the row."""
        unplugged, drive = _unplugged_path()
        with TempLibrary() as temp:
            _seed(temp.db, [(1, "USB cut", unplugged, 1)])
            before = temp.db.read_bytes()
            detail = server.load_track(1, library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)
        assert detail is not None
        self.assertFalse(detail["missing"])
        self.assertTrue(detail["offline"])
        self.assertEqual(detail["offline_drive"], drive)

    def test_detail_keeps_a_connected_missing_file(self) -> None:
        """A missing file on this disk stays missing in the detail payload."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            gone = Path(raw) / "gone.mp3"
            _seed(temp.db, [(1, "Gone", str(gone), 1)])
            detail = server.load_track(1, library.LIBRARY_SPACE)
        assert detail is not None
        self.assertTrue(detail["missing"])
        self.assertNotIn("offline", detail)


if __name__ == "__main__":
    unittest.main()
