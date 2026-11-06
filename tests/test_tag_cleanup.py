"""Spellings of one genre or artist (#27, part 1), read-only.

Every case uses a temporary library. The library file must be unchanged.
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

import library
import server
import tag_cleanup
from tag_cleanup import normalize
from tests.fixture import TempLibrary


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


if __name__ == "__main__":
    unittest.main()
