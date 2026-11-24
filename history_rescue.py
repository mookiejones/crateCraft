#!/usr/bin/env python3
"""Compare and rescue Serato history sessions (#482).

Compares live ``history_session`` / ``history_entry`` rows with copies in
``Library/Backups`` and hash-checked snapshots. Preview is read-only.
Chosen sessions can be rebuilt as dated crates in a labelled folder
(safer default), or written back into the live tables when the history
schema is understood. Write-back runs through ``safe_write`` with a
snapshot and a read-back check. An unprobed or blocked write gate
refuses write-back and points the DJ at crate rebuild. A 3.x
``_Serato_/History`` folder is listed as ``not_checked`` until a
parser exists.

``python3 history_rescue.py`` prints the source catalog as JSON.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import tempfile
import time
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path

import gig_check
import library
import safe_write
import serato_schema
import snapshots
from library import LibraryError

ACTIONS = frozenset({"scan", "preview", "restore", "crates"})
PARENT_NAME = "History rescue (crateCraft)"
WRITE_UNPROBED = (
    "History write-back was not checked for this Serato version. "
    "Rebuild as crates instead."
)
SOURCE_UNKNOWN = "That history source is not available."
SESSIONS_NEEDED = "Choose at least one history session."
NOTHING = "Nothing to change."
HISTORY_FOLDER_NOTE = (
    "Serato 3.x History/Sessions is not checked yet. "
    "Use a backup or snapshot database, or rebuild as crates from live history."
)
COMPARE_LIVE = "Choose a backup or snapshot to compare."
ROW_CAP = 200


def _session_key(row: Mapping[str, object]) -> str:
    """Stable compare key for one session."""
    start = row.get("start_time")
    name = row.get("name") or "Session"
    return f"{start}|{name}"


def _entry_fingerprint(row: Mapping[str, object]) -> tuple[object, ...]:
    """Compare fingerprint for one history entry."""
    return (
        row.get("start_time"),
        row.get("name") or "",
        row.get("artist") or "",
        row.get("played"),
        row.get("deck") or "",
        row.get("file_name") or "",
        row.get("asset_id"),
    )


def _sessions_from_conn(conn: sqlite3.Connection) -> list[dict[str, object]]:
    """List sessions from an open read-only connection."""
    rows = conn.execute(
        """
        SELECT s.id, s.name, s.start_time, s.end_time,
               COUNT(e.id) AS entries,
               COALESCE(SUM(CASE WHEN e.played THEN 1 ELSE 0 END), 0) AS played
        FROM history_session s
        LEFT JOIN history_entry e ON e.session_id = s.id
        GROUP BY s.id
        ORDER BY s.start_time DESC, s.id DESC
        """
    ).fetchall()
    return [
        {
            "id": int(row["id"]),
            "name": row["name"] or "Session",
            "start_time": row["start_time"],
            "end_time": row["end_time"],
            "entries": int(row["entries"]),
            "played": int(row["played"]),
            "key": _session_key(
                {
                    "start_time": row["start_time"],
                    "name": row["name"] or "Session",
                }
            ),
        }
        for row in rows
    ]


def _entries_from_conn(conn: sqlite3.Connection, session_id: int) -> list[dict[str, object]]:
    """Load history entries for one session id."""
    rows = conn.execute(
        """
        SELECT id, asset_id, name, artist, album, bpm, key, length_ms,
               start_time, end_time, played, deck, notes, file_name, is_missing
        FROM history_entry
        WHERE session_id = ?
        ORDER BY start_time, id
        """,
        (session_id,),
    ).fetchall()
    return [
        {
            "id": int(row["id"]),
            "asset_id": row["asset_id"],
            "name": row["name"] or "",
            "artist": row["artist"] or "",
            "album": row["album"] or "",
            "bpm": row["bpm"],
            "key": row["key"] or "",
            "length_ms": row["length_ms"],
            "start_time": row["start_time"],
            "end_time": row["end_time"],
            "played": bool(row["played"]),
            "deck": row["deck"] or "",
            "notes": row["notes"] or "",
            "file_name": row["file_name"] or "",
            "is_missing": bool(row["is_missing"]),
        }
        for row in rows
    ]


def _open_source_conn(source_id: str) -> tuple[sqlite3.Connection, Path | None]:
    """Open a read-only connection for a catalog source id.

    Returns:
        Connection and an optional temp path the caller must delete.
    """
    if source_id == "live":
        return gig_check.open_read_only(Path(library.MASTER)), None
    if source_id.startswith("backup:"):
        name = source_id[len("backup:") :]
        for folder in library.list_backups():
            if folder.name == name:
                db = folder / "master.sqlite"
                if not db.is_file():
                    raise LibraryError(SOURCE_UNKNOWN, 404)
                return gig_check.open_read_only(db), None
        raise LibraryError(SOURCE_UNKNOWN, 404)
    if source_id.startswith("snapshot:"):
        snap_id = source_id[len("snapshot:") :]
        store = snapshots.SnapshotStore(Path(library.MASTER), recover=False)
        try:
            raw = store.database_bytes(snap_id)
        except snapshots.SnapshotError as exc:
            raise LibraryError(SOURCE_UNKNOWN, 404) from exc
        if raw is None:
            raise LibraryError(SOURCE_UNKNOWN, 404)
        handle = tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False)
        try:
            handle.write(raw)
            handle.flush()
        finally:
            handle.close()
        path = Path(handle.name)
        return gig_check.open_read_only(path), path
    if source_id.startswith("history_folder:"):
        raise LibraryError(HISTORY_FOLDER_NOTE, 400)
    raise LibraryError(SOURCE_UNKNOWN, 404)


def catalog() -> dict[str, object]:
    """List history sources available for compare."""
    sources: list[dict[str, object]] = [
        {
            "id": "live",
            "kind": "live",
            "label": "Live library",
            "status": "ok",
        }
    ]
    for folder in library.list_backups():
        sources.append(
            {
                "id": f"backup:{folder.name}",
                "kind": "backup",
                "label": folder.name,
                "status": "ok",
                "path": str(folder),
            }
        )
    try:
        store = snapshots.SnapshotStore(Path(library.MASTER), recover=False)
        for item in store.list_snapshots():
            snap_id = item.get("id")
            if not isinstance(snap_id, str) or not snap_id:
                continue
            sources.append(
                {
                    "id": f"snapshot:{snap_id}",
                    "kind": "snapshot",
                    "label": snap_id,
                    "status": "ok",
                    "created": item.get("created"),
                }
            )
    except (snapshots.SnapshotError, OSError):
        pass
    for candidate in (
        Path(library.MASTER).expanduser().resolve().parent.parent / "_Serato_" / "History",
        Path(library.MASTER).expanduser().parent / "_Serato_" / "History",
    ):
        try:
            if candidate.is_dir() and not candidate.is_symlink():
                sources.append(
                    {
                        "id": f"history_folder:{candidate}",
                        "kind": "history_folder",
                        "label": str(candidate),
                        "status": "not_checked",
                        "detail": HISTORY_FOLDER_NOTE,
                    }
                )
                break
        except OSError:
            continue
    return {"sources": sources, "write_back": write_back_status()}


def write_back_status() -> dict[str, object]:
    """Whether restore into live history tables is allowed."""
    block = snapshots.write_block_message()
    if block:
        return {"allowed": False, "reason": block, "code": "history_write_blocked"}
    try:
        conn = gig_check.open_read_only(Path(library.MASTER))
    except (library.LibraryError, OSError) as exc:
        return {"allowed": False, "reason": str(exc), "code": "history_write_unreadable"}
    try:
        if not _history_schema_writable(conn):
            return {
                "allowed": False,
                "reason": WRITE_UNPROBED,
                "code": "history_write_unprobed",
            }
    finally:
        conn.close()
    return {"allowed": True, "reason": None, "code": None}


def _history_schema_writable(conn: sqlite3.Connection) -> bool:
    """True when history tables expose columns crateCraft can restore."""
    try:
        session_cols = {
            row[1] for row in conn.execute("PRAGMA table_info(history_session)").fetchall()
        }
        entry_cols = {
            row[1] for row in conn.execute("PRAGMA table_info(history_entry)").fetchall()
        }
    except sqlite3.Error:
        return False
    needed_session = set(serato_schema.TOUCHED_COLUMNS["history_session"])
    needed_entry = set(serato_schema.TOUCHED_COLUMNS["history_entry"])
    return needed_session.issubset(session_cols) and needed_entry.issubset(entry_cols)


def compare(source_id: str) -> dict[str, object]:
    """Per-session diff between live history and one source."""
    if source_id == "live":
        raise LibraryError(COMPARE_LIVE, 400)
    live_conn = gig_check.open_read_only(Path(library.MASTER))
    temp: Path | None = None
    try:
        source_conn, temp = _open_source_conn(source_id)
        try:
            live_sessions = _sessions_from_conn(live_conn)
            source_sessions = _sessions_from_conn(source_conn)
            live_map = {str(item["key"]): item for item in live_sessions}
            source_map = {str(item["key"]): item for item in source_sessions}
            only_live = [live_map[key] for key in live_map.keys() - source_map.keys()]
            only_source = [
                source_map[key] for key in source_map.keys() - live_map.keys()
            ]
            both: list[dict[str, object]] = []
            disagree: list[dict[str, object]] = []
            for key in sorted(live_map.keys() & source_map.keys()):
                live_row = live_map[key]
                source_row = source_map[key]
                live_entries = _entries_from_conn(live_conn, int(live_row["id"]))
                source_entries = _entries_from_conn(source_conn, int(source_row["id"]))
                matched = [_entry_fingerprint(row) for row in live_entries] == [
                    _entry_fingerprint(row) for row in source_entries
                ]
                item = {
                    "key": key,
                    "live": live_row,
                    "source": source_row,
                    "agree": matched,
                }
                both.append(item)
                if not matched:
                    disagree.append(
                        {
                            **item,
                            "live_entries": live_entries[:ROW_CAP],
                            "source_entries": source_entries[:ROW_CAP],
                            "live_entry_count": len(live_entries),
                            "source_entry_count": len(source_entries),
                        }
                    )
            return {
                "preview": True,
                "written": False,
                "source": source_id,
                "only_live": only_live[:ROW_CAP],
                "only_live_count": len(only_live),
                "only_source": only_source[:ROW_CAP],
                "only_source_count": len(only_source),
                "both": both[:ROW_CAP],
                "both_count": len(both),
                "disagree": disagree[:ROW_CAP],
                "disagree_count": len(disagree),
                "write_back": write_back_status(),
            }
        finally:
            source_conn.close()
    finally:
        live_conn.close()
        if temp is not None:
            try:
                temp.unlink()
            except OSError:
                pass


def _resolve_session_ids(
    source_conn: sqlite3.Connection,
    session_ids: Sequence[object],
) -> list[dict[str, object]]:
    """Map requested source session ids to full session rows."""
    if not session_ids:
        raise LibraryError(SESSIONS_NEEDED, 400)
    wanted: list[int] = []
    for raw in session_ids:
        if isinstance(raw, bool) or not isinstance(raw, int):
            raise LibraryError(SESSIONS_NEEDED, 400)
        wanted.append(raw)
    sessions = {int(item["id"]): item for item in _sessions_from_conn(source_conn)}
    found: list[dict[str, object]] = []
    for session_id in wanted:
        row = sessions.get(session_id)
        if row is None:
            raise LibraryError("That history session is not in the source.", 404)
        found.append(row)
    return found


def preview_restore(source_id: str, session_ids: Sequence[object]) -> dict[str, object]:
    """Read-only plan for restoring chosen source sessions into live."""
    status = write_back_status()
    temp: Path | None = None
    source_conn, temp = _open_source_conn(source_id)
    live_conn = gig_check.open_read_only(Path(library.MASTER))
    try:
        live_keys = {str(item["key"]) for item in _sessions_from_conn(live_conn)}
        sessions = _resolve_session_ids(source_conn, session_ids)
        plans: list[dict[str, object]] = []
        skipped: list[dict[str, object]] = []
        for session in sessions:
            key = _session_key(session)
            if key in live_keys:
                skipped.append(
                    {
                        "session": session,
                        "key": key,
                        "reason": "already_live",
                    }
                )
                continue
            entries = _entries_from_conn(source_conn, int(session["id"]))
            plans.append(
                {
                    "session": session,
                    "entries": len(entries),
                    "assets": [
                        int(row["asset_id"])
                        for row in entries
                        if isinstance(row.get("asset_id"), int)
                        and not isinstance(row.get("asset_id"), bool)
                        and int(row["asset_id"]) > 0
                    ],
                }
            )
        return {
            "preview": True,
            "written": False,
            "action": "restore",
            "source": source_id,
            "sessions": plans,
            "session_count": len(plans),
            "skipped": skipped,
            "skipped_count": len(skipped),
            "write_back": status,
        }
    finally:
        source_conn.close()
        live_conn.close()
        if temp is not None:
            try:
                temp.unlink()
            except OSError:
                pass


def restore_sessions(
    source_id: str,
    session_ids: Sequence[object],
    *,
    confirm: bool,
) -> dict[str, object]:
    """Restore chosen source sessions into live history through safe_write.

    A source session whose compare key is already live is skipped so a
    second restore does not duplicate it.
    """
    if not confirm:
        return preview_restore(source_id, session_ids)
    status = write_back_status()
    if not status.get("allowed"):
        raise LibraryError(str(status.get("reason") or WRITE_UNPROBED), 409)
    temp: Path | None = None
    source_conn, temp = _open_source_conn(source_id)
    live_conn = gig_check.open_read_only(Path(library.MASTER))
    try:
        live_keys = {
            str(row["key"]): row for row in _sessions_from_conn(live_conn)
        }
        sessions = _resolve_session_ids(source_conn, session_ids)
        payloads: list[dict[str, object]] = []
        skipped: list[dict[str, object]] = []
        for session in sessions:
            key = _session_key(session)
            if key in live_keys:
                existing = live_keys[key]
                skipped.append(
                    {
                        "id": existing.get("id"),
                        "key": key,
                        "name": session.get("name") or "Session",
                        "reason": "already_live",
                    }
                )
                continue
            entries = _entries_from_conn(source_conn, int(session["id"]))
            payloads.append({"session": dict(session), "entries": list(entries)})
        if not payloads and not skipped:
            raise LibraryError(NOTHING, 400)
        if not payloads:
            return {
                "preview": False,
                "written": False,
                "action": "restore",
                "source": source_id,
                "sessions": [],
                "session_count": 0,
                "restored": [],
                "restored_count": 0,
                "skipped": skipped,
                "skipped_count": len(skipped),
                "write_back": status,
                "snapshot_id": None,
            }

        def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
            seen = {
                str(row["key"]): row for row in _sessions_from_conn(conn)
            }
            created: list[dict[str, object]] = []
            for item in payloads:
                session = item["session"]
                entries = item["entries"]
                assert isinstance(session, dict)
                assert isinstance(entries, list)
                key = _session_key(session)
                if key in seen:
                    continue
                cursor = conn.execute(
                    """
                    INSERT INTO history_session (name, start_time, end_time, notes)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        session.get("name") or "Session",
                        session.get("start_time"),
                        session.get("end_time"),
                        "",
                    ),
                )
                new_id = int(cursor.lastrowid)
                for entry in entries:
                    assert isinstance(entry, dict)
                    _insert_entry(conn, new_id, entry)
                created_row = {
                    "id": new_id,
                    "key": key,
                    "name": session.get("name") or "Session",
                    "entries": len(entries),
                }
                created.append(created_row)
                seen[key] = created_row

            def check(verify_conn: sqlite3.Connection) -> None:
                live = {
                    str(row["key"]): row for row in _sessions_from_conn(verify_conn)
                }
                for item in payloads:
                    session = item["session"]
                    assert isinstance(session, dict)
                    key = _session_key(session)
                    if key not in live:
                        raise safe_write.VerifyMismatch(
                            "Restored history sessions did not stick."
                        )
                    row = live[key]
                    got = _entries_from_conn(verify_conn, int(row["id"]))
                    raw_entries = item["entries"]
                    assert isinstance(raw_entries, list)
                    want = [
                        dict(entry)
                        for entry in raw_entries
                        if isinstance(entry, dict)
                    ]
                    if [_entry_fingerprint(entry) for entry in got] != [
                        _entry_fingerprint(entry) for entry in want
                    ]:
                        raise safe_write.VerifyMismatch(
                            "Restored history entries did not match the source."
                        )

            write.check(check)
            return {
                "restored": created,
                "restored_count": len(created),
                "skipped": skipped,
                "skipped_count": len(skipped),
                "snapshot_id": write.snapshot_id,
            }

        result = safe_write.run("history_restore", "history", apply)
        body = preview_restore(source_id, session_ids)
        body["preview"] = False
        body["written"] = True
        body.update(result)
        return body
    finally:
        source_conn.close()
        live_conn.close()
        if temp is not None:
            try:
                temp.unlink()
            except OSError:
                pass


