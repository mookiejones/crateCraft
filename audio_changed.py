#!/usr/bin/env python3
"""Notice when a library file was replaced under the same path (#420).

The first time a path is read, size, duration, and a quick hash are saved
in ``audio-baseline.json`` beside ``settings.json``. That save is not a
swap. A later read whose size, duration, or hash differs is listed for an
Audio changed crate. The warning is that cues and the beatgrid may not
fit. An unplugged drive is skipped (``volumes.absent_volume``), and a
missing file is not a swap.

``preview`` and ``reanalyze`` do not write the library or the audio.
``reanalyze`` never rewrites cues or beatgrids. ``create`` with
``confirm`` true writes the crate through ``library.crate_action`` and
``safe_write`` with Serato closed, then remembers the new facts. An empty
list does not write.

``python3 audio_changed.py`` prints the scan as JSON. It does not create
a crate.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import threading
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import TypedDict, cast

import app_config
import gig_check
import library
import volumes

BASELINE_NAME = "audio-baseline.json"
CRATE_NAME = "Audio changed"
WARNING = "Cues and the beatgrid may not fit this audio."
REANALYZE_NOTE = (
    "Cues stay put. crateCraft does not rewrite cues or the beatgrid to fit the new audio."
)
# One second absorbs a header that rounds differently. A real replacement moves further.
DURATION_SLACK_MS = 1000
CHUNK = 64 * 1024
_LOCK = threading.Lock()


class Fact(TypedDict):
    """Size, duration, and quick hash for one path.

    Attributes:
        size: File size in bytes.
        duration_ms: Header duration in milliseconds, or None when the
            header has no duration.
        hash: Quick hash of the size plus the head, middle, and tail.
    """

    size: int
    duration_ms: int | None
    hash: str


def baseline_path() -> Path:
    """Return the baseline file beside ``settings.json``.

    Returns:
        ``audio-baseline.json`` inside :func:`app_config.config_dir`.

    Raises:
        library.LibraryError: The resolved file would sit in the Serato
            library folder or in a ``_Serato_`` directory.
    """
    path = app_config.config_dir() / BASELINE_NAME
    try:
        resolved = path.resolve(strict=False)
    except OSError:
        resolved = path
    library_dir = Path(library.MASTER).expanduser()
    try:
        library_dir = library_dir.resolve(strict=False).parent
    except OSError:
        library_dir = library_dir.parent
    if _inside(resolved, library_dir) or any(part.casefold() == "_serato_" for part in resolved.parts):
        raise library.LibraryError("Audio baseline cannot be stored in the Serato folder.")
    return path


def path_key(path: Path) -> str:
    """Return the stable real-path key for one audio file.

    Args:
        path: Filesystem path. Symlinks are resolved. The file need not exist.

    Returns:
        ``normcase`` of the resolved path so macOS and Windows match.
    """
    try:
        resolved = path.resolve(strict=False)
    except OSError:
        resolved = path
    return os.path.normcase(str(resolved))


def changed_reasons(before: Mapping[str, object], after: Mapping[str, object]) -> list[str]:
    """Name which stored facts no longer match.

    Args:
        before: Saved size, duration_ms, and hash.
        after: Facts just read from the file.

    Returns:
        ``size``, ``duration``, and ``hash`` in that order, only for facts
        that differ. A missing duration on either side is not a duration
        change. A duration move of ``DURATION_SLACK_MS`` or less is not a
        change.
    """
    reasons: list[str] = []
    if before.get("size") != after.get("size"):
        reasons.append("size")
    old = before.get("duration_ms")
    new = after.get("duration_ms")
    if (
        isinstance(old, int)
        and not isinstance(old, bool)
        and isinstance(new, int)
        and not isinstance(new, bool)
        and abs(old - new) > DURATION_SLACK_MS
    ):
        reasons.append("duration")
    old_hash = before.get("hash")
    new_hash = after.get("hash")
    if isinstance(old_hash, str) and isinstance(new_hash, str) and old_hash != new_hash:
        reasons.append("hash")
    return reasons


def fingerprint(path: Path) -> Fact | None:
    """Read size, duration, and a quick hash. Does not write the file.

    Args:
        path: Audio path. It is opened read-only.

    Returns:
        None when the path is missing or the bytes cannot be read.
        Duration is None when the header has no length. The hash still
        covers the size and a sample of the bytes.
    """
    try:
        if not path.is_file():
            return None
        size = int(path.stat().st_size)
    except OSError:
        return None
    digest = _quick_hash(path, size)
    if digest is None:
        return None
    return {"size": size, "duration_ms": _duration_ms(path), "hash": digest}


def scan(database: Path, space: str) -> dict[str, object]:
    """Compare library files with the baseline. New paths are saved, not listed.

    An unplugged drive is counted in ``offline`` and is not a swap. A
    missing file on a connected drive is ``not_found``, not a swap. The
    baseline file is the only write, and only for a path that was not
    saved before.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.

    Returns:
        ``checked``, ``offline``, ``not_found``, ``unreadable``,
        ``changed``, and ``warning``. Each changed row is ``id``,
        ``name``, ``artist``, ``file``, ``path``, ``reasons``, ``size``,
        ``duration_ms``, and ``hash``.

    Raises:
        library.LibraryError: The space is unknown, the database cannot
            be read, or the baseline would be stored in the Serato folder.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    rows = _rows(database, space)
    fresh: dict[str, Fact] = {}
    changed: list[dict[str, object]] = []
    offline = not_found = unreadable = unchanged = 0
    with _LOCK:
        store = _load()
        for row in rows:
            stored = row["portable_id"]
            if not isinstance(stored, str) or not stored:
                continue
            if volumes.absent_volume(stored) is not None:
                offline += 1
                continue
            resolved = library.resolved_path(stored) or stored
            path = Path(resolved)
            try:
                present = path.is_file()
            except OSError:
                present = False
            if not present:
                not_found += 1
                continue
            fact = fingerprint(path)
            if fact is None:
                unreadable += 1
                continue
            key = path_key(path)
            previous = store.get(key)
            if previous is None:
                fresh[key] = fact
                continue
            reasons = changed_reasons(previous, fact)
            if not reasons:
                unchanged += 1
                continue
            changed.append(_changed_row(row, path, fact, reasons))
        if fresh:
            store.update(fresh)
            _save(store)
    checked = offline + not_found + unreadable + len(fresh) + unchanged + len(changed)
    return {
        "checked": checked,
        "offline": offline,
        "not_found": not_found,
        "unreadable": unreadable,
        "changed": changed,
        "warning": WARNING,
    }


