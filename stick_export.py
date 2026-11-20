"""Snapshot a USB stick before a crate overwrite, and refuse a foreign library.

``drive_crates.sync_volume`` calls this module before it replaces a crate
file. The library that last wrote a volume is remembered in
``stick-exports.json`` beside settings, never inside ``_Serato_`` and never
beside ``master.sqlite``. A volume that already has crate files, and whose
remembered library id is missing or different, is refused until the caller
passes confirm. Confirm copies those crate files into ``stick-snapshots/``
first. If that copy fails, nothing on the stick is changed.

``skip_reason`` is the only skip decision. Preview and the post-write
verify both call it. An unmounted volume is ``not_connected``. It is not a
missing file.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import time
from dataclasses import dataclass
from pathlib import Path

import app_config
import volumes

EXPORTS_NAME = "stick-exports.json"
SNAPSHOT_DIR = "stick-snapshots"
REFUSED_DETAIL = (
    "{name} already has Serato crates from another library. "
    "Nothing was written. Confirm to snapshot that stick, then write."
)
SNAPSHOT_FAILED = "{name} was not changed. The stick snapshot could not be saved."


@dataclass(frozen=True, slots=True)
class SkipFacts:
    """What preview and verify know about one stick item.

    Attributes:
        mounted: False when the volume root is not a directory.
        has_serato: True when ``_Serato_`` is a real directory.
        serato_symlink: True when ``_Serato_`` is a shortcut.
        name_ok: False when the crate name cannot be a file name.
        crate_symlink: True when the crate path is a shortcut.
        has_crates: True when the stick already has a crate file.
        foreign: True when those crates are not this library's export.
        confirm: True when the caller accepted a foreign stick.
        overwrite: True when an existing crate file may be replaced.
        crate_exists: True when the named crate file is already there.
        on_volume: False when the track path is not on this volume.
        cues: True when this item is a cue comparison, not a crate write.
        library_file: False when the library audio file is not on disk.
        stick_file: False when the stick has no file of that name.
        same_file: True when both paths are the same file.
        slot_filled: True when the library already has that cue index.
        stick_only: True when the cue is on the stick.
        writable: False when the library file cannot take an empty slot.
    """

    mounted: bool = True
    has_serato: bool = True
    serato_symlink: bool = False
    name_ok: bool = True
    crate_symlink: bool = False
    has_crates: bool = False
    foreign: bool = False
    confirm: bool = False
    overwrite: bool = False
    crate_exists: bool = False
    on_volume: bool = True
    cues: bool = False
    library_file: bool = True
    stick_file: bool = True
    same_file: bool = False
    slot_filled: bool = False
    stick_only: bool = True
    writable: bool = True


def skip_reason(facts: SkipFacts) -> str | None:
    """Return why this item is left unchanged, or None when it may be written.

    Preview and the post-write verify both call this function. An unmounted
    volume is ``not_connected``. That code is never ``missing``.

    Args:
        facts: Observations the caller already made. This function does not
            read the disk and does not write.

    Returns:
        A stable skip code, or None when the item is not skipped.
    """
    if not facts.mounted:
        return "not_connected"
    if facts.cues:
        if not facts.library_file:
            return "library_file_missing"
        if not facts.stick_file:
            return "stick_file_missing"
        if facts.same_file:
            return "same_file"
        if not facts.stick_only:
            return "not_stick_only"
        if facts.slot_filled:
            return "slot_filled"
        if not facts.writable:
            return "unsupported"
        return None
    if facts.serato_symlink or facts.crate_symlink or not facts.has_serato:
        return "no_library"
    if not facts.name_ok:
        return "bad_name"
    if facts.foreign and not facts.confirm:
        return "different_library"
    if not facts.on_volume:
        return "not_on_volume"
    if facts.crate_exists and not facts.overwrite:
        return "kept"
    return None


def library_id() -> str:
    """Return a stable id for the open master library.

    Returns:
        The SHA-256 hex digest of the resolved ``library.MASTER`` path.
        The database is not opened. A missing file still has an id.
    """
    import library

    path = Path(library.MASTER)
    try:
        key = str(path.resolve())
    except OSError:
        key = str(path)
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def exports_path() -> Path:
    """Return the stick-export memory file beside settings.

    Returns:
        ``stick-exports.json`` inside the app config directory. The file
        is not created. It is not inside a ``_Serato_`` folder.
    """
    return app_config.config_dir() / EXPORTS_NAME


def remembered_id(volume: volumes.Volume) -> str | None:
    """Return the library id last written to this volume, if any.

    Args:
        volume: Drive whose root is the memory key.

    Returns:
        The stored hex id, or None when this volume has no memory. A
        damaged file is treated as empty. Nothing is written.
    """
    payload = _load_exports()
    volumes_map = payload.get("volumes")
    if not isinstance(volumes_map, dict):
        return None
    row = volumes_map.get(volume.root)
    if not isinstance(row, dict):
        return None
    stored = row.get("library_id")
    if not isinstance(stored, str) or not stored:
        return None
    return stored


def remember_library(volume: volumes.Volume) -> None:
    """Remember that the open library wrote this volume.

    Args:
        volume: Drive that was just written.

    The stick is not opened. The file lives beside settings.
    """
    payload = _load_exports()
    volumes_map = payload.get("volumes")
    if not isinstance(volumes_map, dict):
        volumes_map = {}
    volumes_map[volume.root] = {"library_id": library_id()}
    payload = {"version": 1, "volumes": volumes_map}
    _save_exports(payload)


def facts_for(
    volume: volumes.Volume,
    crate_name: str,
    *,
    overwrite: bool,
    confirm: bool,
    path: str | None = None,
) -> SkipFacts:
    """Observe one volume for ``skip_reason``. Nothing is written.

    Args:
        volume: Drive root. A missing directory is not connected.
        crate_name: Visible crate name.
        overwrite: True when an existing crate file may be replaced.
        confirm: True when a foreign stick may be snapshotted and written.
        path: Track path. None means the item is the volume itself.

    Returns:
        Facts for :func:`skip_reason`. Cue fields stay at their defaults.
    """
    root = Path(volume.root)
    mounted = root.is_dir()
    serato = root / "_Serato_"
    serato_symlink = mounted and serato.is_symlink()
    has_serato = mounted and serato.is_dir() and not serato_symlink
    name_ok = _name_ok(crate_name)
    crate_symlink = False
    crate_exists = False
    has_crates = False
    if has_serato and name_ok:
        crate = serato / "Subcrates" / _crate_filename(crate_name)
        crate_symlink = crate.is_symlink()
        crate_exists = crate.is_file() and not crate_symlink
        has_crates = bool(_crate_files(serato))
    current = library_id()
    stored = remembered_id(volume) if mounted else None
    foreign = has_crates and stored != current
    on_volume = True if path is None else _on_volume(path, volume)
    return SkipFacts(
        mounted=mounted,
        has_serato=has_serato,
        serato_symlink=serato_symlink,
        name_ok=name_ok,
        crate_symlink=crate_symlink,
        has_crates=has_crates,
        foreign=foreign,
        confirm=confirm,
        overwrite=overwrite,
        crate_exists=crate_exists,
        on_volume=on_volume,
    )


def plan_drive(
    volume: volumes.Volume,
    paths: list[str],
    crate_name: str,
    *,
    overwrite: bool,
    confirm: bool,
) -> dict[str, object]:
    """List skip codes for a drive write. Read-only.

    Preview calls this before a write. Verify calls it again afterwards.
    Both go through :func:`skip_reason`.

    Args:
        volume: Drive root.
        paths: Track paths that would be added or removed.
        crate_name: Visible crate name.
        overwrite: True when an existing crate file may be replaced.
        confirm: True when a foreign stick may be written.

    Returns:
        ``status`` is the volume skip code or ``ready``. ``skips`` is one
        row per path. An unmounted volume is ``not_connected``, not
        ``missing``. Nothing is written.
    """
    facts = facts_for(volume, crate_name, overwrite=overwrite, confirm=confirm)
    status = skip_reason(facts) or "ready"
    rows: list[dict[str, object]] = []
    for path in paths:
        row_facts = facts_for(
            volume,
            crate_name,
            overwrite=overwrite,
            confirm=confirm,
            path=path,
        )
        rows.append({"path": path, "skip": skip_reason(row_facts)})
    return {"status": status, "skips": rows, "snapshot": _needs_snapshot(facts, status)}


def verify_drive(
    volume: volumes.Volume,
    paths: list[str],
    crate_name: str,
    *,
    overwrite: bool,
    confirm: bool,
) -> dict[str, object]:
    """Return the skip list after a write, using the preview rules.

    Args:
        volume: Drive root.
        paths: Track paths from the write.
        crate_name: Visible crate name.
        overwrite: True when an existing crate file may be replaced.
        confirm: True when a foreign stick may be written.

    Returns:
        The same object as :func:`plan_drive`. Nothing is written.
    """
    return plan_drive(
        volume,
        paths,
        crate_name,
        overwrite=overwrite,
        confirm=confirm,
    )


def snapshot_volume(volume: volumes.Volume) -> Path:
    """Copy this volume's crate files into the app data folder.

    Args:
        volume: Drive whose ``_Serato_`` crate files are copied.

    Returns:
        The new snapshot directory. It is not on the stick.

    Raises:
        OSError: If a file cannot be copied. A partial snapshot is removed.
            The stick is not modified by this function.
    """
    root = Path(volume.root)
    serato = root / "_Serato_"
    stamp = time.strftime("%Y%m%d-%H%M%S")
    token = hashlib.sha256(f"{volume.root}:{time.time_ns()}".encode("utf-8")).hexdigest()[:8]
    safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in volume.name)[:40] or "stick"
    destination = app_config.config_dir() / SNAPSHOT_DIR / f"{safe}-{stamp}-{token}"
    resolved = destination.resolve()
    try:
        stick = root.resolve()
    except OSError:
        stick = root
    if resolved == stick or stick in resolved.parents or resolved in stick.parents:
        raise OSError("The stick snapshot would be stored on the stick.")
    destination.mkdir(parents=True, exist_ok=False)
    try:
        for source in _snapshot_files(serato):
            relative = source.relative_to(root)
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            if target.read_bytes() != source.read_bytes():
                raise OSError("The stick snapshot does not match the stick.")
        manifest = {
            "version": 1,
            "volume": volume.name,
            "library_id": library_id(),
        }
        (destination / "manifest.json").write_text(
            json.dumps(manifest, sort_keys=True),
            encoding="utf-8",
        )
    except OSError:
        shutil.rmtree(destination, ignore_errors=True)
        raise
    return destination


def _needs_snapshot(facts: SkipFacts, status: str) -> bool:
    """Return whether a write of these facts must snapshot first.

    Args:
        facts: Volume facts.
        status: Volume skip code, or ``ready``.

    Returns:
        True when crate files exist and the write is not skipped.
    """
    return status == "ready" and facts.has_crates


def _snapshot_files(serato: Path) -> list[Path]:
    """Return crate files and ``database V2`` to copy. No shortcuts.

    Args:
        serato: The volume's ``_Serato_`` directory.

    Returns:
        Regular files. A shortcut is left out. The directory is not created.
    """
    found = list(_crate_files(serato))
    database = serato / "database V2"
    if database.is_file() and not database.is_symlink():
        found.append(database)
    return found


def _crate_files(serato: Path) -> list[Path]:
    """Return ``.crate`` and ``.scrate`` files under this library.

    Args:
        serato: The volume's ``_Serato_`` directory.

    Returns:
        Regular files. Shortcuts are left out. ``database V2`` is not a
        crate file.
    """
    found: list[Path] = []
    if serato.is_symlink() or not serato.is_dir():
        return found
    for folder_name in ("Subcrates", "SmartCrates"):
        folder = serato / folder_name
        if folder.is_symlink() or not folder.is_dir():
            continue
        for dirpath, dirnames, filenames in os.walk(folder, followlinks=False):
            current = Path(dirpath)
            dirnames[:] = [
                name
                for name in dirnames
                if not (current / name).is_symlink()
            ]
            for name in filenames:
                path = current / name
                if path.is_symlink() or not path.is_file():
                    continue
                if path.suffix.lower() in {".crate", ".scrate"}:
                    found.append(path)
    return found


def _on_volume(path: str, volume: volumes.Volume) -> bool:
    """Return whether a stored path sits on this volume.

    Args:
        path: Stored track path.
        volume: Drive to test.

    Returns:
        True when the path uses this drive letter or this root prefix.
    """
    if volume.kind == "letter":
        return (
            len(path) >= 2
            and path[1] == ":"
            and path[0].upper() == volume.name[:1].upper()
        )
    normalized = path.replace("\\", "/")
    root = volume.root.replace("\\", "/").rstrip("/")
    return normalized == root or normalized.startswith(root + "/")


def _name_ok(name: str) -> bool:
    """Return whether a crate name can be one file name.

    Args:
        name: Visible crate name.

    Returns:
        False for an empty name, a slash, or a trailing dot or space.
    """
    cleaned = name.strip()
    if (
        not cleaned
        or cleaned in {".", ".."}
        or "/" in cleaned
        or "\\" in cleaned
        or "\0" in cleaned
        or cleaned.endswith(" ")
        or cleaned.endswith(".")
    ):
        return False
    return True


def _crate_filename(name: str) -> str:
    """Return ``Name.crate`` for a name :func:`_name_ok` already accepted.

    Args:
        name: Visible crate name.

    Returns:
        The file name. The disk is not touched.
    """
    return name.strip() + ".crate"


def _load_exports() -> dict[str, object]:
    """Read the stick-export memory. A missing or damaged file is empty.

    Returns:
        A dict. Nothing is written.
    """
    path = exports_path()
    try:
        if not path.is_file() or path.is_symlink():
            return {}
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return {}
    if not isinstance(payload, dict):
        return {}
    return payload


def _save_exports(payload: dict[str, object]) -> None:
    """Replace the stick-export memory beside settings.

    Args:
        payload: JSON object to store.

    Raises:
        OSError: If the file cannot be replaced.
    """
    path = exports_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".cratecraft-tmp")
    temporary.write_text(json.dumps(payload, sort_keys=True), encoding="utf-8")
    os.replace(temporary, path)
