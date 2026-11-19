"""Version families: grouping, preview, and the confirmed crate write.

Uses a temporary library from tests.fixture. The live Serato database is
not opened. Links land in related.sqlite, not in master.sqlite.
"""

from __future__ import annotations

import hashlib
import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from unittest import mock

import library
import related
import version_family
from tests.fixture import TempLibrary


def _server_api():
    """Return the HTTP test case without collecting it from this module."""
    from tests import test_server

    return test_server.ApiTests


def _clear_related() -> None:
    """Remove a leftover sidecar so one test does not see another's links."""
    path = related.related_db_path()
    for extra in (path, Path(str(path) + "-wal"), Path(str(path) + "-shm")):
        if extra.is_file():
            extra.unlink()

VERSION_NOTE = "version"


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _seed(conn: sqlite3.Connection) -> None:
    """Insert synthetic version rows. Does not copy a real library."""
    rows = (
        (10, "Midnight (Acapella)", "Nova", "Music/midnight-acapella.mp3"),
        (11, "Midnight (Original Mix)", "Nova", "Music/midnight-original.mp3"),
        (12, "Midnight (Instrumental)", "Nova", "Music/midnight-instrumental.mp3"),
        (13, "Club Dub (Remix)", "Nova", "Music/club-dub-remix.mp3"),
        (14, "Midnight (Acapella)", "Other", "Music/midnight-other.mp3"),
        (16, "Midnight (A Cappella)", "Nova", "Music/midnight-a-cappella.mp3"),
        (17, "Dawn (Original)", "Nova", "Music/dawn-original.mp3"),
        (18, "Dawn (Instrumental)", "Nova", "Music/dawn-instrumental.mp3"),
    )
    for asset_id, name, artist, portable in rows:
        conn.execute(
            """
            INSERT INTO asset (id, name, artist, portable_id, file_name, location_id)
            VALUES (?, ?, ?, ?, ?, 1)
            """,
            (asset_id, name, artist, portable, Path(portable).name),
        )
        conn.execute(
            "INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)",
            (asset_id,),
        )


def _ids(plan: dict[str, object], crate_name: str) -> list[int]:
    groups = plan["groups"]
    assert isinstance(groups, list)
    for group in groups:
        assert isinstance(group, dict)
        if group["crate_name"] == crate_name:
            raw = group["track_ids"]
            assert isinstance(raw, list)
            return [int(item) for item in raw]
    return []


def _notes() -> list[tuple[str, int]]:
    conn = sqlite3.connect(related.related_db_path())
    try:
        rows = conn.execute("SELECT note, mutual FROM link ORDER BY id").fetchall()
    finally:
        conn.close()
    return [(str(note), int(mutual)) for note, mutual in rows]


def _members(database: Path, name: str) -> set[int]:
    with closing(sqlite3.connect(database)) as conn:
        rows = conn.execute(
            """
            SELECT c.id, c.name
            FROM container c
            JOIN space s ON s.id = c.space_id
            WHERE s.name = ? AND c.type = 1
            """,
            (library.LIBRARY_SPACE,),
        ).fetchall()
        crate_id = None
        for row in rows:
            if library.display_name(str(row[1])) == name:
                crate_id = int(row[0])
        if crate_id is None:
            return set()
        found = conn.execute(
            """
            SELECT ca.asset_id
            FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            WHERE lc.container_id = ?
            """,
            (crate_id,),
        ).fetchall()
    return {int(row[0]) for row in found}


