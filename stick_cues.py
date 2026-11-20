"""List cues that exist only on a USB stick, and copy them into empty slots.

Preview is read-only. Apply goes through ``safe_write`` and writes the
library audio file, not the stick. A cue index the library already has is
left as it is. ``stick_export.skip_reason`` decides every skip. Preview
and the post-write verify both call it.

An unmounted volume is ``not_connected``. It is not a missing file.
"""

from __future__ import annotations

import base64
import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import library
import snapshot_frames
import stick_export
import tags

NEEDS_CONFIRM = "Confirm before stick cues are copied into the library."
NEEDS_DRIVE = "Choose a drive."
TRACK_CAP = 5000
WALK_CAP = 20000


@dataclass(frozen=True, slots=True)
class CueItem:
    """One stick cue, or one file that could not be compared.

    Attributes:
        file: File name shown on the page.
        index: Cue index, or None for a file-level skip.
        start_ms: Stick cue start, or None.
        name: Cue name.
        color: CSS color, or None.
        skip: Code from ``skip_reason``, or None when the slot can be filled.
        facts: Facts verify passes back to ``skip_reason``.
        library_path: Library audio file, or None.
        stick_path: Stick audio file, or None.
    """

    file: str
    index: int | None
    start_ms: int | None
    name: str
    color: str | None
    skip: str | None
    facts: stick_export.SkipFacts
    library_path: str | None
    stick_path: str | None


def preview(drive: str) -> dict[str, object]:
    """List stick-only cues. Nothing is written.

    Args:
        drive: Volume root. A missing directory is not connected.

    Returns:
        ``preview`` true and ``written`` false. ``status`` is
        ``not_connected`` when the drive is unmounted. Cue rows include
        ``skip`` from :func:`stick_export.skip_reason`.

    Raises:
        library.LibraryError: If ``drive`` is not a string path the page
            can use, or the library file cannot be opened.
    """
    plan = plan_stick(drive)
    return _public(plan, preview=True, written=False)


def apply(drive: str) -> dict[str, object]:
    """Copy stick-only cues into empty library slots through ``safe_write``.

    Serato must be quit. A slot the library already uses is not replaced.
    The stick file is not rewritten. A plan with nothing to copy does not
    write.

    Args:
        drive: Volume root.

    Returns:
        ``written`` true when at least one library file changed.

    Raises:
        library.LibraryError: If the library cannot be written, or a frame
            rewrite is refused.
        library.SeratoOpen: If Serato still holds the library.
    """
    plan = plan_stick(drive)
    if plan["status"] != "ready":
        return _public(plan, preview=False, written=False)
    chosen = [item for item in plan["items"] if item.skip is None and item.library_path]
    if not chosen:
        return _public(plan, preview=False, written=False)
    paths = sorted({item.library_path for item in chosen if item.library_path})

    def body(_conn: sqlite3.Connection, write: Any) -> dict[str, object]:
        import safe_write

        grouped: dict[str, list[CueItem]] = {}
        for item in chosen:
            if item.library_path:
                grouped.setdefault(item.library_path, []).append(item)
        changed = False
        for path, items in grouped.items():
            file = Path(path)
            write.set_target(file.name)
            before = _cue_map(file)
            _write_empty_slots(file, items)
            after = _cue_map(file)
            _verify_items(plan["items"], before, after, file)
            changed = True
        checked = verify_items(plan["items"])
        if checked != [item.skip for item in plan["items"]]:
            raise safe_write.VerifyMismatch("Skip rules did not match the preview.")
        return _public(plan, preview=False, written=changed)

    import safe_write

    result = safe_write.run(
        "stick_cues",
        "stick cues",
        body,
        extra_files=[Path(path) for path in paths],
    )
    if isinstance(result, dict):
        return result
    return _public(plan, preview=False, written=False)


def verify_items(items: list[CueItem]) -> list[str | None]:
    """Return ``skip_reason`` for each planned item.

    Args:
        items: Rows from :func:`plan_stick`.

    Returns:
        The skip code for each row. Preview stores the same codes. Nothing
        is written.
    """
    return [stick_export.skip_reason(item.facts) for item in items]


