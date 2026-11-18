"""Verified-copy gate for snapshot prune and duplicate-file delete.

The cases use a temporary library. They do not open a live Serato
database. Unplugged and untrusted volumes are fixtures, not the
machine's real drives.
"""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import app_config
import files
import library
import serato_web.completeness as completeness
import volumes
from library import LibraryError
from tests.fixture import TempLibrary, open_database
from tests.test_snapshots import _drive


class _ConfigCase(unittest.TestCase):
    """Point settings at a throwaway directory for one test."""

    def setUp(self) -> None:
        """Create an empty config directory.

        Returns:
            None.
        """
        self._tmp = tempfile.TemporaryDirectory()
        self.config = Path(self._tmp.name) / "config"
        self.config.mkdir()
        self._env = mock.patch.dict(
            os.environ, {app_config.CONFIG_ENV: str(self.config)}
        )
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        self._block = mock.patch("snapshots.write_block_message", return_value=None)
        self._block.start()

    def tearDown(self) -> None:
        """Remove the temporary config directory.

        Returns:
            None.
        """
        self._block.stop()
        self._running.stop()
        self._env.stop()
        self._tmp.cleanup()


class SnapshotPruneGateTests(_ConfigCase):
    """Refuse prune when remaining hash-checked copies would drop below min_copies."""

    def test_prune_refuses_when_only_live_and_this_snapshot(self) -> None:
        """Keep the only complete snapshot when min_copies is 2.

        Live library plus this snapshot is one remaining copy after prune.

        Returns:
            None. The test fails if the snapshot directory is removed.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            saved = store.take("manual", "only copy")
            folder = store._snapshot_dir(saved["id"])
            with self.assertRaises(LibraryError) as ctx:
                store.prune(saved["id"], confirm=True)
            self.assertEqual(ctx.exception.code, "copies_need_more")
            self.assertEqual(ctx.exception.params, {"n": "2"})
            self.assertTrue(completeness.is_complete(folder))
            self.assertEqual([item["id"] for item in store.list_snapshots()], [saved["id"]])

    def test_prune_refuses_when_the_other_snapshot_failed_its_hash(self) -> None:
        """A hash-failed snapshot does not count toward min_copies.

        Returns:
            None. The test fails if the complete snapshot is pruned, or if
            the error does not name the hash check.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            good = store.take("manual", "good")
            bad = store.take("manual", "will fail")
            broken = store._snapshot_dir(bad["id"])
            (broken / "corrupt.bin").write_bytes(b"nope")
            self.assertFalse(completeness.is_complete(broken))
            with self.assertRaises(LibraryError) as ctx:
                store.prune(good["id"], confirm=True)
            self.assertEqual(ctx.exception.code, "copies_hash_failed")
            self.assertTrue(completeness.is_complete(store._snapshot_dir(good["id"])))

    def test_prune_keeps_a_second_complete_snapshot(self) -> None:
        """Prune when live library plus one other complete snapshot remain.

        Returns:
            None. The test fails if the chosen snapshot is still listed.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            first = store.take("manual", "older")
            second = store.take("manual", "newer")
            result = store.prune(first["id"], confirm=True)
            self.assertTrue(result["ok"])
            self.assertFalse(store._snapshot_dir(first["id"]).exists())
            self.assertEqual([item["id"] for item in store.list_snapshots()], [second["id"]])

    def test_prune_without_confirm_does_not_delete(self) -> None:
        """Preview prune names the refusal and leaves the directory.

        Returns:
            None. The test fails if the snapshot is removed without confirm.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            saved = store.take("manual", "only copy")
            result = store.prune(saved["id"])
            self.assertTrue(result["preview"])
            self.assertFalse(result["ok"])
            self.assertEqual(result["code"], "copies_need_more")
            self.assertTrue(completeness.is_complete(store._snapshot_dir(saved["id"])))


