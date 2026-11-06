"""Fake-320 / true bitrate check (#36), read-only.

The spectrum tests feed synthetic noise, low-passed at a known frequency, to
``bitrate_check.spectrum_cutoff``. The scan tests write that noise to WAV files
in a temporary library and decode them with the real waveform decoders. The
library file and the audio files must be unchanged.
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
import wave
from collections.abc import Iterator
from contextlib import closing
from http.server import ThreadingHTTPServer
from pathlib import Path
from typing import cast
from unittest import mock

import numpy as np

import bitrate_check
import error_codes
import library
import server
from tests.fixture import TempLibrary

RATE = 44100


def _noise(seconds: float, cutoff: float | None, *, rate: int = RATE, seed: int = 7, tilt: float = 0.0) -> np.ndarray:
    """Return white noise cut off above ``cutoff`` Hz, or full band for None.

    ``tilt`` lowers the level by that many dB per kHz above 10 kHz, a gentle
    roll-off like a dark master, with no cliff.
    """
    rng = np.random.default_rng(seed)
    samples = rng.standard_normal(int(seconds * rate))
    spectrum = np.fft.rfft(samples)
    freqs = np.fft.rfftfreq(len(samples), 1 / rate)
    if cutoff is not None:
        spectrum[freqs > cutoff] = 0
    if tilt:
        drop = np.clip((freqs - 10_000) / 1000, 0, None) * tilt
        spectrum *= 10 ** (-drop / 20)
    out = np.fft.irfft(spectrum, n=len(samples))
    return (0.25 * out / np.max(np.abs(out))).astype(np.float32)


def _chunks(samples: np.ndarray, size: int = 16384) -> Iterator[np.ndarray]:
    for start in range(0, len(samples), size):
        yield samples[start : start + size]


def _wav(path: Path, samples: np.ndarray, *, rate: int = RATE) -> Path:
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes((samples * 32767).astype("<i2").tobytes())
    return path


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class CutoffTests(unittest.TestCase):
    """The cliff in the spectrum gives the encoder's low-pass frequency."""

    def test_finds_each_lowpass(self) -> None:
        for cutoff in (16_000, 17_500, 19_000, 19_700, 20_400):
            with self.subTest(cutoff=cutoff):
                found = bitrate_check.spectrum_cutoff(_chunks(_noise(12, cutoff)))
                self.assertIsNotNone(found.cutoff_hz)
                self.assertAlmostEqual(found.cutoff_hz or 0, cutoff, delta=250)
                self.assertGreater(found.frames, 0)

    def test_full_band_has_no_cutoff(self) -> None:
        self.assertIsNone(bitrate_check.spectrum_cutoff(_chunks(_noise(12, None))).cutoff_hz)

    def test_gentle_rolloff_is_not_a_cliff(self) -> None:
        """A dark master falls 4 dB per kHz: 2 dB per 500 Hz is not a cut."""
        self.assertIsNone(bitrate_check.spectrum_cutoff(_chunks(_noise(12, None, tilt=4.0))).cutoff_hz)

    def test_a_cut_below_the_search_range_is_ignored(self) -> None:
        """A low-pass at 8 kHz is music, not an encoder's high-frequency cut."""
        self.assertIsNone(bitrate_check.spectrum_cutoff(_chunks(_noise(12, 8_000))).cutoff_hz)

    def test_silence(self) -> None:
        found = bitrate_check.spectrum_cutoff(_chunks(np.zeros(RATE * 5, dtype=np.float32)))
        self.assertEqual(found, (None, 0, RATE * 5))
        self.assertEqual(bitrate_check.spectrum_cutoff(iter(())), (None, 0, 0))

    def test_too_short(self) -> None:
        found = bitrate_check.spectrum_cutoff(_chunks(_noise(0.1, 16_000)))
        self.assertEqual((found.cutoff_hz, found.frames), (None, 0))

    def test_only_a_sample_of_the_track_is_read(self) -> None:
        """Reading stops after MAX_FRAMES analysed frames, so a long file is not read to the end."""
        pulled = 0
        needed = bitrate_check.MAX_FRAMES * bitrate_check.STRIDE * bitrate_check.FFT_SIZE / RATE

        def endless() -> Iterator[np.ndarray]:
            nonlocal pulled
            block = _noise(1, 16_000)
            while True:
                pulled += 1
                # Fail instead of hanging if reading does not stop.
                if pulled > 2 * needed:
                    raise AssertionError("read past the sample")
                yield block

        found = bitrate_check.spectrum_cutoff(endless())
        self.assertEqual(found.frames, bitrate_check.MAX_FRAMES)
        # One frame in STRIDE is analysed, so the sample spans the whole stretch.
        self.assertGreater(pulled, needed - 3)
        self.assertLess(pulled, needed + 3)


