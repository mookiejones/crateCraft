#!/usr/bin/env python3
"""One-button tonight crates: newest adds, most played, and by decade (#429).

Builds a labelled folder tree under ``_crateCraft generated`` / ``Tonight``
through one ``safe_write`` session. Preview is read-only. Create writes only
while Serato is quit. A re-run deletes only the ``Tonight`` crate under that
generated folder (and its children), never a crate the DJ made elsewhere.
Empty groups are skipped. An empty plan does not write.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from collections import defaultdict
from collections.abc import Mapping, Sequence
from pathlib import Path

import gig_check
import history_stats
import library
from library import LibraryError

GENERATED_FOLDER = "_crateCraft generated"
TONIGHT_FOLDER = "Tonight"
NEWEST_NAME = "Newest adds"
PLAYED_NAME = "Most played"
NEWEST_LIMIT = 50
PLAYED_LIMIT = 50
LIMIT_MAX = 500
YEAR_PREFIX = re.compile(r"^(\d{4})")
INVALID = "That request is not valid."
EMPTY_PLAN = "No tracks fit tonight crates."


def _limit(raw: object, default: int) -> int:
    """Parse a positive whole-number limit.

    Args:
        raw: JSON or query value, or None for ``default``.
        default: Value when ``raw`` is missing.

    Returns:
        The limit, 1 to ``LIMIT_MAX``.

    Raises:
        LibraryError: Not an int, or out of range (400).
    """
    if raw is None:
        return default
    if isinstance(raw, bool) or not isinstance(raw, int):
        raise LibraryError(INVALID, 400)
    if not 1 <= raw <= LIMIT_MAX:
        raise LibraryError(INVALID, 400)
    return raw


def _decade_label(year_text: object) -> str | None:
    """Return a decade label like ``2010s`` from a stored year field.

    Args:
        year_text: Asset ``year`` value. Often ``2020`` or ``2020-05-01``.

    Returns:
        The decade string, or None when the year cannot be read.
    """
    if year_text is None:
        return None
    text = str(year_text).strip()
    if not text:
        return None
    match = YEAR_PREFIX.match(text)
    if match is None:
        return None
    year = int(match.group(1))
    if year < 1000:
        return None
    decade = (year // 10) * 10
    return f"{decade}s"


def _space_tracks(conn: sqlite3.Connection, space: str) -> list[sqlite3.Row]:
    """Read every track in a space with the fields tonight crates need."""
    return conn.execute(
        """
        SELECT a.id, a.name, a.artist, a.time_added, a.year, a.dj_play_count
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        """,
        (space,),
    ).fetchall()


def _newest(rows: Sequence[sqlite3.Row], limit: int) -> list[dict[str, object]]:
    """Tracks with the latest ``time_added``, newest first."""
    ranked = sorted(
        rows,
        key=lambda row: (
            -int(row["time_added"] or 0),
            -int(row["id"]),
        ),
    )
    out: list[dict[str, object]] = []
    for row in ranked[:limit]:
        out.append(
            {
                "id": int(row["id"]),
                "name": str(row["name"] or ""),
                "artist": str(row["artist"] or ""),
                "added": row["time_added"],
            }
        )
    return out


def _most_played(
    conn: sqlite3.Connection,
    space_ids: set[int],
    limit: int,
) -> list[dict[str, object]]:
    """Most-played library tracks that still sit in the space."""
    plays = history_stats._plays(conn, None, None)
    ranked = history_stats._top_tracks(plays, LIMIT_MAX)
    out: list[dict[str, object]] = []
    for item in ranked:
        asset_id = item.get("asset_id")
        if not isinstance(asset_id, int) or asset_id not in space_ids:
            continue
        out.append(
            {
                "id": asset_id,
                "name": str(item.get("name") or ""),
                "artist": str(item.get("artist") or ""),
                "plays": int(str(item.get("plays") or 0)),
                "last_played": item.get("last_played"),
            }
        )
        if len(out) >= limit:
            break
    return out


def _by_decade(rows: Sequence[sqlite3.Row]) -> list[dict[str, object]]:
    """Group tracks by decade from the year field. Newest decade first."""
    groups: dict[str, list[dict[str, object]]] = defaultdict(list)
    for row in rows:
        label = _decade_label(row["year"])
        if label is None:
            continue
        groups[label].append(
            {
                "id": int(row["id"]),
                "name": str(row["name"] or ""),
                "artist": str(row["artist"] or ""),
                "year": str(row["year"] or ""),
            }
        )
    decades: list[dict[str, object]] = []
    for label in sorted(groups.keys(), key=lambda name: -int(name[:-1])):
        tracks = groups[label]
        tracks.sort(key=lambda item: (str(item["name"]).casefold(), int(str(item["id"]))))
        decades.append({"name": label, "count": len(tracks), "tracks": tracks})
    return decades


def _children_from_rows(
    conn: sqlite3.Connection,
    rows: Sequence[sqlite3.Row],
    *,
    newest: int,
    played: int,
) -> list[dict[str, object]]:
    """Build the tonight child list from space tracks and play history."""
    space_ids = {int(row["id"]) for row in rows}
    children: list[dict[str, object]] = []
    newest_tracks = _newest(rows, newest)
    if newest_tracks:
        children.append(
            {
                "kind": "newest",
                "name": NEWEST_NAME,
                "count": len(newest_tracks),
                "ids": [int(str(track["id"])) for track in newest_tracks],
                "tracks": newest_tracks,
            }
        )
    played_tracks = _most_played(conn, space_ids, played)
    if played_tracks:
        children.append(
            {
                "kind": "played",
                "name": PLAYED_NAME,
                "count": len(played_tracks),
                "ids": [int(str(track["id"])) for track in played_tracks],
                "tracks": played_tracks,
            }
        )
    for decade in _by_decade(rows):
        tracks = decade["tracks"]
        if not isinstance(tracks, list) or not tracks:
            continue
        children.append(
            {
                "kind": "decade",
                "name": str(decade["name"]),
                "count": int(str(decade["count"])),
                "ids": [int(str(track["id"])) for track in tracks if isinstance(track, Mapping)],
                "tracks": tracks,
            }
        )
    return children


def plan(
    database: Path,
    space: str,
    *,
    newest: int = NEWEST_LIMIT,
    played: int = PLAYED_LIMIT,
) -> dict[str, object]:
    """Describe the tonight crates without writing.

    Args:
        database: ``master.sqlite``.
        space: Space whose tracks are used.
        newest: How many newest-adds tracks to keep.
        played: How many most-played tracks to keep.

    Returns:
        ``folder``, ``tonight``, ``newest``, ``played``, and ``children``
        with ``kind``, ``name``, ``count``, and a ``tracks`` sample. Also
        ``existing`` when a Tonight crate already sits under the generated
        folder.

    Raises:
        LibraryError: Unknown space, bad limits, or a database that cannot
            be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    newest_n = _limit(newest, NEWEST_LIMIT)
    played_n = _limit(played, PLAYED_LIMIT)
    conn = gig_check.open_read_only(database)
    try:
        rows = _space_tracks(conn, space)
        children = _children_from_rows(conn, rows, newest=newest_n, played=played_n)
        existing = _existing_tonight(conn, space)
    finally:
        conn.close()
    return {
        "folder": GENERATED_FOLDER,
        "tonight": TONIGHT_FOLDER,
        "newest": newest_n,
        "played": played_n,
        "children": [
            {
                "kind": child["kind"],
                "name": child["name"],
                "count": child["count"],
                "tracks": child["tracks"][:25],
            }
            for child in children
        ],
        "count": sum(int(str(child["count"])) for child in children),
        "existing": existing,
    }


