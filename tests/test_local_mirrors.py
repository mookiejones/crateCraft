"""Local-only crate mirrors (#116).

Preview is read-only. Create writes one crate under
``_crateCraft generated`` / ``Local copies`` and leaves the source crate
alone. Streaming tracks stay out of M3U and Rekordbox exports.
"""

from __future__ import annotations

import hashlib
import sqlite3
import unittest
from contextlib import closing
from pathlib import Path
from typing import cast
from unittest import mock

import library
import local_mirrors
import rekordbox
from library import LibraryError, SeratoOpen
from tests import test_server
from tests.fixture import TempLibrary, open_database
from tests.test_smart_presets import _members

SPACE = library.LIBRARY_SPACE


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _add_asset(conn: sqlite3.Connection, asset_id: int, name: str, portable_id: str) -> None:
    conn.execute(
        """
        INSERT INTO asset (id, name, artist, portable_id, file_name, is_missing, location_id)
        VALUES (?, ?, 'Artist', ?, ?, 0, 1)
        """,
        (asset_id, name, portable_id, Path(portable_id).name),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


def _mark_streaming(asset_id: int, third_party: int = 6) -> None:
    with closing(library.read_conn()) as conn:
        pass
    with open_database(library.MASTER) as conn:
        conn.execute(
            "UPDATE asset SET third_party_type = ? WHERE id = ?",
            (third_party, asset_id),
        )


class ServiceTests(unittest.TestCase):
    """Streaming is Apple Music type 6 or a Beatport identity that does not open."""

    def test_apple_music_does_not_open_the_file(self) -> None:
        with mock.patch("streaming_swap._opens", side_effect=AssertionError("opened")):
            self.assertEqual(
                local_mirrors.service_of(
                    {
                        "third_party_type": 6,
                        "portable_id": "/tmp/real.mp3",
                        "type": "beatport",
                    }
                ),
                "Apple Music",
            )

    def test_itunes_bool_and_string_are_not_streaming(self) -> None:
        self.assertIsNone(
            local_mirrors.service_of({"third_party_type": 1, "portable_id": "Music/a.mp3"})
        )
        self.assertIsNone(
            local_mirrors.service_of({"third_party_type": True, "portable_id": "Music/a.mp3"})
        )
        self.assertIsNone(
            local_mirrors.service_of({"third_party_type": "6", "portable_id": "Music/a.mp3"})
        )

    def test_beatport_uri_is_streaming_and_an_audio_name_is_not(self) -> None:
        self.assertEqual(
            local_mirrors.service_of({"portable_id": "beatport:12345"}),
            "Beatport",
        )
        self.assertIsNone(
            local_mirrors.service_of(
                {
                    "portable_id": "Music/my beatport track.mp3",
                    "file_name": "my beatport track.mp3",
                    "type_specific_data": "beatport link",
                }
            )
        )
        self.assertEqual(
            local_mirrors.service_of(
                {
                    "portable_id": "Music/missing.mp3",
                    "file_name": "missing.mp3",
                    "type": "beatport",
                }
            ),
            "Beatport",
        )

    def test_a_beatport_file_that_opens_stays_local(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "kept.mp3"
            path.write_bytes(b"not audio")
            self.assertIsNone(
                local_mirrors.service_of(
                    {
                        "portable_id": str(path),
                        "file_name": "kept.mp3",
                        "type": "beatport",
                    }
                )
            )

    def test_missing_local_file_is_not_streaming(self) -> None:
        self.assertIsNone(
            local_mirrors.service_of(
                {"portable_id": "Music/gone.mp3", "file_name": "gone.mp3", "is_missing": 1}
            )
        )

    def test_sqlite_row_is_accepted(self) -> None:
        with TempLibrary():
            with open_database(library.MASTER) as conn:
                conn.execute("UPDATE asset SET third_party_type = 6 WHERE id = 1")
            with closing(library.read_conn()) as conn:
                row = conn.execute("SELECT * FROM asset WHERE id = 1").fetchone()
            self.assertEqual(local_mirrors.service_of(row), "Apple Music")


class PlanTests(unittest.TestCase):
    """Preview counts tracks and does not write. Reasons do not write."""

    def _mixed(self) -> int:
        made = library.crate_action({"action": "create", "name": "Friday", "assets": [1, 2]})
        _mark_streaming(2)
        return int(made["id"])

    def test_preview_does_not_write(self) -> None:
        with TempLibrary() as temp:
            crate_id = self._mixed()
            before = _digest(temp.db)
            result = local_mirrors.preview(temp.db, SPACE, crate_id)
            self.assertEqual(_digest(temp.db), before)
            self.assertEqual(
                (result["preview"], result["written"], result["reason"]),
                (True, False, None),
            )
            self.assertEqual((result["local_count"], result["streaming_count"]), (1, 1))
            self.assertEqual(result["name"], "Friday local")
            self.assertEqual(result["parent"], "Local copies")
            self.assertEqual(_members(crate_id), [1, 2])

    def test_already_local_and_empty_do_not_write(self) -> None:
        with TempLibrary() as temp:
            local = library.crate_action({"action": "create", "name": "House", "assets": [1]})
            empty = library.crate_action({"action": "create", "name": "Empty"})
            before = _digest(temp.db)
            for crate_id in (int(local["id"]), int(empty["id"])):
                preview = local_mirrors.preview(temp.db, SPACE, crate_id)
                self.assertEqual(preview["reason"], "already_local")
                made = local_mirrors.create(temp.db, SPACE, crate_id)
                self.assertEqual((made["written"], made["preview"]), (False, False))
            self.assertEqual(_digest(temp.db), before)

    def test_all_streaming_does_not_write(self) -> None:
        with TempLibrary() as temp:
            made = library.crate_action({"action": "create", "name": "Cloud", "assets": [1, 2]})
            _mark_streaming(1)
            _mark_streaming(2)
            before = _digest(temp.db)
            preview = local_mirrors.preview(temp.db, SPACE, int(made["id"]))
            self.assertEqual(preview["reason"], "all_streaming")
            self.assertEqual(preview["local_count"], 0)
            created = local_mirrors.create(temp.db, SPACE, int(made["id"]))
            self.assertFalse(created["written"])
            self.assertEqual(_digest(temp.db), before)

    def test_generated_crate_is_refused(self) -> None:
        with TempLibrary() as temp:
            folder = library.crate_action({"action": "create", "name": "_crateCraft generated"})
            child = library.crate_action(
                {"action": "create", "name": "Inside", "parent": folder["id"], "assets": [1, 2]}
            )
            _mark_streaming(2)
            before = _digest(temp.db)
            preview = local_mirrors.preview(temp.db, SPACE, int(child["id"]))
            self.assertEqual(preview["reason"], "generated")
            self.assertEqual(preview["streaming_count"], 1)
            created = local_mirrors.create(temp.db, SPACE, int(child["id"]))
            self.assertFalse(created["written"])
            self.assertEqual(_digest(temp.db), before)

    def test_create_without_confirm_does_not_write(self) -> None:
        with TempLibrary() as temp:
            crate_id = self._mixed()
            before = _digest(temp.db)
            result = local_mirrors.action({"action": "create", "space": SPACE, "crate": crate_id})
            self.assertEqual((result["preview"], result["written"]), (True, False))
            self.assertEqual(_digest(temp.db), before)

    def test_bad_crate_and_action_are_rejected(self) -> None:
        with TempLibrary():
            for raw in (True, "3", 0, -1):
                with self.assertRaises(LibraryError):
                    local_mirrors.action({"action": "preview", "space": SPACE, "crate": raw})
            with self.assertRaises(LibraryError):
                local_mirrors.action({"action": "nope", "space": SPACE, "crate": 1})
            with self.assertRaises(LibraryError):
                local_mirrors.action({"action": "preview", "space": "Nope", "crate": 1})


class WriteTests(unittest.TestCase):
    """Create replaces only the named child under Local copies."""

    def test_apply_keeps_order_and_leaves_the_source(self) -> None:
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_asset(conn, 3, "Third", "Music/third.mp3")
            made = library.crate_action(
                {"action": "create", "name": "Friday", "assets": [3, 2, 1]}
            )
            _mark_streaming(2)
            crate_id = int(made["id"])
            result = local_mirrors.create(temp.db, SPACE, crate_id)
            self.assertTrue(result["written"])
            self.assertIsNone(result["replaced"])
            mirror_id = int(result["id"])
            self.assertEqual(_members(mirror_id), [3, 1])
            self.assertEqual(_members(crate_id), [3, 2, 1])
            with closing(library.read_conn()) as conn:
                row = conn.execute(
                    "SELECT parent_id, type, name FROM container WHERE id = ?",
                    (mirror_id,),
                ).fetchone()
                parent = conn.execute(
                    "SELECT parent_id, name FROM container WHERE id = ?",
                    (row["parent_id"],),
                ).fetchone()
                folder = conn.execute(
                    "SELECT name FROM container WHERE id = ?",
                    (parent["parent_id"],),
                ).fetchone()
            self.assertEqual(int(row["type"]), 1)
            self.assertEqual(library.display_name(str(row["name"])), "Friday local")
            self.assertEqual(library.display_name(str(parent["name"])), "Local copies")
            self.assertEqual(library.display_name(str(folder["name"])), "_crateCraft generated")

    def test_rerun_replaces_only_that_child(self) -> None:
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_asset(conn, 3, "Third", "Music/third.mp3")
            friday = library.crate_action({"action": "create", "name": "Friday", "assets": [1, 2]})
            saturday = library.crate_action(
                {"action": "create", "name": "Saturday", "assets": [3, 2]}
            )
            outside = library.crate_action(
                {"action": "create", "name": "Friday local", "assets": [3]}
            )
            _mark_streaming(2)
            first = local_mirrors.create(temp.db, SPACE, int(friday["id"]))
            second = local_mirrors.create(temp.db, SPACE, int(saturday["id"]))
            again = local_mirrors.create(temp.db, SPACE, int(friday["id"]))
            self.assertEqual(again["replaced"], {"id": int(first["id"]), "name": "Friday local"})
            self.assertNotEqual(int(again["id"]), int(first["id"]))
            self.assertEqual(_members(int(again["id"])), [1])
            self.assertEqual(_members(int(second["id"])), [3])
            self.assertEqual(_members(int(outside["id"])), [3])
            with closing(library.read_conn()) as conn:
                row = conn.execute(
                    "SELECT parent_id FROM container WHERE id = ?",
                    (int(outside["id"]),),
                ).fetchone()
                root = library._space_root(conn, SPACE)
            self.assertEqual(int(row["parent_id"]), root)
            self.assertEqual(_members(int(friday["id"])), [1, 2])

    def test_same_display_name_shares_one_child(self) -> None:
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_asset(conn, 3, "Third", "Music/third.mp3")
            parent = library.crate_action({"action": "create", "name": "Sets"})
            top = library.crate_action({"action": "create", "name": "Friday", "assets": [1, 2]})
            nested = library.crate_action(
                {
                    "action": "create",
                    "name": "Friday",
                    "parent": parent["id"],
                    "assets": [3, 2],
                }
            )
            _mark_streaming(2)
            local_mirrors.create(temp.db, SPACE, int(top["id"]))
            latest = local_mirrors.create(temp.db, SPACE, int(nested["id"]))
            self.assertEqual(_members(int(latest["id"])), [3])
            with closing(library.read_conn()) as conn:
                count = conn.execute(
                    """
                    SELECT COUNT(*) FROM container
                    WHERE name = 'Friday local' OR name LIKE 'Friday local' || char(10) || '%'
                    """
                ).fetchone()
            self.assertEqual(int(count[0]), 1)

    def test_smart_source_copies_stored_members_into_a_normal_crate(self) -> None:
        with TempLibrary() as temp:
            made = library.crate_action(
                {"action": "create", "name": "Smart set", "assets": [1, 2]}
            )
            _mark_streaming(2)
            with open_database(temp.db) as conn:
                conn.execute("UPDATE container SET type = 2 WHERE id = ?", (made["id"],))
            result = local_mirrors.create(temp.db, SPACE, int(made["id"]))
            mirror_id = int(result["id"])
            self.assertEqual(_members(mirror_id), [1])
            with closing(library.read_conn()) as conn:
                source = conn.execute(
                    "SELECT type FROM container WHERE id = ?",
                    (made["id"],),
                ).fetchone()
                mirror = conn.execute(
                    "SELECT type FROM container WHERE id = ?",
                    (mirror_id,),
                ).fetchone()
            self.assertEqual(int(source["type"]), 2)
            self.assertEqual(int(mirror["type"]), 1)

    def test_serato_running_blocks_create(self) -> None:
        with TempLibrary() as temp:
            crate_id = library.crate_action(
                {"action": "create", "name": "Friday", "assets": [1, 2]}
            )["id"]
            _mark_streaming(2)
            with open_database(temp.db) as conn:
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            before = _digest(temp.db)
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                local_mirrors.create(temp.db, SPACE, int(crate_id))
            self.assertEqual(_digest(temp.db), before)


class ExportTests(unittest.TestCase):
    """Exports omit streaming tracks and do not write the library."""

    def _crate(self) -> tuple[int, int, int]:
        made = library.crate_action({"action": "create", "name": "Friday", "assets": [1, 2]})
        with open_database(library.MASTER) as conn:
            conn.execute(
                """
                UPDATE asset
                SET third_party_type = 6, name = 'Cloud', artist = 'Apple', portable_id = 'stream:apple'
                WHERE id = 2
                """
            )
            conn.execute(
                "UPDATE asset SET name = 'Local', artist = 'House', portable_id = 'Music/local.mp3' WHERE id = 1"
            )
        return int(made["id"]), 1, 2

    def test_m3u_omits_streaming_and_does_not_write(self) -> None:
        with TempLibrary() as temp:
            crate_id, local_id, _stream_id = self._crate()
            before = _digest(temp.db)
            text = library.export_m3u(SPACE, crate_id)
            self.assertEqual(_digest(temp.db), before)
            self.assertIn("# omitted, streaming (Apple Music): Apple - Cloud", text)
            self.assertEqual(text.count("#EXTINF:"), 1)
            written = text.split("#EXTINF:", 1)[-1]
            self.assertNotIn("stream:apple", written)
            # Resolved paths use the platform separator. Windows is Music\local.mp3.
            self.assertIn(str(Path("Music") / "local.mp3"), written)
            self.assertEqual(_members(crate_id), [local_id, 2])

    def test_m3u_space_comment_is_in_query_order(self) -> None:
        with TempLibrary() as temp:
            self._crate()
            before = _digest(temp.db)
            text = library.export_m3u(SPACE, None)
            self.assertEqual(_digest(temp.db), before)
            self.assertIn("# omitted, streaming (Apple Music): Apple - Cloud", text)
            self.assertLess(text.index("#PLAYLIST:"), text.index("# omitted, streaming"))

    def test_rekordbox_names_streaming_tracks_in_the_loss_report(self) -> None:
        with TempLibrary() as temp:
            crate_id, local_id, stream_id = self._crate()
            before = _digest(temp.db)
            xml_text, report = rekordbox.export_rekordbox(SPACE, crate_id)
            self.assertEqual(_digest(temp.db), before)
            self.assertNotIn(f'TrackID="{stream_id}"', xml_text)
            self.assertIn(f'TrackID="{local_id}"', xml_text)
            self.assertIn(
                "1 streaming tracks were left out: Apple - Cloud.",
                report,
            )
            self.assertEqual(_members(crate_id), [local_id, stream_id])


class ApiTests(unittest.TestCase):
    """``GET`` / ``POST /api/local-mirror`` against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_get_and_post(self) -> None:
        made = library.crate_action({"action": "create", "name": "Friday", "assets": [1, 2]})
        _mark_streaming(2)
        crate_id = int(made["id"])
        status, missing = self.request("/api/local-mirror")
        self.assertEqual(status, 400)
        status, preview = self.request(f"/api/local-mirror?crate={crate_id}")
        self.assertEqual(status, 200)
        self.assertTrue(cast(dict, preview)["preview"])
        self.assertFalse(cast(dict, preview)["written"])
        status, held = self.request(
            "/api/local-mirror",
            {"action": "create", "crate": crate_id},
        )
        self.assertEqual(status, 200)
        self.assertFalse(cast(dict, held)["written"])
        status, created = self.request(
            "/api/local-mirror",
            {"action": "create", "confirm": True, "crate": crate_id},
        )
        self.assertEqual(status, 200)
        body = cast(dict, created)
        self.assertTrue(body["written"])
        self.assertEqual(body["folder"], "_crateCraft generated")
        self.assertEqual(body["parent"], "Local copies")
        status, unknown = self.request(
            "/api/local-mirror",
            {"action": "nope", "crate": crate_id},
        )
        self.assertEqual(status, 400)
        self.assertIn("error", cast(dict, unknown))
        del missing


if __name__ == "__main__":
    unittest.main()
