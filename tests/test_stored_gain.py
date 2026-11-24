"""Stored gain reset (#468).

Synthetic Autotags only. The manual gain is the third ASCII field.
Auto gain, Markers2, BeatGrid, Overview, and Analysis stay. A failed
read-back puts the snapshot back.
"""

from __future__ import annotations

import base64
import os
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from typing import cast
from unittest import mock

import app_config
import library
import snapshot_frames
import stored_gain
from library import LibraryError, SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests import test_server
from tests.test_smart_presets import _members


def _geob(description: str, payload: bytes) -> bytes:
    """Build one Latin-1 GEOB frame."""
    body = bytes([0]) + b"application/octet-stream\x00\x00" + description.encode("latin-1") + b"\x00" + payload
    return b"GEOB" + len(body).to_bytes(4, "big") + b"\x00\x00" + body


def _id3(frames: list[bytes], audio: bytes) -> bytes:
    """Build an ID3v2.3 tag followed by audio bytes."""
    body = b"".join(frames)
    size = len(body)
    synchsafe = bytes((
        (size >> 21) & 0x7F,
        (size >> 14) & 0x7F,
        (size >> 7) & 0x7F,
        size & 0x7F,
    ))
    return b"ID3" + bytes([3, 0, 0]) + synchsafe + body + audio


def _gain_payload(gain: str, *, tail: bytes = b"KEEP") -> bytes:
    """Autotags payload: 128.00 BPM, -3.257 auto gain, then ``gain``."""
    return (
        b"\x01\x01"
        + b"128.00\x00"
        + b"-3.257\x00"
        + gain.encode("ascii")
        + b"\x00"
        + tail
    )


def _marked(gain: str, *, tail: bytes = b"KEEP") -> tuple[bytes, bytes]:
    """Return an MP3-shaped file and the audio region.

    Markers2, BeatGrid, Overview, and Analysis are distinctive and are
    not the gain field.
    """
    audio = b"AUDIOFRAME-stored-gain"
    frames = [
        _geob("Serato Markers2", b"\x01\x01MARKERS-STAY"),
        _geob("Serato BeatGrid", b"\x01GRID-STAY"),
        _geob("Serato Overview", b"OVERVIEW-STAY"),
        _geob("Serato Analysis", b"\x02\x01"),
        _geob("Serato Autotags", _gain_payload(gain, tail=tail)),
    ]
    return _id3(frames, audio), audio


def _envelope(name: str, payload: bytes) -> bytes:
    """Base64 envelope Serato stores in a FLAC comment, wrapped at 72."""
    raw = b"application/octet-stream\x00\x00" + name.encode("ascii") + b"\x00" + payload
    text = base64.b64encode(raw).rstrip(b"=")
    return b"\n".join(text[i:i + 72] for i in range(0, len(text), 72))


def _atom(tag: bytes, body: bytes) -> bytes:
    """One MP4 atom."""
    return (8 + len(body)).to_bytes(4, "big") + tag + body


def _m4a(gain: str) -> bytes:
    """M4A whose Serato freeform name is ``autgain``, plus markers and overview."""
    audio = b"MDAT-AUDIO-STAYS"

    def freeform(name: str, payload: bytes) -> bytes:
        wrapped = _envelope(name, payload)
        mean = _atom(b"mean", b"\x00\x00\x00\x00" + b"com.serato.dj")
        title = _atom(b"name", b"\x00\x00\x00\x00" + name.encode("ascii"))
        data = _atom(b"data", b"\x00" * 8 + wrapped)
        return _atom(b"----", mean + title + data)

    ilst = _atom(
        b"ilst",
        freeform("markersv2", b"\x01\x01MARKERS-STAY")
        + freeform("beatgrid", b"\x01GRID-STAY")
        + freeform("overview", b"OVERVIEW-STAY")
        + freeform("autgain", _gain_payload(gain)),
    )
    meta = _atom(b"meta", b"\x00\x00\x00\x00" + ilst)
    moov = _atom(b"moov", _atom(b"udta", meta))
    return _atom(b"ftyp", b"M4A ") + moov + _atom(b"mdat", audio)


