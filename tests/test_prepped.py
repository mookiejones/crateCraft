"""Prepped mark: cues, analysis, and a readable file. Nothing is written.

The cases use synthetic paths and ID3 bytes. They do not open a live
Serato library and they do not write cues, analysis, or crates.
"""

from __future__ import annotations

import base64
import itertools
import os
import unittest
from pathlib import Path

from tests.fixture import ROOT, TempLibrary, open_database
import sys

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import cloud_files
import prepped
import server
import volumes
from tests.test_tags import (
    _beatgrid_payload,
    _cue,
    _entry,
    _geob_frame,
    _id3_pack,
    _loop,
    _markers_payload,
)


def _never_open(path: Path) -> bool:
    """Fail the test if a skipped path is opened.

    Args:
        path: Candidate the check should not open.

    Returns:
        Never returns.

    Raises:
        AssertionError: Always. The path was opened.
    """
    raise AssertionError(f"opened {path}")


def _markers(payload: bytes) -> bytes:
    """Wrap Markers2 bytes in the header the parser expects.

    Args:
        payload: Decoded Markers2 entries.

    Returns:
        The GEOB body. No file is written.
    """
    return b"\x01\x01" + base64.b64encode(payload)


class PreppedMarkTests(unittest.TestCase):
    """Every true, false, and unknown combination of the three inputs.

    These cases call the pure function only. They do not touch a file.
    """

    def test_every_combination(self) -> None:
        """True only when all three inputs are true. Unknown is never prepped.

        Returns:
            None. The test fails if a None input becomes prepped, or if a
            known gap is left unnamed.
        """
        values: tuple[bool | None, ...] = (True, False, None)
        seen = 0
        for cues, analysed, present in itertools.product(values, values, values):
            seen += 1
            mark = prepped.prepped_mark(cues, analysed, present)
            self.assertEqual(mark["has_cues"], cues)
            self.assertEqual(mark["analysed"], analysed)
            self.assertEqual(mark["file_present"], present)
            missing = [
                name
                for name, value in (("cues", cues), ("analysed", analysed), ("file", present))
                if value is False
            ]
            unknown = [
                name
                for name, value in (("cues", cues), ("analysed", analysed), ("file", present))
                if value is None
            ]
            self.assertEqual(mark["prepped_missing"], missing)
            self.assertEqual(mark["prepped_unknown"], unknown)
            if unknown:
                self.assertIsNone(mark["prepped"])
            elif missing:
                self.assertIs(mark["prepped"], False)
            else:
                self.assertIs(mark["prepped"], True)
        self.assertEqual(seen, 27)

    def test_non_boolean_is_unknown(self) -> None:
        """An integer 1 is not prepped, even when the other inputs are true.

        Returns:
            None.
        """
        mark = prepped.prepped_mark(1, True, True)
        self.assertIsNone(mark["prepped"])
        self.assertIsNone(mark["has_cues"])
        self.assertEqual(mark["prepped_unknown"], ["cues"])
        self.assertEqual(mark["prepped_missing"], [])

    def test_cues_without_file_is_not_prepped(self) -> None:
        """Cues and analysis with a missing file are not prepped.

        Returns:
            None.
        """
        mark = prepped.prepped_mark(True, True, False)
        self.assertIs(mark["prepped"], False)
        self.assertEqual(mark["prepped_missing"], ["file"])
        self.assertEqual(mark["prepped_unknown"], [])

    def test_analysed_without_cues_is_not_prepped(self) -> None:
        """Analysis and a present file with no cues are not prepped.

        Returns:
            None.
        """
        mark = prepped.prepped_mark(False, True, True)
        self.assertIs(mark["prepped"], False)
        self.assertEqual(mark["prepped_missing"], ["cues"])

    def test_unknown_file_is_not_prepped(self) -> None:
        """A file that cannot be checked is not shown as prepped.

        Returns:
            None.
        """
        mark = prepped.prepped_mark(True, True, None)
        self.assertIsNone(mark["prepped"])
        self.assertEqual(mark["prepped_unknown"], ["file"])
        self.assertEqual(mark["prepped_missing"], [])


