"""Stored-gain scan and Autotags Gain dB reset (#468).

Synthetic Autotags payloads only. The live Serato library is not opened.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import gain_reset
import library
import server
import snapshot_frames
from library import SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests.test_library_health import _add_track
from tests.test_tags import _beatgrid_payload, _geob_frame, _id3_pack


def _digest(path: Path) -> str:
    """Return the SHA-256 of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _audio(path: Path, *, gain: str = "1.500", markers: bool = True) -> bytes:
    """Write a tiny ID3 file with Autotags and optional Markers2/BeatGrid."""
    frames = [_geob_frame("Serato Autotags", gain_reset.build_autotags("115.00", "-3.257", gain))]
    markers_payload = b""
    if markers:
        markers_payload = b"\x01\x01" + b"CUE-KEEP"
        frames.insert(0, _geob_frame("Serato Markers2", markers_payload))
        frames.insert(1, _geob_frame("Serato BeatGrid", _beatgrid_payload()))
    path.write_bytes(_id3_pack(frames) + b"\xff\xfb\x90\x00")
    return markers_payload


def _point(conn: sqlite3.Connection, asset_id: int, path: Path) -> None:
    """Store an absolute path on one asset."""
    conn.execute(
        "UPDATE asset SET portable_id = ?, file_name = ? WHERE id = ?",
        (str(path), path.name, asset_id),
    )


class ParseTests(unittest.TestCase):
    """Autotags payload helpers. No library file is opened."""

    def test_parse_and_build_round_trip(self) -> None:
        """Holzhaus sample fields parse and rebuild byte-identical."""
        raw = gain_reset.build_autotags("115.00", "-3.257", "0.000")
        self.assertEqual(raw, b"\x01\x01" + b"115.00\x00" + b"-3.257\x00" + b"0.000\x00")
        self.assertEqual(gain_reset.parse_autotags(raw), ("115.00", "-3.257", "0.000"))

    def test_zero_gain_is_not_listed(self) -> None:
        """Exact 0.000 and tiny float noise are zero; 0.001 is not."""
        self.assertFalse(gain_reset.gain_is_nonzero("0.000"))
        self.assertFalse(gain_reset.gain_is_nonzero(0.0))
        self.assertFalse(gain_reset.gain_is_nonzero(1e-9))
        self.assertTrue(gain_reset.gain_is_nonzero("0.001"))
        self.assertTrue(gain_reset.gain_is_nonzero("-1.250"))
        self.assertTrue(gain_reset.gain_is_nonzero("not-a-number"))

    def test_parse_rejects_a_truncated_payload(self) -> None:
        """Two fields only is not Autotags."""
        self.assertIsNone(gain_reset.parse_autotags(b"\x01\x01115.00\x00-3.257\x00"))


class ScanTests(unittest.TestCase):
    """``gain_reset.scan`` lists non-zero gain and does not write."""

    def test_lists_nonzero_gain_and_skips_zero(self) -> None:
        """A +1.5 dB track is listed. A 0.000 track is checked, not listed."""
        with TempLibrary() as temp:
            hot = temp.root / "hot.mp3"
            flat = temp.root / "flat.mp3"
            _audio(hot, gain="1.500")
            _audio(flat, gain="0.000")
            before = _digest(hot)
            with open_database(temp.db) as conn:
                _add_track(conn, 10, name="Hot")
                _add_track(conn, 11, name="Flat")
                _point(conn, 10, hot)
                _point(conn, 11, flat)
            db_before = _digest(temp.db)
            body = gain_reset.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(_digest(temp.db), db_before)
            self.assertEqual(_digest(hot), before)
        self.assertEqual(body["checked"], 2)
        self.assertEqual(body["folder"], "crateCraft")
        self.assertEqual(body["name"], "Gain changed")
        self.assertEqual([row["id"] for row in body["changed"]], [10])
        self.assertEqual(body["changed"][0]["gain_db"], 1.5)
        self.assertEqual(body["changed"][0]["file"], "hot.mp3")

    def test_offline_drive_is_not_a_changed_row(self) -> None:
        """An unplugged volume is offline, not listed as gain-changed."""
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                _add_track(conn, 20, name="Away")
                conn.execute(
                    "UPDATE asset SET portable_id = ? WHERE id = 20",
                    ("/Volumes/Stick/away.mp3",),
                )

            def _absent(stored: object) -> str | None:
                if isinstance(stored, str) and stored.startswith("/Volumes/Stick/"):
                    return "Stick"
                return None

            with mock.patch("gain_reset.volumes.absent_volume", side_effect=_absent):
                body = gain_reset.scan(temp.db, library.LIBRARY_SPACE)
            self.assertGreaterEqual(int(body["offline"]), 1)
            self.assertTrue(all(row["id"] != 20 for row in body["changed"]))


