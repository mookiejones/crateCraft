"""Build a crate tree by BPM band, key, or genre (part 1 of #31).

A tree is one normal parent crate with a subcrate per band, key, or genre.
Each subcrate is a preset crate from ``smart_presets`` (its name ends in
``⟳``), so the page's refresh on open keeps every subcrate current. The
parent is a plain folder and is not refreshed itself.

Trees:

- ``bpm``: bands from ``low`` to ``high``, each ``width`` wide, starting
  every ``step``. A step smaller than the width makes overlapping bands
  (90-100, 95-105). A band holds BPMs from its low end up to, not
  including, its high end.
- ``key``: one subcrate per key that has tracks, in Camelot order 1A, 1B,
  2A, 2B, and so on.
- ``genre``: one subcrate per genre with at least ``min_tracks`` tracks,
  largest first, at most ``limit``. Spellings that differ only in case or
  spacing are one genre, named by the most common spelling.

Any tree can take ``crate`` to look only at that crate and its subcrates.
Empty subcrates are not made. ``preview`` only reads. ``create`` writes the
parent and every subcrate in one ``safe_write`` session, so it is refused
while Serato is running and checked after the commit.
"""

from __future__ import annotations

import sqlite3
import time
from collections import Counter
from collections.abc import Mapping
from contextlib import closing

import library
import smart_presets
from library import LibraryError

KINDS = ("bpm", "key", "genre")
MAX_BANDS = 60
MAX_WIDTH = 50.0
MAX_GENRES = 100
DEFAULT_NAMES = {"bpm": "BPM bands", "key": "Keys", "genre": "Genres"}
CAMELOT_ORDER = tuple(f"{number}{letter}" for number in range(1, 13) for letter in "AB")

# Fixed sentences. error_codes maps the same text to a stable code.
UNKNOWN_TREE = "That crate tree is not available."
BAD_BANDS = "Choose BPM bands between 1 and 400, 1 to 50 wide, starting no further apart than their width, and at most 60 bands."
BAD_GENRES = "Choose at least 1 track per genre and up to 100 genres."
EMPTY_TREE = "No tracks fit that crate tree."


def _positive(value: object, default: float) -> float | None:
    """Read a JSON number, or the default when it is missing.

    Args:
        value: Value from the request.
        default: Used when the value is None.

    Returns:
        The number, or None when it is not a finite number.
    """
    if value is None:
        return default
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if number == number and abs(number) != float("inf") else None


def normalize(tree: object) -> dict[str, object]:
    """Check a tree request and fill its defaults.

    Args:
        tree: JSON object with ``kind`` and that kind's fields, plus an
            optional ``crate`` id.

    Returns:
        A new dict holding only the fields the tree uses.

    Raises:
        LibraryError: If the kind is unknown or a field is out of range.

    Example:
        >>> normalize({"kind": "bpm"})
        {'kind': 'bpm', 'low': 80.0, 'high': 140.0, 'width': 10.0, 'step': 10.0}
    """
    if not isinstance(tree, Mapping) or tree.get("kind") not in KINDS:
        raise LibraryError(UNKNOWN_TREE)
    kind = str(tree["kind"])
    clean: dict[str, object] = {"kind": kind}
    if kind == "bpm":
        low = _positive(tree.get("low"), 80.0)
        high = _positive(tree.get("high"), 140.0)
        width = _positive(tree.get("width"), 10.0)
        step = _positive(tree.get("step"), width if width is not None else 10.0)
        if (
            low is None or high is None or width is None or step is None
            or low < 1 or high > smart_presets.MAX_BPM or high <= low
            or not 1 <= width <= MAX_WIDTH or not 1 <= step <= width
            or len(_bands(low, high, width, step)) > MAX_BANDS
        ):
            raise LibraryError(BAD_BANDS)
        clean.update({"low": low, "high": high, "width": width, "step": step})
    elif kind == "genre":
        minimum = tree.get("min_tracks", 2)
        limit = tree.get("limit", 40)
        if (
            isinstance(minimum, bool) or not isinstance(minimum, int) or minimum < 1
            or isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= MAX_GENRES
        ):
            raise LibraryError(BAD_GENRES)
        clean.update({"min_tracks": minimum, "limit": limit})
    crate = tree.get("crate")
    if crate is not None:
        if isinstance(crate, bool) or not isinstance(crate, int):
            raise LibraryError("That crate is not in this space.")
        clean["crate"] = crate
    return clean


