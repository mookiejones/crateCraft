#!/usr/bin/env python3
"""Play history analytics: most played, and not played in a while (#33, part 1).

Serato's Plays column is all-time. ``stats`` reads ``history_entry`` with
``gig_check.open_read_only`` and answers for a period instead: the most played
tracks and artists, the number of plays and sessions, and the tracks in a
space that have not been played since a cutoff. Only entries marked
``played`` count. Times are Unix seconds, like ``history_entry.start_time``.

A play is matched to its library track by ``asset_id``. A play whose track
was later removed has no ``asset_id``; it is grouped by its own title and
artist, ignoring case, and keeps the name it was played under. Artists are
grouped the same way and shown with the spelling used most.

Nothing is written. Making the not-played list into a crate, CSV export, and
the page view are later changes.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import time
from collections.abc import Sequence
from pathlib import Path

import gig_check
import library

DAY = 86_400
TOP = 25
TOP_MAX = 500
IDLE_DAYS = 365
IDLE_DAYS_MAX = 3650
TIME_MAX = 2**62
INVALID = "That request is not valid."


def number(raw: str | None, default: int | None, low: int, high: int) -> int | None:
    """Parse a whole-number query value.

    Args:
        raw: The query value, or None or empty for ``default``.
        default: Value when ``raw`` is missing.
        low: Smallest allowed value.
        high: Largest allowed value.

    Returns:
        The number, or ``default``.

    Raises:
        library.LibraryError: Not ASCII digits, or out of range (400).
    """
    if raw is None or raw == "":
        return default
    if not raw.isascii() or not raw.isdigit() or len(raw) > 20:
        raise library.LibraryError(INVALID, 400)
    value = int(raw, 10)
    if value < low or value > high:
        raise library.LibraryError(INVALID, 400)
    return value


def _key(text: object) -> str:
    """Return the grouping key for a title or an artist."""
    return str(text or "").strip().casefold()


def _plays(conn: sqlite3.Connection, start: int | None, end: int | None) -> list[sqlite3.Row]:
    """Read the played entries that start inside [start, end)."""
    clauses = ["e.played"]
    values: list[int] = []
    if start is not None:
        clauses.append("e.start_time >= ?")
        values.append(start)
    if end is not None:
        clauses.append("e.start_time < ?")
        values.append(end)
    return conn.execute(
        f"""
        SELECT e.session_id, e.asset_id, e.name, e.artist, e.start_time
        FROM history_entry e
        WHERE {" AND ".join(clauses)}
        ORDER BY e.start_time, e.id
        """,
        values,
    ).fetchall()


def _top_tracks(rows: list[sqlite3.Row], top: int) -> list[dict[str, object]]:
    """Group plays by track; most plays first, a tie to the latest play."""
    tracks: dict[tuple[object, ...], dict[str, object]] = {}
    for row in rows:
        asset = row["asset_id"]
        key: tuple[object, ...] = ("id", int(asset)) if asset is not None else ("name", _key(row["name"]), _key(row["artist"]))
        entry = tracks.setdefault(key, {"asset_id": int(asset) if asset is not None else None, "plays": 0})
        entry["plays"] = int(str(entry["plays"])) + 1
        # Rows are in time order, so the last one seen is the latest play.
        entry["name"] = str(row["name"] or "")
        entry["artist"] = str(row["artist"] or "")
        entry["last_played"] = row["start_time"]
    ranked = sorted(tracks.values(), key=lambda item: (-int(str(item["plays"])), -int(str(item["last_played"] or 0))))
    return ranked[:top]


def _top_artists(rows: list[sqlite3.Row], top: int) -> list[dict[str, object]]:
    """Group plays by artist; most plays first, a tie to the latest play."""
    artists: dict[str, dict[str, object]] = {}
    spellings: dict[str, dict[str, int]] = {}
    titles: dict[str, set[tuple[object, ...]]] = {}
    for row in rows:
        key = _key(row["artist"])
        if not key:
            continue
        spelling = str(row["artist"]).strip()
        counts = spellings.setdefault(key, {})
        counts[spelling] = counts.get(spelling, 0) + 1
        asset = row["asset_id"]
        titles.setdefault(key, set()).add(("id", int(asset)) if asset is not None else ("name", _key(row["name"])))
        entry = artists.setdefault(key, {"plays": 0})
        entry["plays"] = int(str(entry["plays"])) + 1
        entry["last_played"] = row["start_time"]
    for key, entry in artists.items():
        entry["artist"] = sorted(spellings[key].items(), key=lambda item: (-item[1], item[0]))[0][0]
        entry["tracks"] = len(titles[key])
    ranked = sorted(artists.values(), key=lambda item: (-int(str(item["plays"])), -int(str(item["last_played"] or 0))))
    return [{"artist": item["artist"], "plays": item["plays"], "tracks": item["tracks"], "last_played": item["last_played"]} for item in ranked[:top]]


def _not_played(conn: sqlite3.Connection, space: str, cutoff: int) -> list[dict[str, object]]:
    """Tracks in a space added before ``cutoff`` with no play since then.

    A track with no stored date added counts as old. Never-played tracks come
    first by name, then the rest from the longest ago.
    """
    rows = conn.execute(
        """
        SELECT a.id, a.name, a.artist, a.time_added, a.dj_play_count,
               (SELECT MAX(e.start_time) FROM history_entry e WHERE e.asset_id = a.id AND e.played) AS last_played
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        """,
        (space,),
    ).fetchall()
    idle: list[dict[str, object]] = []
    for row in rows:
        added = row["time_added"]
        last = row["last_played"]
        if added is not None and int(added) > cutoff:
            continue
        if last is not None and int(last) >= cutoff:
            continue
        idle.append(
            {
                "id": int(row["id"]),
                "name": str(row["name"] or ""),
                "artist": str(row["artist"] or ""),
                "added": added,
                "last_played": last,
                "play_count": int(row["dj_play_count"] or 0),
            }
        )
    # A track never played sorts as 0, ahead of every real time.
    idle.sort(key=lambda item: (int(str(item["last_played"] or 0)), str(item["name"]).casefold(), int(str(item["id"]))))
    return idle


def stats(
    database: Path,
    space: str,
    *,
    start: int | None = None,
    end: int | None = None,
    top: int = TOP,
    idle_days: int = IDLE_DAYS,
    now: float | None = None,
) -> dict[str, object]:
    """Summarise play history for a period.

    Args:
        database: ``master.sqlite``.
        space: Space whose tracks are checked for ``not_played``. History
            itself is not split by space.
        start: First second to count, or None for all history.
        end: Second after the last one to count, or None for now.
        top: How many tracks and artists to list, 1 to 500.
        idle_days: A track not played for this many days is listed, 1 to 3650.
        now: The current time, for tests. Defaults to ``time.time()``.

    Returns:
        ``from``, ``to``, ``plays``, ``sessions``, ``top_tracks`` (``asset_id``,
        ``name``, ``artist``, ``plays``, ``last_played``), ``top_artists``
        (``artist``, ``plays``, ``tracks``, ``last_played``), ``idle_days``,
        ``not_played`` (``id``, ``name``, ``artist``, ``added``,
        ``last_played``, ``play_count``), and ``not_played_count``.

    Raises:
        library.LibraryError: A value out of range or an empty period (400),
            an unknown space, or a database that cannot be opened read-only.
    """
    if not 1 <= top <= TOP_MAX or not 1 <= idle_days <= IDLE_DAYS_MAX:
        raise library.LibraryError(INVALID, 400)
    if start is not None and end is not None and start >= end:
        raise library.LibraryError(INVALID, 400)
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    moment = int(now if now is not None else time.time())
    conn = gig_check.open_read_only(database)
    try:
        rows = _plays(conn, start, end)
        idle = _not_played(conn, space, moment - idle_days * DAY)
    finally:
        conn.close()
    return {
        "from": start,
        "to": end,
        "plays": len(rows),
        "sessions": len({row["session_id"] for row in rows}),
        "top_tracks": _top_tracks(rows, top),
        "top_artists": _top_artists(rows, top),
        "idle_days": idle_days,
        "not_played": idle,
        "not_played_count": len(idle),
    }


def main(argv: Sequence[str] | None = None) -> int:
    """Print the summary as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the summary was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(description="Most played tracks and tracks not played in a while. Read-only.")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--from", dest="start", type=int, default=None, help="Unix seconds")
    parser.add_argument("--to", dest="end", type=int, default=None, help="Unix seconds")
    parser.add_argument("--top", type=int, default=TOP)
    parser.add_argument("--idle-days", type=int, default=IDLE_DAYS)
    args = parser.parse_args(argv)
    try:
        result = stats(args.database, args.space, start=args.start, end=args.end, top=args.top, idle_days=args.idle_days)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
