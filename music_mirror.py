#!/usr/bin/env python3
"""Hash-checked incremental copy of library audio to a user folder (#394).

``preview`` only reads. ``copy`` writes audio onto the backup folder with
``shutil.copy2`` so GEOB cue frames stay identical. Dest hashes are
checked after each copy. A dest file that already matches is skipped.
``restore`` copies dest files back onto this computer and skips a laptop
file that is newer or already the same hash. ``crate`` saves tracks that
exist only on this laptop. ``relink`` points missing laptop rows at dest
files through ``files.execute``. Dest cannot be the Serato library, a
``_Serato_`` folder, or a music folder. Dest never receives ``_Serato_``.

``python3 music_mirror.py DEST`` prints the preview as JSON.
``--copy``, ``--restore``, ``--crate``, and ``--relink`` write.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sqlite3
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path

import files
import folder_sync
import gig_check
import library
import music_roots
import volumes
from library import LibraryError

ROW_CAP = 200
CHUNK = 1024 * 1024
CRATE_NAME = "Only on this laptop"
DEST_SERATO = "Music files cannot be copied into the Serato folder."
DEST_LIBRARY = "Music files cannot be copied into the Serato library."
DEST_MUSIC = "Music files cannot be copied into a music folder."
ACTIONS = frozenset({"preview", "copy", "restore", "crate", "relink"})


def dest_for(source: Path, dest: Path, roots: Sequence[Path]) -> Path | None:
    """Map a laptop file onto the backup folder.

    Rel parts come from the collapsed music root that owns the source.
    A source with no matching root uses the file name. A relative part
    that is ``.``, ``..``, or ``_Serato_`` is refused.

    Args:
        source: Laptop file path.
        dest: Backup folder.
        roots: Collapsed music folders.

    Returns:
        Dest file path, or None when the mapping is unsafe.
    """
    source_parts = Path(source).parts
    for root in roots:
        rel = folder_sync.rel_parts(Path(root).parts, source_parts)
        if rel is None:
            continue
        if _unsafe_parts(rel):
            return None
        if not rel:
            name = Path(source).name
            if not name or _unsafe_parts((name,)):
                return None
            return dest / name
        return dest.joinpath(*rel)
    name = Path(source).name
    if not name or _unsafe_parts((name,)):
        return None
    return dest / name


def _unsafe_parts(parts: Sequence[str]) -> bool:
    """True when a relative dest would leave the folder or enter ``_Serato_``."""
    return any(part in (".", "..") or part.casefold() == "_serato_" for part in parts)


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


def _mtime(path: Path) -> float | None:
    """File mtime, or None when stat fails."""
    try:
        return path.stat().st_mtime
    except OSError:
        return None


def _is_file(path: Path) -> bool:
    """True when path is a regular file."""
    try:
        return path.is_file()
    except OSError:
        return False


def _open_dest(value: object, space: str, *, must_exist: bool) -> Path:
    """Resolve the backup folder and refuse Serato, library, and music paths.

    Args:
        value: Path string from the request.
        space: Space whose music folders dest must not overlap.
        must_exist: True requires dest to already be a directory.

    Returns:
        The resolved directory.

    Raises:
        LibraryError: If the path is missing, a shortcut, a file, inside
            Serato or a music folder, or unreadable.
    """
    if not isinstance(value, str) or not value.strip():
        raise LibraryError(folder_sync.CHOOSE_FOLDER)
    if "\x00" in value or len(value.strip()) > 4096:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE)
    expanded = os.path.expanduser(value.strip())
    normalized = os.path.normpath(os.path.abspath(expanded))
    root = os.path.abspath(os.path.splitdrive(normalized)[0] + os.sep)
    if not normalized.startswith(root):
        raise LibraryError(folder_sync.FOLDER_UNREADABLE)
    path = Path(normalized)
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
        resolved = path.resolve(strict=False)
    except OSError as exc:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE) from exc
    _refuse_dest(resolved, space)
    return resolved


def _refuse_dest(dest: Path, space: str) -> None:
    """Refuse dest inside Serato, the library folder, or a music root."""
    if any(part.casefold() == "_serato_" for part in dest.parts):
        raise LibraryError(DEST_SERATO)
    library_file = Path(library.MASTER).expanduser()
    try:
        library_dir = library_file.resolve(strict=False).parent
    except OSError:
        library_dir = library_file.parent
    if folder_sync.rel_parts(library_dir.parts, dest.parts) is not None:
        raise LibraryError(DEST_LIBRARY)
    for root in _music_roots(space):
        if _overlaps(dest, root):
            raise LibraryError(DEST_MUSIC)


def _overlaps(dest: Path, root: Path) -> bool:
    """True when dest is the root, inside it, or an ancestor of it."""
    dest_parts = dest.parts
    root_parts = root.parts
    return (
        folder_sync.rel_parts(root_parts, dest_parts) is not None
        or folder_sync.rel_parts(dest_parts, root_parts) is not None
    )


def _music_roots(space: str) -> list[Path]:
    """Collapsed parents of stored paths in this space, including missing files."""
    database = Path(library.MASTER)
    conn = gig_check.open_read_only(database)
    try:
        return _roots_from_conn(conn, space)
    finally:
        conn.close()


def _roots_from_conn(conn: sqlite3.Connection, space: str) -> list[Path]:
    """Collapsed music folders from stored path parents."""
    space_row = conn.execute("SELECT id FROM space WHERE name = ?", (space,)).fetchone()
    if space_row is None:
        raise LibraryError("That space is not available here.")
    rows = conn.execute(
        """
        SELECT a.portable_id
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        """,
        (space,),
    ).fetchall()
    parents: list[Path] = []
    for row in rows:
        stored = row["portable_id"]
        if not isinstance(stored, str) or not stored:
            continue
        resolved = library.resolved_path(stored) or stored
        parents.append(_normalized(Path(resolved)).parent)
    return [_normalized(Path(root)) for root in music_roots.collapse_track_folders(parents)]


def _row(asset_id: int, name: object, artist: object, file_name: object, source: Path, dest: Path) -> dict[str, object]:
    """One report row."""
    return {
        "id": asset_id,
        "name": name if isinstance(name, str) else "",
        "artist": artist if isinstance(artist, str) else "",
        "file": file_name if isinstance(file_name, str) else source.name,
        "source": str(source),
        "dest": str(dest),
    }


def _scan(dest: Path, space: str) -> dict[str, object]:
    """Classify each library track against dest. Does not write."""
    if space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(Path(library.MASTER))
    try:
        roots = _roots_from_conn(conn, space)
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
            ORDER BY a.name COLLATE NOCASE, a.id
            """,
            (space,),
        ).fetchall()
        copy: list[dict[str, object]] = []
        only_laptop: list[dict[str, object]] = []
        restore: list[dict[str, object]] = []
        relink: list[dict[str, object]] = []
        skip_newer: list[dict[str, object]] = []
        mismatch: list[dict[str, object]] = []
        skip_count = 0
        for raw in rows:
            stored = raw["portable_id"]
            if not isinstance(stored, str) or not stored:
                continue
            resolved = library.resolved_path(stored) or stored
            laptop = _normalized(Path(resolved))
            mapped = dest_for(laptop, dest, roots)
            if mapped is None:
                if _is_file(laptop):
                    only_laptop.append(_row(int(raw["id"]), raw["name"], raw["artist"], raw["file_name"], laptop, dest / laptop.name))
                continue
            present = _is_file(laptop)
            dest_present = _is_file(mapped)
            offline = volumes.absent_volume(stored) is not None
            item = _row(int(raw["id"]), raw["name"], raw["artist"], raw["file_name"], laptop, mapped)
            if present:
                source_hash = _hash_file(laptop)
                if source_hash is None:
                    mismatch.append(item)
                    continue
                if dest_present:
                    dest_hash = _hash_file(mapped)
                    if dest_hash is None:
                        mismatch.append(item)
                        continue
                    if dest_hash == source_hash:
                        skip_count += 1
                        continue
                    copy.append(item)
                    only_laptop.append(item)
                    laptop_mtime = _mtime(laptop)
                    dest_mtime = _mtime(mapped)
                    if (
                        laptop_mtime is not None
                        and dest_mtime is not None
                        and laptop_mtime > dest_mtime
                    ):
                        skip_newer.append(item)
                    else:
                        restore.append(item)
                else:
                    copy.append(item)
                    only_laptop.append(item)
            elif dest_present:
                if offline:
                    restore.append(item)
                    relink.append(item)
                else:
                    restore.append(item)
                    relink.append(item)
    finally:
        conn.close()
    return {
        "dest": str(dest),
        "space": space,
        "copy": copy,
        "copy_count": len(copy),
        "skip_count": skip_count,
        "only_laptop": only_laptop,
        "only_laptop_count": len(only_laptop),
        "restore": restore,
        "restore_count": len(restore),
        "skip_newer": skip_newer,
        "skip_newer_count": len(skip_newer),
        "mismatch": mismatch,
        "mismatch_count": len(mismatch),
        "relink": relink,
        "relink_count": len(relink),
        "name": CRATE_NAME,
        "saved": None,
        "copied": 0,
    }


