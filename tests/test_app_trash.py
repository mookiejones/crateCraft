"""App-owned trash for pruned snapshots and removed duplicate audio.

The cases use a temporary library and a temporary config directory.
They do not open a live Serato database. Other DJ libraries are not
scanned on this machine.
"""

from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

import app_trash
import library
import snapshots
import verified_copies
from library import LibraryError
from tests.fixture import TempLibrary
from tests.test_snapshots import _drive
from tests.test_verified_copies import _ConfigCase

NOW = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
_PUBLIC = {
    "id",
    "kind",
    "name",
    "held_at",
    "purge_at",
    "purge_cancelled",
    "status",
    "days_left",
    "label",
}


class _Clock:
    """Fixed aware clock the trash store reads."""

    def __init__(self) -> None:
        """Start at the module clock.

        Returns:
            None.
        """
        self.moment = NOW

    def __call__(self) -> datetime:
        """Return the current test time.

        Returns:
            An aware UTC datetime.
        """
        return self.moment


class _TrashCase(_ConfigCase):
    """Point the trash at the throwaway config and skip home-folder scans."""

    def setUp(self) -> None:
        """Patch the config directory and other-DJ library discovery.

        Returns:
            None.
        """
        super().setUp()
        self.clock = _Clock()
        self._locate = mock.patch("other_dj.locate_libraries", return_value=[])
        self._locate.start()

    def tearDown(self) -> None:
        """Drop the library-discovery patch.

        Returns:
            None.
        """
        self._locate.stop()
        super().tearDown()

    def store(self, root: Path | None = None) -> app_trash.AppTrash:
        """Open the trash under the test config.

        Args:
            root: Trash directory. None uses ``config/trash``.

        Returns:
            A store that reads ``self.clock``.
        """
        return app_trash.AppTrash(root=root or (self.config / "trash"), now=self.clock)

    def assert_public(self, row: object) -> None:
        """Fail when a page row contains a filesystem path.

        Args:
            row: One public item.

        Returns:
            None.
        """
        self.assertIsInstance(row, dict)
        assert isinstance(row, dict)
        self.assertEqual(set(row), _PUBLIC)


