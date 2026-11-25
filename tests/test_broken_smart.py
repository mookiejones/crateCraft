"""Broken smart crates: read-only scan and a confirmed rules repair (#489).

The library is a temporary fixture. Backups, a sandbox copy, and a
portable ``.scrate`` are planted beside it. Nothing here opens a live
Serato library.
"""

from __future__ import annotations

import json
import os
import plistlib
import shutil
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from contextlib import closing, contextmanager
from http.server import ThreadingHTTPServer
from pathlib import Path
from collections.abc import Iterator
from unittest import mock

import broken_smart
import library
import portable_smart
import server
import snapshots
from library import LibraryError, SeratoOpen
from tests.fixture import TempLibrary, open_database

SPACE = library.LIBRARY_SPACE
KEPT = (
    '{"spaces":["Serato Library"],"conjunction":"AND","live_updates":true,'
    '"rules":[{"type":"STRING","attribute":"genre","operation":"IS","version":1,'
    '"value":"House","extra":"kept as is"}],"mystery":"kept as is"}'
)
OTHER = (
    '{"conjunction":"OR","live_updates":false,"rules":[{"attribute":"bpm"}],"unknown":"bytes"}'
)
NEWER = '{"conjunction":"AND","live_updates":true,"rules":[{"value":"newer"}]}'


def _names(root: Path) -> set[str]:
    """Return relative paths under a library folder.

    Args:
        root: Library directory.

    Returns:
        POSIX paths of every file and directory. A missing folder is empty.
    """
    if not root.exists():
        return set()
    return {path.relative_to(root).as_posix() for path in root.rglob("*")}


def _rules(db: Path, crate_id: int) -> str | None:
    """Read one rules value from a copy of the database file.

    Args:
        db: ``master.sqlite`` or ``root.sqlite``.
        crate_id: Container id.

    Returns:
        The rules text, or None when the row is missing. The copy includes
        a real ``-wal`` file so a committed repair is visible.
    """
    try:
        with library.copied_read_conn(db) as conn:
            row = conn.execute(
                "SELECT rules FROM smart_crate_rules WHERE container_id = ?",
                (crate_id,),
            ).fetchone()
    except sqlite3.OperationalError:
        return None
    if row is None or row[0] is None:
        return None
    return str(row[0])


def _add_smart(
    conn: sqlite3.Connection,
    crate_id: int,
    name: str,
    rules: str | None,
    *,
    space_id: int = 1,
    parent: int = 1,
    portable: str = "",
) -> None:
    """Insert a type-2 crate and, when given, its rules text.

    Args:
        conn: Open database.
        crate_id: Container id.
        name: Stored name.
        rules: Exact rules text, ``""`` for a blank row, or None for no row.
        space_id: Space id. 1 is Serato Library in the fixture.
        parent: Parent container id. The fixture root is 1.
        portable: ``portable_id``.
    """
    conn.execute(
        """
        INSERT INTO container
            (id, parent_id, name, type, list_order, space_id, time_added, expanded, portable_id)
        VALUES (?, ?, ?, 2, ?, ?, 1, 0, ?)
        """,
        (crate_id, parent, name, crate_id, space_id, portable),
    )
    if rules is not None:
        conn.execute(
            "INSERT INTO smart_crate_rules (container_id, version, rules) VALUES (?, 1, ?)",
            (crate_id, rules),
        )


def _plant(folder: Path, database: Path, when: float) -> Path:
    """Copy a database into a backup or sandbox folder.

    Args:
        folder: Destination directory. It is created.
        database: Source ``master.sqlite``.
        when: Mtime to store on the copy.

    Returns:
        The copied database.
    """
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / "master.sqlite"
    shutil.copyfile(database, target)
    os.utime(target, (when, when))
    return target


def _genre_scrate() -> bytes:
    """Build a portable smart crate whose one genre rule maps.

    Returns:
        ``.scrate`` bytes.
    """
    encoded = portable_smart._encode_rules(
        {
            "conjunction": "AND",
            "live_updates": True,
            "rules": [
                {
                    "type": "STRING",
                    "attribute": "genre",
                    "operation": "IS",
                    "version": 1,
                    "value": "House",
                }
            ],
        }
    )
    assert encoded is not None
    return portable_smart._file_bytes(encoded, ["Music/same-a.mp3"])


