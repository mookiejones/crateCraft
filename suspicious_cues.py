"""Flag crowded Serato cue lists and drop same-time duplicates (#382).

Detection is read-only. A track is suspicious when Markers2 has more than
``CUE_COUNT_LIMIT`` cues, or at least ``SAME_TIME_LIMIT`` cues that share
one ``start_ms``. Cleanup keeps the first cue at each time and deletes the
later CUE entry bytes inside the existing Markers2 payload. Loops, flips,
and every other entry stay. The new bytes are wrapped in the same ``01 01``
plus base64 envelope ``tags._parse_markers2`` already reads. Only an ID3
GEOB frame is rewritten, through ``snapshot_frames.restore_stored_frames``.
FLAC, MP4, and AIFF are left unchanged. Apply runs inside ``safe_write``
after a snapshot, and only while Serato is quit. Undo puts the pre-write
frame bytes back with that same restore. A plan with nothing to drop does
not write. Nothing is written beside ``master.sqlite``.
"""

from __future__ import annotations

import base64
import sqlite3
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import file_scan
import gig_check
import library
import snapshot_frames
import tags

CUE_COUNT_LIMIT = 64
SAME_TIME_LIMIT = 8
NEEDS_CONFIRM = "Confirm before duplicate cues are removed."

_Saved = tuple[str, dict[str, bytes]]


def is_suspicious(cues: Sequence[Mapping[str, object]]) -> bool:
    """Return whether a cue list should appear on the health report.

    Args:
        cues: Cues from ``tags.read_serato_tags``. Each ``start_ms`` is an int.

    Returns:
        True when there are more than ``CUE_COUNT_LIMIT`` cues, or at least
        ``SAME_TIME_LIMIT`` cues share one start time.
    """
    if len(cues) > CUE_COUNT_LIMIT:
        return True
    counts: dict[int, int] = {}
    for cue in cues:
        start = cue.get("start_ms")
        if isinstance(start, bool) or not isinstance(start, int):
            continue
        counts[start] = counts.get(start, 0) + 1
        if counts[start] >= SAME_TIME_LIMIT:
            return True
    return False


def preview(space: str, crate_id: int | None = None) -> dict[str, object]:
    """List duplicate cues that apply would drop. Nothing is written.

    Args:
        space: Space name.
        crate_id: Crate id, including subcrates. None checks the space.

    Returns:
        ``preview`` true, ``written`` false, and the tracks whose extra
        same-time cues can be removed from an ID3 GEOB frame.

    Raises:
        library.LibraryError: Unknown space, or a crate not in the space.
    """
    database = Path(library.MASTER)
    ready = _ready(database, space, crate_id)
    return _public(space, crate_id, ready, written=False, preview=True)


def apply(space: str, crate_id: int | None = None) -> dict[str, object]:
    """Drop same-time duplicate cues through ``safe_write``.

    Serato must be quit. The session snapshots the library first. Each
    rewritten file is in ``extra_files``, so a failed check puts those
    bytes back. ``_saved`` on the result is for ``undo`` and is not sent
    on the HTTP response.

    Args:
        space: Space name.
        crate_id: Crate id, including subcrates. None checks the space.

    Returns:
        ``written`` true when at least one file changed. ``written`` false
        when there is nothing to drop. ``_saved`` maps each path to the
        frame bytes from before the write.

    Raises:
        library.LibraryError: The library cannot be written, or a frame
            rewrite is refused.
        library.SeratoOpen: Serato still holds the library.
    """
    database = Path(library.MASTER)
    ready = _ready(database, space, crate_id)
    if not ready:
        return _public(space, crate_id, [], written=False, preview=False)
    saved: list[_Saved] = []

    def body(_conn: sqlite3.Connection, write: Any) -> dict[str, object]:
        import safe_write

        changed: list[_Prepared] = []
        for item in ready:
            current = _inspect(item.path)
            if current is None:
                continue
            drops, before, after = current
            write.set_target(item.file or item.path.name)
            try:
                snapshot_frames.restore_stored_frames(item.path, after)
            except snapshot_frames.FrameRewriteError as exc:
                raise library.LibraryError(exc.message, 400) from exc
            cues = tags.read_serato_tags(str(item.path))["cues"]
            if _duplicate_starts(cues):
                raise safe_write.VerifyMismatch("Duplicate cues were still in the file.")
            saved.append((str(item.path), before))
            item.drops = drops
            changed.append(item)
        return _public(space, crate_id, changed, written=bool(changed), preview=False)

    import safe_write

    result = safe_write.run(
        "suspicious_cues",
        "duplicate cues",
        body,
        extra_files=[item.path for item in ready],
    )
    result["_saved"] = saved
    return result


