"""Library health report (#29), read-only.

``library_health.report`` is checked against a temporary library. The
library file must be unchanged.
"""

from __future__ import annotations

import hashlib
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

import library
import library_health
import server
from tests.fixture import TempLibrary, open_database
from tests.test_tags import _apic_frame, _beatgrid_payload, _geob_frame, _id3_pack


def _digest(path: Path) -> str:
    """Return the SHA-256 of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _ids(section: object) -> list[int]:
    """Return track ids from a section payload."""
    payload = section if isinstance(section, dict) else {}
    tracks = payload.get("tracks") or []
    return [int(row["id"]) for row in tracks if isinstance(row, dict)]


def _add_track(
    conn: sqlite3.Connection,
    asset_id: int,
    *,
    name: str,
    artist: str = "DJ",
    bpm: float | None = 128,
    key: str | None = "8A",
    genre: str | None = "House",
    missing: int = 0,
    length_ms: int = 180000,
) -> None:
    """Insert a space-1 track with health fields set."""
    conn.execute(
        """
        INSERT INTO asset
            (id, name, artist, bpm, key, genre, is_missing, length_ms, file_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (asset_id, name, artist, bpm, key, genre, missing, length_ms, f"{name}.mp3"),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


def _crate(conn: sqlite3.Connection, crate_id: int, name: str, parent_id: int = 1) -> None:
    """Insert a normal crate in Serato Library."""
    conn.execute(
        """
        INSERT INTO container (id, parent_id, name, type, space_id)
        VALUES (?, ?, ?, 1, 1)
        """,
        (crate_id, parent_id, name),
    )


def _member(conn: sqlite3.Connection, crate_id: int, asset_id: int) -> None:
    """Put a track in a crate through the test ``container_id`` column."""
    conn.execute(
        "INSERT INTO container_asset (asset_id, container_id) VALUES (?, ?)",
        (asset_id, crate_id),
    )


class ReportTests(unittest.TestCase):
    """The report reads sqlite and writes nothing."""

    def test_fixture_counts_empty_genre_no_crate_and_duplicates(self) -> None:
        """The two Same tracks share length seconds, have no genre, and sit in no crate."""
        with TempLibrary() as temp:
            before = _digest(temp.db)
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(_digest(temp.db), before)
        self.assertEqual(body["checked"], 2)
        self.assertEqual(body["crate"], None)
        self.assertEqual(body["missing"]["count"], 0)
        self.assertEqual(body["no_bpm"]["count"], 0)
        self.assertEqual(body["no_key"]["count"], 0)
        self.assertEqual(body["empty_genre"]["count"], 2)
        self.assertEqual(sorted(_ids(body["empty_genre"])), [1, 2])
        self.assertEqual(body["no_crate"]["count"], 2)
        self.assertEqual(body["duplicates"]["count"], 1)
        self.assertEqual(body["duplicates"]["groups"][0]["ids"], [1, 2])
        self.assertEqual(body["no_artwork"]["count"], 0)
        self.assertEqual(body["no_beatgrid"]["count"], 0)
        self.assertEqual(body["unused"]["count"], 0)

    def test_sections_split_problems_and_crate_hides_no_crate(self) -> None:
        """Each flag lands in its section. A crate scope leaves no_crate empty."""
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _crate(conn, 5, "Gig")
                _add_track(conn, 10, name="Gone", missing=1)
                _add_track(conn, 11, name="NoBpm", bpm=0)
                _add_track(conn, 12, name="NoKey", key="  ")
                _add_track(conn, 13, name="NoGenre", genre="")
                _add_track(conn, 14, name="Ok")
                _add_track(conn, 15, name="Loose")
                for asset_id in (10, 11, 12, 13, 14):
                    _member(conn, 5, asset_id)
            space = library_health.report(temp.db, library.LIBRARY_SPACE)
            crate = library_health.report(temp.db, library.LIBRARY_SPACE, 5)
        self.assertEqual(space["missing"]["count"], 1)
        self.assertEqual(_ids(space["missing"]), [10])
        self.assertEqual(_ids(space["no_bpm"]), [11])
        self.assertEqual(_ids(space["no_key"]), [12])
        self.assertIn(13, _ids(space["empty_genre"]))
        self.assertIn(15, _ids(space["no_crate"]))
        self.assertNotIn(14, _ids(space["no_crate"]))
        self.assertEqual(crate["checked"], 5)
        self.assertEqual(crate["crate"], 5)
        self.assertEqual(crate["no_crate"]["count"], 0)
        self.assertEqual(_ids(crate["missing"]), [10])
        self.assertNotIn(15, _ids(crate["no_bpm"]))

    def test_crate_includes_subcrate_and_skips_outside_track(self) -> None:
        """A parent crate includes tracks in nested crates only."""
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _crate(conn, 5, "Parent")
                _crate(conn, 6, "Child", parent_id=5)
                _add_track(conn, 20, name="Inside", bpm=None)
                _add_track(conn, 21, name="Outside", bpm=None)
                _member(conn, 6, 20)
                _member(conn, 5, 1)
            body = library_health.report(temp.db, library.LIBRARY_SPACE, 5)
        self.assertEqual(sorted(_ids(body["no_bpm"])), [20])
        self.assertEqual(body["checked"], 2)

    def test_duplicate_group_stays_when_crate_holds_one_copy(self) -> None:
        """A crate with one of a pair still lists the group with both ids."""
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _crate(conn, 5, "Gig")
                _member(conn, 5, 1)
            body = library_health.report(temp.db, library.LIBRARY_SPACE, 5)
        self.assertEqual(body["duplicates"]["count"], 1)
        self.assertEqual(body["duplicates"]["groups"][0]["ids"], [1, 2])

    def test_location_container_membership_counts_as_in_a_crate(self) -> None:
        """Live Serato links membership through location_container."""
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _crate(conn, 5, "Gig")
                conn.execute(
                    "INSERT INTO location_container (id, container_id, location_id) VALUES (9, 5, 1)"
                )
                conn.execute(
                    """
                    INSERT INTO container_asset (asset_id, location_container_id)
                    VALUES (1, 9)
                    """
                )
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(body["no_crate"]["count"], 1)
        self.assertEqual(_ids(body["no_crate"]), [2])

    def test_unknown_crate_is_404_and_bad_space_is_refused(self) -> None:
        """A crate not in the space is 404. A made-up space is refused."""
        with TempLibrary() as temp:
            with self.assertRaises(library.LibraryError) as raised:
                library_health.report(temp.db, library.LIBRARY_SPACE, 999)
            self.assertEqual(raised.exception.status, 404)
            with self.assertRaises(library.LibraryError):
                library_health.report(temp.db, "nope")

    def test_sample_cap_keeps_full_count(self) -> None:
        """More than ROW_CAP empty-genre rows still report the full count."""
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                for asset_id in range(20, 20 + library_health.ROW_CAP + 3):
                    _add_track(conn, asset_id, name=f"G{asset_id}", genre=None)
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(body["empty_genre"]["count"], library_health.ROW_CAP + 5)
        self.assertEqual(len(body["empty_genre"]["tracks"]), library_health.ROW_CAP)

    def test_present_files_split_artwork_beatgrid_and_unused(self) -> None:
        """On-disk files fill no_artwork, no_beatgrid, and unused. Missing stays out."""
        with TempLibrary() as temp:
            music = temp.root / "music"
            album_a = music / "a"
            album_b = music / "b"
            album_a.mkdir(parents=True)
            album_b.mkdir(parents=True)
            complete = album_a / "complete.mp3"
            complete.write_bytes(
                _id3_pack([_apic_frame(), _geob_frame("Serato BeatGrid", _beatgrid_payload())])
            )
            bare = album_b / "bare.mp3"
            bare.write_bytes(_id3_pack([]))
            unused = music / "orphan.mp3"
            unused.write_bytes(_id3_pack([]))
            serato_dir = music / "_Serato_"
            serato_dir.mkdir()
            (serato_dir / "crate-copy.mp3").write_bytes(_id3_pack([]))
            (music / ".hidden.mp3").write_bytes(_id3_pack([]))
            gone = temp.root / "missing" / "gone.mp3"
            with open_database(temp.db) as conn:
                _add_track(conn, 30, name="Complete")
                _add_track(conn, 31, name="Bare")
                _add_track(conn, 32, name="MissingOnDisk", missing=1)
                conn.execute(
                    "UPDATE asset SET portable_id = ? WHERE id = 30",
                    (str(complete),),
                )
                conn.execute(
                    "UPDATE asset SET portable_id = ? WHERE id = 31",
                    (str(bare),),
                )
                conn.execute(
                    "UPDATE asset SET portable_id = ? WHERE id = 32",
                    (str(gone),),
                )
            with mock.patch(
                "music_roots.music_roots",
                side_effect=AssertionError("do not scan all music roots"),
            ):
                body = library_health.report(temp.db, library.LIBRARY_SPACE)
            crate_id = 5
            with open_database(temp.db) as conn:
                _crate(conn, crate_id, "Gig")
                _member(conn, crate_id, 30)
            crate = library_health.report(temp.db, library.LIBRARY_SPACE, crate_id)
        self.assertEqual(sorted(_ids(body["no_artwork"])), [31])
        self.assertEqual(sorted(_ids(body["no_beatgrid"])), [31])
        self.assertNotIn(30, _ids(body["no_artwork"]))
        self.assertNotIn(32, _ids(body["no_artwork"]))
        self.assertNotIn(32, _ids(body["no_beatgrid"]))
        self.assertEqual(body["unused"]["count"], 1)
        self.assertEqual(body["unused"]["files"][0]["file"], "orphan.mp3")
        self.assertEqual(crate["unused"]["count"], 0)
        self.assertEqual(crate["no_crate"]["count"], 0)

    def test_unreadable_grid_is_not_no_beatgrid(self) -> None:
        """A BeatGrid this parser cannot read is still a grid."""
        with TempLibrary() as temp:
            path = temp.root / "warn.mp3"
            path.write_bytes(_id3_pack([_geob_frame("Serato BeatGrid", b"\x01\x00")]))
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ? WHERE id = 1",
                    (str(path),),
                )
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertNotIn(1, _ids(body["no_beatgrid"]))


