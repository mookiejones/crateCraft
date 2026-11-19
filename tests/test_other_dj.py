"""Other DJ library detection. Read-only. No Serato database."""

from __future__ import annotations

import gc
import os
import sqlite3
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from unittest import mock

import other_dj


def _touch(path: Path, text: str = "x") -> None:
    """Create a file and its parents.

    Args:
        path: File to write.
        text: File body.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _sqlite(path: Path, statements: str) -> None:
    """Create a small SQLite file and close it.

    The connection and its statement cache keep each other alive until a
    cyclic collection. Windows cannot delete the file while that handle is
    open, so close it before the caller removes the directory.

    Args:
        path: Database to create.
        statements: SQL script.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        conn.executescript(statements)
    finally:
        conn.close()


class PathKeyTests(unittest.TestCase):
    """Path comparison keys."""

    def test_windows_file_uri_and_parent_collapse(self) -> None:
        """Fold a Windows path, keep a POSIX path, and collapse ``..``.

        A longer name that only starts with the file name is a different key.
        A Traktor Windows drive stays at the front.

        Returns:
            None. The test fails if two different files share a key.
        """
        self.assertEqual(
            other_dj.path_key("C:\\Music\\Song.mp3", fold=True),
            "c:/music/song.mp3",
        )
        self.assertEqual(
            other_dj.path_key("/Music/Song.mp3", fold=False),
            "/Music/Song.mp3",
        )
        self.assertEqual(
            other_dj.path_key("file:///C:/Music/Song.mp3", fold=True),
            "c:/music/song.mp3",
        )
        self.assertEqual(
            other_dj.path_key("/a/b/../c/song.mp3", fold=False),
            "/a/c/song.mp3",
        )
        self.assertNotEqual(
            other_dj.path_key("/song.mp3", fold=False),
            other_dj.path_key("/song.mp3.bak", fold=False),
        )
        self.assertEqual(
            other_dj.traktor_path("C:/:Users/:me/:Music/:", "song.mp3"),
            "C:/Users/me/Music/song.mp3",
        )
        self.assertEqual(
            other_dj.traktor_path("/:Users/:me/:Music/:", "song.mp3"),
            "/Users/me/Music/song.mp3",
        )
        self.assertEqual(other_dj.traktor_path("/:Users/:", ""), "")


class ParserTests(unittest.TestCase):
    """Each app's library file. These tests do not open a home directory."""

    def test_helper_closes_the_database_before_cleanup(self) -> None:
        """Drop the SQLite handle before the temporary directory is removed.

        The connection and its statement cache keep each other alive until
        a cyclic collection. Windows cannot delete a file that handle still
        has open.

        Returns:
            None. The test fails if this database is still open.
        """
        gc.disable()
        try:
            with tempfile.TemporaryDirectory() as raw:
                path = Path(raw) / "djay.db"
                _sqlite(path, "CREATE TABLE media (path TEXT);")
                wanted = path.resolve()
                for obj in gc.get_objects():
                    if type(obj) is not sqlite3.Connection:
                        continue
                    try:
                        rows = obj.execute("PRAGMA database_list").fetchall()
                    except sqlite3.ProgrammingError:
                        continue
                    for _seq, _name, filename in rows:
                        if not isinstance(filename, str) or not filename:
                            continue
                        if Path(filename).resolve() == wanted:
                            self.fail(f"{path} is still open")
        finally:
            gc.enable()
            gc.collect()

    def test_each_library_names_only_its_own_file(self) -> None:
        """A stored path matches that file and not a longer name.

        rekordbox, Engine DJ, Traktor, VirtualDJ, and djay each contribute
        one path. A djay note and a blob column do not. Garbage bytes and
        an oversized XML contribute nothing.

        Returns:
            None. The test fails if a prefix or a note counts as the file.
        """
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            song = root / "song.mp3"
            bak = root / "song.mp3.bak"
            _sqlite(
                root / "master.db",
                "CREATE TABLE djmdContent (FolderPath TEXT, FileNameL TEXT);"
                f"INSERT INTO djmdContent VALUES ('{root.as_posix()}/', 'song.mp3');",
            )
            _sqlite(
                root / "m.db",
                "CREATE TABLE Track (path TEXT);"
                f"INSERT INTO Track VALUES ('{song.as_posix()}');",
            )
            nml = root / "collection.nml"
            _touch(
                nml,
                "<NML><COLLECTION><ENTRY>"
                '<LOCATION DIR="/:Users/:me/:Music/:" FILE="song.mp3"/>'
                "</ENTRY></COLLECTION></NML>",
            )
            xml = root / "database.xml"
            tree = ET.Element("VirtualDJ_Database")
            ET.SubElement(tree, "Song", FilePath=str(bak))
            xml.write_bytes(ET.tostring(tree))
            _sqlite(
                root / "djay.db",
                "CREATE TABLE media (path TEXT, secret BLOB);"
                "CREATE TABLE Note (body TEXT);"
                f"INSERT INTO media VALUES ('{song.as_posix()}', X'00');"
                f"INSERT INTO Note VALUES ('{bak.as_posix()}');",
            )
            garbage = root / "encrypted.db"
            garbage.write_bytes(b"not sqlite")
            huge = root / "huge.xml"
            huge.write_text("<Song FilePath='/Music/song.mp3'/>", encoding="utf-8")

            rekordbox = other_dj.LibraryIndex([("rekordbox", root / "master.db")])
            engine = other_dj.LibraryIndex([("Engine DJ", root / "m.db")])
            traktor = other_dj.LibraryIndex([("Traktor", nml)])
            virtual = other_dj.LibraryIndex([("VirtualDJ", xml)])
            djay = other_dj.LibraryIndex([("djay", root / "djay.db")])
            broken = other_dj.LibraryIndex([("rekordbox", garbage)])
            missing = other_dj.LibraryIndex([("VirtualDJ", root / "missing.xml")])

            self.assertEqual(rekordbox.used_by(str(song), None), ["rekordbox"])
            self.assertEqual(engine.used_by(song.as_posix(), None), ["Engine DJ"])
            self.assertEqual(traktor.used_by("/Users/me/Music/song.mp3", None), ["Traktor"])
            self.assertEqual(virtual.used_by(str(bak), None), ["VirtualDJ"])
            self.assertEqual(virtual.used_by(str(song), None), [])
            self.assertEqual(djay.used_by(song.as_posix(), None), ["djay"])
            self.assertEqual(djay.used_by(str(bak), None), [])
            self.assertEqual(broken.used_by(str(song), None), [])
            self.assertEqual(missing.used_by(str(song), None), [])
            self.assertEqual(virtual.used_by("song.mp3", None), [])
            with mock.patch.object(other_dj, "_XML_CAP", 4):
                self.assertEqual(other_dj._virtualdj_paths(huge), [])

    def test_locate_uses_the_given_home_only(self) -> None:
        """An explicit home ignores ``APPDATA``.

        A planted VirtualDJ file and a Traktor collection are found. A
        rekordbox file under a different ``APPDATA`` is not.

        Returns:
            None. The test fails if the environment path is included.
        """
        with tempfile.TemporaryDirectory() as raw:
            base = Path(raw)
            home = base / "home"
            env = base / "env"
            xml = home / "Documents/VirtualDJ/database.xml"
            nml = home / "Documents/Native Instruments/Traktor 3/collection.nml"
            foreign = env / "Pioneer/rekordbox/master.db"
            _touch(xml, "<VirtualDJ_Database/>")
            _touch(nml, "<NML/>")
            _touch(foreign, "")
            with mock.patch.dict(os.environ, {"APPDATA": str(env)}):
                found = other_dj.locate_libraries(home)
            paths = {path.resolve() for _label, path in found}
            self.assertEqual(paths, {xml.resolve(), nml.resolve()})


