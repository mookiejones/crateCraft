"""Spellings of one genre or artist, and title cleanup (#27).

Every case uses a temporary library. Preview, refusals, and GET leave the
library file unchanged.
"""

from __future__ import annotations

import json
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from contextlib import closing
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import library
import server
import tag_cleanup
from library import SeratoOpen
from tag_cleanup import clean_title, normalize
from tests import test_server
import app_config
from tests.fixture import TempLibrary, open_database


def _tracks(db: Path, rows: list[tuple[str | None, str | None]], *, space_id: int = 1, start: int = 1) -> None:
    """Add ``(genre, artist)`` tracks to a space, replacing the fixture's when starting at 1."""
    with closing(sqlite3.connect(db)) as conn:
        if start == 1:
            conn.execute("DELETE FROM space_asset")
            conn.execute("DELETE FROM asset")
        for offset, (genre, artist) in enumerate(rows):
            asset_id = start + offset
            conn.execute("INSERT INTO asset (id, name, genre, artist) VALUES (?, 'T', ?, ?)", (asset_id, genre, artist))
            conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, ?)", (asset_id, space_id))
        conn.commit()


def _named(
    db: Path, rows: list[tuple[str, str | None]], *, space_id: int = 1, start: int = 1
) -> None:
    """Add ``(name, remixer)`` tracks to a space, replacing the fixture's when starting at 1."""
    with closing(sqlite3.connect(db)) as conn:
        if start == 1:
            conn.execute("DELETE FROM space_asset")
            conn.execute("DELETE FROM asset")
        for offset, (name, remixer) in enumerate(rows):
            asset_id = start + offset
            conn.execute(
                "INSERT INTO asset (id, name, artist, remixer) VALUES (?, ?, 'A', ?)",
                (asset_id, name, remixer),
            )
            conn.execute(
                "INSERT INTO space_asset (asset_id, space_id) VALUES (?, ?)",
                (asset_id, space_id),
            )
        conn.commit()


def _titles(db: Path) -> list[tuple[int, str | None, str | None]]:
    """Return ``(id, name, remixer)`` for space 1, ordered by id."""
    with closing(sqlite3.connect(db)) as conn:
        return [
            (int(row[0]), row[1], row[2])
            for row in conn.execute(
                "SELECT a.id, a.name, a.remixer FROM asset a "
                "JOIN space_asset sa ON sa.asset_id = a.id "
                "WHERE sa.space_id = 1 ORDER BY a.id"
            )
        ]


class NormalizeTests(unittest.TestCase):
    """Which spellings share a key."""

    def test_equal_spellings(self) -> None:
        """Case, punctuation, spaces, accents, and & or + do not matter."""
        for group in (
            ("Hip Hop", "Hip-Hop", "hiphop", "HIP HOP", " hip  hop "),
            ("Drum & Bass", "Drum and Bass", "drum+bass", "DRUM N' BASS".replace(" N' ", " and ")),
            ("Beyoncé", "BEYONCE", "Beyoncé"),
        ):
            with self.subTest(group=group):
                self.assertEqual(len({normalize(value) for value in group}), 1)

    def test_different_values_stay_apart(self) -> None:
        """Different words and blanks do not collide."""
        self.assertNotEqual(normalize("House"), normalize("Deep House"))
        self.assertNotEqual(normalize("Techno"), normalize("Tech House"))
        self.assertEqual(normalize(" - "), "")


