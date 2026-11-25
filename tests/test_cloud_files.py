"""Cloud-only file detection. No test opens a placeholder or writes a library.

Probes are built in memory for macOS and Windows bits. The files this
process stats are synthetic and live in a temporary directory.
"""

from __future__ import annotations

import hashlib
import json
import plistlib
import sqlite3
import tempfile
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import cloud_files
import gig_check
import server
from tests.fixture import TempLibrary, open_database
from tests.test_gig_check import NOW, _add_crate, _add_track, _digest, _names, _write_db


def _probe(**kwargs: object) -> cloud_files.Probe:
    """Build a probe. Omitted bits stay clear.

    Args:
        **kwargs: Probe fields.

    Returns:
        A frozen probe. ``kind`` and ``platform`` are required.
    """
    kind = str(kwargs.pop("kind"))
    platform = str(kwargs.pop("platform"))
    return cloud_files.Probe(kind, platform, **kwargs)  # type: ignore[arg-type]


class ClassifyTests(unittest.TestCase):
    """Placeholder, downloaded, missing, and unknown stay distinct."""

    def test_dataless_downloaded_missing_and_unknown(self) -> None:
        """macOS and Windows bits pick the status without treating other as local.

        Returns:
            None. The test fails if a placeholder is local, a hydrated
            Dropbox file is cloud, or an unsupported provider is local.
        """
        dataless = _probe(kind="file", platform="darwin", flags_known=True, dataless=True)
        self.assertEqual(cloud_files.classify(dataless, "icloud").status, "cloud")
        self.assertEqual(cloud_files.classify(dataless, "icloud").reason, "dataless")
        downloaded = _probe(kind="file", platform="darwin", flags_known=True, dataless=False)
        self.assertEqual(cloud_files.classify(downloaded, "dropbox").status, "local")
        self.assertEqual(cloud_files.classify(downloaded, "dropbox").reason, "present")
        missing = _probe(kind="missing", platform="darwin", flags_known=True)
        self.assertEqual(cloud_files.classify(missing, "icloud").status, "missing")
        self.assertNotEqual(cloud_files.classify(missing, "icloud").status, "cloud")
        other = _probe(kind="file", platform="darwin", flags_known=True, dataless=False)
        unknown = cloud_files.classify(other, "other")
        self.assertEqual(unknown.status, "unknown")
        self.assertEqual(unknown.reason, "unsupported_provider")
        self.assertNotEqual(unknown.status, "local")
        self.assertEqual(cloud_files.classify(dataless, "other").status, "cloud")

    def test_windows_recall_is_cloud_and_a_clear_mask_is_local(self) -> None:
        """Recall bits are cloud-only. A hydrated OneDrive file is local.

        Returns:
            None. The test fails if recall is local or a clear mask is cloud.
        """
        known, recall, on_open, offline = cloud_files.windows_attribute_bits(
            cloud_files.FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS
        )
        self.assertEqual((known, recall, on_open, offline), (True, True, False, False))
        recalled = _probe(
            kind="file",
            platform="win32",
            attributes_known=True,
            recall_on_data_access=True,
        )
        self.assertEqual(cloud_files.classify(recalled, "onedrive").status, "cloud")
        self.assertEqual(cloud_files.classify(recalled, "onedrive").reason, "recall")
        hydrated = _probe(kind="file", platform="win32", attributes_known=True)
        self.assertEqual(cloud_files.classify(hydrated, "onedrive").status, "local")
        self.assertEqual(cloud_files.classify(hydrated, "other").status, "unknown")
        self.assertEqual(cloud_files.windows_attribute_bits(None), (False, False, False, False))
        offline_only = _probe(kind="file", platform="win32", attributes_known=True, offline=True)
        self.assertEqual(cloud_files.classify(offline_only, "").status, "unknown")
        self.assertEqual(cloud_files.classify(offline_only, "dropbox").status, "cloud")

    def test_linux_cloud_root_is_unknown_and_an_ordinary_file_is_local(self) -> None:
        """A Dropbox path on Linux is not verified local. A normal file is.

        Returns:
            None. The test fails if the Dropbox file is local.
        """
        present = _probe(kind="file", platform="linux")
        self.assertEqual(cloud_files.classify(present, "dropbox").status, "unknown")
        self.assertEqual(cloud_files.classify(present, "dropbox").reason, "unverified_cloud")
        self.assertEqual(cloud_files.classify(present, "").status, "local")
        stub = _probe(kind="file", platform="linux", icloud_stub=True, flags_known=True)
        self.assertEqual(cloud_files.classify(stub, "icloud").status, "cloud")
        self.assertEqual(cloud_files.classify(stub, "icloud").reason, "icloud_stub")

    def test_unreadable_and_directory_are_unknown(self) -> None:
        """A stat that fails, or a directory, is not a local audio file.

        Returns:
            None. The test fails if either status is local or missing.
        """
        for kind in ("unreadable", "not_file"):
            result = cloud_files.classify(_probe(kind=kind, platform="linux"), "")
            self.assertEqual(result.status, "unknown")
            self.assertNotEqual(result.status, "local")
            self.assertNotEqual(result.status, "missing")


