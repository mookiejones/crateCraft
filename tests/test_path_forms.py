"""NFC and NFD spellings of one path count as one track (#455).

Synthetic files only. Writes stay in a temporary library. Snapshots stay
under that temporary library, never in the live Serato folder.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import sys
import tempfile
import threading
import unicodedata
import unittest
import urllib.error
import urllib.request
import xml.etree.ElementTree as ElementTree
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote
from unittest import mock

import app_config
import library
import library_health
import path_forms
import rekordbox
import server
import snapshots
import volumes
from library import LibraryError, SeratoOpen
from tests.fixture import TempLibrary, open_database

_LOSS_ONE = "1 tracks were not on disk, so the path spelling was left as Serato stored it."
_LOSS_TWO = "2 tracks were not on disk, so the path spelling was left as Serato stored it."


def _digest(path: Path) -> str:
    """Return the SHA-256 of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _seed_pair(temp: TempLibrary, *, write_file: bool = True) -> tuple[str, str, Path]:
    """Store one composed path and its decomposed form on assets 1 and 2."""
    nfc_name = "na\u00efve.mp3"
    nfd_name = unicodedata.normalize("NFD", nfc_name)
    folder = temp.root / "Music"
    folder.mkdir()
    file_path = folder / nfc_name
    if write_file:
        file_path.write_bytes(b"audio")
    nfc_path = f"{folder}{os.sep}{nfc_name}"
    nfd_path = f"{folder}{os.sep}{nfd_name}"
    with open_database(temp.db) as conn:
        conn.execute(
            """
            UPDATE asset
            SET portable_id = ?, file_name = ?, length_ms = 180000, is_missing = 0
            WHERE id = 1
            """,
            (nfc_path, nfc_name),
        )
        conn.execute(
            """
            UPDATE asset
            SET portable_id = ?, file_name = ?, length_ms = 180000, is_missing = 0
            WHERE id = 2
            """,
            (nfd_path, nfd_name),
        )
    return nfc_path, nfd_path, file_path


def _asset_rows(temp: TempLibrary) -> list[tuple[int, str]]:
    """Return asset id and stored path, in id order."""
    with open_database(temp.db) as conn:
        return [(int(row[0]), str(row[1] or "")) for row in conn.execute(
            "SELECT id, portable_id FROM asset ORDER BY id"
        )]


def _crate_members(conn: sqlite3.Connection, crate_id: int, asset_ids: list[int]) -> None:
    """Put tracks in one crate through location_container."""
    conn.execute(
        "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (?, 1, 'Gig', 1, 1)",
        (crate_id,),
    )
    conn.execute(
        "INSERT INTO location_container (id, container_id, location_id) VALUES (?, ?, 1)",
        (crate_id + 100, crate_id),
    )
    for asset_id in asset_ids:
        conn.execute(
            """
            INSERT INTO container_asset (asset_id, location_container_id, list_order)
            VALUES (?, ?, ?)
            """,
            (asset_id, crate_id + 100, asset_id),
        )


def _member_ids(temp: TempLibrary, crate_id: int) -> list[int]:
    """Return asset ids in one crate."""
    with open_database(temp.db) as conn:
        return [
            int(row[0])
            for row in conn.execute(
                """
                SELECT ca.asset_id
                FROM container_asset ca
                JOIN location_container lc ON lc.id = ca.location_container_id
                WHERE lc.container_id = ?
                ORDER BY ca.asset_id
                """,
                (crate_id,),
            )
        ]


def _track_locations(xml: str) -> list[str]:
    """Return collection Location paths. Playlist rows have no Location."""
    root = ElementTree.fromstring(xml)
    found: list[str] = []
    for node in root.iter("TRACK"):
        location = node.get("Location")
        if not location:
            continue
        raw = unquote(location.removeprefix("file://localhost"))
        if len(raw) >= 3 and raw[0] == "/" and raw[2] == ":":
            raw = raw[1:]
        found.append(raw)
    return found