def _cap_lists(report: dict[str, object]) -> dict[str, object]:
    """Trim listed rows. Skip rows stay omitted."""
    capped = dict(report)
    for key in ("copy", "only_laptop", "restore", "skip_newer", "mismatch", "relink"):
        rows = capped.get(key)
        if isinstance(rows, list):
            capped[key] = rows[:ROW_CAP]
    return capped


def _plan(report: Mapping[str, object], *, written: bool, saved: Mapping[str, object] | None = None, copied: int = 0) -> dict[str, object]:
    """Public JSON from a scan, with preview/written flags."""
    crate = None
    name = CRATE_NAME
    if saved is not None:
        label = saved.get("name")
        if isinstance(label, str) and label:
            name = label
        saved_id = saved.get("id")
        if written and isinstance(saved_id, int) and not isinstance(saved_id, bool):
            crate = {"id": saved_id, "name": name}
    body = _cap_lists(dict(report))
    body["preview"] = not written
    body["written"] = written
    body["name"] = name
    body["saved"] = crate
    body["copied"] = copied
    warning = None if saved is None else saved.get("warning")
    if isinstance(warning, str) and warning:
        body["warning"] = warning
    return body


def preview(dest: object, space: str) -> dict[str, object]:
    """Read-only classification of laptop files against dest.

    Args:
        dest: Backup folder. Must already exist as a directory.
        space: Space name.

    Returns:
        Report with ``preview`` true and ``written`` false.
    """
    path = _open_dest(dest, space, must_exist=True)
    return _plan(_scan(path, space), written=False)


