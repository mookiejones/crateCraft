"""Energy 1–10 written into a blank Grouping field (#74).

``score_pcm`` is pinned to silence, a Nyquist square, and two same-RMS
sines. Tags are synthetic ID3 and Vorbis blobs. Apply writes grouping
through ``safe_write`` and leaves the audio bytes alone.
"""

from __future__ import annotations

import sqlite3
import struct
import tempfile
import unittest
import wave
from contextlib import closing
from pathlib import Path
from unittest import mock

import numpy as np

import energy_level
import library
import write_queue
from tests import test_server
from tests.fixture import TempLibrary
from tests.test_tags import _flac_block, _vorbis_comment


def _frame(frame_id: bytes, body: bytes, version: int = 3) -> bytes:
    """Build one ID3 frame. ``body`` already includes the encoding byte."""
    if version == 4:
        size = bytes(((len(body) >> shift) & 0x7F) for shift in (21, 14, 7, 0))
    else:
        size = struct.pack(">I", len(body))
    return frame_id + size + b"\x00\x00" + body


def _id3(frames: bytes, version: int = 3) -> bytes:
    """Wrap frames in an ID3 header."""
    size = bytes(((len(frames) >> shift) & 0x7F) for shift in (21, 14, 7, 0))
    return b"ID3" + bytes([version, 0, 0]) + size + frames


def _txxx(desc: bytes, value: bytes, *, encoding: int = 0, version: int = 3) -> bytes:
    """One TXXX frame."""
    body = bytes([encoding]) + desc + b"\x00" + value + b"\x00"
    return _frame(b"TXXX", body, version)


def _tagged(path: Path, desc: bytes, value: bytes, *, encoding: int = 0) -> Path:
    """Write a file that is not audio and carries one energy tag."""
    path.write_bytes(_id3(_txxx(desc, value, encoding=encoding)) + b"not-audio")
    return path


def _wav(path: Path, samples: np.ndarray, *, rate: int = 44100) -> Path:
    """Write a 16-bit mono WAV."""
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(rate)
        handle.writeframes((np.asarray(samples) * 32767).astype("<i2").tobytes())
    return path


def _silence(path: Path) -> Path:
    """One second of silence."""
    return _wav(path, np.zeros(44100))


def _groupings(db: Path) -> dict[int, str | None]:
    """Return asset id to grouping."""
    with closing(sqlite3.connect(db)) as conn:
        return {int(row[0]): row[1] for row in conn.execute("SELECT id, grouping FROM asset")}


def _seed(db: Path, rows: list[tuple[int, str | None, str]], *, child: list[int] | None = None) -> None:
    """Replace tracks and put them in crate 5, or in child crate 6.

    Args:
        db: Temporary master database.
        rows: ``(id, grouping, path)``.
        child: Asset ids that belong to crate 6 instead of crate 5.
    """
    nested = set(child or [])
    with closing(sqlite3.connect(db)) as conn:
        conn.execute("DELETE FROM container_asset")
        conn.execute("DELETE FROM location_container")
        conn.execute("DELETE FROM space_asset")
        conn.execute("DELETE FROM asset")
        conn.execute("DELETE FROM container WHERE id IN (5, 6)")
        conn.execute(
            "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (5, 1, 'Gig', 1, 1)"
        )
        conn.execute(
            "INSERT INTO container (id, parent_id, name, type, space_id) VALUES (6, 5, 'Encore', 1, 1)"
        )
        conn.execute("INSERT INTO location_container (id, container_id, location_id) VALUES (50, 5, 1)")
        conn.execute("INSERT INTO location_container (id, container_id, location_id) VALUES (60, 6, 1)")
        for asset_id, grouping, stored in rows:
            conn.execute(
                "INSERT INTO asset (id, name, artist, portable_id, grouping) VALUES (?, 'T', 'A', ?, ?)",
                (asset_id, stored, grouping),
            )
            conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))
            if asset_id in nested:
                conn.execute(
                    "INSERT INTO container_asset (asset_id, container_id) VALUES (?, 6)",
                    (asset_id,),
                )
            else:
                conn.execute(
                    "INSERT INTO container_asset (asset_id, location_container_id) VALUES (?, 50)",
                    (asset_id,),
                )
        conn.commit()


