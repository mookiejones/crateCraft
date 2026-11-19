"""Suspicious cue counts and same-time cleanup (#382).

Synthetic Markers2 bytes only. The live Serato library is not opened.
"""

from __future__ import annotations

import base64
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

import library
import library_health
import server
import snapshot_frames
import suspicious_cues
import tags
from library import SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests.test_library_health import _add_track, _crate, _member
from tests.test_tags import (
    _beatgrid_payload,
    _cue,
    _entry,
    _flip,
    _geob_frame,
    _id3_pack,
    _loop,
)


def _digest(path: Path) -> str:
    """Return the SHA-256 of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _payload(cues: list[tuple[int, int, str]], *, extras: bool = True) -> bytes:
    """Encode cue entries, and by default one loop and one flip.

    Args:
        cues: ``(index, start_ms, name)`` triples.
        extras: When true, append a loop and a flip the cleanup must keep.

    Returns:
        A Markers2 payload. No file is written.
    """
    decoded = b""
    for index, start_ms, name in cues:
        decoded += _entry("CUE", _cue(index & 0xFF, start_ms, b"\xCC\x00\x00", name))
    if extras:
        decoded += _entry("LOOP", _loop(1, 5000, 8000, True, "Break"))
        decoded += _entry("FLIP", _flip(2, True, "Chop"))
    return b"\x01\x01" + base64.b64encode(decoded)


def _audio(path: Path, payload: bytes) -> None:
    """Write a tiny ID3 file with Markers2 and a BeatGrid.

    Args:
        path: File to create.
        payload: Markers2 bytes.
    """
    path.write_bytes(
        _id3_pack(
            [
                _geob_frame("Serato Markers2", payload),
                _geob_frame("Serato BeatGrid", _beatgrid_payload()),
            ]
        )
        + b"\xff\xfb\x90\x00"
    )


def _point(conn: sqlite3.Connection, asset_id: int, path: Path) -> None:
    """Store an absolute path on one asset."""
    conn.execute("UPDATE asset SET portable_id = ?, file_name = ? WHERE id = ?", (str(path), path.name, asset_id))


class ReportTests(unittest.TestCase):
    """``library_health.report`` flags crowded cue lists and does not write."""

    def test_over_64_cues_is_flagged_and_seven_at_one_time_is_not(self) -> None:
        """65 distinct cues are flagged. Seven cues at one time are not."""
        with TempLibrary() as temp:
            crowded = temp.root / "crowded.mp3"
            seven = temp.root / "seven.mp3"
            _audio(crowded, _payload([(index, index * 10, f"c{index}") for index in range(65)], extras=False))
            _audio(seven, _payload([(index, 1000, f"s{index}") for index in range(7)], extras=False))
            audio_before = _digest(crowded)
            with open_database(temp.db) as conn:
                _add_track(conn, 30, name="Crowded")
                _add_track(conn, 31, name="Seven")
                _point(conn, 30, crowded)
                _point(conn, 31, seven)
            before = _digest(temp.db)
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(_digest(temp.db), before)
            self.assertEqual(_digest(crowded), audio_before)
        ids = [row["id"] for row in body["suspicious_cues"]["tracks"]]
        self.assertEqual(body["suspicious_cues"]["count"], 1)
        self.assertEqual(ids, [30])
        self.assertEqual(body["suspicious_cues"]["tracks"][0]["file"], "crowded.mp3")
        self.assertNotIn("path", body["suspicious_cues"]["tracks"][0])

    def test_eight_cues_at_one_time_are_flagged(self) -> None:
        """Eight cues that share a start time are flagged even under the count cap."""
        with TempLibrary() as temp:
            path = temp.root / "stacked.mp3"
            _audio(path, _payload([(index, 1000, f"d{index}") for index in range(8)], extras=False))
            with open_database(temp.db) as conn:
                _add_track(conn, 40, name="Stacked")
                _point(conn, 40, path)
            body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual([row["id"] for row in body["suspicious_cues"]["tracks"]], [40])

    def test_missing_file_is_not_scanned_and_a_crate_can_hide_the_track(self) -> None:
        """A path that is not on disk is not opened. A crate that excludes it is empty."""
        with TempLibrary() as temp:
            present = temp.root / "here.mp3"
            missing = temp.root / "gone.mp3"
            _audio(present, _payload([(index, 1000, f"d{index}") for index in range(8)], extras=False))
            with open_database(temp.db) as conn:
                _add_track(conn, 50, name="Here")
                _add_track(conn, 51, name="Gone", missing=1)
                _point(conn, 50, present)
                _point(conn, 51, missing)
                _crate(conn, 5, "Gig")
                _member(conn, 5, 51)
            seen: list[str] = []
            real = tags.read_serato_tags

            def spy(path: str | None) -> dict[str, object]:
                seen.append(str(path))
                return real(path)

            with mock.patch("library_health.tags.read_serato_tags", side_effect=spy):
                space = library_health.report(temp.db, library.LIBRARY_SPACE)
                crate = library_health.report(temp.db, library.LIBRARY_SPACE, 5)
        self.assertIn(str(present), seen)
        self.assertNotIn(str(missing), seen)
        self.assertEqual([row["id"] for row in space["suspicious_cues"]["tracks"]], [50])
        self.assertEqual(crate["suspicious_cues"], {"count": 0, "tracks": []})

    def test_sample_cap_keeps_the_full_suspicious_count(self) -> None:
        """More than ROW_CAP flagged tracks still report the full count."""
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                for offset in range(3):
                    path = temp.root / f"crowd-{offset}.mp3"
                    _audio(path, _payload([(index, 1000, f"d{index}") for index in range(8)], extras=False))
                    asset_id = 60 + offset
                    _add_track(conn, asset_id, name=f"Crowd{offset}")
                    _point(conn, asset_id, path)
            with mock.patch("library_health.ROW_CAP", 1):
                body = library_health.report(temp.db, library.LIBRARY_SPACE)
        self.assertEqual(body["suspicious_cues"]["count"], 3)
        self.assertEqual(len(body["suspicious_cues"]["tracks"]), 1)


class CleanupTests(unittest.TestCase):
    """Preview lists duplicates. Apply writes. Undo restores. An empty plan does not."""

    def _stack(self, root: Path) -> Path:
        """Write eight cues at one time, one later cue, a loop, and a flip."""
        path = root / "stack.mp3"
        cues = [(0, 1000, "Keep")]
        cues.extend((index, 1000, f"Dup{index}") for index in range(1, 8))
        cues.append((9, 2000, "Only"))
        _audio(path, _payload(cues))
        return path

    def test_preview_lists_only_duplicate_cues(self) -> None:
        """The kept cue, the distinct cue, the loop, and the flip are not listed."""
        with TempLibrary() as temp:
            path = self._stack(temp.root)
            before = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 70, name="Stack")
                _point(conn, 70, path)
            plan = suspicious_cues.preview(library.LIBRARY_SPACE)
            self.assertEqual(path.read_bytes(), before)
        self.assertTrue(plan["preview"])
        self.assertFalse(plan["written"])
        self.assertEqual(plan["dropped"], 7)
        names = [cue["name"] for cue in plan["tracks"][0]["cues"]]
        self.assertEqual(names, [f"Dup{index}" for index in range(1, 8)])
        self.assertNotIn("Keep", names)
        self.assertNotIn("Only", names)
        self.assertNotIn("Break", names)
        self.assertNotIn("Chop", names)

    def test_apply_writes_and_undo_restores_bytes(self) -> None:
        """Duplicate cue entries are removed. Loops stay. Undo puts the file back."""
        with TempLibrary() as temp:
            path = self._stack(temp.root)
            original = path.read_bytes()
            grid = snapshot_frames.read_stored_frames(path)["BeatGrid"]
            with open_database(temp.db) as conn:
                _add_track(conn, 70, name="Stack")
                _point(conn, 70, path)
            databases = list(temp.root.glob("*.sqlite"))
            result = suspicious_cues.apply(library.LIBRARY_SPACE)
            self.assertTrue(result["written"])
            self.assertEqual(result["dropped"], 7)
            parsed = tags.read_serato_tags(str(path))
            self.assertEqual(sorted(cue["name"] for cue in parsed["cues"]), ["Keep", "Only"])
            self.assertEqual([loop["name"] for loop in parsed["loops"]], ["Break"])
            self.assertEqual([flip["name"] for flip in parsed["flips"]], ["Chop"])
            self.assertEqual(snapshot_frames.read_stored_frames(path)["BeatGrid"], grid)
            self.assertNotEqual(path.read_bytes(), original)
            suspicious_cues.undo(result["_saved"])
            self.assertEqual(path.read_bytes(), original)
            self.assertEqual(list(temp.root.glob("*.sqlite")), databases)

    def test_nothing_to_change_does_not_write(self) -> None:
        """Sixty-five distinct cues are flagged and are not deleted."""
        with TempLibrary() as temp:
            path = temp.root / "many.mp3"
            _audio(path, _payload([(index, index * 10, f"c{index}") for index in range(65)]))
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 80, name="Many")
                _point(conn, 80, path)
            with mock.patch("safe_write.run", side_effect=AssertionError("wrote")):
                result = suspicious_cues.apply(library.LIBRARY_SPACE)
            self.assertFalse(result["written"])
            self.assertEqual(result["dropped"], 0)
            self.assertEqual(path.read_bytes(), original)

    def test_apply_refuses_while_serato_is_running(self) -> None:
        """The audio file is unchanged when Serato holds the library."""
        with TempLibrary() as temp:
            path = self._stack(temp.root)
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 70, name="Stack")
                _point(conn, 70, path)
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                suspicious_cues.apply(library.LIBRARY_SPACE)
            self.assertEqual(path.read_bytes(), original)

    def test_apply_without_confirm_does_not_write(self) -> None:
        """``confirm`` must be true. The stable code is ``cues_needs_confirm``."""
        with TempLibrary() as temp:
            path = self._stack(temp.root)
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 70, name="Stack")
                _point(conn, 70, path)
            with self.assertRaises(library.LibraryError) as raised:
                suspicious_cues.action({"action": "apply", "space": library.LIBRARY_SPACE})
            self.assertEqual(raised.exception.message, suspicious_cues.NEEDS_CONFIRM)
            self.assertEqual(path.read_bytes(), original)


class RouteTests(unittest.TestCase):
    """``POST /api/suspicious-cues``."""

    def _post(self, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"http://{host!s}:{port}/api/suspicious-cues",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        try:
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

    def test_preview_route_does_not_write_and_confirm_is_required(self) -> None:
        with TempLibrary() as temp:
            path = temp.root / "stack.mp3"
            cues = [(0, 1000, "Keep")]
            cues.extend((index, 1000, f"Dup{index}") for index in range(1, 8))
            _audio(path, _payload(cues, extras=False))
            original = path.read_bytes()
            with open_database(temp.db) as conn:
                _add_track(conn, 70, name="Stack")
                _point(conn, 70, path)
            status, plan = self._post({"action": "preview"})
            self.assertEqual(status, 200)
            self.assertEqual(plan["dropped"], 7)
            self.assertFalse(plan["written"])
            status, refused = self._post({"action": "apply"})
            self.assertEqual(status, 400)
            self.assertEqual(refused["code"], "cues_needs_confirm")
            self.assertEqual(path.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
