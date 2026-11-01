"""Relink matcher (#28, part 2): find where missing tracks went, read-only.

Every case builds tracks in a temporary library that point at files in a
temporary folder, then moves, renames, or deletes those files. The live
Serato library is never opened, and the library file is checked to be
byte-for-byte unchanged after each plan.
"""

from __future__ import annotations

import json
import os
import sqlite3
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from contextlib import closing
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import library
import music_roots
import relink
import server
from relink import Candidate, Missing
from tests.fixture import TempLibrary


def _tracks(db: Path, rows: list[tuple[int, str, int | None]], *, third_party: dict[int, int] | None = None) -> None:
    """Replace the fixture's tracks with ``(id, stored path, size)`` rows.

    Args:
        db: Library database.
        rows: Tracks to add to Serato Library.
        third_party: ``asset_id`` to ``third_party_type``.
    """
    with closing(sqlite3.connect(db)) as conn:
        conn.execute("DELETE FROM space_asset")
        conn.execute("DELETE FROM asset")
        for asset_id, stored, size in rows:
            conn.execute(
                "INSERT INTO asset (id, name, artist, file_name, portable_id, file_size, third_party_type) "
                "VALUES (?, ?, 'Artist', ?, ?, ?, ?)",
                (asset_id, f"Track {asset_id}", Path(stored).name, stored, size, (third_party or {}).get(asset_id)),
            )
            conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))
        conn.commit()