class ScoreTests(unittest.TestCase):
    """The 1–10 mix of loudness and brightness."""

    def test_silence_is_1_and_nyquist_square_is_10(self) -> None:
        """Zeros score 1. A full-scale Nyquist square scores 10."""
        self.assertEqual(energy_level.score_pcm(np.zeros(16), 44100), 1)
        self.assertEqual(energy_level.score_pcm(np.array([1.0, -1.0, 1.0, -1.0]), 4), 10)
        self.assertEqual(energy_level.level_from(0, 0), 1)
        self.assertEqual(energy_level.level_from(1, 1), 10)

    def test_same_rms_brighter_sine_scores_higher(self) -> None:
        """100 Hz scores 3 and 8000 Hz scores 4 at amplitude 0.1."""
        rate = 44100
        samples = np.arange(4410) / rate
        low = energy_level.score_pcm(0.1 * np.sin(2 * np.pi * 100 * samples), rate)
        high = energy_level.score_pcm(0.1 * np.sin(2 * np.pi * 8000 * samples), rate)
        self.assertEqual(low, 3)
        self.assertEqual(high, 4)

    def test_only_the_first_15_seconds_count(self) -> None:
        """Silence after the first 15 seconds does not pull the score down."""
        burst = np.array([1.0, -1.0] * (2 * 15))
        tail = np.zeros(4 * 1000)
        self.assertEqual(energy_level.score_pcm(np.concatenate((burst, tail)), 4), 10)


class TagTests(unittest.TestCase):
    """Stored energy tags, not a decode."""

    def test_parse_accepts_a_level_and_rejects_the_rest(self) -> None:
        """``7`` and ``Energy 7`` count. 0, 11, and other words do not."""
        self.assertEqual(energy_level.parse_energy_text("7"), 7)
        self.assertEqual(energy_level.parse_energy_text("Energy 10"), 10)
        self.assertEqual(energy_level.parse_energy_text(" energy 1 "), 1)
        for text in ("0", "11", "07", "Energy 0", "warmup", ""):
            with self.subTest(text=text):
                self.assertIsNone(energy_level.parse_energy_text(text))

    def test_id3_and_vorbis_and_a_bad_value(self) -> None:
        """EnergyLevel beats Energy. A comment and an 11 are ignored."""
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            level = _tagged(folder / "level.mp3", b"EnergyLevel", b"Energy 7")
            plain = _tagged(folder / "plain.mp3", b"ENERGY", b"4", encoding=3)
            both = folder / "both.mp3"
            both.write_bytes(
                _id3(_txxx(b"Energy", b"2") + _txxx(b"EnergyLevel", b"9")) + b"x"
            )
            comment = _tagged(folder / "comment.mp3", b"Comment", b"5")
            high = _tagged(folder / "high.mp3", b"EnergyLevel", b"11")
            missing = folder / "gone.mp3"
            self.assertEqual(energy_level.read_stored_energy(level), 7)
            self.assertEqual(energy_level.read_stored_energy(plain), 4)
            self.assertEqual(energy_level.read_stored_energy(both), 9)
            self.assertIsNone(energy_level.read_stored_energy(comment))
            self.assertIsNone(energy_level.read_stored_energy(high))
            self.assertIsNone(energy_level.read_stored_energy(missing))
            before = level.read_bytes()
            energy_level.read_stored_energy(level)
            self.assertEqual(level.read_bytes(), before)
            flac = folder / "t.flac"
            blocks = _flac_block(0, bytes(34), False) + _flac_block(1, bytes(10), False)
            blocks += _flac_block(4, _vorbis_comment([b"ENERGYLEVEL=8", b"ENERGY=1"]), True)
            flac.write_bytes(b"fLaC" + blocks + bytes(8))
            self.assertEqual(energy_level.read_stored_energy(flac), 8)


