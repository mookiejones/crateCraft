#!/usr/bin/env python3
"""Group spellings of the same genre or artist, without changing anything (#27, part 1).

"Hip Hop", "Hip-Hop", "hiphop", and "HIP HOP" are one genre written four
ways, which splits search, smart crates, and duplicate detection.
``clusters`` reads the library with ``gig_check.open_read_only`` and groups
the values of one field by ``normalize``: case is folded, accents are
removed, ``&`` and ``+`` read as "and", and anything that is not a letter or
a digit is dropped. A group is reported only when it holds two or more
spellings. The suggested spelling is the one most tracks use; a tie goes to
the spelling that sorts first.

Nothing is written. Choosing a spelling and applying it, through
``safe_write`` with Serato closed, is a later change.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections.abc import Sequence
from pathlib import Path

import gig_check
import library

FIELDS = ("genre", "artist")
# The SQL names come from this table, never from the request.
_SQL = {
    "genre": (
        "SELECT a.genre AS value, COUNT(*) AS tracks FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ? AND TRIM(COALESCE(a.genre, '')) != '' GROUP BY a.genre"
    ),
    "artist": (
        "SELECT a.artist AS value, COUNT(*) AS tracks FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ? AND TRIM(COALESCE(a.artist, '')) != '' GROUP BY a.artist"
    ),
}
_NOT_WORD = re.compile(r"[^0-9a-z]+")


def normalize(value: str) -> str:
    """Return the key that equal spellings share.

    Args:
        value: A genre or artist as stored.

    Returns:
        Lower-case letters and digits only, accents removed, with ``&`` and
        ``+`` read as "and". Empty for a blank value.

    Example:
        >>> normalize("Hip-Hop") == normalize("hip hop") == normalize("HIPHOP")
        True
    """
    text = unicodedata.normalize("NFKD", value.casefold())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.replace("&", " and ").replace("+", " and ")
    return _NOT_WORD.sub("", text)


def clusters(database: Path, space: str, field: str) -> dict[str, object]:
    """Group the spellings of one field that mean the same value.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        field: ``genre`` or ``artist``.

    Returns:
        ``field``, ``values`` (distinct non-blank spellings), and ``groups``,
        largest first. Each group is ``{ key, suggested, tracks, spellings }``
        and each spelling ``{ value, count }``, most used first.

    Raises:
        library.LibraryError: The field or space is not allowed (400), or the
            database is missing or cannot be opened read-only.
    """
    if field not in FIELDS:
        raise library.LibraryError("Choose genre or artist.", 400)
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows = conn.execute(_SQL[field], (space,)).fetchall()
    finally:
        conn.close()
    counts: dict[str, int] = {}
    for row in rows:
        value = str(row["value"]).strip()
        counts[value] = counts.get(value, 0) + int(row["tracks"])
    grouped: dict[str, list[tuple[str, int]]] = {}
    for value, count in counts.items():
        key = normalize(value)
        if key:
            grouped.setdefault(key, []).append((value, count))
    groups: list[dict[str, object]] = []
    for key, spellings in grouped.items():
        if len(spellings) < 2:
            continue
        ranked = sorted(spellings, key=lambda item: (-item[1], item[0]))
        groups.append(
            {
                "key": key,
                "suggested": ranked[0][0],
                "tracks": sum(count for _value, count in ranked),
                "spellings": [{"value": value, "count": count} for value, count in ranked],
            }
        )
    groups.sort(key=lambda group: (-int(str(group["tracks"])), str(group["key"])))
    return {"field": field, "values": len(counts), "groups": groups}


def main(argv: Sequence[str] | None = None) -> int:
    """Print the groups as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the groups were printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="Group spellings of one genre or artist. Read-only.")
    parser.add_argument("field", choices=FIELDS)
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        result = clusters(args.database, args.space, args.field)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
