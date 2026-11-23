#!/usr/bin/env python3
"""Flag stored BPMs that are half or double the rest of a crate (#474).

The check reads ``asset.bpm`` only. It does not decode audio and it does not
read Markers2 or BeatGrid. A confirmed fix writes that BPM column through
``library.save_track`` and reads it back. A value that did not stick is
undone from the pre-write snapshot. Cues and the beatgrid stay as they were.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path
from typing import NamedTuple

import bitrate_check
import gig_check
import library
import related
import safe_write

NEEDS_CRATE = "Choose a crate for a BPM check."
NOT_FLAGGED = "That track is not half or double the crate."
FIX_MISMATCH = "That fix does not match this track."
NEEDS_CONFIRM = "Confirm the BPM change before it is saved."
DID_NOT_STICK = "The BPM did not stick. The library was put back."
BEATGRID_NOTE = "Only the stored BPM changes. The beatgrid is left alone."

MIN_TRACKS = 3
BPM_MAX = 999.0
READBACK = 1e-4
FIXES = ("x2", "div2")


class TrackBpm(NamedTuple):
    """One crate member and the BPM stored on its library row.

    Attributes:
        id: Asset id.
        name: Track title. Empty when the row has none.
        artist: Artist. Empty when the row has none.
        file: File name, never a directory.
        bpm: Stored BPM. None, zero, and non-finite values are skipped.
    """

    id: int
    name: str
    artist: str
    file: str
    bpm: object


def _positive(value: object) -> float | None:
    """Return a finite BPM above zero, or None when the value cannot be used.

    Args:
        value: Stored BPM.

    Returns:
        The BPM, or None for a blank, zero, negative, or non-finite value.
    """
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        return None
    return number


def _file_name(file_name: object, portable: object) -> str:
    """Return the file name from either column.

    Args:
        file_name: ``asset.file_name``.
        portable: ``asset.portable_id``. Used only when the file name is blank.

    Returns:
        The last path segment. Slashes and backslashes both count.
    """
    raw = file_name if isinstance(file_name, str) and file_name.strip() else portable
    if not isinstance(raw, str):
        return ""
    return raw.replace("\\", "/").rsplit("/", 1)[-1]


def _suggested(bpm: float, kind: str) -> float | None:
    """Return the BPM after ×2 or ÷2, or None when it leaves 0–999.

    Args:
        bpm: Stored BPM.
        kind: ``half`` (multiply) or ``double`` (divide).

    Returns:
        The new BPM rounded to 6 decimals, or None when it is not in range.
    """
    raw = bpm * 2 if kind == "half" else bpm / 2
    rounded = round(raw, 6)
    if rounded <= 0 or rounded > BPM_MAX:
        return None
    return rounded


def classify(tracks: Sequence[TrackBpm]) -> dict[str, object]:
    """Flag members whose BPM is half or double the crate median.

    The median uses positive finite BPMs only. Fewer than three of those
    makes no flags. A 50/50 mix, where the in-family count is not strictly
    larger than the flagged count, makes no flags either.

    Args:
        tracks: Crate members. Order does not matter.

    Returns:
        ``checked``, ``anchor``, ``skipped``, ``ready``, ``flags``, and
        ``beatgrid`` (``unchanged``). Each flag is ``id``, ``name``,
        ``artist``, ``file``, ``bpm``, ``suggested``, ``fix`` (``x2`` or
        ``div2``), and ``kind`` (``half`` or ``double``).
    """
    positive: list[tuple[TrackBpm, float]] = []
    skipped = 0
    for track in tracks:
        bpm = _positive(track.bpm)
        if bpm is None:
            skipped += 1
            continue
        positive.append((track, bpm))
    empty: dict[str, object] = {
        "checked": len(positive),
        "anchor": None,
        "skipped": skipped,
        "ready": False,
        "flags": [],
        "beatgrid": "unchanged",
    }
    if len(positive) < MIN_TRACKS:
        return empty
    anchor = round(statistics.median(bpm for _track, bpm in positive), 6)
    in_family = 0
    flags: list[dict[str, object]] = []
    for track, bpm in positive:
        relation = related.bpm_relation(anchor, bpm)
        if relation is None:
            continue
        kind = relation[0]
        if kind == "tempo":
            in_family += 1
            continue
        suggested = _suggested(bpm, kind)
        if suggested is None:
            continue
        flags.append(
            {
                "id": track.id,
                "name": track.name,
                "artist": track.artist,
                "file": track.file,
                "bpm": bpm,
                "suggested": suggested,
                "fix": "x2" if kind == "half" else "div2",
                "kind": kind,
            }
        )
    if in_family <= len(flags):
        flags = []
    flags.sort(key=lambda row: (str(row["name"]).casefold(), int(row["id"])))
    return {
        "checked": len(positive),
        "anchor": anchor,
        "skipped": skipped,
        "ready": True,
        "flags": flags,
        "beatgrid": "unchanged",
    }


def require_crate(crate_id: int | None) -> None:
    """Refuse a whole-library check from the page.

    ``python3 bpm_sanity.py`` may still scan a space.

    Args:
        crate_id: Crate id, or None.

    Raises:
        library.LibraryError: No crate (400).
    """
    if crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)


def _rows(database: Path, space: str, crate_id: int | None) -> list[TrackBpm]:
    """Read crate members, including subcrates, in name order.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Crate id, or None for the whole space.

    Returns:
        One row per asset in the space, limited to the crate when set.

    Raises:
        library.LibraryError: Unknown space, a crate not in the space, or a
            database that cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id, a.bpm
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
            ORDER BY a.name COLLATE NOCASE, a.id
            """,
            (space,),
        ).fetchall()
        if crate_id is not None:
            library.container_in_space(conn, crate_id, space)
            members = bitrate_check._crate_assets(conn, library.descendant_ids(conn, crate_id))
            rows = [row for row in rows if int(row["id"]) in members]
    finally:
        conn.close()
    return [
        TrackBpm(
            id=int(row["id"]),
            name=str(row["name"] or ""),
            artist=str(row["artist"] or ""),
            file=_file_name(row["file_name"], row["portable_id"]),
            bpm=row["bpm"],
        )
        for row in rows
    ]


def scan(database: Path, space: str, crate_id: int | None = None) -> dict[str, object]:
    """Report half-tempo and double-tempo BPMs.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        crate_id: A crate, or None for the whole space.

    Returns:
        The :func:`classify` report plus ``crate``.

    Raises:
        library.LibraryError: Unknown space, a crate not in the space (404),
            or a database that cannot be opened read-only.
    """
    report = classify(_rows(database, space, crate_id))
    return {"crate": crate_id, **report}


def _flag(space: str, crate_id: int, asset_id: int, fix: str) -> dict[str, object]:
    """Return the server's flag for one track.

    Args:
        space: Space name.
        crate_id: Crate id.
        asset_id: Asset id.
        fix: ``x2`` or ``div2``.

    Returns:
        The flag row. ``suggested`` is the BPM this fix would store.

    Raises:
        library.LibraryError: The track is not flagged, or ``fix`` is not
            the one this crate calls for.
    """
    if fix not in FIXES:
        raise library.LibraryError(FIX_MISMATCH, 400)
    report = scan(Path(library.MASTER), space, crate_id)
    flags = report["flags"]
    if not isinstance(flags, list):
        raise library.LibraryError(NOT_FLAGGED, 400)
    for row in flags:
        if isinstance(row, dict) and row.get("id") == asset_id:
            if row.get("fix") != fix:
                raise library.LibraryError(FIX_MISMATCH, 400)
            return row
    raise library.LibraryError(NOT_FLAGGED, 400)


def _read_bpm(asset_id: int) -> object:
    """Read ``asset.bpm`` the way a later library open would see it.

    Args:
        asset_id: Asset id.

    Returns:
        The stored BPM, or None when the row is gone.
    """
    with closing(library.read_conn()) as conn:
        row = conn.execute("SELECT bpm FROM asset WHERE id = ?", (asset_id,)).fetchone()
    if row is None:
        return None
    return row["bpm"]


def _stuck(stored: object, expected: float) -> bool:
    """Return whether the stored BPM matches the value just written.

    Args:
        stored: Value read from ``asset.bpm``.
        expected: BPM passed to ``save_track``.

    Returns:
        True when the absolute difference is under ``1e-4``.
    """
    if isinstance(stored, bool) or not isinstance(stored, (int, float)):
        return False
    number = float(stored)
    if not math.isfinite(number):
        return False
    return abs(number - expected) < READBACK


def _undo_last_save(name: str) -> None:
    """Put back the snapshot taken for the BPM write.

    Args:
        name: Track title recorded on the undo. Not a path.

    Raises:
        library.LibraryError: The pre-write snapshot is missing or the
            restore failed.
    """
    snapshot_id: str | None = None
    for row in reversed(safe_write.read_log()):
        if row.get("operation") != "save_track":
            continue
        found = row.get("snapshot_before")
        if isinstance(found, str) and found:
            snapshot_id = found
            break
    if snapshot_id is None:
        raise library.LibraryError("The pre-write snapshot is missing.", 409)
    safe_write.undo_preimage(snapshot_id, operation="bpm_sanity", target=name)


def preview(space: str, crate_id: int, asset_id: int, fix: str) -> dict[str, object]:
    """Describe one BPM fix without writing.

    Args:
        space: Space name.
        crate_id: Crate id.
        asset_id: Asset id.
        fix: ``x2`` or ``div2``.

    Returns:
        ``preview``, the flag fields, ``beatgrid`` ``unchanged``, and a
        message that the beatgrid is left alone.

    Raises:
        library.LibraryError: No crate, the track is not flagged, or the
            fix does not match.
    """
    require_crate(crate_id)
    row = _flag(space, crate_id, asset_id, fix)
    return {
        "preview": True,
        "id": asset_id,
        "name": row["name"],
        "bpm": row["bpm"],
        "suggested": row["suggested"],
        "fix": row["fix"],
        "beatgrid": "unchanged",
        "message": BEATGRID_NOTE,
    }


def apply(space: str, crate_id: int, asset_id: int, fix: str) -> dict[str, object]:
    """Write one confirmed BPM and read it back.

    The expected BPM is computed again here. A caller-supplied BPM is ignored.
    Markers2, BeatGrid, cues, and the audio file are not opened.

    Args:
        space: Space name.
        crate_id: Crate id.
        asset_id: Asset id.
        fix: ``x2`` or ``div2``.

    Returns:
        ``ok``, ``written``, ``id``, ``bpm``, and ``beatgrid`` ``unchanged``.

    Raises:
        library.LibraryError: The fix is refused, the BPM did not stick and
            the library was put back, or the write itself failed.
        library.SeratoOpen: Serato still has the library open.
    """
    require_crate(crate_id)
    row = _flag(space, crate_id, asset_id, fix)
    expected = row["suggested"]
    if not isinstance(expected, (int, float)) or isinstance(expected, bool):
        raise library.LibraryError(FIX_MISMATCH, 400)
    target = str(row["name"] or f"track {asset_id}")
    library.save_track(asset_id, {"bpm": float(expected)}, space, overwrite=["bpm"])
    if not _stuck(_read_bpm(asset_id), float(expected)):
        _undo_last_save(target)
        raise library.LibraryError(DID_NOT_STICK, 409)
    return {
        "ok": True,
        "written": True,
        "id": asset_id,
        "bpm": float(expected),
        "beatgrid": "unchanged",
    }


def _space(value: object) -> str:
    """Return a space name from a JSON body.

    Args:
        value: Submitted space, or None for the Serato Library space.

    Returns:
        The space name.

    Raises:
        library.LibraryError: The value is not a known space.
    """
    if value is None or value == "":
        return library.LIBRARY_SPACE
    if not isinstance(value, str) or value not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    return value


def _crate(value: object) -> int | None:
    """Return a crate id from a JSON body.

    Args:
        value: Submitted crate. None and ``all`` mean the whole space.

    Returns:
        The crate id, or None.

    Raises:
        library.LibraryError: The value is present and is not a positive int.
    """
    if value is None or value == "" or value == "all":
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise library.LibraryError("That request is not valid.", 400)
    return value


def _asset(value: object) -> int:
    """Return an asset id from a JSON body.

    Args:
        value: Submitted id.

    Returns:
        The asset id.

    Raises:
        library.LibraryError: The id is missing or not a positive int.
    """
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise library.LibraryError("Track id is required.", 400)
    return value


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/bpm-sanity`` request.

    ``confirm`` true writes. Anything else is a preview and does not write.
    ``action`` ``apply`` without ``confirm`` is refused before a write.

    Args:
        payload: ``id``, ``fix``, ``crate``, optional ``space``, and
            ``confirm``. A ``bpm`` field is ignored.

    Returns:
        The preview or the apply result.

    Raises:
        library.LibraryError: The body is not a fix this crate allows, or
            the write was not confirmed.
        library.SeratoOpen: Serato still has the library open.
    """
    space = _space(payload.get("space"))
    crate_id = _crate(payload.get("crate"))
    require_crate(crate_id)
    if crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)
    asset_id = _asset(payload.get("id"))
    fix = payload.get("fix")
    if not isinstance(fix, str):
        raise library.LibraryError(FIX_MISMATCH, 400)
    if payload.get("confirm") is True:
        return apply(space, crate_id, asset_id, fix)
    if payload.get("action") == "apply":
        raise library.LibraryError(NEEDS_CONFIRM, 400)
    return preview(space, crate_id, asset_id, fix)


def main(argv: Sequence[str] | None = None) -> int:
    """Print the report as JSON. This command does not write.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the report was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="Flag stored BPMs that are half or double the rest of a crate. Read-only."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--crate", type=int, default=None)
    args = parser.parse_args(argv)
    try:
        result = scan(args.database, args.space, args.crate)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
