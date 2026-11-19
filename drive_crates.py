"""Write external-drive tracks into that drive's ``_Serato_`` folder.

The master library stays the list Serato 4 and 5 display. Tracks that live
on another drive also belong in that drive's ``Subcrates`` crate and, when
Serato has already created it, in ``database V2``. This module does not
create a ``_Serato_`` folder, does not follow a shortcut to one, and does
not replace a same-named crate unless ``overwrite`` is true.
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
            or ``refused``.
        volume: Drive name, or empty when the path is not on an external drive.
        path: Crate file that was written or left in place, or None.
        detail: Sentence for the page. Empty when nothing needs to be said.
    """

    status: str
    volume: str
    path: str | None
    detail: str


def sync_tracks(paths: list[str], crate_name: str, *, add: bool, overwrite: bool) -> list[DriveWrite]:
    """Group tracks by external volume and write each drive once.

    Args:
        paths: Stored track paths.
        crate_name: Visible crate name.
        add: True adds the paths. False removes them.
        overwrite: True may change a crate file that already exists.

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
        sync_volume(volume, grouped, crate_name, add=add, overwrite=overwrite)
        for volume, grouped in groups.values()
    ]


def sync_volume(
    volume: volumes.Volume,
    paths: list[str],
    crate_name: str,
    *,
    add: bool,
    overwrite: bool,
) -> DriveWrite:
    """Write one drive's crate file, or explain why it was left alone.

    Args:
        volume: Drive root. Tests pass a temporary root. Production uses
            :func:`volumes.external_volume`.
        paths: Track paths on that drive.
        crate_name: Visible crate name. Slashes are refused.
        add: True adds paths. False removes them.
        overwrite: True may change an existing crate file.

    Returns:
        The drive result. A missing root is ``not_connected``. A root
        with no real ``_Serato_`` directory is ``no_library``.
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
    if crate.is_file() and not overwrite:
        return DriveWrite(
            "kept",
            volume.name,
            str(crate),
            f"{volume.name} already has a crate named {crate_name}, and overwrite is off, so that crate was left as it was.",
        )
    if crate.is_symlink():
        return DriveWrite(
            "no_library",
            volume.name,
            None,
            f"{volume.name} has no Serato library yet, so nothing was written there.",
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
    folder.mkdir(exist_ok=True)
    _replace(crate, _crate_bytes(merged))
    if add:
        _append_database(serato, relatives)
    return DriveWrite("written", volume.name, str(crate), "")


def warning(results: list[DriveWrite]) -> str | None:
    """Join the sentences a DJ should see.

    Args:
        results: Drive results from :func:`sync_tracks`.

    Returns:
        One warning, or None when every drive was written or there were
        no external tracks.
    """
    lines = [item.detail for item in results if item.detail]
    if not lines:
        return None
    return " ".join(lines)


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