def _file(path: Path, data: bytes = b"audio") -> Path:
    """Write a fake audio file and return its path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def _by_id(result: dict[str, object]) -> dict[int, list[dict[str, object]]]:
    """Map asset id to its candidate list."""
    matches = result["matches"]
    assert isinstance(matches, list)
    return {int(item["asset_id"]): item["candidates"] for item in matches}  # type: ignore[index,arg-type]


class ClassifyTests(unittest.TestCase):
    """Which tracks count as missing."""

    def test_present_missing_unplugged_and_streaming(self) -> None:
        """Only a track whose file is gone on a mounted disk is missing."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            music = Path(raw) / "music"
            here = _file(music / "here.mp3")
            spare = _file(music / "elsewhere" / "gone.mp3")
            absent = "/Volumes/RELINK_TEST_ABSENT_DRIVE/Music/gone.mp3"
            letter = "Z:\\Music\\gone.mp3"
            _tracks(
                temp.db,
                [
                    (1, str(here), 5),
                    (2, str(music / "gone.mp3"), 5),
                    (3, absent, 5),
                    (4, letter, 5),
                    (5, str(music / "stream.mp3"), 5),
                ],
                third_party={5: relink.APPLE_MUSIC_THIRD_PARTY},
            )
            before = temp.db.read_bytes()
            result = relink.plan(temp.db, library.LIBRARY_SPACE, [music])
            self.assertEqual(temp.db.read_bytes(), before)
            self.assertFalse(Path(str(temp.db) + "-wal").exists())
        self.assertIn("RELINK_TEST_ABSENT_DRIVE", result["unavailable_drives"])  # type: ignore[operator]
        if sys.platform == "win32":
            # Z: is a drive letter that is not plugged in: unavailable.
            self.assertEqual(sorted(_by_id(result)), [2])
            self.assertIn("Z:", result["unavailable_drives"])  # type: ignore[operator]
        else:
            # A Windows path read on macOS or Linux is a library that came
            # from a PC, so it is missing here and worth relinking (gig
            # check rule: only an absolute path names a drive).
            self.assertEqual(sorted(_by_id(result)), [2, 4])
            self.assertNotIn("Z:", result["unavailable_drives"])  # type: ignore[operator]
        self.assertEqual(_by_id(result)[2][0]["path"], str(spare))

    def test_unknown_space_and_missing_library_are_refused(self) -> None:
        """A bad space is refused, and a missing database is a 404."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(library.LibraryError):
                relink.plan(temp.db, "Nope", [Path(raw)])
            with self.assertRaises(library.LibraryError) as caught:
                relink.plan(Path(raw) / "master.sqlite", library.LIBRARY_SPACE, [Path(raw)])
            self.assertEqual(caught.exception.status, 404)


class MatchTests(unittest.TestCase):
    """Confidence tiers for one missing track."""

    def setUp(self) -> None:
        """Make a search folder."""
        self._dir = tempfile.TemporaryDirectory()
        self.root = Path(self._dir.name)

    def tearDown(self) -> None:
        """Remove the folder."""
        self._dir.cleanup()

    def ranked(self, stored: str, size: int | None) -> list[Candidate]:
        """Scan the folder and rank candidates for one track."""
        track = Missing(1, "t", "a", stored, stored, size)
        return relink.match(track, relink.scan([self.root]))

    def test_same_name_and_size_is_high(self) -> None:
        """One file with the same name and size is a sure match."""
        found = _file(self.root / "new" / "Opener.mp3", b"12345")
        _file(self.root / "other" / "Opener.mp3", b"123")
        self.assertEqual(self.ranked("/old/Opener.mp3", 5), [Candidate(str(found), "high", "same name and size")])

    def test_name_match_ignores_case_and_windows_slashes(self) -> None:
        """A Windows path and a different case still match by name."""
        found = _file(self.root / "opener.MP3", b"12345")
        self.assertEqual(self.ranked("C:\\Old\\Opener.mp3", 5), [Candidate(str(found), "high", "same name and size")])

    def test_same_name_other_size_is_medium(self) -> None:
        """A single same-name file of another size is a likely match."""
        found = _file(self.root / "Opener.mp3", b"123")
        self.assertEqual(self.ranked("/old/Opener.mp3", 5), [Candidate(str(found), "medium", "same name")])

    def test_unknown_size_falls_back_to_the_name(self) -> None:
        """Serato 5 rows without a size still match by name."""
        found = _file(self.root / "Opener.mp3", b"123")
        self.assertEqual(self.ranked("/old/Opener.mp3", None), [Candidate(str(found), "medium", "same name")])

    def test_ties_are_low_and_all_listed(self) -> None:
        """Two equally good files are both offered at low confidence."""
        a = _file(self.root / "a" / "Opener.mp3", b"12345")
        b = _file(self.root / "b" / "Opener.mp3", b"12345")
        self.assertEqual(
            self.ranked("/old/Opener.mp3", 5),
            [Candidate(str(a), "low", "same name and size"), Candidate(str(b), "low", "same name and size")],
        )

    def test_renamed_file_matches_by_size_and_type(self) -> None:
        """A renamed file of the same size and extension is a likely match."""
        found = _file(self.root / "renamed.mp3", b"12345")
        _file(self.root / "renamed.flac", b"12345")
        self.assertEqual(self.ranked("/old/Opener.mp3", 5), [Candidate(str(found), "medium", "same size")])

    def test_nothing_fits(self) -> None:
        """No name and no size match gives no candidates."""
        _file(self.root / "other.mp3", b"1")
        self.assertEqual(self.ranked("/old/Opener.mp3", 5), [])


class RemapTests(unittest.TestCase):
    """A whole folder that moved is found once and applied to the rest."""

    def test_folder_move_is_reported_and_fills_the_gaps(self) -> None:
        """Two sure matches reveal the move; a third track rides on it."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            old = Path(raw) / "OLD" / "Music"
            new = Path(raw) / "NEW" / "DJ"
            a = _file(new / "House" / "a.mp3", b"aaaa")
            b = _file(new / "House" / "b.mp3", b"bbbbb")
            c = _file(new / "Disco" / "c.mp3", b"cc")
            _file(Path(raw) / "NEW" / "Copies" / "c.mp3", b"cc")
            _tracks(
                temp.db,
                [
                    (1, str(old / "House" / "a.mp3"), 4),
                    (2, str(old / "House" / "b.mp3"), 5),
                    (3, str(old / "Disco" / "c.mp3"), 2),
                    (4, str(old / "House" / "lost.mp3"), 9),
                ],
            )
            result = relink.plan(temp.db, library.LIBRARY_SPACE, [Path(raw) / "NEW"])
        self.assertEqual(result["remaps"], [{"from": str(old), "to": str(new), "count": 2}])
        ranked = _by_id(result)
        self.assertEqual(ranked[1][0], {"path": str(a), "confidence": "high", "reason": "same name and size"})
        self.assertEqual(ranked[2][0]["path"], str(b))
        self.assertEqual(ranked[3][0], {"path": str(c), "confidence": "high", "reason": "folder moved"})
        self.assertEqual(len(ranked[3]), 2)
        # Under the moved folder, but its file is not at the new place.
        self.assertEqual(ranked[4], [])

    def test_one_match_is_not_a_folder_move(self) -> None:
        """A single sure match does not invent a move."""
        pair = (Missing(1, "t", "a", "/OLD/Music/a.mp3", "/OLD/Music/a.mp3", 4), Candidate("/NEW/DJ/a.mp3", "high", "x"))
        self.assertEqual(relink.remaps([pair]), [])
        self.assertEqual(relink.remaps([pair, pair]), [{"from": "/OLD/Music", "to": "/NEW/DJ", "count": 2}])

    def test_folders_strip_the_shared_tail(self) -> None:
        """The shared tail is removed; same path or name-only is not a move."""
        self.assertEqual(
            relink.moved_folders("/Volumes/OLD/Music/House/a.mp3", "/Volumes/NEW/DJ/House/a.mp3"),
            (str(Path("/Volumes/OLD/Music")), str(Path("/Volumes/NEW/DJ"))),
        )
        self.assertIsNone(relink.moved_folders("/x/a.mp3", "/x/a.mp3"))


