"""Genre families: seed, reparent, and a previewed note write (#365).

Every case uses a temporary library. The map file stays beside settings,
never beside the database. Preview and a refused write leave the library
bytes unchanged.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import unittest
import urllib.error
import urllib.request
from contextlib import closing
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import app_config
import crate_trees
import error_codes
import genre_families
import library
import server
from library import LibraryError
from tests.fixture import TempLibrary


def _wipe_store() -> None:
    """Remove the shared test copy of genre-families.json."""
    (app_config.config_dir() / genre_families.STORE_NAME).unlink(missing_ok=True)


def _notes(
    db: Path,
    rows: list[tuple[str | None, str | None, str | None]],
) -> None:
    """Replace space 1 with ``(genre, grouping, comments)`` tracks."""
    with closing(sqlite3.connect(db)) as conn:
        conn.execute("DELETE FROM space_asset")
        conn.execute("DELETE FROM asset")
        for offset, (genre, grouping, comments) in enumerate(rows):
            asset_id = 1 + offset
            conn.execute(
                "INSERT INTO asset (id, name, genre, grouping, comments) VALUES (?, 'T', ?, ?, ?)",
                (asset_id, genre, grouping, comments),
            )
            conn.execute(
                "INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)",
                (asset_id,),
            )
        conn.commit()


def _fields(db: Path) -> list[tuple[int, str | None, str | None]]:
    """Return ``(id, grouping, comments)`` for space 1."""
    with closing(sqlite3.connect(db)) as conn:
        return [
            (int(row[0]), row[1], row[2])
            for row in conn.execute(
                "SELECT a.id, a.grouping, a.comments FROM asset a "
                "JOIN space_asset sa ON sa.asset_id = a.id "
                "WHERE sa.space_id = 1 ORDER BY a.id"
            )
        ]


class StoreTests(unittest.TestCase):
    """The map file is per library and stays out of the Serato folder."""

    def setUp(self) -> None:
        """Start from an empty map."""
        _wipe_store()

    def tearDown(self) -> None:
        """Leave the shared config dir without this file."""
        _wipe_store()

    def test_error_sentences_keep_their_codes(self) -> None:
        """A drifted sentence would reach the page without ``error.<code>``."""
        for sentence, code in (
            (genre_families.NOT_A_GENRE, "genre_not_in_library"),
            (genre_families.CYCLE, "genre_cycle"),
            (genre_families.BAD_FIELD, "genre_family_field"),
            (genre_families.BAD_MAP, "genre_map_invalid"),
            (genre_families.NEEDS_CONFIRM, "genre_family_needs_confirm"),
        ):
            self.assertEqual(error_codes.ERROR_CODES[sentence], code)

    def test_seed_puts_the_other_spelling_under_the_suggestion(self) -> None:
        """Hip-Hop points at Hip Hop. House, in no group, is its own root."""
        parents = genre_families.seed_parents(
            [{"suggested": "Hip Hop", "spellings": [{"value": "Hip Hop"}, {"value": "Hip-Hop"}]}],
            {"Hip Hop": 2, "Hip-Hop": 1, "House": 4},
        )
        self.assertEqual(parents, {"Hip Hop": None, "Hip-Hop": "Hip Hop", "House": None})

    def test_reparent_rejects_a_cycle_and_keeps_children(self) -> None:
        """House cannot sit under Deep, which already sits under House."""
        parents = {"House": None, "Tech House": "House", "Deep": "Tech House"}
        with self.assertRaises(LibraryError) as caught:
            genre_families.reparent(parents, "House", "Deep")
        self.assertEqual(caught.exception.message, genre_families.CYCLE)
        moved = genre_families.reparent(
            {"House": None, "Tech House": None, "Deep": "Tech House"},
            "Tech House",
            "House",
        )
        self.assertEqual(moved["Deep"], "Tech House")
        self.assertEqual(genre_families.root(moved, "Deep"), "House")
        self.assertEqual(genre_families.members(moved, "House"), ["House", "Deep", "Tech House"])

    def test_blank_notes_change_and_filled_notes_stay_blocked(self) -> None:
        """A note that already has text is listed, not planned, until overwrite."""
        parents = {"House": None, "Tech House": "House"}
        rows = [
            {"id": 1, "genre": "House", "grouping": "  ", "comments": None},
            {"id": 2, "genre": "Tech House", "grouping": "keep me", "comments": ""},
        ]
        plan = genre_families.plan_notes(rows, parents, "grouping", False)
        self.assertEqual(plan["written"], False)
        self.assertEqual(plan["changes"], [{"id": 1, "from": "", "to": "House"}])
        self.assertEqual(plan["blocked"], [{"id": 2, "from": "keep me", "to": "House"}])
        overwritten = genre_families.plan_notes(rows, parents, "comment", True)
        self.assertEqual(overwritten["field"], "comments")
        self.assertEqual([item["id"] for item in overwritten["changes"]], [1, 2])  # type: ignore[index]

    def test_empty_library_and_a_missing_map_read_as_empty(self) -> None:
        """No genres and no file still return a report. Nothing is created in the library folder."""
        with TempLibrary() as temp:
            _notes(temp.db, [])
            report = genre_families.report(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(report["parents"], {})
            self.assertEqual(report["saved"], False)
            self.assertFalse((temp.db.parent / genre_families.STORE_NAME).exists())
            self.assertFalse((app_config.config_dir() / genre_families.STORE_NAME).exists())

    def test_a_saved_map_for_another_path_is_ignored(self) -> None:
        """A Windows path in the file does not move genres in this library."""
        with TempLibrary() as temp:
            _notes(temp.db, [("House", None, None), ("Tech House", None, None)])
            key = genre_families._library_key()
            genre_families._write_store(
                {
                    r"C:\Users\dj\AppData\Local\Serato\Library\master.sqlite": {
                        "House": None,
                        "Tech House": "House",
                    },
                    key: {"House": None, "Tech House": None},
                }
            )
            parents, saved = genre_families.current_parents(temp.db, library.LIBRARY_SPACE)
            self.assertTrue(saved)
            self.assertIsNone(parents["Tech House"])
            store = genre_families._store_path()
            self.assertNotEqual(store.parent, temp.db.parent)
            self.assertFalse(str(store).startswith(str(temp.db.parent)))

    def test_reparent_saves_the_map_and_a_family_tree_rolls_up(self) -> None:
        """Tech House lands in the House family crate. The database bytes stay the same."""
        with TempLibrary() as temp:
            _notes(
                temp.db,
                [
                    ("House", None, None),
                    ("House", None, None),
                    ("Tech House", None, None),
                    ("Tech House", None, None),
                    ("Hip Hop", None, None),
                ],
            )
            before = temp.db.read_bytes()
            report = genre_families.action(
                {"action": "reparent", "space": library.LIBRARY_SPACE, "genre": "Tech House", "parent": "House"}
            )
            self.assertEqual(temp.db.read_bytes(), before)
            parents = report["parents"]
            self.assertIsInstance(parents, dict)
            self.assertEqual(parents["Tech House"], "House")  # type: ignore[index]
            preview = crate_trees.preview(
                library.LIBRARY_SPACE, {"kind": "family", "min_tracks": 2, "limit": 40}
            )
            names = {child["name"]: child["count"] for child in preview["children"]}  # type: ignore[index]
            self.assertEqual(names.get("House ⟳"), 4)
            self.assertNotIn("Tech House ⟳", names)
            self.assertFalse((temp.db.parent / genre_families.STORE_NAME).exists())

    def test_apply_writes_blank_notes_and_leaves_blocked_rows(self) -> None:
        """Confirm writes the family name into an empty Grouping. Filled text stays."""
        with TempLibrary() as temp:
            _notes(
                temp.db,
                [
                    ("House", "", ""),
                    ("Tech House", "keep me", ""),
                    ("Hip Hop", None, "already"),
                ],
            )
            genre_families.action(
                {
                    "action": "reparent",
                    "space": library.LIBRARY_SPACE,
                    "genre": "Tech House",
                    "parent": "House",
                }
            )
            before = temp.db.read_bytes()
            plan = genre_families.action(
                {
                    "action": "write-preview",
                    "space": library.LIBRARY_SPACE,
                    "field": "grouping",
                }
            )
            self.assertEqual(temp.db.read_bytes(), before)
            self.assertEqual(plan["written"], False)
            blocked = {item["id"] for item in plan["blocked"]}  # type: ignore[index]
            changed = {item["id"] for item in plan["changes"]}  # type: ignore[index]
            self.assertEqual(blocked, {2})
            self.assertEqual(changed, {1, 3})
            with self.assertRaises(LibraryError) as refused:
                genre_families.action(
                    {
                        "action": "write-apply",
                        "space": library.LIBRARY_SPACE,
                        "field": "grouping",
                        "confirm": False,
                    }
                )
            self.assertEqual(refused.exception.message, genre_families.NEEDS_CONFIRM)
            self.assertEqual(temp.db.read_bytes(), before)
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                with self.assertRaises(library.SeratoOpen):
                    genre_families.action(
                        {
                            "action": "write-apply",
                            "space": library.LIBRARY_SPACE,
                            "field": "grouping",
                            "confirm": True,
                        }
                    )
            self.assertEqual(temp.db.read_bytes(), before)
            with (
                mock.patch("snapshots.serato_dj_running", return_value=False),
                mock.patch("snapshots.write_block_message", return_value=None),
            ):
                genre_families.action(
                    {
                        "action": "write-apply",
                        "space": library.LIBRARY_SPACE,
                        "field": "grouping",
                        "confirm": True,
                    }
                )
            self.assertEqual(
                _fields(temp.db),
                [(1, "House", ""), (2, "keep me", ""), (3, "Hip Hop", "already")],
            )
            self.assertFalse((temp.db.parent / genre_families.STORE_NAME).exists())

    def test_save_rejects_a_map_that_is_not_this_library(self) -> None:
        """A dropped or invented genre is 400 and the file stays empty."""
        with TempLibrary() as temp:
            _notes(temp.db, [("House", None, None)])
            with self.assertRaises(LibraryError) as caught:
                genre_families.action(
                    {
                        "action": "save",
                        "space": library.LIBRARY_SPACE,
                        "parents": {"House": None, "Other": None},
                    }
                )
            self.assertEqual(caught.exception.message, genre_families.BAD_MAP)
            self.assertFalse((app_config.config_dir() / genre_families.STORE_NAME).exists())


class RouteTests(unittest.TestCase):
    """GET and POST /api/genre-families."""

    def setUp(self) -> None:
        """Start from an empty map."""
        _wipe_store()

    def tearDown(self) -> None:
        """Leave the shared config dir without this file."""
        _wipe_store()

    def test_route(self) -> None:
        """GET lists families. A preview does not write. Apply without confirm is 400."""
        with TempLibrary() as temp:
            _notes(temp.db, [("House", "", None), ("Tech House", "keep", None)])
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            threading.Thread(target=httpd.serve_forever, daemon=True).start()
            host, port = httpd.server_address[:2]
            base = f"http://{host}:{port}"
            before = temp.db.read_bytes()
            try:
                with urllib.request.urlopen(
                    base + "/api/genre-families?space=Serato%20Library", timeout=5
                ) as response:
                    report = json.loads(response.read().decode("utf-8"))
                body = json.dumps(
                    {"action": "write-preview", "space": library.LIBRARY_SPACE, "field": "grouping"}
                ).encode("utf-8")
                request = urllib.request.Request(
                    base + "/api/genre-families",
                    data=body,
                    headers={"Content-Type": "application/json"},
                )
                with urllib.request.urlopen(request, timeout=5) as response:
                    plan = json.loads(response.read().decode("utf-8"))
                bad = json.dumps(
                    {
                        "action": "write-apply",
                        "space": library.LIBRARY_SPACE,
                        "field": "grouping",
                        "confirm": False,
                    }
                ).encode("utf-8")
                refused = urllib.request.Request(
                    base + "/api/genre-families",
                    data=bad,
                    headers={"Content-Type": "application/json"},
                )
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(refused, timeout=5)
                detail = json.loads(caught.exception.read().decode("utf-8"))
                caught.exception.close()
            finally:
                httpd.shutdown()
                httpd.server_close()
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertIn("House", report["parents"])
        self.assertEqual(plan["written"], False)
        self.assertEqual(caught.exception.code, 400)
        self.assertEqual(detail["error"], genre_families.NEEDS_CONFIRM)
        self.assertEqual(detail["code"], "genre_family_needs_confirm")
