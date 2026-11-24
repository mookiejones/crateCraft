"""One-button tonight crates (#429).

Builds Newest adds, Most played, and by-decade crates under
``_crateCraft generated`` / ``Tonight``. Preview is read-only. Create
writes through ``safe_write``. A re-run replaces only that Tonight tree.
"""

from __future__ import annotations

import hashlib
import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from typing import cast
from unittest import mock

import library
import tonight_crates
from library import LibraryError, SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests import test_server
from tests.test_smart_presets import _members

NOW = 1_800_000_000
DAY = 86_400


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _seed(temp: TempLibrary) -> None:
    """Give the fixture years, dates, and play history for tonight crates.

    Track 1: added recently, year 2021, played twice.
    Track 2: added earlier, year 2015, played once.
    Track 3: added oldest, year 2018, never played.
    Track 4: no year, newest of all.
    """
    with open_database(temp.db) as conn:
        conn.execute("DELETE FROM history_entry")
        conn.execute("DELETE FROM history_session")
        conn.executemany(
            """
            INSERT INTO asset (id, name, artist, year, time_added, dj_play_count, location_id, file_name, portable_id, is_missing)
            VALUES (?, ?, 'Artist', ?, ?, ?, 1, ?, ?, 0)
            """,
            [
                (3, "Mid", "2018", NOW - 200 * DAY, 0, "mid.mp3", "Music/mid.mp3"),
                (4, "Fresh", None, NOW - 1 * DAY, 0, "fresh.mp3", "Music/fresh.mp3"),
            ],
        )
        conn.executemany("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", [(3,), (4,)])
        conn.execute(
            "UPDATE asset SET year = ?, time_added = ? WHERE id = 1",
            ("2021-06-01", NOW - 5 * DAY),
        )
        conn.execute(
            "UPDATE asset SET year = ?, time_added = ? WHERE id = 2",
            ("2015", NOW - 40 * DAY),
        )
        conn.execute(
            "INSERT INTO history_session (id, name, start_time, end_time) VALUES (2, 'Club', ?, ?)",
            (NOW - 10 * DAY, NOW - 10 * DAY + 3600),
        )
        conn.executemany(
            """
            INSERT INTO history_entry (session_id, asset_id, name, artist, played, start_time)
            VALUES (2, ?, 'x', 'Artist', 1, ?)
            """,
            [
                (1, NOW - 10 * DAY + 60),
                (1, NOW - 10 * DAY + 120),
                (2, NOW - 10 * DAY + 180),
            ],
        )


def _child_names(crate_id: int) -> list[str]:
    with closing(library.read_conn()) as conn:
        rows = conn.execute(
            "SELECT name FROM container WHERE parent_id = ? ORDER BY list_order, id",
            (crate_id,),
        ).fetchall()
    return [library.display_name(row[0]) for row in rows]


def _find(name: str, parent: int | None = None) -> int | None:
    with closing(library.read_conn()) as conn:
        if parent is None:
            root = library._space_root(conn, library.LIBRARY_SPACE)
            return library._find_child(conn, root, name, 1)
        return library._find_child(conn, parent, name, 1)


class DecadeTests(unittest.TestCase):
    """Year text becomes a decade label."""

    def test_decade_labels(self) -> None:
        cases = [
            ("2021", "2020s"),
            ("2021-06-01", "2020s"),
            ("2015", "2010s"),
            ("1999", "1990s"),
            ("", None),
            (None, None),
            ("unknown", None),
            ("12", None),
        ]
        for raw, want in cases:
            with self.subTest(raw=raw):
                self.assertEqual(tonight_crates._decade_label(raw), want)


class PreviewTests(unittest.TestCase):
    """Preview lists crates without writing."""

    def test_preview_lists_groups_and_does_not_write(self) -> None:
        with TempLibrary() as temp:
            _seed(temp)
            before = _digest(temp.db)
            preview = tonight_crates.preview(temp.db, library.LIBRARY_SPACE, newest=3, played=2)
            self.assertEqual(_digest(temp.db), before)
            self.assertEqual((preview["preview"], preview["written"]), (True, False))
            self.assertEqual(preview["folder"], "_crateCraft generated")
            self.assertEqual(preview["tonight"], "Tonight")
            children = cast(list[dict[str, object]], preview["children"])
            kinds = [str(child["kind"]) for child in children]
            self.assertEqual(kinds[:2], ["newest", "played"])
            self.assertIn("decade", kinds)
            newest = next(child for child in children if child["kind"] == "newest")
            self.assertEqual(
                [int(str(track["id"])) for track in cast(list, newest["tracks"])],
                [4, 1, 2],
            )
            played = next(child for child in children if child["kind"] == "played")
            self.assertEqual(
                [int(str(track["id"])) for track in cast(list, played["tracks"])],
                [1, 2],
            )
            decades = [str(child["name"]) for child in children if child["kind"] == "decade"]
            self.assertEqual(decades, ["2020s", "2010s"])

    def test_bad_limits_are_refused(self) -> None:
        with TempLibrary() as temp:
            with self.assertRaises(LibraryError):
                tonight_crates.preview(temp.db, library.LIBRARY_SPACE, newest=0)
            with self.assertRaises(LibraryError):
                tonight_crates.preview(temp.db, library.LIBRARY_SPACE, played=501)


