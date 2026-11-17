"""Crate compare (#113).

Each test builds crates in a temporary library and checks
``crate_compare.compare``. Preview lists one set without writing.
Create re-compares, then ``library.crate_action`` saves that set.
An empty set does not write. Audio files are not rewritten.
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

import crate_compare
import library
import server
import tests.test_server as test_server
from library import SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests.test_smart_presets import _members


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _ids(report: dict[str, object], key: str) -> list[int]:
    return [int(str(row["id"])) for row in cast("list[dict[str, object]]", report[key])]


class _Crates:
    """Add tracks and crates to the fixture library."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn
        self.link = 100

    def track(self, asset_id: int, name: str, space: int = 1) -> None:
        self.conn.execute(
            "INSERT INTO asset (id, name, artist, location_id) VALUES (?, ?, 'DJ', 1)",
            (asset_id, name),
        )
        self.conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, ?)", (asset_id, space))

    def crate(self, crate_id: int, name: str, *, parent: int = 1, space: int = 1, kind: int = 1) -> None:
        self.conn.execute(
            "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (?, ?, ?, ?, ?)",
            (crate_id, parent, name, kind, space),
        )
        self.conn.execute("INSERT INTO location_container (id, container_id, location_id) VALUES (?, ?, 1)", (crate_id * 10, crate_id))

    def add(self, crate_id: int, asset_id: int, order: int, *, live: bool = True) -> None:
        """Link a track the way Serato does (location_container), or by container_id."""
        self.link += 1
        if live:
            self.conn.execute(
                "INSERT INTO container_asset (id, asset_id, location_container_id, list_order) VALUES (?, ?, ?, ?)",
                (self.link, asset_id, crate_id * 10, order),
            )
        else:
            self.conn.execute(
                "INSERT INTO container_asset (id, asset_id, container_id, list_order) VALUES (?, ?, ?, ?)",
                (self.link, asset_id, crate_id, order),
            )