class ProbeTests(unittest.TestCase):
    """Stat and the iCloud stub name. The file bytes stay put."""

    def test_stat_does_not_open_a_real_file(self) -> None:
        """``probe_path`` leaves the bytes alone and does not call ``Path.open``.

        Returns:
            None. The test fails if the file is opened or the bytes change.
        """
        with tempfile.TemporaryDirectory() as name:
            path = Path(name) / "song.mp3"
            payload = b"synthetic-audio-not-a-real-track"
            path.write_bytes(payload)
            opened: list[str] = []
            real_open = Path.open

            def guard(self: Path, *args: object, **kwargs: object) -> object:
                opened.append(self.name)
                return real_open(self, *args, **kwargs)

            with mock.patch.object(Path, "open", guard):
                probe = cloud_files.probe_path(path)
            self.assertEqual(opened, [])
            self.assertEqual(path.read_bytes(), payload)
            self.assertEqual(probe.kind, "file")
            self.assertFalse(probe.dataless)
            self.assertEqual(cloud_files.classify(probe, "").status, "local")

    def test_icloud_stub_is_cloud_and_the_stub_is_not_read(self) -> None:
        """A missing file with a ``.icloud`` sibling is cloud-only.

        Returns:
            None. The test fails if the status is missing or the stub bytes change.
        """
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            song = root / "song.mp3"
            stub = root / ".song.mp3.icloud"
            stub.write_bytes(b"placeholder-not-audio")
            before = stub.read_bytes()
            probe = cloud_files.probe_path(song)
            self.assertTrue(probe.icloud_stub)
            self.assertEqual(cloud_files.classify(probe, "icloud").status, "cloud")
            self.assertEqual(stub.read_bytes(), before)
            self.assertFalse(song.exists())

    def test_missing_file_without_a_stub_is_missing(self) -> None:
        """No file and no stub is missing, not cloud.

        Returns:
            None. The test fails if the status is cloud or unknown.
        """
        with tempfile.TemporaryDirectory() as name:
            song = Path(name) / "gone.mp3"
            probe = cloud_files.probe_path(song)
            self.assertEqual(probe.kind, "missing")
            self.assertEqual(cloud_files.classify(probe, "").status, "missing")


class RootTests(unittest.TestCase):
    """Cloud folders are discovered from names, not from file contents."""

    def test_known_folders_and_dropbox_info(self) -> None:
        """iCloud, Dropbox, OneDrive, and another CloudStorage folder are named.

        Returns:
            None. The test fails if a folder is missing or Google Drive is
            called Dropbox.
        """
        with tempfile.TemporaryDirectory() as name:
            home = Path(name)
            icloud = home / "Library" / "Mobile Documents" / "com~apple~CloudDocs"
            icloud.mkdir(parents=True)
            (home / "Dropbox").mkdir()
            storage = home / "Library" / "CloudStorage"
            (storage / "OneDrive-Personal").mkdir(parents=True)
            (storage / "GoogleDrive-person").mkdir()
            custom = home / "CustomDrop"
            custom.mkdir()
            info = home / ".dropbox" / "info.json"
            info.parent.mkdir()
            info.write_text(
                json.dumps({"personal": {"path": str(custom)}}),
                encoding="utf-8",
            )
            roots = cloud_files.discover_roots(home=home, environ={}, platform="darwin")
            by_provider: dict[str, set[str]] = {}
            for root in roots:
                by_provider.setdefault(root.provider, set()).add(Path(root.path).name)
            self.assertIn("com~apple~CloudDocs", by_provider["icloud"])
            self.assertIn("Dropbox", by_provider["dropbox"])
            self.assertIn("CustomDrop", by_provider["dropbox"])
            self.assertIn("OneDrive-Personal", by_provider["onedrive"])
            self.assertEqual(by_provider["other"], {"GoogleDrive-person"})

    def test_provider_for_does_not_match_a_longer_name(self) -> None:
        """``Dropbox`` does not contain ``Dropbox-extra``. Windows case folds.

        Returns:
            None. The test fails if the extra folder is called Dropbox.
        """
        roots = (cloud_files.CloudRoot("dropbox", r"C:\Users\A\Dropbox"),)
        self.assertEqual(
            cloud_files.provider_for(r"C:\Users\A\Dropbox\a.mp3", roots, casefold=True),
            "dropbox",
        )
        self.assertEqual(
            cloud_files.provider_for(r"c:\users\a\dropbox-extra\a.mp3", roots, casefold=True),
            "",
        )

    def test_windows_onedrive_env(self) -> None:
        """``OneDrive`` in the environment is a root when that folder exists.

        Returns:
            None. The test fails if the folder is not onedrive.
        """
        with tempfile.TemporaryDirectory() as name:
            folder = Path(name) / "OneDrive"
            folder.mkdir()
            roots = cloud_files.discover_roots(
                home=Path(name) / "empty-home",
                environ={"OneDrive": str(folder)},
                platform="win32",
            )
            self.assertEqual([root.provider for root in roots], ["onedrive"])