class AnalysedStateTests(unittest.TestCase):
    """The analysis bit and a beatgrid. NULL flags are not 'not analysed'.

    These cases do not read a file.
    """

    def test_bit_or_grid(self) -> None:
        """Either a set bit or a grid is analysed. Both unknown stays unknown.

        Returns:
            None.
        """
        self.assertIs(prepped.analysed_state(4, None), True)
        self.assertIs(prepped.analysed_state(5, False), True)
        self.assertIs(prepped.analysed_state(0, True), True)
        self.assertIs(prepped.analysed_state(None, True), True)
        self.assertIs(prepped.analysed_state(0, None), False)
        self.assertIs(prepped.analysed_state(0, False), False)
        self.assertIs(prepped.analysed_state(None, False), False)
        self.assertIsNone(prepped.analysed_state(None, None))
        self.assertIsNone(prepped.analysed_state("4", None))
        self.assertIsNone(prepped.analysed_state(True, None))
        self.assertIs(prepped.analysis_bit(0), False)
        self.assertIs(prepped.analysis_bit(4), True)


class LocateTests(unittest.TestCase):
    """File presence uses the same read-only open as the missing/offline split.

    Synthetic paths only. An unplugged volume and a cloud stub are not opened.
    """

    def test_empty_and_nul_are_unknown(self) -> None:
        """An empty path or a NUL does not raise and is not prepped.

        Returns:
            None.
        """
        mounts = volumes.Mounts()
        self.assertEqual(prepped.locate("", "", mounts, (), _never_open), (None, None))
        self.assertEqual(prepped.locate("a\0b", "", mounts, (), _never_open), (None, None))

    def test_windows_letter_is_unknown_when_unmounted(self) -> None:
        """``C:\\`` and ``Z:\\`` are unknown on a machine where that letter is out.

        A mounted letter, including a Windows boot drive, is not forced to
        unknown. The test does not open an unmounted letter.

        Returns:
            None.
        """
        mounts = volumes.Mounts()
        for stored in (r"C:\Music\song.mp3", r"Z:\Crate\song.mp3", "C:/Music/song.mp3"):
            volume = volumes.volume_of(stored)
            self.assertIsNotNone(volume)
            assert volume is not None
            opened: list[Path] = []

            def open_check(path: Path, seen: list[Path] = opened) -> bool:
                seen.append(path)
                return True

            present, found = prepped.locate(stored, "", mounts, (), open_check)
            if mounts.mounted(volume):
                self.assertIn(present, (True, False))
            else:
                self.assertIsNone(present)
                self.assertIsNone(found)
                self.assertEqual(opened, [])

    def test_absent_posix_volume_is_unknown(self) -> None:
        """``/Volumes/cratecraft-absent-372`` is not opened.

        On macOS and Linux an unplugged ``/Volumes`` drive is unknown.
        Windows does not treat that path as a volume, so the file is a
        known miss instead. Either result stays unprepped.

        Returns:
            None.
        """
        stored = "/Volumes/cratecraft-absent-372/song.mp3"
        mounts = volumes.Mounts()
        volume = volumes.volume_of(stored)
        opened: list[Path] = []

        def open_check(path: Path) -> bool:
            opened.append(path)
            return True

        present, found = prepped.locate(stored, "", mounts, (), open_check)
        if volume is None:
            self.assertIs(present, False)
            self.assertIsNone(found)
            self.assertEqual(opened, [])
            return
        if mounts.mounted(volume):
            self.assertIn(present, (True, False))
        else:
            self.assertIsNone(present)
            self.assertIsNone(found)
            self.assertEqual(opened, [])

    def test_relative_missing_path_is_false(self) -> None:
        """A relative id under neither home nor ``/`` is a known miss.

        The name is unique so this does not depend on a file in the home
        directory. The candidates are not opened when they are absent.

        Returns:
            None.
        """
        stored = "cratecraft-no-such-prepped-372.mp3"
        candidates = volumes.path_candidates(stored, None)
        self.assertTrue(candidates)
        if any(path.exists() for path in candidates):
            self.skipTest("a candidate for the synthetic relative id exists")
        mounts = volumes.Mounts()
        present, found = prepped.locate(stored, "", mounts, (), _never_open)
        self.assertIs(present, False)
        self.assertIsNone(found)

    def test_present_file_missing_file_and_symlink(self) -> None:
        """A temp file is present. A dangling link and a missing path are not.

        The files live in a temporary directory. Nothing is written under
        a Serato folder.

        Returns:
            None.
        """
        import tempfile

        mounts = volumes.Mounts()
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            audio = root / "song.mp3"
            audio.write_bytes(b"not audio")
            present, found = prepped.locate(str(audio), "", mounts, ())
            self.assertIs(present, True)
            self.assertEqual(found, audio)
            missing = root / "gone.mp3"
            present, found = prepped.locate(str(missing), "", mounts, (), _never_open)
            self.assertIs(present, False)
            self.assertIsNone(found)
            link = root / "link.mp3"
            dangling = root / "dangling.mp3"
            try:
                link.symlink_to(audio)
                dangling.symlink_to(root / "no-such-target.mp3")
            except OSError:
                self.skipTest("symlinks are not available")
            present, found = prepped.locate(str(link), "", mounts, ())
            self.assertIs(present, True)
            self.assertEqual(found, link)
            present, found = prepped.locate(str(dangling), "", mounts, (), _never_open)
            self.assertIs(present, False)
            self.assertIsNone(found)

    def test_cloud_stub_is_unknown_and_not_opened(self) -> None:
        """An iCloud placeholder is unknown. The open check is not called.

        Returns:
            None.
        """
        import tempfile

        mounts = volumes.Mounts()
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            audio = root / "cloud.mp3"
            stub = root / ".cloud.mp3.icloud"
            stub.write_bytes(b"")
            present, found = prepped.locate(str(audio), "", mounts, (), _never_open)
            self.assertIsNone(present)
            self.assertIsNone(found)
            self.assertFalse(audio.exists())


