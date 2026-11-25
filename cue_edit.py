"""Edit Serato hot cues 1–8 in the audio file (#464).

Preview is read-only and shows before and after for each pad. Apply
rewrites only Markers2 CUE entries for indexes 0–7 through
``safe_write``, after a snapshot, and only while Serato is quit. Loops,
flips, COLOR, BPMLOCK, cues past pad 8, BeatGrid, Autotags, and every
other tag frame stay byte-identical. Unknown entry kinds pass through.
Read-back verify restores the original frames when the pads do not match.
Undo puts that audio file's pre-write Markers2 bytes back from the
write preimage and leaves ``master.sqlite`` alone.

Supported containers: ID3 (MP3/WAV), AIFF, FLAC, and MP4/M4A. A missing,
unsupported, corrupt, or cue-protected file returns a clear reason and
does not write.
"""

from __future__ import annotations

import base64
import os
import sqlite3
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import library
import protected_fields
import snapshot_frames
import tags

NEEDS_CONFIRM = "Confirm before cue points are saved."
NEEDS_UNDO = "Confirm before cue points are put back."
MISSING_UNDO = "The pre-write snapshot is missing."
PROTECTED = "Cue points are protected in Settings."
UNSUPPORTED = "This file format cannot take cue edits yet."
MISSING_FILE = "The file is not on disk, so cues cannot be edited."
CORRUPT = "That cue list cannot be updated."
OUTSIDE_CHANGE = "The audio file changed since you started editing."
NO_CHANGE = "Nothing to change."
BAD_PADS = "That cue list is not valid."
SLOT_COUNT = 8
PALETTE = (
    "#C02626",
    "#F8821A",
    "#173BA2",
    "#FAC313",
    "#1FAD26",
    "#CE359E",
    "#1DBEBD",
    "#6823B6",
)
_ENVELOPE = b"application/octet-stream\x00\x00"
_MP4_HEADER = b"\x00\x00\x00\x01\x00\x00\x00\x00"
_Saved = tuple[str, dict[str, bytes]]


