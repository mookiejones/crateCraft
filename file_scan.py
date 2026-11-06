#!/usr/bin/env python3
"""Find audio files that are damaged or not what their name says (#19, part 1).

``scan`` reads the library with ``gig_check.open_read_only`` and looks at the
file behind each track. Files are opened with ``"rb"`` only and nothing is
written, so the scan is safe while Serato DJ is open.

A quick check reads the first bytes. The file must not be empty and must
start the way its extension says: an MP3 with an MPEG audio frame and an AAC
file with an ADTS frame (after any ID3 tag), FLAC with ``fLaC``, WAV with ``RIFF``/``WAVE``, AIFF with
``FORM``/``AIFF``, M4A or MP4 with ``ftyp``, and Ogg with ``OggS``. A web page
or a zip saved as ``.mp3`` is the usual failed download. Serato's own
``is_corrupt`` flag is reported too.

A full check also decodes the whole file with the waveform decoders. It
reports a file no decoder can read, a decode that fails part way, and a file
much shorter than the length the library stores, which is a cut-off download.

A track whose file is not on disk, including one on an unplugged drive, is
only counted. The Missing view and the gig check already list those.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections.abc import Sequence
from pathlib import Path

import gig_check
import library
import waveform

QUICK = "quick"
FULL = "full"
DEPTHS = (QUICK, FULL)
BAD_DEPTH = "Choose a quick or full check."
FULL_NEEDS_CRATE = "Choose a crate for a full decode check."

# Bytes read after any ID3 tag to find the audio start.
_WINDOW = 64 * 1024
# A decode is short when it is under this share of the stored length and more
# than this many seconds below it. Encoder padding stays well inside both.
_SHORT_RATIO = 0.9
_SHORT_SLACK = 5.0

# Extension -> the container its first bytes must show.
_EXPECTED = {
    ".mp3": "mpeg",
    ".aac": "adts",
    ".flac": "flac",
    ".wav": "wav",
    ".aif": "aiff",
    ".aiff": "aiff",
    ".m4a": "mp4",
    ".mp4": "mp4",
    ".alac": "mp4",
    ".ogg": "ogg",
}


def _id3_size(head: bytes) -> int:
    """Return the length of an ID3v2 tag at the start of ``head``, or 0."""
    if len(head) < 10 or head[:3] != b"ID3":
        return 0
    size = 0
    for byte in head[6:10]:
        size = (size << 7) | (byte & 0x7F)
    footer = 10 if head[5] & 0x10 else 0
    return 10 + size + footer


def _frame_kind(first: int, second: int) -> str:
    """Name the frame two bytes start: ``mpeg`` (Layer I to III), ``adts`` (AAC), or ``""``."""
    if first != 0xFF or second & 0xE0 != 0xE0:
        return ""
    version = (second >> 3) & 0x03
    layer = (second >> 1) & 0x03
    if layer == 0:
        # ADTS AAC uses the reserved layer 00 with the 12-bit sync.
        return "adts" if second & 0xF0 == 0xF0 else ""
    return "mpeg" if version != 0x01 else ""


def _container(start: bytes, after_tag: bytes) -> str:
    """Name the container the bytes show.

    Args:
        start: The first bytes of the file.
        after_tag: The bytes after any ID3 tag (the same as ``start`` without one).

    Returns:
        ``mpeg``, ``adts``, ``flac``, ``wav``, ``aiff``, ``mp4``, ``ogg``, ``html``,
        ``zip``, or ``unknown``.
    """
    if start[:4] in (b"RIFF", b"RF64", b"BW64") and start[8:12] == b"WAVE":
        return "wav"
    if start[:4] == b"FORM" and start[8:12] in (b"AIFF", b"AIFC"):
        return "aiff"
    if start[4:8] == b"ftyp":
        return "mp4"
    if start[:4] == b"OggS":
        return "ogg"
    if start[:4] == b"PK\x03\x04":
        return "zip"
    if start.lstrip()[:5].lower() in (b"<!doc", b"<html", b"<?xml"):
        return "html"
    if after_tag[:4] == b"fLaC":
        return "flac"
    for index in range(len(after_tag) - 1):
        kind = _frame_kind(after_tag[index], after_tag[index + 1])
        if kind:
            return kind
    return "unknown"


def sniff(path: Path) -> tuple[str, str]:
    """Check that a file is not empty and starts the way its extension says.

    Args:
        path: The audio file. It is opened with ``"rb"`` and never written.

    Returns:
        ``(problem, detail)``. ``problem`` is ``ok``, ``unchecked`` (an
        extension this check does not know), ``empty``, ``unreadable``, or
        ``wrong_format``; for ``wrong_format`` the detail names what the bytes
        are (``html``, ``zip``, ``flac``, ``unknown``, and so on).
    """
    expected = _EXPECTED.get(path.suffix.lower())
    if expected is None:
        return "unchecked", ""
    try:
        with open(path, "rb") as handle:
            start = handle.read(_WINDOW)
            if not start:
                return "empty", ""
            tag = _id3_size(start)
            after_tag = start
            if tag:
                # A tag with cover art can be larger than the first read.
                handle.seek(tag)
                after_tag = handle.read(_WINDOW)
    except OSError:
        return "unreadable", ""
    actual = _container(start, after_tag)
    if actual == expected:
        return "ok", ""
    return "wrong_format", actual


def decode_check(path: Path, length_ms: int | None) -> tuple[str, str]:
    """Decode the whole file and compare its length with the library's.

    Args:
        path: The audio file, read through ``waveform.iter_pcm``.
        length_ms: Length the library stores, or None to skip that comparison.

    Returns:
        ``(problem, detail)``. ``ok``; ``undecodable`` when no decoder reads
        any sound; ``decode_error`` with the whole seconds decoded before the
        failure; or ``short`` with ``decoded/expected`` whole seconds.
    """
    samples = 0
    try:
        for chunk in waveform.iter_pcm(path):
            samples += len(chunk)
    except waveform.WaveformUnavailable:
        return "undecodable", ""
    except Exception:
        if not samples:
            return "undecodable", ""
        return "decode_error", str(int(samples / waveform.ANALYZE_RATE))
    if not samples:
        return "undecodable", ""
    decoded = samples / waveform.ANALYZE_RATE
    if length_ms:
        expected = length_ms / 1000
        if decoded < expected * _SHORT_RATIO and expected - decoded > _SHORT_SLACK:
            return "short", f"{int(round(decoded))}/{int(round(expected))}"
    return "ok", ""


def require_crate_for_full(depth: str, crate_id: int | None) -> None:
    """Refuse a full decode of the whole library from the page.

    Decoding every file takes minutes, so a page request names one crate.
    ``python3 file_scan.py --depth full`` can still decode everything.

    Raises:
        library.LibraryError: ``depth`` is ``full`` and no crate is given (400).
    """
    if depth == FULL and crate_id is None:
        raise library.LibraryError(FULL_NEEDS_CRATE, 400)


def _columns(conn: sqlite3.Connection) -> set[str]:
    """Return the asset table's column names."""
    return {str(row[1]) for row in conn.execute("PRAGMA table_info(asset)")}


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
        flagged = (
            "a.is_corrupt, a.corrupt_description"
            if {"is_corrupt", "corrupt_description"} <= _columns(conn)
            else "0 AS is_corrupt, '' AS corrupt_description"
        )
        rows = conn.execute(
            f"""
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id, a.length_ms, {flagged}
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


def scan(database: Path, space: str, crate_id: int | None = None, depth: str = QUICK) -> dict[str, object]:
    """Check the files behind a space's tracks, or one crate's.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        crate_id: A crate; its subcrates are included. None checks the space.
        depth: ``quick`` reads the first bytes; ``full`` also decodes.

    Returns:
        ``depth``, ``crate``, ``checked`` (files read), ``not_found``,
        ``unchecked`` (extensions this check does not know), ``counts`` by
        problem, and ``problems``: ``{ id, name, artist, file, problem,
        detail }`` in name order, one per track. A file problem is reported
        before Serato's own corrupt flag. ``file`` is the file name, not the
        path.

    Raises:
        library.LibraryError: Bad depth (400), unknown space, a crate not in
            the space (404), or a database that cannot be opened read-only.
    """
    if depth not in DEPTHS:
        raise library.LibraryError(BAD_DEPTH, 400)
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    checked = not_found = unchecked = 0
    counts: dict[str, int] = {}
    problems: list[dict[str, object]] = []
    for row in _rows(database, space, crate_id):
        resolved = library.resolved_path(row["portable_id"])
        path = Path(resolved) if resolved else None
        try:
            present = path is not None and path.is_file()
        except (OSError, ValueError):
            present = False
        if path is None or not present:
            not_found += 1
            continue
        problem, detail = sniff(path)
        if problem == "unchecked":
            unchecked += 1
            continue
        checked += 1
        if problem == "ok" and depth == FULL:
            length = row["length_ms"]
            problem, detail = decode_check(path, int(length) if length else None)
        if problem == "ok" and row["is_corrupt"]:
            problem, detail = "serato_flagged", str(row["corrupt_description"] or "")
        if problem == "ok":
            continue
        counts[problem] = counts.get(problem, 0) + 1
        problems.append(
            {
                "id": int(row["id"]),
                "name": str(row["name"] or ""),
                "artist": str(row["artist"] or ""),
                "file": str(row["file_name"] or path.name),
                "problem": problem,
                "detail": detail,
            }
        )
    return {
        "depth": depth,
        "crate": crate_id,
        "checked": checked,
        "not_found": not_found,
        "unchecked": unchecked,
        "counts": counts,
        "problems": problems,
    }


def main(argv: Sequence[str] | None = None) -> int:
    """Print the report as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the report was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="Find damaged audio files. Read-only.")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--crate", type=int, default=None)
    parser.add_argument("--depth", choices=DEPTHS, default=QUICK)
    args = parser.parse_args(argv)
    try:
        result = scan(args.database, args.space, args.crate, args.depth)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