class FormKeyTests(unittest.TestCase):
    """Path identity is NFC. Case folds only when asked, or on Windows."""

    def test_nfc_matches_nfd_and_does_not_name_a_serato_generation(self) -> None:
        nfc = "Music/na\u00efve.mp3"
        nfd = "Music/" + unicodedata.normalize("NFD", "na\u00efve.mp3")
        self.assertEqual(path_forms.form_key(nfc), path_forms.form_key(nfd))
        self.assertNotIn("serato", path_forms.form_key(nfc).casefold())
        self.assertEqual(path_forms.form_key(""), "")
        self.assertEqual(path_forms.form_key("a\x00b"), "")
        self.assertEqual(path_forms.form_key(None), "")

    def test_windows_case_fold_is_explicit_off_this_platform(self) -> None:
        nfc = "C:/Music/Na\u00efve.mp3"
        windows_nfd = "c:\\music\\" + unicodedata.normalize("NFD", "Na\u00efve.mp3")
        self.assertEqual(
            path_forms.form_key(nfc, fold_case=True),
            path_forms.form_key(windows_nfd, fold_case=True),
        )
        self.assertNotEqual(
            path_forms.form_key(nfc, fold_case=False),
            path_forms.form_key(windows_nfd, fold_case=False),
        )
        if sys.platform == "win32":
            self.assertEqual(path_forms.form_key(nfc), path_forms.form_key(windows_nfd))
        else:
            self.assertNotEqual(path_forms.form_key(nfc), path_forms.form_key(windows_nfd))

    def test_blank_paths_stay_separate_and_identical_strings_keep_the_lowest_id(self) -> None:
        blanks, blank_groups = path_forms.collapse_rows(
            [
                {"id": 1, "portable_id": "", "is_missing": 0},
                {"id": 2, "portable_id": "   ", "is_missing": 0},
            ]
        )
        self.assertEqual(len(blanks), 2)
        self.assertEqual(blank_groups, [])
        kept, groups = path_forms.collapse_rows(
            [
                {"id": 2, "portable_id": "C:/Music/a.mp3", "is_missing": 0},
                {"id": 1, "portable_id": "C:/Music/a.mp3", "is_missing": 0},
            ]
        )
        self.assertEqual([int(row["id"]) for row in kept], [1])
        self.assertEqual(groups[0]["keep_id"], 1)


