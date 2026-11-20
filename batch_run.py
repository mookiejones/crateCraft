"""Queue tracks and crates, preview the first item, then add them in one write.

The queue lives in ``batch-run.json`` beside ``settings.json``, keyed by the
library file. It is never inside the Serato folder. Preview only reads.
Apply adds every queued track, and every direct member of each queued crate,
into one destination crate inside one ``safe_write.run``. Undo puts that
preimage back and does not take a second snapshot.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import tempfile
import threading
from collections.abc import Mapping
from pathlib import Path

import app_config
import library
import safe_write

STORE_NAME = "batch-run.json"
BATCH_EMPTY = "Queue a track or a crate before preview."
BATCH_NEEDS_DEST = "Choose the crate that will receive the tracks."
BATCH_STALE = "The library changed since this preview. Nothing was written."
BATCH_NO_PREVIEW = "Preview the first item before applying the batch."
BATCH_NEEDS_CONFIRM = "Confirm the batch before it is saved."
BATCH_NOTHING = "Nothing in this batch would change."
BATCH_NO_UNDO = "There is no batch to undo."
BATCH_UNDO_STALE = "The library changed since this batch. Nothing was restored."
BATCH_SAME = "A crate cannot be added to itself."
BATCH_MISSING = "That queued item is not in the list."

_LOCK = threading.Lock()
_KINDS = frozenset({"track", "crate"})


def listing() -> dict[str, object]:
    """Return the queue, destination, preview, and whether undo is available.

    Returns:
        Names and ids only. No library path and no file hash.
    """
    with _LOCK:
        rec = _record(_read_store())
    return _public(rec)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one batch action.

    Args:
        payload: ``action`` plus the fields that action needs.

    Returns:
        The listing after the action. Apply also includes ``added``.

    Raises:
        LibraryError: If the action is unknown or its guard fails.
            Preview does not write the library.
    """
    act = payload.get("action")
    if act == "add":
        return _add(payload.get("kind"), payload.get("id"))
    if act == "remove":
        return _remove(payload.get("kind"), payload.get("id"))
    if act == "destination":
        return _destination(payload.get("id"))
    if act == "cancel":
        return _cancel()
    if act == "preview":
        return _preview()
    if act == "apply":
        return _apply(payload.get("confirm") is True)
    if act == "undo":
        return _undo(payload.get("confirm") is True)
    raise library.LibraryError("That action is not available.", 404)


def _add(kind: object, raw_id: object) -> dict[str, object]:
    """Append one track or crate and drop a stale preview.

    Args:
        kind: ``track`` or ``crate``.
        raw_id: Integer id.

    Returns:
        The listing.

    Raises:
        LibraryError: If the kind or id is not valid, or the row is missing.
    """
    item = {"kind": _kind(kind), "id": _as_int(raw_id)}
    _require_item(item["kind"], item["id"])
    with _LOCK:
        store = _read_store()
        rec = _record(store)
        queue = rec["queue"]
        if item not in queue:
            queue.append(item)
        if _queued_crate_is_destination(rec):
            raise library.LibraryError(BATCH_SAME, 409)
        rec["preview"] = None
        _save(store, rec)
    return listing()


def _remove(kind: object, raw_id: object) -> dict[str, object]:
    """Drop one queued item and drop the preview.

    Args:
        kind: ``track`` or ``crate``.
        raw_id: Integer id.

    Returns:
        The listing.

    Raises:
        LibraryError: If that item is not queued.
    """
    item = {"kind": _kind(kind), "id": _as_int(raw_id)}
    with _LOCK:
        store = _read_store()
        rec = _record(store)
        if item not in rec["queue"]:
            raise library.LibraryError(BATCH_MISSING, 409)
        rec["queue"] = [row for row in rec["queue"] if row != item]
        rec["preview"] = None
        _save(store, rec)
    return listing()


def _destination(raw_id: object) -> dict[str, object]:
    """Choose the crate that will receive the queued tracks.

    Args:
        raw_id: Destination crate id.

    Returns:
        The listing.

    Raises:
        LibraryError: If the crate is missing, smart, or already queued.
    """
    crate_id = _as_int(raw_id)
    _require_item("crate", crate_id)
    with _LOCK:
        store = _read_store()
        rec = _record(store)
        rec["destination"] = crate_id
        if _queued_crate_is_destination(rec):
            raise library.LibraryError(BATCH_SAME, 409)
        rec["preview"] = None
        _save(store, rec)
    return listing()