def _unknown_scrate() -> bytes:
    """Build a portable smart crate whose rule does not map.

    Returns:
        ``.scrate`` bytes with a plays comparison.
    """
    import drive_crates

    body = portable_smart._uint_chunk("urkt", 79)
    body += drive_crates._text("trft", "cond_greq_uint")
    body += portable_smart._uint_chunk("urpt", 1)
    rules = drive_crates._chunk("rart", portable_smart._bool_chunk(True))
    rules += drive_crates._chunk("rlut", portable_smart._bool_chunk(True))
    rules += drive_crates._chunk("rurt", body)
    return portable_smart._file_bytes(rules, ["Music/same-a.mp3"])


@contextmanager
def _install(
    root: Path,
    version: str,
    build: str,
    *,
    protect: str | None = None,
) -> Iterator[None]:
    """Point version detection at a plist in the temporary library.

    Args:
        root: Directory that receives the plist.
        version: ``CFBundleShortVersionString``.
        build: ``CFBundleVersion``.
        protect: ``off`` or ``on`` writes ``library_protect``. None leaves
            Protect Library unread.

    Yields:
        None.
    """
    info = root / "Info.plist"
    with info.open("wb") as handle:
        plistlib.dump(
            {"CFBundleShortVersionString": version, "CFBundleVersion": build},
            handle,
        )
    env = {"CRATECRAFT_APP_INFO": str(info)}
    if protect is not None:
        prefs = root / "Preferences.plist"
        with prefs.open("wb") as handle:
            plistlib.dump({"library_protect": 0 if protect == "off" else 1}, handle)
        env["CRATECRAFT_PREFERENCES"] = str(prefs)
    with mock.patch.dict(os.environ, env):
        yield


def _user_version(path: Path, version: int) -> None:
    """Store ``PRAGMA user_version`` in a database header.

    Args:
        path: Database file.
        version: Header value.
    """
    with closing(sqlite3.connect(path)) as conn:
        conn.execute(f"PRAGMA user_version = {int(version)}")