class ProcessTests(unittest.TestCase):
    """Process names. The live process list is not read."""

    def test_labels_skip_bare_engine_and_a_djay_folder(self) -> None:
        """Apple's engine and a djay folder do not count.

        The djay executable, a command line that says Engine DJ, and a
        Windows ``djay.exe`` row do count. Order follows the app list.

        Returns:
            None. The test fails if a system process is treated as Engine DJ.
        """
        self.assertEqual(other_dj.labels_in_process("ANECompilerService"), [])
        self.assertEqual(
            other_dj.labels_in_process("/Users/me/Music/djay/ffmpeg"),
            [],
        )
        self.assertEqual(
            other_dj.labels_in_process("/Applications/djay.app/Contents/MacOS/djay"),
            ["djay"],
        )
        self.assertEqual(
            other_dj.apps_open(["/usr/bin/helper Engine DJ", "rekordbox"]),
            ["rekordbox", "Engine DJ"],
        )
        self.assertEqual(
            other_dj.apps_open(['"djay.exe","1234","Console"', "ANECompilerService"]),
            ["djay"],
        )
        self.assertEqual(other_dj.apps_open(["djay", "rekordbox"]), ["rekordbox", "djay"])

    def test_a_failed_process_list_is_empty(self) -> None:
        """An error, a timeout, or a failed command returns no names.

        A successful command returns its lines. ``apps_open`` is not called
        without an explicit list here.

        Returns:
            None. The test fails if a failed listing still names an app.
        """
        with mock.patch("other_dj.subprocess.run", side_effect=OSError("no ps")):
            self.assertEqual(other_dj.default_process_names(), [])
        with mock.patch(
            "other_dj.subprocess.run",
            side_effect=subprocess.TimeoutExpired(cmd="ps", timeout=2),
        ):
            self.assertEqual(other_dj.default_process_names(), [])
        failed = subprocess.CompletedProcess(["ps"], 1, stdout="rekordbox\n", stderr="")
        with mock.patch("other_dj.subprocess.run", return_value=failed):
            self.assertEqual(other_dj.default_process_names(), [])
        ok = subprocess.CompletedProcess(["ps"], 0, stdout="rekordbox\n helper \n", stderr="")
        with mock.patch("other_dj.subprocess.run", return_value=ok):
            self.assertEqual(other_dj.default_process_names(), ["rekordbox", "helper"])


if __name__ == "__main__":
    unittest.main()