def preview_crate(database: Path, space: str) -> dict[str, object]:
    """List the Audio changed crate a scan would save. Does not write it.

    New paths are still recorded in the baseline, the same as
    :func:`scan`. The Serato library is not written.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        The scan plus ``preview`` true, ``written`` false, ``name``,
        ``added``, and ``saved`` null.
    """
    return _plan(scan(database, space), written=False)


def create_crate(database: Path, space: str) -> dict[str, object]:
    """Save an Audio changed crate through ``safe_write``.

    Re-scans, then ``library.crate_action`` create. Serato must be quit.
    An empty scan does not write. After a crate is saved, those paths
    are remembered so the next scan does not list the same replacement.
    Cues and beatgrids are not rewritten.

    Args:
        database: ``master.sqlite``. Must be the live ``library.MASTER``.
        space: Space name.

    Returns:
        A scan from after the remember, plus ``written`` true, ``added``,
        and ``saved`` when a crate was created. ``written`` is false when
        nothing was listed.

    Raises:
        library.LibraryError: Unknown space, or a database that cannot
            be opened.
        library.SeratoOpen: Serato still has the library open.
    """
    report = scan(database, space)
    ids = _ids(report)
    if not ids:
        return _plan(report, written=False)
    made = library.crate_action(
        {
            "action": "create",
            "space": space,
            "name": CRATE_NAME,
            "assets": ids,
        }
    )
    _remember(report)
    after = scan(database, space)
    result = _plan(after, written=True, saved=made, added=len(ids))
    result["warning"] = WARNING
    return result


