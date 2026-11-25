#!/usr/bin/env python3
"""Point greyed-out Beatport and Beatsource tracks at local files (#71).

A streaming row is one whose stored identity names Beatport or Beatsource
as a URI scheme, a path segment, or a type name, and whose stored path
does not open as a local audio file. A title, an artist, or a
``third_party_type`` number is not a marker: those integers are not
recorded for these services. An audio file name that merely contains the
word is a local file, missing or not.

``plan`` is read-only. It matches a local file by the normalized artist
and title, then by the title alone. ``apply`` with ``confirm`` true
rewrites that same asset row through ``safe_write`` while Serato is quit.
Colour, crate membership, and ``list_order`` are not columns in the
update. Cue points inside the local file are not rewritten. An empty plan
does not write. A path that is not a current match, a symlink, a file
inside the library folder, or a file under ``_Serato_`` is refused before
the first update.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import sys
import time
import unicodedata
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path

import files
import gig_check
import library
import relink

MISMATCH = "That repair does not match the current list."
CUES = "kept-on-row"
CUES_NOTE = (
    "The same library row is pointed at the local file. "
    "Its colour and its place in each crate stay. "
    "Cue points stored on that row stay with it. "
    "Cue points already in the local file are left as they are."
)

_SERVICES = (("beatsource", "Beatsource"), ("beatport", "Beatport"))
_WORD = re.compile(r"(?i)(?<![a-z0-9])(beatsource|beatport)(?![a-z0-9])")
_IDENTITY = ("portable_id", "uri", "file_name", "type", "type_specific_data")

Plan = dict[str, object]


def service_marker(value: object) -> str | None:
    """Return Beatport or Beatsource when this identity names that service.

    Args:
        value: One stored identity field. Titles and artists are not passed.

    Returns:
        ``Beatport`` or ``Beatsource``, or None when the value is blank,
        names an audio file, or does not name either service.
    """
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text or "\x00" in text:
        return None
    folded = text.casefold()
    for token, label in _SERVICES:
        if folded.startswith(token + ":"):
            return label
    parts = [part for part in re.split(r"[\\/]+", text) if part]
    if parts and Path(parts[-1]).suffix.casefold() in relink.AUDIO_SUFFIXES:
        return None
    for part in parts:
        part_folded = part.casefold()
        for token, label in _SERVICES:
            if part_folded == token:
                return label
    found = _WORD.search(text)
    if found is None:
        return None
    token = found.group(1).casefold()
    for name, label in _SERVICES:
        if name == token:
            return label
    return None


def _text(value: object) -> str:
    """Return a stripped string, or an empty one."""
    return value.strip() if isinstance(value, str) else ""


def _int(value: object) -> int | None:
    """Return an int column, or None."""
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, int):
        return value
    try:
        return int(str(value))
    except ValueError:
        return None


def _fold(value: str) -> str:
    """Fold a title or file name for comparison.

    Args:
        value: Title, artist, or file stem.

    Returns:
        Lower case letters and digits, with accents removed. Empty when
        nothing remains.
    """
    normal = unicodedata.normalize("NFKD", value)
    plain = "".join(char for char in normal if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", plain.casefold()).strip()


def _column(columns: set[str], name: str) -> str:
    """Select a column, or NULL when this schema does not have it."""
    return f"a.{name}" if name in columns else f"NULL AS {name}"


def _opens(stored: str) -> bool:
    """Return whether a stored path is a local file that can be read.

    Args:
        stored: ``portable_id``. A streaming id does not open.

    Returns:
        True when one candidate is a regular file.
    """
    if not stored:
        return False
    resolved = library.resolved_path(stored)
    if not resolved:
        return False
    path = Path(resolved)
    try:
        return path.is_file() and not path.is_symlink()
    except OSError:
        return False


def _library_dir(database: Path) -> Path:
    """Return the folder that holds the library file.

    Args:
        database: ``master.sqlite``.

    Returns:
        The resolved parent directory.
    """
    return database.resolve().parent


def _blocked(path: Path, library_dir: Path) -> str | None:
    """Return why a matched file must not become the stored path.

    Args:
        path: Resolved regular file.
        library_dir: Folder that holds ``master.sqlite``.

    Returns:
        ``library`` or ``serato``, or None when the file may be used.
    """
    if path == library_dir or library_dir in path.parents:
        return "library"
    if "_Serato_" in path.parts:
        return "serato"
    return None


def _key(path: Path) -> str:
    """Return a case-folded absolute path for comparisons."""
    return os.path.normcase(str(path))


def _service_of(row: sqlite3.Row) -> str | None:
    """Return the streaming service for one asset, if its identity names one.

    An audio ``portable_id`` is not a service marker. ``type_specific_data``
    is then ignored as well, so a missing local file is not treated as a
    stream because a blob mentions the word.

    Args:
        row: Asset row with the identity columns.

    Returns:
        ``Beatport`` or ``Beatsource``, or None.
    """
    stored = _text(row["portable_id"])
    audio_path = bool(stored) and service_marker(stored) is None and Path(
        stored.replace("\\", "/").split("/")[-1]
    ).suffix.casefold() in relink.AUDIO_SUFFIXES
    for name in _IDENTITY:
        if audio_path and name == "type_specific_data":
            continue
        found = service_marker(row[name])
        if found:
            return found
    return None


def _placements(conn: sqlite3.Connection, asset_id: int) -> list[dict[str, object]]:
    """Return crate membership for one asset, including list order.

    Args:
        conn: Open connection with named rows.
        asset_id: Asset id.

    Returns:
        One dict per membership row: ``row_id``, ``crate_id``, ``name``,
        and ``list_order``. Order is preserved from the query, then made
        stable by row id.
    """
    tables = {str(row[0]) for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    if "container_asset" not in tables:
        return []
    columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(container_asset)")}
    found: list[dict[str, object]] = []
    seen: set[int] = set()

    def add(row_id: object, crate_id: object, order: object, name: object) -> None:
        membership = _int(row_id)
        crate = _int(crate_id)
        if membership is None or crate is None or membership in seen:
            return
        seen.add(membership)
        found.append(
            {
                "row_id": membership,
                "crate_id": crate,
                "name": _text(name),
                "list_order": _int(order),
            }
        )

    if "location_container_id" in columns and "location_container" in tables:
        for row in conn.execute(
            """
            SELECT ca.id AS row_id, lc.container_id AS crate_id, ca.list_order AS list_order,
                   c.name AS name
            FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            LEFT JOIN container c ON c.id = lc.container_id
            WHERE ca.asset_id = ?
            ORDER BY ca.id
            """,
            (asset_id,),
        ):
            add(row["row_id"], row["crate_id"], row["list_order"], row["name"])
    if "container_id" in columns:
        for row in conn.execute(
            """
            SELECT ca.id AS row_id, ca.container_id AS crate_id, ca.list_order AS list_order,
                   c.name AS name
            FROM container_asset ca
            LEFT JOIN container c ON c.id = ca.container_id
            WHERE ca.asset_id = ?
            ORDER BY ca.id
            """,
            (asset_id,),
        ):
            add(row["row_id"], row["crate_id"], row["list_order"], row["name"])
    return found


def _read_assets(conn: sqlite3.Connection, space: str) -> list[sqlite3.Row]:
    """Read the space's assets with the identity columns this schema has.

    Args:
        conn: Open connection.
        space: Space name.

    Returns:
        Asset rows ordered by id.
    """
    columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(asset)")}
    select = ", ".join(_column(columns, name) for name in ("name", "artist", "color", *_IDENTITY))
    return conn.execute(
        f"""
        SELECT a.id, {select}
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        ORDER BY a.id
        """,
        (space,),
    ).fetchall()


def _used_files(rows: Sequence[sqlite3.Row]) -> set[str]:
    """Return resolved paths that already belong to a library row.

    Args:
        rows: Asset rows.

    Returns:
        Case-folded absolute paths of files that open.
    """
    used: set[str] = set()
    for row in rows:
        stored = _text(row["portable_id"])
        if not _opens(stored):
            continue
        resolved = library.resolved_path(stored)
        if resolved:
            used.add(_key(Path(resolved)))
    return used


def _stem_index(roots: Sequence[Path]) -> tuple[dict[str, list[str]], bool]:
    """Index audio file stems under the roots.

    Args:
        roots: Folders to search. Missing folders are skipped by the walk.

    Returns:
        Stem to absolute paths, and whether the walk stopped early.
    """
    index = relink.scan(roots)
    stems: dict[str, list[str]] = {}
    for name, items in index.by_name.items():
        stem = _fold(Path(name).stem)
        if not stem:
            continue
        bucket = stems.setdefault(stem, [])
        for path, _size in items:
            if path not in bucket:
                bucket.append(path)
    for bucket in stems.values():
        bucket.sort()
    return stems, index.truncated


def _candidates(
    title: str,
    artist: str,
    stems: Mapping[str, Sequence[str]],
    used: set[str],
    library_dir: Path,
) -> list[dict[str, object]]:
    """Rank local files for one streaming track.

    Args:
        title: Track title.
        artist: Artist. Blank leaves only a title match.
        stems: Normalized file stem to paths.
        used: Paths already stored on another row that opens.
        library_dir: Library folder. Matches inside it stay visible and
            are not usable.

    Returns:
        Candidate dicts. A single artist-and-title file is ``high``. A
        single title file is ``medium`` when the artist was set. Several
        files are ``low``.
    """
    title_key = _fold(title)
    if not title_key:
        return []
    artist_key = _fold(artist)
    both = _fold(f"{artist} {title}") if artist_key else ""

    def available(key: str) -> list[str]:
        return [path for path in stems.get(key, ()) if _key(Path(path)) not in used]

    chosen: list[tuple[str, str, str]] = []
    if both and both != title_key:
        exact = available(both)
        if len(exact) == 1:
            chosen = [(exact[0], "high", "artist and title")]
        elif len(exact) > 1:
            chosen = [(path, "low", "several files") for path in exact]
    if not chosen:
        titled = available(title_key)
        if len(titled) == 1:
            if artist_key:
                chosen = [(titled[0], "medium", "title")]
            else:
                chosen = [(titled[0], "high", "title")]
        elif len(titled) > 1:
            chosen = [(path, "low", "several files") for path in titled]
    listed: list[dict[str, object]] = []
    for path, confidence, reason in chosen:
        resolved = Path(path)
        try:
            if not resolved.is_symlink():
                resolved = resolved.resolve(strict=False)
        except OSError:
            continue
        block = _blocked(resolved, library_dir)
        listed.append(
            {
                "path": str(resolved),
                "confidence": confidence,
                "reason": "inside the library folder" if block == "library" else "inside a _Serato_ folder" if block == "serato" else reason,
                "usable": block is None,
            }
        )
    return listed


def _demote_shared(tracks: list[dict[str, object]]) -> None:
    """Drop a high match that two streaming rows would share.

    Args:
        tracks: Plan rows, edited in place. A shared file becomes
            ``several files`` and is not usable as the only match.
    """
    owners: dict[str, list[dict[str, object]]] = {}
    for track in tracks:
        candidates = track["candidates"]
        if not isinstance(candidates, list) or len(candidates) != 1:
            continue
        one = candidates[0]
        if not isinstance(one, dict) or one.get("confidence") != "high" or one.get("usable") is not True:
            continue
        path = one.get("path")
        if isinstance(path, str):
            owners.setdefault(_key(Path(path)), []).append(track)
    for group in owners.values():
        if len(group) < 2:
            continue
        for track in group:
            one = track["candidates"]
            if isinstance(one, list) and one and isinstance(one[0], dict):
                one[0]["confidence"] = "low"
                one[0]["reason"] = "same file as another track"
                one[0]["usable"] = False


def _public_track(row: sqlite3.Row, service: str, candidates: list[dict[str, object]], crates: list[dict[str, object]]) -> dict[str, object]:
    """Build one plan row.

    Args:
        row: Asset row.
        service: Beatport or Beatsource.
        candidates: Ranked files.
        crates: Membership, including list order.

    Returns:
        The JSON object. ``match`` is the single usable high or medium
        file, or None.
    """
    usable = [item for item in candidates if item.get("usable") is True and item.get("confidence") in {"high", "medium"} and len(candidates) == 1]
    return {
        "asset_id": int(row["id"]),
        "service": service,
        "title": _text(row["name"]),
        "artist": _text(row["artist"]),
        "color": _int(row["color"]),
        "stored": _text(row["portable_id"]),
        "cues": CUES,
        "crates": [
            {
                "id": item["crate_id"],
                "name": item["name"],
                "list_order": item["list_order"],
            }
            for item in crates
        ],
        "match": usable[0] if len(usable) == 1 else None,
        "candidates": candidates,
    }


def _collect(conn: sqlite3.Connection, space: str, roots: Sequence[Path], database: Path) -> tuple[list[dict[str, object]], bool]:
    """List dead streaming tracks and their local matches.

    Args:
        conn: Open connection.
        space: Space name.
        roots: Folders to search.
        database: Library file, used to reject matches inside that folder.

    Returns:
        Plan rows and whether the file walk stopped early.
    """
    rows = _read_assets(conn, space)
    used = _used_files(rows)
    stems, truncated = _stem_index(roots)
    library_dir = _library_dir(database)
    tracks: list[dict[str, object]] = []
    for row in rows:
        service = _service_of(row)
        if service is None or _opens(_text(row["portable_id"])):
            continue
        asset_id = int(row["id"])
        tracks.append(
            _public_track(
                row,
                service,
                _candidates(_text(row["name"]), _text(row["artist"]), stems, used, library_dir),
                _placements(conn, asset_id),
            )
        )
    _demote_shared(tracks)
    for track in tracks:
        candidates = track["candidates"]
        if not isinstance(candidates, list):
            track["match"] = None
            continue
        usable = [
            item
            for item in candidates
            if isinstance(item, dict) and item.get("usable") is True and item.get("confidence") in {"high", "medium"} and len(candidates) == 1
        ]
        track["match"] = usable[0] if len(usable) == 1 else None
    return tracks, truncated


def _parse_roots(raw: object) -> list[Path] | None:
    """Return search folders from a request, or None to discover them.

    Args:
        raw: Missing, a string, or a list of strings.

    Returns:
        Paths, or None when the caller did not name folders.

    Raises:
        library.LibraryError: The value is present and is not a path list.
    """
    if raw is None:
        return None
    items: list[object]
    if isinstance(raw, str):
        items = [raw]
    elif isinstance(raw, list):
        items = list(raw)
    else:
        raise library.LibraryError("That request is not valid.", 400)
    paths: list[Path] = []
    for item in items:
        if not isinstance(item, str) or not item.strip() or "\x00" in item:
            raise library.LibraryError("That request is not valid.", 400)
        paths.append(Path(item))
    return paths


def _discover_roots() -> list[Path]:
    """Return music folders the Files page would search.

    Returns:
        Directories that exist and are not shortcuts. An unreadable
        library contributes none.
    """
    import music_roots

    found: list[Path] = []
    try:
        rows = music_roots.music_roots()
    except (OSError, sqlite3.Error):
        return found
    for item in rows:
        if item.get("missing") is True:
            continue
        path = item.get("path")
        if not isinstance(path, str) or not path:
            continue
        folder = Path(path)
        try:
            if folder.is_dir() and not folder.is_symlink():
                found.append(folder)
        except OSError:
            continue
    return found


def _swaps(raw: object) -> list[tuple[int, str]]:
    """Return the asset and path pairs the request wants to repair.

    Args:
        raw: Request ``swaps``. None is an empty list.

    Returns:
        Pairs in request order, without duplicate asset ids.

    Raises:
        library.LibraryError: A pair is missing an id or a path.
    """
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise library.LibraryError("That request is not valid.", 400)
    pairs: list[tuple[int, str]] = []
    seen: set[int] = set()
    for item in raw:
        if not isinstance(item, dict):
            raise library.LibraryError("That request is not valid.", 400)
        asset_id = item.get("asset_id")
        path = item.get("path")
        if isinstance(asset_id, bool) or not isinstance(asset_id, int) or not isinstance(path, str) or not path.strip():
            raise library.LibraryError("That request is not valid.", 400)
        if "\x00" in path or asset_id in seen:
            raise library.LibraryError("That request is not valid.", 400)
        seen.add(asset_id)
        pairs.append((asset_id, path))
    return pairs


def plan(database: Path, space: str, roots: Sequence[Path] | None = None) -> Plan:
    """List greyed-out Beatport and Beatsource tracks and local matches.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        roots: Folders to search. None uses the Files roots.

    Returns:
        ``tracks``, ``truncated``, ``cues``, and ``note``. Nothing is written.

    Raises:
        library.LibraryError: The space is unknown, or the database cannot
            be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    chosen = list(roots) if roots is not None else _discover_roots()
    conn = gig_check.open_read_only(database)
    try:
        tracks, truncated = _collect(conn, space, chosen, database)
    finally:
        conn.close()
    return {
        "tracks": tracks,
        "truncated": truncated,
        "cues": CUES,
        "note": CUES_NOTE,
        "roots": [str(path) for path in chosen],
        "preview": True,
        "written": False,
    }