class ApiTests(unittest.TestCase):
    """``GET /api/library-health``."""

    def _get(self, query: str) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/library-health{query}") as response:
                    return response.status, json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, json.loads(error.read().decode("utf-8"))
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)

    def test_routes(self) -> None:
        with TempLibrary() as fixture:
            with closing(sqlite3.connect(fixture.db)) as conn:
                _crate(conn, 5, "Gig")
                _add_track(conn, 10, name="Gone", missing=1)
                _member(conn, 5, 10)
                conn.commit()
            before = _digest(fixture.db)
            status, body = self._get("")
            self.assertEqual(status, 200)
            self.assertEqual(body["missing"]["count"], 1)
            status, body = self._get("?crate=5")
            self.assertEqual((status, body["crate"]), (200, 5))
            self.assertEqual(body["missing"]["count"], 1)
            status, _body = self._get("?crate=999")
            self.assertEqual(status, 404)
            status, _body = self._get("?crate=nope")
            self.assertEqual(status, 400)
            self.assertEqual(_digest(fixture.db), before)


class CliTests(unittest.TestCase):
    """``python3 library_health.py`` prints the report."""

    def test_main(self) -> None:
        with TempLibrary() as fixture:
            with mock.patch("sys.stdout") as out:
                self.assertEqual(library_health.main(["--database", str(fixture.db)]), 0)
            printed = "".join(call.args[0] for call in out.write.call_args_list)
            self.assertEqual(json.loads(printed)["checked"], 2)
            with mock.patch("sys.stderr"):
                self.assertEqual(library_health.main(["--database", str(fixture.root / "none.sqlite")]), 1)


if __name__ == "__main__":
    unittest.main()
