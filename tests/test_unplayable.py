"""Live unplayable reasons. Nothing is cached and nothing is written.

Fixtures are temporary databases and invented paths. The live Serato
library is never opened. Streaming audio is not downloaded.
"""

from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

import gig_check
import gig_snapshots
import library
import server
import unplayable
import volumes
from tests.fixture import TempLibrary

NOW = datetime(2026, 11, 26, 12, 0, tzinfo=timezone.utc)


class FakeMounts(volumes.Mounts):
    """Mount cache whose present roots are chosen by the test."""

    def __init__(self, present: set[str]) -> None:
        """Remember the roots that count as plugged in.

        Args:
            present: Volume roots or names that ``mounted`` returns true for.
        """
        super().__init__()
        self.present = set(present)

    def mounted(self, volume: volumes.Volume) -> bool:
        """Return whether this test plugged the drive in.

        Args:
            volume: Drive the path names.

        Returns:
            True when the root or the name is in ``present``.
        """
        root = volume.root.rstrip("\\/")
        return volume.root in self.present or volume.name in self.present or root in self.present


def _unplugged_path() -> tuple[str, str]:
    """Return a stored path on a drive this machine does not have.

    Returns:
        The path and the drive name. Windows uses ``Z:``. Other systems
        use a ``/Volumes`` name.
    """
    if sys.platform == "win32":
        return r"Z:\Music\cut.mp3", "Z:"
    return "/Volumes/OFFLINE367/Music/cut.mp3", "OFFLINE367"


def _replace(db: Path, rows: list[tuple[int, str, str, int | None]]) -> None:
    """Replace fixture tracks.

    Args:
        db: Temporary master.sqlite.
        rows: ``(id, name, portable_id, third_party_type)``.
    """
    with closing(sqlite3.connect(db)) as conn:
        conn.execute("DELETE FROM space_asset")
        conn.execute("DELETE FROM asset")
        for asset_id, name, stored, party in rows:
            file_name = Path(stored).name if stored else ""
            conn.execute(
                "INSERT INTO asset (id, name, artist, file_name, portable_id, third_party_type, is_missing) "
                "VALUES (?, ?, 'Artist', ?, ?, ?, 0)",
                (asset_id, name, file_name, stored, party),
            )
            conn.execute(
                "INSERT INTO space_asset (id, asset_id, space_id) VALUES (?, ?, 1)",
                (asset_id, asset_id),
            )
        conn.commit()