class ResetTests(unittest.TestCase):
    """Confirmed reset rewrites only Gain dB and verifies read-back."""

    def test_reset_writes_zero_and_keeps_other_frames(self) -> None:
        """Gain becomes 0.000. Markers2 and BeatGrid bytes stay. Auto Gain stays."""
        with TempLibrary() as temp:
            path = temp.root / "loud.mp3"
            markers = _audio(path, gain="-2.500")
            with open_database(temp.db) as conn:
                _add_track(conn, 30, name="Loud")
                _point(conn, 30, path)
            before_frames = snapshot_frames.read_stored_frames(path)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                result = gain_reset.reset(library.LIBRARY_SPACE)
            self.assertTrue(result["written"])
            self.assertEqual(result["added"], 1)
            after_frames = snapshot_frames.read_stored_frames(path)
            self.assertEqual(after_frames.get("Markers2"), before_frames.get("Markers2"))
            self.assertEqual(after_frames.get("BeatGrid"), before_frames.get("BeatGrid"))
            self.assertEqual(gain_reset.read_gain(path), 0.0)
            parsed = gain_reset.parse_autotags(
                snapshot_frames.payload_from_stored(after_frames["Autotags"])
            )
            assert parsed is not None
            self.assertEqual(parsed[0], "115.00")
            self.assertEqual(parsed[1], "-3.257")
            self.assertEqual(parsed[2], "0.000")
            self.assertEqual(
                snapshot_frames.payload_from_stored(after_frames["Markers2"]),
                markers,
            )
            saved = result.get("_saved")
            assert isinstance(saved, list) and saved
            gain_reset.undo(saved)
            self.assertEqual(gain_reset.read_gain(path), -2.5)

    def test_reset_refuses_while_serato_is_open(self) -> None:
        """Serato open blocks the write. The audio file is unchanged."""
        with TempLibrary() as temp:
            path = temp.root / "busy.mp3"
            _audio(path, gain="3.000")
            with open_database(temp.db) as conn:
                _add_track(conn, 40, name="Busy")
                _point(conn, 40, path)
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            before = _digest(path)
            with mock.patch("library._process_is_serato", return_value=True):
                with self.assertRaises(SeratoOpen):
                    gain_reset.reset(library.LIBRARY_SPACE)
            self.assertEqual(_digest(path), before)
            self.assertEqual(gain_reset.read_gain(path), 3.0)

    def test_failed_verify_rolls_back(self) -> None:
        """A read-back that still shows non-zero gain puts the file back."""
        with TempLibrary() as temp:
            path = temp.root / "stuck.mp3"
            _audio(path, gain="4.000")
            with open_database(temp.db) as conn:
                _add_track(conn, 50, name="Stuck")
                _point(conn, 50, path)
            before = _digest(path)
            real_read = gain_reset.read_gain

            def fake_read(target: Path) -> float | None:
                if target == path:
                    return 4.0
                return real_read(target)

            with mock.patch("snapshots.serato_dj_running", return_value=False), mock.patch(
                "gain_reset.read_gain", side_effect=fake_read
            ):
                with self.assertRaises(Exception):
                    gain_reset.reset(library.LIBRARY_SPACE)
            self.assertEqual(_digest(path), before)
            self.assertEqual(gain_reset.read_gain(path), 4.0)

    def test_empty_plan_does_not_write(self) -> None:
        """All-zero gain returns written false and skips safe_write."""
        with TempLibrary() as temp:
            path = temp.root / "quiet.mp3"
            _audio(path, gain="0.000")
            with open_database(temp.db) as conn:
                _add_track(conn, 60, name="Quiet")
                _point(conn, 60, path)
            with mock.patch("safe_write.run") as run:
                result = gain_reset.reset(library.LIBRARY_SPACE)
            run.assert_not_called()
        self.assertFalse(result["written"])
        self.assertEqual(result["added"], 0)