class ScanTests(unittest.TestCase):
    """The finder reads copies and does not touch the live library."""

    def setUp(self) -> None:
        """Keep settings, and the write gate, off this machine's library."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory."""
        self._env.stop()
        self._config.cleanup()

    def test_lists_a_missing_row_and_leaves_the_library_untouched(self) -> None:
        """A type-2 crate with no rules row is listed. A healthy crate is not.

        The scan does not create ``-wal`` or ``-shm``, does not change
        mtime, and does not add a file under the library folder.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT, portable=r"Music\Warmup.mp3")
                _add_smart(conn, 9, "Kept", OTHER)
                conn.execute(
                    """
                    INSERT INTO container_asset (id, asset_id, container_id, list_order)
                    VALUES (1, 1, 9, 0)
                    """
                )
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            before_names = _names(temp.root)
            before_mtime = temp.db.stat().st_mtime_ns
            before_bytes = temp.db.read_bytes()
            with mock.patch("safe_write.run", side_effect=AssertionError("scan wrote")):
                report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(temp.db.stat().st_mtime_ns, before_mtime)
            self.assertEqual(temp.db.read_bytes(), before_bytes)
            self.assertFalse(Path(str(temp.db) + "-wal").exists())
            self.assertFalse(Path(str(temp.db) + "-shm").exists())
            self.assertEqual(_names(temp.root), before_names)
            self.assertEqual(report["checked"], 1)
            self.assertEqual(report["written"], False)
            self.assertEqual(report["preview"], False)
            crates = report["crates"]
            self.assertEqual(len(crates), 1)  # type: ignore[arg-type]
            row = crates[0]  # type: ignore[index]
            self.assertEqual(row["id"], 8)
            self.assertEqual(row["name"], "Warmup")
            self.assertEqual(row["reason"], "missing_rules")
            self.assertEqual(row["restorable"], True)
            self.assertEqual(row["source"], "backup")
            self.assertNotIn("rules", row)
            self.assertIsNone(_rules(temp.db, 8))
            self.assertEqual(_rules(temp.db, 9), OTHER)

    def test_blank_rules_are_missing_and_a_healthy_crate_stays_quiet(self) -> None:
        """A blank rules row is broken. A crate that already has rules is not.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Blank", "")
                _add_smart(conn, 9, "Kept", KEPT)
            report = broken_smart.scan(temp.db, SPACE)
        self.assertEqual([item["id"] for item in report["crates"]], [8])  # type: ignore[index,union-attr]
        self.assertEqual(report["crates"][0]["reason"], "missing_rules")  # type: ignore[index]

    def test_newest_copy_that_still_has_rules_wins(self) -> None:
        """A newer backup with no rules loses to an older one that has them.

        A newer sandbox copy beats that backup. The chosen text is the one
        a later repair would write, checked here by restoring.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            _plant(temp.root / "Backups" / "serato-web-new", temp.db, 20)
            report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(report["crates"][0]["source"], "backup")  # type: ignore[index]
            broken_smart.apply(SPACE, [8])
            self.assertEqual(_rules(temp.db, 8), KEPT)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO smart_crate_rules (container_id, version, rules) VALUES (8, 1, ?)",
                    (NEWER,),
                )
            _plant(temp.root / "Backups" / "sandbox", temp.db, 30)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(report["crates"][0]["source"], "sandbox")  # type: ignore[index]
            broken_smart.apply(SPACE, [8])
            self.assertEqual(_rules(temp.db, 8), NEWER)

    def test_saved_rules_are_used_only_when_no_database_copy_has_them(self) -> None:
        """A portable ``.scrate`` fills in when backups have no rules.

        When a backup still has the rules text, including an unknown field,
        that text is kept and the ``.scrate`` is not rewritten over it.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", None)
            drive = temp.root / "stick"
            folder = drive / "_Serato_" / "SmartCrates"
            folder.mkdir(parents=True)
            (folder / "Warmup.scrate").write_bytes(_genre_scrate())
            spec = snapshots.DriveSpec(
                "stick",
                "Stick",
                drive / "_Serato_",
                drive,
                present=True,
            )
            with mock.patch("library._discovered_drives", return_value=[spec]):
                report = broken_smart.scan(temp.db, SPACE)
                self.assertEqual(report["crates"][0]["source"], "rules")  # type: ignore[index]
                self.assertEqual(report["crates"][0]["restorable"], True)  # type: ignore[index]
                broken_smart.apply(SPACE, [8])
            stored = _rules(temp.db, 8)
            self.assertIsNotNone(stored)
            parsed = json.loads(stored or "")
            self.assertEqual(parsed["rules"][0]["value"], "House")
            self.assertEqual(parsed["rules"][0]["attribute"], "genre")
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
                conn.execute(
                    "INSERT INTO smart_crate_rules (container_id, version, rules) VALUES (8, 1, ?)",
                    (KEPT,),
                )
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            with mock.patch("library._discovered_drives", return_value=[spec]):
                broken_smart.apply(SPACE, [8])
            self.assertEqual(_rules(temp.db, 8), KEPT)

    def test_unknown_scrate_rules_are_not_invented(self) -> None:
        """A ``.scrate`` this app cannot map stays unrestorable.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", None)
            folder = temp.root / "stick" / "_Serato_" / "SmartCrates"
            folder.mkdir(parents=True)
            (folder / "Warmup.scrate").write_bytes(_unknown_scrate())
            spec = snapshots.DriveSpec("stick", "Stick", folder.parent, folder, present=True)
            with mock.patch("library._discovered_drives", return_value=[spec]):
                report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(report["crates"][0]["restorable"], False)  # type: ignore[index]
            self.assertIsNone(report["crates"][0]["source"])  # type: ignore[index]
            with mock.patch("safe_write.run", side_effect=AssertionError("invented")):
                result = broken_smart.apply(SPACE, [8])
            self.assertFalse(result["written"])
            self.assertIsNone(_rules(temp.db, 8))

    def test_symlink_sandbox_is_not_followed(self) -> None:
        """A sandbox database that is a shortcut is not a rules source.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
            real = temp.root / "elsewhere"
            _plant(real, temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            sandbox = temp.root / "Backups" / "sandbox"
            sandbox.mkdir(parents=True)
            (sandbox / "master.sqlite").symlink_to(real / "master.sqlite")
            report = broken_smart.scan(temp.db, SPACE)
        self.assertEqual(report["crates"][0]["restorable"], False)  # type: ignore[index]

    def test_other_space_and_missing_table_are_not_repaired(self) -> None:
        """Prepare is a different space. A missing rules table is not created.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT, space_id=2, parent=2)
            report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(report["crates"], [])
            self.assertEqual(report["checked"], 0)
            with open_database(temp.db) as conn:
                conn.execute("DROP TABLE smart_crate_rules")
                _add_smart(conn, 9, "House", None)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            # The backup was taken after the drop, so it also has no table.
            # Put rules in a sandbox copy that still has the table.
            with open_database(temp.db) as conn:
                conn.execute(
                    """
                    CREATE TABLE smart_crate_rules (
                        container_id INTEGER PRIMARY KEY,
                        version INTEGER,
                        rules TEXT
                    )
                    """
                )
                conn.execute(
                    "INSERT INTO smart_crate_rules (container_id, version, rules) VALUES (9, 1, ?)",
                    (KEPT,),
                )
            _plant(temp.root / "Backups" / "sandbox", temp.db, 20)
            with open_database(temp.db) as conn:
                conn.execute("DROP TABLE smart_crate_rules")
            report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(report["crates"][0]["reason"], "missing_table")  # type: ignore[index]
            self.assertEqual(report["crates"][0]["restorable"], False)  # type: ignore[index]
            with mock.patch("safe_write.run", side_effect=AssertionError("created a table")):
                result = broken_smart.apply(SPACE, [9])
            self.assertFalse(result["written"])
            with closing(sqlite3.connect(f"file:{temp.db}?mode=ro&immutable=1", uri=True)) as conn:
                tables = {
                    row[0]
                    for row in conn.execute(
                        "SELECT name FROM sqlite_master WHERE type = 'table'"
                    )
                }
            self.assertNotIn("smart_crate_rules", tables)

    def test_filename_case_and_windows_portable_id_match(self) -> None:
        """A differently cased crate name still finds the backup rules.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "warmup", KEPT, portable=r"Music\Night.mp3")
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
                conn.execute(
                    "UPDATE container SET name = ?, portable_id = ? WHERE id = 8",
                    ("Warmup", r"music\night.mp3"),
                )
            report = broken_smart.scan(temp.db, SPACE)
        self.assertEqual(report["crates"][0]["restorable"], True)  # type: ignore[index]
        self.assertEqual(report["crates"][0]["source"], "backup")  # type: ignore[index]

    def test_unknown_space_and_missing_library(self) -> None:
        """A bad space and a missing database are refused.

        Returns:
            None.
        """
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(LibraryError):
                broken_smart.scan(temp.db, "Nope")
            with self.assertRaises(LibraryError) as caught:
                broken_smart.scan(Path(raw) / "master.sqlite", SPACE)
        self.assertEqual(caught.exception.status, 404)


