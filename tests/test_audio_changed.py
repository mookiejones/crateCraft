"""Same-path audio replacement (#420).

Synthetic files only. The baseline lives in a temporary config directory,
never beside the fixture library and never in a ``_Serato_`` folder.
"""

from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import app_config
import audio_changed
import library
import volumes
from library import LibraryError, SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests.test_smart_presets import _members
from tests.test_tags import _id3_file, _markers_payload


def _point(temp: TempLibrary, asset_id: int, path: Path, body: bytes) -> None:
    """Point one fixture track at a synthetic file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    with open_database(temp.db) as conn:
        conn.execute(
            "UPDATE asset SET portable_id = ?, file_name = ?, is_missing = 0 WHERE id = ?",
            (str(path), path.name, asset_id),
        )


def _names(temp: TempLibrary) -> list[str]:
    """Crate names in the temporary library."""
    with open_database(temp.db) as conn:
        return [str(row[0]) for row in conn.execute("SELECT name FROM container ORDER BY id")]


def _stored_hash(path: Path) -> str | None:
    """Hash saved for one path, or None when that path is not baselined."""
    payload = json.loads(audio_changed.baseline_path().read_text(encoding="utf-8"))
    paths = payload["paths"]
    fact = paths.get(audio_changed.path_key(path))
    if not isinstance(fact, dict):
        return None
    digest = fact.get("hash")
    return digest if isinstance(digest, str) else None


class ChangedReasonsTests(unittest.TestCase):
    """Duration slack and a missing duration do not invent a swap."""

    def test_slack_and_missing_duration(self) -> None:
        before = {"size": 4, "duration_ms": 10000, "hash": "a"}
        self.assertEqual(audio_changed.changed_reasons(before, {**before, "duration_ms": 10500}), [])
        self.assertEqual(
            audio_changed.changed_reasons(before, {**before, "duration_ms": 14000}),
            ["duration"],
        )
        self.assertEqual(
            audio_changed.changed_reasons(
                {"size": 4, "duration_ms": None, "hash": "a"},
                {"size": 4, "duration_ms": 20000, "hash": "a"},
            ),
            [],
        )


class ScanTests(unittest.TestCase):
    """Baseline, swap, unchanged file, and an unmounted drive."""

    def setUp(self) -> None:
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: self._config.name})
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()

    def tearDown(self) -> None:
        self._running.stop()
        self._env.stop()
        self._config.cleanup()

    def test_first_save_is_not_a_swap_and_stays_out_of_serato(self) -> None:
        with TempLibrary() as temp:
            one = temp.root / "tunes" / "one.mp3"
            two = temp.root / "tunes" / "two.mp3"
            _point(temp, 1, one, b"AAAA")
            _point(temp, 2, two, b"BBBB")
            report = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(report["changed"], [])
            self.assertEqual(report["checked"], 2)
            self.assertEqual(report["warning"], audio_changed.WARNING)
            baseline = audio_changed.baseline_path()
            self.assertEqual(baseline.name, "audio-baseline.json")
            self.assertTrue(str(baseline).startswith(self._config.name))
            self.assertNotIn("_serato_", str(baseline).casefold())
            self.assertFalse(str(baseline).startswith(str(temp.root)))
            stored = json.loads(baseline.read_text(encoding="utf-8"))["paths"]
            key = audio_changed.path_key(one)
            self.assertEqual(key, os.path.normcase(str(one.resolve())))
            fact = stored[key]
            self.assertEqual(fact["size"], 4)
            self.assertIn("duration_ms", fact)
            self.assertTrue(fact["hash"])
            again = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(again["changed"], [])
            self.assertEqual(again["checked"], 2)
            self.assertEqual(_stored_hash(one), fact["hash"])

    def test_same_name_swap_by_size_and_by_hash(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "tunes" / "one.mp3"
            _point(temp, 1, path, b"AAAA")
            _point(temp, 2, temp.root / "tunes" / "two.mp3", b"BBBB")
            audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            old = _stored_hash(path)
            path.write_bytes(b"AAAA-longer")
            swapped = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(len(swapped["changed"]), 1)
            row = swapped["changed"][0]
            self.assertEqual(row["id"], 1)
            self.assertIn("size", row["reasons"])
            self.assertIn("hash", row["reasons"])
            self.assertEqual(swapped["warning"], audio_changed.WARNING)
            self.assertEqual(path.read_bytes(), b"AAAA-longer")
            self.assertEqual(_stored_hash(path), old)
            path.write_bytes(b"ZZZZ")
            hashed = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(hashed["changed"][0]["reasons"], ["hash"])
            self.assertEqual(_stored_hash(path), old)

    def test_duration_only_uses_slack(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "tunes" / "one.mp3"
            _point(temp, 1, path, b"AAAA")
            _point(temp, 2, temp.root / "tunes" / "two.mp3", b"BBBB")
            with mock.patch("audio_changed._duration_ms", return_value=10000):
                audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            with mock.patch("audio_changed._duration_ms", return_value=10500):
                quiet = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(quiet["changed"], [])
            with mock.patch("audio_changed._duration_ms", return_value=14000):
                moved = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(moved["changed"][0]["reasons"], ["duration"])

    def test_deleted_file_is_not_a_swap(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "tunes" / "one.mp3"
            _point(temp, 1, path, b"AAAA")
            _point(temp, 2, temp.root / "tunes" / "two.mp3", b"BBBB")
            audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            old = _stored_hash(path)
            path.unlink()
            report = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(report["changed"], [])
            self.assertGreaterEqual(int(report["not_found"]), 1)
            self.assertEqual(_stored_hash(path), old)

    def test_unmounted_drive_is_not_a_swap(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "tunes" / "one.mp3"
            _point(temp, 1, path, b"AAAA")
            _point(temp, 2, temp.root / "tunes" / "two.mp3", b"BBBB")
            audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            old = _stored_hash(path)
            path.write_bytes(b"swapped-bytes")
            usb = volumes.Volume("USB", "/Volumes/USB", "posix")

            def _absent(portable_id: str, location_uri: str = "", mounts: object = None) -> volumes.Volume | None:
                del location_uri, mounts
                if portable_id == str(path):
                    return usb
                return None

            with mock.patch("audio_changed.volumes.absent_volume", side_effect=_absent):
                report = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(report["changed"], [])
            self.assertGreaterEqual(int(report["offline"]), 1)
            self.assertEqual(_stored_hash(path), old)

    def test_unmounted_path_is_not_baselined(self) -> None:
        with TempLibrary() as temp:
            missing = Path("/Volumes/USB/never.mp3")
            _point(temp, 1, temp.root / "tunes" / "one.mp3", b"AAAA")
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ?, file_name = ? WHERE id = 2",
                    (str(missing), missing.name),
                )
            usb = volumes.Volume("USB", "/Volumes/USB", "posix")

            def _absent(portable_id: str, location_uri: str = "", mounts: object = None) -> volumes.Volume | None:
                del location_uri, mounts
                if portable_id == str(missing):
                    return usb
                return None

            with mock.patch("audio_changed.volumes.absent_volume", side_effect=_absent):
                report = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(report["changed"], [])
            self.assertGreaterEqual(int(report["offline"]), 1)
            stored = json.loads(audio_changed.baseline_path().read_text(encoding="utf-8"))["paths"]
            self.assertNotIn(audio_changed.path_key(missing), stored)

    def test_baseline_inside_serato_is_refused(self) -> None:
        with TempLibrary() as temp:
            with mock.patch.dict(os.environ, {app_config.CONFIG_ENV: str(temp.root)}):
                with self.assertRaisesRegex(LibraryError, "Serato folder"):
                    audio_changed.scan(temp.db, library.LIBRARY_SPACE)

    def test_unknown_space_and_missing_library(self) -> None:
        with TempLibrary():
            with self.assertRaisesRegex(LibraryError, "not available"):
                audio_changed.scan(library.MASTER, "Not a space")
        missing = Path(self._config.name) / "missing.sqlite"
        with self.assertRaises(LibraryError) as caught:
            audio_changed.scan(missing, library.LIBRARY_SPACE)
        self.assertEqual(caught.exception.status, 404)

    def test_empty_space_lists_nothing(self) -> None:
        with TempLibrary() as temp:
            report = audio_changed.scan(temp.db, "Serato Video")
            self.assertEqual(report["changed"], [])
            self.assertEqual(report["checked"], 0)


class CrateTests(unittest.TestCase):
    """Confirm writes the crate. Re-analyze leaves cues where they are."""

    def setUp(self) -> None:
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: self._config.name})
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()

    def tearDown(self) -> None:
        self._running.stop()
        self._env.stop()
        self._config.cleanup()

    def _swap(self, temp: TempLibrary) -> Path:
        path = temp.root / "tunes" / "one.mp3"
        _point(temp, 1, path, b"AAAA")
        _point(temp, 2, temp.root / "tunes" / "two.mp3", b"BBBB")
        audio_changed.scan(temp.db, library.LIBRARY_SPACE)
        path.write_bytes(b"replaced")
        return path

    def test_preview_and_unconfirmed_create_do_not_write(self) -> None:
        with TempLibrary() as temp:
            self._swap(temp)
            preview = audio_changed.action({"action": "preview", "space": library.LIBRARY_SPACE})
            plain = audio_changed.action({"action": "create", "space": library.LIBRARY_SPACE})
            self.assertTrue(preview["preview"])
            self.assertFalse(preview["written"])
            self.assertFalse(plain["written"])
            self.assertNotIn(audio_changed.CRATE_NAME, _names(temp))

    def test_confirmed_create_remembers_and_a_later_swap_lists_again(self) -> None:
        with TempLibrary() as temp:
            path = self._swap(temp)
            made = audio_changed.action(
                {"action": "create", "confirm": True, "space": library.LIBRARY_SPACE}
            )
            self.assertTrue(made["written"])
            self.assertEqual(made["added"], 1)
            self.assertEqual(made["changed"], [])
            self.assertEqual(made["warning"], audio_changed.WARNING)
            saved = made["saved"]
            self.assertIsInstance(saved, dict)
            crate_id = int(saved["id"])
            self.assertEqual(saved["name"], audio_changed.CRATE_NAME)
            self.assertEqual(_members(crate_id), [1])
            quiet = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(quiet["changed"], [])
            path.write_bytes(b"replaced-again-longer")
            listed = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(listed["changed"][0]["id"], 1)

    def test_empty_create_does_not_call_the_writer(self) -> None:
        with TempLibrary() as temp:
            _point(temp, 1, temp.root / "tunes" / "one.mp3", b"AAAA")
            _point(temp, 2, temp.root / "tunes" / "two.mp3", b"BBBB")
            audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            with mock.patch("library.crate_action") as writer:
                plan = audio_changed.create_crate(temp.db, library.LIBRARY_SPACE)
            writer.assert_not_called()
            self.assertFalse(plan["written"])
            self.assertNotIn(audio_changed.CRATE_NAME, _names(temp))

    def test_serato_open_refuses_the_crate(self) -> None:
        with TempLibrary() as temp:
            path = self._swap(temp)
            old = _stored_hash(path)
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                with self.assertRaises(SeratoOpen):
                    audio_changed.create_crate(temp.db, library.LIBRARY_SPACE)
            self.assertNotIn(audio_changed.CRATE_NAME, _names(temp))
            self.assertEqual(_stored_hash(path), old)

    def test_reanalyze_does_not_rewrite_cues(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "tunes" / "cued.mp3"
            path.parent.mkdir(parents=True, exist_ok=True)
            _id3_file(_markers_payload(), path)
            _point(temp, 1, path, path.read_bytes())
            _point(temp, 2, temp.root / "tunes" / "two.mp3", b"BBBB")
            audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            path.write_bytes(_markers_payload() + b"swapped-audio")
            before = path.read_bytes()
            plan = audio_changed.action(
                {"action": "reanalyze", "confirm": True, "space": library.LIBRARY_SPACE}
            )
            self.assertEqual(path.read_bytes(), before)
            self.assertFalse(plan["rewrites_cues"])
            self.assertFalse(plan["rewrites_grid"])
            self.assertIn("Cues stay put", str(plan["note"]))
            self.assertFalse(plan["written"])
            self.assertGreaterEqual(int(plan["count"]), 1)
            self.assertNotIn(audio_changed.CRATE_NAME, _names(temp))
            still = audio_changed.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(still["changed"][0]["id"], 1)

    def test_unknown_action(self) -> None:
        with TempLibrary():
            with self.assertRaisesRegex(LibraryError, "not available"):
                audio_changed.action({"action": "erase", "space": library.LIBRARY_SPACE})
