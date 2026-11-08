#!/usr/bin/env python3
"""Group spellings of the same genre or artist, and apply one (#27, part 2).

"Hip Hop", "Hip-Hop", "hiphop", and "HIP HOP" are one genre written four
ways, which splits search, smart crates, and duplicate detection.
``clusters`` reads the library with ``gig_check.open_read_only`` and groups
the values of one field by ``normalize``: case is folded, accents are
removed, ``&`` and ``+`` read as "and", and anything that is not a letter or
a digit is dropped. A group is reported only when it holds two or more
spellings. The suggested spelling is the one most tracks use; a tie goes to
the spelling that sorts first.

``preview`` and ``apply`` take one of those stored spellings. ``preview``
lists the rows in that space whose stored value shares the key and is not
already that spelling. ``apply`` writes that spelling through ``safe_write``
with Serato closed. Audio files are not rewritten. Remembering the mapping
for new imports, and the casing and prefix cleanup rules, are later changes.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import time
import unicodedata
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path
from typing import TypedDict

import gig_check
import library

FIELDS = ("genre", "artist")
CHOOSE_FIELD = "Choose genre or artist."
CHOOSE_SPELLING = "Choose a spelling."
NOT_IN_GROUP = "That spelling is not in a group."
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
_TRACKS = {
    "genre": (
        "SELECT a.id AS id, a.genre AS value FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ?"
    ),
    "artist": (
        "SELECT a.id AS id, a.artist AS value FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ?"
    ),
}
_NOT_WORD = re.compile(r"[^0-9a-z]+")

class SpellingCount(TypedDict):
    """One stored spelling and how many tracks use it."""

    value: str
    count: int


class Group(TypedDict):
    """Spellings that share one ``normalize`` key."""

    key: str
    suggested: str
    tracks: int
    spellings: list[SpellingCount]


class Clusters(TypedDict):
    """``clusters`` JSON: distinct values and the groups of two or more."""

    field: str
    values: int
    groups: list[Group]


Change = TypedDict("Change", {"id": int, "from": str, "to": str})


class Plan(TypedDict):
    """Preview or apply JSON for one chosen spelling."""

    field: str
    value: str
    key: str
    changes: list[Change]
    written: bool


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


def _require_field(field: str) -> str:
    """Return ``genre`` or ``artist``.

    Args:
        field: Requested field name.

    Returns:
        That field.

    Raises:
        library.LibraryError: The field is not allowed (400).
    """
    if field not in FIELDS:
        raise library.LibraryError(CHOOSE_FIELD, 400)
    return field


def _spelling(value: object, field: str) -> str:
    """Return a non-blank spelling to apply.

    Args:
        value: Chosen genre or artist text.
        field: ``genre`` or ``artist``, for the length error.

    Returns:
        The stripped spelling.

    Raises:
        library.LibraryError: The value is missing, not text, blank, or too long.
    """
    if not isinstance(value, str):
        raise library.LibraryError(CHOOSE_SPELLING, 400)
    text = value.strip()
    if not text:
        raise library.LibraryError(CHOOSE_SPELLING, 400)
    if len(text) > 4000:
        raise library.LibraryError(f"{field} is too long.")
    return text


def clusters(database: Path, space: str, field: str) -> Clusters:
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
    field = _require_field(field)
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
    groups: list[Group] = []
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
    groups.sort(key=lambda group: (-group["tracks"], group["key"]))
    return {"field": field, "values": len(counts), "groups": groups}


def _in_group(groups: Sequence[Group], spelling: str) -> str:
    """Return the cluster key when ``spelling`` is one of its stored values.

    Args:
        groups: ``clusters`` groups list.
        spelling: Chosen spelling after strip.

    Returns:
        The group's ``normalize`` key.

    Raises:
        library.LibraryError: The spelling is not in a group with two or more
            stored spellings.
    """
    key = normalize(spelling)
    if not key:
        raise library.LibraryError(NOT_IN_GROUP, 400)
    for group in groups:
        if group["key"] != key:
            continue
        if spelling in {item["value"] for item in group["spellings"]}:
            return key
    raise library.LibraryError(NOT_IN_GROUP, 400)


def _changes(
    conn: sqlite3.Connection, space: str, field: str, spelling: str, key: str
) -> list[Change]:
    """List rows in ``space`` whose field shares ``key`` and is not ``spelling``.

    Args:
        conn: Open library connection.
        space: Space name.
        field: ``genre`` or ``artist``.
        spelling: Canonical value to write.
        key: ``normalize`` key for that group.

    Returns:
        ``{ id, from, to }`` rows, sorted by id.
    """
    rows = conn.execute(_TRACKS[field], (space,)).fetchall()
    changes: list[Change] = []
    for row in rows:
        stored = row["value"]
        if stored is None:
            continue
        text = str(stored)
        if text == spelling:
            continue
        if normalize(text) != key:
            continue
        changes.append({"id": int(row["id"]), "from": text, "to": spelling})
    changes.sort(key=lambda item: item["id"])
    return changes


def _plan(database: Path, space: str, field: str, value: object) -> Plan:
    """Build the apply plan without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        field: ``genre`` or ``artist``.
        value: One stored spelling from that field's group.

    Returns:
        ``field``, ``value``, ``key``, ``changes``, and ``written`` false.

    Raises:
        library.LibraryError: The field, space, or spelling is not allowed, or
            the database cannot be opened read-only.
    """
    field = _require_field(field)
    spelling = _spelling(value, field)
    grouped = clusters(database, space, field)
    key = _in_group(grouped["groups"], spelling)
    conn = gig_check.open_read_only(database)
    try:
        changes = _changes(conn, space, field, spelling, key)
    finally:
        conn.close()
    return {
        "field": field,
        "value": spelling,
        "key": key,
        "changes": changes,
        "written": False,
    }


def preview(database: Path, space: str, field: str, value: object) -> Plan:
    """List the rows an apply would rewrite, without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        field: ``genre`` or ``artist``.
        value: One stored spelling from that field's group.

    Returns:
        Plan JSON with ``written`` false.

    Raises:
        library.LibraryError: The field, space, or spelling is not allowed.
    """
    return _plan(database, space, field, value)


def apply(space: str, field: str, value: object) -> Plan:
    """Rewrite one group's spellings through ``safe_write``.

    Args:
        space: Space name.
        field: ``genre`` or ``artist``.
        value: One stored spelling from that field's group.

    Returns:
        Plan JSON. ``written`` is false when every matching row already holds
        that spelling.

    Raises:
        library.LibraryError: The field, space, or spelling is not allowed.
        library.SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    database = Path(library.MASTER)
    plan = _plan(database, space, field, value)
    if not plan["changes"]:
        return plan
    field_name = plan["field"]
    spelling = plan["value"]
    key = plan["key"]

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> Plan:
        """Rewrite the live rows and register the field check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict with ``written`` true.
        """
        live = _changes(conn, space, field_name, spelling, key)
        write.set_target(spelling)
        now = int(time.time())
        ids = tuple(change["id"] for change in live)
        for change in live:
            library._assign(  # pyright: ignore[reportPrivateUsage]
                conn,
                "asset",
                {field_name: spelling, "time_modified": now},
                "id = ?",
                change["id"],
            )

        def check(
            copied: sqlite3.Connection,
            ids: tuple[int, ...] = ids,
            field_name: str = field_name,
            spelling: str = spelling,
        ) -> None:
            """Fail when a rewritten row does not hold the spelling.

            Args:
                copied: Read-only connection to the temporary database copy.
                ids: Asset ids this write assigned.
                field_name: ``genre`` or ``artist``.
                spelling: Value those rows should have.

            Raises:
                VerifyMismatch: If a row is missing or different.
            """
            if not ids:
                return
            placeholders = ",".join("?" * len(ids))
            sql = f"SELECT id, {field_name} FROM asset WHERE id IN ({placeholders})"
            rows = copied.execute(sql, ids).fetchall()
            got = {int(row[0]): row[1] for row in rows}
            for asset_id in ids:
                if got.get(asset_id) != spelling:
                    raise safe_write.VerifyMismatch("The track fields do not match.")

        write.check(check)
        return {
            "field": field_name,
            "value": spelling,
            "key": key,
            "changes": live,
            "written": True,
        }

    result = safe_write.run("tag_cleanup", spelling, run)
    with closing(library.read_conn()) as master:
        for change in result["changes"]:
            library._mirror_asset(  # pyright: ignore[reportPrivateUsage]
                master, change["id"], {field_name: spelling}
            )
    return result