def _copy_one(source: Path, dest_path: Path) -> str:
    """Copy one file and verify hashes.

    Returns:
        ``copied``, ``skip``, or ``mismatch``.
    """
    before = _hash_file(source)
    if before is None:
        return "mismatch"
    if _is_file(dest_path):
        existing = _hash_file(dest_path)
        if existing == before:
            return "skip"
        if existing is None:
            return "mismatch"
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


def copy_files(dest: object, space: str) -> dict[str, object]:
    """Copy laptop files onto dest. Serato may stay open.

    Dest is created when missing. A dest file that already matches is
    skipped. A hash mismatch is reported and not treated as backed up.

    Args:
        dest: Backup folder.
        space: Space name.

    Returns:
        Report with ``written`` true and ``copied`` the files written.
    """
    path = _open_dest(dest, space, must_exist=False)
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise LibraryError(folder_sync.FOLDER_UNREADABLE) from exc
    if not path.is_dir():
        raise LibraryError(folder_sync.FOLDER_UNREADABLE)
    scan = _scan(path, space)
    copied = 0
    mismatch = list(scan["mismatch"]) if isinstance(scan["mismatch"], list) else []
    remaining: list[dict[str, object]] = []
    for item in scan["copy"] if isinstance(scan["copy"], list) else []:
        if not isinstance(item, dict):
            continue
        source = Path(str(item.get("source") or ""))
        dest_path = Path(str(item.get("dest") or ""))
        result = _copy_one(source, dest_path)
        if result == "copied":
            copied += 1
        elif result == "mismatch":
            mismatch.append(item)
            remaining.append(item)
        else:
            remaining.append(item)
    after = _scan(path, space)
    after["mismatch"] = mismatch
    after["mismatch_count"] = len(mismatch)
    after["copy"] = remaining
    after["copy_count"] = len(remaining)
    return _plan(after, written=True, copied=copied)


