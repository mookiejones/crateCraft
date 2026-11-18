"""Write guards: outside-change check, write manifest, truncation (#369).

The cases use ``tests.fixture``. They do not open a live Serato library.
"""

from __future__ import annotations

import os
import sqlite3
import unittest
from contextlib import closing
from unittest import mock

import error_codes
import library
import snapshots
from tests.fixture import TempLibrary


def _bump_mtime(path) -> None:
    """Move a file's mtime forward so a size+mtime fingerprint changes.

    Args:
        path: Regular file to touch.
    """
    stat = path.stat()
    os.utime(path, ns=(stat.st_atime_ns, stat.st_mtime_ns + 1_000_000_000))


class LoadFingerprintTests(unittest.TestCase):
    """Refuse a write when Serato files changed after the page loaded them."""

    def test_write_refuses_when_the_library_changed_after_load(self) -> None:
        """A file hashed at load that later changes on disk is 409.

        Returns:
            None. The test fails if crate_action writes anyway.
        """
        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                snapshots.remember_load()
                _bump_mtime(temp.db)
                with self.assertRaises(library.LibraryError) as caught:
                    library.crate_action({"action": "create", "name": "Warmup"})
            self.assertEqual(caught.exception.status, 409)
            self.assertEqual(
                error_codes.code_for(caught.exception.message),
                "library_changed",
            )
            with closing(sqlite3.connect(temp.db)) as conn:
                names = [row[0] for row in conn.execute("SELECT name FROM container")]
            self.assertNotIn("Warmup", names)

    def test_write_without_a_load_still_runs(self) -> None:
        """CLI and existing tests that never loaded keep writing.

        Returns:
            None. The test fails if a missing load fingerprint blocks the write.
        """
        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                created = library.crate_action({"action": "create", "name": "Warmup"})
            self.assertEqual(created["name"], "Warmup")
            with closing(sqlite3.connect(temp.db)) as conn:
                names = [row[0] for row in conn.execute("SELECT name FROM container")]
            self.assertIn("Warmup", names)

    def test_force_writes_after_an_outside_change(self) -> None:
        """Confirming the 409 writes anyway.

        Returns:
            None. The test fails if force still raises library_changed.
        """
        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                snapshots.remember_load()
                _bump_mtime(temp.db)
                created = library.crate_action(
                    {"action": "create", "name": "Warmup", "force": True}
                )
            self.assertEqual(created["name"], "Warmup")

    def test_own_write_does_not_block_the_next_edit(self) -> None:
        """After a verified write, the next crate edit is not an outside change.

        Returns:
            None. The test fails if the second create raises library_changed.
        """
        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                snapshots.remember_load()
                first = library.crate_action({"action": "create", "name": "Warmup"})
                second = library.crate_action({"action": "create", "name": "Closer"})
            self.assertEqual(first["name"], "Warmup")
            self.assertEqual(second["name"], "Closer")

    def test_library_load_remembers_the_fingerprint(self) -> None:
        """GET /api/library stores the load fingerprint for a later write.

        Returns:
            None. The test fails if load_library does not remember the files.
        """
        import server

        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                server.load_library()
                _bump_mtime(temp.db)
                with self.assertRaises(library.LibraryError) as caught:
                    library.crate_action({"action": "create", "name": "Warmup"})
            self.assertEqual(caught.exception.status, 409)
            self.assertEqual(
                error_codes.code_for(caught.exception.message),
                "library_changed",
            )


class WriteManifestTests(unittest.TestCase):
    """Every write returns the files it changed and stores them on the snapshot."""

    def test_write_returns_touched_files_and_stores_them_on_the_snapshot(self) -> None:
        """A crate create lists master.sqlite and records it on the before-write snapshot.

        Returns:
            None. The test fails if touched is missing from the result or snapshot.
        """
        with TempLibrary():
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                created = library.crate_action({"action": "create", "name": "Warmup"})
            self.assertIn("master.sqlite", created["touched"])
            before = [
                row
                for row in snapshots.current_store().list_snapshots()
                if row["trigger"] == "before-write"
            ]
            self.assertTrue(before)
            self.assertIn("master.sqlite", before[0]["touched"])


class TruncationTests(unittest.TestCase):
    """Truncation is a real error, including under python -O."""

    def test_parse_chunks_reports_a_truncated_header(self) -> None:
        """Seven bytes of an otrk header is truncated-header.

        Returns:
            None. The test fails if parse_chunks is missing or silent.
        """
        records, error = snapshots.parse_chunks(b"otrk\x00\x00\x00")
        self.assertEqual(error, "truncated-header")
        self.assertEqual(records, [])

    def test_parse_chunks_reports_a_truncated_body(self) -> None:
        """A header that claims more bytes than remain is truncated-body.

        Returns:
            None. The test fails if the body cut is reported as a header cut.
        """
        records, error = snapshots.parse_chunks(b"otrk" + (8).to_bytes(4, "big") + b"xxxx")
        self.assertEqual(error, "truncated-body")
        self.assertEqual(records, [])

    def test_parse_chunks_keeps_complete_rows_before_the_cut(self) -> None:
        """A finished vrsn record stays when the next header is cut off.

        Returns:
            None. The test fails if the complete row is dropped.
        """
        data = b"vrsn" + (4).to_bytes(4, "big") + b"abcd" + b"otrk\x00\x00\x00"
        records, error = snapshots.parse_chunks(data)
        self.assertEqual(error, "truncated-header")
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0][0], "vrsn")
        self.assertEqual(records[0][1], b"abcd")

    def test_markers2_issue_code_names_a_truncated_entry(self) -> None:
        """A CUE entry that claims more bytes than remain is markers2_truncated.

        Returns:
            None. The test fails if markers2_issue_code is missing or silent.
        """
        import base64

        import tags

        decoded = b"CUE\x00" + (20).to_bytes(4, "big") + b"xx"
        payload = b"\x01\x01" + base64.b64encode(decoded)
        self.assertEqual(tags.markers2_issue_code(payload), "markers2_truncated")

    def test_beatgrid_truncated_fires_under_optimize(self) -> None:
        """beatgrid_truncated is a returned code, not an assert, under python -O.

        Returns:
            None. The test fails if -O strips the check.
        """
        import subprocess
        import sys

        from tests.fixture import ROOT

        env = os.environ.copy()
        env["PYTHONPATH"] = str(ROOT)
        payload = bytes([1, 0, 0, 0, 0, 2])
        script = (
            "import tags\n"
            f"code = tags.beatgrid_issue_code({payload!r})\n"
            "assert code == 'beatgrid_truncated', code\n"
        )
        result = subprocess.run(
            [sys.executable, "-O", "-c", script],
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_half_written_crate_on_the_crate_side(self) -> None:
        """A cut-off .crate file that the database has not heard of is reported.

        A database crate with no export file is not reported. That is the
        normal Serato 4/5 state until Serato writes the crate file.

        Returns:
            None. The test fails if the crate-side file is ignored.
        """
        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                library.crate_action({"action": "create", "name": "Warmup"})
            serato = temp.db.parent / "_Serato_"
            subcrates = serato / "Subcrates"
            subcrates.mkdir(parents=True)
            (subcrates / "Ghost.crate").write_bytes(b"otrk\x00\x00\x00")
            reports = snapshots.half_written_crates(temp.db, serato)
            names = [row["name"] for row in reports]
            self.assertIn("Ghost.crate", names)
            ghost = next(row for row in reports if row["name"] == "Ghost.crate")
            self.assertEqual(ghost["issue"], "truncated-header")
            self.assertNotIn("Warmup.crate", names)