class CleanTitleTests(unittest.TestCase):
    """Prefix, URL, Original Mix, feat., and casing rules."""

    def test_prefix_url_original_mix_and_feat(self) -> None:
        """Track numbers, URLs, Original Mix, and a feat. credit come off."""
        cleaned = clean_title(
            "01 - SONG TITLE (Original Mix) https://soundcloud.com/x (feat. GUEST)",
            "",
        )
        self.assertEqual(cleaned["name"], "Song Title")
        self.assertEqual(cleaned["remixer"], "Guest")

    def test_dot_and_paren_prefixes(self) -> None:
        """``01.`` and ``1)`` prefixes strip the same way as ``01 - ``."""
        self.assertEqual(clean_title("01. midnight city", "")["name"], "Midnight City")
        self.assertEqual(clean_title("1) midnight city", "")["name"], "Midnight City")

    def test_mixed_case_and_bpm_stay(self) -> None:
        """A mixed-case title is left alone. A number is not a track prefix."""
        self.assertEqual(clean_title("Midnight City", "")["name"], "Midnight City")
        self.assertEqual(clean_title("120 BPM Song", "")["remixer"], None)
        self.assertEqual(clean_title("120 BPM SONG", "")["name"], "120 BPM Song")
        self.assertEqual(clean_title("DJ SNAKE", "")["name"], "DJ Snake")

    def test_occupied_remixer_keeps_feat_in_the_title(self) -> None:
        """A feat. credit stays in the title when remixer already has a value."""
        cleaned = clean_title("Song (feat. Guest)", "Other")
        self.assertEqual(cleaned["name"], "Song (feat. Guest)")
        self.assertIsNone(cleaned["remixer"])

    def test_empty_after_rules_leaves_the_title(self) -> None:
        """A title that is only a prefix is not wiped."""
        cleaned = clean_title("01 - ", "")
        self.assertEqual(cleaned["name"], "01 - ")
        self.assertIsNone(cleaned["remixer"])


class ClusterTests(unittest.TestCase):
    """Grouping, counts, and the suggested spelling."""

    def test_groups_counts_and_suggestion(self) -> None:
        """Only groups with two or more spellings; the most used is suggested."""
        with TempLibrary() as temp:
            _tracks(
                temp.db,
                [("Hip Hop", "A")] * 3
                + [("Hip-Hop", "A")] * 2
                + [("hiphop", "A")]
                + [("House", "A")] * 4
                + [("", "A"), (None, "A"), ("  ", "A")],
            )
            before = temp.db.read_bytes()
            result = tag_cleanup.clusters(temp.db, library.LIBRARY_SPACE, "genre")
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertEqual(result["values"], 4)
        self.assertEqual(
            result["groups"],
            [
                {
                    "key": "hiphop",
                    "suggested": "Hip Hop",
                    "tracks": 6,
                    "spellings": [
                        {"value": "Hip Hop", "count": 3},
                        {"value": "Hip-Hop", "count": 2},
                        {"value": "hiphop", "count": 1},
                    ],
                }
            ],
        )

    def test_tie_goes_to_the_spelling_that_sorts_first(self) -> None:
        """Equal counts pick the alphabetically first spelling."""
        with TempLibrary() as temp:
            _tracks(temp.db, [(None, "dj shadow"), (None, "DJ Shadow")])
            result = tag_cleanup.clusters(temp.db, library.LIBRARY_SPACE, "artist")
        self.assertEqual(result["groups"][0]["suggested"], "DJ Shadow")  # type: ignore[index]

    def test_largest_group_first_and_trailing_spaces_merge(self) -> None:
        """Groups sort by tracks; a stored trailing space is the same spelling."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Disco", "A"), ("disco", "A"), ("Techno", "A"), ("Techno ", "A"), ("TECHNO", "A")])
            result = tag_cleanup.clusters(temp.db, library.LIBRARY_SPACE, "genre")
        groups = result["groups"]
        assert isinstance(groups, list)
        self.assertEqual([group["key"] for group in groups], ["techno", "disco"])
        self.assertEqual(groups[0]["spellings"], [{"value": "Techno", "count": 2}, {"value": "TECHNO", "count": 1}])

    def test_only_the_chosen_space(self) -> None:
        """Tracks in another space are not counted."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("House", "A")])
            _tracks(temp.db, [("house", "A")], space_id=2, start=50)
            result = tag_cleanup.clusters(temp.db, library.LIBRARY_SPACE, "genre")
        self.assertEqual(result["groups"], [])

    def test_bad_field_space_and_missing_library(self) -> None:
        """A field outside genre and artist is 400; bad space and missing library are refused."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(library.LibraryError) as field:
                tag_cleanup.clusters(temp.db, library.LIBRARY_SPACE, "name; DROP TABLE asset")
            with self.assertRaises(library.LibraryError):
                tag_cleanup.clusters(temp.db, "Nope", "genre")
            with self.assertRaises(library.LibraryError) as missing:
                tag_cleanup.clusters(Path(raw) / "master.sqlite", library.LIBRARY_SPACE, "genre")
        self.assertEqual(field.exception.status, 400)
        self.assertEqual(missing.exception.status, 404)


class RouteTests(unittest.TestCase):
    """``GET /api/tag-clusters``."""

    def test_route(self) -> None:
        """Genre by default, artist on request, 400 for anything else."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("House", "Daft Punk"), ("house", "daft punk")])
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            threading.Thread(target=httpd.serve_forever, daemon=True).start()
            host, port = httpd.server_address[:2]
            base = f"http://{host}:{port}/api/tag-clusters?space=Serato%20Library"
            try:
                with urllib.request.urlopen(base, timeout=5) as response:
                    genre = json.loads(response.read().decode("utf-8"))
                with urllib.request.urlopen(base + "&field=artist", timeout=5) as response:
                    artist = json.loads(response.read().decode("utf-8"))
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(base + "&field=name", timeout=5)
                caught.exception.close()
            finally:
                httpd.shutdown()
                httpd.server_close()
        self.assertEqual(genre["field"], "genre")
        self.assertEqual(genre["groups"][0]["key"], "house")
        self.assertEqual(artist["groups"][0]["key"], "daftpunk")
        self.assertEqual(caught.exception.code, 400)


