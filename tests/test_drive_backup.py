"""Plain backups of each drive's _Serato_ folder.

The copy uses ensure_backup and is_complete. A fixture library stands in
for the internal disk. Nothing here is a real Serato library.
"""

from __future__ import annotations

import errno
import hashlib
import json
import os
import stat
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from typing import cast
from unittest import mock

import error_codes
import library
import server
import snapshots
from tests.fixture import TempLibrary


ROOT = Path(__file__).resolve().parents[1]


def _spec(
    drive_id: str,
    label: str,
    root: Path | None,
    *,
    present: bool = True,
    role: str = "external",
) -> snapshots.DriveSpec:
    """Build one drive record for a temporary folder.

    Args:
        drive_id: Id stored in the backup. It need not be a path.
        label: Name shown for the drive.
        root: ``_Serato_`` directory, or None when the drive is unplugged.
        present: False when the drive is unplugged.
        role: ``internal`` or ``external``.

    Returns:
        A drive spec the backup can record.
    """
    music = None if root is None else root.parent
    return snapshots.DriveSpec(
        drive_id=drive_id,
        label=label,
        serato_root=root,
        music_root=music,
        role=role,
        present=present,
    )


def _write(path: Path, text: bytes) -> None:
    """Create a file and its parents.

    Args:
        path: File to create.
        text: Bytes to write.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(text)


def _tree(root: Path) -> dict[str, object]:
    """Snapshot a directory without following shortcuts.

    Args:
        root: Directory to read.

    Returns:
        Relative path to kind, digest, and mtime. A missing directory is
        an empty dict.
    """
    found: dict[str, object] = {}
    if not root.exists():
        return found
    for path in sorted(root.rglob("*")):
        rel = path.relative_to(root).as_posix()
        if path.is_symlink():
            found[rel] = ("link", os.readlink(path))
            continue
        if path.is_file():
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            found[rel] = ("file", digest, path.stat().st_mtime_ns)
            continue
        found[rel] = ("dir",)
    return found


def _usage(free: int) -> object:
    """Return a disk-usage stand-in with one free-byte count.

    Args:
        free: Bytes the destination claims are free.

    Returns:
        An object with ``total``, ``used``, and ``free``.
    """

    class Usage:
        def __init__(self, amount: int) -> None:
            self.total = amount
            self.used = 0
            self.free = amount

    return Usage(free)


def _oracle(master: Path, roots: list[Path]) -> int:
    """Sum the bytes a backup should measure, excluding Lexicon and Export Backups.

    Args:
        master: ``master.sqlite``.
        roots: ``_Serato_`` directories that will be copied.

    Returns:
        The source size. ``Recording`` and ``DJ Sessions`` are not included.
    """
    total = master.stat().st_size
    root_db = master.parent / "root.sqlite"
    if root_db.is_file() and not root_db.is_symlink():
        total += root_db.stat().st_size
    excluded = {"export backups", "lexicon", "recording", "dj sessions"}
    for root in roots:
        for dirpath, dirnames, filenames in os.walk(root):
            kept: list[str] = []
            for name in dirnames:
                folded = name.split(":", 1)[0].rstrip(" .").casefold()
                if folded not in excluded and not (Path(dirpath) / name).is_symlink():
                    kept.append(name)
            dirnames[:] = kept
            for name in filenames:
                path = Path(dirpath) / name
                if path.is_symlink():
                    continue
                folded = name.split(":", 1)[0].rstrip(" .").casefold()
                if folded in excluded:
                    continue
                total += path.stat().st_size
    return total


class DriveBackupTests(unittest.TestCase):
    """Copy present drive folders and record the ones that are not copied."""

    def test_present_drives_are_copied_and_an_unplugged_drive_is_listed(self) -> None:
        """Back up two mounted drives and record one that is unplugged.

        The unplugged drive has files on disk. They stay there and are not
        in the backup. Export Backups, Lexicon, Recording, and DJ Sessions
        stay out. A sibling of Recording is copied. Each drive directory
        holds only that drive's files. The
        source trees are unchanged, and the backup hashes match.

        Returns:
            None. The test fails if an unplugged drive fails the backup,
            if a file crosses drives, or if a hash does not match.
        """
        with TempLibrary() as temp:
            base = temp.root / "drives"
            internal = base / "Music" / "_Serato_"
            gig = base / "GIG" / "_Serato_"
            old = base / "OLD" / "_Serato_"
            _write(internal / "Subcrates" / "House.crate", b"house")
            _write(internal / "database V2", b"v2-music")
            _write(internal / "Recording" / "session.txt", b"recorded-audio-bytes")
            _write(internal / "DJ Sessions" / "set.txt", b"dj-session-audio-bytes")
            _write(internal / "Recording-extra" / "keep-rec.txt", b"keep-recording-extra")
            for name in ("Recording.", "DJ Sessions ", "DJ Sessions::$DATA"):
                try:
                    _write(internal / name / "audio.bin", b"folded-audio")
                except OSError:
                    continue
            _write(internal / "Export Backups" / "secret.zip", b"export-secret")
            _write(internal / "Lexicon" / "backup.zip", b"lexicon-secret")
            _write(internal / "Export Backups-extra" / "keep.crate", b"keep-extra")
            for name in ("Lexicon.", "Lexicon ", "Lexicon::$DATA"):
                try:
                    _write(internal / name / "hidden.txt", b"folded-secret")
                except OSError:
                    continue
            _write(gig / "Subcrates" / "Gig.crate", b"gig-only")
            _write(gig / "database V2", b"v2-gig")
            _write(old / "Subcrates" / "Old.crate", b"old-only")
            outside = base / "outside-secret.bin"
            outside.write_bytes(b"OUTSIDE-SECRET-BYTES")
            link = gig / "linked.crate"
            try:
                link.symlink_to(outside)
            except OSError:
                link = None
            nasty_id = "E:\\..\\Outside"
            nasty = base / "NASTY" / "_Serato_"
            _write(nasty / "Subcrates" / "Nasty.crate", b"nasty-only")
            specs = [
                _spec("internal-music", "Music", internal, role="internal"),
                _spec("dev-gig", "GIG", gig),
                _spec("dev-old", "OLD", old, present=False),
                _spec(nasty_id, "NASTY", nasty),
            ]
            before = {str(path): _tree(path) for path in (internal, gig, old, nasty)}
            opens: list[tuple[str, int]] = []
            real_open = os.open

            def guard(path: object, flags: int, *args: object, **kwargs: object) -> int:
                resolved = Path(str(path)).resolve()
                writing = flags & (os.O_WRONLY | os.O_RDWR | os.O_APPEND | os.O_CREAT)
                for source in (internal, gig, old, nasty):
                    if source.resolve() == resolved or source.resolve() in resolved.parents:
                        if writing:
                            raise AssertionError(f"write opened on a drive: {resolved}")
                        opens.append((str(resolved), flags))
                return real_open(path, flags, *args, **kwargs)  # type: ignore[arg-type]

            with mock.patch("library.os.open", guard):
                folder = library.ensure_backup(specs)
            self.assertIsInstance(folder, Path)
            backup = cast(Path, folder)
            self.assertTrue(library.is_complete(backup))
            self.assertTrue(str(backup.resolve()).startswith(str((temp.root / "Backups").resolve())))
            for source in (internal, gig, old, nasty):
                self.assertFalse(str(backup.resolve()).startswith(str(source.resolve())))
                self.assertEqual(_tree(source), before[str(source)])
            stored = sorted(
                path.relative_to(backup).as_posix()
                for path in backup.rglob("*")
                if path.is_file()
            )
            joined = "\n".join(stored)
            self.assertNotIn("Export Backups/", joined)
            self.assertNotIn("Lexicon/", joined)
            blob = b"".join(path.read_bytes() for path in backup.rglob("*") if path.is_file())
            self.assertNotIn(b"export-secret", blob)
            self.assertNotIn(b"lexicon-secret", blob)
            self.assertNotIn(b"folded-secret", blob)
            self.assertNotIn(b"folded-audio", blob)
            self.assertNotIn(b"old-only", blob)
            self.assertNotIn(b"OUTSIDE-SECRET-BYTES", blob)
            self.assertNotIn(b"recorded-audio-bytes", blob)
            self.assertNotIn(b"dj-session-audio-bytes", blob)
            self.assertIn(b"keep-recording-extra", blob)
            self.assertIn(b"keep-extra", blob)
            self.assertIn(b"house", blob)
            self.assertIn(b"gig-only", blob)
            self.assertIn(b"nasty-only", blob)
            music_files = [name for name in stored if "/House.crate" in f"/{name}" or name.endswith("House.crate")]
            gig_files = [name for name in stored if name.endswith("Gig.crate")]
            nasty_files = [name for name in stored if name.endswith("Nasty.crate")]
            self.assertEqual(len(music_files), 1)
            self.assertEqual(len(gig_files), 1)
            self.assertEqual(len(nasty_files), 1)
            self.assertNotIn("Gig.crate", music_files[0])
            self.assertNotIn("House.crate", gig_files[0])
            self.assertTrue(music_files[0].startswith("drives/"))
            self.assertTrue(gig_files[0].startswith("drives/"))
            self.assertNotEqual(music_files[0].split("/")[1], gig_files[0].split("/")[1])
            self.assertNotIn("..", nasty_files[0].split("/"))
            self.assertNotIn("\\", nasty_files[0])
            self.assertFalse((temp.root / "escaped.txt").exists())
            marker = json.loads((backup / "COMPLETE").read_text(encoding="utf-8"))
            self.assertEqual(set(marker), {"algorithm", "hashes", "version"})
            for rel, digest in marker["hashes"].items():
                target = backup / rel
                self.assertEqual(hashlib.sha256(target.read_bytes()).hexdigest(), digest)
            report = json.loads((backup / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
            by_label = {row["label"]: row for row in report["drives"]}
            self.assertEqual(by_label["Music"]["status"], "copied")
            self.assertIs(by_label["Music"]["present"], True)
            self.assertEqual(by_label["GIG"]["status"], "copied")
            self.assertEqual(by_label["OLD"]["status"], "absent")
            self.assertIs(by_label["OLD"]["present"], False)
            self.assertGreater(by_label["Music"]["files"], 0)
            self.assertEqual(by_label["OLD"]["files"], 0)
            for row in report["drives"]:
                self.assertEqual(
                    set(row),
                    {"drive_id", "files", "label", "present", "role", "status"},
                )
            self.assertNotIn(str(temp.root), (backup / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
            listed = library.drive_backup_report(temp.root / "Backups")
            self.assertIsNotNone(listed)
            assert listed is not None
            self.assertIs(listed["verified"], True)
            self.assertEqual(listed["folder"], backup.name)
            house = backup / music_files[0]
            house.write_bytes(house.read_bytes() + b"x")
            self.assertFalse(library.is_complete(backup))
            self.assertIsNone(library.drive_backup_report(temp.root / "Backups"))
            if link is not None:
                self.assertTrue(link.is_symlink())

    def test_a_drive_mounted_later_is_copied_on_the_next_backup(self) -> None:
        """Copy a drive that appears after the first backup in this process.

        The first backup lists it as unplugged. The next call, without
        clearing the once-per-process database flag, writes a new folder
        that contains the drive.

        Returns:
            None. The test fails if the second call does nothing or the
            first folder gains the late drive's file.
        """
        with TempLibrary() as temp:
            gig = temp.root / "late" / "GIG" / "_Serato_"
            _write(gig / "Subcrates" / "Late.crate", b"late-crate")
            absent = _spec("dev-late", "LATE", gig, present=False)
            first = library.ensure_backup([absent])
            self.assertIsInstance(first, Path)
            first_folder = cast(Path, first)
            self.assertNotIn(b"late-crate", first_folder.joinpath(library.DRIVES_MANIFEST).read_bytes())
            blob = b"".join(path.read_bytes() for path in first_folder.rglob("*") if path.is_file())
            self.assertNotIn(b"late-crate", blob)
            present = _spec("dev-late", "LATE", gig, present=True)
            second = library.ensure_backup([present])
            self.assertIsInstance(second, Path)
            second_folder = cast(Path, second)
            self.assertNotEqual(first_folder, second_folder)
            self.assertTrue(library.is_complete(second_folder))
            copied = b"".join(path.read_bytes() for path in second_folder.rglob("*") if path.is_file())
            self.assertIn(b"late-crate", copied)
            again = library.ensure_backup([present])
            self.assertIsNone(again)

    def test_a_failed_copy_is_not_published_and_the_write_does_not_open(self) -> None:
        """Discard a backup when a drive disappears during the copy.

        The source file and the database stay as they were. No finished
        backup is listed. A later call can back up. begin_write does not
        open its write connection when the disk check refuses the copy.

        Returns:
            None. The test fails if a partial folder is offered or the
            library write connection opens.
        """
        with TempLibrary() as temp:
            root = temp.root / "drop" / "_Serato_"
            _write(root / "Subcrates" / "One.crate", b"one")
            _write(root / "Subcrates" / "Two.crate", b"two")
            spec = _spec("dev-drop", "DROP", root)
            before_tree = _tree(root)
            before_db = temp.db.read_bytes()
            real = library._copy_readonly
            calls = {"n": 0}

            def boom(source: Path, dest: Path) -> None:
                calls["n"] += 1
                if calls["n"] == 2:
                    raise OSError(errno.EIO, "unplugged")
                real(source, dest)

            with mock.patch.object(library, "_copy_readonly", side_effect=boom):
                with self.assertRaises(OSError) as caught:
                    library.ensure_backup([spec])
            self.assertEqual(caught.exception.errno, errno.EIO)
            parent = temp.root / "Backups"
            self.assertEqual(library.list_backups(parent), [])
            self.assertEqual(_tree(root), before_tree)
            self.assertEqual(temp.db.read_bytes(), before_db)
            self.assertNotIn(str(temp.db.resolve()), library._backed_up)
            folder = library.ensure_backup([spec])
            self.assertIsInstance(folder, Path)
            self.assertTrue(library.is_complete(cast(Path, folder)))

            library._backed_up.clear()
            library._copied_drives.clear()
            real_connect = library.sqlite3.connect

            def spy(database: object, *args: object, **kwargs: object) -> object:
                if kwargs.get("timeout") == 1:
                    raise AssertionError("library write opened")
                return real_connect(database, *args, **kwargs)  # type: ignore[arg-type]

            with mock.patch("library.shutil.disk_usage", return_value=_usage(0)):
                with mock.patch("library.sqlite3.connect", spy):
                    with self.assertRaises(library.LibraryError) as blocked:
                        library.begin_write()
            self.assertEqual(blocked.exception.message, library.BACKUP_NO_SPACE)
            self.assertEqual(blocked.exception.status, 507)
            self.assertEqual(temp.db.read_bytes(), before_db)

    def test_backup_is_refused_when_the_disk_cannot_hold_it(self) -> None:
        """Refuse just below the margin and allow a disk that meets it.

        The measured size matches an independent sum. The free-space check
        reads the backup folder, not the drive. One byte less than the
        source size plus the margin publishes nothing.

        Returns:
            None. The test fails if the threshold moves or the drive is
            the disk that is checked.
        """
        self.assertEqual(library.BACKUP_SPACE_MARGIN, 1024 * 1024)
        with TempLibrary() as temp:
            root = temp.root / "space" / "GIG" / "_Serato_"
            _write(root / "Subcrates" / "Space.crate", b"space-bytes")
            _write(root / "Recording" / "take.txt", b"take")
            _write(root / "Export Backups" / "skip.zip", b"not-counted")
            spec = _spec("dev-space", "SPACE", root)
            needed = library._backup_payload_bytes(temp.db, [spec])
            self.assertEqual(needed, _oracle(temp.db, [root]))
            self.assertGreater(needed, len(b"space-bytes"))
            seen: list[Path] = []

            def usage(path: object) -> object:
                seen.append(Path(str(path)))
                return _usage(needed + library.BACKUP_SPACE_MARGIN - 1)

            with mock.patch("library.shutil.disk_usage", side_effect=usage):
                with self.assertRaises(OSError) as caught:
                    library.ensure_backup([spec])
            self.assertEqual(caught.exception.errno, errno.ENOSPC)
            self.assertEqual(caught.exception.strerror, library.BACKUP_NO_SPACE)
            self.assertTrue(seen)
            backups = (temp.root / "Backups").resolve()
            for path in seen:
                resolved = path.resolve()
                self.assertTrue(resolved == backups or backups in resolved.parents)
                self.assertFalse(str(resolved).startswith(str(root.resolve())))
            self.assertEqual(library.list_backups(temp.root / "Backups"), [])
            self.assertEqual((root / "Subcrates" / "Space.crate").read_bytes(), b"space-bytes")

            def enough(path: object) -> object:
                return _usage(needed + library.BACKUP_SPACE_MARGIN)

            with mock.patch("library.shutil.disk_usage", side_effect=enough):
                folder = library.ensure_backup([spec])
            self.assertTrue(library.is_complete(cast(Path, folder)))

            library._backed_up.clear()
            library._copied_drives.clear()
            with mock.patch("library.shutil.disk_usage", side_effect=OSError(errno.EIO, "stat failed")):
                with self.assertRaises(OSError) as failed:
                    library.ensure_backup([spec])
            self.assertEqual(failed.exception.errno, errno.ENOSPC)
            self.assertEqual(failed.exception.strerror, library.BACKUP_NO_SPACE)

    def test_read_only_and_unreadable_drives_are_skipped(self) -> None:
        """Report a read-only drive and a drive that cannot be read.

        Each check is separate. The backup still finishes. Neither drive's
        files are copied, and nothing is written on the drive.

        Returns:
            None. The test fails if either drive is copied or the backup
            is discarded.
        """
        with TempLibrary() as temp:
            locked = temp.root / "locked" / "_Serato_"
            denied = temp.root / "denied" / "_Serato_"
            _write(locked / "Subcrates" / "Lock.crate", b"lock-bytes")
            _write(denied / "Subcrates" / "Deny.crate", b"deny-bytes")
            mode = locked.stat().st_mode
            locked.chmod(stat.S_IRUSR | stat.S_IXUSR)
            try:
                if locked.stat().st_mode & stat.S_IWUSR:
                    self.skipTest("this platform does not clear the directory write bit")
                before = _tree(locked)
                folder = library.ensure_backup([_spec("dev-lock", "LOCK", locked)])
                backup = cast(Path, folder)
                self.assertTrue(library.is_complete(backup))
                report = json.loads((backup / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
                self.assertEqual(report["drives"][0]["status"], "read-only")
                self.assertIs(report["drives"][0]["present"], True)
                blob = b"".join(path.read_bytes() for path in backup.rglob("*") if path.is_file())
                self.assertNotIn(b"lock-bytes", blob)
                self.assertEqual(_tree(locked), before)
            finally:
                locked.chmod(mode)

        with TempLibrary() as temp:
            denied = temp.root / "denied" / "_Serato_"
            _write(denied / "Subcrates" / "Deny.crate", b"deny-bytes")
            read_mode = denied.stat().st_mode
            denied.chmod(stat.S_IWUSR | stat.S_IXUSR)
            try:
                if denied.stat().st_mode & stat.S_IRUSR:
                    self.skipTest("this platform does not clear the directory read bit")
                folder = library.ensure_backup([_spec("dev-deny", "DENY", denied)])
                report = json.loads((cast(Path, folder) / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
                self.assertEqual(report["drives"][0]["status"], "permission")
                blob = b"".join(path.read_bytes() for path in cast(Path, folder).rglob("*") if path.is_file())
                self.assertNotIn(b"deny-bytes", blob)
            finally:
                denied.chmod(read_mode)

    def test_access_and_listing_checks_skip_on_their_own(self) -> None:
        """Skip a drive when access or listing says it cannot be used.

        The directory mode stays writable and readable. One test turns off
        write access, one turns off read access, and one makes the listing
        raise. Removing any one of those checks copies the file or fails
        the backup.

        Returns:
            None. The test fails if the file is copied or the backup raises.
        """
        with TempLibrary() as temp:
            root = temp.root / "access" / "_Serato_"
            _write(root / "Subcrates" / "Access.crate", b"access-bytes")
            real_access = os.access

            def read_only(path: object, mode: int, **kwargs: object) -> bool:
                if Path(str(path)).resolve() == root.resolve() and mode == os.W_OK:
                    return False
                return real_access(path, mode, **kwargs)  # type: ignore[arg-type]

            before = _tree(root)
            with mock.patch("library.os.access", side_effect=read_only):
                folder = library.ensure_backup([_spec("dev-access", "ACCESS", root)])
            backup = cast(Path, folder)
            report = json.loads((backup / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
            self.assertEqual(report["drives"][0]["status"], "read-only")
            blob = b"".join(path.read_bytes() for path in backup.rglob("*") if path.is_file())
            self.assertNotIn(b"access-bytes", blob)
            self.assertEqual(_tree(root), before)

        with TempLibrary() as temp:
            root = temp.root / "noread" / "_Serato_"
            _write(root / "Subcrates" / "NoRead.crate", b"noread-bytes")
            real_access = os.access

            def no_read(path: object, mode: int, **kwargs: object) -> bool:
                if Path(str(path)).resolve() == root.resolve() and mode == os.R_OK:
                    return False
                return real_access(path, mode, **kwargs)  # type: ignore[arg-type]

            with mock.patch("library.os.access", side_effect=no_read):
                folder = library.ensure_backup([_spec("dev-noread", "NOREAD", root)])
            report = json.loads((cast(Path, folder) / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
            self.assertEqual(report["drives"][0]["status"], "permission")
            blob = b"".join(path.read_bytes() for path in cast(Path, folder).rglob("*") if path.is_file())
            self.assertNotIn(b"noread-bytes", blob)

        with TempLibrary() as temp:
            root = temp.root / "unlist" / "_Serato_"
            _write(root / "Subcrates" / "Unlist.crate", b"unlist-bytes")
            real_scan = os.scandir

            def blocked(path: object) -> object:
                if Path(str(path)).resolve() == root.resolve():
                    raise PermissionError(13, "denied")
                return real_scan(path)  # type: ignore[arg-type]

            with mock.patch("library.os.scandir", side_effect=blocked):
                folder = library.ensure_backup([_spec("dev-unlist", "UNLIST", root)])
            self.assertTrue(library.is_complete(cast(Path, folder)))
            report = json.loads((cast(Path, folder) / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
            self.assertEqual(report["drives"][0]["status"], "permission")

    def test_a_climbing_path_is_not_written(self) -> None:
        """Refuse a drive file that would leave the backup folder.

        Both the relative-path check and the resolved-path check have to
        reject it. The file outside the backup is not created.

        Returns:
            None. The test fails if the escaped file is created or a
            finished backup is published.
        """
        with TempLibrary() as temp:
            root = temp.root / "climb" / "_Serato_"
            source = root / "Subcrates" / "Ok.crate"
            _write(source, b"ok")
            spec = _spec("dev-climb", "CLIMB", root)
            escaped = temp.root / "escaped.txt"

            def climb(folder: Path) -> list[tuple[str, Path]]:
                return [("../../../../escaped.txt", source)]

            self.assertTrue(library._bad_drive_rel("../../../../escaped.txt"))
            dest = temp.root / "Backups" / "staging" / "drives" / "id"
            self.assertFalse(library._contained(dest.joinpath(*[".."] * 4, "escaped.txt"), dest))
            with mock.patch("snapshots.iter_backup_files", side_effect=climb):
                with self.assertRaises(OSError):
                    library.ensure_backup([spec])
            self.assertFalse(escaped.exists())
            self.assertEqual(library.list_backups(temp.root / "Backups"), [])
            self.assertEqual(source.read_bytes(), b"ok")

    def test_sentences_match_the_error_catalog(self) -> None:
        """Keep the backup sentences attached to their codes.

        Returns:
            None. The test fails if the page would not translate them.
        """
        self.assertEqual(error_codes.ERROR_CODES[library.BACKUP_NO_SPACE], "backup_no_space")
        self.assertEqual(
            error_codes.ERROR_CODES[library.BACKUP_SERATO_RUNNING],
            "backup_serato_running",
        )

    def test_http_reports_drives_and_refuses_space_or_a_running_serato(self) -> None:
        """POST backup-drives copies drives and GET returns the checked report.

        A full disk answers 507. A running Serato DJ answers 409. Neither
        publishes a finished backup beyond the successful call.

        Returns:
            None. The test fails if an unplugged drive is a failure or the
            report is not hash-checked.
        """
        with TempLibrary() as temp:
            gig = temp.root / "http" / "GIG" / "_Serato_"
            old = temp.root / "http" / "OLD" / "_Serato_"
            _write(gig / "Subcrates" / "Http.crate", b"http-gig")
            _write(old / "Subcrates" / "Old.crate", b"http-old")
            specs = [
                _spec("dev-http", "GIG", gig),
                _spec("dev-http-old", "OLD", old, present=False),
            ]
            httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
            thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            host, port = httpd.server_address[:2]
            base = f"http://{host}:{port}"

            def post(payload: dict[str, object]) -> tuple[int, dict[str, object]]:
                request = urllib.request.Request(
                    base + "/api/snapshots",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                try:
                    with urllib.request.urlopen(request, timeout=10) as response:
                        body = json.loads(response.read().decode("utf-8"))
                        return response.status, body
                except urllib.error.HTTPError as exc:
                    body = json.loads(exc.read().decode("utf-8"))
                    code = exc.code
                    exc.close()
                    return code, body

            try:
                with mock.patch("snapshots.drives_for_backup", return_value=specs):
                    status, body = post({"action": "backup-drives"})
                    self.assertEqual(status, 200, body)
                    self.assertIs(body["ok"], True)
                    self.assertIs(body["created"], True)
                    report = body["drive_backup"]
                    assert isinstance(report, dict)
                    self.assertIs(report["verified"], True)
                    labels = {row["label"]: row["status"] for row in report["drives"]}
                    self.assertEqual(labels, {"GIG": "copied", "OLD": "absent"})
                    with urllib.request.urlopen(base + "/api/snapshots", timeout=10) as response:
                        listed = json.loads(response.read().decode("utf-8"))
                    self.assertEqual(listed["drive_backup"]["folder"], report["folder"])
                    self.assertIs(listed["drive_backup"]["verified"], True)
                    status, again = post({"action": "backup-drives"})
                    self.assertEqual(status, 200)
                    self.assertIs(again["created"], False)
                    with mock.patch("library.shutil.disk_usage", return_value=_usage(0)):
                        library._backed_up.clear()
                        library._copied_drives.clear()
                        status, full = post({"action": "backup-drives"})
                    self.assertEqual(status, 507)
                    self.assertEqual(full["error"], library.BACKUP_NO_SPACE)
                    self.assertEqual(full["code"], "backup_no_space")
                    with mock.patch("snapshots.serato_dj_running", return_value=True):
                        status, running = post({"action": "backup-drives"})
                    self.assertEqual(status, 409)
                    self.assertEqual(running["error"], library.BACKUP_SERATO_RUNNING)
                    self.assertEqual(running["code"], "backup_serato_running")
            finally:
                httpd.shutdown()
                httpd.server_close()
                thread.join(timeout=3)
            self.assertEqual((old / "Subcrates" / "Old.crate").read_bytes(), b"http-old")
            self.assertEqual((gig / "Subcrates" / "Http.crate").read_bytes(), b"http-gig")

    def test_an_unreadable_subfolder_skips_that_drive_and_later_writes_open(self) -> None:
        """Record one unreadable child as permission and keep the other drive.

        The top of ``_Serato_`` can be listed. ``History`` cannot, with
        ``EACCES`` and again with ``EPERM``. Measuring that tree does not
        raise, and the backup does not contain either of that drive's
        files. ``begin_write`` still opens a connection. When the child
        can be listed, the next backup copies the drive.

        Returns:
            None. The test fails if the permission error fails the backup,
            if the other drive is missing, or if the later write does not open.
        """
        errors = (
            PermissionError(errno.EACCES, "Permission denied"),
            OSError(errno.EPERM, "Operation not permitted"),
        )
        for error in errors:
            with self.subTest(errno=error.errno):
                with TempLibrary() as temp:
                    good = temp.root / "good" / "_Serato_"
                    bad = temp.root / "bad" / "_Serato_"
                    _write(good / "Subcrates" / "Good.crate", b"good-bytes")
                    _write(bad / "Subcrates" / "Visible.crate", b"visible-bytes")
                    history = bad / "History"
                    _write(history / "session.txt", b"history-bytes")
                    specs = [
                        _spec("dev-good", "GOOD", good),
                        _spec("dev-bad", "BAD", bad),
                    ]
                    good_only = library._backup_payload_bytes(temp.db, [specs[0]])
                    real_scan = os.scandir
                    target = history.resolve()

                    def blocked(path: object) -> object:
                        try:
                            resolved = Path(str(path)).resolve()
                        except OSError:
                            resolved = None
                        if resolved == target:
                            raise error
                        return real_scan(path)  # type: ignore[arg-type]

                    with mock.patch("os.scandir", side_effect=blocked):
                        self.assertEqual(library._backup_payload_bytes(temp.db, specs), good_only)
                        folder = library.ensure_backup(specs)
                        backup = cast(Path, folder)
                        self.assertTrue(library.is_complete(backup))
                        report = json.loads((backup / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
                        by_label = {row["label"]: row for row in report["drives"]}
                        self.assertEqual(by_label["GOOD"]["status"], "copied")
                        self.assertGreater(by_label["GOOD"]["files"], 0)
                        self.assertEqual(by_label["BAD"]["status"], "permission")
                        self.assertEqual(by_label["BAD"]["files"], 0)
                        blob = b"".join(
                            path.read_bytes() for path in backup.rglob("*") if path.is_file()
                        )
                        self.assertIn(b"good-bytes", blob)
                        self.assertNotIn(b"visible-bytes", blob)
                        self.assertNotIn(b"history-bytes", blob)
                        self.assertFalse((backup / "drives" / library._drive_dir_name("dev-bad")).exists())
                        key = str(temp.db.resolve())
                        self.assertIn(key, library._backed_up)
                        self.assertNotIn("dev-bad", library._copied_drives[key])
                        self.assertIn("dev-good", library._copied_drives[key])
                        if error.errno == errno.EACCES:
                            conn = library.begin_write()
                            try:
                                self.assertEqual(conn.execute("SELECT 1").fetchone()[0], 1)
                                conn.rollback()
                            finally:
                                conn.close()
                    retried = library.ensure_backup(specs)
                    self.assertIsInstance(retried, Path)
                    later = cast(Path, retried)
                    self.assertTrue(library.is_complete(later))
                    later_blob = b"".join(
                        path.read_bytes() for path in later.rglob("*") if path.is_file()
                    )
                    self.assertIn(b"visible-bytes", later_blob)
                    self.assertIn(b"good-bytes", later_blob)
                    self.assertIn("dev-bad", library._copied_drives[key])

    def test_a_permission_error_mid_copy_discards_that_drive_only(self) -> None:
        """Drop a drive's partial files when a later file cannot be read.

        The first file of the unreadable drive is copied, then opening the
        next file raises ``PermissionError``. That drive directory is not
        in the finished backup. The other drive is. ``EPERM`` from the
        source open is the same skip.

        Returns:
            None. The test fails if the partial file is published or the
            other drive is discarded.
        """
        for error in (
            PermissionError(errno.EACCES, "denied"),
            OSError(errno.EPERM, "not permitted"),
        ):
            with self.subTest(errno=error.errno):
                with TempLibrary() as temp:
                    good = temp.root / "good" / "_Serato_"
                    bad = temp.root / "bad" / "_Serato_"
                    _write(good / "Subcrates" / "Good.crate", b"good-bytes")
                    _write(bad / "Subcrates" / "First.crate", b"first-partial-bytes")
                    _write(bad / "Subcrates" / "Second.crate", b"second-partial-bytes")
                    real = library._copy_readonly

                    def boom(source: Path, dest: Path) -> None:
                        if source.name == "Second.crate":
                            raise error
                        real(source, dest)

                    specs = [
                        _spec("dev-good", "GOOD", good),
                        _spec("dev-bad", "BAD", bad),
                    ]
                    with mock.patch.object(library, "_copy_readonly", side_effect=boom):
                        folder = library.ensure_backup(specs)
                    backup = cast(Path, folder)
                    self.assertTrue(library.is_complete(backup))
                    report = json.loads((backup / library.DRIVES_MANIFEST).read_text(encoding="utf-8"))
                    by_label = {row["label"]: row for row in report["drives"]}
                    self.assertEqual(by_label["GOOD"]["status"], "copied")
                    self.assertEqual(by_label["BAD"]["status"], "permission")
                    self.assertEqual(by_label["BAD"]["files"], 0)
                    blob = b"".join(path.read_bytes() for path in backup.rglob("*") if path.is_file())
                    self.assertIn(b"good-bytes", blob)
                    self.assertNotIn(b"first-partial-bytes", blob)
                    self.assertNotIn(b"second-partial-bytes", blob)
                    self.assertFalse((backup / "drives" / library._drive_dir_name("dev-bad")).exists())

    def test_a_real_copy_error_still_fails_the_backup(self) -> None:
        """Keep a full disk, a missing file, and an I/O error as failures.

        The readable drive is copied into the staging folder first. The
        next file then raises. Nothing is published, and the process does
        not record the database as backed up.

        Returns:
            None. The test fails if any of those errors is stored as
            ``permission`` or a finished backup remains.
        """
        for error in (
            OSError(errno.EIO, "read failed"),
            OSError(errno.ENOENT, "unplugged"),
            OSError(errno.ENOSPC, "no space"),
        ):
            with self.subTest(errno=error.errno):
                with TempLibrary() as temp:
                    good = temp.root / "good" / "_Serato_"
                    bad = temp.root / "bad" / "_Serato_"
                    _write(good / "Subcrates" / "Good.crate", b"good-bytes")
                    _write(bad / "Subcrates" / "Gone.crate", b"gone-bytes")
                    real = library._copy_readonly

                    def boom(source: Path, dest: Path) -> None:
                        if source.name == "Gone.crate":
                            raise error
                        real(source, dest)

                    before = temp.db.read_bytes()
                    with mock.patch.object(library, "_copy_readonly", side_effect=boom):
                        with self.assertRaises(OSError) as caught:
                            library.ensure_backup(
                                [
                                    _spec("dev-good", "GOOD", good),
                                    _spec("dev-bad", "BAD", bad),
                                ]
                            )
                    self.assertEqual(caught.exception.errno, error.errno)
                    self.assertNotIsInstance(caught.exception, library.DriveUnreadable)
                    self.assertEqual(library.list_backups(temp.root / "Backups"), [])
                    self.assertNotIn(str(temp.db.resolve()), library._backed_up)
                    self.assertEqual(temp.db.read_bytes(), before)
                    self.assertEqual((good / "Subcrates" / "Good.crate").read_bytes(), b"good-bytes")
                    self.assertFalse((temp.root / "Backups").exists() and any(
                        path.name.endswith("-failed") or ".partial" in path.name
                        for path in (temp.root / "Backups").iterdir()
                    ))

    def test_the_backup_record_stays_locked_while_a_drive_is_copied(self) -> None:
        """Hold the backup lock from the decision through the set update.

        A second caller cannot take the lock while the first call is
        inside the drive copy.

        Returns:
            None. The test fails if the lock is free during the copy.
        """
        with TempLibrary() as temp:
            root = temp.root / "lock" / "_Serato_"
            _write(root / "Subcrates" / "Lock.crate", b"lock-bytes")
            spec = _spec("dev-lockset", "LOCKSET", root)
            inside = threading.Event()
            release = threading.Event()

            def hold(drive: object, staging: Path) -> int:
                inside.set()
                self.assertTrue(release.wait(5), "the copy was not released")
                return 0

            errors: list[BaseException] = []

            def first() -> None:
                try:
                    library.ensure_backup([spec])
                except BaseException as exc:  # noqa: BLE001 - the thread must report it
                    errors.append(exc)

            with mock.patch.object(library, "_copy_drive_tree", side_effect=hold):
                thread = threading.Thread(target=first)
                thread.start()
                self.assertTrue(inside.wait(5))
                acquired = library._backup_guard.acquire(timeout=0.2)
                if acquired:
                    library._backup_guard.release()
                release.set()
                thread.join(5)
            self.assertFalse(acquired)
            self.assertFalse(thread.is_alive())
            self.assertEqual(errors, [])
            self.assertIn(str(temp.db.resolve()), library._backed_up)

    def test_docs_name_the_drive_copy_and_the_disk_check(self) -> None:
        """Keep the guide and the agent notes on the backup that ships.

        Returns:
            None. The test fails if a page still says the session backup
            is the database only, or if the two agent notes differ.
        """
        architecture = (ROOT / "docs" / "architecture.md").read_text(encoding="utf-8")
        self.assertIn("drives/<id>/", architecture)
        self.assertIn("There is not enough disk space to back up the library.", architecture)
        self.assertIn("`Recording` and `DJ Sessions` are audio, not library metadata", architecture)
        self.assertIn("records `permission`", architecture)
        self.assertIn("backup-drives", architecture)
        safety = (ROOT / "docs" / "guide" / "safety.md").read_text(encoding="utf-8")
        self.assertIn("`drives`", safety)
        self.assertIn("not enough disk space", safety.lower())
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        self.assertEqual(agents, (ROOT / "CLAUDE.md").read_text(encoding="utf-8"))
        self.assertIn("each present drive's `_Serato_` folder", agents)
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("each connected drive's `_Serato_` folder", readme)
        wiki = (ROOT / "docs" / "wiki" / "Backups-and-Restore.md").read_text(encoding="utf-8")
        self.assertNotIn("Issue #91", wiki)
        self.assertIn("drives", wiki)


if __name__ == "__main__":
    unittest.main()
