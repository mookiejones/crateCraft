"""Copy smart-crate rules and a track snapshot onto a drive, and restore them.

Serato's portable library does not carry smart-crate rules. This module
writes both into the drive's existing ``_Serato_/SmartCrates`` folder as a
real ``.scrate`` file: ``rart`` / ``rlut`` / ``rurt`` for rules that map to
Serato's smart-crate fields, then ``otrk`` / ``ptrk`` for the tracks that
matched on this machine. A rule Serato's file cannot store is left out of
the rule list entirely. Restore then makes a normal crate of those snapshot
tracks instead of an empty or partial smart crate.

The drive folder is not created when it is missing. A shortcut is not
followed. A failed write puts the drive file back. Restore goes through
``safe_write`` and can be undone from that preimage. Nothing in this module
is written beside the Serato library except that preimage, which lives with
the other write-checks next to settings.
"""

from __future__ import annotations

import sqlite3
import struct
from collections.abc import Mapping, Sequence
from pathlib import Path

import drive_check
import drive_crates
import library
import safe_write
import smart_rules
import volumes
from library import LibraryError

SMART_VERSION = "1.0/Serato ScratchLive Smart Crate"
DRIVE_NOT_WRITTEN = "The drive file could not be written."
DRIVE_NOT_RESTORED = "The drive file could not be put back."
_NOT_CONNECTED = "This drive is not connected."
_NO_LIBRARY = "This folder has no _Serato_ folder."
_FALLBACK = "Rules could not be rebuilt. This becomes a normal crate."
_SMART_EXISTS = "A smart crate with this name is already in the library."
_NORMAL_EXISTS = "A normal crate with this name is already in the library."
_SMART_KEPT = "A smart crate with this name was left in place."
_NO_TRACKS = "No tracks from the snapshot are in this library."
_PARENT_SMART = "A parent smart crate cannot hold this crate."
_KEPT = "A crate with this name is already on the drive."
_NOT_SMART = "That crate is not a smart crate."
_SHORTCUT_FILE = "That crate file is a shortcut. The copy will not follow it."

