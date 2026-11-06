#!/usr/bin/env python3
"""Find titles and artists Serato's database lost, without changing anything (#73).

Some tracks show a blank title or artist in Serato even though the audio
file still carries them. ``plan`` reads the library with
``gig_check.open_read_only`` and, for each track in the space whose title
or artist is blank, reads the file's own tags with ``tags.read_text_tags``.
A fix is proposed only for a field that is blank in the database and set in
the file. A field that already has a value is never proposed, even when the
file says something else. A track whose file is missing is skipped.

Nothing is written. Applying a fix is a separate step that goes through
``safe_write`` with Serato closed.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path

import gig_check
import library
import tags

FIELDS = (("name", "title"), ("artist", "artist"))


def _text(value: object) -> str:
    """Return a stripped string, or an empty one."""
    return value.strip() if isinstance(value, str) else ""


def plan(database: Path, space: str) -> dict[str, object]:
    """List tracks whose blank title or artist the file can fill.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.

    Returns:
        ``checked`` (tracks with a blank field), ``unreadable`` (of those,
        how many had no readable file), and ``fixes``: one entry per track
        with ``asset_id``, ``path``, ``current`` (``name`` and ``artist``
        as stored), and ``proposed`` (only the blank fields the file fills).

    Raises:
        library.LibraryError: The space is unknown, or the database is
            missing or cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
              AND (TRIM(COALESCE(a.name, '')) = '' OR TRIM(COALESCE(a.artist, '')) = '')
            ORDER BY a.id
            """,
            (space,),
        ).fetchall()
    finally:
        conn.close()
    fixes: list[dict[str, object]] = []
    unreadable = 0
    for row in rows:
        stored = _text(row["portable_id"])
        resolved = library.resolved_path(stored) if stored else None
        if not resolved or not Path(resolved).is_file():
            unreadable += 1
            continue
        found = tags.read_text_tags(resolved)
        current = {"name": _text(row["name"]), "artist": _text(row["artist"])}
        proposed: dict[str, str] = {}
        for column, key in FIELDS:
            if not current[column] and found[key]:
                proposed[column] = found[key]
        if proposed:
            fixes.append({"asset_id": int(row["id"]), "path": resolved, "current": current, "proposed": proposed})
    return {"checked": len(rows), "unreadable": unreadable, "fixes": fixes}


def main(argv: Sequence[str] | None = None) -> int:
    """Print the plan as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the plan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="List titles and artists the database lost. Read-only.")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        result = plan(args.database, args.space)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
