"""Treat NFC and NFD spellings of one path as one track (#455).

Serato 4 and Serato 5 store the same path strings. The rule does not
branch on the Serato generation. A composed path and its decomposed
form share one key. Two blank paths stay separate. Case folds only on
Windows, where the file system already ignores case.

Health counts the pair once and lists the other spelling. Rekordbox and
M3U emit the kept spelling once. Preview writes nothing. Apply deletes
the extra library row through ``safe_write`` after a snapshot, and only
while Serato is quit. The audio file stays. A track whose location is
not the drive database (location 3) leaves that drive database
unchanged and returns the usual warning.
"""

from __future__ import annotations

import os
import sys
import unicodedata
from collections.abc import Mapping, Sequence
from pathlib import Path, PurePosixPath
from typing import Any

import file_scan
import gig_check
import library

NEEDS_CONFIRM = "Confirm the path cleanup before it runs."
_SNAPSHOT_REASON = "Before removing an extra path spelling."


def form_key(path: object, *, fold_case: bool | None = None) -> str:
    """Return the identity key for one stored path.

    Args:
        path: ``asset.portable_id``. A non-string, a blank, or an embedded
            NUL does not group.
        fold_case: None folds case only on Windows. True folds on every
            platform. False never folds.

    Returns:
        An NFC path with forward slashes, or ``""`` when the path must
        stay ungrouped.
    """
    if not isinstance(path, str) or "\x00" in path or not path.strip():
        return ""
    text = unicodedata.normalize("NFC", path.replace("\\", "/").strip())
    fold = sys.platform == "win32" if fold_case is None else fold_case
    if not fold:
        return text
    if sys.platform == "win32":
        return os.path.normcase(text)
    return text.casefold()


def choose_keep(rows: Sequence[Mapping[str, object]]) -> Mapping[str, object]:
    """Pick the library row that should stand for one path.

    Prefer a spelling that is on disk, then one whose basename matches
    the directory entry, then a row Serato has not marked missing, then
    the lowest id.

    Args:
        rows: Asset rows that share one :func:`form_key`. Each has ``id``,
            ``portable_id``, and ``is_missing``.

    Returns:
        The row to keep.

    Raises:
        ValueError: If ``rows`` is empty.
    """
    if not rows:
        raise ValueError("A path group needs a row.")
    return min(rows, key=_rank)


def collapse_rows(
    rows: Sequence[Mapping[str, object]],
) -> tuple[list[Mapping[str, object]], list[dict[str, object]]]:
    """Drop extra spellings and describe each pair.

    A blank or NUL path stays on its own. The kept row is emitted where
    the first spelling of that key appeared.

    Args:
        rows: Asset rows in the order the caller wants to keep.

    Returns:
        The kept rows, and one public group per key that had two or more
        spellings.
    """
    order: list[str] = []
    buckets: dict[str, list[Mapping[str, object]]] = {}
    blanks = 0
    for row in rows:
        key = form_key(_cell(row, "portable_id"))
        if not key:
            blanks += 1
            key = f"\0{blanks}"
        if key not in buckets:
            order.append(key)
            buckets[key] = []
        buckets[key].append(row)
    kept: list[Mapping[str, object]] = []
    groups: list[dict[str, object]] = []
    for key in order:
        bucket = buckets[key]
        if key.startswith("\0") or len(bucket) < 2:
            kept.extend(bucket)
            continue
        winner = choose_keep(bucket)
        kept.append(winner)
        groups.append(_public_group(bucket, winner))
    return kept, groups


def id_map(rows: Sequence[Mapping[str, object]]) -> dict[int, int]:
    """Map each dropped asset id to the id that is kept.

    Args:
        rows: Asset rows for one space, before a crate filter.

    Returns:
        Dropped id to kept id. An id that is kept is absent.
    """
    return mapping_from(collapse_rows(rows)[1])