def _insert_entry(
    conn: sqlite3.Connection,
    session_id: int,
    entry: Mapping[str, object],
) -> None:
    """Insert one history_entry using columns present on this schema."""
    cols = {row[1] for row in conn.execute("PRAGMA table_info(history_entry)").fetchall()}
    values: dict[str, object] = {
        "session_id": session_id,
        "asset_id": entry.get("asset_id"),
        "name": entry.get("name") or "",
        "artist": entry.get("artist") or "",
        "album": entry.get("album") or "",
        "bpm": entry.get("bpm"),
        "key": entry.get("key") or "",
        "length_ms": entry.get("length_ms"),
        "start_time": entry.get("start_time"),
        "end_time": entry.get("end_time"),
        "played": 1 if entry.get("played") else 0,
        "deck": entry.get("deck") or "",
        "notes": entry.get("notes") or "",
        "file_name": entry.get("file_name") or "",
        "is_missing": 1 if entry.get("is_missing") else 0,
    }
    if "portable_id" in cols:
        values["portable_id"] = ""
    if "type" in cols:
        values["type"] = ""
    if "format" in cols:
        values["format"] = ""
    names = [name for name in values if name in cols]
    placeholders = ", ".join("?" for _ in names)
    conn.execute(
        f"INSERT INTO history_entry ({', '.join(names)}) VALUES ({placeholders})",
        [values[name] for name in names],
    )


