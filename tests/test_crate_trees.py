"""Crate trees by BPM band, key, or genre (part 1 of #31)."""

from __future__ import annotations

import unittest
from contextlib import closing
from typing import cast
from unittest import mock

import crate_trees
import library
import safe_write
import smart_presets
from library import LibraryError, SeratoOpen
from tests import test_server
from tests.fixture import TempLibrary, open_database
from tests.test_smart_presets import _clean_store, _members, _seed

GENRES = {1: "House", 2: "house ", 3: "Deep  House", 4: "House", 6: "Techno", 7: "deep house"}


def _seed_genres(temp: TempLibrary) -> dict[str, int]:
    """Seed the preset fixture and give the tracks genres.

    Track 5 keeps a blank genre. ``House`` has 3 tracks in three spellings,
    ``Deep House`` 2, ``Techno`` 1.

    Args:
        temp: The open temporary library.

    Returns:
        The crate ids from ``_seed``.
    """
    crates = _seed(temp)
    with open_database(temp.db) as conn:
        conn.executemany("UPDATE asset SET genre = ? WHERE id = ?", [(genre, asset) for asset, genre in GENRES.items()])
    return crates


def _children(result: dict[str, object]) -> list[tuple[str, int]]:
    """Read a preview as ``(name, count)`` pairs.

    Args:
        result: A preview or create result.

    Returns:
        The subcrates in tree order.
    """
    return [(str(child["name"]), int(child["count"])) for child in cast("list[dict[str, object]]", result["children"])]


def _child_names(crate_id: int) -> list[str]:
    """List the names of a crate's subcrates in list order.

    Args:
        crate_id: Parent container id.

    Returns:
        Display names.
    """
    with closing(library.read_conn()) as conn:
        rows = conn.execute("SELECT name FROM container WHERE parent_id = ? ORDER BY list_order, id", (crate_id,)).fetchall()
    return [library.display_name(row[0]) for row in rows]


