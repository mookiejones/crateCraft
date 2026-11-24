#!/usr/bin/env python3
"""List non-zero stored gain and reset it to 0 dB (#468).

Serato writes three NUL-terminated ASCII numbers into the Autotags
payload, after a ``01 01`` version pair: BPM, auto gain, and the manual
gain in dB. This module treats the third field as the stored gain a DJ
changed. Auto gain stays. A track is listed only when that manual gain
is not 0 dB.

The layout is the one documented by Holzhaus (``serato_autotags.md``) and
decoded by triseratops. This repository has no captured Serato 4 Autotags
fixture. A payload whose first two bytes are not ``01 01``, or whose
three fields are not plain decimals, is counted unreadable and is not
rewritten.

Detection does not write the library or the audio. ``create`` with
``confirm`` true puts the listed tracks in ``_crateCraft generated`` /
``Gain changed`` and does not replace a crate of that name anywhere
else. ``reset`` with ``confirm`` true rewrites only the gain field,
through ``safe_write`` and a snapshot, while Serato is quit. Markers2,
BeatGrid, Overview, and Analysis are compared after the write. The gain
is then read back the way Serato reads Autotags. A miss rolls the
snapshot back and raises. Nothing is written inside the Serato folder.

``python3 stored_gain.py`` prints the scan. It does not reset gain.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import math
import re
import sqlite3
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path

import gig_check
import library
import snapshot_frames
import tags
import volumes

GENERATED_FOLDER = "_crateCraft generated"
CRATE_NAME = "Gain changed"
NOTE = (
    "Only the stored gain changes. Auto gain, cues, the beatgrid, "
    "overview, and analysis stay."
)
NEEDS_CONFIRM = "Confirm before stored gain is reset to 0 dB."
DID_NOT_STICK = "The gain did not read back as 0 dB, so the files were put back."
FRAMES_MOVED = "Other Serato tags would have changed, so the files were put back."
CANNOT_REWRITE = "Stored gain could not be rewritten, so nothing was kept."
# Half of the 0.001 step Serato writes for gain. "0.000" and "-0.000" are zero.
ZERO_DB = 0.0005
_NUMBER = re.compile(rb"-?\d+(?:\.\d+)?")
_ALPHABET = set(b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=")
_PROTECTED_GEOB = frozenset({
    "Serato Markers2",
    "Serato BeatGrid",
    "Serato Overview",
    "Serato Analysis",
})
_PROTECTED_FLAC = (
    b"SERATO_MARKERS_V2",
    b"SERATO_MARKERS2",
    b"SERATO_BEATGRID",
    b"SERATO_OVERVIEW",
    b"SERATO_ANALYSIS",
)
_PROTECTED_MP4 = frozenset({
    "markersv2",
    "markers2",
    "beatgrid",
    "overview",
    "analysisversion",
})


def _is_zero(gain: float) -> bool:
    """Return whether a parsed gain is 0 dB at Serato's 3-decimal step.

    Args:
        gain: Parsed manual gain.

    Returns:
        True when the absolute value is under ``ZERO_DB``.
    """
    return math.isfinite(gain) and abs(gain) < ZERO_DB


def _parse_number(text: bytes) -> float | None:
    """Parse one plain decimal field.

    Args:
        text: ASCII between NULs. A sign and one dot are allowed.

    Returns:
        The finite value, or None when the text is not that shape.
    """
    if not text or _NUMBER.fullmatch(text) is None:
        return None
    number = float(text)
    if not math.isfinite(number):
        return None
    return number


def parse_autotags(payload: bytes) -> dict[str, object] | None:
    """Read BPM, auto gain, and manual gain from an Autotags payload.

    Args:
        payload: Bytes Serato stores after the GEOB description, or after
            the FLAC or MP4 envelope. The version pair is included.

    Returns:
        ``version``, ``bpm_text``, ``auto_text``, ``gain_text``, ``bpm``,
        ``auto_gain``, and ``gain_db``. None when the version is not
        ``01 01`` or a field is not a plain decimal. Trailing bytes after
        the third NUL are ignored by the reader and kept by
        :func:`zero_gain_payload`.
    """
    if len(payload) < 2 or payload[0] != 1 or payload[1] != 1:
        return None
    fields: list[tuple[bytes, float]] = []
    pos = 2
    for _ in range(3):
        end = payload.find(b"\x00", pos)
        if end < 0:
            return None
        text = payload[pos:end]
        number = _parse_number(text)
        if number is None:
            return None
        fields.append((text, number))
        pos = end + 1
    bpm_text, bpm = fields[0]
    auto_text, auto_gain = fields[1]
    gain_text, gain_db = fields[2]
    return {
        "version": (1, 1),
        "bpm_text": bpm_text.decode("ascii"),
        "auto_text": auto_text.decode("ascii"),
        "gain_text": gain_text.decode("ascii"),
        "bpm": bpm,
        "auto_gain": auto_gain,
        "gain_db": gain_db,
    }


def zero_gain_payload(payload: bytes) -> bytes | None:
    """Replace only the manual-gain field with ``0.000``.

    Args:
        payload: Autotags payload, version pair included.

    Returns:
        The payload with the third field set to ``0.000``. BPM, auto
        gain, and any bytes after the third NUL stay. None when
        :func:`parse_autotags` cannot read the payload.
    """
    if parse_autotags(payload) is None:
        return None
    pos = 2
    for _ in range(2):
        end = payload.find(b"\x00", pos)
        if end < 0:
            return None
        pos = end + 1
    end = payload.find(b"\x00", pos)
    if end < 0:
        return None
    return payload[:pos] + b"0.000" + payload[end:]


def autotags_payload(stored: bytes) -> bytes | None:
    """Return the Autotags payload inside one stored frame.

    ID3 and AIFF store a GEOB frame. FLAC and MP4 store base64, sometimes
    wrapped as ``application/octet-stream``, a NUL, the frame name, and
    the payload. An MP4 ``data`` atom keeps an 8-byte header in front.

    Args:
        stored: Exact bytes ``read_stored_frames`` returned for Autotags.

    Returns:
        The payload :func:`parse_autotags` accepts, or None when the
        frame does not hold that payload.
    """
    if stored.startswith(b"GEOB") and len(stored) > 10:
        try:
            _name, payload = tags._geob_body(stored[10:])
        except (IndexError, ValueError):
            return None
        return payload
    if len(stored) >= 8 and stored[:8] == b"\x00" * 8:
        return autotags_payload(stored[8:])
    decoded = _b64_decode(stored)
    if decoded is None:
        if stored.startswith(b"\x01\x01"):
            return stored
        return None
    if decoded.startswith(tags._ENVELOPE_MARK):
        _name, sep, payload = decoded[len(tags._ENVELOPE_MARK):].partition(b"\x00")
        if not sep:
            return None
        return payload
    if decoded.startswith(b"\x01\x01"):
        return decoded
    return None


def zero_gain_stored(stored: bytes) -> bytes:
    """Return the same stored frame with the manual gain set to 0 dB.

    Args:
        stored: Exact Autotags bytes from the file.

    Returns:
        Those bytes with only the gain field changed. The container
        wrapping (GEOB header, base64 newlines, MP4 prefix) stays.

    Raises:
        library.LibraryError: The payload cannot be read or put back
            into the same wrapping.
    """
    payload = autotags_payload(stored)
    if payload is None:
        raise library.LibraryError(CANNOT_REWRITE, 400)
    updated = zero_gain_payload(payload)
    if updated is None:
        raise library.LibraryError(CANNOT_REWRITE, 400)
    try:
        return _install_payload(stored, payload, updated)
    except ValueError as exc:
        raise library.LibraryError(CANNOT_REWRITE, 400) from exc


def read_gain_db(path: str | Path) -> float | None:
    """Read the manual gain the way Serato reads Autotags.

    Args:
        path: Audio file. It is opened read-only.

    Returns:
        The third Autotags field in dB, or None when the file has no
        readable Autotags payload. 0 dB is returned as ``0.0``, not None.
        FLAC uses ``SERATO_AUTOGAIN`` ahead of ``SERATO_AUTOTAGS``. MP4
        uses the ``autgain`` atom ahead of ``autotags``.
    """
    frames = snapshot_frames.read_stored_frames(path)
    stored = frames.get("Autotags")
    if not isinstance(stored, bytes):
        return None
    payload = autotags_payload(stored)
    if payload is None:
        return None
    parsed = parse_autotags(payload)
    if parsed is None:
        return None
    gain = parsed["gain_db"]
    if isinstance(gain, bool) or not isinstance(gain, float):
        return None
    return gain


def scan(database: Path, space: str) -> dict[str, object]:
    """List tracks whose stored manual gain is not 0 dB. Writes nothing.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.

    Returns:
        ``checked``, ``offline``, ``not_found``, ``unreadable``,
        ``tracks``, ``folder``, ``name``, and ``note``. Each track is
        ``id``, ``name``, ``artist``, ``file``, ``path``, ``gain_db``,
        ``gain_text``, ``auto_gain``, and ``bpm``. An unplugged drive is
        ``offline``. A missing file is ``not_found``. A file with no
        Autotags, or an Autotags payload this reader will not rewrite,
        is ``unreadable`` only when the file is on disk and the payload
        is present but not the ``01 01`` layout. A file with no Autotags
        is checked and not listed.

    Raises:
        library.LibraryError: The space is unknown or the database cannot
            be read.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    rows = _rows(database, space)
    tracks: list[dict[str, object]] = []
    offline = not_found = unreadable = 0
    for row in rows:
        stored = row["portable_id"]
        if not isinstance(stored, str) or not stored:
            not_found += 1
            continue
        if volumes.absent_volume(stored) is not None:
            offline += 1
            continue
        resolved = library.resolved_path(stored) or stored
        path = Path(resolved)
        try:
            present = path.is_file() and not path.is_symlink()
        except OSError:
            present = False
        if not present:
            not_found += 1
            continue
        parsed = _parsed_file(path)
        if parsed is None:
            if _has_autotags(path):
                unreadable += 1
            continue
        gain = parsed["gain_db"]
        if not isinstance(gain, float) or _is_zero(gain):
            continue
        tracks.append(_track_row(row, path, parsed))
    return {
        "checked": len(rows),
        "offline": offline,
        "not_found": not_found,
        "unreadable": unreadable,
        "tracks": tracks,
        "folder": GENERATED_FOLDER,
        "name": CRATE_NAME,
        "note": NOTE,
    }