def preview_crates(
    source_id: str,
    session_ids: Sequence[object],
    space: str,
) -> dict[str, object]:
    """Read-only plan for rebuilding sessions as dated crates."""
    temp: Path | None = None
    if source_id == "live":
        source_conn = gig_check.open_read_only(Path(library.MASTER))
    else:
        source_conn, temp = _open_source_conn(source_id)
    try:
        sessions = _resolve_session_ids(source_conn, session_ids)
        plans: list[dict[str, object]] = []
        for session in sessions:
            entries = _entries_from_conn(source_conn, int(session["id"]))
            assets: list[int] = []
            for row in entries:
                asset_id = row.get("asset_id")
                if (
                    isinstance(asset_id, int)
                    and not isinstance(asset_id, bool)
                    and asset_id > 0
                    and asset_id not in assets
                ):
                    assets.append(asset_id)
            stamp = session.get("start_time")
            day = (
                time.strftime("%Y-%m-%d", time.localtime(int(stamp)))
                if isinstance(stamp, int)
                else "session"
            )
            name = f"{day} · {session.get('name') or 'Session'}"
            plans.append(
                {
                    "session": session,
                    "name": name,
                    "assets": assets,
                    "asset_count": len(assets),
                }
            )
        return {
            "preview": True,
            "written": False,
            "action": "crates",
            "source": source_id,
            "space": space,
            "parent_name": PARENT_NAME,
            "sessions": plans,
            "session_count": len(plans),
        }
    finally:
        source_conn.close()
        if temp is not None:
            try:
                temp.unlink()
            except OSError:
                pass


