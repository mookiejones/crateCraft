"""Missing album art lookup and embed (#32).

Lookup is mocked. Audio fixtures are tiny synthetic MP3 and FLAC files.
The live Serato library is not opened.
"""

from __future__ import annotations

import json
import sqlite3
import tempfile
import unittest
import urllib.parse
from contextlib import closing
from pathlib import Path
from unittest import mock

import album_art
import library
import tags
from library import SeratoOpen
from tests.fixture import TempLibrary, open_database
from tests.test_server import ApiTests
from tests.test_tags import (
    _beatgrid_payload,
    _geob_frame,
    _id3_pack,
    _markers_payload,
    _serato_b64,
    _write_flac,
)

JPEG = b"\xff\xd8\xff\xd9"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 8
RELEASE = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
AUDIO = b"\xff\xfb" + bytes(64)


def _mp3(path: Path, frames: list[bytes] | None = None) -> Path:
    """Write a tiny MP3 with optional ID3 frames."""
    path.write_bytes(_id3_pack(frames or []) + AUDIO)
    return path


def _geob_frames(path: Path) -> list[bytes]:
    """Return raw GEOB frames from a plain ID3 tag."""
    parsed = tags._read_plain_id3(path)
    if parsed is None:
        return []
    return [frame for frame in parsed["frames"] if isinstance(frame, bytes) and frame[:4] == b"GEOB"]