def _restore_one(laptop: Path, dest_file: Path) -> str:
    """Copy dest onto laptop. Skip a newer or identical laptop file.

    Returns:
        ``restored``, ``skip``, ``skip_newer``, or ``mismatch``.
    """
    dest_hash = _hash_file(dest_file)
    if dest_hash is None:
        return "mismatch"
    if _is_file(laptop):
        laptop_hash = _hash_file(laptop)
        if laptop_hash == dest_hash:
            return "skip"
        laptop_mtime = _mtime(laptop)
        dest_mtime = _mtime(dest_file)
        if (
            laptop_mtime is not None
            and dest_mtime is not None
            and laptop_mtime > dest_mtime
        ):
            return "skip_newer"
    try:
        laptop.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(dest_file, laptop)
    except OSError:
        return "mismatch"
    after = _hash_file(laptop)
    if after != dest_hash:
        return "mismatch"
    return "restored"


def restore_files(dest: object, space: str) -> dict[str, object]:
    """Copy dest files back onto this computer.

    A laptop file that is newer than dest, or already the same hash, is
    left alone. Dest is the source of truth only when the laptop file is
    missing or older.

    Args:
        dest: Backup folder. Must exist.
        space: Space name.

    Returns:
        Report with ``written`` true when at least one file was restored.
    """
    path = _open_dest(dest, space, must_exist=True)
    scan = _scan(path, space)
    restored = 0
    mismatch = list(scan["mismatch"]) if isinstance(scan["mismatch"], list) else []
    skip_newer = list(scan["skip_newer"]) if isinstance(scan["skip_newer"], list) else []
    remaining: list[dict[str, object]] = []
    for item in scan["restore"] if isinstance(scan["restore"], list) else []:
        if not isinstance(item, dict):
            continue
        laptop = Path(str(item.get("source") or ""))
        dest_file = Path(str(item.get("dest") or ""))
        result = _restore_one(laptop, dest_file)
        if result == "restored":
            restored += 1
        elif result == "skip_newer":
            skip_newer.append(item)
        elif result == "mismatch":
            mismatch.append(item)
            remaining.append(item)
        else:
            remaining.append(item)
    after = _scan(path, space)
    after["mismatch"] = mismatch
    after["mismatch_count"] = len(mismatch)
    after["skip_newer"] = skip_newer
    after["skip_newer_count"] = len(skip_newer)
    after["restore"] = remaining
    after["restore_count"] = len(remaining)
    return _plan(after, written=restored > 0, copied=restored)


