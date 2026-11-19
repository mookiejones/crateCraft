"""Scans, health checks, and dry reads leave WAL sidecars and mtime alone (#360).

Serato keeps ``master.sqlite`` in WAL mode. Opening that file with only
``mode=ro`` recreates ``-wal`` and ``-shm`` after a checkpoint, which
looks like an outside change. The cases use a temporary library. They do
not open a live Serato database.
"""

from __future__ import annotations

import hashlib
import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from unittest import mock

import file_scan
import gig_check
import library
import library_health
import server
from snapshots import DriveSpec, SnapshotStore
from tests.fixture import TempLibrary


def _tree_stamp(folder: Path) -> dict[str, tuple[str, int]]:
    """Hash and mtime every file in a library folder.

    Args:
        folder: Directory that holds ``master.sqlite``.

    Returns:
        File name to ``(sha256, mtime_ns)``. Directories are skipped.
    """
    stamp: dict[str, tuple[str, int]] = {}
    for path in sorted(folder.iterdir()):
        if not path.is_file():
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        stamp[path.name] = (digest, path.stat().st_mtime_ns)
    return stamp


def _checkpoint_wal(database: Path) -> None:
    """Switch a library to WAL and drop the sidecar files.

    Args:
        database: ``master.sqlite`` that already exists.

    The journal mode stays WAL. A full checkpoint then removes ``-wal``
    and ``-shm``, which is the state a live ``mode=ro`` open would turn
    back into sidecars.
    """
    with closing(sqlite3.connect(database)) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.commit()
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    for suffix in ("-wal", "-shm", "-journal"):
        sidecar = Path(str(database) + suffix)
        if sidecar.exists():
            sidecar.unlink()


def _quiet_store(master: Path) -> SnapshotStore:
    """Return a snapshot store that ignores live Serato processes.

    Args:
        master: Temporary ``master.sqlite``.

    Returns:
        Store whose process checks are empty.
    """
    music = master.parent / "music"
    serato = music / "_Serato_"
    serato.mkdir(parents=True)
    store = SnapshotStore(
        master,
        [
            DriveSpec(
                drive_id="tour",
                label="Tour",
                serato_root=serato,
                music_root=music,
                role="external",
                present=True,
            )
        ],
    )
    store.serato_running = lambda: False
    store.process_names = lambda: []
    return store


class CheckpointedWalOpenTests(unittest.TestCase):
    """A read of a checkpointed WAL library must not recreate sidecars."""

    def test_open_read_only_leaves_mtime_and_sidecars_untouched(self) -> None:
        """``gig_check.open_read_only`` does not create ``-wal`` or ``-shm``.

        Returns:
            None. The test fails if a sidecar appears or mtime moves.
        """
        with TempLibrary() as temp:
            _checkpoint_wal(temp.db)
            before = _tree_stamp(temp.root)
            self.assertEqual(list(before), ["master.sqlite"])
            conn = gig_check.open_read_only(temp.db)
            try:
                rows = conn.execute("SELECT COUNT(*) FROM asset").fetchone()
                self.assertEqual(int(rows[0]), 2)
            finally:
                conn.close()
            self.assertEqual(_tree_stamp(temp.root), before)

    def test_read_conn_leaves_mtime_and_sidecars_untouched(self) -> None:
        """``library.read_conn`` does not create ``-wal`` or ``-shm``.

        Returns:
            None. The test fails if a sidecar appears or mtime moves.
        """
        with TempLibrary() as temp:
            _checkpoint_wal(temp.db)
            before = _tree_stamp(temp.root)
            with closing(library.read_conn(temp.db)) as conn:
                rows = conn.execute("SELECT COUNT(*) FROM asset").fetchone()
                self.assertEqual(int(rows[0]), 2)
            self.assertEqual(_tree_stamp(temp.root), before)

    def test_read_conn_close_survives_a_listing_permission_error(self) -> None:
        """Temp-copy cleanup must not raise if ``os.scandir`` is refused.

        Returns:
            None. The test fails if ``close()`` raises ``PermissionError``.
        """
        with TempLibrary() as temp:
            conn = library.read_conn(temp.db)
            with mock.patch("os.scandir", side_effect=PermissionError("listing")):
                conn.close()

    def test_server_connect_leaves_mtime_and_sidecars_untouched(self) -> None:
        """``server.connect`` does not create ``-wal`` or ``-shm``.

        Returns:
            None. The test fails if a sidecar appears or mtime moves.
        """
        with TempLibrary() as temp:
            _checkpoint_wal(temp.db)
            before = _tree_stamp(temp.root)
            with closing(server.connect()) as conn:
                rows = conn.execute("SELECT COUNT(*) FROM asset").fetchone()
                self.assertEqual(int(rows[0]), 2)
            self.assertEqual(_tree_stamp(temp.root), before)

    def test_full_scan_leaves_mtime_and_sidecars_untouched(self) -> None:
        """A full file scan leaves the database files as they were.

        Returns:
            None. The test fails if the scan creates a sidecar or moves mtime.
        """
        with TempLibrary() as temp:
            _checkpoint_wal(temp.db)
            before = _tree_stamp(temp.root)
            report = file_scan.scan(temp.db, "Serato Library", depth=file_scan.FULL)
            self.assertEqual(report["depth"], file_scan.FULL)
            self.assertEqual(report["not_found"], 2)
            self.assertEqual(_tree_stamp(temp.root), before)

    def test_health_report_leaves_mtime_and_sidecars_untouched(self) -> None:
        """A health report leaves the database files as they were.

        Returns:
            None. The test fails if the report creates a sidecar or moves mtime.
        """
        with TempLibrary() as temp:
            _checkpoint_wal(temp.db)
            before = _tree_stamp(temp.root)
            payload = library_health.report(temp.db, "Serato Library")
            self.assertEqual(payload["checked"], 2)
            self.assertEqual(_tree_stamp(temp.root), before)


