"""External-drive crate files land in that drive's _Serato_ folder.

Overwrite of a same-named crate is off unless the caller turns it on.
A missing drive is not connected. A drive with no _Serato_ folder is
skipped and the folder is not created. A crate edit snapshots the drive
files it will change. A library failure puts those files back. A drive
failure leaves the library save and names the drive.
"""

from __future__ import annotations

import json
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import library
import safe_write
import snapshots
import stick_export
import volumes
from drive_crates import planned_files, sync_volume
from library import LibraryError
from tests.fixture import TempLibrary, open_database


def _volume(root: Path, name: str = "GIG") -> volumes.Volume:
    return volumes.Volume(name, str(root), "posix")


class DriveCrateTests(unittest.TestCase):
    """A track on an external drive is written only into that drive."""

    def setUp(self) -> None:
        """Point stick memory at a throwaway directory. The stick is not the config folder."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory."""
        self._env.stop()
        self._config.cleanup()

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
            stick_export.remember_library(_volume(root))
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

    def test_planned_files_name_only_what_the_write_will_change(self) -> None:
        """A new crate and an existing database V2 are listed. A kept crate is not.

        Returns:
            None. The test fails if a missing database, a kept crate, or a
            shortcut folder is included.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            serato = root / "_Serato_"
            serato.mkdir()
            database = serato / "database V2"
            database.write_bytes(b"")
            track = str(root / "Music" / "a.mp3")
            with mock.patch("volumes.external_volume", return_value=_volume(root)):
                created = planned_files([track, track], "House", add=True, overwrite=False)
                self.assertEqual(created, [serato / "Subcrates" / "House.crate", database])
                database.unlink()
                missing_db = planned_files([track], "House", add=True, overwrite=False)
                self.assertEqual(missing_db, [serato / "Subcrates" / "House.crate"])
                crate = serato / "Subcrates" / "House.crate"
                crate.parent.mkdir()
                crate.write_bytes(b"keep")
                stick_export.remember_library(_volume(root))
                kept = planned_files([track], "House", add=True, overwrite=False)
                self.assertEqual(kept, [])
                removed = planned_files([track], "House", add=False, overwrite=True)
                self.assertEqual(removed, [crate])
            self.assertEqual(planned_files([track], "House", add=True, overwrite=False), [])

    def test_drive_error_restores_the_drive_and_warns(self) -> None:
        """A failed database append puts the new crate back and keeps the old bytes.

        Returns:
            None. The test fails if the crate remains, the database keeps the
            torn tail, or the result raises.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            serato = root / "_Serato_"
            serato.mkdir()
            database = serato / "database V2"
            original = b"vrsn-ok"
            database.write_bytes(original)

            def tear(folder: Path, relatives: list[str]) -> None:
                del relatives
                with (folder / "database V2").open("ab") as handle:
                    handle.write(b"torn")
                raise OSError("drive write failed")

            with mock.patch("drive_crates._append_database", side_effect=tear):
                result = sync_volume(
                    _volume(root),
                    [str(root / "Music" / "a.mp3")],
                    "House",
                    add=True,
                    overwrite=False,
                )
            crate = serato / "Subcrates" / "House.crate"
            self.assertEqual(result.status, "failed")
            self.assertIn("could not be updated", result.detail)
            self.assertIn("left as it was", result.detail)
            self.assertFalse(crate.exists())
            self.assertEqual(database.read_bytes(), original)
            self.assertFalse((serato / "Subcrates" / "House.crate.cratecraft-tmp").exists())

    def test_restore_failure_warns_and_does_not_raise(self) -> None:
        """A drive that cannot be put back is named, and the error is not raised.

        Returns:
            None. The test fails if sync_volume raises or the second warning is missing.
        """
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            serato = root / "_Serato_"
            serato.mkdir()
            (serato / "database V2").write_bytes(b"vrsn-ok")

            def tear(folder: Path, relatives: list[str]) -> None:
                del relatives
                with (folder / "database V2").open("ab") as handle:
                    handle.write(b"torn")
                raise OSError("drive write failed")

            with (
                mock.patch("drive_crates._append_database", side_effect=tear),
                mock.patch("drive_crates._put_drive_back", side_effect=OSError("restore failed")),
            ):
                result = sync_volume(
                    _volume(root),
                    [str(root / "Music" / "a.mp3")],
                    "House",
                    add=True,
                    overwrite=False,
                )
            self.assertEqual(result.status, "failed")
            self.assertIn("could not be put back", result.detail)