def _flac(gain: str) -> bytes:
    """FLAC with SERATO_AUTOGAIN and the other Serato comments."""
    audio = b"FLAC-AUDIO-STAYS"
    comments = [
        (b"SERATO_MARKERS_V2", _envelope("Serato Markers2", b"\x01\x01MARKERS-STAY")),
        (b"SERATO_BEATGRID", _envelope("Serato BeatGrid", b"\x01GRID-STAY")),
        (b"SERATO_OVERVIEW", _envelope("Serato Overview", b"OVERVIEW-STAY")),
        (b"SERATO_ANALYSIS", _envelope("Serato Analysis", b"\x02\x01")),
        (b"SERATO_AUTOGAIN", _envelope("Serato Autotags", _gain_payload(gain))),
    ]
    vendor = b"test"
    payload = len(vendor).to_bytes(4, "little") + vendor
    payload += len(comments).to_bytes(4, "little")
    for key, value in comments:
        entry = key + b"=" + value
        payload += len(entry).to_bytes(4, "little") + entry
    stream = b"\x00" * 34
    out = bytearray(b"fLaC")
    out.append(0)
    out += len(stream).to_bytes(3, "big")
    out += stream
    out.append(0x80 | 4)
    out += len(payload).to_bytes(3, "big")
    out += payload
    out += audio
    return bytes(out)