def mapping_from(groups: Sequence[Mapping[str, object]]) -> dict[int, int]:
    """Map dropped ids to the kept id for groups already built.

    Args:
        groups: Public groups from :func:`collapse_rows`.

    Returns:
        Dropped id to kept id.
    """
    mapping: dict[int, int] = {}
    for group in groups:
        keep_id = int(group["keep_id"])
        raw_ids = group["ids"]
        if not isinstance(raw_ids, list):
            continue
        for asset_id in raw_ids:
            if isinstance(asset_id, bool) or not isinstance(asset_id, int):
                continue
            if asset_id != keep_id:
                mapping[asset_id] = keep_id
    return mapping


def crate_keep_ids(
    rows: Sequence[Mapping[str, object]], in_crate: set[int]
) -> set[int]:
    """Return ids that count as in a crate after path spellings collapse.

    A kept id is included when any spelling in its bucket is in a crate.
    A row that is not in a pair is included only when that id is in a crate.

    Args:
        rows: Asset rows for the whole space.
        in_crate: Asset ids that sit in at least one crate.

    Returns:
        Ids the health report should not list under "not in a crate".
    """
    return covered_from(rows, collapse_rows(rows)[1], in_crate)


def covered_from(
    rows: Sequence[Mapping[str, object]],
    groups: Sequence[Mapping[str, object]],
    in_crate: set[int],
) -> set[int]:
    """Return the same set as :func:`crate_keep_ids` for known groups.

    Args:
        rows: Asset rows for the whole space.
        groups: Public groups from those rows.
        in_crate: Asset ids that sit in at least one crate.

    Returns:
        Ids that already belong to a crate, after the collapse.
    """
    grouped: set[int] = set()
    covered: set[int] = set()
    for group in groups:
        raw_ids = group["ids"]
        if not isinstance(raw_ids, list):
            continue
        ids = [item for item in raw_ids if isinstance(item, int) and not isinstance(item, bool)]
        grouped.update(ids)
        if any(asset_id in in_crate for asset_id in ids):
            covered.add(int(group["keep_id"]))
    for row in rows:
        asset_id = int(row["id"])
        if asset_id not in grouped and asset_id in in_crate:
            covered.add(asset_id)
    return covered


def collapse_export(
    tracks: Sequence[Mapping[str, object]],
    membership: Mapping[int, Sequence[int]],
) -> tuple[list[Mapping[str, object]], dict[int, list[int]]]:
    """Collapse a Rekordbox track list and point crates at the kept id.

    Args:
        tracks: Asset dicts for the whole space, in id order.
        membership: Crate id to asset ids, in playlist order.

    Returns:
        Kept tracks, and membership whose dropped ids are replaced by the
        kept id. A crate that listed both spellings lists the track once.
    """
    kept, groups = collapse_rows(tracks)
    mapping = mapping_from(groups)
    remapped: dict[int, list[int]] = {}
    for crate_id, asset_ids in membership.items():
        remapped[int(crate_id)] = _remap_ids(asset_ids, mapping)
    return kept, remapped


def rows_for_m3u(
    rows: Sequence[Mapping[str, object]],
    member_ids: Sequence[int] | None,
) -> list[Mapping[str, object]]:
    """Return M3U rows after path spellings collapse.

    Args:
        rows: Every track in the space, in name then id order. Each row
            has ``id`` and ``portable_id``.
        member_ids: Crate members in playlist order. None exports the space.

    Returns:
        Kept rows. A crate that holds only the dropped spelling still
        exports the kept row once.
    """
    kept, groups = collapse_rows(rows)
    if member_ids is None:
        return kept
    by_id = {int(row["id"]): row for row in kept}
    mapping = mapping_from(groups)
    chosen: list[Mapping[str, object]] = []
    seen: set[int] = set()
    for asset_id in member_ids:
        keep_id = mapping.get(int(asset_id), int(asset_id))
        if keep_id in seen or keep_id not in by_id:
            continue
        seen.add(keep_id)
        chosen.append(by_id[keep_id])
    return chosen