class ScanTests(unittest.TestCase):
    """The walk reads only what it should."""

    def test_skips_shortcuts_serato_hidden_and_non_audio(self) -> None:
        """Only real audio files outside _Serato_ and hidden folders are indexed."""
        with tempfile.TemporaryDirectory() as raw, tempfile.TemporaryDirectory() as outside:
            root = Path(raw)
            kept = _file(root / "a" / "keep.mp3")
            _file(root / "_Serato_" / "skip.mp3")
            _file(root / ".hidden" / "skip.mp3")
            _file(root / "notes.txt")
            _file(Path(outside) / "linked.mp3")
            try:
                os.symlink(outside, root / "link-dir", target_is_directory=True)
                os.symlink(Path(outside) / "linked.mp3", root / "link.mp3")
            except (OSError, NotImplementedError):
                pass
            index = relink.scan([root])
        self.assertEqual(index.paths, {os.path.normcase(str(kept))})

    def test_stops_at_the_limit(self) -> None:
        """A walk past the limit stops and says so."""
        with tempfile.TemporaryDirectory() as raw:
            for number in range(5):
                _file(Path(raw) / f"{number}.mp3")
            index = relink.scan([Path(raw)], limit=3)
            full = relink.scan([Path(raw)])
        self.assertTrue(index.truncated)
        self.assertEqual(index.scanned, 4)
        self.assertFalse(full.truncated)
        self.assertEqual(len(full.paths), 5)

    def test_missing_root_is_skipped(self) -> None:
        """A search folder that is gone is not an error."""
        self.assertEqual(relink.scan([Path(tempfile.gettempdir()) / "relink-no-such-folder"]).paths, set())


class SchemaTests(unittest.TestCase):
    """A library without the size column still plans."""

    def test_no_file_size_column(self) -> None:
        """Without ``file_size`` the match falls back to the name."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            found = _file(Path(raw) / "x.mp3", b"123")
            with closing(sqlite3.connect(temp.db)) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                conn.execute("ALTER TABLE asset DROP COLUMN file_size")
                conn.execute("INSERT INTO asset (id, name, portable_id) VALUES (9, 'X', ?)", (str(Path(raw) / "old" / "x.mp3"),))
                conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (9, 1)")
                conn.commit()
            result = relink.plan(temp.db, library.LIBRARY_SPACE, [Path(raw)])
        self.assertEqual(_by_id(result)[9], [{"path": str(found), "confidence": "medium", "reason": "same name"}])



class RouteTests(unittest.TestCase):
    """``GET /api/relink`` searches the present music roots only."""

    def test_route_plans_from_present_roots(self) -> None:
        """A root marked missing is not searched, and a bad space is 400."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            present = Path(raw) / "present"
            gone = Path(raw) / "gone"
            found = _file(present / "x.mp3", b"123")
            _file(gone / "y.mp3", b"45")
            _tracks(temp.db, [(1, str(Path(raw) / "old" / "x.mp3"), 3), (2, str(Path(raw) / "old" / "y.mp3"), 2)])
            roots = [{"path": str(present), "missing": False}, {"path": str(gone), "missing": True}]
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            threading.Thread(target=httpd.serve_forever, daemon=True).start()
            host, port = httpd.server_address[:2]
            base = f"http://{host}:{port}/api/relink"
            try:
                with mock.patch.object(music_roots, "music_roots", return_value=roots):
                    with urllib.request.urlopen(base + "?space=Serato%20Library", timeout=5) as response:
                        body = json.loads(response.read().decode("utf-8"))
                    with self.assertRaises(urllib.error.HTTPError) as caught:
                        urllib.request.urlopen(base + "?space=Nope", timeout=5)
                    caught.exception.close()
            finally:
                httpd.shutdown()
                httpd.server_close()
        self.assertEqual(caught.exception.code, 400)
        ranked = _by_id(body)
        self.assertEqual(ranked[1][0]["path"], str(found))
        self.assertEqual(ranked[2], [])

if __name__ == "__main__":
    unittest.main()
