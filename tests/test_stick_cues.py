"""Stick-only cues fill empty library slots and leave the rest alone.

The audio files are synthetic ID3 tags. The live Serato library is not
opened. An unmounted drive is not a missing file.
"""

from __future__ import annotations

import base64
import json
import os
import sqlite3
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import library
import server
import stick_cues
import tags
from tests.fixture import TempLibrary


def _entry(kind: str, blob: bytes) -> bytes:
    """Wrap one Markers2 record. Independent of the importer's encoder."""
    return kind.encode("ascii") + b"\x00" + len(blob).to_bytes(4, "big") + blob


def _cue(index: int, start_ms: int, name: str) -> bytes:
    """Build a CUE record at the offsets the parser reads."""
    raw = bytearray(13 + len(name))
    raw[1] = index
    raw[2:6] = start_ms.to_bytes(4, "big")
    raw[7:10] = b"\xcc\x00\x00"
    raw[12:] = name.encode("utf-8") + b"\x00"
    return bytes(raw)


def _payload(cues: list[tuple[int, int, str]]) -> bytes:
    """Encode cue triples as a Markers2 body. No file is written."""
    decoded = b"".join(_entry("CUE", _cue(index, start, name)) for index, start, name in cues)
    return b"\x01\x01" + base64.b64encode(decoded)


def _id3(path: Path, payload: bytes) -> None:
    """Write a tiny ID3v2.3 file that holds one Markers2 frame."""
    description = b"Serato Markers2\x00"
    body = bytes([0]) + b"application/octet-stream\x00" + b"\x00" + description + payload
    frame = b"GEOB" + len(body).to_bytes(4, "big") + b"\x00\x00" + body
    size = len(frame)
    synchsafe = bytes(
        ((size >> 21) & 0x7F, (size >> 14) & 0x7F, (size >> 7) & 0x7F, size & 0x7F)
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"ID3" + bytes([3, 0, 0]) + synchsafe + frame)


def _cues(path: Path) -> dict[int, tuple[int, str]]:
    """Return cue index to start and name, using the production parser."""
    found: dict[int, tuple[int, str]] = {}
    for cue in tags.read_serato_tags(str(path))["cues"]:
        found[int(cue["index"])] = (int(cue["start_ms"]), str(cue["name"]))
    return found