class OptimizeTests(unittest.TestCase):
    """Optimize Mac Storage is claimed only from the on value."""

    def test_true_and_one_are_on_and_other_values_are_not_claimed(self) -> None:
        """Boolean true and integer 1 are on. False, zero, and junk are not.

        Returns:
            None. The test fails if a false plist is reported as on.
        """
        def blob(value: object) -> bytes:
            return plistlib.dumps({"optimize-storage": value})

        self.assertIs(cloud_files.optimize_from_plist_bytes(blob(True)), True)
        self.assertIs(cloud_files.optimize_from_plist_bytes(blob(1)), True)
        self.assertIsNone(cloud_files.optimize_from_plist_bytes(blob(False)))
        self.assertIsNone(cloud_files.optimize_from_plist_bytes(blob(0)))
        self.assertIsNone(cloud_files.optimize_from_plist_bytes(blob("1")))
        self.assertIsNone(cloud_files.optimize_from_plist_bytes(b"not a plist"))
        self.assertIsNone(cloud_files.optimize_from_plist_bytes(None))

    def test_non_mac_does_not_read_a_plist(self) -> None:
        """Linux and Windows do not claim the switch is on.

        Returns:
            None. The test fails if a non-mac platform returns True.
        """
        with tempfile.TemporaryDirectory() as name:
            path = Path(name) / "com.apple.bird.plist"
            path.write_bytes(plistlib.dumps({"optimize-storage": True}))
            self.assertIsNone(cloud_files.optimize_mac_storage_enabled(path, platform="linux"))
            self.assertIs(cloud_files.optimize_mac_storage_enabled(path, platform="darwin"), True)

    def test_location_sentence_names_optimize_only_when_detected(self) -> None:
        """An iCloud library warning names the switch only when it was read as on.

        A Dropbox warning never names it. The audio path is not created.

        Returns:
            None. The test fails if Optimize Mac Storage is named without a true flag.
        """
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            icloud = root / "iCloud"
            icloud.mkdir()
            roots = (cloud_files.CloudRoot("icloud", str(icloud)),)
            quiet = cloud_files.locations_for(
                [str(icloud / "Library")],
                [str(icloud / "Music" / "a.mp3")],
                roots,
                optimize=None,
                casefold=False,
            )
            self.assertEqual({item.role for item in quiet}, {"library", "music"})
            self.assertTrue(all(item.optimize_storage is None for item in quiet))
            for item in quiet:
                self.assertNotIn("Optimize Mac Storage", cloud_files.location_summary(item))
            claimed = cloud_files.locations_for(
                [str(icloud / "Library")],
                [],
                roots,
                optimize=True,
                casefold=False,
            )
            self.assertIs(claimed[0].optimize_storage, True)
            self.assertIn("Optimize Mac Storage is on", cloud_files.location_summary(claimed[0]))
            drop = root / "Dropbox"
            drop.mkdir()
            drop_rows = cloud_files.locations_for(
                [str(drop / "Library")],
                [],
                (cloud_files.CloudRoot("dropbox", str(drop)),),
                optimize=True,
                casefold=False,
            )
            self.assertIsNone(drop_rows[0].optimize_storage)
            self.assertNotIn("Optimize Mac Storage", cloud_files.location_summary(drop_rows[0]))


def _file_probe(kind: str, **kwargs: object) -> cloud_files.Probe:
    """A linux file probe unless the caller sets the platform.

    Args:
        kind: Probe kind.
        **kwargs: Other probe fields.

    Returns:
        A probe.
    """
    platform = str(kwargs.pop("platform", "linux"))
    return _probe(kind=kind, platform=platform, **kwargs)


