"""Write external-drive tracks into that drive's ``_Serato_`` folder.

The master library stays the list Serato 4 and 5 display. Tracks that live
on another drive also belong in that drive's ``Subcrates`` crate and, when
Serato has already created it, in ``database V2``. This module does not
create a ``_Serato_`` folder, does not follow a shortcut to one, and does
not replace a same-named crate unless ``overwrite`` is true. A stick that
already has crates from another library is refused until confirm, and those
crate files are copied into the app data folder before the first replace.
A filesystem error while writing one drive puts that drive's files back and
returns a warning. It does not raise, so the library save can stay.
"""

from __future__ import annotations

import os
import struct
from dataclasses import dataclass
from pathlib import Path

import volumes

CRATE_VERSION = "1.0/Serato ScratchLive Crate"
DATABASE_VERSION = "2.0/Serato Scratch LIVE Database"


@dataclass(frozen=True, slots=True)
class DriveWrite:
    """One drive's result for a crate-file write.

    Attributes:
        status: ``written``, ``kept``, ``not_connected``, ``no_library``,
            ``refused``, or ``failed``. ``failed`` means the drive file
            could not be updated. The library save is left in place.
        volume: Drive name, or empty when the path is not on an external drive.
        path: Crate file that was written or left in place, or None.
        detail: Sentence for the page. Empty when nothing needs to be said.
    """

    status: str
    volume: str
    path: str | None
    detail: str


def sync_tracks(
    paths: list[str],
    crate_name: str,
    *,
    add: bool,
    overwrite: bool,
    confirm: bool = False,
) -> list[DriveWrite]:
    """Group tracks by external volume and write each drive once.

    Args:
        paths: Stored track paths.
        crate_name: Visible crate name.
        add: True adds the paths. False removes them.
        overwrite: True may change a crate file that already exists.
        confirm: True may snapshot and write a stick from another library.

    Returns:
        One result per external volume. Boot-drive paths are left out.
    """
    groups: dict[str, tuple[volumes.Volume, list[str]]] = {}
    for path in paths:
        volume = volumes.external_volume(path)
        if volume is None:
            continue
        found = groups.get(volume.root)
        if found is None:
            groups[volume.root] = (volume, [path])
        else:
            found[1].append(path)
    return [
        sync_volume(volume, grouped, crate_name, add=add, overwrite=overwrite, confirm=confirm)
        for volume, grouped in groups.values()
    ]


def planned_files(
    paths: list[str],
    crate_name: str,
    *,
    add: bool,
    overwrite: bool,
    confirm: bool = False,
) -> list[Path]:
    """Return the drive files :func:`sync_tracks` will change.

    The list is read-only. A missing crate is included so a rollback can
    delete it. A missing ``database V2`` is left out, because this write
    does not create that file. A crate that will be kept or refused is
    left out. A shortcut is left out so the snapshot does not refuse the
    library save.

    Args:
        paths: Stored track paths.
        crate_name: Visible crate name.
        add: True adds the paths. False removes them.
        overwrite: True may change a crate file that already exists.
        confirm: True may write a stick from another library.

    Returns:
        Crate files and existing ``database V2`` files, one of each per
        drive. Boot-drive paths are left out.
    """
    seen: list[Path] = []
    groups: dict[str, volumes.Volume] = {}
    for path in paths:
        volume = volumes.external_volume(path)
        if volume is None:
            continue
        groups.setdefault(volume.root, volume)
    for volume in groups.values():
        for item in _planned_volume(
            volume, crate_name, add=add, overwrite=overwrite, confirm=confirm
        ):
            if item not in seen:
                seen.append(item)
    return seen