class CrateTests(unittest.TestCase):
    """Gain changed crate lands under the labelled crateCraft folder."""

    def test_create_puts_crate_under_cratecraft_folder(self) -> None:
        """Parent is crateCraft. A top-level Gain changed DJ crate is left alone."""
        with TempLibrary() as temp:
            path = temp.root / "hot.mp3"
            _audio(path, gain="2.000")
            with open_database(temp.db) as conn:
                # Reuse fixture asset 1 so location_id is set for membership writes.
                _point(conn, 1, path)
                conn.execute("UPDATE asset SET name = ? WHERE id = 1", ("Hot",))
                conn.execute(
                    "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (80, 1, ?, 1, 1)",
                    ("Gain changed",),
                )
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                result = gain_reset.create_crate(library.LIBRARY_SPACE)
            self.assertTrue(result["written"])
            saved = result["saved"]
            assert isinstance(saved, dict)
            crate_id = int(saved["id"])
            with open_database(temp.db) as conn:
                row = conn.execute(
                    "SELECT parent_id, name FROM container WHERE id = ?",
                    (crate_id,),
                ).fetchone()
                parent = conn.execute(
                    "SELECT name FROM container WHERE id = ?",
                    (int(row[0]),),
                ).fetchone()
                dj = conn.execute("SELECT parent_id FROM container WHERE id = 80").fetchone()
                members = [
                    int(r[0])
                    for r in conn.execute(
                        """
                        SELECT ca.asset_id FROM container_asset ca
                        JOIN location_container lc ON lc.id = ca.location_container_id
                        WHERE lc.container_id = ?
                        """,
                        (crate_id,),
                    )
                ]
            self.assertEqual(library.display_name(str(parent[0])), "crateCraft")
            self.assertEqual(library.display_name(str(row[1])), "Gain changed")
            self.assertEqual(int(dj[0]), 1)
            self.assertEqual(members, [1])

    def test_create_without_confirm_is_preview(self) -> None:
        """POST create without confirm true does not write."""
        with TempLibrary() as temp:
            path = temp.root / "hot.mp3"
            _audio(path, gain="1.000")
            with open_database(temp.db) as conn:
                _add_track(conn, 90, name="Hot")
                _point(conn, 90, path)
            result = gain_reset.action({"action": "create", "space": library.LIBRARY_SPACE})
        self.assertTrue(result["preview"])
        self.assertFalse(result["written"])
        self.assertEqual(result["added"], 1)


class ApiTests(unittest.TestCase):
    """GET/POST /api/gain through the real HTTP handler."""

    def setUp(self) -> None:
        self.temp = TempLibrary()
        self.temp.__enter__()
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_address[1]}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.thread.join(timeout=5)
        self.temp.__exit__(None, None, None)

    def _get(self, path: str) -> tuple[int, dict[str, object]]:
        with urllib.request.urlopen(self.base + path) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def _post(self, path: str, body: dict[str, object]) -> tuple[int, dict[str, object]]:
        request = urllib.request.Request(
            self.base + path,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            return exc.code, json.loads(exc.read().decode("utf-8"))

    def test_get_lists_nonzero_gain(self) -> None:
        """GET /api/gain returns the scan for the open space."""
        path = self.temp.root / "api.mp3"
        _audio(path, gain="0.750")
        with open_database(self.temp.db) as conn:
            _add_track(conn, 100, name="Api")
            _point(conn, 100, path)
        status, body = self._get("/api/gain?space=Serato%20Library")
        self.assertEqual(status, 200)
        self.assertEqual([row["id"] for row in body["changed"]], [100])
        self.assertEqual(body["name"], "Gain changed")

    def test_reset_needs_confirm(self) -> None:
        """POST reset without confirm is 400 with the stable code."""
        status, body = self._post(
            "/api/gain",
            {"action": "reset", "space": "Serato Library", "confirm": False},
        )
        self.assertEqual(status, 400)
        self.assertEqual(body.get("code"), "gain_needs_confirm")
        self.assertEqual(body.get("error"), gain_reset.NEEDS_CONFIRM)

    def test_sibling_feature_routes_are_absent(self) -> None:
        """This branch serves /api/gain only; sibling feature APIs stay 404."""
        for path in ("/api/reanalyze", "/api/tonight", "/api/cue-edit"):
            with self.subTest(path=path):
                try:
                    with urllib.request.urlopen(self.base + path) as response:
                        status = response.status
                except urllib.error.HTTPError as exc:
                    status = exc.code
                self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main()