def _cancel() -> dict[str, object]:
    """Clear the queue, destination, and preview. Undo stays.

    Returns:
        The listing. The library is unchanged.
    """
    with _LOCK:
        store = _read_store()
        rec = _record(store)
        rec["queue"] = []
        rec["destination"] = None
        rec["preview"] = None
        _save(store, rec)
    return listing()


def _preview() -> dict[str, object]:
    """Describe the first queued item and how many tracks would be added.

    Returns:
        The listing, including ``preview``. No preimage is taken.

    Raises:
        LibraryError: If the queue or destination is missing, or a queued
            crate is the destination.
    """
    with _LOCK:
        rec = _record(_read_store())
        queue = list(rec["queue"])
        destination = rec["destination"]
    if not queue:
        raise library.LibraryError(BATCH_EMPTY, 409)
    if not isinstance(destination, int):
        raise library.LibraryError(BATCH_NEEDS_DEST, 409)
    plan = _build_plan(queue, destination)
    fingerprint = _fingerprint()
    with _LOCK:
        store = _read_store()
        rec = _record(store)
        if rec["queue"] != queue or rec["destination"] != destination:
            raise library.LibraryError(BATCH_STALE, 409)
        rec["preview"] = {
            "fingerprint": fingerprint,
            "destination": destination,
            "queue": queue,
            "first": plan["first"],
            "would_add": plan["would_add"],
        }
        _save(store, rec)
    return listing()


