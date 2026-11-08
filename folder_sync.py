#!/usr/bin/env python3
"""Keep a crate's tracks in step with a music folder (#210).

``preview`` only reads. ``sync`` adds library tracks whose files sit in
the folder. Optional subcrates put files that sit directly in the folder
into the selected crate and make a child crate per subfolder, reusing an
existing child of the same display name. Nested files belong to the
nearest subcrate. Empty subcrates are not created. Empty crates are not
deleted. Optional ``full`` removes members whose files are not in that
crate's folder. Audio that is not in the library is listed as skipped
and is not imported. Writes go through ``safe_write``. A plan with
nothing to change does not write.

``python3 folder_sync.py CRATE FOLDER`` prints the preview as JSON.
``--sync`` writes.
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from collections.abc import Iterator, Mapping, Sequence
from contextlib import closing
from dataclasses import dataclass, field
from pathlib import Path

import files
import library
from library import LibraryError

SKIP_CAP = 50
TREE_CAP = 50_000
SMART = "Smart crates choose their tracks from rules."
ROOT_CRATE = "Tracks live in a crate, not the space root."
CHOOSE_FOLDER = "Choose a folder."
FOLDER_UNREADABLE = "That folder could not be read."
SHORTCUT = "Shortcuts are left alone."


def _flag(value: object, default: bool = False) -> bool:
    """Read a JSON boolean, or the default when it is missing.

    Args:
        value: Value from the request.
        default: Used when the value is None.

    Returns:
        The flag.

    Raises:
        LibraryError: If the value is present and not a boolean.
    """
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    raise LibraryError("That request is not valid.")


def _crate_id(value: object) -> int:
    """Read a crate id from the request.

    Args:
        value: Value from the request.

    Returns:
        The container id.

    Raises:
        LibraryError: If the value is missing or not an int.
    """
    if isinstance(value, bool) or not isinstance(value, int):
        raise LibraryError("That crate is not in this space.")
    return value


def rel_parts(folder_parts: tuple[str, ...], path_parts: tuple[str, ...]) -> tuple[str, ...] | None:
    """Return the path parts under a folder, case-insensitive.

    A prefix match requires a full part, so ``Music/hip`` does not own
    ``Music/hiphop``. The remainder keeps the path's original spelling.

    Args:
        folder_parts: Folder path parts.
        path_parts: File or folder path parts.

    Returns:
        Remaining parts after the folder, or None when the path is not
        under the folder.
    """
    if len(path_parts) < len(folder_parts):
        return None
    want = tuple(part.casefold() for part in folder_parts)
    have = tuple(part.casefold() for part in path_parts[: len(folder_parts)])
    if have != want:
        return None
    return path_parts[len(folder_parts) :]


def _open_folder(value: object) -> Path:
    """Resolve the folder the crate should follow.

    Args:
        value: Path string from the request.

    Returns:
        The resolved directory.

    Raises:
        LibraryError: If the path is missing, a shortcut, missing on
            disk, or not a readable directory.
    """
    if not isinstance(value, str) or not value.strip():
        raise LibraryError(CHOOSE_FOLDER)
    path = Path(value.strip()).expanduser()
    try:
        if path.is_symlink():
            raise LibraryError(SHORTCUT)
        if not path.exists():
            raise LibraryError(CHOOSE_FOLDER)
        if not path.is_dir():
            raise LibraryError(FOLDER_UNREADABLE)
    except LibraryError:
        raise
    except OSError as exc:
        raise LibraryError(FOLDER_UNREADABLE) from exc
    try:
        return path.resolve(strict=False)
    except OSError as exc:
        raise LibraryError(FOLDER_UNREADABLE) from exc


def _iter_audio(folder: Path) -> Iterator[Path]:
    """Walk audio files under a folder, skipping shortcuts and Serato dirs.

    Args:
        folder: Directory to walk.

    Yields:
        Audio file paths. Stops after ``TREE_CAP`` entries.
    """
    stack = [folder]
    seen = 0
    while stack:
        current = stack.pop()
        try:
            entries = os.scandir(current)
        except OSError:
            continue
        with entries:
            for entry in entries:
                seen += 1
                if seen > TREE_CAP:
                    return
                name = entry.name
                if name.startswith(".") or name == "_Serato_":
                    continue
                try:
                    is_link = entry.is_symlink()
                    is_dir = entry.is_dir(follow_symlinks=False)
                    is_file = entry.is_file(follow_symlinks=False)
                except OSError:
                    continue
                if is_link:
                    continue
                child = Path(entry.path)
                if is_dir:
                    stack.append(child)
                elif is_file and Path(name).suffix.lower() in files._AUDIO:
                    yield _normalized(child)


def _normalized(path: Path) -> Path:
    """Resolve a path so prefix checks see the same spelling.

    macOS ``/var`` and ``/private/var`` are the same directory. ``resolve``
    makes a stored portable id and the chosen folder comparable.

    Args:
        path: File or folder path.

    Returns:
        The resolved path, or the input when resolve fails.
    """
    try:
        return path.resolve(strict=False)
    except OSError:
        return path


def _file_path(portable_id: object) -> Path | None:
    """Resolve a stored portable id to a path.

    Args:
        portable_id: Stored path.

    Returns:
        The path, or None when the id is empty.
    """
    if not isinstance(portable_id, str) or portable_id == "":
        return None
    raw = library._resolved(portable_id)
    if not raw:
        return None
    return _normalized(Path(raw))


@dataclass
class _CrateChange:
    """One crate the plan will create or update."""

    path: tuple[str, ...]
    name: str
    crate_id: int | None
    add: list[int] = field(default_factory=list)
    remove: list[int] = field(default_factory=list)
    members: list[int] = field(default_factory=list)
    create: bool = False
    folder: str = ""


@dataclass
class _Plan:
    """Folder-sync plan for one selected crate."""

    crate_id: int
    crate_name: str
    folder: Path
    subcrates: bool
    full: bool
    crates: list[_CrateChange]
    skipped: list[str]
    skipped_count: int
    warning: str | None = None

    def work(self) -> bool:
        """Return whether a write would change crates or membership.

        Returns:
            True when a crate would be created or a member added or removed.
        """
        return any(change.create or change.add or change.remove for change in self.crates)


def _existing_child(conn: sqlite3.Connection, parent_id: int, name: str) -> int | None:
    """Find a child crate by display name, refusing a smart child.

    Args:
        conn: Open connection.
        parent_id: Parent container id.
        name: Visible crate name.

    Returns:
        The normal child id, or None when it is absent.

    Raises:
        LibraryError: If a smart crate already uses that name.
    """
    smart = library._find_child(conn, parent_id, name, 2)
    if smart is not None:
        raise LibraryError(SMART)
    return library._find_child(conn, parent_id, name, 1)


def _resolve_ids(
    conn: sqlite3.Connection,
    parent_id: int,
    crates: list[_CrateChange],
) -> None:
    """Fill crate ids for existing children along each relative path.

    Args:
        conn: Open connection.
        parent_id: Selected crate id.
        crates: Changes in path-length order. Mutated in place.

    Returns:
        None.

    Raises:
        LibraryError: If a needed child is a smart crate.
    """
    known: dict[tuple[str, ...], int] = {(): parent_id}
    for change in crates:
        if not change.path:
            change.crate_id = parent_id
            continue
        parent_path = change.path[:-1]
        holder = known.get(parent_path)
        if holder is None:
            continue
        found = _existing_child(conn, holder, change.name)
        if found is not None:
            change.crate_id = found
            change.create = False
            known[change.path] = found
        else:
            change.create = True


def _build_plan(
    conn: sqlite3.Connection,
    space: str,
    crate_id: int,
    folder: Path,
    subcrates: bool,
    full: bool,
) -> _Plan:
    """Compare one crate to a folder without writing.

    Args:
        conn: Open connection.
        space: Space name.
        crate_id: Selected crate.
        folder: Resolved directory.
        subcrates: True maps subfolders to child crates.
        full: True removes members whose files left that crate's folder.

    Returns:
        The plan.

    Raises:
        LibraryError: If the crate is missing, the space root, or smart.
    """
    row = library._container(conn, crate_id, space)
    if int(row["type"]) == 0:
        raise LibraryError(ROOT_CRATE)
    if int(row["type"]) == 2:
        raise LibraryError(SMART)
    crate_name = library.display_name(str(row["name"] or ""))
    by_rel: dict[tuple[str, ...], list[int]] = {}
    library_keys: set[str] = set()
    for asset_id, portable_id in conn.execute(
        """
        SELECT a.id, a.portable_id FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        """,
        (space,),
    ):
        path = _file_path(portable_id)
        if path is None:
            continue
        remainder = rel_parts(folder.parts, path.parts)
        if remainder is None or not remainder:
            continue
        library_keys.add("/".join(part.casefold() for part in path.parts))
        parent_rel = remainder[:-1]
        if not subcrates:
            parent_rel = ()
        by_rel.setdefault(parent_rel, []).append(int(asset_id))
    skipped: list[str] = []
    skipped_count = 0
    for audio in _iter_audio(folder):
        remainder = rel_parts(folder.parts, audio.parts)
        if remainder is None:
            continue
        key = "/".join(part.casefold() for part in audio.parts)
        if key in library_keys:
            continue
        skipped_count += 1
        if len(skipped) < SKIP_CAP:
            skipped.append("/".join(remainder) if remainder else audio.name)
    needed: set[tuple[str, ...]] = {()}
    if subcrates:
        for rel in by_rel:
            for depth in range(1, len(rel) + 1):
                needed.add(rel[:depth])
    crates: list[_CrateChange] = []
    for path in sorted(needed, key=lambda item: (len(item), item)):
        name = crate_name if not path else path[-1]
        folder_path = folder.joinpath(*path)
        crates.append(
            _CrateChange(
                path=path,
                name=name,
                crate_id=crate_id if not path else None,
                folder=str(folder_path),
            )
        )
    _resolve_ids(conn, crate_id, crates)
    by_path = {change.path: change for change in crates}
    for change in crates:
        wanted = list(dict.fromkeys(by_rel.get(change.path, ())))
        current: list[int] = []
        if change.crate_id is not None:
            current = library_members(conn, change.crate_id)
        current_set = set(current)
        wanted_set = set(wanted)
        change.add = [asset_id for asset_id in wanted if asset_id not in current_set]
        if full:
            change.remove = [asset_id for asset_id in current if asset_id not in wanted_set]
        kept = [asset_id for asset_id in current if asset_id not in set(change.remove)]
        change.members = kept + [asset_id for asset_id in change.add if asset_id not in set(kept)]
        if change.create and not wanted and change.path:
            # Intermediate folders stay when a descendant has library tracks.
            has_child = any(other.path[: len(change.path)] == change.path and other.path != change.path for other in crates)
            if not has_child:
                by_path.pop(change.path, None)
    crates = [change for change in crates if change.path in by_path or not change.path]
    return _Plan(
        crate_id=crate_id,
        crate_name=crate_name,
        folder=folder,
        subcrates=subcrates,
        full=full,
        crates=crates,
        skipped=skipped,
        skipped_count=skipped_count,
    )


def library_members(conn: sqlite3.Connection, crate_id: int) -> list[int]:
    """List the tracks in one crate, not its subcrates.

    Args:
        conn: Open connection.
        crate_id: Container id.

    Returns:
        Asset ids in crate order.
    """
    import smart_presets

    return smart_presets._members(conn, crate_id)


def _as_json(plan: _Plan, *, written: bool) -> dict[str, object]:
    """Build the API result from a plan.

    Args:
        plan: Computed plan.
        written: True after a successful ``safe_write``.

    Returns:
        JSON object for the page and CLI.
    """
    added = sum(len(change.add) for change in plan.crates)
    removed = sum(len(change.remove) for change in plan.crates)
    created = sum(1 for change in plan.crates if change.create)
    return {
        "ok": True,
        "crate": {"id": plan.crate_id, "name": plan.crate_name},
        "folder": str(plan.folder),
        "subcrates": plan.subcrates,
        "full": plan.full,
        "added": added,
        "removed": removed,
        "created": created,
        "crates": [
            {
                "id": change.crate_id,
                "name": change.name,
                "created": change.create,
                "added": len(change.add),
                "removed": len(change.remove),
                "kept": len(change.members) - len(change.add),
                "folder": change.folder,
            }
            for change in plan.crates
        ],
        "skipped": plan.skipped,
        "skipped_count": plan.skipped_count,
        "written": written,
        "warning": plan.warning,
    }


def _expect_members(write: object, crate_id: int, wanted: tuple[int, ...]) -> None:
    """Register a check that the crate holds exactly ``wanted`` after the commit.

    Args:
        write: The ``safe_write.Session``.
        crate_id: Container id.
        wanted: Asset ids the crate must hold.
    """
    import safe_write

    def check(copied: sqlite3.Connection) -> None:
        """Fail when the saved crate differs from the folder plan.

        Args:
            copied: Read-only connection to the temporary database copy.

        Raises:
            VerifyMismatch: If a track is missing or extra.
        """
        if sorted(library_members(copied, crate_id)) != sorted(wanted):
            raise safe_write.VerifyMismatch("The crate does not hold the expected tracks.")

    write.check(check)  # type: ignore[attr-defined]


def preview(
    space: str,
    crate: object,
    folder: object,
    *,
    subcrates: object = False,
    full: object = False,
) -> dict[str, object]:
    """List the membership changes a folder sync would make, without writing.

    Args:
        space: Space name.
        crate: Selected crate id.
        folder: Folder path.
        subcrates: True maps subfolders to child crates.
        full: True would remove members whose files left the folder.

    Returns:
        Plan JSON with ``written`` false.

    Raises:
        LibraryError: If the crate or folder is invalid.
    """
    crate_id = _crate_id(crate)
    path = _open_folder(folder)
    use_sub = _flag(subcrates)
    use_full = _flag(full)
    with closing(library.read_conn()) as conn:
        plan = _build_plan(conn, space, crate_id, path, use_sub, use_full)
    return _as_json(plan, written=False)


def sync(
    space: str,
    crate: object,
    folder: object,
    *,
    subcrates: object = False,
    full: object = False,
) -> dict[str, object]:
    """Apply a folder sync through ``safe_write``.

    Args:
        space: Space name.
        crate: Selected crate id.
        folder: Folder path.
        subcrates: True maps subfolders to child crates.
        full: True removes members whose files left the folder.

    Returns:
        Plan JSON. ``written`` is false when nothing changed.

    Raises:
        LibraryError: If the crate or folder is invalid.
        SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    crate_id = _crate_id(crate)
    path = _open_folder(folder)
    use_sub = _flag(subcrates)
    use_full = _flag(full)
    with closing(library.read_conn()) as conn:
        plan = _build_plan(conn, space, crate_id, path, use_sub, use_full)
    if not plan.work():
        return _as_json(plan, written=False)

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Create missing subcrates, update membership, and register checks.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict.

        Raises:
            LibraryError: If a crate cannot be created.
        """
        live = _build_plan(conn, space, crate_id, path, use_sub, use_full)
        write.set_target(live.crate_name)
        ids: dict[tuple[str, ...], int] = {(): crate_id}
        warning: str | None = None
        for change in live.crates:
            parent_id = ids.get(change.path[:-1], crate_id)
            if change.create:
                made = library._create_crate(conn, space, parent_id, change.name, False, None)
                new_id = made.get("id")
                if not isinstance(new_id, int):
                    raise LibraryError("The crate could not be created.")
                change.crate_id = new_id
                warning = made.get("warning") if isinstance(made.get("warning"), str) else warning
            if change.crate_id is None:
                raise LibraryError("The crate could not be created.")
            ids[change.path] = change.crate_id
            for asset_id in change.add:
                result = library._membership(conn, change.crate_id, asset_id, space, True)
                extra = result.get("warning")
                if isinstance(extra, str) and extra:
                    warning = extra
            for asset_id in change.remove:
                result = library._membership(conn, change.crate_id, asset_id, space, False)
                extra = result.get("warning")
                if isinstance(extra, str) and extra:
                    warning = extra
            _expect_members(write, change.crate_id, tuple(change.members))
        live.warning = warning
        return _as_json(live, written=True)

    return safe_write.run("folder_sync", plan.crate_name, apply)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/folder-sync`` request.

    Args:
        payload: ``action`` is ``preview`` or ``sync``. Both take ``space``,
            ``crate``, ``folder``, and optional ``subcrates`` and ``full``.

    Returns:
        That action's result.

    Raises:
        LibraryError: If the action or its fields are invalid.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    crate = payload.get("crate")
    folder = payload.get("folder")
    subcrates = payload.get("subcrates")
    full = payload.get("full")
    if kind == "preview":
        return preview(space, crate, folder, subcrates=subcrates, full=full)
    if kind == "sync":
        return sync(space, crate, folder, subcrates=subcrates, full=full)
    raise LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print a folder-sync preview, or write when ``--sync`` is set.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the result was printed, 1 when it could not be made.
    """
    parser = argparse.ArgumentParser(description="Keep a crate in step with a folder.")
    parser.add_argument("crate", type=int)
    parser.add_argument("folder")
    parser.add_argument("--subcrates", action="store_true")
    parser.add_argument("--full", action="store_true")
    parser.add_argument("--sync", action="store_true")
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        if args.sync:
            result = sync(args.space, args.crate, args.folder, subcrates=args.subcrates, full=args.full)
        else:
            result = preview(args.space, args.crate, args.folder, subcrates=args.subcrates, full=args.full)
    except LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