class LiveWalOpenTests(unittest.TestCase):
    """A read still sees rows that exist only in ``-wal``."""

    def test_open_read_only_sees_uncheckpointed_rows_without_touching_files(self) -> None:
        """Live WAL rows stay visible, and the folder stamp stays put.

        Returns:
            None. The test fails if the extra row is missing or a sidecar
            hash or mtime changes.
        """
        with TempLibrary() as temp:
            writer = sqlite3.connect(temp.db)
            try:
                writer.setconfig(sqlite3.SQLITE_DBCONFIG_NO_CKPT_ON_CLOSE, True)
                writer.execute("PRAGMA journal_mode=WAL")
                writer.execute("PRAGMA wal_autocheckpoint=0")
                writer.execute(
                    """
                    INSERT INTO asset (id, name, artist, file_name, portable_id)
                    VALUES (99, 'Wal Only', 'DJ', 'wal-only.mp3', 'Music/wal-only.mp3')
                    """
                )
                writer.execute(
                    "INSERT INTO space_asset (id, asset_id, space_id) VALUES (99, 99, 1)"
                )
                writer.commit()
                before = _tree_stamp(temp.root)
                self.assertIn("master.sqlite-wal", before)
                conn = gig_check.open_read_only(temp.db)
                try:
                    names = [
                        str(row[0])
                        for row in conn.execute("SELECT name FROM asset ORDER BY id")
                    ]
                finally:
                    conn.close()
                self.assertIn("Wal Only", names)
                self.assertEqual(_tree_stamp(temp.root), before)
            finally:
                # TempLibrary.__exit__ checks /proc before unittest addCleanup.
                writer.close()


class OutsideChangeReadTests(unittest.TestCase):
    """Our own reads must not look like an outside Serato-folder write."""

    def test_full_scan_does_not_trip_the_outside_change_poll(self) -> None:
        """A scan after a remembered fingerprint does not snapshot.

        Returns:
            None. The test fails if ``poll`` treats the scan as an outside
            change.
        """
        with TempLibrary() as temp:
            _checkpoint_wal(temp.db)
            store = _quiet_store(temp.db)
            store.take("manual", "Before the scan.")
            store.rebase_fingerprint()
            file_scan.scan(temp.db, "Serato Library", depth=file_scan.FULL)
            self.assertIsNone(store.poll())


class WriteStepStillReadWriteTests(unittest.TestCase):
    """The write path still opens the live database for writing."""

    def test_begin_write_opens_the_live_file_without_mode_ro(self) -> None:
        """``begin_write`` still connects to the live path, not a URI.

        Returns:
            None. The test fails if the write open is switched to ``mode=ro``.
        """
        source = Path(__file__).resolve().parents[1].joinpath("library.py").read_text(
            encoding="utf-8"
        )
        self.assertIn("conn = sqlite3.connect(Path(MASTER), timeout=1)", source)
        self.assertNotIn("sqlite3.connect(f\"file:{MASTER}?mode=ro\"", source)

    def test_open_read_only_rejects_writes(self) -> None:
        """A scan connection cannot UPDATE even after the WAL-safe open.

        Returns:
            None. The test fails if UPDATE succeeds.
        """
        with TempLibrary() as temp:
            _checkpoint_wal(temp.db)
            conn = gig_check.open_read_only(temp.db)
            try:
                with self.assertRaises(sqlite3.OperationalError):
                    conn.execute("UPDATE asset SET name = 'Changed' WHERE id = 1")
            finally:
                conn.close()