class PresetKindTests(unittest.TestCase):
    """The three preset kinds trees are made of."""

    def test_bad_fields_are_refused(self) -> None:
        """Bands need low < high <= 400. Genres need text. Keys must be known.

        Returns:
            None.
        """
        for preset in (
            {"kind": "bpm_band", "low": 100, "high": 100},
            {"kind": "bpm_band", "low": -1, "high": 100},
            {"kind": "bpm_band", "low": 100, "high": 401},
            {"kind": "bpm_band", "low": "90", "high": 100},
            {"kind": "genre", "genre": "   "},
            {"kind": "genre", "genre": 7},
            {"kind": "genre", "genre": "x" * 201},
            {"kind": "key", "key": "13A"},
        ):
            with self.subTest(preset=preset), self.assertRaises(LibraryError):
                smart_presets.normalize(preset)
        self.assertEqual(smart_presets.normalize({"kind": "genre", "genre": "  Deep   House "})["genre"], "Deep House")

    def test_a_band_from_zero_still_skips_blank_bpm(self) -> None:
        """Track 5 has BPM 0. A 0-130 band holds every other track but not that one.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed(temp)
            with closing(library.read_conn()) as conn:
                ids = smart_presets.matching_ids(
                    conn, "Serato Library", smart_presets.normalize({"kind": "bpm_band", "low": 0, "high": 130})
                )
        self.assertEqual(sorted(ids), [1, 2, 3, 4, 6, 7])

    def test_names(self) -> None:
        """Bands read ``90–100 BPM``, keys and genres are their own names.

        Returns:
            None.
        """
        names = [
            smart_presets.default_name(smart_presets.normalize(p))
            for p in ({"kind": "bpm_band", "low": 90, "high": 100.5}, {"kind": "key", "key": "8A"}, {"kind": "genre", "genre": "House"})
        ]
        self.assertEqual(names, ["90–100.5 BPM ⟳", "8A ⟳", "House ⟳"])


class NormalizeTests(unittest.TestCase):
    """Tree fields are checked before anything is read."""

    def test_defaults(self) -> None:
        """BPM bands default to 80-140 in steps of 10. Genres to 2 tracks, 40 genres.

        Returns:
            None.
        """
        self.assertEqual(
            crate_trees.normalize({"kind": "bpm", "width": 8}),
            {"kind": "bpm", "low": 80.0, "high": 140.0, "width": 8.0, "step": 8.0},
        )
        self.assertEqual(crate_trees.normalize({"kind": "genre"}), {"kind": "genre", "min_tracks": 2, "limit": 40})
        self.assertEqual(crate_trees.normalize({"kind": "key", "crate": 4}), {"kind": "key", "crate": 4})

    def test_bad_trees_are_refused(self) -> None:
        """Out-of-range bands, too many bands, and bad genre limits raise.

        Returns:
            None.
        """
        for tree in (
            None,
            {"kind": "mood"},
            {"kind": "bpm", "low": 140, "high": 80},
            {"kind": "bpm", "low": 0},
            {"kind": "bpm", "high": 401},
            {"kind": "bpm", "width": 0},
            {"kind": "bpm", "width": 51},
            {"kind": "bpm", "width": 10, "step": 11},
            {"kind": "bpm", "low": 1, "high": 400, "width": 1, "step": 1},
            {"kind": "genre", "min_tracks": 0},
            {"kind": "genre", "limit": 101},
            {"kind": "genre", "limit": True},
            {"kind": "key", "crate": "2"},
        ):
            with self.subTest(tree=tree), self.assertRaises(LibraryError):
                crate_trees.normalize(tree)
        self.assertEqual(len(crate_trees._bands(1, 400, 1, 1)), crate_trees.MAX_BANDS + 1)
        self.assertEqual(len(crate_trees._bands(80, 140, 1, 1)), crate_trees.MAX_BANDS)
        crate_trees.normalize({"kind": "bpm", "low": 80, "high": 140, "width": 1, "step": 1})
        with self.assertRaises(LibraryError):
            crate_trees.normalize({"kind": "bpm", "low": 80, "high": 141, "width": 1, "step": 1})


class PreviewTests(unittest.TestCase):
    """Preview lists the subcrates without writing."""

    def test_bpm_bands_are_half_open_and_skip_empty_bands(self) -> None:
        """120 lands in 120-125, not 115-120. Zero BPM is in no band. 100-115 are empty.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed(temp)
            plain = crate_trees.preview("Serato Library", {"kind": "bpm", "low": 100, "high": 130, "width": 5})
            overlap = crate_trees.preview("Serato Library", {"kind": "bpm", "low": 115, "high": 125, "width": 10, "step": 5})
        self.assertEqual(_children(plain), [("115–120 BPM ⟳", 1), ("120–125 BPM ⟳", 3), ("125–130 BPM ⟳", 2)])
        self.assertEqual(_children(overlap), [("115–125 BPM ⟳", 4), ("120–130 BPM ⟳", 5)])
        self.assertEqual(plain["name"], "BPM bands")

    def test_keys_in_camelot_order(self) -> None:
        """Only keys with tracks, 1A, 1B, 2A, ... 12A. ``Am`` counts as 8A.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed(temp)
            result = crate_trees.preview("Serato Library", {"kind": "key"})
        self.assertEqual(
            _children(result),
            [("1A ⟳", 2), ("1B ⟳", 1), ("2A ⟳", 1), ("6A ⟳", 1), ("8A ⟳", 1), ("12A ⟳", 1)],
        )

    def test_genres_group_spellings_and_apply_the_minimum_and_limit(self) -> None:
        """House (3 spellings), Deep House, and Techno, largest first. Blank is skipped.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed_genres(temp)
            default = crate_trees.preview("Serato Library", {"kind": "genre"})
            every = crate_trees.preview("Serato Library", {"kind": "genre", "min_tracks": 1})
            top = crate_trees.preview("Serato Library", {"kind": "genre", "min_tracks": 1, "limit": 1})
        self.assertEqual(_children(default), [("House ⟳", 3), ("Deep House ⟳", 2)])
        self.assertEqual(_children(every), [("House ⟳", 3), ("Deep House ⟳", 2), ("Techno ⟳", 1)])
        self.assertEqual(_children(top), [("House ⟳", 3)])

    def test_scope_limits_every_subcrate(self) -> None:
        """Scoped to Bar set (tracks 3 and 4 with its subcrate), only those tracks count.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            crates = _seed_genres(temp)
            genres = crate_trees.preview("Serato Library", {"kind": "genre", "min_tracks": 1, "crate": crates["bar"]})
            keys = crate_trees.preview("Serato Library", {"kind": "key", "crate": crates["bar"]})
            with self.assertRaises(LibraryError):
                crate_trees.preview("Serato Library", {"kind": "key", "crate": 999})
        self.assertEqual(_children(genres), [("Deep House ⟳", 1), ("House ⟳", 1)])
        self.assertEqual(_children(keys), [("1B ⟳", 1), ("2A ⟳", 1)])


class CreateTests(unittest.TestCase):
    """Create writes the whole tree in one checked write."""

    def test_tree_is_one_write_and_every_subcrate_refreshes(self) -> None:
        """Parent plus subcrates in one operation, presets remembered, refresh follows a genre change.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed_genres(temp)
            before = len(safe_write.read_log())
            result = crate_trees.create("Serato Library", {"kind": "genre"}, None, "")
            after = len(safe_write.read_log())
            parent = cast(int, result["id"])
            children = cast("list[dict[str, object]]", result["children"])
            house = cast(int, children[0]["id"])
            names = _child_names(parent)
            members = _members(house)
            remembered = smart_presets.remembered(house)
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET genre = 'HOUSE' WHERE id = 6")
            refreshed = smart_presets.refresh(house)
            after_refresh = _members(house)
        self.assertEqual(after - before, 1)
        self.assertEqual(result["name"], "Genres")
        self.assertEqual(names, ["House ⟳", "Deep House ⟳"])
        self.assertEqual(sorted(members), [1, 2, 4])
        assert remembered is not None
        self.assertEqual(remembered["preset"], {"kind": "genre", "genre": "House"})
        self.assertNotIn("preset", children[0])
        self.assertTrue(refreshed["ok"])
        self.assertEqual(sorted(after_refresh), [1, 2, 4, 6])

    def test_a_lost_track_rolls_the_whole_tree_back(self) -> None:
        """The check after the commit compares every subcrate with its matches.

        One membership insert is made to do nothing, so the House subcrate
        is short a track. The check fails, the write is put back, no crate
        stays, and no preset is remembered.

        Returns:
            None.
        """
        real = library._membership

        def drop_four(conn: object, crate_id: int, asset_id: int, space: str, add: bool) -> dict[str, object]:
            if add and asset_id == 4:
                return {"ok": True, "id": crate_id, "warning": None}
            return real(conn, crate_id, asset_id, space, add)  # type: ignore[arg-type]

        with _clean_store(), TempLibrary() as temp:
            _seed_genres(temp)
            with open_database(temp.db) as conn:
                before = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            with mock.patch("library._membership", side_effect=drop_four), self.assertRaises(LibraryError):
                crate_trees.create("Serato Library", {"kind": "genre"})
            with open_database(temp.db) as conn:
                after = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            stored = smart_presets.list_remembered()
            last = safe_write.read_log()[-1]
        self.assertEqual((before, stored), (after, {}))
        self.assertEqual(last["result"], "rolled_back")

    def test_tree_goes_inside_a_parent_crate_with_a_typed_name(self) -> None:
        """``parent`` and ``name`` place and name the folder crate.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            crates = _seed(temp)
            result = crate_trees.create("Serato Library", {"kind": "key"}, crates["other"], "  By key ")
            with closing(library.read_conn()) as conn:
                row = conn.execute("SELECT parent_id, name FROM container WHERE id = ?", (result["id"],)).fetchone()
        self.assertEqual((row[0], row[1]), (crates["other"], "By key"))

    def test_empty_tree_writes_nothing(self) -> None:
        """A tree no track fits is refused before any crate is made.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            with open_database(temp.db) as conn:
                before = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            with self.assertRaises(LibraryError) as caught:
                crate_trees.create("Serato Library", {"kind": "bpm", "low": 300, "high": 400, "width": 50})
            with open_database(temp.db) as conn:
                after = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            stored = smart_presets.list_remembered()
        self.assertEqual(caught.exception.message, crate_trees.EMPTY_TREE)
        self.assertEqual((before, stored), (after, {}))

    def test_serato_running_refuses_and_remembers_nothing(self) -> None:
        """A live Serato lock refuses the whole tree.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            with open_database(temp.db) as conn:
                conn.execute("INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')")
                before = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                crate_trees.create("Serato Library", {"kind": "key"})
            with open_database(temp.db) as conn:
                after = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            stored = smart_presets.list_remembered()
        self.assertEqual((before, stored), (after, {}))


class TreeApiTests(unittest.TestCase):
    """``POST /api/crate-tree`` against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_preview_create_and_errors(self) -> None:
        """Preview answers without writing, create makes the tree, bad trees get a code.

        Returns:
            None.
        """
        with _clean_store():
            _seed(self.library)
            status, preview = self.request("/api/crate-tree", {"action": "preview", "tree": {"kind": "key"}})
            self.assertEqual(status, 200)
            self.assertEqual(len(cast(dict, preview)["children"]), 6)
            status, made = self.request("/api/crate-tree", {"action": "create", "tree": {"kind": "key"}})
            self.assertEqual(status, 200)
            status, body = self.request("/api/library")
            names = [crate["name"] for crate in cast(dict, body)["crates"]]
            self.assertIn("Keys", names)
            self.assertIn("8A ⟳", names)
            status, bad = self.request("/api/crate-tree", {"action": "preview", "tree": {"kind": "bpm", "width": 0}})
            self.assertEqual((status, cast(dict, bad)["code"]), (400, "tree_bad_bands"))
            status, bad = self.request("/api/crate-tree", {"action": "create", "tree": {"kind": "bpm", "low": 300, "high": 400, "width": 50}})
            self.assertEqual((status, cast(dict, bad)["code"]), (400, "tree_empty"))
            self.assertIsInstance(cast(dict, made)["id"], int)


if __name__ == "__main__":
    unittest.main()
