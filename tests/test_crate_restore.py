"""Restored crate files survive a Serato 4/5 launch.

Serato 4 and 5 rebuild the crate folder from ``master.sqlite`` and delete a
``.crate`` or ``.scrate`` the database has never heard of. These tests fake
that launch. They use synthetic databases and the spec-derived crate fixtures.
They do not open a live library.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest import mock

import library
import safe_write
import snapshots
from snapshots import DriveSpec, SnapshotBlocked, SnapshotStore
from tests.fixture import TempLibrary, open_database
from tests.test_snapshots import _crate, _drive

FIXTURES = Path(__file__).resolve().parent / "fixtures"


def simulate_serato_launch(master: Path, roots: list[Path]) -> list[str]:
    """Delete crate files Serato 4/5 would remove on launch.

    The database is the source of truth. A crate file it has never heard of
    is removed. Shortcuts are not removed. This is the launch the restore
    has to survive.

    Args:
        master: ``master.sqlite``.
        roots: ``_Serato_`` directories that are present.

    Returns:
        Basenames that were removed.
    """
    removed: list[str] = []
    for root in roots:
        for path in snapshots.unknown_crate_files(master, root):
            path.unlink()
            removed.append(path.name)
    return removed


def _members(master: Path, filename: str) -> list[int]:
    """Return asset ids in crate order for one export filename.

    Args:
        master: Database to read.
        filename: Exact ``dj_container_metadata.filename``.

    Returns:
        Asset ids. An unknown filename returns an empty list.
    """
    with open_database(master) as conn:
        rows = conn.execute(
            """
            SELECT ca.asset_id
            FROM dj_container_metadata m
            JOIN location_container lc ON lc.container_id = m.container_id
            JOIN container_asset ca ON ca.location_container_id = lc.id
            WHERE m.filename = ?
            ORDER BY ca.list_order, ca.asset_id
            """,
            (filename,),
        ).fetchall()
    return [int(row[0]) for row in rows]


def _filenames(master: Path) -> list[str]:
    """Return stored crate export filenames.

    Args:
        master: Database to read.

    Returns:
        Filenames in container id order.
    """
    with open_database(master) as conn:
        rows = conn.execute(
            "SELECT filename FROM dj_container_metadata ORDER BY container_id"
        ).fetchall()
    return [str(row[0]) for row in rows if row[0]]


def _add_asset(master: Path, asset_id: int, portable: str, file_name: str) -> None:
    """Insert one track into the Serato Library space.

    Args:
        master: Database to write.
        asset_id: New asset id. Must not already be used.
        portable: Stored path.
        file_name: File name Serato shows.
    """
    with open_database(master) as conn:
        conn.execute(
            """
            INSERT INTO asset
                (id, name, artist, portable_id, file_name, location_id, is_missing)
            VALUES (?, ?, 'Artist', ?, ?, 1, 0)
            """,
            (asset_id, file_name, portable, file_name),
        )
        conn.execute(
            "INSERT INTO space_asset (id, asset_id, space_id) VALUES (?, ?, 1)",
            (asset_id, asset_id),
        )


def _rewrite(store: SnapshotStore, manifest: dict[str, object]) -> str:
    """Publish a changed copy of a manifest under a new id.

    Args:
        store: Store that holds the blobs.
        manifest: Manifest to publish. Its id and hash are replaced.

    Returns:
        The new snapshot id.
    """
    body = dict(manifest)
    body.pop("sha256", None)
    body["id"] = snapshots._new_id()
    store._write_manifest(body)
    return str(body["id"])


def _without_master(store: SnapshotStore, snapshot_id: str) -> str:
    """Return a snapshot id whose manifest has no master database.

    Args:
        store: Store that holds the snapshot.
        snapshot_id: Snapshot to copy.

    Returns:
        The new snapshot id.
    """
    manifest = store._manifest(snapshot_id)
    database = dict(manifest.get("database") or {})
    database["master"] = None
    manifest = dict(manifest)
    manifest["database"] = database
    return _rewrite(store, manifest)


def _root_database(path: Path) -> None:
    """Create a location database the crate mirror can update.

    Args:
        path: ``root.sqlite`` beside the master file.
    """
    with open_database(path) as conn:
        conn.executescript(
            """
            CREATE TABLE serato (revision INTEGER);
            CREATE TABLE space (id INTEGER PRIMARY KEY, name TEXT);
            CREATE TABLE container (
                id INTEGER PRIMARY KEY,
                revision INTEGER,
                parent_id INTEGER,
                name TEXT,
                type INTEGER,
                list_order INTEGER,
                space_id INTEGER,
                time_added INTEGER,
                expanded INTEGER,
                portable_id TEXT,
                color INTEGER
            );
            CREATE TABLE dj_container_metadata (
                container_id INTEGER PRIMARY KEY,
                revision INTEGER,
                export_state INTEGER,
                filename TEXT
            );
            INSERT INTO serato (revision) VALUES (1);
            INSERT INTO space (id, name) VALUES (1, 'Serato Library');
            INSERT INTO container
                (id, parent_id, name, type, list_order, space_id, time_added, expanded, portable_id)
            VALUES (1, NULL, 'Library', 0, 0, 1, 1, 0, '');
            """
        )


class CrateRestoreTests(unittest.TestCase):
    """A restore leaves crate files that a Serato 4/5 launch will keep."""

    def test_launch_removes_a_crate_the_database_has_never_heard_of(self) -> None:
        """Delete an unregistered crate file and keep one the database names.

        A Windows path in ``dj_container_metadata.filename`` still counts as
        the basename. The simulation is not an empty check: the unknown file
        has to disappear.

        Returns:
            None. The test fails if the unknown file remains or the known
            file is removed.
        """
        with TempLibrary() as temp:
            music, serato, _store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            known = sub / "House.crate"
            unknown = sub / "Ghost.crate"
            known.write_bytes(_crate(["Music/same-a.mp3"]))
            unknown.write_bytes(_crate(["Music/same-b.mp3"]))
            with open_database(temp.db) as conn:
                conn.execute(
                    """
                    INSERT INTO container
                        (id, parent_id, name, type, list_order, space_id, time_added, expanded, portable_id)
                    VALUES (9, 1, 'House', 1, 1, 1, 1, 0, '')
                    """
                )
                conn.execute(
                    """
                    INSERT INTO dj_container_metadata (container_id, revision, export_state, filename)
                    VALUES (9, 1, 0, ?)
                    """,
                    ("Subcrates\\House.crate",),
                )
            removed = simulate_serato_launch(temp.db, [serato])
            self.assertEqual(removed, ["Ghost.crate"])
            self.assertTrue(known.is_file())
            self.assertFalse(unknown.exists())
            self.assertTrue(music.is_dir())

    def test_restored_serato_4_and_5_crates_survive_launch(self) -> None:
        """Register fixture crates and keep them when launch reconciliation runs.

        Serato 4's nested ``House%%Café.crate`` and Serato 5's
        ``House%%深夜.crate`` are the fixture files. A Windows path and a
        macOS path match the library tracks. An empty crate, a smart crate,
        and a second copy of the same track are included. A file named
        ``.crate`` has no leaf and is the one launch still removes. The
        location database receives the same filenames. The plan lists the
        crates and does not write them.

        Returns:
            None. The test fails if launch deletes a registered crate, a
            track is missing, or a second container is created for one name.
        """
        with TempLibrary() as temp:
            _root_database(temp.db.parent / "root.sqlite")
            _add_asset(temp.db, 3, "Music/café-loop.flac", "café-loop.flac")
            _add_asset(temp.db, 4, "Music/深夜-loop.flac", "深夜-loop.flac")
            _add_asset(temp.db, 5, "../secret.mp3", "secret.mp3")
            _add_asset(temp.db, 6, "Music/clash-a.mp3", "clash.mp3")
            _add_asset(temp.db, 7, "Music/clash-b.mp3", "clash.mp3")
            music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            shutil.copy(FIXTURES / "serato4" / "_Serato_" / "Subcrates" / "House%%Café.crate", sub)
            shutil.copy(FIXTURES / "serato4" / "_Serato_" / "Subcrates" / "Empty.crate", sub)
            shutil.copy(FIXTURES / "serato5" / "_Serato_" / "Subcrates" / "House%%深夜.crate", sub)
            (sub / "Paths.crate").write_bytes(_crate([
                "C:\\Users\\dj\\Music\\same-a.mp3",
                "/Users/dj/Music/same-b.mp3",
                "Music/same-a.mp3",
                "../secret.mp3",
                "clash.mp3",
            ]))
            smart = serato / "SmartCrates"
            smart.mkdir()
            (smart / "Friday.scrate").write_bytes(_crate(["Music/same-a.mp3"]))
            nameless = sub / ".crate"
            nameless.write_bytes(_crate(["Music/same-a.mp3"]))
            saved = store.take("manual", "Crates the database has not heard of.")
            plan = store.plan(saved["id"])
            self.assertTrue(plan["dry_run"])
            registered = plan["crates_registered"]
            self.assertIsInstance(registered, list)
            assert isinstance(registered, list)
            paths = {str(item["path"]) for item in registered}
            self.assertIn("Subcrates/House%%Café.crate", paths)
            self.assertIn("Subcrates/House%%深夜.crate", paths)
            self.assertIn("Subcrates/Empty.crate", paths)
            self.assertIn("Subcrates/Paths.crate", paths)
            self.assertIn("SmartCrates/Friday.scrate", paths)
            self.assertNotIn("Subcrates/.crate", paths)
            with open_database(temp.db) as conn:
                before = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            self.assertEqual(before, 2)
            for path in (sub / "House%%Café.crate", sub / "Empty.crate", sub / "Paths.crate", nameless):
                path.unlink()
            (sub / "House%%深夜.crate").unlink()
            (smart / "Friday.scrate").unlink()
            result = store.restore(saved["id"])
            self.assertEqual(result["restored"], saved["id"])
            self.assertIn("House%%Café.crate", _filenames(temp.db))
            self.assertIn("House%%深夜.crate", _filenames(temp.db))
            self.assertIn("Empty.crate", _filenames(temp.db))
            self.assertIn("Paths.crate", _filenames(temp.db))
            self.assertIn("Friday.scrate", _filenames(temp.db))
            self.assertNotIn(".crate", _filenames(temp.db))
            self.assertEqual(_members(temp.db, "Paths.crate"), [1, 2])
            self.assertEqual(_members(temp.db, "House%%Café.crate"), [3])
            self.assertEqual(_members(temp.db, "House%%深夜.crate"), [4])
            self.assertEqual(_members(temp.db, "Empty.crate"), [])
            self.assertEqual(_members(temp.db, "Friday.scrate"), [])
            with open_database(temp.db) as conn:
                houses = conn.execute(
                    "SELECT COUNT(*) FROM container WHERE name = 'House'"
                ).fetchone()[0]
                friday = conn.execute(
                    "SELECT type FROM container WHERE name = 'Friday'"
                ).fetchone()
            self.assertEqual(houses, 1)
            self.assertIsNotNone(friday)
            assert friday is not None
            self.assertEqual(int(friday[0]), 2)
            root_names = _filenames(temp.db.parent / "root.sqlite")
            for name in ("House%%Café.crate", "House%%深夜.crate", "Empty.crate", "Paths.crate", "Friday.scrate"):
                self.assertIn(name, root_names)
            removed = simulate_serato_launch(temp.db, [serato])
            self.assertEqual(removed, [".crate"])
            self.assertTrue((sub / "House%%Café.crate").is_file())
            self.assertTrue((sub / "House%%深夜.crate").is_file())
            self.assertTrue((sub / "Empty.crate").is_file())
            self.assertTrue((sub / "Paths.crate").is_file())
            self.assertTrue((smart / "Friday.scrate").is_file())
            self.assertFalse(nameless.exists())
            self.assertTrue(music.is_dir())

    def test_a_known_crate_is_not_duplicated(self) -> None:
        """Keep one container when the snapshot database already heard the name.

        The crate file's track is still added. Launch keeps the file.

        Returns:
            None. The test fails if a second House row appears or the track
            is not a member.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            created = library.crate_action({"action": "create", "name": "House"})
            sub = serato / "Subcrates"
            sub.mkdir()
            crate = sub / "House.crate"
            crate.write_bytes(_crate(["Music/same-a.mp3"]))
            saved = store.take("manual", "House is already in the database.")
            library.crate_action({"action": "delete", "id": created["id"]})
            crate.unlink()
            store.restore(saved["id"])
            with open_database(temp.db) as conn:
                count = conn.execute(
                    "SELECT COUNT(*) FROM container WHERE name = 'House'"
                ).fetchone()[0]
            self.assertEqual(count, 1)
            self.assertEqual(_members(temp.db, "House.crate"), [1])
            self.assertEqual(simulate_serato_launch(temp.db, [serato]), [])
            self.assertTrue(crate.is_file())

    def test_an_unplugged_drive_is_registered_without_writing_the_file(self) -> None:
        """Register a crate from the snapshot when its drive is not present.

        The file is not written through the missing drive. Putting the same
        bytes back, as the drive would when it returns, survives launch.

        Returns:
            None. The test fails if the file is written while the drive is
            absent, or if launch then deletes it.
        """
        with TempLibrary() as temp:
            usb_root = temp.root / "usb"
            usb_serato = usb_root / "_Serato_"
            usb_sub = usb_serato / "Subcrates"
            usb_sub.mkdir(parents=True)
            gig = FIXTURES / "serato4" / "drives" / "UNMOUNTED" / "_Serato_" / "Subcrates" / "Gig.crate"
            shutil.copy(gig, usb_sub / "Gig.crate")
            _music, serato, store = _drive(temp.root, temp.db)
            (serato / "Subcrates").mkdir()
            store.drives = [
                DriveSpec("tour", "Tour", serato, _music, "external", True),
                DriveSpec("usb", "USB", usb_serato, usb_root, "external", True),
            ]
            saved = store.take("manual", "USB crate.")
            store.drives = [
                DriveSpec("tour", "Tour", serato, _music, "external", True),
                DriveSpec("usb", "USB", usb_serato, usb_root, "external", False),
            ]
            (usb_sub / "Gig.crate").unlink()
            store.restore(saved["id"])
            self.assertFalse((usb_sub / "Gig.crate").exists())
            self.assertIn("Gig.crate", _filenames(temp.db))
            shutil.copy(gig, usb_sub / "Gig.crate")
            self.assertEqual(simulate_serato_launch(temp.db, [usb_serato]), [])
            self.assertTrue((usb_sub / "Gig.crate").is_file())

    def test_a_shortcut_crate_is_not_followed_or_removed(self) -> None:
        """Leave a crate shortcut in place and do not read its target.

        The target lives outside ``_Serato_``. Its bytes stay put, and its
        track is not added to a crate named for the shortcut.

        Returns:
            None. The test fails if the shortcut is removed or its target
            changes.
        """
        with TempLibrary() as temp:
            _add_asset(temp.db, 3, "Music/leaked.mp3", "leaked.mp3")
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            house = sub / "House.crate"
            house.write_bytes(_crate(["Music/same-a.mp3"]))
            outside = temp.root / "outside"
            outside.mkdir()
            target = outside / "Outside.crate"
            target.write_bytes(_crate(["Music/leaked.mp3"]))
            link = sub / "Outside.crate"
            try:
                os.symlink(target, link)
            except OSError:
                self.skipTest("symlinks are not available")
            saved = store.take("manual", "A real crate and a shortcut.")
            original = target.read_bytes()
            house.unlink()
            store.restore(saved["id"])
            self.assertTrue(house.is_file())
            self.assertTrue(link.is_symlink())
            self.assertEqual(target.read_bytes(), original)
            with open_database(temp.db) as conn:
                outside_row = conn.execute(
                    "SELECT id FROM container WHERE name = 'Outside'"
                ).fetchone()
            self.assertIsNone(outside_row)
            self.assertNotIn(3, _members(temp.db, "House.crate"))
            self.assertEqual(simulate_serato_launch(temp.db, [serato]), [])
            self.assertTrue(link.is_symlink())

    def test_restore_refuses_to_register_crates_while_serato_is_running(self) -> None:
        """Write no crate row when Serato DJ is running.

        Returns:
            None. The test fails if a container or a filename is inserted.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            (sub / "House.crate").write_bytes(_crate(["Music/same-a.mp3"]))
            saved = store.take("manual", "While Serato is quit.")
            (sub / "House.crate").unlink()
            store.serato_running = lambda: True
            with self.assertRaises(SnapshotBlocked):
                store.restore(saved["id"])
            self.assertEqual(_filenames(temp.db), [])
            self.assertFalse((sub / "House.crate").exists())

    def test_a_library_with_no_space_skips_registration(self) -> None:
        """Finish the restore when the database has no Serato Library space.

        The crate file is put back and the database from the snapshot stays
        in place. The crate is not registered, so Serato may remove that
        file the next time it opens. The plan says so, and it does not list
        the crate as one that will be registered.

        Returns:
            None. The test fails if the restore rolls back or a filename row
            is inserted.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            crate = sub / "House.crate"
            original = _crate(["Music/same-a.mp3"])
            crate.write_bytes(original)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM container")
                conn.execute("DELETE FROM space")
            saved = store.take("manual", "No space.")
            plan = store.plan(saved["id"])
            self.assertEqual(plan["crates_registered"], [])
            self.assertIn("no Serato Library space", str(plan["registration_warning"]))
            self.assertEqual(plan["registration_warning_code"], "registration_no_space")
            with open_database(temp.db) as conn:
                conn.execute("INSERT INTO space (id, name) VALUES (1, 'Serato Library')")
                conn.execute(
                    """
                    INSERT INTO container
                        (id, parent_id, name, type, list_order, space_id, time_added, expanded, portable_id)
                    VALUES (1, NULL, 'Library', 0, 0, 1, 1, 0, '')
                    """
                )
            crate.write_bytes(_crate(["Music/other.mp3"]))
            store.restore(saved["id"])
            self.assertEqual(crate.read_bytes(), original)
            self.assertEqual(_filenames(temp.db), [])
            with open_database(temp.db) as conn:
                space = conn.execute(
                    "SELECT name FROM space WHERE name = 'Serato Library'"
                ).fetchone()
            self.assertIsNone(space)

    def test_a_snapshot_without_a_master_does_not_list_or_register_crates(self) -> None:
        """Leave the live database alone when the snapshot has no master.

        An empty known-name set must not make every crate look unregistered.
        The crate file is still restored. A missing master file is the same
        skip: ``_apply`` does not ask ``begin_write`` and does not roll back.

        Returns:
            None. The test fails if a crate row appears or the restore raises.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            crate = sub / "House.crate"
            original = _crate(["Music/same-a.mp3"])
            crate.write_bytes(original)
            saved = store.take("manual", "Crate file only.")
            bare = _without_master(store, saved["id"])
            plan = store.plan(bare)
            self.assertEqual(plan["crates_registered"], [])
            self.assertIsNone(plan["registration_warning"])
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET name = ? WHERE id = 1", ("Changed",))
            crate.unlink()
            store.restore(bare)
            self.assertEqual(crate.read_bytes(), original)
            self.assertEqual(_filenames(temp.db), [])
            with open_database(temp.db) as conn:
                name = conn.execute("SELECT name FROM asset WHERE id = 1").fetchone()
            assert name is not None
            self.assertEqual(name[0], "Changed")
            temp.db.unlink()
            store._apply(bare)
            self.assertFalse(temp.db.exists())
            self.assertTrue(crate.is_file())

    def test_the_same_crate_on_two_drives_is_one_plan_row(self) -> None:
        """List one crate when two drives store the same file name.

        Returns:
            None. The test fails if House appears twice.
        """
        with TempLibrary() as temp:
            music, serato, store = _drive(temp.root, temp.db)
            (serato / "Subcrates").mkdir()
            (serato / "Subcrates" / "House.crate").write_bytes(_crate(["Music/same-a.mp3"]))
            other_root = temp.root / "other"
            other = other_root / "_Serato_"
            (other / "Subcrates").mkdir(parents=True)
            (other / "Subcrates" / "House.crate").write_bytes(_crate(["Music/same-b.mp3"]))
            store.drives = [
                DriveSpec("tour", "Tour", serato, music, "external", True),
                DriveSpec("other", "Other", other, other_root, "external", True),
            ]
            saved = store.take("manual", "Same crate name on two drives.")
            plan = store.plan(saved["id"])
            registered = plan["crates_registered"]
            assert isinstance(registered, list)
            houses = [item for item in registered if str(item["path"]).endswith("House.crate")]
            self.assertEqual(len(houses), 1)

    def test_a_file_name_alone_does_not_pick_a_track(self) -> None:
        """Do not attach a crate path that is only a file name.

        The library track's portable id is ``Music/same-a.mp3``. A crate
        that stores ``same-a.mp3`` must stay empty. The crate file itself
        is still registered.

        Returns:
            None. The test fails if asset 1 is added to the crate.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            (sub / "Bare.crate").write_bytes(_crate(["same-a.mp3"]))
            saved = store.take("manual", "Bare file name.")
            store.restore(saved["id"])
            self.assertEqual(_members(temp.db, "Bare.crate"), [])
            self.assertIn("Bare.crate", _filenames(temp.db))

    def test_a_damaged_crate_blob_does_not_abort_the_restore(self) -> None:
        """Skip one crate whose snapshot copy cannot be read.

        The other crate is restored and registered. The damaged crate's
        file is left as it is. The restore does not roll back.

        Returns:
            None. The test fails if restore raises or Peak is not registered.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            house = sub / "House.crate"
            peak = sub / "Peak.crate"
            house.write_bytes(_crate(["Music/same-a.mp3"]))
            peak.write_bytes(_crate(["Music/same-b.mp3"]))
            saved = store.take("manual", "Two crates.")
            manifest = dict(store._manifest(saved["id"]))
            drives = []
            for record in manifest["drives"]:
                copied = dict(record)
                files = []
                for item in copied["files"]:
                    entry = dict(item)
                    if str(entry.get("path", "")).endswith("House.crate"):
                        entry["sha256"] = None
                    files.append(entry)
                copied["files"] = files
                drives.append(copied)
            manifest["drives"] = drives
            damaged = _rewrite(store, manifest)
            plan = store.plan(damaged)
            registered = plan["crates_registered"]
            skipped = plan["crates_skipped"]
            assert isinstance(registered, list)
            assert isinstance(skipped, list)
            self.assertFalse(any(str(item["path"]).endswith("House.crate") for item in registered))
            self.assertTrue(any(str(item["path"]).endswith("House.crate") for item in skipped))
            self.assertTrue(any(str(item["path"]).endswith("Peak.crate") for item in registered))
            house.write_bytes(_crate(["Music/kept.mp3"]))
            kept = house.read_bytes()
            with self.assertLogs("serato", level="WARNING") as logs:
                result = store.restore(damaged)
            self.assertTrue(any("could not be read" in line for line in logs.output))
            result_skipped = result["crates_skipped"]
            assert isinstance(result_skipped, list)
            self.assertTrue(any(str(item["path"]).endswith("House.crate") for item in result_skipped))
            changes = result["changes"]
            assert isinstance(changes, dict)
            self.assertFalse(any(str(item["path"]).endswith("House.crate") for item in changes["crates_registered"]))
            self.assertEqual(house.read_bytes(), kept)
            self.assertEqual(peak.read_bytes(), _crate(["Music/same-b.mp3"]))
            self.assertIn("Peak.crate", _filenames(temp.db))
            self.assertNotIn("House.crate", _filenames(temp.db))

    def test_an_unreadable_crate_blob_is_not_listed_as_registered(self) -> None:
        """Report a crate whose hash does not point at a blob.

        The plan and the restore result name it as skipped. It is not
        listed as a crate that will be registered. The other crate is.

        Returns:
            None. The test fails if House is registered or missing from
            the skipped list.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            (sub / "House.crate").write_bytes(_crate(["Music/same-a.mp3"]))
            (sub / "Peak.crate").write_bytes(_crate(["Music/same-b.mp3"]))
            saved = store.take("manual", "Two crates.")
            manifest = dict(store._manifest(saved["id"]))
            drives = []
            for record in manifest["drives"]:
                copied = dict(record)
                files = []
                for item in copied["files"]:
                    entry = dict(item)
                    if str(entry.get("path", "")).endswith("House.crate"):
                        entry["sha256"] = "a" * 64
                    files.append(entry)
                copied["files"] = files
                drives.append(copied)
            manifest["drives"] = drives
            damaged = _rewrite(store, manifest)
            plan = store.plan(damaged)
            registered = plan["crates_registered"]
            skipped = plan["crates_skipped"]
            assert isinstance(registered, list)
            assert isinstance(skipped, list)
            self.assertFalse(any(str(item.get("path", "")).endswith("House.crate") for item in registered))
            self.assertEqual(
                [str(item.get("path")) for item in skipped if str(item.get("path", "")).endswith("House.crate")],
                ["Subcrates/House.crate"],
            )
            result = store.restore(damaged)
            result_skipped = result["crates_skipped"]
            assert isinstance(result_skipped, list)
            self.assertTrue(any(str(item.get("path", "")).endswith("House.crate") for item in result_skipped))
            self.assertNotIn("House.crate", _filenames(temp.db))
            self.assertIn("Peak.crate", _filenames(temp.db))

    def test_restore_with_registration_passes_the_row_check(self) -> None:
        """Restore a crate the database has not heard of while the check is on.

        The check compares database rows with the snapshot plus the crates
        that were registered. A byte match would fail after those rows are
        inserted. The operation log records the check as verified.

        Returns:
            None. The test fails if the restore rolls back or the crate is
            missing from the database.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            (sub / "House.crate").write_bytes(_crate(["Music/same-a.mp3"]))
            saved = store.take("manual", "House is only a crate file.")
            (sub / "House.crate").unlink()
            result = store.restore(saved["id"])
            self.assertTrue(result["ok"])
            self.assertEqual((sub / "House.crate").read_bytes(), _crate(["Music/same-a.mp3"]))
            self.assertIn("House.crate", _filenames(temp.db))
            self.assertEqual(_members(temp.db, "House.crate"), [1])
            entry = safe_write.read_log(temp.db)[-1]
            self.assertEqual(entry["action"], "restore")
            self.assertIs(entry["verified"], True)
            self.assertIs(entry["rolled_back"], False)

    def test_row_check_leaves_the_database_and_wal_bytes_unchanged(self) -> None:
        """Read the restored database without checkpointing its WAL.

        Opening the live file read-write folds the WAL into the database
        and removes ``-wal`` and ``-shm``. The check copies them and opens
        the copy read-only, so those three hashes stay the same.

        Returns:
            None. The test fails if any of the three files changes.
        """
        with TempLibrary() as temp:
            conn = sqlite3.connect(temp.db)
            try:
                library._keep_wal(conn)
                conn.execute("PRAGMA journal_mode=WAL")
                conn.execute("UPDATE asset SET name = name WHERE id = 1")
                conn.commit()
            finally:
                conn.close()
            wal = Path(str(temp.db) + "-wal")
            shm = Path(str(temp.db) + "-shm")
            self.assertTrue(wal.is_file())
            self.assertTrue(shm.is_file())

            def digest(path: Path) -> str:
                return hashlib.sha256(path.read_bytes()).hexdigest()

            before = (digest(temp.db), digest(wal), digest(shm))
            snapshots._load_rows(temp.db)
            after = (digest(temp.db), digest(wal), digest(shm))
            self.assertEqual(after, before)
            self.assertTrue(wal.is_file())
            self.assertTrue(shm.is_file())

    def test_an_unrelated_track_change_after_registration_rolls_back(self) -> None:
        """Roll back when a restore that registers a crate changes another row.

        The crate rows are allowed. A track row that was not part of that
        registration is not. The pre-restore snapshot is put back.

        Returns:
            None. The test fails if the tampered title or the new crate remains.
        """
        with TempLibrary() as temp:
            _music, serato, store = _drive(temp.root, temp.db)
            sub = serato / "Subcrates"
            sub.mkdir()
            (sub / "House.crate").write_bytes(_crate(["Music/same-a.mp3"]))
            saved = store.take("manual", "House is only a crate file.")
            (sub / "House.crate").unlink()
            with open_database(temp.db) as conn:
                original = conn.execute("SELECT name FROM asset WHERE id = 1").fetchone()
            assert original is not None

            def tamper() -> None:
                with open_database(temp.db) as conn:
                    conn.execute("UPDATE asset SET name = ? WHERE id = 1", ("Tampered",))

            store.restore_fault = snapshots.RestoreFault(after_apply=tamper)
            with self.assertRaises(snapshots.SnapshotError) as caught:
                store.restore(saved["id"])
            self.assertIn("put back", caught.exception.message)
            with open_database(temp.db) as conn:
                name = conn.execute("SELECT name FROM asset WHERE id = 1").fetchone()
                houses = conn.execute("SELECT COUNT(*) FROM container WHERE name = 'House'").fetchone()
            assert name is not None
            assert houses is not None
            self.assertEqual(name[0], original[0])
            self.assertEqual(houses[0], 0)
            self.assertFalse((sub / "House.crate").exists())
            entry = safe_write.read_log(temp.db)[-1]
            self.assertEqual(entry["result"], "rolled_back")
            self.assertIs(entry["verified"], False)
            self.assertIs(entry["rolled_back"], True)

    def test_registration_does_not_open_another_snapshot(self) -> None:
        """Avoid a nested snapshot while a restore could be holding the journal.

        Returns:
            None. The test fails if ``register_restored_crates`` saves a snapshot.
        """
        with TempLibrary() as temp:
            _music, _serato, store = _drive(temp.root, temp.db)
            before = [item["id"] for item in store.list_snapshots()]
            library.register_restored_crates([("House.crate", ["Music/same-a.mp3"])])
            self.assertEqual([item["id"] for item in store.list_snapshots()], before)
            self.assertIn("House.crate", _filenames(temp.db))
            self.assertEqual(_members(temp.db, "House.crate"), [1])

    def test_a_locked_library_is_not_written(self) -> None:
        """Refuse registration when the lock table says Serato is open.

        The process check is patched. On macOS a low pid can be a live
        process that is not Serato, so an unpatched lookup would ignore
        the lock. The patch is what the other lock tests use.

        Returns:
            None. The test fails if a crate row is inserted.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            with mock.patch.object(library, "_process_is_serato", return_value=True):
                with self.assertRaises(library.SeratoOpen):
                    library.register_restored_crates([("House.crate", ["Music/same-a.mp3"])])
            self.assertEqual(_filenames(temp.db), [])
            with open_database(temp.db) as conn:
                count = conn.execute("SELECT COUNT(*) FROM container WHERE name = 'House'").fetchone()[0]
            self.assertEqual(count, 0)



