"""Session logs name Serato 4, Serato 5, or neither.

``tests/log_fixtures/captured-serato4`` keeps the glog line shape from a
Serato DJ Pro 4.0.10 session. ``captured-serato5`` keeps the same shape
from a 5.0.0 session. The other folders are spec-derived. A missing
folder leaves today's version gate alone. A log that does not name a dotted
version uses the existing unknown-version notice. Serato 5 writes when
Protect Library is off. The parser never writes a log.
"""

from __future__ import annotations

import os
import plistlib
import shutil
import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from unittest import mock

import files
import library
import serato_logs
import snapshots
from library import LibraryError
from tests.fixture import TempLibrary

FIXTURES = Path(__file__).resolve().parent / "log_fixtures"
MAC_MASTER = "/Users/dj/Library/Application Support/Serato/Library/master.sqlite"


def _logs(name: str) -> Path:
    """Return one fixture logs folder.

    Args:
        name: Folder under ``tests/log_fixtures``.

    Returns:
        The folder that ``parse_logs`` reads.
    """
    return FIXTURES / name


def _point(folder: Path) -> mock._patch:
    """Point ``SERATO_LIBRARY_LOGS`` at a folder for one test.

    Args:
        folder: Logs directory.

    Returns:
        A patch that restores the environment.
    """
    return mock.patch.dict(os.environ, {"SERATO_LIBRARY_LOGS": str(folder)})


