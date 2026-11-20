"""Queue, preview, and one-snapshot batch apply.

The cases use a temporary library and a temporary config directory.
They do not open a live Serato database.
"""

from __future__ import annotations

import os
import unittest
from pathlib import Path

import app_config
import batch_run
import library
import safe_write
from library import LibraryError
from tests.fixture import TempLibrary, open_database
from tests.test_verified_copies import _ConfigCase


def _images() -> set[str]:
    """Return preimage directory names for the open library.

    Returns:
        Names under ``write-images``. An empty store is an empty set.
    """
    root = safe_write.store_dir() / "write-images"
    if not root.is_dir():
        return set()
    return {path.name for path in root.iterdir() if path.is_dir()}


def _members(db: Path, crate_id: int) -> list[int]:
    """Return direct member asset ids for one crate.

    Args:
        db: Temporary ``master.sqlite``.
        crate_id: Container id.

    Returns:
        Asset ids in list order.
    """
    with open_database(db) as conn:
        return [
            int(row[0])
            for row in conn.execute(
                """
                SELECT ca.asset_id FROM container_asset ca
                JOIN location_container lc ON lc.id = ca.location_container_id
                WHERE lc.container_id = ?
                ORDER BY ca.list_order, ca.id
                """,
                (crate_id,),
            )
        ]