class AssessFileTests(unittest.TestCase):
    """Tag reads happen only after the file opens. Synthetic ID3 only.

    A missing file does not become 'no cues'.
    """

    def _write(self, path: Path, frames: list[bytes]) -> None:
        """Write one synthetic ID3 file. It is not a playable track.

        Args:
            path: Temporary path.
            frames: Encoded ID3 frames.

        Returns:
            None.
        """
        path.write_bytes(_id3_pack(frames))

    def test_empty_cues_and_analysed_without_cues(self) -> None:
        """A readable file with a grid and no cue points is not prepped.

        Loops do not count as cues. The analysis bit is set.

        Returns:
            None.
        """
        import tempfile

        mounts = volumes.Mounts()
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            empty = root / "empty.mp3"
            empty.write_bytes(b"not a tag")
            mark = prepped.assess(str(empty), "", 4, mounts, ())
            self.assertIs(mark["file_present"], True)
            self.assertIs(mark["has_cues"], False)
            self.assertIs(mark["analysed"], True)
            self.assertIs(mark["prepped"], False)
            self.assertEqual(mark["prepped_missing"], ["cues"])

            loops = root / "loops.mp3"
            body = _entry("LOOP", _loop(1, 2000, 4000, True, "Break"))
            self._write(
                loops,
                [
                    _geob_frame("Serato Markers2", _markers(body)),
                    _geob_frame("Serato BeatGrid", _beatgrid_payload()),
                ],
            )
            mark = prepped.assess(str(loops), "", 0, mounts, ())
            self.assertIs(mark["has_cues"], False)
            self.assertIs(mark["analysed"], True)
            self.assertIs(mark["prepped"], False)
            self.assertEqual(mark["prepped_missing"], ["cues"])

    def test_cues_and_grid_are_prepped(self) -> None:
        """Cues, a beatgrid, the analysis bit, and a readable file are prepped.

        Returns:
            None.
        """
        import tempfile

        mounts = volumes.Mounts()
        with tempfile.TemporaryDirectory() as raw:
            audio = Path(raw) / "ready.mp3"
            self._write(
                audio,
                [
                    _geob_frame("Serato Markers2", _markers_payload()),
                    _geob_frame("Serato BeatGrid", _beatgrid_payload()),
                ],
            )
            mark = prepped.assess(str(audio), "", 4, mounts, ())
            self.assertIs(mark["prepped"], True)
            self.assertIs(mark["has_cues"], True)
            self.assertIs(mark["analysed"], True)
            self.assertIs(mark["file_present"], True)
            self.assertEqual(mark["prepped_missing"], [])
            self.assertEqual(mark["prepped_unknown"], [])

    def test_flag_without_file_is_not_prepped(self) -> None:
        """A set analysis bit does not mark a missing file as prepped.

        Cues stay unknown because the file was not read.

        Returns:
            None.
        """
        stored = "cratecraft-no-such-prepped-flag-372.mp3"
        if any(path.exists() for path in volumes.path_candidates(stored, None)):
            self.skipTest("a candidate for the synthetic relative id exists")
        mark = prepped.assess(stored, "", 4, volumes.Mounts(), (), _never_open)
        self.assertIs(mark["analysed"], True)
        self.assertIsNone(mark["has_cues"])
        self.assertIs(mark["file_present"], False)
        self.assertIsNone(mark["prepped"])
        self.assertEqual(mark["prepped_missing"], ["file"])
        self.assertEqual(mark["prepped_unknown"], ["cues"])

    def test_cues_without_analysis_are_not_prepped(self) -> None:
        """Cue points with a clear analysis bit and no grid are not prepped.

        Returns:
            None.
        """
        import tempfile

        with tempfile.TemporaryDirectory() as raw:
            audio = Path(raw) / "cues.mp3"
            body = _entry("CUE", _cue(0, 1500, b"\xCC\x00\x00", "Drop"))
            self._write(audio, [_geob_frame("Serato Markers2", _markers(body))])
            mark = prepped.assess(str(audio), "", 0, volumes.Mounts(), ())
            self.assertIs(mark["has_cues"], True)
            self.assertIs(mark["analysed"], False)
            self.assertIs(mark["file_present"], True)
            self.assertIs(mark["prepped"], False)
            self.assertEqual(mark["prepped_missing"], ["analysed"])

    def test_other_cloud_root_is_not_opened(self) -> None:
        """A file in an unsupported cloud folder is unknown and is not opened.

        Returns:
            None.
        """
        import tempfile

        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            audio = root / "song.mp3"
            audio.write_bytes(b"not audio")
            roots = (cloud_files.CloudRoot("other", str(root)),)
            mark = prepped.assess(str(audio), "", 4, volumes.Mounts(), roots, _never_open)
            self.assertIsNone(mark["file_present"])
            self.assertIsNone(mark["has_cues"])
            self.assertIs(mark["analysed"], True)
            self.assertIsNone(mark["prepped"])
            self.assertIn("file", mark["prepped_unknown"])
            self.assertIn("cues", mark["prepped_unknown"])