class ReasonTests(unittest.TestCase):
    """Each live reason, including a drive that comes back."""

    def test_streaming_marker_matches_gig_check(self) -> None:
        """Apple Music is type 6 in both modules."""
        self.assertEqual(unplayable.STREAMING_THIRD_PARTY, gig_check.APPLE_MUSIC_THIRD_PARTY)

    def test_each_reason_and_a_present_file_has_none(self) -> None:
        """Streaming, no path, missing, unknown, and a file that opens."""
        opened: list[str] = []

        def opener(path: Path) -> str:
            opened.append(path.name)
            if path.name == "blocked.mp3":
                return "unknown"
            if path.name == "here.mp3":
                return "ok"
            return "missing"

        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            blocked = root / "blocked.mp3"
            here = root / "here.mp3"
            odd = root / "odd.mp3"
            blocked.write_bytes(b"x")
            here.write_bytes(b"y")
            odd.write_bytes(b"z")
            streaming = unplayable.unplayable_reason(
                "streaming/apple-1", "", 6, roots=(), opener=opener
            )
            itunes = unplayable.unplayable_reason(
                str(root / "purchased.mp3"), "", 1, roots=(), opener=opener
            )
            no_path = unplayable.unplayable_reason("", "  ", None, roots=(), opener=opener)
            missing = unplayable.unplayable_reason(str(root / "gone.mp3"), "", None, roots=(), opener=opener)
            unknown = unplayable.unplayable_reason(str(blocked), "", None, roots=(), opener=opener)
            present = unplayable.unplayable_reason(str(here), "", None, roots=(), opener=opener)
            unexpected = unplayable.unplayable_reason(
                str(odd), "", None, roots=(), opener=lambda _path: "nope"
            )
        self.assertEqual(streaming.reason, unplayable.STREAMING)
        self.assertEqual(itunes.reason, unplayable.FILE_MISSING)
        self.assertEqual(no_path.reason, unplayable.NO_PATH)
        self.assertEqual(missing.reason, unplayable.FILE_MISSING)
        self.assertEqual(unknown.reason, unplayable.UNKNOWN)
        self.assertIsNone(unknown.availability)
        self.assertIsNone(present.reason)
        self.assertEqual(unexpected.reason, unplayable.UNKNOWN)
        self.assertNotIn("apple-1", opened)
        self.assertEqual(opened.count("here.mp3"), 1)

    def test_no_path_and_streaming_and_offline_do_not_open(self) -> None:
        """Those three reasons return before the opener."""
        opened: list[Path] = []

        def opener(path: Path) -> str:
            opened.append(path)
            return "ok"

        letter = r"Z:\Music\a.mp3"
        offline = unplayable.unplayable_reason(
            letter, "", None, mounts=FakeMounts(set()), roots=(), opener=opener
        )
        unplayable.unplayable_reason("", "", None, roots=(), opener=opener)
        unplayable.unplayable_reason("stream.mp3", "", 6, roots=(), opener=opener)
        self.assertEqual(offline.reason, unplayable.DRIVE_OFFLINE)
        self.assertEqual(offline.drive, "Z:")
        self.assertEqual(opened, [])

    def test_unplug_then_plug_back_does_not_repeat_drive_offline(self) -> None:
        """A second call sees the drive and reports a missing file."""
        letter = r"Z:\Music\a.mp3"
        mounts = FakeMounts(set())
        first = unplayable.unplayable_reason(letter, "", None, mounts=mounts, roots=())
        mounts.present.add("Z:")
        second = unplayable.unplayable_reason(letter, "", None, mounts=mounts, roots=())
        self.assertEqual(first.reason, unplayable.DRIVE_OFFLINE)
        self.assertEqual(second.reason, unplayable.FILE_MISSING)
        self.assertNotEqual(second.reason, unplayable.DRIVE_OFFLINE)

    def test_macos_volume_and_windows_letter(self) -> None:
        """A letter path is a drive on every OS. A /Volumes path follows this OS."""
        letter = unplayable.unplayable_reason(
            r"Z:\Music\win.mp3", "", None, mounts=FakeMounts(set()), roots=()
        )
        self.assertEqual(letter.reason, unplayable.DRIVE_OFFLINE)
        mac = "/Volumes/GIGDRIVE/Music/a.mp3"
        volume = volumes.external_volume(mac)
        if volume is None:
            gone = unplayable.unplayable_reason(mac, "", None, mounts=FakeMounts(set()), roots=())
            self.assertEqual(gone.reason, unplayable.FILE_MISSING)
            return
        unplugged = unplayable.unplayable_reason(mac, "", None, mounts=FakeMounts(set()), roots=())
        plugged = unplayable.unplayable_reason(
            mac, "", None, mounts=FakeMounts({volume.root}), roots=()
        )
        self.assertEqual(unplugged.reason, unplayable.DRIVE_OFFLINE)
        self.assertEqual(unplugged.drive, volume.name)
        self.assertEqual(plugged.reason, unplayable.FILE_MISSING)
        self.assertNotEqual(plugged.reason, unplayable.DRIVE_OFFLINE)

    def test_location_without_a_portable_path_is_unknown(self) -> None:
        """A location URI with no stored path is not no-path and not missing."""
        outcome = unplayable.unplayable_reason("", "file:///tmp/lib.sqlite", None, roots=())
        self.assertEqual(outcome.reason, unplayable.UNKNOWN)

    def test_open_state_on_a_temp_file_and_a_missing_file(self) -> None:
        """The default opener tells ok from missing and does not write."""
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            here = root / "here.mp3"
            here.write_bytes(b"audio")
            before = here.read_bytes()
            self.assertEqual(unplayable.open_state(here), "ok")
            self.assertEqual(here.read_bytes(), before)
            self.assertEqual(unplayable.open_state(root / "gone.mp3"), "missing")

    def test_cloud_placeholder_is_not_opened_or_called_file_missing(self) -> None:
        """A dataless file stays cloud-only."""
        with tempfile.TemporaryDirectory() as name:
            path = Path(name) / "cloud.mp3"
            path.write_bytes(b"placeholder")
            opened: list[str] = []

            def opener(candidate: Path) -> str:
                opened.append(candidate.name)
                return "missing"

            def probe(candidate: Path) -> cloud_probe:
                if candidate.name == "cloud.mp3":
                    return _dataless()
                return real_probe(candidate)

            real_probe = __import__("cloud_files").probe_path
            with mock.patch("cloud_files.probe_path", probe):
                outcome = unplayable.unplayable_reason(str(path), "", None, roots=(), opener=opener)
            self.assertIsNone(outcome.reason)
            self.assertIsNotNone(outcome.availability)
            assert outcome.availability is not None
            self.assertEqual(outcome.availability.status, "cloud")
            self.assertEqual(opened, [])


def _dataless() -> object:
    """Return a darwin dataless probe."""
    import cloud_files

    return cloud_files.Probe(
        "file",
        "darwin",
        flags_known=True,
        dataless=True,
    )


# The annotation above names the return before the helper is easier to read
# as a local import. Alias the type for the probe patch.
import cloud_files as _cloud_files

cloud_probe = _cloud_files.Probe


