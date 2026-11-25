#!/usr/bin/env python3
"""Read-from-stick backup of music and ``_Serato_`` (#481).

Copies a Serato stick's music files and ``_Serato_`` folder onto a
user-chosen folder, drive, or mounted disk image. The source stick is
never written. Dest cannot be the source, the same physical disk as the
source, ``_Serato_``, or the live Serato library. Each copied file is
hash-checked. A stick is marked backed up only when every intended file
verified. Incremental compare uses NFC path keys. A same-size file
is skipped only when SHA-256 matches. On FAT and exFAT the 2-second mtime
window applies only after that hash match, so a changed same-size file is
copied again. A stick database older than the newest track is warned about
before backup and again after a verified copy.

``python3 stick_backup.py SOURCE DEST`` prints the preview as JSON.
``--copy`` writes after confirm.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import time
from collections.abc import Mapping, Sequence
from pathlib import Path

import app_config
import folder_sync
import library
import path_forms
import volumes
from library import LibraryError

# drive_check and snapshots import this module's error sentences through
# error_codes while they are still loading, so keep those imports lazy.

ROW_CAP = 200
CHUNK = 1024 * 1024
MTIME_TOLERANCE = 2.0
BACKUPS_NAME = "stick-backups.json"
ACTIONS = frozenset({"preview", "copy"})

SOURCE_MISSING = "Choose a Serato stick."
SOURCE_NO_SERATO = "That folder has no _Serato_ library."
SOURCE_SHORTCUT = "Shortcuts are left alone."
DEST_SERATO = "A stick backup cannot go into the Serato folder."
DEST_LIBRARY = "A stick backup cannot go into the Serato library."
DEST_SOURCE = "A stick backup cannot go onto the source stick."
DEST_SAME_DISK = "A stick backup cannot go onto the same disk as the source stick."
STALE_DB = (
    "This stick's Serato database is older than tracks on the stick. "
    "Tracks may be missing in Serato even though the files are there."
)


def _normalized(path: Path) -> Path:
    """Resolve so ``/var`` and ``/private/var`` compare as one folder."""
    try:
        return path.resolve(strict=False)
    except OSError:
        return path


def _hash_file(path: Path) -> str | None:
    """SHA-256 of a file, or None when it cannot be read."""
    digest = hashlib.sha256()
    try:
        with path.open("rb") as handle:
            while True:
                chunk = handle.read(CHUNK)
                if not chunk:
                    break
                digest.update(chunk)
    except OSError:
        return None
    return digest.hexdigest()


def _size(path: Path) -> int | None:
    """File size in bytes, or None when stat fails."""
    try:
        return path.stat().st_size
    except OSError:
        return None


def _mtime(path: Path) -> float | None:
    """File mtime, or None when stat fails."""
    try:
        return path.stat().st_mtime
    except OSError:
        return None


def _is_file(path: Path) -> bool:
    """True when path is a regular file."""
    try:
        return path.is_file() and not path.is_symlink()
    except OSError:
        return False


def _device_id(path: Path) -> int | None:
    """``st_dev`` for a path, or None when stat fails."""
    try:
        return path.stat().st_dev
    except OSError:
        return None


def fat_family(name: str | None) -> bool:
    """True when mtime compare needs the 2-second FAT/exFAT tolerance.

    Args:
        name: Filesystem name from :func:`drive_check.detect_filesystem`.

    Returns:
        True for FAT family and exFAT.
    """
    import drive_check

    if drive_check.is_fat_filesystem(name):
        return True
    if name is None or name == "":
        return False
    return name.casefold() in {"exfat", "exfatfs", "texfat"}


def rel_key(rel: str) -> str:
    """NFC identity key for a relative path inside the backup tree."""
    return path_forms.form_key(rel.replace("\\", "/"))


def files_match(
    source: Path,
    dest: Path,
    *,
    fat: bool,
    source_hash: str | None = None,
) -> bool:
    """True when dest can be treated as already backed up from source.

    Size and SHA-256 must both match. A hash mismatch never skips, even
    on FAT/exFAT when mtimes are within :data:`MTIME_TOLERANCE`. When
    hashes match on a FAT volume, mtimes must also sit inside that
    window so a same-hash rewrite with a drifted stamp is recopied.

    Args:
        source: Stick file.
        dest: Backup copy.
        fat: True when the source filesystem needs mtime tolerance.
        source_hash: Precomputed source hash, or None to compute when needed.

    Returns:
        True when the dest may be skipped.
    """
    source_size = _size(source)
    dest_size = _size(dest)
    if source_size is None or dest_size is None or source_size != dest_size:
        return False
    before = source_hash if source_hash is not None else _hash_file(source)
    if before is None:
        return False
    after = _hash_file(dest)
    if after is None or after != before:
        return False
    if not fat:
        return True
    source_mtime = _mtime(source)
    dest_mtime = _mtime(dest)
    if source_mtime is None or dest_mtime is None:
        return False
    return abs(source_mtime - dest_mtime) <= MTIME_TOLERANCE


def backups_path() -> Path:
    """Return ``stick-backups.json`` beside settings."""
    return app_config.config_dir() / BACKUPS_NAME


def last_backup(source: Path) -> dict[str, object] | None:
    """Return the remembered last successful backup for this stick.

    Args:
        source: Stick root.

    Returns:
        ``{dest, at, verified}`` or None. Damaged files are empty.
    """
    volume = volumes.volume_of(str(source))
    key = volume.root if volume is not None else str(_normalized(source))
    payload = _load_backups()
    volumes_map = payload.get("volumes")
    if not isinstance(volumes_map, dict):
        return None
    row = volumes_map.get(key)
    if not isinstance(row, dict):
        return None
    dest = row.get("dest")
    at = row.get("at")
    if not isinstance(dest, str) or not dest or not isinstance(at, str) or not at:
        return None
    return {
        "dest": dest,
        "at": at,
        "verified": row.get("verified") is True,
    }


def remember_backup(source: Path, dest: Path) -> None:
    """Remember a verified stick backup beside settings.

    Args:
        source: Stick root.
        dest: Backup folder that passed verify.
    """
    volume = volumes.volume_of(str(source))
    key = volume.root if volume is not None else str(_normalized(source))
    payload = _load_backups()
    volumes_map = payload.get("volumes")
    if not isinstance(volumes_map, dict):
        volumes_map = {}
    volumes_map[key] = {
        "dest": str(dest),
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "verified": True,
    }
    _save_backups({"version": 1, "volumes": volumes_map})


def _load_backups() -> dict[str, object]:
    """Load stick-backup memory. Damaged files are empty."""
    path = backups_path()
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return {"version": 1, "volumes": {}}
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return {"version": 1, "volumes": {}}
    if not isinstance(payload, dict):
        return {"version": 1, "volumes": {}}
    return payload


def _save_backups(payload: Mapping[str, object]) -> None:
    """Atomically write stick-backup memory beside settings."""
    path = backups_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    tmp = path.with_suffix(".tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, path)


def _absolute_under_drive(value: str) -> str:
    """Normalize a caller path and require it stay on its drive root.

    Same guard as :func:`music_mirror._open_dest` so CodeQL treats the
    path as contained before any join or open.

    Args:
        value: Non-empty path string (already stripped).

    Returns:
        Absolute normalized path string.

    Raises:
        LibraryError: When the path escapes its drive root.
    """
    expanded = os.path.expanduser(value)
    normalized = os.path.normpath(os.path.abspath(expanded))
    root = os.path.abspath(os.path.splitdrive(normalized)[0] + os.sep)
    if not normalized.startswith(root):
        raise LibraryError(folder_sync.FOLDER_UNREADABLE)
    return normalized


def _under_base(base: Path, candidate: Path) -> bool:
    """True when ``candidate`` is ``base`` or a file under it."""
    try:
        candidate.relative_to(base)
    except ValueError:
        return False
    return True


def _unsafe_rel_parts(parts: Sequence[str]) -> bool:
    """True when a relative dest would leave the folder."""
    return any(part in (".", "..") or "\x00" in part for part in parts)


def _dest_for(dest: Path, rel: str) -> Path | None:
    """Map a stick-relative path onto dest, or None when unsafe."""
    parts = Path(rel.replace("\\", "/")).parts
    if not parts or _unsafe_rel_parts(parts):
        return None
    candidate = dest.joinpath(*parts)
    if not _under_base(dest, candidate):
        return None
    return candidate


def _open_source(value: object) -> Path:
    """Resolve a Serato stick root. Does not write.

    Raises:
        LibraryError: Missing path, shortcut, or no ``_Serato_`` folder.
    """
    if not isinstance(value, str) or not value.strip():
        raise LibraryError(SOURCE_MISSING)
    if "\x00" in value or len(value.strip()) > 4096:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE)
    path = Path(_absolute_under_drive(value.strip()))
    try:
        if path.is_symlink():
            raise LibraryError(SOURCE_SHORTCUT)
        if not path.is_dir():
            raise LibraryError(SOURCE_MISSING)
    except LibraryError:
        raise
    except OSError as exc:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE) from exc
    try:
        source = path.resolve(strict=False)
    except OSError as exc:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE) from exc
    serato = source / "_Serato_"
    try:
        if serato.is_symlink():
            raise LibraryError(SOURCE_SHORTCUT)
        if not serato.is_dir():
            raise LibraryError(SOURCE_NO_SERATO)
    except LibraryError:
        raise
    except OSError as exc:
        raise LibraryError(SOURCE_NO_SERATO) from exc
    return source


def _open_dest(value: object, source: Path, *, must_exist: bool) -> Path:
    """Resolve dest and refuse Serato, library, source, and same disk."""
    if not isinstance(value, str) or not value.strip():
        raise LibraryError(folder_sync.CHOOSE_FOLDER)
    if "\x00" in value or len(value.strip()) > 4096:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE)
    path = Path(_absolute_under_drive(value.strip()))
    try:
        if path.is_symlink():
            raise LibraryError(folder_sync.SHORTCUT)
        exists = path.exists()
        if exists and not path.is_dir():
            raise LibraryError(folder_sync.FOLDER_UNREADABLE)
        if must_exist and not exists:
            raise LibraryError(folder_sync.CHOOSE_FOLDER)
    except LibraryError:
        raise
    except OSError as exc:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE) from exc
    try:
        dest = path.resolve(strict=False)
    except OSError as exc:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE) from exc
    _refuse_dest(dest, source)
    return dest


def _refuse_dest(dest: Path, source: Path) -> None:
    """Refuse unsafe destinations."""
    if any(part.casefold() == "_serato_" for part in dest.parts):
        raise LibraryError(DEST_SERATO)
    library_file = Path(library.MASTER).expanduser()
    try:
        library_dir = library_file.resolve(strict=False).parent
    except OSError:
        library_dir = library_file.parent
    if folder_sync.rel_parts(library_dir.parts, dest.parts) is not None:
        raise LibraryError(DEST_LIBRARY)
    if folder_sync.rel_parts(source.parts, dest.parts) is not None:
        raise LibraryError(DEST_SOURCE)
    if folder_sync.rel_parts(dest.parts, source.parts) is not None:
        raise LibraryError(DEST_SOURCE)
    source_dev = _device_id(source)
    dest_dev = _device_id(dest) if dest.exists() else _device_id(dest.parent)
    if source_dev is not None and dest_dev is not None and source_dev == dest_dev:
        raise LibraryError(DEST_SAME_DISK)


def stale_database_warning(source: Path) -> str | None:
    """Warn when ``database V2`` is older than tracks on the stick.

    Args:
        source: Stick root.

    Returns:
        Warning sentence, or None when the check is fine or unavailable.
    """
    database = source / "_Serato_" / "database V2"
    db_mtime = _mtime(database)
    if db_mtime is None:
        return None
    newest = _newest_track_mtime(source)
    if newest is None:
        return None
    if db_mtime + MTIME_TOLERANCE < newest:
        return STALE_DB
    return None


def _newest_track_mtime(source: Path) -> float | None:
    """Newest mtime of a non-``_Serato_`` file on the stick."""
    newest: float | None = None
    for _rel, path in _iter_music_files(source):
        stamp = _mtime(path)
        if stamp is None:
            continue
        if newest is None or stamp > newest:
            newest = stamp
    return newest


def _iter_music_files(source: Path) -> list[tuple[str, Path]]:
    """List music (non-``_Serato_``) files under the stick root."""
    found: list[tuple[str, Path]] = []
    source_root = str(source)

    def onerror(error: OSError) -> None:
        raise error

    try:
        for dirpath, dirnames, filenames in os.walk(
            source_root, followlinks=False, onerror=onerror
        ):
            # Stay inside the opened stick; skip anything that escaped.
            if not (
                dirpath == source_root
                or dirpath.startswith(source_root + os.sep)
            ):
                dirnames[:] = []
                continue
            current = Path(dirpath)
            kept: list[str] = []
            for name in dirnames:
                if name.casefold() == "_serato_" or name in (".", ".."):
                    continue
                child = os.path.join(dirpath, name)
                if not child.startswith(source_root + os.sep):
                    continue
                if os.path.islink(child):
                    continue
                kept.append(name)
            dirnames[:] = kept
            for name in filenames:
                if name in (".", "..") or "\x00" in name:
                    continue
                joined = os.path.join(dirpath, name)
                if not joined.startswith(source_root + os.sep):
                    continue
                path = Path(joined)
                if path.is_symlink() or not path.is_file():
                    continue
                try:
                    rel = path.relative_to(source).as_posix()
                except ValueError:
                    continue
                found.append((rel, path))
    except OSError:
        return found
    return found


def _iter_serato_files(source: Path) -> list[tuple[str, Path]]:
    """List ``_Serato_`` files a stick backup copies."""
    import snapshots

    root = source / "_Serato_"
    root_text = str(root)
    items: list[tuple[str, Path]] = []
    try:
        for rel, path in snapshots.iter_backup_files(root):
            if _unsafe_rel_parts(Path(rel).parts):
                continue
            text = str(path)
            if not (
                text == root_text or text.startswith(root_text + os.sep)
            ):
                continue
            items.append((f"_Serato_/{rel}", path))
    except OSError:
        return items
    return items


def _row(rel: str, source: Path, dest: Path) -> dict[str, object]:
    """One report row."""
    return {
        "file": Path(rel).name,
        "rel": rel,
        "source": str(source),
        "dest": str(dest),
    }


def _scan(source: Path, dest: Path) -> dict[str, object]:
    """Classify stick files against dest. Does not write."""
    import drive_check

    fat = fat_family(drive_check.detect_filesystem(source))
    copy: list[dict[str, object]] = []
    mismatch: list[dict[str, object]] = []
    skip_count = 0
    seen: set[str] = set()
    for rel, path in _iter_music_files(source) + _iter_serato_files(source):
        key = rel_key(rel)
        if not key or key in seen:
            continue
        seen.add(key)
        dest_path = _dest_for(dest, rel)
        if dest_path is None:
            continue
        item = _row(rel, path, dest_path)
        if not _is_file(path):
            mismatch.append(item)
            continue
        if _is_file(dest_path) and files_match(path, dest_path, fat=fat):
            skip_count += 1
            continue
        if _is_file(dest_path):
            # Dest exists but does not match — needs a fresh copy.
            copy.append(item)
        else:
            copy.append(item)
    warning = stale_database_warning(source)
    remembered = last_backup(source)
    return {
        "source": str(source),
        "dest": str(dest),
        "copy": copy,
        "copy_count": len(copy),
        "skip_count": skip_count,
        "mismatch": mismatch,
        "mismatch_count": len(mismatch),
        "warning": warning,
        "last_backup": remembered,
        "fat_tolerance": fat,
    }


def _cap_lists(report: dict[str, object]) -> dict[str, object]:
    """Trim listed rows."""
    capped = dict(report)
    for key in ("copy", "mismatch"):
        rows = capped.get(key)
        if isinstance(rows, list):
            capped[key] = rows[:ROW_CAP]
    return capped


def _plan(
    report: Mapping[str, object],
    *,
    written: bool,
    copied: int = 0,
    verified: bool = False,
) -> dict[str, object]:
    """Public JSON from a scan."""
    body = _cap_lists(dict(report))
    body["preview"] = not written
    body["written"] = written
    body["copied"] = copied
    body["verified"] = verified
    return body


def status(source: object) -> dict[str, object]:
    """Remembered last backup and stale-database warning for a stick.

    Does not require a dest folder. Does not write.

    Args:
        source: Stick root with ``_Serato_``.

    Returns:
        Report with ``last_backup`` and optional ``warning``.
    """
    stick = _open_source(source)
    remembered = last_backup(stick)
    dest = None
    if isinstance(remembered, dict) and isinstance(remembered.get("dest"), str):
        dest = remembered["dest"]
    return {
        "preview": True,
        "written": False,
        "source": str(stick),
        "dest": dest,
        "warning": stale_database_warning(stick),
        "last_backup": remembered,
        "copy_count": 0,
        "skip_count": 0,
        "mismatch_count": 0,
    }


def preview(source: object, dest: object) -> dict[str, object]:
    """Read-only classification of stick files against dest.

    Args:
        source: Stick root with ``_Serato_``.
        dest: Backup folder. Must already exist.

    Returns:
        Report with ``preview`` true.
    """
    stick = _open_source(source)
    path = _open_dest(dest, stick, must_exist=True)
    return _plan(_scan(stick, path), written=False)


def _copy_one(source: Path, dest_path: Path, *, fat: bool) -> str:
    """Copy one file and verify hashes.

    Skip uses :func:`files_match`, so a hash mismatch is never left in
    place and a FAT mtime window cannot hide different bytes.

    Returns:
        ``copied``, ``skip``, or ``mismatch``.
    """
    before = _hash_file(source)
    if before is None or _size(source) is None:
        return "mismatch"
    if _is_file(dest_path) and files_match(
        source, dest_path, fat=fat, source_hash=before
    ):
        return "skip"
    try:
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, dest_path)
    except OSError:
        return "mismatch"
    after_source = _hash_file(source)
    after_dest = _hash_file(dest_path)
    if after_source != before or after_dest != before:
        return "mismatch"
    return "copied"


def copy_files(source: object, dest: object) -> dict[str, object]:
    """Copy stick files onto dest and verify. Never writes the stick.

    Dest is created when missing. A stick is marked backed up only when
    every planned file verified and there are no mismatches.

    Args:
        source: Stick root.
        dest: Backup folder.

    Returns:
        Report with ``written`` true when copies ran, and ``verified``
        true only when the backup fully matched.
    """
    stick = _open_source(source)
    path = _open_dest(dest, stick, must_exist=False)
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE) from exc
    if not path.is_dir():
        raise LibraryError(folder_sync.FOLDER_UNREADABLE)
    # Re-check same-disk now that dest exists.
    _refuse_dest(path, stick)
    scan = _scan(stick, path)
    fat = scan.get("fat_tolerance") is True
    copied = 0
    mismatch = list(scan["mismatch"]) if isinstance(scan["mismatch"], list) else []
    remaining: list[dict[str, object]] = []
    stick_root = str(stick)
    dest_root = str(path)
    for item in scan["copy"] if isinstance(scan["copy"], list) else []:
        if not isinstance(item, dict):
            continue
        src_text = str(item.get("source") or "")
        dest_text = str(item.get("dest") or "")
        if not (
            src_text == stick_root or src_text.startswith(stick_root + os.sep)
        ):
            continue
        if not (
            dest_text == dest_root or dest_text.startswith(dest_root + os.sep)
        ):
            continue
        src = Path(src_text)
        dest_path = Path(dest_text)
        result = _copy_one(src, dest_path, fat=fat)
        if result == "copied":
            copied += 1
        elif result == "mismatch":
            mismatch.append(item)
            remaining.append(item)
        else:
            remaining.append(item)
    after = _scan(stick, path)
    after["mismatch"] = mismatch
    after["mismatch_count"] = len(mismatch)
    after["copy"] = remaining
    after["copy_count"] = len(remaining)
    verified = (
        len(mismatch) == 0
        and int(after.get("copy_count") or 0) == 0
        and (copied > 0 or int(scan.get("skip_count") or 0) > 0 or int(after.get("skip_count") or 0) > 0)
    )
    if verified:
        remember_backup(stick, path)
        after["last_backup"] = last_backup(stick)
    return _plan(after, written=True, copied=copied, verified=verified)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/stick-backup`` request.

    Args:
        payload: ``action`` is ``preview`` or ``copy``. Both take
            ``source`` and ``dest``. ``copy`` needs ``confirm`` true.

    Returns:
        That action's result.
    """
    kind = payload.get("action")
    source = payload.get("source")
    dest = payload.get("dest")
    confirm = payload.get("confirm") is True
    if kind == "preview" or (kind == "copy" and not confirm):
        return preview(source, dest)
    if kind == "copy":
        return copy_files(source, dest)
    raise LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print a stick-backup preview, or copy with ``--copy``."""
    parser = argparse.ArgumentParser(
        description="Back up a Serato stick without writing the source."
    )
    parser.add_argument("source")
    parser.add_argument("dest")
    parser.add_argument("--copy", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.copy:
            result = copy_files(args.source, args.dest)
        else:
            result = preview(args.source, args.dest)
    except LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