def _existing_tonight(conn: sqlite3.Connection, space: str) -> dict[str, object] | None:
    """Return the Tonight crate under the generated folder, if any."""
    root_id = library._space_root(conn, space)
    generated = library._find_child(conn, root_id, GENERATED_FOLDER, 1)
    if generated is None:
        return None
    tonight = library._find_child(conn, generated, TONIGHT_FOLDER, 1)
    if tonight is None:
        return None
    name_row = conn.execute("SELECT name FROM container WHERE id = ?", (tonight,)).fetchone()
    label = library.display_name(str(name_row[0])) if name_row is not None else TONIGHT_FOLDER
    return {"id": tonight, "name": label}


def preview(
    database: Path,
    space: str,
    *,
    newest: int = NEWEST_LIMIT,
    played: int = PLAYED_LIMIT,
) -> dict[str, object]:
    """List the tonight crates a create would write. Does not write.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        newest: Newest-adds limit.
        played: Most-played limit.

    Returns:
        The plan plus ``preview`` true and ``written`` false.
    """
    result = plan(database, space, newest=newest, played=played)
    result["preview"] = True
    result["written"] = False
    return result


def _expect_gone(write: object, crate_id: int) -> None:
    """Register a check that a deleted crate id is absent after commit."""
    import safe_write

    def check(copied: sqlite3.Connection, crate_id: int = crate_id) -> None:
        row = copied.execute("SELECT COUNT(*) FROM container WHERE id = ?", (crate_id,)).fetchone()
        if row is None or int(row[0]) != 0:
            raise safe_write.VerifyMismatch("The crate is still in the library.")

    write.check(check)  # type: ignore[attr-defined]


