#!/usr/bin/env python3
"""Compare two crates: tracks in both, only in A, only in B (#113, part 1).

``compare`` opens the library with ``gig_check.open_read_only`` and reads each
crate's stored members in crate order. With ``subcrates`` a crate also counts
the crates nested under it. A track listed twice in one crate counts once.

A smart crate is compared by the members Serato last stored for it, which
can be out of date; ``smart`` marks that side so the page can say so.

Nothing is written. Saving a result as a new crate, through the same write
guards as any crate edit, is a later change.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections.abc import Sequence
from pathlib import Path

import gig_check
import library

INVALID = "That request is not valid."
SMART_TYPE = 2


def _members(conn: sqlite3.Connection, crate_ids: list[int]) -> list[int]:
    """Return the asset ids in these crates, in crate order, each once.

    A live Serato library links ``container_asset`` through
    ``location_container``. The test schema also stores ``container_id`` on
    the membership row. Both are read. Crates come in ``crate_ids`` order,
    and tracks inside a crate by ``list_order``.
    """
    marks = ",".join("?" for _ in crate_ids)
    columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(container_asset)")}
    found: list[tuple[int, int, int, int]] = []
    if "location_container_id" in columns:
        query = (
            "SELECT lc.container_id, ca.list_order, ca.id, ca.asset_id FROM container_asset ca "
            f"JOIN location_container lc ON lc.id = ca.location_container_id WHERE lc.container_id IN ({marks})"
        )
        found.extend((int(r[0]), int(r[1] or 0), int(r[2]), int(r[3])) for r in conn.execute(query, crate_ids) if r[3] is not None)
    if "container_id" in columns:
        query = f"SELECT container_id, list_order, id, asset_id FROM container_asset WHERE container_id IN ({marks})"
        found.extend((int(r[0]), int(r[1] or 0), int(r[2]), int(r[3])) for r in conn.execute(query, crate_ids) if r[3] is not None)
    rank = {crate_id: index for index, crate_id in enumerate(crate_ids)}
    found.sort(key=lambda item: (rank[item[0]], item[1], item[2]))
    ordered: list[int] = []
    seen: set[int] = set()
    for _crate, _order, _row, asset in found:
        if asset not in seen:
            seen.add(asset)
            ordered.append(asset)
    return ordered


def _side(conn: sqlite3.Connection, space: str, crate_id: int, subcrates: bool) -> tuple[dict[str, object], list[int]]:
    """Describe one crate and list its members."""
    row = library.container_in_space(conn, crate_id, space)
    crate_ids = library.descendant_ids(conn, crate_id) if subcrates else [crate_id]
    members = _members(conn, crate_ids)
    info: dict[str, object] = {
        "id": crate_id,
        "name": library.display_name(str(row["name"] or "")),
        "smart": row["type"] == SMART_TYPE,
        "tracks": len(members),
    }
    return info, members


def compare(database: Path, space: str, crate_a: int, crate_b: int, *, subcrates: bool = False) -> dict[str, object]:
    """Compare two crates in one space.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        crate_a: First crate id.
        crate_b: Second crate id. It must differ from ``crate_a``.
        subcrates: Include the crates nested under each one.

    Returns:
        ``a`` and ``b`` (``id``, ``name``, ``smart``, ``tracks``),
        ``subcrates``, and ``both``, ``only_a``, ``only_b``: track rows
        ``{ id, name, artist }``. ``both`` and ``only_a`` follow A's order and
        ``only_b`` follows B's.

    Raises:
        library.LibraryError: The same crate twice (400), an unknown space, a
            crate not in the space (404), or a database that cannot be
            opened read-only.
    """
    if crate_a == crate_b:
        raise library.LibraryError(INVALID, 400)
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        info_a, members_a = _side(conn, space, crate_a, subcrates)
        info_b, members_b = _side(conn, space, crate_b, subcrates)
        wanted = sorted(set(members_a) | set(members_b))
        names: dict[int, dict[str, object]] = {}
        if wanted:
            marks = ",".join("?" for _ in wanted)
            for row in conn.execute(f"SELECT id, name, artist FROM asset WHERE id IN ({marks})", wanted):
                asset = int(row["id"])
                names[asset] = {"id": asset, "name": str(row["name"] or ""), "artist": str(row["artist"] or "")}
    finally:
        conn.close()

    def rows(ids: list[int]) -> list[dict[str, object]]:
        return [dict(names.get(asset, {"id": asset, "name": "", "artist": ""})) for asset in ids]

    in_a = set(members_a)
    in_b = set(members_b)
    return {
        "a": info_a,
        "b": info_b,
        "subcrates": subcrates,
        "both": rows([asset for asset in members_a if asset in in_b]),
        "only_a": rows([asset for asset in members_a if asset not in in_b]),
        "only_b": rows([asset for asset in members_b if asset not in in_a]),
    }


def main(argv: Sequence[str] | None = None) -> int:
    """Print the comparison as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the comparison was printed, 1 when it could not be made.
    """
    parser = argparse.ArgumentParser(description="Compare two crates. Read-only.")
    parser.add_argument("a", type=int)
    parser.add_argument("b", type=int)
    parser.add_argument("--subcrates", action="store_true")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        result = compare(args.database, args.space, args.a, args.b, subcrates=args.subcrates)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
