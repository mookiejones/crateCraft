"""Fuzz crate and database V2 bytes, and refuse ``export.pdb`` as a library.

The samples are seeded random bytes and truncations of a synthetic crate.
Nothing here is a user's ``master.sqlite`` or audio. Pioneer ``export.pdb``
is not parsed: crateCraft has no pdb parser.
"""

from __future__ import annotations

import os
import random
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import drive_check
import library
import snapshots


def _chunk(tag: str, body: bytes) -> bytes:
    """Encode one Serato chunk.

    Args:
        tag: Four-byte ASCII tag.
        body: Payload.

    Returns:
        Tag, big-endian length, and payload.
    """
    return tag.encode("ascii") + len(body).to_bytes(4, "big") + body


def _text_chunk(tag: str, text: str) -> bytes:
    """Encode one UTF-16-BE text chunk.

    Args:
        tag: Four-byte ASCII tag.
        text: Path or label.

    Returns:
        One chunk.
    """
    return _chunk(tag, text.encode("utf-16-be"))


def _otrk(field: str, text: str) -> bytes:
    """Encode one ``otrk`` whose path field is ``text``.

    Args:
        field: ``ptrk`` for a crate or ``pfil`` for ``database V2``.
        text: Stored path.

    Returns:
        One ``otrk`` chunk.
    """
    return _chunk("otrk", _text_chunk(field, text))


def _crate(paths: list[str]) -> bytes:
    """Encode a synthetic crate.

    Args:
        paths: ``ptrk`` values.

    Returns:
        A ``vrsn`` chunk plus one ``otrk`` per path.
    """
    parts = [_text_chunk("vrsn", "1.0/Serato ScratchLive Crate")]
    parts.extend(_otrk("ptrk", path) for path in paths)
    return b"".join(parts)


def _database_v2(paths: list[str]) -> bytes:
    """Encode a synthetic ``database V2`` file.

    Args:
        paths: ``pfil`` values.

    Returns:
        A ``vrsn`` chunk plus one ``otrk`` per path.
    """
    parts = [_text_chunk("vrsn", "2.0/Serato Scratch LIVE Database")]
    parts.extend(_otrk("pfil", path) for path in paths)
    return b"".join(parts)


def _names(root: Path) -> set[str]:
    """List relative names under ``root``, including directories.

    Args:
        root: Directory to list. Shortcuts are not followed.

    Returns:
        Relative POSIX paths. A missing directory is an empty set.
    """
    if not root.exists():
        return set()
    found: set[str] = set()
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        current = Path(dirpath)
        for name in dirnames:
            found.add((current / name).relative_to(root).as_posix() + "/")
        for name in filenames:
            found.add((current / name).relative_to(root).as_posix())
    return found


def _inside(path: Path, root: Path) -> bool:
    """Return whether ``path`` stays inside ``root``.

    Args:
        path: Resolved file.
        root: Fixture root.

    Returns:
        True when ``path`` is ``root`` or a file under it. Comparison
        uses the platform's case folding.
    """
    resolved = os.path.normcase(str(path.resolve()))
    base = os.path.normcase(str(root.resolve()))
    return resolved == base or resolved.startswith(base + os.sep)


def _safe_to_resolve(text: str) -> bool:
    """Return whether a stored path can be resolved without a network name.

    Args:
        text: Path from a parser.

    Returns:
        False for an empty string, a NUL, a very long string, or a UNC
        path. Resolving ``//server/share`` can block.
    """
    if not text or "\x00" in text or len(text) > 300:
        return False
    folded = text.replace("\\", "/")
    return not folded.startswith("//")