def preview(database: Path, space: str) -> dict[str, object]:
    """Describe the crate and the reset. Writes nothing.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        The scan plus ``preview`` true, ``written`` false, and ``added``.
    """
    report = scan(database, space)
    report["preview"] = True
    report["written"] = False
    report["added"] = len(_tracks(report))
    return report


def create_crate(database: Path, space: str) -> dict[str, object]:
    """Write the Gain changed crate under the generated folder.

    Serato must be quit. An empty list does not write. A crate named
    Gain changed outside ``_crateCraft generated`` is left as it was. A
    re-run deletes only the Gain changed crate under that folder.

    Args:
        database: ``master.sqlite``. The live ``library.MASTER`` is what
            ``safe_write`` opens.
        space: Space name.

    Returns:
        The scan, ``written`` true, ``id``, and ``snapshot_id`` when a
        crate was saved. ``written`` false when nothing was listed.

    Raises:
        library.LibraryError: The space is unknown or the write is refused.
        library.SeratoOpen: Serato still holds the library.
    """
    del database
    report = scan(Path(library.MASTER), space)
    ids = [int(item["id"]) for item in _tracks(report) if isinstance(item.get("id"), int)]
    if not ids:
        result = dict(report)
        result["preview"] = False
        result["written"] = False
        result["added"] = 0
        return result

    def apply(conn: sqlite3.Connection, write: object) -> dict[str, object]:
        """Create the folder and replace only this crate."""
        made = _write_crate(conn, write, space, ids)
        made.update(report)
        made["preview"] = False
        made["written"] = True
        made["added"] = len(ids)
        snapshot_id = getattr(write, "snapshot_id", None)
        if isinstance(snapshot_id, str):
            made["snapshot_id"] = snapshot_id
        return made

    import safe_write

    return safe_write.run("stored_gain_crate", CRATE_NAME, apply)


