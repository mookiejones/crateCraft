"""Protected BPM, key, and cues stay put unless this save opts in (#362)."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import library
import protected_fields
from tests.fixture import TempLibrary, open_database


class ProtectedFieldTests(unittest.TestCase):
    """A protected field is restored and reported. An opt-in overwrite lands."""

    def setUp(self) -> None:
        """Point settings at a throwaway directory."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(
            os.environ,
            {"CRATECRAFT_CONFIG_DIR": self._config.name},
        )
        self._env.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory."""
        self._env.stop()
        self._config.cleanup()

    def test_protected_bpm_stays_and_other_fields_save(self) -> None:
        """A protected BPM is kept while the title still changes.

        Returns:
            None. The test fails if BPM becomes 140 or the title stays.
        """
        protected_fields.save({"bpm": True})
        with TempLibrary() as temp:
            result = library.save_track(1, {"name": "Renamed", "bpm": 140})
            with open_database(temp.db) as conn:
                row = conn.execute("SELECT name, bpm FROM asset WHERE id = 1").fetchone()
        self.assertEqual(row[0], "Renamed")
        self.assertEqual(row[1], 120)
        self.assertEqual(result["restored"], ["bpm"])

    def test_overwrite_allows_a_protected_bpm(self) -> None:
        """``overwrite`` lets this one save change a protected BPM.

        Returns:
            None. The test fails if BPM stays 120.
        """
        protected_fields.save({"bpm": True})
        with TempLibrary() as temp:
            result = library.save_track(1, {"bpm": 140}, overwrite=["bpm"])
            with open_database(temp.db) as conn:
                bpm = conn.execute("SELECT bpm FROM asset WHERE id = 1").fetchone()[0]
        self.assertEqual(bpm, 140)
        self.assertEqual(result["restored"], [])

    def test_unprotected_bpm_still_changes(self) -> None:
        """BPM changes when protection is off.

        Returns:
            None. The test fails if BPM stays 120.
        """
        with TempLibrary() as temp:
            result = library.save_track(1, {"bpm": 140})
            with open_database(temp.db) as conn:
                bpm = conn.execute("SELECT bpm FROM asset WHERE id = 1").fetchone()[0]
        self.assertEqual(bpm, 140)
        self.assertEqual(result["restored"], [])

    def test_protected_key_stays(self) -> None:
        """A protected key is kept.

        Returns:
            None. The test fails if the key becomes 9A.
        """
        protected_fields.save({"key": True})
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET key = ? WHERE id = 1", ("8A",))
                conn.commit()
            result = library.save_track(1, {"key": "9A"})
            with open_database(temp.db) as conn:
                key = conn.execute("SELECT key FROM asset WHERE id = 1").fetchone()[0]
        self.assertEqual(key, "8A")
        self.assertEqual(result["restored"], ["key"])

    def test_protected_cues_are_not_copied(self) -> None:
        """A cue copy does not rewrite the file when cues are protected.

        Returns:
            None. The test fails if the frame writer runs.
        """
        protected_fields.save({"cues": True})
        plan: dict[str, object] = {
            "_cue_copy": {
                "write": True,
                "dest": Path("kept.mp3"),
                "wanted": {"Markers2": b"cues"},
                "public": {
                    "file": "other.mp3",
                    "markers": True,
                    "beatgrid": False,
                    "status": "planned",
                },
            }
        }
        with mock.patch("snapshot_frames.restore_stored_frames") as restore:
            library._apply_cue_copy(plan)
        restore.assert_not_called()
        public = plan["cue_copy"]
        assert isinstance(public, dict)
        self.assertEqual(public["status"], "restored")
        self.assertEqual(plan["restored"], ["cues"])

    def test_overwrite_allows_a_cue_copy(self) -> None:
        """``overwrite`` cues lets this copy write the frames.

        Returns:
            None. The test fails if the frame writer is skipped.
        """
        protected_fields.save({"cues": True})
        plan: dict[str, object] = {
            "overwrite": ["cues"],
            "_cue_copy": {
                "write": True,
                "dest": Path("kept.mp3"),
                "wanted": {"Markers2": b"cues"},
                "public": {
                    "file": "other.mp3",
                    "markers": True,
                    "beatgrid": False,
                    "status": "planned",
                },
            },
        }
        with mock.patch("snapshot_frames.restore_stored_frames") as restore:
            library._apply_cue_copy(plan)
        restore.assert_called_once()

    def test_save_rejects_an_unknown_field(self) -> None:
        """An unknown protection name is refused.

        Returns:
            None. The test fails if the bad name is stored.
        """
        with self.assertRaises(ValueError):
            protected_fields.save({"genre": True})