class RowCheckTests(unittest.TestCase):
    """The restored-database row check must not touch the live files."""

    def test_row_check_leaves_a_wal_library_untouched(self) -> None:
        """Read rows without checkpointing or adding files beside the library.

        Serato's library runs in WAL mode. Opening ``master.sqlite``
        directly and closing it folds the ``-wal`` frames into the main
        file and deletes the sidecars, so the check would rewrite the
        library it is checking. The rows must come from a copy.

        Returns:
            None. The test fails if a live byte or file name changes.
        """
        with tempfile.TemporaryDirectory(prefix="serato-rowcheck-test-") as raw:
            folder = Path(raw)
            db = folder / "master.sqlite"
            with closing(sqlite3.connect(db)) as setup:
                setup.execute("PRAGMA journal_mode=WAL")
                setup.execute("CREATE TABLE asset (id INTEGER PRIMARY KEY, name TEXT)")
                setup.execute("INSERT INTO asset VALUES (1, 'Opener')")
                setup.commit()
                setup.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            snapshot = db.read_bytes()
            conn = sqlite3.connect(db)
            try:
                flag = getattr(sqlite3, "SQLITE_DBCONFIG_NO_CKPT_ON_CLOSE", None)
                if flag is None:
                    self.skipTest("This SQLite cannot keep the WAL on close.")
                conn.setconfig(flag, True)
                conn.execute("PRAGMA wal_autocheckpoint=0")
                conn.execute("INSERT INTO asset VALUES (2, 'Closer')")
                conn.commit()
            finally:
                conn.close()
            wal = Path(str(db) + "-wal")
            self.assertTrue(wal.is_file() and wal.stat().st_size > 0)
            before = {path.name: path.read_bytes() for path in folder.iterdir()}

            # The WAL holds a row the snapshot lacks, so the rows differ.
            self.assertFalse(snapshots._database_rows_match(snapshot, db, set()))

            after = {path.name: path.read_bytes() for path in folder.iterdir()}
            self.assertEqual(sorted(after), sorted(before))
            self.assertEqual(after["master.sqlite"], before["master.sqlite"])
            self.assertEqual(after["master.sqlite-wal"], before["master.sqlite-wal"])

if __name__ == "__main__":
    unittest.main()