def reset(database: Path, space: str) -> dict[str, object]:
    """Set every listed manual gain to 0 dB and read it back.

    The audio files are snapshotted with the library. Each file is
    rewritten, then Markers2, BeatGrid, Overview, and Analysis are
    compared with the bytes from before the write. The gain is read
    again from the file. A mismatch raises and the snapshot is put back.
    An empty list does not open a write.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        The scan from before the write, ``written`` true, ``reset``, and
        ``snapshot_id`` when at least one file changed. ``written`` false
        when no track was listed.

    Raises:
        library.LibraryError: A file could not be rewritten, another
            Serato tag changed, or the gain did not read back as 0 dB.
            The last two put the snapshot back before the error is raised.
        library.SeratoOpen: Serato still holds the library.
    """
    del database
    report = scan(Path(library.MASTER), space)
    ready = _ready(report)
    if not ready:
        result = dict(report)
        result["preview"] = False
        result["written"] = False
        result["reset"] = 0
        return result
    paths = [item[0] for item in ready]

    def apply(_conn: sqlite3.Connection, write: object) -> dict[str, object]:
        """Rewrite gain, then prove the read-back and the other frames."""
        changed = 0
        for path, _row in ready:
            before_guard = guarded_bytes(path)
            frames = snapshot_frames.read_stored_frames(path)
            stored = frames.get("Autotags")
            if not isinstance(stored, bytes):
                raise library.LibraryError(DID_NOT_STICK, 409)
            frames = dict(frames)
            frames["Autotags"] = zero_gain_stored(stored)
            target = getattr(write, "set_target", None)
            if target is not None:
                target(path.name)
            try:
                snapshot_frames.restore_stored_frames(path, frames)
            except snapshot_frames.FrameRewriteError as exc:
                raise library.LibraryError(exc.message, 400) from exc
            if guarded_bytes(path) != before_guard:
                raise library.LibraryError(FRAMES_MOVED, 409)
            if not _stuck(path):
                raise library.LibraryError(DID_NOT_STICK, 409)
            changed += 1
        result = scan(Path(library.MASTER), space)
        result["preview"] = False
        result["written"] = changed > 0
        result["reset"] = changed
        snapshot_id = getattr(write, "snapshot_id", None)
        if isinstance(snapshot_id, str):
            result["snapshot_id"] = snapshot_id
        return result

    import safe_write

    return safe_write.run(
        "stored_gain",
        CRATE_NAME,
        apply,
        extra_files=paths,
    )