class GigCloudTests(unittest.TestCase):
    """The gig check separates cloud-only files from missing files."""

    def test_cloud_unknown_and_missing_and_nothing_is_opened_or_written(self) -> None:
        """A dataless file, an unverified cloud file, and a missing file stay apart.

        The dataless file and the unverified file are not opened. The database
        bytes do not change. Optimize Mac Storage is not named.

        Returns:
            None. The test fails if a cloud file is missing, opened, or downloaded.
        """
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            drop = root / "Dropbox"
            drop.mkdir()
            cloud_path = drop / "cloud.mp3"
            cloud_path.write_bytes(b"cloud-bytes")
            unknown_path = drop / "maybe.mp3"
            unknown_path.write_bytes(b"unknown-bytes")
            local_path = root / "here.mp3"
            local_path.write_bytes(b"local-bytes")
            gone = root / "gone.mp3"
            cloud_hash = hashlib.sha256(cloud_path.read_bytes()).hexdigest()
            unknown_hash = hashlib.sha256(unknown_path.read_bytes()).hexdigest()

            def fake_probe(path: Path) -> cloud_files.Probe:
                if path.name == "cloud.mp3":
                    return _file_probe("file", platform="darwin", flags_known=True, dataless=True)
                if path.name == "maybe.mp3":
                    return _file_probe("file", platform="linux")
                if path.name == "here.mp3":
                    return _file_probe("file", platform="linux")
                if path.name == "gone.mp3":
                    return _file_probe("missing", platform="linux")
                return cloud_files.probe_path(path)

            opened: list[str] = []
            real_open = gig_check._opens_for_read

            def wrapped(path: Path) -> bool:
                opened.append(Path(path).name)
                return real_open(path)

            def setup(conn: sqlite3.Connection) -> None:
                _add_track(conn, 2, str(cloud_path), title="Clouded")
                _add_track(conn, 3, str(unknown_path), title="Maybe")
                _add_track(conn, 4, str(local_path), title="Here")
                _add_track(conn, 5, str(gone), title="Gone")

            library_dir = root / "library"
            library_dir.mkdir()
            database = _write_db(library_dir, setup)
            before = _digest(database)
            names_before = _names(database.parent)
            with (
                mock.patch.object(cloud_files, "probe_path", fake_probe),
                mock.patch.object(cloud_files, "discover_roots", lambda *args, **kwargs: (cloud_files.CloudRoot("dropbox", str(drop)),)),
                mock.patch.object(cloud_files, "optimize_mac_storage_enabled", lambda *args, **kwargs: None),
                mock.patch.object(gig_check, "_opens_for_read", wrapped),
            ):
                report = gig_check.run_gig_check(database, now=NOW)
            self.assertEqual(_digest(database), before)
            self.assertEqual(_names(database.parent), names_before)
            self.assertEqual(hashlib.sha256(cloud_path.read_bytes()).hexdigest(), cloud_hash)
            self.assertEqual(hashlib.sha256(unknown_path.read_bytes()).hexdigest(), unknown_hash)
            self.assertNotIn("cloud.mp3", opened)
            self.assertNotIn("maybe.mp3", opened)
            self.assertIn("here.mp3", opened)
            self.assertTrue(report.hard_red)
            self.assertFalse(report.ready)
            self.assertEqual([item.title for item in report.cloud_tracks], ["Clouded"])
            self.assertEqual(report.cloud_tracks[0].reason, "dataless")
            self.assertEqual([item.title for item in report.unknown_tracks], ["Maybe"])
            self.assertEqual(report.unknown_tracks[0].reason, "unverified_cloud")
            self.assertEqual([item.title for item in report.missing_files], ["Gone"])
            self.assertEqual(report.local_count, 1)
            codes = {line.code for line in report.holding_it_back}
            self.assertIn("cloud_only", codes)
            self.assertIn("cloud_unknown", codes)
            self.assertIn("cloud_music", codes)
            self.assertNotIn("cloud_library", codes)
            summary = " ".join(line.summary for line in report.holding_it_back)
            self.assertIn(gig_check.CLOUD_GUIDANCE, summary)
            self.assertNotIn("Optimize Mac Storage", summary)
            self.assertIn(str(cloud_path), gig_check.format_report(report))
            payload = gig_check.report_to_dict(report)
            self.assertEqual(payload["counts"]["cloud"], 1)
            self.assertEqual(payload["counts"]["unknown"], 1)
            self.assertEqual(payload["counts"]["missing"], 1)
            self.assertEqual(payload["counts"]["local"], 1)
            self.assertIsNone(payload["cloud_locations"][0]["optimize_storage"])

    def test_library_in_icloud_is_a_hard_stop_and_names_optimize_only_when_on(self) -> None:
        """A Serato folder inside iCloud is not ready. The switch is named only when on.

        Returns:
            None. The test fails if the quiet plist claims Optimize Mac Storage.
        """
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            icloud = root / "iCloud"
            library_dir = icloud / "Serato" / "Library"
            library_dir.mkdir(parents=True)
            track = root / "plain.mp3"
            track.write_bytes(b"local")

            def setup(conn: sqlite3.Connection) -> None:
                _add_track(conn, 2, str(track), title="Plain")

            database = _write_db(library_dir, setup)
            roots = (cloud_files.CloudRoot("icloud", str(icloud)),)

            def run(optimize: bool | None) -> gig_check.GigReport:
                with (
                    mock.patch.object(cloud_files, "discover_roots", lambda *args, **kwargs: roots),
                    mock.patch.object(cloud_files, "optimize_mac_storage_enabled", lambda *args, **kwargs: optimize),
                ):
                    return gig_check.run_gig_check(database, now=NOW)

            quiet = run(None)
            self.assertTrue(quiet.hard_red)
            self.assertFalse(quiet.ready)
            self.assertIn("cloud_library", {line.code for line in quiet.holding_it_back})
            text = " ".join(line.summary for line in quiet.holding_it_back)
            self.assertNotIn("Optimize Mac Storage", text)
            claimed = run(True)
            claimed_text = " ".join(line.summary for line in claimed.holding_it_back)
            self.assertIn("Optimize Mac Storage is on", claimed_text)
            self.assertIs(claimed.cloud_locations[0].optimize_storage, True)

    def test_score_cloud_is_hard_red_and_unknown_is_not(self) -> None:
        """One cloud file is not ready. An unknown file still can be.

        Returns:
            None. The test fails if unknown sets hard_red or cloud does not.
        """
        cloud = gig_check._Classified(
            missing=(),
            drives=(),
            streaming=(),
            empty=(),
            present_paths={},
            cloud=(
                cloud_files.CloudTrack("/Music/a.mp3", "A", "B", "Crate", "icloud", "cloud", "dataless"),
            ),
        )
        _score, ready, hard, lines = gig_check._score(cloud, True, None, "Crate")
        self.assertTrue(hard)
        self.assertFalse(ready)
        self.assertEqual(lines[0].code, "cloud_only")
        self.assertIn("in the selected crate", lines[0].summary)
        unknown = gig_check._Classified(
            missing=(),
            drives=(),
            streaming=(),
            empty=(),
            present_paths={},
            unknown=(
                cloud_files.CloudTrack("/Music/b.mp3", "A", "B", "Crate", "dropbox", "unknown", "unverified_cloud"),
            ),
        )
        _score, ready, hard, lines = gig_check._score(unknown, True, None, None)
        self.assertFalse(hard)
        self.assertTrue(ready)
        self.assertEqual(lines[0].code, "cloud_unknown")
        self.assertIn("not counted as on this computer", lines[0].summary)


