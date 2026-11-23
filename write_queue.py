"""Queue library writes while Gig Lock is on or Serato DJ is running (#393).

Queued writes sit in ``write-queue.json`` beside ``settings.json``. They do
not touch the library until Preview then Apply after the lock is off, and
then only through the existing crate, track, and file writers. A fingerprint
mismatch keeps both sides: the live crate stays as Serato left it, and
crateCraft's copy is a sibling named ``from crateCraft, {day} {Mon} {HH:MM}``.
Applied items stay undoable for 30 days. Undo takes a fresh snapshot through
``safe_write`` and skips when Serato changed the row since apply.
"""

from __future__ import annotations

import hashlib
import json
import os
import tempfile
import threading
import time
import uuid
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import album_art
import audio_changed
import app_config
import bitrate_check
import gain_reset
import crate_compare
import crate_trees
import files
import folder_sync
import history_stats
import library
import lost_tags
import energy_level
import music_mirror
import smart_presets
import snapshots
import tag_cleanup
import tonight_crates

STORE_NAME = "write-queue.json"
UNDO_DAYS = 30
UNDO_SECONDS = UNDO_DAYS * 24 * 60 * 60
QUEUE_LOCKED = (
    "Quit Serato DJ Pro or turn Gig Lock off before applying queued writes."
)
CONFIRM_NEEDED = "Confirm the queued writes before they are saved."
UNKNOWN_ITEM = "That queued write is not in the list."
SKIPPED_CHANGED = "Serato changed it since"
GIG_LOCK_NOT_SAVED = "The Gig Lock choice could not be saved."
_MONTHS = (
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
)
QUEUEABLE = frozenset(
    {
        "/api/crate",
        "/api/track",
        "/api/files",
        "/api/import.m3u",
        "/api/smart-preset",
        "/api/crate-tree",
        "/api/folder-sync",
        "/api/history-stats",
        "/api/tonight",
        "/api/tag-clusters",
        "/api/lost-tags",
        "/api/energy",
        "/api/audio-changed",
        "/api/gain",
        "/api/crate-compare",
        "/api/album-art",
        "/api/bitrate-check",
        "/api/duplicates/merge",
        "/api/replace-in-crates",
        "/api/music-mirror",
    }
)

_store_lock = threading.Lock()


def layer_name(when: float | None = None) -> str:
    """Return a Windows-safe crateCraft layer name.

    Args:
        when: Unix time. None uses now.

    Returns:
        ``from crateCraft, 15 Nov 14:02``.
    """
    stamp = time.localtime(when)
    return (
        f"from crateCraft, {stamp.tm_mday} {_MONTHS[stamp.tm_mon - 1]} "
        f"{time.strftime('%H:%M', stamp)}"
    )


def should_queue(path: str, payload: Mapping[str, object], *, is_preview: bool = False) -> bool:
    """Return whether this POST should sit in the queue instead of writing.

    Queue only when Gig Lock is on or Serato DJ is running. SQLite I/O errors
    and Protect Library / unknown version still fall through to 409. Crate
    expanded, music-mirror copy, file plans, and previews are not queued.

    Args:
        path: Absolute POST path.
        payload: JSON body.
        is_preview: True when the handler would not write.

    Returns:
        True to enqueue and leave the library untouched.
    """
    if is_preview:
        return False
    if path not in QUEUEABLE:
        return False
    if path == "/api/crate" and payload.get("action") == "expanded":
        return False
    if path == "/api/music-mirror" and payload.get("action") == "copy":
        return False
    if path == "/api/files" and payload.get("confirm") is not True:
        return False
    try:
        info = library.status()
    except library.LibraryError:
        return False
    if info.get("open_error"):
        return False
    if snapshots.write_block_notice() is not None:
        return False
    gig_lock = app_config.load_settings().gig_lock is True
    running = snapshots.serato_dj_running()
    return gig_lock or running


