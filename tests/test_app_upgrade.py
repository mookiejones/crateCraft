"""Snapshot the library before a crateCraft version change.

The cases use a temporary library. They do not open a live Serato
database.
"""

from __future__ import annotations

import json
import os
import plistlib
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import app_config
import app_upgrade
import library
import server
import snapshots
from library import LibraryError
from snapshots import DriveSpec, SnapshotStore
from tests.fixture import TempLibrary

_BLOCK = (
    "A snapshot before this crateCraft update could not be saved. "
    "Library writes stay off until that snapshot succeeds."
)


def _store(temp: TempLibrary) -> SnapshotStore:
    """Open a quiet store on one empty drive beside a temporary library.

    Args:
        temp: Library whose ``master.sqlite`` already exists.

    Returns:
        A store that does not ask the machine whether Serato is running.
    """
    music = temp.root / "music"
    serato = music / "_Serato_"
    serato.mkdir(parents=True)
    store = SnapshotStore(temp.db, [DriveSpec(
        drive_id="tour",
        label="Tour",
        serato_root=serato,
        music_root=music,
        role="external",
        present=True,
    )])
    store.serato_running = lambda: False
    store.process_names = lambda: []
    return store


def _serato4(root: Path) -> dict[str, str | None]:
    """Point version detection at a Serato 4 plist in the temp directory.

    Args:
        root: Temporary directory.

    Returns:
        Environment for ``mock.patch.dict``. A missing preferences path
        is removed so the machine plist is not read.
    """
    info = root / "Info.plist"
    info.write_bytes(plistlib.dumps({
        "CFBundleShortVersionString": "4.0.10",
        "CFBundleVersion": "4.0.10.1",
    }))
    return {"CRATECRAFT_APP_INFO": str(info), "CRATECRAFT_PREFERENCES": None}