def action(payload: Mapping[str, object]) -> Plan:
    """Run one ``POST /api/tag-clusters`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. Both take ``space``,
            ``field``, and ``value``.

    Returns:
        That action's result.

    Raises:
        library.LibraryError: If the action or its fields are invalid.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    field = payload.get("field", "genre")
    if field is None:
        field = "genre"
    if not isinstance(field, str):
        raise library.LibraryError(CHOOSE_FIELD, 400)
    value = payload.get("value")
    if kind == "preview":
        return preview(Path(library.MASTER), space, field, value)
    if kind == "apply":
        return apply(space, field, value)
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the groups, a preview, or apply a spelling.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the JSON was printed, 1 when the library could not be read or
        written.
    """
    parser = argparse.ArgumentParser(
        description="Group spellings of one genre or artist, or apply one."
    )
    parser.add_argument("field", choices=FIELDS)
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--value", help="Stored spelling to preview or apply")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write that spelling through safe_write. Requires --value.",
    )
    args = parser.parse_args(argv)
    if args.apply and args.value is None:
        parser.error("Choose a spelling with --value.")
    previous = library.MASTER
    try:
        library.MASTER = str(args.database)
        if args.value is None:
            result = clusters(args.database, args.space, args.field)
        elif args.apply:
            result = apply(args.space, args.field, args.value)
        else:
            result = preview(args.database, args.space, args.field, args.value)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    finally:
        library.MASTER = previous
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
