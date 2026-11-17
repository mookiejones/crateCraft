"""Gig Lock queues library writes, keeps both sides, and undoes per item (#393)."""

from __future__ import annotations

import json
import os
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import app_config
import library
import server
import snapshots
import write_queue
from tests.fixture import TempLibrary
from tests.test_open_error import _open_fails


def _crate_rows() -> list[tuple[int, str, object]]:
    """Return id, display name, and parent for every container."""
    conn = library.read_conn()
    try:
        rows = conn.execute("SELECT id, name, parent_id FROM container").fetchall()
        return [(int(row[0]), library.display_name(str(row[1] or "")), row[2]) for row in rows]
    finally:
        conn.close()


def _names() -> set[str]:
    """Display names of every container."""
    return {name for _cid, name, _parent in _crate_rows()}


class LayerNameTests(unittest.TestCase):
    """Windows-safe layer names do not use a dash-day format."""

    def test_layer_name_uses_day_month_clock(self) -> None:
        """Stamp is ``from crateCraft, 15 Nov 14:02`` with no ``%-d``."""
        when = time.mktime((2026, 11, 15, 14, 2, 0, 0, 0, -1))
        self.assertEqual(write_queue.layer_name(when), "from crateCraft, 15 Nov 14:02")


class WriteQueueHttpTests(unittest.TestCase):
    """Queue, apply, conflict layers, undo skip, and sqlite I/O still 409."""

    def setUp(self) -> None:
        """Start a fixture library, config dir, and HTTP server."""
        self._dir = tempfile.TemporaryDirectory()
        config = Path(self._dir.name) / "config"
        config.mkdir()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: str(config)})
        self._env.start()
        self.library = TempLibrary()
        self.library.__enter__()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.httpd.server_address[:2]
        self.base = f"http://{host}:{port}"

    def tearDown(self) -> None:
        """Stop the server and delete the temporary files."""
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=3)
        self._running.stop()
        self.library.__exit__(None, None, None)
        self._env.stop()
        self._dir.cleanup()

    def request(self, path: str, payload: dict | None = None) -> tuple[int, dict]:
        """Send one JSON request. None payload is GET."""
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = {} if payload is None else {"Content-Type": "application/json"}
        request = urllib.request.Request(self.base + path, data=data, headers=headers)
        try:
            with urllib.request.urlopen(request) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            body = exc.read()
            exc.close()
            return exc.code, json.loads(body.decode("utf-8"))

    def test_gig_lock_queues_crate_create_without_writing(self) -> None:
        """Gig Lock on, Serato closed: create is queued and the database is untouched."""
        before = self.library.db.read_bytes()
        status, settings = self.request("/api/settings", {"gig_lock": True})
        self.assertEqual(status, 200)
        self.assertIs(settings["gig_lock"], True)
        status, body = self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        self.assertEqual(status, 200, body)
        self.assertTrue(body["queued"])
        self.assertEqual(self.library.db.read_bytes(), before)
        status, listing = self.request("/api/write-queue")
        self.assertEqual(status, 200)
        self.assertTrue(listing["gig_lock"])
        self.assertTrue(listing["locked"])
        self.assertEqual(len(listing["pending"]), 1)
        self.assertIn("Peak", listing["pending"][0]["label"])

    def test_queue_while_serato_running(self) -> None:
        """A running Serato DJ process queues a crate create."""
        before = self.library.db.read_bytes()
        with mock.patch("snapshots.serato_dj_running", return_value=True):
            status, body = self.request(
                "/api/crate",
                {"action": "create", "space": library.LIBRARY_SPACE, "name": "Tonight", "parent": 1},
            )
        self.assertEqual(status, 200, body)
        self.assertTrue(body["queued"])
        self.assertEqual(self.library.db.read_bytes(), before)

    def test_sqlite_io_still_409_when_gig_lock_is_on(self) -> None:
        """Disk I/O on the library is still 409. Gig Lock does not swallow it."""
        status, _saved = self.request("/api/settings", {"gig_lock": True})
        self.assertEqual(status, 200)
        before = self.library.db.read_bytes()
        with _open_fails("disk I/O error"):
            code, body = self.request(
                "/api/crate",
                {"action": "create", "space": library.LIBRARY_SPACE, "name": "New", "parent": 1},
            )
        self.assertEqual(code, 409, body)
        self.assertIn("disk I/O error", body["error"])
        self.assertTrue(body["serato"]["open"])
        self.assertEqual(self.library.db.read_bytes(), before)

    def test_crate_expanded_is_not_queued(self) -> None:
        """Expanded writes immediately while Gig Lock is on and Serato is closed."""
        status, _saved = self.request("/api/settings", {"gig_lock": True})
        self.assertEqual(status, 200)
        status, body = self.request(
            "/api/crate",
            {"action": "expanded", "id": 1, "expanded": False, "space": library.LIBRARY_SPACE},
        )
        self.assertEqual(status, 200, body)
        self.assertNotEqual(body.get("queued"), True)

    def test_apply_refuses_while_locked(self) -> None:
        """Apply is 409 until Gig Lock is off."""
        self.request("/api/settings", {"gig_lock": True})
        self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        status, body = self.request("/api/write-queue", {"action": "apply", "confirm": True})
        self.assertEqual(status, 409, body)
        self.assertEqual(body["error"], write_queue.QUEUE_LOCKED)
        self.assertEqual(body["code"], "queue_locked")

    def test_apply_without_confirm_is_preview(self) -> None:
        """Apply without confirm true does not write."""
        self.request("/api/settings", {"gig_lock": True})
        self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        before = self.library.db.read_bytes()
        self.request("/api/settings", {"gig_lock": False})
        status, body = self.request("/api/write-queue", {"action": "apply"})
        self.assertEqual(status, 200, body)
        self.assertTrue(body["preview"])
        self.assertEqual(len(body["pending"]), 1)
        self.assertEqual(self.library.db.read_bytes(), before)
        self.assertNotIn("Peak", _names())

    def test_apply_after_lock_off_creates_the_crate(self) -> None:
        """Confirm apply after Gig Lock off writes through crate_action."""
        self.request("/api/settings", {"gig_lock": True})
        self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        self.request("/api/settings", {"gig_lock": False})
        status, body = self.request("/api/write-queue", {"action": "apply", "confirm": True})
        self.assertEqual(status, 200, body)
        self.assertEqual(len(body["applied"]), 1)
        self.assertIn("Peak", _names())
        status, listing = self.request("/api/write-queue")
        self.assertEqual(len(listing["pending"]), 0)
        self.assertEqual(len(listing["undo"]), 1)

    def test_conflict_keeps_both_as_named_layer(self) -> None:
        """Serato's crate stays; crateCraft's version is a named sibling."""
        status, created = self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Warmup", "parent": 1},
        )
        self.assertEqual(status, 200, created)
        crate_id = int(created["id"])
        self.request("/api/settings", {"gig_lock": True})
        status, queued = self.request(
            "/api/crate",
            {
                "action": "rename",
                "id": crate_id,
                "name": "Peak",
                "space": library.LIBRARY_SPACE,
            },
        )
        self.assertTrue(queued["queued"])
        library.crate_action(
            {"action": "rename", "id": crate_id, "name": "SeratoNight", "space": library.LIBRARY_SPACE}
        )
        self.request("/api/settings", {"gig_lock": False})
        status, body = self.request("/api/write-queue", {"action": "apply", "confirm": True})
        self.assertEqual(status, 200, body)
        self.assertEqual(len(body["layers"]), 1)
        self.assertTrue(body["layers"][0].startswith("from crateCraft,"))
        names = _names()
        self.assertIn("SeratoNight", names)
        self.assertNotIn("Peak", names)
        self.assertTrue(any(name.startswith("from crateCraft,") for name in names))
        live = next(row for row in _crate_rows() if row[0] == crate_id)
        self.assertEqual(live[1], "SeratoNight")

    def test_undo_skips_when_serato_changed_it_since(self) -> None:
        """Undo of one item does not clobber a later Serato edit."""
        self.request("/api/settings", {"gig_lock": True})
        self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        self.request("/api/settings", {"gig_lock": False})
        status, applied = self.request("/api/write-queue", {"action": "apply", "confirm": True})
        self.assertEqual(status, 200, applied)
        crate_id = next(cid for cid, name, _parent in _crate_rows() if name == "Peak")
        library.crate_action(
            {"action": "rename", "id": crate_id, "name": "Later", "space": library.LIBRARY_SPACE}
        )
        undo_id = applied["undo"][0]["id"]
        status, body = self.request(
            "/api/write-queue", {"action": "undo", "id": undo_id, "confirm": True}
        )
        self.assertEqual(status, 200, body)
        self.assertEqual(body["skipped"][0]["skipped"], write_queue.SKIPPED_CHANGED)
        self.assertIn("Later", _names())
        self.assertNotIn("Peak", _names())

    def test_undo_create_deletes_when_fingerprint_matches(self) -> None:
        """Undo of a create removes that crate when Serato left it alone."""
        self.request("/api/settings", {"gig_lock": True})
        self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        self.request("/api/settings", {"gig_lock": False})
        status, applied = self.request("/api/write-queue", {"action": "apply", "confirm": True})
        self.assertIn("Peak", _names())
        undo_id = applied["undo"][0]["id"]
        status, body = self.request(
            "/api/write-queue", {"action": "undo", "id": undo_id, "confirm": True}
        )
        self.assertEqual(status, 200, body)
        self.assertEqual(body.get("undone"), undo_id)
        self.assertNotIn("Peak", _names())

    def test_thirty_day_undo_expires(self) -> None:
        """Undo records older than 30 days drop from the list."""
        self.request("/api/settings", {"gig_lock": True})
        self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        self.request("/api/settings", {"gig_lock": False})
        self.request("/api/write-queue", {"action": "apply", "confirm": True})
        store = json.loads((app_config.config_dir() / write_queue.STORE_NAME).read_text(encoding="utf-8"))
        key = str(Path(library.MASTER).resolve())
        store[key]["undo"][0]["applied_at"] = time.time() - (write_queue.UNDO_DAYS + 1) * 86400
        (app_config.config_dir() / write_queue.STORE_NAME).write_text(
            json.dumps(store), encoding="utf-8"
        )
        status, listing = self.request("/api/write-queue")
        self.assertEqual(status, 200)
        self.assertEqual(listing["undo"], [])

    def test_drop_removes_pending(self) -> None:
        """Drop by id removes that queued write."""
        self.request("/api/settings", {"gig_lock": True})
        status, queued = self.request(
            "/api/crate",
            {"action": "create", "space": library.LIBRARY_SPACE, "name": "Peak", "parent": 1},
        )
        status, body = self.request("/api/write-queue", {"action": "drop", "id": queued["id"]})
        self.assertEqual(status, 200, body)
        self.assertEqual(body["pending"], [])

    def test_track_save_is_queued(self) -> None:
        """Track field writes queue while Gig Lock is on."""
        before = self.library.db.read_bytes()
        self.request("/api/settings", {"gig_lock": True})
        status, body = self.request("/api/track", {"id": 1, "fields": {"name": "Renamed"}})
        self.assertEqual(status, 200, body)
        self.assertTrue(body["queued"])
        self.assertEqual(self.library.db.read_bytes(), before)
