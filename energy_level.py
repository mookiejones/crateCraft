#!/usr/bin/env python3
"""Score a track's energy from 1 to 10 and store it in Grouping (#74).

Serato has no energy column. A smart crate can match Grouping, so a blank
grouping becomes ``Energy N`` (N is 1–10). An existing grouping, including
one that already says ``Energy N``, is left alone. The number comes from an
ID3 ``TXXX`` or a Vorbis comment named ``EnergyLevel`` or ``Energy`` when
that tag is 1–10. Otherwise the first 15 seconds of mono audio are scored.
Audio files are not rewritten.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import time
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path
from typing import BinaryIO, cast

import numpy as np

import gig_check
import library
import tags
import waveform

NEEDS_CRATE = "Choose a crate for an energy check."
WINDOW_SECONDS = 15
_LOUD_RMS = 0.25
_ENERGY_NAMES = frozenset({"energylevel", "energy"})
_ENERGY_TEXT = re.compile(r"^(?:energy\s+)?(10|[1-9])$", re.IGNORECASE)
_HEAD_READ = 2_000_000

Plan = dict[str, object]


def level_from(loud: float, bright: float) -> int:
    """Fold loudness and brightness into an energy from 1 to 10.

    Args:
        loud: RMS scaled so 0.25 is full, already clamped to 0–1.
        bright: Spectral centroid divided by the Nyquist frequency, 0–1.

    Returns:
        ``round(1 + (0.65 * loud + 0.35 * bright) * 9)``, clamped to 1–10.
    """
    mixed = 0.65 * loud + 0.35 * bright
    level = int(round(1 + mixed * 9))
    return max(1, min(10, level))


def score_pcm(samples: np.ndarray | Sequence[float], sample_rate: int) -> int:
    """Score mono samples as energy 1–10.

    Loudness is RMS divided by 0.25, clamped to 1. Brightness is the
    spectral centroid divided by the Nyquist frequency. Near silence is 1.
    Only the first 15 seconds are used.

    Args:
        samples: Mono float samples.
        sample_rate: Sample rate of ``samples``.

    Returns:
        An integer from 1 to 10.
    """
    data = np.asarray(samples, dtype=np.float64)
    if sample_rate <= 0 or data.size == 0:
        return 1
    cap = sample_rate * WINDOW_SECONDS
    if data.size > cap:
        data = data[:cap]
    rms = float(np.sqrt(np.mean(data * data)))
    loud = min(1.0, rms / _LOUD_RMS)
    return level_from(loud, _brightness(data, sample_rate))


def parse_energy_text(text: str) -> int | None:
    """Read a 1–10 energy from a tag value.

    Args:
        text: Stored text. ``7`` and ``Energy 7`` are accepted. Other
            words, 0, and 11 are not.

    Returns:
        The level, or None.
    """
    match = _ENERGY_TEXT.fullmatch(text.strip())
    if match is None:
        return None
    return int(match.group(1))


def token_for(level: int) -> str:
    """Return the Grouping text for one level.

    Args:
        level: Integer from 1 to 10.

    Returns:
        ``Energy N``.
    """
    return f"Energy {level}"


def require_crate(crate_id: int | None) -> None:
    """Refuse a check that is not limited to one crate.

    Raises:
        library.LibraryError: No crate (400).
    """
    if crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)


def read_stored_energy(path: Path) -> int | None:
    """Read a 1–10 energy tag without rewriting the file.

    ID3 ``TXXX`` frames named ``EnergyLevel`` or ``Energy`` are read first.
    ``EnergyLevel`` wins when both are present. A FLAC Vorbis comment with
    the same names fills the gap. Encoding 0 (Latin-1) and 3 (UTF-8) are
    read, and so are UTF-16. A value outside 1–10 is ignored.

    Args:
        path: Audio file, or a file that only carries the tag.

    Returns:
        The level, or None when the file has no usable tag.
    """
    try:
        if not path.is_file():
            return None
        size = path.stat().st_size
        with path.open("rb") as handle:
            head = handle.read(min(size, _HEAD_READ))
            found = _pick(_id3_pairs(head))
            if found is not None:
                return found
            if head.startswith(b"fLaC"):
                return _flac_energy(handle, size)
    except OSError:
        return None
    return None


def plan(database: Path, space: str, crate_id: int | None) -> Plan:
    """List blank-grouping tracks in one crate that can take ``Energy N``.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        crate_id: Crate id. The crate and its subcrates are included.

    Returns:
        ``checked`` (tracks in the crate), ``unreadable`` (of the blank
        ones, how many had no tag and no audio), and ``fixes``. Each fix
        has ``asset_id``, ``path``, ``grouping``, ``energy``, ``source``
        (``tag`` or ``audio``), and ``proposed`` (``Energy N``).

    Raises:
        library.LibraryError: The crate is missing, the space is unknown,
            or the database cannot be opened read-only.
    """
    require_crate(crate_id)
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    assert crate_id is not None
    rows = _rows(database, space, crate_id)
    fixes: list[dict[str, object]] = []
    unreadable = 0
    for asset_id, grouping, portable_id in rows:
        if grouping.strip():
            continue
        stored = portable_id.strip()
        resolved = library.resolved_path(stored) if stored else None
        file = _existing_file(resolved)
        if file is None:
            unreadable += 1
            continue
        level, source = _level_for(file)
        if level is None or source is None:
            unreadable += 1
            continue
        fixes.append(
            {
                "asset_id": asset_id,
                "path": str(file),
                "grouping": grouping,
                "energy": level,
                "source": source,
                "proposed": token_for(level),
            }
        )
    return {"checked": len(rows), "unreadable": unreadable, "fixes": fixes}


def preview(database: Path, space: str, crate_id: int | None, ids: list[int] | None = None) -> Plan:
    """Return the plan without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Crate id.
        ids: Asset ids to keep, or None for every proposed fix.

    Returns:
        Plan JSON with ``written`` false and ``preview`` true.

    Raises:
        library.LibraryError: The crate or space is refused.
    """
    result = plan(database, space, crate_id)
    result["fixes"] = _filter_ids(result["fixes"], ids)  # type: ignore[arg-type]
    result["written"] = False
    result["preview"] = True
    return result


def apply(space: str, crate_id: int | None, ids: list[int] | None = None) -> Plan:
    """Write ``Energy N`` into still-blank grouping through ``safe_write``.

    Args:
        space: Space name.
        crate_id: Crate id.
        ids: Asset ids to write, or None for every proposed fix. An empty
            list writes nothing.

    Returns:
        Plan JSON. ``written`` is false when nothing still needs a fill.

    Raises:
        library.LibraryError: The crate or space is refused.
        library.SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    require_crate(crate_id)
    database = Path(library.MASTER)
    if ids is not None and not ids:
        result = plan(database, space, crate_id)
        result["fixes"] = []
        result["written"] = False
        return result
    planned = plan(database, space, crate_id)
    selected = _filter_ids(planned["fixes"], ids)  # type: ignore[arg-type]
    if not selected:
        planned["fixes"] = selected
        planned["written"] = False
        return planned

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> Plan:
        """Rewrite still-blank grouping, then register the check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict. ``written`` is false when the live plan is empty.
        """
        assert crate_id is not None
        live_rows = _rows_on(conn, space, crate_id)
        full = _fixes_for(live_rows)
        unreadable = _unreadable_count(live_rows, full)
        live = _filter_ids(full, ids)
        checked = len(live_rows)
        if not live:
            return {
                "checked": checked,
                "unreadable": unreadable,
                "fixes": [],
                "written": False,
            }
        write.set_target("energy")
        now = int(time.time())
        expected: dict[int, str] = {}
        for item in live:
            proposed = str(item["proposed"])
            library._assign(  # pyright: ignore[reportPrivateUsage]
                conn,
                "asset",
                {"grouping": proposed, "time_modified": now},
                "id = ?",
                item["asset_id"],
            )
            expected[_asset_id(item)] = proposed

        def check(
            copied: sqlite3.Connection,
            expected: dict[int, str] = expected,
        ) -> None:
            """Fail when a rewritten row does not hold ``Energy N``.

            Args:
                copied: Read-only connection to the temporary database copy.
                expected: Asset id to grouping text.

            Raises:
                VerifyMismatch: If a row is missing or different.
            """
            if not expected:
                return
            asset_ids = tuple(expected)
            placeholders = ",".join("?" * len(asset_ids))
            sql = f"SELECT id, grouping FROM asset WHERE id IN ({placeholders})"
            found = copied.execute(sql, asset_ids).fetchall()
            got = {int(row[0]): row[1] for row in found}
            for asset_id, proposed in expected.items():
                if got.get(asset_id) != proposed:
                    raise safe_write.VerifyMismatch("The track fields do not match.")

        write.check(check)
        return {
            "checked": checked,
            "unreadable": unreadable,
            "fixes": live,
            "written": True,
        }

    result = safe_write.run("energy", "energy", run)
    if result.get("written"):
        with closing(library.read_conn()) as master:
            for item in cast(list[dict[str, object]], result["fixes"]):
                library._mirror_asset(  # pyright: ignore[reportPrivateUsage]
                    master, _asset_id(item), {"grouping": item["proposed"]}
                )
    return result