def reanalyze(database: Path, space: str) -> dict[str, object]:
    """Preview a re-analyze. Cues and beatgrids are not rewritten.

    ``confirm`` does not change this. The control exists so a DJ can see
    that crateCraft will not refit cues or the grid to the new audio.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        ``preview`` true, ``written`` false, ``rewrites_cues`` false,
        ``rewrites_grid`` false, ``note``, and ``count`` of listed tracks.
    """
    report = scan(database, space)
    return {
        "preview": True,
        "written": False,
        "rewrites_cues": False,
        "rewrites_grid": False,
        "note": REANALYZE_NOTE,
        "count": len(_ids(report)),
        "warning": WARNING,
        "changed": report["changed"],
    }


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/audio-changed`` request.

    Args:
        payload: ``action`` is ``preview``, ``create``, or ``reanalyze``.
            All take ``space``. ``create`` writes only when ``confirm``
            is true. ``reanalyze`` never writes, even when ``confirm``
            is true.

    Returns:
        That action's result. ``create`` without ``confirm`` returns the
        preview.

    Raises:
        library.LibraryError: If the action or the space is invalid.
        library.SeratoOpen: If ``create`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    database = Path(library.MASTER)
    confirm = payload.get("confirm") is True
    if kind == "preview" or (kind == "create" and not confirm):
        return preview_crate(database, space)
    if kind == "create":
        return create_crate(database, space)
    if kind == "reanalyze":
        return reanalyze(database, space)
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the scan as JSON. Does not create a crate.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the scan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="Notice files replaced under the same path. Reads audio. Writes only the baseline beside settings."
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


def _changed_row(
    row: Mapping[str, object],
    path: Path,
    fact: Fact,
    reasons: list[str],
) -> dict[str, object]:
    """One listed replacement."""
    file_name = row.get("file_name")
    return {
        "id": row["id"],
        "name": row.get("name") if isinstance(row.get("name"), str) else "",
        "artist": row.get("artist") if isinstance(row.get("artist"), str) else "",
        "file": file_name if isinstance(file_name, str) and file_name else path.name,
        "path": str(path),
        "reasons": list(reasons),
        "size": fact["size"],
        "duration_ms": fact["duration_ms"],
        "hash": fact["hash"],
    }


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
    saved: Mapping[str, object] | None = None,
    added: int | None = None,
) -> dict[str, object]:
    """Build the POST result from a scan and an optional new crate."""
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
        "preview": not written,
        "written": written,
        "name": name,
        "added": count,
        "saved": crate,
    }


def _remember(report: Mapping[str, object]) -> None:
    """Store the current facts for tracks just listed. Does not touch audio."""
    updates: dict[str, Fact] = {}
    rows = report.get("changed")
    if not isinstance(rows, list):
        return
    for row in rows:
        if not isinstance(row, dict):
            continue
        fact = _fact_from(row)
        path = row.get("path")
        if fact is None or not isinstance(path, str) or not path:
            continue
        updates[path_key(Path(path))] = fact
    if not updates:
        return
    with _LOCK:
        store = _load()
        store.update(updates)
        _save(store)


def _fact_from(value: object) -> Fact | None:
    """Return a fact dict, or None when size or hash is missing."""
    if not isinstance(value, Mapping):
        return None
    size = value.get("size")
    digest = value.get("hash")
    duration = value.get("duration_ms")
    if isinstance(size, bool) or not isinstance(size, int) or size < 0:
        return None
    if not isinstance(digest, str) or not digest:
        return None
    if duration is not None and (isinstance(duration, bool) or not isinstance(duration, int)):
        return None
    return {
        "size": size,
        "duration_ms": None if duration is None else int(duration),
        "hash": digest,
    }


def _load() -> dict[str, Fact]:
    """Read the baseline. A missing or broken file is an empty store."""
    try:
        payload = json.loads(baseline_path().read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return {}
    raw = payload.get("paths") if isinstance(payload, dict) else None
    if not isinstance(raw, dict):
        return {}
    found: dict[str, Fact] = {}
    for key, value in raw.items():
        fact = _fact_from(value)
        if isinstance(key, str) and fact is not None:
            found[key] = fact
    return found


def _save(store: dict[str, Fact]) -> None:
    """Replace the baseline file. It lives only in the config directory."""
    path = baseline_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    body = {
        "version": 1,
        "paths": {key: cast(dict[str, object], fact) for key, fact in sorted(store.items())},
    }
    blob = json.dumps(body, indent=2, sort_keys=True) + "\n"
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(blob, encoding="utf-8")
    os.replace(temporary, path)


def _inside(path: Path, root: Path) -> bool:
    """True when ``path`` is ``root`` or a file inside it."""
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def _quick_hash(path: Path, size: int) -> str | None:
    """Hash the size plus the head, a middle window, and the tail.

    A file that fits in two chunks is hashed whole. This is not a full
    read of a long file.

    Args:
        path: File to read.
        size: Size in bytes from ``stat``.

    Returns:
        SHA-256 hex, or None when the file cannot be read.
    """
    digest = hashlib.sha256()
    digest.update(str(size).encode("ascii"))
    digest.update(b"\n")
    try:
        with path.open("rb") as handle:
            if size <= CHUNK * 2:
                digest.update(handle.read())
            else:
                digest.update(handle.read(CHUNK))
                middle = max(CHUNK, (size // 2) - (CHUNK // 2))
                if middle + CHUNK < size - CHUNK:
                    handle.seek(middle)
                    digest.update(handle.read(CHUNK))
                handle.seek(max(CHUNK, size - CHUNK))
                digest.update(handle.read(CHUNK))
    except OSError:
        return None
    return digest.hexdigest()


def _duration_ms(path: Path) -> int | None:
    """Read a header duration in milliseconds, or None.

    Args:
        path: Audio file. mutagen reads the header only.

    Returns:
        Rounded milliseconds, or None when the header has no length.
    """
    try:
        from mutagen import File
    except ImportError:
        return None
    try:
        audio = File(path)
    except Exception:
        return None
    info = getattr(audio, "info", None)
    length = getattr(info, "length", None)
    if isinstance(length, bool) or not isinstance(length, (int, float)) or length < 0:
        return None
    return int(round(float(length) * 1000))


if __name__ == "__main__":
    sys.exit(main())
