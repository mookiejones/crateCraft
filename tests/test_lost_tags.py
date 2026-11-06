"""Titles and artists Serato's database lost (#73), read-only.

``tags.read_text_tags`` is checked against tiny synthetic MP3, FLAC, M4A,
and WAV files. ``lost_tags.plan`` is checked against a temporary library
whose tracks point at those files. The library file must be unchanged.
"""

from __future__ import annotations

import json
import sqlite3
import struct
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from contextlib import closing
from pathlib import Path

import library
import lost_tags
import server
import tags
from tests.fixture import TempLibrary
from tests.test_tags import _atom, _flac_block, _vorbis_comment, _write_m4a


def _frame(frame_id: bytes, encoding: int, text: bytes, version: int) -> bytes:
    """Build one ID3 text frame."""
    body = bytes([encoding]) + text
    if version == 4:
        size = bytes(((len(body) >> shift) & 0x7F) for shift in (21, 14, 7, 0))
    else:
        size = struct.pack(">I", len(body))
    return frame_id + size + b"\x00\x00" + body


def _id3(frames: bytes, version: int = 3) -> bytes:
    """Wrap frames in an ID3v2.3 or ID3v2.4 header."""
    size = bytes(((len(frames) >> shift) & 0x7F) for shift in (21, 14, 7, 0))
    return b"ID3" + bytes([version, 0, 0]) + size + frames


def _mp3(path: Path, title: bytes, artist: bytes, *, encoding: int = 0, version: int = 3) -> Path:
    """Write a tiny MP3 fixture with TIT2 and TPE1."""
    frames = b""
    if title:
        frames += _frame(b"TIT2", encoding, title, version)
    if artist:
        frames += _frame(b"TPE1", encoding, artist, version)
    path.write_bytes(_id3(frames, version) + b"\xff\xfb" + bytes(64))
    return path


class ReadTextTagsTests(unittest.TestCase):
    """The file's own title and artist, in each container."""

    def setUp(self) -> None:
        """Make a folder."""
        self._dir = tempfile.TemporaryDirectory()
        self.root = Path(self._dir.name)

    def tearDown(self) -> None:
        """Remove the folder."""
        self._dir.cleanup()

    def test_id3_encodings(self) -> None:
        """Latin-1, UTF-16 with a BOM, UTF-16BE, and UTF-8 all decode."""
        cases = [
            (0, "Café".encode("latin-1"), 3),
            (1, "﻿Café".encode("utf-16-le"), 3),
            (2, "Café".encode("utf-16-be"), 4),
            (3, "Café".encode("utf-8"), 4),
        ]
        for encoding, raw, version in cases:
            with self.subTest(encoding=encoding):
                path = _mp3(self.root / f"e{encoding}.mp3", raw, raw, encoding=encoding, version=version)
                self.assertEqual(tags.read_text_tags(path), {"title": "Café", "artist": "Café"})

    def test_first_value_and_spaces(self) -> None:
        """An ID3v2.4 multi-value artist gives the first value, trimmed."""
        path = _mp3(self.root / "m.mp3", b"  Opener ", b"First\x00Second", encoding=3, version=4)
        self.assertEqual(tags.read_text_tags(path), {"title": "Opener", "artist": "First"})

    def test_long_id3v24_frame_size_is_synchsafe(self) -> None:
        """A v2.4 frame over 127 bytes is sized correctly, so the next frame is read."""
        long_title = b"T" * 300
        path = _mp3(self.root / "long.mp3", long_title, b"After", encoding=3, version=4)
        self.assertEqual(tags.read_text_tags(path), {"title": "T" * 300, "artist": "After"})

    def test_id3_wins_and_containers_only_fill_gaps(self) -> None:
        """When ID3 and MP4 atoms disagree, ID3 is used; atoms fill what ID3 lacks."""
        path = self.root / "both.m4a"
        data = lambda text: _atom(b"data", bytes(8) + text)  # noqa: E731
        _write_m4a(path, _atom(b"\xa9nam", data(b"Atom Title")) + _atom(b"\xa9ART", data(b"Atom Artist")))
        tag = _id3(_frame(b"TIT2", 0, b"Id3 Title", 3))
        path.write_bytes(path.read_bytes() + _atom(b"free", tag))
        self.assertEqual(tags.read_text_tags(path), {"title": "Id3 Title", "artist": "Atom Artist"})

    def test_flac_vorbis_comment(self) -> None:
        """TITLE and ARTIST come from the Vorbis comment, any case."""
        path = self.root / "t.flac"
        blocks = _flac_block(0, bytes(34), False) + _flac_block(1, bytes(10), False)
        blocks += _flac_block(4, _vorbis_comment([b"title=Opener", b"ARTIST=DJ"]), True)
        path.write_bytes(b"fLaC" + blocks + bytes(8))
        self.assertEqual(tags.read_text_tags(path), {"title": "Opener", "artist": "DJ"})

    def test_mp4_ilst(self) -> None:
        """The title and artist atoms in moov/udta/meta/ilst are read."""
        path = self.root / "t.m4a"
        data = lambda text: _atom(b"data", bytes(8) + text)  # noqa: E731
        _write_m4a(path, _atom(b"\xa9nam", data(b"Opener")) + _atom(b"\xa9ART", data(b"DJ")))
        self.assertEqual(tags.read_text_tags(path), {"title": "Opener", "artist": "DJ"})

    def test_wav_id3_chunk_near_the_start(self) -> None:
        """An ID3 tag inside a WAV's ``id3`` chunk is found."""
        tag = _id3(_frame(b"TIT2", 0, b"Opener", 3))
        path = self.root / "t.wav"
        path.write_bytes(b"RIFF\x00\x00\x00\x00WAVEfmt " + bytes(20) + b"id3 " + struct.pack("<I", len(tag)) + tag)
        self.assertEqual(tags.read_text_tags(path), {"title": "Opener", "artist": ""})

    def test_missing_unreadable_and_untagged(self) -> None:
        """No file, a folder, and a file without tags give empty strings."""
        bare = self.root / "bare.mp3"
        bare.write_bytes(b"\xff\xfb" + bytes(64))
        for path in (None, self.root / "gone.mp3", self.root, bare):
            with self.subTest(path=path):
                self.assertEqual(tags.read_text_tags(path), {"title": "", "artist": ""})

    def test_file_is_not_changed(self) -> None:
        """Reading leaves the bytes alone."""
        path = _mp3(self.root / "x.mp3", b"T", b"A")
        before = path.read_bytes()
        tags.read_text_tags(path)
        self.assertEqual(path.read_bytes(), before)


