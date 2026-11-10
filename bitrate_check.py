#!/usr/bin/env python3
"""Flag "320 kbps" files that were made from a lower bitrate (#36, part 1).

A lossy encoder throws away the highest frequencies first, so its output has a
sharp cliff in the spectrum: about 16 kHz at 128 kbps and about 20 kHz at 320
kbps. Re-encoding that file at 320 kbps, or saving it as FLAC or WAV, keeps
the cliff where it was. ``spectrum_cutoff`` averages the spectrum over a
sample of the track and looks for the steepest drop above 11 kHz; a fall of
25 dB within 500 Hz is a cliff, while a dark master that rolls off a few dB
per kHz is not. ``estimate_kbps`` maps the cliff to the bitrate an encoder
would use, and ``verdict`` compares that with what the file claims.

The result is a suspicion, not proof: an old recording or a lo-fi master can
have a real cliff. The scan writes nothing. Files are decoded read-only through
``waveform.iter_pcm`` and the library is opened with
``gig_check.open_read_only``. ``POST /api/bitrate-check`` with ``action``
``preview`` lists a Suspect quality crate of the flagged tracks; ``create``
writes that crate through ``library.crate_action`` and ``safe_write`` with
Serato closed. A plan with no flagged tracks does not write.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections.abc import Iterator, Mapping, Sequence
from pathlib import Path
from typing import NamedTuple

import numpy as np

import gig_check
import library
import waveform

NEEDS_CRATE = "Choose a crate for a bitrate check."
CRATE_NAME = "Suspect quality"

FFT_SIZE = 8192
# Analyse one frame in STRIDE, at most MAX_FRAMES of them: about 3.7 minutes
# of audio spread over 11, so a long mix is not decoded to the end.
STRIDE = 3
MAX_FRAMES = 400
SEARCH_LOW_HZ = 11_000.0
SEARCH_HIGH_HZ = 21_000.0
WINDOW_HZ = 500.0
CLIFF_DB = 25.0
SILENCE_RMS = 1e-4

# Upper cutoff -> bitrate, from common LAME low-pass settings.
_KBPS = ((16_500.0, 128), (17_750.0, 160), (19_250.0, 192), (19_900.0, 256), (20_700.0, 320))
_LOSSLESS = frozenset({".flac", ".wav", ".aif", ".aiff"})
_DECODED = frozenset({".mp3", ".flac", ".wav", ".aif", ".aiff", ".ogg", ".m4a", ".mp4", ".aac", ".alac"})
_UPSAMPLED_RATIO = 1.5


class Cutoff(NamedTuple):
    """Where the spectrum falls off a cliff.

    Attributes:
        cutoff_hz: The cliff, or None when there is none above 11 kHz.
        frames: Frames that were loud enough to analyse. 0 means silent or too short.
        samples: Samples read. 0 means the decoder gave no sound at all.
    """

    cutoff_hz: float | None
    frames: int
    samples: int = 0


def spectrum_cutoff(chunks: Iterator[np.ndarray], rate: int = waveform.ANALYZE_RATE) -> Cutoff:
    """Find the encoder's low-pass frequency in mono samples.

    Args:
        chunks: Mono float samples, such as ``waveform.iter_pcm``. Reading
            stops after ``MAX_FRAMES`` analysed frames.
        rate: Sample rate of ``chunks``.

    Returns:
        The cliff frequency and the number of frames analysed.
    """
    window = np.hanning(FFT_SIZE)
    power = np.zeros(FFT_SIZE // 2 + 1)
    pending = np.zeros(0, dtype=np.float64)
    index = frames = samples = 0
    for chunk in chunks:
        samples += len(chunk)
        pending = np.concatenate((pending, np.asarray(chunk, dtype=np.float64)))
        while len(pending) >= FFT_SIZE and frames < MAX_FRAMES:
            frame = pending[:FFT_SIZE]
            pending = pending[FFT_SIZE:]
            take = index % STRIDE == 0
            index += 1
            if take and float(np.sqrt(np.mean(frame * frame))) > SILENCE_RMS:
                power += np.abs(np.fft.rfft(frame * window)) ** 2
                frames += 1
        if frames >= MAX_FRAMES:
            break
    if not frames:
        return Cutoff(None, 0, samples)
    level = 10 * np.log10(power / frames + 1e-30)
    bin_hz = rate / FFT_SIZE
    width = int(round(WINDOW_HZ / bin_hz))
    sums = np.concatenate(([0.0], np.cumsum(level)))
    low = max(width, int(SEARCH_LOW_HZ / bin_hz))
    high = min(len(level) - width, int(SEARCH_HIGH_HZ / bin_hz))
    if high <= low:
        return Cutoff(None, frames, samples)
    edges = np.arange(low, high + 1)
    before = (sums[edges] - sums[edges - width]) / width
    after = (sums[edges + width] - sums[edges]) / width
    drops = before - after
    best = int(np.argmax(drops))
    if float(drops[best]) < CLIFF_DB:
        return Cutoff(None, frames, samples)
    return Cutoff(float(edges[best]) * bin_hz, frames, samples)


def estimate_kbps(cutoff_hz: float | None) -> int | None:
    """Return the bitrate an encoder uses for this low-pass, or None for full band."""
    if cutoff_hz is None:
        return None
    for limit, kbps in _KBPS:
        if cutoff_hz <= limit:
            return kbps
    return None


def verdict(suffix: str, stated_bps: int | None, cutoff_hz: float | None) -> str | None:
    """Decide whether a file claims more quality than it has.

    Args:
        suffix: File extension, any case.
        stated_bps: Bitrate the library stores (``file_bit_rate``, bits per second).
        cutoff_hz: From :func:`spectrum_cutoff`.

    Returns:
        ``lossy_source`` for FLAC, WAV, or AIFF with a lossy encoder's cliff;
        ``upsampled`` for a lossy file that claims at least 1.5 times the
        bitrate its cliff shows; otherwise None. 320 against 256 is too close
        to call.
    """
    estimate = estimate_kbps(cutoff_hz)
    if estimate is None:
        return None
    if suffix.lower() in _LOSSLESS:
        return "lossy_source"
    if not stated_bps:
        return None
    if stated_bps / 1000 >= estimate * _UPSAMPLED_RATIO:
        return "upsampled"
    return None


def require_crate(crate_id: int | None) -> None:
    """Refuse a whole-library check from the page; ``python3 bitrate_check.py`` can run one.

    Raises:
        library.LibraryError: No crate (400).
    """
    if crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)


def _crate_assets(conn: sqlite3.Connection, crate_ids: list[int]) -> set[int]:
    """Return the asset ids in these crates.

    A live Serato library links ``container_asset`` through
    ``location_container``. The test schema also stores ``container_id`` on
    the membership row. Both are read.
    """
    marks = ",".join("?" for _ in crate_ids)
    found: set[int] = set()
    columns = {str(row[1]) for row in conn.execute("PRAGMA table_info(container_asset)")}
    if "location_container_id" in columns:
        query = (
            "SELECT ca.asset_id FROM container_asset ca JOIN location_container lc "
            f"ON lc.id = ca.location_container_id WHERE lc.container_id IN ({marks})"
        )
        found.update(int(row[0]) for row in conn.execute(query, crate_ids) if row[0] is not None)
    if "container_id" in columns:
        query = f"SELECT asset_id FROM container_asset WHERE container_id IN ({marks})"
        found.update(int(row[0]) for row in conn.execute(query, crate_ids) if row[0] is not None)
    return found


def _rows(database: Path, space: str, crate_id: int | None) -> list[sqlite3.Row]:
    """Read the tracks to check, in name order."""
    conn = gig_check.open_read_only(database)
    try:
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id, a.file_bit_rate
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
            members = _crate_assets(conn, library.descendant_ids(conn, crate_id))
            rows = [row for row in rows if int(row["id"]) in members]
    finally:
        conn.close()
    return rows


def _analyse(path: Path) -> Cutoff | None:
    """Decode a sample of ``path``; None when no decoder reads any sound from it."""
    chunks = waveform.iter_pcm(path)
    try:
        found = spectrum_cutoff(chunks)
    except Exception:
        return None
    finally:
        chunks.close()
    return found if found.samples else None


def scan(database: Path, space: str, crate_id: int | None = None) -> dict[str, object]:
    """Check the files behind a space's tracks, or one crate's with its subcrates.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        crate_id: A crate, or None for the whole space.

    Returns:
        ``crate``; counts ``checked`` (analysed), ``not_found`` (including an
        unplugged drive), ``unreadable``, ``too_quiet`` (silent or too short),
        and ``unchecked`` (a format this check does not decode); and
        ``suspects``: ``{ id, name, artist, file, reason, stated_kbps,
        estimated_kbps, cutoff_hz }`` in name order. ``file`` is the file
        name, not the path.

    Raises:
        library.LibraryError: Unknown space, a crate not in the space (404),
            or a database that cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    counts = {"checked": 0, "not_found": 0, "unreadable": 0, "too_quiet": 0, "unchecked": 0}
    suspects: list[dict[str, object]] = []
    for row in _rows(database, space, crate_id):
        resolved = library.resolved_path(row["portable_id"])
        path = Path(resolved) if resolved else None
        try:
            present = path is not None and path.is_file()
        except (OSError, ValueError):
            present = False
        if path is None or not present:
            counts["not_found"] += 1
            continue
        if path.suffix.lower() not in _DECODED:
            counts["unchecked"] += 1
            continue
        found = _analyse(path)
        if found is None:
            counts["unreadable"] += 1
            continue
        if not found.frames:
            counts["too_quiet"] += 1
            continue
        counts["checked"] += 1
        stated = int(row["file_bit_rate"]) if row["file_bit_rate"] else None
        reason = verdict(path.suffix, stated, found.cutoff_hz)
        if reason is None:
            continue
        suspects.append(
            {
                "id": int(row["id"]),
                "name": str(row["name"] or ""),
                "artist": str(row["artist"] or ""),
                "file": str(row["file_name"] or path.name),
                "reason": reason,
                "stated_kbps": int(stated / 1000) if stated else None,
                "estimated_kbps": estimate_kbps(found.cutoff_hz),
                "cutoff_hz": int(round(found.cutoff_hz or 0)),
            }
        )
    return {"crate": crate_id, **counts, "suspects": suspects}


