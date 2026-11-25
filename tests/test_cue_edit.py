"""Hot cue edit preview, apply, verify, and undo (#464).

Synthetic Markers2 bytes only. The live Serato library is not opened.
"""

from __future__ import annotations

import base64
import hashlib
import json
import shutil
import sqlite3
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import cue_edit
import library
import protected_fields
import server
import snapshot_frames
import tags
from library import SeratoOpen
from tests.fixture import ROOT, TempLibrary, open_database
from tests.test_library_health import _add_track
from tests.test_tags import (
    _beatgrid_payload,
    _cue,
    _entry,
    _flip,
    _geob_frame,
    _id3_pack,
    _loop,
    _serato_b64,
)


def _digest(path: Path) -> str:
    """Return the SHA-256 of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _payload(
    cues: list[tuple[int, int, bytes, str]],
    *,
    extras: bool = True,
    trailing_null: bool = True,
) -> bytes:
    """Encode cue entries, and by default one loop, flip, color, and bpmlock."""
    decoded = b""
    decoded += _entry("COLOR", b"\x00\xcc\x00\x00")
    decoded += _entry("BPMLOCK", b"\x00")
    for index, start_ms, color, name in cues:
        decoded += _entry("CUE", _cue(index & 0xFF, start_ms, color, name))
    if extras:
        decoded += _entry("LOOP", _loop(1, 5000, 8000, True, "Break"))
        decoded += _entry("FLIP", _flip(2, True, "Chop"))
    if trailing_null:
        decoded += b"\x00"
    return b"\x01\x01" + base64.b64encode(decoded)


def _audio_mp3(path: Path, payload: bytes) -> None:
    """Write a tiny ID3 file with Markers2 and BeatGrid."""
    path.write_bytes(
        _id3_pack(
            [
                _geob_frame("Serato Markers2", payload),
                _geob_frame("Serato BeatGrid", _beatgrid_payload()),
            ]
        )
        + b"\xff\xfb\x90\x00"
    )


def _audio_flac(path: Path, payload: bytes) -> None:
    """Write a minimal FLAC with Markers2 and BeatGrid comments."""
    streaminfo = bytes(34)
    markers = b"SERATO_MARKERS_V2=" + _serato_b64("Serato Markers2", payload, wrap=True)
    grid = b"SERATO_BEATGRID=" + _serato_b64("Serato BeatGrid", _beatgrid_payload(), wrap=False)
    vendor = b"crateCraft"
    comments = [markers, grid]
    vorbis = len(vendor).to_bytes(4, "little") + vendor
    vorbis += len(comments).to_bytes(4, "little")
    for comment in comments:
        vorbis += len(comment).to_bytes(4, "little") + comment
    blocks = (
        bytes([0x00])
        + len(streaminfo).to_bytes(3, "big")
        + streaminfo
        + bytes([0x84])
        + len(vorbis).to_bytes(3, "big")
        + vorbis
    )
    path.write_bytes(b"fLaC" + blocks + b"AUDIO")


def _point(conn: sqlite3.Connection, asset_id: int, path: Path, *, bpm: float = 128.0) -> None:
    """Store an absolute path and BPM on one asset."""
    conn.execute(
        "UPDATE asset SET portable_id = ?, file_name = ?, bpm = ? WHERE id = ?",
        (str(path), path.name, bpm, asset_id),
    )


def _pads(*filled: tuple[int, int, str, str | None]) -> list[dict[str, object] | None]:
    """Build eight pad slots from ``(index, start_ms, name, color)``."""
    slots: list[dict[str, object] | None] = [None] * 8
    for index, start_ms, name, color in filled:
        slots[index] = {"index": index, "start_ms": start_ms, "name": name, "color": color}
    return slots


class EditTests(unittest.TestCase):
    """Preview lists diffs. Apply writes. Undo restores. Guards refuse."""

    def test_round_trip_mp3_rename_recolor_move_delete_set_swap(self) -> None:
        """One apply renames, recolors, moves, deletes, sets, and swaps pads."""
        with TempLibrary() as temp:
            path = temp.root / "edit.mp3"
            _audio_mp3(
                path,
                _payload(
                    [
                        (0, 1000, b"\xcc\x00\x00", "Drop"),
                        (1, 2000, b"\x00\xcc\x00", "Break"),
                        (2, 3000, b"\x00\x00\xcc", "Out"),
                    ]
                ),
            )
            grid = snapshot_frames.read_stored_frames(path)["BeatGrid"]
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 10, name="Edit")
                _point(conn, 10, path)
            before = cue_edit.preview(10, library.LIBRARY_SPACE)
            self.assertTrue(before["editable"])
            self.assertTrue(before["preview"])
            self.assertEqual(path.read_bytes(), original)
            pads = _pads(
                (0, 1500, "Intro", "#C02626"),  # rename + move + recolor
                (2, 3000, "Out", "#0000CC"),  # unchanged (slot 2 kept, 1 deleted)
                (3, 4000, "New", "#FAC313"),  # set empty pad
                (7, 2000, "Break", "#00CC00"),  # swap former pad 1 to 7
            )
            plan = cue_edit.preview(10, library.LIBRARY_SPACE, pads, before["fingerprint"])
            self.assertEqual(len(plan["diffs"]), 4)
            result = cue_edit.apply(10, library.LIBRARY_SPACE, pads, before["fingerprint"])
            self.assertTrue(result["written"])
            self.assertIsNotNone(result.get("snapshot_id"))
            parsed = tags.read_serato_tags(str(path))
            by_index = {int(cue["index"]): cue for cue in parsed["cues"]}
            self.assertEqual(by_index[0]["name"], "Intro")
            self.assertEqual(by_index[0]["start_ms"], 1500)
            self.assertEqual(by_index[0]["color"], "#C02626")
            self.assertNotIn(1, by_index)
            self.assertEqual(by_index[2]["name"], "Out")
            self.assertEqual(by_index[3]["name"], "New")
            self.assertEqual(by_index[7]["name"], "Break")
            self.assertEqual([loop["name"] for loop in parsed["loops"]], ["Break"])
            self.assertEqual([flip["name"] for flip in parsed["flips"]], ["Chop"])
            self.assertEqual(snapshot_frames.read_stored_frames(path)["BeatGrid"], grid)
            self.assertNotEqual(path.read_bytes(), original)
            cue_edit.undo_frames(result["_saved"])
            self.assertEqual(path.read_bytes(), original)

    def test_round_trip_flac_and_fixture_formats(self) -> None:
        """FLAC synthetic and Serato 4 fixtures keep non-cue frames."""
        cases = [
            ("synthetic.flac", "flac"),
            ("one-grid.mp3", "fixture"),
            ("one-grid.flac", "fixture"),
            ("several-grid.aiff", "fixture"),
            ("several-grid.m4a", "fixture"),
        ]
        for name, kind in cases:
            with self.subTest(name=name):
                with TempLibrary() as temp:
                    if kind == "flac":
                        path = temp.root / name
                        _audio_flac(
                            path,
                            _payload([(0, 1000, b"\xcc\x00\x00", "Drop")], trailing_null=False),
                        )
                    else:
                        source = ROOT / "tests" / "fixtures" / "serato4" / "audio" / name
                        path = temp.root / name
                        shutil.copy2(source, path)
                    frames_before = snapshot_frames.read_stored_frames(path)
                    grid = frames_before.get("BeatGrid")
                    original = path.read_bytes()
                    with open_database(temp.db) as conn:
                        _add_track(conn, 20, name=name)
                        _point(conn, 20, path)
                    status = cue_edit.preview(20, library.LIBRARY_SPACE)
                    self.assertTrue(status["editable"], status.get("reason"))
                    pads = list(status["before"])
                    first = pads[0]
                    if first is None:
                        pads[0] = {"index": 0, "start_ms": 1234, "name": "Set", "color": "#C02626"}
                    else:
                        pads[0] = {
                            "index": 0,
                            "start_ms": int(first["start_ms"]) + 10,
                            "name": "Renamed",
                            "color": "#C02626",
                        }
                    result = cue_edit.apply(20, library.LIBRARY_SPACE, pads, status["fingerprint"])
                    self.assertTrue(result["written"])
                    parsed = tags.read_serato_tags(str(path))
                    self.assertEqual(parsed["cues"][0]["name"] if pads[0] else None, pads[0]["name"])
                    if grid is not None:
                        self.assertEqual(snapshot_frames.read_stored_frames(path)["BeatGrid"], grid)
                    cue_edit.undo_frames(result["_saved"])
                    self.assertEqual(_digest(path), hashlib.sha256(original).hexdigest())

    def test_corrupt_markers2_refuses_without_touching_file(self) -> None:
        """A truncated Markers2 body is refused and the file stays put."""
        with TempLibrary() as temp:
            path = temp.root / "bad.mp3"
            payload = b"\x01\x01" + base64.b64encode(b"CUE\x00\x00\x00\x00\x20" + b"\x00" * 8)
            _audio_mp3(path, payload)
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 30, name="Bad")
                _point(conn, 30, path)
            status = cue_edit.preview(30, library.LIBRARY_SPACE)
            self.assertFalse(status["editable"])
            self.assertEqual(status["reason"], "corrupt")
            pads = _pads((0, 1000, "Nope", "#C02626"))
            with mock.patch("safe_write.run", side_effect=AssertionError("wrote")):
                result = cue_edit.apply(30, library.LIBRARY_SPACE, pads)
            self.assertFalse(result["written"])
            self.assertEqual(path.read_bytes(), original)

    def test_serato_running_and_protected_and_outside_change(self) -> None:
        """Serato lock, protected cues, and fingerprint mismatch leave the file."""
        with TempLibrary() as temp:
            path = temp.root / "guard.mp3"
            _audio_mp3(path, _payload([(0, 1000, b"\xcc\x00\x00", "Drop")]))
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 40, name="Guard")
                _point(conn, 40, path)
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            pads = _pads((0, 2000, "Moved", "#C02626"))
            status = cue_edit.preview(40, library.LIBRARY_SPACE)
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                cue_edit.apply(40, library.LIBRARY_SPACE, pads, status["fingerprint"])
            self.assertEqual(path.read_bytes(), original)
            protected_fields.save({"cues": True})
            self.addCleanup(lambda: protected_fields.save({"cues": False}))
            blocked = cue_edit.preview(40, library.LIBRARY_SPACE)
            self.assertFalse(blocked["editable"])
            self.assertEqual(blocked["reason"], "protected")
            protected_fields.save({"cues": False})
            wrong = cue_edit.apply(
                40,
                library.LIBRARY_SPACE,
                pads,
                {"size": 1, "mtime_ns": 1},
            )
            self.assertFalse(wrong["written"])
            self.assertEqual(wrong["reason"], "outside_change")
            self.assertEqual(path.read_bytes(), original)

    def test_apply_without_confirm_does_not_write(self) -> None:
        """``confirm`` must be true."""
        with TempLibrary() as temp:
            path = temp.root / "confirm.mp3"
            _audio_mp3(path, _payload([(0, 1000, b"\xcc\x00\x00", "Drop")]))
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 50, name="Confirm")
                _point(conn, 50, path)
            with self.assertRaises(library.LibraryError) as raised:
                cue_edit.action(
                    {
                        "action": "apply",
                        "id": 50,
                        "space": library.LIBRARY_SPACE,
                        "pads": _pads((0, 2000, "X", "#C02626")),
                    }
                )
            self.assertEqual(raised.exception.message, cue_edit.NEEDS_CONFIRM)
            self.assertEqual(path.read_bytes(), original)

    def test_undo_restores_markers_only_keeps_later_library_edit(self) -> None:
        """Undo puts Markers2 back and leaves a later library row alone."""
        with TempLibrary() as temp:
            path = temp.root / "undo.mp3"
            _audio_mp3(path, _payload([(0, 1000, b"\xcc\x00\x00", "Drop")]))
            markers_before = snapshot_frames.read_stored_frames(path)["Markers2"]
            grid_before = snapshot_frames.read_stored_frames(path)["BeatGrid"]
            with open_database(temp.db) as conn:
                _add_track(conn, 55, name="Before")
                _point(conn, 55, path)
            status = cue_edit.preview(55, library.LIBRARY_SPACE)
            pads = list(status["before"])
            pads[0] = {
                "index": 0,
                "start_ms": 2222,
                "name": "Moved",
                "color": "#C02626",
            }
            result = cue_edit.apply(55, library.LIBRARY_SPACE, pads, status["fingerprint"])
            self.assertTrue(result["written"])
            snapshot_id = result["snapshot_id"]
            self.assertIsInstance(snapshot_id, str)
            self.assertNotEqual(
                snapshot_frames.read_stored_frames(path)["Markers2"], markers_before
            )
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET name = ? WHERE id = ?", ("After edit", 55))
                conn.commit()
                row = conn.execute("SELECT name FROM asset WHERE id = 55").fetchone()
                self.assertEqual(row[0], "After edit")
            undone = cue_edit.action(
                {
                    "action": "undo",
                    "confirm": True,
                    "snapshot_id": snapshot_id,
                }
            )
            self.assertTrue(undone["written"])
            self.assertEqual(undone["undone"], snapshot_id)
            frames = snapshot_frames.read_stored_frames(path)
            self.assertEqual(frames["Markers2"], markers_before)
            self.assertEqual(frames["BeatGrid"], grid_before)
            self.assertEqual(tags.read_serato_tags(str(path))["cues"][0]["name"], "Drop")
            with open_database(temp.db) as conn:
                row = conn.execute("SELECT name FROM asset WHERE id = 55").fetchone()
                self.assertEqual(row[0], "After edit")


class RouteTests(unittest.TestCase):
    """``POST /api/cue-edit``."""

    def _post(self, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"http://{host!s}:{port}/api/cue-edit",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            return exc.code, json.loads(exc.read().decode("utf-8"))
        finally:
            httpd.shutdown()
            thread.join(timeout=5)

    def test_preview_and_apply_route(self) -> None:
        """The route returns preview diffs and writes on confirm."""
        with TempLibrary() as temp:
            path = temp.root / "route.mp3"
            _audio_mp3(path, _payload([(0, 1000, b"\xcc\x00\x00", "Drop")]))
            with open_database(temp.db) as conn:
                _add_track(conn, 60, name="Route")
                _point(conn, 60, path)
            status, body = self._post(
                {"action": "preview", "id": 60, "space": library.LIBRARY_SPACE}
            )
            self.assertEqual(status, 200)
            self.assertTrue(body["preview"])
            self.assertTrue(body["editable"])
            pads = list(body["before"])
            pads[0] = {"index": 0, "start_ms": 1111, "name": "Moved", "color": "#C02626"}
            status, applied = self._post(
                {
                    "action": "apply",
                    "id": 60,
                    "space": library.LIBRARY_SPACE,
                    "confirm": True,
                    "pads": pads,
                    "fingerprint": body["fingerprint"],
                }
            )
            self.assertEqual(status, 200)
            self.assertTrue(applied["written"])
            self.assertEqual(tags.read_serato_tags(str(path))["cues"][0]["name"], "Moved")
            self.assertIsNotNone(applied.get("snapshot_id"))


if __name__ == "__main__":
    unittest.main()