class DriveCrateActionTests(unittest.TestCase):
    """A crate edit asks the drive writer, and overwrite stays off."""

    def setUp(self) -> None:
        """Point settings at a throwaway directory and keep Serato closed for the test."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._block = mock.patch("snapshots.write_block_message", return_value=None)
        self._running.start()
        self._block.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory and the Serato stubs."""
        self._block.stop()
        self._running.stop()
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


def _images(db: Path) -> set[str]:
    """Return preimage directory names for one library.

    Args:
        db: Temporary ``master.sqlite``.

    Returns:
        Names under ``write-images``. An empty store is an empty set.
    """
    root = safe_write.store_dir(db) / "write-images"
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


def _asset_name(db: Path, asset_id: int) -> str:
    """Return one asset's stored name.

    Args:
        db: Temporary ``master.sqlite``.
        asset_id: Asset id.

    Returns:
        The name column.
    """
    with open_database(db) as conn:
        row = conn.execute("SELECT name FROM asset WHERE id = ?", (asset_id,)).fetchone()
    if row is None:
        return ""
    return str(row[0])


def _crate_names(db: Path) -> list[str]:
    """Return stored container names.

    Args:
        db: Temporary ``master.sqlite``.

    Returns:
        Names from the container table.
    """
    with open_database(db) as conn:
        return [str(row[0]) for row in conn.execute("SELECT name FROM container ORDER BY id")]


def _retarget(db: Path, portable_id: str, asset_id: int = 1) -> None:
    """Point one fixture track at a path on a fake drive.

    Args:
        db: Temporary ``master.sqlite``.
        portable_id: Stored path to write.
        asset_id: Asset id. Defaults to the first fixture track.
    """
    with open_database(db) as conn:
        conn.execute(
            "UPDATE asset SET portable_id = ? WHERE id = ?",
            (portable_id, asset_id),
        )


def _bind_volume(root: Path) -> mock._patch[object]:
    """Treat paths under ``root`` as one external drive.

    Args:
        root: Temporary drive root. It is not inside the library directory.

    Returns:
        A patch of :func:`volumes.external_volume`.
    """
    real = volumes.external_volume

    def fake(path: str) -> volumes.Volume | None:
        try:
            Path(path).resolve().relative_to(root.resolve())
        except (ValueError, OSError):
            return real(path)
        return _volume(root)

    return mock.patch("volumes.external_volume", side_effect=fake)