def undo(snapshot_id: str) -> dict[str, object]:
    """Put one stored-gain snapshot back.

    Args:
        snapshot_id: ``snapshot_id`` from ``reset`` or ``create_crate``.

    Returns:
        ``ok`` true and ``undone`` true.

    Raises:
        library.LibraryError: The id is missing, or the restore failed.
        library.SeratoOpen: Serato still holds the library.
    """
    import safe_write

    if not isinstance(snapshot_id, str) or not snapshot_id:
        raise library.LibraryError("The pre-write snapshot is missing.", 409)
    safe_write.undo_preimage(snapshot_id, operation="stored_gain_undo", target=CRATE_NAME)
    return {"ok": True, "written": True, "undone": True, "snapshot_id": snapshot_id}


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/gain-changed`` request.

    Args:
        payload: ``action`` is ``preview``, ``create``, ``reset``, or
            ``undo``. ``space`` defaults to the Serato Library space.
            ``create``, ``reset``, and ``undo`` write only when ``confirm``
            is true. ``undo`` also needs ``snapshot_id``.

    Returns:
        That action's result. ``create`` and ``reset`` without ``confirm``
        return the preview.

    Raises:
        library.LibraryError: The action, the space, or confirm is invalid.
        library.SeratoOpen: A write runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    database = Path(library.MASTER)
    confirm = payload.get("confirm") is True
    if kind == "preview" or (kind in ("create", "reset") and not confirm):
        return preview(database, space)
    if kind == "create":
        return create_crate(database, space)
    if kind == "reset":
        return reset(database, space)
    if kind == "undo":
        if not confirm:
            raise library.LibraryError(NEEDS_CONFIRM, 400)
        snapshot_id = payload.get("snapshot_id")
        if not isinstance(snapshot_id, str):
            raise library.LibraryError("The pre-write snapshot is missing.", 409)
        return undo(snapshot_id)
    raise library.LibraryError("That action is not available.")