class LibraryAndGigTests(unittest.TestCase):
    """The crate payload and the gig check use the same words."""

    def test_empty_library(self) -> None:
        """No tracks means no unplayable rows."""
        with TempLibrary() as temp:
            _replace(temp.db, [])
            server.invalidate()
            payload = server.load_library(library.LIBRARY_SPACE)
            self.assertEqual(payload["tracks"], [])
            report = gig_check.run_gig_check(
                temp.db, snapshots_reader=gig_snapshots.NoSnapshots(), now=NOW
            )
            self.assertEqual(report.missing_files, ())
            self.assertEqual(report.unavailable_drives, ())
            self.assertEqual(report.streaming_tracks, ())
            self.assertEqual(report.no_path_tracks, ())
            self.assertEqual(report.unchecked_tracks, ())

    def test_gig_rows_use_the_same_words_and_streaming_is_not_missing(self) -> None:
        """Each bucket keeps its own reason. The database bytes do not change."""
        unplugged, drive = _unplugged_path()
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            here = root / "here.mp3"
            here.write_bytes(b"audio")
            gone = root / "gone.mp3"
            _replace(
                temp.db,
                [
                    (1, "Stream", "streaming/apple-1", 6),
                    (2, "Gone", str(gone), None),
                    (3, "USB", unplugged, None),
                    (4, "Blank", "", None),
                    (5, "Here", str(here), 1),
                ],
            )
            before = temp.db.read_bytes()
            report = gig_check.run_gig_check(
                temp.db, snapshots_reader=gig_snapshots.NoSnapshots(), now=NOW
            )
            self.assertEqual(temp.db.read_bytes(), before)
            self.assertEqual([item.reason for item in report.streaming_tracks], ["streaming"])
            self.assertEqual([item.title for item in report.streaming_tracks], ["Stream"])
            self.assertNotIn("Stream", [item.title for item in report.missing_files])
            self.assertEqual([item.reason for item in report.missing_files], ["file missing"])
            self.assertIn("Gone", [item.title for item in report.missing_files])
            self.assertEqual([item.name for item in report.unavailable_drives], [drive])
            self.assertEqual(report.unavailable_drives[0].reason, "drive offline")
            self.assertEqual([item.reason for item in report.no_path_tracks], ["no path"])
            self.assertNotIn("Blank", [item.title for item in report.missing_files])
            self.assertEqual(report.local_count, 1)
            text = gig_check.format_report(report)
            self.assertIn("file missing", text)
            self.assertIn("drive offline", text)
            self.assertIn("streaming", text)
            self.assertIn("no path", text)
            payload = gig_check.report_to_dict(report)
            self.assertEqual(payload["missing_files"][0]["reason"], "file missing")
            self.assertEqual(payload["no_path_tracks"][0]["reason"], "no path")

    def test_library_cache_does_not_keep_drive_offline(self) -> None:
        """A second load with the drive mounted drops the old offline reason."""
        unplugged, drive = _unplugged_path()
        state = {"on": False}

        def mounted(self: volumes.Mounts, volume: volumes.Volume) -> bool:
            if volume.name == drive:
                return state["on"]
            return True

        with TempLibrary() as temp:
            _replace(temp.db, [(1, "USB", unplugged, None)])
            server.invalidate()
            before = temp.db.read_bytes()
            with mock.patch.object(volumes.Mounts, "mounted", mounted):
                state["on"] = False
                first = server.load_library(library.LIBRARY_SPACE)
                state["on"] = True
                second = server.load_library(library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)
            self.assertEqual(first["tracks"][0]["unplayable_reason"], "drive offline")
            self.assertEqual(second["tracks"][0]["unplayable_reason"], "file missing")
            self.assertNotIn("_portable_id", second["tracks"][0])
            self.assertNotIn("unplayable_reason", server._load_library(library.LIBRARY_SPACE)["tracks"][0])

    def test_permission_is_unknown_on_the_gig_report_and_not_missing(self) -> None:
        """A check that cannot run is unchecked, not a missing file."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            blocked = Path(raw) / "blocked.mp3"
            blocked.write_bytes(b"secret")
            _replace(temp.db, [(1, "Blocked", str(blocked), None)])

            def opener(path: Path) -> str:
                if path.name == "blocked.mp3":
                    return "unknown"
                return unplayable.open_state(path)

            with mock.patch.object(unplayable, "open_state", opener):
                report = gig_check.run_gig_check(
                    temp.db, snapshots_reader=gig_snapshots.NoSnapshots(), now=NOW
                )
            self.assertEqual(report.missing_files, ())
            self.assertEqual([item.reason for item in report.unchecked_tracks], ["unknown"])
            self.assertIn("unknown", gig_check.format_report(report))
            codes = {line.code for line in report.holding_it_back}
            self.assertIn("unplayable_unknown", codes)
            self.assertNotIn("missing_files", codes)
