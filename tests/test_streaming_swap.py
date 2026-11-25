"""Greyed-out Beatport and Beatsource tracks swap onto local files (#71).

The cases build a temporary library and temporary audio. They do not open
a live Serato library. A repair writes only through ``safe_write``. Colour,
crate order, and the audio bytes are asserted after a successful swap, and
again after every refusal.
"""

from __future__ import annotations

import os
import tempfile
import unicodedata
import unittest
from contextlib import closing
from pathlib import Path
from typing import cast
from unittest import mock

import app_config
import files
import library
import streaming_swap
import tests.test_server as test_server
from tests.fixture import TempLibrary, open_database


def _audio(path: Path, payload: bytes = b"not-a-real-mp3") -> None:
    """Write a stand-in audio file.

    Args:
        path: Destination. Parent directories are created.
        payload: Bytes left unchanged by a repair.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def _track(
    db: Path,
    asset_id: int,
    stored: str,
    *,
    title: str = "Night Drive",
    artist: str = "Ada",
    color: int = 255,
    third_party: int | None = None,
    file_name: str | None = None,
    specific: str | None = None,
) -> None:
    """Insert one asset in the Serato Library space.

    Args:
        db: Temporary ``master.sqlite``.
        asset_id: Asset id.
        stored: ``portable_id``.
        title: Title. Defaults to Night Drive.
        artist: Artist. Defaults to Ada.
        color: Library colour. Defaults to 255.
        third_party: ``third_party_type``, or None.
        file_name: File name column. Defaults to the stored base name.
        specific: ``type_specific_data``, or None.
    """
    name = file_name if file_name is not None else Path(stored.replace("\\", "/")).name
    with open_database(db) as conn:
        conn.execute(
            """
            INSERT INTO asset
                (id, name, artist, color, portable_id, file_name, third_party_type,
                 type_specific_data, is_missing, location_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            """,
            (asset_id, title, artist, color, stored, name, third_party, specific),
        )
        conn.execute(
            "INSERT INTO space_asset (id, asset_id, space_id) VALUES (?, ?, 1)",
            (asset_id, asset_id),
        )


def _crate(db: Path, asset_id: int, *, list_order: int = 4, name: str = "Friday") -> None:
    """Put the asset in a crate at a fixed list order.

    Args:
        db: Temporary ``master.sqlite``.
        asset_id: Asset id.
        list_order: Crate position. Defaults to 4.
        name: Crate name. Defaults to Friday.
    """
    with open_database(db) as conn:
        conn.execute(
            """
            INSERT INTO container
                (id, parent_id, name, type, list_order, space_id, time_added, expanded, portable_id, color)
            VALUES (?, 1, ?, 1, 1, 1, 1, 0, '', 0)
            """,
            (asset_id + 100, name),
        )
        conn.execute(
            "INSERT INTO location_container (id, container_id, location_id) VALUES (?, ?, 1)",
            (asset_id + 100, asset_id + 100),
        )
        conn.execute(
            """
            INSERT INTO container_asset
                (id, asset_id, location_container_id, list_order, container_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (asset_id + 100, asset_id, asset_id + 100, list_order, asset_id + 100),
        )
        conn.execute(
            """
            INSERT INTO history_entry
                (id, session_id, asset_id, name, artist, played, start_time, file_name, is_missing)
            VALUES (?, 1, ?, ?, ?, 1, 100, ?, 1)
            """,
            (asset_id + 100, asset_id, "Night Drive", "Ada", "beatport:1"),
        )


def _row(db: Path, asset_id: int) -> sqlite_row:
    """Return the asset columns a repair must leave alone, plus the path.

    Args:
        db: Temporary ``master.sqlite``.
        asset_id: Asset id.

    Returns:
        name, artist, color, portable_id, third_party_type, and the crate
        list order.
    """
    with closing(library.read_conn()) as conn:
        asset = conn.execute(
            "SELECT name, artist, color, portable_id, third_party_type FROM asset WHERE id = ?",
            (asset_id,),
        ).fetchone()
        order = conn.execute(
            "SELECT list_order FROM container_asset WHERE asset_id = ?",
            (asset_id,),
        ).fetchone()
        history = conn.execute(
            "SELECT asset_id, file_name FROM history_entry WHERE asset_id = ?",
            (asset_id,),
        ).fetchone()
        revision = conn.execute("SELECT revision FROM serato").fetchone()
    assert asset is not None
    return {
        "name": asset[0],
        "artist": asset[1],
        "color": asset[2],
        "portable_id": asset[3],
        "third_party_type": asset[4],
        "list_order": None if order is None else order[0],
        "history_asset": None if history is None else history[0],
        "history_file": None if history is None else history[1],
        "revision": None if revision is None else revision[0],
    }


class sqlite_row(dict[str, object]):
    """Typed bag for one asset snapshot."""


class MarkerTests(unittest.TestCase):
    """Service markers come from identity text, not from a type number."""

    def test_schemes_and_segments_match_and_audio_names_do_not(self) -> None:
        """Accept a URI or a path segment, and reject an audio file name.

        Returns:
            None. The test fails when a local file name is treated as a
            stream, or when a Beatport or Beatsource id is missed.
        """
        cases = {
            "beatport:123": "Beatport",
            "BEATSOURCE:99": "Beatsource",
            "streaming://beatsource/9": "Beatsource",
            "/streaming/beatport/9": "Beatport",
            "beatport": "Beatport",
            "Music/Beatport Anthem.mp3": None,
            "C:\\Music\\beatport\\song.mp3": None,
            "Notes about beatport": "Beatport",
            "notbeatport": None,
            "beatports": None,
        }
        for text, expected in cases.items():
            with self.subTest(text=text):
                self.assertEqual(streaming_swap.service_marker(text), expected)
        self.assertIsNone(streaming_swap.service_marker(None))
        self.assertIsNone(streaming_swap.service_marker(""))


class PlanTests(unittest.TestCase):
    """The plan lists dead streaming rows and does not write."""

    def test_lists_streams_and_skips_local_files_and_type_numbers(self) -> None:
        """List Beatport and Beatsource ids, including a title-only match.

        A missing mp3 whose title says Beatport, and rows whose only
        marker is ``third_party_type`` 4, 5, or 99, stay off the list.
        An audio path stays off the list even when type-specific data
        names Beatport. The database bytes do not change.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            local = music / "Ada - Night Drive.mp3"
            _audio(local, b"local-ada")
            _audio(music / "Only Title.mp3", b"title-only")
            _track(temp.db, 10, "beatport:10", third_party=4, color=255)
            _crate(temp.db, 10, list_order=4)
            _track(temp.db, 11, "beatsource:11", title="Only Title", artist="Bea", color=7)
            _track(temp.db, 12, "Music/Beatport Anthem.mp3", title="Beatport Anthem", artist="Ada")
            _track(temp.db, 13, "Music/missing.mp3", title="Gone", third_party=4)
            _track(temp.db, 14, "Music/also-missing.mp3", title="Gone 5", third_party=5)
            _track(temp.db, 15, "Music/unknown.mp3", title="Gone 99", third_party=99)
            _track(
                temp.db,
                16,
                "Music/plain.mp3",
                title="Plain",
                specific='{"service":"beatport"}',
            )
            _track(temp.db, 17, "", title="Typed", file_name="typed", specific=None)
            with open_database(temp.db) as conn:
                conn.execute("UPDATE asset SET type = ? WHERE id = 17", ("beatport",))
            seeded = temp.db.read_bytes()
            report = streaming_swap.plan(temp.db, library.LIBRARY_SPACE, [music])
            ids = [item["asset_id"] for item in cast(list[dict[str, object]], report["tracks"])]
            self.assertEqual(ids, [10, 11, 17])
            first = cast(list[dict[str, object]], report["tracks"])[0]
            match = cast(dict[str, object], first["match"])
            self.assertEqual(match["confidence"], "high")
            self.assertEqual(match["path"], str(local.resolve()))
            self.assertEqual(first["color"], 255)
            self.assertEqual(cast(list[dict[str, object]], first["crates"])[0]["list_order"], 4)
            self.assertEqual(first["cues"], "kept-on-row")
            second = cast(list[dict[str, object]], report["tracks"])[1]
            self.assertEqual(cast(dict[str, object], second["match"])["confidence"], "medium")
            self.assertFalse(report["written"])
            self.assertEqual(temp.db.read_bytes(), seeded)

    def test_nfd_title_matches_an_nfc_file_name(self) -> None:
        """Match a decomposed title to a composed file name.

        Returns:
            None. The test fails when the accent blocks the only match.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            title = unicodedata.normalize("NFD", "Café")
            file_name = unicodedata.normalize("NFC", "Ada - Café.mp3")
            _audio(music / file_name, b"cafe")
            _track(temp.db, 10, "beatport:10", title=title, artist="Ada")
            report = streaming_swap.plan(temp.db, library.LIBRARY_SPACE, [music])
            tracks = cast(list[dict[str, object]], report["tracks"])
            self.assertEqual(len(tracks), 1)
            self.assertIsNotNone(tracks[0]["match"])

    def test_two_files_are_not_a_single_match(self) -> None:
        """Leave several same-name files for the DJ to tell apart.

        Returns:
            None. The test fails when one of them is chosen automatically.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            _audio(music / "a" / "Ada - Night Drive.mp3", b"a")
            _audio(music / "b" / "Ada - Night Drive.mp3", b"b")
            _track(temp.db, 10, "beatport:10")
            report = streaming_swap.plan(temp.db, library.LIBRARY_SPACE, [music])
            track = cast(list[dict[str, object]], report["tracks"])[0]
            self.assertIsNone(track["match"])
            self.assertEqual(len(cast(list[object], track["candidates"])), 2)
            self.assertTrue(all(item["confidence"] == "low" for item in cast(list[dict[str, object]], track["candidates"])))

    def test_one_file_cannot_repair_two_rows(self) -> None:
        """Refuse to point two streaming rows at the same local file.

        Returns:
            None. The test fails when either row keeps a high match.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            _audio(music / "Ada - Night Drive.mp3", b"one")
            _track(temp.db, 10, "beatport:10")
            _track(temp.db, 11, "beatsource:11")
            report = streaming_swap.plan(temp.db, library.LIBRARY_SPACE, [music])
            for track in cast(list[dict[str, object]], report["tracks"]):
                self.assertIsNone(track["match"])
                candidate = cast(list[dict[str, object]], track["candidates"])[0]
                self.assertFalse(candidate["usable"])
                self.assertEqual(candidate["reason"], "same file as another track")


class ApplyTests(unittest.TestCase):
    """A confirmed swap keeps colour, crate order, and the audio bytes."""

    def setUp(self) -> None:
        self._config = tempfile.TemporaryDirectory()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: self._config.name})
        self._env.start()
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()
        self._block = mock.patch("snapshots.write_block_message", return_value=None)
        self._block.start()

    def tearDown(self) -> None:
        self._block.stop()
        self._running.stop()
        self._env.stop()
        self._config.cleanup()

    def test_swap_keeps_colour_crate_order_and_audio(self) -> None:
        """Point the same asset at the local file and leave the rest.

        Returns:
            None. The test fails when the colour, list order, history
            asset, or audio bytes change, or when a new asset row appears.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            local = music / "Ada - Night Drive.mp3"
            payload = b"cue-bytes-stay"
            _audio(local, payload)
            _track(temp.db, 10, "beatport:10", third_party=4, color=255)
            _crate(temp.db, 10, list_order=4)
            result = streaming_swap.apply(
                library.LIBRARY_SPACE,
                [(10, str(local))],
                [music],
            )
            self.assertTrue(result["written"])
            self.assertEqual(result["cues"], "kept-on-row")
            saved = _row(temp.db, 10)
            self.assertEqual(saved["color"], 255)
            self.assertEqual(saved["name"], "Night Drive")
            self.assertEqual(saved["artist"], "Ada")
            self.assertEqual(saved["list_order"], 4)
            self.assertEqual(saved["portable_id"], files.to_portable(local.resolve()))
            self.assertEqual(saved["third_party_type"], 0)
            self.assertEqual(saved["history_asset"], 10)
            self.assertEqual(saved["history_file"], local.name)
            self.assertEqual(local.read_bytes(), payload)
            self.assertEqual(saved["revision"], 2)
            with closing(library.read_conn()) as conn:
                count = conn.execute("SELECT COUNT(*) FROM asset").fetchone()
            self.assertEqual(int(count[0]), 3)

    def test_preview_and_unconfirmed_apply_do_not_write(self) -> None:
        """Leave the library untouched until confirm is true.

        Returns:
            None. The test fails when the revision or the stored path changes.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            local = music / "Ada - Night Drive.mp3"
            _audio(local, b"stay")
            _track(temp.db, 10, "beatport:10", color=255)
            _crate(temp.db, 10)
            preview = streaming_swap.action(
                {"action": "preview", "space": library.LIBRARY_SPACE, "roots": [str(music)]}
            )
            quiet = streaming_swap.action(
                {
                    "action": "apply",
                    "confirm": False,
                    "space": library.LIBRARY_SPACE,
                    "roots": [str(music)],
                    "swaps": [{"asset_id": 10, "path": str(local)}],
                }
            )
            empty = streaming_swap.apply(library.LIBRARY_SPACE, [], [music])
            self.assertFalse(preview["written"])
            self.assertTrue(preview["preview"])
            self.assertFalse(quiet["written"])
            self.assertFalse(empty["written"])
            saved = _row(temp.db, 10)
            self.assertEqual(saved["portable_id"], "beatport:10")
            self.assertEqual(saved["revision"], 1)
            self.assertEqual(local.read_bytes(), b"stay")

    def test_a_path_that_is_not_a_match_writes_nothing(self) -> None:
        """Refuse a file that is not one of this track's candidates.

        Returns:
            None. The test fails when that path is stored anyway.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            _audio(music / "Ada - Night Drive.mp3", b"match")
            other = music / "Other Song.mp3"
            _audio(other, b"other")
            _track(temp.db, 10, "beatport:10")
            with self.assertRaises(library.LibraryError) as caught:
                streaming_swap.apply(library.LIBRARY_SPACE, [(10, str(other))], [music])
            self.assertEqual(caught.exception.status, 400)
            self.assertEqual(str(caught.exception), streaming_swap.MISMATCH)
            saved = _row(temp.db, 10)
            self.assertEqual(saved["portable_id"], "beatport:10")
            self.assertEqual(saved["revision"], 1)

    def test_a_file_inside_the_library_folder_writes_nothing(self) -> None:
        """Refuse a match that sits beside master.sqlite.

        Returns:
            None. The test fails when the guard is dropped and the path
            is stored.
        """
        with TempLibrary() as temp:
            local = temp.root / "Ada - Night Drive.mp3"
            _audio(local, b"inside")
            _track(temp.db, 10, "beatport:10")
            with self.assertRaises(library.LibraryError) as caught:
                streaming_swap.apply(library.LIBRARY_SPACE, [(10, str(local))], [temp.root])
            self.assertEqual(str(caught.exception), streaming_swap.MISMATCH)
            self.assertEqual(_row(temp.db, 10)["portable_id"], "beatport:10")
            self.assertEqual(local.read_bytes(), b"inside")

    def test_a_file_under_serato_writes_nothing(self) -> None:
        """Refuse a match found by scanning a ``_Serato_`` folder.

        The walk indexes files when that folder is the search root. The
        repair still refuses the path.

        Returns:
            None. The test fails when the ``_Serato_`` guard is dropped.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            folder = music / "_Serato_"
            local = folder / "Ada - Night Drive.mp3"
            _audio(local, b"serato-tree")
            _track(temp.db, 10, "beatport:10")
            with self.assertRaises(library.LibraryError):
                streaming_swap.apply(library.LIBRARY_SPACE, [(10, str(local))], [folder])
            self.assertEqual(_row(temp.db, 10)["portable_id"], "beatport:10")

    def test_a_symlink_to_the_match_writes_nothing(self) -> None:
        """Refuse a shortcut even when it resolves to the matched file.

        Returns:
            None. The test fails when the shortcut is stored.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            local = music / "Ada - Night Drive.mp3"
            _audio(local, b"real")
            link = music / "link.mp3"
            try:
                link.symlink_to(local)
            except OSError:
                self.skipTest("this platform cannot create a symlink")
            _track(temp.db, 10, "beatport:10")
            with self.assertRaises(library.LibraryError):
                streaming_swap.apply(library.LIBRARY_SPACE, [(10, str(link))], [music])
            self.assertEqual(_row(temp.db, 10)["portable_id"], "beatport:10")
            self.assertEqual(local.read_bytes(), b"real")

    def test_two_rows_one_file_writes_nothing(self) -> None:
        """Refuse a request that would share one file across two rows.

        Returns:
            None. The test fails when either stored path changes.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            local = music / "Ada - Night Drive.mp3"
            _audio(local, b"shared")
            _track(temp.db, 10, "beatport:10")
            _track(temp.db, 11, "beatsource:11")
            with self.assertRaises(library.LibraryError):
                streaming_swap.apply(
                    library.LIBRARY_SPACE,
                    [(10, str(local)), (11, str(local))],
                    [music],
                )
            self.assertEqual(_row(temp.db, 10)["portable_id"], "beatport:10")
            self.assertEqual(_row(temp.db, 11)["portable_id"], "beatsource:11")

    def test_serato_running_writes_nothing(self) -> None:
        """Refuse the swap while Serato DJ is open.

        Returns:
            None. The test fails when the path changes during the refusal.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            local = music / "Ada - Night Drive.mp3"
            _audio(local, b"open")
            _track(temp.db, 10, "beatport:10")
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                with self.assertRaises(library.LibraryError) as caught:
                    streaming_swap.apply(library.LIBRARY_SPACE, [(10, str(local))], [music])
            self.assertEqual(caught.exception.status, 409)
            self.assertEqual(str(caught.exception), "Serato DJ is open. Edits stay off until it quits.")
            self.assertEqual(_row(temp.db, 10)["portable_id"], "beatport:10")

    def test_medium_title_match_can_be_chosen(self) -> None:
        """Accept the single title match when the request names that file.

        Returns:
            None. The test fails when a title-only file is rejected.
        """
        with TempLibrary() as temp:
            music = Path(tempfile.mkdtemp())
            self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
            local = music / "Night Drive.mp3"
            _audio(local, b"title")
            _track(temp.db, 10, "beatport:10", artist="Ada", title="Night Drive", color=9)
            _crate(temp.db, 10, list_order=2)
            result = streaming_swap.apply(library.LIBRARY_SPACE, [(10, str(local))], [music])
            self.assertTrue(result["written"])
            saved = _row(temp.db, 10)
            self.assertEqual(saved["portable_id"], files.to_portable(local.resolve()))
            self.assertEqual(saved["color"], 9)
            self.assertEqual(saved["list_order"], 2)


class ApiTests(unittest.TestCase):
    """GET and POST /api/streaming-swap against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_get_lists_and_post_needs_a_real_match(self) -> None:
        """Read the plan, and refuse a write that is not confirmed or not a match.

        Returns:
            None. The test fails when a preview stores the local path.
        """
        music = Path(tempfile.mkdtemp())
        self.addCleanup(lambda: __import__("shutil").rmtree(music, ignore_errors=True))
        local = music / "Ada - Night Drive.mp3"
        _audio(local, b"api")
        _track(self.library.db, 10, "beatport:10", color=255)
        _crate(self.library.db, 10, list_order=4)
        root = str(music)
        with mock.patch("snapshots.serato_dj_running", return_value=False), mock.patch(
            "snapshots.write_block_message", return_value=None
        ):
            status, report = self.request(f"/api/streaming-swap?space=Serato%20Library&root={root}")
            self.assertEqual(status, 200)
            body = cast(dict[str, object], report)
            self.assertFalse(body["written"])
            tracks = cast(list[dict[str, object]], body["tracks"])
            self.assertEqual([item["asset_id"] for item in tracks], [10])
            status, preview = self.request(
                "/api/streaming-swap",
                {
                    "action": "preview",
                    "space": "Serato Library",
                    "roots": [root],
                },
            )
            self.assertEqual(status, 200)
            self.assertFalse(cast(dict[str, object], preview)["written"])
            self.assertEqual(_row(self.library.db, 10)["portable_id"], "beatport:10")
            status, made = self.request(
                "/api/streaming-swap",
                {
                    "action": "apply",
                    "confirm": True,
                    "space": "Serato Library",
                    "roots": [root],
                    "swaps": [{"asset_id": 10, "path": str(local)}],
                },
            )
            self.assertEqual(status, 200)
            self.assertTrue(cast(dict[str, object], made)["written"])
            saved = _row(self.library.db, 10)
            self.assertEqual(saved["color"], 255)
            self.assertEqual(saved["list_order"], 4)
            self.assertEqual(saved["portable_id"], files.to_portable(local.resolve()))
            self.assertEqual(local.read_bytes(), b"api")
            status, missing = self.request(
                "/api/streaming-swap",
                {"action": "nope", "space": "Serato Library"},
            )
            self.assertEqual(status, 400)
            self.assertEqual(cast(dict[str, object], missing)["error"], "That action is not available.")
