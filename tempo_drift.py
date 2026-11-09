#!/usr/bin/env python3
"""Flag tracks whose tempo wanders, or that look like live recordings (#207).

A constant click stays quiet. A click that moves by several BPM, a live-looking
name or comment, or Serato's pending tempo-map mark is listed so a DJ can give
those tracks a flexible beatgrid before a gig. A grid whose implied BPM already
spreads is skipped: it is already mapped. A wrong constant BPM is out of scope
and is not rewritten.

Window BPM is autocorrelation of a hop RMS envelope, folded into 70–140 so
60 vs 120 is not drift. Files are decoded read-only through
``waveform.iter_pcm``. The library is opened with ``gig_check.open_read_only``.
Nothing is written. ``GET /api/tempo-drift`` needs a crate because decode is
expensive; ``python3 tempo_drift.py`` can scan the whole space.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from collections.abc import Iterator, Sequence
from pathlib import Path
from typing import NamedTuple

import numpy as np

import bitrate_check
import gig_check
import library
import tags
import waveform

NEEDS_CRATE = "Choose a crate for a tempo check."

HOP = 512
WINDOW_SECONDS = 8.0
WINDOW_HOP_SECONDS = 4.0
MAX_SECONDS = 180.0
BPM_LOW = 70.0
BPM_HIGH = 140.0
SEARCH_LOW = 40.0
SEARCH_HIGH = 200.0
MIN_WINDOWS = 3
DRIFT_BPM = 6.0
GRID_SPREAD = 2.0
SILENCE_RMS = 1e-4
AC_PEAK = 0.15
_DECODED = frozenset({".mp3", ".flac", ".wav", ".aif", ".aiff", ".ogg", ".m4a", ".mp4", ".aac", ".alac"})

# Word-bounded live / bootleg / concert. "Alive", "Olive", and "livelihood"
# stay quiet. "(Live)", "Live at", and "recorded live" match.
LIVE_RE = re.compile(
    r"(?:^|[\s(\[{/,_-])(?:live(?:\s+(?:at|from|in)\b|[\s)\]}/,_-]|$)|bootleg\b|concert\b)",
    re.IGNORECASE,
)


class Envelope(NamedTuple):
    """Hop RMS of a capped decode.

    Attributes:
        hops: RMS of each hop. Empty when the decoder gave no sound.
        samples: Samples read. 0 means the decoder gave no sound at all.
    """

    hops: np.ndarray
    samples: int


def fold_bpm(bpm: float) -> float:
    """Fold a BPM into ``[BPM_LOW, BPM_HIGH)`` by doubling or halving.

    Args:
        bpm: A positive tempo.

    Returns:
        The folded tempo. Non-positive values are returned unchanged.
    """
    if bpm <= 0:
        return bpm
    while bpm < BPM_LOW:
        bpm *= 2.0
    while bpm >= BPM_HIGH:
        bpm /= 2.0
    return bpm


def looks_live(*fields: str | None) -> bool:
    """Return True when a title, artist, or comment looks like a live recording.

    Args:
        *fields: Text columns from the library row.

    Returns:
        True when any field matches :data:`LIVE_RE`.
    """
    return any(field and LIVE_RE.search(field) for field in fields)


def implied_bpms(markers: Sequence[tags.BeatMarker]) -> list[float]:
    """Implied BPM between BeatGrid markers, plus the last marker's stored BPM.

    Earlier markers store a beat count. The last marker stores BPM. Between
    two markers the tempo is ``beats / dt * 60``.

    Args:
        markers: Parsed BeatGrid markers from ``tags.read_serato_tags``.

    Returns:
        Positive implied tempos, in marker order.
    """
    bpms: list[float] = []
    for index, marker in enumerate(markers[:-1]):
        nxt = markers[index + 1]
        dt = float(nxt["position"]) - float(marker["position"])
        beats = marker.get("beats")
        if beats and dt > 0:
            bpms.append(float(beats) / dt * 60.0)
    if markers:
        stored = markers[-1].get("bpm")
        if stored and stored > 0:
            bpms.append(float(stored))
    return [bpm for bpm in bpms if bpm > 0]


def grid_spread(markers: Sequence[tags.BeatMarker]) -> float:
    """How far implied BeatGrid tempos spread.

    Args:
        markers: Parsed BeatGrid markers.

    Returns:
        ``max - min`` of :func:`implied_bpms`, or 0 when there are fewer than
        two tempos.
    """
    bpms = implied_bpms(markers)
    if len(bpms) < 2:
        return 0.0
    return max(bpms) - min(bpms)


def collect_envelope(
    chunks: Iterator[np.ndarray],
    rate: int = waveform.ANALYZE_RATE,
    hop: int = HOP,
    max_seconds: float = MAX_SECONDS,
) -> Envelope:
    """Build a hop RMS envelope from mono PCM, stopping after ``max_seconds``.

    Args:
        chunks: Mono float samples, such as ``waveform.iter_pcm``.
        rate: Sample rate of ``chunks``.
        hop: Samples per envelope hop.
        max_seconds: Decode cap.

    Returns:
        The envelope and how many samples were read.
    """
    max_samples = int(max_seconds * rate)
    pending = np.zeros(0, dtype=np.float64)
    hops: list[float] = []
    samples = 0
    for chunk in chunks:
        if samples >= max_samples:
            break
        data = np.asarray(chunk, dtype=np.float64)
        if samples + len(data) > max_samples:
            data = data[: max_samples - samples]
        samples += len(data)
        pending = np.concatenate((pending, data))
        while len(pending) >= hop:
            frame = pending[:hop]
            pending = pending[hop:]
            hops.append(float(np.sqrt(np.mean(frame * frame))))
    return Envelope(np.asarray(hops, dtype=np.float64), samples)


def _window_bpm(window: np.ndarray, hop_rate: float) -> float | None:
    """Autocorrelation BPM of one envelope window, or None when it is quiet."""
    if len(window) < 8:
        return None
    if float(np.mean(window)) < SILENCE_RMS:
        return None
    centered = window - float(np.mean(window))
    energy = float(np.dot(centered, centered))
    if energy <= 0:
        return None
    ac = np.correlate(centered, centered, mode="full")
    ac = ac[len(ac) // 2 :]
    lag_min = max(1, int(round(hop_rate * 60.0 / SEARCH_HIGH)))
    lag_max = min(len(ac) - 1, int(round(hop_rate * 60.0 / SEARCH_LOW)))
    if lag_max <= lag_min:
        return None
    region = ac[lag_min : lag_max + 1]
    peak_i = int(np.argmax(region))
    peak = float(region[peak_i])
    if peak <= 0 or peak / energy < AC_PEAK:
        return None
    if 0 < peak_i < len(region) - 1:
        left, mid, right = float(region[peak_i - 1]), peak, float(region[peak_i + 1])
        denom = left - 2.0 * mid + right
        if denom:
            peak_i = peak_i + 0.5 * (left - right) / denom
    lag = lag_min + peak_i
    if lag <= 0:
        return None
    return fold_bpm(60.0 * hop_rate / lag)


def window_bpms(
    hops: np.ndarray,
    rate: int = waveform.ANALYZE_RATE,
    hop: int = HOP,
) -> list[float]:
    """Confident window tempos from a hop RMS envelope.

    Args:
        hops: Envelope from :func:`collect_envelope`.
        rate: Sample rate of the PCM that built ``hops``.
        hop: Samples per envelope hop.

    Returns:
        Folded BPMs, one per window that passed the autocorrelation check.
    """
    hop_rate = rate / hop
    width = int(round(WINDOW_SECONDS * hop_rate))
    step = int(round(WINDOW_HOP_SECONDS * hop_rate))
    if width < 8 or step < 1 or len(hops) < width:
        return []
    found: list[float] = []
    start = 0
    while start + width <= len(hops):
        bpm = _window_bpm(hops[start : start + width], hop_rate)
        if bpm is not None:
            found.append(bpm)
        start += step
    return found


def is_drifting(bpms: Sequence[float], spread: float = DRIFT_BPM) -> bool:
    """Return True when enough windows disagree by ``spread`` BPM or more.

    Args:
        bpms: Folded window tempos.
        spread: Minimum max-min to count as drift.

    Returns:
        True when there are at least :data:`MIN_WINDOWS` tempos and they
        spread by ``spread`` or more.
    """
    if len(bpms) < MIN_WINDOWS:
        return False
    return max(bpms) - min(bpms) >= spread


def require_crate(crate_id: int | None) -> None:
    """Refuse a whole-library check from the page; ``python3 tempo_drift.py`` can run one.

    Raises:
        library.LibraryError: No crate (400).
    """
    if crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)


def _rows(database: Path, space: str, crate_id: int | None) -> list[sqlite3.Row]:
    """Read the tracks to check, in name order."""
    conn = gig_check.open_read_only(database)
    try:
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.comments, a.file_name, a.portable_id,
                   a.pending_tempo_map_analysis
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
            members = bitrate_check._crate_assets(conn, library.descendant_ids(conn, crate_id))
            rows = [row for row in rows if int(row["id"]) in members]
    finally:
        conn.close()
    return rows


def _grid_spread_at(path: Path) -> float:
    """Implied BeatGrid spread of ``path``, or 0 when tags cannot be read."""
    try:
        parsed = tags.read_serato_tags(str(path))
    except Exception:
        return 0.0
    return grid_spread(parsed.get("beatgrid") or [])


def _analyse(path: Path) -> Envelope | None:
    """Decode a cap of ``path``; None when no decoder reads any sound from it."""
    chunks = waveform.iter_pcm(path)
    try:
        found = collect_envelope(chunks)
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
        unplugged drive), ``unreadable``, ``too_quiet``, ``unchecked`` (a
        format this check does not decode), and ``mapped`` (already a
        flexible grid); and ``flags``: ``{ id, name, artist, file, reasons,
        bpm_min, bpm_max }`` in name order. ``reasons`` is a list of
        ``drifting``, ``live``, and ``pending_map``. ``file`` is the file
        name, not the path.

    Raises:
        library.LibraryError: Unknown space, a crate not in the space (404),
            or a database that cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    counts = {
        "checked": 0,
        "not_found": 0,
        "unreadable": 0,
        "too_quiet": 0,
        "unchecked": 0,
        "mapped": 0,
    }
    flags: list[dict[str, object]] = []
    for row in _rows(database, space, crate_id):
        reasons: list[str] = []
        if looks_live(row["name"], row["artist"], row["comments"]):
            reasons.append("live")
        if row["pending_tempo_map_analysis"]:
            reasons.append("pending_map")
        resolved = library.resolved_path(row["portable_id"])
        path = Path(resolved) if resolved else None
        try:
            present = path is not None and path.is_file()
        except (OSError, ValueError):
            present = False
        if path is None or not present:
            counts["not_found"] += 1
            continue
        if _grid_spread_at(path) >= GRID_SPREAD:
            counts["mapped"] += 1
            continue
        bpm_min: float | None = None
        bpm_max: float | None = None
        if path.suffix.lower() not in _DECODED:
            counts["unchecked"] += 1
            if not reasons:
                continue
        else:
            found = _analyse(path)
            if found is None:
                counts["unreadable"] += 1
                if not reasons:
                    continue
            elif not len(found.hops):
                counts["too_quiet"] += 1
                if not reasons:
                    continue
            else:
                bpms = window_bpms(found.hops)
                if len(bpms) < MIN_WINDOWS:
                    counts["too_quiet"] += 1
                    if not reasons:
                        continue
                else:
                    counts["checked"] += 1
                    bpm_min = round(min(bpms), 1)
                    bpm_max = round(max(bpms), 1)
                    if is_drifting(bpms):
                        reasons.append("drifting")
        if not reasons:
            continue
        flags.append(
            {
                "id": int(row["id"]),
                "name": str(row["name"] or ""),
                "artist": str(row["artist"] or ""),
                "file": str(row["file_name"] or path.name),
                "reasons": reasons,
                "bpm_min": bpm_min,
                "bpm_max": bpm_max,
            }
        )
    return {"crate": crate_id, **counts, "flags": flags}


def main(argv: Sequence[str] | None = None) -> int:
    """Print the report as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the report was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="Flag tracks whose tempo wanders or that look live. Read-only."
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