class EstimateTests(unittest.TestCase):
    """The cutoff maps to the bitrate an encoder would use."""

    def test_estimate(self) -> None:
        cases = [(15_000, 128), (16_000, 128), (17_000, 160), (18_800, 192), (19_600, 256), (20_400, 320), (21_000, None), (None, None)]
        for cutoff, kbps in cases:
            with self.subTest(cutoff=cutoff):
                self.assertEqual(bitrate_check.estimate_kbps(cutoff), kbps)

    def test_verdict_for_lossy_files(self) -> None:
        cases = [
            (".mp3", 320_000, 16_000, "upsampled"),  # 320 claimed, 128 real
            (".MP3", 320_000, 17_000, "upsampled"),  # 320 claimed, 160 real
            (".mp3", 192_000, 16_000, "upsampled"),  # exactly 1.5 times
            (".mp3", 320_000, 19_600, None),  # 256 vs 320 is too close to tell
            (".mp3", 128_000, 16_000, None),  # honest 128
            (".mp3", 160_000, 15_000, None),  # 160 vs 128 is under 1.5 times
            (".m4a", 320_000, 16_000, "upsampled"),
            (".mp3", 320_000, None, None),  # full band
            (".mp3", None, 16_000, None),  # no stated bitrate
            (".mp3", 0, 16_000, None),
        ]
        for suffix, stated, cutoff, reason in cases:
            with self.subTest(suffix=suffix, stated=stated, cutoff=cutoff):
                self.assertEqual(bitrate_check.verdict(suffix, stated, cutoff), reason)

    def test_verdict_for_lossless_files(self) -> None:
        """A lossless file that was made from an MP3 keeps the MP3's cut."""
        for suffix in (".flac", ".wav", ".aif", ".AIFF"):
            with self.subTest(suffix=suffix):
                self.assertEqual(bitrate_check.verdict(suffix, 1_411_200, 16_000), "lossy_source")
                self.assertEqual(bitrate_check.verdict(suffix, 1_411_200, 20_400), "lossy_source")
                self.assertIsNone(bitrate_check.verdict(suffix, 1_411_200, 21_000))
                self.assertIsNone(bitrate_check.verdict(suffix, None, None))