def _tracks(db: Path, rows: list[tuple[int, str | None, str | None, str]]) -> None:
    """Replace the fixture's tracks with ``(id, name, artist, path)`` rows."""
    with closing(sqlite3.connect(db)) as conn:
        conn.execute("DELETE FROM space_asset")
        conn.execute("DELETE FROM asset")
        for asset_id, name, artist, stored in rows:
            conn.execute("INSERT INTO asset (id, name, artist, portable_id) VALUES (?, ?, ?, ?)", (asset_id, name, artist, stored))
            conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))
        conn.commit()


class PlanTests(unittest.TestCase):
    """Which fixes are proposed."""

    def test_only_blank_fields_are_filled(self) -> None:
        """Blank fields get the file's value; set fields are never proposed."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            both = _mp3(folder / "both.mp3", b"File Title", b"File Artist")
            title_only = _mp3(folder / "title.mp3", b"File Title", b"File Artist")
            whitespace = _mp3(folder / "ws.mp3", b"File Title", b"File Artist")
            complete = _mp3(folder / "complete.mp3", b"Other", b"Other")
            empty_file = _mp3(folder / "empty.mp3", b"", b"")
            artist_only = _mp3(folder / "artist.mp3", b"File Title", b"File Artist")
            _tracks(
                temp.db,
                [
                    (1, None, None, str(both)),
                    (2, "", "Kept Artist", str(title_only)),
                    (3, "  ", "\t", str(whitespace)),
                    (4, "Kept", "Kept", str(complete)),
                    (5, "", "", str(empty_file)),
                    (6, "", "", str(folder / "missing.mp3")),
                    (7, "Kept Title", "", str(artist_only)),
                ],
            )
            before = temp.db.read_bytes()
            result = lost_tags.plan(temp.db, library.LIBRARY_SPACE)
            self.assertEqual(temp.db.read_bytes(), before)
        fixes = {item["asset_id"]: item for item in result["fixes"]}  # type: ignore[union-attr,index]
        self.assertEqual(result["checked"], 6)
        self.assertEqual(result["unreadable"], 1)
        self.assertEqual(sorted(fixes), [1, 2, 3, 7])
        self.assertEqual(fixes[7]["proposed"], {"artist": "File Artist"})
        self.assertEqual(fixes[1]["proposed"], {"name": "File Title", "artist": "File Artist"})
        self.assertEqual(fixes[2]["proposed"], {"name": "File Title"})
        self.assertEqual(fixes[2]["current"], {"name": "", "artist": "Kept Artist"})
        self.assertEqual(fixes[3]["proposed"], {"name": "File Title", "artist": "File Artist"})
        self.assertEqual(fixes[1]["path"], str(both))

    def test_unknown_space_and_missing_library(self) -> None:
        """A bad space and a missing database are refused."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(library.LibraryError):
                lost_tags.plan(temp.db, "Nope")
            with self.assertRaises(library.LibraryError) as caught:
                lost_tags.plan(Path(raw) / "master.sqlite", library.LIBRARY_SPACE)
        self.assertEqual(caught.exception.status, 404)



class RouteTests(unittest.TestCase):
    """``GET /api/lost-tags`` returns the plan and checks the space."""

    def test_route(self) -> None:
        """The plan comes back as JSON, and an unknown space is 400."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            song = _mp3(Path(raw) / "a.mp3", b"File Title", b"File Artist")
            _tracks(temp.db, [(1, "", "", str(song))])
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            threading.Thread(target=httpd.serve_forever, daemon=True).start()
            host, port = httpd.server_address[:2]
            base = f"http://{host}:{port}/api/lost-tags"
            try:
                with urllib.request.urlopen(base + "?space=Serato%20Library", timeout=5) as response:
                    body = json.loads(response.read().decode("utf-8"))
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(base + "?space=Nope", timeout=5)
                caught.exception.close()
            finally:
                httpd.shutdown()
                httpd.server_close()
        self.assertEqual(caught.exception.code, 400)
        self.assertEqual(body["fixes"][0]["proposed"], {"name": "File Title", "artist": "File Artist"})

if __name__ == "__main__":
    unittest.main()
