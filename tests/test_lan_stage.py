"""Staged LAN copy of selected crates (#467).

The listener is loopback. Nothing is written into the fixture library
until accept is confirmed. A public address is refused before a socket
to that host is opened.
"""

from __future__ import annotations

import hashlib
import os
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock

import error_codes
import lan_stage
import library
import tonight_crates
import write_queue
from library import LibraryError, SeratoOpen
import tests.test_server as server_tests
from tests.fixture import TempLibrary, open_database


def _touch(path: Path, body: bytes) -> None:
    """Write a small file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)


def _point(temp: TempLibrary, asset_id: int, path: Path) -> None:
    """Point one fixture track at a file."""
    with open_database(temp.db) as conn:
        conn.execute(
            "UPDATE asset SET portable_id = ?, file_name = ?, is_missing = 0 WHERE id = ?",
            (str(path), path.name, asset_id),
        )


def _db_hash(path: Path) -> str:
    """SHA-256 of the database file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _offline_path() -> str:
    """Return a stored path on a drive this computer does not have mounted."""
    if sys.platform == "win32":
        import string

        for letter in reversed(string.ascii_uppercase):
            if letter in {"A", "B", "C"}:
                continue
            root = Path(f"{letter}:\\")
            try:
                present = root.exists()
            except OSError:
                present = False
            if not present:
                return f"{letter}:\\CrateCraftMissing\\song.mp3"
        return "Z:\\CrateCraftMissing\\song.mp3"
    return "/Volumes/CrateCraftMissing/song.mp3"


class AddressTests(unittest.TestCase):
    """Local addresses are allowed. Public addresses are not."""

    def test_private_loopback_and_link_local_are_allowed(self) -> None:
        """Allow LAN and loopback, including an IPv4 address mapped in IPv6.

        Returns:
            None. The test fails if a public or unspecified address is allowed.
        """
        allowed = [
            "127.0.0.1",
            "::1",
            "10.1.2.3",
            "192.168.0.4",
            "172.16.0.1",
            "169.254.1.1",
            "::ffff:192.168.1.5",
            "fe80::1",
            "fd00::1",
        ]
        refused = [
            "8.8.8.8",
            "172.32.0.1",
            "0.0.0.0",
            "255.255.255.255",
            "::ffff:8.8.8.8",
            "2001:db8::1",
            "not-an-ip",
        ]
        for ip in allowed:
            with self.subTest(ip=ip):
                self.assertTrue(lan_stage.peer_allowed(ip))
        for ip in refused:
            with self.subTest(ip=ip):
                self.assertFalse(lan_stage.peer_allowed(ip))

    def test_windows_and_posix_names_stay_one_segment(self) -> None:
        """Keep the file name from either separator and refuse escapes.

        Returns:
            None. The test fails if a ``..`` or ``_Serato_`` name is kept.
        """
        self.assertEqual(lan_stage.file_name_of(r"C:\Music\Night.mp3"), "Night.mp3")
        self.assertEqual(lan_stage.file_name_of("/Volumes/Stick/Night.mp3"), "Night.mp3")
        self.assertEqual(lan_stage.safe_file_name("Night.mp3"), "Night.mp3")
        self.assertIsNone(lan_stage.safe_file_name(r"..\master.sqlite"))
        self.assertIsNone(lan_stage.safe_file_name("../master.sqlite"))
        self.assertIsNone(lan_stage.safe_file_name("_Serato_"))
        self.assertIsNone(lan_stage.safe_file_name("a/b.mp3"))
        self.assertIsNone(lan_stage.safe_file_name(""))

    def test_hello_rejects_a_mirror_flag(self) -> None:
        """A listener that claims it will mirror is not a staged copy.

        Returns:
            None.
        """
        good = {"product": "crateCraft", "role": "stage", "auto_mirror": False, "version": 1}
        self.assertTrue(lan_stage.hello_acceptable(good))
        self.assertFalse(lan_stage.hello_acceptable({**good, "auto_mirror": True}))
        self.assertFalse(lan_stage.hello_acceptable({**good, "role": "library"}))