def sync_volume(
    volume: volumes.Volume,
    paths: list[str],
    crate_name: str,
    *,
    add: bool,
    overwrite: bool,
    confirm: bool = False,
) -> DriveWrite:
    """Write one drive's crate file, or explain why it was left alone.

    A stick that already has crate files is copied into ``stick-snapshots``
    before the first replace. A different remembered library is refused
    until ``confirm`` is true. That refusal still does not write.

    Args:
        volume: Drive root. Tests pass a temporary root. Production uses
            :func:`volumes.external_volume`.
        paths: Track paths on that drive.
        crate_name: Visible crate name. Slashes are refused.
        add: True adds paths. False removes them.
        overwrite: True may change an existing crate file.
        confirm: True may snapshot and write a stick from another library.

    Returns:
        The drive result. A missing root is ``not_connected``. A root
        with no real ``_Serato_`` directory is ``no_library``. ``failed``
        when the stick snapshot cannot be saved. The stick is unchanged
        in that case.
    """
    root = Path(volume.root)
    if not root.is_dir():
        return DriveWrite(
            "not_connected",
            volume.name,
            None,
            f"{volume.name} is not connected. That drive's crate was not changed.",
        )
    serato = root / "_Serato_"
    if serato.is_symlink() or not serato.is_dir():
        return DriveWrite(
            "no_library",
            volume.name,
            None,
            f"{volume.name} has no Serato library yet, so nothing was written there.",
        )
    try:
        filename = _crate_filename(crate_name)
    except ValueError:
        return DriveWrite(
            "refused",
            volume.name,
            None,
            "That crate name cannot be a file on the drive.",
        )
    folder = serato / "Subcrates"
    crate = folder / filename
    relatives = [item for item in (_relative(path, volume) for path in paths) if item]
    if crate.is_symlink():
        return DriveWrite(
            "no_library",
            volume.name,
            None,
            f"{volume.name} has no Serato library yet, so nothing was written there.",
        )
    import stick_export

    facts = stick_export.facts_for(
        volume, crate_name, overwrite=overwrite, confirm=confirm
    )
    blocked = _from_skip(volume, crate_name, crate, stick_export.skip_reason(facts))
    if blocked is not None:
        return blocked
    if facts.has_crates:
        try:
            stick_export.snapshot_volume(volume)
        except OSError:
            return DriveWrite(
                "failed",
                volume.name,
                str(crate) if crate.exists() else None,
                stick_export.SNAPSHOT_FAILED.format(name=volume.name),
            )
    existing: list[str] = []
    if crate.is_file():
        import snapshots

        existing = snapshots.parse_serato_bytes(crate.read_bytes())
    if add:
        merged = list(existing)
        for item in relatives:
            if item not in merged:
                merged.append(item)
    else:
        drop = set(relatives)
        merged = [item for item in existing if item not in drop]
    folder_created = not folder.exists()
    database = serato / "database V2"
    database_before: bytes | None = None
    if add and database.is_file() and not database.is_symlink():
        database_before = database.read_bytes()
    crate_existed = crate.is_file() and not crate.is_symlink()
    crate_before = crate.read_bytes() if crate_existed else None
    try:
        folder.mkdir(exist_ok=True)
        _replace(crate, _crate_bytes(merged))
        if add:
            _append_database(serato, relatives)
    except OSError:
        try:
            _put_drive_back(
                crate,
                crate_existed,
                crate_before,
                database,
                database_before,
                folder,
                folder_created,
            )
        except OSError:
            return DriveWrite(
                "failed",
                volume.name,
                str(crate) if crate.exists() else None,
                f"{volume.name} could not be updated. The Serato library was saved. "
                "That drive's crate file could not be put back.",
            )
        return DriveWrite(
            "failed",
            volume.name,
            str(crate) if crate_existed else None,
            f"{volume.name} could not be updated. The Serato library was saved, "
            "and that drive was left as it was.",
        )
    try:
        stick_export.remember_library(volume)
    except OSError:
        pass
    return DriveWrite("written", volume.name, str(crate), "")