def preview(space: str, crate_id: int | None = None) -> dict[str, object]:
    """List extra path spellings. Nothing is written.

    Args:
        space: Space name.
        crate_id: Crate id, including subcrates. None checks the space.

    Returns:
        ``preview`` true, ``written`` false, and ``snapshot_id`` null.

    Raises:
        library.LibraryError: Unknown space, a missing library, or a crate
            that is not in the space.
    """
    groups = _scoped_groups(space, crate_id)
    return _plan(space, crate_id, groups, preview=True, written=False, snapshot_id=None)


def apply(space: str, crate_id: int | None = None) -> dict[str, object]:
    """Delete extra path rows through ``safe_write``.

    Serato must be quit. The snapshot is taken before the write, and only
    when there is a row to remove. An empty plan does not write and does
    not snapshot. The audio file is passed as an unchanged extra file.

    Args:
        space: Space name.
        crate_id: Crate id, including subcrates. None checks the space.

    Returns:
        ``written`` true when a row was removed. ``snapshot_id`` is the
        snapshot that puts the library row back. ``warnings`` includes the
        drive-database notice when the track is not on location 3.

    Raises:
        library.LibraryError: The library cannot be written.
        library.SeratoOpen: Serato still holds the library.
    """
    groups = _scoped_groups(space, crate_id)
    if not groups:
        return _plan(space, crate_id, [], preview=False, written=False, snapshot_id=None)
    _refuse_while_open()
    import snapshots

    snapshot_id = snapshots.current_store().take("before-write", _SNAPSHOT_REASON)["id"]
    extra = _audio_files(groups)

    def body(conn: Any, write: Any) -> dict[str, object]:
        import safe_write

        write._content_id = snapshot_id
        warnings = _delete_extras(conn, groups)
        for path in extra:
            write.expect_unchanged(path)

        def check(copy: Any) -> None:
            for group in groups:
                keep_id = int(group["keep_id"])
                if copy.execute("SELECT id FROM asset WHERE id = ?", (keep_id,)).fetchone() is None:
                    raise safe_write.VerifyMismatch("The kept path spelling is gone.")
                raw_ids = group["ids"]
                if not isinstance(raw_ids, list):
                    continue
                for asset_id in raw_ids:
                    if asset_id == keep_id or isinstance(asset_id, bool) or not isinstance(asset_id, int):
                        continue
                    if copy.execute("SELECT id FROM asset WHERE id = ?", (asset_id,)).fetchone() is not None:
                        raise safe_write.VerifyMismatch("An extra path spelling is still in the library.")

        write.check(check)
        return _plan(
            space,
            crate_id,
            groups,
            preview=False,
            written=True,
            snapshot_id=snapshot_id,
            warnings=warnings,
        )

    import safe_write

    return safe_write.run("path_forms", "path spellings", body, extra_files=extra)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/path-forms`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. ``apply`` writes
            only when ``confirm`` is true. Optional ``space`` and ``crate``.

    Returns:
        That action's result.

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
        return apply(space, crate_id)
    raise library.LibraryError("That action is not available.")


def _refuse_while_open() -> None:
    """Refuse before a snapshot when Serato or the version gate is closed.

    Raises:
        library.SeratoOpen: Serato DJ is running or holds the lock.
        library.LibraryError: The process write block or Protect Library
            refuses the library. The status is 409.
    """
    info = library.status()
    if info.get("open"):
        raise library.SeratoOpen(info)
    import snapshots

    blocked = snapshots.library_write_block()
    if blocked:
        raise library.LibraryError(blocked, 409)
    message = snapshots.write_block_message()
    if message:
        raise library.LibraryError(message, 409)


def _scoped_groups(space: str, crate_id: int | None) -> list[dict[str, object]]:
    """Return path groups for a space, or for one crate and its subcrates.

    Args:
        space: Space name.
        crate_id: Crate id, or None for the space.

    Returns:
        Public groups. A pair split across a crate boundary is not a group
        inside the crate that holds only one spelling.

    Raises:
        library.LibraryError: Unknown space, a missing library, or a crate
            that is not in the space.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(Path(library.MASTER))
    try:
        space_row = conn.execute("SELECT id FROM space WHERE name = ?", (space,)).fetchone()
        if space_row is None:
            raise library.LibraryError("That space is not available here.")
        rows = conn.execute(
            """
            SELECT a.id, a.portable_id, a.is_missing
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
            rows = [row for row in rows if int(row["id"]) in members]
        return collapse_rows(rows)[1]
    finally:
        conn.close()


def _delete_extras(conn: Any, groups: Sequence[Mapping[str, object]]) -> list[str]:
    """Move crate membership onto the kept row and delete the extras.

    Args:
        conn: Open write connection.
        groups: Groups from the preview that this write is applying.

    Returns:
        Warning strings from the location database. The audio file is not
        deleted.
    """
    warnings: list[str] = []
    for group in groups:
        keep_id = int(group["keep_id"])
        raw_ids = group["ids"]
        drop_ids = [
            int(asset_id)
            for asset_id in raw_ids
            if isinstance(asset_id, int) and not isinstance(asset_id, bool) and int(asset_id) != keep_id
        ] if isinstance(raw_ids, list) else []
        for drop_id in drop_ids:
            for crate in library._asset_crates(conn, drop_id):
                if int(crate["type"] or 0) == 0:
                    continue
                crate_id = int(crate["crate_id"])
                if library._crate_has_asset(conn, crate_id, keep_id) is not None:
                    continue
                order = crate["list_order"]
                library._insert_at_order(
                    conn,
                    crate_id,
                    keep_id,
                    str(crate["space"]),
                    None if order is None else int(order),
                )
        if drop_ids:
            library._repoint_history(conn, keep_id, drop_ids)
        keep_external = library._asset_location(conn, keep_id)["external_id"]
        for drop_id in drop_ids:
            located = library._asset_location(conn, drop_id)
            library._delete_asset_refs(conn, drop_id)
            conn.execute("DELETE FROM asset WHERE id = ?", (drop_id,))
            warning = library._mirror_drop_asset(
                conn,
                located["external_id"],
                int(located["location_id"] or 0),
                keep_external,
            )
            if warning:
                warnings.append(str(warning))
    return warnings


def _audio_files(groups: Sequence[Mapping[str, object]]) -> list[Path]:
    """Return on-disk audio files this write must leave unchanged.

    Args:
        groups: Groups about to be applied.

    Returns:
        One path per distinct file. A missing file is omitted.
    """
    found: list[Path] = []
    seen: set[str] = set()
    for group in groups:
        stored = group.get("keep_path")
        if not isinstance(stored, str) or not _on_disk(stored):
            continue
        path = Path(stored)
        try:
            key = str(path.resolve())
        except (OSError, ValueError):
            continue
        if key in seen:
            continue
        seen.add(key)
        found.append(path)
    return found


def _plan(
    space: str,
    crate_id: int | None,
    groups: Sequence[Mapping[str, object]],
    *,
    preview: bool,
    written: bool,
    snapshot_id: str | None,
    warnings: Sequence[str] | None = None,
) -> dict[str, object]:
    """Build the preview or apply payload.

    Args:
        space: Space name.
        crate_id: Crate id, or None.
        groups: Public groups.
        preview: True when nothing was asked to write.
        written: True when a row was removed.
        snapshot_id: Undo snapshot, or None.
        warnings: Drive-database notices.

    Returns:
        The JSON object ``POST /api/path-forms`` sends.
    """
    dropped = 0
    for group in groups:
        raw_ids = group.get("ids")
        if isinstance(raw_ids, list):
            dropped += max(0, len(raw_ids) - 1)
    return {
        "preview": preview,
        "written": written,
        "space": space,
        "crate": crate_id,
        "count": len(groups),
        "dropped": dropped,
        "groups": list(groups),
        "warnings": list(warnings or []),
        "snapshot_id": snapshot_id,
    }


def _public_group(
    bucket: Sequence[Mapping[str, object]], winner: Mapping[str, object]
) -> dict[str, object]:
    """Describe one path group for the page.

    Args:
        bucket: Rows that share a key, in first-seen order.
        winner: The row :func:`choose_keep` selected.

    Returns:
        ``keep_id``, ``keep_path``, ``ids``, and ``paths``.
    """
    keep_id = int(winner["id"])
    paths: list[dict[str, object]] = []
    ids: list[int] = []
    for row in bucket:
        asset_id = int(row["id"])
        ids.append(asset_id)
        paths.append(
            {
                "id": asset_id,
                "path": _stored_path(row),
                "keep": asset_id == keep_id,
            }
        )
    return {
        "keep_id": keep_id,
        "keep_path": _stored_path(winner),
        "ids": ids,
        "paths": paths,
    }


def _rank(row: Mapping[str, object]) -> tuple[int, int, int, int]:
    """Return the sort key for :func:`choose_keep`.

    Args:
        row: One asset row.

    Returns:
        On-disk first, then a directory-entry basename match, then not
        missing, then the lowest id.
    """
    stored = _stored_path(row)
    on_disk = _on_disk(stored)
    matched = _entry_match(stored) if on_disk else False
    missing = _missing_flag(row)
    return (0 if on_disk else 1, 0 if matched else 1, missing, int(row["id"]))


def _entry_match(stored: str) -> bool:
    """Return whether the stored basename is the directory entry.

    Args:
        stored: A path that is already on disk.

    Returns:
        True when the filesystem lists that exact basename.
    """
    import rekordbox

    try:
        listed = rekordbox.filesystem_path(stored)
    except (OSError, ValueError):
        return False
    stored_name = PurePosixPath(stored.replace("\\", "/")).name
    listed_name = PurePosixPath(listed.replace("\\", "/")).name
    return bool(stored_name) and stored_name == listed_name


def _on_disk(path: str) -> bool:
    """Return whether a stored path is a regular file.

    Args:
        path: Stored spelling. An embedded NUL is not a file.

    Returns:
        True when ``Path.is_file`` succeeds.
    """
    if not path or "\x00" in path:
        return False
    try:
        return Path(path).is_file()
    except (OSError, ValueError):
        return False


def _missing_flag(row: Mapping[str, object]) -> int:
    """Return Serato's missing flag as an int.

    Args:
        row: Asset row.

    Returns:
        0 when the flag is absent or not a number.
    """
    raw = _cell(row, "is_missing")
    if isinstance(raw, bool) or raw is None:
        return 0
    try:
        return int(raw)
    except (TypeError, ValueError):
        return 0


def _stored_path(row: Mapping[str, object]) -> str:
    """Return the stored path, or an empty string.

    Args:
        row: Asset row.

    Returns:
        ``portable_id`` when it is a string.
    """
    value = _cell(row, "portable_id")
    return value if isinstance(value, str) else ""


def _cell(row: Mapping[str, object], name: str) -> object:
    """Return one column, or None when the row does not have it.

    Args:
        row: A dict or a ``sqlite3.Row``.
        name: Column name.

    Returns:
        The value, or None.
    """
    if name not in row.keys():
        return None
    return row[name]


def _remap_ids(asset_ids: Sequence[int], mapping: Mapping[int, int]) -> list[int]:
    """Replace dropped ids and keep the first sight of each kept id.

    Args:
        asset_ids: Ids in playlist order.
        mapping: Dropped id to kept id.

    Returns:
        Kept ids in first-seen order.
    """
    seen: set[int] = set()
    ordered: list[int] = []
    for asset_id in asset_ids:
        keep_id = mapping.get(int(asset_id), int(asset_id))
        if keep_id in seen:
            continue
        seen.add(keep_id)
        ordered.append(keep_id)
    return ordered


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
