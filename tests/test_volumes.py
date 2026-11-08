"""Tests for ``volumes``: which drive a stored path lives on, and is it plugged in.

Every case is a path string or a temporary folder. Nothing here opens a
Serato library or writes beside one.
"""

from __future__ import annotations

import os
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock

import volumes
from volumes import Volume


class LocationPathTests(unittest.TestCase):
    """``location_path`` turns a connection URI into a path."""

    def test_windows_file_uri_keeps_the_drive_letter(self) -> None:
        """Drop the slash urlparse leaves before ``Z:``."""
        self.assertEqual(volumes.location_path("file:///Z:/Music/location.sqlite"), "Z:/Music/location.sqlite")

    def test_macos_file_uri_is_decoded(self) -> None:
        """Decode percent escapes in a ``/Volumes`` URI."""
        self.assertEqual(
            volumes.location_path("file:///Volumes/GIG%20DRIVE/Library/location.sqlite"),
            "/Volumes/GIG DRIVE/Library/location.sqlite",
        )

    def test_plain_path_is_returned_as_written(self) -> None:
        """Leave a value that is not a file URI alone."""
        self.assertEqual(volumes.location_path("/Volumes/GIG/x.sqlite"), "/Volumes/GIG/x.sqlite")


class VolumeOfTests(unittest.TestCase):
    """``volume_of`` and ``external_volume`` name the drive of a path."""

    def test_drive_letter_on_any_platform(self) -> None:
        """A ``z:`` path is drive ``Z:`` even when this is macOS."""
        with mock.patch.object(volumes.sys, "platform", "darwin"):
            self.assertEqual(volumes.volume_of("z:\\Music\\a.mp3"), Volume("Z:", "Z:\\", "letter"))
            self.assertEqual(volumes.volume_of("D:/Music/a.mp3"), Volume("D:", "D:\\", "letter"))

    def test_unc_share_is_server_and_share(self) -> None:
        """A UNC path is its ``\\\\server\\share`` root, with either slash style."""
        self.assertEqual(
            volumes.volume_of("\\\\nas\\music\\set\\a.mp3"),
            Volume("\\\\nas\\music", "\\\\nas\\music", "unc"),
        )
        self.assertEqual(volumes.volume_of("//nas/music/set/a.mp3"), Volume("\\\\nas\\music", "\\\\nas\\music", "unc"))

    def test_unc_without_a_share_is_not_a_volume(self) -> None:
        """A bare ``\\\\server`` has no share to test."""
        self.assertIsNone(volumes.volume_of("\\\\nas"))

    def test_posix_mount_points(self) -> None:
        """Name macOS ``/Volumes`` and Linux ``/media``, ``/run/media``, ``/mnt`` mounts."""
        with mock.patch.object(volumes.sys, "platform", "darwin"):
            self.assertEqual(volumes.volume_of("/Volumes/GIG/Music/a.mp3"), Volume("GIG", "/Volumes/GIG", "posix"))
            self.assertEqual(
                volumes.volume_of("/run/media/dj/USB/a.mp3"),
                Volume("USB", "/run/media/dj/USB", "posix"),
            )
            self.assertEqual(volumes.volume_of("/media/dj/USB/a.mp3"), Volume("USB", "/media/dj/USB", "posix"))
            self.assertEqual(volumes.volume_of("/mnt/USB/a.mp3"), Volume("USB", "/mnt/USB", "posix"))

    def test_boot_volume_and_relative_paths_have_no_volume(self) -> None:
        """A home-folder path, a relative id, and an empty value are not on a drive."""
        with mock.patch.object(volumes.sys, "platform", "darwin"):
            self.assertIsNone(volumes.volume_of("/Users/dj/Music/a.mp3"))
            self.assertIsNone(volumes.volume_of("Music/a.mp3"))
            self.assertIsNone(volumes.volume_of(""))
            self.assertIsNone(volumes.volume_of("/Volumes/"))

    def test_posix_paths_are_not_volumes_on_windows(self) -> None:
        """On Windows a forward-slash path is not a mount point."""
        with mock.patch.object(volumes.sys, "platform", "win32"):
            self.assertIsNone(volumes.volume_of("/Volumes/GIG/a.mp3"))

    def test_system_drive_is_not_external_on_windows(self) -> None:
        """``C:`` is the boot drive on Windows; ``E:`` is external."""
        with mock.patch.object(volumes.sys, "platform", "win32"), mock.patch.dict(
            os.environ, {"SystemDrive": "c:"}
        ):
            self.assertIsNone(volumes.external_volume("C:\\Music\\a.mp3"))
            self.assertEqual(volumes.external_volume("E:\\Music\\a.mp3"), Volume("E:", "E:\\", "letter"))

    def test_drive_letter_is_external_off_windows(self) -> None:
        """A ``C:`` path read on macOS is not this computer's boot disk."""
        with mock.patch.object(volumes.sys, "platform", "darwin"):
            self.assertEqual(volumes.external_volume("C:\\Music\\a.mp3"), Volume("C:", "C:\\", "letter"))


