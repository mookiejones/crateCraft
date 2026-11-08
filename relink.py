#!/usr/bin/env python3
"""Find where missing tracks went (#28). Applying a match is journalled in files.py.

``plan`` reads the library with ``gig_check.open_read_only`` and lists
tracks whose file is gone. A track on a drive that is not plugged in is
unavailable, not missing, and is never matched: its file may be fine on
that drive. The rules are the gig check's, through ``volumes``.

Each missing track gets candidates found under the search roots:

- ``high``: the same file name and the same size.
- ``medium``: the same file name with a different or unknown size, or the
  same size and extension under another name.
- ``low``: several files fit equally well; all are listed to choose from.

When high matches show that a whole folder moved (for example
``/Volumes/OLD/Music`` to ``/Volumes/NEW/DJ``), the move is reported once
in ``remaps``, and every other missing track under the old folder whose
file is at the new place gets a ``high`` "folder moved" candidate.

The walk reads directory entries with ``os.scandir``. It does not follow
shortcuts, does not enter ``_Serato_`` or hidden folders, does not open
audio, and stops after ``SCAN_LIMIT`` entries (``truncated`` is then true).
Nothing is written here. ``POST /api/files`` with ``action: relink``
applies chosen matches through the journalled path rewrite in ``files.py``.
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from pathlib import Path, PurePath

import gig_check
import library
import volumes

SCAN_LIMIT = 200_000
AUDIO_SUFFIXES = frozenset(
    {".mp3", ".wav", ".wave", ".aiff", ".aif", ".aifc", ".flac", ".m4a", ".aac", ".ogg", ".oga", ".mp4", ".wma", ".alac"}
)
APPLE_MUSIC_THIRD_PARTY = 6
_MIN_REMAP_TRACKS = 2


@dataclass(frozen=True, slots=True)
class Missing:
    """One track whose file is gone.

    Attributes:
        asset_id: ``asset.id``.
        title: Track title, or the file name when the title is blank.
        artist: Artist, possibly empty.
        stored: The path Serato stored (``portable_id``).
        expected: Where the file was looked for.
        size: ``asset.file_size``, or None when unknown.
    """

    asset_id: int
    title: str
    artist: str
    stored: str
    expected: str
    size: int | None


@dataclass(frozen=True, slots=True)
class Candidate:
    """A file that may be the missing track.

    Attributes:
        path: Absolute path on disk.
        confidence: ``high``, ``medium``, or ``low``.
        reason: ``same name and size``, ``same name``, ``same size``, or
            ``folder moved``.
    """

    path: str
    confidence: str
    reason: str


@dataclass(slots=True)
class _Index:
    """Audio files found under the roots."""

    by_name: dict[str, list[tuple[str, int]]] = field(default_factory=lambda: dict[str, list[tuple[str, int]]]())
    by_size: dict[tuple[int, str], list[str]] = field(default_factory=lambda: dict[tuple[int, str], list[str]]())
    paths: set[str] = field(default_factory=lambda: set[str]())
    scanned: int = 0
    truncated: bool = False


def _text(value: object) -> str:
    """Return a stripped string, or an empty one for None."""
    return value.strip() if isinstance(value, str) else ""


def _int(value: object) -> int | None:
    """Return an int column value, or None."""
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, int):
        return value
    try:
        return int(str(value))
    except ValueError:
        return None


def _column(columns: set[str], name: str) -> str:
    """Select a column, or NULL when this schema does not have it.

    Args:
        columns: Columns of ``asset``.
        name: Wanted column.

    Returns:
        SQL for the select list.
    """
    return f"a.{name}" if name in columns else f"NULL AS {name}"


def _read(conn: sqlite3.Connection, space: str) -> tuple[list[sqlite3.Row], dict[int, str]]:
    """Read the space's tracks and the location URIs.

    Args:
        conn: Read-only connection.
        space: Space name.

    Returns:
        Track rows and ``location_id`` to ``database_uri``.
    """
    columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(asset)")}
    wanted = ("name", "artist", "portable_id", "file_name", "file_size", "location_id", "third_party_type")
    select = ", ".join(_column(columns, name) for name in wanted)
    rows = conn.execute(
        f"""
        SELECT a.id, {select}
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        ORDER BY a.id
        """,
        (space,),
    ).fetchall()
    locations: dict[int, str] = {}
    tables = {str(row[0]) for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    if "connection" in tables:
        try:
            for row in conn.execute("SELECT location_id, database_uri FROM connection"):
                location = _int(row["location_id"])
                uri = row["database_uri"]
                if location is not None and isinstance(uri, str) and uri:
                    locations[location] = uri
        except sqlite3.OperationalError:
            pass
    return rows, locations


def find_missing(rows: Iterable[sqlite3.Row], locations: dict[int, str]) -> tuple[list[Missing], list[str]]:
    """Split tracks into missing files and unplugged drives.

    Uses the gig check's rules: a track whose drive is not mounted is
    unavailable; a streaming track is skipped; anything else that does not
    open for reading is missing.

    Args:
        rows: Track rows from :func:`_read`.
        locations: ``location_id`` to ``database_uri``.

    Returns:
        Missing tracks, and the sorted names of unplugged drives.
    """
    mounts = volumes.Mounts()
    missing: list[Missing] = []
    absent: set[str] = set()
    for row in rows:
        stored = _text(row["portable_id"])
        if not stored or _int(row["third_party_type"]) == APPLE_MUSIC_THIRD_PARTY:
            continue
        uri = locations.get(_int(row["location_id"]) or -1, "")
        gone = volumes.absent_volume(stored, uri, mounts)
        if gone is not None:
            absent.add(gone.name)
            continue
        location_volume = volumes.external_volume(volumes.location_path(uri)) if uri else None
        path_volume = volumes.external_volume(stored) if Path(stored).is_absolute() else None
        root = next((volume.root for volume in (location_volume, path_volume) if volume is not None), None)
        candidates = volumes.path_candidates(stored, root)
        if any(volumes.opens_for_read(candidate) for candidate in candidates):
            continue
        size = _int(row["file_size"])
        title = _text(row["name"]) or _text(row["file_name"]) or PurePath(stored.replace("\\", "/")).name
        missing.append(
            Missing(
                int(row["id"]),
                title,
                _text(row["artist"]),
                stored,
                str(candidates[0]) if candidates else stored,
                size if size and size > 0 else None,
            )
        )
    return missing, sorted(absent)


def scan(roots: Sequence[Path], limit: int = SCAN_LIMIT) -> _Index:
    """Index audio files under the roots by name and by size.

    Args:
        roots: Folders to search. A missing folder is skipped.
        limit: Directory entries to read before stopping.

    Returns:
        The index. ``truncated`` is true when the limit was reached.
    """
    index = _Index()
    stack = [root for root in roots if root.is_dir() and not root.is_symlink()]
    seen: set[str] = set()
    while stack:
        folder = stack.pop()
        key = os.path.normcase(str(folder))
        if key in seen:
            continue
        seen.add(key)
        try:
            entries = list(os.scandir(folder))
        except OSError:
            continue
        for entry in entries:
            index.scanned += 1
            if index.scanned > limit:
                index.truncated = True
                return index
            if entry.name.startswith(".") or entry.name == "_Serato_":
                continue
            try:
                if entry.is_symlink():
                    continue
                if entry.is_dir(follow_symlinks=False):
                    stack.append(Path(entry.path))
                    continue
                if not entry.is_file(follow_symlinks=False):
                    continue
                suffix = Path(entry.name).suffix.lower()
                if suffix not in AUDIO_SUFFIXES:
                    continue
                size = entry.stat(follow_symlinks=False).st_size
            except OSError:
                continue
            index.by_name.setdefault(entry.name.casefold(), []).append((entry.path, size))
            index.by_size.setdefault((size, suffix), []).append(entry.path)
            index.paths.add(os.path.normcase(entry.path))
    return index


def _name_of(stored: str) -> str:
    """Return the file name of a stored path in either slash style."""
    return PurePath(stored.replace("\\", "/")).name


def match(track: Missing, index: _Index) -> list[Candidate]:
    """Rank the files that may be one missing track.

    Args:
        track: The missing track.
        index: Files found under the roots.

    Returns:
        Candidates, best first. Empty when nothing fits.
    """
    name = _name_of(track.stored)
    named = index.by_name.get(name.casefold(), [])
    if named:
        if track.size is not None:
            sized = [path for path, size in named if size == track.size]
            if len(sized) == 1:
                return [Candidate(sized[0], "high", "same name and size")]
            if sized:
                return [Candidate(path, "low", "same name and size") for path in sorted(sized)]
        if len(named) == 1:
            return [Candidate(named[0][0], "medium", "same name")]
        return [Candidate(path, "low", "same name") for path, _size in sorted(named)]
    if track.size is not None:
        suffix = Path(name).suffix.lower()
        same = index.by_size.get((track.size, suffix), [])
        if len(same) == 1:
            return [Candidate(same[0], "medium", "same size")]
        return [Candidate(path, "low", "same size") for path in sorted(same)]
    return []


def moved_folders(old: str, new: str) -> tuple[str, str] | None:
    """Return the old and new folders after removing their shared tail.

    ``/Volumes/OLD/Music/House/a.mp3`` and ``/Volumes/NEW/DJ/House/a.mp3``
    give ``/Volumes/OLD/Music`` and ``/Volumes/NEW/DJ``.

    Args:
        old: Stored path.
        new: Found path.

    Returns:
        The two folders, or None when only the file name is shared, or the
        paths are the same. The old folder keeps the stored separators, so a
        Mac path read on Windows (or a PC path read on a Mac) is reported
        exactly as the library wrote it. The new folder is a path on this
        computer.
    """
    a = PurePath(old.replace("\\", "/")).parts
    b = PurePath(new.replace("\\", "/")).parts
    shared = 0
    while shared < min(len(a), len(b)) - 1 and a[-1 - shared].casefold() == b[-1 - shared].casefold():
        shared += 1
    if shared < 1 or a[: len(a) - shared] == b[: len(b) - shared]:
        return None
    return _drop_tail(old, shared), str(PurePath(*b[: len(b) - shared]))


def _drop_tail(path: str, count: int) -> str:
    """Remove the last ``count`` names from a path, keeping its separators.

    Args:
        path: A stored path, with ``/`` or ``\\`` separators.
        count: Names to remove, at least 1.

    Returns:
        The folder that held those names, written as stored.
    """
    end = len(path.rstrip("/\\"))
    for _ in range(count):
        end = max(path.rfind("/", 0, end), path.rfind("\\", 0, end))
        end = len(path[:end].rstrip("/\\"))
    return path[:end]


def remaps(pairs: Sequence[tuple[Missing, Candidate]]) -> list[dict[str, object]]:
    """Find folder moves that explain at least two high matches.

    Args:
        pairs: Missing tracks and their single high candidate.

    Returns:
        ``{from, to, count}``, most tracks first.
    """
    counts: dict[tuple[str, str], int] = {}
    for track, candidate in pairs:
        moved = moved_folders(track.stored, candidate.path)
        if moved is not None:
            counts[moved] = counts.get(moved, 0) + 1
    found: list[dict[str, object]] = [
        {"from": old, "to": new, "count": count}
        for (old, new), count in counts.items()
        if count >= _MIN_REMAP_TRACKS
    ]
    return sorted(found, key=lambda item: (-int(str(item["count"])), str(item["from"])))


def _remapped(track: Missing, moves: Sequence[dict[str, object]], index: _Index) -> Candidate | None:
    """Return a high candidate when a known folder move explains the track.

    Args:
        track: Missing track.
        moves: Folder moves from :func:`remaps`.
        index: Files found under the roots.

    Returns:
        A "folder moved" candidate whose file was found, or None.
    """
    stored = PurePath(track.stored.replace("\\", "/"))
    for move in moves:
        old = PurePath(str(move["from"]).replace("\\", "/"))
        try:
            tail = stored.relative_to(old)
        except ValueError:
            continue
        target = Path(str(move["to"])) / tail
        if os.path.normcase(str(target)) in index.paths:
            return Candidate(str(target), "high", "folder moved")
    return None


def search_root(value: str) -> Path:
    """Resolve an extra folder to search after a drive swap.

    After a drive swap the files may sit outside the current music roots, so
    this folder can be anywhere on the computer. The path is normalized and
    required to stay under its drive root before the folder is opened, the
    same way the setup folder picker is.

    Args:
        value: Absolute path from the page.

    Returns:
        The resolved directory.

    Raises:
        library.LibraryError: If the path is not an absolute real folder.
    """
    if not isinstance(value, str) or not value.strip() or "\x00" in value or len(value) > 4096:
        raise library.LibraryError("That request is not valid.")
    if not os.path.isabs(value):
        raise library.LibraryError("That request is not valid.")
    normalized = os.path.normpath(os.path.abspath(value))
    drive, _rest = os.path.splitdrive(normalized)
    root = drive + os.sep if drive else os.path.abspath(os.sep)
    if not normalized.startswith(root):
        raise library.LibraryError("That request is not valid.")
    directory = Path(normalized)
    if directory.is_symlink():
        raise library.LibraryError("Shortcuts are left alone.")
    if not directory.is_dir():
        raise library.LibraryError("Choose a folder.")
    try:
        return directory.resolve()
    except OSError as exc:
        raise library.LibraryError("That folder could not be read.") from exc


def plan(database: Path, space: str, roots: Sequence[Path], *, limit: int = SCAN_LIMIT) -> dict[str, object]:
    """Suggest where each missing track went. Nothing is written.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        roots: Folders to search.
        limit: Directory entries to read before stopping.

    Returns:
        ``missing`` (count), ``unavailable_drives``, ``matches`` (one per
        missing track with ``asset_id``, ``title``, ``artist``, ``stored``,
        and ``candidates``), ``remaps``, ``scanned``, and ``truncated``.

    Raises:
        library.LibraryError: The space is unknown, or the database is
            missing or cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows, locations = _read(conn, space)
    finally:
        conn.close()
    missing, absent = find_missing(rows, locations)
    index = scan(roots, limit)
    ranked = {track.asset_id: match(track, index) for track in missing}
    sure = [
        (track, ranked[track.asset_id][0])
        for track in missing
        if len(ranked[track.asset_id]) == 1 and ranked[track.asset_id][0].confidence == "high"
    ]
    moves = remaps(sure)
    out: list[dict[str, object]] = []
    for track in missing:
        candidates = ranked[track.asset_id]
        if not (candidates and candidates[0].confidence == "high"):
            moved = _remapped(track, moves, index)
            if moved is not None:
                candidates = [moved, *[item for item in candidates if item.path != moved.path]]
        out.append(
            {
                "asset_id": track.asset_id,
                "title": track.title,
                "artist": track.artist,
                "stored": track.stored,
                "candidates": [
                    {"path": item.path, "confidence": item.confidence, "reason": item.reason} for item in candidates
                ],
            }
        )
    return {
        "missing": len(missing),
        "unavailable_drives": absent,
        "matches": out,
        "remaps": moves,
        "scanned": index.scanned,
        "truncated": index.truncated,
    }


def main(argv: Sequence[str] | None = None) -> int:
    """Print the relink plan as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the plan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="Suggest where missing tracks went. Read-only.")
    parser.add_argument("roots", nargs="+", type=Path, help="Folders to search")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        result = plan(args.database, args.space, args.roots)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