class PlanTests(unittest.TestCase):
    """Which tracks are proposed."""

    def test_blank_grouping_only_and_tag_beats_audio(self) -> None:
        """A set grouping stays. A tag on a silent file wins over the score."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            tagged = _tagged(folder / "tag.mp3", b"EnergyLevel", b"7")
            silent = _silence(folder / "quiet.wav")
            tagged_wav = _silence(folder / "tagged.wav")
            tagged_wav.write_bytes(tagged_wav.read_bytes() + _id3(_txxx(b"Energy", b"6")))
            kept = _silence(folder / "kept.wav")
            outside = _tagged(folder / "out.mp3", b"Energy", b"3")
            _seed(
                temp.db,
                [
                    (1, None, str(tagged)),
                    (2, "   ", str(silent)),
                    (3, "", str(tagged_wav)),
                    (4, "warmup", str(kept)),
                    (5, "Energy 9", str(kept)),
                    (6, "", r"C:\Music\gone.wav"),
                    (7, "", "has\x00nul.wav"),
                    (8, "", str(outside)),
                ],
                child=[2],
            )
            # Track 8 is in the parent crate. Move it out of every crate.
            with closing(sqlite3.connect(temp.db)) as conn:
                conn.execute("DELETE FROM container_asset WHERE asset_id = 8")
                conn.commit()
            before = temp.db.read_bytes()
            audio_before = tagged_wav.read_bytes()
            result = energy_level.plan(temp.db, library.LIBRARY_SPACE, 5)
            self.assertEqual(temp.db.read_bytes(), before)
            self.assertEqual(tagged_wav.read_bytes(), audio_before)
            child = energy_level.plan(temp.db, library.LIBRARY_SPACE, 6)
        fixes = {item["asset_id"]: item for item in result["fixes"]}  # type: ignore[index,union-attr]
        self.assertEqual(result["checked"], 7)
        self.assertEqual(sorted(fixes), [1, 2, 3])
        self.assertEqual(fixes[1]["proposed"], "Energy 7")
        self.assertEqual(fixes[1]["source"], "tag")
        self.assertEqual(fixes[2]["proposed"], "Energy 1")
        self.assertEqual(fixes[2]["source"], "audio")
        self.assertEqual(fixes[3]["proposed"], "Energy 6")
        self.assertEqual(fixes[3]["source"], "tag")
        self.assertEqual(result["unreadable"], 2)
        self.assertEqual([item["asset_id"] for item in child["fixes"]], [2])  # type: ignore[index,union-attr]

    def test_missing_crate_space_and_library(self) -> None:
        """No crate, a bad space, and a missing database are refused."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(library.LibraryError) as missing:
                energy_level.plan(temp.db, library.LIBRARY_SPACE, None)
            self.assertEqual(missing.exception.status, 400)
            self.assertEqual(str(missing.exception), energy_level.NEEDS_CRATE)
            with self.assertRaises(library.LibraryError):
                energy_level.plan(temp.db, "Nope", 5)
            with self.assertRaises(library.LibraryError) as gone:
                energy_level.plan(Path(raw) / "master.sqlite", library.LIBRARY_SPACE, 5)
        self.assertEqual(gone.exception.status, 404)

    def test_symlink_to_audio_is_scored(self) -> None:
        """A symlink to a silent file is a file, so it can be scored."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            target = _silence(folder / "quiet.wav")
            link = folder / "link.wav"
            try:
                link.symlink_to(target)
            except OSError:
                self.skipTest("symlinks are not available")
            _seed(temp.db, [(1, "", str(link))])
            result = energy_level.plan(temp.db, library.LIBRARY_SPACE, 5)
        self.assertEqual(result["fixes"][0]["proposed"], "Energy 1")  # type: ignore[index]


class ApplyTests(unittest.TestCase):
    """Writes stay inside blank grouping."""

    def setUp(self) -> None:
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()

    def tearDown(self) -> None:
        self._running.stop()

    def test_apply_writes_grouping_and_leaves_audio(self) -> None:
        """Blank rows become Energy N. The file bytes stay."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            tagged = _tagged(folder / "tag.mp3", b"EnergyLevel", b"7")
            silent = _silence(folder / "quiet.wav")
            _seed(temp.db, [(1, "", str(tagged)), (2, "", str(silent))], child=[2])
            before_tag = tagged.read_bytes()
            before_wav = silent.read_bytes()
            result = energy_level.apply(library.LIBRARY_SPACE, 5)
            self.assertTrue(result["written"])
            self.assertEqual(_groupings(temp.db)[1], "Energy 7")
            self.assertEqual(_groupings(temp.db)[2], "Energy 1")
            self.assertEqual(tagged.read_bytes(), before_tag)
            self.assertEqual(silent.read_bytes(), before_wav)

    def test_empty_plan_empty_ids_and_unknown_ids_do_not_write(self) -> None:
        """Nothing to do, an empty id list, and an unknown id leave the bytes."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            song = _tagged(Path(raw) / "a.mp3", b"Energy", b"4")
            _seed(temp.db, [(1, "warmup", str(song))])
            before = temp.db.read_bytes()
            empty = energy_level.apply(library.LIBRARY_SPACE, 5)
            self.assertFalse(empty["written"])
            self.assertEqual(empty["fixes"], [])
            self.assertEqual(temp.db.read_bytes(), before)
            _seed(temp.db, [(1, "", str(song))])
            before = temp.db.read_bytes()
            skipped = energy_level.apply(library.LIBRARY_SPACE, 5, [])
            self.assertFalse(skipped["written"])
            self.assertEqual(_groupings(temp.db)[1], "")
            missed = energy_level.apply(library.LIBRARY_SPACE, 5, [99])
            self.assertFalse(missed["written"])
            self.assertEqual(_groupings(temp.db)[1], "")
            self.assertEqual(temp.db.read_bytes(), before)

    def test_replan_skips_a_grouping_filled_since_preview(self) -> None:
        """A grouping set after the plan is not overwritten."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            song = _tagged(Path(raw) / "a.mp3", b"Energy", b"4")
            other = _tagged(Path(raw) / "b.mp3", b"Energy", b"8")
            _seed(temp.db, [(1, "", str(song)), (2, "", str(other))])
            with closing(sqlite3.connect(temp.db)) as conn:
                conn.execute("UPDATE asset SET grouping = ? WHERE id = 1", ("warmup",))
                conn.commit()
            result = energy_level.apply(library.LIBRARY_SPACE, 5)
            self.assertTrue(result["written"])
            self.assertEqual([item["asset_id"] for item in result["fixes"]], [2])  # type: ignore[index,union-attr]
            self.assertEqual(_groupings(temp.db)[1], "warmup")
            self.assertEqual(_groupings(temp.db)[2], "Energy 8")

    def test_ids_limit_and_preview_does_not_write(self) -> None:
        """Preview and a partial id list leave the other row blank."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            first = _tagged(folder / "a.mp3", b"Energy", b"2")
            second = _tagged(folder / "b.mp3", b"Energy", b"5")
            _seed(temp.db, [(1, "", str(first)), (2, "", str(second))])
            before = temp.db.read_bytes()
            preview = energy_level.preview(temp.db, library.LIBRARY_SPACE, 5)
            self.assertTrue(preview["preview"])
            self.assertFalse(preview["written"])
            self.assertEqual(temp.db.read_bytes(), before)
            result = energy_level.apply(library.LIBRARY_SPACE, 5, [2])
            self.assertEqual([item["asset_id"] for item in result["fixes"]], [2])  # type: ignore[index,union-attr]
            self.assertEqual(_groupings(temp.db)[1], "")
            self.assertEqual(_groupings(temp.db)[2], "Energy 5")

    def test_action_rejects_a_bad_verb_crate_and_ids(self) -> None:
        """Unknown action, a missing crate, and a bad ids list are 400."""
        with self.assertRaises(library.LibraryError) as verb:
            energy_level.action({"action": "wipe", "space": library.LIBRARY_SPACE, "crate": 5})
        self.assertEqual(verb.exception.status, 400)
        self.assertEqual(str(verb.exception), "That action is not available.")
        with self.assertRaises(library.LibraryError) as crate:
            energy_level.action({"action": "preview", "space": library.LIBRARY_SPACE})
        self.assertEqual(str(crate.exception), energy_level.NEEDS_CRATE)
        with self.assertRaises(library.LibraryError) as ids:
            energy_level.action(
                {"action": "preview", "space": library.LIBRARY_SPACE, "crate": 5, "ids": [True]}
            )
        self.assertEqual(ids.exception.status, 400)

    def test_cli_is_read_only_until_apply(self) -> None:
        """The default command prints the plan and does not write."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            song = _tagged(Path(raw) / "a.mp3", b"Energy", b"4")
            _seed(temp.db, [(1, "", str(song))])
            before = temp.db.read_bytes()
            code = energy_level.main(["--database", str(temp.db), "--crate", "5"])
            self.assertEqual(code, 0)
            self.assertEqual(temp.db.read_bytes(), before)
            self.assertEqual(_groupings(temp.db)[1], "")
            missing = energy_level.main(["--database", str(temp.db)])
            self.assertEqual(missing, 1)