# Serato smart-crate field ids that match the native JSON model.
_ATTR_FIELD: dict[str, int] = {
    "album": 8,
    "artist": 7,
    "comments": 17,
    "genre": 9,
    "key": 51,
    "name": 6,
    "bpm": 15,
    "time_added": 25,
}
_FIELD_ATTR = {field: attr for attr, field in _ATTR_FIELD.items()}
_STRING_CMP = {
    "CONTAINS": "cond_con_str",
    "DOES_NOT_CONTAIN": "cond_dnc_str",
    "IS": "cond_is_str",
    "IS_NOT": "cond_isn_str",
}
_UINT_CMP = {
    "GREATER_THAN_OR_EQUAL_TO": "cond_greq_uint",
    "LESS_THAN_OR_EQUAL_TO": "cond_lseq_uint",
}
_TIME_CMP = {
    "AFTER": "cond_aft_time",
    "BEFORE": "cond_bef_time",
}
_CMP_STRING = {value: key for key, value in _STRING_CMP.items()}
_CMP_UINT = {value: key for key, value in _UINT_CMP.items()}
_CMP_TIME = {value: key for key, value in _TIME_CMP.items()}
_ACTIONS = frozenset({"preview", "copy", "restore", "undo"})


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/portable-smart`` request.

    Args:
        payload: ``action`` is ``preview``, ``copy``, ``restore``, or
            ``undo``. Copy and restore take ``drive``. Copy may take
            ``crate`` and ``overwrite``. Restore may take ``confirm``.
            Undo takes ``snapshot_id`` from an earlier write.

    Returns:
        The action result. A missing or unreadable drive is
        ``not_connected`` or ``no_library`` and does not open the library.

    Raises:
        LibraryError: If the action or a field is not valid, or a drive
            write cannot be finished.
        SeratoOpen: If a write runs while Serato DJ is open.
    """
    kind = payload.get("action")
    if kind not in _ACTIONS or not isinstance(kind, str):
        raise LibraryError("That action is not available.")
    if kind == "undo":
        return _undo(payload.get("snapshot_id"))
    prepared = _prepare_drive(payload.get("drive"))
    if isinstance(prepared, dict):
        prepared["action"] = kind
        prepared["preview"] = kind == "preview"
        return prepared
    root, volume = prepared
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    if kind == "copy":
        return _copy(root, volume, space, _optional_crate(payload.get("crate")), _flag(payload.get("overwrite")))
    return _restore(
        root,
        volume,
        space,
        confirm=_flag(payload.get("confirm")),
        write=kind == "restore",
    )


def read_scrate(data: bytes) -> dict[str, object]:
    """Parse a ``.scrate`` file into rules and snapshot paths.

    Args:
        data: File bytes. A track-only crate, including the fixture layout
            that uses the normal crate version, is accepted.

    Returns:
        ``mode`` is ``smart`` when every rule maps onto the native model,
        otherwise ``fallback``. ``rules`` is the native leaf list or None.
        ``paths`` is the ``ptrk`` list. ``conjunction`` is ``AND`` or ``OR``.
        ``live_updates`` is the live-update flag.
    """
    paths: list[str] = []
    rules: list[dict[str, object]] = []
    conjunction = "AND"
    live = True
    saw_rule = False
    broken = False
    for tag, payload in _records(data):
        if tag == "otrk":
            for inner_tag, inner in _records(payload):
                if inner_tag != "ptrk":
                    continue
                text = _decode_text(inner)
                if text:
                    paths.append(text)
        elif tag == "rart":
            flag = _nested_bool(payload)
            if flag is None:
                broken = True
            else:
                conjunction = "AND" if flag else "OR"
        elif tag == "rlut":
            flag = _nested_bool(payload)
            if flag is None:
                broken = True
            else:
                live = flag
        elif tag == "rurt":
            saw_rule = True
            leaf = _decode_rule(payload)
            if leaf is None:
                broken = True
            else:
                rules.append(leaf)
    if broken or not saw_rule:
        return {
            "mode": "fallback",
            "rules": None,
            "paths": paths,
            "conjunction": conjunction,
            "live_updates": live,
        }
    return {
        "mode": "smart",
        "rules": rules,
        "paths": paths,
        "conjunction": conjunction,
        "live_updates": live,
    }


def _undo(snapshot_id: object) -> dict[str, object]:
    """Put one portable-smart preimage back.

    Args:
        snapshot_id: Id returned by copy or restore.

    Returns:
        The undo result.

    Raises:
        LibraryError: If the id is missing or the preimage cannot be restored.
        SeratoOpen: If Serato DJ is open.
    """
    if not isinstance(snapshot_id, str) or not snapshot_id.strip():
        raise LibraryError("The pre-write snapshot is missing.", 409)
    record = safe_write.undo_preimage(
        snapshot_id,
        operation="portable_smart_undo",
        target="Portable smart crates",
    )
    return {
        "ok": True,
        "action": "undo",
        "written": True,
        "preview": False,
        "status": "ok",
        "snapshot_id": snapshot_id,
        "needs_overwrite": False,
        "needs_confirm": False,
        "crates": [],
        "detail": "",
        "operation": record,
    }


def _copy(
    root: Path,
    volume: volumes.Volume,
    space: str,
    crate_id: int | None,
    overwrite: bool,
) -> dict[str, object]:
    """Write smart crates onto the drive.

    Args:
        root: Drive root that already has a real ``_Serato_`` folder.
        volume: That drive, for relative track paths.
        space: Space whose type-2 crates are copied.
        crate_id: One crate, or None for every smart crate in the space.
        overwrite: True may replace a ``.scrate`` that is already there.

    Returns:
        The copy result. ``written`` is true only when a file changed.

    Raises:
        LibraryError: If a file cannot be written or put back.
        SeratoOpen: If Serato DJ is open and a file would change.
    """
    folder, blocked = _smart_folder(root, create=False)
    if blocked is not None:
        blocked["action"] = "copy"
        return blocked
    assert folder is not None
    conn = library.read_conn()
    try:
        planned = _plan_copy(conn, space, volume, folder, crate_id, overwrite)
    finally:
        conn.close()
    changing = [item for item in planned if item["status"] == "written"]
    result = _envelope("copy", root, crates=planned, needs_overwrite=any(item["status"] == "kept" for item in planned))
    if not changing:
        return result
    paths = [Path(str(item["path"])) for item in changing]
    folder_existed = folder.is_dir()

    def apply(conn: sqlite3.Connection, session: safe_write.Session) -> dict[str, object]:
        """Write the planned files and record the preimage id.

        Args:
            conn: Open write connection. The database is not edited.
            session: Session that snapshotted the drive files.

        Returns:
            The copy result.

        Raises:
            LibraryError: If one file cannot be written.
        """
        del conn
        made = _ensure_folder(folder, folder_existed)
        try:
            for item in changing:
                _write_file(Path(str(item["path"])), item["data"], folder, made)  # type: ignore[arg-type]
        except LibraryError:
            raise
        finished = _envelope(
            "copy",
            root,
            crates=planned,
            needs_overwrite=bool(result["needs_overwrite"]),
            written=True,
            snapshot_id=session.snapshot_id,
        )
        return finished

    return safe_write.run("portable_smart_copy", "Portable smart crates", apply, paths)


def _restore(
    root: Path,
    volume: volumes.Volume,
    space: str,
    *,
    confirm: bool,
    write: bool,
) -> dict[str, object]:
    """Preview or apply smart crates from the drive onto this library.

    Args:
        root: Drive root.
        volume: That drive, for matching snapshot paths.
        space: Destination space.
        confirm: True may replace rules on an existing smart crate, or
            members on an existing normal crate when the file falls back.
        write: True applies the plan. False only previews it.

    Returns:
        The plan, or the plan after the write.

    Raises:
        LibraryError: If the library write is refused.
        SeratoOpen: If a write runs while Serato DJ is open.
    """
    folder, blocked = _smart_folder(root, create=False)
    if blocked is not None:
        blocked["action"] = "restore" if write else "preview"
        blocked["preview"] = not write
        return blocked
    assert folder is not None
    files = _read_drive(folder)
    if not folder.is_dir():
        return _envelope("restore" if write else "preview", root, preview=not write)
    conn = library.read_conn()
    try:
        planned = _plan_restore(conn, space, volume, files, confirm)
    finally:
        conn.close()
    needs_confirm = any(item["status"] == "needs_confirm" for item in planned)
    actionable = [item for item in planned if item["status"] in {"create", "update"}]
    if not write or not actionable:
        return _envelope(
            "restore" if write else "preview",
            root,
            crates=planned,
            preview=not write,
            needs_confirm=needs_confirm,
        )

    def apply(conn: sqlite3.Connection, session: safe_write.Session) -> dict[str, object]:
        """Create or update the crates the plan still allows.

        Args:
            conn: Open write connection.
            session: Session whose preimage undoes this restore.

        Returns:
            The restore result.
        """
        applied = _apply_restore(conn, session, space, volume, files, confirm)
        applied["snapshot_id"] = session.snapshot_id
        applied["written"] = any(item["status"] in {"create", "update"} for item in applied["crates"])
        applied["drive"] = str(root)
        return applied

    result = safe_write.run("portable_smart_restore", "Portable smart crates", apply)
    result["preview"] = False
    result["action"] = "restore"
    return result


def _plan_copy(
    conn: sqlite3.Connection,
    space: str,
    volume: volumes.Volume,
    folder: Path,
    crate_id: int | None,
    overwrite: bool,
) -> list[dict[str, object]]:
    """Decide which smart crates to write.

    Args:
        conn: Read-only library connection.
        space: Space name.
        volume: Destination drive.
        folder: ``SmartCrates`` directory. It may be missing.
        crate_id: One crate, or None for all type-2 crates.
        overwrite: True may replace an existing file.

    Returns:
        One row per crate. ``data`` is set only when ``status`` is ``written``.
    """
    rows = _type2_rows(conn, space, crate_id)
    if crate_id is not None and not rows:
        return [_crate_row("", "refused", detail=_NOT_SMART)]
    planned: list[dict[str, object]] = []
    seen: set[str] = set()
    for row in rows:
        name = library.display_name(str(row["name"]))
        try:
            filename = library._filename(conn, int(row["id"]), 2)
            safe = _safe_scrate_name(filename)
        except (LibraryError, ValueError):
            planned.append(_crate_row(name, "refused", detail=_NOT_SMART))
            continue
        if safe.casefold() in seen:
            continue
        seen.add(safe.casefold())
        parsed = smart_rules.parse_rules(row["rules"])
        paths = _snapshot_paths(conn, space, parsed, volume) if parsed is not None else []
        rule_bytes = _encode_rules(parsed) if parsed is not None else None
        if rule_bytes is None and not paths:
            planned.append(_crate_row(name, "skipped", rules=False, tracks=0))
            continue
        dest = folder / safe
        if dest.is_symlink():
            planned.append(_crate_row(name, "refused", path=str(dest), detail=_SHORTCUT_FILE))
            continue
        if dest.is_file() and not overwrite:
            planned.append(
                _crate_row(name, "kept", path=str(dest), rules=rule_bytes is not None, tracks=len(paths), detail=_KEPT)
            )
            continue
        data = _file_bytes(rule_bytes, paths)
        planned.append(
            _crate_row(
                name,
                "written",
                path=str(dest),
                rules=rule_bytes is not None,
                tracks=len(paths),
                data=data,
            )
        )
    return planned


def _plan_restore(
    conn: sqlite3.Connection,
    space: str,
    volume: volumes.Volume,
    files: list[dict[str, object]],
    confirm: bool,
) -> list[dict[str, object]]:
    """Decide what each drive file would become in this library.

    Args:
        conn: Read-only library connection.
        space: Destination space.
        volume: Drive the paths were stored against.
        files: Parsed ``.scrate`` files.
        confirm: True allows an overwrite the plan would otherwise hold.

    Returns:
        One row per file.
    """
    assets = _assets(conn, space)
    rows: list[dict[str, object]] = []
    for item in files:
        rows.append(_decide_file(conn, space, volume, assets, item, confirm))
    return rows


def _apply_restore(
    conn: sqlite3.Connection,
    session: safe_write.Session,
    space: str,
    volume: volumes.Volume,
    files: list[dict[str, object]],
    confirm: bool,
) -> dict[str, object]:
    """Write the restore plan on the open connection.

    Args:
        conn: Open write connection.
        session: Session that checks the rows after commit.
        space: Destination space.
        volume: Drive the snapshot paths belong to.
        files: Parsed drive files.
        confirm: True allows a same-named overwrite.

    Returns:
        The restore envelope. ``written`` is filled by the caller.
    """
    assets = _assets(conn, space)
    rows: list[dict[str, object]] = []
    for item in files:
        decision = _decide_file(conn, space, volume, assets, item, confirm)
        status = str(decision["status"])
        if status not in {"create", "update"}:
            rows.append(decision)
            continue
        parent = _ensure_parents(conn, space, _parents(item))
        if parent is None:
            decision["status"] = "skip"
            decision["detail"] = _PARENT_SMART
            rows.append(decision)
            continue
        leaf = str(item["name"])
        matched = _ids(decision.get("matched_ids"))
        if decision["mode"] == "smart":
            blob = _blob(space, item)
            if status == "create":
                made = library._create_crate(conn, space, parent, leaf, True, blob)
                crate_id = int(made["id"])
                _expect_smart(session, crate_id, blob)
            else:
                found = library._find_child(conn, parent, leaf, 2)
                if found is None:
                    decision["status"] = "skip"
                    rows.append(decision)
                    continue
                crate_id = found
                library._set_rules(conn, space, crate_id, blob)
                _expect_smart(session, crate_id, blob)
        else:
            if status == "create":
                made = library._create_crate(conn, space, parent, leaf, False, None)
                crate_id = int(made["id"])
                for asset_id in matched:
                    library._membership(conn, crate_id, asset_id, space, True)
            else:
                found = library._find_child(conn, parent, leaf, 1)
                if found is None:
                    decision["status"] = "skip"
                    rows.append(decision)
                    continue
                crate_id = found
                _replace_members(conn, space, crate_id, matched)
            _expect_members(session, crate_id, tuple(matched))
        rows.append(decision)
    needs_confirm = any(item["status"] == "needs_confirm" for item in rows)
    return _envelope("restore", Path(), crates=rows, needs_confirm=needs_confirm, written=False)


def _decide_file(
    conn: sqlite3.Connection,
    space: str,
    volume: volumes.Volume,
    assets: list[tuple[int, str]],
    item: dict[str, object],
    confirm: bool,
) -> dict[str, object]:
    """Choose create, update, confirm, skip, or nothing for one file.

    Args:
        conn: Open connection.
        space: Destination space.
        volume: Drive used to match paths.
        assets: Destination tracks as ``(id, portable_id)``.
        item: One parsed drive file.
        confirm: True allows a same-named overwrite.

    Returns:
        The crate row, including ``matched_ids`` for the writer.
    """
    name = str(item.get("name") or "")
    mode = str(item.get("mode") or "fallback")
    paths = item.get("paths")
    stored_paths = [text for text in paths if isinstance(text, str)] if isinstance(paths, list) else []
    matched = _match_paths(stored_paths, assets, volume)
    detail = _FALLBACK if mode == "fallback" else ""
    located = _locate(conn, space, _parents(item), name)
    if located == "blocked":
        return _restore_row(name, mode, "skip", len(stored_paths), matched, _PARENT_SMART)
    existing_id, existing_type = located
    if mode == "smart":
        if existing_type == 2 and existing_id is not None:
            blob = _blob(space, item)
            if _same_rules(conn, existing_id, blob):
                return _restore_row(name, mode, "nothing", len(stored_paths), matched, "")
            if not confirm:
                return _restore_row(name, mode, "needs_confirm", len(stored_paths), matched, _SMART_EXISTS)
            return _restore_row(name, mode, "update", len(stored_paths), matched, "")
        if existing_type == 1:
            return _restore_row(name, mode, "skip", len(stored_paths), matched, _NORMAL_EXISTS)
        return _restore_row(name, mode, "create", len(stored_paths), matched, "")
    if existing_type == 2:
        return _restore_row(name, mode, "skip", len(stored_paths), matched, _SMART_KEPT)
    if not matched and existing_type is None:
        text = _NO_TRACKS if stored_paths else _FALLBACK
        return _restore_row(name, mode, "nothing", len(stored_paths), matched, text)
    if existing_type == 1 and existing_id is not None:
        current = _members(conn, existing_id)
        if current == matched:
            return _restore_row(name, mode, "nothing", len(stored_paths), matched, detail)
        if not confirm:
            return _restore_row(name, mode, "needs_confirm", len(stored_paths), matched, _NORMAL_EXISTS)
        return _restore_row(name, mode, "update", len(stored_paths), matched, detail)
    if not matched:
        return _restore_row(name, mode, "nothing", len(stored_paths), matched, _NO_TRACKS)
    return _restore_row(name, mode, "create", len(stored_paths), matched, detail)


def _read_drive(folder: Path) -> list[dict[str, object]]:
    """Read real ``.scrate`` files. A shortcut is refused and not followed.

    Args:
        folder: ``SmartCrates`` directory. A missing directory yields no files.

    Returns:
        Parsed files in name order. A shortcut is one refused row.
    """
    if folder.is_symlink() or not folder.is_dir():
        return []
    found: list[dict[str, object]] = []
    for path in sorted(folder.iterdir(), key=lambda item: item.name.casefold()):
        if not path.name.casefold().endswith(".scrate"):
            continue
        if path.is_symlink() or not path.is_file():
            found.append(
                {
                    "name": path.name,
                    "parents": [],
                    "filename": path.name,
                    "mode": "fallback",
                    "paths": [],
                    "status": "refused",
                    "detail": _SHORTCUT_FILE,
                }
            )
            continue
        try:
            leaf, parents, _smart = library._split_crate_filename(path.name)
            _safe_scrate_name(path.name)
        except (LibraryError, ValueError):
            found.append(
                {
                    "name": path.name,
                    "parents": [],
                    "filename": path.name,
                    "mode": "fallback",
                    "paths": [],
                    "status": "refused",
                    "detail": _NOT_SMART,
                }
            )
            continue
        try:
            parsed = read_scrate(path.read_bytes())
        except OSError:
            found.append(
                {
                    "name": leaf,
                    "parents": parents,
                    "filename": path.name,
                    "mode": "fallback",
                    "paths": [],
                    "status": "refused",
                    "detail": DRIVE_NOT_WRITTEN,
                }
            )
            continue
        found.append(
            {
                "name": leaf,
                "parents": parents,
                "filename": path.name,
                "mode": parsed["mode"],
                "rules": parsed["rules"],
                "conjunction": parsed["conjunction"],
                "live_updates": parsed["live_updates"],
                "paths": parsed["paths"],
            }
        )
    return found


def _prepare_drive(drive: object) -> tuple[Path, volumes.Volume] | dict[str, object]:
    """Resolve a caller-supplied drive without creating it.

    Args:
        drive: Path text from the request.

    Returns:
        The real directory and a volume, or a stopped result when the drive
        is blank, a shortcut, or not a directory.
    """
    if not isinstance(drive, str):
        return _stopped("not_connected", "Choose a drive.")
    try:
        path = drive_check._drive_path(drive)
    except LibraryError as exc:
        status = "refused" if "shortcut" in exc.message.casefold() else "not_connected"
        return _stopped(status, exc.message)
    if path.is_symlink() or not path.is_dir():
        return _stopped("not_connected", _NOT_CONNECTED)
    return path, volumes.Volume(name=path.name or str(path), root=str(path), kind="posix")


def _smart_folder(root: Path, *, create: bool) -> tuple[Path | None, dict[str, object] | None]:
    """Return ``SmartCrates`` when ``_Serato_`` is a real directory.

    Args:
        root: Drive root.
        create: Unused. The folder is created only later, and only for a copy
            that has a file to write. Kept so callers state that intent.

    Returns:
        The folder and None, or None and a stopped result. A shortcut
        ``_Serato_`` or ``SmartCrates`` is ``no_library`` and is not followed.
    """
    del create
    serato = root / "_Serato_"
    if serato.is_symlink() or not serato.is_dir():
        return None, _stopped("no_library", _NO_LIBRARY)
    folder = serato / "SmartCrates"
    if folder.is_symlink():
        return None, _stopped("no_library", _NO_LIBRARY)
    if folder.exists() and not folder.is_dir():
        return None, _stopped("no_library", _NO_LIBRARY)
    return folder, None


def _ensure_folder(folder: Path, existed: bool) -> bool:
    """Create ``SmartCrates`` when this write is the first file there.

    Args:
        folder: ``SmartCrates`` path.
        existed: True when the directory was already present.

    Returns:
        True when this call created the directory.

    Raises:
        LibraryError: If the directory cannot be created.
    """
    if existed:
        return False
    if folder.is_symlink():
        raise LibraryError(DRIVE_NOT_WRITTEN)
    if folder.is_dir():
        return False
    try:
        folder.mkdir()
    except OSError as exc:
        raise LibraryError(DRIVE_NOT_WRITTEN) from exc
    return True


def _write_file(path: Path, data: object, folder: Path, folder_created: bool) -> None:
    """Replace one ``.scrate`` and put it back if the replace fails.

    Args:
        path: Destination file. A shortcut is refused.
        data: Full file bytes.
        folder: ``SmartCrates`` directory.
        folder_created: True when this write created ``folder``.

    Raises:
        LibraryError: If the file cannot be written, or cannot be put back.
    """
    if path.is_symlink() or not isinstance(data, bytes):
        raise LibraryError(DRIVE_NOT_WRITTEN)
    existed = path.is_file()
    before = path.read_bytes() if existed else None
    try:
        _replace(path, data)
    except OSError as exc:
        try:
            _put_back(path, existed, before, folder, folder_created)
        except OSError as restore_error:
            raise LibraryError(DRIVE_NOT_RESTORED) from restore_error
        raise LibraryError(DRIVE_NOT_WRITTEN) from exc


def _replace(path: Path, data: bytes) -> None:
    """Replace a drive file the same way crate sync does.

    Args:
        path: Destination file.
        data: Full file bytes.
    """
    drive_crates._replace(path, data)


def _put_back(
    path: Path,
    existed: bool,
    before: bytes | None,
    folder: Path,
    folder_created: bool,
) -> None:
    """Restore one ``.scrate`` after a failed replace.

    Args:
        path: File this write was changing.
        existed: True when the file was already there.
        before: Bytes from before the write.
        folder: ``SmartCrates`` directory.
        folder_created: True when this write created ``folder``.

    Raises:
        OSError: If the file cannot be put back.
    """
    temporary = path.with_suffix(path.suffix + ".cratecraft-tmp")
    if temporary.is_symlink() or path.is_symlink():
        raise OSError("Refusing to restore a shortcut.")
    if temporary.exists():
        temporary.unlink()
    if existed:
        if before is None:
            raise OSError("The earlier crate bytes are missing.")
        if not path.is_file() or path.read_bytes() != before:
            path.write_bytes(before)
    elif path.is_file():
        path.unlink()
    if folder_created and folder.is_dir() and not folder.is_symlink() and not any(folder.iterdir()):
        folder.rmdir()


def _file_bytes(rules: bytes | None, paths: list[str]) -> bytes:
    """Encode a smart-crate file.

    Args:
        rules: ``rart``, ``rlut``, and ``rurt`` bytes, or None when the file
            is a snapshot only.
        paths: ``ptrk`` values.

    Returns:
        Version, optional rules, then one ``otrk`` per path.
    """
    parts = [drive_crates._text("vrsn", SMART_VERSION)]
    if rules:
        parts.append(rules)
    for path in paths:
        parts.append(drive_crates._chunk("otrk", drive_crates._text("ptrk", path)))
    return b"".join(parts)


def _encode_rules(parsed: Mapping[str, object] | None) -> bytes | None:
    """Encode a native rules blob, or None when any rule cannot travel.

    Args:
        parsed: Parsed ``smart_crate_rules.rules`` object.

    Returns:
        Rule bytes with no version and no tracks, or None. An empty rule
        list is None so restore does not build an empty smart crate.
    """
    if parsed is None:
        return None
    raw = parsed.get("rules")
    if not isinstance(raw, list) or not raw:
        return None
    conjunction = parsed.get("conjunction")
    if conjunction not in {"AND", "OR"}:
        return None
    live = parsed.get("live_updates", True)
    if not isinstance(live, bool):
        return None
    chunks: list[bytes] = []
    for item in raw:
        encoded = _encode_leaf(item)
        if encoded is None:
            return None
        chunks.append(encoded)
    head = drive_crates._chunk("rart", _bool_chunk(conjunction == "AND"))
    head += drive_crates._chunk("rlut", _bool_chunk(live))
    return head + b"".join(chunks)


def _encode_leaf(item: object) -> bytes | None:
    """Encode one native leaf as ``rurt``, or None when it cannot travel.

    Args:
        item: One rule object.

    Returns:
        The ``rurt`` record, or None.
    """
    if not isinstance(item, Mapping) or "attribute" not in item:
        return None
    attribute = item.get("attribute")
    operation = item.get("operation")
    if not isinstance(attribute, str) or not isinstance(operation, str):
        return None
    field = _ATTR_FIELD.get(attribute)
    if field is None:
        return None
    if attribute in smart_rules.STRING_ATTRS and attribute != "type":
        value = item.get("value")
        comparison = _STRING_CMP.get(operation)
        if comparison is None or not isinstance(value, str):
            return None
        body = _uint_chunk("urkt", field) + drive_crates._text("trft", comparison) + drive_crates._text("trpt", value)
    elif attribute == "bpm":
        value = item.get("value")
        comparison = _UINT_CMP.get(operation)
        if comparison is None or isinstance(value, bool) or not isinstance(value, int) or value < 0:
            return None
        body = _uint_chunk("urkt", field) + drive_crates._text("trft", comparison) + _uint_chunk("urpt", value)
    elif attribute == "time_added":
        value = item.get("partial_date")
        comparison = _TIME_CMP.get(operation)
        if comparison is None or isinstance(value, bool) or not isinstance(value, int):
            return None
        body = _uint_chunk("urkt", field) + drive_crates._text("trft", comparison) + drive_crates._text("trtt", str(value))
    else:
        return None
    return drive_crates._chunk("rurt", body)


def _decode_rule(payload: bytes) -> dict[str, object] | None:
    """Decode one ``rurt`` into a native leaf.

    Args:
        payload: Nested records.

    Returns:
        The leaf, or None when the field, comparison, or value does not map.
    """
    field: int | None = None
    comparison: str | None = None
    values: dict[str, bytes] = {}
    for tag, inner in _records(payload):
        if tag == "urkt":
            if len(inner) != 4:
                return None
            field = struct.unpack(">I", inner)[0]
        elif tag == "trft":
            comparison = _decode_text(inner)
        elif tag in {"trpt", "urpt", "trtt"}:
            if tag in values:
                return None
            values[tag] = inner
    if field is None or not comparison or len(values) != 1:
        return None
    attribute = _FIELD_ATTR.get(field)
    if attribute is None:
        return None
    kind = _value_kind(attribute)
    tag, raw = next(iter(values.items()))
    if kind == "STRING":
        operation = _CMP_STRING.get(comparison)
        text = _decode_text(raw) if tag == "trpt" else None
        if operation is None or text is None:
            return None
        return _leaf("STRING", attribute, operation, text)
    if kind == "UINT32":
        operation = _CMP_UINT.get(comparison)
        if operation is None or tag != "urpt" or len(raw) != 4:
            return None
        return _leaf("UINT32", attribute, operation, struct.unpack(">I", raw)[0])
    operation = _CMP_TIME.get(comparison)
    text = _decode_text(raw) if tag == "trtt" else None
    if operation is None or text is None or not text.isdigit():
        return None
    return {
        "type": "TIME",
        "attribute": attribute,
        "operation": operation,
        "version": 1,
        "partial_date": int(text),
    }


def _leaf(kind: str, attribute: str, operation: str, value: object) -> dict[str, object]:
    """Build one native rule leaf.

    Args:
        kind: ``STRING`` or ``UINT32``.
        attribute: Native attribute name.
        operation: Native operation.
        value: String or integer value.

    Returns:
        The leaf dict.
    """
    return {
        "type": kind,
        "attribute": attribute,
        "operation": operation,
        "version": 1,
        "value": value,
    }


def _value_kind(attribute: str) -> str:
    """Return the native value kind for one travelling attribute.

    Args:
        attribute: Native attribute name.

    Returns:
        ``STRING``, ``UINT32``, or ``TIME``.
    """
    if attribute == "bpm":
        return "UINT32"
    if attribute == "time_added":
        return "TIME"
    return "STRING"


def _blob(space: str, item: Mapping[str, object]) -> dict[str, object]:
    """Wrap decoded rules in the destination space.

    Args:
        space: Space name stored on the blob.
        item: Parsed drive file whose mode is ``smart``.

    Returns:
        The object written to ``smart_crate_rules.rules``.
    """
    rules = item.get("rules")
    leaves = [dict(rule) for rule in rules if isinstance(rule, Mapping)] if isinstance(rules, list) else []
    conjunction = item.get("conjunction")
    live = item.get("live_updates")
    return {
        "spaces": [space],
        "conjunction": conjunction if conjunction in {"AND", "OR"} else "AND",
        "live_updates": True if not isinstance(live, bool) else live,
        "rules": leaves,
    }


def _same_rules(conn: sqlite3.Connection, crate_id: int, blob: Mapping[str, object]) -> bool:
    """Return whether a smart crate already stores these rules.

    Args:
        conn: Open connection.
        crate_id: Smart crate id.
        blob: Rules that would be written.

    Returns:
        True when conjunction, live update, spaces, and leaves match.
    """
    row = conn.execute(
        "SELECT rules FROM smart_crate_rules WHERE container_id = ?",
        (crate_id,),
    ).fetchone()
    if row is None:
        return False
    stored = smart_rules.parse_rules(row[0])
    if stored is None:
        return False
    return _rule_key(stored) == _rule_key(blob)


def _rule_key(blob: Mapping[str, object]) -> tuple[object, ...]:
    """Return the rule fields that decide an overwrite.

    Args:
        blob: Native rules object.

    Returns:
        Conjunction, live update, spaces, and leaves.
    """
    spaces = blob.get("spaces")
    return (
        blob.get("conjunction"),
        blob.get("live_updates", True),
        tuple(spaces) if isinstance(spaces, list) else (),
        _json_rules(blob.get("rules")),
    )


def _json_rules(rules: object) -> tuple[tuple[tuple[str, object], ...], ...]:
    """Freeze rule leaves so two blobs can be compared.

    Args:
        rules: Leaf list.

    Returns:
        One tuple of sorted items per leaf.
    """
    if not isinstance(rules, list):
        return ()
    frozen: list[tuple[tuple[str, object], ...]] = []
    for item in rules:
        if isinstance(item, Mapping):
            frozen.append(tuple(sorted((str(key), value) for key, value in item.items())))
    return tuple(frozen)


def _snapshot_paths(
    conn: sqlite3.Connection,
    space: str,
    parsed: Mapping[str, object],
    volume: volumes.Volume,
) -> list[str]:
    """List snapshot paths for the tracks a rules blob matches now.

    Args:
        conn: Open connection.
        space: Space name.
        parsed: Native rules object.
        volume: Drive. A track on that drive is stored relative to it.

    Returns:
        ``ptrk`` values. Empty portable ids are left out.
    """
    paths: list[str] = []
    seen: set[str] = set()
    portable = _portable_map(conn, space)
    for asset_id in smart_rules.asset_ids(conn, space, parsed):
        stored = portable.get(asset_id, "")
        if not stored or stored in seen:
            continue
        seen.add(stored)
        relative = drive_crates._relative(stored, volume)
        paths.append(relative or stored)
    return paths


def _portable_map(conn: sqlite3.Connection, space: str) -> dict[int, str]:
    """Map asset ids in one space to their stored portable ids.

    Args:
        conn: Open connection.
        space: Space name.

    Returns:
        Asset id to portable id. A null id becomes an empty string.
    """
    rows = conn.execute(
        """
        SELECT a.id, a.portable_id
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        """,
        (space,),
    )
    return {int(row[0]): str(row[1] or "") for row in rows}


def _assets(conn: sqlite3.Connection, space: str) -> list[tuple[int, str]]:
    """List destination tracks used to match a snapshot.

    Args:
        conn: Open connection.
        space: Space name.

    Returns:
        ``(asset id, portable id)`` rows.
    """
    return list(_portable_map(conn, space).items())


def _match_paths(paths: Sequence[str], assets: Sequence[tuple[int, str]], volume: volumes.Volume) -> list[int]:
    """Match snapshot paths to destination tracks, once each.

    Args:
        paths: ``ptrk`` values from the drive.
        assets: Destination tracks.
        volume: Drive root used when the stored path is relative.

    Returns:
        Asset ids in file order.
    """
    matched: list[int] = []
    used: set[int] = set()
    for path in paths:
        asset_id = _match_id(path, assets, volume, used)
        if asset_id is None:
            continue
        used.add(asset_id)
        matched.append(asset_id)
    return matched


def _match_id(
    stored: str,
    assets: Sequence[tuple[int, str]],
    volume: volumes.Volume,
    used: set[int],
) -> int | None:
    """Find one destination track for a snapshot path.

    Args:
        stored: ``ptrk`` text.
        assets: Destination tracks.
        volume: Drive root.
        used: Asset ids already matched.

    Returns:
        The asset id, or None. An exact portable id wins, then the drive
        root joined to the relative path, then a casefolded suffix.
    """
    if not stored:
        return None
    forward = stored.replace("\\", "/")
    folded_stored = forward.casefold()
    root = volume.root.replace("\\", "/").rstrip("/")
    joined = (root + "/" + forward).casefold()
    exact: int | None = None
    joined_hit: int | None = None
    suffix: int | None = None
    for asset_id, portable in assets:
        if asset_id in used or not portable:
            continue
        normal = portable.replace("\\", "/")
        if portable == stored or normal == forward:
            exact = asset_id
            break
        folded = normal.casefold()
        if folded == joined and joined_hit is None:
            joined_hit = asset_id
        elif suffix is None and (
            folded == folded_stored or folded.endswith("/" + folded_stored) or folded_stored.endswith("/" + folded)
        ):
            suffix = asset_id
    if exact is not None:
        return exact
    if joined_hit is not None:
        return joined_hit
    return suffix


def _type2_rows(conn: sqlite3.Connection, space: str, crate_id: int | None) -> list[sqlite3.Row]:
    """List type-2 crates to copy.

    Args:
        conn: Open connection.
        space: Space name.
        crate_id: One id, or None for every smart crate.

    Returns:
        Rows with id, name, and rules. A requested crate that is not type 2
        yields an empty list.
    """
    if crate_id is None:
        return list(
            conn.execute(
                """
                SELECT c.id, c.name, r.rules
                FROM container c
                JOIN space s ON s.id = c.space_id
                LEFT JOIN smart_crate_rules r ON r.container_id = c.id
                WHERE s.name = ? AND c.type = 2
                ORDER BY c.list_order, c.id
                """,
                (space,),
            )
        )
    return list(
        conn.execute(
            """
            SELECT c.id, c.name, r.rules
            FROM container c
            JOIN space s ON s.id = c.space_id
            LEFT JOIN smart_crate_rules r ON r.container_id = c.id
            WHERE s.name = ? AND c.type = 2 AND c.id = ?
            """,
            (space, crate_id),
        )
    )


def _locate(
    conn: sqlite3.Connection,
    space: str,
    parents: list[str],
    name: str,
) -> tuple[int | None, int | None] | str:
    """Find a crate by its parent names and leaf.

    Args:
        conn: Open connection.
        space: Space name.
        parents: Parent display names from the root down.
        name: Leaf name.

    Returns:
        ``blocked`` when a parent is a smart crate. Otherwise the crate id
        and type, or ``(None, None)`` when the leaf is absent. A missing
        parent means the leaf is absent too.
    """
    parent = library._space_root(conn, space)
    for part in parents:
        if library._find_child(conn, parent, part, 2) is not None:
            return "blocked"
        found = library._find_child(conn, parent, part, 1)
        if found is None:
            return None, None
        parent = found
    smart = library._find_child(conn, parent, name, 2)
    if smart is not None:
        return smart, 2
    normal = library._find_child(conn, parent, name, 1)
    if normal is not None:
        return normal, 1
    return None, None


def _ensure_parents(conn: sqlite3.Connection, space: str, parents: list[str]) -> int | None:
    """Create missing parent crates as normal crates.

    Args:
        conn: Open write connection.
        space: Space name.
        parents: Parent display names.

    Returns:
        The parent id for the leaf, or None when a parent is a smart crate.
    """
    parent = library._space_root(conn, space)
    for part in parents:
        if library._find_child(conn, parent, part, 2) is not None:
            return None
        found = library._find_child(conn, parent, part, 1)
        if found is None:
            made = library._create_crate(conn, space, parent, part, False, None)
            parent = int(made["id"])
        else:
            parent = found
    return parent


def _replace_members(conn: sqlite3.Connection, space: str, crate_id: int, wanted: list[int]) -> None:
    """Make a normal crate hold exactly these tracks, in this order.

    Args:
        conn: Open write connection.
        space: Space name.
        crate_id: Normal crate id.
        wanted: Asset ids.
    """
    current = _members(conn, crate_id)
    for asset_id in current:
        library._membership(conn, crate_id, asset_id, space, False)
    for asset_id in wanted:
        library._membership(conn, crate_id, asset_id, space, True)


def _members(conn: sqlite3.Connection, crate_id: int) -> list[int]:
    """List tracks in one crate, in crate order.

    Args:
        conn: Open connection.
        crate_id: Container id.

    Returns:
        Asset ids.
    """
    return [
        int(row[0])
        for row in conn.execute(
            """
            SELECT ca.asset_id FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            WHERE lc.container_id = ?
            ORDER BY ca.list_order, ca.id
            """,
            (crate_id,),
        )
    ]


def _expect_smart(session: safe_write.Session, crate_id: int, blob: Mapping[str, object]) -> None:
    """Register a check that the crate is a memberless smart crate.

    Args:
        session: Open write session.
        crate_id: Container id.
        blob: Rules that must be stored.
    """
    wanted = _rule_key(blob)

    def check(copied: sqlite3.Connection) -> None:
        """Fail when the saved smart crate does not match the file.

        Args:
            copied: Read-only connection to the temporary database copy.

        Raises:
            VerifyMismatch: If type, filename, rules, or members differ.
        """
        row = copied.execute("SELECT type FROM container WHERE id = ?", (crate_id,)).fetchone()
        if row is None or int(row[0]) != 2:
            raise safe_write.VerifyMismatch("The smart crate type does not match.")
        filename = copied.execute(
            "SELECT filename FROM dj_container_metadata WHERE container_id = ?",
            (crate_id,),
        ).fetchone()
        if filename is None or not str(filename[0]).endswith(".scrate"):
            raise safe_write.VerifyMismatch("A smart crate must use a .scrate file.")
        stored = copied.execute(
            "SELECT rules FROM smart_crate_rules WHERE container_id = ?",
            (crate_id,),
        ).fetchone()
        parsed = smart_rules.parse_rules(stored[0]) if stored is not None else None
        if parsed is None or _rule_key(parsed) != wanted:
            raise safe_write.VerifyMismatch("The smart crate rules do not match.")
        if _members(copied, crate_id):
            raise safe_write.VerifyMismatch("A smart crate must not store members.")

    session.check(check)


def _expect_members(session: safe_write.Session, crate_id: int, wanted: tuple[int, ...]) -> None:
    """Register a check that a normal crate holds exactly these tracks.

    Args:
        session: Open write session.
        crate_id: Container id.
        wanted: Asset ids in crate order.
    """

    def check(copied: sqlite3.Connection) -> None:
        """Fail when the saved crate has different tracks.

        Args:
            copied: Read-only connection to the temporary database copy.

        Raises:
            VerifyMismatch: If a track is missing or extra.
        """
        if _members(copied, crate_id) != list(wanted):
            raise safe_write.VerifyMismatch("The restored crate does not hold the snapshot tracks.")

    session.check(check)


def _records(data: bytes) -> list[tuple[str, bytes]]:
    """Split Serato TLV records.

    Args:
        data: Tag, big-endian length, payload, repeated.

    Returns:
        Tag and payload pairs. A short or non-ASCII tag stops the parse.
    """
    found: list[tuple[str, bytes]] = []
    index = 0
    size = len(data)
    while index + 8 <= size:
        raw = data[index : index + 4]
        try:
            tag = raw.decode("ascii")
        except UnicodeError:
            break
        if len(tag) != 4 or not tag.isascii():
            break
        length = struct.unpack(">I", data[index + 4 : index + 8])[0]
        index += 8
        if length < 0 or index + length > size:
            break
        found.append((tag, data[index : index + length]))
        index += length
    return found


def _decode_text(payload: bytes) -> str | None:
    """Decode UTF-16BE text.

    Args:
        payload: Text bytes without a BOM.

    Returns:
        The text, or None when the byte length is odd or the text is not
        UTF-16. A trailing NUL is removed.
    """
    if len(payload) % 2:
        return None
    try:
        text = payload.decode("utf-16-be")
    except UnicodeError:
        return None
    return text.rstrip("\x00")


def _nested_bool(payload: bytes) -> bool | None:
    """Read a ``brut`` flag inside ``rart`` or ``rlut``.

    Args:
        payload: Nested records.

    Returns:
        The flag. A missing ``brut`` is True. An ill-formed ``brut`` is None.
    """
    found: bool | None = None
    for tag, inner in _records(payload):
        if tag != "brut":
            continue
        if len(inner) != 1 or inner[0] not in (0, 1):
            return None
        found = inner[0] == 1
    if found is None:
        return True
    return found


def _bool_chunk(value: bool) -> bytes:
    """Encode a one-byte ``brut`` record.

    Args:
        value: Flag.

    Returns:
        The record.
    """
    return drive_crates._chunk("brut", bytes([1 if value else 0]))


def _uint_chunk(tag: str, value: int) -> bytes:
    """Encode a big-endian uint32 record.

    Args:
        tag: Four-character tag.
        value: Unsigned value.

    Returns:
        The record.
    """
    return drive_crates._chunk(tag, struct.pack(">I", value & 0xFFFFFFFF))


def _safe_scrate_name(filename: str) -> str:
    """Return a smart-crate file name that stays inside ``SmartCrates``.

    Args:
        filename: Base name such as ``Warmup.scrate`` or ``A%%B.scrate``.

    Returns:
        The base name.

    Raises:
        ValueError: If the name is empty, has a slash, or a piece is a path.
    """
    base = filename.replace("\\", "/").split("/")[-1]
    if not base.casefold().endswith(".scrate"):
        raise ValueError(base)
    stem = base[:-7]
    if not stem or "/" in stem or "\\" in stem or "\0" in stem:
        raise ValueError(base)
    for piece in stem.split("%%"):
        if not piece or piece in {".", ".."} or piece.endswith(" ") or piece.endswith("."):
            raise ValueError(base)
    return base


def _parents(item: Mapping[str, object]) -> list[str]:
    """Return parent names from a parsed file.

    Args:
        item: Drive file row.

    Returns:
        Parent display names. A bad value becomes an empty list.
    """
    raw = item.get("parents")
    if not isinstance(raw, list):
        return []
    return [part for part in raw if isinstance(part, str)]


def _ids(value: object) -> list[int]:
    """Return integer ids from a row field.

    Args:
        value: List stored on a restore row.

    Returns:
        The ids. Anything else is an empty list.
    """
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, int) and not isinstance(item, bool)]


def _optional_crate(value: object) -> int | None:
    """Read an optional crate id.

    Args:
        value: Request field. None means every smart crate.

    Returns:
        The id, or None.

    Raises:
        LibraryError: If the value is present and not a positive integer.
    """
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise LibraryError("That request is not valid.")
    return value


def _flag(value: object) -> bool:
    """Read an optional boolean.

    Args:
        value: Request field. None is false.

    Returns:
        The flag.

    Raises:
        LibraryError: If the value is present and not a boolean.
    """
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    raise LibraryError("That request is not valid.")


def _crate_row(
    name: str,
    status: str,
    *,
    path: str | None = None,
    rules: bool = False,
    tracks: int = 0,
    detail: str = "",
    data: bytes | None = None,
) -> dict[str, object]:
    """Build one copy row.

    Args:
        name: Visible crate name.
        status: ``written``, ``kept``, ``refused``, or ``skipped``.
        path: Drive file, when there is one.
        rules: True when the file holds rebuildable rules.
        tracks: Snapshot path count.
        detail: Sentence for the page.
        data: File bytes when this row will be written.

    Returns:
        The row.
    """
    row: dict[str, object] = {
        "name": name,
        "status": status,
        "path": path,
        "rules": rules,
        "tracks": tracks,
        "detail": detail,
    }
    if data is not None:
        row["data"] = data
    return row


def _restore_row(
    name: str,
    mode: str,
    status: str,
    tracks: int,
    matched: list[int],
    detail: str,
) -> dict[str, object]:
    """Build one restore row.

    Args:
        name: Visible crate name.
        mode: ``smart`` or ``fallback``.
        status: ``create``, ``update``, ``needs_confirm``, ``skip``, or
            ``nothing``.
        tracks: Snapshot path count.
        matched: Destination asset ids.
        detail: Sentence for the page.

    Returns:
        The row. ``matched_ids`` is for the writer and is not required by
        the page.
    """
    return {
        "name": name,
        "mode": mode,
        "status": status,
        "tracks": tracks,
        "matched": len(matched),
        "matched_ids": matched,
        "detail": detail,
    }


def _envelope(
    kind: str,
    root: Path,
    *,
    crates: list[dict[str, object]] | None = None,
    preview: bool = False,
    written: bool = False,
    needs_overwrite: bool = False,
    needs_confirm: bool = False,
    snapshot_id: str | None = None,
) -> dict[str, object]:
    """Build a successful action result.

    Args:
        kind: ``copy``, ``preview``, or ``restore``.
        root: Drive root. An empty path leaves ``drive`` empty.
        crates: Per-crate rows. File bytes are removed.
        preview: True when nothing was eligible to be written.
        written: True when a file or a library row changed.
        needs_overwrite: True when a drive file was kept.
        needs_confirm: True when a library crate was left for confirm.
        snapshot_id: Preimage id after a write.

    Returns:
        The result dict.
    """
    public: list[dict[str, object]] = []
    for item in crates or []:
        public.append({key: value for key, value in item.items() if key not in {"data", "matched_ids"}})
    return {
        "ok": True,
        "action": kind,
        "written": written,
        "preview": preview,
        "status": "ok",
        "drive": "" if str(root) == "." else str(root),
        "needs_overwrite": needs_overwrite,
        "needs_confirm": needs_confirm,
        "snapshot_id": snapshot_id,
        "crates": public,
        "detail": "",
    }


def _stopped(status: str, detail: str) -> dict[str, object]:
    """Build a result that did not open or change the library.

    Args:
        status: ``not_connected``, ``no_library``, or ``refused``.
        detail: Sentence for the page.

    Returns:
        A result with no crates and ``written`` false.
    """
    return {
        "ok": False,
        "action": "",
        "written": False,
        "preview": False,
        "status": status,
        "drive": "",
        "needs_overwrite": False,
        "needs_confirm": False,
        "snapshot_id": None,
        "crates": [],
        "detail": detail,
    }