def _genres(db: Path) -> list[tuple[int, str | None]]:
    """Return ``(id, genre)`` for space 1, ordered by id."""
    with closing(sqlite3.connect(db)) as conn:
        return [
            (int(row[0]), row[1])
            for row in conn.execute(
                "SELECT a.id, a.genre FROM asset a "
                "JOIN space_asset sa ON sa.asset_id = a.id "
                "WHERE sa.space_id = 1 ORDER BY a.id"
            )
        ]


class ApplyTests(unittest.TestCase):
    """Preview lists rows. Apply rewrites only that group's field in that space."""

    def test_preview_does_not_write(self) -> None:
        """Preview lists Hip-Hop and hiphop. The library bytes stay the same."""
        with TempLibrary() as temp:
            _tracks(
                temp.db,
                [("Hip Hop", "A")] * 3 + [("Hip-Hop", "A")] * 2 + [("hiphop", "A")] + [("House", "A")],
            )
            before = temp.db.read_bytes()
            plan = tag_cleanup.preview(temp.db, library.LIBRARY_SPACE, "genre", "Hip Hop")
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertEqual(plan["written"], False)
        self.assertEqual(plan["key"], "hiphop")
        self.assertEqual(plan["value"], "Hip Hop")
        ids = [change["id"] for change in plan["changes"]]  # type: ignore[union-attr]
        self.assertEqual(len(ids), 3)
        self.assertNotIn(7, ids)

    def test_apply_rewrites_the_group_only(self) -> None:
        """Hip-Hop and hiphop become Hip Hop. House, the other space, and artist stay."""
        with TempLibrary() as temp:
            _tracks(
                temp.db,
                [("Hip Hop", "A")] * 2
                + [("Hip-Hop", "A")]
                + [("hiphop", "A")]
                + [("Hip Hop ", "A")]
                + [("House", "A")],
            )
            _tracks(temp.db, [("hip-hop", "B")], space_id=2, start=50)
            result = tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            genres = _genres(temp.db)
            with open_database(temp.db) as conn:
                other = conn.execute("SELECT genre FROM asset WHERE id = 50").fetchone()
                artist = conn.execute("SELECT artist FROM asset WHERE id = 1").fetchone()
        self.assertEqual(result["written"], True)
        self.assertEqual([genre for _id, genre in genres], ["Hip Hop"] * 5 + ["House"])
        self.assertEqual(other[0], "hip-hop")
        self.assertEqual(artist[0], "A")

    def test_apply_rewrites_artist(self) -> None:
        """dj shadow becomes DJ Shadow. Genre stays House."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("House", "DJ Shadow"), ("House", "dj shadow")])
            result = tag_cleanup.apply(library.LIBRARY_SPACE, "artist", "DJ Shadow")
            with open_database(temp.db) as conn:
                artists = [row[0] for row in conn.execute("SELECT artist FROM asset ORDER BY id")]
                genres = [row[0] for row in conn.execute("SELECT genre FROM asset ORDER BY id")]
        self.assertEqual(result["written"], True)
        self.assertEqual(artists, ["DJ Shadow", "DJ Shadow"])
        self.assertEqual(genres, ["House", "House"])

    def test_refusals_leave_the_library(self) -> None:
        """A spelling outside a group, a blank, and a made-up spelling do not write."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A"), ("House", "A")])
            before = temp.db.read_bytes()
            with self.assertRaises(library.LibraryError) as missing:
                tag_cleanup.preview(temp.db, library.LIBRARY_SPACE, "genre", "HIPHOP")
            with self.assertRaises(library.LibraryError) as house:
                tag_cleanup.preview(temp.db, library.LIBRARY_SPACE, "genre", "House")
            with self.assertRaises(library.LibraryError) as blank:
                tag_cleanup.preview(temp.db, library.LIBRARY_SPACE, "genre", "  ")
            with self.assertRaises(library.LibraryError) as number:
                tag_cleanup.preview(temp.db, library.LIBRARY_SPACE, "genre", 1)
            with self.assertRaises(library.LibraryError) as long:
                tag_cleanup.preview(temp.db, library.LIBRARY_SPACE, "genre", "x" * 4001)
            with self.assertRaises(library.LibraryError) as field:
                tag_cleanup.apply(library.LIBRARY_SPACE, "name", "Hip Hop")
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertEqual(missing.exception.message, tag_cleanup.NOT_IN_GROUP)
        self.assertEqual(house.exception.message, tag_cleanup.NOT_IN_GROUP)
        self.assertEqual(blank.exception.message, tag_cleanup.CHOOSE_SPELLING)
        self.assertEqual(number.exception.message, tag_cleanup.CHOOSE_SPELLING)
        self.assertEqual(long.exception.message, "genre is too long.")
        self.assertEqual(field.exception.message, tag_cleanup.CHOOSE_FIELD)

    def test_serato_open_blocks_the_write(self) -> None:
        """A running Serato process refuses apply. Preview still reads."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
            preview = tag_cleanup.preview(temp.db, library.LIBRARY_SPACE, "genre", "Hip Hop")
            self.assertEqual(len(preview["changes"]), 1)  # type: ignore[arg-type]
            with open_database(temp.db) as conn:
                conn.execute("INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')")
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            self.assertEqual(_genres(temp.db)[1][1], "Hip-Hop")


class TitleCleanupTests(unittest.TestCase):
    """Preview lists dirty titles. Apply rewrites only those rows in that space."""

    def test_preview_does_not_write(self) -> None:
        """Preview lists the dirty title. The library bytes stay the same."""
        with TempLibrary() as temp:
            _named(temp.db, [("01 - SONG TITLE", None), ("Midnight City", None)])
            before = temp.db.read_bytes()
            plan = tag_cleanup.preview_titles(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertEqual(plan["written"], False)
        self.assertEqual(plan["field"], "name")
        self.assertEqual(len(plan["changes"]), 1)
        self.assertEqual(plan["changes"][0]["from"], "01 - SONG TITLE")
        self.assertEqual(plan["changes"][0]["to"], "Song Title")

    def test_apply_rewrites_titles_and_moves_feat(self) -> None:
        """Dirty titles and an empty remixer change. Mixed case and the other space stay."""
        with TempLibrary() as temp:
            _named(
                temp.db,
                [
                    ("01 - SONG TITLE (feat. GUEST)", None),
                    ("Midnight City", None),
                    ("Song (feat. Kept)", "Already"),
                ],
            )
            _named(temp.db, [("01 - OTHER SPACE", None)], space_id=2, start=50)
            result = tag_cleanup.apply_titles(library.LIBRARY_SPACE)
            rows = _titles(temp.db)
            with open_database(temp.db) as conn:
                other = conn.execute("SELECT name FROM asset WHERE id = 50").fetchone()
        self.assertEqual(result["written"], True)
        self.assertEqual(rows[0], (1, "Song Title", "Guest"))
        self.assertEqual(rows[1], (2, "Midnight City", None))
        self.assertEqual(rows[2], (3, "Song (feat. Kept)", "Already"))
        self.assertEqual(other[0], "01 - OTHER SPACE")

    def test_nothing_to_change_does_not_write(self) -> None:
        """A space of already-clean titles returns written false."""
        with TempLibrary() as temp:
            _named(temp.db, [("Midnight City", None)])
            before = temp.db.read_bytes()
            result = tag_cleanup.apply_titles(library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertEqual(result["written"], False)
        self.assertEqual(result["changes"], [])

    def test_unknown_space_does_not_write(self) -> None:
        """A made-up space is 400 and the library stays put."""
        with TempLibrary() as temp:
            _named(temp.db, [("01 - SONG", None)])
            before = temp.db.read_bytes()
            with self.assertRaises(library.LibraryError) as caught:
                tag_cleanup.preview_titles(temp.db, "Nope")
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertEqual(caught.exception.message, "That space is not available here.")

    def test_serato_open_blocks_the_write(self) -> None:
        """A running Serato process refuses apply_titles. Preview still reads."""
        with TempLibrary() as temp:
            _named(temp.db, [("01 - SONG TITLE", None)])
            preview = tag_cleanup.preview_titles(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(len(preview["changes"]), 1)
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                tag_cleanup.apply_titles(library.LIBRARY_SPACE)
            self.assertEqual(_titles(temp.db)[0][1], "01 - SONG TITLE")


def _store() -> Path:
    """Return the mapping file the suite's isolated config dir uses."""
    return app_config.config_dir() / tag_cleanup.STORE_NAME