def _bands(low: float, high: float, width: float, step: float) -> list[tuple[float, float]]:
    """List the BPM bands of a tree.

    Args:
        low: Low end of the first band.
        high: No band starts at or above this.
        width: Band width.
        step: Distance between band starts.

    Returns:
        ``(low, high)`` pairs. Stops after one more than ``MAX_BANDS`` so a
        tiny step cannot build a huge list.

    Example:
        >>> _bands(90, 110, 10, 5)
        [(90, 100), (95, 105), (100, 110), (105, 115)]
    """
    bands: list[tuple[float, float]] = []
    start = low
    while start < high - 1e-9 and len(bands) <= MAX_BANDS:
        bands.append((start, start + width))
        start += step
    return bands


def _scope_ids(conn: sqlite3.Connection, crate_id: int) -> set[int]:
    """List the tracks in one crate and the crates nested under it.

    Args:
        conn: Open connection.
        crate_id: Container id.

    Returns:
        Asset ids.
    """
    ids = library.descendant_ids(conn, crate_id)
    marks = ",".join("?" * len(ids))
    return {
        int(row[0])
        for row in conn.execute(
            f"""
            SELECT ca.asset_id FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            WHERE lc.container_id IN ({marks})
            """,
            ids,
        )
    }


def _genres(
    conn: sqlite3.Connection,
    space: str,
    scope: object,
    minimum: int,
    limit: int,
) -> list[str]:
    """Pick the genres a genre tree gets subcrates for.

    Args:
        conn: Open connection.
        space: Space name.
        scope: Crate id that limits the tracks, or None.
        minimum: Fewest tracks a genre needs.
        limit: Most genres to return.

    Returns:
        Display spellings, largest genre first, then by name.
    """
    rows = conn.execute(
        """
        SELECT a.id, a.genre FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        """,
        (space,),
    ).fetchall()
    allowed = _scope_ids(conn, int(scope)) if scope is not None else None  # type: ignore[arg-type]
    spellings: dict[str, Counter[str]] = {}
    for asset_id, genre in rows:
        if allowed is not None and int(asset_id) not in allowed:
            continue
        if not isinstance(genre, str):
            continue
        key = smart_presets.genre_key(genre)
        if not key:
            continue
        spellings.setdefault(key, Counter())[" ".join(genre.split())] += 1
    groups = [
        (sum(counter.values()), min(counter.items(), key=lambda item: (-item[1], item[0]))[0])
        for counter in spellings.values()
    ]
    groups = [group for group in groups if group[0] >= minimum]
    groups.sort(key=lambda group: (-group[0], group[1].casefold()))
    return [name for _, name in groups[:limit]]


def _children(conn: sqlite3.Connection, space: str, tree: Mapping[str, object]) -> list[dict[str, object]]:
    """Work out every non-empty subcrate of a tree.

    Args:
        conn: Open connection. Only SELECT statements run.
        space: Space name.
        tree: A tree from :func:`normalize`.

    Returns:
        ``{"name", "preset", "ids"}`` per subcrate, in tree order.

    Raises:
        LibraryError: If the scope crate is not in the space.
    """
    scope = tree.get("crate")
    if scope is not None:
        library.container_in_space(conn, int(scope), space)  # type: ignore[arg-type]
    extra = {"crate": scope} if scope is not None else {}
    kind = tree["kind"]
    presets: list[dict[str, object]] = []
    if kind == "bpm":
        for low, high in _bands(
            float(tree["low"]), float(tree["high"]), float(tree["width"]), float(tree["step"])  # type: ignore[arg-type]
        ):
            presets.append({"kind": "bpm_band", "low": low, "high": high, **extra})
    elif kind == "key":
        presets = [{"kind": "key", "key": key, **extra} for key in CAMELOT_ORDER]
    else:
        names = _genres(conn, space, scope, int(tree["min_tracks"]), int(tree["limit"]))  # type: ignore[arg-type]
        presets = [{"kind": "genre", "genre": name, **extra} for name in names]
    children: list[dict[str, object]] = []
    for raw in presets:
        preset = smart_presets.normalize(raw)
        ids = smart_presets.matching_ids(conn, space, preset)
        if ids:
            children.append({"name": smart_presets.default_name(preset), "preset": preset, "ids": ids})
    return children


