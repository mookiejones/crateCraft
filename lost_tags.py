#!/usr/bin/env python3
"""Find titles and artists Serato's database lost, and fill the blanks (#73).

Some tracks show a blank title or artist in Serato even though the audio
file still carries them. ``plan`` reads the library with
``gig_check.open_read_only`` and, for each track in the space whose title
or artist is blank, reads the file's own tags with ``tags.read_text_tags``.
A fix is proposed only for a field that is blank in the database and set in
the file. A field that already has a value is never proposed, even when the
file says something else. A track whose file is missing is skipped.

``apply`` writes those blanks through ``safe_write`` with Serato closed.
It re-plans on the write connection so a field that gained a value is
never overwritten. An empty plan does not write. Audio files are not
rewritten.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path

import gig_check
import library
import tags

FIELDS = (("name", "title"), ("artist", "artist"))

Plan = dict[str, object]


def _text(value: object) -> str:
    """Return a stripped string, or an empty one."""
    return value.strip() if isinstance(value, str) else ""


def _parse_ids(raw: object) -> list[int] | None:
    """Return unique asset ids, or None when the request names every fix.

    Args:
        raw: Request ``ids``. Missing or null means every proposed fix.
            An empty list means write nothing.

    Returns:
        Deduplicated ids in first-seen order, or None for every fix.

    Raises:
        library.LibraryError: The value is present and is not a list of
            whole numbers (400).
    """
    if raw is None:
        return None
    if not isinstance(raw, list):
        raise library.LibraryError("That request is not valid.", 400)
    unique: list[int] = []
    seen: set[int] = set()
    for item in raw:
        if isinstance(item, bool) or not isinstance(item, int):
            raise library.LibraryError("That request is not valid.", 400)
        if item in seen:
            continue
        seen.add(item)
        unique.append(item)
    return unique


def _filter_ids(fixes: Sequence[Mapping[str, object]], ids: list[int] | None) -> list[dict[str, object]]:
    """Keep proposed fixes whose asset id is requested.

    Args:
        fixes: Plan rows.
        ids: Requested asset ids, or None for every row.

    Returns:
        Matching rows, order preserved.
    """
    if ids is None:
        return [dict(item) for item in fixes]
    wanted = set(ids)
    return [dict(item) for item in fixes if int(item["asset_id"]) in wanted]


def _fixes(conn: sqlite3.Connection, space: str) -> tuple[int, int, list[dict[str, object]]]:
    """List blank title or artist fields the file can fill.

    Args:
        conn: Open library connection with named columns.
        space: Space name, such as ``Serato Library``.

    Returns:
        ``checked`` (tracks with a blank field), ``unreadable`` (of those,
        how many had no readable file), and ``fixes``.
    """
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
            fixes.append(
                {
                    "asset_id": int(row["id"]),
                    "path": resolved,
                    "current": current,
                    "proposed": proposed,
                }
            )
    return len(rows), unreadable, fixes


def plan(database: Path, space: str) -> Plan:
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
        checked, unreadable, fixes = _fixes(conn, space)
    finally:
        conn.close()
    return {"checked": checked, "unreadable": unreadable, "fixes": fixes}


def preview(database: Path, space: str, ids: list[int] | None = None) -> Plan:
    """Return the plan without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        ids: Asset ids to keep, or None for every proposed fix.

    Returns:
        Plan JSON with ``written`` false and ``preview`` true.

    Raises:
        library.LibraryError: The space is unknown, or the database is
            missing or cannot be opened read-only.
    """
    result = plan(database, space)
    result["fixes"] = _filter_ids(result["fixes"], ids)  # type: ignore[arg-type]
    result["written"] = False
    result["preview"] = True
    return result


def apply(space: str, ids: list[int] | None = None) -> Plan:
    """Fill still-blank title and artist fields through ``safe_write``.

    Args:
        space: Space name.
        ids: Asset ids to write, or None for every proposed fix. An empty
            list writes nothing.

    Returns:
        Plan JSON. ``written`` is false when nothing still needs a fill.

    Raises:
        library.LibraryError: The space is unknown.
        library.SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    database = Path(library.MASTER)
    if ids is not None and not ids:
        result = plan(database, space)
        result["fixes"] = []
        result["written"] = False
        return result
    planned = plan(database, space)
    selected = _filter_ids(planned["fixes"], ids)  # type: ignore[arg-type]
    if not selected:
        planned["fixes"] = selected
        planned["written"] = False
        return planned

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> Plan:
        """Rewrite still-blank name and artist, then register the check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict. ``written`` is false when the live plan is empty.
        """
        checked, unreadable, live = _fixes(conn, space)
        live = _filter_ids(live, ids)
        if not live:
            return {
                "checked": checked,
                "unreadable": unreadable,
                "fixes": [],
                "written": False,
            }
        write.set_target("lost_tags")
        now = int(time.time())
        expected: dict[int, dict[str, str]] = {}
        for item in live:
            proposed = dict(item["proposed"])  # type: ignore[arg-type,call-overload]
            values: dict[str, object] = dict(proposed)
            values["time_modified"] = now
            library._assign(  # pyright: ignore[reportPrivateUsage]
                conn,
                "asset",
                values,
                "id = ?",
                item["asset_id"],
            )
            expected[int(item["asset_id"])] = proposed

        def check(
            copied: sqlite3.Connection,
            expected: dict[int, dict[str, str]] = expected,
        ) -> None:
            """Fail when a rewritten row does not hold the proposed fields.

            Args:
                copied: Read-only connection to the temporary database copy.
                expected: Asset id to proposed columns.

            Raises:
                VerifyMismatch: If a row is missing or different.
            """
            if not expected:
                return
            asset_ids = tuple(expected)
            placeholders = ",".join("?" * len(asset_ids))
            sql = f"SELECT id, name, artist FROM asset WHERE id IN ({placeholders})"
            rows = copied.execute(sql, asset_ids).fetchall()
            got = {int(row[0]): row for row in rows}
            for asset_id, proposed in expected.items():
                have = got.get(asset_id)
                if have is None:
                    raise safe_write.VerifyMismatch("The track fields do not match.")
                have_name = _text(have[1])
                have_artist = _text(have[2])
                if "name" in proposed and have_name != proposed["name"]:
                    raise safe_write.VerifyMismatch("The track fields do not match.")
                if "artist" in proposed and have_artist != proposed["artist"]:
                    raise safe_write.VerifyMismatch("The track fields do not match.")

        write.check(check)
        return {
            "checked": checked,
            "unreadable": unreadable,
            "fixes": live,
            "written": True,
        }

    result = safe_write.run("lost_tags", "lost_tags", run)
    if result.get("written"):
        with closing(library.read_conn()) as master:
            for item in result["fixes"]:
                library._mirror_asset(  # pyright: ignore[reportPrivateUsage]
                    master, int(item["asset_id"]), item["proposed"]
                )
    return result


def action(payload: Mapping[str, object]) -> Plan:
    """Run one ``POST /api/lost-tags`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. Takes ``space``.
            Optional ``ids`` is a list of asset ids. Missing or null ids
            means every proposed fix. An empty list writes nothing.

    Returns:
        That action's result.

    Raises:
        library.LibraryError: If the action or its fields are invalid.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    ids = _parse_ids(payload.get("ids"))
    if kind == "preview":
        return preview(Path(library.MASTER), space, ids)
    if kind == "apply":
        return apply(space, ids)
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the plan as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the plan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="List titles and artists the database lost. Read-only."
    )
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