def _resolved_file(path: str) -> Path | None:
    """Return a regular audio file, refusing a shortcut.

    Args:
        path: Request path.

    Returns:
        The resolved file, or None when it is missing, a shortcut, or not audio.
    """
    candidate = Path(path)
    try:
        if candidate.is_symlink():
            return None
        resolved = candidate.resolve(strict=True)
    except OSError:
        return None
    try:
        if not resolved.is_file() or resolved.is_symlink():
            return None
    except OSError:
        return None
    if resolved.suffix.casefold() not in relink.AUDIO_SUFFIXES:
        return None
    return resolved


def _accept(tracks: Sequence[Mapping[str, object]], swaps: Sequence[tuple[int, str]], library_dir: Path) -> list[tuple[int, Path, str]]:
    """Check every requested swap against the fresh plan.

    Args:
        tracks: Plan rows from the write connection.
        swaps: Requested pairs.
        library_dir: Folder that holds the library file.

    Returns:
        Asset id, resolved file, and the portable id to store.

    Raises:
        library.LibraryError: Any pair is not a current usable match,
            names a shortcut, or sits in the library folder or ``_Serato_``.
            Nothing has been written.
    """
    by_id = {int(track["asset_id"]): track for track in tracks}
    accepted: list[tuple[int, Path, str]] = []
    seen_paths: set[str] = set()
    for asset_id, raw in swaps:
        track = by_id.get(asset_id)
        resolved = _resolved_file(raw)
        if track is None or resolved is None or _blocked(resolved, library_dir) is not None:
            raise library.LibraryError(MISMATCH, 400)
        key = _key(resolved)
        candidates = track.get("candidates")
        paths = {
            _key(Path(str(item["path"])))
            for item in candidates
            if isinstance(candidates, list) and isinstance(item, dict) and isinstance(item.get("path"), str)
        }
        if key not in paths or key in seen_paths or _blocked(resolved, library_dir) is not None:
            raise library.LibraryError(MISMATCH, 400)
        seen_paths.add(key)
        accepted.append((asset_id, resolved, files.to_portable(resolved)))
    return accepted