def listing() -> dict[str, object]:
    """Return the queue for this library.

    Returns:
        ``gig_lock``, ``locked``, ``pending``, and ``undo``. A missing
        store reads as empty.
    """
    _expire_undo()
    gig_lock = app_config.load_settings().gig_lock is True
    running = snapshots.serato_dj_running()
    rec = _library_record()
    return {
        "gig_lock": gig_lock,
        "locked": gig_lock or running,
        "pending": [_public_pending(item) for item in rec["pending"]],
        "undo": [_public_undo(item) for item in rec["undo"]],
    }


def enqueue(path: str, payload: Mapping[str, object]) -> dict[str, object]:
    """Store one write and leave the library untouched.

    Args:
        path: Absolute POST path.
        payload: JSON body, copied.

    Returns:
        ``queued`` true with the new item id and label.
    """
    copied = json.loads(json.dumps(payload))
    if not isinstance(copied, dict):
        copied = {}
    space = str(copied.get("space") or library.LIBRARY_SPACE)
    action = copied.get("action")
    before: dict[str, object] | None = None
    if path == "/api/crate" and action != "create" and copied.get("id") is not None:
        before = _crate_snapshot(copied["id"], space)
    elif path == "/api/track" and copied.get("id") is not None:
        before = _track_snapshot(copied["id"])
    elif path == "/api/files" and copied.get("path"):
        file_path = Path(str(copied["path"]))
        before = {
            "path": str(file_path),
            "size": file_path.stat().st_size if file_path.exists() else None,
        }
    item = {
        "id": uuid.uuid4().hex,
        "path": path,
        "payload": copied,
        "action": str(action or path.rsplit("/", 1)[-1]),
        "label": _label(path, copied),
        "queued_at": time.time(),
        "space": space,
        "before": before,
        "intended": _intended(path, copied, before),
    }
    with _store_lock:
        store = _read_store()
        rec = store.setdefault(_library_key(), {"pending": [], "undo": []})
        rec.setdefault("pending", []).append(item)
        rec.setdefault("undo", rec.get("undo") or [])
        _write_store(store)
    return {"queued": True, "id": item["id"], "label": item["label"]}


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run preview, apply, drop, or undo.

    Args:
        payload: ``action`` plus ``id`` and ``confirm`` as needed.
            Apply without ``confirm`` true is a preview.

    Returns:
        The listing, plus apply or undo fields.

    Raises:
        library.LibraryError: Unknown action, missing item, still locked,
            or confirm missing on undo.
    """
    act = payload.get("action")
    if act in (None, "preview") or (act == "apply" and payload.get("confirm") is not True):
        body = listing()
        body["preview"] = True
        return body
    if act == "apply":
        if _locked():
            raise library.LibraryError(QUEUE_LOCKED, 409)
        return apply()
    if act == "drop":
        return drop(payload.get("id"))
    if act == "undo":
        if payload.get("confirm") is not True:
            raise library.LibraryError(CONFIRM_NEEDED, 400)
        if _locked():
            raise library.LibraryError(QUEUE_LOCKED, 409)
        return undo_item(payload.get("id"))
    raise library.LibraryError("That action is not available.", 404)


def apply() -> dict[str, object]:
    """Write every pending item through the existing library writers.

    Returns:
        Applied, skipped, and layer names, plus the listing.

    Raises:
        library.LibraryError: If Gig Lock is still on or Serato is running.
    """
    if _locked():
        raise library.LibraryError(QUEUE_LOCKED, 409)
    _expire_undo()
    applied: list[dict[str, object]] = []
    skipped: list[dict[str, object]] = []
    layers: list[str] = []
    with _store_lock:
        store = _read_store()
        rec = store.setdefault(_library_key(), {"pending": [], "undo": []})
        pending = list(rec.get("pending") or [])
        rec["pending"] = []
        undo = list(rec.get("undo") or [])
        rec["undo"] = undo
        _write_store(store)
    for item in pending:
        outcome = _apply_item(item)
        public = _public_pending(item)
        if outcome.get("layer"):
            public["layer"] = outcome["layer"]
            public["conflict"] = True
            layers.append(str(outcome["layer"]))
        if outcome.get("skipped"):
            public["skipped"] = outcome["skipped"]
            skipped.append(public)
            continue
        applied.append(public)
        reverse = _reverse_for(item, outcome)
        after_fp = _after_fingerprint(item, outcome)
        undo.append(
            {
                "id": item["id"],
                "label": item["label"],
                "applied_at": time.time(),
                "path": item["path"],
                "space": item.get("space") or library.LIBRARY_SPACE,
                "after_id": outcome.get("after_id"),
                "after": after_fp,
                "layer": outcome.get("layer"),
                "reverse": reverse,
            }
        )
    with _store_lock:
        store = _read_store()
        rec = store.setdefault(_library_key(), {"pending": [], "undo": []})
        rec["undo"] = undo
        _write_store(store)
    body = listing()
    body["applied"] = applied
    body["skipped"] = skipped
    body["layers"] = layers
    return body


def drop(item_id: object) -> dict[str, object]:
    """Remove one pending write, or every pending write when id is omitted.

    Args:
        item_id: Queue id. None or empty drops the whole pending list.

    Returns:
        The listing after the drop.

    Raises:
        library.LibraryError: If an id was given and is not pending.
    """
    with _store_lock:
        store = _read_store()
        rec = store.setdefault(_library_key(), {"pending": [], "undo": []})
        pending = list(rec.get("pending") or [])
        if item_id is None or item_id == "":
            rec["pending"] = []
        else:
            kept = [item for item in pending if item.get("id") != item_id]
            if len(kept) == len(pending):
                raise library.LibraryError(UNKNOWN_ITEM, 404)
            rec["pending"] = kept
        _write_store(store)
    return listing()


def undo_item(item_id: object) -> dict[str, object]:
    """Reverse one applied write when the fingerprint still matches.

    Args:
        item_id: Undo record id.

    Returns:
        The listing, with ``skipped`` when Serato changed the row.

    Raises:
        library.LibraryError: Missing id, still locked, or no reverse.
    """
    if _locked():
        raise library.LibraryError(QUEUE_LOCKED, 409)
    _expire_undo()
    if not isinstance(item_id, str) or not item_id:
        raise library.LibraryError(UNKNOWN_ITEM, 404)
    with _store_lock:
        store = _read_store()
        rec = store.setdefault(_library_key(), {"pending": [], "undo": []})
        undo = list(rec.get("undo") or [])
        match = next((item for item in undo if item.get("id") == item_id), None)
        if match is None:
            raise library.LibraryError(UNKNOWN_ITEM, 404)
        rec["undo"] = [item for item in undo if item.get("id") != item_id]
        _write_store(store)
    reverse = match.get("reverse")
    if not isinstance(reverse, dict) or not reverse.get("path"):
        body = listing()
        body["skipped"] = [{"id": item_id, "skipped": "no reverse"}]
        return body
    current = _current_fingerprint(match)
    after = match.get("after")
    if after and current and current != after:
        body = listing()
        body["skipped"] = [{"id": item_id, "label": match.get("label"), "skipped": SKIPPED_CHANGED}]
        return body
    _replay(str(reverse["path"]), reverse.get("payload") or {})
    body = listing()
    body["undone"] = item_id
    return body


def _locked() -> bool:
    """Return whether apply and undo must wait."""
    return app_config.load_settings().gig_lock is True or snapshots.serato_dj_running()


def _apply_item(item: Mapping[str, Any]) -> dict[str, object]:
    """Apply one queued write, keeping both sides on a crate or track conflict."""
    path = str(item.get("path") or "")
    payload = item.get("payload") or {}
    if not isinstance(payload, dict):
        payload = {}
    space = str(item.get("space") or payload.get("space") or library.LIBRARY_SPACE)
    if path == "/api/crate":
        return _apply_crate(item, payload, space)
    if path == "/api/track":
        return _apply_track(item, payload, space)
    if path == "/api/files":
        return _apply_files(item, payload)
    result = _replay(path, payload)
    after_id = result.get("id") if isinstance(result, dict) else None
    return {"result": result, "after_id": after_id}


def _apply_crate(
    item: Mapping[str, Any], payload: dict[str, object], space: str
) -> dict[str, object]:
    """Create, replay, skip, or keep both for one crate write."""
    action_name = payload.get("action")
    if action_name == "create":
        result = library.crate_action(payload)
        return {"result": result, "after_id": result.get("id")}
    crate_id = payload.get("id")
    before = item.get("before") or {}
    before_fp = before.get("fingerprint") if isinstance(before, dict) else None
    current = _crate_snapshot(crate_id, space) if crate_id is not None else None
    if current is None:
        return {"skipped": "crate gone"}
    if before_fp and current["fingerprint"] != before_fp:
        if action_name == "delete":
            return {"skipped": SKIPPED_CHANGED}
        name = layer_name()
        intended = item.get("intended") if isinstance(item.get("intended"), dict) else {}
        members = list(intended.get("members") or current["members"])
        parent = intended.get("parent")
        if parent is None:
            parent = current.get("parent")
        result = library.crate_action(
            {
                "action": "create",
                "space": space,
                "parent": parent,
                "name": name,
                "assets": members,
            }
        )
        return {
            "result": result,
            "layer": name,
            "after_id": result.get("id"),
            "conflict": True,
        }
    result = library.crate_action(payload)
    return {"result": result, "after_id": result.get("id") or crate_id}


def _apply_track(
    item: Mapping[str, Any], payload: dict[str, object], space: str
) -> dict[str, object]:
    """Save track fields, or keep both as a named crate on conflict."""
    asset_id = int(payload["id"])
    before = item.get("before") or {}
    before_fp = before.get("fingerprint") if isinstance(before, dict) else None
    current = _track_snapshot(asset_id)
    if current is None:
        return {"skipped": "track gone"}
    if before_fp and current["fingerprint"] != before_fp:
        name = layer_name()
        result = library.crate_action(
            {"action": "create", "space": space, "name": name, "assets": [asset_id]}
        )
        return {
            "result": result,
            "layer": name,
            "after_id": result.get("id"),
            "conflict": True,
        }
    result = library.save_track(
        asset_id,
        payload.get("fields") or {},
        space,
        payload.get("overwrite"),
    )
    return {"result": result, "after_id": asset_id}


def _apply_files(item: Mapping[str, Any], payload: dict[str, object]) -> dict[str, object]:
    """Replay a file write, or skip when the file size no longer matches."""
    before = item.get("before") or {}
    path_value = payload.get("path")
    if path_value and isinstance(before, dict) and before.get("size") is not None:
        file_path = Path(str(path_value))
        if file_path.exists() and file_path.stat().st_size != before["size"]:
            return {"skipped": "file changed"}
    result = files.execute(payload)
    return {"result": result}


def _replay(path: str, payload: Mapping[str, object]) -> dict[str, object]:
    """Run the same writer the HTTP handler would have called."""
    body = dict(payload)
    space = str(body.get("space") or library.LIBRARY_SPACE)
    if path == "/api/crate":
        return library.crate_action(body)
    if path == "/api/track":
        return library.save_track(
            int(body["id"]),
            body.get("fields") or {},
            space,
            body.get("overwrite"),
        )
    if path == "/api/files":
        return files.execute(body)
    if path == "/api/import.m3u":
        return library.import_m3u(
            space,
            body.get("parent"),
            str(body.get("name") or ""),
            str(body.get("text") or ""),
        )
    request = dict(body)
    request["space"] = space
    if path == "/api/smart-preset":
        return smart_presets.action(request)
    if path == "/api/crate-tree":
        return crate_trees.action(request)
    if path == "/api/folder-sync":
        return folder_sync.action(request)
    if path == "/api/history-stats":
        return history_stats.action(request)
    if path == "/api/tonight":
        return tonight_crates.action(request)
    if path == "/api/tag-clusters":
        return tag_cleanup.action(request)
    if path == "/api/lost-tags":
        return lost_tags.action(request)
    if path == "/api/energy":
        return energy_level.action(request)
    if path == "/api/audio-changed":
        return audio_changed.action(request)
    if path == "/api/gain":
        return gain_reset.action(request)
    if path == "/api/crate-compare":
        return crate_compare.action(request)
    if path == "/api/album-art":
        return album_art.action(request)
    if path == "/api/bitrate-check":
        return bitrate_check.action(request)
    if path == "/api/duplicates/merge":
        return library.merge_duplicates(body)
    if path == "/api/replace-in-crates":
        return library.replace_in_crates(body)
    if path == "/api/music-mirror":
        return music_mirror.action(request)
    raise library.LibraryError("That action is not available.", 404)


def _reverse_for(item: Mapping[str, Any], outcome: Mapping[str, object]) -> dict[str, object] | None:
    """Build the payload that undoes an applied write, or None when none exists."""
    path = str(item.get("path") or "")
    payload = item.get("payload") or {}
    if not isinstance(payload, dict):
        return None
    space = str(item.get("space") or payload.get("space") or library.LIBRARY_SPACE)
    action_name = payload.get("action")
    before = item.get("before") if isinstance(item.get("before"), dict) else {}
    if path == "/api/crate":
        if action_name == "create" or outcome.get("conflict"):
            crate_id = outcome.get("after_id")
            if crate_id is None:
                return None
            return {
                "path": "/api/crate",
                "payload": {"action": "delete", "id": crate_id, "space": space},
            }
        if action_name == "delete":
            return {
                "path": "/api/crate",
                "payload": {
                    "action": "create",
                    "space": space,
                    "parent": before.get("parent"),
                    "name": before.get("name"),
                    "assets": before.get("members") or [],
                },
            }
        if action_name == "rename":
            return {
                "path": "/api/crate",
                "payload": {
                    "action": "rename",
                    "id": payload.get("id"),
                    "name": before.get("name"),
                    "space": space,
                },
            }
        if action_name == "add":
            return {
                "path": "/api/crate",
                "payload": {
                    "action": "remove",
                    "id": payload.get("id"),
                    "asset": payload.get("asset"),
                    "space": space,
                },
            }
        if action_name == "remove":
            return {
                "path": "/api/crate",
                "payload": {
                    "action": "add",
                    "id": payload.get("id"),
                    "asset": payload.get("asset"),
                    "space": space,
                },
            }
        if action_name == "color":
            return {
                "path": "/api/crate",
                "payload": {
                    "action": "color",
                    "id": payload.get("id"),
                    "color": before.get("color"),
                    "space": space,
                },
            }
    if path == "/api/track" and not outcome.get("conflict"):
        return {
            "path": "/api/track",
            "payload": {
                "id": payload.get("id"),
                "fields": before.get("fields") or {},
                "space": space,
            },
        }
    if path == "/api/track" and outcome.get("conflict"):
        crate_id = outcome.get("after_id")
        if crate_id is None:
            return None
        return {
            "path": "/api/crate",
            "payload": {"action": "delete", "id": crate_id, "space": space},
        }
    return None


def _after_fingerprint(item: Mapping[str, Any], outcome: Mapping[str, object]) -> str | None:
    """Fingerprint the row after apply, for later undo skip."""
    path = str(item.get("path") or "")
    payload = item.get("payload") or {}
    space = str(item.get("space") or (payload.get("space") if isinstance(payload, dict) else None) or library.LIBRARY_SPACE)
    after_id = outcome.get("after_id")
    if path == "/api/crate" and after_id is not None:
        snap = _crate_snapshot(after_id, space)
        return None if snap is None else str(snap["fingerprint"])
    if path == "/api/track" and isinstance(payload, dict) and payload.get("id") is not None:
        if outcome.get("conflict") and after_id is not None:
            snap = _crate_snapshot(after_id, space)
            return None if snap is None else str(snap["fingerprint"])
        snap = _track_snapshot(payload["id"])
        return None if snap is None else str(snap["fingerprint"])
    return None


def _current_fingerprint(record: Mapping[str, Any]) -> str | None:
    """Fingerprint the live row an undo record points at."""
    reverse = record.get("reverse") or {}
    if not isinstance(reverse, dict):
        return None
    path = str(reverse.get("path") or "")
    payload = reverse.get("payload") or {}
    if not isinstance(payload, dict):
        return None
    space = str(record.get("space") or payload.get("space") or library.LIBRARY_SPACE)
    if path == "/api/crate":
        crate_id = payload.get("id") or record.get("after_id")
        if crate_id is None:
            return None
        snap = _crate_snapshot(crate_id, space)
        return None if snap is None else str(snap["fingerprint"])
    if path == "/api/track" and payload.get("id") is not None:
        snap = _track_snapshot(payload["id"])
        return None if snap is None else str(snap["fingerprint"])
    return None


def _crate_snapshot(crate_id: object, space: str) -> dict[str, object] | None:
    """Name, members, parent, color, and fingerprint for one crate."""
    try:
        cid = int(crate_id)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    conn = library.read_conn()
    try:
        try:
            row = library.container_in_space(conn, cid, space)
        except library.LibraryError:
            return None
        members = crate_compare._members(conn, [cid])
        keys = set(row.keys())
        name = library.display_name(str(row["name"] or ""))
        parent = row["parent_id"] if "parent_id" in keys else None
        color = row["color"] if "color" in keys else None
        body = {"name": name, "members": members, "color": color}
        return {
            "fingerprint": _hash(body),
            "name": name,
            "members": members,
            "parent": parent,
            "color": color,
        }
    finally:
        conn.close()


def _track_snapshot(asset_id: object) -> dict[str, object] | None:
    """Title, artist, BPM, key, comments, and fingerprint for one track."""
    try:
        aid = int(asset_id)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    conn = library.read_conn()
    try:
        columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(asset)")}
        wanted = [col for col in ("name", "artist", "bpm", "key", "comments") if col in columns]
        if not wanted:
            return None
        sql = "SELECT " + ", ".join(wanted) + " FROM asset WHERE id = ?"
        row = conn.execute(sql, (aid,)).fetchone()
        if row is None:
            return None
        fields = {col: row[index] for index, col in enumerate(wanted)}
        return {"fingerprint": _hash({"fields": fields}), "fields": fields}
    finally:
        conn.close()


def _intended(
    path: str, payload: Mapping[str, object], before: dict[str, object] | None
) -> dict[str, object] | None:
    """CrateCraft's crate after this action, used when keeping both sides."""
    if path != "/api/crate":
        return None
    action_name = payload.get("action")
    members = list((before or {}).get("members") or [])
    parent = (before or {}).get("parent")
    name = (before or {}).get("name")
    if action_name == "create":
        assets = payload.get("assets") or []
        ids = [int(asset) for asset in assets] if isinstance(assets, list) else []
        return {"name": payload.get("name"), "members": ids, "parent": payload.get("parent")}
    if action_name == "add":
        try:
            asset = int(payload["asset"])  # type: ignore[arg-type]
        except (KeyError, TypeError, ValueError):
            asset = None
        if asset is not None and asset not in members:
            members.append(asset)
        return {"name": name, "members": members, "parent": parent}
    if action_name == "remove":
        try:
            asset = int(payload["asset"])  # type: ignore[arg-type]
        except (KeyError, TypeError, ValueError):
            asset = None
        members = [item for item in members if item != asset]
        return {"name": name, "members": members, "parent": parent}
    if action_name == "rename":
        return {"name": payload.get("name"), "members": members, "parent": parent}
    if action_name == "color":
        return {
            "name": name,
            "members": members,
            "parent": parent,
            "color": payload.get("color"),
        }
    if action_name == "delete":
        return {"name": name, "members": [], "parent": parent}
    return None