def guarded_bytes(path: Path) -> bytes:
    """Return Markers2, BeatGrid, Overview, and Analysis bytes.

    Args:
        path: Audio file.

    Returns:
        Those frames in container order, each prefixed with its name and
        length. Autotags are not included. A file this module cannot walk
        returns the empty bytes.
    """
    try:
        container = snapshot_frames._sniff_container(path)
    except OSError:
        return b""
    try:
        if container == "flac":
            return _flac_guarded(path)
        if container == "mp4":
            return _mp4_guarded(path)
        if container == "aiff":
            return _aiff_guarded(path)
        return _id3_guarded(path)
    except (OSError, snapshot_frames.FrameRewriteError, ValueError):
        return b""


def main(argv: Sequence[str] | None = None) -> int:
    """Print the scan as JSON. Does not reset gain or write a crate.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the scan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="List tracks whose stored Serato gain is not 0 dB. Reads tags. Writes nothing."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        print(json.dumps(scan(args.database, args.space)))
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    return 0


def _stuck(path: Path) -> bool:
    """Return whether the file now reads as 0 dB.

    Args:
        path: Audio file just rewritten.

    Returns:
        True when :func:`read_gain_db` is 0 dB.
    """
    gain = read_gain_db(path)
    return gain is not None and _is_zero(gain)


def _tracks(report: Mapping[str, object]) -> list[dict[str, object]]:
    """Return the track list from a scan.

    Args:
        report: Scan dict.

    Returns:
        The track dicts. A missing or mistyped list is empty.
    """
    found = report.get("tracks")
    if not isinstance(found, list):
        return []
    return [item for item in found if isinstance(item, dict)]


def _ready(report: Mapping[str, object]) -> list[tuple[Path, dict[str, object]]]:
    """Return files the reset will open.

    Args:
        report: Scan dict.

    Returns:
        Path and row pairs. A row without a path is skipped. The same
        path is kept once.
    """
    seen: set[str] = set()
    ready: list[tuple[Path, dict[str, object]]] = []
    for row in _tracks(report):
        raw = row.get("path")
        if not isinstance(raw, str) or not raw:
            continue
        path = Path(raw)
        key = str(path)
        if key in seen:
            continue
        seen.add(key)
        ready.append((path, row))
    return ready


def _rows(database: Path, space: str) -> list[dict[str, object]]:
    """Return space assets as plain dicts. The connection is closed."""
    conn = gig_check.open_read_only(database)
    try:
        found = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
            ORDER BY a.name COLLATE NOCASE, a.id
            """,
            (space,),
        ).fetchall()
        return [
            {
                "id": int(row["id"]),
                "name": row["name"] if isinstance(row["name"], str) else "",
                "artist": row["artist"] if isinstance(row["artist"], str) else "",
                "file_name": row["file_name"] if isinstance(row["file_name"], str) else "",
                "portable_id": row["portable_id"] if isinstance(row["portable_id"], str) else "",
            }
            for row in found
        ]
    finally:
        conn.close()