def _point(temp: TempLibrary, asset_id: int, path: Path, body: bytes) -> None:
    """Point one fixture track at a synthetic file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    with open_database(temp.db) as conn:
        conn.execute(
            "UPDATE asset SET portable_id = ?, file_name = ?, is_missing = 0 WHERE id = ?",
            (str(path), path.name, asset_id),
        )


def _names() -> list[str]:
    """Crate names in the temporary library."""
    with open_database(library.MASTER) as conn:
        return [str(row[0]) for row in conn.execute("SELECT name FROM container ORDER BY id")]


def _find(name: str, parent: int | None = None) -> int | None:
    """Return a crate id by its stored name."""
    with closing(library.read_conn()) as conn:
        rows = conn.execute("SELECT id, parent_id, name FROM container").fetchall()
    for row in rows:
        if str(row["name"]) != name:
            continue
        if parent is not None and int(row["parent_id"] or 0) != parent:
            continue
        return int(row["id"])
    return None


class ParseTests(unittest.TestCase):
    """The third field is the manual gain. Other bytes stay."""

    def test_zero_keeps_bpm_auto_gain_and_the_tail(self) -> None:
        payload = _gain_payload("-1.500", tail=b"TAIL")
        parsed = stored_gain.parse_autotags(payload)
        assert parsed is not None
        self.assertEqual(parsed["gain_text"], "-1.500")
        self.assertFalse(stored_gain._is_zero(cast(float, parsed["gain_db"])))
        zeroed = stored_gain.zero_gain_payload(payload)
        assert zeroed is not None
        self.assertTrue(zeroed.startswith(b"\x01\x01128.00\x00-3.257\x000.000\x00"))
        self.assertTrue(zeroed.endswith(b"TAIL"))
        again = stored_gain.parse_autotags(zeroed)
        assert again is not None
        self.assertTrue(stored_gain._is_zero(cast(float, again["gain_db"])))
        self.assertEqual(again["bpm_text"], "128.00")
        self.assertEqual(again["auto_text"], "-3.257")

    def test_zero_spellings_and_a_foreign_version_are_not_rewritten(self) -> None:
        for text in ("0", "0.0", "0.000", "-0.000"):
            parsed = stored_gain.parse_autotags(_gain_payload(text, tail=b""))
            assert parsed is not None
            self.assertTrue(stored_gain._is_zero(cast(float, parsed["gain_db"])), text)
        self.assertIsNone(stored_gain.parse_autotags(b"\x02\x01128.00\x00-1.000\x001.000\x00"))
        self.assertIsNone(stored_gain.parse_autotags(b"\x01\x01not-a-number\x00-1\x001\x00"))
        self.assertIsNone(stored_gain.zero_gain_payload(b"\x02\x01128.00\x00-1.000\x001.000\x00"))


class ScanTests(unittest.TestCase):
    """Read-only listing. Zero gain and a missing tag are not a change."""

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

    def test_lists_nonzero_and_skips_zero_missing_and_unreadable(self) -> None:
        with TempLibrary() as temp:
            changed, _audio = _marked("-1.500")
            quiet, _audio = _marked("0.000")
            changed_path = temp.root / "tunes" / "changed.mp3"
            quiet_path = temp.root / "tunes" / "quiet.mp3"
            _point(temp, 1, changed_path, changed)
            _point(temp, 2, quiet_path, quiet)
            before = changed_path.read_bytes()
            report = stored_gain.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual([item["id"] for item in cast(list[dict[str, object]], report["tracks"])], [1])
            self.assertEqual(cast(list[dict[str, object]], report["tracks"])[0]["gain_text"], "-1.500")
            self.assertEqual(changed_path.read_bytes(), before)
            self.assertEqual(report["unreadable"], 0)
            preview = stored_gain.action({"action": "reset", "space": library.LIBRARY_SPACE})
            self.assertTrue(preview["preview"])
            self.assertFalse(preview["written"])
            self.assertEqual(changed_path.read_bytes(), before)
            self.assertNotIn(stored_gain.CRATE_NAME, _names())

    def test_foreign_version_is_unreadable_and_not_rewritten(self) -> None:
        with TempLibrary() as temp:
            foreign = _gain_payload("1.000").replace(b"\x01\x01", b"\x09\x09", 1)
            audio = b"AUDIOFRAME-stored-gain"
            body = _id3([
                _geob("Serato Markers2", b"MARKERS-STAY"),
                _geob("Serato Autotags", foreign),
            ], audio)
            path = temp.root / "tunes" / "foreign.mp3"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "none.mp3", b"not-a-tag")
            before = path.read_bytes()
            report = stored_gain.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(report["tracks"], [])
            self.assertEqual(report["unreadable"], 1)
            result = stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertFalse(result["written"])
            self.assertEqual(path.read_bytes(), before)

    def test_unplugged_drive_is_offline(self) -> None:
        with TempLibrary() as temp:
            body, _audio = _marked("-2.000")
            path = temp.root / "tunes" / "offline.mp3"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "gone.mp3", b"")
            (temp.root / "tunes" / "gone.mp3").unlink()

            def absent(stored: str) -> str | None:
                if str(stored).endswith("offline.mp3"):
                    return "USB"
                return None

            with mock.patch("stored_gain.volumes.absent_volume", side_effect=absent):
                report = stored_gain.scan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(report["tracks"], [])
            self.assertEqual(report["offline"], 1)
            self.assertGreaterEqual(cast(int, report["not_found"]), 1)


class ResetTests(unittest.TestCase):
    """Confirm writes 0 dB. A bad read-back restores the file."""

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

    def test_reset_reads_back_zero_and_leaves_other_frames(self) -> None:
        with TempLibrary() as temp:
            body, audio = _marked("-1.500", tail=b"TAIL")
            path = temp.root / "tunes" / "changed.mp3"
            _point(temp, 1, path, body)
            quiet, _audio = _marked("0.000")
            quiet_path = temp.root / "tunes" / "quiet.mp3"
            _point(temp, 2, quiet_path, quiet)
            guard = stored_gain.guarded_bytes(path)
            quiet_before = quiet_path.read_bytes()
            result = stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertTrue(result["written"])
            self.assertEqual(result["reset"], 1)
            self.assertEqual(stored_gain.read_gain_db(path), 0.0)
            self.assertEqual(stored_gain.guarded_bytes(path), guard)
            frames = snapshot_frames.read_stored_frames(path)
            payload = stored_gain.autotags_payload(frames["Autotags"])
            assert payload is not None
            self.assertTrue(payload.startswith(b"\x01\x01128.00\x00-3.257\x000.000\x00"))
            self.assertTrue(payload.endswith(b"TAIL"))
            self.assertTrue(path.read_bytes().endswith(audio))
            self.assertEqual(quiet_path.read_bytes(), quiet_before)
            markers = _geob("Serato Markers2", b"\x01\x01MARKERS-STAY")
            overview = _geob("Serato Overview", b"OVERVIEW-STAY")
            analysis = _geob("Serato Analysis", b"\x02\x01")
            raw = path.read_bytes()
            self.assertIn(markers, raw)
            self.assertIn(overview, raw)
            self.assertIn(analysis, raw)
            self.assertIn(b"\x01GRID-STAY", raw)

    def test_mp4_autgain_resets_and_leaves_markers(self) -> None:
        with TempLibrary() as temp:
            body = _m4a("-2.500")
            path = temp.root / "tunes" / "changed.m4a"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
            guard = stored_gain.guarded_bytes(path)
            markers = guard
            stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(stored_gain.read_gain_db(path), 0.0)
            self.assertEqual(stored_gain.guarded_bytes(path), markers)
            self.assertIn(b"autgain", path.read_bytes())
            self.assertIn(b"markersv2", path.read_bytes())

    def test_flac_autogain_resets_and_other_comments_stay(self) -> None:
        with TempLibrary() as temp:
            body = _flac("-4.000")
            path = temp.root / "tunes" / "changed.flac"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
            guard = stored_gain.guarded_bytes(path)
            stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(stored_gain.read_gain_db(path), 0.0)
            self.assertEqual(stored_gain.guarded_bytes(path), guard)
            frames = snapshot_frames.read_stored_frames(path)
            self.assertIn(b"SERATO_AUTOGAIN", path.read_bytes())
            payload = stored_gain.autotags_payload(frames["Autotags"])
            assert payload is not None
            self.assertIn(b"0.000", payload)
            self.assertIn(b"-3.257", payload)
            self.assertTrue(path.read_bytes().endswith(b"FLAC-AUDIO-STAYS"))

    def test_a_changed_marker_rolls_the_file_back(self) -> None:
        with TempLibrary() as temp:
            body, _audio = _marked("-1.250")
            path = temp.root / "tunes" / "changed.mp3"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
            before = path.read_bytes()
            real = stored_gain.guarded_bytes
            seen = {"n": 0}

            def changed(target: str | Path) -> bytes:
                seen["n"] += 1
                blob = real(Path(target))
                if seen["n"] > 1 and Path(target) == path:
                    return blob + b"NO"
                return blob

            with mock.patch("stored_gain.guarded_bytes", side_effect=changed):
                with self.assertRaises(LibraryError) as caught:
                    stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(caught.exception.message, stored_gain.FRAMES_MOVED)
            self.assertEqual(path.read_bytes(), before)

    def test_failed_read_back_rolls_the_file_back(self) -> None:
        with TempLibrary() as temp:
            body, _audio = _marked("-1.250", tail=b"TAIL")
            path = temp.root / "tunes" / "changed.mp3"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
            before = path.read_bytes()
            real = stored_gain.read_gain_db

            def lie(target: str | Path) -> float | None:
                if Path(target) == path:
                    return 2.5
                return real(target)

            with mock.patch("stored_gain.read_gain_db", side_effect=lie):
                with self.assertRaises(LibraryError) as caught:
                    stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(caught.exception.message, stored_gain.DID_NOT_STICK)
            self.assertEqual(caught.exception.status, 409)
            self.assertEqual(path.read_bytes(), before)
            self.assertIn(b"-1.250", path.read_bytes())
            self.assertIn(b"MARKERS-STAY", path.read_bytes())
            self.assertIn(b"OVERVIEW-STAY", path.read_bytes())

    def test_undo_puts_the_gain_back(self) -> None:
        with TempLibrary() as temp:
            body, _audio = _marked("3.000")
            path = temp.root / "tunes" / "changed.mp3"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
            result = stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(stored_gain.read_gain_db(path), 0.0)
            stored_gain.undo(str(result["snapshot_id"]))
            self.assertEqual(stored_gain.read_gain_db(path), 3.0)
            self.assertEqual(path.read_bytes(), body)

    def test_serato_open_does_not_touch_the_file(self) -> None:
        with TempLibrary() as temp:
            body, _audio = _marked("-1.000")
            path = temp.root / "tunes" / "changed.mp3"
            _point(temp, 1, path, body)
            _point(temp, 2, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
            before = path.read_bytes()
            with mock.patch("snapshots.serato_dj_running", return_value=True):
                with self.assertRaises(SeratoOpen):
                    stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(path.read_bytes(), before)

    def test_empty_reset_does_not_open_a_session(self) -> None:
        with TempLibrary() as temp:
            _point(temp, 1, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
            _point(temp, 2, temp.root / "tunes" / "also.mp3", _marked("0.000")[0])
            with mock.patch("safe_write.run") as runner:
                result = stored_gain.reset(temp.db, library.LIBRARY_SPACE)
            runner.assert_not_called()
            self.assertFalse(result["written"])


class CrateTests(unittest.TestCase):
    """The generated crate does not replace one the DJ made."""

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

    def _seed(self, temp: TempLibrary) -> Path:
        body, _audio = _marked("-6.000")
        path = temp.root / "tunes" / "changed.mp3"
        _point(temp, 1, path, body)
        _point(temp, 2, temp.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
        return path

    def test_create_nests_under_the_generated_folder(self) -> None:
        with TempLibrary() as temp:
            self._seed(temp)
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                outside = cast(
                    int,
                    library.crate_action(
                        {"action": "create", "name": stored_gain.CRATE_NAME, "assets": [2]}
                    )["id"],
                )
            result = stored_gain.create_crate(temp.db, library.LIBRARY_SPACE)
            self.assertTrue(result["written"])
            generated = _find(stored_gain.GENERATED_FOLDER)
            assert generated is not None
            nested = _find(stored_gain.CRATE_NAME, generated)
            self.assertEqual(nested, result["id"])
            self.assertEqual(_members(int(str(result["id"]))), [1])
            self.assertEqual(_members(outside), [2])
            self.assertNotEqual(outside, nested)

    def test_rerun_replaces_only_the_generated_crate(self) -> None:
        with TempLibrary() as temp:
            self._seed(temp)
            first = stored_gain.create_crate(temp.db, library.LIBRARY_SPACE)
            generated = _find(stored_gain.GENERATED_FOLDER)
            assert generated is not None
            with mock.patch("snapshots.serato_dj_running", return_value=False):
                keep = cast(
                    int,
                    library.crate_action(
                        {
                            "action": "create",
                            "name": "DJ keep",
                            "parent": generated,
                            "assets": [2],
                        }
                    )["id"],
                )
            second = stored_gain.create_crate(temp.db, library.LIBRARY_SPACE)
            self.assertNotEqual(second["id"], first["id"])
            self.assertEqual(_find("DJ keep", generated), keep)
            self.assertEqual(_find(stored_gain.CRATE_NAME, generated), second["id"])
            with closing(library.read_conn()) as conn:
                gone = conn.execute(
                    "SELECT COUNT(*) FROM container WHERE id = ?",
                    (int(str(first["id"])),),
                ).fetchone()
            self.assertEqual(int(gone[0]), 0)

    def test_empty_create_writes_nothing(self) -> None:
        with TempLibrary() as temp:
            _point(temp, 1, temp.root / "tunes" / "a.mp3", _marked("0.000")[0])
            _point(temp, 2, temp.root / "tunes" / "b.mp3", _marked("0.000")[0])
            result = stored_gain.create_crate(temp.db, library.LIBRARY_SPACE)
            self.assertFalse(result["written"])
            self.assertNotIn(stored_gain.GENERATED_FOLDER, _names())


class ApiTests(unittest.TestCase):
    """GET and POST /api/gain-changed against a temporary library."""

    setUp = test_server.ApiTests.setUp
    tearDown = test_server.ApiTests.tearDown
    request = test_server.ApiTests.request

    def test_get_lists_and_post_reset_needs_confirm(self) -> None:
        body, _audio = _marked("-1.000")
        path = self.library.root / "tunes" / "changed.mp3"
        _point(self.library, 1, path, body)
        _point(self.library, 2, self.library.root / "tunes" / "quiet.mp3", _marked("0.000")[0])
        with mock.patch("snapshots.serato_dj_running", return_value=False), mock.patch(
            "snapshots.write_block_message", return_value=None
        ):
            status, report = self.request("/api/gain-changed")
            self.assertEqual(status, 200)
            tracks = cast(dict, report)["tracks"]
            self.assertEqual([item["id"] for item in tracks], [1])
            status, refused = self.request(
                "/api/gain-changed",
                {"action": "reset", "confirm": False},
            )
            self.assertEqual(status, 200)
            self.assertFalse(cast(dict, refused)["written"])
            self.assertEqual(path.read_bytes(), body)
            status, made = self.request(
                "/api/gain-changed",
                {"action": "reset", "confirm": True},
            )
            self.assertEqual(status, 200)
            self.assertTrue(cast(dict, made)["written"])
            self.assertEqual(stored_gain.read_gain_db(path), 0.0)
            status, missing = self.request("/api/gain-changed", {"action": "nope"})
            self.assertEqual(status, 400)


if __name__ == "__main__":
    unittest.main()
