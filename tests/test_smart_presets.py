"""Preset crates the app evaluates and saves as normal crates (part 1 of #26)."""

from __future__ import annotations

import json
import unittest
from collections.abc import Iterator
from contextlib import closing, contextmanager
from typing import cast
from unittest import mock

import app_config
import library
import smart_presets
from library import LibraryError, SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests import test_server

NOW = 1_800_000_000.0
DAY = 24 * 3600


def _seed(temp: TempLibrary) -> dict[str, int]:
    """Add keyed tracks, history, and a Bar set crate with a Late subcrate.

    The fixture already has tracks 1 and 2 (``Same``, 1A, 120 BPM). Track 1
    was played at time 100, long ago. Crates are made through
    ``library.crate_action`` so they have the same rows a page edit makes.

    Args:
        temp: The open temporary library.

    Returns:
        Crate ids: ``bar`` (holds 3), ``late`` (inside Bar set, holds 4),
        and ``other`` (holds 1).
    """
    with open_database(temp.db) as conn:
        conn.executemany(
            """
            INSERT INTO asset (id, name, artist, bpm, key, file_name, portable_id, location_id, is_missing)
            VALUES (?, ?, 'Artist', ?, ?, ?, ?, 1, 0)
            """,
            [
                (3, "Neighbour", 123.0, "2A", "n.mp3", "Music/n.mp3"),
                (4, "Relative", 117.0, "1B", "r.mp3", "Music/r.mp3"),
                (5, "Wrap", 0.0, "12A", "w.mp3", "Music/w.mp3"),
                (6, "Far", 128.0, "6A", "f.mp3", "Music/f.mp3"),
                (7, "Traditional", 125.0, "Am", "t.mp3", "Music/t.mp3"),
            ],
        )
        conn.executemany(
            "INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)",
            [(3,), (4,), (5,), (6,), (7,)],
        )
        conn.executemany(
            """
            INSERT INTO history_entry (session_id, asset_id, name, played, start_time)
            VALUES (1, ?, 'x', ?, ?)
            """,
            [(3, 1, int(NOW - 30 * DAY)), (6, 0, int(NOW - 5 * DAY))],
        )
    bar = cast(int, library.crate_action({"action": "create", "name": "Bar set"})["id"])
    late = cast(int, library.crate_action({"action": "create", "name": "Late", "parent": bar})["id"])
    other = cast(int, library.crate_action({"action": "create", "name": "Other"})["id"])
    library.crate_action({"action": "add", "id": bar, "asset": 3})
    library.crate_action({"action": "add", "id": late, "asset": 4})
    library.crate_action({"action": "add", "id": other, "asset": 1})
    return {"bar": bar, "late": late, "other": other}


def _members(crate_id: int) -> list[int]:
    """Read one crate's tracks from the temporary master database.

    Args:
        crate_id: Container id.

    Returns:
        Asset ids in crate order.
    """
    with closing(library.read_conn()) as conn:
        return smart_presets._members(conn, crate_id)


def _match(preset: dict[str, object], now: float = NOW) -> list[int]:
    """Evaluate a preset against the temporary library.

    Args:
        preset: Raw preset JSON.
        now: Clock for the unplayed preset.

    Returns:
        Matching asset ids.
    """
    with closing(library.read_conn()) as conn:
        return smart_presets.matching_ids(conn, "Serato Library", smart_presets.normalize(preset), now)


@contextmanager
def _clean_store() -> Iterator[None]:
    """Remove ``preset-crates.json`` before and after a test.

    Yields:
        None.
    """
    path = app_config.config_dir() / smart_presets.STORE_NAME
    path.unlink(missing_ok=True)
    try:
        yield
    finally:
        path.unlink(missing_ok=True)


class HarmonicKeyTests(unittest.TestCase):
    """The harmonic preset checks its key before reading the library."""

    def test_unknown_key_is_refused(self) -> None:
        """An empty, missing, or made-up key raises the fixed sentence.

        Returns:
            None.
        """
        for key in ("", None, "13A", "H", 8):
            with self.subTest(key=key), self.assertRaises(LibraryError) as caught:
                smart_presets.normalize({"kind": "harmonic", "key": key})
            self.assertEqual(caught.exception.message, smart_presets.BAD_KEY)

    def test_known_keys_are_trimmed(self) -> None:
        """Camelot and traditional names are kept as typed, without spaces.

        Returns:
            None.
        """
        self.assertEqual(smart_presets.normalize({"kind": "harmonic", "key": " Am "})["key"], "Am")
        self.assertEqual(smart_presets.normalize({"kind": "harmonic", "key": "12b"})["key"], "12b")