class DuplicateDeleteGateTests(_ConfigCase):
    """Refuse trashing a duplicate when other copies cannot be verified."""

    def _duplicate_on_volume(
        self,
        temp: TempLibrary,
        volume_path: str,
    ) -> Path:
        """Point asset 2 at a duplicate path on ``volume_path``.

        Asset 1 stays a real file under the temp music folder. Both rows
        already share title, artist, and whole-second length.

        Args:
            temp: Open fixture library.
            volume_path: Absolute stored path for the other copy.

        Returns:
            The laptop file that a delete will try to trash.
        """
        laptop = temp.root / "music" / "same-a.mp3"
        laptop.parent.mkdir(parents=True)
        laptop.write_bytes(b"audio-a")
        with open_database(temp.db) as conn:
            conn.execute(
                "UPDATE asset SET portable_id = ?, file_name = 'same-a.mp3', is_missing = 0 WHERE id = 1",
                (str(laptop.resolve()),),
            )
            conn.execute(
                "UPDATE asset SET portable_id = ?, file_name = 'same-a.mp3', is_missing = 0 WHERE id = 2",
                (volume_path,),
            )
        return laptop

    def test_delete_refuses_when_the_other_copy_is_unplugged(self) -> None:
        """Name the unplugged drive instead of guessing the copy is gone.

        Returns:
            None. The test fails if the laptop file is trashed.
        """
        unplugged = "/Volumes/crateCraftUnplugged359/same-a.mp3"

        def volume_of(path: str) -> volumes.Volume | None:
            if "crateCraftUnplugged359" in path.replace("\\", "/"):
                return volumes.Volume(
                    "crateCraftUnplugged359",
                    "/Volumes/crateCraftUnplugged359",
                    "posix",
                )
            return volumes.volume_of(path)

        with TempLibrary() as temp:
            laptop = self._duplicate_on_volume(temp, unplugged)
            trash = temp.root / "trash-bin"
            os.environ[files._TRASH_ENV] = str(trash)
            self.addCleanup(lambda: os.environ.pop(files._TRASH_ENV, None))
            with (
                mock.patch("verified_copies.volume_of", volume_of),
                mock.patch.object(
                    volumes.Mounts,
                    "mounted",
                    lambda self, volume: volume.name != "crateCraftUnplugged359",
                ),
            ):
                with self.assertRaises(LibraryError) as ctx:
                    files.execute({"action": "delete", "paths": [str(laptop)], "confirm": True})
            self.assertEqual(ctx.exception.code, "copies_unplugged")
            self.assertEqual(ctx.exception.params, {"drive": "crateCraftUnplugged359"})
            self.assertTrue(laptop.is_file())
            self.assertEqual(laptop.read_bytes(), b"audio-a")

    def test_delete_refuses_when_the_other_copy_is_untrusted(self) -> None:
        """A cheap USB marked untrusted never counts toward min_copies.

        Returns:
            None. The test fails if the laptop file is trashed.
        """
        app_config.set_untrusted_volumes(["CheapUSB"])
        cheap = Path("/Volumes/CheapUSB/same-a.mp3")

        def volume_of(path: str) -> volumes.Volume | None:
            if "CheapUSB" in path:
                return volumes.Volume("CheapUSB", "/Volumes/CheapUSB", "posix")
            return volumes.volume_of(path)

        with TempLibrary() as temp:
            laptop = self._duplicate_on_volume(temp, str(cheap))
            stick = temp.root / "cheap-usb" / "same-a.mp3"
            stick.parent.mkdir(parents=True)
            stick.write_bytes(b"audio-a")
            trash = temp.root / "trash-bin"
            os.environ[files._TRASH_ENV] = str(trash)
            self.addCleanup(lambda: os.environ.pop(files._TRASH_ENV, None))
            with (
                mock.patch("verified_copies.volume_of", volume_of),
                mock.patch(
                    "verified_copies._present",
                    side_effect=lambda path: "CheapUSB" in path or Path(path).is_file(),
                ),
                mock.patch.object(volumes.Mounts, "mounted", return_value=True),
            ):
                with self.assertRaises(LibraryError) as ctx:
                    files.execute({"action": "delete", "paths": [str(laptop)], "confirm": True})
            self.assertEqual(ctx.exception.code, "copies_untrusted")
            self.assertEqual(ctx.exception.params, {"drive": "CheapUSB"})
            self.assertTrue(laptop.is_file())

    def test_delete_counts_a_present_file_when_mounts_say_unplugged(self) -> None:
        """A file that exists is verified even when mount metadata is empty.

        Windows merge-trash tests patch ``sys.platform`` to linux for the
        XDG trash layout. That empties ``os.listdrives``, so a ``C:`` keep
        file would look unplugged if existence did not win.

        Returns:
            None. The test fails if the laptop file is kept.
        """
        with TempLibrary() as temp:
            music = temp.root / "music"
            music.mkdir()
            laptop = music / "same-a.mp3"
            extra_b = music / "copy-b.mp3"
            extra_c = music / "copy-c.mp3"
            laptop.write_bytes(b"audio-a")
            extra_b.write_bytes(b"audio-a")
            extra_c.write_bytes(b"audio-a")
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ?, file_name = 'same-a.mp3' WHERE id = 1",
                    (str(laptop.resolve()),),
                )
                conn.execute(
                    "UPDATE asset SET portable_id = ?, file_name = 'copy-b.mp3' WHERE id = 2",
                    (str(extra_b.resolve()),),
                )
                conn.execute(
                    """
                    INSERT INTO asset
                        (id, name, artist, album, bpm, key, length_ms, color, is_missing,
                         file_name, portable_id, location_id, time_added, dj_play_count)
                    VALUES
                        (3, 'Same', 'Artist', 'Album', 120, '1A', 180000, 16711680, 0,
                         'copy-c.mp3', ?, 1, 12, 0)
                    """,
                    (str(extra_c.resolve()),),
                )
                conn.execute("INSERT INTO space_asset (id, asset_id, space_id) VALUES (3, 3, 1)")
            trash = temp.root / "trash-bin"
            os.environ[files._TRASH_ENV] = str(trash)
            self.addCleanup(lambda: os.environ.pop(files._TRASH_ENV, None))

            def volume_of(_path: str) -> volumes.Volume:
                return volumes.Volume("C", "C:\\", "letter")

            with (
                mock.patch("verified_copies.volume_of", volume_of),
                mock.patch.object(volumes.Mounts, "mounted", return_value=False),
            ):
                result = files.execute(
                    {"action": "delete", "paths": [str(laptop)], "confirm": True}
                )
            self.assertTrue(result["ok"])
            self.assertFalse(laptop.exists())
            self.assertTrue(extra_b.is_file())
            self.assertTrue(extra_c.is_file())

    def test_delete_allows_when_two_other_verified_copies_remain(self) -> None:
        """Trash a duplicate when two other plugged trusted copies stay.

        Returns:
            None. The test fails if the laptop file remains.
        """
        with TempLibrary() as temp:
            music = temp.root / "music"
            music.mkdir()
            laptop = music / "same-a.mp3"
            extra_b = music / "copy-b.mp3"
            extra_c = music / "copy-c.mp3"
            laptop.write_bytes(b"audio-a")
            extra_b.write_bytes(b"audio-a")
            extra_c.write_bytes(b"audio-a")
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ?, file_name = 'same-a.mp3' WHERE id = 1",
                    (str(laptop.resolve()),),
                )
                conn.execute(
                    "UPDATE asset SET portable_id = ?, file_name = 'copy-b.mp3' WHERE id = 2",
                    (str(extra_b.resolve()),),
                )
                conn.execute(
                    """
                    INSERT INTO asset
                        (id, name, artist, album, bpm, key, length_ms, color, is_missing,
                         file_name, portable_id, location_id, time_added, dj_play_count)
                    VALUES
                        (3, 'Same', 'Artist', 'Album', 120, '1A', 180000, 16711680, 0,
                         'copy-c.mp3', ?, 1, 12, 0)
                    """,
                    (str(extra_c.resolve()),),
                )
                conn.execute("INSERT INTO space_asset (id, asset_id, space_id) VALUES (3, 3, 1)")
            trash = temp.root / "trash-bin"
            os.environ[files._TRASH_ENV] = str(trash)
            self.addCleanup(lambda: os.environ.pop(files._TRASH_ENV, None))
            result = files.execute({"action": "delete", "paths": [str(laptop)], "confirm": True})
            self.assertTrue(result["ok"])
            self.assertFalse(laptop.exists())
            self.assertTrue(extra_b.is_file())
            self.assertTrue(extra_c.is_file())


class LibraryCopyCountTests(_ConfigCase):
    """Optional per-library copy count for crates chrome."""

    def test_library_copies_count_live_and_complete_snapshots(self) -> None:
        """Live library plus complete snapshots, skipping a hash failure.

        Returns:
            None. The test fails if a hash-failed snapshot is counted.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            good = store.take("manual", "good")
            bad = store.take("manual", "will fail")
            (store._snapshot_dir(bad["id"]) / "corrupt.bin").write_bytes(b"nope")
            import verified_copies

            report = verified_copies.library_copies(store)
            self.assertEqual(report["verified"], 2)
            self.assertEqual(report["min_copies"], 2)
            names = [item["name"] for item in report["destinations"]]
            self.assertIn("laptop", names)
            self.assertIn("snapshot", names)
            self.assertNotIn(bad["id"], [item.get("id") for item in report["destinations"]])
            self.assertIn(good["id"], [item.get("id") for item in report["destinations"]])