def _point(conn: sqlite3.Connection, asset_id: int, path: Path, *, bps: int | None) -> None:
    conn.execute(
        "INSERT INTO asset (id, name, artist, file_name, portable_id, file_bit_rate, is_missing) VALUES (?, ?, 'DJ', ?, ?, ?, 0)",
        (asset_id, path.stem, path.name, str(path), bps),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


class ScanTests(unittest.TestCase):
    """The scan decodes real files and writes nothing."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        self.music = self.fixture.root / "music"
        self.music.mkdir()
        _wav(self.music / "honest.wav", _noise(8, None))
        _wav(self.music / "fromlossy.wav", _noise(8, 16_000))
        (self.music / "broken.wav").write_bytes(b"RIFF" + bytes(40))
        (self.music / "notes.txt").write_bytes(b"hi")
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 10, self.music / "honest.wav", bps=1_411_200)
            _point(conn, 11, self.music / "fromlossy.wav", bps=1_411_200)
            _point(conn, 12, self.music / "broken.wav", bps=1_411_200)
            _point(conn, 13, self.fixture.root / "unplugged" / "gone.mp3", bps=320_000)
            _point(conn, 17, self.music / "notes.txt", bps=None)
            conn.execute("INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Gig', 1, 1)")
            conn.execute("INSERT INTO container (id, parent_id, name, type, space_id) VALUES (6, 5, 'Encore', 1, 1)")
            conn.execute("INSERT INTO location_container (id, container_id, location_id) VALUES (50, 5, 1)")
            conn.execute("INSERT INTO container_asset (asset_id, location_container_id) VALUES (10, 50)")
            conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (11, 6)")
            conn.commit()

    def tearDown(self) -> None:
        self.fixture.__exit__(None, None, None)

    def _state(self) -> dict[str, str]:
        state = {path.name: _digest(path) for path in self.music.iterdir()}
        state["master.sqlite"] = _digest(self.fixture.db)
        return state

    def test_space(self) -> None:
        before = self._state()
        report = bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual(self._state(), before)
        self.assertIsNone(report["crate"])
        self.assertEqual(
            (report["checked"], report["not_found"], report["unreadable"], report["unchecked"], report["too_quiet"]),
            (2, 3, 1, 1, 0),
        )
        suspects = cast("list[dict[str, object]]", report["suspects"])
        self.assertEqual(len(suspects), 1)
        row = suspects[0]
        self.assertEqual(
            {key: row[key] for key in ("id", "name", "file", "reason", "stated_kbps", "estimated_kbps")},
            {"id": 11, "name": "fromlossy", "file": "fromlossy.wav", "reason": "lossy_source", "stated_kbps": 1411, "estimated_kbps": 128},
        )
        self.assertAlmostEqual(float(row["cutoff_hz"]), 16_000, delta=250)  # type: ignore[arg-type]
        self.assertNotIn(str(self.music), json.dumps(report))

    def test_crate_includes_subcrates(self) -> None:
        report = bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE, crate_id=5)
        self.assertEqual((report["crate"], report["checked"], report["not_found"]), (5, 2, 0))
        only_child = bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE, crate_id=6)
        self.assertEqual(only_child["checked"], 1)
        with self.assertRaises(library.LibraryError) as caught:
            bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE, crate_id=2)
        self.assertEqual(caught.exception.status, 404)

    def test_quiet_file_is_counted_not_flagged(self) -> None:
        _wav(self.music / "quiet.wav", np.zeros(RATE * 2, dtype=np.float32))
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 14, self.music / "quiet.wav", bps=1_411_200)
            conn.commit()
        report = bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual(report["too_quiet"], 1)
        self.assertNotIn(14, [row["id"] for row in report["suspects"]])  # type: ignore[index, union-attr]

    def test_48k_full_band_file_is_not_flagged(self) -> None:
        """Decoding resamples to 44.1 kHz; that filter must not look like an encoder's cut."""
        _wav(self.music / "hires.wav", _noise(8, None, rate=48_000), rate=48_000)
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 15, self.music / "hires.wav", bps=1_536_000)
            conn.commit()
        report = bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertNotIn(15, [row["id"] for row in report["suspects"]])  # type: ignore[index, union-attr]

    def test_missing_and_empty_library(self) -> None:
        with self.assertRaises(library.LibraryError) as caught:
            bitrate_check.scan(self.fixture.root / "none" / "master.sqlite", library.LIBRARY_SPACE)
        self.assertEqual(caught.exception.status, 404)
        with self.assertRaises(library.LibraryError):
            bitrate_check.scan(self.fixture.db, "Nope")
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            conn.execute("DELETE FROM space_asset")
            conn.commit()
        report = bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual((report["checked"], report["not_found"], report["suspects"]), (0, 0, []))

    @unittest.skipUnless(hasattr(os, "symlink"), "symlinks are not available")
    def test_dangling_symlink_is_not_found(self) -> None:
        try:
            os.symlink(self.music / "nothing.wav", self.music / "dangling.wav")
        except (OSError, NotImplementedError):
            self.skipTest("symlinks are not available")
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 16, self.music / "dangling.wav", bps=1_411_200)
            conn.commit()
        report = bitrate_check.scan(self.fixture.db, library.LIBRARY_SPACE)
        self.assertEqual(report["not_found"], 4)


class ApiTests(unittest.TestCase):
    """``GET /api/bitrate-check`` needs a crate."""

    def _get(self, query: str) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/bitrate-check{query}") as response:
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
            path = _wav(fixture.root / "cut.wav", _noise(6, 16_000))
            with closing(sqlite3.connect(fixture.db)) as conn:
                _point(conn, 10, path, bps=1_411_200)
                conn.execute("INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Gig', 1, 1)")
                conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (10, 5)")
                conn.commit()
            before = _digest(fixture.db)
            status, body = self._get("?crate=5")
            self.assertEqual(status, 200)
            self.assertEqual([row["id"] for row in body["suspects"]], [10])  # type: ignore[index, union-attr]
            status, body = self._get("")
            self.assertEqual((status, body["code"]), (400, "bitrate_needs_crate"))
            status, _body = self._get("?crate=999")
            self.assertEqual(status, 404)
            status, _body = self._get("?crate=x")
            self.assertEqual(status, 400)
            self.assertEqual(_digest(fixture.db), before)

    def test_sentence_has_a_code_in_every_locale(self) -> None:
        self.assertEqual(error_codes.ERROR_CODES[bitrate_check.NEEDS_CRATE], "bitrate_needs_crate")
        root = Path(__file__).resolve().parent.parent
        for locale in ("en", "es"):
            catalog = json.loads((root / "locales" / f"{locale}.json").read_text(encoding="utf-8"))
            self.assertTrue(catalog.get("error.bitrate_needs_crate"))


class CliTests(unittest.TestCase):
    def test_main(self) -> None:
        with TempLibrary() as fixture:
            with mock.patch("sys.stdout") as out:
                self.assertEqual(bitrate_check.main(["--database", str(fixture.db)]), 0)
            printed = "".join(call.args[0] for call in out.write.call_args_list)
            self.assertEqual(json.loads(printed)["not_found"], 2)
            with mock.patch("sys.stderr"):
                self.assertEqual(bitrate_check.main(["--database", str(fixture.root / "none.sqlite")]), 1)


if __name__ == "__main__":
    unittest.main()