class NormalizeTests(unittest.TestCase):
    """Preset fields are checked before anything is read."""

    def test_defaults_and_bad_fields(self) -> None:
        """Fill the BPM range and month defaults, and refuse bad values.

        Returns:
            None.
        """
        self.assertEqual(
            smart_presets.normalize({"kind": "bpm", "bpm": 124}),
            {"kind": "bpm", "bpm": 124.0, "range": 3.0},
        )
        self.assertEqual(smart_presets.normalize({"kind": "unplayed"}), {"kind": "unplayed", "months": 12})
        bad = [
            None,
            {"kind": "nope"},
            {"kind": "bpm", "bpm": 0},
            {"kind": "bpm", "bpm": True},
            {"kind": "bpm", "bpm": "124"},
            {"kind": "bpm", "bpm": 124, "range": 51},
            {"kind": "bpm", "bpm": 124, "range": -1},
            {"kind": "bpm", "bpm": float("nan")},
            {"kind": "unplayed", "months": 0},
            {"kind": "unplayed", "months": 241},
            {"kind": "unplayed", "months": 1.5},
            {"kind": "harmonic", "key": "8A", "crate": "3"},
            {"kind": "harmonic", "key": "8A", "crate": True},
        ]
        for preset in bad:
            with self.subTest(preset=preset), self.assertRaises(LibraryError):
                smart_presets.normalize(preset)

    def test_default_names(self) -> None:
        """Each kind gets a readable name ending in the refresh mark.

        Returns:
            None.
        """
        names = [
            smart_presets.default_name(smart_presets.normalize(p))
            for p in (
                {"kind": "harmonic", "key": "8A"},
                {"kind": "bpm", "bpm": 124.5, "range": 2},
                {"kind": "unplayed", "months": 6},
            )
        ]
        self.assertEqual(names, ["Mixes with 8A ⟳", "BPM 124.5 ±2 ⟳", "Not played in 6 months ⟳"])


