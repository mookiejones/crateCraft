"""Read-from-stick backup (#481)."""

from __future__ import annotations

import json
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

import error_codes
import folder_sync
import stick_backup
from library import LibraryError


def _stick(root: Path) -> Path:
    """Create a synthetic Serato stick with music and ``_Serato_``."""
    serato = root / "_Serato_"
    serato.mkdir(parents=True)
    (serato / "database V2").write_bytes(b"db")
    crates = serato / "Subcrates"
    crates.mkdir()
    (crates / "Gig.crate").write_bytes(b"crate")
    music = root / "Music"
    music.mkdir()
    track = music / "track.mp3"
    track.write_bytes(b"ID3audio")
    # database older than the track → stale warning
    older = time.time() - 60
    os.utime(serato / "database V2", (older, older))
    newer = time.time()
    os.utime(track, (newer, newer))
    return root


class StickBackupTests(unittest.TestCase):
    """Copy, verify, and refuse unsafe destinations."""

    def setUp(self) -> None:
        self._config = tempfile.TemporaryDirectory()
        self.addCleanup(self._config.cleanup)
        self._config_patch = mock.patch(
            "app_config.config_dir", return_value=Path(self._config.name)
        )
        self._config_patch.start()
        self.addCleanup(self._config_patch.stop)

    def _separate_disks(self) -> mock.MagicMock:
        """Treat source and dest as different disks inside one temp tree."""

        def _dev(path: Path) -> int:
            text = str(path)
            return 1 if "stick" in text else 2

        return mock.patch("stick_backup._device_id", side_effect=_dev)

    def test_preview_lists_music_and_serato(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            dest = Path(raw) / "backup"
            dest.mkdir()
            with self._separate_disks():
                report = stick_backup.preview(str(stick), str(dest))
            self.assertTrue(report["preview"])
            self.assertGreaterEqual(int(report["copy_count"]), 2)
            self.assertEqual(report["warning"], stick_backup.STALE_DB)
            rels = {row["rel"] for row in report["copy"] if isinstance(row, dict)}
            self.assertIn("Music/track.mp3", rels)
            self.assertTrue(any(str(rel).startswith("_Serato_/") for rel in rels))

    def test_copy_verifies_and_remembers(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            dest = Path(raw) / "backup"
            with self._separate_disks():
                report = stick_backup.copy_files(str(stick), str(dest))
            self.assertTrue(report["written"])
            self.assertTrue(report["verified"])
            self.assertEqual(report["warning"], stick_backup.STALE_DB)
            self.assertGreater(int(report["copied"]), 0)
            self.assertEqual(int(report["mismatch_count"]), 0)
            self.assertTrue((dest / "Music" / "track.mp3").is_file())
            self.assertTrue((dest / "_Serato_" / "database V2").is_file())
            remembered = stick_backup.last_backup(stick)
            self.assertIsNotNone(remembered)
            assert remembered is not None
            self.assertEqual(remembered["dest"], str(dest.resolve()))
            self.assertTrue(remembered["verified"])
            with self._separate_disks():
                second = stick_backup.preview(str(stick), str(dest))
            self.assertEqual(int(second["copy_count"]), 0)
            self.assertGreater(int(second["skip_count"]), 0)

    def test_mismatch_does_not_remember(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            dest = Path(raw) / "backup"
            dest.mkdir()

            def _bad_copy(source: Path, dest_path: Path, *, fat: bool = False) -> str:
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                dest_path.write_bytes(b"wrong")
                return "mismatch"

            with self._separate_disks(), mock.patch(
                "stick_backup._copy_one", side_effect=_bad_copy
            ):
                report = stick_backup.copy_files(str(stick), str(dest))
            self.assertFalse(report["verified"])
            self.assertIsNone(stick_backup.last_backup(stick))

    def test_refuses_source_dest_and_serato(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            nested = stick / "nested"
            nested.mkdir()
            with self.assertRaisesRegex(LibraryError, stick_backup.DEST_SOURCE):
                stick_backup.preview(str(stick), str(nested))
            serato_dest = Path(raw) / "_Serato_" / "out"
            serato_dest.mkdir(parents=True)
            with self.assertRaisesRegex(LibraryError, stick_backup.DEST_SERATO):
                stick_backup.preview(str(stick), str(serato_dest))
            with self.assertRaisesRegex(LibraryError, stick_backup.SOURCE_NO_SERATO):
                empty = Path(raw) / "empty"
                empty.mkdir()
                dest = Path(raw) / "backup"
                dest.mkdir()
                stick_backup.preview(str(empty), str(dest))
            with self.assertRaisesRegex(LibraryError, folder_sync.CHOOSE_FOLDER):
                stick_backup.preview(str(stick), "")
            dest = Path(raw) / "backup"
            dest.mkdir(exist_ok=True)
            with self.assertRaisesRegex(LibraryError, folder_sync.FOLDER_UNREADABLE):
                stick_backup.preview(str(stick) + "\x00evil", str(dest))
            with self.assertRaisesRegex(LibraryError, folder_sync.FOLDER_UNREADABLE):
                stick_backup.preview(str(stick), str(dest) + "\x00evil")

    def test_dest_for_refuses_dotdot(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            dest = Path(raw) / "backup"
            dest.mkdir()
            self.assertIsNone(stick_backup._dest_for(dest, "../outside.mp3"))
            self.assertIsNone(stick_backup._dest_for(dest, "ok/../../etc/passwd"))
            inside = stick_backup._dest_for(dest, "Music/track.mp3")
            self.assertIsNotNone(inside)
            assert inside is not None
            self.assertTrue(str(inside).startswith(str(dest) + os.sep))

    def test_same_disk_refused(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            dest = Path(raw) / "backup"
            dest.mkdir()
            with mock.patch(
                "stick_backup._device_id",
                side_effect=lambda path: 42,
            ):
                with self.assertRaisesRegex(LibraryError, stick_backup.DEST_SAME_DISK):
                    stick_backup.preview(str(stick), str(dest))

    def test_fat_mtime_tolerance_skips(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            source = Path(raw) / "a.mp3"
            dest = Path(raw) / "b.mp3"
            same = b"same-bytes!!"
            source.write_bytes(same)
            dest.write_bytes(same)
            now = time.time()
            os.utime(source, (now, now))
            os.utime(dest, (now + 1.5, now + 1.5))
            self.assertTrue(
                stick_backup.files_match(source, dest, fat=True, source_hash=None)
            )
            self.assertTrue(
                stick_backup.files_match(source, dest, fat=False, source_hash=None)
            )
            dest.write_bytes(b"same-size-b")
            os.utime(dest, (now + 1.5, now + 1.5))
            self.assertFalse(
                stick_backup.files_match(source, dest, fat=True, source_hash=None)
            )
            self.assertFalse(
                stick_backup.files_match(source, dest, fat=False, source_hash=None)
            )

    def test_fat_drifted_mtime_same_hash_is_copied_again(self) -> None:
        """A matching hash with a FAT stamp outside 2 seconds is recopied."""
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            dest = Path(raw) / "backup"
            with self._separate_disks():
                first = stick_backup.copy_files(str(stick), str(dest))
            self.assertTrue(first["verified"])
            for path in dest.rglob("*"):
                if path.is_file():
                    stamp = path.stat().st_mtime + 5
                    os.utime(path, (stamp, stamp))
            with self._separate_disks(), mock.patch(
                "stick_backup.fat_family", return_value=True
            ):
                again = stick_backup.copy_files(str(stick), str(dest))
            self.assertGreater(int(again["copied"]), 0)
            self.assertTrue(again["verified"])
            self.assertEqual(again["warning"], stick_backup.STALE_DB)
            self.assertEqual(int(again["mismatch_count"]), 0)

    def test_status_returns_last_backup(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            dest = Path(raw) / "backup"
            dest.mkdir()
            with self._separate_disks():
                copied = stick_backup.copy_files(str(stick), str(dest))
            self.assertTrue(copied["verified"])
            body = stick_backup.status(str(stick))
            self.assertIsNotNone(body.get("last_backup"))
            last = body["last_backup"]
            assert isinstance(last, dict)
            self.assertEqual(Path(str(last.get("dest") or "")).name, "backup")
            self.assertEqual(body["warning"], stick_backup.STALE_DB)

    def test_nfc_rel_key(self) -> None:
        nfd = "Music/cafe\u0301.mp3"
        nfc = "Music/caf\u00e9.mp3"
        self.assertEqual(stick_backup.rel_key(nfd), stick_backup.rel_key(nfc))

    def test_error_codes_and_english(self) -> None:
        self.assertEqual(
            error_codes.ERROR_CODES.get(stick_backup.DEST_SAME_DISK),
            "stick_backup_same_disk",
        )
        english = json.loads(
            (Path(__file__).resolve().parents[1] / "locales" / "en.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(
            english["error.stick_backup_same_disk"], stick_backup.DEST_SAME_DISK
        )

    def test_action_preview_without_confirm(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            stick = _stick(Path(raw) / "stick")
            dest = Path(raw) / "backup"
            dest.mkdir()
            with self._separate_disks():
                report = stick_backup.action(
                    {
                        "action": "copy",
                        "source": str(stick),
                        "dest": str(dest),
                        "confirm": False,
                    }
                )
            self.assertTrue(report["preview"])
            self.assertFalse((dest / "Music" / "track.mp3").exists())


class StickBackupApiTests(unittest.TestCase):
    """HTTP contract for stick backup."""

    from tests.test_server import ApiTests as _ServerApiTests

    setUp = _ServerApiTests.setUp
    tearDown = _ServerApiTests.tearDown
    request = _ServerApiTests.request

    def test_get_and_post(self) -> None:
        import urllib.parse

        stick = _stick(self.library.root / "stick")
        with tempfile.TemporaryDirectory() as raw:
            dest = Path(raw) / "backup"
            dest.mkdir()
            source_q = urllib.parse.quote(str(stick), safe="")
            dest_q = urllib.parse.quote(str(dest), safe="")

            def _dev(path: Path) -> int:
                return 1 if "stick" in str(path) else 2

            with mock.patch("stick_backup._device_id", side_effect=_dev):
                status, body = self.request(
                    f"/api/stick-backup?source={source_q}&dest={dest_q}"
                )
                self.assertEqual(status, 200)
                assert isinstance(body, dict)
                self.assertTrue(body["preview"])
                status, body = self.request(
                    "/api/stick-backup",
                    {
                        "action": "copy",
                        "source": str(stick),
                        "dest": str(dest),
                        "confirm": True,
                    },
                )
            self.assertEqual(status, 200)
            assert isinstance(body, dict)
            self.assertTrue(body["verified"])


if __name__ == "__main__":
    unittest.main()