def plan_stick(drive: str) -> dict[str, object]:
    """Compare library audio with same-named files on the stick.

    Args:
        drive: Volume root.

    Returns:
        ``status``, ``library_status``, and ``items``. Read-only. An
        unmounted drive is ``not_connected`` and is not described as a
        missing file.

    Raises:
        library.LibraryError: If the library file cannot be opened.
    """
    root = Path(drive)
    if not root.is_dir():
        facts = stick_export.SkipFacts(mounted=False, cues=True)
        item = CueItem(
            file="",
            index=None,
            start_ms=None,
            name="",
            color=None,
            skip=stick_export.skip_reason(facts),
            facts=facts,
            library_path=None,
            stick_path=None,
        )
        return {
            "status": "not_connected",
            "library_status": "not_connected",
            "drive": drive,
            "items": [item],
        }
    library_status = _library_status(root)
    names = _index_names(root)
    items: list[CueItem] = []
    for row in _tracks():
        stored = row.get("portable_id")
        if not isinstance(stored, str) or not stored:
            continue
        library_path = Path(stored)
        file_name = library_path.name or str(row.get("file_name") or "")
        if not file_name:
            continue
        stick_path = names.get(file_name.casefold())
        cues = _pair_items(library_path, stick_path, file_name, mounted=True)
        items.extend(cues)
        if len(items) >= TRACK_CAP:
            break
    return {
        "status": "ready",
        "library_status": library_status,
        "drive": str(root),
        "items": items,
    }


