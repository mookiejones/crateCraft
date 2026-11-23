"""Read-only schema probe for a Serato master.sqlite.

The cases build a temporary database. They do not open a live Serato
library. The probe copies the file and must leave the original bytes,
mtime, and directory listing unchanged.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import serato_schema

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "serato5-probe.py"


def _sha256(path: Path) -> str:
    """Hash a file.

    Args:
        path: File to read.

    Returns:
        The SHA-256 hex digest.
    """
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


class ProbeTests(unittest.TestCase):
    def test_script_leaves_the_original_unchanged(self) -> None:
        """Copy a fixture database and print its schema.

        The original file's mtime and bytes stay the same. No ``-wal`` or
        ``-shm`` appears beside it. The command opens the copy, not the
        original path.

        Returns:
            None. The test fails if the original changes or if sqlite is
            pointed at that path.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            db = root / "my library.sqlite"
            conn = sqlite3.connect(db)
            try:
                conn.execute("CREATE TABLE asset (id INTEGER PRIMARY KEY, name TEXT)")
                conn.execute("PRAGMA user_version = 203")
                conn.commit()
                conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            finally:
                conn.close()
            for sidecar in (Path(str(db) + "-wal"), Path(str(db) + "-shm")):
                sidecar.unlink(missing_ok=True)
            before = _sha256(db)
            mtime = db.stat().st_mtime_ns
            listing = sorted(path.name for path in root.iterdir())
            opened: list[str] = []
            real_connect = sqlite3.connect

            def wrapped(target: str, *args: object, **kwargs: object) -> sqlite3.Connection:
                opened.append(str(target))
                return real_connect(target, *args, **kwargs)

            with mock.patch("serato_schema.sqlite3.connect", wrapped):
                report = serato_schema.probe_database(db)
            self.assertEqual(report["file"], "my library.sqlite")
            self.assertEqual(report["user_version"], 203)
            self.assertIn("CREATE TABLE asset", str(report["schema"]))
            self.assertTrue(opened)
            original = db.resolve().as_posix()
            for target in opened:
                self.assertNotIn(original, target)
            self.assertEqual(_sha256(db), before)
            self.assertEqual(db.stat().st_mtime_ns, mtime)
            self.assertEqual(sorted(path.name for path in root.iterdir()), listing)
            completed = subprocess.run(
                [sys.executable, str(SCRIPT), str(db)],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            payload = json.loads(completed.stdout)
            self.assertEqual(payload["user_version"], 203)
            self.assertIn("CREATE TABLE asset", payload["schema"])
            self.assertNotIn(str(root), payload["file"])
            self.assertEqual(_sha256(db), before)
            self.assertEqual(db.stat().st_mtime_ns, mtime)
            self.assertEqual(sorted(path.name for path in root.iterdir()), listing)

    def test_symlink_and_junk_are_refused(self) -> None:
        """Refuse a symlink and a file that is not a database.

        Neither call creates a sidecar beside the path.

        Returns:
            None. The test fails if a symlink is opened or a junk file
            exits 0.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            db = root / "master.sqlite"
            conn = sqlite3.connect(db)
            try:
                conn.execute("CREATE TABLE note (id INTEGER)")
                conn.commit()
            finally:
                conn.close()
            link = root / "linked.sqlite"
            link.symlink_to(db)
            with self.assertRaises(serato_schema.ProbeError):
                serato_schema.probe_database(link)
            junk = root / "notes.txt"
            junk.write_bytes(b"hello")
            completed = subprocess.run(
                [sys.executable, str(SCRIPT), str(junk)],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(completed.returncode, 2)
            self.assertEqual(completed.stdout, "")
            self.assertFalse((root / "notes.txt-shm").exists())
            self.assertFalse((root / "linked.sqlite-shm").exists())