class AppTrashStoreTests(_TrashCase):
    """Hold, restore, cancel, and purge without a Serato database."""

    def test_list_public_missing_dir_does_not_create_it(self) -> None:
        """A missing trash directory stays missing.

        Returns:
            None. The test fails if the directory appears.
        """
        root = self.config / "no-such-trash"
        rows = self.store(root).list_public()
        self.assertEqual(rows, [])
        self.assertFalse(root.exists())

    def test_hold_reports_seven_days_and_hides_the_path(self) -> None:
        """The public row starts at seven days and omits the original path.

        Returns:
            None. The test fails if the path is public or the window is short.
        """
        with tempfile.TemporaryDirectory() as raw:
            outside = Path(raw)
            library_dir = outside / "Library"
            library_dir.mkdir()
            song = outside / "song.mp3"
            song.write_bytes(b"abc")
            trash = self.store()
            held = trash.hold_file(song, name="song.mp3", library_dir=library_dir)
            self.assertFalse(song.exists())
            row = trash.public_item(str(held["id"]))
            self.assert_public(row)
            self.assertEqual(row["days_left"], 7)
            self.assertEqual(row["label"], "held")
            self.assertEqual(row["kind"], "audio")
            index = json.loads((trash.root / "index.json").read_text(encoding="utf-8"))
            self.assertIn("original", index["items"][held["id"]])

    def test_restore_preview_does_not_move_and_confirm_puts_bytes_back(self) -> None:
        """Preview leaves the blob. Confirm and undo use the same id.

        Returns:
            None. The test fails if preview writes the file, or undo
            invents a new id.
        """
        with tempfile.TemporaryDirectory() as raw:
            outside = Path(raw)
            library_dir = outside / "Library"
            library_dir.mkdir()
            song = outside / "song.mp3"
            song.write_bytes(b"abc")
            trash = self.store()
            held = trash.hold_file(song, name="song.mp3", library_dir=library_dir)
            item_id = str(held["id"])
            blob = trash.root / "items" / item_id / "blob"
            preview = trash.restore(item_id, confirm=False, library_dir=library_dir)
            self.assertTrue(preview["preview"])
            self.assertFalse(song.exists())
            self.assertEqual(blob.read_bytes(), b"abc")
            done = trash.restore(item_id, confirm=True, library_dir=library_dir)
            self.assertTrue(done["ok"])
            self.assertEqual(song.read_bytes(), b"abc")
            self.assertFalse(blob.exists())
            again = trash.undo(item_id)
            self.assertEqual(again["item"]["id"], item_id)
            self.assertEqual(again["item"]["status"], "held")
            self.assertEqual(again["item"]["days_left"], 7)
            self.assertFalse(song.exists())
            self.assertEqual(blob.read_bytes(), b"abc")

    def test_snapshot_restore_and_undo_keep_the_tree(self) -> None:
        """A held directory returns to its original path, then to the same id.

        Returns:
            None. The test fails if the file inside the tree changes.
        """
        with tempfile.TemporaryDirectory() as raw:
            outside = Path(raw)
            library_dir = outside / "Library"
            library_dir.mkdir()
            tree = outside / "snap"
            tree.mkdir()
            (tree / "note.txt").write_text("keep", encoding="utf-8")
            trash = self.store()
            held = trash.hold_tree(tree, name="snap", library_dir=library_dir)
            item_id = str(held["id"])
            self.assertFalse(tree.exists())
            trash.restore(item_id, confirm=True, library_dir=library_dir)
            self.assertEqual((tree / "note.txt").read_text(encoding="utf-8"), "keep")
            trash.undo(item_id)
            blob = trash.root / "items" / item_id / "tree"
            self.assertEqual((blob / "note.txt").read_text(encoding="utf-8"), "keep")
            self.assertFalse(tree.exists())

    def test_purge_before_the_window_leaves_the_blob(self) -> None:
        """Preview and confirm both refuse while days remain.

        Returns:
            None. The test fails if the blob is deleted early.
        """
        trash, item_id, blob, library_dir = self._held_song()
        preview = trash.purge(item_id, confirm=False, library_dir=library_dir)
        self.assertFalse(preview["ok"])
        self.assertEqual(preview["code"], "trash_not_due")
        self.assertTrue(blob.is_file())
        with self.assertRaises(LibraryError) as ctx:
            trash.purge(item_id, confirm=True, library_dir=library_dir)
        self.assertEqual(str(ctx.exception), app_trash.TRASH_NOT_DUE)
        self.assertTrue(blob.is_file())

    def test_purge_preview_after_the_window_does_not_delete(self) -> None:
        """An allowed preview still leaves the bytes in the trash.

        Returns:
            None. The test fails if preview deletes the blob.
        """
        trash, item_id, blob, library_dir = self._held_song()
        self.clock.moment = NOW + timedelta(days=8)
        preview = trash.purge(item_id, confirm=False, library_dir=library_dir)
        self.assertTrue(preview["ok"])
        self.assertTrue(preview["preview"])
        self.assertTrue(blob.is_file())

    def test_purge_after_the_window_removes_the_blob(self) -> None:
        """Confirm after seven days deletes the held file.

        Returns:
            None. The test fails if the blob remains.
        """
        trash, item_id, blob, library_dir = self._held_song()
        self.clock.moment = NOW + timedelta(days=8)
        result = trash.purge(item_id, confirm=True, library_dir=library_dir)
        self.assertTrue(result["ok"])
        self.assertFalse(blob.exists())

    def test_cancel_blocks_purge_after_the_window(self) -> None:
        """A cancelled item stays after the restore window.

        A second cancel of the same item succeeds.

        Returns:
            None. The test fails if purge deletes the blob.
        """
        trash, item_id, blob, library_dir = self._held_song()
        first = trash.cancel(item_id)
        second = trash.cancel(item_id)
        self.assertEqual(first["item"]["label"], "cancelled")
        self.assertEqual(second["item"]["label"], "cancelled")
        self.clock.moment = NOW + timedelta(days=8)
        preview = trash.purge(item_id, confirm=False, library_dir=library_dir)
        self.assertFalse(preview["ok"])
        self.assertEqual(preview["code"], "trash_cancelled")
        with self.assertRaises(LibraryError) as ctx:
            trash.purge(item_id, confirm=True, library_dir=library_dir)
        self.assertEqual(str(ctx.exception), app_trash.TRASH_CANCELLED)
        self.assertTrue(blob.is_file())

    def test_other_dj_file_is_never_purged(self) -> None:
        """A file another DJ app still uses stays, and the copy gate is not asked.

        Returns:
            None. The test fails if the blob is deleted or the copy gate runs.
        """
        trash, item_id, blob, library_dir = self._held_song()
        self.clock.moment = NOW + timedelta(days=8)
        with (
            mock.patch("other_dj.LibraryIndex.used_by", return_value=["rekordbox"]) as used,
            mock.patch("verified_copies.require_audio_delete") as gate,
        ):
            preview = trash.purge(item_id, confirm=False, library_dir=library_dir)
            self.assertEqual(preview["code"], "trash_other_dj")
            with self.assertRaises(LibraryError) as ctx:
                trash.purge(item_id, confirm=True, library_dir=library_dir)
        self.assertEqual(str(ctx.exception), app_trash.TRASH_OTHER_DJ)
        used.assert_called()
        gate.assert_not_called()
        self.assertTrue(blob.is_file())

    def test_copy_count_refusal_leaves_the_blob(self) -> None:
        """A verified-copy refusal on purge does not delete the audio.

        Returns:
            None. The test fails if the blob is removed.
        """
        trash, item_id, blob, library_dir = self._held_song()
        self.clock.moment = NOW + timedelta(days=8)

        def refuse(paths: list[str]) -> None:
            """Raise the copy-count error the gate would raise.

            Args:
                paths: Files the caller asked to delete.

            Raises:
                LibraryError: Always.
            """
            del paths
            raise LibraryError("Need another verified copy before this file can go.")

        with mock.patch.object(verified_copies, "require_audio_delete", side_effect=refuse):
            preview = trash.purge(item_id, confirm=False, library_dir=library_dir)
            self.assertFalse(preview["ok"])
            with self.assertRaises(LibraryError):
                trash.purge(item_id, confirm=True, library_dir=library_dir)
        self.assertTrue(blob.is_file())

    def test_snapshot_purge_does_not_call_the_copy_gate(self) -> None:
        """Purging a held snapshot does not ask the prune copy-count gate.

        Returns:
            None. The test fails if that gate is called or the tree stays.
        """
        with tempfile.TemporaryDirectory() as raw:
            outside = Path(raw)
            library_dir = outside / "Library"
            library_dir.mkdir()
            tree = outside / "snap"
            tree.mkdir()
            (tree / "note.txt").write_text("keep", encoding="utf-8")
            trash = self.store()
            held = trash.hold_tree(tree, name="snap", library_dir=library_dir)
            item_id = str(held["id"])
            blob = trash.root / "items" / item_id / "tree"
            self.clock.moment = NOW + timedelta(days=8)
            with mock.patch.object(
                verified_copies,
                "require_snapshot_prune",
                side_effect=AssertionError("snapshot gate"),
            ):
                result = trash.purge(item_id, confirm=True, library_dir=library_dir)
            self.assertTrue(result["ok"])
            self.assertFalse(blob.exists())

    def test_trash_inside_the_library_is_refused_before_mkdir(self) -> None:
        """A trash root inside the library folder is not created.

        Returns:
            None. The test fails if the source moves or the directory appears.
        """
        with tempfile.TemporaryDirectory() as raw:
            library_dir = Path(raw)
            root = library_dir / "cratecraft-trash"
            song = library_dir.parent / "song.mp3"
            song.write_bytes(b"abc")
            try:
                with self.assertRaises(LibraryError) as ctx:
                    self.store(root).hold_file(song, name="song.mp3", library_dir=library_dir)
                self.assertEqual(str(ctx.exception), app_trash.TRASH_INSIDE)
                self.assertTrue(song.is_file())
                self.assertFalse(root.exists())
            finally:
                song.unlink(missing_ok=True)

    def test_symlink_tree_is_refused_before_the_move(self) -> None:
        """A shortcut inside a snapshot tree stays where it is.

        Returns:
            None. The test fails if the tree is moved.
        """
        with tempfile.TemporaryDirectory() as raw:
            outside = Path(raw)
            library_dir = outside / "Library"
            library_dir.mkdir()
            tree = outside / "snap"
            tree.mkdir()
            note = tree / "note.txt"
            note.write_text("keep", encoding="utf-8")
            (tree / "link").symlink_to(note)
            with self.assertRaises(LibraryError) as ctx:
                self.store().hold_tree(tree, name="snap", library_dir=library_dir)
            self.assertEqual(str(ctx.exception), app_trash.TRASH_SHORTCUT)
            self.assertTrue(note.is_file())
            self.assertFalse((self.config / "trash").exists())

    def test_symlink_destination_is_not_overwritten(self) -> None:
        """Restore refuses when the original path is now a shortcut.

        Returns:
            None. The test fails if the shortcut is replaced.
        """
        trash, item_id, blob, library_dir = self._held_song()
        song = Path(json.loads((trash.root / "index.json").read_text(encoding="utf-8"))["items"][item_id]["original"])
        song.symlink_to(blob)
        with self.assertRaises(LibraryError) as ctx:
            trash.restore(item_id, confirm=True, library_dir=library_dir)
        self.assertEqual(str(ctx.exception), app_trash.TRASH_SHORTCUT)
        self.assertTrue(song.is_symlink())
        self.assertTrue(blob.is_file())

    def test_bad_id_does_not_appear_in_the_error(self) -> None:
        """An escaped id is refused and the sentence stays generic.

        Returns:
            None. The test fails if the id is echoed.
        """
        trash = self.store()
        with self.assertRaises(LibraryError) as ctx:
            trash.public_item("../secret-trash-id")
        self.assertEqual(str(ctx.exception), app_trash.TRASH_MISSING)
        self.assertNotIn("secret-trash-id", str(ctx.exception))

    def test_flipped_byte_restore_leaves_no_staging_file(self) -> None:
        """A hash mismatch deletes the staging copy and keeps the blob.

        Returns:
            None. The test fails if the destination or the staging file exists.
        """
        trash, item_id, blob, library_dir = self._held_song()
        song = Path(json.loads((trash.root / "index.json").read_text(encoding="utf-8"))["items"][item_id]["original"])
        flipped = bytearray(blob.read_bytes())
        flipped[0] ^= 0xFF
        blob.write_bytes(flipped)
        with self.assertRaises(LibraryError) as ctx:
            trash.restore(item_id, confirm=True, library_dir=library_dir)
        self.assertEqual(str(ctx.exception), app_trash.TRASH_MISSING)
        self.assertFalse(song.exists())
        staging = song.parent / f"{song.name}.cratecraft-restore"
        self.assertFalse(staging.exists())
        self.assertTrue(blob.is_file())

    def test_audio_inside_the_library_is_not_restored(self) -> None:
        """Audio whose original path is inside the library folder stays held.

        Returns:
            None. The test fails if the file returns to the library folder.
        """
        with tempfile.TemporaryDirectory() as raw:
            library_dir = Path(raw)
            song = library_dir / "song.mp3"
            song.write_bytes(b"abc")
            trash = self.store()
            held = trash.hold_file(song, name="song.mp3", library_dir=library_dir)
            with self.assertRaises(LibraryError) as ctx:
                trash.restore(str(held["id"]), confirm=True, library_dir=library_dir)
            self.assertEqual(str(ctx.exception), app_trash.TRASH_PROTECTED)
            self.assertFalse(song.exists())

    def test_confirm_restore_while_serato_is_open_leaves_the_blob(self) -> None:
        """Confirm restore refuses while Serato is running.

        Returns:
            None. The test fails if the file is written back.
        """
        trash, item_id, blob, library_dir = self._held_song()
        song = Path(json.loads((trash.root / "index.json").read_text(encoding="utf-8"))["items"][item_id]["original"])
        with mock.patch("snapshots.serato_dj_running", return_value=True):
            preview = trash.restore(item_id, confirm=False, library_dir=library_dir)
            self.assertTrue(preview["ok"])
            with self.assertRaises(snapshots.SnapshotBlocked):
                trash.restore(item_id, confirm=True, library_dir=library_dir)
        self.assertFalse(song.exists())
        self.assertTrue(blob.is_file())

    def _held_song(self) -> tuple[app_trash.AppTrash, str, Path, Path]:
        """Hold one audio file outside a throwaway library folder.

        The directory lives until the test process ends. Each call uses
        its own temporary directory that the returned blob still needs.

        Returns:
            Store, item id, blob path, and library folder.
        """
        raw = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, raw, ignore_errors=True)
        outside = Path(raw)
        library_dir = outside / "Library"
        library_dir.mkdir()
        song = outside / "song.mp3"
        song.write_bytes(b"abc")
        trash = self.store()
        held = trash.hold_file(song, name="song.mp3", library_dir=library_dir)
        item_id = str(held["id"])
        blob = trash.root / "items" / item_id / "blob"
        return trash, item_id, blob, library_dir