class LogParserTests(unittest.TestCase):
    """Read the committed fixtures and refuse to follow or write them."""

    def test_captured_serato_4_log_names_version_and_live_master(self) -> None:
        """A redacted capture from Serato DJ Pro 4.0.10 names the live database.

        The file name, glog prefix, Product name line, Opening library line,
        ``Surface Version: 4.1``, and a later backup to
        ``master.sqlite.in-progress-backup`` keep the bytes captured from a
        Serato 4.0.10 (4010213) session. Home directory, host, and library
        UUID are placeholders. Surface Version is OpenGL, not Serato DJ.

        Returns:
            None.
        """
        folder = _logs("captured-serato4")
        before = sorted(path.name for path in folder.iterdir())
        stamps = {path.name: path.stat().st_mtime_ns for path in folder.iterdir()}
        read = serato_logs.parse_logs(folder)
        self.assertEqual(read.state, "parsed")
        self.assertEqual(read.version, "4.0.10")
        self.assertEqual(read.build, "4010213")
        self.assertNotEqual(read.version, "4.1")
        self.assertEqual(read.database, "master.sqlite")
        self.assertEqual(read.database_path, MAC_MASTER)
        self.assertEqual(read.log_name, "20261107-080127.265.log")
        self.assertFalse(read.downgrade)
        self.assertNotIn("Backups", read.database_path)
        self.assertEqual(before, sorted(path.name for path in folder.iterdir()))
        for path in folder.iterdir():
            self.assertEqual(path.stat().st_mtime_ns, stamps[path.name])

    def test_captured_serato_4_backup_suffix_is_not_the_database_path(self) -> None:
        """``master.sqlite.in-progress-backup`` is not a library path.

        Returns:
            None.
        """
        text = (
            "I20261107 08:01:27.880321 3994182016 :0] [Library] "
            "Opening library asynchronously with master database at "
            f"'{MAC_MASTER}' using SQLite version '3.36.0`.\n"
            "I20261107 08:01:33.975168 1842524160 :0] [Library] "
            f"Backing up database '{MAC_MASTER}' to "
            f"'{Path(MAC_MASTER).parent.as_posix()}/Backups/master.sqlite.in-progress-backup'\n"
            "I20261107 08:01:38.450914 1832202240 :0] [Library] "
            "Completed backup of library database to "
            f"'{Path(MAC_MASTER).parent.as_posix()}/Backups/"
            "master.sqlite-backup-20261107_080134-0500.zip'.\n"
        )
        self.assertEqual(serato_logs._library_path(text), MAC_MASTER)

    def test_captured_serato_5_log_names_version_and_live_master(self) -> None:
        """A redacted capture from Serato DJ Pro 5.0.0 names the live database.

        The file name, glog prefix, Product name line, Opening library line,
        and a later backup to ``master.sqlite.in-progress-backup`` keep the
        bytes captured from a Serato 5.0.0 (5001251) session. Home directory,
        host, and library UUID are placeholders. The backup suffix must not
        become the logged path.

        Returns:
            None.
        """
        before = sorted(path.name for path in _logs("captured-serato5").iterdir())
        stamps = {
            path.name: path.stat().st_mtime_ns for path in _logs("captured-serato5").iterdir()
        }
        read = serato_logs.parse_logs(_logs("captured-serato5"))
        self.assertEqual(read.state, "parsed")
        self.assertEqual(read.version, "5.0.0")
        self.assertEqual(read.build, "5001251")
        self.assertEqual(read.database, "master.sqlite")
        self.assertEqual(read.database_path, MAC_MASTER)
        self.assertEqual(read.log_name, "20261105-193811.11717.log")
        self.assertFalse(read.downgrade)
        self.assertNotIn("Backups", read.database_path)
        self.assertEqual(before, sorted(path.name for path in _logs("captured-serato5").iterdir()))
        for path in _logs("captured-serato5").iterdir():
            self.assertEqual(path.stat().st_mtime_ns, stamps[path.name])

    def test_captured_serato_5_backup_suffix_is_not_the_database_path(self) -> None:
        """``master.sqlite.in-progress-backup`` is not a library path.

        Returns:
            None.
        """
        text = (
            "I20261105 19:38:12.382961 4090929536 :0] [Library] "
            "Opening library asynchronously with master database at "
            f"'{MAC_MASTER}' using SQLite version '3.36.0`.\n"
            "I20261105 19:53:12.172672 1892020224 :0] [Library] "
            f"Backing up database '{MAC_MASTER}' to "
            f"'{Path(MAC_MASTER).parent.as_posix()}/Backups/master.sqlite.in-progress-backup'\n"
            "I20261105 19:53:17.602664 1879977984 :0] [Library] "
            "Completed backup of library database to "
            f"'{Path(MAC_MASTER).parent.as_posix()}/Backups/"
            "master.sqlite-backup-20261105_195313-0500.zip'.\n"
        )
        self.assertEqual(serato_logs._library_path(text), MAC_MASTER)

    def test_serato_4_fixture_names_master_sqlite(self) -> None:
        """A Serato 4 log names version 4.1.0 and master.sqlite.

        Returns:
            None.
        """
        before = sorted(path.name for path in _logs("serato4").iterdir())
        stamps = {path.name: path.stat().st_mtime_ns for path in _logs("serato4").iterdir()}
        read = serato_logs.parse_logs(_logs("serato4"))
        self.assertEqual(read.state, "parsed")
        self.assertEqual(read.version, "4.1.0")
        self.assertEqual(read.build, "4.1.0.1")
        self.assertEqual(read.database, "master.sqlite")
        self.assertEqual(read.database_path, MAC_MASTER)
        self.assertEqual(read.log_name, "20261001_101530.log")
        self.assertFalse(read.downgrade)
        self.assertEqual(before, sorted(path.name for path in _logs("serato4").iterdir()))
        for path in _logs("serato4").iterdir():
            self.assertEqual(path.stat().st_mtime_ns, stamps[path.name])

    def test_serato_5_fixture_uses_the_newest_log(self) -> None:
        """The newest Serato 5 log wins over an older Serato 4 log.

        Returns:
            None.
        """
        read = serato_logs.parse_logs(_logs("serato5"))
        self.assertEqual(read.version, "5.0.0")
        self.assertEqual(read.build, "5.0.0.1251")
        self.assertEqual(read.newest_version, "5.0.0")
        self.assertEqual(read.database, "master.sqlite")
        self.assertEqual(read.log_name, "20261019_153045.log")
        self.assertFalse(read.downgrade)

    def test_unknown_fixture_has_no_dotted_version(self) -> None:
        """A log that does not name Serato 4 or 5 is unknown.

        Returns:
            None.
        """
        read = serato_logs.parse_logs(_logs("unknown"))
        self.assertEqual(read.state, "unknown")
        self.assertEqual(read.version, "unknown")
        self.assertEqual(read.database, "")

    def test_missing_folder_and_empty_folder_are_missing(self) -> None:
        """No log files is the same as a folder that is not there.

        Returns:
            None.
        """
        self.assertEqual(serato_logs.parse_logs(_logs("missing")).state, "missing")
        self.assertEqual(serato_logs.parse_logs(_logs("does-not-exist")).state, "missing")
        with TempLibrary() as temp:
            empty = temp.root / "empty-logs"
            empty.mkdir()
            self.assertEqual(serato_logs.parse_logs(empty).state, "missing")
            blank = empty / "20260101_000000.log"
            blank.write_text("   \n", encoding="utf-8")
            self.assertEqual(serato_logs.parse_logs(empty).state, "missing")

    def test_downgrade_keeps_serato_5(self) -> None:
        """An older Serato 5 log wins over a newer Serato 4 log.

        Returns:
            None.
        """
        read = serato_logs.parse_logs(_logs("downgrade"))
        self.assertTrue(read.downgrade)
        self.assertEqual(read.version, "5.0.0")
        self.assertEqual(read.newest_version, "4.1.0")
        self.assertEqual(read.log_name, "20261020_120000.log")

    def test_version_only_log_has_no_database(self) -> None:
        """A version line without a [Library] path still names Serato 4.

        Returns:
            None.
        """
        read = serato_logs.parse_logs(_logs("version-only"))
        self.assertEqual(read.version, "4.0.9")
        self.assertEqual(read.build, "4.0.9.3")
        self.assertEqual(read.database, "")
        self.assertIsNone(read.mounted)

    def test_windows_path_and_volume_roots(self) -> None:
        """A quoted Windows path is the master database on drive C.

        Returns:
            None.
        """
        read = serato_logs.parse_logs(_logs("windows"))
        self.assertEqual(read.version, "4.2.0")
        self.assertEqual(read.build, "4.2.0.15")
        self.assertEqual(read.database, "master.sqlite")
        self.assertEqual(
            read.database_path,
            r"C:\Users\dj\AppData\Local\Serato\Library\master.sqlite",
        )
        self.assertEqual(serato_logs.volume_root(read.database_path), "C:\\")
        self.assertIsNone(serato_logs.volume_root(MAC_MASTER))
        unmounted = serato_logs.parse_logs(_logs("unmounted"))
        self.assertEqual(unmounted.database, "database V2")
        self.assertEqual(
            serato_logs.volume_root(unmounted.database_path),
            "/Volumes/serato-logs-missing-90",
        )
        self.assertIs(serato_logs.volume_mounted(unmounted.database_path, lambda _root: False), False)
        self.assertIs(serato_logs.volume_mounted(unmounted.database_path, lambda _root: True), True)
        self.assertFalse(Path("/Volumes/serato-logs-missing-90").exists())
        self.assertIs(unmounted.mounted, False)

    def test_a_letter_prefixed_version_is_unknown(self) -> None:
        """``v5.0`` is not a dotted version, so the log is unknown.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "Logs"
            folder.mkdir()
            (folder / "20261101_120000.log").write_text(
                "[Application] Serato DJ Pro v5.0\n[Library] ready\n",
                encoding="utf-8",
            )
            read = serato_logs.parse_logs(folder)
        self.assertEqual(read.state, "unknown")

    def test_a_long_log_is_read_from_both_ends(self) -> None:
        """The version is at the start and the database path is at the end.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "Logs"
            folder.mkdir()
            path = folder / "20261101_130000.log"
            head = "[Application] Serato DJ Pro 4.1.2 (build 4.1.2.9)\n"
            tail = "[Library] Opening database '/tmp/serato-long/master.sqlite'\n"
            pad = b"x" * (serato_logs._EDGE * 2 + 10)
            path.write_bytes(head.encode() + pad + tail.encode())
            read = serato_logs.parse_logs(folder)
        self.assertEqual(read.version, "4.1.2")
        self.assertEqual(read.database_path, "/tmp/serato-long/master.sqlite")

    def test_symlink_directory_and_symlink_file_are_skipped(self) -> None:
        """A shortcut to the logs, or a shortcut log, is not read.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            real = temp.root / "real"
            shutil.copytree(_logs("serato5"), real)
            link = temp.root / "link"
            link.symlink_to(real, target_is_directory=True)
            self.assertEqual(serato_logs.parse_logs(link).state, "missing")
            only = temp.root / "only"
            only.mkdir()
            (only / "20261019_153045.log").symlink_to(real / "20261019_153045.log")
            self.assertEqual(serato_logs.parse_logs(only).state, "missing")

    def test_library_path_comes_only_from_the_newest_log(self) -> None:
        """An older ``[Library]`` line does not name the database.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "Logs"
            folder.mkdir()
            (folder / "20261018_090000.log").write_text(
                "[Application] Serato DJ Pro 5.0.0\n"
                "[Library] Opening database '/Users/dj/Music/_Serato_/database V2'\n",
                encoding="utf-8",
            )
            (folder / "20261020_120000.log").write_text(
                "[Application] Serato DJ Pro 4.1.0 (build 4.1.0.1)\n"
                "Session started\n",
                encoding="utf-8",
            )
            read = serato_logs.parse_logs(folder)
        self.assertEqual(read.version, "5.0.0")
        self.assertTrue(read.downgrade)
        self.assertEqual(read.database, "")
        self.assertEqual(read.database_path, "")
        self.assertEqual(read.log_name, "20261020_120000.log")

    def test_parse_logs_is_cached_until_the_mtime_changes(self) -> None:
        """A second read uses the cache. A new mtime reads the file again.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "Logs"
            folder.mkdir()
            log = folder / "20261101_120000.log"
            log.write_text("[Application] Serato DJ Pro 4.0.1\n", encoding="utf-8")
            first = serato_logs.parse_logs(folder)
            kept = log.stat().st_mtime_ns
            log.write_text("[Application] Serato DJ Pro 5.0.0\n", encoding="utf-8")
            os.utime(log, ns=(kept, kept))
            second = serato_logs.parse_logs(folder)
            os.utime(log, ns=(kept + 1_000_000_000, kept + 1_000_000_000))
            third = serato_logs.parse_logs(folder)
        self.assertEqual(first.version, "4.0.1")
        self.assertEqual(second.version, "4.0.1")
        self.assertEqual(third.version, "5.0.0")

    def test_darwin_confirms_a_path_that_differs_only_by_case(self) -> None:
        """macOS treats ``MASTER.SQLITE`` as the same file. Linux does not.

        Returns:
            None.
        """
        master = Path("/Users/dj/Library/Application Support/Serato/Library/master.sqlite")
        logged = "/Users/dj/Library/Application Support/Serato/Library/MASTER.SQLITE"

        def is_file(self: Path) -> bool:
            del self
            return True

        def is_symlink(self: Path) -> bool:
            del self
            return False

        def resolve(self: Path, strict: bool = False) -> Path:
            del strict
            return self

        with (
            mock.patch.object(Path, "is_file", is_file),
            mock.patch.object(Path, "is_symlink", is_symlink),
            mock.patch.object(Path, "resolve", resolve),
        ):
            with mock.patch("serato_logs.sys.platform", "darwin"):
                self.assertTrue(serato_logs.confirms_library(logged, "master.sqlite", master))
            with mock.patch("serato_logs.sys.platform", "linux"):
                self.assertFalse(serato_logs.confirms_library(logged, "master.sqlite", master))

    def test_logged_path_confirms_only_this_master_file(self) -> None:
        """The same master file confirms. database V2 and a shortcut do not.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            master = library.MASTER
            self.assertTrue(
                serato_logs.confirms_library(str(master), "master.sqlite", master)
            )
            self.assertFalse(
                serato_logs.confirms_library(str(master), "database V2", master)
            )
            other = temp.root / "other.sqlite"
            other.write_bytes(b"nope")
            self.assertFalse(serato_logs.confirms_library(str(other), "master.sqlite", master))
            linked = temp.root / "link.sqlite"
            linked.symlink_to(master)
            self.assertFalse(serato_logs.confirms_library(str(linked), "master.sqlite", master))


