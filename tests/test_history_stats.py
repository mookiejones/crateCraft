"""Play history analytics (#33).

Each test builds a temporary library with history sessions and entries,
then checks ``history_stats.stats``. Times are Unix seconds, like Serato's
``history_entry.start_time``. Stats and CSV reads leave the library file
unchanged. Creating an idle crate writes through ``crate_action``.
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
from typing import cast
from unittest import mock

import history_stats
import library
import server
from library import SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests.test_smart_presets import _members

DAY = 86_400
NOW = 1_800_000_000  # 2027-01-15


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _rows(report: dict[str, object], key: str) -> list[dict[str, object]]:
    return cast("list[dict[str, object]]", report[key])


class _History:
    """Add assets, sessions, and plays to the fixture library."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn
        self.entry = 100
        # The fixture's tracks 1 and 2 were added long ago and never played here.
        self.conn.execute("DELETE FROM history_entry")
        self.conn.execute("DELETE FROM history_session")
        self.conn.execute("UPDATE asset SET time_added = ?", (NOW - 900 * DAY,))

    def asset(self, asset_id: int, name: str, artist: str, *, added: int | None, plays: int = 0, space: int = 1) -> None:
        self.conn.execute(
            "INSERT INTO asset (id, name, artist, time_added, dj_play_count, location_id) VALUES (?, ?, ?, ?, ?, 1)",
            (asset_id, name, artist, added, plays),
        )
        self.conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, ?)", (asset_id, space))

    def session(self, session_id: int, start: int, name: str = "Night") -> None:
        self.conn.execute(
            "INSERT INTO history_session (id, name, start_time, end_time) VALUES (?, ?, ?, ?)",
            (session_id, name, start, start + 4 * 3600),
        )

    def play(self, session_id: int, asset_id: int | None, when: int, *, name: str = "", artist: str = "", played: int = 1) -> None:
        self.entry += 1
        self.conn.execute(
            "INSERT INTO history_entry (id, session_id, asset_id, name, artist, start_time, played) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (self.entry, session_id, asset_id, name, artist, when, played),
        )