class MountsTests(unittest.TestCase):
    """``Mounts`` answers once per drive root per pass."""

    def test_present_and_absent_posix_roots(self) -> None:
        """A folder that exists is mounted; one that does not is not."""
        with tempfile.TemporaryDirectory() as raw:
            mounts = volumes.Mounts()
            self.assertTrue(mounts.mounted(Volume("T", raw, "posix")))
            self.assertFalse(mounts.mounted(Volume("Gone", str(Path(raw) / "gone"), "posix")))

    def test_answer_is_cached_per_root(self) -> None:
        """A second question about the same root does not touch the disk."""
        mounts = volumes.Mounts()
        with mock.patch.object(volumes, "directory_exists", return_value=True) as probe:
            self.assertTrue(mounts.mounted(Volume("A", "/Volumes/A", "posix")))
            self.assertTrue(mounts.mounted(Volume("A", "/Volumes/A", "posix")))
            self.assertTrue(mounts.mounted(Volume("B", "/Volumes/B", "posix")))
        self.assertEqual(probe.call_count, 2)

    def test_drive_letters_come_from_listdrives_on_windows(self) -> None:
        """A letter is mounted when ``os.listdrives`` names it, in any case."""
        with mock.patch.object(volumes.sys, "platform", "win32"), mock.patch.object(
            volumes.os, "listdrives", create=True, return_value=["c:\\", "E:\\"]
        ):
            mounts = volumes.Mounts()
            self.assertTrue(mounts.mounted(Volume("E:", "E:\\", "letter")))
            self.assertTrue(mounts.mounted(Volume("C:", "C:\\", "letter")))
            self.assertFalse(mounts.mounted(Volume("Z:", "Z:\\", "letter")))

    def test_drive_letters_are_absent_off_windows(self) -> None:
        """Off Windows no drive letter is mounted, so a ``Z:`` track is unavailable."""
        with mock.patch.object(volumes.sys, "platform", "darwin"):
            self.assertFalse(volumes.Mounts().mounted(Volume("Z:", "Z:\\", "letter")))

    def test_unc_share_uses_the_timeout(self) -> None:
        """A UNC root is probed with a timeout; a POSIX root is not."""
        mounts = volumes.Mounts()
        with mock.patch.object(volumes, "directory_exists", return_value=False) as probe:
            mounts.mounted(Volume("\\\\nas\\music", "\\\\nas\\music", "unc"))
            mounts.mounted(Volume("GIG", "/Volumes/GIG", "posix"))
        self.assertEqual(probe.call_args_list[0].kwargs["timeout"], 1.5)
        self.assertIsNone(probe.call_args_list[1].kwargs["timeout"])


class DirectoryExistsTests(unittest.TestCase):
    """``directory_exists`` never hangs on a share that does not answer."""

    def test_a_probe_that_does_not_answer_counts_as_absent(self) -> None:
        """Return False after the timeout while the probe is still blocked."""
        release = threading.Event()

        def hang(_self: Path) -> bool:
            release.wait(5)
            return True

        try:
            with mock.patch.object(volumes.Path, "is_dir", hang):
                self.assertFalse(volumes.directory_exists("\\\\nas\\music", timeout=0.05))
        finally:
            release.set()

    def test_an_error_counts_as_absent(self) -> None:
        """A permission or I/O error is not a mounted drive."""
        with mock.patch.object(volumes.Path, "is_dir", side_effect=OSError("denied")):
            self.assertFalse(volumes.directory_exists("/Volumes/GIG", timeout=None))
            self.assertFalse(volumes.directory_exists("\\\\nas\\music", timeout=1.0))


