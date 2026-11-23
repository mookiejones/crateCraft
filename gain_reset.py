#!/usr/bin/env python3
"""List non-zero Serato Autotags gain and reset Gain dB to 0 (#468).

Detection is read-only. Autotags after GEOB unwrap is ``01 01`` then three
null-terminated ASCII floats: BPM (2 decimals), Auto Gain (3 decimals),
and Gain dB (3 decimals). Only Gain dB is compared and rewritten.
Markers2, BeatGrid, and Overview stay as they were.

``scan`` and ``preview`` do not write. ``create`` with ``confirm`` true
saves a **Gain changed** crate under a labelled ``crateCraft`` folder so
a crate the DJ made is not overwritten. ``reset`` with ``confirm`` true
rewrites Autotags through ``snapshot_frames.restore_stored_frames`` inside
``safe_write`` after a snapshot, only while Serato is quit. After each
file write the Autotags are read back; a gain that is not 0 dB raises
``VerifyMismatch`` so the preimage is put back. An empty plan does not
write.

``python3 gain_reset.py`` prints the scan as JSON. It does not reset.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import math
import sqlite3
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import gig_check
import library
import snapshot_frames
import tags
import volumes

FOLDER_NAME = "crateCraft"
CRATE_NAME = "Gain changed"
NEEDS_CONFIRM = "Confirm before stored gain is reset to 0 dB."
ZERO_GAIN = "0.000"
# Tiny float noise around an exact 0.000 string still counts as zero.
GAIN_EPSILON = 1e-6
_B64_ALPHABET = frozenset(
    b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
)

_Saved = tuple[str, dict[str, bytes]]


class _Prepared:
    """One file whose Autotags Gain dB can be set to 0."""

    def __init__(
        self,
        path: Path,
        track: dict[str, object],
        gain_db: float,
        before: dict[str, bytes],
        after: dict[str, bytes],
    ) -> None:
        self.path = path
        self.file = str(track.get("file") or "")
        self.track = track
        self.gain_db = gain_db
        self.before = before
        self.after = after


def parse_autotags(payload: bytes) -> tuple[str, str, str] | None:
    """Split an Autotags payload into BPM, Auto Gain, and Gain dB text.

    Args:
        payload: Bytes after GEOB unwrap (or the decoded FLAC/MP4 value).
            May start with ``01 01`` or include that pair after an envelope
            prefix. The three fields are null-terminated ASCII floats.

    Returns:
        ``(bpm, auto_gain, gain_db)`` strings as stored, or None when the
        layout is not three fields after ``01 01``.
    """
    index = payload.find(b"\x01\x01")
    if index < 0:
        return None
    body = payload[index + 2 :]
    fields: list[str] = []
    pos = 0
    while len(fields) < 3:
        end = body.find(b"\x00", pos)
        if end < 0:
            return None
        try:
            fields.append(body[pos:end].decode("ascii"))
        except UnicodeDecodeError:
            return None
        pos = end + 1
    if any(byte != 0 for byte in body[pos:]):
        return None
    return fields[0], fields[1], fields[2]


def build_autotags(bpm: str, auto_gain: str, gain_db: str) -> bytes:
    """Build an Autotags payload with Gain dB set as given.

    Args:
        bpm: BPM text, usually two decimal places.
        auto_gain: Auto Gain text, usually three decimal places.
        gain_db: Gain dB text, usually three decimal places.

    Returns:
        ``01 01`` plus the three null-terminated ASCII fields.
    """
    return (
        b"\x01\x01"
        + bpm.encode("ascii")
        + b"\x00"
        + auto_gain.encode("ascii")
        + b"\x00"
        + gain_db.encode("ascii")
        + b"\x00"
    )


def gain_is_nonzero(gain_db: str | float) -> bool:
    """Return whether stored Gain dB should appear on the Gain changed list.

    Args:
        gain_db: Gain dB string from Autotags, or a float already parsed.

    Returns:
        True when the absolute value is greater than ``GAIN_EPSILON``.
        A non-finite or unreadable value is treated as non-zero so a bad
        field is still listed for review.
    """
    if isinstance(gain_db, str):
        try:
            value = float(gain_db)
        except ValueError:
            return True
    else:
        value = float(gain_db)
    if not math.isfinite(value):
        return True
    return abs(value) > GAIN_EPSILON


def read_gain(path: Path) -> float | None:
    """Read Autotags Gain dB from one audio file. Does not write.

    Args:
        path: Audio file on disk.

    Returns:
        The Gain dB float, or None when Autotags are missing or unreadable.
    """
    frames = snapshot_frames.read_stored_frames(path)
    stored = frames.get("Autotags")
    if not isinstance(stored, bytes):
        return None
    parsed = parse_autotags(snapshot_frames.payload_from_stored(stored))
    if parsed is None:
        return None
    try:
        return float(parsed[2])
    except ValueError:
        return None


def scan(database: Path, space: str) -> dict[str, object]:
    """List library tracks whose Autotags Gain dB is not 0. Read-only.

    An unplugged drive is ``offline``. A missing file on a connected drive
    is ``not_found``. A file with no Autotags or a zero gain is counted in
    ``checked`` and not listed.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.

    Returns:
        ``checked``, ``offline``, ``not_found``, ``unreadable``,
        ``changed``, ``folder``, and ``name``. Each changed row is
        ``id``, ``name``, ``artist``, ``file``, ``path``, and ``gain_db``.

    Raises:
        library.LibraryError: The space is unknown or the database cannot
            be read.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    changed: list[dict[str, object]] = []
    offline = not_found = unreadable = checked = 0
    for row in _rows(database, space):
        stored = row["portable_id"]
        if not isinstance(stored, str) or not stored:
            continue
        if volumes.absent_volume(stored) is not None:
            offline += 1
            continue
        resolved = library.resolved_path(stored) or stored
        path = Path(resolved)
        try:
            if not path.is_file() or path.is_symlink():
                not_found += 1
                continue
        except OSError:
            unreadable += 1
            continue
        checked += 1
        prepared = _inspect(path)
        if prepared is None:
            continue
        gain_value, _before, _after = prepared
        file_name = row.get("file_name")
        changed.append(
            {
                "id": row["id"],
                "name": row.get("name") if isinstance(row.get("name"), str) else "",
                "artist": row.get("artist") if isinstance(row.get("artist"), str) else "",
                "file": file_name if isinstance(file_name, str) and file_name else path.name,
                "path": str(path),
                "gain_db": round(gain_value, 3) if math.isfinite(gain_value) else gain_value,
            }
        )
    return {
        "checked": checked,
        "offline": offline,
        "not_found": not_found,
        "unreadable": unreadable,
        "changed": changed,
        "folder": FOLDER_NAME,
        "name": CRATE_NAME,
    }