class HealthTests(unittest.TestCase):
    """Health counts a composed and decomposed path once."""

    def test_default_fixture_is_still_two_tracks(self) -> None:
        with TempLibrary() as temp:
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(body["checked"], 2)
        self.assertEqual(body["path_forms"]["count"], 0)
        self.assertEqual(body["duplicates"]["count"], 1)
        self.assertEqual(body["duplicates"]["groups"][0]["ids"], [1, 2])

    def test_pair_counts_as_one_track(self) -> None:
        with TempLibrary() as temp:
            nfc_path, nfd_path, file_path = _seed_pair(temp)
            before = _digest(temp.db)
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(_digest(temp.db), before)
            self.assertEqual(file_path.read_bytes(), b"audio")
        self.assertEqual(body["checked"], 1)
        self.assertEqual(body["path_forms"]["count"], 1)
        self.assertEqual(body["empty_genre"]["count"], 1)
        self.assertEqual(body["no_crate"]["count"], 1)
        self.assertEqual(body["duplicates"]["count"], 0)
        group = body["path_forms"]["groups"][0]
        self.assertEqual(sorted(group["ids"]), [1, 2])
        self.assertIn(group["keep_id"], (1, 2))
        self.assertEqual(path_forms.form_key(group["keep_path"]), path_forms.form_key(nfc_path))
        self.assertEqual(path_forms.form_key(nfd_path), path_forms.form_key(nfc_path))

    def test_crate_with_one_spelling_does_not_list_the_pair(self) -> None:
        with TempLibrary() as temp:
            _seed_pair(temp)
            with open_database(temp.db) as conn:
                _crate_members(conn, 5, [1])
            scoped = library_health.report(temp.db, library.LIBRARY_SPACE, 5)
            space = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(scoped["checked"], 1)
        self.assertEqual(scoped["path_forms"]["count"], 0)
        self.assertEqual(scoped["duplicates"]["count"], 0)
        self.assertEqual(space["checked"], 1)
        self.assertEqual(space["path_forms"]["count"], 1)
        self.assertEqual(space["no_crate"]["count"], 0)

    def test_same_unplugged_path_is_one_track_and_a_different_path_is_not(self) -> None:
        nfc_name = "na\u00efve.mp3"
        nfd_name = unicodedata.normalize("NFD", nfc_name)
        unplugged = "Z:\\Music\\" + nfc_name
        unplugged_nfd = "Z:\\Music\\" + nfd_name
        volume = "/Volumes/Stick/Music/" + nfc_name
        if sys.platform == "win32":
            self.assertIsNone(volumes.absent_volume(volume))
        else:
            self.assertIsNotNone(volumes.absent_volume(volume))
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ?, is_missing = 0, length_ms = 180000 WHERE id = 1",
                    (unplugged,),
                )
                conn.execute(
                    "UPDATE asset SET portable_id = ?, is_missing = 1, length_ms = 180000 WHERE id = 2",
                    (unplugged_nfd,),
                )
            paired = library_health.report(temp.db, library.LIBRARY_SPACE)
            local = temp.root / "other.mp3"
            local.write_bytes(b"x")
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ?, is_missing = 0 WHERE id = 1",
                    (str(local),),
                )
                conn.execute(
                    "UPDATE asset SET portable_id = ?, is_missing = 0 WHERE id = 2",
                    ("Z:\\Music\\other.mp3",),
                )
            split = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(paired["checked"], 1)
        self.assertEqual(paired["path_forms"]["count"], 1)
        self.assertEqual(paired["path_forms"]["groups"][0]["keep_id"], 1)
        self.assertEqual(split["checked"], 2)
        self.assertEqual(split["path_forms"]["count"], 0)

    def test_empty_library_and_blank_paths(self) -> None:
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM history_entry")
                conn.execute("DELETE FROM container_asset")
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
            empty = library_health.report(temp.db, library.LIBRARY_SPACE)
            with open_database(temp.db) as conn:
                conn.execute(
                    """
                    INSERT INTO asset (id, name, artist, portable_id, is_missing, length_ms)
                    VALUES (1, 'A', 'DJ', '', 0, 1000), (2, 'B', 'DJ', '', 0, 1000)
                    """
                )
                conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (1, 1), (2, 1)")
            blanks = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(empty["checked"], 0)
        self.assertEqual(empty["path_forms"]["count"], 0)
        self.assertEqual(blanks["checked"], 2)
        self.assertEqual(blanks["path_forms"]["count"], 0)

    def test_missing_library_is_refused(self) -> None:
        folder = tempfile.mkdtemp()
        missing = Path(folder) / "missing.sqlite"
        old = library.MASTER
        library.MASTER = missing
        try:
            with self.assertRaises(LibraryError):
                path_forms.preview(library.LIBRARY_SPACE)
            with self.assertRaises(LibraryError):
                library_health.report(missing, library.LIBRARY_SPACE)
        finally:
            library.MASTER = old
            os.rmdir(folder)


class ExportTests(unittest.TestCase):
    """Rekordbox and M3U emit the pair once."""

    def test_on_disk_pair_is_one_track_and_not_lost(self) -> None:
        with TempLibrary() as temp:
            nfc_path, _, file_path = _seed_pair(temp)
            xml, report = rekordbox.export_rekordbox(library.LIBRARY_SPACE, None)
            playlist = library.export_m3u(library.LIBRARY_SPACE, None)
            self.assertEqual(file_path.read_bytes(), b"audio")
        locations = _track_locations(xml)
        self.assertEqual(len(locations), 1)
        self.assertEqual(path_forms.form_key(locations[0]), path_forms.form_key(nfc_path))
        text = "\n".join(report)
        self.assertNotIn("tracks were not on disk", text)
        self.assertEqual(playlist.count("#EXTINF:"), 1)

    def test_missing_pair_is_lost_once(self) -> None:
        with TempLibrary() as temp:
            _seed_pair(temp, write_file=False)
            xml, report = rekordbox.export_rekordbox(library.LIBRARY_SPACE, None)
            playlist = library.export_m3u(library.LIBRARY_SPACE, None)
        self.assertEqual(len(_track_locations(xml)), 1)
        text = "\n".join(report)
        self.assertIn(_LOSS_ONE, text)
        self.assertNotIn(_LOSS_TWO, text)
        self.assertEqual(playlist.count("#EXTINF:"), 1)

    def test_crate_that_holds_one_spelling_exports_the_kept_track_once(self) -> None:
        with TempLibrary() as temp:
            nfc_path, _, _ = _seed_pair(temp)
            with open_database(temp.db) as conn:
                _crate_members(conn, 5, [2])
            xml, _report = rekordbox.export_rekordbox(library.LIBRARY_SPACE, 5)
            playlist = library.export_m3u(library.LIBRARY_SPACE, 5)
        locations = _track_locations(xml)
        self.assertEqual(len(locations), 1)
        self.assertEqual(path_forms.form_key(locations[0]), path_forms.form_key(nfc_path))
        self.assertEqual(playlist.count("#EXTINF:"), 1)
        self.assertIn("#PLAYLIST:Gig", playlist)


