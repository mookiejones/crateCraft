#!/usr/bin/env python3
"""One-page library health report from the database and on-disk files (#29).

``report`` reads the library with ``gig_check.open_read_only``. It counts
missing files, tracks with no BPM or key, empty genre, tracks in no crate,
duplicate groups, present files with no artwork or beatgrid, present
files with a crowded cue list, and unused
audio files under the collapsed folders of those present files. Sample
rows are capped. NFC and NFD spellings of one path count as one track.
``path_forms`` lists the extra spelling. Nothing is written, so the
report is safe while Serato DJ is open. Cleanup is ``POST /api/path-forms``.

``python3 library_health.py`` prints the JSON. ``GET /api/library-health``
returns the same object. ``quality`` is the per-track line from
``quality_line.section`` (format, measured bitrate, peak). The report
itself still writes nothing.
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
import path_forms
import quality_line
import suspicious_cues
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
    conn: sqlite3.Connection,
    space: str,
    members: set[int] | None,
    mapping: dict[int, int] | None = None,
) -> list[dict[str, object]]:
    """Group tracks that share title, artist, and length within 4 seconds.

    Uses the same clusters as ``library.duplicate_groups``. A crate filter
    keeps a group when any member is in the crate, and keeps the full id
    list so the other copy is visible. Extra spellings of one path fold
    onto the kept id. A group that shrinks to one id is dropped.
    """
    rows = conn.execute(
        """
        SELECT a.name, a.artist, a.id, a.length_ms
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
          AND a.length_ms IS NOT NULL
          AND a.length_ms >= 0
        """,
        (space,),
    ).fetchall()
    packed = [
        (row["name"], row["artist"], int(row["id"]), int(row["length_ms"]))
        for row in rows
    ]
    groups: list[dict[str, object]] = []
    for group in library.group_recordings(packed):
        raw_ids = group["ids"]
        if not isinstance(raw_ids, list):
            continue
        ids = [item for item in raw_ids if isinstance(item, int) and not isinstance(item, bool)]
        if members is not None and not any(asset_id in members for asset_id in ids):
            continue
        if mapping:
            folded: list[int] = []
            seen: set[int] = set()
            for asset_id in ids:
                keep_id = mapping.get(asset_id, asset_id)
                if keep_id in seen:
                    continue
                seen.add(keep_id)
                folded.append(keep_id)
            ids = folded
        if len(ids) < 2:
            continue
        groups.append(
            {
                "name": group["name"],
                "artist": group["artist"],
                "seconds": group["seconds"],
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
        ``empty_genre``, ``no_crate``, ``suspicious_cues``, ``unused``,
        ``duplicates``, and ``quality``. Each track section is
        ``{ count, tracks }`` with at most ``ROW_CAP`` sample rows.
        ``unused`` is ``{ count, files }``. ``duplicates`` is
        ``{ count, groups }``. ``path_forms`` is ``{ count, groups }``
        for NFC and NFD spellings of one path. ``quality`` is
        ``{ count, dismissed, tracks }``. A quality track adds
        ``quality`` (``format``, ``bitrate_kbps``, ``peak_db``). A missing
        file is left out of that section. An unreadable file stays, with
        those three fields null. ``no_crate`` and ``unused`` are empty
        when a crate is selected. Artwork, beatgrid, and cue checks skip
        files that are missing or not on disk. The quality sample uses
        the same crate scope and measures at most ``ROW_CAP`` present
        files. ``suspicious_cues`` uses
        ``suspicious_cues.CUE_COUNT_LIMIT`` and ``SAME_TIME_LIMIT``.

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
        in_crate = file_scan._crate_assets(conn, _crate_ids_in_space(conn, space_id))
        _, space_groups = path_forms.collapse_rows(rows)
        mapping = path_forms.mapping_from(space_groups)
        covered = path_forms.covered_from(rows, space_groups, in_crate)
        if members is not None:
            rows = [row for row in rows if int(row["id"]) in members]
        rows, form_groups = path_forms.collapse_rows(rows)
        missing: list[dict[str, object]] = []
        no_bpm: list[dict[str, object]] = []
        no_key: list[dict[str, object]] = []
        no_beatgrid: list[dict[str, object]] = []
        no_artwork: list[dict[str, object]] = []
        suspicious: list[dict[str, object]] = []
        empty_genre: list[dict[str, object]] = []
        no_crate: list[dict[str, object]] = []
        present: list[str] = []
        quality_inputs: list[dict[str, object]] = []
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
            if crate_id is None and int(row["id"]) not in covered:
                no_crate.append(item)
            path = _present_path(row["portable_id"])
            quality_inputs.append({**item, "path": path})
            if path is None:
                continue
            present.append(path)
            health = tags.read_file_health(path)
            if not health["beatgrid"]:
                no_beatgrid.append(item)
            if not health["artwork"]:
                no_artwork.append(item)
            if suspicious_cues.is_suspicious(tags.read_serato_tags(path)["cues"]):
                suspicious.append(item)
        groups = _duplicate_groups(conn, space, members, mapping)
        unused = _unused_files(present, crate_id)
    finally:
        conn.close()
    quality = quality_line.section(quality_inputs, ROW_CAP)
    return {
        "space": space,
        "crate": crate_id,
        "checked": len(rows),
        "missing": _section(missing),
        "no_bpm": _section(no_bpm),
        "no_key": _section(no_key),
        "no_beatgrid": _section(no_beatgrid),
        "no_artwork": _section(no_artwork),
        "suspicious_cues": _section(suspicious),
        "empty_genre": _section(empty_genre),
        "no_crate": _section(no_crate),
        "unused": _file_section(unused),
        "duplicates": {"count": len(groups), "groups": groups[:ROW_CAP]},
        "path_forms": {"count": len(form_groups), "groups": form_groups[:ROW_CAP]},
        "quality": quality,
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