class AppUpgradeSnapshotTests(unittest.TestCase):
    """Record a crateCraft version, and snapshot only when it changes."""

    def setUp(self) -> None:
        """Drop a write block left by another test.

        Returns:
            None.
        """
        snapshots.clear_library_write_block()

    def tearDown(self) -> None:
        """Drop a write block this test set.

        Returns:
            None.
        """
        snapshots.clear_library_write_block()

    def test_first_seen_version_records_and_does_not_snapshot(self) -> None:
        """Record the first crateCraft version and leave the library unsaved.

        A Serato version already stored in ``observed_version`` is not this
        app's version.

        Returns:
            None. The test fails if a snapshot is taken or the app version
            is stored in the Serato version key.
        """
        with TempLibrary() as temp:
            store = _store(temp)
            store._save_state({
                "observed_version": "4.0.10",
                "observed_build": "4.0.10.1",
            })
            env = _serato4(temp.root)
            preferences = env.pop("CRATECRAFT_PREFERENCES")
            with mock.patch.dict(os.environ, env, clear=False):
                os.environ.pop("CRATECRAFT_PREFERENCES", None)
                if preferences is not None:
                    os.environ["CRATECRAFT_PREFERENCES"] = preferences
                self.assertIsNone(store.check_app_upgrade("1.0.0"))
                self.assertEqual(store.list_snapshots(), [])
                state = store._load_state()
                self.assertEqual(state.get("cratecraft_version"), "1.0.0")
                self.assertEqual(state.get("observed_version"), "4.0.10")
                self.assertIsNone(store.check_app_upgrade("1.0.0"))
                self.assertEqual(store.list_snapshots(), [])

    def test_version_change_snapshots_before_the_state_key_updates(self) -> None:
        """Save ``before update to`` the new version, then record that version.

        ``observed_version`` already holding the new app version must not
        skip the snapshot.

        Returns:
            None. The test fails if the state key changes before the
            snapshot, or if the library file changes.
        """
        with TempLibrary() as temp:
            store = _store(temp)
            store._save_state({
                "cratecraft_version": "1.0.0",
                "observed_version": "1.1.0",
                "observed_build": "1.1.0",
            })
            original = store.take
            seen: list[str] = []

            def wrapped(trigger: str, reason: str, source: str | None = None) -> snapshots.SnapshotInfo:
                state = store._load_state()
                self.assertEqual(state.get("cratecraft_version"), "1.0.0")
                self.assertEqual(trigger, "app-upgrade")
                self.assertEqual(reason, "before update to 1.1.0")
                seen.append(reason)
                return original(trigger, reason, source)

            store.take = wrapped  # type: ignore[method-assign]
            before = temp.db.read_bytes()
            env = _serato4(temp.root)
            env.pop("CRATECRAFT_PREFERENCES")
            with mock.patch.dict(os.environ, env, clear=False):
                os.environ.pop("CRATECRAFT_PREFERENCES", None)
                saved = store.check_app_upgrade("1.1.0")
            assert saved is not None
            self.assertEqual(seen, ["before update to 1.1.0"])
            self.assertEqual(saved["trigger"], "app-upgrade")
            self.assertEqual(saved["reason"], "before update to 1.1.0")
            self.assertEqual(store._load_state().get("cratecraft_version"), "1.1.0")
            self.assertEqual(temp.db.read_bytes(), before)
            self.assertEqual(len(store.list_snapshots()), 1)
            self.assertIsNone(store.check_app_upgrade("1.1.0"))
            self.assertEqual(len(store.list_snapshots()), 1)

    def test_failed_take_does_not_record_the_version_and_begin_write_refuses(self) -> None:
        """Keep the old version and refuse a library write when the snapshot fails.

        Returns:
            None. The test fails if the new version is recorded, if the
            database changes, or if ``begin_write`` does not raise 409.
        """
        with TempLibrary() as temp:
            store = _store(temp)
            store._save_state({"cratecraft_version": "1.0.0"})
            before = temp.db.read_bytes()

            def boom(trigger: str, reason: str, source: str | None = None) -> snapshots.SnapshotInfo:
                del trigger, reason, source
                self.assertEqual(store._load_state().get("cratecraft_version"), "1.0.0")
                raise snapshots.SnapshotError("The snapshot was not finished.")

            store.take = boom  # type: ignore[method-assign]
            with self.assertRaises(snapshots.SnapshotError):
                store.check_app_upgrade("1.1.0")
            self.assertEqual(store._load_state().get("cratecraft_version"), "1.0.0")
            self.assertEqual(store.list_snapshots(), [])
            self.assertEqual(snapshots.library_write_block(), _BLOCK)
            self.assertEqual(temp.db.read_bytes(), before)
            with mock.patch.object(library, "status", return_value={"open": False}):
                with self.assertRaises(LibraryError) as caught:
                    library.begin_write()
            self.assertEqual(caught.exception.status, 409)
            self.assertEqual(caught.exception.message, _BLOCK)
            self.assertEqual(temp.db.read_bytes(), before)

    def test_missing_library_records_version_and_creates_no_database(self) -> None:
        """Record a version change when ``master.sqlite`` is absent.

        Returns:
            None. The test fails if a database file is created or a
            snapshot is taken.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            master = root / "Library" / "master.sqlite"
            self.assertFalse(master.exists())
            old = library.MASTER
            library.MASTER = master
            try:
                store = SnapshotStore(master, [], recover=False)
                self.assertIsNone(store.check_app_upgrade("1.0.0"))
                self.assertIsNone(store.check_app_upgrade("2.0.0"))
                self.assertEqual(store._load_state().get("cratecraft_version"), "2.0.0")
                self.assertEqual(store.list_snapshots(), [])
                self.assertFalse(master.exists())
                self.assertEqual(list(root.rglob("*.sqlite")), [])
            finally:
                library.MASTER = old


class AppUpgradeServeTests(unittest.TestCase):
    """Call the upgrade check from ``serve`` before a library write."""

    def setUp(self) -> None:
        """Drop a write block left by another test.

        Returns:
            None.
        """
        snapshots.clear_library_write_block()

    def tearDown(self) -> None:
        """Stop a watch thread and drop a write block.

        Returns:
            None.
        """
        snapshots.stop_watch()
        snapshots.clear_library_write_block()

    def test_serve_checks_app_upgrade_before_a_write_or_the_watch(self) -> None:
        """Snapshot the app version before recovery and before the watch.

        Returns:
            None. The test fails if the upgrade check is skipped or runs
            after recovery or the watch.
        """
        calls: list[str] = []

        def check_app(version: str) -> None:
            self.assertEqual(version, app_config.APP_VERSION)
            calls.append("app")

        def recover() -> str:
            calls.append("recover")
            return "clear"

        def check_version() -> None:
            calls.append("version")

        def start_watch() -> None:
            calls.append("watch")

        with TempLibrary() as temp:
            config = temp.root / "config"
            config.mkdir()
            env = {app_config.CONFIG_ENV: str(config)}
            with mock.patch.dict(os.environ, env, clear=False):
                with mock.patch.object(snapshots, "current_store") as store:
                    store.return_value.check_app_upgrade.side_effect = check_app
                    store.return_value.check_version.side_effect = check_version
                    with mock.patch.object(server.files, "recover_interrupted", side_effect=recover):
                        with mock.patch.object(snapshots, "start_watch", side_effect=start_watch):
                            httpd = server.serve(0)
                            httpd.server_close()
        self.assertEqual(calls, ["app", "recover", "version", "watch"])

    def test_serve_records_the_version_when_the_library_file_is_missing(self) -> None:
        """Record the version and do not create ``master.sqlite``.

        Returns:
            None. The test fails if the database appears or the watch starts.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            config = root / "config"
            config.mkdir()
            master = root / "Library" / "master.sqlite"
            old = library.MASTER
            library.MASTER = master
            watched = {"started": False}

            def start_watch() -> None:
                watched["started"] = True

            try:
                server.invalidate()
                env = {app_config.CONFIG_ENV: str(config)}
                with mock.patch.dict(os.environ, env, clear=False):
                    with mock.patch.object(snapshots, "start_watch", side_effect=start_watch):
                        httpd = server.serve(0)
                        httpd.server_close()
                self.assertFalse(master.exists())
                self.assertFalse(watched["started"])
                self.assertEqual(list(root.rglob("*.sqlite")), [])
                state_path = master.parent / "Backups" / "snapshots" / "state.json"
                state = json.loads(state_path.read_text(encoding="utf-8"))
                self.assertEqual(state.get("cratecraft_version"), app_config.APP_VERSION)
            finally:
                library.MASTER = old
                server.invalidate()