class SnapshotPruneTrashTests(_TrashCase):
    """Prune holds the manifest in the config trash, not the Serato folder."""

    def test_prune_moves_the_manifest_into_config_trash(self) -> None:
        """Confirm prune leaves the store and hides the original path.

        Returns:
            None. The test fails if the directory stays in the snapshot
            store, or if the public row names a path.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            first = store.take("manual", "older")
            second = store.take("manual", "newer")
            folder = store._snapshot_dir(first["id"])
            result = store.prune(first["id"], confirm=True)
            self.assertTrue(result["ok"])
            trash_id = str(result["trash_id"])
            self.assertFalse(folder.exists())
            self.assertEqual([item["id"] for item in store.list_snapshots()], [second["id"]])
            rows = app_trash.AppTrash().list_public()
            self.assertEqual([row["id"] for row in rows], [trash_id])
            self.assert_public(rows[0])
            self.assertEqual(rows[0]["kind"], "snapshot")
            index = json.loads((self.config / "trash" / "index.json").read_text(encoding="utf-8"))
            self.assertIn("original", index["items"][trash_id])
            blob = self.config / "trash" / "items" / trash_id / "tree"
            self.assertTrue(blob.is_dir())
            self.assertNotIn(temp.root.resolve(), blob.resolve().parents)

    def test_prune_while_serato_is_open_leaves_the_directory(self) -> None:
        """Confirm prune refuses while this store says Serato is running.

        Returns:
            None. The test fails if the snapshot directory moves.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            first = store.take("manual", "older")
            store.take("manual", "newer")
            store.serato_running = lambda: True
            folder = store._snapshot_dir(first["id"])
            with self.assertRaises(snapshots.SnapshotBlocked):
                store.prune(first["id"], confirm=True)
            self.assertTrue(folder.is_dir())
            self.assertFalse((self.config / "trash").exists())

    def test_pruned_snapshot_purges_after_the_window(self) -> None:
        """A later clock deletes the held snapshot without the copy-count gate.

        Returns:
            None. The test fails if the tree remains or the gate is called.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            first = store.take("manual", "older")
            store.take("manual", "newer")
            result = store.prune(first["id"], confirm=True)
            trash_id = str(result["trash_id"])
            later = datetime.now(timezone.utc) + timedelta(days=8)
            trash = app_trash.AppTrash(root=self.config / "trash", now=lambda: later)
            blob = trash.root / "items" / trash_id / "tree"
            with mock.patch.object(
                verified_copies,
                "require_snapshot_prune",
                side_effect=AssertionError("snapshot gate"),
            ):
                purged = trash.purge(trash_id, confirm=True, library_dir=temp.root)
            self.assertTrue(purged["ok"])
            self.assertFalse(blob.exists())


class DuplicateHoldTests(_TrashCase):
    """Duplicate audio uses the app trash. Organize-files trash stays separate."""

    def test_move_to_trash_holds_a_file_outside_the_library(self) -> None:
        """A sibling audio file lands in the config trash.

        Returns:
            None. The test fails if the bytes stay in place or land in
            the Serato folder.
        """
        with TempLibrary() as temp:
            outside = Path(tempfile.mkdtemp(dir=temp.root.parent))
            self.addCleanup(shutil.rmtree, outside, ignore_errors=True)
            song = outside / "song.mp3"
            song.write_bytes(b"xyz")
            library._move_to_trash(song)
            self.assertFalse(song.exists())
            blobs = list((self.config / "trash" / "items").glob("*/blob"))
            self.assertEqual(len(blobs), 1)
            self.assertEqual(blobs[0].read_bytes(), b"xyz")
            self.assertNotIn(temp.root.resolve(), blobs[0].resolve().parents)

    def test_protected_library_path_is_not_held(self) -> None:
        """A file inside the library folder is refused before the trash exists.

        Returns:
            None. The test fails if the file moves or the trash directory appears.
        """
        with TempLibrary() as temp:
            song = temp.root / "song.mp3"
            song.write_bytes(b"xyz")
            with self.assertRaises(LibraryError) as ctx:
                library._move_to_trash(song)
            self.assertEqual(str(ctx.exception), "The file could not be moved to the Trash.")
            self.assertTrue(song.is_file())
            self.assertFalse((self.config / "trash").exists())

    def test_gate_trash_restore_accepts_a_display_name(self) -> None:
        """The no-op journal accepts a file name and refuses a path.

        Returns:
            None. The test fails if a path-like name is journaled.
        """
        with TempLibrary():
            library.gate_trash_restore("song.mp3")
            with self.assertRaises(LibraryError) as parent:
                library.gate_trash_restore("../song.mp3")
            self.assertEqual(str(parent.exception), app_trash.TRASH_MISSING)
            with self.assertRaises(LibraryError) as dots:
                library.gate_trash_restore("..")
            self.assertEqual(str(dots.exception), app_trash.TRASH_MISSING)


if __name__ == "__main__":
    unittest.main()