class ApplyApiTests(unittest.TestCase):
    """``POST /api/energy`` preview does not write. Apply does."""

    request = test_server.ApiTests.request

    def setUp(self) -> None:
        test_server.ApiTests.setUp(self)
        self._running = mock.patch("snapshots.serato_dj_running", return_value=False)
        self._running.start()

    def tearDown(self) -> None:
        self._running.stop()
        test_server.ApiTests.tearDown(self)

    def test_preview_apply_and_errors(self) -> None:
        """A missing crate is 400. Apply fills grouping. A bad action is 400."""
        with tempfile.TemporaryDirectory() as raw:
            song = _tagged(Path(raw) / "a.mp3", b"EnergyLevel", b"7")
            _seed(self.library.db, [(1, "", str(song))])
            before = song.read_bytes()
            status, needs = self.request("/api/energy?space=Serato%20Library")
            self.assertEqual(status, 400)
            self.assertEqual(needs["code"], "energy_needs_crate")  # type: ignore[index]
            status, preview = self.request(
                "/api/energy",
                {"action": "preview", "space": "Serato Library", "crate": 5},
            )
            self.assertEqual(status, 200)
            self.assertEqual((preview["written"], preview["preview"]), (False, True))  # type: ignore[index]
            self.assertEqual(_groupings(self.library.db)[1], "")
            status, made = self.request(
                "/api/energy",
                {"action": "apply", "space": "Serato Library", "crate": 5},
            )
            self.assertEqual(status, 200)
            self.assertTrue(made["written"])  # type: ignore[index]
            self.assertEqual(_groupings(self.library.db)[1], "Energy 7")
            self.assertEqual(song.read_bytes(), before)
            status, verb = self.request("/api/energy", {"action": "wipe", "crate": 5})
            self.assertEqual((status, verb["code"]), (400, "action_unavailable"))  # type: ignore[index]

    def test_queue_replay_calls_energy(self) -> None:
        """A queued apply uses energy_level.action."""
        with mock.patch("write_queue.energy_level.action", return_value={"written": False}) as action:
            result = write_queue._replay(  # pyright: ignore[reportPrivateUsage]
                "/api/energy",
                {"action": "apply", "space": library.LIBRARY_SPACE, "crate": 5},
            )
        self.assertEqual(result, {"written": False})
        action.assert_called_once()


if __name__ == "__main__":
    unittest.main()