def _track(conn: sqlite3.Connection, asset_id: int, path: Path) -> None:
    """Insert one library track that points at a synthetic file."""
    conn.execute(
        """
        INSERT INTO asset (id, name, artist, file_name, portable_id, is_missing, length_ms)
        VALUES (?, ?, ?, ?, ?, 0, 180000)
        """,
        (asset_id, "Deck", "DJ", path.name, str(path)),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


class StickCueTests(unittest.TestCase):
    """Preview lists stick-only cues. Apply does not replace a library cue."""

    def setUp(self) -> None:
        """Point settings at a throwaway directory and keep Serato closed."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._block = mock.patch("snapshots.write_block_message", return_value=None)
        self._env.start()
        self._running.start()
        self._block.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory and the Serato stubs."""
        self._block.stop()
        self._running.stop()
        self._env.stop()
        self._config.cleanup()

    def test_import_fills_an_empty_slot_and_keeps_the_library_cue(self) -> None:
        """Index 0 stays the library cue. Index 1 is copied from the stick.

        Returns:
            None. The test fails if preview writes, if the stick file
            changes, or if the library cue at index 0 is replaced.
        """
        with TempLibrary() as temp:
            library_file = temp.root / "Music" / "track.mp3"
            stick = Path(tempfile.mkdtemp(dir=temp.root))
            stick_file = stick / "Music" / "track.mp3"
            _id3(library_file, _payload([(0, 1000, "Lib")]))
            _id3(stick_file, _payload([(0, 9000, "Deck"), (1, 5000, "Deck")]))
            library_before = library_file.read_bytes()
            stick_before = stick_file.read_bytes()
            with sqlite3.connect(temp.db) as conn:
                _track(conn, 80, library_file)
                conn.commit()
            plan = stick_cues.preview(str(stick))
            self.assertFalse(plan["written"])
            self.assertEqual(plan["count"], 1)
            listed = [row for row in plan["cues"] if isinstance(row, dict)]
            by_index = {int(row["index"]): row for row in listed}
            self.assertEqual(by_index[0]["skip"], "slot_filled")
            self.assertEqual(by_index[0]["name"], "Deck")
            self.assertIsNone(by_index[1]["skip"])
            self.assertEqual(by_index[1]["start_ms"], 5000)
            self.assertEqual(library_file.read_bytes(), library_before)
            self.assertEqual(stick_file.read_bytes(), stick_before)
            with self.assertRaises(library.LibraryError) as raised:
                stick_cues.action({"action": "apply", "drive": str(stick)})
            self.assertEqual(raised.exception.message, stick_cues.NEEDS_CONFIRM)
            self.assertEqual(library_file.read_bytes(), library_before)
            applied = stick_cues.action({"action": "apply", "drive": str(stick), "confirm": True})
            self.assertTrue(applied["written"])
            self.assertEqual(applied["count"], 1)
            self.assertEqual(_cues(library_file)[0], (1000, "Lib"))
            self.assertEqual(_cues(library_file)[1], (5000, "Deck"))
            self.assertEqual(stick_file.read_bytes(), stick_before)
            with mock.patch("safe_write.run") as blocked:
                again = stick_cues.action(
                    {"action": "apply", "drive": str(stick), "confirm": True}
                )
            blocked.assert_not_called()
            self.assertFalse(again["written"])
            self.assertEqual(_cues(library_file)[0], (1000, "Lib"))

    def test_unmounted_drive_is_not_a_missing_file(self) -> None:
        """Preview of a missing root is not_connected and creates nothing.

        Returns:
            None. The test fails if the status is missing or a file appears.
        """
        missing = Path(tempfile.mkdtemp())
        os.rmdir(missing)
        with TempLibrary():
            plan = stick_cues.preview(str(missing))
        self.assertEqual(plan["status"], "not_connected")
        self.assertNotEqual(plan["status"], "missing")
        self.assertFalse(plan["written"])
        self.assertNotIn("missing", json.dumps(plan))
        self.assertFalse(missing.exists())

    def test_preview_and_verify_share_skip_reason(self) -> None:
        """The post-write check calls the same function the preview used.

        Returns:
            None. The test fails if verify does not call skip_reason.
        """
        with TempLibrary() as temp:
            library_file = temp.root / "Music" / "track.mp3"
            stick = temp.root / "stick"
            _id3(library_file, _payload([(0, 1000, "Lib")]))
            _id3(stick / "track.mp3", _payload([(1, 5000, "Deck")]))
            with sqlite3.connect(temp.db) as conn:
                _track(conn, 81, library_file)
                conn.commit()
            calls = {"n": 0}
            real = stick_cues.stick_export.skip_reason

            def wrapped(facts: object) -> str | None:
                calls["n"] += 1
                return real(facts)  # type: ignore[arg-type]

            with mock.patch("stick_export.skip_reason", side_effect=wrapped):
                plan = stick_cues.plan_stick(str(stick))
                items = plan["items"]
                self.assertIsInstance(items, list)
                checked = stick_cues.verify_items(items)  # type: ignore[arg-type]
            self.assertGreaterEqual(calls["n"], 2)
            self.assertEqual(checked, [item.skip for item in items])  # type: ignore[union-attr]


class RouteTests(unittest.TestCase):
    """``POST /api/stick-cues``."""

    def setUp(self) -> None:
        """Point settings at a throwaway directory and keep Serato closed."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._block = mock.patch("snapshots.write_block_message", return_value=None)
        self._env.start()
        self._running.start()
        self._block.start()

    def tearDown(self) -> None:
        """Drop the throwaway settings directory and the Serato stubs."""
        self._block.stop()
        self._running.stop()
        self._env.stop()
        self._config.cleanup()

    def _post(self, payload: dict[str, object]) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            f"http://{host!s}:{port}/api/stick-cues",
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

    def test_preview_does_not_write_and_confirm_is_required(self) -> None:
        """Preview is read-only. Apply without confirm is refused.

        Returns:
            None. The test fails if the audio bytes change, or if an
            unknown action or a blank drive is accepted.
        """
        with TempLibrary() as temp:
            library_file = temp.root / "Music" / "track.mp3"
            stick = temp.root / "stick"
            _id3(library_file, _payload([(0, 1000, "Lib")]))
            _id3(stick / "track.mp3", _payload([(1, 4000, "Only")]))
            before = library_file.read_bytes()
            with sqlite3.connect(temp.db) as conn:
                _track(conn, 82, library_file)
                conn.commit()
            status, plan = self._post({"action": "preview", "drive": str(stick)})
            self.assertEqual(status, 200)
            self.assertEqual(plan["count"], 1)
            self.assertFalse(plan["written"])
            self.assertEqual(library_file.read_bytes(), before)
            status, refused = self._post({"action": "apply", "drive": str(stick)})
            self.assertEqual(status, 400)
            self.assertEqual(refused["code"], "stick_cues_needs_confirm")
            self.assertEqual(library_file.read_bytes(), before)
            status, blank = self._post({"action": "preview", "drive": "  "})
            self.assertEqual(status, 400)
            self.assertEqual(blank["code"], "stick_needs_drive")
            status, unknown = self._post({"action": "nope", "drive": str(stick)})
            self.assertEqual(status, 400)
            self.assertEqual(unknown["error"], "That action is not available.")


if __name__ == "__main__":
    unittest.main()