class CompareTests(unittest.TestCase):
    """Overlap, only in A, only in B."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            c = _Crates(conn)
            for asset_id, name in ((9, "Nine"), (10, "Ten"), (11, "Eleven"), (12, "Twelve"), (13, "Thirteen"), (14, "Fourteen")):
                c.track(asset_id, name)
            c.crate(5, "Warmup")
            c.crate(6, "Peak" + library.NAME_SPLIT + "stored")  # only the part before the separator is shown
            c.crate(7, "Peak encore", parent=6)
            c.crate(8, "Rules", kind=2)
            c.crate(9, "Video", space=2, parent=2)
            # Warmup: 12, 10, 11 in that order. Peak: 11, 13, 10, 9. Encore: 14.
            # Rows are inserted out of list order, so row order is not crate order.
            c.add(5, 10, 1)
            c.add(5, 12, 0)
            c.add(5, 11, 2, live=False)
            c.add(6, 11, 0)
            c.add(6, 13, 1)
            c.add(6, 10, 2)
            c.add(6, 13, 3)  # a track twice in one crate counts once
            c.add(6, 9, 4)
            c.add(7, 14, 0)
            c.add(8, 13, 0)
            conn.commit()

    def tearDown(self) -> None:
        self.fixture.__exit__(None, None, None)

    def _compare(self, a: int, b: int, *, subcrates: bool = False) -> dict[str, object]:
        return crate_compare.compare(self.fixture.db, library.LIBRARY_SPACE, a, b, subcrates=subcrates)

    def test_overlap_and_differences_keep_crate_order(self) -> None:
        before = _digest(self.fixture.db)
        report = self._compare(5, 6)
        self.assertEqual(_digest(self.fixture.db), before)
        self.assertEqual(_ids(report, "both"), [10, 11])  # Warmup's order
        self.assertEqual(_ids(report, "only_a"), [12])
        self.assertEqual(_ids(report, "only_b"), [13, 9])  # Peak's order, 13 once
        self.assertEqual(report["a"], {"id": 5, "name": "Warmup", "smart": False, "tracks": 3})
        self.assertEqual(report["b"], {"id": 6, "name": "Peak", "smart": False, "tracks": 4})
        self.assertFalse(report["subcrates"])
        row = cast("list[dict[str, object]]", report["only_a"])[0]
        self.assertEqual(row, {"id": 12, "name": "Twelve", "artist": "DJ"})

    def test_swapping_swaps_the_sides(self) -> None:
        report = self._compare(6, 5)
        self.assertEqual(_ids(report, "both"), [11, 10])  # now Peak's order
        self.assertEqual((_ids(report, "only_a"), _ids(report, "only_b")), ([13, 9], [12]))

    def test_subcrates(self) -> None:
        report = self._compare(5, 6, subcrates=True)
        self.assertTrue(report["subcrates"])
        # The parent's tracks come before the subcrate's.
        self.assertEqual(_ids(report, "only_b"), [13, 9, 14])
        self.assertEqual(cast("dict[str, object]", report["b"])["tracks"], 5)

    def test_smart_crate_is_marked(self) -> None:
        """A smart crate's stored members may be out of date, so the page can say so."""
        report = self._compare(6, 8)
        self.assertTrue(cast("dict[str, object]", report["b"])["smart"])
        self.assertEqual(_ids(report, "both"), [13])

    def test_empty_crate(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _Crates(conn).crate(15, "Empty")
            conn.commit()
        report = self._compare(5, 15)
        self.assertEqual((_ids(report, "both"), _ids(report, "only_a"), _ids(report, "only_b")), ([], [12, 10, 11], []))

    def test_a_member_whose_track_is_gone(self) -> None:
        """A crate row can outlive its track; it is listed with no name, not dropped."""
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            crates = _Crates(conn)
            crates.link = 500  # past the rows setUp added
            crates.add(5, 999, 9)
            conn.commit()
        rows = cast("list[dict[str, object]]", self._compare(5, 6)["only_a"])
        self.assertEqual(rows[-1], {"id": 999, "name": "", "artist": ""})

    def test_refusals(self) -> None:
        with self.assertRaises(library.LibraryError) as same:
            self._compare(5, 5)
        self.assertEqual((same.exception.status, same.exception.message), (400, "That request is not valid."))
        for a, b in ((5, 9), (999, 5)):
            with self.subTest(a=a, b=b), self.assertRaises(library.LibraryError) as caught:
                self._compare(a, b)
            self.assertEqual(caught.exception.status, 404)
        with self.assertRaises(library.LibraryError):
            crate_compare.compare(self.fixture.db, "Nope", 5, 6)

    def test_missing_library(self) -> None:
        with self.assertRaises(library.LibraryError) as caught:
            crate_compare.compare(self.fixture.root / "none" / "master.sqlite", library.LIBRARY_SPACE, 5, 6)
        self.assertEqual(caught.exception.status, 404)

    def test_api(self) -> None:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]

        def get(query: str) -> tuple[int, dict[str, object]]:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/crate-compare{query}") as response:
                    return response.status, json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, json.loads(error.read().decode("utf-8"))

        before = _digest(self.fixture.db)
        try:
            status, body = get("?a=5&b=6")
            self.assertEqual((status, _ids(body, "only_a")), (200, [12]))
            status, body = get("?a=5&b=6&subcrates=1")
            self.assertEqual((status, _ids(body, "only_b")), (200, [13, 9, 14]))
            for bad in ("", "?a=5", "?a=5&b=all", "?a=5&b=5", "?a=x&b=6"):
                with self.subTest(bad=bad):
                    status, body = get(bad)
                    self.assertEqual((status, body["code"]), (400, "invalid_request"))
            status, body = get("?a=5&b=9")
            self.assertEqual((status, body["code"]), (404, "crate_not_in_space"))
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)
        self.assertEqual(_digest(self.fixture.db), before)

    def test_cli(self) -> None:
        with mock.patch("sys.stdout") as out:
            self.assertEqual(crate_compare.main(["5", "6", "--database", str(self.fixture.db)]), 0)
        printed = "".join(call.args[0] for call in out.write.call_args_list)
        self.assertEqual(_ids(json.loads(printed), "only_a"), [12])
        with mock.patch("sys.stderr"):
            self.assertEqual(crate_compare.main(["5", "5", "--database", str(self.fixture.db)]), 1)


