#!/usr/bin/env python3
"""One-page library health report from the database and on-disk files (#29).

``report`` reads the library with ``gig_check.open_read_only``. It counts
missing files, tracks with no BPM or key, empty genre, tracks in no crate,
duplicate groups, present files with no artwork or beatgrid, and unused
audio files under the collapsed folders of those present files. Sample
rows are capped. Nothing is written, so the report is safe while Serato
DJ is open.

``python3 library_health.py`` prints the JSON. ``GET /api/library-health``
returns the same object.
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from collections.abc import Sequence
from pathlib import Path, PurePath
from typing import Any

import file_scan
import files
import gig_check
import library
import music_roots
import tags

ROW_CAP = 100
SPACE_ROOT = 0
_UNUSED_SKIP_DIRS = files._SEARCH_SKIP_DIRS | frozenset({"Recording", "DJ Sessions"})


def _blank_text(value: object) -> bool:
    """Return True when a stored string is missing or only spaces."""
    return not str(value or "").strip()


def _blank_bpm(value: object) -> bool:
    """Return True when BPM is missing or zero (unanalysed)."""
    if value is None or value == "":
        return True
    try:
        return float(value) == 0.0
    except (TypeError, ValueError):
        return True


def _track(row: sqlite3.Row) -> dict[str, object]:
    """Return the fields the page lists for one row."""
    return {
        "id": int(row["id"]),
        "name": str(row["name"] or ""),
        "artist": str(row["artist"] or ""),
        "file": str(row["file_name"] or ""),
    }


def _section(rows: list[dict[str, object]]) -> dict[str, object]:
    """Return count plus a capped sample."""
    return {"count": len(rows), "tracks": rows[:ROW_CAP]}


def _file_section(rows: list[dict[str, object]]) -> dict[str, object]:
    """Return unused-file count plus a capped sample."""
    return {"count": len(rows), "files": rows[:ROW_CAP]}


def _present_path(portable_id: object) -> str | None:
    """Return a filesystem path when the stored file is on disk.

    Args:
        portable_id: Stored path from ``asset.portable_id``.

    Returns:
        An existing regular file path, or None when the id is empty or
        the file is missing, offline, or unreadable.
    """
    stored = portable_id if isinstance(portable_id, str) else None
    resolved = library.resolved_path(stored)
    if not resolved:
        return None
    path = Path(resolved)
    try:
        if path.is_file():
            return str(path)
    except (OSError, ValueError):
        return None
    return None


def _unused_files(present: Sequence[str], crate_id: int | None) -> list[dict[str, object]]:
    """List audio files under library folders that are not in the library.

    Walks collapsed parents of *existing* library files only. Hidden
    names, ``_Serato_``, ``.git``, ``node_modules``, ``Recording``, and
    ``DJ Sessions`` are skipped. A crate scope returns an empty list.

    Args:
        present: Absolute paths of library files that exist on disk.
        crate_id: A crate id, or None for the whole space.

    Returns:
        ``{ file, path }`` rows sorted by path. The library is not written.
    """
    if crate_id is not None or not present:
        return []
    known: set[str] = set()
    parents: list[PurePath] = []
    for raw in present:
        path = Path(raw)
        try:
            real = path.resolve()
        except OSError:
            continue
        known.add(os.path.normcase(str(real)))
        parents.append(real.parent)
    unused: list[dict[str, object]] = []
    for root in music_roots.collapse_track_folders(parents):
        root_path = Path(root)
        try:
            if not root_path.is_dir():
                continue
        except OSError:
            continue
        for dirpath, dirnames, filenames in os.walk(root_path):
            dirnames[:] = [
                name
                for name in dirnames
                if name not in _UNUSED_SKIP_DIRS and not name.startswith(".")
            ]
            for name in filenames:
                if name.startswith("."):
                    continue
                if Path(name).suffix.lower() not in files._AUDIO:
                    continue
                full = Path(dirpath) / name
                try:
                    key = os.path.normcase(str(full.resolve()))
                except OSError:
                    continue
                if key in known:
                    continue
                unused.append({"file": name, "path": str(full)})
    unused.sort(key=lambda row: str(row["path"]).casefold())
    return unused


def _crate_ids_in_space(conn: sqlite3.Connection, space_id: int) -> list[int]:
    """Return crate ids in this space, excluding the space root (type 0)."""
    return [
        int(row[0])
        for row in conn.execute(
            "SELECT id FROM container WHERE space_id = ? AND COALESCE(type, 1) != ?",
            (space_id, SPACE_ROOT),
        )
    ]


def _duplicate_groups(
    conn: sqlite3.Connection, space: str, members: set[int] | None
) -> list[dict[str, object]]:
    """Group tracks that share title, artist, and whole seconds.

    Empty titles and artists are skipped, matching ``library.duplicate_groups``.
    A crate filter keeps a group when any member is in the crate, and keeps
    the full id list so the other copy is visible.
    """
    rows = conn.execute(
        """
        SELECT a.name, a.artist, CAST(a.length_ms / 1000 AS INTEGER) AS seconds,
               GROUP_CONCAT(a.id) AS ids
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
          AND TRIM(COALESCE(a.name, '')) != ''
          AND TRIM(COALESCE(a.artist, '')) != ''
          AND a.length_ms IS NOT NULL
        GROUP BY a.name, a.artist, seconds
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC, a.name COLLATE NOCASE
        """,
        (space,),
    ).fetchall()
    groups: list[dict[str, object]] = []
    for row in rows:
        raw_ids: object = row["ids"] or ""
        ids = sorted(int(part) for part in str(raw_ids).split(",") if part)
        if members is not None and not any(asset_id in members for asset_id in ids):
            continue
        groups.append(
            {
                "name": row["name"],
                "artist": row["artist"],
                "seconds": row["seconds"],
                "ids": ids,
            }
        )
    return groups


def report(database: Path, space: str, crate_id: int | None = None) -> dict[str, Any]:
    """Count library health problems for a space, or one crate.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        crate_id: A crate; its subcrates are included. None checks the space.

    Returns:
        ``space``, ``crate``, ``checked``, and sections ``missing``,
        ``no_bpm``, ``no_key``, ``no_beatgrid``, ``no_artwork``,
        ``empty_genre``, ``no_crate``, ``unused``, and ``duplicates``.
        Each track section is ``{ count, tracks }`` with at most
        ``ROW_CAP`` sample rows. ``unused`` is ``{ count, files }``.
        ``duplicates`` is ``{ count, groups }``. ``no_crate`` and
        ``unused`` are empty when a crate is selected. Artwork and
        beatgrid skip files that are missing or not on disk.

    Raises:
        library.LibraryError: Unknown space, a crate not in the space (404),
            or a database that cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        space_row = conn.execute("SELECT id FROM space WHERE name = ?", (space,)).fetchone()
        if space_row is None:
            raise library.LibraryError("That space is not available here.")
        space_id = int(space_row[0])
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.file_name, a.bpm, a.key, a.genre,
                   a.is_missing, a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
            ORDER BY a.name COLLATE NOCASE, a.id
            """,
            (space,),
        ).fetchall()
        members: set[int] | None = None
        if crate_id is not None:
            library.container_in_space(conn, crate_id, space)
            members = file_scan._crate_assets(conn, library.descendant_ids(conn, crate_id))
            rows = [row for row in rows if int(row["id"]) in members]
        in_crate = file_scan._crate_assets(conn, _crate_ids_in_space(conn, space_id))
        missing: list[dict[str, object]] = []
        no_bpm: list[dict[str, object]] = []
        no_key: list[dict[str, object]] = []
        no_beatgrid: list[dict[str, object]] = []
        no_artwork: list[dict[str, object]] = []
        empty_genre: list[dict[str, object]] = []
        no_crate: list[dict[str, object]] = []
        present: list[str] = []
        for row in rows:
            item = _track(row)
            if int(row["is_missing"] or 0):
                missing.append(item)
            if _blank_bpm(row["bpm"]):
                no_bpm.append(item)
            if _blank_text(row["key"]):
                no_key.append(item)
            if _blank_text(row["genre"]):
                empty_genre.append(item)
            if crate_id is None and int(row["id"]) not in in_crate:
                no_crate.append(item)
            path = _present_path(row["portable_id"])
            if path is None:
                continue
            present.append(path)
            health = tags.read_file_health(path)
            if not health["beatgrid"]:
                no_beatgrid.append(item)
            if not health["artwork"]:
                no_artwork.append(item)
        groups = _duplicate_groups(conn, space, members)
        unused = _unused_files(present, crate_id)
    finally:
        conn.close()
    return {
        "space": space,
        "crate": crate_id,
        "checked": len(rows),
        "missing": _section(missing),
        "no_bpm": _section(no_bpm),
        "no_key": _section(no_key),
        "no_beatgrid": _section(no_beatgrid),
        "no_artwork": _section(no_artwork),
        "empty_genre": _section(empty_genre),
        "no_crate": _section(no_crate),
        "unused": _file_section(unused),
        "duplicates": {"count": len(groups), "groups": groups[:ROW_CAP]},
    }


def main(argv: Sequence[str] | None = None) -> int:
    """Print the report as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the report was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="Library health report. Read-only.")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--crate", type=int, default=None)
    args = parser.parse_args(argv)
    try:
        result = report(args.database, args.space, args.crate)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
