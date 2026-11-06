"""FLAC metadata walks stop at ``tags.FLAC_BLOCK_LIMIT`` blocks (issue #68).

A crafted FLAC made of thousands of empty metadata blocks made the walk
slow. Reading tags stops at the limit with a warning. Rewriting Serato
comments refuses such a file, so a restore never writes a FLAC that is
missing the blocks past the limit. Every file is a synthetic fixture in a
temporary folder.
"""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest import mock

import snapshot_frames
import tags
from snapshot_frames import FrameRewriteError
from tags import read_serato_tags
from tests.test_tags import _flac_block, _markers_payload, _serato_b64, _vorbis_comment


def _titled_flac(path: Path, total_blocks: int) -> None:
    """Write a FLAC whose title and artist sit in metadata block ``total_blocks``.

    Args:
        path: File to write.
        total_blocks: Number of metadata blocks, at least 2.
    """
    blocks = _flac_block(0, bytes(34), False)
    blocks += _flac_block(1, b"", False) * (total_blocks - 2)
    blocks += _flac_block(4, _vorbis_comment([b"TITLE=Edge", b"ARTIST=DJ"]), True)
    path.write_bytes(b"fLaC" + blocks + b"\xff\xf8" + bytes(32))


def _padded_flac(path: Path, total_blocks: int) -> bytes:
    """Write a FLAC with ``total_blocks`` metadata blocks and Serato cues last.

    Block 1 is streaminfo, the middle blocks are empty padding, and the last
    block is a Vorbis comment holding ``SERATO_MARKERS_V2``.

    Args:
        path: File to write.
        total_blocks: Number of metadata blocks, at least 2.

    Returns:
        The file bytes.
    """
    value = _serato_b64("Serato Markers2", _markers_payload(), wrap=False)
    blocks = _flac_block(0, bytes(34), False)
    blocks += _flac_block(1, b"", False) * (total_blocks - 2)
    blocks += _flac_block(4, _vorbis_comment([b"SERATO_MARKERS_V2=" + value]), True)
    data = b"fLaC" + blocks + b"\xff\xf8" + bytes(32)
    path.write_bytes(data)
    return data


class FlacReadLimitTests(unittest.TestCase):
    """``read_serato_tags`` stops walking at the limit and says so."""

    def test_cues_at_the_limit_are_read(self) -> None:
        """A comment that is block number ``FLAC_BLOCK_LIMIT`` is still read."""
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "edge.flac"
            data = _padded_flac(path, tags.FLAC_BLOCK_LIMIT)
            self.assertTrue(read_serato_tags(str(path))["cues"])
            self.assertEqual(path.read_bytes(), data)

    def test_walk_stops_after_the_limit_with_a_warning(self) -> None:
        """A comment past the limit is not read, and a warning is logged."""
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "crafted.flac"
            data = _padded_flac(path, tags.FLAC_BLOCK_LIMIT + 1)
            with self.assertLogs("serato.tags", level="WARNING") as logged:
                parsed = read_serato_tags(str(path))
            self.assertFalse(parsed["cues"])
            self.assertIn(str(tags.FLAC_BLOCK_LIMIT), logged.output[0])
            self.assertEqual(path.read_bytes(), data)

    def test_limit_is_about_a_thousand(self) -> None:
        """The issue asks for about 1024; a real file has a handful of blocks."""
        self.assertEqual(tags.FLAC_BLOCK_LIMIT, 1024)


class FlacRewriteLimitTests(unittest.TestCase):
    """Restoring Serato comments refuses a FLAC past the limit."""

    def test_blocks_at_the_limit_are_all_read(self) -> None:
        """Exactly ``FLAC_BLOCK_LIMIT`` blocks are read, none dropped."""
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "edge.flac"
            _padded_flac(path, tags.FLAC_BLOCK_LIMIT)
            blocks, _offset = snapshot_frames._read_flac_blocks(path)
            self.assertEqual(len(blocks), tags.FLAC_BLOCK_LIMIT)
            self.assertEqual(blocks[-1][1], 4)
            self.assertIn("Markers2", snapshot_frames._read_flac_frames(path))

    def test_a_file_past_the_limit_is_refused_not_truncated(self) -> None:
        """One block over the limit raises, and the frame reader finds nothing."""
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "crafted.flac"
            data = _padded_flac(path, tags.FLAC_BLOCK_LIMIT + 1)
            with self.assertRaises(FrameRewriteError):
                snapshot_frames._read_flac_blocks(path)
            self.assertEqual(snapshot_frames._read_flac_frames(path), {})
            self.assertEqual(path.read_bytes(), data)



class FlacTextLimitTests(unittest.TestCase):
    """``read_text_tags`` walks FLAC blocks under the same shared cap."""

    def test_title_at_the_limit_is_read(self) -> None:
        """A comment that is block number ``FLAC_BLOCK_LIMIT`` still gives the title."""
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "edge.flac"
            _titled_flac(path, tags.FLAC_BLOCK_LIMIT)
            self.assertEqual(tags.read_text_tags(path), {"title": "Edge", "artist": "DJ"})

    def test_title_past_the_limit_is_not_read(self) -> None:
        """A comment one block past the cap is not reached."""
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "crafted.flac"
            _titled_flac(path, tags.FLAC_BLOCK_LIMIT + 1)
            self.assertEqual(tags.read_text_tags(path), {"title": "", "artist": ""})

    def test_text_walk_follows_the_shared_limit(self) -> None:
        """Lowering ``FLAC_BLOCK_LIMIT`` lowers the text walk too: one cap, not two."""
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "short.flac"
            _titled_flac(path, 4)
            self.assertEqual(tags.read_text_tags(path)["title"], "Edge")
            with mock.patch.object(tags, "FLAC_BLOCK_LIMIT", 3):
                self.assertEqual(tags.read_text_tags(path)["title"], "")


if __name__ == "__main__":
    unittest.main()
