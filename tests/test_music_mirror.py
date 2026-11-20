"""Hash-checked music-file mirror (#394)."""

from __future__ import annotations

import json
import os
import tempfile
import unittest
import urllib.parse
from pathlib import Path
from unittest import mock

import error_codes
import files
import folder_sync
import library
import music_mirror
from library import LibraryError
from tests.fixture import TempLibrary, open_database
from tests.test_server import ApiTests as ServerApiTests
from tests.test_smart_presets import _members
from tests.test_tags import _id3_file, _markers_payload, read_serato_tags


def _touch(path: Path, body: bytes = b"ID3") -> None:
    """Create a tiny dummy audio file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)


def _point(temp: TempLibrary, asset_id: int, path: Path) -> None:
    """Point a fixture track at a dummy file."""
    with open_database(temp.db) as conn:
        conn.execute(
            "UPDATE asset SET portable_id = ?, file_name = ? WHERE id = ?",
            (str(path), path.name, asset_id),
        )


def _add_asset(temp: TempLibrary, asset_id: int, path: Path, *, name: str | None = None) -> None:
    """Insert a library track that points at a dummy file."""
    _touch(path)
    with open_database(temp.db) as conn:
        conn.execute(
            """
            INSERT INTO asset (id, name, artist, bpm, key, file_name, portable_id, location_id, is_missing)
            VALUES (?, ?, 'Artist', 120, '1A', ?, ?, 1, 0)
            """,
            (asset_id, name or path.stem, path.name, str(path)),
        )
        conn.execute("INSERT INTO space_asset (asset_id, space_id) VALUES (?, 1)", (asset_id,))


class DestForTests(unittest.TestCase):
    """Dest mapping keeps relative folders and refuses _Serato_."""

    def test_rel_under_collapsed_root(self) -> None:
        dest = Path("/backup")
        root = Path("/Music")
        self.assertEqual(
            music_mirror.dest_for(Path("/Music/album/a.mp3"), dest, [root]),
            dest / "album" / "a.mp3",
        )
        self.assertEqual(
            music_mirror.dest_for(Path("/Music/a.mp3"), dest, [root]),
            dest / "a.mp3",
        )

    def test_no_root_uses_file_name(self) -> None:
        dest = Path("/backup")
        self.assertEqual(
            music_mirror.dest_for(Path("/other/a.mp3"), dest, [Path("/Music")]),
            dest / "a.mp3",
        )

    def test_serato_rel_is_refused(self) -> None:
        dest = Path("/backup")
        root = Path("/Music")
        self.assertIsNone(music_mirror.dest_for(Path("/Music/_Serato_/a.mp3"), dest, [root]))
        self.assertIsNone(music_mirror.dest_for(Path("/Music/../a.mp3"), dest, [root]))


class MusicMirrorTests(unittest.TestCase):
    """Preview, copy, restore, crate, and dest refusals against dummy files."""

    def test_preview_needs_a_folder(self) -> None:
        with TempLibrary():
            with self.assertRaisesRegex(LibraryError, folder_sync.CHOOSE_FOLDER):
                music_mirror.preview("", library.LIBRARY_SPACE)
            with self.assertRaisesRegex(LibraryError, folder_sync.CHOOSE_FOLDER):
                music_mirror.preview("   ", library.LIBRARY_SPACE)

    def test_dest_inside_library_is_refused(self) -> None:
        with TempLibrary() as temp:
            dest = temp.root / "backup"
            dest.mkdir()
            with self.assertRaisesRegex(LibraryError, music_mirror.DEST_LIBRARY):
                music_mirror.preview(str(dest), library.LIBRARY_SPACE)

    def test_dest_inside_serato_is_refused(self) -> None:
        with TempLibrary():
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw) / "_Serato_"
                dest.mkdir()
                with self.assertRaisesRegex(LibraryError, music_mirror.DEST_SERATO):
                    music_mirror.preview(str(dest), library.LIBRARY_SPACE)
                nested = dest / "keep"
                nested.mkdir()
                with self.assertRaisesRegex(LibraryError, music_mirror.DEST_SERATO):
                    music_mirror.preview(str(nested), library.LIBRARY_SPACE)

    def test_dest_beside_serato_is_allowed(self) -> None:
        with TempLibrary() as temp:
            tunes = temp.root / "tunes" / "a.mp3"
            _touch(tunes)
            _point(temp, 1, tunes)
            with tempfile.TemporaryDirectory() as raw:
                home = Path(raw)
                (home / "_Serato_").mkdir()
                dest = home / "Backup"
                dest.mkdir()
                report = music_mirror.preview(str(dest), library.LIBRARY_SPACE)
                self.assertEqual(report["copy_count"], 1)
                self.assertEqual(report["preview"], True)

    def test_dest_overlapping_music_is_refused(self) -> None:
        with TempLibrary() as temp:
            with tempfile.TemporaryDirectory() as raw:
                music = Path(raw) / "tunes"
                track = music / "a.mp3"
                _touch(track)
                _point(temp, 1, track)
                with self.assertRaisesRegex(LibraryError, music_mirror.DEST_MUSIC):
                    music_mirror.preview(str(music), library.LIBRARY_SPACE)
                with self.assertRaisesRegex(LibraryError, music_mirror.DEST_MUSIC):
                    music_mirror.preview(str(Path(raw)), library.LIBRARY_SPACE)
                inside = music / "keep"
                inside.mkdir()
                with self.assertRaisesRegex(LibraryError, music_mirror.DEST_MUSIC):
                    music_mirror.preview(str(inside), library.LIBRARY_SPACE)

    def test_dest_as_file_is_refused(self) -> None:
        with TempLibrary():
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw) / "file.mp3"
                dest.write_bytes(b"nope")
                with self.assertRaisesRegex(LibraryError, folder_sync.FOLDER_UNREADABLE):
                    music_mirror.preview(str(dest), library.LIBRARY_SPACE)

    def test_copy_is_incremental_and_preserves_geob(self) -> None:
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "cued.mp3"
            source.parent.mkdir(parents=True, exist_ok=True)
            _id3_file(_markers_payload(), source)
            _point(temp, 1, source)
            before = source.read_bytes()
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                first = music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                self.assertEqual((first["written"], first["copied"], first["skip_count"]), (True, 1, 1))
                mapped = dest / "cued.mp3"
                self.assertTrue(mapped.is_file())
                self.assertEqual(mapped.read_bytes(), before)
                self.assertEqual(source.read_bytes(), before)
                self.assertTrue(read_serato_tags(str(mapped))["found"])
                self.assertTrue(read_serato_tags(str(source))["found"])
                second = music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                self.assertEqual((second["copied"], second["skip_count"], second["copy_count"]), (0, 1, 0))

    def test_same_name_different_size_is_copied_again(self) -> None:
        """A longer dest file with the same name is not treated as already copied."""
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "a.mp3"
            _touch(source, b"AAAA")
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                first = music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                self.assertEqual(first["copied"], 1)
                mapped = dest / "a.mp3"
                mapped.write_bytes(b"BBBBBBBB")
                source.write_bytes(b"CCCC")
                again = music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                self.assertGreaterEqual(int(again["copied"]), 1)
                self.assertEqual(mapped.read_bytes(), b"CCCC")

    def test_same_name_same_size_different_hash_is_copied_again(self) -> None:
        """Equal length is not enough. A different hash is copied again."""
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "a.mp3"
            _touch(source, b"AAAA")
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                mapped = dest / "a.mp3"
                mapped.write_bytes(b"BBBB")
                again = music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                self.assertGreaterEqual(int(again["copied"]), 1)
                self.assertEqual(mapped.read_bytes(), b"AAAA")

    def test_hash_mismatch_is_not_backed_up(self) -> None:
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "a.mp3"
            _touch(source, b"good-bytes")
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)

                def _wrong(src: Path, dst: Path, *args: object, **kwargs: object) -> None:
                    Path(dst).parent.mkdir(parents=True, exist_ok=True)
                    Path(dst).write_bytes(b"wrong-bytes")

                with mock.patch("music_mirror.shutil.copy2", side_effect=_wrong):
                    report = music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                self.assertGreaterEqual(report["mismatch_count"], 1)
                self.assertEqual(report["copied"], 0)
                self.assertNotEqual((dest / "a.mp3").read_bytes(), source.read_bytes())

    def test_only_on_laptop_crate(self) -> None:
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "solo.mp3"
            _touch(source)
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                dest_path = Path(dest)
                dest_path.mkdir(exist_ok=True)
                preview = music_mirror.preview(str(dest_path), library.LIBRARY_SPACE)
                self.assertEqual(preview["only_laptop_count"], 1)
                self.assertEqual(preview["copy_count"], 1)
                made = music_mirror.create_crate(str(dest_path), library.LIBRARY_SPACE)
                self.assertTrue(made["written"])
                saved = made["saved"]
                self.assertIsInstance(saved, dict)
                self.assertEqual(saved["name"], music_mirror.CRATE_NAME)  # type: ignore[index]
                crate_id = saved["id"]  # type: ignore[index]
                self.assertEqual(_members(int(crate_id)), [1])
                music_mirror.copy_files(str(dest_path), library.LIBRARY_SPACE)
                with mock.patch("library.crate_action") as create:
                    empty = music_mirror.create_crate(str(dest_path), library.LIBRARY_SPACE)
                create.assert_not_called()
                self.assertEqual((empty["written"], empty["saved"], empty["only_laptop_count"]), (False, None, 0))

    def test_restore_skips_a_newer_laptop_file(self) -> None:
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "a.mp3"
            _touch(source, b"laptop-v1")
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                mapped = dest / "a.mp3"
                older = os.stat(mapped).st_mtime - 60
                os.utime(mapped, (older, older))
                source.write_bytes(b"laptop-newer")
                later = os.stat(mapped).st_mtime + 60
                os.utime(source, (later, later))
                report = music_mirror.restore_files(str(dest), library.LIBRARY_SPACE)
                self.assertGreaterEqual(report["skip_newer_count"], 1)
                self.assertEqual(source.read_bytes(), b"laptop-newer")

    def test_restore_puts_back_a_missing_laptop_file(self) -> None:
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "a.mp3"
            _touch(source, b"keep-me")
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                source.unlink()
                report = music_mirror.restore_files(str(dest), library.LIBRARY_SPACE)
                self.assertTrue(report["written"])
                self.assertTrue(source.is_file())
                self.assertEqual(source.read_bytes(), b"keep-me")

    def test_action_preview_without_confirm_does_not_copy(self) -> None:
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "a.mp3"
            _touch(source)
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                dest_path = Path(dest)
                dest_path.mkdir(exist_ok=True)
                report = music_mirror.action(
                    {
                        "action": "copy",
                        "dest": str(dest_path),
                        "space": library.LIBRARY_SPACE,
                    }
                )
                self.assertEqual(report["preview"], True)
                self.assertFalse((dest_path / "a.mp3").exists())
                written = music_mirror.action(
                    {
                        "action": "copy",
                        "dest": str(dest_path),
                        "space": library.LIBRARY_SPACE,
                        "confirm": True,
                    }
                )
                self.assertEqual(written["copied"], 1)
                self.assertTrue((dest_path / "a.mp3").is_file())

    def test_relink_points_missing_tracks_at_dest(self) -> None:
        with TempLibrary() as temp:
            source = temp.root / "tunes" / "a.mp3"
            _touch(source, b"keep")
            _point(temp, 1, source)
            with tempfile.TemporaryDirectory() as raw:
                dest = Path(raw)
                music_mirror.copy_files(str(dest), library.LIBRARY_SPACE)
                source.unlink()
                preview = music_mirror.relink_missing(str(dest), library.LIBRARY_SPACE, confirm=False)
                self.assertEqual(preview["relink_count"], 1)
                self.assertEqual(preview["written"], False)
                written = music_mirror.relink_missing(str(dest), library.LIBRARY_SPACE, confirm=True)
                self.assertTrue(written["written"])
                with open_database(temp.db) as conn:
                    stored = conn.execute("SELECT portable_id FROM asset WHERE id = 1").fetchone()[0]
                mapped = dest / "a.mp3"
                self.assertEqual(stored, files.to_portable(mapped))
                self.assertEqual(files.resolve_stored(str(stored)), mapped.resolve())

    def test_unknown_action_is_refused(self) -> None:
        with self.assertRaisesRegex(LibraryError, "That action is not available."):
            music_mirror.action({"action": "wipe", "dest": "/tmp", "space": library.LIBRARY_SPACE})

    def test_error_codes_are_registered(self) -> None:
        self.assertEqual(error_codes.ERROR_CODES.get(music_mirror.DEST_SERATO), "mirror_dest_serato")
        self.assertEqual(error_codes.ERROR_CODES.get(music_mirror.DEST_LIBRARY), "mirror_dest_library")
        self.assertEqual(error_codes.ERROR_CODES.get(music_mirror.DEST_MUSIC), "mirror_dest_music")
        root = Path(__file__).resolve().parent.parent
        english = json.loads((root / "locales" / "en.json").read_text(encoding="utf-8"))
        self.assertEqual(english["error.mirror_dest_serato"], music_mirror.DEST_SERATO)
        self.assertEqual(english["error.mirror_dest_library"], music_mirror.DEST_LIBRARY)
        self.assertEqual(english["error.mirror_dest_music"], music_mirror.DEST_MUSIC)
        spanish = json.loads((root / "locales" / "es.json").read_text(encoding="utf-8"))
        self.assertTrue(spanish["error.mirror_dest_serato"])
        self.assertTrue(spanish["error.mirror_dest_library"])
        self.assertTrue(spanish["error.mirror_dest_music"])


class MirrorApiTests(unittest.TestCase):
    """GET /api/music-mirror is read-only. POST copy writes dest audio."""

    setUp = ServerApiTests.setUp
    tearDown = ServerApiTests.tearDown
    request = ServerApiTests.request

    def test_get_needs_dest(self) -> None:
        status, body = self.request("/api/music-mirror?space=Serato%20Library")
        self.assertEqual((status, body["code"]), (400, "choose_folder"))  # type: ignore[index]

    def test_get_preview(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            dest = urllib.parse.quote(raw, safe="")
            status, body = self.request(f"/api/music-mirror?dest={dest}&space=Serato%20Library")
        self.assertEqual(status, 200)
        self.assertEqual((body["preview"], body["written"]), (True, False))  # type: ignore[index]

    def test_post_copy_without_confirm_is_preview(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            dest = Path(raw)
            source = self.library.root / "tunes" / "a.mp3"
            _touch(source, b"keep")
            _point(self.library, 1, source)
            status, body = self.request(
                "/api/music-mirror",
                {
                    "action": "copy",
                    "dest": str(dest),
                    "space": library.LIBRARY_SPACE,
                },
            )
            self.assertEqual(status, 200)
            self.assertEqual(body["preview"], True)  # type: ignore[index]
            self.assertFalse((dest / "a.mp3").exists())

    def test_post_copy_confirm_writes_dest_and_skips_invalidate(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            dest = Path(raw)
            source = self.library.root / "tunes" / "a.mp3"
            _touch(source, b"keep")
            _point(self.library, 1, source)
            with mock.patch("server.invalidate") as invalidate:
                status, body = self.request(
                    "/api/music-mirror",
                    {
                        "action": "copy",
                        "dest": str(dest),
                        "space": library.LIBRARY_SPACE,
                        "confirm": True,
                    },
                )
            self.assertEqual(status, 200)
            self.assertEqual(body["copied"], 1)  # type: ignore[index]
            self.assertTrue((dest / "a.mp3").is_file() or any(dest.rglob("a.mp3")))
            invalidate.assert_not_called()

    def test_post_unknown_action(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            status, body = self.request(
                "/api/music-mirror",
                {
                    "action": "wipe",
                    "dest": raw,
                    "space": library.LIBRARY_SPACE,
                    "confirm": True,
                },
            )
        self.assertEqual((status, body["code"]), (400, "action_unavailable"))  # type: ignore[index]

    def test_post_crate_confirm_writes_and_invalidates(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            dest = Path(raw)
            source = self.library.root / "tunes" / "a.mp3"
            _touch(source, b"keep")
            _point(self.library, 1, source)
            with mock.patch("server.invalidate") as invalidate:
                status, body = self.request(
                    "/api/music-mirror",
                    {
                        "action": "crate",
                        "dest": str(dest),
                        "space": library.LIBRARY_SPACE,
                        "confirm": True,
                    },
                )
            self.assertEqual(status, 200)
            self.assertTrue(body["written"])  # type: ignore[index]
            self.assertEqual(body["saved"]["name"], music_mirror.CRATE_NAME)  # type: ignore[index]
            invalidate.assert_called()


if __name__ == "__main__":
    unittest.main()