class TwoSidedCrateTests(unittest.TestCase):
    """A crate edit snapshots the drive files in the same preimage."""

    def setUp(self) -> None:
        """Point settings at a throwaway directory and keep Serato closed."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._block = mock.patch("snapshots.write_block_message", return_value=None)
        self._running.start()
        self._block.start()

    def tearDown(self) -> None:
        """Drop the stubs and clear a fault the test installed."""
        safe_write.install_fault(None)
        self._block.stop()
        self._running.stop()
        self._env.stop()
        self._config.cleanup()

    def test_create_writes_both_sides_and_undo_restores_them(self) -> None:
        """Create stores the track in master and on the drive, under one preimage.

        Undo puts both sides back and does not take a second preimage.

        Returns:
            None. The test fails if either side stays changed, or a second
            preimage appears.
        """
        with tempfile.TemporaryDirectory() as drive_dir:
            root = Path(drive_dir)
            serato = root / "_Serato_"
            serato.mkdir()
            database = serato / "database V2"
            original = b""
            database.write_bytes(original)
            track = root / "Music" / "same-a.mp3"
            with TempLibrary() as temp:
                _retarget(temp.db, str(track))
                before = _images(temp.db)
                library_names = {path.name for path in temp.root.iterdir()}
                with _bind_volume(root):
                    created = library.crate_action(
                        {"action": "create", "name": "House", "assets": [1]}
                    )
                crate_id = int(created["id"])
                crate = serato / "Subcrates" / "House.crate"
                record = safe_write.results(temp.db)[-1]
                listing = json.loads(
                    (safe_write.store_dir(temp.db) / "write-images" / str(record.snapshot_id) / "files.json").read_text(
                        encoding="utf-8"
                    )
                )
                self.assertNotIn("could not be updated", str(created.get("warning") or ""))
                self.assertEqual(_members(temp.db, crate_id), [1])
                self.assertEqual(snapshots.parse_serato_bytes(crate.read_bytes()), ["Music/same-a.mp3"])
                rows = snapshots.parse_database_v2(database.read_bytes())
                self.assertEqual([row.get("path") for row in rows], ["Music/same-a.mp3"])
                self.assertEqual(_images(temp.db) - before, {str(record.snapshot_id)})
                self.assertIn("database V2", record.files)
                self.assertNotIn("House.crate", record.files)
                self.assertTrue(any(str(item).endswith("House.crate") for item in listing["absent"]))
                self.assertFalse(any(str(item).endswith("database V2") for item in listing["absent"]))
                self.assertFalse((temp.root / "_Serato_").exists())
                self.assertFalse((temp.root / "Backups").exists())
                self.assertEqual({path.name for path in temp.root.iterdir()}, library_names)
                after = _images(temp.db)
                safe_write.undo_preimage(str(record.snapshot_id), operation="undo_crate", target="House")
                self.assertEqual(_images(temp.db), after)
                self.assertNotIn("House", _crate_names(temp.db))
                self.assertFalse(crate.exists())
                self.assertEqual(database.read_bytes(), original)

    def test_master_failure_restores_the_drive_files(self) -> None:
        """A failed library check puts the new crate and database V2 back.

        Returns:
            None. The test fails if the track stays in a House crate, the
            drive crate remains, or the database keeps the torn bytes.
        """
        with tempfile.TemporaryDirectory() as drive_dir:
            root = Path(drive_dir)
            serato = root / "_Serato_"
            serato.mkdir()
            database = serato / "database V2"
            original = b"vrsn-ok"
            database.write_bytes(original)
            crate = serato / "Subcrates" / "House.crate"
            track = root / "Music" / "same-a.mp3"
            with TempLibrary() as temp:
                _retarget(temp.db, str(track))

                def boom() -> None:
                    conn = sqlite3.connect(temp.db)
                    try:
                        conn.execute("UPDATE asset SET name = ? WHERE id = 1", ("Corrupt",))
                        conn.commit()
                    finally:
                        conn.close()
                    if crate.is_file():
                        crate.write_bytes(crate.read_bytes() + b"torn")
                    database.write_bytes(database.read_bytes() + b"torn")
                    raise OSError("master check failed")

                safe_write.install_fault(safe_write.Fault(after_commit=boom))
                try:
                    with _bind_volume(root):
                        with self.assertRaises(LibraryError):
                            library.crate_action(
                                {"action": "create", "name": "House", "assets": [1]}
                            )
                finally:
                    safe_write.install_fault(None)
                self.assertEqual(_asset_name(temp.db, 1), "Same")
                self.assertNotIn("House", _crate_names(temp.db))
                self.assertFalse(crate.exists())
                self.assertEqual(database.read_bytes(), original)
                self.assertNotIn(b"torn", database.read_bytes())

    def test_drive_failure_keeps_the_library_and_warns(self) -> None:
        """A drive error leaves the crate membership and restores the drive.

        Returns:
            None. The test fails if the membership is rolled back, the warning
            is empty, or the drive file stays torn.
        """
        with tempfile.TemporaryDirectory() as drive_dir:
            root = Path(drive_dir)
            serato = root / "_Serato_"
            serato.mkdir()
            database = serato / "database V2"
            original = b"vrsn-ok"
            database.write_bytes(original)
            track = root / "Music" / "same-a.mp3"
            with TempLibrary() as temp:
                _retarget(temp.db, str(track))

                def tear(folder: Path, relatives: list[str]) -> None:
                    del relatives
                    with (folder / "database V2").open("ab") as handle:
                        handle.write(b"torn")
                    raise OSError("drive write failed")

                with _bind_volume(root), mock.patch("drive_crates._append_database", side_effect=tear):
                    created = library.crate_action(
                        {"action": "create", "name": "House", "assets": [1]}
                    )
                warning = created.get("warning")
                self.assertIsInstance(warning, str)
                self.assertIn("could not be updated", str(warning))
                self.assertEqual(_members(temp.db, int(created["id"])), [1])
                self.assertFalse((serato / "Subcrates" / "House.crate").exists())
                self.assertEqual(database.read_bytes(), original)
                self.assertFalse((serato / "Subcrates" / "House.crate.cratecraft-tmp").exists())

    def test_unplugged_letter_warns_and_writes_no_crate_file(self) -> None:
        """A Windows letter that is not a directory saves the library and warns.

        Returns:
            None. The test fails if a House.crate appears in the library folder
            or the warning does not say the drive is not connected.
        """
        with TempLibrary() as temp:
            _retarget(temp.db, "E:\\Music\\a.mp3")
            created = library.crate_action({"action": "create", "name": "House", "assets": [1]})
            warning = str(created.get("warning") or "")
            self.assertIn("not connected", warning)
            self.assertEqual(_members(temp.db, int(created["id"])), [1])
            self.assertFalse(any(temp.root.rglob("House.crate")))

    def test_symlink_serato_folder_does_not_block_the_library_write(self) -> None:
        """A shortcut _Serato_ folder is not snapshotted, and the crate is still saved.

        Returns:
            None. The test fails if the create raises or a crate appears in the
            link target.
        """
        with tempfile.TemporaryDirectory() as drive_dir:
            root = Path(drive_dir)
            target = root / "elsewhere"
            target.mkdir()
            (root / "_Serato_").symlink_to(target, target_is_directory=True)
            track = root / "Music" / "same-a.mp3"
            with TempLibrary() as temp:
                _retarget(temp.db, str(track))
                with _bind_volume(root):
                    created = library.crate_action(
                        {"action": "create", "name": "House", "assets": [1]}
                    )
                warning = str(created.get("warning") or "")
                self.assertIn("no Serato library", warning)
                self.assertEqual(_members(temp.db, int(created["id"])), [1])
                self.assertFalse((target / "Subcrates").exists())

    def test_missing_database_v2_stays_missing(self) -> None:
        """A drive with no database V2 gains a crate file and not that database.

        Returns:
            None. The test fails if database V2 is created or snapshotted.
        """
        with tempfile.TemporaryDirectory() as drive_dir:
            root = Path(drive_dir)
            (root / "_Serato_").mkdir()
            track = root / "Music" / "same-a.mp3"
            with TempLibrary() as temp:
                _retarget(temp.db, str(track))
                with _bind_volume(root):
                    created = library.crate_action(
                        {"action": "create", "name": "House", "assets": [1]}
                    )
                database = root / "_Serato_" / "database V2"
                crate = root / "_Serato_" / "Subcrates" / "House.crate"
                record = safe_write.results(temp.db)[-1]
                listing = json.loads(
                    (safe_write.store_dir(temp.db) / "write-images" / str(record.snapshot_id) / "files.json").read_text(
                        encoding="utf-8"
                    )
                )
                self.assertNotIn("could not be updated", str(created.get("warning") or ""))
                self.assertTrue(crate.is_file())
                self.assertFalse(database.exists())
                self.assertNotIn("database V2", record.files)
                self.assertFalse(any("database V2" in str(item) for item in listing["absent"]))

    def test_boot_path_does_not_create_home_subcrates(self) -> None:
        """A relative boot path stays in master.sqlite and does not touch home Subcrates.

        Returns:
            None. The test fails if a crate file appears under the home Serato folder.
        """
        home = Path(os.environ["CRATECRAFT_HOME_SERATO"])
        with TempLibrary() as temp:
            created = library.crate_action({"action": "create", "name": "House", "assets": [1]})
            self.assertEqual(_members(temp.db, int(created["id"])), [1])
            self.assertFalse((home / "Subcrates").exists())
            self.assertFalse(any(temp.root.rglob("House.crate")))

    def test_add_snapshots_an_existing_database(self) -> None:
        """Adding a track looks up the crate name and snapshots database V2.

        Returns:
            None. The test fails if the new preimage omits database V2.
        """
        with tempfile.TemporaryDirectory() as drive_dir:
            root = Path(drive_dir)
            serato = root / "_Serato_"
            serato.mkdir()
            database = serato / "database V2"
            database.write_bytes(b"")
            track = root / "Music" / "same-a.mp3"
            with TempLibrary() as temp:
                created = library.crate_action({"action": "create", "name": "House"})
                _retarget(temp.db, str(track))
                before = _images(temp.db)
                with _bind_volume(root):
                    added = library.crate_action(
                        {"action": "add", "id": created["id"], "asset": 1}
                    )
                record = safe_write.results(temp.db)[-1]
                self.assertNotIn("could not be updated", str(added.get("warning") or ""))
                self.assertEqual(_images(temp.db) - before, {str(record.snapshot_id)})
                self.assertIn("database V2", record.files)
                self.assertEqual(
                    snapshots.parse_serato_bytes((serato / "Subcrates" / "House.crate").read_bytes()),
                    ["Music/same-a.mp3"],
                )
                rows = snapshots.parse_database_v2(database.read_bytes())
                self.assertEqual([row.get("path") for row in rows], ["Music/same-a.mp3"])

    def test_remove_snapshots_the_crate_and_not_the_database(self) -> None:
        """Remove overwrites the crate file and leaves database V2 bytes alone.

        Returns:
            None. The test fails if the preimage includes database V2 or the
            path stays in the crate.
        """
        with tempfile.TemporaryDirectory() as drive_dir:
            root = Path(drive_dir)
            serato = root / "_Serato_"
            serato.mkdir()
            database = serato / "database V2"
            database.write_bytes(b"")
            track = root / "Music" / "same-a.mp3"
            with TempLibrary() as temp:
                _retarget(temp.db, str(track))
                with _bind_volume(root):
                    created = library.crate_action(
                        {"action": "create", "name": "House", "assets": [1]}
                    )
                    database_after_add = database.read_bytes()
                    before = _images(temp.db)
                    library.crate_action(
                        {
                            "action": "remove",
                            "id": created["id"],
                            "asset": 1,
                            "overwrite": True,
                        }
                    )
                record = safe_write.results(temp.db)[-1]
                crate = serato / "Subcrates" / "House.crate"
                self.assertEqual(_images(temp.db) - before, {str(record.snapshot_id)})
                self.assertIn("House.crate", record.files)
                self.assertNotIn("database V2", record.files)
                self.assertEqual(snapshots.parse_serato_bytes(crate.read_bytes()), [])
                self.assertEqual(database.read_bytes(), database_after_add)
                self.assertEqual(_members(temp.db, int(created["id"])), [])