class CloudFilesApiTests(unittest.TestCase):
    """GET /api/cloud-files is read-only."""

    def test_get_returns_counts_and_does_not_write(self) -> None:
        """The route returns the four statuses and leaves the database bytes unchanged.

        Returns:
            None. The test fails if the hash changes or a count is missing.
        """
        library_fixture = TempLibrary()
        library_fixture.__enter__()
        try:
            track = library_fixture.root / "song.mp3"
            track.write_bytes(b"song")
            with open_database(library_fixture.db) as conn:
                _add_crate(conn, 5, "Friday")
                _add_track(conn, 10, str(track), title="Song", crate_id=5)
                _add_track(conn, 11, str(library_fixture.root / "other.mp3"), title="Other")
            before = _digest(library_fixture.db)
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            host, port = httpd.server_address
            try:
                with urllib.request.urlopen(
                    f"http://{host}:{port}/api/cloud-files?crate=5"
                ) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                    status = response.status
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join(timeout=5)
            self.assertEqual(status, 200)
            self.assertEqual(payload["counts"]["local"], 1)
            self.assertEqual(payload["counts"]["cloud"], 0)
            self.assertEqual(payload["counts"]["missing"], 0)
            self.assertEqual(payload["scope"]["crate_id"], 5)
            self.assertEqual(payload["scope"]["crate_name"], "Friday")
            self.assertEqual(_digest(library_fixture.db), before)
        finally:
            library_fixture.__exit__(None, None, None)