def _expect_named(write: object, crate_id: int, wanted: str) -> None:
    """Register a check that a crate displays as ``wanted``."""
    import safe_write

    def check(copied: sqlite3.Connection, crate_id: int = crate_id, wanted: str = wanted) -> None:
        row = copied.execute("SELECT name FROM container WHERE id = ?", (crate_id,)).fetchone()
        if row is None or library.display_name(str(row[0])) != wanted:
            raise safe_write.VerifyMismatch("The crate name does not match.")

    write.check(check)  # type: ignore[attr-defined]


def create(
    database: Path,
    space: str,
    *,
    newest: int = NEWEST_LIMIT,
    played: int = PLAYED_LIMIT,
) -> dict[str, object]:
    """Write the tonight folder through ``safe_write``.

    Ensures ``_crateCraft generated``, replaces only ``Tonight`` under it,
    then creates Newest adds, Most played, and each non-empty decade crate.
    Serato must be quit. An empty plan does not write.

    Args:
        database: Unused for the write path; ``library.MASTER`` is written.
            Kept so callers match ``preview``.
        space: Space name.
        newest: Newest-adds limit.
        played: Most-played limit.

    Returns:
        ``written`` true with ``id``, ``name``, ``folder``, ``children``,
        and ``replaced`` when a previous Tonight was removed. ``written``
        false when nothing would be created.

    Raises:
        LibraryError: Bad values, empty plan after confirm, or a refused write.
        library.SeratoOpen: Serato still holds the library.
    """
    import safe_write
    import smart_presets

    del database
    newest_n = _limit(newest, NEWEST_LIMIT)
    played_n = _limit(played, PLAYED_LIMIT)
    if space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")

    # Read the plan against the live library before opening a write session.
    draft = plan(Path(library.MASTER), space, newest=newest_n, played=played_n)
    if not draft["children"]:
        return {
            "preview": False,
            "written": False,
            "folder": GENERATED_FOLDER,
            "tonight": TONIGHT_FOLDER,
            "newest": newest_n,
            "played": played_n,
            "children": [],
            "count": 0,
            "existing": draft.get("existing"),
        }

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Replace Tonight and create the child crates in one session."""
        rows = _space_tracks(conn, space)
        children = _children_from_rows(conn, rows, newest=newest_n, played=played_n)
        if not children:
            raise LibraryError(EMPTY_PLAN, 400)
        root_id = library._space_root(conn, space)
        generated_id = library._find_child(conn, root_id, GENERATED_FOLDER, 1)
        warning: object = None
        if generated_id is None:
            made = library._create_crate(conn, space, root_id, GENERATED_FOLDER, False, None)
            generated_id = made["id"]
            if not isinstance(generated_id, int):
                raise LibraryError("The crate could not be created.")
            _expect_named(write, generated_id, GENERATED_FOLDER)
            warning = made.get("warning")
        else:
            generated_id = int(generated_id)

        replaced: dict[str, object] | None = None
        old = library._find_child(conn, generated_id, TONIGHT_FOLDER, 1)
        if old is not None:
            replaced = {"id": int(old), "name": TONIGHT_FOLDER}
            library._delete_crate(conn, space, int(old))
            _expect_gone(write, int(old))

        tonight = library._create_crate(conn, space, generated_id, TONIGHT_FOLDER, False, None)
        tonight_id = tonight["id"]
        if not isinstance(tonight_id, int):
            raise LibraryError("The crate could not be created.")
        write.set_target(TONIGHT_FOLDER)
        _expect_named(write, tonight_id, TONIGHT_FOLDER)
        warning = tonight.get("warning") or warning

        made_children: list[dict[str, object]] = []
        for child in children:
            created = library._create_crate(conn, space, tonight_id, str(child["name"]), False, None)
            child_id = created["id"]
            if not isinstance(child_id, int):
                raise LibraryError("The crate could not be created.")
            ids: list[int] = list(child["ids"])  # type: ignore[arg-type]
            for asset_id in ids:
                warning = library._membership(conn, child_id, asset_id, space, True).get("warning") or warning
            warning = created.get("warning") or warning
            smart_presets._expect_members(write, child_id, tuple(ids))
            _expect_named(write, child_id, str(child["name"]))
            made_children.append(
                {
                    "id": child_id,
                    "kind": child["kind"],
                    "name": created["name"],
                    "count": len(ids),
                }
            )
        return {
            "ok": True,
            "preview": False,
            "written": True,
            "id": tonight_id,
            "name": tonight["name"],
            "folder": GENERATED_FOLDER,
            "tonight": TONIGHT_FOLDER,
            "newest": newest_n,
            "played": played_n,
            "children": made_children,
            "count": sum(int(str(item["count"])) for item in made_children),
            "replaced": replaced,
            "warning": warning,
        }

    return safe_write.run("tonight_crates", TONIGHT_FOLDER, apply)


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/tonight`` request.

    Args:
        payload: ``action`` is ``preview`` or ``create``. Both take ``space``
            and optional ``newest`` / ``played`` limits. ``create`` writes
            only when ``confirm`` is true; without it the preview is returned.

    Returns:
        That action's result.

    Raises:
        LibraryError: If the action or its fields are invalid.
        library.SeratoOpen: If ``create`` runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    newest = _limit(payload.get("newest"), NEWEST_LIMIT)
    played = _limit(payload.get("played"), PLAYED_LIMIT)
    confirm = payload.get("confirm") is True
    database = Path(library.MASTER)
    if kind == "preview" or (kind == "create" and not confirm):
        return preview(database, space, newest=newest, played=played)
    if kind == "create":
        return create(database, space, newest=newest, played=played)
    raise LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the tonight plan as JSON. Read-only.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the plan was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="Preview tonight crates (newest adds, most played, by decade). Read-only."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--newest", type=int, default=NEWEST_LIMIT)
    parser.add_argument("--played", type=int, default=PLAYED_LIMIT)
    args = parser.parse_args(argv)
    try:
        result = preview(args.database, args.space, newest=args.newest, played=args.played)
    except LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