def rebuild_crates(
    source_id: str,
    session_ids: Sequence[object],
    space: str,
    *,
    confirm: bool,
) -> dict[str, object]:
    """Create dated crates for chosen sessions under a labelled folder."""
    if not confirm:
        return preview_crates(source_id, session_ids, space)
    plan = preview_crates(source_id, session_ids, space)
    sessions = plan.get("sessions")
    if not isinstance(sessions, list) or not sessions:
        raise LibraryError(NOTHING, 400)
    parent = library.crate_action(
        {
            "action": "create",
            "space": space,
            "name": _unique_root_name(space, PARENT_NAME),
        }
    )
    parent_id = parent.get("id")
    if not isinstance(parent_id, int):
        raise LibraryError("The history rescue folder could not be created.")
    created: list[dict[str, object]] = []
    for item in sessions:
        if not isinstance(item, dict):
            continue
        assets = item.get("assets")
        name = item.get("name")
        if not isinstance(name, str) or not name:
            continue
        if not isinstance(assets, list) or not assets:
            continue
        label = name
        suffix = 2
        while _child_exists(space, parent_id, label):
            label = f"{name} ({suffix})"
            suffix += 1
        made = library.crate_action(
            {
                "action": "create",
                "space": space,
                "name": label,
                "parent": parent_id,
                "assets": assets,
            }
        )
        created.append(made)
    body = dict(plan)
    body["preview"] = False
    body["written"] = True
    body["parent"] = parent
    body["crates"] = created
    body["crate_count"] = len(created)
    body["snapshot_id"] = parent.get("snapshot_id")
    return body