def undo(saved: Sequence[_Saved]) -> None:
    """Put pre-write Markers2 bytes back.

    Args:
        saved: ``(path, frames)`` pairs from ``apply``'s ``_saved`` list.
            ``frames`` is the map ``read_stored_frames`` returned before
            the write.

    Raises:
        snapshot_frames.FrameRewriteError: A file cannot be restored.
        OSError: A file cannot be replaced.
    """
    for path, frames in saved:
        snapshot_frames.restore_stored_frames(path, frames)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/suspicious-cues`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. ``apply`` writes
            only when ``confirm`` is true. Optional ``space`` and ``crate``.

    Returns:
        That action's result, without the undo bytes.

    Raises:
        library.LibraryError: The action, the crate, or confirm is invalid.
        library.SeratoOpen: ``apply`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    crate_id = _crate_arg(payload.get("crate"))
    if kind == "preview":
        return preview(space, crate_id)
    if kind == "apply":
        if payload.get("confirm") is not True:
            raise library.LibraryError(NEEDS_CONFIRM, 400)
        result = apply(space, crate_id)
        result.pop("_saved", None)
        return result
    raise library.LibraryError("That action is not available.")


class _Prepared:
    """One file whose duplicate cue entries can be deleted."""

    def __init__(
        self,
        path: Path,
        track: dict[str, object],
        drops: list[dict[str, object]],
        before: dict[str, bytes],
        after: dict[str, bytes],
    ) -> None:
        self.path = path
        self.file = str(track.get("file") or "")
        self.track = track
        self.drops = drops
        self.before = before
        self.after = after


def _crate_arg(value: object) -> int | None:
    """Return a crate id, or None for the whole space.

    Args:
        value: JSON ``crate``. None, ``all``, or an empty string is the space.

    Returns:
        The crate id.

    Raises:
        library.LibraryError: The value is not an integer crate id.
    """
    if value is None or value == "all" or value == "":
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise library.LibraryError("That request is not valid.")
    return value


def _on_disk(portable_id: object) -> str | None:
    """Return a path when the stored file is on disk.

    Args:
        portable_id: ``asset.portable_id``.

    Returns:
        An existing file path, or None when the file is missing, offline,
        or unreadable. A missing file is not opened.
    """
    stored = portable_id if isinstance(portable_id, str) else None
    resolved = library.resolved_path(stored)
    if not resolved:
        return None
    path = Path(resolved)
    try:
        if path.is_file():
            return str(path)
    except OSError:
        return None
    return None