def _from_skip(
    volume: volumes.Volume,
    crate_name: str,
    crate: Path,
    reason: str | None,
) -> DriveWrite | None:
    """Turn one skip code into a drive result that does not write.

    Args:
        volume: Drive being checked.
        crate_name: Visible crate name.
        crate: Crate path that would have been written.
        reason: Code from :func:`stick_export.skip_reason`. None means write.

    Returns:
        A result that leaves the stick as it was, or None when the write
        may continue. ``not_connected`` is never reported as a missing file.
    """
    import stick_export

    if reason is None:
        return None
    if reason == "kept":
        return DriveWrite(
            "kept",
            volume.name,
            str(crate),
            f"{volume.name} already has a crate named {crate_name}, and overwrite is off, so that crate was left as it was.",
        )
    if reason == "not_connected":
        return DriveWrite(
            "not_connected",
            volume.name,
            None,
            f"{volume.name} is not connected. That drive's crate was not changed.",
        )
    if reason == "no_library":
        return DriveWrite(
            "no_library",
            volume.name,
            None,
            f"{volume.name} has no Serato library yet, so nothing was written there.",
        )
    if reason == "bad_name":
        return DriveWrite(
            "refused",
            volume.name,
            None,
            "That crate name cannot be a file on the drive.",
        )
    if reason == "different_library":
        return DriveWrite(
            "refused",
            volume.name,
            str(crate) if crate.exists() else None,
            stick_export.REFUSED_DETAIL.format(name=volume.name),
        )
    return DriveWrite(
        "refused",
        volume.name,
        None,
        stick_export.REFUSED_DETAIL.format(name=volume.name),
    )


def warning(results: list[DriveWrite]) -> str | None:
    """Join the sentences a DJ should see.

    Args:
        results: Drive results from :func:`sync_tracks`.

    Returns:
        One warning, or None when every result has an empty detail.
        A failed drive is included. A written drive is not.
    """
    lines = [item.detail for item in results if item.detail]
    if not lines:
        return None
    return " ".join(lines)


def _planned_volume(
    volume: volumes.Volume,
    crate_name: str,
    *,
    add: bool,
    overwrite: bool,
    confirm: bool = False,
) -> list[Path]:
    """Return the files :func:`sync_volume` will change on one drive.

    Args:
        volume: Drive root.
        crate_name: Visible crate name.
        add: True adds paths. False removes them.
        overwrite: True may change an existing crate file.
        confirm: True may write a stick from another library.

    Returns:
        The crate path, and ``database V2`` when this write will append it.
        An empty list when :func:`stick_export.skip_reason` skips the write.
    """
    import stick_export

    facts = stick_export.facts_for(
        volume, crate_name, overwrite=overwrite, confirm=confirm
    )
    if stick_export.skip_reason(facts) is not None:
        return []
    root = Path(volume.root)
    serato = root / "_Serato_"
    try:
        filename = _crate_filename(crate_name)
    except ValueError:
        return []
    crate = serato / "Subcrates" / filename
    if crate.is_symlink():
        return []
    planned = [crate]
    if add:
        database = serato / "database V2"
        if database.is_file() and not database.is_symlink():
            planned.append(database)
    return planned


def _put_drive_back(
    crate: Path,
    crate_existed: bool,
    crate_before: bytes | None,
    database: Path,
    database_before: bytes | None,
    folder: Path,
    folder_created: bool,
) -> None:
    """Put one drive's crate and database back after a failed write.

    Args:
        crate: Crate file this write was changing.
        crate_existed: True when the crate file was already there.
        crate_before: Bytes from before the write, or None when the file
            was missing.
        database: ``database V2`` beside the crate folder.
        database_before: Bytes from before an append, or None when this
            write did not read that file.
        folder: ``Subcrates`` directory.
        folder_created: True when this write created ``folder``.

    Raises:
        OSError: If a file cannot be put back. The caller turns that into
            a warning and does not raise it further.
    """
    temporary = crate.with_suffix(crate.suffix + ".cratecraft-tmp")
    if temporary.is_symlink() or crate.is_symlink() or database.is_symlink():
        raise OSError("Refusing to restore a shortcut.")
    if temporary.exists():
        temporary.unlink()
    if crate_existed:
        if crate_before is None:
            raise OSError("The earlier crate bytes are missing.")
        if not crate.is_file() or crate.read_bytes() != crate_before:
            crate.write_bytes(crate_before)
    elif crate.is_file():
        crate.unlink()
    if database_before is not None and (not database.is_file() or database.read_bytes() != database_before):
        database.write_bytes(database_before)
    if folder_created and folder.is_dir() and not any(folder.iterdir()):
        folder.rmdir()