class SideBySidePlanTests(unittest.TestCase):
    """Keep the previous app until the new one is running."""

    def test_side_by_side_plan_keeps_the_old_app_until_new_running(self) -> None:
        """List the old versioned app for removal only after the new app runs.

        Returns:
            None. The test fails if the old app is removed early, if an
            unversioned app is listed, or if the plan deletes anything.
        """
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp)
            old = dest / "crateCraft-1.0.0"
            old.mkdir()
            (old / "marker").write_text("old", encoding="utf-8")
            bundle = dest / "crateCraft-0.9.0.app"
            bundle.mkdir()
            plain = dest / "crateCraft.app"
            plain.mkdir()
            exe = dest / "crateCraft.exe"
            exe.write_bytes(b"exe")
            notes = dest / "notes.txt"
            notes.write_text("leave", encoding="utf-8")
            waiting = app_upgrade.side_by_side_plan(dest, "1.1.0", False)
            self.assertEqual(waiting.new_app, dest / "crateCraft-1.1.0")
            self.assertEqual(waiting.delete, ())
            self.assertTrue((old / "marker").is_file())
            self.assertTrue(bundle.is_dir())
            self.assertTrue(plain.is_dir())
            running = app_upgrade.side_by_side_plan(dest, "1.1.0", True)
            self.assertEqual(running.new_app, dest / "crateCraft-1.1.0")
            self.assertEqual(running.delete, (bundle, old))
            self.assertNotIn(plain, running.delete)
            self.assertNotIn(exe, running.delete)
            self.assertNotIn(notes, running.delete)
            self.assertTrue((old / "marker").is_file())
            self.assertTrue(bundle.is_dir())
            self.assertTrue(plain.is_dir())
            self.assertTrue(exe.is_file())
            absent = dest / "missing-parent"
            planned = app_upgrade.side_by_side_plan(absent, "v1.2.3", True)
            self.assertEqual(planned.new_app, absent / "crateCraft-v1.2.3")
            self.assertEqual(planned.delete, ())
            self.assertFalse(absent.exists())

    def test_release_packer_and_desktop_do_not_delete_an_installed_app(self) -> None:
        """The packer and the desktop launch do not apply the side-by-side plan.

        Returns:
            None. The test fails if either file names the plan.
        """
        root = Path(__file__).resolve().parents[1]
        packer = (root / "scripts" / "release_bundle.py").read_text(encoding="utf-8")
        desktop = (root / "desktop.py").read_text(encoding="utf-8")
        self.assertNotIn("side_by_side_plan", packer)
        self.assertNotIn("app_upgrade", packer)
        self.assertNotIn("side_by_side_plan", desktop)
        self.assertNotIn("app_upgrade", desktop)