def _add_track(
    conn: sqlite3.Connection,
    asset_id: int,
    path: Path | None,
    *,
    name: str = "Bare",
    artist: str = "DJ",
    album: str = "LP",
) -> None:
    """Insert a space-1 track pointing at ``path``."""
    conn.execute(
        """
        INSERT INTO asset (id, name, artist, album, file_name, portable_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (asset_id, name, artist, album, f"{name}.mp3", str(path) if path else None),
    )
    conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


def _mb_body(release_id: str = RELEASE) -> bytes:
    """Return a MusicBrainz recording search JSON body."""
    return json.dumps(
        {
            "recordings": [
                {
                    "title": "Bare",
                    "artist-credit": [{"name": "DJ"}],
                    "releases": [{"id": release_id, "title": "LP"}],
                }
            ]
        }
    ).encode("utf-8")


class FakeFetch:
    """Record URLs and return canned MusicBrainz and Cover Art Archive bodies."""

    def __init__(self, jpeg: bytes = JPEG, mb: bytes | None = None, status: int = 200) -> None:
        """Store canned responses."""
        self.urls: list[str] = []
        self.jpeg = jpeg
        self.mb = mb if mb is not None else _mb_body()
        self.status = status

    def __call__(self, url: str) -> tuple[int, bytes, str]:
        """Return a canned body for MB or CAA, 404 otherwise."""
        self.urls.append(url)
        host = album_art._https_hostname(url)
        path = urllib.parse.urlparse(url).path
        if host == album_art.MB_HOST:
            if self.status != 200:
                return self.status, b"", ""
            return 200, self.mb, "application/json"
        if host == album_art.CAA_HOST and path.startswith("/release/"):
            return 200, self.jpeg, "image/jpeg"
        return 404, b"", ""


class FetchUrlAllowlistTests(unittest.TestCase):
    """fetch_url compares hostname, not a substring of the URL."""

    def test_suffix_host_is_not_opened(self) -> None:
        """A host that only starts with the allowed name is refused."""
        with mock.patch("urllib.request.urlopen") as opener:
            status, body, ctype = album_art.fetch_url(
                f"https://coverartarchive.org.evil.example/release/{RELEASE}/front"
            )
        self.assertEqual((status, body, ctype), (0, b"", ""))
        opener.assert_not_called()

    def test_allowed_name_in_path_is_not_opened(self) -> None:
        """A URL that only mentions MusicBrainz in the path is refused."""
        with mock.patch("urllib.request.urlopen") as opener:
            status, body, ctype = album_art.fetch_url(
                "https://evil.example/musicbrainz.org/ws/2/recording/"
            )
        self.assertEqual((status, body, ctype), (0, b"", ""))
        opener.assert_not_called()

    def test_allowed_host_is_opened(self) -> None:
        """https MusicBrainz search is fetched."""

        class _Resp:
            status = 200
            headers = {"Content-Type": "application/json"}

            def read(self, _n: int) -> bytes:
                return b"{}"

            def __enter__(self) -> "_Resp":
                return self

            def __exit__(self, *_a: object) -> None:
                return None

        with mock.patch("urllib.request.urlopen", return_value=_Resp()) as opener:
            status, body, ctype = album_art.fetch_url(
                "https://musicbrainz.org/ws/2/recording/?query=x&fmt=json"
            )
        self.assertEqual((status, body, ctype), (200, b"{}", "application/json"))
        opener.assert_called_once()


class EmbedFrontCoverTests(unittest.TestCase):
    """Write APIC or a FLAC picture without touching Serato frames."""

    def setUp(self) -> None:
        """Make a folder."""
        self._dir = tempfile.TemporaryDirectory()
        self.root = Path(self._dir.name)

    def tearDown(self) -> None:
        """Remove the folder."""
        self._dir.cleanup()

    def test_mp3_keeps_geob_bytes(self) -> None:
        """APIC is added. The Markers2 GEOB bytes stay identical."""
        path = _mp3(self.root / "a.mp3", [_geob_frame("Serato Markers2", _markers_payload())])
        before = _geob_frames(path)
        self.assertEqual(len(before), 1)
        self.assertFalse(tags.read_file_health(str(path))["artwork"])
        tags.embed_front_cover(path, JPEG)
        self.assertTrue(tags.read_file_health(str(path))["artwork"])
        self.assertEqual(_geob_frames(path), before)
        cues = tags.read_serato_tags(str(path))
        self.assertTrue(cues["found"])
        self.assertEqual(cues["cues"][0]["name"], "Drop")

    def test_flac_keeps_vorbis_serato_comment(self) -> None:
        """A picture block is added. SERATO_MARKERS_V2 stays in the comment."""
        path = self.root / "a.flac"
        comment = b"SERATO_MARKERS_V2=" + _serato_b64("Serato Markers2", _markers_payload(), wrap=False)
        _write_flac(path, [comment])
        before = path.read_bytes()
        self.assertIn(b"SERATO_MARKERS_V2", before)
        self.assertFalse(tags.read_file_health(str(path))["artwork"])
        tags.embed_front_cover(path, JPEG)
        after = path.read_bytes()
        self.assertIn(b"SERATO_MARKERS_V2", after)
        self.assertTrue(tags.read_file_health(str(path))["artwork"])
        self.assertTrue(tags.read_serato_tags(str(path))["found"])

    def test_existing_art_and_mp4_and_bad_image_are_refused(self) -> None:
        """A file with APIC, an M4A, and a non-image are left unchanged."""
        has_art = _mp3(self.root / "art.mp3", [tags._apic_frame_bytes(JPEG, b"image/jpeg", 3)])
        before = has_art.read_bytes()
        with self.assertRaises(tags.ArtworkWriteError) as present:
            tags.embed_front_cover(has_art, JPEG)
        self.assertEqual(present.exception.message, tags.ARTWORK_PRESENT)
        self.assertEqual(has_art.read_bytes(), before)
        m4a = self.root / "x.m4a"
        m4a.write_bytes(b"\x00\x00\x00\x18ftypM4A " + bytes(32))
        m4a_before = m4a.read_bytes()
        with self.assertRaises(tags.ArtworkWriteError) as fmt:
            tags.embed_front_cover(m4a, JPEG)
        self.assertEqual(fmt.exception.message, tags.ARTWORK_FORMAT)
        self.assertEqual(m4a.read_bytes(), m4a_before)
        bare = _mp3(self.root / "bare.mp3")
        bare_before = bare.read_bytes()
        with self.assertRaises(tags.ArtworkWriteError) as image:
            tags.embed_front_cover(bare, b"not-an-image")
        self.assertEqual(image.exception.message, tags.ARTWORK_NOT_IMAGE)
        self.assertEqual(bare.read_bytes(), bare_before)

    def test_symlink_is_refused(self) -> None:
        """A shortcut is not rewritten. The target stays as it was."""
        target = _mp3(self.root / "real.mp3")
        link = self.root / "link.mp3"
        try:
            link.symlink_to(target)
        except OSError:
            self.skipTest("This user cannot create shortcuts.")
        before = target.read_bytes()
        with self.assertRaises(tags.ArtworkWriteError):
            tags.embed_front_cover(link, JPEG)
        self.assertEqual(target.read_bytes(), before)


class AlbumArtPlanTests(unittest.TestCase):
    """Preview is read-only. Embed writes through safe_write."""

    def test_missing_lists_only_files_without_art(self) -> None:
        """A present file with APIC is omitted. A missing file is omitted."""
        with TempLibrary() as temp:
            music = temp.root / "music"
            music.mkdir()
            bare = _mp3(music / "bare.mp3")
            art = _mp3(music / "art.mp3", [tags._apic_frame_bytes(JPEG, b"image/jpeg", 3)])
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 1, bare)
                _add_track(conn, 2, art, name="HasArt")
                _add_track(conn, 3, None, name="Gone")
            body = album_art.missing(temp.db, library.LIBRARY_SPACE)
        ids = [int(row["id"]) for row in body["tracks"]]  # type: ignore[union-attr]
        self.assertEqual(ids, [1])
        self.assertEqual(body["checked"], 3)

    def test_preview_does_not_write_and_uses_only_caa_urls(self) -> None:
        """The MP3 bytes stay. Fetch sees MusicBrainz then a CAA front-250 URL."""
        fake = FakeFetch()
        with TempLibrary() as temp:
            path = _mp3(temp.root / "bare.mp3", [_geob_frame("Serato BeatGrid", _beatgrid_payload())])
            before = path.read_bytes()
            geob = _geob_frames(path)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 7, path)
            slept: list[float] = []
            plan = album_art.preview(
                temp.db, library.LIBRARY_SPACE, 7, fetch=fake, sleep=slept.append
            )
            self.assertEqual(path.read_bytes(), before)
            self.assertEqual(_geob_frames(path), geob)
        self.assertEqual(plan["written"], False)
        self.assertEqual(plan["preview"], True)
        self.assertEqual(len(plan["candidates"]), 1)  # type: ignore[arg-type]
        self.assertEqual(plan["candidates"][0]["release_id"], RELEASE)  # type: ignore[index]
        self.assertTrue(str(plan["candidates"][0]["thumb"]).startswith("data:image/jpeg;base64,"))  # type: ignore[index]
        self.assertEqual(len(fake.urls), 2)
        self.assertEqual(album_art._https_hostname(fake.urls[0]), album_art.MB_HOST)
        self.assertEqual(slept, [1.0])
        self.assertEqual(fake.urls[1], f"https://coverartarchive.org/release/{RELEASE}/front-250")
        self.assertTrue(all(url.startswith("https://") for url in fake.urls))
        self.assertEqual(
            {album_art._https_hostname(url) for url in fake.urls},
            {album_art.MB_HOST, album_art.CAA_HOST},
        )

    def test_preview_ignores_a_hostile_release_id(self) -> None:
        """A release id that is not a UUID is not fetched."""
        fake = FakeFetch(mb=_mb_body("https://evil.example/x"))
        fake.mb = json.dumps(
            {
                "recordings": [
                    {
                        "title": "Bare",
                        "releases": [{"id": "https://evil.example/steal", "title": "LP"}],
                    }
                ]
            }
        ).encode("utf-8")
        with TempLibrary() as temp:
            path = _mp3(temp.root / "bare.mp3")
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 1, path)
            plan = album_art.preview(
                temp.db, library.LIBRARY_SPACE, 1, fetch=fake, sleep=lambda _n: None
            )
        self.assertEqual(plan["candidates"], [])
        self.assertEqual(len(fake.urls), 1)
        self.assertEqual(album_art._https_hostname(fake.urls[0]), album_art.MB_HOST)

    def test_blank_title_and_artist_are_not_looked_up(self) -> None:
        """Nothing is fetched when both fields are blank."""
        fake = FakeFetch()
        with TempLibrary() as temp:
            path = _mp3(temp.root / "bare.mp3")
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 1, path, name="  ", artist="  ", album="")
            with self.assertRaises(library.LibraryError) as caught:
                album_art.preview(
                    temp.db, library.LIBRARY_SPACE, 1, fetch=fake, sleep=lambda _n: None
                )
        self.assertEqual(caught.exception.message, album_art.NO_SEARCH)
        self.assertEqual(fake.urls, [])

    def test_embed_writes_through_safe_write_and_skips_musicbrainz(self) -> None:
        """Confirm fetches CAA front and writes APIC. GEOB stays. MB is not hit."""
        fake = FakeFetch()
        with TempLibrary() as temp:
            path = _mp3(temp.root / "bare.mp3", [_geob_frame("Serato Markers2", _markers_payload())])
            geob = _geob_frames(path)
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 4, path)
            dry = album_art.embed(
                library.LIBRARY_SPACE, 4, RELEASE, confirm=False, fetch=fake
            )
            self.assertEqual(dry["written"], False)
            self.assertFalse(tags.read_file_health(str(path))["artwork"])
            fake.urls.clear()
            result = album_art.embed(
                library.LIBRARY_SPACE, 4, RELEASE, confirm=True, fetch=fake
            )
            self.assertTrue(tags.read_file_health(str(path))["artwork"])
            self.assertEqual(_geob_frames(path), geob)
        self.assertEqual(result["written"], True)
        self.assertEqual(fake.urls, [f"https://coverartarchive.org/release/{RELEASE}/front"])

    def test_embed_refuses_while_serato_is_running(self) -> None:
        """The audio file is not rewritten."""
        fake = FakeFetch()
        with TempLibrary() as temp:
            path = _mp3(temp.root / "bare.mp3")
            before = path.read_bytes()
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 1, path)
                conn.execute(
                    "INSERT INTO lock (owner_process_id, owner_process_name) VALUES (99, 'Serato DJ Pro')"
                )
            with mock.patch("library._process_is_serato", return_value=True), self.assertRaises(SeratoOpen):
                album_art.embed(library.LIBRARY_SPACE, 1, RELEASE, confirm=True, fetch=fake)
            self.assertEqual(path.read_bytes(), before)

    def test_embed_refuses_a_bad_release_id_without_fetching(self) -> None:
        """A path-like id is not turned into a URL."""
        fake = FakeFetch()
        with TempLibrary() as temp:
            path = _mp3(temp.root / "bare.mp3")
            before = path.read_bytes()
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 1, path)
            with self.assertRaises(library.LibraryError) as caught:
                album_art.embed(
                    library.LIBRARY_SPACE, 1, "../etc/passwd", confirm=True, fetch=fake
                )
            self.assertEqual(path.read_bytes(), before)
        self.assertEqual(caught.exception.message, album_art.NEEDS_RELEASE)
        self.assertEqual(fake.urls, [])

    def test_mp4_is_unsupported(self) -> None:
        """An M4A with no cover is listed as missing but embed is refused."""
        with TempLibrary() as temp:
            path = temp.root / "x.m4a"
            path.write_bytes(b"\x00\x00\x00\x18ftypM4A " + bytes(32))
            with open_database(temp.db) as conn:
                conn.execute("DELETE FROM space_asset")
                conn.execute("DELETE FROM asset")
                _add_track(conn, 1, path, name="Clip")
            listed = album_art.missing(temp.db, library.LIBRARY_SPACE)
            with self.assertRaises(library.LibraryError) as caught:
                album_art.preview(
                    temp.db, library.LIBRARY_SPACE, 1, fetch=FakeFetch(), sleep=lambda _n: None
                )
        self.assertEqual([int(row["id"]) for row in listed["tracks"]], [1])  # type: ignore[union-attr]
        self.assertEqual(caught.exception.message, album_art.FORMAT)

    def test_unknown_space_and_missing_library(self) -> None:
        """A bad space and a missing database are refused."""
        with TempLibrary() as temp, tempfile.TemporaryDirectory() as raw:
            with self.assertRaises(library.LibraryError):
                album_art.missing(temp.db, "Nope")
            with self.assertRaises(library.LibraryError) as caught:
                album_art.missing(Path(raw) / "master.sqlite", library.LIBRARY_SPACE)
        self.assertEqual(caught.exception.status, 404)


class AlbumArtApiTests(ApiTests):
    """GET and POST /api/album-art against the fixture library."""

    def test_get_and_preview_and_embed(self) -> None:
        """GET lists the bare file. Preview does not write. Embed writes APIC."""
        path = _mp3(self.library.root / "bare.mp3", [_geob_frame("Serato Markers2", _markers_payload())])
        geob = _geob_frames(path)
        with closing(sqlite3.connect(self.library.db)) as conn:
            conn.execute("DELETE FROM space_asset")
            conn.execute("DELETE FROM asset")
            _add_track(conn, 8, path)
            conn.commit()
        fake = FakeFetch()
        with mock.patch("album_art.fetch_url", fake):
            status, listed = self.request("/api/album-art?space=Serato%20Library")
            self.assertEqual(status, 200)
            self.assertEqual(listed["tracks"][0]["id"], 8)
            before = path.read_bytes()
            status, preview = self.request(
                "/api/album-art",
                {"action": "preview", "space": "Serato Library", "id": 8},
            )
            self.assertEqual(status, 200)
            self.assertEqual(preview["written"], False)
            self.assertEqual(path.read_bytes(), before)
            status, written = self.request(
                "/api/album-art",
                {
                    "action": "embed",
                    "space": "Serato Library",
                    "id": 8,
                    "release_id": RELEASE,
                    "confirm": True,
                },
            )
        self.assertEqual(status, 200)
        self.assertEqual(written["written"], True)
        self.assertTrue(tags.read_file_health(str(path))["artwork"])
        self.assertEqual(_geob_frames(path), geob)

    def test_unknown_space_is_400(self) -> None:
        """An unknown space is refused before a lookup."""
        status, payload = self.request("/api/album-art?space=Nope")
        self.assertEqual(status, 400)
        self.assertEqual(payload["error"], "That space is not available here.")


if __name__ == "__main__":
    unittest.main()