def _payload(
    action: str,
    *,
    a: object = 5,
    b: object = 6,
    set_key: object = "both",
    subcrates: object = None,
    name: object = None,
) -> dict[str, object]:
    body: dict[str, object] = {
        "action": action,
        "space": library.LIBRARY_SPACE,
        "a": a,
        "b": b,
        "set": set_key,
    }
    if subcrates is not None:
        body["subcrates"] = subcrates
    if name is not None:
        body["name"] = name
    return body


class ApplyTests(unittest.TestCase):
    """Preview lists a set. Create writes it. Empty does not write."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            c = _Crates(conn)
            for asset_id, name in ((9, "Nine"), (10, "Ten"), (11, "Eleven"), (12, "Twelve"), (13, "Thirteen"), (14, "Fourteen")):
                c.track(asset_id, name)
            c.crate(5, "Warmup")
            c.crate(6, "Peak" + library.NAME_SPLIT + "stored")
            c.crate(7, "Peak encore", parent=6)
            c.crate(8, "Rules", kind=2)
            c.crate(9, "Video", space=2, parent=2)
            c.crate(15, "Empty")
            c.add(5, 10, 1)
            c.add(5, 12, 0)
            c.add(5, 11, 2, live=False)
            c.add(6, 11, 0)
            c.add(6, 13, 1)
            c.add(6, 10, 2)
            c.add(6, 13, 3)
            c.add(6, 9, 4)
            c.add(7, 14, 0)
            c.add(8, 13, 0)
            conn.commit()

    def tearDown(self) -> None:
        self._running.stop()
        self.fixture.__exit__(None, None, None)

    def test_preview_does_not_write(self) -> None:
        before = _digest(self.fixture.db)
        plan = crate_compare.preview(
            self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="both"
        )
        self.assertEqual(_digest(self.fixture.db), before)
        self.assertEqual((plan["preview"], plan["written"], plan["count"]), (True, False, 2))
        self.assertEqual(plan["set"], "both")
        self.assertEqual(library.display_name(str(plan["name"])), "Both · Warmup · Peak")
        self.assertEqual(_ids(plan, "both"), [10, 11])

    def test_create_both_writes_overlap(self) -> None:
        plan = crate_compare.save(
            self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="both"
        )
        self.assertTrue(plan["written"])
        self.assertEqual(plan["count"], 2)
        self.assertEqual(set(_members(int(str(plan["id"])))), {10, 11})
        self.assertEqual(library.display_name(str(plan["name"])), "Both · Warmup · Peak")

    def test_create_only_a_and_only_b(self) -> None:
        only_a = crate_compare.save(
            self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="only_a"
        )
        self.assertEqual(set(_members(int(str(only_a["id"])))), {12})
        self.assertEqual(library.display_name(str(only_a["name"])), "Only in Warmup")
        only_b = crate_compare.save(
            self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="only_b"
        )
        self.assertEqual(set(_members(int(str(only_b["id"])))), {13, 9})
        self.assertEqual(library.display_name(str(only_b["name"])), "Only in Peak")

    def test_empty_set_does_not_write(self) -> None:
        before = _digest(self.fixture.db)
        with mock.patch("library.crate_action") as create:
            plan = crate_compare.save(
                self.fixture.db, library.LIBRARY_SPACE, 5, 15, set_key="only_b"
            )
        create.assert_not_called()
        self.assertEqual(_digest(self.fixture.db), before)
        self.assertEqual((plan["written"], plan["count"]), (False, 0))

    def test_custom_name_and_blank_falls_back(self) -> None:
        named = crate_compare.save(
            self.fixture.db,
            library.LIBRARY_SPACE,
            5,
            6,
            set_key="both",
            name="Overlap",
        )
        self.assertEqual(library.display_name(str(named["name"])), "Overlap")
        blank = crate_compare.preview(
            self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="only_a", name="  "
        )
        self.assertEqual(library.display_name(str(blank["name"])), "Only in Warmup")

    def test_recompare_uses_live_membership(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute(
                "DELETE FROM container_asset WHERE asset_id = 10 AND location_container_id = 50"
            )
            conn.commit()
        plan = crate_compare.save(
            self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="both"
        )
        self.assertEqual(set(_members(int(str(plan["id"])))), {11})
        self.assertEqual(plan["count"], 1)

    def test_subcrates_create_includes_nested(self) -> None:
        plan = crate_compare.save(
            self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="only_b", subcrates=True
        )
        self.assertEqual(set(_members(int(str(plan["id"])))), {13, 9, 14})

    def test_serato_running_blocks_create(self) -> None:
        with open_database(self.fixture.db) as conn:
            conn.execute(
                "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
            )
        before = _digest(self.fixture.db)
        with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
            crate_compare.save(self.fixture.db, library.LIBRARY_SPACE, 5, 6, set_key="both")
        self.assertEqual(_digest(self.fixture.db), before)

    def test_action_rejects_bad_fields(self) -> None:
        with self.assertRaises(library.LibraryError) as verb:
            crate_compare.action(_payload("wipe"))
        self.assertEqual((verb.exception.status, str(verb.exception)), (400, "That action is not available."))
        with self.assertRaises(library.LibraryError) as flag:
            crate_compare.action(_payload("preview", a=True))
        self.assertEqual((flag.exception.status, flag.exception.message), (400, crate_compare.INVALID))
        with self.assertRaises(library.LibraryError) as unknown:
            crate_compare.action(_payload("preview", set_key="overlap"))
        self.assertEqual(unknown.exception.status, 400)
        with self.assertRaises(library.LibraryError) as same:
            crate_compare.action(_payload("preview", a=5, b=5))
        self.assertEqual(same.exception.status, 400)
        with self.assertRaises(library.LibraryError) as missing:
            crate_compare.action(_payload("preview", a=5, b=9))
        self.assertEqual(missing.exception.status, 404)
        with self.assertRaises(library.LibraryError) as label:
            crate_compare.action(_payload("preview", name=12))
        self.assertEqual(label.exception.status, 400)


class ApplyApiTests(unittest.TestCase):
    """``POST /api/crate-compare`` preview does not write. Create does."""

    request = test_server.ApiTests.request

    def setUp(self) -> None:
        test_server.ApiTests.setUp(self)
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()

    def tearDown(self) -> None:
        self._running.stop()
        test_server.ApiTests.tearDown(self)

    def _seed(self) -> None:
        with closing(sqlite3.connect(self.library.db)) as conn:
            c = _Crates(conn)
            for asset_id, name in ((9, "Nine"), (10, "Ten"), (11, "Eleven"), (12, "Twelve"), (13, "Thirteen")):
                c.track(asset_id, name)
            c.crate(5, "Warmup")
            c.crate(6, "Peak")
            c.crate(15, "Empty")
            c.add(5, 10, 1)
            c.add(5, 12, 0)
            c.add(5, 11, 2)
            c.add(6, 11, 0)
            c.add(6, 13, 1)
            c.add(6, 10, 2)
            c.add(6, 9, 4)
            conn.commit()

    def test_preview_create_empty_and_errors(self) -> None:
        self._seed()
        before = _digest(self.library.db)
        status, preview = self.request("/api/crate-compare", _payload("preview"))
        self.assertEqual(status, 200)
        self.assertEqual((preview["written"], preview["preview"], preview["count"]), (False, True, 2))  # type: ignore[index]
        self.assertEqual(_digest(self.library.db), before)
        status, made = self.request("/api/crate-compare", _payload("create"))
        self.assertEqual(status, 200)
        self.assertTrue(made["written"])  # type: ignore[index]
        self.assertEqual(set(_members(int(str(made["id"])))), {10, 11})  # type: ignore[index]
        status, empty = self.request(
            "/api/crate-compare", _payload("create", b=15, set_key="only_b")
        )
        self.assertEqual(status, 200)
        self.assertFalse(empty["written"])  # type: ignore[index]
        status, verb = self.request("/api/crate-compare", _payload("wipe"))
        self.assertEqual((status, verb["code"]), (400, "action_unavailable"))  # type: ignore[index]


if __name__ == "__main__":
    unittest.main()