def _crate_filename(name: str) -> str:
    """Return a single crate file name.

    Args:
        name: Visible crate name.

    Returns:
        ``Name.crate``.

    Raises:
        ValueError: If the name is empty, has a slash, or is a path piece.
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
        raise ValueError(cleaned)
    return cleaned + ".crate"


def _relative(path: str, volume: volumes.Volume) -> str:
    """Return a crate path relative to the drive root.

    Args:
        path: Stored track path.
        volume: Drive that owns the path.

    Returns:
        A forward-slash path with the drive root removed, or empty when
        the path is not on that drive.
    """
    if volume.kind == "letter":
        if len(path) < 2 or path[1] != ":" or path[0].upper() != volume.name[0].upper():
            return ""
        rest = path[2:].lstrip("\\/")
        return rest.replace("\\", "/")
    # Windows Path strings use backslashes. Compare both forms as forward slashes.
    normalized = path.replace("\\", "/")
    root = volume.root.replace("\\", "/").rstrip("/")
    prefix = root + "/"
    if normalized == root or not normalized.startswith(prefix):
        return ""
    return normalized[len(prefix) :]


def _chunk(tag: str, data: bytes) -> bytes:
    """Encode one Serato record.

    Args:
        tag: Four ASCII characters.
        data: Payload.

    Returns:
        Tag, big-endian length, and payload.
    """
    return tag.encode("ascii") + struct.pack(">I", len(data)) + data


def _text(tag: str, value: str) -> bytes:
    """Encode UTF-16BE text.

    Args:
        tag: Four-character tag.
        value: Text without a BOM.

    Returns:
        The record.
    """
    return _chunk(tag, value.encode("utf-16-be"))


def _crate_bytes(paths: list[str]) -> bytes:
    """Encode a crate file.

    Args:
        paths: ``ptrk`` values relative to the drive.

    Returns:
        ``vrsn`` plus one ``otrk`` per path.
    """
    parts = [_text("vrsn", CRATE_VERSION)]
    for path in paths:
        parts.append(_chunk("otrk", _text("ptrk", path)))
    return b"".join(parts)


def _database_track(path: str) -> bytes:
    """Encode one ``database V2`` row.

    Args:
        path: Path relative to the drive.

    Returns:
        One ``otrk`` record.
    """
    inner = _text("pfil", path) + _text("ttyp", "mp3") + _text("tsng", "") + _text("tart", "") + _text("tbpm", "")
    inner += _chunk("bmis", bytes([0]))
    return _chunk("otrk", inner)


def _append_database(serato: Path, relatives: list[str]) -> None:
    """Add tracks to an existing ``database V2`` file.

    Args:
        serato: The drive's ``_Serato_`` directory.
        relatives: Paths relative to the drive. Paths already in the file
            are skipped.

    A missing file is left missing. A shortcut is not followed.
    """
    database = serato / "database V2"
    if not database.is_file() or database.is_symlink():
        return
    import snapshots

    present = {str(row.get("path") or "") for row in snapshots.parse_database_v2(database.read_bytes())}
    extra = b"".join(_database_track(path) for path in relatives if path and path not in present)
    if not extra:
        return
    with database.open("ab") as handle:
        handle.write(extra)


def _replace(path: Path, data: bytes) -> None:
    """Replace a file without leaving a partial crate beside it.

    Args:
        path: Destination file.
        data: Full file bytes.
    """
    temporary = path.with_suffix(path.suffix + ".cratecraft-tmp")
    temporary.write_bytes(data)
    os.replace(temporary, path)
