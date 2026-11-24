#!/usr/bin/env python3
"""Mark tracks unanalyzed so Serato rebuilds grids and overviews (#473).

crateCraft does not re-analyze audio. After a confirmed write the DJ opens
the tracks in Serato (Analyze Files or load to a deck) for the redo.

**v1 choice (master.sqlite):** Serato DJ Pro 4/5 has no Database V2
``OVERVIEW_BUILT`` field. The analogous mark is clearing bit 2 of
``asset.analysis_flags`` (value 4), the "Serato ran its own analysis" bit
observed by serato-dj-mcp. Default apply also removes BeatGrid and
Autotags from the audio file through ``snapshot_frames.clear_analysis_frames``,
keeping Markers2 cues. Overview and ``RVA2:SeratoGain`` stay; Serato
overwrites them on Analyze Files. Pass ``clear_frames`` false for a
database-only mark. Locked beatgrids stay locked unless
``include_locked`` is true (which clears ``is_beatgrid_locked`` only).
The other tracks in the crate are still marked. The same mark is copied
into a connected location database. If that copy does not take the mark,
the preimage is put back. An unplugged drive is reported and the laptop
mark stays.

Inspired by serato-tools 6.0.0 ``Library.set_unanalyzed`` /
``DatabaseV2.set_unanalyzed`` / ``Track.delete_analysis`` (MIT,
https://github.com/bvandrc/serato-tools). Reimplemented with this repo's
``safe_write`` and ``snapshot_frames``; serato-tools is not a dependency.

Preview is read-only. Apply runs through ``safe_write`` with Serato
closed, verifies the mark and cleared frames, and rolls back on mismatch.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path
from typing import Any

import file_scan
import gig_check
import library
import snapshot_frames

# Bit 2 of analysis_flags: Serato ran its own analysis (serato-dj-mcp).
ANALYZED_BIT = 4
NEEDS_CONFIRM = "Confirm before tracks are marked for re-analyze."
NEEDS_CRATE = "Choose a crate for re-analyze."
DID_NOT_STICK = "The unanalyzed mark did not stick. The library was put back."
LOCKED = "Those beatgrids are locked. Turn on Include locked beatgrids to unlock them."
MARKERS_NOTE = (
    "Markers2 cues stay. BeatGrid and Autotags are cleared when clear_frames "
    "is on. Overview stays for Serato to overwrite. Open the tracks in Serato "
    "to rebuild grids and overviews."
)

Plan = dict[str, object]


class _Prepared:
    """One track that can be marked unanalyzed."""

    def __init__(
        self,
        asset_id: int,
        name: str,
        artist: str,
        file_name: str,
        path: Path | None,
        analysis_flags: int,
        locked: bool,
        has_beatgrid: bool,
        has_autotags: bool,
        has_markers2: bool,
    ) -> None:
        self.id = asset_id
        self.name = name
        self.artist = artist
        self.file = file_name
        self.path = path
        self.analysis_flags = analysis_flags
        self.locked = locked
        self.has_beatgrid = has_beatgrid
        self.has_autotags = has_autotags
        self.has_markers2 = has_markers2
        self.cleared: list[str] = []


def analyzed_bit_set(flags: object) -> bool:
    """Return whether ``analysis_flags`` has the Serato-analyzed bit.

    Args:
        flags: Stored integer, or None.

    Returns:
        True when bit 2 is set.
    """
    if isinstance(flags, bool) or not isinstance(flags, int):
        return False
    return bool(flags & ANALYZED_BIT)


def clear_analyzed_bit(flags: object) -> int:
    """Return ``flags`` with the Serato-analyzed bit cleared.

    Args:
        flags: Stored integer, or None treated as 0.

    Returns:
        The new flags value.
    """
    if isinstance(flags, bool) or not isinstance(flags, int):
        return 0
    return flags & ~ANALYZED_BIT


def require_crate(crate_id: int | None) -> None:
    """Refuse a whole-library write from the page.

    Args:
        crate_id: Crate id, or None.

    Raises:
        library.LibraryError: No crate (400).
    """
    if crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)


def _crate_arg(value: object) -> int | None:
    """Return a crate id, or None for the whole space (CLI only).

    Args:
        value: JSON ``crate``.

    Returns:
        The crate id, or None.

    Raises:
        library.LibraryError: The value is not a valid crate id.
    """
    if value is None or value == "all" or value == "":
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise library.LibraryError("That request is not valid.", 400)
    return value


def _parse_ids(raw: object) -> list[int] | None:
    """Return unique asset ids, or None when every ready track is wanted.

    Args:
        raw: Request ``ids``. Missing means every ready track. An empty
            list means write nothing.

    Returns:
        Deduplicated ids, or None.

    Raises:
        library.LibraryError: The value is present and not a list of ints.
    """
    if raw is None:
        return None
    if not isinstance(raw, list):
        raise library.LibraryError("That request is not valid.", 400)
    unique: list[int] = []
    seen: set[int] = set()
    for item in raw:
        if isinstance(item, bool) or not isinstance(item, int):
            raise library.LibraryError("That request is not valid.", 400)
        if item in seen:
            continue
        seen.add(item)
        unique.append(item)
    return unique


def _on_disk(portable_id: object) -> Path | None:
    """Return a path when the stored file is on disk.

    Args:
        portable_id: ``asset.portable_id``.

    Returns:
        An existing regular file, or None.
    """
    stored = portable_id if isinstance(portable_id, str) else None
    resolved = library.resolved_path(stored)
    if not resolved:
        return None
    path = Path(resolved)
    try:
        if path.is_file() and not path.is_symlink():
            return path
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
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id,
                   a.analysis_flags, a.is_beatgrid_locked
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
                "analysis_flags": row["analysis_flags"],
                "is_beatgrid_locked": int(row["is_beatgrid_locked"] or 0),
            }
            for row in found
        ]
    finally:
        conn.close()


def _needs_mark(
    flags: object,
    has_beatgrid: bool,
    has_autotags: bool,
    *,
    clear_frames: bool,
) -> bool:
    """Return whether this track still needs a re-analyze mark.

    Args:
        flags: ``analysis_flags``.
        has_beatgrid: BeatGrid frame present.
        has_autotags: Autotags frame present.
        clear_frames: Whether apply will strip analysis frames.

    Returns:
        True when the analyzed bit is set, or when frames would be cleared.
    """
    if analyzed_bit_set(flags):
        return True
    if clear_frames and (has_beatgrid or has_autotags):
        return True
    return False


def _ready(
    database: Path,
    space: str,
    crate_id: int | None,
    *,
    clear_frames: bool,
    include_locked: bool,
    ids: list[int] | None,
) -> tuple[list[_Prepared], list[_Prepared]]:
    """Build the tracks that would change, and any locked refusals.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Crate id, or None.
        clear_frames: Whether frame clears are planned.
        include_locked: Whether locked grids may be unlocked.
        ids: Optional asset filter.

    Returns:
        ``(ready, locked)``. Locked is non-empty only when
        ``include_locked`` is false and a chosen track has a lock.

    Raises:
        library.LibraryError: Unknown space or crate.
    """
    wanted = None if ids is None else set(ids)
    ready: list[_Prepared] = []
    locked: list[_Prepared] = []
    for row in _rows(database, space, crate_id):
        asset_id = int(row["id"])
        if wanted is not None and asset_id not in wanted:
            continue
        path = _on_disk(row.get("portable_id"))
        frames: dict[str, bytes] = {}
        if path is not None:
            frames = snapshot_frames.read_stored_frames(path)
        has_beatgrid = "BeatGrid" in frames
        has_autotags = "Autotags" in frames
        has_markers2 = "Markers2" in frames
        flags = row.get("analysis_flags")
        is_locked = bool(row.get("is_beatgrid_locked"))
        if not _needs_mark(flags, has_beatgrid, has_autotags, clear_frames=clear_frames):
            continue
        item = _Prepared(
            asset_id=asset_id,
            name=str(row["name"] or ""),
            artist=str(row["artist"] or ""),
            file_name=str(row["file"] or ""),
            path=path,
            analysis_flags=int(flags) if isinstance(flags, int) and not isinstance(flags, bool) else 0,
            locked=is_locked,
            has_beatgrid=has_beatgrid,
            has_autotags=has_autotags,
            has_markers2=has_markers2,
        )
        if is_locked and not include_locked:
            locked.append(item)
            continue
        if clear_frames:
            if has_beatgrid:
                item.cleared.append("BeatGrid")
            if has_autotags:
                item.cleared.append("Autotags")
        ready.append(item)
    return ready, locked


def _public(
    space: str,
    crate_id: int | None,
    ready: Sequence[_Prepared],
    *,
    written: bool,
    preview: bool,
    clear_frames: bool,
    include_locked: bool,
    locked: Sequence[_Prepared] = (),
) -> Plan:
    """Return the JSON object without paths or frame bytes.

    Args:
        space: Space name.
        crate_id: Crate id, or None.
        ready: Tracks that would change, or did change.
        written: True after a successful write.
        preview: True for preview.
        clear_frames: Whether frames are cleared.
        include_locked: Whether locks may be cleared.
        locked: Tracks left unchanged because the beatgrid is locked.

    Returns:
        Public plan fields.
    """
    tracks: list[dict[str, object]] = []
    for item in ready:
        tracks.append(
            {
                "id": item.id,
                "name": item.name,
                "artist": item.artist,
                "file": item.file,
                "path": str(item.path) if item.path is not None else "",
                "analysis_flags": item.analysis_flags,
                "locked": item.locked,
                "has_beatgrid": item.has_beatgrid,
                "has_autotags": item.has_autotags,
                "has_markers2": item.has_markers2,
                "cleared": list(item.cleared),
            }
        )
    locked_rows = [
        {
            "id": item.id,
            "name": item.name,
            "artist": item.artist,
            "file": item.file,
        }
        for item in locked
    ]
    return {
        "preview": preview,
        "written": written,
        "space": space,
        "crate": crate_id,
        "count": len(tracks),
        "tracks": tracks,
        "locked": locked_rows,
        "clear_frames": clear_frames,
        "include_locked": include_locked,
        "markers2": "unchanged",
        "message": MARKERS_NOTE,
    }


def preview(
    space: str,
    crate_id: int | None = None,
    *,
    clear_frames: bool = True,
    include_locked: bool = False,
    ids: list[int] | None = None,
) -> Plan:
    """List tracks that would be marked unanalyzed. Nothing is written.

    Args:
        space: Space name.
        crate_id: Crate id. The page requires one.
        clear_frames: Whether BeatGrid and Autotags would be removed.
        include_locked: Whether locked grids are included.
        ids: Optional asset filter.

    Returns:
        Preview JSON.

    Raises:
        library.LibraryError: Unknown space or crate.
    """
    database = Path(library.MASTER)
    ready, locked = _ready(
        database,
        space,
        crate_id,
        clear_frames=clear_frames,
        include_locked=include_locked,
        ids=ids,
    )
    return _public(
        space,
        crate_id,
        ready,
        written=False,
        preview=True,
        clear_frames=clear_frames,
        include_locked=include_locked,
        locked=locked,
    )


class _LocationMiss(Exception):
    """The location row still has the analyzed bit, so the transaction must not commit."""


class _LocationUndo:
    """Previous location flags to put back when a later track does not take the mark."""

    def __init__(self, path: Path, external_id: int, flags: object, lock: object) -> None:
        """Remember one location row.

        Args:
            path: Location database file.
            external_id: Asset id in that database.
            flags: ``analysis_flags`` before this write.
            lock: ``is_beatgrid_locked`` before this write.
        """
        self.path = path
        self.external_id = external_id
        self.flags = flags
        self.lock = lock

    def restore(self) -> None:
        """Write the previous flags and lock. A missing file is left alone."""

        def apply(conn: sqlite3.Connection) -> str | None:
            """Restore the two columns inside the location transaction."""
            library._assign(
                conn,
                "asset",
                {"analysis_flags": self.flags, "is_beatgrid_locked": self.lock},
                "id = ?",
                self.external_id,
            )
            return None

        library._with_location(self.path, apply)


def _push_location(
    master: sqlite3.Connection,
    asset_id: int,
    unlock: bool,
) -> tuple[str, _LocationUndo | None]:
    """Copy the unanalyzed mark into one track's location database.

    The location row keeps its other flag bits. Only the analyzed bit is
    cleared, and the lock is cleared when ``unlock`` is true.

    Args:
        master: Read connection for ``master.sqlite``.
        asset_id: Master asset id.
        unlock: Whether this track's beatgrid lock is cleared.

    Returns:
        ``(status, undo)``. ``status`` is ``skip`` when the track has no
        location row, ``absent`` when the location file is not on disk,
        ``ok`` after a committed update, or ``failed`` when a connected
        location does not take the mark. ``undo`` is set only after a
        committed update.
    """
    asset = library._asset_location(master, asset_id)
    location_id = asset["location_id"]
    external = asset["external_id"]
    if location_id is None or external is None:
        return "skip", None
    path = library._location_paths(master).get(int(location_id))
    if path is None:
        return "absent", None
    external_id = int(external)
    saved: dict[str, object] = {}

    def apply(conn: sqlite3.Connection) -> str | None:
        """Clear the analyzed bit on the location row and read it back."""
        present = library._columns(conn, "asset")
        if "analysis_flags" not in present:
            saved["status"] = "skip"
            return None
        before = conn.execute(
            "SELECT analysis_flags, is_beatgrid_locked FROM asset WHERE id = ?",
            (external_id,),
        ).fetchone()
        if before is None:
            saved["status"] = "skip"
            return None
        new_flags = clear_analyzed_bit(before[0])
        saved["before_flags"] = before[0]
        saved["before_lock"] = before[1]
        values: dict[str, object] = {"analysis_flags": new_flags}
        if unlock and "is_beatgrid_locked" in present:
            values["is_beatgrid_locked"] = 0
        revision = library._next_revision(conn)
        if "revision" in present:
            values["revision"] = revision
        library._assign(conn, "asset", values, "id = ?", external_id)
        row = conn.execute(
            "SELECT analysis_flags, is_beatgrid_locked FROM asset WHERE id = ?",
            (external_id,),
        ).fetchone()
        if row is None or analyzed_bit_set(row[0]):
            raise _LocationMiss()
        if unlock and "is_beatgrid_locked" in present and int(row[1] or 0):
            raise _LocationMiss()
        saved["status"] = "ok"
        return None

    try:
        warning = library._with_location(path, apply)
    except _LocationMiss:
        return "failed", None
    if isinstance(warning, str) and "was not updated" in warning:
        return "failed", None
    if isinstance(warning, str):
        return "absent", None
    if saved.get("status") != "ok":
        return "skip", None
    return "ok", _LocationUndo(path, external_id, saved.get("before_flags"), saved.get("before_lock"))


def _sync_location_marks(
    ready: Sequence[_Prepared],
    expected_unlock: set[int],
    snapshot_id: str,
) -> bool:
    """Copy the mark into each connected location database.

    Args:
        ready: Tracks the master write marked.
        expected_unlock: Asset ids whose beatgrid lock was cleared.
        snapshot_id: Preimage from the master write. Used when a location
            copy does not take the mark.

    Returns:
        True when a location file is not on disk. The master mark stays.

    Raises:
        library.LibraryError: A connected location did not take the mark.
            Location rows already written are put back, then the preimage
            (database and audio) is restored.
    """
    import safe_write

    undos: list[_LocationUndo] = []
    absent = False
    try:
        with closing(library.read_conn()) as master:
            for item in ready:
                status, undo = _push_location(master, item.id, item.id in expected_unlock)
                if undo is not None:
                    undos.append(undo)
                if status == "absent":
                    absent = True
                elif status == "failed":
                    raise library.LibraryError(DID_NOT_STICK, 409)
    except Exception:
        for undo in undos:
            try:
                undo.restore()
            except (OSError, sqlite3.Error, library.LibraryError):
                continue
        if snapshot_id:
            safe_write.undo_preimage(snapshot_id, operation="reanalyze", target="re-analyze")
        raise
    return absent


def apply(
    space: str,
    crate_id: int | None = None,
    *,
    clear_frames: bool = True,
    include_locked: bool = False,
    ids: list[int] | None = None,
) -> Plan:
    """Mark tracks unanalyzed through ``safe_write``.

    Serato must be quit. An empty plan does not write. Locked tracks are
    left unchanged when ``include_locked`` is false. If every chosen track
    is locked, nothing is written.

    Args:
        space: Space name.
        crate_id: Crate id. The page requires one.
        clear_frames: Remove BeatGrid and Autotags; keep Markers2.
        include_locked: Unlock beatgrids that are locked.
        ids: Optional asset filter.

    Returns:
        Apply JSON. ``written`` is false when nothing needs a mark.

    Raises:
        library.LibraryError: Refused, or verify failed after rollback.
        library.SeratoOpen: Serato still holds the library.
    """
    import safe_write

    database = Path(library.MASTER)
    ready, locked = _ready(
        database,
        space,
        crate_id,
        clear_frames=clear_frames,
        include_locked=include_locked,
        ids=ids,
    )
    if locked and not ready:
        raise library.LibraryError(LOCKED, 400)
    if not ready:
        return _public(
            space,
            crate_id,
            [],
            written=False,
            preview=False,
            clear_frames=clear_frames,
            include_locked=include_locked,
        )

    extra: list[Path] = []
    if clear_frames:
        for item in ready:
            if item.path is not None and (item.has_beatgrid or item.has_autotags):
                extra.append(item.path)

    expected_flags: dict[int, int] = {}
    expected_unlock: set[int] = set()
    frame_checks: list[tuple[Path, bool, bytes | None]] = []
    snapshot_ids: list[str] = []

    def body(conn: sqlite3.Connection, write: Any) -> Plan:
        """Update flags, clear frames, and register the post-commit check."""
        snapshot_id = getattr(write, "snapshot_id", None)
        if isinstance(snapshot_id, str) and snapshot_id:
            snapshot_ids.append(snapshot_id)
        for item in ready:
            write.set_target(item.file or item.name or f"track {item.id}")
            live = conn.execute(
                "SELECT analysis_flags FROM asset WHERE id = ?",
                (item.id,),
            ).fetchone()
            if live is None:
                raise safe_write.VerifyMismatch(DID_NOT_STICK)
            new_flags = clear_analyzed_bit(live[0])
            expected_flags[item.id] = new_flags
            if include_locked and item.locked:
                expected_unlock.add(item.id)
                conn.execute(
                    """
                    UPDATE asset
                    SET analysis_flags = ?, is_beatgrid_locked = 0
                    WHERE id = ?
                    """,
                    (new_flags, item.id),
                )
            else:
                conn.execute(
                    "UPDATE asset SET analysis_flags = ? WHERE id = ?",
                    (new_flags, item.id),
                )
            if clear_frames and item.path is not None and (item.has_beatgrid or item.has_autotags):
                before = snapshot_frames.read_stored_frames(item.path)
                markers_before = before.get("Markers2")
                try:
                    snapshot_frames.clear_analysis_frames(item.path)
                except snapshot_frames.FrameRewriteError as exc:
                    raise library.LibraryError(exc.message, 400) from exc
                if not snapshot_frames.analysis_frames_cleared(item.path):
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)
                after = snapshot_frames.read_stored_frames(item.path)
                if item.has_markers2:
                    if after.get("Markers2") != markers_before:
                        raise safe_write.VerifyMismatch(DID_NOT_STICK)
                elif "Markers2" in after:
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)
                frame_checks.append((item.path, item.has_markers2, markers_before))

        def check(copied: sqlite3.Connection) -> None:
            """Fail when a flag or lock did not stick after commit."""
            if not expected_flags:
                return
            asset_ids = tuple(expected_flags)
            placeholders = ",".join("?" * len(asset_ids))
            rows = copied.execute(
                f"SELECT id, analysis_flags, is_beatgrid_locked FROM asset "
                f"WHERE id IN ({placeholders})",
                asset_ids,
            ).fetchall()
            got = {int(row[0]): row for row in rows}
            for asset_id, flags in expected_flags.items():
                row = got.get(asset_id)
                if row is None:
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)
                stored = row[1]
                if analyzed_bit_set(stored):
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)
                if (
                    isinstance(stored, int)
                    and not isinstance(stored, bool)
                    and stored != flags
                ):
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)
                if asset_id in expected_unlock and int(row[2] or 0):
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)
            for path, had_markers2, markers_before in frame_checks:
                if not snapshot_frames.analysis_frames_cleared(path):
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)
                after = snapshot_frames.read_stored_frames(path)
                if had_markers2 and after.get("Markers2") != markers_before:
                    raise safe_write.VerifyMismatch(DID_NOT_STICK)

        write.check(check)
        return _public(
            space,
            crate_id,
            ready,
            written=True,
            preview=False,
            clear_frames=clear_frames,
            include_locked=include_locked,
            locked=locked,
        )

    try:
        result = safe_write.run(
            "reanalyze",
            "re-analyze",
            body,
            extra_files=extra,
        )
    except safe_write.VerifyMismatch as exc:
        raise library.LibraryError(exc.message or DID_NOT_STICK, 409) from exc
    if result.get("written"):
        absent = _sync_location_marks(
            ready,
            expected_unlock,
            snapshot_ids[-1] if snapshot_ids else "",
        )
        if absent:
            result["drive_absent"] = True
    return result


def action(payload: Mapping[str, object]) -> Plan:
    """Run one ``POST /api/reanalyze`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. ``apply`` writes
            only when ``confirm`` is true. Optional ``space``, ``crate``,
            ``ids``, ``clear_frames`` (default true), ``include_locked``
            (default false).

    Returns:
        That action's result.

    Raises:
        library.LibraryError: The action or confirm is invalid.
        library.SeratoOpen: ``apply`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    crate_id = _crate_arg(payload.get("crate"))
    require_crate(crate_id)
    clear_frames = payload.get("clear_frames") is not False
    include_locked = payload.get("include_locked") is True
    ids = _parse_ids(payload.get("ids"))
    if kind == "preview":
        return preview(
            space,
            crate_id,
            clear_frames=clear_frames,
            include_locked=include_locked,
            ids=ids,
        )
    if kind == "apply":
        if payload.get("confirm") is not True:
            raise library.LibraryError(NEEDS_CONFIRM, 400)
        return apply(
            space,
            crate_id,
            clear_frames=clear_frames,
            include_locked=include_locked,
            ids=ids,
        )
    raise library.LibraryError("That action is not available.")


def scan(database: Path, space: str, crate_id: int | None = None) -> Plan:
    """Read-only report for the CLI. Same as preview with clear_frames on.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Optional crate.

    Returns:
        Preview JSON.
    """
    previous = library.MASTER
    library.MASTER = str(database)
    try:
        return preview(space, crate_id, clear_frames=True, include_locked=False)
    finally:
        library.MASTER = previous


def main(argv: Sequence[str] | None = None) -> int:
    """Print a re-analyze preview as JSON. This command does not write.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the report was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="Preview marking tracks unanalyzed for Serato. Read-only."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--crate", type=int, default=None)
    args = parser.parse_args(argv)
    try:
        result = scan(args.database, args.space, args.crate)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
