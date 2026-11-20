"""Stick snapshots and a different-library refusal.

Synthetic directories only. Nothing is written in a real Serato folder.
An unmounted volume is not connected. It is not a missing file.
"""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import stick_export
import volumes
from drive_crates import sync_volume


def _volume(root: Path, name: str = "GIG") -> volumes.Volume:
    return volumes.Volume(name, str(root), "posix")


class StickExportTests(unittest.TestCase):
    """A stick with crate files is snapshotted before those bytes change."""

    def setUp(self) -> None:
        """Keep stick memory in a throwaway directory, not on the stick."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory."""
        self._env.stop()
        self._config.cleanup()

    def test_different_library_is_refused_until_confirm_and_a_snapshot(self) -> None:
        """Existing crates with no memory are refused. Confirm snapshots first.

        Returns:
            None. The test fails if the crate bytes change before confirm,
            or if confirm writes without a copy of the old bytes.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            crate = root / "_Serato_" / "Subcrates" / "House.crate"
            crate.parent.mkdir(parents=True)
            crate.write_bytes(b"foreign-crate")
            before = crate.read_bytes()
            volume = _volume(root)
            refused = sync_volume(
                volume,
                [str(root / "Music" / "a.mp3")],
                "House",
                add=True,
                overwrite=True,
                confirm=False,
            )
            self.assertEqual(refused.status, "refused")
            self.assertNotEqual(refused.status, "missing")
            self.assertIn("another library", refused.detail)
            self.assertEqual(crate.read_bytes(), before)
            self.assertFalse((Path(self._config.name) / "stick-snapshots").exists())
            quiet = sync_volume(
                volume,
                [str(root / "Music" / "a.mp3")],
                "House",
                add=True,
                overwrite=False,
                confirm=False,
            )
            self.assertEqual(quiet.status, "refused")
            self.assertEqual(crate.read_bytes(), before)
            written = sync_volume(
                volume,
                [str(root / "Music" / "a.mp3")],
                "House",
                add=True,
                overwrite=True,
                confirm=True,
            )
            self.assertEqual(written.status, "written")
            self.assertNotEqual(crate.read_bytes(), before)
            copies = list((Path(self._config.name) / "stick-snapshots").rglob("House.crate"))
            self.assertEqual([item.read_bytes() for item in copies], [before])
            memory = stick_export.exports_path()
            self.assertEqual(memory.parent, Path(self._config.name))
            self.assertNotIn("_Serato_", memory.parts)
            self.assertTrue(memory.is_file())

    def test_unmounted_volume_is_not_connected(self) -> None:
        """A missing root is not_connected for preview and for the write.

        Returns:
            None. The test fails if the status is missing, or if a folder
            is created for the absent root.
        """
        missing = Path(tempfile.mkdtemp())
        os.rmdir(missing)
        volume = _volume(missing, "GONE")
        plan = stick_export.plan_drive(
            volume, [str(missing / "Music" / "a.mp3")], "House", overwrite=True, confirm=False
        )
        verified = stick_export.verify_drive(
            volume, [str(missing / "Music" / "a.mp3")], "House", overwrite=True, confirm=False
        )
        self.assertEqual(plan["status"], "not_connected")
        self.assertNotEqual(plan["status"], "missing")
        self.assertEqual(verified, plan)
        result = sync_volume(
            volume,
            [str(missing / "Music" / "a.mp3")],
            "House",
            add=True,
            overwrite=True,
            confirm=True,
        )
        self.assertEqual(result.status, "not_connected")
        self.assertNotIn("missing", result.detail.lower())
        self.assertFalse(missing.exists())

    def test_snapshot_runs_before_the_crate_bytes_change(self) -> None:
        """The copy matches the stick at the moment of the snapshot.

        Returns:
            None. The test fails if the live crate has already changed when
            the snapshot is taken, or if a snapshot error still writes.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            crate = root / "_Serato_" / "Subcrates" / "House.crate"
            crate.parent.mkdir(parents=True)
            crate.write_bytes(b"ours-before")
            before = crate.read_bytes()
            volume = _volume(root)
            stick_export.remember_library(volume)
            seen: dict[str, bytes] = {}
            real = stick_export.snapshot_volume

            def wrapped(item: volumes.Volume) -> Path:
                seen["live"] = crate.read_bytes()
                return real(item)

            track = root / "Music" / "new.mp3"
            track.parent.mkdir()
            track.write_bytes(b"mp3")
            with mock.patch("stick_export.snapshot_volume", side_effect=wrapped):
                written = sync_volume(
                    volume, [str(track)], "House", add=True, overwrite=True, confirm=False
                )
            self.assertEqual(written.status, "written")
            self.assertEqual(seen["live"], before)
            self.assertNotEqual(crate.read_bytes(), before)
            copies = list((Path(self._config.name) / "stick-snapshots").rglob("House.crate"))
            self.assertEqual([item.read_bytes() for item in copies], [before])
            crate.write_bytes(before)
            with mock.patch("stick_export.snapshot_volume", side_effect=OSError("full")):
                failed = sync_volume(
                    volume, [str(track)], "House", add=True, overwrite=True, confirm=False
                )
            self.assertEqual(failed.status, "failed")
            self.assertEqual(crate.read_bytes(), before)
            self.assertIn("not changed", failed.detail)

    def test_skip_reason_is_what_preview_and_the_write_obey(self) -> None:
        """A patched skip code refuses a drive that would otherwise be written.

        Returns:
            None. The test fails if the crate file appears, or if verify
            does not call the same function as preview.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            serato = root / "_Serato_"
            serato.mkdir()
            (serato / "database V2").write_bytes(b"")
            volume = _volume(root)
            crate = serato / "Subcrates" / "House.crate"
            with mock.patch("stick_export.skip_reason", return_value="different_library"):
                refused = sync_volume(
                    volume,
                    [str(root / "Music" / "a.mp3")],
                    "House",
                    add=True,
                    overwrite=True,
                    confirm=True,
                )
            self.assertEqual(refused.status, "refused")
            self.assertFalse(crate.exists())
            calls = {"n": 0}
            real = stick_export.skip_reason

            def wrapped(facts: stick_export.SkipFacts) -> str | None:
                calls["n"] += 1
                return real(facts)

            with mock.patch("stick_export.skip_reason", side_effect=wrapped):
                plan = stick_export.plan_drive(
                    volume, [str(root / "a.mp3")], "House", overwrite=False, confirm=False
                )
                verified = stick_export.verify_drive(
                    volume, [str(root / "a.mp3")], "House", overwrite=False, confirm=False
                )
            self.assertEqual(plan, verified)
            self.assertGreaterEqual(calls["n"], 2)
            self.assertNotEqual(plan["status"], "missing")


if __name__ == "__main__":
    unittest.main()