class AbsentVolumeTests(unittest.TestCase):
    """``absent_volume`` is the gig-check split between unplugged and missing."""

    def test_unplugged_posix_volume_is_absent(self) -> None:
        """A ``/Volumes`` path whose root is not a directory is unplugged."""
        with mock.patch.object(volumes.sys, "platform", "darwin"):
            gone = volumes.absent_volume("/Volumes/OFFLINE208/Music/a.mp3")
        self.assertIsNotNone(gone)
        assert gone is not None
        self.assertEqual(gone.name, "OFFLINE208")

    def test_windows_letter_follows_pathlib_on_this_os(self) -> None:
        """A ``Z:`` id is a volume only when this platform treats it as absolute.

        Relink uses the same ``Path.is_absolute`` gate, so a PC library on
        macOS is missing, not unplugged.
        """
        stored = r"Z:\Music\a.mp3"
        if Path(stored).is_absolute():
            with mock.patch.object(volumes.sys, "platform", "win32"), mock.patch.object(
                volumes.os, "listdrives", create=True, return_value=["C:\\"]
            ):
                gone = volumes.absent_volume(stored)
            self.assertIsNotNone(gone)
            assert gone is not None
            self.assertEqual(gone.name, "Z:")
        else:
            self.assertIsNone(volumes.absent_volume(stored))

    def test_relative_path_is_not_a_drive(self) -> None:
        """A relative stored id does not name a volume on this platform."""
        self.assertIsNone(volumes.absent_volume("Music/a.mp3"))

    def test_location_uri_names_the_drive_when_the_id_is_relative(self) -> None:
        """A relative id on an unplugged location is absent under that drive."""
        with mock.patch.object(volumes.sys, "platform", "darwin"):
            gone = volumes.absent_volume(
                "Music/a.mp3",
                "file:///Volumes/OFFLINE208/Library/location.sqlite",
            )
        self.assertIsNotNone(gone)
        assert gone is not None
        self.assertEqual(gone.name, "OFFLINE208")

    def test_mounted_posix_volume_is_not_absent(self) -> None:
        """A path on a directory that exists is not unplugged."""
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            mounts = volumes.Mounts()
            with mock.patch.object(volumes, "posix_volume", return_value=volumes.Volume("TEMP", str(root), "posix")):
                self.assertIsNone(volumes.absent_volume(str(root / "a.mp3"), mounts=mounts))


class FileTests(unittest.TestCase):
    """``opens_for_read`` and ``path_candidates``."""

    def test_opens_for_read(self) -> None:
        """A readable file opens; a missing file and a folder do not."""
        with tempfile.TemporaryDirectory() as raw:
            song = Path(raw) / "a.mp3"
            song.write_bytes(b"x")
            self.assertTrue(volumes.opens_for_read(song))
            self.assertFalse(volumes.opens_for_read(Path(raw) / "gone.mp3"))
            self.assertFalse(volumes.opens_for_read(Path(raw)))
            self.assertEqual(song.read_bytes(), b"x")

    def test_path_candidates(self) -> None:
        """Absolute as stored; relative on a drive under that drive; else home then root."""
        absolute = str(Path(os.sep) / "Music" / "a.mp3")
        self.assertEqual(volumes.path_candidates(absolute, "/Volumes/GIG"), (Path(absolute),))
        self.assertEqual(
            volumes.path_candidates("Music/a.mp3", "/Volumes/GIG"),
            (Path("/Volumes/GIG") / "Music/a.mp3",),
        )
        self.assertEqual(
            volumes.path_candidates("Music/a.mp3", None),
            (Path.home() / "Music/a.mp3", Path(os.sep) / "Music/a.mp3"),
        )
        self.assertEqual(volumes.path_candidates("", None), ())


if __name__ == "__main__":
    unittest.main()