class BatchRunTests(_ConfigCase):
    """Preview is read-only. Apply and undo share one preimage."""

    def test_preview_apply_and_undo_use_one_preimage(self) -> None:
        """Preview reads. Apply adds a crate and a track. Undo restores both.

        The image count grows by one on apply and stays put on undo.
        The store file stays beside settings, not in the library folder.

        Returns:
            None. The test fails if a second preimage appears or a track remains.
        """
        with TempLibrary() as temp:
            source = library.crate_action(
                {"action": "create", "name": "Warmup", "assets": [1]}
            )
            dest = library.crate_action({"action": "create", "name": "Night"})
            source_id = int(source["id"])
            dest_id = int(dest["id"])
            before = _images()
            batch_run.action({"action": "add", "kind": "crate", "id": source_id})
            batch_run.action({"action": "add", "kind": "track", "id": 2})
            batch_run.action({"action": "destination", "id": dest_id})
            preview = batch_run.action({"action": "preview"})
            self.assertEqual(_images(), before)
            self.assertEqual(_members(temp.db, dest_id), [])
            self.assertEqual(preview["preview"]["would_add"], 2)
            self.assertEqual(preview["preview"]["first"]["kind"], "crate")
            self.assertEqual(preview["preview"]["first"]["id"], source_id)
            mid = _images()
            applied = batch_run.action({"action": "apply", "confirm": True})
            self.assertEqual(len(_images() - mid), 1)
            self.assertEqual(_members(temp.db, dest_id), [1, 2])
            self.assertEqual(applied["added"], 2)
            self.assertEqual(applied["queue"], [])
            self.assertIsNone(applied["preview"])
            self.assertTrue(applied["can_undo"])
            undo_images = _images()
            undone = batch_run.action({"action": "undo", "confirm": True})
            self.assertEqual(_images(), undo_images)
            self.assertEqual(_members(temp.db, dest_id), [])
            self.assertEqual(_members(temp.db, source_id), [1])
            self.assertFalse(undone["can_undo"])
            store = app_config.config_dir() / "batch-run.json"
            self.assertTrue(store.is_file())
            self.assertTrue(str(store).startswith(str(self.config)))
            self.assertFalse((temp.db.parent / "Backups").exists())
            self.assertNotIn("Backups", str(store))

    def test_stale_preview_refuses_and_writes_nothing(self) -> None:
        """A newer master mtime refuses apply and leaves membership empty.

        Returns:
            None. The test fails if a preimage appears or the track is added.
        """
        with TempLibrary() as temp:
            dest = library.crate_action({"action": "create", "name": "Night"})
            dest_id = int(dest["id"])
            batch_run.action({"action": "add", "kind": "track", "id": 1})
            batch_run.action({"action": "destination", "id": dest_id})
            batch_run.action({"action": "preview"})
            before = _images()
            future = temp.db.stat().st_mtime + 60
            os.utime(temp.db, (future, future))
            with self.assertRaises(LibraryError) as ctx:
                batch_run.action({"action": "apply", "confirm": True})
            self.assertEqual(str(ctx.exception), batch_run.BATCH_STALE)
            self.assertEqual(ctx.exception.status, 409)
            self.assertEqual(_images(), before)
            self.assertEqual(_members(temp.db, dest_id), [])

    def test_direct_members_only(self) -> None:
        """A queued crate adds its own tracks and skips a child crate's tracks.

        Returns:
            None. The test fails if the child track lands in the destination.
        """
        with TempLibrary() as temp:
            parent = library.crate_action(
                {"action": "create", "name": "Warmup", "assets": [1]}
            )
            parent_id = int(parent["id"])
            library.crate_action(
                {"action": "create", "name": "Child", "parent": parent_id, "assets": [2]}
            )
            dest = library.crate_action({"action": "create", "name": "Night"})
            dest_id = int(dest["id"])
            batch_run.action({"action": "add", "kind": "crate", "id": parent_id})
            batch_run.action({"action": "destination", "id": dest_id})
            preview = batch_run.action({"action": "preview"})
            self.assertEqual(preview["preview"]["would_add"], 1)
            batch_run.action({"action": "apply", "confirm": True})
            self.assertEqual(_members(temp.db, dest_id), [1])

    def test_nothing_to_change_does_not_write(self) -> None:
        """A track that is already a member previews as zero and does not write.

        Returns:
            None. The test fails if a new preimage appears.
        """
        with TempLibrary() as temp:
            dest = library.crate_action(
                {"action": "create", "name": "Night", "assets": [1]}
            )
            dest_id = int(dest["id"])
            batch_run.action({"action": "add", "kind": "track", "id": 1})
            batch_run.action({"action": "destination", "id": dest_id})
            before = _images()
            preview = batch_run.action({"action": "preview"})
            self.assertEqual(preview["preview"]["would_add"], 0)
            self.assertEqual(_images(), before)
            with self.assertRaises(LibraryError) as ctx:
                batch_run.action({"action": "apply", "confirm": True})
            self.assertEqual(str(ctx.exception), batch_run.BATCH_NOTHING)
            self.assertEqual(_images(), before)
            self.assertEqual(_members(temp.db, dest_id), [1])

    def test_crate_cannot_be_added_to_itself(self) -> None:
        """Choosing a queued crate as the destination is refused before save.

        Returns:
            None. The test fails if the destination is stored.
        """
        with TempLibrary():
            source = library.crate_action({"action": "create", "name": "Warmup"})
            source_id = int(source["id"])
            batch_run.action({"action": "add", "kind": "crate", "id": source_id})
            with self.assertRaises(LibraryError) as ctx:
                batch_run.action({"action": "destination", "id": source_id})
            self.assertEqual(str(ctx.exception), batch_run.BATCH_SAME)
            listed = batch_run.listing()
            self.assertIsNone(listed["destination"])
            self.assertEqual(listed["queue"][0]["id"], source_id)

    def test_confirm_cancel_and_missing_preview(self) -> None:
        """Apply and undo need confirm. Cancel and a missing preview write nothing.

        Returns:
            None. The test fails if membership changes.
        """
        with TempLibrary() as temp:
            dest = library.crate_action({"action": "create", "name": "Night"})
            dest_id = int(dest["id"])
            before = _images()
            with self.assertRaises(LibraryError) as confirm:
                batch_run.action({"action": "apply", "confirm": False})
            self.assertEqual(str(confirm.exception), batch_run.BATCH_NEEDS_CONFIRM)
            self.assertEqual(confirm.exception.status, 400)
            batch_run.action({"action": "add", "kind": "track", "id": 1})
            batch_run.action({"action": "destination", "id": dest_id})
            with self.assertRaises(LibraryError) as missing:
                batch_run.action({"action": "apply", "confirm": True})
            self.assertEqual(str(missing.exception), batch_run.BATCH_NO_PREVIEW)
            listed = batch_run.action({"action": "cancel"})
            self.assertEqual(listed["queue"], [])
            self.assertIsNone(listed["destination"])
            self.assertEqual(_images(), before)
            self.assertEqual(_members(temp.db, dest_id), [])
            with self.assertRaises(LibraryError) as undo:
                batch_run.action({"action": "undo", "confirm": True})
            self.assertEqual(str(undo.exception), batch_run.BATCH_NO_UNDO)

    def test_queue_edits_clear_the_preview(self) -> None:
        """Adding another item after preview drops that preview.

        Returns:
            None. The test fails if apply writes from the old preview.
        """
        with TempLibrary() as temp:
            dest = library.crate_action({"action": "create", "name": "Night"})
            dest_id = int(dest["id"])
            batch_run.action({"action": "add", "kind": "track", "id": 1})
            batch_run.action({"action": "destination", "id": dest_id})
            batch_run.action({"action": "preview"})
            again = batch_run.action({"action": "add", "kind": "track", "id": 2})
            self.assertIsNone(again["preview"])
            before = _images()
            with self.assertRaises(LibraryError) as ctx:
                batch_run.action({"action": "apply", "confirm": True})
            self.assertEqual(str(ctx.exception), batch_run.BATCH_NO_PREVIEW)
            self.assertEqual(_images(), before)
            self.assertEqual(_members(temp.db, dest_id), [])

    def test_bad_id_missing_item_and_special_crates(self) -> None:
        """Reject a bool id, a missing queue row, a smart crate, and the space root.

        Returns:
            None. The test fails if a special crate is accepted.
        """
        with TempLibrary() as temp:
            with self.assertRaises(LibraryError) as bad:
                batch_run.action({"action": "add", "kind": "track", "id": True})
            self.assertEqual(str(bad.exception), "That request is not valid.")
            with self.assertRaises(LibraryError) as missing:
                batch_run.action({"action": "remove", "kind": "track", "id": 1})
            self.assertEqual(str(missing.exception), batch_run.BATCH_MISSING)
            with open_database(temp.db) as conn:
                conn.execute(
                    """
                    INSERT INTO container
                        (parent_id, name, type, list_order, space_id, time_added, expanded, portable_id)
                    VALUES (1, 'Smart', 2, 1, 1, 1, 0, '')
                    """
                )
                smart_id = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])
            with self.assertRaises(LibraryError) as smart:
                batch_run.action({"action": "destination", "id": smart_id})
            self.assertEqual(str(smart.exception), "Smart crates choose their tracks from rules.")
            with self.assertRaises(LibraryError) as root:
                batch_run.action({"action": "destination", "id": 1})
            self.assertEqual(str(root.exception), "Tracks live in a crate, not the space root.")

    def test_undo_refuses_when_the_library_bytes_changed(self) -> None:
        """A later edit blocks undo and leaves the batch membership in place.

        Returns:
            None. The test fails if undo restores the old color or drops the track.
        """
        with TempLibrary() as temp:
            dest = library.crate_action({"action": "create", "name": "Night"})
            dest_id = int(dest["id"])
            batch_run.action({"action": "add", "kind": "track", "id": 1})
            batch_run.action({"action": "destination", "id": dest_id})
            batch_run.action({"action": "preview"})
            batch_run.action({"action": "apply", "confirm": True})
            before = _images()
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET color = 1 WHERE id = 1")
            with self.assertRaises(LibraryError) as ctx:
                batch_run.action({"action": "undo", "confirm": True})
            self.assertEqual(str(ctx.exception), batch_run.BATCH_UNDO_STALE)
            self.assertEqual(_images(), before)
            self.assertEqual(_members(temp.db, dest_id), [1])
            with open_database(temp.db) as conn:
                color = conn.execute("SELECT color FROM asset WHERE id = 1").fetchone()[0]
            self.assertEqual(color, 1)

    def test_empty_queue_and_missing_destination(self) -> None:
        """Preview refuses an empty queue and a missing destination.

        Returns:
            None. The test fails if preview writes a plan.
        """
        with TempLibrary():
            with self.assertRaises(LibraryError) as empty:
                batch_run.action({"action": "preview"})
            self.assertEqual(str(empty.exception), batch_run.BATCH_EMPTY)
            batch_run.action({"action": "add", "kind": "track", "id": 1})
            with self.assertRaises(LibraryError) as dest:
                batch_run.action({"action": "preview"})
            self.assertEqual(str(dest.exception), batch_run.BATCH_NEEDS_DEST)


if __name__ == "__main__":
    unittest.main()