def palette() -> list[str]:
    """Return the Serato DJ Pro GUI pad colors.

    Returns:
        Eight ``#RRGGBB`` strings for pads 1–8.
    """
    return list(PALETTE)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/cue-edit`` request.

    Args:
        payload: ``action`` is ``preview``, ``apply``, or ``undo``.
            ``preview`` and ``apply`` need ``id`` and optional ``space``,
            ``pads``, and ``fingerprint``. ``apply`` and ``undo`` write
            only when ``confirm`` is true. ``undo`` needs ``snapshot_id``.

    Returns:
        That action's result, without internal undo bytes.

    Raises:
        library.LibraryError: The action, track, pads, or confirm is invalid.
        library.SeratoOpen: ``apply`` or ``undo`` runs while Serato holds
            the library.
    """
    kind = payload.get("action")
    if kind == "undo":
        if payload.get("confirm") is not True:
            raise library.LibraryError(NEEDS_UNDO, 400)
        snapshot_id = payload.get("snapshot_id")
        if not isinstance(snapshot_id, str) or not snapshot_id:
            raise library.LibraryError(MISSING_UNDO, 409)
        return undo(snapshot_id)
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    track_id = _track_id(payload.get("id"))
    pads = _pads_arg(payload.get("pads"))
    fingerprint = _fingerprint_arg(payload.get("fingerprint"))
    if kind == "preview":
        return preview(track_id, space, pads, fingerprint)
    if kind == "apply":
        if payload.get("confirm") is not True:
            raise library.LibraryError(NEEDS_CONFIRM, 400)
        result = apply(track_id, space, pads, fingerprint)
        result.pop("_saved", None)
        return result
    raise library.LibraryError("That action is not available.")


def preview(
    track_id: int,
    space: str,
    pads: list[dict[str, object] | None] | None = None,
    fingerprint: dict[str, int] | None = None,
) -> dict[str, object]:
    """Describe the current pads and optional pending edits. Nothing writes.

    Args:
        track_id: Asset id.
        space: Space name.
        pads: Desired pads 0–7, or None to only report status.
        fingerprint: Size and mtime from when editing started, or None.

    Returns:
        ``preview`` true, ``written`` false, ``editable``, ``reason``,
        ``before``, ``after``, and ``diffs``.

    Raises:
        library.LibraryError: Unknown space or track.
    """
    state = _inspect(track_id, space)
    return _public(state, pads, fingerprint, preview=True, written=False, snapshot_id=None)


def apply(
    track_id: int,
    space: str,
    pads: list[dict[str, object] | None] | None,
    fingerprint: dict[str, int] | None = None,
) -> dict[str, object]:
    """Write the desired hot cues through ``safe_write``.

    Serato must be quit. An empty or identical plan does not write. A
    fingerprint mismatch refuses without touching the file. After the
    write, cues are read back; a mismatch restores the original frames
    and raises.

    Args:
        track_id: Asset id.
        space: Space name.
        pads: Desired pads 0–7. None is treated as no change.
        fingerprint: Size and mtime from when editing started, or None.

    Returns:
        ``written`` true when Markers2 changed. ``snapshot_id`` undoes
        the write. ``_saved`` holds frame bytes for tests.

    Raises:
        library.LibraryError: The file cannot be edited, the fingerprint
            does not match, or the write is refused.
        library.SeratoOpen: Serato still holds the library.
    """
    state = _inspect(track_id, space)
    plan = _plan_write(state, pads, fingerprint)
    if not plan["editable"]:
        return _public(state, pads, fingerprint, preview=False, written=False, snapshot_id=None)
    if not plan["diffs"]:
        return _public(state, pads, fingerprint, preview=False, written=False, snapshot_id=None)
    path = Path(str(state["path"]))
    prepared = plan["prepared"]
    assert isinstance(prepared, dict)
    saved: list[_Saved] = []

    def body(_conn: sqlite3.Connection, write: Any) -> dict[str, object]:
        import safe_write

        write.set_target(str(state.get("file") or path.name))
        before_frames = prepared["before_frames"]
        after_frames = prepared["after_frames"]
        expected = prepared["expected"]
        try:
            snapshot_frames.restore_stored_frames(path, after_frames)
        except snapshot_frames.FrameRewriteError as exc:
            raise library.LibraryError(exc.message, 400) from exc
        found = _cue_map(path)
        if found != expected:
            try:
                snapshot_frames.restore_stored_frames(path, before_frames)
            except (OSError, snapshot_frames.FrameRewriteError):
                pass
            raise safe_write.VerifyMismatch("The cue points did not match after the write.")
        other = _other_entries_match(path, prepared["other_before"])
        if not other:
            try:
                snapshot_frames.restore_stored_frames(path, before_frames)
            except (OSError, snapshot_frames.FrameRewriteError):
                pass
            raise safe_write.VerifyMismatch("A non-cue Markers2 entry changed.")
        for kind in ("BeatGrid", "Autotags"):
            after = snapshot_frames.read_stored_frames(path).get(kind)
            if before_frames.get(kind) != after:
                try:
                    snapshot_frames.restore_stored_frames(path, before_frames)
                except (OSError, snapshot_frames.FrameRewriteError):
                    pass
                raise safe_write.VerifyMismatch("A non-cue tag frame changed.")
        saved.append((str(path), before_frames))
        result = _public(
            _inspect(track_id, space),
            pads,
            None,
            preview=False,
            written=True,
            snapshot_id=write.snapshot_id,
        )
        return result

    import safe_write

    result = safe_write.run("cue_edit", "cue points", body, extra_files=[path])
    if isinstance(result, dict):
        result["_saved"] = saved
        return result
    return _public(state, pads, fingerprint, preview=False, written=False, snapshot_id=None)


def undo(snapshot_id: str) -> dict[str, object]:
    """Put pre-write Markers2 back on the edited audio; leave the library DB.

    Args:
        snapshot_id: Id returned from a successful ``apply``.

    Returns:
        ``written`` true and ``undone`` set to the snapshot id.

    Raises:
        library.LibraryError: The snapshot is missing or Serato blocks the
            restore.
        library.SeratoOpen: Serato still holds the library.
    """
    import safe_write

    safe_write.restore_extra_markers2(
        snapshot_id, operation="cue_edit", target="cue points"
    )
    return {"preview": False, "written": True, "undone": snapshot_id}


def undo_frames(saved: Sequence[_Saved]) -> None:
    """Put pre-write Markers2 bytes back. Tests only.

    Args:
        saved: ``(path, frames)`` pairs from ``apply``'s ``_saved``.

    Raises:
        snapshot_frames.FrameRewriteError: A file cannot be restored.
        OSError: A file cannot be replaced.
    """
    for path, frames in saved:
        snapshot_frames.restore_stored_frames(path, frames)


def _inspect(track_id: int, space: str) -> dict[str, object]:
    """Load one track's path, cues, and editability.

    Args:
        track_id: Asset id.
        space: Space name.

    Returns:
        Internal state for preview and apply.

    Raises:
        library.LibraryError: Unknown space or track.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    with library.copied_read_conn(Path(library.MASTER)) as conn:
        row = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id, a.bpm
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE a.id = ? AND s.name = ?
            """,
            (track_id, space),
        ).fetchone()
    if row is None:
        raise library.LibraryError("Track is not in this space.", 404)
    portable = row["portable_id"] if isinstance(row["portable_id"], str) else None
    resolved = library.resolved_path(portable) if portable else None
    path = Path(resolved) if resolved else None
    try:
        on_disk = path is not None and path.is_file() and not path.is_symlink()
    except OSError:
        on_disk = False
    cues: list[dict[str, object]] = []
    loops: list[dict[str, object]] = []
    flips: list[dict[str, object]] = []
    if on_disk and path is not None:
        parsed = tags.read_serato_tags(str(path))
        cues = [dict(cue) for cue in parsed["cues"]]
        loops = [dict(loop) for loop in parsed["loops"]]
        flips = [dict(flip) for flip in parsed["flips"]]
    bpm = row["bpm"]
    beat_ms = None
    if isinstance(bpm, (int, float)) and not isinstance(bpm, bool) and bpm > 0:
        beat_ms = int(round(60_000 / float(bpm)))
    editable = False
    reason: str | None = None
    if protected_fields.blocked(["cues"], None):
        reason = "protected"
    elif not on_disk or path is None:
        reason = "missing"
    else:
        container = snapshot_frames._sniff_container(path)
        if container not in {"id3", "aiff", "flac", "mp4"}:
            reason = "unsupported"
        else:
            frames = snapshot_frames.read_stored_frames(path)
            stored = frames.get("Markers2")
            if stored is None:
                editable = True
            else:
                payload = _markers2_payload(stored, container)
                if payload is None or _split_entries(payload) is None:
                    reason = "corrupt"
                else:
                    editable = True
    fingerprint = _file_fingerprint(path) if on_disk and path is not None else None
    return {
        "id": int(row["id"]),
        "name": str(row["name"] or ""),
        "artist": str(row["artist"] or ""),
        "file": str(row["file_name"] or ""),
        "path": str(path) if path is not None else None,
        "cues": cues,
        "loops": loops,
        "flips": flips,
        "beat_ms": beat_ms,
        "editable": editable,
        "reason": reason,
        "fingerprint": fingerprint,
        "space": space,
    }


def _plan_write(
    state: dict[str, object],
    pads: list[dict[str, object] | None] | None,
    fingerprint: dict[str, int] | None,
) -> dict[str, object]:
    """Build the rewrite plan or a refusal reason.

    Args:
        state: Result of :func:`_inspect`.
        pads: Desired pads, or None.
        fingerprint: Client fingerprint, or None.

    Returns:
        ``editable``, ``diffs``, ``reason``, and optional ``prepared``.
    """
    public = _public(state, pads, fingerprint, preview=True, written=False, snapshot_id=None)
    if not public["editable"]:
        return {"editable": False, "diffs": public["diffs"], "reason": public["reason"]}
    if fingerprint is not None and state.get("fingerprint") != fingerprint:
        return {"editable": False, "diffs": [], "reason": "outside_change"}
    if not public["diffs"]:
        return {"editable": True, "diffs": [], "reason": None}
    path = Path(str(state["path"]))
    prepared = _prepare(path, pads if pads is not None else _slots_from_cues(state["cues"]))
    if prepared is None:
        return {"editable": False, "diffs": [], "reason": "corrupt"}
    return {
        "editable": True,
        "diffs": public["diffs"],
        "reason": None,
        "prepared": prepared,
    }


def _prepare(
    path: Path,
    pads: list[dict[str, object] | None],
) -> dict[str, object] | None:
    """Build before/after frame maps without writing.

    Args:
        path: Audio file.
        pads: Desired pads 0–7.

    Returns:
        Frame maps and expected cue map, or None when the payload is unsafe.
    """
    before_frames = snapshot_frames.read_stored_frames(path)
    container = snapshot_frames._sniff_container(path)
    stored = before_frames.get("Markers2")
    old_payload: bytes | None
    if stored is None:
        old_payload = None
        other_before: dict[str, list[bytes]] = {"loops": [], "flips": [], "other": []}
    else:
        old_payload = _markers2_payload(stored, container)
        if old_payload is None:
            return None
        split = _split_entries(old_payload)
        if split is None:
            return None
        _entries, other_before, _pad = split
    new_payload = _rewrite_payload(old_payload, pads)
    if new_payload is None:
        return None
    new_stored = _wrap_markers2(path, stored, new_payload, container)
    if new_stored is None:
        return None
    after_frames = dict(before_frames)
    after_frames["Markers2"] = new_stored
    expected: dict[int, tuple[int, str, str | None]] = {}
    for cue in tags._parse_markers2(new_payload)["cues"]:
        expected[int(cue["index"])] = (
            int(cue["start_ms"]),
            str(cue["name"]),
            cue.get("color") if isinstance(cue.get("color"), str) else None,
        )
    return {
        "before_frames": before_frames,
        "after_frames": after_frames,
        "expected": expected,
        "other_before": other_before,
    }


def _rewrite_payload(
    payload: bytes | None,
    pads: list[dict[str, object] | None],
) -> bytes | None:
    """Rebuild a Markers2 payload with the desired pads 0–7.

    Existing CUE entries for indexes 0–7 are replaced or removed. Other
    entries are copied as raw slices. New cues are appended in pad order.

    Args:
        payload: Existing Markers2 payload, or None when the file has none.
        pads: Eight slots. None means empty.

    Returns:
        The new payload, or None when the existing payload is corrupt.
    """
    inner = b""
    kept = bytearray()
    trailing = b""
    if payload is not None:
        split = _split_entries(payload)
        if split is None:
            return None
        entries, _other, trailing = split
        decoded = tags._decode_serato_base64(payload[2:])
        if decoded is None:
            return None
        if decoded.startswith(b"\x01\x01"):
            inner = decoded[:2]
        for kind, blob, raw in entries:
            if kind == b"CUE" and len(blob) >= 13 and blob[1] < SLOT_COUNT:
                continue
            kept += raw
    for index, pad in enumerate(pads):
        if pad is None:
            continue
        kept += _cue_entry(index, pad)
    new_decoded = inner + bytes(kept) + trailing
    return b"\x01\x01" + base64.b64encode(new_decoded)


def _cue_entry(index: int, pad: Mapping[str, object]) -> bytes:
    """Encode one CUE entry.

    Args:
        index: Pad index 0–7.
        pad: ``start_ms``, optional ``name`` and ``color``.

    Returns:
        Kind name, length, and cue bytes.
    """
    start = pad.get("start_ms")
    start_ms = int(start) if isinstance(start, (int, float)) and not isinstance(start, bool) else 0
    name = str(pad.get("name") or "")
    color = b"\x00\x00\x00"
    raw_color = pad.get("color")
    if isinstance(raw_color, str) and len(raw_color) == 7 and raw_color.startswith("#"):
        try:
            color = bytes.fromhex(raw_color[1:])
        except ValueError:
            color = b"\x00\x00\x00"
    elif index < len(PALETTE):
        color = bytes.fromhex(PALETTE[index][1:])
    blob = bytearray(12)
    blob[1] = index & 0xFF
    blob[2:6] = max(0, start_ms).to_bytes(4, "big")
    blob[7:10] = color
    return b"CUE\x00" + (len(blob) + len(name.encode("utf-8")) + 1).to_bytes(4, "big") + bytes(blob) + name.encode("utf-8") + b"\x00"


def _split_entries(
    payload: bytes,
) -> tuple[list[tuple[bytes, bytes, bytes]], dict[str, list[bytes]], bytes] | None:
    """Walk Markers2 entries, allowing trailing null padding.

    Args:
        payload: Markers2 bytes including the leading ``01 01`` pair.

    Returns:
        Entry triples ``(kind, blob, raw)``, a map of other entry blobs for
        verify, and trailing null bytes. None when an entry is truncated.
    """
    if len(payload) < 2 or payload[:2] != b"\x01\x01":
        return None
    decoded = tags._decode_serato_base64(payload[2:])
    if not decoded:
        return None
    body = decoded
    if body.startswith(b"\x01\x01"):
        body = body[2:]
    pos = 0
    entries: list[tuple[bytes, bytes, bytes]] = []
    other: dict[str, list[bytes]] = {"loops": [], "flips": [], "other": []}
    while pos < len(body):
        if body[pos] == 0:
            break
        end = body.find(b"\x00", pos)
        if end < 0 or end + 5 > len(body):
            return None
        length = int.from_bytes(body[end + 1 : end + 5], "big")
        start = end + 5
        if start + length > len(body):
            return None
        kind = body[pos:end]
        blob = body[start : start + length]
        raw = body[pos : start + length]
        entries.append((kind, blob, raw))
        if kind == b"LOOP":
            other["loops"].append(raw)
        elif kind == b"FLIP":
            other["flips"].append(raw)
        elif kind != b"CUE":
            other["other"].append(raw)
        pos = start + length
    trailing = body[pos:]
    if any(byte != 0 for byte in trailing):
        return None
    return entries, other, trailing


def _markers2_payload(stored: bytes, container: str) -> bytes | None:
    """Return the ``01 01`` Markers2 payload inside one stored frame.

    Args:
        stored: Exact bytes from ``read_stored_frames``.
        container: ``id3``, ``aiff``, ``flac``, or ``mp4``.

    Returns:
        The payload parsers accept, or None when the layout is unknown.
    """
    if container in {"id3", "aiff"}:
        if not stored.startswith(b"GEOB"):
            return None
        payload = snapshot_frames.payload_from_stored(stored)
        if len(payload) < 2 or payload[:2] != b"\x01\x01":
            return None
        return payload
    raw = stored
    if container == "mp4":
        if len(stored) < 8:
            return None
        raw = stored[8:]
    unwrapped = tags._unwrap_serato_envelope(raw)
    if unwrapped is None:
        return None
    name, payload = unwrapped
    if name != "Serato Markers2":
        return None
    if len(payload) < 2 or payload[:2] != b"\x01\x01":
        return None
    return payload


def _wrap_markers2(
    path: Path,
    stored: bytes | None,
    new_payload: bytes,
    container: str,
) -> bytes | None:
    """Build stored Markers2 bytes for this container.

    Args:
        path: Audio file (selects ID3 version for a new GEOB).
        stored: Previous stored frame, or None.
        new_payload: Replacement Markers2 payload.
        container: Container kind.

    Returns:
        Bytes ``restore_stored_frames`` accepts, or None on failure.
    """
    if container in {"id3", "aiff"}:
        if isinstance(stored, bytes) and stored.startswith(b"GEOB"):
            old_payload = snapshot_frames.payload_from_stored(stored)
            frame = _splice_geob_payload(stored, old_payload, new_payload)
            if frame is None:
                return None
            return frame
        return _new_geob(path, new_payload)
    wrapped = _serato_b64("Serato Markers2", new_payload, wrap=True)
    if container == "flac":
        return wrapped
    if container == "mp4":
        header = stored[:8] if isinstance(stored, bytes) and len(stored) >= 8 else _MP4_HEADER
        return header + wrapped
    return None


def _serato_b64(frame_name: str, payload: bytes, *, wrap: bool) -> bytes:
    """Base64-encode one Serato envelope the way FLAC and MP4 store it."""
    raw = _ENVELOPE + frame_name.encode("ascii") + b"\x00" + payload
    encoded = base64.b64encode(raw).rstrip(b"=")
    if not wrap:
        return encoded
    return b"\n".join(encoded[index : index + 72] for index in range(0, len(encoded), 72))


def _splice_geob_payload(frame: bytes, old_payload: bytes, new_payload: bytes) -> bytes | None:
    """Replace the Markers2 tail of one GEOB frame and keep its size field."""
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
    """Build a Serato Markers2 GEOB frame for a file that has none."""
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


def _cue_map(path: Path) -> dict[int, tuple[int, str, str | None]]:
    """Return cue index to start, name, and color."""
    found: dict[int, tuple[int, str, str | None]] = {}
    for cue in tags.read_serato_tags(str(path))["cues"]:
        color = cue.get("color") if isinstance(cue.get("color"), str) else None
        found[int(cue["index"])] = (int(cue["start_ms"]), str(cue["name"]), color)
    return found


def _other_entries_match(path: Path, before: Mapping[str, list[bytes]]) -> bool:
    """Return whether loops, flips, and other non-cue entries still match."""
    frames = snapshot_frames.read_stored_frames(path)
    stored = frames.get("Markers2")
    if not isinstance(stored, bytes):
        return not before["loops"] and not before["flips"] and not before["other"]
    container = snapshot_frames._sniff_container(path)
    payload = _markers2_payload(stored, container)
    if payload is None:
        return False
    split = _split_entries(payload)
    if split is None:
        return False
    _entries, after, _trailing = split
    return (
        after["loops"] == before["loops"]
        and after["flips"] == before["flips"]
        and after["other"] == before["other"]
    )


def _public(
    state: dict[str, object],
    pads: list[dict[str, object] | None] | None,
    fingerprint: dict[str, int] | None,
    *,
    preview: bool,
    written: bool,
    snapshot_id: str | None,
) -> dict[str, object]:
    """Return the JSON object for the page."""
    before = _slots_from_cues(state["cues"])
    after = before if pads is None else pads
    diffs: list[dict[str, object]] = []
    for slot in range(SLOT_COUNT):
        left = before[slot]
        right = after[slot]
        if _slot_signature(left) == _slot_signature(right):
            continue
        diffs.append({"slot": slot, "before": left, "after": right})
    editable = bool(state["editable"])
    reason = state.get("reason")
    if editable and fingerprint is not None and state.get("fingerprint") != fingerprint:
        editable = False
        reason = "outside_change"
    return {
        "preview": preview,
        "written": written,
        "id": state["id"],
        "space": state["space"],
        "file": state["file"],
        "editable": editable,
        "reason": reason,
        "fingerprint": state.get("fingerprint"),
        "beat_ms": state.get("beat_ms"),
        "palette": palette(),
        "before": before,
        "after": after,
        "diffs": diffs,
        "cues": state["cues"],
        "loops": state["loops"],
        "flips": state["flips"],
        "snapshot_id": snapshot_id,
    }


def _slots_from_cues(cues: object) -> list[dict[str, object] | None]:
    """Map cue rows onto eight pads."""
    slots: list[dict[str, object] | None] = [None] * SLOT_COUNT
    if not isinstance(cues, list):
        return slots
    for cue in cues:
        if not isinstance(cue, Mapping):
            continue
        index = cue.get("index")
        if isinstance(index, bool) or not isinstance(index, int) or index < 0 or index >= SLOT_COUNT:
            continue
        if slots[index] is not None:
            continue
        start = cue.get("start_ms")
        if isinstance(start, bool) or not isinstance(start, (int, float)):
            continue
        color = cue.get("color") if isinstance(cue.get("color"), str) else None
        slots[index] = {
            "index": index,
            "start_ms": int(start),
            "name": str(cue.get("name") or ""),
            "color": color,
        }
    return slots


def _slot_signature(slot: dict[str, object] | None) -> str:
    """Stable compare key for one pad."""
    if slot is None:
        return ""
    start = slot.get("start_ms")
    color = slot.get("color") if isinstance(slot.get("color"), str) else ""
    name = slot.get("name") if isinstance(slot.get("name"), str) else ""
    return f"{int(start) if isinstance(start, (int, float)) else 0}\0{color}\0{name}"


def _track_id(value: object) -> int:
    """Return a track id.

    Raises:
        library.LibraryError: Missing or non-integer id.
    """
    if isinstance(value, bool) or not isinstance(value, int):
        raise library.LibraryError("Track id is required.", 400)
    return value


def _pads_arg(value: object) -> list[dict[str, object] | None] | None:
    """Parse the desired pad list.

    Raises:
        library.LibraryError: Wrong length or a bad pad object.
    """
    if value is None:
        return None
    if not isinstance(value, list) or len(value) != SLOT_COUNT:
        raise library.LibraryError(BAD_PADS, 400)
    pads: list[dict[str, object] | None] = []
    for index, item in enumerate(value):
        if item is None:
            pads.append(None)
            continue
        if not isinstance(item, Mapping):
            raise library.LibraryError(BAD_PADS, 400)
        start = item.get("start_ms")
        if isinstance(start, bool) or not isinstance(start, (int, float)) or start < 0:
            raise library.LibraryError(BAD_PADS, 400)
        name = item.get("name")
        if name is not None and not isinstance(name, str):
            raise library.LibraryError(BAD_PADS, 400)
        color = item.get("color")
        if color is not None:
            if not isinstance(color, str) or not _valid_color(color):
                raise library.LibraryError(BAD_PADS, 400)
        pads.append(
            {
                "index": index,
                "start_ms": int(start),
                "name": name or "",
                "color": color,
            }
        )
    return pads


def _valid_color(value: str) -> bool:
    """Return whether ``value`` is a six-digit hex color."""
    if len(value) != 7 or not value.startswith("#"):
        return False
    try:
        bytes.fromhex(value[1:])
    except ValueError:
        return False
    return True


def _fingerprint_arg(value: object) -> dict[str, int] | None:
    """Parse a size/mtime fingerprint."""
    if value is None:
        return None
    if not isinstance(value, Mapping):
        raise library.LibraryError("That request is not valid.", 400)
    size = value.get("size")
    mtime_ns = value.get("mtime_ns")
    if isinstance(size, bool) or not isinstance(size, int):
        raise library.LibraryError("That request is not valid.", 400)
    if isinstance(mtime_ns, bool) or not isinstance(mtime_ns, int):
        raise library.LibraryError("That request is not valid.", 400)
    return {"size": size, "mtime_ns": mtime_ns}


def _file_fingerprint(path: Path) -> dict[str, int] | None:
    """Return size and mtime for one file."""
    try:
        stat = path.stat()
    except OSError:
        return None
    return {"size": int(stat.st_size), "mtime_ns": int(getattr(stat, "st_mtime_ns", int(stat.st_mtime * 1e9)))}