def action(payload: dict[str, object]) -> dict[str, object]:
    """Run one ``POST /api/stick-cues`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. ``apply`` writes
            only when ``confirm`` is true. ``drive`` is the volume root.

    Returns:
        That action's result, without the internal facts.

    Raises:
        library.LibraryError: The action, the drive, or confirm is invalid.
        library.SeratoOpen: ``apply`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    drive = payload.get("drive")
    if not isinstance(drive, str) or not drive.strip():
        raise library.LibraryError(NEEDS_DRIVE, 400)
    if kind == "preview":
        return preview(drive)
    if kind == "apply":
        if payload.get("confirm") is not True:
            raise library.LibraryError(NEEDS_CONFIRM, 400)
        return apply(drive)
    raise library.LibraryError("That action is not available.")


def _pair_items(
    library_path: Path,
    stick_path: Path | None,
    file_name: str,
    *,
    mounted: bool,
) -> list[CueItem]:
    """Build cue rows for one library file. Nothing is written.

    Args:
        library_path: Audio path stored in the library.
        stick_path: Same file name on the stick, or None.
        file_name: Name shown on the page.
        mounted: False when the volume root is absent.

    Returns:
        One row per stick cue, or one file-level skip.
    """
    library_real = _real_file(library_path)
    stick_real = _real_file(stick_path) if stick_path is not None else None
    same = False
    if library_real is not None and stick_real is not None:
        try:
            same = library_real.resolve() == stick_real.resolve()
        except OSError:
            same = False
    library_cues = tags.read_serato_tags(str(library_real) if library_real else None)["cues"]
    stick_cues = tags.read_serato_tags(str(stick_real) if stick_real else None)["cues"]
    taken = {int(cue["index"]) for cue in library_cues}
    writable = _writable(library_real)
    if not stick_cues:
        facts = _cue_facts(
            mounted=mounted,
            library_file=library_real is not None,
            stick_file=stick_real is not None,
            same_file=same,
            slot_filled=False,
            stick_only=False,
            writable=writable,
        )
        return [
            CueItem(
                file=file_name,
                index=None,
                start_ms=None,
                name="",
                color=None,
                skip=stick_export.skip_reason(facts),
                facts=facts,
                library_path=str(library_real) if library_real else None,
                stick_path=str(stick_real) if stick_real else None,
            )
        ]
    rows: list[CueItem] = []
    for cue in stick_cues:
        index = int(cue["index"])
        facts = _cue_facts(
            mounted=mounted,
            library_file=library_real is not None,
            stick_file=stick_real is not None,
            same_file=same,
            slot_filled=index in taken,
            stick_only=True,
            writable=writable,
        )
        rows.append(
            CueItem(
                file=file_name,
                index=index,
                start_ms=int(cue["start_ms"]),
                name=str(cue["name"]),
                color=cue["color"] if isinstance(cue["color"], str) else None,
                skip=stick_export.skip_reason(facts),
                facts=facts,
                library_path=str(library_real) if library_real else None,
                stick_path=str(stick_real) if stick_real else None,
            )
        )
    return rows


def _cue_facts(
    *,
    mounted: bool,
    library_file: bool,
    stick_file: bool,
    same_file: bool,
    slot_filled: bool,
    stick_only: bool,
    writable: bool,
) -> stick_export.SkipFacts:
    """Build cue facts for ``skip_reason``.

    Args:
        mounted: False when the volume is unplugged.
        library_file: True when the library audio file is a regular file.
        stick_file: True when the stick copy is a regular file.
        same_file: True when both paths are one file.
        slot_filled: True when the library already uses this cue index.
        stick_only: True when the cue was read from the stick.
        writable: True when an empty slot can be written as ID3.

    Returns:
        Facts. The disk is not read again.
    """
    return stick_export.SkipFacts(
        mounted=mounted,
        cues=True,
        library_file=library_file,
        stick_file=stick_file,
        same_file=same_file,
        slot_filled=slot_filled,
        stick_only=stick_only,
        writable=writable,
    )


def _verify_items(
    items: list[CueItem],
    before: dict[int, tuple[int, str]],
    after: dict[int, tuple[int, str]],
    library_file: Path,
) -> None:
    """Refuse a write that replaced a library cue or dropped a planned one.

    Args:
        items: The whole plan, including other files.
        before: Cue index to start and name from before this file was written.
        after: The same map after the write.
        library_file: File that was just written.

    Raises:
        safe_write.VerifyMismatch: If a filled slot changed, or an imported
            cue is not the stick cue.
    """
    import safe_write

    for index, (start, name) in before.items():
        found = after.get(index)
        if found is None or found != (start, name):
            raise safe_write.VerifyMismatch("A library cue was replaced.")
    for item in items:
        if item.library_path != str(library_file) or item.skip is not None or item.index is None:
            continue
        found = after.get(item.index)
        if found is None or found[0] != item.start_ms or found[1] != item.name:
            raise safe_write.VerifyMismatch("A stick cue was not copied into an empty slot.")
        if stick_export.skip_reason(item.facts) != item.skip:
            raise safe_write.VerifyMismatch("Skip rules did not match the preview.")


def _write_empty_slots(path: Path, items: list[CueItem]) -> None:
    """Append stick cues whose indexes are empty. Existing cues stay.

    Args:
        path: Library audio file.
        items: Importable cues for this file.

    Raises:
        library.LibraryError: If the frame cannot be rewritten.
        snapshot_frames.FrameRewriteError: If the audio would change.
    """
    wanted = [item for item in items if item.skip is None and item.index is not None]
    if not wanted:
        return
    before = snapshot_frames.read_stored_frames(path)
    stored = before.get("Markers2")
    old_payload = snapshot_frames.payload_from_stored(stored) if isinstance(stored, bytes) else None
    if isinstance(stored, bytes) and stored.startswith(b"GEOB"):
        if old_payload is None or not _payload_safe(old_payload):
            raise library.LibraryError("That cue list cannot be updated.", 400)
        new_payload = _append_payload(old_payload, wanted)
        frame = _splice_geob_payload(stored, old_payload, new_payload)
        if frame is None:
            raise library.LibraryError("That cue list cannot be updated.", 400)
    else:
        new_payload = _append_payload(None, wanted)
        frame = _new_geob(path, new_payload)
    after = dict(before)
    after["Markers2"] = frame
    try:
        snapshot_frames.restore_stored_frames(path, after)
    except snapshot_frames.FrameRewriteError as exc:
        raise library.LibraryError(exc.message, 400) from exc


def _append_payload(payload: bytes | None, items: list[CueItem]) -> bytes:
    """Return a Markers2 payload with the new cues appended.

    Args:
        payload: Existing payload, including the ``01 01`` header, or None.
        items: Cues to append. Filled slots are not included.

    Returns:
        A payload ``tags._parse_markers2`` can read. Existing entry bytes
        are copied. They are not rebuilt.

    Raises:
        library.LibraryError: If the existing payload is not safe to extend.
    """
    extra = b"".join(_cue_entry(item) for item in items)
    if payload is None:
        return b"\x01\x01" + base64.b64encode(extra)
    if not _payload_safe(payload):
        raise library.LibraryError("That cue list cannot be updated.", 400)
    decoded = tags._decode_serato_base64(payload[2:])
    if not decoded and payload[2:]:
        raise library.LibraryError("That cue list cannot be updated.", 400)
    body = decoded or b""
    inner = b""
    if body.startswith(b"\x01\x01"):
        inner = body[:2]
        body = body[2:]
    return b"\x01\x01" + base64.b64encode(inner + body + extra)


def _payload_safe(payload: bytes) -> bool:
    """Return whether a Markers2 payload can be extended.

    Args:
        payload: Markers2 bytes, including the leading ``01 01`` pair.

    Returns:
        False when the payload is truncated or not a Markers2 body.
    """
    if tags.markers2_issue_code(payload) is not None:
        return False
    return len(payload) >= 2 and payload[:2] == b"\x01\x01"


def _cue_entry(item: CueItem) -> bytes:
    """Encode one CUE entry the Markers2 parser already reads.

    Args:
        item: Cue to append. ``index`` and ``start_ms`` are set.

    Returns:
        Kind name, big-endian length, and the cue bytes.
    """
    index = 0 if item.index is None else item.index & 0xFF
    start = 0 if item.start_ms is None else item.start_ms
    color = b"\x00\x00\x00"
    if isinstance(item.color, str) and len(item.color) == 7 and item.color.startswith("#"):
        try:
            color = bytes.fromhex(item.color[1:])
        except ValueError:
            color = b"\x00\x00\x00"
    raw = bytearray(12)
    raw[1] = index
    raw[2:6] = int(start).to_bytes(4, "big")
    raw[7:10] = color
    blob = bytes(raw) + item.name.encode("utf-8") + b"\x00"
    return b"CUE\x00" + len(blob).to_bytes(4, "big") + blob


def _splice_geob_payload(frame: bytes, old_payload: bytes, new_payload: bytes) -> bytes | None:
    """Replace the Markers2 tail of one GEOB frame and keep its size field.

    Args:
        frame: Raw GEOB frame, header included.
        old_payload: Current Markers2 payload. It must be the frame's tail.
        new_payload: Replacement payload.

    Returns:
        The frame with the same size encoding it already uses. None when
        the layout is not one this splice understands.
    """
    if len(frame) < 10 or frame[:4] != b"GEOB" or not old_payload or not frame.endswith(old_payload):
        return None
    body_len = len(frame) - 10
    declared = int.from_bytes(frame[4:8], "big")
    if declared == body_len:
        def size_of(count: int) -> bytes:
            return count.to_bytes(4, "big")
    elif tags._synchsafe(frame[4:8]) == body_len:
        size_of = tags._encode_synchsafe
    else:
        return None
    new_body_len = body_len - len(old_payload) + len(new_payload)
    if new_body_len < 0:
        return None
    prefix = frame[: -len(old_payload)]
    return prefix[:4] + size_of(new_body_len) + prefix[8:] + new_payload


def _new_geob(path: Path, payload: bytes) -> bytes:
    """Build a Serato Markers2 GEOB frame for a file that has none.

    Args:
        path: Audio file. Its ID3 version selects the size encoding.
        payload: Markers2 payload.

    Returns:
        A GEOB frame, header included.
    """
    description = b"Serato Markers2\x00"
    body = bytes([0]) + b"application/octet-stream\x00" + b"\x00" + description + payload
    version = 3
    try:
        head = path.read_bytes()[:4]
    except OSError:
        head = b""
    if head[:3] == b"ID3" and head[3] in (3, 4):
        version = head[3]
    size = tags._encode_synchsafe(len(body)) if version == 4 else len(body).to_bytes(4, "big")
    return b"GEOB" + size + b"\x00\x00" + body


def _writable(path: Path | None) -> bool:
    """Return whether this library file can take an ID3 cue slot.

    Args:
        path: Library audio file, or None.

    Returns:
        False for a missing file, a shortcut, or FLAC, AIFF, or MP4.
    """
    if path is None:
        return False
    try:
        if not path.is_file() or path.is_symlink():
            return False
        kind = snapshot_frames._sniff_container(path)
    except OSError:
        return False
    return kind == "id3"


def _cue_map(path: Path) -> dict[int, tuple[int, str]]:
    """Return cue index to start time and name.

    Args:
        path: Audio file.

    Returns:
        One row per parsed cue. The file is not rewritten.
    """
    found: dict[int, tuple[int, str]] = {}
    for cue in tags.read_serato_tags(str(path))["cues"]:
        found[int(cue["index"])] = (int(cue["start_ms"]), str(cue["name"]))
    return found


def _real_file(path: Path | None) -> Path | None:
    """Return a regular file, or None for a shortcut or a missing path.

    Args:
        path: Candidate audio file.

    Returns:
        The path when it is a regular file. None otherwise.
    """
    if path is None:
        return None
    try:
        if path.is_symlink() or not path.is_file():
            return None
    except OSError:
        return None
    return path


def _tracks() -> list[dict[str, object]]:
    """Return library tracks that have a stored path.

    Returns:
        At most ``TRACK_CAP`` rows. The live database is not opened.

    Raises:
        library.LibraryError: If the library file is missing or a shortcut.
    """
    rows: list[dict[str, object]] = []
    with library.copied_read_conn(Path(library.MASTER)) as conn:
        try:
            found = conn.execute(
                """
                SELECT id, name, artist, file_name, portable_id
                FROM asset
                WHERE portable_id IS NOT NULL AND portable_id != ''
                ORDER BY id
                LIMIT ?
                """,
                (TRACK_CAP,),
            ).fetchall()
        except sqlite3.Error as exc:
            raise library.LibraryError("The library could not be read.", 500) from exc
    for row in found:
        rows.append(
            {
                "id": row["id"],
                "name": row["name"],
                "artist": row["artist"],
                "file_name": row["file_name"],
                "portable_id": row["portable_id"],
            }
        )
    return rows


def _index_names(root: Path) -> dict[str, Path]:
    """Map a lower-cased file name to the first regular file on the stick.

    Args:
        root: Volume root. ``_Serato_`` is not searched.

    Returns:
        File name to path. Shortcuts are left out. The walk stops after
        ``WALK_CAP`` files.
    """
    found: dict[str, Path] = {}
    seen = 0
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        current = Path(dirpath)
        dirnames[:] = [
            name
            for name in dirnames
            if name != "_Serato_" and not name.startswith(".") and not (current / name).is_symlink()
        ]
        for name in filenames:
            seen += 1
            if seen > WALK_CAP:
                return found
            path = current / name
            if path.is_symlink() or not path.is_file():
                continue
            found.setdefault(name.casefold(), path)
    return found


def _library_status(root: Path) -> str:
    """Return whether this stick's crates belong to the open library.

    Args:
        root: Volume root that exists.

    Returns:
        ``empty`` when there is no crate file, ``ours`` when the remembered
        id matches, otherwise ``different``. Nothing is written.
    """
    serato = root / "_Serato_"
    if serato.is_symlink() or not serato.is_dir() or not stick_export._crate_files(serato):
        return "empty"
    volume = volumes_for(root)
    stored = stick_export.remembered_id(volume)
    if stored == stick_export.library_id():
        return "ours"
    return "different"


def volumes_for(root: Path) -> volumes.Volume:
    """Return a volume whose root is this directory.

    Args:
        root: Existing directory.

    Returns:
        ``volumes.volume_of`` when it names this directory. Otherwise a
        posix volume using the directory's own path, so a temporary root
        still has a memory key.
    """
    text = str(root)
    found = volumes.volume_of(text)
    if found is not None and Path(found.root) == root:
        return found
    return volumes.Volume(root.name or "stick", text, "posix")


def _public(plan: dict[str, object], *, preview: bool, written: bool) -> dict[str, object]:
    """Return the JSON object for the page.

    Args:
        plan: Result of :func:`plan_stick`.
        preview: True when nothing was written on purpose.
        written: True when a library file changed.

    Returns:
        Cue rows without the internal facts.
    """
    items = plan["items"]
    cues: list[dict[str, object]] = []
    skipped: list[dict[str, object]] = []
    if isinstance(items, list):
        for item in items:
            if not isinstance(item, CueItem):
                continue
            if item.index is None:
                if item.skip:
                    skipped.append({"file": item.file, "skip": item.skip})
                continue
            cues.append(
                {
                    "file": item.file,
                    "index": item.index,
                    "start_ms": item.start_ms,
                    "name": item.name,
                    "color": item.color,
                    "skip": item.skip,
                }
            )
    importable = [row for row in cues if row["skip"] is None]
    return {
        "preview": preview,
        "written": written,
        "status": plan.get("status"),
        "library_status": plan.get("library_status"),
        "drive": plan.get("drive"),
        "count": len(importable),
        "cues": cues,
        "skipped": skipped,
    }
