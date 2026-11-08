"""Keep crates in step with folders (#210)."""

from __future__ import annotations

import os
import unittest
from contextlib import closing
from pathlib import Path
from typing import cast
from unittest import mock

import folder_sync
import library
import safe_write
from library import LibraryError, SeratoOpen
from tests import test_server
from tests.fixture import TempLibrary, open_database
from tests.test_smart_presets import _members


def _touch(path: Path) -> None:
    """Create a tiny dummy audio file.

    Args:
        path: File to write. Parent directories are created.

    Returns:
        None.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"ID3")


def _point(temp: TempLibrary, asset_id: int, path: Path) -> None:
    """Point a fixture track at a dummy file.

    Args:
        temp: Open temporary library.
        asset_id: Asset id.
        path: Absolute dummy file.

    Returns:
        None.
    """
    with open_database(temp.db) as conn:
        conn.execute(
            "UPDATE asset SET portable_id = ?, file_name = ? WHERE id = ?",
            (str(path), path.name, asset_id),
        )


def _add_asset(temp: TempLibrary, asset_id: int, path: Path) -> None:
    """Insert a library track that points at a dummy file.

    Args:
        temp: Open temporary library.
        asset_id: New asset id.
        path: Absolute dummy file.

    Returns:
        None.
    """
    _touch(path)
    with open_database(temp.db) as conn:
        conn.execute(
            """
            INSERT INTO asset (id, name, artist, bpm, key, file_name, portable_id, location_id, is_missing)
            VALUES (?, ?, 'Artist', 120, '1A', ?, ?, 1, 0)
            """,
            (asset_id, path.stem, path.name, str(path)),
        )
        conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


class RelPartsTests(unittest.TestCase):
    """Folder prefix matching must not treat hip as hiphop."""

    def test_posix_and_windows_prefixes(self) -> None:
        """A shorter folder name is not a prefix of a longer sibling.

        Returns:
            None.
        """
        self.assertIsNone(folder_sync.rel_parts(("Music", "hip"), ("Music", "hiphop", "a.mp3")))
        self.assertEqual(
            folder_sync.rel_parts(("Music", "hip"), ("Music", "hip", "a.mp3")),
            ("a.mp3",),
        )
        self.assertIsNone(folder_sync.rel_parts(("C:", "Music", "hip"), ("C:", "Music", "hiphop", "a.mp3")))
        self.assertEqual(
            folder_sync.rel_parts(("C:", "Music", "Hip"), ("c:", "Music", "hip", "a.mp3")),
            ("a.mp3",),
        )
        self.assertEqual(folder_sync.rel_parts(("Music", "hip"), ("Music", "hip")), ())
        self.assertEqual(
            folder_sync.rel_parts(("Music", "hip"), ("Music", "hip", "old", "a.mp3")),
            ("old", "a.mp3"),
        )


class FolderSyncTests(unittest.TestCase):
    """Preview and sync against dummy files in a temporary library."""

    def test_add_only_skips_unimported_audio(self) -> None:
        """Library tracks under the folder are added. Other audio is listed.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "mix"
            inside = folder / "same-a.mp3"
            nested = folder / "deep" / "same-b.mp3"
            stray = folder / "new.mp3"
            sibling = temp.root / "other" / "away.mp3"
            _touch(inside)
            _touch(nested)
            _touch(stray)
            _touch(sibling)
            _point(temp, 1, inside)
            _point(temp, 2, nested)
            crate_id = cast(int, library.crate_action({"action": "create", "name": "Mix"})["id"])
            preview = folder_sync.preview("Serato Library", crate_id, str(folder))
            self.assertEqual(preview["added"], 2)
            self.assertEqual(preview["removed"], 0)
            self.assertEqual(preview["written"], False)
            self.assertEqual(preview["skipped"], ["new.mp3"])
            self.assertEqual(preview["skipped_count"], 1)
            with mock.patch("safe_write.run", wraps=safe_write.run) as run:
                result = folder_sync.sync("Serato Library", crate_id, str(folder))
            self.assertTrue(run.called)
            self.assertEqual(result["written"], True)
            self.assertEqual(sorted(_members(crate_id)), [1, 2])
            with mock.patch("safe_write.run", wraps=safe_write.run) as run:
                again = folder_sync.sync("Serato Library", crate_id, str(folder))
            self.assertFalse(run.called)
            self.assertEqual(again["written"], False)
            self.assertEqual(again["added"], 0)

    def test_prefix_does_not_take_sibling_folder(self) -> None:
        """Tracks in hiphop stay out of a sync of hip.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            hip = temp.root / "hip"
            hiphop = temp.root / "hiphop"
            left = hip / "left.mp3"
            right = hiphop / "right.mp3"
            _add_asset(temp, 3, left)
            _add_asset(temp, 4, right)
            crate_id = cast(int, library.crate_action({"action": "create", "name": "Hip"})["id"])
            preview = folder_sync.preview("Serato Library", crate_id, str(hip))
            self.assertEqual(preview["added"], 1)
            result = folder_sync.sync("Serato Library", crate_id, str(hip))
            self.assertEqual(_members(crate_id), [3])
            self.assertEqual(result["added"], 1)

    def test_subcrates_map_nearest_folder(self) -> None:
        """Direct files stay on the parent. Each subfolder gets a child crate.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "set"
            top = folder / "top.mp3"
            house = folder / "House" / "h.mp3"
            deep = folder / "House" / "Deep" / "d.mp3"
            empty = folder / "Empty"
            empty.mkdir(parents=True)
            _add_asset(temp, 3, top)
            _add_asset(temp, 4, house)
            _add_asset(temp, 5, deep)
            crate_id = cast(int, library.crate_action({"action": "create", "name": "Set"})["id"])
            existing = cast(int, library.crate_action({"action": "create", "name": "House", "parent": crate_id})["id"])
            preview = folder_sync.preview("Serato Library", crate_id, str(folder), subcrates=True)
            names = [row["name"] for row in cast(list, preview["crates"])]
            self.assertEqual(names, ["Set", "House", "Deep"])
            self.assertEqual(preview["created"], 1)
            self.assertFalse(cast(list, preview["crates"])[1]["created"])
            result = folder_sync.sync("Serato Library", crate_id, str(folder), subcrates=True)
            self.assertEqual(sorted(_members(crate_id)), [3])
            self.assertEqual(sorted(_members(existing)), [4])
            with closing(library.read_conn()) as conn:
                deep_id = library._find_child(conn, existing, "Deep", 1)
            self.assertIsNotNone(deep_id)
            self.assertEqual(sorted(_members(int(deep_id))), [5])
            with closing(library.read_conn()) as conn:
                self.assertIsNone(library._find_child(conn, crate_id, "Empty", 1))
            self.assertEqual(result["created"], 1)

    def test_full_removes_members_that_left(self) -> None:
        """Add-only keeps a member whose file is elsewhere. Full removes it.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "keep"
            stay = folder / "stay.mp3"
            gone = temp.root / "away" / "gone.mp3"
            _add_asset(temp, 3, stay)
            _add_asset(temp, 4, gone)
            crate_id = cast(int, library.crate_action({"action": "create", "name": "Keep"})["id"])
            library.crate_action({"action": "add", "id": crate_id, "asset": 4})
            add_only = folder_sync.sync("Serato Library", crate_id, str(folder))
            self.assertEqual(sorted(_members(crate_id)), [3, 4])
            self.assertEqual(add_only["removed"], 0)
            full = folder_sync.sync("Serato Library", crate_id, str(folder), full=True)
            self.assertEqual(_members(crate_id), [3])
            self.assertEqual(full["removed"], 1)
            self.assertTrue(full["written"])

    def test_refuses_smart_missing_and_shortcut(self) -> None:
        """Smart crates, a missing folder, a file, and a shortcut are refused.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "ok"
            folder.mkdir()
            crate_id = cast(int, library.crate_action({"action": "create", "name": "Ok"})["id"])
            smart_id = cast(int, library.crate_action({"action": "create", "name": "Smart", "smart": True})["id"])
            with self.assertRaises(LibraryError) as smart:
                folder_sync.preview("Serato Library", smart_id, str(folder))
            self.assertEqual(smart.exception.message, folder_sync.SMART)
            with self.assertRaises(LibraryError) as missing:
                folder_sync.preview("Serato Library", crate_id, str(temp.root / "nope"))
            self.assertEqual(missing.exception.message, folder_sync.CHOOSE_FOLDER)
            file_path = temp.root / "file.mp3"
            _touch(file_path)
            with self.assertRaises(LibraryError) as not_dir:
                folder_sync.preview("Serato Library", crate_id, str(file_path))
            self.assertEqual(not_dir.exception.message, folder_sync.FOLDER_UNREADABLE)
            with self.assertRaises(LibraryError) as blank:
                folder_sync.preview("Serato Library", crate_id, "  ")
            self.assertEqual(blank.exception.message, folder_sync.CHOOSE_FOLDER)
            with self.assertRaises(LibraryError) as root:
                folder_sync.preview("Serato Library", 1, str(folder))
            self.assertEqual(root.exception.message, folder_sync.ROOT_CRATE)
            link = temp.root / "link"
            try:
                os.symlink(folder, link, target_is_directory=True)
            except (OSError, NotImplementedError):
                return
            with self.assertRaises(LibraryError) as shortcut:
                folder_sync.preview("Serato Library", crate_id, str(link))
            self.assertEqual(shortcut.exception.message, folder_sync.SHORTCUT)

    def test_serato_open_blocks_the_write(self) -> None:
        """A running Serato process refuses sync. Preview still reads.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "live"
            track = folder / "a.mp3"
            _add_asset(temp, 3, track)
            crate_id = cast(int, library.crate_action({"action": "create", "name": "Live"})["id"])
            preview = folder_sync.preview("Serato Library", crate_id, str(folder))
            self.assertEqual(preview["added"], 1)
            with open_database(temp.db) as conn:
                conn.execute("INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')")
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                folder_sync.sync("Serato Library", crate_id, str(folder))
            self.assertEqual(_members(crate_id), [])


class FolderSyncApiTests(unittest.TestCase):
    """``POST /api/folder-sync`` against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_preview_sync_and_errors(self) -> None:
        """Preview does not write. Sync adds. Bad folders get a code.

        Returns:
            None.
        """
        folder = self.library.root / "api"
        track = folder / "same-a.mp3"
        _touch(track)
        _point(self.library, 1, track)
        crate_id = cast(int, library.crate_action({"action": "create", "name": "Api"})["id"])
        status, preview = self.request(
            "/api/folder-sync",
            {"action": "preview", "crate": crate_id, "folder": str(folder)},
        )
        self.assertEqual(status, 200)
        self.assertEqual(cast(dict, preview)["added"], 1)
        self.assertEqual(cast(dict, preview)["written"], False)
        self.assertEqual(_members(crate_id), [])
        status, made = self.request(
            "/api/folder-sync",
            {"action": "sync", "crate": crate_id, "folder": str(folder)},
        )
        self.assertEqual(status, 200)
        self.assertEqual(cast(dict, made)["written"], True)
        self.assertEqual(_members(crate_id), [1])
        status, bad = self.request(
            "/api/folder-sync",
            {"action": "preview", "crate": crate_id, "folder": ""},
        )
        self.assertEqual((status, cast(dict, bad)["code"]), (400, "choose_folder"))
        status, missing = self.request("/api/folder-sync", {"action": "preview", "crate": 99, "folder": str(folder)})
        self.assertEqual((status, cast(dict, missing)["code"]), (404, "crate_not_in_space"))
        status, action = self.request("/api/folder-sync", {"action": "wipe", "crate": crate_id, "folder": str(folder)})
        self.assertEqual((status, cast(dict, action)["code"]), (400, "action_unavailable"))


if __name__ == "__main__":
    unittest.main()