def _label(path: str, payload: Mapping[str, object]) -> str:
    """Short list label for the Backups panel."""
    action_name = str(payload.get("action") or path.rsplit("/", 1)[-1])
    name = payload.get("name")
    if isinstance(name, str) and name.strip():
        return f"{action_name} {name.strip()}"
    return action_name


def _hash(value: object) -> str:
    """Stable SHA-256 of a JSON object."""
    blob = json.dumps(value, separators=(",", ":"), ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def _public_pending(item: Mapping[str, Any]) -> dict[str, object]:
    """Fields the page lists for a queued write."""
    body: dict[str, object] = {
        "id": item.get("id"),
        "path": item.get("path"),
        "action": item.get("action"),
        "label": item.get("label"),
        "queued_at": item.get("queued_at"),
    }
    if item.get("layer"):
        body["layer"] = item["layer"]
    if item.get("conflict"):
        body["conflict"] = True
    if item.get("skipped"):
        body["skipped"] = item["skipped"]
    return body


def _public_undo(item: Mapping[str, Any]) -> dict[str, object]:
    """Fields the page lists for an undo row."""
    body: dict[str, object] = {
        "id": item.get("id"),
        "label": item.get("label"),
        "applied_at": item.get("applied_at"),
    }
    if item.get("layer"):
        body["layer"] = item["layer"]
    return body


def _expire_undo() -> None:
    """Drop undo records older than 30 days. Pending items stay."""
    cutoff = time.time() - UNDO_SECONDS
    with _store_lock:
        store = _read_store()
        changed = False
        for rec in store.values():
            if not isinstance(rec, dict):
                continue
            undo = rec.get("undo") or []
            kept = [
                item
                for item in undo
                if isinstance(item, dict) and float(item.get("applied_at") or 0) >= cutoff
            ]
            if len(kept) != len(undo):
                rec["undo"] = kept
                changed = True
        if changed:
            _write_store(store)


def _library_key() -> str:
    """Key stored queues by the library file they belong to."""
    return str(Path(library.MASTER).resolve())


def _library_record() -> dict[str, list[dict[str, object]]]:
    """Pending and undo lists for this library."""
    store = _read_store()
    rec = store.get(_library_key()) or {}
    pending = rec.get("pending") if isinstance(rec, dict) else None
    undo = rec.get("undo") if isinstance(rec, dict) else None
    return {
        "pending": [item for item in (pending or []) if isinstance(item, dict)],
        "undo": [item for item in (undo or []) if isinstance(item, dict)],
    }


def _store_path() -> Path:
    """Return ``write-queue.json`` beside ``settings.json``."""
    return app_config.config_dir() / STORE_NAME


def _read_store() -> dict[str, dict[str, object]]:
    """Read every library's queue. A missing or damaged file reads as empty."""
    try:
        data = json.loads(_store_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    out: dict[str, dict[str, object]] = {}
    for path, rec in data.items():
        if isinstance(rec, dict):
            out[str(path)] = rec
    return out


def _write_store(data: Mapping[str, Mapping[str, object]]) -> None:
    """Replace ``write-queue.json`` in one step."""
    path = _store_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(prefix=".write-queue-", suffix=".json", dir=path.parent)
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as out:
            json.dump(data, out, indent=2, sort_keys=True, ensure_ascii=False)
        os.replace(temp, path)
    except BaseException:
        Path(temp).unlink(missing_ok=True)
        raise