class GroupTests(unittest.TestCase):
    """Acapella, original, and instrumental group. A different stem does not."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        _clear_related()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _seed(conn)
            conn.commit()

    def tearDown(self) -> None:
        self._running.stop()
        self.fixture.__exit__(None, None, None)

    def test_same_artist_versions_group_and_a_different_stem_does_not(self) -> None:
        plan = version_family.preview()
        self.assertEqual(_ids(plan, "Versions of Midnight"), [10, 11, 12, 16])
        self.assertEqual(_ids(plan, "Versions of Dawn"), [17, 18])
        grouped = {track_id for name in ("Versions of Midnight", "Versions of Dawn") for track_id in _ids(plan, name)}
        self.assertNotIn(13, grouped)
        self.assertNotIn(14, grouped)
        self.assertNotIn(1, grouped)
        groups = plan["groups"]
        assert isinstance(groups, list)
        midnight = next(group for group in groups if isinstance(group, dict) and group["crate_name"] == "Versions of Midnight")
        self.assertEqual(midnight["note"], VERSION_NOTE)

    def test_different_artist_does_not_group(self) -> None:
        plan = version_family.preview()
        self.assertNotIn(14, _ids(plan, "Versions of Midnight"))
        groups = plan["groups"]
        assert isinstance(groups, list)
        artists = {group["artist"] for group in groups if isinstance(group, dict)}
        self.assertNotIn("Other", artists)

    def test_empty_library_returns_no_groups(self) -> None:
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("DELETE FROM history_entry")
            conn.execute("DELETE FROM space_asset")
            conn.execute("DELETE FROM asset")
            conn.commit()
        plan = version_family.preview()
        self.assertEqual(plan["groups"], [])
        self.assertFalse(plan["written"])

    def test_preview_does_not_write(self) -> None:
        before = _digest(self.fixture.db)
        related_path = related.related_db_path()
        related_before = related_path.read_bytes() if related_path.is_file() else None
        with mock.patch("version_family.library.crate_action") as create:
            with mock.patch("version_family.related.add_link") as link:
                plan = version_family.preview()
        create.assert_not_called()
        link.assert_not_called()
        self.assertEqual(_digest(self.fixture.db), before)
        related_after = related_path.read_bytes() if related_path.is_file() else None
        self.assertEqual(related_after, related_before)
        self.assertTrue(plan["preview"])
        self.assertFalse(plan["written"])
        self.assertIn("track_ids", plan["groups"][0])  # type: ignore[index]

    def test_apply_writes_crate_and_version_links_once(self) -> None:
        plan = version_family.apply()
        self.assertTrue(plan["written"])
        self.assertEqual(plan["links"], 7)
        self.assertEqual(_members(self.fixture.db, "Versions of Midnight"), {10, 11, 12, 16})
        self.assertEqual(_members(self.fixture.db, "Versions of Dawn"), {17, 18})
        notes = _notes()
        self.assertEqual(len(notes), 7)
        self.assertTrue(all(note == VERSION_NOTE and mutual == 1 for note, mutual in notes))
        master_before = _digest(self.fixture.db)
        related_before = _digest(related.related_db_path())
        with mock.patch("version_family.library.crate_action") as create:
            with mock.patch("version_family.related.add_link") as link:
                again = version_family.apply()
        create.assert_not_called()
        link.assert_not_called()
        self.assertFalse(again["written"])
        self.assertEqual(_digest(self.fixture.db), master_before)
        self.assertEqual(_digest(related.related_db_path()), related_before)

    def test_apply_without_confirm_does_not_write(self) -> None:
        before = _digest(self.fixture.db)
        with self.assertRaises(library.LibraryError) as raised:
            version_family.action({"action": "apply", "space": library.LIBRARY_SPACE})
        self.assertEqual(raised.exception.message, version_family.CONFIRM)
        self.assertEqual(_digest(self.fixture.db), before)
        self.assertFalse(related.related_db_path().exists())


class ApiTestsForVersions(unittest.TestCase):
    """POST /api/version-family preview does not write. Apply does."""

    def request(self, path: str, payload: dict[str, object] | None = None) -> tuple[int, object]:
        return _server_api().request(self, path, payload)

    def setUp(self) -> None:
        _server_api().setUp(self)
        _clear_related()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        with closing(sqlite3.connect(self.library.db)) as conn:  # type: ignore[attr-defined]
            _seed(conn)
            conn.commit()

    def tearDown(self) -> None:
        self._running.stop()
        _server_api().tearDown(self)

    def test_preview_apply_and_confirm_code(self) -> None:
        before = _digest(self.library.db)  # type: ignore[attr-defined]
        status, preview = self.request("/api/version-family", {"action": "preview"})
        self.assertEqual(status, 200)
        assert isinstance(preview, dict)
        self.assertEqual((preview["written"], preview["preview"]), (False, True))
        self.assertEqual(_digest(self.library.db), before)  # type: ignore[attr-defined]
        status, denied = self.request("/api/version-family", {"action": "apply"})
        self.assertEqual((status, denied["code"]), (400, "version_needs_confirm"))  # type: ignore[index]
        self.assertEqual(_digest(self.library.db), before)  # type: ignore[attr-defined]
        status, made = self.request(
            "/api/version-family",
            {"action": "apply", "confirm": True},
        )
        self.assertEqual(status, 200)
        assert isinstance(made, dict)
        self.assertTrue(made["written"])
        self.assertEqual(_members(self.library.db, "Versions of Midnight"), {10, 11, 12, 16})  # type: ignore[attr-defined]
        status, verb = self.request("/api/version-family", {"action": "wipe", "confirm": True})
        self.assertEqual((status, verb["code"]), (400, "action_unavailable"))  # type: ignore[index]
        status, again = self.request("/api/version-family", {"action": "apply", "confirm": True})
        self.assertEqual(status, 200)
        assert isinstance(again, dict)
        self.assertFalse(again["written"])


if __name__ == "__main__":
    unittest.main()