def _samples(valid: bytes) -> list[bytes]:
    """Build seeded random blobs and truncations of ``valid``.

    Args:
        valid: Synthetic crate or database bytes.

    Returns:
        Blobs. The generator is ``random.Random(385)``.
    """
    rng = random.Random(385)
    blobs: list[bytes] = [b"", valid[:1], valid[:7], valid[:8]]
    for length in range(0, len(valid), max(1, len(valid) // 12)):
        blobs.append(valid[:length])
    blobs.append(valid)
    for size in (0, 1, 3, 8, 15, 16, 64, 257, 512):
        blobs.append(bytes(rng.getrandbits(8) for _ in range(size)))
    return blobs


class UntrustedParserTests(unittest.TestCase):
    """Parsers of crate and database V2 bytes must not write or escape."""

    def test_seeded_bytes_do_not_raise_write_or_escape(self) -> None:
        """Random and truncated bytes stay inside the fixture.

        ``parse_serato_bytes``, ``parse_database_v2``, ``parse_chunks``,
        and ``drive_check`` crate parse must not raise. A resolved path
        must stay inside the fixture. The fixture gains no file the test
        did not write. A UNC-shaped string is not resolved, because that
        can block, and it is not opened.

        Returns:
            None. The test fails if a parser raises, writes, or returns
            a path outside the fixture.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            music = root / "music"
            music.mkdir()
            kept = music / "keep.mp3"
            kept.write_bytes(b"not-audio")
            outside = root / "outside.mp3"
            outside.write_bytes(b"secret")
            serato = root / "_Serato_" / "Subcrates"
            serato.mkdir(parents=True)
            drive = root
            crate = _crate(["keep.mp3", "../outside.mp3", str(outside), "C:/Windows/not-here.mp3"])
            database = _database_v2(["keep.mp3", "../outside.mp3", str(outside)])
            before = _names(root)
            for blob in _samples(crate) + _samples(database):
                paths = snapshots.parse_serato_bytes(blob)
                rows = snapshots.parse_database_v2(blob)
                snapshots.parse_chunks(blob)
                (serato / "Noise.crate").write_bytes(blob)
                parsed = drive_check._parse_crates(serato.parent, [(serato / "Noise.crate", "Subcrates")], [])
                texts = list(paths)
                texts.extend(str(row.get("path") or "") for row in rows)
                for crate_file in parsed:
                    texts.extend(crate_file.paths)
                for text in texts:
                    if not _safe_to_resolve(text):
                        continue
                    resolved = snapshots._resolve_track(text, music)
                    if resolved is not None:
                        self.assertTrue(
                            _inside(resolved, music),
                            f"{text!r} resolved to {resolved}",
                        )
            report = drive_check.check_drive(drive, filesystem="", exists=lambda _path: False)
            for finding in report.findings:
                if finding.found:
                    self.assertTrue(_inside(Path(finding.found), root), finding.found)
            after = _names(root)
            self.assertEqual(after - before, {"_Serato_/Subcrates/Noise.crate"})
            kept_path = snapshots._resolve_track("keep.mp3", music)
            self.assertIsNotNone(kept_path)
            assert kept_path is not None
            self.assertTrue(_inside(kept_path, music))
            self.assertIsNone(snapshots._resolve_track("../outside.mp3", music))
            self.assertIsNone(snapshots._resolve_track(str(outside), music))

    def test_read_only_sqlite_fuzz_does_not_write(self) -> None:
        """Garbage opened as ``master.sqlite`` does not gain a sidecar.

        ``snapshots._connect_read_only`` may raise ``sqlite3.Error``.
        Any other exception fails the test. The file bytes stay put, and
        the directory does not gain ``-wal``, ``-shm``, or ``-journal``.

        Returns:
            None. The test fails if the open writes or raises an
            unexpected type.
        """
        rng = random.Random(385)
        blobs = [b"", b"SQLite format 3\x00", b"not a database"]
        blobs.extend(bytes(rng.getrandbits(8) for _ in range(size)) for size in (1, 16, 100, 512))
        for blob in blobs:
            with tempfile.TemporaryDirectory() as tmp:
                folder = Path(tmp)
                path = folder / "master.sqlite"
                path.write_bytes(blob)
                before = _names(folder)
                original = path.read_bytes()
                try:
                    connection = snapshots._connect_read_only(path)
                except sqlite3.Error:
                    connection = None
                else:
                    connection.close()
                self.assertEqual(path.read_bytes(), original)
                self.assertEqual(_names(folder), before)
                for suffix in ("-wal", "-shm", "-journal"):
                    self.assertFalse((folder / f"master.sqlite{suffix}").exists())


class ExportPdbTests(unittest.TestCase):
    """``export.pdb`` is not opened as the library. It is not parsed."""

    def _serato_sqlite(self, path: Path) -> None:
        """Write a tiny database that has the three Serato table names.

        Args:
            path: Destination. The bytes are synthetic.

        Returns:
            None.
        """
        connection = sqlite3.connect(path)
        try:
            connection.execute("CREATE TABLE asset (id INTEGER)")
            connection.execute("CREATE TABLE container (id INTEGER)")
            connection.execute("CREATE TABLE space (id INTEGER)")
            connection.commit()
        finally:
            connection.close()

    def test_export_pdb_is_not_opened_as_the_library(self) -> None:
        """A Pioneer-named file is not the library, even with Serato tables.

        ``is_serato_database`` returns false without copying or opening the
        file. ``use_library_file`` refuses it. A symlink named
        ``master.sqlite`` that points at ``export.pdb`` is not opened.
        Drive check does not open ``export.pdb``. ``parse_pdb`` does not
        exist. Windows and macOS names are the file name, not a drive.

        Returns:
            None. The test fails if the file is opened or accepted.
        """
        self.assertFalse(library.is_library_filename("export.pdb"))
        self.assertFalse(library.is_library_filename("Export.PDB"))
        self.assertFalse(hasattr(snapshots, "parse_pdb"))
        self.assertFalse(hasattr(library, "parse_pdb"))
        self.assertFalse(hasattr(drive_check, "parse_pdb"))
        previous = library.MASTER
        try:
            with tempfile.TemporaryDirectory() as tmp:
                folder = Path(tmp)
                pdb = folder / "export.pdb"
                self._serato_sqlite(pdb)
                upper = folder / "Export.PDB"
                upper.write_bytes(pdb.read_bytes())
                link = folder / "master.sqlite"
                link.symlink_to(pdb)
                opened: list[str] = []

                def refuse_copy(path: Path):
                    opened.append(Path(path).name)
                    raise AssertionError(f"opened {path}")

                with mock.patch.object(library, "copied_read_conn", refuse_copy):
                    self.assertFalse(library.is_serato_database(pdb))
                    self.assertFalse(library.is_serato_database(upper))
                    self.assertFalse(library.is_serato_database(link))
                self.assertEqual(opened, [])
                with self.assertRaises(library.LibraryError):
                    library.use_library_file(pdb)
                self.assertEqual(library.MASTER, previous)
                serato = folder / "_Serato_"
                (serato / "Subcrates").mkdir(parents=True)
                (serato / "export.pdb").write_bytes(pdb.read_bytes())
                (serato / "Subcrates" / "House.crate").write_bytes(_crate(["keep.mp3"]))
                reads: list[str] = []
                real_open = os.open

                def track_open(path, flags, *args, **kwargs):
                    reads.append(os.fsdecode(path))
                    return real_open(path, flags, *args, **kwargs)

                with mock.patch("drive_check.os.open", track_open):
                    drive_check.check_drive(folder, filesystem="", exists=lambda _path: False)
                self.assertFalse(any(name.casefold().endswith("export.pdb") for name in reads))
                self.assertEqual(
                    snapshots._crates_from_file("drive", "Drive", True, "export.pdb", pdb.read_bytes()),
                    [],
                )
        finally:
            library.MASTER = previous