class LibraryPreppedTests(unittest.TestCase):
    """GET /api/library and GET /api/track carry the mark. Existing keys stay.

    The database and the audio file are temporary. The live library is not
    opened. Cue bytes are not rewritten after the fixture file is created.
    """

    def test_library_and_track_payloads(self) -> None:
        """A readable tagged file is prepped. A missing file is not.

        Returns:
            None. The test fails if ``portable_id`` is added to the list
            payload or if a missing file is marked prepped.
        """
        with TempLibrary() as library:
            audio = library.root / "ready.mp3"
            audio.write_bytes(
                _id3_pack(
                    [
                        _geob_frame("Serato Markers2", _markers_payload()),
                        _geob_frame("Serato BeatGrid", _beatgrid_payload()),
                    ]
                )
            )
            gone = library.root / "gone.mp3"
            with open_database(library.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ?, analysis_flags = 4 WHERE id = 1",
                    (str(audio),),
                )
                conn.execute(
                    "UPDATE asset SET portable_id = ?, analysis_flags = 4 WHERE id = 2",
                    (str(gone),),
                )
            server.invalidate()
            payload = server.load_library()
            tracks = payload["tracks"]
            self.assertIsInstance(tracks, list)
            assert isinstance(tracks, list)
            by_id = {row["id"]: row for row in tracks}
            ready = by_id[1]
            missing = by_id[2]
            self.assertEqual(ready["name"], "Same")
            self.assertEqual(ready["play_count"], 2)
            self.assertNotIn("portable_id", ready)
            self.assertIs(ready["prepped"], True)
            self.assertIs(ready["has_cues"], True)
            self.assertIs(ready["analysed"], True)
            self.assertIs(ready["file_present"], True)
            self.assertEqual(ready["prepped_missing"], [])
            self.assertEqual(ready["prepped_unknown"], [])
            self.assertIsNone(missing["prepped"])
            self.assertIs(missing["file_present"], False)
            self.assertIsNone(missing["has_cues"])
            self.assertIs(missing["analysed"], True)
            self.assertIn("file", missing["prepped_missing"])
            self.assertIn("cues", missing["prepped_unknown"])
            self.assertNotIn("prepped", missing["prepped_missing"])
            detail = server.load_track(1)
            self.assertIsNotNone(detail)
            assert detail is not None
            self.assertIs(detail["prepped"], True)
            self.assertIs(detail["file_on_disk"], True)
            self.assertTrue(detail["cues"])
            absent = server.load_track(2)
            self.assertIsNotNone(absent)
            assert absent is not None
            self.assertIsNone(absent["prepped"])
            self.assertIs(absent["file_on_disk"], False)
            self.assertFalse(os.path.exists(gone))
