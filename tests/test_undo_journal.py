"""Round trip for the files.py undo journal (issue #45).

A failed ``files.execute`` and ``files.recover_interrupted`` both reverse a
change with ``_undo_journal``. These tests build the state a failed change
leaves on disk, run the undo, and check that every file is back byte for
byte with its Serato Markers2 cues still readable. Every file is synthetic
and lives in a temporary library. No real Serato library is opened.
"""

from __future__ import annotations

import errno
import os
import unittest
from pathlib import Path
from unittest import mock

import files
import library
from tags import read_serato_tags
from tests.fixture import TempLibrary
from tests.test_tags import _id3_file, _markers_payload


def _track(path: Path) -> bytes:
    """Write a tiny MP3 fixture with a Serato cue and return its bytes.

    Args:
        path: Where to write it. Parent folders are created.

    Returns:
        The file bytes.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    _id3_file(_markers_payload(), path)
    return path.read_bytes()


class UndoJournalRoundTripTests(unittest.TestCase):
    """``_undo_journal`` puts moved, copied, trashed, and replaced files back."""

    def assert_track(self, path: Path, data: bytes) -> None:
        """Require the original bytes and a readable Serato cue.

        Args:
            path: File that should be back.
            data: Its bytes before the change.
        """
        self.assertTrue(path.is_file(), path.name)
        self.assertEqual(path.read_bytes(), data, path.name)
        self.assertTrue(read_serato_tags(str(path))["cues"], f"{path.name} lost its cues")

    def test_move_trash_and_cue_copy_are_all_reversed(self) -> None:
        """The repro from #45: a rename, a safety trash, and a cue copy."""
        with TempLibrary() as lib:
            root = lib.root
            moved_src, moved_dst = root / "a.mp3", root / "sub" / "a.mp3"
            trashed_src, trashed_dst = root / "b.mp3", root / ".safety" / "b.mp3"
            cue_file, cue_backup = root / "c.mp3", root / "c.mp3.bak"
            original = {path: _track(path) for path in (moved_src, trashed_src, cue_file)}

            moved_dst.parent.mkdir()
            moved_src.rename(moved_dst)
            trashed_dst.parent.mkdir()
            trashed_src.rename(trashed_dst)
            cue_backup.write_bytes(cue_file.read_bytes())
            cue_file.write_bytes(b"clobbered")

            journal: dict[str, object] = {
                "moves": [{"kind": "rename", "src": str(moved_src), "dst": str(moved_dst)}],
                "trash": [{"mode": "safety", "src": str(trashed_src), "dst": str(trashed_dst)}],
                "cue_backup": {"file": str(cue_file), "backup": str(cue_backup)},
            }
            files._undo_journal(journal)

            for path, data in original.items():
                self.assert_track(path, data)
            self.assertFalse(moved_dst.exists())
            self.assertFalse(trashed_dst.exists())
            self.assertFalse(cue_backup.exists())
            self.assertIsNone(journal["cue_backup"])

    def test_moves_are_undone_newest_first(self) -> None:
        """A file moved twice comes back to where it started."""
        with TempLibrary() as lib:
            first, middle, last = lib.root / "a.mp3", lib.root / "x" / "a.mp3", lib.root / "y" / "a.mp3"
            data = _track(first)
            middle.parent.mkdir()
            first.rename(middle)
            last.parent.mkdir()
            middle.rename(last)
            files._undo_journal(
                {
                    "moves": [
                        {"kind": "rename", "src": str(first), "dst": str(middle)},
                        {"kind": "rename", "src": str(middle), "dst": str(last)},
                    ]
                }
            )
            self.assert_track(first, data)
            self.assertFalse(middle.exists())
            self.assertFalse(last.exists())

    def test_copy_removes_the_new_copy_and_keeps_the_original(self) -> None:
        """A ``copy`` whose source is still there only drops the copy."""
        with TempLibrary() as lib:
            src, dst = lib.root / "a.mp3", lib.root / "copy" / "a.mp3"
            data = _track(src)
            dst.parent.mkdir()
            dst.write_bytes(data)
            files._undo_journal({"moves": [{"kind": "copy", "src": str(src), "dst": str(dst)}]})
            self.assert_track(src, data)
            self.assertFalse(dst.exists())

    def test_copy_whose_source_is_gone_is_moved_back(self) -> None:
        """A ``copy`` that already removed its source moves the copy back."""
        with TempLibrary() as lib:
            src, dst = lib.root / "a.mp3", lib.root / "copy" / "a.mp3"
            data = _track(dst)
            files._undo_journal({"moves": [{"kind": "copy", "src": str(src), "dst": str(dst)}]})
            self.assert_track(src, data)
            self.assertFalse(dst.exists())

    def test_drop_tree_removes_the_new_folder(self) -> None:
        """A ``drop-tree`` target that the change created is removed."""
        with TempLibrary() as lib:
            tree = lib.root / "new-folder"
            (tree / "inner").mkdir(parents=True)
            (tree / "inner" / "a.mp3").write_bytes(b"x")
            files._undo_journal({"moves": [{"kind": "drop-tree", "src": "", "dst": str(tree)}]})
            self.assertFalse(tree.exists())

    def test_os_trash_comes_back_and_its_trashinfo_is_removed(self) -> None:
        """A file in the OS trash returns and its ``.trashinfo`` record goes."""
        with TempLibrary() as lib:
            src = lib.root / "a.mp3"
            trash = lib.root / "Trash" / "files" / "a.mp3"
            info = lib.root / "Trash" / "info" / "a.mp3.trashinfo"
            data = _track(trash)
            info.parent.mkdir(parents=True)
            info.write_text("[Trash Info]\n", encoding="utf-8")
            files._undo_journal(
                {"trash": [{"mode": "os", "src": str(src), "dst": str(trash), "info": str(info)}]}
            )
            self.assert_track(src, data)
            self.assertFalse(trash.exists())
            self.assertFalse(info.exists())

    def test_safety_trash_drops_a_leftover_when_the_original_is_back(self) -> None:
        """When the original is already back, the safety copy is removed, not moved over it."""
        with TempLibrary() as lib:
            src, dst = lib.root / "a.mp3", lib.root / ".safety" / "a.mp3"
            data = _track(src)
            dst.parent.mkdir()
            dst.write_bytes(b"older copy")
            files._undo_journal({"trash": [{"mode": "safety", "src": str(src), "dst": str(dst)}]})
            self.assert_track(src, data)
            self.assertFalse(dst.exists())

    def test_cue_backup_that_is_missing_leaves_the_file_alone(self) -> None:
        """No backup on disk: the file is not touched, and the record is cleared."""
        with TempLibrary() as lib:
            target = lib.root / "c.mp3"
            data = _track(target)
            journal: dict[str, object] = {
                "cue_backup": {"file": str(target), "backup": str(lib.root / "gone.bak")}
            }
            files._undo_journal(journal)
            self.assert_track(target, data)
            self.assertIsNone(journal["cue_backup"])