class CreateTests(unittest.TestCase):
    """Create writes the labelled folder through safe_write."""

    def test_create_writes_folder_and_children(self) -> None:
        with TempLibrary() as temp:
            _seed(temp)
            result = tonight_crates.create(temp.db, library.LIBRARY_SPACE, newest=3, played=2)
            self.assertTrue(result["written"])
            generated = _find("_crateCraft generated")
            self.assertIsNotNone(generated)
            tonight = _find("Tonight", generated)
            self.assertEqual(tonight, result["id"])
            names = _child_names(int(str(result["id"])))
            self.assertEqual(names[0], "Newest adds")
            self.assertEqual(names[1], "Most played")
            self.assertIn("2020s", names)
            self.assertIn("2010s", names)
            newest_id = _find("Newest adds", tonight)
            self.assertEqual(set(_members(int(str(newest_id)))), {4, 1, 2})
            played_id = _find("Most played", tonight)
            self.assertEqual(set(_members(int(str(played_id)))), {1, 2})

    def test_rerun_replaces_only_tonight(self) -> None:
        with TempLibrary() as temp:
            _seed(temp)
            first = tonight_crates.create(temp.db, library.LIBRARY_SPACE, newest=2, played=1)
            generated = _find("_crateCraft generated")
            assert generated is not None
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                keep = cast(
                    int,
                    library.crate_action(
                        {
                            "action": "create",
                            "name": "DJ keep",
                            "parent": generated,
                            "assets": [1],
                        }
                    )["id"],
                )
            first_tonight = int(str(first["id"]))
            second = tonight_crates.create(temp.db, library.LIBRARY_SPACE, newest=2, played=1)
            self.assertTrue(second["written"])
            self.assertNotEqual(second["id"], first_tonight)
            with closing(library.read_conn()) as conn:
                gone = conn.execute(
                    "SELECT COUNT(*) FROM container WHERE id = ?",
                    (first_tonight,),
                ).fetchone()
                kept = conn.execute(
                    "SELECT COUNT(*) FROM container WHERE id = ?",
                    (keep,),
                ).fetchone()
            self.assertEqual(int(gone[0]), 0)
            self.assertEqual(int(kept[0]), 1)
            self.assertEqual(_find("DJ keep", generated), keep)
            self.assertEqual(_find("Tonight", generated), second["id"])

    def test_does_not_touch_a_dj_tonight_outside_generated(self) -> None:
        with TempLibrary() as temp:
            _seed(temp)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                outside = cast(
                    int,
                    library.crate_action({"action": "create", "name": "Tonight", "assets": [2]})["id"],
                )
            tonight_crates.create(temp.db, library.LIBRARY_SPACE, newest=2, played=1)
            with closing(library.read_conn()) as conn:
                row = conn.execute(
                    "SELECT parent_id, name FROM container WHERE id = ?",
                    (outside,),
                ).fetchone()
                root = library._space_root(conn, library.LIBRARY_SPACE)
            self.assertEqual(int(row[0]), root)
            self.assertEqual(set(_members(outside)), {2})

    def test_empty_plan_does_not_write(self) -> None:
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM history_entry")
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
            before = _digest(temp.db)
            result = tonight_crates.create(temp.db, library.LIBRARY_SPACE)
            self.assertEqual((result["written"], result["count"]), (False, 0))
            self.assertEqual(_digest(temp.db), before)

    def test_serato_running_blocks_create(self) -> None:
        with TempLibrary() as temp:
            _seed(temp)
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            before = _digest(temp.db)
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                tonight_crates.create(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(_digest(temp.db), before)

    def test_create_without_confirm_is_preview(self) -> None:
        with TempLibrary() as temp:
            _seed(temp)
            before = _digest(temp.db)
            result = tonight_crates.action(
                {"action": "create", "space": library.LIBRARY_SPACE, "newest": 2}
            )
            self.assertEqual((result["preview"], result["written"]), (True, False))
            self.assertEqual(_digest(temp.db), before)


class ApiTests(unittest.TestCase):
    """``GET`` / ``POST /api/tonight`` against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_get_and_post(self) -> None:
        _seed(self.library)
        status, preview = self.request("/api/tonight")
        self.assertEqual(status, 200)
        self.assertTrue(cast(dict, preview)["preview"])
        status, made = self.request(
            "/api/tonight",
            {"action": "create", "confirm": True, "newest": 3, "played": 2},
        )
        self.assertEqual(status, 200)
        body = cast(dict, made)
        self.assertTrue(body["written"])
        self.assertEqual(body["folder"], "_crateCraft generated")
        status, library_body = self.request("/api/library")
        names = [crate["name"] for crate in cast(dict, library_body)["crates"]]
        self.assertIn("_crateCraft generated", names)
        self.assertIn("Tonight", names)
        self.assertIn("Newest adds", names)


if __name__ == "__main__":
    unittest.main()