class MatchTests(unittest.TestCase):
    """Evaluate each preset against a seeded temporary library."""

    def test_harmonic_whole_library_and_scoped(self) -> None:
        """1A finds 1A, 2A, 1B, and 12A. A scope keeps only Bar set and its subcrate.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            crates = _seed(temp)
            everywhere = _match({"kind": "harmonic", "key": "1A"})
            scoped = _match({"kind": "harmonic", "key": "1A", "crate": crates["bar"]})
            only_late = _match({"kind": "harmonic", "key": "1A", "crate": crates["late"]})
            traditional = _match({"kind": "harmonic", "key": "8A"})
            wrap_down = _match({"kind": "harmonic", "key": "12A"})
            minor_name = _match({"kind": "harmonic", "key": "C"})
        self.assertEqual(everywhere, [3, 4, 1, 2, 5])
        self.assertEqual(scoped, [3, 4])
        self.assertEqual(only_late, [4])
        self.assertEqual(traditional, [7])
        self.assertEqual(wrap_down, [1, 2, 5])
        self.assertEqual(minor_name, [7])

    def test_bpm_edges_are_inclusive_and_blank_bpm_is_skipped(self) -> None:
        """120 ±3 takes 117 and 123. A zero BPM never matches. ±0 is exact.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed(temp)
            wide = _match({"kind": "bpm", "bpm": 120, "range": 3})
            exact = _match({"kind": "bpm", "bpm": 120, "range": 0})
            narrow = _match({"kind": "bpm", "bpm": 120, "range": 2.9})
            near_zero = _match({"kind": "bpm", "bpm": 1, "range": 3})
        self.assertEqual(near_zero, [])
        self.assertEqual(wide, [3, 4, 1, 2])
        self.assertEqual(exact, [1, 2])
        self.assertEqual(narrow, [1, 2])

    def test_unplayed_uses_played_history_after_the_cutoff(self) -> None:
        """A play 30 days ago hides a track from both 1 and 12 months, until it ages out.

        Track 3 was played 30 days before ``NOW``. Track 6 was loaded 5 days
        ago but not played, so it still counts as unplayed. Track 1 was played
        at time 100. Every other track was never played.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed(temp)
            year = _match({"kind": "unplayed", "months": 12})
            month = _match({"kind": "unplayed", "months": 1})
            later = _match({"kind": "unplayed", "months": 1}, now=NOW + 2 * DAY)
        self.assertNotIn(3, year)
        self.assertEqual(sorted(year), [1, 2, 4, 5, 6, 7])
        self.assertNotIn(3, month)
        self.assertIn(3, later)

    def test_scope_outside_the_space_is_refused(self) -> None:
        """A crate id from another space, or no crate at all, raises.

        Returns:
            None.
        """
        with TempLibrary():
            for crate in (2, 999):
                with self.subTest(crate=crate), self.assertRaises(LibraryError):
                    _match({"kind": "harmonic", "key": "1A", "crate": crate})


class CreateAndRefreshTests(unittest.TestCase):
    """Saving and refreshing a preset crate goes through the checked write."""

    def test_preview_writes_nothing(self) -> None:
        """Preview counts matches and leaves the crate table and the store alone.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            with open_database(temp.db) as conn:
                before = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            result = smart_presets.preview("Serato Library", {"kind": "bpm", "bpm": 120})
            with open_database(temp.db) as conn:
                after = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            stored = smart_presets.list_remembered()
        self.assertEqual(result["count"], 4)
        self.assertEqual(result["name"], "BPM 120 ±3 ⟳")
        self.assertEqual(before, after)
        self.assertEqual(stored, {})

    def test_create_saves_matches_and_remembers_the_preset(self) -> None:
        """A scoped harmonic crate holds 3 and 4, and the store names it.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            crates = _seed(temp)
            result = smart_presets.create(
                "Serato Library", {"kind": "harmonic", "key": "1A", "crate": crates["bar"]}
            )
            crate_id = cast(int, result["id"])
            members = _members(crate_id)
            record = smart_presets.remembered(crate_id)
            raw = json.loads((app_config.config_dir() / smart_presets.STORE_NAME).read_text("utf-8"))
        self.assertEqual(result["name"], "Mixes with 1A ⟳")
        self.assertEqual(result["added"], 2)
        self.assertEqual(members, [3, 4])
        assert record is not None
        self.assertEqual(record["preset"], {"kind": "harmonic", "key": "1A", "crate": crates["bar"]})
        self.assertEqual(record["stored_name"], "Mixes with 1A ⟳")
        self.assertEqual(list(raw), [str(temp.db.resolve())])
        self.assertFalse(str(temp.root) in str(app_config.config_dir()))

    def test_typed_name_gets_one_refresh_mark(self) -> None:
        """``Warmup`` becomes ``Warmup ⟳``. ``Warmup ⟳`` is not doubled.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            first = smart_presets.create("Serato Library", {"kind": "bpm", "bpm": 120}, None, "Warmup")
            second = smart_presets.create("Serato Library", {"kind": "bpm", "bpm": 120}, None, "Cool ⟳")
        self.assertEqual(first["name"], "Warmup ⟳")
        self.assertEqual(second["name"], "Cool ⟳")

    def test_refresh_adds_new_matches_and_drops_old_ones(self) -> None:
        """After 6 is retagged 2A and added to Bar set, and 4 leaves Late, refresh follows.

        Track 3 still matches and keeps its first place.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            crates = _seed(temp)
            made = smart_presets.create(
                "Serato Library", {"kind": "harmonic", "key": "1A", "crate": crates["bar"]}
            )
            crate_id = cast(int, made["id"])
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET key = '2A' WHERE id = 6")
            library.crate_action({"action": "add", "id": crates["bar"], "asset": 6})
            library.crate_action({"action": "remove", "id": crates["late"], "asset": 4})
            result = smart_presets.refresh(crate_id)
            members = _members(crate_id)
            again = smart_presets.refresh(crate_id)
        self.assertEqual((result["added"], result["removed"], result["count"]), (1, 1, 2))
        self.assertEqual(members, [3, 6])
        self.assertEqual((again["added"], again["removed"]), (0, 0))

    def test_refresh_never_touches_a_new_crate_that_reused_the_id(self) -> None:
        """Delete a preset crate, make another crate with the same id, refresh is refused.

        SQLite gives the next crate the deleted crate's id. That crate's
        track must stay and the stale record must be forgotten.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            made = smart_presets.create("Serato Library", {"kind": "bpm", "bpm": 128, "range": 0})
            crate_id = cast(int, made["id"])
            library.crate_action({"action": "delete", "id": crate_id})
            mine = cast(int, library.crate_action({"action": "create", "name": "Mine"})["id"])
            library.crate_action({"action": "add", "id": mine, "asset": 1})
            self.assertEqual(mine, crate_id)
            # Same added second, so only the stored name tells the crates apart.
            stamp = cast(dict, smart_presets.list_remembered()[str(crate_id)])["time_added"]
            with open_database(temp.db) as conn:
                conn.execute("UPDATE container SET time_added = ? WHERE id = ?", (stamp, mine))
            with self.assertRaises(LibraryError) as caught:
                smart_presets.refresh(crate_id)
            members = _members(mine)
            record = smart_presets.remembered(crate_id)
        self.assertEqual(caught.exception.message, smart_presets.PRESET_CRATE_GONE)
        self.assertEqual(caught.exception.status, 404)
        self.assertEqual(members, [1])
        self.assertIsNone(record)

    def test_refresh_refuses_a_crate_whose_added_time_changed(self) -> None:
        """Same id and name but a different added time is a different crate.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            made = smart_presets.create("Serato Library", {"kind": "bpm", "bpm": 120})
            crate_id = cast(int, made["id"])
            with open_database(temp.db) as conn:
                conn.execute("UPDATE container SET time_added = time_added + 1 WHERE id = ?", (crate_id,))
            with self.assertRaises(LibraryError):
                smart_presets.refresh(crate_id)

    def test_refresh_of_an_unknown_crate_is_404(self) -> None:
        """A crate that was not made from a preset is not refreshed.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            crates = _seed(temp)
            with self.assertRaises(LibraryError) as caught:
                smart_presets.refresh(crates["bar"])
        self.assertEqual(caught.exception.message, smart_presets.NOT_A_PRESET_CRATE)
        self.assertEqual(caught.exception.status, 404)

    def test_serato_running_blocks_create_and_remembers_nothing(self) -> None:
        """A live Serato lock refuses the write before the store is touched.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
                before = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            with mock.patch("library._process_is_serato", return_value=True):
                with self.assertRaises(SeratoOpen):
                    smart_presets.create("Serato Library", {"kind": "bpm", "bpm": 120})
            with open_database(temp.db) as conn:
                after = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            stored = smart_presets.list_remembered()
        self.assertEqual(before, after)
        self.assertEqual(stored, {})

    def test_presets_are_kept_per_library_file(self) -> None:
        """A preset saved for one library is not listed for another.

        Returns:
            None.
        """
        with _clean_store():
            with TempLibrary() as temp:
                _seed(temp)
                smart_presets.create("Serato Library", {"kind": "bpm", "bpm": 120})
                self.assertEqual(len(smart_presets.list_remembered()), 1)
            with TempLibrary():
                self.assertEqual(smart_presets.list_remembered(), {})

    def test_damaged_store_reads_as_empty(self) -> None:
        """A broken ``preset-crates.json`` does not block a new preset crate.

        Returns:
            None.
        """
        with _clean_store(), TempLibrary() as temp:
            _seed(temp)
            path = app_config.config_dir() / smart_presets.STORE_NAME
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("{not json", encoding="utf-8")
            self.assertEqual(smart_presets.list_remembered(), {})
            made = smart_presets.create("Serato Library", {"kind": "bpm", "bpm": 120})
            self.assertIsNotNone(smart_presets.remembered(cast(int, made["id"])))


class PresetApiTests(unittest.TestCase):
    """``POST /api/smart-preset`` against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_preview_create_refresh_and_errors(self) -> None:
        """Preview counts, create writes, refresh answers, and bad input gets a code.

        Returns:
            None.
        """
        with _clean_store():
            _seed(self.library)
            status, preview = self.request(
                "/api/smart-preset", {"action": "preview", "preset": {"kind": "bpm", "bpm": 120}}
            )
            self.assertEqual(status, 200)
            self.assertEqual(cast(dict, preview)["count"], 4)
            status, made = self.request(
                "/api/smart-preset", {"action": "create", "preset": {"kind": "bpm", "bpm": 120}}
            )
            self.assertEqual(status, 200)
            crate_id = cast(dict, made)["id"]
            status, library_body = self.request("/api/library")
            names = [crate["name"] for crate in cast(dict, library_body)["crates"]]
            self.assertIn("BPM 120 ±3 ⟳", names)
            status, refreshed = self.request("/api/smart-preset", {"action": "refresh", "id": crate_id})
            self.assertEqual(status, 200)
            self.assertEqual(cast(dict, refreshed)["count"], 4)
            status, listed = self.request("/api/smart-preset", {"action": "list"})
            self.assertEqual(list(cast(dict, listed)["crates"]), [str(crate_id)])
            status, bad = self.request(
                "/api/smart-preset", {"action": "preview", "preset": {"kind": "harmonic", "key": "Z"}}
            )
            self.assertEqual(status, 400)
            self.assertEqual(cast(dict, bad)["code"], "preset_bad_key")
            status, bad = self.request("/api/smart-preset", {"action": "refresh", "id": 1})
            self.assertEqual(status, 404)
            self.assertEqual(cast(dict, bad)["code"], "preset_not_a_preset_crate")
            status, bad = self.request(
                "/api/smart-preset",
                {"action": "preview", "space": "Nope", "preset": {"kind": "bpm", "bpm": 120}},
            )
            self.assertEqual(status, 400)


if __name__ == "__main__":
    unittest.main()