class StagePlanTests(unittest.TestCase):
    """Preview counts files and lists skips. It does not listen."""

    def setUp(self) -> None:
        """Point settings at a temporary folder and stop any leftover listener."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()
        lan_stage.stop()

    def tearDown(self) -> None:
        """Stop the listener and remove the temporary settings folder."""
        lan_stage.stop()
        self._env.stop()
        self._config.cleanup()

    def test_status_does_not_start_listening(self) -> None:
        """Reading status leaves the listener off and auto-mirror off.

        Returns:
            None. The test fails if a thread named for the listener appears.
        """
        before = {thread.name for thread in threading.enumerate()}
        body = lan_stage.status()
        after = {thread.name for thread in threading.enumerate()}
        self.assertFalse(body["listening"])
        self.assertFalse(body["auto_mirror"])
        self.assertNotIn("crateCraft-lan-stage", after - before)
        self.assertEqual(lan_stage.GENERATED_FOLDER, tonight_crates.GENERATED_FOLDER)

    def test_preview_counts_size_and_lists_skips(self) -> None:
        """Count one shared file once, and list a missing file and an unplugged drive.

        The plan does not branch on Serato 4 or Serato 5. A shortcut is
        not followed. Nothing is listened for.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            good = temp.root / "tunes" / "keep.mp3"
            _touch(good, b"keep-bytes")
            _point(temp, 1, good)
            missing = temp.root / "tunes" / "gone.mp3"
            _point(temp, 2, missing)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                first = library.crate_action(
                    {"action": "create", "name": "Peak time", "assets": [1, 2], "space": library.LIBRARY_SPACE}
                )
                library.crate_action(
                    {"action": "color", "id": first["id"], "color": 16711680, "space": library.LIBRARY_SPACE}
                )
                second = library.crate_action(
                    {"action": "create", "name": "Peak again", "assets": [1], "space": library.LIBRARY_SPACE}
                )
            offline = _offline_path()
            with open_database(temp.db) as conn:
                conn.execute(
                    """
                    INSERT INTO asset (id, name, artist, file_name, portable_id, is_missing, location_id)
                    VALUES (3, 'Away', 'Artist', 'song.mp3', ?, 0, 1)
                    """,
                    (offline,),
                )
                conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (3, 1)")
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                third = library.crate_action(
                    {"action": "create", "name": "Road", "assets": [3], "space": library.LIBRARY_SPACE}
                )
            link = temp.root / "tunes" / "link.mp3"
            try:
                link.symlink_to(good)
            except OSError:
                link = None
            if link is not None:
                with open_database(temp.db) as conn:
                    conn.execute(
                        """
                        INSERT INTO asset (id, name, artist, file_name, portable_id, is_missing, location_id)
                        VALUES (4, 'Link', 'Artist', 'link.mp3', ?, 0, 1)
                        """,
                        (str(link),),
                    )
                    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (4, 1)")
                with mock.patch("snapshots.serato_dj_running", return_value=False):
                    linked = library.crate_action(
                        {"action": "create", "name": "Linked", "assets": [4], "space": library.LIBRARY_SPACE}
                    )
            report = lan_stage.preview(
                library.LIBRARY_SPACE,
                [int(first["id"]), int(second["id"]), int(third["id"])],
            )
            self.assertFalse(report["auto_mirror"])
            self.assertTrue(report["preview"])
            self.assertFalse(report["written"])
            self.assertFalse(report["library_written"])
            self.assertEqual(report["file_count"], 1)
            self.assertEqual(report["byte_count"], len(b"keep-bytes"))
            codes = {item["reason_code"] for item in report["skipped"]}
            self.assertIn("missing", codes)
            self.assertIn("offline", codes)
            colors = {item["name"]: item["color"] for item in report["crates"]}
            self.assertEqual(colors["Peak time"], 16711680)
            self.assertFalse(lan_stage.status()["listening"])
            if link is not None:
                linked_report = lan_stage.preview(library.LIBRARY_SPACE, [int(linked["id"])])
                self.assertEqual(linked_report["file_count"], 0)
                self.assertIn("shortcut", {item["reason_code"] for item in linked_report["skipped"]})
                self.assertFalse((lan_stage.stage_root()).exists())

    def test_missing_library_does_not_listen(self) -> None:
        """A missing master file is an error and does not start a listener.

        Returns:
            None.
        """
        missing = Path(self._config.name) / "no-library" / "master.sqlite"
        with mock.patch.object(library, "MASTER", str(missing)):
            with self.assertRaises(LibraryError):
                lan_stage.preview(library.LIBRARY_SPACE, [1])
        self.assertFalse(lan_stage.status()["listening"])

    def test_stage_root_inside_the_library_or_serato_is_refused(self) -> None:
        """Refuse a stage folder in the library directory or ``_Serato_``.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with self.assertRaisesRegex(LibraryError, lan_stage.STAGE_LIBRARY):
                lan_stage.assert_stage_root(temp.root)
            serato = Path(self._config.name) / "_Serato_" / "stage"
            with self.assertRaisesRegex(LibraryError, lan_stage.STAGE_SERATO):
                lan_stage.assert_stage_root(serato)

    def test_public_host_does_not_connect(self) -> None:
        """Refuse a public address before opening a connection.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            good = temp.root / "tunes" / "keep.mp3"
            _touch(good, b"keep-bytes")
            _point(temp, 1, good)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                created = library.crate_action(
                    {"action": "create", "name": "Peak time", "assets": [1], "space": library.LIBRARY_SPACE}
                )
            report = lan_stage.preview(library.LIBRARY_SPACE, [int(created["id"])])
            with mock.patch("lan_stage.socket.getaddrinfo", return_value=[(0, 0, 0, "", ("8.8.8.8", 0))]):
                with mock.patch("lan_stage.http.client.HTTPConnection") as conn:
                    with self.assertRaisesRegex(LibraryError, lan_stage.BAD_HOST):
                        lan_stage.send_copy(
                            "8.8.8.8",
                            8766,
                            "abcdef12",
                            library.LIBRARY_SPACE,
                            [int(created["id"])],
                            report["fingerprint"],
                            True,
                        )
            conn.assert_not_called()

    def test_send_without_confirm_does_not_connect(self) -> None:
        """A send that is not confirmed returns the preview and opens no socket.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            good = temp.root / "tunes" / "keep.mp3"
            _touch(good, b"keep-bytes")
            _point(temp, 1, good)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                created = library.crate_action(
                    {"action": "create", "name": "Peak time", "assets": [1], "space": library.LIBRARY_SPACE}
                )
            report = lan_stage.preview(library.LIBRARY_SPACE, [int(created["id"])])
            before = _db_hash(temp.db)
            with mock.patch("lan_stage.http.client.HTTPConnection") as conn:
                sent = lan_stage.action(
                    {
                        "action": "send",
                        "host": "127.0.0.1",
                        "port": 9,
                        "code": "nope",
                        "space": library.LIBRARY_SPACE,
                        "crates": [int(created["id"])],
                        "fingerprint": report["fingerprint"],
                        "confirm": False,
                    }
                )
            conn.assert_not_called()
            self.assertTrue(sent["preview"])
            self.assertFalse(sent["library_written"])
            self.assertFalse(sent["auto_mirror"])
            self.assertEqual(_db_hash(temp.db), before)


class TransferTests(unittest.TestCase):
    """Loopback send, accept, undo, and discard."""

    def setUp(self) -> None:
        """Use a temporary settings folder and stop any leftover listener."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()
        lan_stage.stop()

    def tearDown(self) -> None:
        """Stop the listener and remove the temporary settings folder."""
        lan_stage.stop()
        self._env.stop()
        self._config.cleanup()

    def _crate(self, temp: TempLibrary, name: str, body: bytes, asset_id: int = 1) -> int:
        """Point a track at ``body`` and put it in a new crate.

        Args:
            temp: Open fixture.
            name: Crate name.
            body: File bytes.
            asset_id: Fixture asset to retarget.

        Returns:
            The new crate id.
        """
        path = temp.root / "tunes" / f"{name}.mp3"
        _touch(path, body)
        _point(temp, asset_id, path)
        with mock.patch("snapshots.serato_dj_running", return_value=False):
            created = library.crate_action(
                {"action": "create", "name": name, "assets": [asset_id], "space": library.LIBRARY_SPACE}
            )
            library.crate_action(
                {"action": "color", "id": created["id"], "color": 255, "space": library.LIBRARY_SPACE}
            )
        return int(created["id"])

    def test_send_stages_files_and_leaves_the_library(self) -> None:
        """Copy the file into the stage folder and do not change the database.

        A wrong pairing code is the same refusal as a missing one. The
        stage server does not answer the library API.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            crate_id = self._crate(temp, "Peak time", b"staged-audio")
            report = lan_stage.preview(library.LIBRARY_SPACE, [crate_id])
            listening = lan_stage.listen(host="127.0.0.1", port=0)
            self.assertTrue(listening["listening"])
            self.assertFalse(listening["auto_mirror"])
            before = _db_hash(temp.db)
            import http.client

            conn = http.client.HTTPConnection("127.0.0.1", int(listening["port"]), timeout=5)
            conn.request("GET", "/api/library")
            refused = conn.getresponse()
            self.assertEqual(refused.status, 404)
            refused.read()
            conn.close()
            conn = http.client.HTTPConnection("127.0.0.1", int(listening["port"]), timeout=5)
            conn.request("GET", "/v1/hello", headers={lan_stage.CODE_HEADER: "00000000"})
            wrong = conn.getresponse()
            wrong_body = wrong.read()
            conn.close()
            conn = http.client.HTTPConnection("127.0.0.1", int(listening["port"]), timeout=5)
            conn.request("GET", "/v1/hello")
            missing = conn.getresponse()
            missing_body = missing.read()
            conn.close()
            self.assertEqual(wrong.status, 403)
            self.assertEqual(missing.status, 403)
            self.assertEqual(wrong_body, missing_body)
            self.assertIn(b"That pairing code is not valid.", wrong_body)
            with self.assertRaisesRegex(LibraryError, lan_stage.BAD_CODE):
                lan_stage.send_copy(
                    "127.0.0.1",
                    listening["port"],
                    "00000000",
                    library.LIBRARY_SPACE,
                    [crate_id],
                    report["fingerprint"],
                    True,
                )
            sent = lan_stage.send_copy(
                "127.0.0.1",
                listening["port"],
                listening["code"],
                library.LIBRARY_SPACE,
                [crate_id],
                report["fingerprint"],
                True,
            )
            self.assertTrue(sent["staged"])
            self.assertFalse(sent["library_written"])
            self.assertFalse(sent["auto_mirror"])
            self.assertEqual(sent["failed_count"], 0)
            self.assertEqual(sent["sent"], 1)
            self.assertEqual(_db_hash(temp.db), before)
            staged = lan_stage.stage_root() / str(sent["id"]) / "files" / "Peak time.mp3"
            self.assertEqual(staged.read_bytes(), b"staged-audio")
            self.assertTrue(lan_stage.stage_root().resolve().is_relative_to(Path(self._config.name).resolve()))
            self.assertFalse(any(part.casefold() == "_serato_" for part in staged.parts))
            manifest = lan_stage._load(str(sent["id"]))
            self.assertFalse(manifest["auto_mirror"])
            self.assertEqual(manifest["crates"][0]["color"], 255)

    def test_failed_file_is_listed_and_the_other_file_arrives(self) -> None:
        """One upload error is listed. The other file is still staged.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            first = self._crate(temp, "One", b"one-ok", 1)
            second_path = temp.root / "tunes" / "Two.mp3"
            _touch(second_path, b"two-ok")
            _point(temp, 2, second_path)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                second = library.crate_action(
                    {"action": "create", "name": "Two", "assets": [2], "space": library.LIBRARY_SPACE}
                )
            ids = [first, int(second["id"])]
            report = lan_stage.preview(library.LIBRARY_SPACE, ids)
            listening = lan_stage.listen(host="127.0.0.1", port=0)
            real = lan_stage._put_file

            def flaky(*args: object, **kwargs: object) -> dict[str, object]:
                if args[4] == 1:
                    raise OSError("disk")
                return real(*args, **kwargs)  # type: ignore[arg-type]

            with mock.patch("lan_stage._put_file", side_effect=flaky):
                sent = lan_stage.send_copy(
                    "127.0.0.1",
                    listening["port"],
                    listening["code"],
                    library.LIBRARY_SPACE,
                    ids,
                    report["fingerprint"],
                    True,
                )
            self.assertGreaterEqual(sent["failed_count"], 1)
            self.assertEqual(sent["sent"], 1)
            folder = lan_stage.stage_root() / str(sent["id"]) / "files"
            staged = list(folder.iterdir())
            self.assertEqual(len(staged), 1)
            review = lan_stage.review(sent["id"])
            self.assertGreaterEqual(review["failed_count"], 1)
            self.assertTrue(review["failed"])

    def test_stale_fingerprint_sends_nothing(self) -> None:
        """A fingerprint that is not the current preview opens no socket.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            crate_id = self._crate(temp, "Peak time", b"staged-audio")
            lan_stage.listen(host="127.0.0.1", port=0)
            with mock.patch("lan_stage.http.client.HTTPConnection") as conn:
                with self.assertRaisesRegex(LibraryError, lan_stage.FINGERPRINT):
                    lan_stage.send_copy(
                        "127.0.0.1",
                        1,
                        "abcdef12",
                        library.LIBRARY_SPACE,
                        [crate_id],
                        "0" * 64,
                        True,
                    )
            conn.assert_not_called()

    def test_accept_is_previewed_then_undoable(self) -> None:
        """Confirm writes the color through a snapshot. Undo puts it back.

        A file whose bytes no longer match is listed and is not added.
        Serato running refuses the write. A second accept is refused.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            crate_id = self._crate(temp, "Peak time", b"match-me")
            other = temp.root / "tunes" / "other.mp3"
            _touch(other, b"only-staged")
            with open_database(temp.db) as conn:
                conn.execute(
                    """
                    INSERT INTO asset (id, name, artist, file_name, portable_id, is_missing, location_id)
                    VALUES (3, 'New', 'Artist', 'other.mp3', ?, 0, 1)
                    """,
                    (str(other),),
                )
                conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (3, 1)")
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                extra = library.crate_action(
                    {"action": "create", "name": "Extra", "assets": [3], "space": library.LIBRARY_SPACE}
                )
            report = lan_stage.preview(library.LIBRARY_SPACE, [crate_id, int(extra["id"])])
            listening = lan_stage.listen(host="127.0.0.1", port=0)
            sent = lan_stage.send_copy(
                "127.0.0.1",
                listening["port"],
                listening["code"],
                library.LIBRARY_SPACE,
                [crate_id, int(extra["id"])],
                report["fingerprint"],
                True,
            )
            other.write_bytes(b"changed-after-stage")
            with open_database(temp.db) as conn:
                before_crates = conn.execute("SELECT COUNT(*) FROM container").fetchone()[0]
            preview = lan_stage.accept(str(sent["id"]), library.LIBRARY_SPACE, False)
            self.assertFalse(preview["written"])
            self.assertFalse(preview["library_written"])
            with open_database(temp.db) as conn:
                self.assertEqual(conn.execute("SELECT COUNT(*) FROM container").fetchone()[0], before_crates)
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                with self.assertRaises(SeratoOpen):
                    lan_stage.accept(str(sent["id"]), library.LIBRARY_SPACE, True)
            with open_database(temp.db) as conn:
                self.assertEqual(conn.execute("SELECT COUNT(*) FROM container").fetchone()[0], before_crates)
            self.assertEqual(lan_stage._load(str(sent["id"]))["status"], "staged")
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                written = lan_stage.accept(str(sent["id"]), library.LIBRARY_SPACE, True)
            self.assertTrue(written["library_written"])
            self.assertTrue(written["snapshot_id"])
            self.assertGreaterEqual(written["unmatched_count"], 1)
            self.assertGreaterEqual(written["matched"], 1)
            with open_database(temp.db) as conn:
                colors = {
                    library.display_name(str(row[0])): row[1]
                    for row in conn.execute("SELECT name, color FROM container").fetchall()
                }
            self.assertEqual(colors.get("Peak time"), 255)
            self.assertEqual(colors.get("From backup Mac"), None)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                with self.assertRaisesRegex(LibraryError, lan_stage.ALREADY):
                    lan_stage.accept(str(sent["id"]), library.LIBRARY_SPACE, True)
                lan_stage.commit_transfer(sent["id"])
                self.assertEqual(lan_stage._load(str(sent["id"]))["status"], "accepted")
                undone = lan_stage.undo(written["snapshot_id"], sent["id"], True)
            self.assertTrue(undone["undone"])
            with open_database(temp.db) as conn:
                names = [library.display_name(str(row[0])) for row in conn.execute("SELECT name FROM container")]
            self.assertNotIn("From backup Mac", names)

    def test_empty_crate_sends_the_name_and_color(self) -> None:
        """A crate with no files still stages its name and color.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                created = library.crate_action(
                    {"action": "create", "name": "Empty night", "space": library.LIBRARY_SPACE}
                )
                library.crate_action(
                    {"action": "color", "id": created["id"], "color": 65280, "space": library.LIBRARY_SPACE}
                )
            crate_id = int(created["id"])
            report = lan_stage.preview(library.LIBRARY_SPACE, [crate_id])
            self.assertEqual(report["file_count"], 0)
            listening = lan_stage.listen(host="127.0.0.1", port=0)
            sent = lan_stage.send_copy(
                "127.0.0.1",
                listening["port"],
                listening["code"],
                library.LIBRARY_SPACE,
                [crate_id],
                report["fingerprint"],
                True,
            )
            manifest = lan_stage._load(str(sent["id"]))
            self.assertEqual(manifest["crates"][0]["name"], "Empty night")
            self.assertEqual(manifest["crates"][0]["color"], 65280)
            self.assertEqual(manifest["files"], [])

    def test_escape_and_discard_stay_inside_the_stage_folder(self) -> None:
        """A ``..`` name is refused. Discard deletes only the staged directory.

        A shortcut whose name looks like an id is not removed, and the
        file it points at stays. Discard without confirm does not delete.

        Returns:
            None.
        """
        outside = Path(self._config.name) / "outside.txt"
        outside.write_text("keep", encoding="utf-8")
        with self.assertRaises(LibraryError):
            lan_stage.begin_transfer(
                {
                    "crates": [{"name": "Nope", "color": None, "rels": ["../outside.txt"]}],
                    "files": [
                        {
                            "rel": "../outside.txt",
                            "size": 4,
                            "sha256": "a" * 64,
                            "name": "x",
                            "artist": "y",
                        }
                    ],
                }
            )
        self.assertTrue(outside.is_file())
        root = lan_stage.stage_root()
        root.mkdir(parents=True)
        transfer = root / ("ab" * 8)
        transfer.mkdir()
        (transfer / "manifest.json").write_text(
            '{"id": "abababababababab", "status": "staged", "files": [], "crates": [{"name": "A"}], "auto_mirror": false}',
            encoding="utf-8",
        )
        preview = lan_stage.discard("abababababababab", False)
        self.assertFalse(preview["removed"])
        self.assertFalse(preview["library_written"])
        self.assertTrue(transfer.is_dir())
        removed = lan_stage.discard("abababababababab", True)
        self.assertTrue(removed["removed"])
        self.assertFalse(removed["library_written"])
        self.assertFalse(transfer.exists())
        self.assertTrue(outside.is_file())
        link = root / ("cd" * 8)
        try:
            link.symlink_to(outside)
        except OSError:
            return
        with self.assertRaises(LibraryError):
            lan_stage.discard("cd" * 8, True)
        self.assertTrue(outside.is_file())
        self.assertTrue(link.is_symlink())

    def test_listen_action_binds_and_stop_clears_it(self) -> None:
        """The page's listen action opens a port and stop closes it.

        Status after stop does not keep the pairing code. Nothing is mirrored.

        Returns:
            None.
        """
        body = lan_stage.action({"action": "listen"})
        self.assertTrue(body["listening"])
        self.assertTrue(body["code"])
        self.assertFalse(body["auto_mirror"])
        self.assertIn("crateCraft-lan-stage", {thread.name for thread in threading.enumerate()})
        stopped = lan_stage.action({"action": "stop"})
        self.assertFalse(stopped["listening"])
        self.assertEqual(stopped["code"], "")
        self.assertNotIn("crateCraft-lan-stage", {thread.name for thread in threading.enumerate()})

    def test_contained_path_cannot_climb_out_or_follow_a_shortcut(self) -> None:
        """A request name cannot leave the stage folder or follow a shortcut.

        Returns:
            None.
        """
        root = Path(self._config.name) / "stage"
        root.mkdir()
        outside = Path(self._config.name) / "outside.txt"
        outside.write_text("keep", encoding="utf-8")
        for name in ("..", "../outside.txt", "..\\outside.txt", "", "a/b", "a\\b"):
            with self.subTest(name=name):
                with self.assertRaises(LibraryError):
                    lan_stage._contained(root, name)
        self.assertEqual(outside.read_text(encoding="utf-8"), "keep")
        kept = lan_stage._contained(root, "keep.mp3")
        self.assertEqual(kept.parent, root.resolve())
        try:
            (root / "link").symlink_to(outside)
        except OSError:
            return
        with self.assertRaises(LibraryError):
            lan_stage._contained(root, "link")
        self.assertEqual(outside.read_text(encoding="utf-8"), "keep")

    def test_begin_forces_auto_mirror_off(self) -> None:
        """A sender that asks to mirror is stored as a one-time staged copy.

        Returns:
            None.
        """
        started = lan_stage.begin_transfer(
            {
                "label": "booth",
                "auto_mirror": True,
                "crates": [{"name": "Peak time", "color": 1, "rels": []}],
                "files": [],
            }
        )
        manifest = lan_stage._load(str(started["id"]))
        self.assertFalse(manifest["auto_mirror"])
        self.assertEqual(manifest["status"], "open")
        self.assertEqual(lan_stage.status()["inbox"], [])

    def test_accept_and_undo_queue_only_when_a_library_write_would_run(self) -> None:
        """Gig Lock queues accept and undo. A send is not a library write.

        Returns:
            None.
        """
        with TempLibrary():
            with mock.patch("snapshots.serato_dj_running", return_value=True), mock.patch(
                "library.status", return_value={"open_error": None}
            ), mock.patch("snapshots.write_block_notice", return_value=None), mock.patch(
                "app_config.load_settings"
            ) as settings:
                settings.return_value.gig_lock = True
                self.assertFalse(
                    write_queue.should_queue(
                        "/api/lan-stage",
                        {"action": "send", "confirm": True},
                    )
                )
                self.assertTrue(
                    write_queue.should_queue(
                        "/api/lan-stage",
                        {"action": "accept", "confirm": True},
                    )
                )
                self.assertFalse(
                    write_queue.should_queue(
                        "/api/lan-stage",
                        {"action": "accept", "confirm": False},
                        is_preview=True,
                    )
                )

    def test_error_codes_are_registered(self) -> None:
        """The fixed sentences the page translates are in both catalogs.

        Returns:
            None.
        """
        root = Path(__file__).resolve().parent.parent
        english = __import__("json").loads((root / "locales" / "en.json").read_text(encoding="utf-8"))
        spanish = __import__("json").loads((root / "locales" / "es.json").read_text(encoding="utf-8"))
        for sentence, code in (
            (lan_stage.BAD_HOST, "stage_bad_host"),
            (lan_stage.NOT_LISTENING, "stage_not_listening"),
            (lan_stage.STAGE_LIBRARY, "stage_dest_library"),
            (lan_stage.FINGERPRINT, "stage_fingerprint"),
        ):
            self.assertEqual(error_codes.ERROR_CODES.get(sentence), code)
            self.assertEqual(english[f"error.{code}"], sentence)
            self.assertTrue(spanish[f"error.{code}"])
            self.assertNotEqual(spanish[f"error.{code}"], sentence)


class LanApiTests(unittest.TestCase):
    """GET /api/lan-stage is read-only. POST send without confirm does not listen."""

    def setUp(self) -> None:
        """Isolate settings, then start the API server."""
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {"CRATECRAFT_CONFIG_DIR": self._config.name})
        self._env.start()
        server_tests.ApiTests.setUp(self)

    def tearDown(self) -> None:
        """Stop a staged-copy listener, then the API server."""
        lan_stage.stop()
        server_tests.ApiTests.tearDown(self)
        self._env.stop()
        self._config.cleanup()

    request = server_tests.ApiTests.request

    def test_get_is_idle(self) -> None:
        """Status does not listen and does not claim a mirror.

        Returns:
            None.
        """
        status, body = self.request("/api/lan-stage")
        self.assertEqual(status, 200)
        self.assertFalse(body["listening"])  # type: ignore[index]
        self.assertFalse(body["auto_mirror"])  # type: ignore[index]
        self.assertEqual(body["inbox"], [])  # type: ignore[index]

    def test_post_preview_and_unknown_action(self) -> None:
        """Preview needs a crate. An unknown action is refused.

        Returns:
            None.
        """
        status, body = self.request(
            "/api/lan-stage",
            {"action": "preview", "space": library.LIBRARY_SPACE, "crates": []},
        )
        self.assertEqual((status, body["code"]), (400, "stage_choose_crates"))  # type: ignore[index]
        status, body = self.request("/api/lan-stage", {"action": "mirror", "confirm": True})
        self.assertEqual((status, body["code"]), (400, "action_unavailable"))  # type: ignore[index]

    def test_post_send_without_confirm_is_a_preview(self) -> None:
        """Confirm false does not stage a file.

        Returns:
            None.
        """
        source = self.library.root / "tunes" / "keep.mp3"
        _touch(source, b"keep")
        _point(self.library, 1, source)
        with mock.patch("snapshots.serato_dj_running", return_value=False):
            created = library.crate_action(
                {"action": "create", "name": "Peak time", "assets": [1], "space": library.LIBRARY_SPACE}
            )
        status, preview = self.request(
            "/api/lan-stage",
            {
                "action": "preview",
                "space": library.LIBRARY_SPACE,
                "crates": [created["id"]],
            },
        )
        self.assertEqual(status, 200)
        status, body = self.request(
            "/api/lan-stage",
            {
                "action": "send",
                "host": "127.0.0.1",
                "port": 9,
                "code": "nope",
                "space": library.LIBRARY_SPACE,
                "crates": [created["id"]],
                "fingerprint": preview["fingerprint"],  # type: ignore[index]
                "confirm": False,
            },
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["preview"])  # type: ignore[index]
        self.assertFalse(body["library_written"])  # type: ignore[index]
        self.assertFalse((lan_stage.stage_root()).exists())