def preview(space: str, tree: object) -> dict[str, object]:
    """List the subcrates a tree would make, without writing.

    Args:
        space: Space name.
        tree: Tree JSON.

    Returns:
        ``tree`` (normalized), ``name`` (the default parent name), and
        ``children`` with ``name`` and ``count`` each.

    Raises:
        LibraryError: If the tree is invalid or the library is missing.
    """
    clean = normalize(tree)
    with closing(library.read_conn()) as conn:
        children = _children(conn, space, clean)
    return {
        "ok": True,
        "tree": clean,
        "name": DEFAULT_NAMES[str(clean["kind"])],
        "children": [{"name": child["name"], "count": len(child["ids"])} for child in children],  # type: ignore[arg-type]
    }


def create(space: str, tree: object, parent: int | None = None, name: str = "") -> dict[str, object]:
    """Make the parent crate and every non-empty subcrate, and remember each subcrate's preset.

    Args:
        space: Space name.
        tree: Tree JSON.
        parent: Crate to put the tree inside, or None for the top level.
        name: Parent crate name. Empty uses ``BPM bands``, ``Keys``, or ``Genres``.

    Returns:
        ``id`` and ``name`` of the parent, ``children`` with ``id``,
        ``name``, and ``count`` each, and ``warning``.

    Raises:
        LibraryError: If the tree is invalid, no tracks fit, or the write is refused.
        SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    clean = normalize(tree)
    label = (name or "").strip() or DEFAULT_NAMES[str(clean["kind"])]

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Create the parent and the subcrates, add the tracks, and register the checks.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict.

        Raises:
            LibraryError: If no tracks fit the tree.
        """
        children = _children(conn, space, clean)
        if not children:
            raise LibraryError(EMPTY_TREE)
        top = library._create_crate(conn, space, parent, label, False, None)
        top_id = top["id"]
        if not isinstance(top_id, int):
            raise LibraryError("The crate could not be created.")
        if isinstance(top.get("name"), str):
            write.set_target(str(top["name"]))
        warning = top.get("warning")
        made: list[dict[str, object]] = []
        for child in children:
            created = library._create_crate(conn, space, top_id, str(child["name"]), False, None)
            child_id = created["id"]
            if not isinstance(child_id, int):
                raise LibraryError("The crate could not be created.")
            ids: list[int] = child["ids"]  # type: ignore[assignment]
            for asset_id in ids:
                warning = library._membership(conn, child_id, asset_id, space, True).get("warning") or warning
            warning = created.get("warning") or warning
            smart_presets._expect_members(write, child_id, tuple(ids))
            made.append({"id": child_id, "name": created["name"], "count": len(ids), "preset": child["preset"]})
        return {"ok": True, "id": top_id, "name": top["name"], "children": made, "warning": warning}

    result = safe_write.run("crate_tree_create", label, apply)
    updated = int(time.time())
    children: list[dict[str, object]] = result["children"]  # type: ignore[assignment]
    for child in children:
        child_id = int(child["id"])  # type: ignore[arg-type]
        found = smart_presets._identity(child_id) or {}
        smart_presets._remember(
            child_id,
            {"space": space, "preset": child.pop("preset"), "updated": updated, "time_added": found.get("time_added")},
        )
    return result


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/crate-tree`` request.

    Args:
        payload: ``action`` is ``preview`` or ``create``. Both take ``space``
            and ``tree``. ``create`` also takes ``parent`` and ``name``.

    Returns:
        That action's result.

    Raises:
        LibraryError: If the action or its fields are invalid.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    if kind == "preview":
        return preview(space, payload.get("tree"))
    if kind == "create":
        parent = payload.get("parent")
        if parent is not None and (isinstance(parent, bool) or not isinstance(parent, int)):
            raise LibraryError("That crate is not in this space.")
        name = payload.get("name") or ""
        if not isinstance(name, str):
            raise LibraryError("That request is not valid.")
        return create(space, payload.get("tree"), parent, name)
    raise LibraryError("That action is not available.")