class LogGateTests(unittest.TestCase):
    """The write gate follows the logs and leaves a missing folder alone."""

    def setUp(self) -> None:
        """Treat Serato as quit so a live session does not fail these cases.

        Returns:
            None.
        """
        patcher = mock.patch("snapshots.serato_dj_running", return_value=False)
        self.addCleanup(patcher.stop)
        patcher.start()

    def test_missing_and_empty_logs_match_today(self) -> None:
        """No logs folder keeps the installed Serato 4 library writable.

        Returns:
            None.
        """
        with TempLibrary():
            info = library.status()
            with _point(_logs("missing")):
                missing = library.status()
            empty = library.MASTER.parent / "no-logs"
            empty.mkdir()
            with _point(empty):
                blank = library.status()
        for body in (info, missing, blank):
            self.assertTrue(body["writable"])
            self.assertFalse(body["open"])
            self.assertIsNone(body["open_error"])
            self.assertNotIn("code", body)
            self.assertEqual(body["message"], "Serato is quit. Edits save to the library.")
            generation = body["generation"]
            assert isinstance(generation, dict)
            self.assertEqual(generation["source"], "fallback")
            self.assertEqual(generation["reason"], "fallback")
            self.assertEqual(generation["kind"], "serato4")
            self.assertEqual(generation["version"], "4.1.0")

    def test_relative_override_and_a_relocated_library_skip_real_logs(self) -> None:
        """A test library does not read a Serato 5 log under the home folder.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            home = temp.root / "home"
            logs = home / "Music" / "_Serato_" / "Logs"
            logs.mkdir(parents=True)
            shutil.copy(_logs("serato5") / "20261019_153045.log", logs / "20261019_153045.log")
            self.assertEqual(serato_logs.parse_logs(logs).version, "5.0.0")
            with mock.patch("pathlib.Path.home", return_value=home):
                info = library.status()
            with mock.patch.dict(os.environ, {"SERATO_LIBRARY_LOGS": "logs"}):
                relative = library.status()
        for body in (info, relative):
            self.assertTrue(body["writable"])
            generation = body["generation"]
            assert isinstance(generation, dict)
            self.assertEqual(generation["source"], "fallback")

    def test_serato_4_log_allows_this_master_and_a_stale_line_does_not_block_reads(self) -> None:
        """A matching Serato 4 log stays writable when Serato is not running.

        The log says the database is open. That line is only a hint. The
        process list and the lock still decide whether a read is blocked.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "Logs"
            folder.mkdir()
            text = (_logs("serato4") / "20261001_101530.log").read_text(encoding="utf-8")
            text = text.replace(MAC_MASTER, str(library.MASTER))
            (folder / "20261001_101530.log").write_text(text, encoding="utf-8")
            with _point(folder):
                info = library.status()
                with closing(library.read_conn()) as conn:
                    count = conn.execute("SELECT COUNT(*) FROM asset").fetchone()
            self.assertIsNotNone(count)
            assert count is not None
            self.assertGreater(int(count[0]), 0)
        self.assertFalse(info["open"])
        self.assertTrue(info["writable"])
        self.assertFalse(info["serato_running"])
        self.assertNotIn("code", info)
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["kind"], "serato4")
        self.assertEqual(generation["source"], "log")
        self.assertEqual(generation["reason"], "log")
        self.assertIs(generation["confirmed"], True)
        self.assertIn("Database is open", text)

    def test_unknown_log_uses_the_existing_unknown_notice(self) -> None:
        """An unreadable log refuses writes with ``serato_version_unknown``.

        Returns:
            None.
        """
        with TempLibrary():
            with _point(_logs("unknown")):
                info = library.status()
                with self.assertRaises(LibraryError) as caught:
                    library.begin_write()
            self.assertFalse((library.MASTER.parent / "Backups").exists())
        self.assertFalse(info["writable"])
        self.assertEqual(info["code"], "serato_version_unknown")
        self.assertIn("build unknown", info["message"])
        self.assertIn("version is unknown", str(caught.exception))
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["kind"], "unknown")
        self.assertEqual(generation["reason"], "unknown")

    def test_serato_5_log_stays_read_only_on_every_write_path(self) -> None:
        """A Serato 5 log with unknown Protect Library refuses writes.

        The fixture names another master file, so the generation reason is
        mismatch. Reads still work.

        Returns:
            None.
        """
        with TempLibrary():
            with _point(_logs("serato5")):
                info = library.status()
                self._assert_writes_refused("Protect Library is unknown")
                with closing(library.read_conn()) as conn:
                    conn.execute("SELECT 1")
                store = snapshots.SnapshotStore(library.MASTER, drives=[])
                with self.assertRaises(snapshots.SnapshotBlocked) as blocked:
                    store.restore("not-a-snapshot")
        self.assertFalse(info["writable"])
        self.assertFalse(info["open"])
        self.assertIn("Serato 5.0.0", str(info["message"]))
        self.assertIn("Protect Library is unknown", str(info["message"]))
        self.assertNotIn("code", info)
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["kind"], "serato5")
        self.assertEqual(generation["reason"], "mismatch")
        self.assertIs(generation["confirmed"], False)
        self.assertIn("Protect Library is unknown", str(blocked.exception))

    def test_serato_5_log_writes_when_protect_is_off_and_this_master_matches(self) -> None:
        """A matching Serato 5 log saves a crate when Protect Library is off.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            folder = temp.root / "Logs"
            folder.mkdir()
            text = (_logs("serato5") / "20261019_153045.log").read_text(encoding="utf-8")
            text = text.replace(MAC_MASTER, str(library.MASTER))
            (folder / "20261019_153045.log").write_text(text, encoding="utf-8")
            prefs = temp.root / "com.serato.seratodj.plist"
            with prefs.open("wb") as handle:
                plistlib.dump({"library_protect": 0}, handle)
            with mock.patch.dict(
                os.environ,
                {
                    "SERATO_LIBRARY_LOGS": str(folder),
                    "SERATO_LIBRARY_PREFERENCES": str(prefs),
                },
            ):
                info = library.status()
                created = library.crate_action({"action": "create", "name": "Warmup"})
        self.assertTrue(info["writable"])
        self.assertEqual(created["name"], "Warmup")
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["kind"], "serato5")
        self.assertEqual(generation["reason"], "log")
        self.assertIs(generation["confirmed"], True)

    def test_serato_5_protect_off_still_refuses_a_mismatched_log(self) -> None:
        """Protect Library off does not write when the log names another file.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            prefs = temp.root / "com.serato.seratodj.plist"
            with prefs.open("wb") as handle:
                plistlib.dump({"library_protect": 0}, handle)
            with mock.patch.dict(
                os.environ,
                {
                    "SERATO_LIBRARY_LOGS": str(_logs("serato5")),
                    "SERATO_LIBRARY_PREFERENCES": str(prefs),
                },
            ):
                info = library.status()
                with self.assertRaises(LibraryError) as caught:
                    library.begin_write()
        self.assertFalse(info["writable"])
        self.assertEqual(info["code"], "library_log_unconfirmed")
        self.assertIn("does not confirm this library file", str(caught.exception).lower())
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["reason"], "mismatch")

    def test_downgrade_and_installed_serato_5_stay_read_only(self) -> None:
        """A newer Serato 4 log does not reopen writes after Serato 5.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with _point(_logs("downgrade")):
                downgraded = library.status()
            folder = temp.root / "Logs"
            folder.mkdir()
            text = (_logs("serato4") / "20261001_101530.log").read_text(encoding="utf-8")
            text = text.replace(MAC_MASTER, str(library.MASTER))
            (folder / "20261001_101530.log").write_text(text, encoding="utf-8")
            plist = temp.root / "Serato5.plist"
            with plist.open("wb") as handle:
                plistlib.dump(
                    {"CFBundleShortVersionString": "5.0.0", "CFBundleVersion": "5.0.0.1"},
                    handle,
                )
            with mock.patch.dict(
                os.environ,
                {
                    "SERATO_LIBRARY_LOGS": str(folder),
                    "SERATO_LIBRARY_APP_INFO": str(plist),
                },
            ):
                installed = library.status()
        for body in (downgraded, installed):
            self.assertFalse(body["writable"])
            self.assertIn("Serato 5.0.0", str(body["message"]))
            self.assertIn("Protect Library is unknown", str(body["message"]))
        assert isinstance(downgraded["generation"], dict)
        assert isinstance(installed["generation"], dict)
        self.assertEqual(downgraded["generation"]["reason"], "downgrade")
        self.assertEqual(downgraded["generation"]["newest_version"], "4.1.0")
        self.assertEqual(installed["generation"]["reason"], "installed")
        self.assertEqual(installed["generation"]["newest_version"], "4.1.0")

    def test_unmounted_and_other_database_do_not_confirm_this_file(self) -> None:
        """database V2 on a missing volume refuses a Serato 4 write.

        Returns:
            None.
        """
        with TempLibrary():
            with _point(_logs("unmounted")):
                info = library.status()
                with self.assertRaises(LibraryError):
                    library.begin_write()
        self.assertFalse(info["writable"])
        self.assertEqual(info["code"], "library_log_unconfirmed")
        params = info["params"]
        assert isinstance(params, dict)
        self.assertEqual(params["database"], "database V2")
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["reason"], "unmounted")
        self.assertEqual(generation["kind"], "serato4")
        self.assertIs(generation["mounted"], False)

    def test_unknown_install_stays_unknown_when_the_log_names_serato_4(self) -> None:
        """Serato 4 in the log does not unlock an unreadable install.

        One log names this ``master.sqlite``. The other has no ``[Library]``
        line. Both keep ``serato_version_unknown``.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            bad = temp.root / "not-a-plist"
            bad.write_bytes(b"nope")
            named_dir = temp.root / "with-library"
            named_dir.mkdir()
            (named_dir / "20261101_120000.log").write_text(
                "[Application] Serato DJ Pro 4.0.1\n"
                f"[Library] Opening database '{library.MASTER}'\n",
                encoding="utf-8",
            )
            bare_dir = temp.root / "version-only"
            bare_dir.mkdir()
            (bare_dir / "20261101_120001.log").write_text(
                "[Application] Serato DJ Pro 4.0.1\n",
                encoding="utf-8",
            )
            base_env = {"SERATO_LIBRARY_APP_INFO": str(bad)}
            with mock.patch.dict(os.environ, {**base_env, "SERATO_LIBRARY_LOGS": str(named_dir)}):
                named = library.status()
                with self.assertRaises(LibraryError) as caught:
                    library.begin_write()
            with mock.patch.dict(os.environ, {**base_env, "SERATO_LIBRARY_LOGS": str(bare_dir)}):
                bare = library.status()
                with self.assertRaises(LibraryError) as bare_write:
                    library.begin_write()
        for body in (named, bare):
            self.assertFalse(body["writable"])
            self.assertEqual(body["code"], "serato_version_unknown")
            self.assertIn("(build unknown)", str(body["message"]))
            generation = body["generation"]
            assert isinstance(generation, dict)
            self.assertEqual(generation["version"], "unknown")
            self.assertEqual(generation["kind"], "unknown")
            self.assertEqual(generation["reason"], "installUnknown")
        self.assertIn("version is unknown", str(caught.exception))
        self.assertIn("version is unknown", str(bare_write.exception))
        named_generation = named["generation"]
        bare_generation = bare["generation"]
        assert isinstance(named_generation, dict)
        assert isinstance(bare_generation, dict)
        self.assertEqual(named_generation["database"], "master.sqlite")
        self.assertIs(named_generation["confirmed"], True)
        self.assertEqual(bare_generation["database"], "")
        self.assertIsNone(bare_generation["confirmed"])

    def test_version_only_log_uses_the_logged_serato_4(self) -> None:
        """No [Library] line keeps today's write rule and records the version.

        Returns:
            None.
        """
        with TempLibrary():
            with _point(_logs("version-only")):
                info = library.status()
        self.assertTrue(info["writable"])
        self.assertFalse(info["open"])
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["source"], "version")
        self.assertEqual(generation["reason"], "version")
        self.assertEqual(generation["version"], "4.0.9")
        self.assertEqual(generation["kind"], "serato4")

    def test_open_error_still_carries_generation(self) -> None:
        """A failed open stays busy and still reports the generation.

        Returns:
            None.
        """
        with TempLibrary():
            with mock.patch.object(
                library, "read_conn", side_effect=sqlite3.OperationalError("disk I/O error")
            ):
                info = library.status()
        self.assertTrue(info["open"])
        self.assertFalse(info["writable"])
        self.assertEqual(info["open_error"], "disk I/O error")
        generation = info["generation"]
        assert isinstance(generation, dict)
        self.assertEqual(generation["source"], "fallback")

    def _assert_writes_refused(self, needle: str) -> None:
        """Raise on each write entry and require the refusal text.

        Args:
            needle: Text every refusal must contain.
        """
        with self.assertRaises(LibraryError) as first:
            library.begin_write()
        self.assertIn(needle, str(first.exception))
        with self.assertRaises(LibraryError) as saved:
            library.save_track(1, {"comments": "nope"})
        self.assertIn(needle, str(saved.exception))
        with self.assertRaises(LibraryError) as created:
            library.crate_action({"action": "create", "name": "New crate"})
        self.assertIn(needle, str(created.exception))
        with self.assertRaises(LibraryError) as imported:
            library.import_m3u("Serato Library", None, "Imported", "/music/night.mp3\n")
        self.assertIn(needle, str(imported.exception))
        with self.assertRaises(LibraryError) as changed:
            files.execute({"action": "rename", "confirm": True, "path": "/music/a.mp3", "name": "b.mp3"})
        self.assertIn(needle, str(changed.exception))
        self.assertFalse((library.MASTER.parent / "Backups").exists())


if __name__ == "__main__":
    unittest.main()
