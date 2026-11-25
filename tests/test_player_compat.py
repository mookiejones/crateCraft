"""Player-refusal scan (#330). Read-only, synthetic headers only.

Each refusal case and a file that should pass are built in memory. Nothing
here is a real library, and the scan must not change the temporary database
or the audio bytes.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
import unittest
import urllib.error
import urllib.request
from contextlib import closing
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import error_codes
import library
import player_compat
import server
from tests.fixture import TempLibrary

_MPEG1_L3 = (0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0)
_MPEG2_L3 = (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0)
_RATE_441 = bytes.fromhex("400eac44000000000000")
_RATE_96K = bytes.fromhex("400fbb80000000000000")


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _wav(rate: int = 44100, bits: int = 16, tag: int = 1, guid: bytes = b"") -> bytes:
    channels = 2
    block = channels * max(bits, 8) // 8
    fmt = tag.to_bytes(2, "little")
    fmt += channels.to_bytes(2, "little")
    fmt += rate.to_bytes(4, "little")
    fmt += (rate * block).to_bytes(4, "little")
    fmt += block.to_bytes(2, "little")
    fmt += bits.to_bytes(2, "little")
    if tag == 0xFFFE:
        fmt += (22).to_bytes(2, "little")
        fmt += bits.to_bytes(2, "little")
        fmt += (3).to_bytes(4, "little")
        fmt += guid
    body = b"WAVE" + b"fmt " + len(fmt).to_bytes(4, "little") + fmt + b"data" + (0).to_bytes(4, "little")
    return b"RIFF" + len(body).to_bytes(4, "little") + body


def _aiff(form: bytes = b"AIFF", rate: bytes = _RATE_441, bits: int = 16, compression: bytes = b"") -> bytes:
    comm = (2).to_bytes(2, "big") + (0).to_bytes(4, "big") + bits.to_bytes(2, "big") + rate
    if form == b"AIFC":
        comm += compression + bytes([4]) + b"none"
    if len(comm) % 2:
        comm += b"\x00"
    chunk = b"COMM" + len(comm).to_bytes(4, "big") + comm
    body = form + chunk
    return b"FORM" + (len(body)).to_bytes(4, "big") + body


def _flac(rate: int = 44100, depth: int = 16) -> bytes:
    value = 4096
    value = (value << 16) | 4096
    value = (value << 24) | 0
    value = (value << 24) | 0
    value = (value << 20) | rate
    value = (value << 3) | 1
    value = (value << 5) | (depth - 1)
    value = (value << 36) | 0
    raw = value.to_bytes(18, "big")
    block = bytes([0x80]) + len(raw).to_bytes(3, "big") + raw
    return b"fLaC" + block


def _mp3_frame(kbps_index: int, *, version_bits: int = 3, rate_index: int = 0) -> bytes:
    word = 0xFFE00000
    word |= version_bits << 19
    word |= 1 << 17
    word |= 1 << 16
    word |= kbps_index << 12
    word |= rate_index << 10
    if version_bits == 3:
        kbps = _MPEG1_L3[kbps_index]
        rate = (44100, 48000, 32000)[rate_index]
        scale = 144
    else:
        kbps = _MPEG2_L3[kbps_index]
        rate = (22050, 24000, 16000)[rate_index]
        scale = 72
    length = int(scale * kbps * 1000 / rate)
    return word.to_bytes(4, "big") + b"\x00" * (length - 4)


def _stamp(frame: bytes, tag: bytes) -> bytes:
    raw = bytearray(frame)
    raw[36:40] = tag
    return bytes(raw)


def _mp3(*indexes: int, tag: bytes = b"", version_bits: int = 3, rate_index: int = 0) -> bytes:
    frames = [_mp3_frame(index, version_bits=version_bits, rate_index=rate_index) for index in indexes]
    if tag:
        frames[0] = _stamp(frames[0], tag)
    return b"".join(frames)


def _box(kind: bytes, payload: bytes) -> bytes:
    return (len(payload) + 8).to_bytes(4, "big") + kind + payload


def _esds(config: bytes) -> bytes:
    dsi = bytes([0x05, len(config)]) + config
    dec_body = bytes([0x40, 0x15, 0, 0, 0]) + b"\x00" * 8 + dsi
    dec = bytes([0x04, len(dec_body)]) + dec_body
    es_body = b"\x00\x01\x00" + dec
    es = bytes([0x03, len(es_body)]) + es_body
    return _box(b"esds", b"\x00\x00\x00\x00" + es)


def _m4a(coding: bytes, rate: int = 44100, depth: int = 16, config: bytes = b"") -> bytes:
    children = _esds(config) if config else b""
    payload = b"\x00" * 6 + b"\x00\x01" + b"\x00" * 8
    payload += (2).to_bytes(2, "big") + depth.to_bytes(2, "big") + b"\x00\x00\x00\x00"
    payload += (rate << 16).to_bytes(4, "big") + children
    entry = _box(coding, payload)
    stsd = _box(b"stsd", b"\x00\x00\x00\x00" + (1).to_bytes(4, "big") + entry)
    moov = _box(b"moov", _box(b"trak", _box(b"mdia", _box(b"minf", _box(b"stbl", stsd)))))
    ftyp = _box(b"ftyp", b"M4A \x00\x00\x00\x00M4A ")
    return ftyp + moov


def _judge(data: bytes, suffix: str, player: str = "club") -> tuple[str, list[str]]:
    facts = player_compat.inspect_bytes(data, suffix)
    verdict, reasons, _fix = player_compat.judge(facts, player_compat.PROFILES[player], suffix)
    return verdict, reasons


def _point(conn: sqlite3.Connection, asset_id: int, path: Path, *, name: str, file_name: str | None = None) -> None:
    conn.execute(
        "INSERT INTO asset (id, name, artist, file_name, portable_id, is_missing) VALUES (?, ?, ?, ?, ?, 0)",
        (asset_id, name, "DJ", file_name or path.name, str(path)),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


class HeaderTests(unittest.TestCase):
    """Each refusal, and the files a cited manual allows."""

    def test_pcm_wav_aiff_and_cbr_mp3_pass_the_club_profile(self) -> None:
        for data, suffix in (
            (_wav(), ".wav"),
            (_wav(48000, 24), ".wav"),
            (_aiff(), ".aiff"),
            (_mp3(9, 9, tag=b"Info"), ".mp3"),
            (_mp3(9, 9), ".mp3"),
        ):
            verdict, reasons = _judge(data, suffix)
            self.assertEqual(verdict, "will_play", (suffix, reasons))
            self.assertEqual(reasons, [])

    def test_low_bitrate_mp3_is_not_a_refusal_when_the_manual_allows_it(self) -> None:
        """128 kbps is inside every cited MPEG-1 row. No manual sets a 192 floor."""
        verdict, reasons = _judge(_mp3(9, 9), ".mp3", "cdj-3000")
        self.assertEqual((verdict, reasons), ("will_play", []))
        floor = next(rule for rule in player_compat.PROFILES["club"].codecs if rule.kind == "mp3")
        self.assertEqual(floor.min_kbps, 32)
        self.assertLess(floor.min_kbps, 192)

    def test_wav_extensible_32_bit_float_and_high_rate(self) -> None:
        guid = bytes.fromhex("0100000000001000800000aa00389b71")
        verdict, reasons = _judge(_wav(tag=0xFFFE, guid=guid), ".wav")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("wav_extensible", reasons)
        verdict, reasons = _judge(_wav(bits=32, tag=3), ".wav")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("wav_float", reasons)
        verdict, reasons = _judge(_wav(bits=32, tag=1), ".wav")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("bit_depth", reasons)
        verdict, reasons = _judge(_wav(96000, 24), ".wav", "cdj-3000")
        self.assertEqual(verdict, "will_play", reasons)
        verdict, reasons = _judge(_wav(96000, 24), ".wav", "club")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("sample_rate", reasons)
        verdict, reasons = _judge(_wav(192000, 24), ".wav", "cdj-3000")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("sample_rate", reasons)

    def test_aiff_c_is_refused_and_plain_aiff_passes(self) -> None:
        verdict, reasons = _judge(_aiff(b"AIFC", compression=b"NONE"), ".aiff")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("aiff_c", reasons)
        verdict, reasons = _judge(_aiff(b"AIFC", compression=b"fl32"), ".aiff")
        self.assertIn("aiff_float", reasons)

    def test_flac_and_alac_follow_the_manual_that_lists_them(self) -> None:
        flac = _flac()
        alac = _m4a(b"alac")
        self.assertEqual(_judge(flac, ".flac", "cdj-2000nxs")[0], "wont_play")
        self.assertIn("format_not_listed", _judge(flac, ".flac", "cdj-2000nxs")[1])
        self.assertEqual(_judge(flac, ".flac", "cdj-2000nxs2")[0], "will_play")
        self.assertEqual(_judge(flac, ".flac", "club")[0], "wont_play")
        self.assertEqual(_judge(alac, ".m4a", "cdj-3000")[0], "will_play")
        self.assertEqual(_judge(alac, ".m4a", "xdj-xz")[0], "wont_play")
        self.assertEqual(_judge(alac, ".m4a", "xdj-1000mk2")[0], "will_play")
        self.assertEqual(_judge(_flac(96000, 24), ".flac", "xdj-1000mk2")[0], "wont_play")
        self.assertEqual(_judge(_flac(96000, 24), ".flac", "cdj-2000nxs2")[0], "will_play")

    def test_aac_lc_passes_and_he_aac_and_drm_do_not(self) -> None:
        lc = _m4a(b"mp4a", config=bytes.fromhex("1210"))
        he = _m4a(b"mp4a", config=bytes.fromhex("2a10"))
        self.assertEqual(_judge(lc, ".m4a")[0], "will_play")
        verdict, reasons = _judge(he, ".m4a")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("he_aac", reasons)
        verdict, reasons = _judge(lc, ".m4p")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("drm", reasons)
        verdict, reasons = _judge(_m4a(b"drms"), ".m4a")
        self.assertIn("drm", reasons)
        bare = _m4a(b"mp4a")
        verdict, reasons = _judge(bare, ".m4a")
        self.assertEqual(verdict, "check_first")
        self.assertIn("aac_unreadable", reasons)
        self.assertNotEqual(verdict, "will_play")

    def test_extension_mismatch_and_vbr_without_xing(self) -> None:
        verdict, reasons = _judge(_mp3(9, 9), ".wav")
        self.assertEqual(verdict, "wont_play")
        self.assertIn("extension_mismatch", reasons)
        verdict, reasons = _judge(_mp3(9, 14), ".mp3")
        self.assertEqual(verdict, "check_first")
        self.assertEqual(reasons, ["vbr_no_xing"])
        verdict, reasons = _judge(_mp3(9, 14, tag=b"Xing"), ".mp3")
        self.assertEqual(verdict, "will_play", reasons)

    def test_32_khz_mp3_fails_the_cdj_3000_and_passes_the_nxs2(self) -> None:
        data = _mp3(9, 9, rate_index=2)
        self.assertEqual(_judge(data, ".mp3", "cdj-3000")[0], "wont_play")
        self.assertIn("sample_rate", _judge(data, ".mp3", "cdj-3000")[1])
        self.assertEqual(_judge(data, ".mp3", "cdj-2000nxs2")[0], "will_play")
        self.assertEqual(_judge(data, ".mp3", "club")[0], "wont_play")

    def test_unreadable_files_are_unknown_and_never_will_play(self) -> None:
        for data, suffix in ((b"", ".wav"), (b"RIFF", ".wav"), (b"not-audio!!", ".bin"), (b"\x00" * 16, ".wav")):
            verdict, _reasons = _judge(data, suffix)
            self.assertIn(verdict, {"unknown", "wont_play"})
            self.assertNotEqual(verdict, "will_play")
        self.assertEqual(_judge(b"", ".wav")[0], "unknown")
        self.assertEqual(_judge(b"not-audio!!", ".bin")[0], "unknown")

    def test_club_profile_records_why_it_is_stricter(self) -> None:
        notes = player_compat.PROFILES["club"].notes
        for code in (
            "club_flac",
            "club_alac",
            "club_mp3_rate",
            "club_mp3_mpeg2",
            "club_wav_rate",
            "club_aac_rate",
            "club_exfat",
        ):
            self.assertIn(code, notes)
        wav = next(rule for rule in player_compat.PROFILES["club"].codecs if rule.kind == "wav")
        self.assertEqual(set(wav.rates), {44100, 48000})
        self.assertNotIn("flac", {rule.kind for rule in player_compat.PROFILES["club"].codecs})
        self.assertIn("exFAT", player_compat.PROFILES["club"].filesystems_absent)
        self.assertNotIn("exFAT", player_compat.PROFILES["cdj-3000"].filesystems_absent)
        self.assertIn("DRI1625B", [item.code for item in player_compat.PROFILES["xdj-xz"].sources])
        self.assertIn("DRI1052", [item.code for item in player_compat.PROFILES["cdj-2000nxs"].sources])
        self.assertIn("DRI1290A", [item.code for item in player_compat.PROFILES["cdj-2000nxs2"].sources])
        page = Path(__file__).resolve().parents[1] / "static" / "index.html"
        html = page.read_text(encoding="utf-8")
        for player_id in player_compat.PLAYER_IDS:
            self.assertIn(f'value="{player_id}"', html)


class ScanTests(unittest.TestCase):
    """The library scan reads headers and writes nothing."""

    def test_crate_scan_names_reasons_and_leaves_files_alone(self) -> None:
        with TempLibrary() as fixture:
            music = fixture.root / "music"
            music.mkdir()
            wav = music / "ok.wav"
            wav.write_bytes(_wav())
            bad = music / "wide.wav"
            bad.write_bytes(_wav(tag=0xFFFE, guid=bytes.fromhex("0100000000001000800000aa00389b71")))
            named = music / "really.wav"
            named.write_bytes(_mp3(9, 9))
            before_audio = {path.name: _digest(path) for path in music.iterdir()}
            before_names = sorted(path.name for path in fixture.root.iterdir())
            with closing(sqlite3.connect(fixture.db)) as conn:
                _point(conn, 10, wav, name="Clean", file_name="Music\\ok.wav")
                _point(conn, 11, bad, name="Wide")
                _point(conn, 12, named, name="Mislabeled")
                conn.execute(
                    "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Friday', 1, 1)"
                )
                conn.execute("INSERT INTO location_container (id, container_id, location_id) VALUES (50, 5, 1)")
                conn.execute("INSERT INTO container_asset (asset_id, location_container_id) VALUES (10, 50)")
                conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (11, 5)")
                conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (12, 5)")
                conn.commit()
            before_db = _digest(fixture.db)
            report = player_compat.scan(fixture.db, library.LIBRARY_SPACE, 5, "club", "crate")
            by_id = {row["id"]: row for row in report["tracks"]}
            self.assertEqual(by_id[10]["verdict"], "will_play")
            self.assertEqual(by_id[10]["file"], "ok.wav")
            self.assertNotIn("/", str(by_id[10]["file"]))
            self.assertNotIn("\\", str(by_id[10]["file"]))
            self.assertEqual(by_id[11]["verdict"], "wont_play")
            self.assertIn("wav_extensible", by_id[11]["reasons"])
            self.assertEqual(by_id[12]["verdict"], "wont_play")
            self.assertIn("extension_mismatch", by_id[12]["reasons"])
            self.assertTrue(report["read_only"])
            self.assertEqual(report["scope"], "crate")
            self.assertEqual({path.name: _digest(path) for path in music.iterdir()}, before_audio)
            self.assertEqual(_digest(fixture.db), before_db)
            self.assertEqual(sorted(path.name for path in fixture.root.iterdir()), before_names)

    def test_missing_offline_and_empty_library_stay_unknown(self) -> None:
        with TempLibrary() as fixture:
            music = fixture.root / "music"
            music.mkdir()
            empty = music / "empty.wav"
            empty.write_bytes(b"")
            with closing(sqlite3.connect(fixture.db)) as conn:
                _point(conn, 10, music / "gone.wav", name="Gone")
                _point(conn, 11, empty, name="Empty")
                _point(conn, 12, Path("/Volumes/STICK/track.wav"), name="Away")
                conn.execute(
                    "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (8, 1, 'Empty', 1, 1)"
                )
                conn.commit()
            with mock.patch("player_compat.volumes.absent_volume", side_effect=lambda stored, mounts=None: object() if "STICK" in stored else None):
                report = player_compat.scan(fixture.db, library.LIBRARY_SPACE, scope="library")
            by_name = {row["name"]: row for row in report["tracks"]}
            self.assertEqual(by_name["Gone"]["verdict"], "unknown")
            self.assertIn("missing", by_name["Gone"]["reasons"])
            self.assertEqual(by_name["Empty"]["verdict"], "unknown")
            self.assertIn("empty", by_name["Empty"]["reasons"])
            self.assertEqual(by_name["Away"]["verdict"], "unknown")
            self.assertIn("offline", by_name["Away"]["reasons"])
            for row in report["tracks"]:
                if row["verdict"] == "will_play":
                    self.fail(row["name"])
            empty_report = player_compat.scan(fixture.db, library.LIBRARY_SPACE, 8, scope="crate")
            self.assertEqual(empty_report["tracks"], [])
            self.assertEqual(empty_report["counts"]["wont_play"], 0)

    @unittest.skipUnless(hasattr(os, "symlink"), "symlinks are not available")
    def test_symlink_to_a_good_wav_passes_and_a_dangling_link_is_unknown(self) -> None:
        with TempLibrary() as fixture:
            music = fixture.root / "music"
            music.mkdir()
            target = music / "tone.wav"
            target.write_bytes(_wav())
            link = music / "alias.wav"
            dangling = music / "dangling.wav"
            try:
                os.symlink(target, link)
                os.symlink(music / "missing.wav", dangling)
            except (OSError, NotImplementedError):
                self.skipTest("symlinks are not available")
            with closing(sqlite3.connect(fixture.db)) as conn:
                _point(conn, 10, link, name="Alias")
                _point(conn, 11, dangling, name="Dangle")
                conn.execute(
                    "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (6, 1, 'Links', 1, 1)"
                )
                conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (10, 6)")
                conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (11, 6)")
                conn.commit()
            report = player_compat.scan(fixture.db, library.LIBRARY_SPACE, 6)
            by_name = {row["name"]: row for row in report["tracks"]}
            self.assertEqual(by_name["Alias"]["verdict"], "will_play")
            self.assertEqual(by_name["Dangle"]["verdict"], "unknown")
            self.assertEqual(_digest(target), hashlib.sha256(_wav()).hexdigest())

    def test_unknown_player_and_missing_crate_are_400(self) -> None:
        with TempLibrary() as fixture:
            with self.assertRaises(library.LibraryError) as caught:
                player_compat.scan(fixture.db, library.LIBRARY_SPACE, player="xdj-900")
            self.assertEqual(caught.exception.status, 400)
            with self.assertRaises(library.LibraryError) as caught:
                player_compat.scan(fixture.db, library.LIBRARY_SPACE, scope="crate")
            self.assertEqual(caught.exception.status, 400)
            self.assertEqual(caught.exception.message, player_compat.NEEDS_CRATE)
            with self.assertRaises(library.LibraryError) as caught:
                player_compat.scan(fixture.db, library.LIBRARY_SPACE, 999, scope="crate")
            self.assertEqual(caught.exception.status, 404)
            with self.assertRaises(library.LibraryError) as caught:
                player_compat.scan(fixture.root / "none" / "master.sqlite", library.LIBRARY_SPACE)
            self.assertEqual(caught.exception.status, 404)


class ApiTests(unittest.TestCase):
    """``GET /api/player-compat`` does not write."""

    def _get(self, query: str) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/player-compat{query}") as response:
                    return response.status, json.loads(response.read().decode("utf-8"))
            except urllib.error.HTTPError as error:
                with error:
                    return error.code, json.loads(error.read().decode("utf-8"))
        finally:
            httpd.shutdown()
            httpd.server_close()
            thread.join(timeout=3)

    def test_routes(self) -> None:
        with TempLibrary() as fixture:
            path = fixture.root / "ok.wav"
            path.write_bytes(_wav())
            with closing(sqlite3.connect(fixture.db)) as conn:
                _point(conn, 10, path, name="Clean")
                conn.execute(
                    "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Friday', 1, 1)"
                )
                conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (10, 5)")
                conn.commit()
            before = _digest(fixture.db)
            status, body = self._get("?crate=5&player=cdj-3000&scope=crate")
            self.assertEqual(status, 200)
            self.assertEqual(body["player"], "cdj-3000")
            self.assertTrue(body["read_only"])
            match = next(row for row in body["tracks"] if row["id"] == 10)
            self.assertEqual(match["verdict"], "will_play")
            status, body = self._get("?scope=crate")
            self.assertEqual((status, body.get("code")), (400, "player_needs_crate"))
            status, body = self._get("?player=nope")
            self.assertEqual((status, body.get("code")), (400, "player_unknown"))
            status, _body = self._get("?crate=999&scope=crate")
            self.assertEqual(status, 404)
            self.assertEqual(_digest(fixture.db), before)

    def test_sentences_have_codes_in_every_locale(self) -> None:
        self.assertEqual(error_codes.ERROR_CODES[player_compat.NEEDS_CRATE], "player_needs_crate")
        self.assertEqual(error_codes.ERROR_CODES[player_compat.UNKNOWN_PLAYER], "player_unknown")
        root = Path(__file__).resolve().parent.parent
        for locale in ("en", "es"):
            catalog = json.loads((root / "locales" / f"{locale}.json").read_text(encoding="utf-8"))
            self.assertTrue(catalog.get("error.player_needs_crate"))
            self.assertTrue(catalog.get("error.player_unknown"))


class CliTests(unittest.TestCase):
    def test_main_prints_json_and_does_not_write(self) -> None:
        with TempLibrary() as fixture:
            before = _digest(fixture.db)
            with mock.patch("sys.stdout") as out:
                self.assertEqual(player_compat.main(["--database", str(fixture.db), "--scope", "library"]), 0)
            printed = "".join(call.args[0] for call in out.write.call_args_list)
            payload = json.loads(printed)
            self.assertEqual(payload["player"], "club")
            self.assertTrue(payload["read_only"])
            self.assertEqual(_digest(fixture.db), before)