class StatsTests(unittest.TestCase):
    """Top tracks and artists in a period, and tracks not played in a while."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            h = _History(conn)
            h.asset(10, "Opener", "Alpha", added=NOW - 800 * DAY)
            h.asset(11, "Anthem", "Beta", added=NOW - 800 * DAY)
            h.asset(12, "Closer", "beta ", added=NOW - 800 * DAY)
            h.asset(13, "Dusty", "Gamma", added=NOW - 800 * DAY, plays=4)
            h.asset(14, "Fresh", "Delta", added=NOW - 10 * DAY)
            h.asset(15, "Undated", "Delta", added=None)
            h.asset(16, "Video", "Eps", added=NOW - 800 * DAY, space=2)
            old = NOW - 400 * DAY
            h.session(1, old, "Old gig")
            h.play(1, 13, old + 60, name="Dusty", artist="Gamma")
            h.session(2, NOW - 20 * DAY, "Club")
            h.play(2, 10, NOW - 20 * DAY + 60, name="Opener", artist="Alpha")
            h.play(2, 11, NOW - 20 * DAY + 400, name="Anthem", artist="Beta")
            h.play(2, 11, NOW - 20 * DAY + 900, name="Anthem", artist="Beta")
            h.play(2, 12, NOW - 20 * DAY + 1200, name="Closer", artist="beta ")
            h.play(2, 10, NOW - 20 * DAY + 1500, name="Skipped", artist="Alpha", played=0)
            h.session(3, NOW - 5 * DAY, "Bar")
            h.play(3, 11, NOW - 5 * DAY + 60, name="Anthem (Edit)", artist="BETA")
            # A play whose track was deleted from the library keeps its own name.
            h.play(3, None, NOW - 5 * DAY + 300, name="Gone Track", artist="Zeta")
            h.play(3, None, NOW - 5 * DAY + 600, name="gone track", artist="zeta")
            h.conn.commit()

    def tearDown(self) -> None:
        self.fixture.__exit__(None, None, None)

    def _stats(self, **kwargs: object) -> dict[str, object]:
        options: dict[str, object] = {"now": NOW}
        options.update(kwargs)
        return history_stats.stats(self.fixture.db, library.LIBRARY_SPACE, **options)  # type: ignore[arg-type]

    def test_all_time(self) -> None:
        before = _digest(self.fixture.db)
        report = self._stats()
        self.assertEqual(_digest(self.fixture.db), before)
        self.assertEqual((report["plays"], report["sessions"]), (8, 3))
        tracks = _rows(report, "top_tracks")
        self.assertEqual(
            [(row["asset_id"], row["name"], row["plays"]) for row in tracks],
            # A tie goes to the track played most recently.
            [(11, "Anthem (Edit)", 3), (None, "gone track", 2), (12, "Closer", 1), (10, "Opener", 1), (13, "Dusty", 1)],
        )
        self.assertEqual(tracks[0]["last_played"], NOW - 5 * DAY + 60)
        artists = _rows(report, "top_artists")
        self.assertEqual(
            [(row["artist"], row["plays"], row["tracks"]) for row in artists],
            # "Beta", "beta ", and "BETA" are one artist, shown as the most used spelling.
            [("Beta", 4, 2), ("Zeta", 2, 1), ("Alpha", 1, 1), ("Gamma", 1, 1)],
        )

    def test_a_period(self) -> None:
        """Only plays that start inside [from, to) count."""
        report = self._stats(start=NOW - 30 * DAY, end=NOW - 5 * DAY)
        self.assertEqual((report["plays"], report["sessions"]), (4, 1))
        self.assertEqual([row["asset_id"] for row in _rows(report, "top_tracks")], [11, 12, 10])
        self.assertEqual((report["from"], report["to"]), (NOW - 30 * DAY, NOW - 5 * DAY))
        boundary = self._stats(start=NOW - 5 * DAY + 60)
        self.assertEqual(boundary["plays"], 3)
        # A play that starts exactly at ``to`` is outside the period.
        before_bar = self._stats(start=NOW - 30 * DAY, end=NOW - 5 * DAY + 60)
        self.assertEqual(before_bar["plays"], 4)

    def test_top_limit(self) -> None:
        report = self._stats(top=2)
        self.assertEqual(len(_rows(report, "top_tracks")), 2)
        self.assertEqual(len(_rows(report, "top_artists")), 2)

    def test_not_played_in_a_year(self) -> None:
        """Old tracks with no play since the cutoff; new tracks are left out."""
        report = self._stats()
        self.assertEqual(report["idle_days"], 365)
        idle = _rows(report, "not_played")
        self.assertEqual(
            [(row["id"], row["last_played"]) for row in idle],
            [(1, None), (2, None), (15, None), (13, NOW - 400 * DAY + 60)],
        )
        dusty = idle[-1]
        self.assertEqual((dusty["name"], dusty["artist"], dusty["play_count"]), ("Dusty", "Gamma", 4))
        self.assertEqual(report["not_played_count"], 4)
        # Video is in another space; Fresh was added 10 days ago.
        self.assertNotIn(16, [row["id"] for row in idle])
        self.assertNotIn(14, [row["id"] for row in idle])

    def test_idle_days_moves_the_cutoff(self) -> None:
        idle = _rows(self._stats(idle_days=7), "not_played")
        ids = [row["id"] for row in idle]
        self.assertIn(10, ids)  # last played 20 days ago
        self.assertNotIn(11, ids)  # played 5 days ago
        self.assertIn(14, ids)  # added 10 days ago, never played
        # Never played first, by name: Fresh, Same, Same, Undated.
        self.assertEqual(ids[:4], [14, 1, 2, 15])

    def test_an_unplayed_entry_does_not_count_as_played(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute(
                "INSERT INTO history_entry (id, session_id, asset_id, start_time, played) VALUES (900, 3, 1, ?, 0)",
                (NOW - DAY,),
            )
            conn.commit()
        self.assertIn(1, [row["id"] for row in _rows(self._stats(), "not_played")])

    def test_empty_history(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("DELETE FROM history_entry")
            conn.execute("DELETE FROM history_session")
            conn.commit()
        report = self._stats()
        self.assertEqual((report["plays"], report["sessions"], report["top_tracks"], report["top_artists"]), (0, 0, [], []))
        # Every track but Fresh (added 10 days ago) and Video (another space).
        self.assertEqual(report["not_played_count"], 7)

    def test_empty_library(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("PRAGMA foreign_keys = OFF")
            conn.execute("DELETE FROM history_entry")
            conn.execute("DELETE FROM history_session")
            conn.execute("DELETE FROM space_asset")
            conn.execute("DELETE FROM asset")
            conn.commit()
        report = self._stats()
        self.assertEqual((report["plays"], report["sessions"], report["not_played_count"]), (0, 0, 0))
        self.assertEqual(_rows(report, "top_tracks"), [])
        self.assertNotIn("top_track", history_stats.csv_text(report))

    def test_bad_values(self) -> None:
        for kwargs in ({"top": 0}, {"top": 501}, {"idle_days": 0}, {"idle_days": 3651}, {"start": 10, "end": 10}, {"start": 20, "end": 10}):
            with self.subTest(kwargs=kwargs), self.assertRaises(library.LibraryError) as caught:
                self._stats(**kwargs)
            self.assertEqual(caught.exception.status, 400)
        with self.assertRaises(library.LibraryError):
            history_stats.stats(self.fixture.db, "Nope", now=NOW)

    def test_missing_library(self) -> None:
        with self.assertRaises(library.LibraryError) as caught:
            history_stats.stats(self.fixture.root / "none" / "master.sqlite", library.LIBRARY_SPACE, now=NOW)
        self.assertEqual(caught.exception.status, 404)


class NumberTests(unittest.TestCase):
    """Query numbers are whole, in range, and ASCII digits."""

    def test_number(self) -> None:
        self.assertEqual(history_stats.number(None, 25, 1, 500), 25)
        self.assertEqual(history_stats.number("", 25, 1, 500), 25)
        self.assertIsNone(history_stats.number(None, None, 0, 10))
        self.assertEqual(history_stats.number("7", 25, 1, 500), 7)
        for raw in ("0", "501", "-1", "1.5", "x", "١٢", " 3", "9" * 30):
            with self.subTest(raw=raw), self.assertRaises(library.LibraryError) as caught:
                history_stats.number(raw, 25, 1, 500)
            self.assertEqual((caught.exception.status, caught.exception.message), (400, "That request is not valid."))
        self.assertEqual(history_stats.json_number(None, 365, 1, 3650), 365)
        self.assertEqual(history_stats.json_number(40, 365, 1, 3650), 40)
        for raw in (True, 0, 3651, 1.5, "7"):
            with self.subTest(raw=raw), self.assertRaises(library.LibraryError) as caught:
                history_stats.json_number(raw, 365, 1, 3650)
            self.assertEqual(caught.exception.status, 400)


class ApiTests(unittest.TestCase):
    """``GET /api/history-stats``."""

    def _get(self, query: str) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/history-stats{query}") as response:
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
            before = _digest(fixture.db)
            status, body = self._get("")
            self.assertEqual(status, 200)
            self.assertEqual((body["plays"], body["sessions"]), (1, 1))
            self.assertEqual(_rows(body, "top_tracks")[0]["asset_id"], 1)
            status, body = self._get("?from=150&to=300&top=5&idle_days=30")
            self.assertEqual((status, body["plays"], body["from"], body["to"], body["idle_days"]), (200, 0, 150, 300, 30))
            for bad in ("?top=0", "?from=x", "?idle_days=99999", "?from=5&to=5"):
                with self.subTest(bad=bad):
                    status, body = self._get(bad)
                    self.assertEqual((status, body["code"]), (400, "invalid_request"))
            status, _body = self._get("?space=Nope")
            self.assertNotEqual(status, 200)
            self.assertEqual(_digest(fixture.db), before)

    def _csv(self, query: str) -> tuple[int, str, str]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/history-stats.csv{query}") as response:
                    return (
                        response.status,
                        response.headers.get("Content-Type", ""),
                        response.read().decode("utf-8-sig"),
                    )
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, error.headers.get("Content-Type", ""), error.read().decode("utf-8")
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)

    def _post(self, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            request = urllib.request.Request(
                f"http://{host!s}:{port}/api/history-stats",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(request) as response:
                    return response.status, json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, json.loads(error.read().decode("utf-8"))
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)

    def test_csv_download_is_read_only(self) -> None:
        with TempLibrary() as fixture:
            before = _digest(fixture.db)
            status, content_type, body = self._csv("")
            self.assertEqual(status, 200)
            self.assertIn("text/csv", content_type)
            self.assertIn("top_track", body)
            self.assertIn("not_played", body)
            self.assertEqual(_digest(fixture.db), before)

    def test_unknown_post_action_is_400(self) -> None:
        with TempLibrary() as fixture:
            before = _digest(fixture.db)
            status, body = self._post({"action": "export"})
            self.assertEqual((status, body["code"]), (400, "action_unavailable"))
            self.assertEqual(_digest(fixture.db), before)

    def test_preview_does_not_write(self) -> None:
        with TempLibrary() as fixture:
            before = _digest(fixture.db)
            status, body = self._post({"action": "preview", "idle_days": 30})
            self.assertEqual(status, 200)
            self.assertEqual((body["preview"], body["written"]), (True, False))
            self.assertGreater(int(str(body["count"])), 0)
            self.assertEqual(_digest(fixture.db), before)

    def test_create_writes_idle_tracks(self) -> None:
        with TempLibrary() as fixture:
            before = _digest(fixture.db)
            preview_status, preview = self._post({"action": "preview", "name": "Idle crate"})
            self.assertEqual(preview_status, 200)
            self.assertEqual(_digest(fixture.db), before)
            status, body = self._post({"action": "create", "name": "Idle crate"})
            self.assertEqual(status, 200)
            self.assertTrue(body["written"])
            self.assertEqual(body["count"], preview["count"])
            crate_id = int(str(body["id"]))
            self.assertEqual(len(_members(crate_id)), int(str(body["count"])))
            self.assertNotEqual(_digest(fixture.db), before)


class CrateTests(unittest.TestCase):
    """Idle list to crate, preview then write."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            h = _History(conn)
            h.asset(10, "Opener", "Alpha", added=NOW - 800 * DAY)
            h.asset(13, "Dusty", "Gamma", added=NOW - 800 * DAY, plays=4)
            h.asset(14, "Fresh", "Delta", added=NOW - 10 * DAY)
            old = NOW - 400 * DAY
            h.session(1, old, "Old gig")
            h.play(1, 13, old + 60, name="Dusty", artist="Gamma")
            h.session(2, NOW - 20 * DAY, "Club")
            h.play(2, 10, NOW - 20 * DAY + 60, name="Opener", artist="Alpha")
            h.conn.commit()

    def tearDown(self) -> None:
        self.fixture.__exit__(None, None, None)

    def test_csv_quotes_a_formula_title(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("UPDATE asset SET name = ? WHERE id = 1", ("=HYPERLINK()",))
            conn.commit()
        report = history_stats.stats(self.fixture.db, library.LIBRARY_SPACE, now=NOW)
        text = history_stats.csv_text(report)
        self.assertIn("'=HYPERLINK()", text)
        self.assertNotRegex(text, r"(?m)^=HYPERLINK")

    def test_preview_lists_idle_without_writing(self) -> None:
        before = _digest(self.fixture.db)
        preview = history_stats.preview_idle(self.fixture.db, library.LIBRARY_SPACE, now=NOW)
        self.assertEqual(_digest(self.fixture.db), before)
        self.assertEqual((preview["preview"], preview["written"]), (True, False))
        ids = [row["id"] for row in _rows(preview, "tracks")]
        self.assertEqual(ids, [1, 2, 13])
        self.assertEqual(preview["name"], "Not played in 365 days")

    def test_create_adds_the_idle_tracks(self) -> None:
        created = history_stats.create_idle(
            self.fixture.db, library.LIBRARY_SPACE, name="Dusty crate", now=NOW
        )
        self.assertTrue(created["written"])
        self.assertEqual(set(_members(int(str(created["id"])))), {1, 2, 13})
        self.assertEqual(created["count"], 3)

    def test_empty_idle_list_does_not_write(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute(
                "INSERT INTO history_session (id, name, start_time, end_time) VALUES (9, 'Recent', ?, ?)",
                (NOW - DAY, NOW),
            )
            for offset, asset_id in enumerate((1, 2, 13)):
                conn.execute(
                    "INSERT INTO history_entry (id, session_id, asset_id, name, artist, start_time, played) VALUES (?, 9, ?, '', '', ?, 1)",
                    (500 + offset, asset_id, NOW - DAY + 60),
                )
            conn.commit()
        before = _digest(self.fixture.db)
        created = history_stats.create_idle(self.fixture.db, library.LIBRARY_SPACE, now=NOW)
        self.assertEqual((created["written"], created["count"]), (False, 0))
        self.assertEqual(_digest(self.fixture.db), before)

    def test_serato_running_blocks_create(self) -> None:
        with open_database(self.fixture.db) as conn:
            conn.execute("INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')")
        before = _digest(self.fixture.db)
        with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
            history_stats.create_idle(self.fixture.db, library.LIBRARY_SPACE, now=NOW)
        self.assertEqual(_digest(self.fixture.db), before)

    def test_missing_history_still_lists_idle_tracks(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("DELETE FROM history_entry")
            conn.execute("DELETE FROM history_session")
            conn.commit()
        report = history_stats.stats(self.fixture.db, library.LIBRARY_SPACE, now=NOW)
        self.assertEqual((report["plays"], report["sessions"]), (0, 0))
        self.assertGreater(int(str(report["not_played_count"])), 0)


class CliTests(unittest.TestCase):
    def test_main(self) -> None:
        with TempLibrary() as fixture:
            with mock.patch("sys.stdout") as out:
                self.assertEqual(history_stats.main(["--database", str(fixture.db), "--top", "3"]), 0)
            printed = "".join(call.args[0] for call in out.write.call_args_list)
            self.assertEqual(json.loads(printed)["plays"], 1)
            with mock.patch("sys.stderr"):
                self.assertEqual(history_stats.main(["--database", str(fixture.root / "none.sqlite")]), 1)
            with mock.patch("sys.stdout") as csv_out:
                self.assertEqual(history_stats.main(["--database", str(fixture.db), "--csv"]), 0)
            printed = "".join(call.args[0] for call in csv_out.write.call_args_list)
            self.assertIn("top_track", printed)
            self.assertIn("not_played", printed)


if __name__ == "__main__":
    unittest.main()
