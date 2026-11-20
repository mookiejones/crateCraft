"""Portable smart crates: rules and a track snapshot on a temp drive.

The suite never opens the live Serato library. A missing drive is refused
before any database open. Drive files stay under a temporary directory.
"""

from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import library
import portable_smart
import safe_write
import server
import smart_presets
import smart_rules
import volumes
from tests.fixture import TempLibrary

_SPACE = "Serato Library"


def _fixture_crate_bytes(paths: list[str]) -> bytes:
    """Load the fixture encoder without running its builder.

    Args:
        paths: ``ptrk`` values.

    Returns:
        A track-only crate file in the fixture layout.
    """
    path = Path(__file__).resolve().parent / "fixtures" / "build_fixtures.py"
    spec = importlib.util.spec_from_file_location("fixture_builder", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("The fixture builder could not be loaded.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    encoded: bytes = module.crate_bytes(paths)
    return encoded


def _plays_scrate() -> bytes:
    """Build a smart-crate file whose only rule does not map.

    Returns:
        Version, one plays rule, and one snapshot path.
    """
    import drive_crates

    body = portable_smart._uint_chunk("urkt", 79)
    body += drive_crates._text("trft", "cond_greq_uint")
    body += portable_smart._uint_chunk("urpt", 1)
    rules = drive_crates._chunk("rart", portable_smart._bool_chunk(True))
    rules += drive_crates._chunk("rlut", portable_smart._bool_chunk(True))
    rules += drive_crates._chunk("rurt", body)
    return portable_smart._file_bytes(rules, ["Music/same-a.mp3"])


class PortableSmartTests(unittest.TestCase):
    """Copy and restore smart crates on a temporary drive."""

    def setUp(self) -> None:
        """Point settings at a throwaway directory and keep Serato closed."""
        self._config = tempfile.TemporaryDirectory()
        self._drive = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._block = mock.patch("snapshots.write_block_message", return_value=None)
        self._running.start()
        self._block.start()

    def tearDown(self) -> None:
        """Drop the throwaway directories and the Serato stubs."""
        self._block.stop()
        self._running.stop()
        self._env.stop()
        self._drive.cleanup()
        self._config.cleanup()

    def test_copy_writes_rules_and_tracks(self) -> None:
        """A live smart crate lands in ``_Serato_/SmartCrates`` as a real ``.scrate``.

        Returns:
            None. The test fails if rules or the snapshot tracks are missing.
        """
        drive = self._mounted()
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            result = portable_smart.action({"action": "copy", "drive": str(drive)})
        self.assertTrue(result["written"])
        self.assertTrue(result["ok"])
        path = drive / "_Serato_" / "SmartCrates" / "Warmup.scrate"
        data = path.read_bytes()
        self.assertIn(portable_smart.SMART_VERSION.encode("utf-16-be"), data)
        self.assertIn(b"rurt", data)
        self.assertIn("cond_greq_uint".encode("utf-16-be"), data)
        self.assertIn("Music/same-a.mp3".encode("utf-16-be"), data)
        self.assertIn("Music/same-b.mp3".encode("utf-16-be"), data)
        self.assertFalse((drive / "_Serato_" / "database V2").exists())
        self.assertEqual(list((drive / "_Serato_").rglob("*.json")), [])
        parsed = portable_smart.read_scrate(data)
        self.assertEqual(parsed["mode"], "smart")

    def test_restore_round_trip(self) -> None:
        """Restore builds the same type-2 rules and stores no members.

        Returns:
            None. The test fails if the destination is a normal crate.
        """
        drive = self._mounted()
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            portable_smart.action({"action": "copy", "drive": str(drive)})
        with TempLibrary():
            preview = portable_smart.action({"action": "preview", "drive": str(drive)})
            self.assertTrue(preview["preview"])
            self.assertFalse(preview["written"])
            row = self._named(preview, "Warmup")
            self.assertEqual(row["mode"], "smart")
            self.assertEqual(row["status"], "create")
            applied = portable_smart.action({"action": "restore", "drive": str(drive)})
            self.assertTrue(applied["written"])
            self.assertIsInstance(applied["snapshot_id"], str)
            found = self._crate("Warmup")
            self.assertEqual(found["type"], 2)
            self.assertEqual(found["members"], [])
            rules = smart_rules.parse_rules(found["rules"])
            self.assertIsNotNone(rules)
            assert rules is not None
            values = sorted(int(item["value"]) for item in rules["rules"])
            self.assertEqual(values, [100, 140])

    def test_fallback_unmapped_rule_becomes_normal_crate(self) -> None:
        """A plays rule is named in the preview and becomes a normal crate.

        Returns:
            None. The test fails if a smart crate is created.
        """
        drive = self._mounted()
        folder = drive / "_Serato_" / "SmartCrates"
        folder.mkdir()
        (folder / "Warmup.scrate").write_bytes(_plays_scrate())
        with TempLibrary():
            preview = portable_smart.action({"action": "preview", "drive": str(drive)})
            row = self._named(preview, "Warmup")
            self.assertEqual(row["mode"], "fallback")
            self.assertEqual(row["status"], "create")
            self.assertIn("normal crate", str(row["detail"]))
            applied = portable_smart.action({"action": "restore", "drive": str(drive)})
            self.assertTrue(applied["written"])
            found = self._crate("Warmup")
            self.assertEqual(found["type"], 1)
            self.assertEqual(found["members"], [1])
            self.assertIsNone(found["rules"])

    def test_unmappable_export_keeps_snapshot_tracks(self) -> None:
        """A native field the ``.scrate`` cannot store is a snapshot, not rules.

        Returns:
            None. The test fails if ``rurt`` is written or restore stays type 2.
        """
        drive = self._mounted()
        blob = {
            "rules": [
                {
                    "type": "STRING",
                    "attribute": "type",
                    "operation": "IS",
                    "version": 1,
                    "value": "",
                }
            ],
            "conjunction": "AND",
            "live_updates": True,
        }

        def apply(conn: object, session: safe_write.Session) -> dict[str, object]:
            """Create one type-2 crate whose only rule cannot travel.

            Args:
                conn: Open write connection.
                session: Unused. The crate is only a source for the copy.

            Returns:
                An empty result.
            """
            del session
            library._create_crate(conn, _SPACE, None, "Typed", True, blob)  # type: ignore[arg-type]
            return {}

        with TempLibrary():
            safe_write.run("typed", "Typed", apply)
            copied = portable_smart.action({"action": "copy", "drive": str(drive)})
            self.assertTrue(copied["written"])
        data = (drive / "_Serato_" / "SmartCrates" / "Typed.scrate").read_bytes()
        self.assertNotIn(b"rurt", data)
        self.assertIn("Music/same-a.mp3".encode("utf-16-be"), data)
        with TempLibrary():
            preview = portable_smart.action({"action": "preview", "drive": str(drive)})
            row = self._named(preview, "Typed")
            self.assertEqual(row["mode"], "fallback")
            applied = portable_smart.action({"action": "restore", "drive": str(drive)})
            found = self._crate("Typed")
            self.assertEqual(found["type"], 1)
            self.assertEqual(found["members"], [1, 2])
            self.assertTrue(applied["written"])

    def test_fixture_track_crate_is_fallback(self) -> None:
        """The fixture ``.scrate`` layout restores as a normal crate of its tracks.

        Returns:
            None. The test fails if a smart crate is created from track bytes.
        """
        drive = self._mounted()
        folder = drive / "_Serato_" / "SmartCrates"
        folder.mkdir()
        (folder / "Warmup.scrate").write_bytes(_fixture_crate_bytes(["Music/same-a.mp3"]))
        parsed = portable_smart.read_scrate((folder / "Warmup.scrate").read_bytes())
        self.assertEqual(parsed["mode"], "fallback")
        with TempLibrary():
            applied = portable_smart.action({"action": "restore", "drive": str(drive)})
            found = self._crate("Warmup")
            self.assertEqual(found["type"], 1)
            self.assertEqual(found["members"], [1])
            self.assertTrue(applied["written"])

    def test_confirm_before_overwrite(self) -> None:
        """An existing smart crate keeps its rules until confirm is true.

        Returns:
            None. The test fails if confirm false changes the destination.
        """
        drive = self._mounted()
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            portable_smart.action({"action": "copy", "drive": str(drive)})
        with TempLibrary():
            made = smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 200, "range": 1}, name="Warmup")
            crate_id = int(made["id"])
            before = self._crate("Warmup")
            preview = portable_smart.action({"action": "preview", "drive": str(drive)})
            row = self._named(preview, "Warmup")
            self.assertEqual(row["status"], "needs_confirm")
            self.assertTrue(preview["needs_confirm"])
            held = portable_smart.action({"action": "restore", "drive": str(drive), "confirm": False})
            self.assertFalse(held["written"])
            self.assertEqual(self._crate("Warmup")["rules"], before["rules"])
            applied = portable_smart.action({"action": "restore", "drive": str(drive), "confirm": True})
            self.assertTrue(applied["written"])
            after = self._crate("Warmup")
            self.assertEqual(after["id"], crate_id)
            self.assertEqual(after["type"], 2)
            rules = smart_rules.parse_rules(after["rules"])
            assert rules is not None
            values = sorted(int(item["value"]) for item in rules["rules"])
            self.assertEqual(values, [100, 140])

    def test_fallback_does_not_replace_smart_crate(self) -> None:
        """A snapshot-only file leaves an existing smart crate in place.

        Returns:
            None. The test fails if confirm turns the smart crate into members.
        """
        drive = self._mounted()
        folder = drive / "_Serato_" / "SmartCrates"
        folder.mkdir()
        (folder / "Warmup.scrate").write_bytes(_fixture_crate_bytes(["Music/same-a.mp3"]))
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 200, "range": 1}, name="Warmup")
            before = self._crate("Warmup")
            applied = portable_smart.action(
                {"action": "restore", "drive": str(drive), "confirm": True}
            )
            row = self._named(applied, "Warmup")
            self.assertEqual(row["status"], "skip")
            after = self._crate("Warmup")
            self.assertEqual(after["type"], 2)
            self.assertEqual(after["rules"], before["rules"])
            self.assertEqual(after["members"], [])

    def test_undo_copy_and_restore(self) -> None:
        """Undo removes the new drive file and the restored crate.

        Returns:
            None. The test fails if either write survives its undo.
        """
        drive = self._mounted()
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            copied = portable_smart.action({"action": "copy", "drive": str(drive)})
            path = drive / "_Serato_" / "SmartCrates" / "Warmup.scrate"
            self.assertTrue(path.is_file())
            portable_smart.action({"action": "undo", "snapshot_id": copied["snapshot_id"]})
            self.assertFalse(path.exists())
        with TempLibrary():
            restored = portable_smart.action({"action": "restore", "drive": str(drive)})
        self.assertFalse(restored["written"])
        folder = drive / "_Serato_" / "SmartCrates"
        folder.mkdir(exist_ok=True)
        (folder / "Warmup.scrate").write_bytes(_plays_scrate())
        with TempLibrary():
            restored = portable_smart.action({"action": "restore", "drive": str(drive)})
            self.assertTrue(restored["written"])
            self.assertIsNotNone(self._crate("Warmup"))
            portable_smart.action({"action": "undo", "snapshot_id": restored["snapshot_id"]})
            self.assertIsNone(self._crate("Warmup"))

    def test_unmounted_drive_does_not_open_the_library(self) -> None:
        """A missing drive is not connected and does not create a folder.

        Returns:
            None. The test fails if the library is opened or the path appears.
        """
        missing = Path(self._drive.name) / "gone"
        with mock.patch("library.read_conn", side_effect=AssertionError("opened")):
            result = portable_smart.action({"action": "copy", "drive": str(missing)})
            restore = portable_smart.action({"action": "restore", "drive": str(missing)})
        self.assertEqual(result["status"], "not_connected")
        self.assertFalse(result["written"])
        self.assertEqual(result["crates"], [])
        self.assertEqual(restore["status"], "not_connected")
        self.assertFalse(missing.exists())

    def test_missing_serato_folder_is_not_created(self) -> None:
        """A drive with no ``_Serato_`` folder stays that way.

        Returns:
            None. The test fails if the folder is created or the library opens.
        """
        root = Path(self._drive.name).resolve()
        with mock.patch("library.read_conn", side_effect=AssertionError("opened")):
            result = portable_smart.action({"action": "restore", "drive": str(root)})
        self.assertEqual(result["status"], "no_library")
        self.assertFalse((root / "_Serato_").exists())

    def test_symlink_serato_is_refused(self) -> None:
        """A shortcut ``_Serato_`` is not followed and its target stays put.

        Returns:
            None. The test fails if SmartCrates appears inside the target.
        """
        root = Path(self._drive.name).resolve()
        target = root / "real"
        target.mkdir()
        (target / "marker.txt").write_text("keep", encoding="utf-8")
        (root / "_Serato_").symlink_to(target)
        with mock.patch("library.read_conn", side_effect=AssertionError("opened")):
            result = portable_smart.action({"action": "copy", "drive": str(root)})
        self.assertEqual(result["status"], "no_library")
        self.assertEqual((target / "marker.txt").read_text(encoding="utf-8"), "keep")
        self.assertFalse((target / "SmartCrates").exists())

    def test_failed_write_puts_bytes_back(self) -> None:
        """A replace that raises restores the previous bytes.

        Returns:
            None. The test fails if garbage stays on the drive.
        """
        drive = self._mounted()
        folder = drive / "_Serato_" / "SmartCrates"
        folder.mkdir()
        path = folder / "Warmup.scrate"
        path.write_bytes(b"original")

        def boom(dest: Path, data: bytes) -> None:
            """Write garbage, then fail.

            Args:
                dest: File being replaced.
                data: Bytes that must not stay.

            Raises:
                OSError: Always, after the bad write.
            """
            del data
            dest.write_bytes(b"garbage")
            raise OSError("disk full")

        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            with mock.patch("portable_smart._replace", side_effect=boom):
                with self.assertRaises(library.LibraryError) as caught:
                    portable_smart.action({"action": "copy", "drive": str(drive), "overwrite": True})
        self.assertEqual(caught.exception.message, portable_smart.DRIVE_NOT_WRITTEN)
        self.assertEqual(path.read_bytes(), b"original")
        self.assertFalse((drive / "_Serato_" / "database V2").exists())

    def test_new_file_is_removed_when_the_write_fails(self) -> None:
        """A failed first write does not leave the new ``.scrate``.

        Returns:
            None. The test fails if the file or a sidecar remains.
        """
        drive = self._mounted()

        def boom(dest: Path, data: bytes) -> None:
            """Write garbage, then fail.

            Args:
                dest: New file.
                data: Bytes that must not stay.

            Raises:
                OSError: Always, after the bad write.
            """
            del data
            dest.write_bytes(b"garbage")
            raise OSError("disk full")

        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            with mock.patch("portable_smart._replace", side_effect=boom):
                with self.assertRaises(library.LibraryError):
                    portable_smart.action({"action": "copy", "drive": str(drive)})
        folder = drive / "_Serato_" / "SmartCrates"
        self.assertFalse((folder / "Warmup.scrate").exists())
        self.assertEqual(list(drive.rglob("*.json")), [])

    def test_existing_drive_file_kept_until_overwrite(self) -> None:
        """An existing ``.scrate`` stays until overwrite is true.

        Returns:
            None. The test fails if the first copy rewrites the file.
        """
        drive = self._mounted()
        folder = drive / "_Serato_" / "SmartCrates"
        folder.mkdir()
        path = folder / "Warmup.scrate"
        path.write_bytes(b"keep-me")
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            kept = portable_smart.action({"action": "copy", "drive": str(drive)})
            self.assertFalse(kept["written"])
            self.assertTrue(kept["needs_overwrite"])
            self.assertEqual(path.read_bytes(), b"keep-me")
            rewritten = portable_smart.action(
                {"action": "copy", "drive": str(drive), "overwrite": True}
            )
        self.assertTrue(rewritten["written"])
        self.assertIn(b"rurt", path.read_bytes())
        self.assertNotEqual(path.read_bytes(), b"keep-me")

    def test_serato_open_refuses_the_write(self) -> None:
        """Copy is refused while Serato is open. Preview still reads.

        Returns:
            None. The test fails if the drive file appears during the refusal.
        """
        drive = self._mounted()
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 120, "range": 20}, name="Warmup")
            portable_smart.action({"action": "copy", "drive": str(drive)})
        path = drive / "_Serato_" / "SmartCrates" / "Warmup.scrate"
        before = path.read_bytes()
        with TempLibrary():
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                preview = portable_smart.action({"action": "preview", "drive": str(drive)})
                self.assertEqual(self._named(preview, "Warmup")["status"], "create")
                with self.assertRaises(library.SeratoOpen):
                    portable_smart.action({"action": "restore", "drive": str(drive)})
                self.assertIsNone(self._crate("Warmup"))
        self.assertEqual(path.read_bytes(), before)

    def test_rules_with_no_current_matches_still_write(self) -> None:
        """A smart crate that matches nothing still travels as rules.

        Returns:
            None. The test fails if restore creates members or skips the file.
        """
        drive = self._mounted()
        with TempLibrary():
            smart_presets.create(_SPACE, {"kind": "bpm", "bpm": 200, "range": 1}, name="Quiet")
            copied = portable_smart.action({"action": "copy", "drive": str(drive)})
            self.assertTrue(copied["written"])
        data = (drive / "_Serato_" / "SmartCrates" / "Quiet.scrate").read_bytes()
        self.assertIn(b"rurt", data)
        self.assertNotIn("Music/same-a.mp3".encode("utf-16-be"), data)
        with TempLibrary():
            applied = portable_smart.action({"action": "restore", "drive": str(drive)})
            found = self._crate("Quiet")
            self.assertEqual(found["type"], 2)
            self.assertEqual(found["members"], [])
            self.assertTrue(applied["written"])

    def test_relative_letter_path_matches(self) -> None:
        """A Windows drive-relative snapshot path finds the stored portable id.

        Returns:
            None. The test fails if the letter path does not match.
        """
        volume = volumes.Volume(name="E", root=r"E:\\", kind="letter")
        assets = [(1, r"E:\Music\same-a.mp3")]
        self.assertEqual(
            portable_smart._match_id("Music/same-a.mp3", assets, volume, set()),
            1,
        )

    def test_not_a_smart_crate_writes_nothing(self) -> None:
        """A normal crate id is refused and leaves the drive empty of crates.

        Returns:
            None. The test fails if a file is written.
        """
        drive = self._mounted()
        with TempLibrary():
            result = portable_smart.action({"action": "copy", "drive": str(drive), "crate": 1})
        self.assertFalse(result["written"])
        self.assertEqual(self._named(result, "")["status"], "refused")
        self.assertFalse((drive / "_Serato_" / "SmartCrates").exists())

    def test_http_preview_refuses_a_missing_drive(self) -> None:
        """POST preview on a missing drive is not_connected and does not open the library.

        Returns:
            None. The test fails if the library opens or the path is created.
        """
        missing = Path(self._drive.name) / "unplugged"
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        body = json.dumps({"action": "preview", "drive": str(missing)}).encode("utf-8")
        request = urllib.request.Request(
            f"http://{host}:{port}/api/portable-smart",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with mock.patch.object(library, "read_conn", side_effect=AssertionError("opened")):
                with urllib.request.urlopen(request, timeout=10) as response:
                    self.assertEqual(response.status, 200)
                    payload = json.loads(response.read().decode("utf-8"))
            self.assertFalse(payload["ok"])
            self.assertEqual(payload["status"], "not_connected")
            self.assertFalse(payload["written"])
            self.assertFalse(missing.exists())
        finally:
            httpd.shutdown()
            httpd.server_close()

    def _mounted(self) -> Path:
        """Return a resolved temp drive that already has ``_Serato_``.

        Returns:
            The drive root.
        """
        root = Path(self._drive.name).resolve()
        (root / "_Serato_").mkdir()
        return root

    def _named(self, result: dict[str, object], name: str) -> dict[str, object]:
        """Return the crate row with this display name.

        Args:
            result: Action result.
            name: Leaf name, or empty for a refused row with no name.

        Returns:
            The matching row.

        Raises:
            AssertionError: If the name is missing.
        """
        crates = result["crates"]
        assert isinstance(crates, list)
        for item in crates:
            assert isinstance(item, dict)
            if item.get("name") == name:
                return item
        self.fail(f"missing crate {name!r} in {crates!r}")

    def _crate(self, name: str) -> dict[str, object] | None:
        """Read one Serato Library crate by display name.

        Args:
            name: Leaf name.

        Returns:
            Id, type, rules, and member ids, or None.
        """
        conn = library.read_conn()
        try:
            rows = conn.execute(
                """
                SELECT c.id, c.name, c.type, r.rules
                FROM container c
                JOIN space s ON s.id = c.space_id
                LEFT JOIN smart_crate_rules r ON r.container_id = c.id
                WHERE s.name = ? AND c.type != 0
                """,
                (_SPACE,),
            ).fetchall()
            for row in rows:
                if library.display_name(str(row[1])) != name:
                    continue
                members = portable_smart._members(conn, int(row[0]))
                return {
                    "id": int(row[0]),
                    "type": int(row[2]),
                    "rules": row[3],
                    "members": members,
                }
            return None
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
