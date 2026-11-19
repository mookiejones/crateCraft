"""Background write jobs: start, poll, cancel, undo (#436)."""

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
import jobs
import library
import server
import snapshots
from tests.fixture import TempLibrary
from tests.test_tag_cleanup import _tracks


class JobsHttpTests(unittest.TestCase):
    """Start tag spelling and restore jobs over HTTP."""

    def setUp(self) -> None:
        """Start a fixture library, config dir, and HTTP server."""
        self._dir = tempfile.TemporaryDirectory()
        config = Path(self._dir.name) / "config"
        config.mkdir()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: str(config)})
        self._env.start()
        jobs.reset()
        self.library = TempLibrary()
        self.library.__enter__()
        _tracks(self.library.db, [("Hip Hop", "A"), ("Hip-Hop", "A")])
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.httpd.server_address[:2]
        self.base = f"http://{host}:{port}"

    def tearDown(self) -> None:
        """Stop workers and the server."""
        jobs.reset()
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

    def wait_job(self, job_id: str, timeout: float = 15) -> dict:
        """Poll until the job is terminal.

        Args:
            job_id: Job id.
            timeout: Seconds to wait.

        Returns:
            The terminal job body.

        Raises:
            AssertionError: The job did not finish.
        """
        deadline = time.time() + timeout
        body: dict = {}
        while time.time() < deadline:
            status, body = self.request(f"/api/jobs?id={job_id}")
            if status == 200 and body.get("state") in jobs.TERMINAL:
                return body
            time.sleep(0.05)
        self.fail(f"job {job_id} did not finish: {body!r}")

    def start_tag(self) -> dict:
        """POST a Hip Hop spelling apply."""
        status, body = self.request(
            "/api/jobs",
            {
                "kind": "tag_spelling",
                "space": library.LIBRARY_SPACE,
                "field": "genre",
                "value": "Hip Hop",
            },
        )
        self.assertEqual(status, 200, body)
        self.assertIn("id", body)
        return body

    def genres(self) -> list[str | None]:
        """Genre column in id order."""
        conn = library.read_conn()
        try:
            rows = conn.execute("SELECT genre FROM asset ORDER BY id").fetchall()
            return [row[0] for row in rows]
        finally:
            conn.close()

    def test_list_starts_empty(self) -> None:
        """GET /api/jobs with no writes is an empty list."""
        status, body = self.request("/api/jobs")
        self.assertEqual(status, 200, body)
        self.assertEqual(body, {"jobs": []})

    def test_tag_spelling_succeeds_and_polls(self) -> None:
        """Apply rewrites Hip-Hop, then GET ?id= is success with a snapshot."""
        started = self.start_tag()
        done = self.wait_job(started["id"])
        self.assertEqual(done["state"], "success")
        self.assertEqual(done["kind"], "tag_spelling")
        self.assertIsInstance(done["snapshot_id"], str)
        self.assertTrue(done["snapshot_id"])
        self.assertIs(done["cancelable"], False)
        self.assertEqual(self.genres(), ["Hip Hop", "Hip Hop"])
        status, listing = self.request("/api/jobs")
        self.assertEqual(status, 200)
        self.assertEqual(listing["jobs"][0]["id"], done["id"])

    def test_unknown_id_is_404(self) -> None:
        """GET a missing id is 404 with the job_unknown sentence."""
        status, body = self.request("/api/jobs?id=missing")
        self.assertEqual(status, 404, body)
        self.assertEqual(body["error"], jobs.UNKNOWN_JOB)
        self.assertEqual(body["code"], "job_unknown")

    def test_bad_kind_is_400(self) -> None:
        """Unknown kind is 400."""
        status, body = self.request("/api/jobs", {"kind": "nope"})
        self.assertEqual(status, 400, body)
        self.assertEqual(body["error"], jobs.BAD_REQUEST)

    def test_unknown_action_is_404(self) -> None:
        """Unknown POST action is 404."""
        status, body = self.request("/api/jobs", {"action": "explode"})
        self.assertEqual(status, 404, body)
        self.assertEqual(body["error"], jobs.UNKNOWN_ACTION)

    def test_cancel_missing_is_400(self) -> None:
        """Cancel without a known id is 400."""
        status, body = self.request("/api/jobs", {"action": "cancel", "id": "missing"})
        self.assertEqual(status, 400, body)
        self.assertEqual(body["error"], jobs.UNKNOWN_JOB)

    def test_cancel_before_apply_leaves_library(self) -> None:
        """Cancel at start rolls nothing and finishes cancelled."""
        before = self.genres()
        jobs.hold_for_test("start")
        started = self.start_tag()
        status, _ = self.request("/api/jobs", {"action": "cancel", "id": started["id"]})
        self.assertEqual(status, 200)
        jobs.release_hold()
        done = self.wait_job(started["id"])
        self.assertEqual(done["state"], "cancelled")
        self.assertEqual(self.genres(), before)

    def test_cancel_during_progress_rolls_back(self) -> None:
        """Cancel after the first row is assigned puts the library back."""
        before = self.genres()
        jobs.hold_for_test("progress")
        started = self.start_tag()
        deadline = time.time() + 10
        progressed = False
        while time.time() < deadline:
            status, body = self.request(f"/api/jobs?id={started['id']}")
            if status == 200 and int(body.get("done") or 0) >= 1:
                progressed = True
                break
            time.sleep(0.05)
        self.assertTrue(progressed, "worker never reported progress")
        status, _ = self.request("/api/jobs", {"action": "cancel", "id": started["id"]})
        self.assertEqual(status, 200)
        jobs.release_hold()
        done = self.wait_job(started["id"])
        self.assertEqual(done["state"], "cancelled")
        self.assertEqual(self.genres(), before)

    def test_undo_restores_snapshot(self) -> None:
        """Undo puts the before-write snapshot back."""
        before = self.genres()
        started = self.start_tag()
        done = self.wait_job(started["id"])
        self.assertEqual(done["state"], "success")
        self.assertNotEqual(self.genres(), before)
        status, _result = self.request("/api/jobs", {"action": "undo", "id": done["id"]})
        self.assertEqual(status, 200, _result)
        self.assertEqual(self.genres(), before)

    def test_undo_without_snapshot_is_400(self) -> None:
        """A job with no snapshot cannot be undone."""
        jobs.hold_for_test("start")
        started = self.start_tag()
        status, _ = self.request("/api/jobs", {"action": "cancel", "id": started["id"]})
        self.assertEqual(status, 200)
        jobs.release_hold()
        done = self.wait_job(started["id"])
        status, body = self.request("/api/jobs", {"action": "undo", "id": done["id"]})
        self.assertEqual(status, 400, body)
        self.assertEqual(body["error"], jobs.CANNOT_UNDO)
        self.assertEqual(body["code"], "job_cannot_undo")

    def test_restore_needs_confirm(self) -> None:
        """Restore without confirm true is 400."""
        info = snapshots.current_store().take("manual", "test snapshot")
        status, body = self.request(
            "/api/jobs",
            {"kind": "snapshot_restore", "id": info["id"]},
        )
        self.assertEqual(status, 400, body)
        self.assertEqual(body["error"], jobs.CONFIRM_RESTORE)
        self.assertEqual(body["code"], "job_restore_confirm")

    def test_restore_job_succeeds(self) -> None:
        """Confirm restore runs as a job and finishes."""
        info = snapshots.current_store().take("manual", "test snapshot")
        status, started = self.request(
            "/api/jobs",
            {"kind": "snapshot_restore", "id": info["id"], "confirm": True},
        )
        self.assertEqual(status, 200, started)
        done = self.wait_job(started["id"])
        self.assertIn(done["state"], ("success", "partial"))
        self.assertEqual(done["kind"], "snapshot_restore")

    def test_gig_lock_queues_tag_spelling(self) -> None:
        """Gig Lock on queues a tag apply and does not rewrite rows."""
        before = self.genres()
        status, settings = self.request("/api/settings", {"gig_lock": True})
        self.assertEqual(status, 200)
        self.assertIs(settings["gig_lock"], True)
        status, body = self.request(
            "/api/jobs",
            {
                "kind": "tag_spelling",
                "space": library.LIBRARY_SPACE,
                "field": "genre",
                "value": "Hip Hop",
            },
        )
        self.assertEqual(status, 200, body)
        self.assertTrue(body["queued"])
        self.assertEqual(self.genres(), before)