def action(payload: Mapping[str, object]) -> Plan:
    """Run one ``POST /api/energy`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. Takes ``space``
            and ``crate``. Optional ``ids`` is a list of asset ids.
            Missing or null ids means every proposed fix. An empty list
            writes nothing.

    Returns:
        That action's result.

    Raises:
        library.LibraryError: If the action, crate, or ids are invalid.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    crate_id = _payload_crate(payload.get("crate"))
    ids = _parse_ids(payload.get("ids"))
    database = Path(library.MASTER)
    if kind == "preview":
        return preview(database, space, crate_id, ids)
    if kind == "apply":
        return apply(space, crate_id, ids)
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the plan as JSON. ``--apply`` writes blank grouping.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the plan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="Score energy into a blank Grouping field. Read-only unless --apply."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--crate", type=int, default=None)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args(argv)
    try:
        require_crate(args.crate)
        if args.apply:
            master = Path(library.MASTER).resolve()
            if args.database.resolve() != master:
                print("Apply uses the open library.", file=sys.stderr)
                return 1
            result = apply(args.space, args.crate)
        else:
            result = plan(args.database, args.space, args.crate)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


def _brightness(data: np.ndarray, sample_rate: int) -> float:
    """Return the spectral centroid as a fraction of the Nyquist frequency.

    Args:
        data: Mono float samples.
        sample_rate: Sample rate of ``data``.

    Returns:
        A value from 0 to 1. Silence is 0.
    """
    spectrum = np.abs(np.fft.rfft(data))
    total = float(spectrum.sum())
    if total <= 0 or sample_rate <= 0:
        return 0.0
    freqs = np.fft.rfftfreq(data.size, d=1.0 / sample_rate)
    centroid = float(np.sum(freqs * spectrum) / total)
    nyquist = sample_rate / 2
    if nyquist <= 0:
        return 0.0
    return max(0.0, min(1.0, centroid / nyquist))


def _existing_file(resolved: str | None) -> Path | None:
    """Return the path when it is a file.

    Args:
        resolved: Path from ``library.resolved_path``.

    Returns:
        The file, or None when it is missing or the path is not usable.
    """
    if not resolved:
        return None
    try:
        file = Path(resolved)
        if file.is_file():
            return file
    except (OSError, ValueError):
        return None
    return None


def _level_for(path: Path) -> tuple[int | None, str | None]:
    """Prefer a stored tag, then a short PCM score.

    Args:
        path: File to read.

    Returns:
        ``(level, source)``. Source is ``tag`` or ``audio``. Both are None
        when the file cannot be scored.
    """
    tagged = read_stored_energy(path)
    if tagged is not None:
        return tagged, "tag"
    try:
        samples = _window(path)
    except (waveform.WaveformUnavailable, OSError, ValueError):
        return None, None
    except Exception:
        return None, None
    return score_pcm(samples, waveform.ANALYZE_RATE), "audio"


def _window(path: Path) -> np.ndarray:
    """Read at most 15 seconds of mono audio.

    Args:
        path: Audio file.

    Returns:
        Mono float samples at ``waveform.ANALYZE_RATE``.

    Raises:
        waveform.WaveformUnavailable: No decoder produced samples.
    """
    need = WINDOW_SECONDS * waveform.ANALYZE_RATE
    parts: list[np.ndarray] = []
    got = 0
    for chunk in waveform.iter_pcm(path):
        block = np.asarray(chunk, dtype=np.float64)
        parts.append(block)
        got += int(block.size)
        if got >= need:
            break
    if not parts:
        raise waveform.WaveformUnavailable()
    return np.concatenate(parts)[:need]


def _pick(pairs: Sequence[tuple[str, str]]) -> int | None:
    """Choose EnergyLevel over Energy, first valid value of each name.

    Args:
        pairs: Description and value.

    Returns:
        A level from 1 to 10, or None.
    """
    ranked: list[tuple[int, int]] = []
    seen: set[str] = set()
    for desc, value in pairs:
        key = desc.strip().lower()
        if key not in _ENERGY_NAMES or key in seen:
            continue
        level = parse_energy_text(value)
        if level is None:
            continue
        seen.add(key)
        ranked.append((0 if key == "energylevel" else 1, level))
    if not ranked:
        return None
    ranked.sort(key=lambda item: item[0])
    return ranked[0][1]


def _id3_pairs(blob: bytes) -> list[tuple[str, str]]:
    """Read ``TXXX`` description and value pairs from ID3 tags in a buffer.

    Args:
        blob: Leading file bytes.

    Returns:
        Pairs in file order.
    """
    found: list[tuple[str, str]] = []
    cursor = 0
    while cursor < len(blob) - 10:
        offset = blob.find(b"ID3", cursor)
        if offset < 0:
            break
        cursor = offset + 3
        version = blob[offset + 3] if offset + 3 < len(blob) else 0
        if version not in (3, 4) or offset + 10 > len(blob):
            continue
        end = min(len(blob), offset + 10 + tags._synchsafe(blob[offset + 6:offset + 10]))  # pyright: ignore[reportPrivateUsage]
        pos = offset + 10
        while pos + 10 <= end:
            frame_id = blob[pos:pos + 4]
            if not frame_id or frame_id[0] == 0:
                break
            if version == 4:
                frame_size = tags._synchsafe(blob[pos + 4:pos + 8])  # pyright: ignore[reportPrivateUsage]
            else:
                frame_size = int.from_bytes(blob[pos + 4:pos + 8], "big")
            body = blob[pos + 10:pos + 10 + frame_size]
            pos += 10 + frame_size
            if frame_id != b"TXXX" or len(body) < 2:
                continue
            desc, rest = tags._split_text(body[0], body[1:])  # pyright: ignore[reportPrivateUsage]
            value, _unused = tags._split_text(body[0], rest)  # pyright: ignore[reportPrivateUsage]
            found.append((desc, value))
    return found


def _flac_energy(handle: BinaryIO, size: int) -> int | None:
    """Read an energy comment from a FLAC Vorbis block.

    Args:
        handle: Open binary file.
        size: File size in bytes.

    Returns:
        The level, or None.
    """
    handle.seek(0)
    if size < 8 or handle.read(4) != b"fLaC":
        return None
    pos = 4
    pairs: list[tuple[str, str]] = []
    for _ in range(tags.FLAC_BLOCK_LIMIT):
        if pos + 4 > size:
            break
        handle.seek(pos)
        header = handle.read(4)
        if len(header) < 4:
            break
        length = int.from_bytes(header[1:4], "big")
        if length > size - pos - 4:
            break
        if header[0] & 0x7F == 4:
            for key, value in tags._comment_pairs(handle.read(length)):  # pyright: ignore[reportPrivateUsage]
                pairs.append((key, value.decode("utf-8", "replace")))
        if header[0] & 0x80:
            break
        pos += 4 + length
    return _pick(pairs)


def _text(value: object) -> str:
    """Return a string, or an empty one."""
    return value if isinstance(value, str) else ""


def _asset_id(item: Mapping[str, object]) -> int:
    """Return the asset id stored on one fix row.

    Args:
        item: One proposed fix.

    Returns:
        The integer ``asset_id``.
    """
    return int(cast(int, item["asset_id"]))


def _crate_assets(conn: sqlite3.Connection, crate_ids: list[int]) -> set[int]:
    """Return the asset ids in these crates.

    A live Serato library links ``container_asset`` through
    ``location_container``. The test schema also stores ``container_id``
    on the membership row. Both are read.

    Args:
        conn: Open library connection.
        crate_ids: Crate ids, including subcrates.

    Returns:
        Asset ids. Empty when ``crate_ids`` is empty.
    """
    if not crate_ids:
        return set()
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


def _rows(database: Path, space: str, crate_id: int) -> list[tuple[int, str, str]]:
    """Read crate members as ``(id, grouping, portable_id)``.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        crate_id: Crate id.

    Returns:
        Rows in asset id order.

    Raises:
        library.LibraryError: The crate is not in the space, or the
            database cannot be opened.
    """
    conn = gig_check.open_read_only(database)
    try:
        return _rows_on(conn, space, crate_id)
    finally:
        conn.close()


def _rows_on(conn: sqlite3.Connection, space: str, crate_id: int) -> list[tuple[int, str, str]]:
    """Read crate members from an open connection.

    Args:
        conn: Open library connection with named columns.
        space: Space name.
        crate_id: Crate id.

    Returns:
        ``(id, grouping, portable_id)`` in asset id order.

    Raises:
        library.LibraryError: The crate is not in the space.
    """
    library.container_in_space(conn, crate_id, space)
    members = _crate_assets(conn, library.descendant_ids(conn, crate_id))
    rows = conn.execute(
        """
        SELECT a.id, a.grouping, a.portable_id
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        ORDER BY a.id
        """,
        (space,),
    ).fetchall()
    return [
        (int(row["id"]), _text(row["grouping"]), _text(row["portable_id"]))
        for row in rows
        if int(row["id"]) in members
    ]


def _fixes_for(rows: Sequence[tuple[int, str, str]]) -> list[dict[str, object]]:
    """Build fixes for blank grouping rows.

    Args:
        rows: ``(id, grouping, portable_id)``.

    Returns:
        Proposed fixes. Unreadable rows are omitted.
    """
    fixes: list[dict[str, object]] = []
    for asset_id, grouping, portable_id in rows:
        if grouping.strip():
            continue
        stored = portable_id.strip()
        resolved = library.resolved_path(stored) if stored else None
        file = _existing_file(resolved)
        if file is None:
            continue
        level, source = _level_for(file)
        if level is None or source is None:
            continue
        fixes.append(
            {
                "asset_id": asset_id,
                "path": str(file),
                "grouping": grouping,
                "energy": level,
                "source": source,
                "proposed": token_for(level),
            }
        )
    return fixes


def _unreadable_count(rows: Sequence[tuple[int, str, str]], fixes: Sequence[Mapping[str, object]]) -> int:
    """Count blank-grouping rows that did not become a fix.

    Args:
        rows: Crate members.
        fixes: Rows that will be written.

    Returns:
        How many blank rows were skipped as unreadable.
    """
    written = {_asset_id(item) for item in fixes}
    count = 0
    for asset_id, grouping, _portable in rows:
        if grouping.strip():
            continue
        if asset_id not in written:
            count += 1
    return count


def _parse_ids(raw: object) -> list[int] | None:
    """Return unique asset ids, or None when the request names every fix.

    Args:
        raw: Request ``ids``. Missing or null means every proposed fix.
            An empty list means write nothing.

    Returns:
        Deduplicated ids in first-seen order, or None for every fix.

    Raises:
        library.LibraryError: The value is present and is not a list of
            whole numbers (400).
    """
    if raw is None:
        return None
    if not isinstance(raw, list):
        raise library.LibraryError("That request is not valid.", 400)
    unique: list[int] = []
    seen: set[int] = set()
    for item in cast(list[object], raw):
        if isinstance(item, bool) or not isinstance(item, int):
            raise library.LibraryError("That request is not valid.", 400)
        if item in seen:
            continue
        seen.add(item)
        unique.append(item)
    return unique


def _filter_ids(
    fixes: Sequence[Mapping[str, object]], ids: list[int] | None
) -> list[dict[str, object]]:
    """Keep proposed fixes whose asset id is requested.

    Args:
        fixes: Plan rows.
        ids: Requested asset ids, or None for every row.

    Returns:
        Matching rows, order preserved.
    """
    rows = [item for item in fixes if isinstance(item, dict)]
    if ids is None:
        return [dict(item) for item in rows]
    wanted = set(ids)
    return [dict(item) for item in rows if _asset_id(item) in wanted]


def _payload_crate(value: object) -> int | None:
    """Return a crate id from a JSON body, or None for the whole space.

    Args:
        value: Request ``crate``.

    Returns:
        The id, or None for a missing, empty, or ``all`` value.

    Raises:
        library.LibraryError: The value is present and is not a positive
            int (400).
    """
    if value is None or value == "" or value == "all":
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise library.LibraryError("That request is not valid.", 400)
    return value


if __name__ == "__main__":
    raise SystemExit(main())
