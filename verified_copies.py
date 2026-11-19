"""Refuse prune and duplicate-file delete when too few copies can be verified.

Pattern from git-annex ``numcopies``. A hash-failed snapshot, an unplugged
drive, and a volume marked untrusted never count. Verification only reads.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Sequence
from contextlib import closing
from pathlib import Path
from typing import TYPE_CHECKING

import app_config
import error_codes
import library
import volumes
from volumes import Mounts, volume_of

if TYPE_CHECKING:
    from snapshots import SnapshotStore

DEFAULT_MIN_COPIES = 2
_MAX_MIN_COPIES = 9


def min_copies() -> int:
    """Return the stored minimum, or 2 when the key is missing.

    Returns:
        An integer from 1 to 9. Missing settings use 2.
    """
    return app_config.load_settings().min_copies


def untrusted_names() -> frozenset[str]:
    """Return volume names that never count toward the minimum.

    Returns:
        The stored list, or empty.
    """
    return frozenset(app_config.load_settings().untrusted_volumes)


def _present(path: str) -> bool:
    """Return whether ``path`` is a regular file.

    Args:
        path: Stored portable id.

    Returns:
        True when the file exists. A missing parent is false.
    """
    try:
        return Path(path).is_file()
    except OSError:
        return False


def _classify(path: str, mounts: Mounts, untrusted: frozenset[str]) -> str:
    """Describe whether one stored path counts as a verified copy.

    Args:
        path: Stored portable id.
        mounts: Shared mount cache.
        untrusted: Volume names that never count.

    Returns:
        ``verified``, ``unplugged``, ``untrusted``, or ``missing``.
    """
    volume = volume_of(path)
    if volume is not None and volume.name in untrusted:
        return "untrusted"
    if _present(path):
        return "verified"
    if volume is not None and not mounts.mounted(volume):
        return "unplugged"
    return "missing"


def _copies_error(code: str, params: dict[str, str]) -> library.LibraryError:
    """Build a parameterized refusal.

    Args:
        code: A ``PARAM_CODES`` key.
        params: Placeholder values.

    Returns:
        A ``LibraryError`` the page can translate.
    """
    return library.LibraryError(
        error_codes.render(code, params),
        code=code,
        params=params,
    )


def require_snapshot_prune(store: SnapshotStore, snapshot_id: str) -> None:
    """Refuse prune when remaining complete copies would drop below min_copies.

    Live ``master.sqlite`` counts as one copy. Complete hash-checked
    snapshots count. The snapshot being pruned does not. A hash-failed
    directory does not count and is named when it is why the check is short.

    Args:
        store: Snapshot store beside the live library.
        snapshot_id: Manifest directory name to drop.

    Raises:
        LibraryError: If fewer than ``min_copies`` verified copies would remain.
    """
    needed = min_copies()
    live = 1 if store.master.is_file() else 0
    complete = 0
    hash_failed = False
    if store.manifests.is_dir():
        for path in store.manifests.iterdir():
            if not path.is_dir():
                continue
            if path.name == snapshot_id:
                continue
            from serato_web.completeness import is_complete

            if is_complete(path):
                complete += 1
            else:
                hash_failed = True
    verified = live + complete
    if verified >= needed:
        return
    if hash_failed:
        raise library.LibraryError(
            "Can't verify, not deleting. A snapshot's hash check failed.",
            code="copies_hash_failed",
        )
    raise _copies_error("copies_need_more", {"n": str(needed)})


def library_copies(store: SnapshotStore) -> dict[str, object]:
    """Return destinations that count as copies of the live library.

    Args:
        store: Snapshot store beside the live library.

    Returns:
        ``verified`` count, ``min_copies``, and destination rows. A
        hash-failed snapshot is omitted.
    """
    from serato_web.completeness import is_complete

    destinations: list[dict[str, object]] = []
    if store.master.is_file():
        destinations.append({"name": "laptop", "kind": "live"})
    if store.manifests.is_dir():
        for path in store.manifests.iterdir():
            if not path.is_dir() or not is_complete(path):
                continue
            destinations.append({"name": "snapshot", "kind": "snapshot", "id": path.name})
    return {
        "verified": len(destinations),
        "min_copies": min_copies(),
        "destinations": destinations,
    }


def _duplicate_paths(paths: Sequence[str]) -> list[list[str]]:
    """Return duplicate-group portable ids that include any of ``paths``.

    A group is the same 4-second cluster ``library.duplicate_groups`` uses.

    Args:
        paths: Files the caller wants to trash.

    Returns:
        One list of portable ids per matching group. A unique file is omitted.
    """
    wanted = {str(Path(path)) for path in paths}
    wanted.update(paths)
    with closing(library.read_conn()) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT a.name, a.artist, a.id, a.length_ms, a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
              AND a.length_ms IS NOT NULL
              AND a.length_ms >= 0
            """,
            (library.LIBRARY_SPACE,),
        ).fetchall()
    packed: list[tuple[object, object, int, int]] = []
    by_id: dict[int, str] = {}
    for row in rows:
        stored = str(row["portable_id"] or "")
        if not stored:
            continue
        asset_id = int(row["id"])
        packed.append((row["name"], row["artist"], asset_id, int(row["length_ms"])))
        by_id[asset_id] = stored
    matched: list[list[str]] = []
    for group in library.group_recordings(packed):
        ids = group["ids"]
        if not isinstance(ids, list):
            continue
        members = [
            by_id[asset_id]
            for asset_id in ids
            if isinstance(asset_id, int) and not isinstance(asset_id, bool) and asset_id in by_id
        ]
        if len(members) < 2:
            continue
        if any(member in wanted or str(Path(member)) in wanted for member in members):
            matched.append(members)
    return matched


def require_audio_delete(paths: Sequence[str]) -> None:
    """Refuse trashing a duplicate when too few copies stay verified.

    A unique library file is left to the existing delete path. A duplicate
    group is refused when remaining verified copies would drop below
    ``min_copies``. An unplugged or untrusted remaining copy is named
    instead of counted.

    Args:
        paths: Files the caller wants to trash.

    Raises:
        LibraryError: If a duplicate group would fall below the minimum.
    """
    needed = min_copies()
    untrusted = untrusted_names()
    mounts = Mounts()
    deleting = {str(path) for path in paths}
    deleting.update(str(Path(path)) for path in paths)
    for members in _duplicate_paths(paths):
        remaining = [path for path in members if path not in deleting and str(Path(path)) not in deleting]
        kinds = [_classify(path, mounts, untrusted) for path in remaining]
        verified = sum(1 for kind in kinds if kind == "verified")
        if verified >= needed:
            continue
        unplugged = next(
            (path for path, kind in zip(remaining, kinds) if kind == "unplugged"),
            None,
        )
        if unplugged is not None:
            volume = volume_of(unplugged)
            drive = volume.name if volume is not None else unplugged
            raise _copies_error("copies_unplugged", {"drive": drive})
        untrusted_path = next(
            (path for path, kind in zip(remaining, kinds) if kind == "untrusted"),
            None,
        )
        if untrusted_path is not None:
            volume = volume_of(untrusted_path)
            drive = volume.name if volume is not None else untrusted_path
            raise _copies_error("copies_untrusted", {"drive": drive})
        raise _copies_error("copies_need_more", {"n": str(needed)})