def create_crate(dest: object, space: str) -> dict[str, object]:
    """Save an Only on this laptop crate through ``crate_action``.

    Serato must be quit. An empty list does not write.

    Args:
        dest: Backup folder. Must exist.
        space: Space name.

    Returns:
        Report with ``saved`` when a crate was created.
    """
    path = _open_dest(dest, space, must_exist=True)
    scan = _scan(path, space)
    ids: list[int] = []
    for item in scan["only_laptop"] if isinstance(scan["only_laptop"], list) else []:
        if isinstance(item, dict) and isinstance(item.get("id"), int) and not isinstance(item.get("id"), bool):
            ids.append(int(item["id"]))
    if not ids:
        return _plan(scan, written=False)
    made = library.crate_action(
        {
            "action": "create",
            "space": space,
            "name": CRATE_NAME,
            "assets": ids,
        }
    )
    return _plan(scan, written=True, saved=made)


def relink_missing(dest: object, space: str, *, confirm: bool) -> dict[str, object]:
    """Point missing laptop tracks at dest files through ``files``.

    Audio is not moved. ``confirm`` false returns ``files.plan``. True
    calls ``files.execute``.

    Args:
        dest: Backup folder. Must exist.
        space: Space name.
        confirm: True writes stored paths.

    Returns:
        Mirror report plus the files plan or execute result under
        ``relink_result``.
    """
    path = _open_dest(dest, space, must_exist=True)
    scan = _scan(path, space)
    matches: list[dict[str, object]] = []
    for item in scan["relink"] if isinstance(scan["relink"], list) else []:
        if not isinstance(item, dict):
            continue
        asset_id = item.get("id")
        dest_path = item.get("dest")
        if isinstance(asset_id, int) and not isinstance(asset_id, bool) and isinstance(dest_path, str):
            matches.append({"id": asset_id, "path": dest_path})
    payload: dict[str, object] = {
        "action": "relink",
        "space": space,
        "matches": matches,
    }
    if not matches:
        body = _plan(scan, written=False)
        body["relink_result"] = {"ok": True, "preview": True, "changes": []}
        return body
    if not confirm:
        planned = files.plan(payload)
        body = _plan(scan, written=False)
        body["relink_result"] = planned
        return body
    payload["confirm"] = True
    executed = files.execute(payload)
    body = _plan(scan, written=True)
    body["relink_result"] = executed
    return body


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/music-mirror`` request.

    Args:
        payload: ``action`` is ``preview``, ``copy``, ``restore``,
            ``crate``, or ``relink``. All take ``dest`` and ``space``.
            Writes other than preview need ``confirm`` true.

    Returns:
        That action's result. Without ``confirm``, copy, restore, crate,
        and relink return the preview.

    Raises:
        LibraryError: If the action or dest is invalid.
        library.SeratoOpen: If crate or relink runs while Serato holds
            the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    dest = payload.get("dest")
    confirm = payload.get("confirm") is True
    if kind == "preview" or kind in ("copy", "restore", "crate", "relink") and not confirm:
        return preview(dest, space)
    if kind == "copy":
        return copy_files(dest, space)
    if kind == "restore":
        return restore_files(dest, space)
    if kind == "crate":
        return create_crate(dest, space)
    if kind == "relink":
        return relink_missing(dest, space, confirm=True)
    raise LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print a music-mirror preview, or write when a flag is set.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the result was printed, 1 when it could not be made.
    """
    parser = argparse.ArgumentParser(description="Copy library audio to a second drive.")
    parser.add_argument("dest")
    parser.add_argument("--copy", action="store_true")
    parser.add_argument("--restore", action="store_true")
    parser.add_argument("--crate", action="store_true")
    parser.add_argument("--relink", action="store_true")
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    flags = [args.copy, args.restore, args.crate, args.relink]
    if sum(1 for flag in flags if flag) > 1:
        print("Choose one of --copy, --restore, --crate, or --relink.", file=sys.stderr)
        return 1
    try:
        if args.copy:
            result = copy_files(args.dest, args.space)
        elif args.restore:
            result = restore_files(args.dest, args.space)
        elif args.crate:
            result = create_crate(args.dest, args.space)
        elif args.relink:
            result = relink_missing(args.dest, args.space, confirm=True)
        else:
            result = preview(args.dest, args.space)
    except LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
