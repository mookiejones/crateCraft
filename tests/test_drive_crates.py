"""External-drive crate files land in that drive's _Serato_ folder.

Overwrite of a same-named crate is off unless the caller turns it on.
A missing drive is not connected. A drive with no _Serato_ folder is
skipped and the folder is not created.
"""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import library
import snapshots
import volumes
from drive_crates import sync_volume
from tests.fixture import TempLibrary


def _volume(root: Path, name: str = "GIG") -> volumes.Volume:
    return volumes.Volume(name, str(root), "posix")


class DriveCrateTests(unittest.TestCase):
    """A track on an external drive is written only into that drive."""

    def test_track_is_written_into_the_drive_serato_folder(self) -> None:
        """A crate file under Subcrates lists the path relative to the drive.

        Returns:
            None. The test fails if the crate is missing or the path is absolute.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            serato = root / "_Serato_"
            serato.mkdir()
            (serato / "database V2").write_bytes(b"")
            track = root / "Music" / "a.mp3"
            track.parent.mkdir()
            track.write_bytes(b"mp3")
            result = sync_volume(_volume(root), [str(track)], "House", add=True, overwrite=False)
            crate = root / "_Serato_" / "Subcrates" / "House.crate"
            self.assertEqual(result.status, "written")
            self.assertTrue(crate.is_file())
            self.assertEqual(snapshots.parse_serato_bytes(crate.read_bytes()), ["Music/a.mp3"])
            rows = snapshots.parse_database_v2((serato / "database V2").read_bytes())
            self.assertEqual([row.get("path") for row in rows], ["Music/a.mp3"])
            backslash = str(root).replace("/", "\\") + "\\Music\\b.mp3"
            again = sync_volume(_volume(root), [backslash], "House", add=True, overwrite=True)
            self.assertEqual(again.status, "written")
            self.assertIn("Music/b.mp3", snapshots.parse_serato_bytes(crate.read_bytes()))

    def test_unplugged_drive_is_not_connected_and_writes_nothing(self) -> None:
        """A volume root that is not there is not connected.

        Returns:
            None. The test fails if a _Serato_ folder is created for the missing root.
        """
        missing = Path(tempfile.mkdtemp())
        os.rmdir(missing)
        result = sync_volume(_volume(missing), [str(missing / "Music" / "a.mp3")], "House", add=True, overwrite=False)
        self.assertEqual(result.status, "not_connected")
        self.assertFalse(missing.exists())

    def test_drive_without_a_serato_library_is_skipped(self) -> None:
        """A mounted drive with no _Serato_ folder is left untouched.

        Returns:
            None. The test fails if _Serato_ is created.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            track = str(root / "Music" / "a.mp3")
            result = sync_volume(_volume(root), [track], "House", add=True, overwrite=False)
            self.assertEqual(result.status, "no_library")
            self.assertFalse((root / "_Serato_").exists())

    def test_same_name_is_left_untouched_unless_overwrite_is_on(self) -> None:
        """Overwrite defaults off, so an existing crate file keeps its bytes.

        Returns:
            None. The test fails if the original bytes change, or if overwrite
            does not add the new path beside the old one.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            serato = root / "_Serato_" / "Subcrates"
            serato.mkdir(parents=True)
            crate = serato / "House.crate"
            original = snapshots.parse_serato_bytes  # keep the reader
            crate.write_bytes(b"vrsn\x00\x00\x00\x02ok")
            before = crate.read_bytes()
            kept = sync_volume(
                _volume(root),
                [str(root / "Music" / "new.mp3")],
                "House",
                add=True,
                overwrite=False,
            )
            self.assertEqual(kept.status, "kept")
            self.assertEqual(crate.read_bytes(), before)
            track = root / "Music" / "new.mp3"
            track.parent.mkdir()
            track.write_bytes(b"mp3")
            written = sync_volume(_volume(root), [str(track)], "House", add=True, overwrite=True)
            self.assertEqual(written.status, "written")
            paths = original(crate.read_bytes())
            self.assertIn("Music/new.mp3", paths)

    def test_windows_drive_letter_uses_a_relative_path(self) -> None:
        """E:\\Music\\a.mp3 is stored as Music/a.mp3 on that volume.

        Returns:
            None. The test fails if the crate keeps the drive letter.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "_Serato_").mkdir()
            volume = volumes.Volume("E:", str(root), "letter")
            result = sync_volume(volume, [r"E:\Music\a.mp3"], "House", add=True, overwrite=False)
            crate = root / "_Serato_" / "Subcrates" / "House.crate"
            self.assertEqual(result.status, "written")
            self.assertEqual(snapshots.parse_serato_bytes(crate.read_bytes()), ["Music/a.mp3"])

    def test_symlink_serato_folder_is_not_written(self) -> None:
        """A shortcut _Serato_ folder is not followed.

        Returns:
            None. The test fails if a crate appears in the link target.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "elsewhere"
            target.mkdir()
            (root / "_Serato_").symlink_to(target, target_is_directory=True)
            result = sync_volume(_volume(root), [str(root / "Music" / "a.mp3")], "House", add=True, overwrite=False)
            self.assertEqual(result.status, "no_library")
            self.assertFalse((target / "Subcrates").exists())


class DriveCrateActionTests(unittest.TestCase):
    """A crate edit asks the drive writer, and overwrite stays off."""

    def setUp(self) -> None:
        """Point settings at a throwaway directory."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory."""
        self._env.stop()
        self._config.cleanup()

    def test_create_calls_the_drive_writer_with_overwrite_off(self) -> None:
        """Creating a crate of a library track does not opt in to overwrite.

        Returns:
            None. The test fails if overwrite is true or the track path is dropped.
        """
        with TempLibrary() as temp:
            del temp
            with mock.patch("drive_crates.sync_tracks", return_value=[]) as sync:
                library.crate_action({"action": "create", "name": "House", "assets": [1]})
        sync.assert_called_once()
        paths, name = sync.call_args.args[:2]
        self.assertEqual(paths, ["Music/same-a.mp3"])
        self.assertEqual(name, "House")
        self.assertFalse(sync.call_args.kwargs["overwrite"])
        self.assertTrue(sync.call_args.kwargs["add"])

    def test_overwrite_true_is_the_only_opt_in(self) -> None:
        """The string \"false\" and a missing flag both stay off.

        Returns:
            None. The test fails if only the boolean true does not opt in.
        """
        with TempLibrary():
            with mock.patch("drive_crates.sync_tracks", return_value=[]) as sync:
                created = library.crate_action({"action": "create", "name": "House", "assets": [1]})
                library.crate_action(
                    {"action": "add", "id": created["id"], "asset": 2, "overwrite": "false"}
                )
                library.crate_action(
                    {"action": "add", "id": created["id"], "asset": 2, "overwrite": True}
                )
        self.assertFalse(sync.call_args_list[0].kwargs["overwrite"])
        self.assertFalse(sync.call_args_list[1].kwargs["overwrite"])
        self.assertTrue(sync.call_args_list[2].kwargs["overwrite"])