def preview(space: str) -> dict[str, object]:
    """List tracks a reset would change. Nothing is written.

    Args:
        space: Space name.

    Returns:
        ``preview`` true, ``written`` false, and the scan fields.
    """
    return _plan(scan(Path(library.MASTER), space), written=False, preview=True)


def preview_crate(space: str) -> dict[str, object]:
    """List the Gain changed crate a scan would save. Nothing is written.

    Args:
        space: Space name.

    Returns:
        Scan counts plus ``preview`` true, ``written`` false, ``folder``,
        ``name``, ``added``, and ``saved`` null.
    """
    return _plan(scan(Path(library.MASTER), space), written=False, preview=True)


def create_crate(space: str) -> dict[str, object]:
    """Save Gain changed under the labelled crateCraft folder.

    Re-scans, ensures the ``crateCraft`` folder at the space root, then
    creates ``Gain changed`` as a child with the flagged tracks. Serato
    must be quit. An empty scan does not write. A top-level crate the DJ
    already named Gain changed is left alone.

    Args:
        space: Space name.

    Returns:
        A scan plus ``written`` true and ``saved`` when a crate was
        created, or ``written`` false when nothing was listed.

    Raises:
        library.LibraryError: Unknown space, or a database that cannot
            be opened.
        library.SeratoOpen: Serato still has the library open.
    """
    report = scan(Path(library.MASTER), space)
    ids = _ids(report)
    if not ids:
        return _plan(report, written=False, preview=False)
    folder_id = _ensure_folder(space)
    made = library.crate_action(
        {
            "action": "create",
            "space": space,
            "parent": folder_id,
            "name": CRATE_NAME,
            "assets": ids,
        }
    )
    result = _plan(report, written=True, preview=False, saved=made, added=len(ids))
    warning = made.get("warning")
    if isinstance(warning, str) and warning:
        result["warning"] = warning
    return result


