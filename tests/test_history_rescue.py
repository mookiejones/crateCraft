"""History session compare, restore, and crate rebuild (#482).

Write tests patch ``snapshots.serato_dj_running`` so a running Serato DJ
does not queue or block the restore.
"""

from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import error_codes
import history_rescue
import library
from library import LibraryError
from tests.fixture import TempLibrary, open_database


def _add_session(
    db: Path,
    session_id: int,
    name: str,
    start: int,
    *,
    asset_id: int = 1,
    played: int = 1,
) -> None:
    """Insert one history session and entry into a fixture database."""
    with open_database(db) as conn:
        conn.execute(
            """
            INSERT INTO history_session (id, name, start_time, end_time, notes)
            VALUES (?, ?, ?, ?, '')
            """,
            (session_id, name, start, start + 100),
        )
        conn.execute(
            """
            INSERT INTO history_entry
                (id, session_id, asset_id, name, artist, album, bpm, key, length_ms,
                 start_time, end_time, played, deck, notes, file_name, is_missing)
            VALUES (?, ?, ?, 'Track', 'Artist', '', 120, '1A', 180000,
                    ?, ?, ?, '1', '', 'track.mp3', 0)
            """,
            (session_id * 10, session_id, asset_id, start + 1, start + 50, played),
        )


def _complete_backup(master: Path, name: str) -> Path:
    """Copy master into a complete Library/Backups folder."""
    backups = master.parent / "Backups"
    folder = backups / name
    folder.mkdir(parents=True)
    shutil.copy2(master, folder / "master.sqlite")
    library._write_complete_marker(folder)
    return folder


class HistoryRescueTests(unittest.TestCase):
    """Compare, crate rebuild, and gated restore."""

    def test_catalog_lists_live_and_backup(self) -> None:
        with TempLibrary() as temp:
            _complete_backup(temp.db, "serato-web-test")
            body = history_rescue.catalog()
            ids = {item["id"] for item in body["sources"]}
            self.assertIn("live", ids)
            self.assertIn("backup:serato-web-test", ids)
            self.assertTrue(body["write_back"]["allowed"])

    def test_compare_only_source_and_disagree(self) -> None:
        with TempLibrary() as temp:
            backup = _complete_backup(temp.db, "serato-web-test")
            _add_session(backup / "master.sqlite", 9, "Lost night", 500)
            library._write_complete_marker(backup)
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE history_entry SET name = 'Changed' WHERE session_id = 1"
                )
            report = history_rescue.compare("backup:serato-web-test")
            self.assertEqual(report["only_source_count"], 1)
            self.assertGreaterEqual(int(report["disagree_count"]), 1)
            self.assertTrue(report["preview"])

    def test_rebuild_crates(self) -> None:
        with TempLibrary() as temp:
            plan = history_rescue.rebuild_crates(
                "live", [1], library.LIBRARY_SPACE, confirm=False
            )
            self.assertTrue(plan["preview"])
            self.assertEqual(plan["session_count"], 1)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                written = history_rescue.rebuild_crates(
                    "live", [1], library.LIBRARY_SPACE, confirm=True
                )
            self.assertTrue(written["written"])
            self.assertGreaterEqual(int(written["crate_count"]), 1)
            parent = written["parent"]
            assert isinstance(parent, dict)
            self.assertIn("History rescue", str(parent.get("name") or ""))

    def test_restore_with_verify(self) -> None:
        with TempLibrary() as temp:
            backup = _complete_backup(temp.db, "serato-web-test")
            _add_session(backup / "master.sqlite", 9, "Rescue me", 900)
            library._write_complete_marker(backup)
            with open_database(temp.db) as conn:
                before = conn.execute("SELECT COUNT(*) FROM history_session").fetchone()
                assert before is not None
                before_count = int(before[0])
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                report = history_rescue.restore_sessions(
                    "backup:serato-web-test", [9], confirm=True
                )
            self.assertTrue(report["written"])
            self.assertEqual(report["restored_count"], 1)
            self.assertIsInstance(report.get("snapshot_id"), str)
            with open_database(temp.db) as conn:
                after = conn.execute("SELECT COUNT(*) FROM history_session").fetchone()
                assert after is not None
                self.assertEqual(int(after[0]), before_count + 1)
                row = conn.execute(
                    "SELECT name FROM history_session WHERE name = 'Rescue me'"
                ).fetchone()
                self.assertIsNotNone(row)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                again = history_rescue.restore_sessions(
                    "backup:serato-web-test", [9], confirm=True
                )
            self.assertFalse(again["written"])
            self.assertEqual(again["restored_count"], 0)
            self.assertEqual(again["skipped_count"], 1)
            with open_database(temp.db) as conn:
                final = conn.execute("SELECT COUNT(*) FROM history_session").fetchone()
                assert final is not None
                self.assertEqual(int(final[0]), before_count + 1)

    def test_restore_refuses_when_unprobed(self) -> None:
        with TempLibrary() as temp:
            backup = _complete_backup(temp.db, "serato-web-test")
            _add_session(backup / "master.sqlite", 9, "Blocked", 900)
            library._write_complete_marker(backup)
            with mock.patch(
                "history_rescue.write_back_status",
                return_value={
                    "allowed": False,
                    "reason": history_rescue.WRITE_UNPROBED,
                    "code": "history_write_unprobed",
                },
            ):
                with self.assertRaisesRegex(LibraryError, history_rescue.WRITE_UNPROBED):
                    history_rescue.restore_sessions(
                        "backup:serato-web-test", [9], confirm=True
                    )

    def test_history_folder_not_checked(self) -> None:
        with TempLibrary() as temp:
            history = temp.root / "_Serato_" / "History"
            history.mkdir(parents=True)
            (history / "session.txt").write_text("x", encoding="utf-8")
            body = history_rescue.catalog()
            kinds = {item["kind"] for item in body["sources"]}
            self.assertIn("history_folder", kinds)
            with self.assertRaisesRegex(LibraryError, "not checked"):
                history_rescue.compare(f"history_folder:{history}")

    def test_error_codes(self) -> None:
        self.assertEqual(
            error_codes.ERROR_CODES.get(history_rescue.WRITE_UNPROBED),
            "history_write_unprobed",
        )
        english = json.loads(
            (Path(__file__).resolve().parents[1] / "locales" / "en.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(
            english["error.history_write_unprobed"], history_rescue.WRITE_UNPROBED
        )


class HistoryRescueApiTests(unittest.TestCase):
    """HTTP contract for history rescue."""

    from tests.test_server import ApiTests as _ServerApiTests

    setUp = _ServerApiTests.setUp
    tearDown = _ServerApiTests.tearDown
    request = _ServerApiTests.request

    def test_get_catalog_and_post_crates(self) -> None:
        status, body = self.request("/api/history-rescue")
        self.assertEqual(status, 200)
        assert isinstance(body, dict)
        self.assertIn("sources", body)
        with mock.patch("snapshots.serato_dj_running", return_value=False):
            status, body = self.request(
                "/api/history-rescue",
                {
                    "action": "crates",
                    "source": "live",
                    "sessions": [1],
                    "space": library.LIBRARY_SPACE,
                    "confirm": True,
                },
            )
        self.assertEqual(status, 200)
        assert isinstance(body, dict)
        self.assertTrue(body["written"])


if __name__ == "__main__":
    unittest.main()
