#!/usr/bin/env python3
"""Per-track quality line and a sticky Not a problem dismiss (#416).

``measure`` reads the container from the file header and the bitrate from
``bitrate_check.estimate_kbps`` after ``spectrum_cutoff``. It does not map
an extension to a bitrate. Peak is the loudest decoded sample in the
excerpt, in dB. A missing or unreadable file is an empty line: format,
bitrate, and peak stay null.

``dismiss`` writes ``quality-dismissals.json`` beside ``settings.json``.
The key is the real path. The value is a hash of size, mtime, bitrate,
and peak. The line stays hidden until that fact changes or the DJ clears
it. Audio, cues, and the Serato library are not written.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import TypedDict, cast

import numpy as np

import app_config
import bitrate_check
import gig_check
import library
import waveform

DISMISS_NAME = "quality-dismissals.json"
# Six seconds is enough for a stationary cliff and bounds a health scan.
_EXCERPT_SECONDS = 6
_HEADER = 12


class Reading(TypedDict):
    """One file's quality facts.

    Attributes:
        format: Container sniffed from the header, or None.
        bitrate_kbps: ``estimate_kbps`` result, or None when there is no cliff.
        peak_db: Loudest sample in the excerpt, one decimal, or None.
        size: File size in bytes, or None when the file cannot be stat'd.
        mtime_ns: Modification time in nanoseconds, or None.
    """

    format: str | None
    bitrate_kbps: int | None
    peak_db: float | None
    size: int | None
    mtime_ns: int | None


def dismiss_path() -> Path:
    """Return the dismiss file beside ``settings.json``.

    Returns:
        ``quality-dismissals.json`` inside :func:`app_config.config_dir`.
        The file is not created here and is never inside the Serato folder.
    """
    return app_config.config_dir() / DISMISS_NAME


def empty_reading() -> Reading:
    """Return a quality line with no measured facts.

    Returns:
        Null format, bitrate, peak, size, and mtime. Not a guessed number.
    """
    return {
        "format": None,
        "bitrate_kbps": None,
        "peak_db": None,
        "size": None,
        "mtime_ns": None,
    }


def sniff_format(header: bytes) -> str | None:
    """Name the container from the leading bytes, not the extension.

    Args:
        header: The first bytes of the file. Twelve bytes are enough.

    Returns:
        ``mp3``, ``flac``, ``wav``, ``aiff``, ``ogg``, or ``mp4``, or None
        when those bytes are not a known audio header.
    """
    if header.startswith(b"ID3") or (
        len(header) >= 2 and header[0] == 0xFF and header[1] & 0xE0 == 0xE0
    ):
        return "mp3"
    if header.startswith(b"fLaC"):
        return "flac"
    if len(header) >= 12 and header.startswith(b"RIFF") and header[8:12] == b"WAVE":
        return "wav"
    if len(header) >= 12 and header.startswith(b"FORM") and header[8:12] in {b"AIFF", b"AIFC"}:
        return "aiff"
    if header.startswith(b"OggS"):
        return "ogg"
    if len(header) >= 8 and header[4:8] == b"ftyp":
        return "mp4"
    return None


def path_key(path: Path) -> str:
    """Return the stable real-path key for one file.

    Args:
        path: A filesystem path. Symlinks are resolved.

    Returns:
        ``normcase`` of the resolved path so macOS and Windows match.
    """
    return os.path.normcase(str(path.resolve()))


def fact_hash(
    size: int,
    mtime_ns: int,
    bitrate_kbps: int | None,
    peak_db: float | None,
) -> str:
    """Hash the facts a dismiss sticks to.

    Args:
        size: File size in bytes.
        mtime_ns: Modification time in nanoseconds.
        bitrate_kbps: Measured bitrate, or None.
        peak_db: Measured peak, or None.

    Returns:
        SHA-256 hex of those four facts. Format and the extension are not
        included. A change to any fact is a different hash.
    """
    bitrate_text = "" if bitrate_kbps is None else str(int(bitrate_kbps))
    peak_text = "" if peak_db is None else f"{peak_db:.1f}"
    raw = f"{size}|{mtime_ns}|{bitrate_text}|{peak_text}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def measure(path: Path) -> Reading:
    """Read format, bitrate, and peak from one file.

    Args:
        path: Audio path. It is opened read-only.

    Returns:
        An empty reading when the path is missing or cannot be stat'd.
        Otherwise size and mtime are set. Format comes from the header.
        Bitrate comes from :func:`bitrate_check.estimate_kbps`. Peak is the
        loudest sample in the excerpt. A file that will not decode keeps
        null bitrate and peak.
    """
    try:
        if not path.is_file():
            return empty_reading()
        stat = path.stat()
        with path.open("rb") as handle:
            header = handle.read(_HEADER)
    except OSError:
        return empty_reading()
    bitrate, peak = _measure_audio(path)
    return {
        "format": sniff_format(header),
        "bitrate_kbps": bitrate,
        "peak_db": peak,
        "size": int(stat.st_size),
        "mtime_ns": int(stat.st_mtime_ns),
    }


def _measure_audio(path: Path) -> tuple[int | None, float | None]:
    """Decode a short excerpt and return bitrate and peak.

    Args:
        path: A file that exists. Decoding is read-only.

    Returns:
        ``(bitrate_kbps, peak_db)``. Either is None when the decoder
        returns no samples or raises. The extension is not a bitrate.
    """
    try:
        stream = waveform.iter_pcm(path)
    except Exception:
        return None, None
    peak = 0.0
    limit = waveform.ANALYZE_RATE * _EXCERPT_SECONDS

    def limited():
        nonlocal peak
        seen = 0
        for chunk in stream:
            arr = np.asarray(chunk, dtype=np.float64)
            if arr.size:
                peak = max(peak, float(np.max(np.abs(arr))))
                seen += int(arr.size)
            yield arr
            if seen >= limit:
                break

    try:
        cutoff = bitrate_check.spectrum_cutoff(limited())
    except Exception:
        return None, None
    finally:
        stream.close()
    if not cutoff.samples:
        return None, None
    bitrate = bitrate_check.estimate_kbps(cutoff.cutoff_hz)
    peak_db = round(20.0 * float(np.log10(peak)), 1) if peak > 0 else None
    return bitrate, peak_db


def load_dismissals() -> dict[str, str]:
    """Read the dismiss map. A missing or damaged file is empty.

    Returns:
        Real path to fact hash. Nothing is written.
    """
    try:
        payload = json.loads(dismiss_path().read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return {}
    raw = payload.get("dismissed") if isinstance(payload, dict) else None
    if not isinstance(raw, dict):
        return {}
    found: dict[str, str] = {}
    for key, value in raw.items():
        if isinstance(key, str) and isinstance(value, str) and len(value) == 64:
            found[key] = value
    return found


def _save(dismissed: dict[str, str]) -> None:
    """Replace the dismiss file with ``dismissed``.

    Args:
        dismissed: Real path to fact hash.

    Raises:
        OSError: The config directory cannot be written.

    The temp file and the JSON live in :func:`app_config.config_dir` only.
    """
    path = dismiss_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    blob = json.dumps({"dismissed": dismissed}, indent=2, sort_keys=True) + "\n"
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(blob, encoding="utf-8")
    os.replace(temporary, path)


def _reading_hash(reading: Reading) -> str | None:
    """Return the fact hash, or None when size or mtime is missing."""
    size = reading["size"]
    mtime_ns = reading["mtime_ns"]
    if size is None or mtime_ns is None:
        return None
    return fact_hash(size, mtime_ns, reading["bitrate_kbps"], reading["peak_db"])


def is_dismissed(path: Path, reading: Reading, store: dict[str, str] | None = None) -> bool:
    """Return whether this file's current facts are dismissed.

    Args:
        path: File path. The key uses the real path.
        reading: Current measurement.
        store: Dismiss map. None reads the file.

    Returns:
        True only when the stored hash equals the current fact hash.
    """
    fact = _reading_hash(reading)
    if fact is None:
        return False
    current = load_dismissals() if store is None else store
    return current.get(path_key(path)) == fact


def section(rows: list[dict[str, object]], cap: int = 100) -> dict[str, object]:
    """Build the quality section for tracks already chosen by the report.

    Args:
        rows: ``id``, ``name``, ``artist``, ``file``, and ``path``. ``path``
            is an existing file or None. The caller applies crate scope.
        cap: Most files to measure. The health report passes its row cap.

    Returns:
        ``count``, ``dismissed``, and ``tracks``. A missing path is left
        out. An on-disk file that will not decode is kept with an empty
        quality line. A matching dismiss is counted and omitted. At most
        ``cap`` files are measured, in the given order. Nothing is written.
    """
    store = load_dismissals()
    visible: list[dict[str, object]] = []
    hidden = 0
    measured = 0
    for row in rows:
        raw_path = row.get("path")
        if not isinstance(raw_path, str) or not raw_path:
            continue
        if measured >= cap:
            break
        measured += 1
        path = Path(raw_path)
        reading = measure(path)
        if is_dismissed(path, reading, store):
            hidden += 1
            continue
        visible.append(
            {
                "id": int(cast(int, row["id"])),
                "name": str(row.get("name") or ""),
                "artist": str(row.get("artist") or ""),
                "file": str(row.get("file") or ""),
                "quality": {
                    "format": reading["format"],
                    "bitrate_kbps": reading["bitrate_kbps"],
                    "peak_db": reading["peak_db"],
                },
            }
        )
    return {"count": len(visible), "dismissed": hidden, "tracks": visible[:cap]}


def _asset_path(database: Path, space: str, asset_id: int) -> Path:
    """Resolve one track's stored path in ``space``.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        asset_id: Asset id.

    Returns:
        The resolved filesystem path. The file may be missing.

    Raises:
        library.LibraryError: Unknown space (400) or unknown track (404).
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        row = conn.execute(
            """
            SELECT a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ? AND a.id = ?
            """,
            (space, asset_id),
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        raise library.LibraryError("That track is not in this library.", 404)
    stored = row[0] if isinstance(row[0], str) else None
    resolved = library.resolved_path(stored)
    if not resolved:
        raise library.LibraryError("That file is not on disk.", 404)
    return Path(resolved)


def dismiss(database: Path, space: str, asset_id: int) -> dict[str, object]:
    """Hide one track's quality line until its facts change.

    Args:
        database: ``master.sqlite``. Opened read-only.
        space: Space name.
        asset_id: Asset id.

    Returns:
        ``ok``, ``action``, and ``id``.

    Raises:
        library.LibraryError: The track or the file is missing, or the file
            cannot be stat'd.
        OSError: The dismiss file cannot be written.
    """
    path = _asset_path(database, space, asset_id)
    reading = measure(path)
    fact = _reading_hash(reading)
    if fact is None:
        raise library.LibraryError("That file is not on disk.", 404)
    store = load_dismissals()
    store[path_key(path)] = fact
    _save(store)
    return {"ok": True, "action": "dismiss", "id": asset_id}


def clear(database: Path, space: str, asset_id: int) -> dict[str, object]:
    """Show one track's quality line again.

    Args:
        database: ``master.sqlite``. Opened read-only.
        space: Space name.
        asset_id: Asset id.

    Returns:
        ``ok``, ``action``, and ``id``.

    Raises:
        library.LibraryError: The track has no stored path.
        OSError: The dismiss file cannot be written.
    """
    path = _asset_path(database, space, asset_id)
    store = load_dismissals()
    store.pop(path_key(path), None)
    _save(store)
    return {"ok": True, "action": "clear", "id": asset_id}


def clear_all() -> dict[str, object]:
    """Show every dismissed quality line again.

    Returns:
        ``ok`` and ``action``.

    Raises:
        OSError: The dismiss file cannot be written.
    """
    _save({})
    return {"ok": True, "action": "clear-all"}


def _asset_id(value: object) -> int:
    """Return a track id, or raise 400.

    Args:
        value: JSON field.

    Returns:
        The id.

    Raises:
        library.LibraryError: Not an integer. Booleans are refused.
    """
    if isinstance(value, bool) or not isinstance(value, int):
        raise library.LibraryError("That request is not valid.", 400)
    return value


def action(payload: dict[str, object], database: Path | None = None) -> dict[str, object]:
    """Dismiss or clear a quality line. Writes only the dismiss JSON.

    Args:
        payload: ``action`` of ``dismiss``, ``clear``, or ``clear-all``.
            ``dismiss`` and ``clear`` also take ``id`` and ``space``.
        database: ``master.sqlite``. None uses :data:`library.MASTER`.

    Returns:
        The action result.

    Raises:
        library.LibraryError: A bad action, id, or space, or a missing track.
        OSError: The dismiss file cannot be written.
    """
    master = Path(library.MASTER) if database is None else database
    name = payload.get("action")
    if name == "clear-all":
        return clear_all()
    if name not in {"dismiss", "clear"}:
        raise library.LibraryError("That request is not valid.", 400)
    space = payload.get("space")
    if not isinstance(space, str) or not space:
        raise library.LibraryError("That request is not valid.", 400)
    asset_id = _asset_id(payload.get("id"))
    if name == "dismiss":
        return dismiss(master, space, asset_id)
    return clear(master, space, asset_id)