def _payload_crate(value: object) -> int | None:
    """Return a crate id from a JSON body, or None for the whole space.

    Raises:
        library.LibraryError: The value is present and is not a positive int (400).
    """
    if value is None or value == "" or value == "all":
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise library.LibraryError("That request is not valid.", 400)
    return value


def _suspect_ids(report: Mapping[str, object]) -> list[int]:
    """Return flagged asset ids from a scan report, in report order."""
    rows = report.get("suspects")
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
) -> dict[str, object]:
    """Build the POST result from a scan report and an optional new crate."""
    name = CRATE_NAME
    saved_id: object = None
    if saved is not None:
        label = saved.get("name")
        if isinstance(label, str) and label:
            name = label
        saved_id = saved.get("id")
    added = len(_suspect_ids(report))
    crate = None
    if written and isinstance(saved_id, int) and not isinstance(saved_id, bool):
        crate = {"id": saved_id, "name": name}
    return {
        **dict(report),
        "preview": not written,
        "written": written,
        "name": name,
        "added": added,
        "saved": crate,
    }


def preview_crate(database: Path, space: str, crate_id: int) -> dict[str, object]:
    """List the Suspect quality crate a scan of this crate would save.

    Does not write. The scan still decodes audio.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Crate to check, including subcrates.

    Returns:
        Scan counts plus ``preview`` true, ``written`` false, ``name``,
        ``added``, and ``saved`` null.
    """
    require_crate(crate_id)
    return _plan(scan(database, space, crate_id), written=False)