def reset(space: str) -> dict[str, object]:
    """Set Autotags Gain dB to 0 through ``safe_write``.

    Serato must be quit. The session snapshots first. Each rewritten file
    is in ``extra_files``, so a failed check puts those bytes back. After
    each write the Autotags are read back; a non-zero gain raises
    ``VerifyMismatch``. Markers2 and BeatGrid bytes must still match the
    pre-write frames. A plan with nothing to change does not write.

    Args:
        space: Space name.

    Returns:
        ``written`` true when at least one file changed. ``_saved`` maps
        each path to the frame bytes from before the write (stripped
        before the HTTP response).

    Raises:
        library.LibraryError: The library cannot be written, or a frame
            rewrite is refused.
        library.SeratoOpen: Serato still holds the library.
    """
    database = Path(library.MASTER)
    ready = _ready(database, space)
    if not ready:
        return _plan(scan(database, space), written=False, preview=False)
    saved: list[_Saved] = []

    def body(_conn: sqlite3.Connection, write: Any) -> dict[str, object]:
        import safe_write

        changed: list[_Prepared] = []
        for item in ready:
            current = _inspect(item.path)
            if current is None:
                continue
            _gain, before, after = current
            write.set_target(item.file or item.path.name)
            try:
                snapshot_frames.restore_stored_frames(item.path, after)
            except snapshot_frames.FrameRewriteError as exc:
                raise library.LibraryError(exc.message, 400) from exc
            gained = read_gain(item.path)
            if gained is None or gain_is_nonzero(gained):
                raise safe_write.VerifyMismatch(
                    "Gain was not 0 dB after the write. The library was put back."
                )
            landed = snapshot_frames.read_stored_frames(item.path)
            for kind in ("Markers2", "BeatGrid"):
                if before.get(kind) != landed.get(kind):
                    raise safe_write.VerifyMismatch(
                        "A Serato frame that should stay put was changed. "
                        "The library was put back."
                    )
            saved.append((str(item.path), before))
            item.before = before
            item.after = after
            item.gain_db = 0.0
            changed.append(item)
        report = {
            "checked": len(ready),
            "offline": 0,
            "not_found": 0,
            "unreadable": 0,
            "changed": [
                {
                    "id": item.track["id"],
                    "name": item.track.get("name") or "",
                    "artist": item.track.get("artist") or "",
                    "file": item.file,
                    "path": str(item.path),
                    "gain_db": 0.0,
                }
                for item in changed
            ],
            "folder": FOLDER_NAME,
            "name": CRATE_NAME,
        }
        return _plan(report, written=bool(changed), preview=False, added=len(changed))

    import safe_write

    result = safe_write.run(
        "gain_reset",
        "stored gain",
        body,
        extra_files=[item.path for item in ready],
    )
    result["_saved"] = saved
    return result


def undo(saved: Sequence[_Saved]) -> None:
    """Put pre-write Autotags (and sibling frames) back.

    Args:
        saved: ``(path, frames)`` pairs from ``reset``'s ``_saved`` list.

    Raises:
        snapshot_frames.FrameRewriteError: A file cannot be restored.
        OSError: A file cannot be replaced.
    """
    for path, frames in saved:
        snapshot_frames.restore_stored_frames(path, frames)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/gain`` request.

    Args:
        payload: ``action`` is ``preview``, ``create``, or ``reset``.
            ``create`` and ``reset`` write only when ``confirm`` is true.
            Optional ``space``.

    Returns:
        That action's result, without undo bytes.

    Raises:
        library.LibraryError: The action or space is invalid, or confirm
            is missing for ``reset``.
        library.SeratoOpen: A write runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    confirm = payload.get("confirm") is True
    if kind == "preview":
        return preview(space)
    if kind == "create":
        if not confirm:
            return preview_crate(space)
        return create_crate(space)
    if kind == "reset":
        if not confirm:
            raise library.LibraryError(NEEDS_CONFIRM, 400)
        result = reset(space)
        result.pop("_saved", None)
        return result
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the scan as JSON. Does not reset gain or create a crate.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the scan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="List non-zero Autotags Gain dB. Read-only."
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