def _parsed_file(path: Path) -> dict[str, object] | None:
    """Parse Autotags on one file.

    Args:
        path: Audio file.

    Returns:
        The parse dict, or None when Autotags are missing or unreadable.
    """
    frames = snapshot_frames.read_stored_frames(path)
    stored = frames.get("Autotags")
    if not isinstance(stored, bytes):
        return None
    payload = autotags_payload(stored)
    if payload is None:
        return None
    return parse_autotags(payload)


def _has_autotags(path: Path) -> bool:
    """Return whether the file stores an Autotags frame at all.

    Args:
        path: Audio file.

    Returns:
        True when a frame is present, including one this reader refuses.
    """
    frames = snapshot_frames.read_stored_frames(path)
    return isinstance(frames.get("Autotags"), bytes)


def _track_row(row: Mapping[str, object], path: Path, parsed: Mapping[str, object]) -> dict[str, object]:
    """One listed track."""
    file_name = row.get("file_name")
    return {
        "id": row["id"],
        "name": row.get("name") if isinstance(row.get("name"), str) else "",
        "artist": row.get("artist") if isinstance(row.get("artist"), str) else "",
        "file": file_name if isinstance(file_name, str) and file_name else path.name,
        "path": str(path),
        "gain_db": parsed["gain_db"],
        "gain_text": parsed["gain_text"],
        "auto_gain": parsed["auto_gain"],
        "bpm": parsed["bpm_text"],
    }


def _write_crate(
    conn: sqlite3.Connection,
    write: object,
    space: str,
    ids: Sequence[int],
) -> dict[str, object]:
    """Replace Gain changed under the generated folder.

    Args:
        conn: Open write connection from ``safe_write``.
        write: The session, used to register row checks.
        space: Space name.
        ids: Asset ids to put in the crate.

    Returns:
        ``id``, ``name``, ``folder``, and ``replaced`` when an older
        generated crate was removed.

    Raises:
        library.LibraryError: The crate could not be created.
    """
    import smart_presets

    root_id = library._space_root(conn, space)
    generated_id = library._find_child(conn, root_id, GENERATED_FOLDER, 1)
    if generated_id is None:
        made = library._create_crate(conn, space, root_id, GENERATED_FOLDER, False, None)
        generated_id = made["id"]
        if not isinstance(generated_id, int):
            raise library.LibraryError("The crate could not be created.")
        _expect_named(write, generated_id, GENERATED_FOLDER)
    else:
        generated_id = int(generated_id)
    replaced: dict[str, object] | None = None
    old = library._find_child(conn, generated_id, CRATE_NAME, 1)
    if old is not None:
        replaced = {"id": int(old), "name": CRATE_NAME}
        library._delete_crate(conn, space, int(old))
        _expect_gone(write, int(old))
    created = library._create_crate(conn, space, generated_id, CRATE_NAME, False, None)
    crate_id = created["id"]
    if not isinstance(crate_id, int):
        raise library.LibraryError("The crate could not be created.")
    setter = getattr(write, "set_target", None)
    if setter is not None:
        setter(CRATE_NAME)
    for asset_id in ids:
        library._membership(conn, crate_id, asset_id, space, True)
    smart_presets._expect_members(write, crate_id, tuple(ids))
    _expect_named(write, crate_id, CRATE_NAME)
    return {
        "id": crate_id,
        "name": created.get("name") or CRATE_NAME,
        "folder": GENERATED_FOLDER,
        "replaced": replaced,
    }


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


def _b64_decode(stored: bytes) -> bytes | None:
    """Decode Serato base64, ignoring newlines and a missing pad.

    Args:
        stored: Comment or atom text.

    Returns:
        The decoded bytes, or None when the text is not base64.
    """
    compact = b"".join(stored.split())
    if len(compact) < 4 or any(byte not in _ALPHABET for byte in compact):
        return None
    pad = (-len(compact)) % 4
    try:
        decoded = base64.b64decode(compact + (b"=" * pad), validate=False)
    except binascii.Error:
        return None
    return decoded or None