def _clear_store() -> None:
    """Remove ``tag-spellings.json`` if a previous test left one."""
    _store().unlink(missing_ok=True)


class MappingTests(unittest.TestCase):
    """Apply remembers a spelling. Refresh rewrites later rows that share the key."""

    def setUp(self) -> None:
        """Start each case with an empty mapping file."""
        _clear_store()

    def tearDown(self) -> None:
        """Leave no mapping file for the next case."""
        _clear_store()

    def test_apply_remembers_beside_settings_not_in_the_serato_folder(self) -> None:
        """Hip Hop is stored next to settings. The library folder stays free of it."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
            tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            stored = json.loads(_store().read_text(encoding="utf-8"))
            key = str(temp.db.resolve())
            self.assertEqual(stored[key]["genre"]["hiphop"], "Hip Hop")
            self.assertFalse((temp.db.parent / tag_cleanup.STORE_NAME).exists())

    def test_apply_with_nothing_left_still_remembers(self) -> None:
        """An apply whose rows already match still saves the mapping."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
            before = temp.db.read_bytes()
            with mock.patch("tag_cleanup._changes", return_value=[]):
                result = tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            self.assertEqual(temp.db.read_bytes(), before)
            stored = json.loads(_store().read_text(encoding="utf-8"))
            self.assertEqual(stored[str(temp.db.resolve())]["genre"]["hiphop"], "Hip Hop")
        self.assertEqual(result["written"], False)
        self.assertEqual(result["changes"], [])

    def test_serato_open_does_not_remember(self) -> None:
        """A running Serato process refuses apply and leaves the store empty."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
        self.assertFalse(_store().exists())

    def test_refresh_rewrites_genre_and_artist_in_one_write(self) -> None:
        """Saved genre and artist mappings rewrite together. House stays."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "DJ Shadow"), ("Hip-Hop", "dj shadow")])
            tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            tag_cleanup.apply(library.LIBRARY_SPACE, "artist", "DJ Shadow")
            _tracks(temp.db, [("Hip-Hop", "dj shadow"), ("House", "Other")], start=10)
            result = tag_cleanup.apply_mappings(library.LIBRARY_SPACE)
            with open_database(temp.db) as conn:
                rows = conn.execute(
                    "SELECT id, genre, artist FROM asset WHERE id IN (10, 11) ORDER BY id"
                ).fetchall()
        self.assertEqual(result["written"], True)
        self.assertEqual(len(result["changes"]), 2)
        self.assertEqual(rows[0][1], "Hip Hop")
        self.assertEqual(rows[0][2], "DJ Shadow")
        self.assertEqual(rows[1][1], "House")
        self.assertEqual(rows[1][2], "Other")

    def test_refresh_rewrites_a_later_import_without_a_group(self) -> None:
        """A new Hip-Hop row after apply is rewritten. House and the other space stay."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A"), ("House", "A")])
            tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            _tracks(temp.db, [("Hip-Hop", "A"), ("House", "A")], start=10)
            _tracks(temp.db, [("hip-hop", "B")], space_id=2, start=50)
            before = _store().read_bytes()
            preview = tag_cleanup.preview_mappings(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes() is not None, True)
            self.assertEqual(preview["written"], False)
            self.assertEqual(preview["field"], "mappings")
            self.assertEqual(
                [(change["id"], change["from"], change["to"], change.get("field")) for change in preview["changes"]],
                [(10, "Hip-Hop", "Hip Hop", "genre")],
            )
            result = tag_cleanup.apply_mappings(library.LIBRARY_SPACE)
            genres = _genres(temp.db)
            with open_database(temp.db) as conn:
                other = conn.execute("SELECT genre FROM asset WHERE id = 50").fetchone()
        self.assertEqual(result["written"], True)
        self.assertEqual(dict(genres)[10], "Hip Hop")
        self.assertEqual(dict(genres)[11], "House")
        self.assertEqual(other[0], "hip-hop")
        self.assertEqual(_store().read_bytes(), before)

    def test_refresh_preview_does_not_write(self) -> None:
        """Preview of saved mappings leaves the library bytes unchanged."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
            tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            _tracks(temp.db, [("hiphop", "A")], start=10)
            before = temp.db.read_bytes()
            tag_cleanup.preview_mappings(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)

    def test_nothing_to_refresh_does_not_write(self) -> None:
        """An empty mapping store returns written false."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip-Hop", "A")])
            before = temp.db.read_bytes()
            result = tag_cleanup.apply_mappings(library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)
        self.assertEqual(result["written"], False)
        self.assertEqual(result["changes"], [])

    def test_broken_store_and_other_library_are_ignored(self) -> None:
        """A damaged file and a mapping for another library do not rewrite."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip-Hop", "A")])
            _store().parent.mkdir(parents=True, exist_ok=True)
            _store().write_text("{not json", encoding="utf-8")
            broken = tag_cleanup.preview_mappings(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(broken["changes"], [])
            _store().write_text(
                json.dumps({"/other/master.sqlite": {"genre": {"hiphop": "Hip Hop"}}}),
                encoding="utf-8",
            )
            other = tag_cleanup.preview_mappings(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(other["changes"], [])
            _store().write_text(
                json.dumps({str(temp.db.resolve()): {"genre": {"hiphop": "House"}}}),
                encoding="utf-8",
            )
            mismatch = tag_cleanup.preview_mappings(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(mismatch["changes"], [])

    def test_serato_open_blocks_refresh(self) -> None:
        """A running Serato process refuses apply_mappings. Preview still reads."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
            tag_cleanup.apply(library.LIBRARY_SPACE, "genre", "Hip Hop")
            _tracks(temp.db, [("Hip-Hop", "A")], start=10)
            preview = tag_cleanup.preview_mappings(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(len(preview["changes"]), 1)
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                tag_cleanup.apply_mappings(library.LIBRARY_SPACE)
            self.assertEqual(_genres(temp.db)[2][1], "Hip-Hop")

    def test_windows_and_posix_library_keys_stay_separate(self) -> None:
        """A mapping stored under a Windows path does not match a POSIX library."""
        with TempLibrary() as temp:
            _tracks(temp.db, [("Hip-Hop", "A")])
            _store().parent.mkdir(parents=True, exist_ok=True)
            _store().write_text(
                json.dumps(
                    {
                        r"C:\Users\dj\Serato\Library\master.sqlite": {
                            "genre": {"hiphop": "Hip Hop"}
                        }
                    }
                ),
                encoding="utf-8",
            )
            plan = tag_cleanup.preview_mappings(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(plan["changes"], [])


class MappingApiTests(unittest.TestCase):
    """``POST /api/tag-clusters`` refresh-preview and refresh-apply."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_refresh_preview_and_apply(self) -> None:
        """refresh-preview does not write. refresh-apply rewrites a later Hip-Hop."""
        _clear_store()
        _tracks(self.library.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
        status, made = self.request(
            "/api/tag-clusters",
            {"action": "apply", "field": "genre", "value": "Hip Hop"},
        )
        self.assertEqual(status, 200)
        _tracks(self.library.db, [("Hip-Hop", "A")], start=10)
        status, preview = self.request("/api/tag-clusters", {"action": "refresh-preview"})
        self.assertEqual(status, 200)
        self.assertEqual(cast_written(preview), False)
        self.assertEqual(_genres(self.library.db)[2][1], "Hip-Hop")
        status, written = self.request("/api/tag-clusters", {"action": "refresh-apply"})
        self.assertEqual(status, 200)
        self.assertEqual(cast_written(written), True)
        self.assertEqual(_genres(self.library.db)[2][1], "Hip Hop")
        _clear_store()


class ApplyApiTests(unittest.TestCase):
    """``POST /api/tag-clusters`` against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_preview_apply_and_errors(self) -> None:
        """Preview does not write. Apply rewrites. Bad values get a code."""
        _tracks(self.library.db, [("Hip Hop", "A"), ("Hip-Hop", "A"), ("House", "A")])
        status, preview = self.request(
            "/api/tag-clusters",
            {"action": "preview", "field": "genre", "value": "Hip Hop"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(cast_written(preview), False)
        self.assertEqual(_genres(self.library.db)[1][1], "Hip-Hop")
        status, made = self.request(
            "/api/tag-clusters",
            {"action": "apply", "field": "genre", "value": "Hip Hop"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(cast_written(made), True)
        self.assertEqual(_genres(self.library.db)[1][1], "Hip Hop")
        self.assertEqual(_genres(self.library.db)[2][1], "House")
        status, bad = self.request("/api/tag-clusters", {"action": "preview", "value": "HIPHOP"})
        self.assertEqual((status, cast_code(bad)), (400, "spelling_not_in_group"))
        status, blank = self.request("/api/tag-clusters", {"action": "apply", "value": ""})
        self.assertEqual((status, cast_code(blank)), (400, "choose_spelling"))
        status, action = self.request("/api/tag-clusters", {"action": "wipe", "value": "Hip Hop"})
        self.assertEqual((status, cast_code(action)), (400, "action_unavailable"))

    def test_clean_preview_and_apply(self) -> None:
        """clean-preview does not write. clean-apply rewrites titles."""
        _named(self.library.db, [("01 - SONG TITLE", None), ("Midnight City", None)])
        status, preview = self.request("/api/tag-clusters", {"action": "clean-preview"})
        self.assertEqual(status, 200)
        self.assertEqual(cast_written(preview), False)
        self.assertEqual(_titles(self.library.db)[0][1], "01 - SONG TITLE")
        status, made = self.request("/api/tag-clusters", {"action": "clean-apply"})
        self.assertEqual(status, 200)
        self.assertEqual(cast_written(made), True)
        self.assertEqual(_titles(self.library.db)[0][1], "Song Title")
        self.assertEqual(_titles(self.library.db)[1][1], "Midnight City")


def cast_written(payload: object) -> object:
    """Return the ``written`` flag from a JSON object."""
    assert isinstance(payload, dict)
    return payload["written"]


def cast_code(payload: object) -> object:
    """Return the ``code`` from an error JSON object."""
    assert isinstance(payload, dict)
    return payload["code"]


if __name__ == "__main__":
    unittest.main()