def _unique_root_name(space: str, base: str) -> str:
    """Return a root crate name that does not already exist."""
    label = base
    suffix = 2
    with closing(library.read_conn()) as conn:
        space_row = conn.execute(
            "SELECT id FROM space WHERE name = ?", (space,)
        ).fetchone()
        if space_row is None:
            return label
        space_id = int(space_row["id"])
        while True:
            found = conn.execute(
                """
                SELECT 1 FROM container
                WHERE space_id = ? AND parent_id IS NULL AND name = ? COLLATE NOCASE
                """,
                (space_id, label),
            ).fetchone()
            if found is None:
                return label
            label = f"{base} ({suffix})"
            suffix += 1


def _child_exists(space: str, parent_id: int, name: str) -> bool:
    """True when a child crate of this name already exists."""
    with closing(library.read_conn()) as conn:
        space_row = conn.execute(
            "SELECT id FROM space WHERE name = ?", (space,)
        ).fetchone()
        if space_row is None:
            return False
        found = conn.execute(
            """
            SELECT 1 FROM container
            WHERE space_id = ? AND parent_id = ? AND name = ? COLLATE NOCASE
            """,
            (int(space_row["id"]), parent_id, name),
        ).fetchone()
        return found is not None


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/history-rescue`` request."""
    kind = payload.get("action")
    source = payload.get("source") or "live"
    if not isinstance(source, str):
        raise LibraryError(SOURCE_UNKNOWN, 400)
    confirm = payload.get("confirm") is True
    sessions = payload.get("sessions") or payload.get("session_ids") or []
    if not isinstance(sessions, list):
        raise LibraryError(SESSIONS_NEEDED, 400)
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    if kind == "scan":
        return catalog()
    if kind == "preview":
        if source == "live" or sessions:
            # With sessions, preview is the crate/restore plan for those ids.
            # Without sessions and a non-live source, preview is the diff.
            if sessions:
                return preview_crates(source, sessions, space)
            if source != "live":
                return compare(source)
            raise LibraryError(SESSIONS_NEEDED, 400)
        return compare(source)
    if kind == "restore":
        return restore_sessions(source, sessions, confirm=confirm)
    if kind == "crates":
        return rebuild_crates(source, sessions, space, confirm=confirm)
    raise LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the history-rescue catalog or a compare."""
    parser = argparse.ArgumentParser(description="Compare and rescue history sessions.")
    parser.add_argument("--source", default="")
    parser.add_argument("--compare", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.compare:
            if not args.source:
                print("Choose a source with --source.", file=sys.stderr)
                return 1
            result = compare(args.source)
        else:
            result = catalog()
    except LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