def create_crate(database: Path, space: str, crate_id: int) -> dict[str, object]:
    """Save a Suspect quality crate of the flagged tracks through ``safe_write``.

    Re-runs the scan, then ``library.crate_action`` create. Serato must be
    quit. An empty scan does not write.

    Args:
        database: ``master.sqlite``. Must be the live ``library.MASTER``.
        space: Space name.
        crate_id: Crate to check, including subcrates.

    Returns:
        Scan counts plus ``written`` true and ``saved`` when a crate was
        created, or ``written`` false when nothing was flagged.

    Raises:
        library.LibraryError: Unknown space, crate not in the space, or
            a database that cannot be opened.
        library.SeratoOpen: Serato still has the library open.
    """
    require_crate(crate_id)
    report = scan(database, space, crate_id)
    ids = _suspect_ids(report)
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
    result = _plan(report, written=True, saved=made)
    warning = made.get("warning")
    if isinstance(warning, str) and warning:
        result["warning"] = warning
    return result


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/bitrate-check`` request.

    Args:
        payload: ``action`` is ``preview`` or ``create``. Both take
            ``space`` and ``crate``.

    Returns:
        That action's result.

    Raises:
        library.LibraryError: If the action or its fields are invalid.
        library.SeratoOpen: If ``create`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    crate_id = _payload_crate(payload.get("crate"))
    require_crate(crate_id)
    if crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)
    database = Path(library.MASTER)
    if kind == "preview":
        return preview_crate(database, space, crate_id)
    if kind == "create":
        return create_crate(database, space, crate_id)
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the report as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the report was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="Flag files made from a lower bitrate. Read-only.")
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