class RepairTests(unittest.TestCase):
    """A confirmed repair writes only the selected rules and can be undone."""

    def setUp(self) -> None:
        """Keep the write-check files in a throwaway directory."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory."""
        self._env.stop()
        self._config.cleanup()

    def test_repairs_only_the_selected_crate_and_keeps_unknown_bytes(self) -> None:
        """One selected crate gets the backup text. Neighbors stay put.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT, portable="portable-warmup")
                _add_smart(conn, 10, "Other", None, portable="portable-other")
                _add_smart(conn, 9, "Kept", OTHER)
                conn.execute(
                    """
                    INSERT INTO container_asset (id, asset_id, container_id, list_order)
                    VALUES (1, 1, 9, 0)
                    """
                )
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id IN (8, 10)")
            held = broken_smart.action(
                {"action": "apply", "space": SPACE, "ids": [8, 10], "confirm": False}
            )
            self.assertTrue(held["preview"])
            self.assertFalse(held["written"])
            self.assertIsNone(_rules(temp.db, 8))
            result = broken_smart.apply(SPACE, [8])
            self.assertTrue(result["written"])
            self.assertEqual(result["snapshot_id"] is not None, True)
            self.assertEqual(_rules(temp.db, 8), KEPT)
            self.assertIsNone(_rules(temp.db, 10))
            self.assertEqual(_rules(temp.db, 9), OTHER)
            with closing(sqlite3.connect(f"file:{temp.db}?mode=ro&immutable=1", uri=True)) as conn:
                member = conn.execute(
                    "SELECT asset_id, container_id, list_order FROM container_asset"
                ).fetchall()
                kind = conn.execute("SELECT type, name FROM container WHERE id = 8").fetchone()
            self.assertEqual(member, [(1, 9, 0)])
            self.assertEqual(tuple(kind), (2, "Warmup"))
            again = broken_smart.scan(temp.db, SPACE)
            self.assertEqual([item["id"] for item in again["crates"]], [10])  # type: ignore[index,union-attr]

    def test_reread_after_an_outside_sync_does_not_write(self) -> None:
        """Deleting the rules again is a scan, not another repair.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            broken_smart.apply(SPACE, [8])
            self.assertEqual(_rules(temp.db, 8), KEPT)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            before = temp.db.stat().st_mtime_ns
            before_names = _names(temp.root)
            with mock.patch("safe_write.run", side_effect=AssertionError("rescan wrote")):
                report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(temp.db.stat().st_mtime_ns, before)
            self.assertEqual(_names(temp.root), before_names)
            self.assertEqual(report["crates"][0]["restorable"], True)  # type: ignore[index]
            self.assertIsNone(_rules(temp.db, 8))

    def test_undo_puts_the_missing_row_back(self) -> None:
        """Undo restores the preimage, so the rules row is gone again.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            result = broken_smart.apply(SPACE, [8])
            undone = broken_smart.undo(result["snapshot_id"])
            self.assertTrue(undone["written"])
            self.assertIsNone(_rules(temp.db, 8))

    def test_failed_readback_rolls_the_snapshot_back(self) -> None:
        """A rules row that does not match is removed again.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
                _add_smart(conn, 9, "Kept", OTHER)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            real = broken_smart._put_rules

            def bad(conn: sqlite3.Connection, crate_id: int, rules: str) -> None:
                real(conn, crate_id, rules + " ")

            with mock.patch("broken_smart._put_rules", side_effect=bad):
                with self.assertRaises(LibraryError) as caught:
                    broken_smart.apply(SPACE, [8])
            self.assertIn("put back", caught.exception.message)
            self.assertIn(broken_smart.STILL_MISSING, caught.exception.message)
            self.assertIsNone(_rules(temp.db, 8))
            self.assertEqual(_rules(temp.db, 9), OTHER)

    def test_serato_open_refuses_before_a_write(self) -> None:
        """A live Serato lock leaves the missing row missing.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            with mock.patch("library._process_is_serato", return_value=True):
                with self.assertRaises(SeratoOpen):
                    broken_smart.apply(SPACE, [8])
            self.assertIsNone(_rules(temp.db, 8))

    def test_unprobed_serato_5_1_does_not_write_and_the_scan_still_runs(self) -> None:
        """5.1.0 stays read-only until the recorded probe allows it.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            with _install(temp.root, "5.1.0", "51025", protect="off"):
                with mock.patch("snapshots.KNOWN_UNPROBED_VERSIONS", frozenset({"5.1.0"})):
                    report = broken_smart.scan(temp.db, SPACE)
                    self.assertEqual(report["crates"][0]["restorable"], True)  # type: ignore[index]
                    with self.assertRaises(LibraryError) as blocked:
                        broken_smart.apply(SPACE, [8])
                self.assertEqual(blocked.exception.status, 409)
                self.assertIsNone(_rules(temp.db, 8))
                _user_version(temp.db, 204)
                with self.assertRaises(LibraryError):
                    broken_smart.apply(SPACE, [8])
                self.assertIsNone(_rules(temp.db, 8))
                _user_version(temp.db, 203)
                result = broken_smart.apply(SPACE, [8])
            self.assertTrue(result["written"])
            self.assertEqual(_rules(temp.db, 8), KEPT)

    def test_empty_selection_and_bad_ids_do_not_write(self) -> None:
        """An empty id list writes nothing. A missing id list is refused.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", None)
            before = temp.db.read_bytes()
            empty = broken_smart.apply(SPACE, [])
            self.assertFalse(empty["written"])
            self.assertEqual(temp.db.read_bytes(), before)
            with self.assertRaises(LibraryError) as caught:
                broken_smart.action({"action": "apply", "space": SPACE, "confirm": True})
            self.assertEqual(caught.exception.status, 400)
            with self.assertRaises(LibraryError):
                broken_smart.action({"action": "apply", "space": SPACE, "confirm": True, "ids": ["8"]})
            self.assertEqual(temp.db.read_bytes(), before)

    def test_mirror_database_supplies_rules_without_changing_a_filled_copy(self) -> None:
        """``root.sqlite`` can be the source, and its own rules stay put.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
                conn.execute(
                    """
                    INSERT INTO location_container (container_id, location_id, external_container_id)
                    VALUES (8, 3, 8)
                    """
                )
            shutil.copyfile(temp.db, temp.root / "root.sqlite")
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            report = broken_smart.scan(temp.db, SPACE)
            self.assertEqual(report["crates"][0]["source"], "mirror")  # type: ignore[index]
            broken_smart.apply(SPACE, [8])
            self.assertEqual(_rules(temp.db, 8), KEPT)
            self.assertEqual(_rules(temp.root / "root.sqlite", 8), KEPT)

    def test_route_reads_and_a_confirmed_post_writes(self) -> None:
        """GET is the scan. POST apply without confirm does not write.

        Returns:
            None.
        """
        with TempLibrary() as temp, _install(temp.root, "4.0.10", "4010213"):
            with open_database(temp.db) as conn:
                _add_smart(conn, 8, "Warmup", KEPT)
            _plant(temp.root / "Backups" / "serato-web-old", temp.db, 10)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM smart_crate_rules WHERE container_id = 8")
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            host, port = httpd.server_address[:2]
            base = f"http://{host}:{port}/api/broken-smart"
            try:
                with urllib.request.urlopen(base + "?space=Serato%20Library", timeout=5) as response:
                    body = json.loads(response.read().decode("utf-8"))
                preview_body = json.dumps(
                    {"action": "preview", "space": SPACE, "ids": [8]}
                ).encode("utf-8")
                preview_request = urllib.request.Request(
                    base,
                    data=preview_body,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(preview_request, timeout=5) as response:
                    preview = json.loads(response.read().decode("utf-8"))
                self.assertIsNone(_rules(temp.db, 8))
                apply_body = json.dumps(
                    {"action": "apply", "space": SPACE, "ids": [8], "confirm": True}
                ).encode("utf-8")
                apply_request = urllib.request.Request(
                    base,
                    data=apply_body,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(apply_request, timeout=10) as response:
                    applied = json.loads(response.read().decode("utf-8"))
                self.assertEqual(_rules(temp.db, 8), KEPT)
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(base + "?space=Nope", timeout=5)
                caught.exception.close()
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join(timeout=5)
        self.assertEqual(caught.exception.code, 400)
        self.assertEqual(body["crates"][0]["id"], 8)
        self.assertTrue(preview["preview"])
        self.assertFalse(preview["written"])
        self.assertTrue(applied["written"])


if __name__ == "__main__":
    unittest.main()