class WriteTests(unittest.TestCase):
    """Preview writes nothing. Apply needs confirm, Serato quit, and a snapshot."""

    def setUp(self) -> None:
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: self._config.name})
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        self._block = mock.patch("snapshots.library_write_block", return_value=None)
        self._block.start()
        self._message = mock.patch("snapshots.write_block_message", return_value=None)
        self._message.start()

    def tearDown(self) -> None:
        self._message.stop()
        self._block.stop()
        self._running.stop()
        self._env.stop()
        self._config.cleanup()

    def test_preview_writes_nothing(self) -> None:
        with TempLibrary() as temp:
            _nfc, _nfd, file_path = _seed_pair(temp)
            before = _digest(temp.db)
            plan = path_forms.preview(library.LIBRARY_SPACE)
            self.assertEqual(_digest(temp.db), before)
            self.assertFalse((temp.root / "Backups").exists())
            self.assertEqual(file_path.read_bytes(), b"audio")
        self.assertTrue(plan["preview"])
        self.assertFalse(plan["written"])
        self.assertEqual(plan["dropped"], 1)
        self.assertIsNone(plan["snapshot_id"])

    def test_apply_without_confirm_writes_nothing(self) -> None:
        with TempLibrary() as temp:
            _seed_pair(temp)
            before = _digest(temp.db)
            with self.assertRaises(LibraryError) as raised:
                path_forms.action({"action": "apply", "space": library.LIBRARY_SPACE})
            self.assertEqual(raised.exception.message, path_forms.NEEDS_CONFIRM)
            self.assertEqual(_digest(temp.db), before)
            self.assertFalse((temp.root / "Backups").exists())
            self.assertEqual(len(_asset_rows(temp)), 2)

    def test_unknown_action_is_refused(self) -> None:
        with TempLibrary():
            with self.assertRaises(LibraryError) as raised:
                path_forms.action({"action": "nope", "space": library.LIBRARY_SPACE})
        self.assertEqual(raised.exception.message, "That action is not available.")

    def test_open_serato_does_not_snapshot(self) -> None:
        with TempLibrary() as temp:
            _seed_pair(temp)
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                with self.assertRaises(SeratoOpen):
                    path_forms.apply(library.LIBRARY_SPACE)
            self.assertFalse((temp.root / "Backups").exists())
            self.assertEqual(len(_asset_rows(temp)), 2)

    def test_write_block_refuses_before_a_snapshot(self) -> None:
        with TempLibrary() as temp:
            _seed_pair(temp)
            with mock.patch("snapshots.library_write_block", return_value="Serato 5.1 stays read-only."):
                with self.assertRaises(LibraryError) as raised:
                    path_forms.apply(library.LIBRARY_SPACE)
            self.assertEqual(raised.exception.status, 409)
            self.assertEqual(raised.exception.message, "Serato 5.1 stays read-only.")
            self.assertFalse((temp.root / "Backups").exists())
            with mock.patch("snapshots.write_block_message", return_value="Protect Library is on."):
                with self.assertRaises(LibraryError) as blocked:
                    path_forms.apply(library.LIBRARY_SPACE)
            self.assertEqual(blocked.exception.status, 409)
            self.assertIn("Protect Library", blocked.exception.message)
            self.assertFalse((temp.root / "Backups").exists())

    def test_empty_plan_does_not_write_while_serato_is_open(self) -> None:
        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                plan = path_forms.apply(library.LIBRARY_SPACE)
            self.assertFalse(plan["written"])
            self.assertEqual(plan["dropped"], 0)
            self.assertFalse((temp.root / "Backups").exists())

    def test_apply_keeps_one_row_and_the_file_and_restore_puts_the_row_back(self) -> None:
        with TempLibrary() as temp:
            nfc_path, nfd_path, file_path = _seed_pair(temp)
            plan = path_forms.action(
                {"action": "apply", "confirm": True, "space": library.LIBRARY_SPACE}
            )
            rows = _asset_rows(temp)
            self.assertTrue(plan["written"])
            self.assertEqual(plan["dropped"], 1)
            self.assertEqual(len(rows), 1)
            self.assertIn(rows[0][0], (1, 2))
            self.assertEqual(path_forms.form_key(rows[0][1]), path_forms.form_key(nfc_path))
            self.assertTrue(any("other drive" in str(item) for item in plan["warnings"]))
            self.assertEqual(file_path.read_bytes(), b"audio")
            store = snapshots.current_store()
            self.assertEqual(store.master.resolve(), temp.db.resolve())
            self.assertEqual(store.root, temp.db.resolve().parent / "Backups" / "snapshots")
            self.assertNotIn("Application Support", str(store.root))
            snapshot_id = plan["snapshot_id"]
            self.assertIsInstance(snapshot_id, str)
            store.restore(snapshot_id)
            restored = {row[0]: row[1] for row in _asset_rows(temp)}
            self.assertEqual(set(restored), {1, 2})
            self.assertEqual(restored[1], nfc_path)
            self.assertEqual(restored[2], nfd_path)
            self.assertEqual(file_path.read_bytes(), b"audio")

    def test_crate_apply_moves_membership_onto_the_kept_row(self) -> None:
        with TempLibrary() as temp:
            _nfc, _nfd, file_path = _seed_pair(temp)
            with open_database(temp.db) as conn:
                _crate_members(conn, 5, [1, 2])
            plan = path_forms.apply(library.LIBRARY_SPACE, 5)
            left = [row[0] for row in _asset_rows(temp)]
            members = _member_ids(temp, 5)
            self.assertTrue(plan["written"])
            self.assertEqual(len(left), 1)
            self.assertEqual(members, left)
            self.assertEqual(file_path.read_bytes(), b"audio")

    def test_space_apply_keeps_a_crate_that_held_only_the_other_spelling(self) -> None:
        with TempLibrary() as temp:
            _seed_pair(temp)
            with open_database(temp.db) as conn:
                _crate_members(conn, 5, [2])
            path_forms.apply(library.LIBRARY_SPACE, None)
            left = [row[0] for row in _asset_rows(temp)]
            self.assertEqual(len(left), 1)
            self.assertEqual(_member_ids(temp, 5), left)


class RouteTests(unittest.TestCase):
    """``POST /api/path-forms``."""

    def _post(self, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"http://{host!s}:{port}/api/path-forms",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        try:
            try:
                with urllib.request.urlopen(request) as response:
                    parsed = json.loads(response.read().decode("utf-8"))
                    return response.status, parsed
            except urllib.error.HTTPError as error:
                with error:
                    parsed = json.loads(error.read().decode("utf-8"))
                    return error.code, parsed
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)

    def test_preview_route_does_not_write_and_confirm_is_required(self) -> None:
        with TempLibrary() as temp:
            _seed_pair(temp)
            status, plan = self._post({"action": "preview"})
            self.assertEqual(status, 200)
            self.assertEqual(plan["dropped"], 1)
            self.assertFalse(plan["written"])
            self.assertTrue(plan["preview"])
            status, refused = self._post({"action": "apply"})
            self.assertEqual(status, 400)
            self.assertEqual(refused["code"], "path_forms_needs_confirm")
            status, unknown = self._post({"action": "nope"})
            self.assertEqual(status, 400)
            self.assertEqual(unknown["code"], "action_unavailable")
            self.assertEqual(len(_asset_rows(temp)), 2)


if __name__ == "__main__":
    unittest.main()
