#!/usr/bin/env python3
"""Compare two crates: tracks in both, only in A, only in B (#113).

``compare`` opens the library with ``gig_check.open_read_only`` and reads each
crate's stored members in crate order. With ``subcrates`` a crate also counts
the crates nested under it. A track listed twice in one crate counts once.

A smart crate is compared by the members Serato last stored for it, which
can be out of date; ``smart`` marks that side so the page can say so.

``GET /api/crate-compare`` is that read. ``POST`` with ``action`` ``preview``
lists one set without writing. ``action`` ``create`` re-compares, then
``library.crate_action`` saves that set as a crate. An empty set does not
write. Audio files are not rewritten.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path

import gig_check
import library

INVALID = "That request is not valid."
SETS = ("both", "only_a", "only_b")
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


def _crate_id(value: object) -> int:
    """Return a crate id from a JSON body.

    Args:
        value: JSON number.

    Returns:
        A positive crate id.

    Raises:
        library.LibraryError: The value is a bool or is not a positive int (400).
    """
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise library.LibraryError(INVALID, 400)
    return value


def _set_key(value: object) -> str:
    """Return ``both``, ``only_a``, or ``only_b``.

    Args:
        value: JSON string.

    Returns:
        One of ``SETS``.

    Raises:
        library.LibraryError: The value is missing or unknown (400).
    """
    if not isinstance(value, str) or value not in SETS:
        raise library.LibraryError(INVALID, 400)
    return value


def _subcrates_flag(value: object) -> bool:
    """Return whether nested crates are included.

    Args:
        value: JSON boolean, or None when the field is omitted.

    Returns:
        False when omitted.

    Raises:
        library.LibraryError: The value is present and is not a bool (400).
    """
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    raise library.LibraryError(INVALID, 400)


def _default_name(set_key: str, crate_a: Mapping[str, object], crate_b: Mapping[str, object]) -> str:
    """Return the crate name for one set.

    Args:
        set_key: ``both``, ``only_a``, or ``only_b``.
        crate_a: Side A from ``compare``.
        crate_b: Side B from ``compare``.

    Returns:
        ``Both · {a} · {b}``, ``Only in {a}``, or ``Only in {b}``.
    """
    name_a = str(crate_a.get("name") or "")
    name_b = str(crate_b.get("name") or "")
    if set_key == "both":
        return f"Both · {name_a} · {name_b}"
    if set_key == "only_a":
        return f"Only in {name_a}"
    return f"Only in {name_b}"


def _label(
    name: object,
    set_key: str,
    crate_a: Mapping[str, object],
    crate_b: Mapping[str, object],
) -> str:
    """Return a crate name from the request, or the default.

    Args:
        name: Custom name, or None for the default.
        set_key: Which set is being saved.
        crate_a: Side A from ``compare``.
        crate_b: Side B from ``compare``.

    Returns:
        A stripped custom name, or the default when the name is missing
        or blank.

    Raises:
        library.LibraryError: The name is present and is not a string (400).
    """
    if name is None:
        return _default_name(set_key, crate_a, crate_b)
    if not isinstance(name, str):
        raise library.LibraryError(INVALID, 400)
    text = name.strip()
    return text or _default_name(set_key, crate_a, crate_b)


def _asset_ids(report: Mapping[str, object], set_key: str) -> list[int]:
    """Return asset ids for one set, in report order.

    Args:
        report: ``compare`` JSON.
        set_key: ``both``, ``only_a``, or ``only_b``.

    Returns:
        Track ids from that list. A missing or non-list set is empty.
    """
    rows = report.get(set_key)
    if not isinstance(rows, list):
        return []
    ids: list[int] = []
    for row in rows:
        if isinstance(row, dict) and row.get("id") is not None:
            ids.append(int(str(row["id"])))
    return ids


def _plan(
    report: Mapping[str, object],
    *,
    set_key: str,
    name: str,
    written: bool,
    preview: bool,
    saved: Mapping[str, object] | None = None,
) -> dict[str, object]:
    """Attach save fields to a compare report.

    Args:
        report: ``compare`` JSON.
        set_key: Which set this plan is for.
        name: Crate name that would be written.
        written: True after a crate was created.
        preview: True for a read-only POST.
        saved: ``crate_action`` result when a crate was created.

    Returns:
        The compare dict plus ``set``, ``name``, ``count``, ``preview``,
        and ``written``. A created crate also adds ``id`` and ``added``.
    """
    ids = _asset_ids(report, set_key)
    result = dict(report)
    result["set"] = set_key
    result["name"] = name
    result["count"] = len(ids)
    result["preview"] = preview
    result["written"] = written
    if saved is not None:
        crate_id = saved.get("id")
        if crate_id is not None:
            result["id"] = crate_id
        added = saved.get("added")
        if added is not None:
            result["added"] = added
        warning = saved.get("warning")
        if isinstance(warning, str) and warning:
            result["warning"] = warning
        if saved.get("name"):
            result["name"] = saved["name"]
    return result


def preview(
    database: Path,
    space: str,
    crate_a: int,
    crate_b: int,
    *,
    set_key: str,
    subcrates: bool = False,
    name: object = None,
) -> dict[str, object]:
    """List one set without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_a: First crate id.
        crate_b: Second crate id.
        set_key: ``both``, ``only_a``, or ``only_b``.
        subcrates: Include nested crates.
        name: Crate name, or None for the default.

    Returns:
        Compare JSON with ``preview`` true and ``written`` false.

    Raises:
        library.LibraryError: Same crate twice, unknown space, or a crate
            not in the space.
    """
    report = compare(database, space, crate_a, crate_b, subcrates=subcrates)
    crate_a_info = report["a"]
    crate_b_info = report["b"]
    if not isinstance(crate_a_info, dict) or not isinstance(crate_b_info, dict):
        raise library.LibraryError(INVALID, 400)
    label = _label(name, set_key, crate_a_info, crate_b_info)
    return _plan(report, set_key=set_key, name=label, written=False, preview=True)


def save(
    database: Path,
    space: str,
    crate_a: int,
    crate_b: int,
    *,
    set_key: str,
    subcrates: bool = False,
    name: object = None,
) -> dict[str, object]:
    """Save one set as a crate through ``crate_action``.

    Re-runs ``compare``, then creates a crate of those asset ids. Serato
    must be quit. An empty set does not write.

    Args:
        database: Unused; ``crate_action`` writes ``library.MASTER``.
        space: Space name.
        crate_a: First crate id.
        crate_b: Second crate id.
        set_key: ``both``, ``only_a``, or ``only_b``.
        subcrates: Include nested crates.
        name: Crate name, or None for the default.

    Returns:
        Compare JSON with ``written`` true and ``id`` when a crate was
        created, or ``written`` false when the set is empty.

    Raises:
        library.LibraryError: Same crate twice, unknown space, or a crate
            not in the space.
        library.SeratoOpen: Serato still has the library open.
    """
    del database
    report = compare(Path(library.MASTER), space, crate_a, crate_b, subcrates=subcrates)
    crate_a_info = report["a"]
    crate_b_info = report["b"]
    if not isinstance(crate_a_info, dict) or not isinstance(crate_b_info, dict):
        raise library.LibraryError(INVALID, 400)
    label = _label(name, set_key, crate_a_info, crate_b_info)
    ids = _asset_ids(report, set_key)
    if not ids:
        return _plan(report, set_key=set_key, name=label, written=False, preview=False)
    made = library.crate_action(
        {
            "action": "create",
            "space": space,
            "name": label,
            "assets": ids,
        }
    )
    return _plan(report, set_key=set_key, name=label, written=True, preview=False, saved=made)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/crate-compare`` request.

    Args:
        payload: ``action`` is ``preview`` or ``create``. Both take
            ``space``, ``a``, ``b``, ``set``, optional ``subcrates``,
            and optional ``name``.

    Returns:
        That action's result.

    Raises:
        library.LibraryError: If the action or its fields are invalid.
        library.SeratoOpen: If ``create`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    crate_a = _crate_id(payload.get("a"))
    crate_b = _crate_id(payload.get("b"))
    set_key = _set_key(payload.get("set"))
    subcrates = _subcrates_flag(payload.get("subcrates"))
    name = payload.get("name")
    database = Path(library.MASTER)
    if kind == "preview":
        return preview(
            database, space, crate_a, crate_b, set_key=set_key, subcrates=subcrates, name=name
        )
    if kind == "create":
        return save(
            database, space, crate_a, crate_b, set_key=set_key, subcrates=subcrates, name=name
        )
    raise library.LibraryError("That action is not available.")


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
