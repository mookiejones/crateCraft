"""Tempo drift and live-recording flags (#207), read-only.

Window BPM tests feed synthetic click envelopes to ``tempo_drift.window_bpms``.
Scan tests write those clicks to WAV files in a temporary library and decode
them with the real waveform decoders. The library file and the audio files
must be unchanged.
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
from unittest import mock

import numpy as np

import error_codes
import library
import server
import tempo_drift
from tests.fixture import TempLibrary

RATE = 44100


def _clicks(segments: list[tuple[float, float]], *, rate: int = RATE) -> np.ndarray:
    """Concatenate constant-BPM click trains.

    Args:
        segments: ``(seconds, bpm)`` pairs.
        rate: Sample rate.

    Returns:
        Mono float samples in ``[-1, 1]``.
    """
    parts: list[np.ndarray] = []
    pulse = max(1, int(rate * 0.004))
    for seconds, bpm in segments:
        n = int(seconds * rate)
        sig = np.zeros(n, dtype=np.float32)
        interval = max(1, int(round(rate * 60.0 / bpm)))
        for start in range(0, n, interval):
            sig[start : start + pulse] = 1.0
        parts.append(sig)
    return np.concatenate(parts)


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


def _point(
    conn: sqlite3.Connection,
    asset_id: int,
    path: Path,
    *,
    name: str | None = None,
    artist: str = "DJ",
    comments: str = "",
    pending: int = 0,
) -> None:
    conn.execute(
        "INSERT INTO asset (id, name, artist, comments, file_name, portable_id, "
        "pending_tempo_map_analysis, is_missing) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
        (asset_id, name or path.stem, artist, comments, path.name, str(path), pending),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


def _crate(conn: sqlite3.Connection, crate_id: int, *asset_ids: int) -> None:
    conn.execute(
        "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (?, 1, 'Gig', 1, 1)",
        (crate_id,),
    )
    for asset_id in asset_ids:
        conn.execute(
            "INSERT INTO container_asset (asset_id, container_id) VALUES (?, ?)",
            (asset_id, crate_id),
        )


class LiveTests(unittest.TestCase):
    """Live names need a word boundary. Alive and Olive stay quiet."""

    def test_live_phrases(self) -> None:
        self.assertTrue(tempo_drift.looks_live("Live at Paris"))
        self.assertTrue(tempo_drift.looks_live("Song (Live)"))
        self.assertTrue(tempo_drift.looks_live("LIVE FROM NYC"))
        self.assertTrue(tempo_drift.looks_live("bootleg"))
        self.assertTrue(tempo_drift.looks_live("Concert Mix"))
        self.assertTrue(tempo_drift.looks_live("Studio", "DJ", "recorded live"))
        self.assertTrue(tempo_drift.looks_live("live in Berlin"))

    def test_alive_is_not_live(self) -> None:
        self.assertFalse(tempo_drift.looks_live("Alive"))
        self.assertFalse(tempo_drift.looks_live("Olive"))
        self.assertFalse(tempo_drift.looks_live("livelihood"))
        self.assertFalse(tempo_drift.looks_live("Liverpool"))
        self.assertFalse(tempo_drift.looks_live("Studio Mix"))


class FoldTests(unittest.TestCase):
    def test_octave(self) -> None:
        self.assertEqual(tempo_drift.fold_bpm(60.0), 120.0)
        self.assertEqual(tempo_drift.fold_bpm(240.0), 120.0)
        self.assertEqual(tempo_drift.fold_bpm(90.0), 90.0)
        self.assertEqual(tempo_drift.fold_bpm(140.0), 70.0)


class GridTests(unittest.TestCase):
    def test_constant_grid_has_no_spread(self) -> None:
        markers = [
            {"position": 0.0, "beats": 32},
            {"position": 16.0, "bpm": 120.0},
        ]
        self.assertEqual(tempo_drift.implied_bpms(markers), [120.0, 120.0])
        self.assertEqual(tempo_drift.grid_spread(markers), 0.0)

    def test_flexible_grid_spreads(self) -> None:
        markers = [
            {"position": 0.0, "beats": 16},
            {"position": 8.0, "beats": 16},
            {"position": 18.0, "bpm": 96.0},
        ]
        spread = tempo_drift.grid_spread(markers)
        self.assertGreaterEqual(spread, tempo_drift.GRID_SPREAD)
        self.assertGreater(spread, 20.0)


class WindowTests(unittest.TestCase):
    def test_constant_click_is_not_drifting(self) -> None:
        env = tempo_drift.collect_envelope(_chunks(_clicks([(24.0, 120.0)])))
        bpms = tempo_drift.window_bpms(env.hops)
        self.assertGreaterEqual(len(bpms), tempo_drift.MIN_WINDOWS)
        for bpm in bpms:
            self.assertAlmostEqual(bpm, 120.0, delta=2.0)
        self.assertFalse(tempo_drift.is_drifting(bpms))

    def test_click_that_drops_is_drifting(self) -> None:
        env = tempo_drift.collect_envelope(_chunks(_clicks([(12.0, 120.0), (12.0, 90.0)])))
        bpms = tempo_drift.window_bpms(env.hops)
        self.assertGreaterEqual(len(bpms), tempo_drift.MIN_WINDOWS)
        self.assertTrue(tempo_drift.is_drifting(bpms))
        self.assertGreaterEqual(max(bpms) - min(bpms), tempo_drift.DRIFT_BPM)

    def test_sixty_vs_one_twenty_is_not_drift(self) -> None:
        """Octave fold: a 60 BPM click is the same tempo as 120."""
        env = tempo_drift.collect_envelope(_chunks(_clicks([(12.0, 60.0), (12.0, 120.0)])))
        bpms = tempo_drift.window_bpms(env.hops)
        self.assertGreaterEqual(len(bpms), tempo_drift.MIN_WINDOWS)
        self.assertFalse(tempo_drift.is_drifting(bpms))

    def test_decode_stops_after_the_cap(self) -> None:
        pulled = 0

        def endless() -> Iterator[np.ndarray]:
            nonlocal pulled
            block = _clicks([(1.0, 120.0)])
            while True:
                pulled += 1
                if pulled > 2 * tempo_drift.MAX_SECONDS + 5:
                    raise AssertionError("read past the sample")
                yield block

        found = tempo_drift.collect_envelope(endless())
        self.assertLessEqual(found.samples, int(tempo_drift.MAX_SECONDS * RATE) + RATE)
        self.assertGreater(found.samples, 0)


class ScanTests(unittest.TestCase):
    """The scan decodes real files and writes nothing."""

    def setUp(self) -> None:
        self.fixture = TempLibrary().__enter__()
        self.music = self.fixture.root / "music"
        self.music.mkdir()
        self.steady = _wav(self.music / "steady.wav", _clicks([(24.0, 120.0)]))
        self.wander = _wav(self.music / "wander.wav", _clicks([(12.0, 120.0), (12.0, 90.0)]))
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 10, self.steady, name="Studio Mix")
            _point(conn, 11, self.wander, name="Old Tape")
            _point(conn, 12, self.steady, name="Alive")
            _point(conn, 13, self.steady, name="Song (Live)")
            _point(conn, 14, self.steady, name="Pending", pending=1)
            _point(conn, 15, self.fixture.root / "unplugged" / "gone.mp3", name="Missing")
            (self.music / "notes.txt").write_bytes(b"hi")
            _point(conn, 16, self.music / "notes.txt", name="Notes")
            _crate(conn, 5, 10, 11, 12, 13, 14, 15, 16)
            conn.commit()
        self.db_before = _digest(self.fixture.db)
        self.wav_before = {path: _digest(path) for path in (self.steady, self.wander)}

    def tearDown(self) -> None:
        self.fixture.__exit__(None, None, None)

    def test_flags_drifting_live_and_pending(self) -> None:
        report = tempo_drift.scan(self.fixture.db, library.LIBRARY_SPACE, 5)
        by_id = {int(row["id"]): row for row in report["flags"]}  # type: ignore[union-attr]
        self.assertNotIn(10, by_id)
        self.assertNotIn(12, by_id)
        self.assertIn("drifting", by_id[11]["reasons"])
        self.assertIn("live", by_id[13]["reasons"])
        self.assertIn("pending_map", by_id[14]["reasons"])
        self.assertEqual(report["not_found"], 1)
        self.assertEqual(report["unchecked"], 1)
        self.assertGreaterEqual(int(report["checked"]), 1)
        self.assertEqual(_digest(self.fixture.db), self.db_before)
        for path, digest in self.wav_before.items():
            self.assertEqual(_digest(path), digest)

    def test_skips_an_already_mapped_grid(self) -> None:
        mapped = [
            {"position": 0.0, "beats": 16},
            {"position": 8.0, "beats": 16},
            {"position": 18.0, "bpm": 96.0},
        ]
        with mock.patch(
            "tempo_drift.tags.read_serato_tags",
            return_value={"beatgrid": mapped},
        ):
            report = tempo_drift.scan(self.fixture.db, library.LIBRARY_SPACE, 5)
        ids = [int(row["id"]) for row in report["flags"]]  # type: ignore[union-attr]
        self.assertEqual(ids, [])
        self.assertGreaterEqual(int(report["mapped"]), 1)

    def test_crate_not_in_space(self) -> None:
        with self.assertRaises(library.LibraryError) as caught:
            tempo_drift.scan(self.fixture.db, library.LIBRARY_SPACE, 999)
        self.assertEqual(caught.exception.status, 404)

    def test_missing_library(self) -> None:
        with self.assertRaises(library.LibraryError) as caught:
            tempo_drift.scan(self.fixture.root / "none" / "master.sqlite", library.LIBRARY_SPACE)
        self.assertEqual(caught.exception.status, 404)

    @unittest.skipUnless(hasattr(os, "symlink"), "symlinks are not available")
    def test_dangling_symlink_is_not_found(self) -> None:
        try:
            os.symlink(self.music / "nothing.wav", self.music / "dangling.wav")
        except (OSError, NotImplementedError):
            self.skipTest("symlinks are not available")
        with closing(sqlite3.connect(self.fixture.db)) as conn:
            _point(conn, 20, self.music / "dangling.wav", name="Dangle")
            conn.execute("INSERT INTO container_asset (asset_id, container_id) VALUES (20, 5)")
            conn.commit()
        report = tempo_drift.scan(self.fixture.db, library.LIBRARY_SPACE, 5)
        self.assertEqual(report["not_found"], 2)


class ApiTests(unittest.TestCase):
    """``GET /api/tempo-drift`` needs a crate."""

    def _get(self, query: str) -> tuple[int, dict[str, object]]:
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            try:
                with urllib.request.urlopen(f"http://{host!s}:{port}/api/tempo-drift{query}") as response:
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
            path = _wav(fixture.root / "wander.wav", _clicks([(12.0, 120.0), (12.0, 90.0)]))
            with closing(sqlite3.connect(fixture.db)) as conn:
                _point(conn, 10, path, name="Old Tape")
                _crate(conn, 5, 10)
                conn.commit()
            before = _digest(fixture.db)
            status, body = self._get("?crate=5")
            self.assertEqual(status, 200)
            self.assertEqual([row["id"] for row in body["flags"]], [10])  # type: ignore[index, union-attr]
            self.assertIn("drifting", body["flags"][0]["reasons"])  # type: ignore[index]
            status, body = self._get("")
            self.assertEqual((status, body["code"]), (400, "tempo_needs_crate"))
            status, _body = self._get("?crate=999")
            self.assertEqual(status, 404)
            status, _body = self._get("?crate=x")
            self.assertEqual(status, 400)
            self.assertEqual(_digest(fixture.db), before)

    def test_sentence_has_a_code_in_every_locale(self) -> None:
        self.assertEqual(error_codes.ERROR_CODES[tempo_drift.NEEDS_CRATE], "tempo_needs_crate")
        root = Path(__file__).resolve().parent.parent
        for locale in ("en", "es"):
            catalog = json.loads((root / "locales" / f"{locale}.json").read_text(encoding="utf-8"))
            self.assertTrue(catalog.get("error.tempo_needs_crate"))


class CliTests(unittest.TestCase):
    def test_main(self) -> None:
        with TempLibrary() as fixture:
            with mock.patch("sys.stdout") as out:
                self.assertEqual(tempo_drift.main(["--database", str(fixture.db)]), 0)
            printed = "".join(call.args[0] for call in out.write.call_args_list)
            self.assertIn("flags", json.loads(printed))
            with mock.patch("sys.stderr"):
                self.assertEqual(tempo_drift.main(["--database", str(fixture.root / "none.sqlite")]), 1)


if __name__ == "__main__":
    unittest.main()