def _ids(report: Mapping[str, object]) -> list[int]:
    """Return changed asset ids in report order."""
    rows = report.get("changed")
    if not isinstance(rows, list):
        return []
    ids: list[int] = []
    seen: set[int] = set()
    for row in rows:
        if not isinstance(row, dict):
            continue
        asset_id = row.get("id")
        if isinstance(asset_id, bool) or not isinstance(asset_id, int) or asset_id in seen:
            continue
        seen.add(asset_id)
        ids.append(asset_id)
    return ids


def _plan(
    report: Mapping[str, object],
    *,
    written: bool,
    preview: bool,
    saved: Mapping[str, object] | None = None,
    added: int | None = None,
) -> dict[str, object]:
    """Build the POST result from a scan report and an optional new crate."""
    name = CRATE_NAME
    saved_id: object = None
    if saved is not None:
        label = saved.get("name")
        if isinstance(label, str) and label:
            name = label
        saved_id = saved.get("id")
    count = len(_ids(report)) if added is None else added
    crate = None
    if written and isinstance(saved_id, int) and not isinstance(saved_id, bool):
        crate = {"id": saved_id, "name": name}
    return {
        **dict(report),
        "preview": preview,
        "written": written,
        "folder": FOLDER_NAME,
        "name": name,
        "added": count,
        "saved": crate,
    }


def _ensure_folder(space: str) -> int:
    """Return the labelled crateCraft folder id, creating it when missing.

    Args:
        space: Space name.

    Returns:
        Container id of the folder at the space root.

    Raises:
        library.LibraryError: The space is missing or the crate cannot be
            created.
        library.SeratoOpen: Serato still holds the library.
    """
    existing = _find_root_child(space, FOLDER_NAME)
    if existing is not None:
        return existing
    made = library.crate_action(
        {
            "action": "create",
            "space": space,
            "name": FOLDER_NAME,
        }
    )
    folder_id = made.get("id")
    if isinstance(folder_id, bool) or not isinstance(folder_id, int):
        raise library.LibraryError("The crateCraft folder could not be created.")
    return folder_id


def _find_root_child(space: str, name: str) -> int | None:
    """Find a top-level normal crate by display name.

    Args:
        space: Space name.
        name: Visible crate name.

    Returns:
        The container id, or None when that child is absent.
    """
    conn = gig_check.open_read_only(Path(library.MASTER))
    try:
        root = conn.execute(
            """
            SELECT c.id FROM container c
            JOIN space s ON s.id = c.space_id
            WHERE s.name = ? AND c.type = 0
            """,
            (space,),
        ).fetchone()
        if root is None:
            raise library.LibraryError("That space is not available here.")
        rows = conn.execute(
            "SELECT id, name FROM container WHERE parent_id = ? AND type = 1",
            (int(root["id"]),),
        ).fetchall()
        want = name.casefold()
        for row in rows:
            stored = row["name"] if isinstance(row["name"], str) else ""
            if library.display_name(stored).casefold() == want:
                return int(row["id"])
        return None
    finally:
        conn.close()


def _ready(database: Path, space: str) -> list[_Prepared]:
    """Return files whose Autotags Gain dB can be set to 0.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        One prepared file per track with a non-zero Gain dB that this
        module can rewrite. Missing and offline files are skipped.
    """
    ready: list[_Prepared] = []
    for row in _rows(database, space):
        stored = row["portable_id"]
        if not isinstance(stored, str) or not stored:
            continue
        if volumes.absent_volume(stored) is not None:
            continue
        resolved = library.resolved_path(stored) or stored
        path = Path(resolved)
        prepared = _inspect(path)
        if prepared is None:
            continue
        gain, before, after = prepared
        track = {
            "id": row["id"],
            "name": row.get("name") or "",
            "artist": row.get("artist") or "",
            "file": row.get("file_name") or path.name,
        }
        ready.append(_Prepared(path, track, gain, before, after))
    return ready