def _history_name(conn: sqlite3.Connection, asset_id: int, name: str) -> None:
    """Point history rows at the local file name without moving the asset.

    Args:
        conn: Write connection.
        asset_id: Asset that was repaired.
        name: New file name.
    """
    tables = {str(row[0]) for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    if "history_entry" not in tables:
        return
    columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(history_entry)")}
    if "asset_id" not in columns or "file_name" not in columns:
        return
    conn.execute(
        "UPDATE history_entry SET file_name = ? WHERE asset_id = ?",
        (name, asset_id),
    )


def apply(
    space: str,
    swaps: Sequence[tuple[int, str]],
    roots: Sequence[Path] | None = None,
) -> Plan:
    """Point the chosen streaming rows at their local files.

    Args:
        space: Space name.
        swaps: Asset id and path pairs. Empty writes nothing.
        roots: Folders searched again on the write connection. None uses
            the Files roots.

    Returns:
        The plan. ``written`` is false when there is nothing to change.

    Raises:
        library.LibraryError: The space is unknown, or a pair does not
            match the fresh plan. A mismatch writes nothing.
        library.SeratoOpen: Serato still has the library open.
    """
    import safe_write

    database = Path(library.MASTER)
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    if not swaps:
        result = plan(database, space, roots)
        result["swaps"] = []
        result["written"] = False
        return result

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> Plan:
        """Re-check the plan, then update the matching rows.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict.

        Raises:
            library.LibraryError: A pair is not a current match. The
                transaction has not updated a row.
        """
        chosen = list(roots) if roots is not None else _discover_roots()
        tracks, truncated = _collect(conn, space, chosen, database)
        accepted = _accept(tracks, swaps, _library_dir(database))
        if not accepted:
            return {
                "tracks": tracks,
                "truncated": truncated,
                "cues": CUES,
                "note": CUES_NOTE,
                "roots": [str(path) for path in chosen],
                "swaps": [],
                "preview": False,
                "written": False,
            }
        before: dict[int, dict[str, object]] = {}
        for asset_id, _path, _portable in accepted:
            row = conn.execute(
                "SELECT id, name, artist, color, portable_id FROM asset WHERE id = ?",
                (asset_id,),
            ).fetchone()
            if row is None:
                raise library.LibraryError(MISMATCH, 400)
            before[asset_id] = {
                "name": _text(row["name"]),
                "artist": _text(row["artist"]),
                "color": _int(row["color"]),
                "placements": [
                    (int(item["row_id"]), int(item["crate_id"]), item["list_order"])
                    for item in _placements(conn, asset_id)
                ],
            }
        write.set_target("streaming repair")
        now = int(time.time())
        revision = library._next_revision(conn)  # pyright: ignore[reportPrivateUsage]
        expected: dict[int, str] = {}
        for asset_id, path, portable in accepted:
            values: dict[str, object] = {
                "portable_id": portable,
                "file_name": path.name,
                "is_missing": 0,
                "third_party_type": 0,
                "file_size": path.stat().st_size,
                "time_modified": now,
                "revision": revision,
            }
            library._assign(  # pyright: ignore[reportPrivateUsage]
                conn,
                "asset",
                values,
                "id = ?",
                asset_id,
            )
            _history_name(conn, asset_id, path.name)
            expected[asset_id] = portable

        def check(copied: sqlite3.Connection, expected: dict[int, str] = expected, before: dict[int, dict[str, object]] = before) -> None:
            """Fail when the path, colour, or crate order is not what was asked.

            Args:
                copied: Read-only copy of the database after commit.
                expected: Asset id to the portable id that should be stored.
                before: Colour, name, artist, and crate positions from before
                    the update.

            Raises:
                VerifyMismatch: A row moved, changed colour, or left its
                    crate position.
            """
            for asset_id, portable in expected.items():
                row = copied.execute(
                    "SELECT name, artist, color, portable_id FROM asset WHERE id = ?",
                    (asset_id,),
                ).fetchone()
                if row is None:
                    raise safe_write.VerifyMismatch("The streaming track is missing.")
                prior = before[asset_id]
                if _text(row["portable_id"]) != portable:
                    raise safe_write.VerifyMismatch("The local file did not stick.")
                if _text(row["name"]) != prior["name"] or _text(row["artist"]) != prior["artist"]:
                    raise safe_write.VerifyMismatch("The track name changed.")
                if _int(row["color"]) != prior["color"]:
                    raise safe_write.VerifyMismatch("The track colour changed.")
                placements = [
                    (int(item["row_id"]), int(item["crate_id"]), item["list_order"])
                    for item in _placements(copied, asset_id)
                ]
                if placements != prior["placements"]:
                    raise safe_write.VerifyMismatch("The crate position changed.")

        write.check(check)
        return {
            "tracks": tracks,
            "truncated": truncated,
            "cues": CUES,
            "note": CUES_NOTE,
            "roots": [str(path) for path in chosen],
            "swaps": [{"asset_id": asset_id, "path": str(path)} for asset_id, path, _portable in accepted],
            "preview": False,
            "written": True,
        }

    result = safe_write.run("streaming_swap", "streaming repair", run)
    if result.get("written"):
        swaps_out = result.get("swaps")
        if isinstance(swaps_out, list):
            with closing(library.read_conn()) as master:
                for item in swaps_out:
                    if not isinstance(item, dict):
                        continue
                    asset_id = item.get("asset_id")
                    path = item.get("path")
                    if isinstance(asset_id, int) and isinstance(path, str):
                        resolved = Path(path)
                        library._mirror_asset(  # pyright: ignore[reportPrivateUsage]
                            master,
                            asset_id,
                            {
                                "portable_id": files.to_portable(resolved),
                                "file_name": resolved.name,
                                "is_missing": 0,
                                "third_party_type": 0,
                            },
                        )
    return result


def action(payload: Mapping[str, object]) -> Plan:
    """Run one ``POST /api/streaming-swap`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. Takes ``space``.
            Optional ``roots`` limits the file search. ``apply`` takes
            ``swaps`` and writes only when ``confirm`` is true.

    Returns:
        That action's result. Preview and an unconfirmed apply do not write.

    Raises:
        library.LibraryError: The action or a field is not valid.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    roots = _parse_roots(payload.get("roots"))
    if kind == "preview" or (kind == "apply" and payload.get("confirm") is not True):
        result = plan(Path(library.MASTER), space, roots)
        result["preview"] = True
        result["written"] = False
        return result
    if kind == "apply":
        return apply(space, _swaps(payload.get("swaps")), roots)
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the plan as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the plan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="List greyed-out Beatport and Beatsource tracks. Read-only.")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("roots", nargs="*", type=Path)
    args = parser.parse_args(argv)
    try:
        result = plan(args.database, args.space, args.roots or None)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