def _encode_like(original: bytes, decoded: bytes) -> bytes:
    """Encode ``decoded`` with the padding and line breaks of ``original``.

    Args:
        original: The base64 text that was stored.
        decoded: Bytes to encode.

    Returns:
        Base64 text. A newline in ``original`` wraps at that line's width.
    """
    compact = b"".join(original.split())
    padded = b"=" in compact
    text = base64.b64encode(decoded)
    if not padded:
        text = text.rstrip(b"=")
    if b"\n" not in original and b"\r" not in original:
        return text
    line = original.splitlines()[0] if original.splitlines() else b""
    width = len(line) if len(line) >= 4 else 72
    parts = [text[i:i + width] for i in range(0, len(text), width)]
    newline = b"\r\n" if b"\r\n" in original else b"\n"
    return newline.join(parts)


def _install_payload(stored: bytes, old: bytes, new: bytes) -> bytes:
    """Put ``new`` where ``old`` sat inside one stored frame.

    Args:
        stored: Exact frame bytes.
        old: Payload :func:`autotags_payload` returned.
        new: Replacement payload of any length.

    Returns:
        The frame bytes to write back.

    Raises:
        ValueError: The payload is not a suffix of the decoded frame.
    """
    if stored.startswith(b"GEOB") and len(stored) > 10:
        return _install_geob(stored, old, new)
    if len(stored) >= 8 and stored[:8] == b"\x00" * 8:
        return stored[:8] + _install_payload(stored[8:], old, new)
    decoded = _b64_decode(stored)
    if decoded is not None and decoded != stored:
        return _encode_like(stored, _swap_into(decoded, old, new))
    if stored.endswith(old):
        return stored[: len(stored) - len(old)] + new
    raise ValueError("payload is not a suffix")


def _swap_suffix(decoded: bytes, old: bytes) -> bytes | None:
    """Return the bytes before ``old`` when ``old`` is a suffix.

    Args:
        decoded: Unwrapped frame.
        old: Payload.

    Returns:
        The prefix, or None when ``old`` is not the suffix.
    """
    if not old or not decoded.endswith(old):
        return None
    return decoded[: len(decoded) - len(old)]


def _swap_into(decoded: bytes, old: bytes, new: bytes) -> bytes:
    """Replace a suffix payload.

    Args:
        decoded: Unwrapped frame.
        old: Current payload.
        new: Replacement payload.

    Returns:
        ``decoded`` with the suffix replaced.

    Raises:
        ValueError: ``old`` is not the suffix.
    """
    prefix = _swap_suffix(decoded, old)
    if prefix is None:
        raise ValueError("payload is not a suffix")
    return prefix + new


def _install_geob(frame: bytes, old: bytes, new: bytes) -> bytes:
    """Rebuild one GEOB frame around a new payload.

    Args:
        frame: Raw GEOB frame, header included.
        old: Current payload.
        new: Replacement payload.

    Returns:
        The frame with the size field updated. Encoding, MIME, filename,
        and description stay.

    Raises:
        ValueError: The payload is not the frame suffix, or the size
            field does not match the body.
    """
    body = frame[10:]
    if not body.endswith(old):
        raise ValueError("payload is not a suffix")
    new_body = body[: len(body) - len(old)] + new
    declared = int.from_bytes(frame[4:8], "big")
    if declared == len(body):
        size = len(new_body).to_bytes(4, "big")
    elif tags._synchsafe(frame[4:8]) == len(body):
        size = tags._encode_synchsafe(len(new_body))
    else:
        raise ValueError("frame size does not match")
    return frame[:4] + size + frame[8:10] + new_body


def _pack_guard(name: bytes, blob: bytes) -> bytes:
    """Prefix one protected frame so a shorter neighbor cannot collide.

    Args:
        name: Frame name.
        blob: Exact bytes.

    Returns:
        Name, length, and bytes.
    """
    return name + b"\0" + len(blob).to_bytes(4, "big") + blob


def _id3_guarded(path: Path) -> bytes:
    """Protected GEOB frames from a leading ID3 tag."""
    _version, frames, _offset = snapshot_frames._split_id3(path)
    return _geob_guard(frames)