def _inspect(path: Path) -> tuple[float, dict[str, bytes], dict[str, bytes]] | None:
    """Build rewritten Autotags frames without touching the file.

    Args:
        path: Audio file on disk.

    Returns:
        Gain dB, the original frame map, and the map to write. None when
        the file has no non-zero gain, or Autotags cannot be rewritten.
    """
    try:
        if not path.is_file() or path.is_symlink():
            return None
    except OSError:
        return None
    before = snapshot_frames.read_stored_frames(path)
    stored = before.get("Autotags")
    if not isinstance(stored, bytes):
        return None
    old_payload = snapshot_frames.payload_from_stored(stored)
    parsed = parse_autotags(old_payload)
    if parsed is None:
        return None
    bpm, auto_gain, gain_text = parsed
    if not gain_is_nonzero(gain_text):
        return None
    try:
        gain_value = float(gain_text)
    except ValueError:
        gain_value = float("nan")
    new_inner = build_autotags(bpm, auto_gain, ZERO_GAIN)
    new_stored = _replace_autotags(stored, old_payload, new_inner)
    if new_stored is None:
        return None
    after = dict(before)
    after["Autotags"] = new_stored
    return gain_value, before, after


def _replace_autotags(stored: bytes, old_payload: bytes, new_inner: bytes) -> bytes | None:
    """Put a new Autotags inner payload into the container's stored bytes.

    Args:
        stored: Exact bytes ``read_stored_frames`` returned for Autotags.
        old_payload: ``payload_from_stored(stored)``.
        new_inner: ``01 01`` plus the three null-terminated fields.

    Returns:
        Replacement stored bytes, or None when the layout is unknown.
    """
    new_payload = _swap_autotags_payload(old_payload, new_inner)
    if new_payload is None:
        return None
    if stored.startswith(b"GEOB"):
        return _splice_geob_payload(stored, old_payload, new_payload)
    if len(stored) >= 8 and stored[:8] == b"\x00" * 8:
        if stored[8:] == old_payload:
            return stored[:8] + new_payload
        return None
    compact = b"".join(stored.split())
    if len(compact) >= 4 and all(byte in _B64_ALPHABET for byte in compact):
        try:
            pad = (-len(compact)) % 4
            decoded = base64.b64decode(compact + (b"=" * pad), validate=False)
        except binascii.Error:
            return None
        if decoded == old_payload:
            return base64.b64encode(new_payload)
        if old_payload in decoded:
            return base64.b64encode(decoded.replace(old_payload, new_payload, 1))
        return None
    if stored == old_payload:
        return new_payload
    if stored.endswith(old_payload):
        return stored[: -len(old_payload)] + new_payload
    return None


def _swap_autotags_payload(payload: bytes, new_inner: bytes) -> bytes | None:
    """Replace the ``01 01`` Autotags body inside a payload.

    Args:
        payload: Value that contains ``01 01`` plus the three floats.
        new_inner: Full new Autotags payload starting with ``01 01``.

    Returns:
        Payload with the old Autotags body replaced, or None when the
        marker is missing.
    """
    index = payload.find(b"\x01\x01")
    if index < 0:
        return None
    old = parse_autotags(payload[index:])
    if old is None:
        return None
    old_full = build_autotags(*old)
    if payload[index : index + len(old_full)] == old_full:
        return payload[:index] + new_inner + payload[index + len(old_full) :]
    body = payload[index + 2 :]
    pos = 0
    for _ in range(3):
        end = body.find(b"\x00", pos)
        if end < 0:
            return None
        pos = end + 1
    return payload[:index] + new_inner + body[pos:]


def _splice_geob_payload(frame: bytes, old_payload: bytes, new_payload: bytes) -> bytes | None:
    """Replace the Autotags tail of one GEOB frame and keep its size field.

    Args:
        frame: Raw GEOB frame, header included.
        old_payload: Current Autotags payload. It must be the frame's tail.
        new_payload: Replacement payload.

    Returns:
        The frame with the same size encoding it already uses. None when
        the size field does not match the body.
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


if __name__ == "__main__":
    raise SystemExit(main())
