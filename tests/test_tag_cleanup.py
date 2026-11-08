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