def _apply(confirm: bool) -> dict[str, object]:
    """Add the previewed tracks in one verified write.

    Args:
        confirm: True saves. Anything else is refused.

    Returns:
        The listing plus ``added``. The queue and preview are cleared.
        ``undo`` remembers that one preimage.

    Raises:
        LibraryError: If confirm is missing, there is no preview, the
            library changed, or nothing would change. A refusal writes
            nothing.
    """
    if not confirm:
        raise library.LibraryError(BATCH_NEEDS_CONFIRM, 400)
    with _LOCK:
        preview = _record(_read_store())["preview"]
    if not isinstance(preview, dict):
        raise library.LibraryError(BATCH_NO_PREVIEW, 409)
    saved_fp = preview.get("fingerprint")
    if _fingerprint() != saved_fp:
        raise library.LibraryError(BATCH_STALE, 409)
    queue = preview.get("queue")
    destination = preview.get("destination")
    if not isinstance(queue, list) or not isinstance(destination, int):
        raise library.LibraryError(BATCH_NO_PREVIEW, 409)
    plan = _build_plan(_queue_items(queue), destination)
    if _fingerprint() != saved_fp or plan["would_add"] != preview.get("would_add"):
        raise library.LibraryError(BATCH_STALE, 409)
    asset_ids = plan["would_add"]
    if not asset_ids:
        raise library.LibraryError(BATCH_NOTHING, 409)
    dest_name = str(plan["destination_name"])
    space = library.LIBRARY_SPACE

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Add each planned track and register the membership check.

        Args:
            conn: Open write connection.
            write: Session whose preimage covers the whole batch.

        Returns:
            Added count and the preimage id.
        """
        for asset_id in asset_ids:
            library._membership(conn, destination, asset_id, space, True)
        wanted = tuple(asset_ids)

        def check(copied: sqlite3.Connection, crate_id: int = destination, wanted: tuple[int, ...] = wanted) -> None:
            """Fail when a planned track is missing from the destination.

            Args:
                copied: Read-only connection to the temporary database copy.
                crate_id: Destination crate id.
                wanted: Asset ids that must be members.

            Raises:
                VerifyMismatch: If a membership row is missing.
            """
            for asset_id in wanted:
                row = copied.execute(
                    """
                    SELECT COUNT(*) FROM container_asset ca
                    JOIN location_container lc ON lc.id = ca.location_container_id
                    WHERE lc.container_id = ? AND ca.asset_id = ?
                    """,
                    (crate_id, asset_id),
                ).fetchone()
                count = 0 if row is None else int(row[0])
                if count < 1:
                    raise safe_write.VerifyMismatch("The crate membership does not match.")

        write.check(check)
        write.set_target(dest_name)
        return {"ok": True, "added": len(asset_ids), "snapshot_id": write.snapshot_id}

    result = safe_write.run("batch_apply", dest_name, apply)
    snapshot_id = result.get("snapshot_id")
    with _LOCK:
        store = _read_store()
        rec = _record(store)
        rec["queue"] = []
        rec["preview"] = None
        if isinstance(snapshot_id, str):
            rec["undo"] = {
                "snapshot_id": snapshot_id,
                "target": dest_name,
                "after": _after_state(),
            }
        _save(store, rec)
    body = listing()
    body["added"] = len(asset_ids)
    return body


def _undo(confirm: bool) -> dict[str, object]:
    """Restore the batch preimage when the library still matches that write.

    Args:
        confirm: True restores. Anything else is refused.

    Returns:
        The listing. ``can_undo`` is false after a successful restore.

    Raises:
        LibraryError: If confirm is missing, there is no batch, or the
            library changed. A refusal restores nothing.
    """
    if not confirm:
        raise library.LibraryError(BATCH_NEEDS_CONFIRM, 400)
    with _LOCK:
        undo = _record(_read_store())["undo"]
    if not isinstance(undo, dict) or not isinstance(undo.get("snapshot_id"), str):
        raise library.LibraryError(BATCH_NO_UNDO, 409)
    after = undo.get("after")
    if not isinstance(after, dict) or _after_state() != after:
        raise library.LibraryError(BATCH_UNDO_STALE, 409)
    safe_write.undo_preimage(
        str(undo["snapshot_id"]),
        operation="batch_undo",
        target=str(undo.get("target") or "batch"),
    )
    with _LOCK:
        store = _read_store()
        rec = _record(store)
        rec["undo"] = None
        _save(store, rec)
    return listing()


def _build_plan(queue: list[dict[str, object]], destination: int) -> dict[str, object]:
    """Resolve the queue into the tracks apply would add.

    Args:
        queue: Queued ``kind`` and ``id`` rows, in order.
        destination: Destination crate id.

    Returns:
        ``first``, ``would_add``, and ``destination_name``. ``would_add``
        is direct members only, skipping tracks already in the destination.

    Raises:
        LibraryError: If a row is missing, a crate is smart or the space
            root, or a queued crate is the destination.
    """
    space = library.LIBRARY_SPACE
    conn = library.read_conn()
    try:
        dest = library._container(conn, destination, space)
        _refuse_special(dest)
        existing = set(_direct_members(conn, destination))
        first: dict[str, object] | None = None
        ordered: list[int] = []
        seen: set[int] = set()
        for item in queue:
            kind = item["kind"]
            item_id = item["id"]
            if not isinstance(kind, str) or not isinstance(item_id, int):
                raise library.LibraryError(BATCH_MISSING, 409)
            if kind == "crate":
                if item_id == destination:
                    raise library.LibraryError(BATCH_SAME, 409)
                row = library._container(conn, item_id, space)
                _refuse_special(row)
                name = library.display_name(str(row["name"] or ""))
                member_ids = _direct_members(conn, item_id)
            else:
                library._space_asset(conn, item_id, space, create=False)
                name = _asset_name(conn, item_id)
                member_ids = [item_id]
            if first is None:
                first = {"kind": kind, "id": item_id, "name": name}
            for asset_id in member_ids:
                if asset_id in seen or asset_id in existing:
                    continue
                seen.add(asset_id)
                ordered.append(asset_id)
        if first is None:
            raise library.LibraryError(BATCH_EMPTY, 409)
        return {
            "first": first,
            "would_add": ordered,
            "destination_name": library.display_name(str(dest["name"] or "")),
        }
    finally:
        conn.close()


def _refuse_special(row: sqlite3.Row) -> None:
    """Refuse a smart crate or a space root.

    Args:
        row: Container row from ``_container``.

    Raises:
        LibraryError: If the crate cannot take or give a manual membership.
    """
    crate_type = int(row["type"])
    if crate_type == 2:
        raise library.LibraryError("Smart crates choose their tracks from rules.")
    if crate_type == 0:
        raise library.LibraryError("Tracks live in a crate, not the space root.")
    if crate_type != 1:
        raise library.LibraryError("That request is not valid.", 400)


def _direct_members(conn: sqlite3.Connection, crate_id: int) -> list[int]:
    """Return asset ids stored on one crate, not its subcrates.

    Args:
        conn: Open connection.
        crate_id: Container id.

    Returns:
        Asset ids in list order.
    """
    rows = conn.execute(
        """
        SELECT ca.asset_id FROM container_asset ca
        JOIN location_container lc ON lc.id = ca.location_container_id
        WHERE lc.container_id = ?
        ORDER BY ca.list_order, ca.id
        """,
        (crate_id,),
    ).fetchall()
    return [int(row[0]) for row in rows]


def _asset_name(conn: sqlite3.Connection, asset_id: int) -> str:
    """Return the stored asset name.

    Args:
        conn: Open connection.
        asset_id: Asset id.

    Returns:
        ``asset.name``, or an empty string when the row has no name.
    """
    row = conn.execute("SELECT name FROM asset WHERE id = ?", (asset_id,)).fetchone()
    if row is None or not isinstance(row[0], str):
        return ""
    return row[0]


def _require_item(kind: str, item_id: int) -> None:
    """Raise when the track or normal crate is not in the library space.

    Args:
        kind: ``track`` or ``crate``.
        item_id: Row id.

    Raises:
        LibraryError: If the row is missing or the crate is not a normal crate.
    """
    space = library.LIBRARY_SPACE
    conn = library.read_conn()
    try:
        if kind == "crate":
            _refuse_special(library._container(conn, item_id, space))
        else:
            library._space_asset(conn, item_id, space, create=False)
    finally:
        conn.close()


def _public(rec: dict[str, object]) -> dict[str, object]:
    """Return the page-facing listing for one library record.

    Args:
        rec: Normalized record. May include hashes. Those are omitted.

    Returns:
        Queue, destination, preview summary, and ``can_undo``.
    """
    names = _names(rec)
    queue: list[dict[str, object]] = []
    for item in rec["queue"]:
        if not isinstance(item, dict):
            continue
        kind = item.get("kind")
        item_id = item.get("id")
        if kind not in _KINDS or not isinstance(item_id, int):
            continue
        queue.append({"kind": kind, "id": item_id, "name": names.get((str(kind), item_id), "")})
    destination: dict[str, object] | None = None
    dest_id = rec.get("destination")
    if isinstance(dest_id, int):
        destination = {"id": dest_id, "name": names.get(("crate", dest_id), "")}
    preview_out: dict[str, object] | None = None
    preview = rec.get("preview")
    if isinstance(preview, dict) and isinstance(preview.get("first"), dict):
        first = preview["first"]
        would = preview.get("would_add")
        preview_out = {
            "first": {
                "kind": first.get("kind"),
                "id": first.get("id"),
                "name": first.get("name") if isinstance(first.get("name"), str) else "",
            },
            "would_add": len(would) if isinstance(would, list) else 0,
        }
    undo = rec.get("undo")
    return {
        "queue": queue,
        "destination": destination,
        "preview": preview_out,
        "can_undo": isinstance(undo, dict) and isinstance(undo.get("snapshot_id"), str),
    }


def _names(rec: dict[str, object]) -> dict[tuple[str, int], str]:
    """Look up display names for the queued ids and the destination.

    Args:
        rec: Normalized record.

    Returns:
        Map of ``(kind, id)`` to a display name. A missing library yields
        an empty map.
    """
    wanted: list[tuple[str, int]] = []
    for item in rec["queue"]:
        if isinstance(item, dict) and item.get("kind") in _KINDS and isinstance(item.get("id"), int):
            wanted.append((str(item["kind"]), int(item["id"])))
    dest_id = rec.get("destination")
    if isinstance(dest_id, int):
        wanted.append(("crate", dest_id))
    if not wanted:
        return {}
    try:
        conn = library.read_conn()
    except (library.LibraryError, OSError):
        return {}
    found: dict[tuple[str, int], str] = {}
    try:
        space = library.LIBRARY_SPACE
        for kind, item_id in wanted:
            if kind == "crate":
                row = conn.execute(
                    """
                    SELECT c.name FROM container c
                    JOIN space s ON s.id = c.space_id
                    WHERE c.id = ? AND s.name = ?
                    """,
                    (item_id, space),
                ).fetchone()
                if row is not None and isinstance(row[0], str):
                    found[(kind, item_id)] = library.display_name(row[0])
            else:
                found[(kind, item_id)] = _asset_name(conn, item_id)
    finally:
        conn.close()
    return found


def _fingerprint() -> dict[str, list[int] | None]:
    """Return size and mtime for the master database and its wal.

    Returns:
        ``master`` and ``wal``. A missing file is None. This does not open
        the snapshot store.
    """
    master = Path(library.MASTER)
    return {"master": _stat(master), "wal": _stat(Path(str(master) + "-wal"))}


def _after_state() -> dict[str, str | None]:
    """Return the SHA-256 of the master database and its wal.

    Returns:
        Hex digests. A missing file is None.
    """
    master = Path(library.MASTER)
    return {"master": _sha256(master), "wal": _sha256(Path(str(master) + "-wal"))}


def _stat(path: Path) -> list[int] | None:
    """Return size and mtime, or None when the file is missing.

    Args:
        path: File to stat. A shortcut is treated as missing.

    Returns:
        ``[size, mtime_ns]``, or None.
    """
    if path.is_symlink() or not path.is_file():
        return None
    st = path.stat()
    return [st.st_size, st.st_mtime_ns]


def _sha256(path: Path) -> str | None:
    """Return the SHA-256 of a file, or None when it is missing.

    Args:
        path: File to hash. A shortcut is treated as missing.

    Returns:
        Hex digest, or None.
    """
    if path.is_symlink() or not path.is_file():
        return None
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _kind(value: object) -> str:
    """Return ``track`` or ``crate``.

    Args:
        value: Request field.

    Returns:
        The kind.

    Raises:
        LibraryError: If the kind is anything else.
    """
    if value not in _KINDS or not isinstance(value, str):
        raise library.LibraryError("That request is not valid.", 400)
    return str(value)


def _as_int(value: object) -> int:
    """Return an integer id.

    Args:
        value: Request field. A bool is rejected.

    Returns:
        The id.

    Raises:
        LibraryError: If the value is not an integer.
    """
    if isinstance(value, bool) or not isinstance(value, int):
        raise library.LibraryError("That request is not valid.", 400)
    return value


def _queued_crate_is_destination(rec: dict[str, object]) -> bool:
    """Return whether the destination crate is also queued.

    Args:
        rec: Normalized record.

    Returns:
        True when a queued crate id equals the destination.
    """
    destination = rec.get("destination")
    if not isinstance(destination, int):
        return False
    return any(
        isinstance(item, dict) and item.get("kind") == "crate" and item.get("id") == destination
        for item in rec["queue"]
    )


def _queue_items(raw: list[object]) -> list[dict[str, object]]:
    """Return queued items stored on a preview.

    Args:
        raw: JSON list.

    Returns:
        Items with a kind and an int id.

    Raises:
        LibraryError: If an entry is not a queued item.
    """
    items: list[dict[str, object]] = []
    for item in raw:
        if not isinstance(item, dict):
            raise library.LibraryError(BATCH_NO_PREVIEW, 409)
        kind = item.get("kind")
        item_id = item.get("id")
        if kind not in _KINDS or isinstance(item_id, bool) or not isinstance(item_id, int):
            raise library.LibraryError(BATCH_NO_PREVIEW, 409)
        items.append({"kind": str(kind), "id": item_id})
    return items


def _library_key() -> str:
    """Return the resolved library path used as the store key.

    Returns:
        ``library.MASTER`` resolved to a string.
    """
    return str(Path(library.MASTER).resolve())


def _record(store: Mapping[str, object]) -> dict[str, object]:
    """Return the normalized record for this library.

    Args:
        store: Parsed ``batch-run.json``.

    Returns:
        Queue, destination, preview, and undo. Missing pieces are empty.
    """
    raw = store.get(_library_key())
    rec = raw if isinstance(raw, dict) else {}
    queue = rec.get("queue")
    items = [item for item in queue if isinstance(item, dict)] if isinstance(queue, list) else []
    destination = rec.get("destination")
    preview = rec.get("preview")
    undo = rec.get("undo")
    return {
        "queue": items,
        "destination": destination if isinstance(destination, int) else None,
        "preview": preview if isinstance(preview, dict) else None,
        "undo": undo if isinstance(undo, dict) else None,
    }


def _save(store: dict[str, object], rec: dict[str, object]) -> None:
    """Store one library record.

    Args:
        store: All libraries.
        rec: This library's normalized record.
    """
    store[_library_key()] = rec
    _write_store(store)


def _store_path() -> Path:
    """Return ``batch-run.json`` beside ``settings.json``.

    Returns:
        A path under :func:`app_config.config_dir`. Not inside the Serato folder.
    """
    return app_config.config_dir() / STORE_NAME


def _read_store() -> dict[str, object]:
    """Read every library's batch. A missing or damaged file is empty.

    Returns:
        Object keyed by library path.
    """
    try:
        data = json.loads(_store_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    return {str(key): value for key, value in data.items() if isinstance(value, dict)}


def _write_store(data: Mapping[str, object]) -> None:
    """Replace ``batch-run.json`` in one step.

    Args:
        data: All library records.

    Raises:
        OSError: If the file cannot be replaced.
    """
    path = _store_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(prefix=".batch-run-", suffix=".json", dir=path.parent)
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as out:
            json.dump(data, out, indent=2, sort_keys=True, ensure_ascii=False)
            out.flush()
            os.fsync(out.fileno())
        os.replace(temp, path)
    except BaseException:
        Path(temp).unlink(missing_ok=True)
        raise
