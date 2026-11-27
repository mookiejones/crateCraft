#!/usr/bin/env python3
"""Local-only crate mirrors: drop streaming tracks into a generated crate (#116).

Preview is read-only. Create writes one normal crate under
``_crateCraft generated`` / ``Local copies`` through one ``safe_write``
session. The original crate is not edited. A crate that is already local,
all streaming, or already inside the generated folder is not written.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Mapping, Sequence
from pathlib import Path

import gig_check
import library
import relink
import streaming_swap
import tonight_crates
import unplayable
from library import LibraryError

GENERATED_FOLDER = tonight_crates.GENERATED_FOLDER
LOCAL_FOLDER = "Local copies"
LOCAL_SAMPLE = 25
STREAM_SAMPLE = 8
INVALID = "That request is not valid."
_IDENTITY = ("portable_id", "uri", "file_name", "type", "type_specific_data")
_ASSET_FIELDS = (
    "id",
    "name",
    "artist",
    "length_ms",
    "portable_id",
    "is_missing",
    "third_party_type",
    "file_name",
    "type",
    "type_specific_data",
    "uri",
)


def _field(row: sqlite3.Row | Mapping[str, object], name: str) -> object:
    """Return one column from a Row or a mapping.

    Args:
        row: Asset row. A missing key is None.
        name: Column name.

    Returns:
        The stored value, or None when the column is absent.
    """
    if isinstance(row, sqlite3.Row):
        if name not in row.keys():
            return None
        return row[name]
    return row.get(name)


def service_of(row: sqlite3.Row | Mapping[str, object]) -> str | None:
    """Return the streaming service for one asset, or None when it is local.

    Apple Music is ``third_party_type`` 6, even when a file exists. A bool
    is not that marker, and the string ``"6"`` is not either. Beatport and
    Beatsource come from the identity fields ``streaming_swap`` already
    uses. A path that opens as a local file stays local. An audio file name
    is not a marker, and ``type_specific_data`` is ignored for that file
    so a missing local track is not a stream because a blob mentions the word.

    Args:
        row: Asset row or dict with the identity columns.

    Returns:
        ``Apple Music``, ``Beatport``, ``Beatsource``, or None.
    """
    third = _field(row, "third_party_type")
    marker = third if isinstance(third, (bool, int)) else None
    if unplayable._is_streaming(marker):
        return "Apple Music"
    stored = streaming_swap._text(_field(row, "portable_id"))
    suffix = ""
    if stored:
        suffix = Path(stored.replace("\\", "/").split("/")[-1]).suffix.casefold()
    audio_path = (
        bool(stored)
        and streaming_swap.service_marker(stored) is None
        and suffix in relink.AUDIO_SUFFIXES
    )
    for name in _IDENTITY:
        if audio_path and name == "type_specific_data":
            continue
        found = streaming_swap.service_marker(_field(row, name))
        if found:
            if streaming_swap._opens(stored):
                return None
            return found
    return None


def track_label(row: sqlite3.Row | Mapping[str, object]) -> str:
    """Return ``Artist - Title`` for an export comment.

    Args:
        row: Asset row.

    Returns:
        The artist and title, or the title alone. A blank title is Untitled.
    """
    artist = streaming_swap._text(_field(row, "artist"))
    name = streaming_swap._text(_field(row, "name")) or "Untitled"
    if artist:
        return f"{artist} - {name}"
    return name


def m3u_omit_line(row: sqlite3.Row | Mapping[str, object], service: str) -> str:
    """Return the M3U comment for one streaming track that was left out.

    Args:
        row: Asset row.
        service: Service name from ``service_of``.

    Returns:
        A comment line, without a trailing newline.
    """
    return f"# omitted, streaming ({service}): {track_label(row)}"


def asset_columns(conn: sqlite3.Connection) -> str:
    """Return a SELECT list of export columns, NULL when a column is absent.

    Args:
        conn: Open connection. ``PRAGMA table_info(asset)`` decides the columns.

    Returns:
        ``a.id, a.name, ...`` with ``NULL AS uri`` when ``uri`` is missing.
    """
    present = {str(row[1]) for row in conn.execute("PRAGMA table_info(asset)")}
    parts: list[str] = []
    for name in _ASSET_FIELDS:
        if name in present:
            parts.append(f"a.{name}")
        else:
            parts.append(f"NULL AS {name}")
    return ", ".join(parts)


def omit_streaming(
    tracks: Sequence[Mapping[str, object]],
    membership: Mapping[int, Sequence[int]],
) -> tuple[list[Mapping[str, object]], dict[int, list[int]], list[str]]:
    """Drop streaming tracks from an export list and from every crate.

    Args:
        tracks: Asset rows already limited to this export.
        membership: Crate id to asset ids, in playlist order.

    Returns:
        Kept tracks, membership with those ids removed, and the display
        names of the streaming tracks in track-list order.
    """
    blocked: set[int] = set()
    names: list[str] = []
    kept: list[Mapping[str, object]] = []
    for row in tracks:
        service = service_of(row)
        asset_id = int(row["id"])  # type: ignore[arg-type]
        if service:
            blocked.add(asset_id)
            names.append(track_label(row))
            continue
        kept.append(row)
    cleaned = {
        int(crate_id): [int(asset_id) for asset_id in asset_ids if int(asset_id) not in blocked]
        for crate_id, asset_ids in membership.items()
    }
    return kept, cleaned, names


def _require_crate(raw: object) -> int:
    """Return a positive crate id.

    Args:
        raw: JSON crate id. A bool is rejected.

    Returns:
        The crate id.

    Raises:
        LibraryError: Not a positive int (400).
    """
    if isinstance(raw, bool) or not isinstance(raw, int) or raw <= 0:
        raise LibraryError(INVALID, 400)
    return raw


def _require_space(space: object) -> str:
    """Return an allowed space name.

    Args:
        space: Space name.

    Returns:
        The same string.

    Raises:
        LibraryError: Missing or unknown space.
    """
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    return space


def _child_name(display: str) -> str:
    """Return the mirror crate name for one source crate."""
    return f"{display} local"


def _under_generated(conn: sqlite3.Connection, crate_id: int) -> bool:
    """Return whether this crate or an ancestor is the generated folder.

    Args:
        conn: Open connection with a row factory.
        crate_id: Container id.

    Returns:
        True when a display name on the walk is ``_crateCraft generated``.
    """
    current: int | None = crate_id
    seen: set[int] = set()
    while current is not None and current not in seen:
        seen.add(current)
        row = conn.execute(
            "SELECT parent_id, name FROM container WHERE id = ?",
            (current,),
        ).fetchone()
        if row is None:
            return False
        stored = row["name"] if isinstance(row["name"], str) else ""
        if library.display_name(stored) == GENERATED_FOLDER:
            return True
        parent = row["parent_id"]
        current = int(parent) if parent is not None else None
    return False


def _members(conn: sqlite3.Connection, crate_id: int) -> list[sqlite3.Row]:
    """Return crate members in list order, with the columns ``service_of`` needs.

    Args:
        conn: Open connection.
        crate_id: Container id.

    Returns:
        Asset rows. A crate with no location link yields an empty list.
    """
    columns = asset_columns(conn)
    return list(
        conn.execute(
            f"""
            SELECT {columns}
            FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            JOIN asset a ON a.id = ca.asset_id
            WHERE lc.container_id = ?
            ORDER BY ca.list_order, ca.id
            """,
            (crate_id,),
        )
    )


def _existing(conn: sqlite3.Connection, space: str, child: str) -> dict[str, object] | None:
    """Return the mirror crate already under Local copies, if one exists.

    Args:
        conn: Open connection.
        space: Space name.
        child: Mirror display name.

    Returns:
        ``id`` and ``name``, or None. Lookup is type 1 only.
    """
    root_id = library._space_root(conn, space)
    generated = library._find_child(conn, root_id, GENERATED_FOLDER, 1)
    if generated is None:
        return None
    parent = library._find_child(conn, int(generated), LOCAL_FOLDER, 1)
    if parent is None:
        return None
    found = library._find_child(conn, int(parent), child, 1)
    if found is None:
        return None
    return {"id": int(found), "name": child}


def _sample(row: sqlite3.Row, service: str | None) -> dict[str, object]:
    """Return one preview row.

    Args:
        row: Asset row.
        service: Streaming service, or None for a local track.

    Returns:
        id, name, and artist. Streaming rows also include service.
    """
    item: dict[str, object] = {
        "id": int(row["id"]),
        "name": streaming_swap._text(row["name"]),
        "artist": streaming_swap._text(row["artist"]),
    }
    if service:
        item["service"] = service
    return item


def _plan(conn: sqlite3.Connection, space: str, crate_id: int) -> dict[str, object]:
    """Classify one crate. Does not write.

    Args:
        conn: Open connection.
        space: Space name.
        crate_id: Source crate id.

    Returns:
        The public plan plus ``_local_ids`` for the write path.

    Raises:
        LibraryError: If the crate is not in the space (404).
    """
    crate = library._container(conn, crate_id, space)
    display = library.display_name(str(crate["name"]))
    child = _child_name(display)
    local_rows: list[sqlite3.Row] = []
    stream_rows: list[tuple[sqlite3.Row, str]] = []
    for row in _members(conn, crate_id):
        service = service_of(row)
        if service:
            stream_rows.append((row, service))
        else:
            local_rows.append(row)
    local_count = len(local_rows)
    streaming_count = len(stream_rows)
    if _under_generated(conn, crate_id):
        reason: str | None = "generated"
    elif streaming_count == 0:
        reason = "already_local"
    elif local_count == 0:
        reason = "all_streaming"
    else:
        reason = None
    return {
        "crate": crate_id,
        "crate_name": display,
        "folder": GENERATED_FOLDER,
        "parent": LOCAL_FOLDER,
        "name": child,
        "local_count": local_count,
        "streaming_count": streaming_count,
        "sample": [_sample(row, None) for row in local_rows[:LOCAL_SAMPLE]],
        "streaming": [_sample(row, service) for row, service in stream_rows[:STREAM_SAMPLE]],
        "written": False,
        "existing": _existing(conn, space, child),
        "reason": reason,
        "count": local_count,
        "_local_ids": [int(row["id"]) for row in local_rows],
    }


def _public(plan: dict[str, object], *, preview: bool) -> dict[str, object]:
    """Copy a plan for the caller, without the internal id list."""
    result = dict(plan)
    result.pop("_local_ids", None)
    result["preview"] = preview
    result["written"] = False
    return result


def preview(database: Path, space: str, crate_id: int) -> dict[str, object]:
    """List the local mirror a create would write. Does not write.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Source crate id.

    Returns:
        The plan with ``preview`` true and ``written`` false.

    Raises:
        LibraryError: Bad space, bad crate id, or a crate not in the space.
    """
    checked = _require_space(space)
    crate = _require_crate(crate_id)
    conn = gig_check.open_read_only(database)
    try:
        plan = _plan(conn, checked, crate)
    finally:
        conn.close()
    return _public(plan, preview=True)


def _expect_gone(write: object, crate_id: int) -> None:
    """Register a check that a deleted crate id is absent after commit."""
    import safe_write

    def check(copied: sqlite3.Connection, crate_id: int = crate_id) -> None:
        row = copied.execute("SELECT COUNT(*) FROM container WHERE id = ?", (crate_id,)).fetchone()
        if row is None or int(row[0]) != 0:
            raise safe_write.VerifyMismatch("The crate is still in the library.")

    write.check(check)  # type: ignore[attr-defined]


def _expect_named(write: object, crate_id: int, wanted: str) -> None:
    """Register a check that a crate displays as ``wanted``."""
    import safe_write

    def check(copied: sqlite3.Connection, crate_id: int = crate_id, wanted: str = wanted) -> None:
        row = copied.execute("SELECT name FROM container WHERE id = ?", (crate_id,)).fetchone()
        if row is None or library.display_name(str(row[0])) != wanted:
            raise safe_write.VerifyMismatch("The crate name does not match.")

    write.check(check)  # type: ignore[attr-defined]


def _ensure_child(
    conn: sqlite3.Connection,
    write: object,
    space: str,
    parent_id: int,
    name: str,
) -> tuple[int, object]:
    """Return a type-1 child, creating it when it is missing.

    Args:
        conn: Open write connection.
        write: ``safe_write`` session.
        space: Space name.
        parent_id: Parent container id.
        name: Display name.

    Returns:
        The container id and any warning from create.
    """
    found = library._find_child(conn, parent_id, name, 1)
    if found is not None:
        return int(found), None
    made = library._create_crate(conn, space, parent_id, name, False, None)
    crate_id = made["id"]
    if not isinstance(crate_id, int):
        raise LibraryError("The crate could not be created.")
    _expect_named(write, crate_id, name)
    return crate_id, made.get("warning")


def create(database: Path, space: str, crate_id: int) -> dict[str, object]:
    """Write the local mirror through ``safe_write``.

    The write uses ``library.MASTER``. ``database`` is accepted so callers
    match ``preview``. A reason on the plan does not write. Inside the
    session the plan is read again and a reason rolls the session back.

    Args:
        database: Unused for the write. Kept so callers match ``preview``.
        space: Space name.
        crate_id: Source crate id.

    Returns:
        ``written`` true with the new crate id when a mirror was saved.
        ``written`` false when the crate is already local, all streaming,
        or already generated.

    Raises:
        LibraryError: Bad values, a crate not in the space, or a refused write.
        library.SeratoOpen: Serato still holds the library.
    """
    import safe_write
    import smart_presets

    del database
    checked = _require_space(space)
    crate = _require_crate(crate_id)
    draft = preview(Path(library.MASTER), checked, crate)
    if draft["reason"]:
        draft["preview"] = False
        return draft

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Create the generated folders and replace only this mirror."""
        fresh = _plan(conn, checked, crate)
        if fresh["reason"]:
            raise LibraryError(INVALID, 400)
        raw_ids = fresh["_local_ids"]
        if not isinstance(raw_ids, list):
            raise LibraryError(INVALID, 400)
        ids = [int(asset_id) for asset_id in raw_ids]
        child = str(fresh["name"])
        root_id = library._space_root(conn, checked)
        generated_id, warning = _ensure_child(conn, write, checked, root_id, GENERATED_FOLDER)
        parent_id, parent_warning = _ensure_child(conn, write, checked, generated_id, LOCAL_FOLDER)
        warning = parent_warning or warning
        replaced: dict[str, object] | None = None
        old = library._find_child(conn, parent_id, child, 1)
        old_id = int(old) if old is not None else None
        if old_id is not None:
            replaced = {"id": old_id, "name": child}
            library._delete_crate(conn, checked, old_id)
        made = library._create_crate(conn, checked, parent_id, child, False, None)
        mirror_id = made["id"]
        if not isinstance(mirror_id, int):
            raise LibraryError("The crate could not be created.")
        # SQLite can reuse the deleted leaf rowid. That row is the new crate.
        if old_id is not None and old_id != mirror_id:
            _expect_gone(write, old_id)
        write.set_target(child)
        _expect_named(write, mirror_id, child)
        warning = made.get("warning") or warning
        for asset_id in ids:
            warning = library._membership(conn, mirror_id, asset_id, checked, True).get("warning") or warning
        smart_presets._expect_members(write, mirror_id, tuple(ids))
        result = _public(fresh, preview=False)
        result.update(
            {
                "ok": True,
                "written": True,
                "id": mirror_id,
                "name": made["name"],
                "replaced": replaced,
                "warning": warning,
                "count": len(ids),
                "existing": {"id": mirror_id, "name": made["name"]},
            }
        )
        return result

    return safe_write.run("local_mirrors", str(draft["name"]), apply)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/local-mirror`` request.

    Args:
        payload: ``action`` is ``preview`` or ``create``. Both take ``space``
            and ``crate``. ``create`` writes only when ``confirm`` is true.

    Returns:
        That action's result.

    Raises:
        LibraryError: If the action, space, or crate is invalid.
        library.SeratoOpen: If ``create`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = _require_space(payload.get("space") or library.LIBRARY_SPACE)
    crate_id = _require_crate(payload.get("crate"))
    confirm = payload.get("confirm") is True
    database = Path(library.MASTER)
    if kind == "preview" or (kind == "create" and not confirm):
        return preview(database, space, crate_id)
    if kind == "create":
        return create(database, space, crate_id)
    raise LibraryError("That action is not available.")