def _aiff_guarded(path: Path) -> bytes:
    """Protected GEOB frames from an AIFF ID3 chunk."""
    chunks = snapshot_frames._read_aiff_chunks(path)
    out = bytearray()
    for cid, data in chunks:
        if cid not in {b"ID3 ", b"id3 "} or len(data) < 10 or data[:3] != b"ID3":
            continue
        version = data[3]
        tag_size = tags._synchsafe(data[6:10])
        body = data[10:10 + tag_size]
        frames: list[bytes] = []
        pos = 0
        while pos + 10 <= len(body):
            if body[pos] == 0:
                break
            if version == 4:
                frame_size = tags._synchsafe(body[pos + 4:pos + 8])
            else:
                frame_size = int.from_bytes(body[pos + 4:pos + 8], "big")
            if pos + 10 + frame_size > len(body):
                break
            frames.append(body[pos:pos + 10 + frame_size])
            pos += 10 + frame_size
        out.extend(_geob_guard(frames))
    return bytes(out)


def _geob_guard(frames: Sequence[bytes]) -> bytes:
    """Pack protected GEOB frames in the order they were stored."""
    out = bytearray()
    for frame in frames:
        if len(frame) < 11 or not frame.startswith(b"GEOB"):
            continue
        try:
            name, _payload = tags._geob_body(frame[10:])
        except (IndexError, ValueError):
            continue
        if name in _PROTECTED_GEOB:
            out.extend(_pack_guard(name.encode("utf-8"), frame))
    return bytes(out)


def _flac_guarded(path: Path) -> bytes:
    """Protected Vorbis comments, not the Autotags comment."""
    blocks, _offset = snapshot_frames._read_flac_blocks(path)
    out = bytearray()
    for _last, block_type, data in blocks:
        if block_type != 4:
            continue
        _vendor, comments = snapshot_frames._parse_vorbis_comments(data)
        for key, value in comments:
            if key.upper() in _PROTECTED_FLAC:
                out.extend(_pack_guard(key, value))
    return bytes(out)


def _mp4_guarded(path: Path) -> bytes:
    """Protected freeform ``data`` bodies. Autotags atoms are skipped."""
    found: list[tuple[str, bytes]] = []

    def visit(blob: bytes) -> None:
        for atom in snapshot_frames._parse_atom_list(blob):
            if atom.typ == b"mdat":
                continue
            if atom.typ == b"----":
                children = snapshot_frames._parse_atom_list(atom.body)
                mean = b""
                name = ""
                data = b""
                for child in children:
                    if child.typ == b"mean":
                        mean = snapshot_frames._mp4_text(child.body)
                    elif child.typ == b"name":
                        name = snapshot_frames._mp4_text(child.body).decode("latin-1", "replace").lower()
                    elif child.typ == b"data":
                        data = child.body
                if mean == b"com.serato.dj" and name in _PROTECTED_MP4:
                    found.append((name, data))
            elif atom.typ == b"meta" and len(atom.body) >= 4:
                visit(atom.body[4:])
            elif atom.typ in snapshot_frames._MP4_CONTAINERS:
                visit(atom.body)

    with path.open("rb") as handle:
        end = path.stat().st_size
        while handle.tell() + 8 <= end:
            pos = handle.tell()
            head = handle.read(8)
            if len(head) < 8:
                break
            size = int.from_bytes(head[:4], "big")
            typ = head[4:8]
            header = 8
            if size == 1:
                large = handle.read(8)
                if len(large) < 8:
                    break
                size = int.from_bytes(large, "big")
                header = 16
            elif size == 0:
                size = end - pos
            if size < header or pos + size > end:
                break
            if typ == b"mdat":
                handle.seek(pos + size)
                continue
            body = handle.read(size - header)
            if typ == b"meta" and len(body) >= 4:
                visit(body[4:])
            elif typ in snapshot_frames._MP4_CONTAINERS or typ == b"moov":
                visit(body)
    out = bytearray()
    for name, data in found:
        out.extend(_pack_guard(name.encode("ascii"), data))
    return bytes(out)


if __name__ == "__main__":
    sys.exit(main())