class CrossDriveUndoTests(unittest.TestCase):
    """``_relocate_back`` copies across drives when a rename cannot."""

    def test_a_file_on_another_drive_is_copied_back(self) -> None:
        """EXDEV falls back to copy-then-delete for a file."""
        with TempLibrary() as lib:
            src, dst = lib.root / "a.mp3", lib.root / "other-drive" / "a.mp3"
            data = _track(dst)
            real = os.rename

            def rename(a: object, b: object) -> None:
                if Path(str(a)) == dst:
                    raise OSError(errno.EXDEV, "cross-device link")
                real(a, b)  # type: ignore[arg-type]

            with mock.patch.object(files.os, "rename", rename):
                files._undo_journal({"moves": [{"kind": "rename", "src": str(src), "dst": str(dst)}]})
            self.assert_track_back(src, dst, data)

    def test_a_folder_on_another_drive_is_not_half_copied(self) -> None:
        """EXDEV on a folder raises instead of copying part of it."""
        with TempLibrary() as lib:
            src, dst = lib.root / "set", lib.root / "other-drive" / "set"
            (dst / "a.mp3").parent.mkdir(parents=True)
            (dst / "a.mp3").write_bytes(b"x")
            with mock.patch.object(files.os, "rename", side_effect=OSError(errno.EXDEV, "cross-device link")):
                with self.assertRaises(OSError):
                    files._undo_journal({"moves": [{"kind": "rename", "src": str(src), "dst": str(dst)}]})
            self.assertTrue((dst / "a.mp3").is_file())
            self.assertFalse(src.exists())

    def assert_track_back(self, src: Path, dst: Path, data: bytes) -> None:
        """Require the file back at ``src`` and gone from ``dst``.

        Args:
            src: Original path.
            dst: Path on the other drive.
            data: Original bytes.
        """
        self.assertEqual(src.read_bytes(), data)
        self.assertTrue(read_serato_tags(str(src))["cues"])
        self.assertFalse(dst.exists())


class UndoAndDropTests(unittest.TestCase):
    """``_undo_and_drop`` deletes the journal only after a full undo."""

    def test_journal_is_deleted_after_a_successful_undo(self) -> None:
        """A clean undo removes the journal."""
        with TempLibrary() as lib:
            src, dst = lib.root / "a.mp3", lib.root / "sub" / "a.mp3"
            data = _track(dst)
            with mock.patch.object(files, "_delete_journal") as delete:
                files._undo_and_drop({"moves": [{"kind": "rename", "src": str(src), "dst": str(dst)}]})
            delete.assert_called_once_with()
            self.assertEqual(src.read_bytes(), data)

    def test_a_failed_undo_keeps_the_journal_and_says_where_the_backup_is(self) -> None:
        """An undo that cannot finish keeps the journal for recovery."""
        with TempLibrary() as lib:
            src, dst = lib.root / "a.mp3", lib.root / "sub" / "a.mp3"
            _track(dst)
            with mock.patch.object(files, "_delete_journal") as delete, mock.patch.object(
                files.os, "rename", side_effect=OSError(errno.EACCES, "denied")
            ):
                with self.assertRaises(library.LibraryError) as caught:
                    files._undo_and_drop({"moves": [{"kind": "rename", "src": str(src), "dst": str(dst)}]})
            delete.assert_not_called()
            self.assertIn("Library/Backups", caught.exception.message)
            self.assertTrue(dst.is_file())


if __name__ == "__main__":
    unittest.main()