def _rows(database: Path, space: str, crate_id: int | None) -> list[dict[str, object]]:
    """Return space assets, limited to one crate when asked.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Crate id, or None.

    Returns:
        Plain dicts. The read connection is closed before return.

    Raises:
        library.LibraryError: Unknown space, or a crate not in the space.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        space_row = conn.execute("SELECT id FROM space WHERE name = ?", (space,)).fetchone()
        if space_row is None:
            raise library.LibraryError("That space is not available here.")
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
        if crate_id is not None:
            library.container_in_space(conn, crate_id, space)
            members = file_scan._crate_assets(conn, library.descendant_ids(conn, crate_id))
            found = [row for row in found if int(row["id"]) in members]
        return [
            {
                "id": int(row["id"]),
                "name": str(row["name"] or ""),
                "artist": str(row["artist"] or ""),
                "file": str(row["file_name"] or ""),
                "portable_id": row["portable_id"],
            }
            for row in found
        ]
    finally:
        conn.close()


def _ready(database: Path, space: str, crate_id: int | None) -> list[_Prepared]:
    """Return files whose duplicate cue entries can be deleted.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Crate id, or None.

    Returns:
        One prepared file per track that has a same-time extra and an ID3
        GEOB Markers2 frame. Missing files are skipped. Nothing is written.
    """
    ready: list[_Prepared] = []
    for row in _rows(database, space, crate_id):
        path = _on_disk(row.get("portable_id"))
        if path is None:
            continue
        prepared = _inspect(Path(path))
        if prepared is None:
            continue
        drops, before, after = prepared
        ready.append(_Prepared(Path(path), row, drops, before, after))
    return ready


def _inspect(path: Path) -> tuple[list[dict[str, object]], dict[str, bytes], dict[str, bytes]] | None:
    """Build a rewritten Markers2 frame without touching the file.

    Args:
        path: Audio file on disk.

    Returns:
        Dropped cues, the original frame map, and the map to write.
        None when the file has no same-time extra, or the frame is not an
        ID3 GEOB this module can splice.
    """
    try:
        if not path.is_file() or path.is_symlink():
            return None
    except OSError:
        return None
    before = snapshot_frames.read_stored_frames(path)
    stored = before.get("Markers2")
    if not isinstance(stored, bytes) or not stored.startswith(b"GEOB"):
        return None
    old_payload = snapshot_frames.payload_from_stored(stored)
    rewritten = _rewrite_payload(old_payload)
    if rewritten is None:
        return None
    new_payload, drops = rewritten
    new_frame = _splice_geob_payload(stored, old_payload, new_payload)
    if new_frame is None:
        return None
    if snapshot_frames.payload_from_stored(new_frame) != new_payload:
        return None
    after = dict(before)
    after["Markers2"] = new_frame
    return drops, before, after


def _rewrite_payload(payload: bytes) -> tuple[bytes, list[dict[str, object]]] | None:
    """Delete later CUE entries that repeat a ``start_ms``.

    The walk uses the same entry size as ``tags._parse_markers2``: a
    NUL-terminated name, a 4-byte big-endian length, and that many bytes.
    Kept entries are copied as raw slices. The result uses the same leading
    ``01 01`` and base64 envelope. A truncated payload is refused.

    Args:
        payload: Markers2 bytes, including the leading ``01 01`` pair.

    Returns:
        The new payload and the cues that were dropped. None when nothing
        would change, or the payload is not safe to rebuild.
    """
    if tags.markers2_issue_code(payload) is not None:
        return None
    if len(payload) < 2 or payload[:2] != b"\x01\x01":
        return None
    decoded = tags._decode_serato_base64(payload[2:])
    if not decoded:
        return None
    inner = b""
    body = decoded
    if body.startswith(b"\x01\x01"):
        inner = body[:2]
        body = body[2:]
    before = tags._parse_markers2(payload)
    pos = 0
    kept = bytearray()
    seen: set[int] = set()
    drops: list[dict[str, object]] = []
    while pos < len(body):
        end = body.find(b"\x00", pos)
        if end < 0 or end + 5 > len(body):
            return None
        length = int.from_bytes(body[end + 1:end + 5], "big")
        start = end + 5
        if start + length > len(body):
            return None
        entry = body[pos:start + length]
        kind = body[pos:end]
        blob = body[start:start + length]
        if kind == b"CUE" and len(blob) >= 13:
            start_ms = int.from_bytes(blob[2:6], "big")
            if start_ms in seen:
                name = blob[12:].split(b"\x00", 1)[0].decode("utf-8", "replace")
                drops.append({"index": blob[1], "start_ms": start_ms, "name": name})
            else:
                seen.add(start_ms)
                kept += entry
        else:
            kept += entry
        pos = start + length
    if pos != len(body) or not drops:
        return None
    new_payload = b"\x01\x01" + base64.b64encode(inner + bytes(kept))
    if tags.markers2_issue_code(new_payload) is not None:
        return None
    after = tags._parse_markers2(new_payload)
    if len(after["loops"]) != len(before["loops"]) or len(after["flips"]) != len(before["flips"]):
        return None
    if len(after["cues"]) != len(before["cues"]) - len(drops):
        return None
    return new_payload, drops


def _splice_geob_payload(frame: bytes, old_payload: bytes, new_payload: bytes) -> bytes | None:
    """Replace the Markers2 tail of one GEOB frame and keep its size field.

    Args:
        frame: Raw GEOB frame, header included.
        old_payload: Current Markers2 payload. It must be the frame's tail.
        new_payload: Replacement payload.

    Returns:
        The frame with the same size encoding it already uses. None when
        the size field does not match the body, which means the layout is
        not one this splice understands.
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


def _duplicate_starts(cues: Sequence[Mapping[str, object]]) -> bool:
    """Return whether any start time appears more than once.

    Args:
        cues: Parsed cues.

    Returns:
        True when a later cue repeats an earlier ``start_ms``.
    """
    seen: set[int] = set()
    for cue in cues:
        start = cue.get("start_ms")
        if isinstance(start, bool) or not isinstance(start, int):
            continue
        if start in seen:
            return True
        seen.add(start)
    return False


def _public(
    space: str,
    crate_id: int | None,
    ready: Sequence[_Prepared],
    *,
    written: bool,
    preview: bool,
) -> dict[str, object]:
    """Return the JSON object, without paths or frame bytes.

    Args:
        space: Space name.
        crate_id: Crate id, or None.
        ready: Files that would change, or did change.
        written: True after a successful write.
        preview: True for the preview action.

    Returns:
        ``preview``, ``written``, ``count``, ``dropped``, and ``tracks``.
        Each track lists only the cues that are dropped.
    """
    tracks: list[dict[str, object]] = []
    dropped = 0
    for item in ready:
        dropped += len(item.drops)
        tracks.append(
            {
                "id": item.track["id"],
                "name": item.track["name"],
                "artist": item.track["artist"],
                "file": item.track["file"],
                "cues": item.drops,
            }
        )
    return {
        "preview": preview,
        "written": written,
        "space": space,
        "crate": crate_id,
        "count": len(tracks),
        "dropped": dropped,
        "tracks": tracks,
    }
