"""Editable genre families: a sub-genre points at a parent the DJ chooses.

Spelling groups from ``tag_cleanup`` seed the map (Hip-Hop under Hip Hop).
The DJ can move any genre under another genre in the library. The map lives
in ``genre-families.json`` beside ``settings.json``, never in the Serato
folder. Building and previewing the map does not write ``master.sqlite``.

Writing the parent name into Grouping or Comment is a separate preview.
Rows that already have text are left alone unless overwrite is confirmed.
That write goes through ``safe_write`` and does not touch audio files.
"""

from __future__ import annotations

import json
import os
import sqlite3
import tempfile
import time
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path

import app_config
import gig_check
import library
import tag_cleanup
from library import LibraryError

STORE_NAME = "genre-families.json"
FIELDS = ("grouping", "comments")
FIELD_LABELS = {"grouping": "Grouping", "comments": "Comment"}

NOT_A_GENRE = "That genre is not in this library."
CYCLE = "A genre cannot sit under itself."
BAD_FIELD = "Choose Grouping or Comment."
BAD_MAP = "That genre map is not valid."
NEEDS_CONFIRM = "Confirm the genre family write before it is saved."


def seed_parents(
    groups: Sequence[Mapping[str, object]],
    counts: Mapping[str, int],
) -> dict[str, str | None]:
    """Build a parent map from spelling groups and every stored genre.

    Args:
        groups: ``tag_cleanup.clusters`` groups. Each has ``suggested`` and
            ``spellings`` of ``{value, count}``.
        counts: Stored genre spelling to track count. Blank spellings are
            already left out.

    Returns:
        Genre spelling to parent spelling. A root's parent is None. The
        suggested spelling of a group is the root. Other spellings in that
        group point at it. A genre in no group is its own root.

    Example:
        >>> seed_parents(
        ...     [{"suggested": "Hip Hop", "spellings": [
        ...         {"value": "Hip Hop"}, {"value": "Hip-Hop"}]}],
        ...     {"Hip Hop": 2, "Hip-Hop": 1, "House": 4},
        ... )
        {'Hip Hop': None, 'Hip-Hop': 'Hip Hop', 'House': None}
    """
    parents: dict[str, str | None] = {value: None for value in counts}
    for group in groups:
        suggested = group.get("suggested")
        spellings = group.get("spellings")
        if not isinstance(suggested, str) or suggested not in parents:
            continue
        if not isinstance(spellings, Sequence) or isinstance(spellings, (str, bytes)):
            continue
        parents[suggested] = None
        for item in spellings:
            if not isinstance(item, Mapping):
                continue
            value = item.get("value")
            if isinstance(value, str) and value in parents and value != suggested:
                parents[value] = suggested
    return parents


def reparent(
    parents: Mapping[str, str | None],
    genre: str,
    new_parent: str | None,
) -> dict[str, str | None]:
    """Move one genre under another genre, or make it a root.

    Children of ``genre`` stay attached to it, so the genre can sit between
    its old parent and those children.

    Args:
        parents: Current map. Values are a parent spelling or None.
        genre: Spelling to move. It must already be a key.
        new_parent: Parent spelling, or None to make ``genre`` a root.

    Returns:
        A new map. The input is not changed.

    Raises:
        LibraryError: The genre or the parent is not in the map, the genre
            would sit under itself, or the parent is already under the genre.

    Example:
        >>> reparent({"House": None, "Tech House": None}, "Tech House", "House")
        {'House': None, 'Tech House': 'House'}
    """
    if genre not in parents:
        raise LibraryError(NOT_A_GENRE, 400)
    if new_parent is not None and new_parent not in parents:
        raise LibraryError(NOT_A_GENRE, 400)
    if new_parent == genre:
        raise LibraryError(CYCLE, 400)
    seen: set[str] = set()
    cursor = new_parent
    while cursor is not None:
        if cursor == genre or cursor in seen:
            raise LibraryError(CYCLE, 400)
        seen.add(cursor)
        cursor = parents.get(cursor)
    updated = dict(parents)
    updated[genre] = new_parent
    return updated


def root(parents: Mapping[str, str | None], genre: str) -> str:
    """Return the family name of one genre.

    Args:
        parents: Map from :func:`reparent` or :func:`seed_parents`.
        genre: Stored spelling.

    Returns:
        The root spelling. A genre whose parent is None is its own root.

    Raises:
        LibraryError: The genre is not in the map, or the links loop.
    """
    if genre not in parents:
        raise LibraryError(NOT_A_GENRE, 400)
    seen: set[str] = set()
    current = genre
    while True:
        parent = parents.get(current)
        if not parent:
            return current
        if current in seen or parent == current:
            raise LibraryError(CYCLE, 400)
        seen.add(current)
        current = parent


def members(parents: Mapping[str, str | None], family: str) -> list[str]:
    """List the spellings that roll up to one family, including the root.

    Args:
        parents: Parent map.
        family: Root spelling.

    Returns:
        Spellings whose :func:`root` is ``family``, root first, then name.

    Raises:
        LibraryError: A link in the map loops.
    """
    found = [genre for genre in parents if root(parents, genre) == family]
    found.sort(key=lambda genre: (genre != family, genre.casefold()))
    return found


def overlay(seeded: Mapping[str, str | None], saved: Mapping[str, str | None]) -> dict[str, str | None]:
    """Keep the DJ's moves for genres that are still in the library.

    Args:
        seeded: Fresh seed for the genres in the library now.
        saved: Map last saved for this library. Genres that left the
            library are dropped. A move that would loop is left at the seed.

    Returns:
        The seed, with each saved edge applied when it still fits.
    """
    current = dict(seeded)
    for genre, parent in saved.items():
        if genre not in current:
            continue
        if parent is not None and parent not in current:
            continue
        if current.get(genre) == parent:
            continue
        try:
            current = reparent(current, genre, parent)
        except LibraryError:
            continue
    return current


def _require_field(field: object) -> str:
    """Return a Grouping or Comment column name.

    Args:
        field: Request value.

    Returns:
        ``grouping`` or ``comments``.

    Raises:
        LibraryError: Anything else.
    """
    if field == "comment":
        field = "comments"
    if not isinstance(field, str) or field not in FIELDS:
        raise LibraryError(BAD_FIELD, 400)
    return field


def plan_notes(
    rows: Sequence[Mapping[str, object]],
    parents: Mapping[str, str | None],
    field: str,
    overwrite: bool,
) -> dict[str, object]:
    """List Grouping or Comment writes, and rows that already have text.

    Args:
        rows: ``id``, ``genre``, and the note columns.
        parents: Parent map.
        field: ``grouping`` or ``comments``.
        overwrite: True may replace text that is already there.

    Returns:
        ``field``, ``changes`` (``id``, ``from``, ``to``), ``blocked``
        (same shape, not written), and ``written`` false. A blank note
        becomes the family name. A note that already equals the family
        is left out. Other text is blocked unless ``overwrite`` is true.
    """
    column = _require_field(field)
    changes: list[dict[str, object]] = []
    blocked: list[dict[str, object]] = []
    for row in rows:
        raw_genre = row.get("genre")
        genre = raw_genre.strip() if isinstance(raw_genre, str) else ""
        if not genre or genre not in parents:
            continue
        target = root(parents, genre)
        if not target:
            continue
        raw = row.get(column)
        current = "" if raw is None else str(raw).strip()
        if current == target:
            continue
        item = {"id": int(row["id"]), "from": current, "to": target}  # type: ignore[arg-type]
        if current and not overwrite:
            blocked.append(item)
        else:
            changes.append(item)
    return {
        "field": column,
        "changes": changes,
        "blocked": blocked,
        "written": False,
    }


def _store_path() -> Path:
    """Return ``genre-families.json`` beside ``settings.json``.

    Returns:
        The path. The file may not exist yet.
    """
    return app_config.config_dir() / STORE_NAME


def _library_key() -> str:
    """Key the map by the library file it belongs to.

    Returns:
        The resolved path of ``library.MASTER``.
    """
    return str(Path(library.MASTER).resolve())


def _read_store() -> dict[str, dict[str, str | None]]:
    """Read every saved map.

    Returns:
        ``{library path: {genre: parent or None}}``. A missing or damaged
        file reads as empty, so a bad file never blocks the library.
    """
    try:
        data = json.loads(_store_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    libraries: dict[str, dict[str, str | None]] = {}
    for path, raw in data.items():
        if not isinstance(raw, dict):
            continue
        parents: dict[str, str | None] = {}
        for genre, parent in raw.items():
            if not isinstance(genre, str) or not genre.strip():
                continue
            if parent is None:
                parents[genre] = None
            elif isinstance(parent, str) and parent.strip():
                parents[genre] = parent
        if parents:
            libraries[str(path)] = parents
    return libraries


def _write_store(data: Mapping[str, Mapping[str, str | None]]) -> None:
    """Replace ``genre-families.json`` in one step.

    Args:
        data: The whole store.

    Writes a temporary file in the same folder and renames it over the old one.
    """
    path = _store_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(prefix=".genre-families-", suffix=".json", dir=path.parent)
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as out:
            json.dump(data, out, indent=2, sort_keys=True, ensure_ascii=False)
        os.replace(temp, path)
    except BaseException:
        Path(temp).unlink(missing_ok=True)
        raise


def _saved_parents() -> dict[str, str | None]:
    """Return the saved map for this library, or an empty map.

    Returns:
        Genre to parent. Missing file is empty.
    """
    return dict(_read_store().get(_library_key(), {}))


def _remember(parents: Mapping[str, str | None]) -> None:
    """Save this library's map. Other libraries in the file stay.

    Args:
        parents: Map to store. None becomes JSON null.
    """
    data = _read_store()
    data[_library_key()] = dict(parents)
    _write_store(data)


def _genre_rows(conn: sqlite3.Connection, space: str) -> list[sqlite3.Row]:
    """Read genre and note columns for one space.

    Args:
        conn: Open connection.
        space: Space name.

    Returns:
        Rows with ``id``, ``genre``, ``grouping``, and ``comments``.
    """
    conn.row_factory = sqlite3.Row
    return list(
        conn.execute(
            """
            SELECT a.id, a.genre, a.grouping, a.comments
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
            ORDER BY a.id
            """,
            (space,),
        )
    )


def _counts(rows: Sequence[sqlite3.Row]) -> dict[str, int]:
    """Count non-blank genre spellings.

    Args:
        rows: Rows from :func:`_genre_rows`.

    Returns:
        Spelling to track count.
    """
    counts: dict[str, int] = {}
    for row in rows:
        genre = row["genre"]
        if not isinstance(genre, str):
            continue
        text = genre.strip()
        if text:
            counts[text] = counts.get(text, 0) + 1
    return counts


def _check_map(parents: Mapping[str, object]) -> dict[str, str | None]:
    """Check a map from a request.

    Args:
        parents: JSON object of genre to parent or null.

    Returns:
        A cleaned map.

    Raises:
        LibraryError: The map is not an object, a parent is unknown, or a
            link loops.
    """
    if not isinstance(parents, Mapping):
        raise LibraryError(BAD_MAP, 400)
    cleaned: dict[str, str | None] = {}
    for genre, parent in parents.items():
        if not isinstance(genre, str) or not genre.strip():
            raise LibraryError(BAD_MAP, 400)
        if parent is None:
            cleaned[genre] = None
        elif isinstance(parent, str) and parent.strip():
            cleaned[genre] = parent
        else:
            raise LibraryError(BAD_MAP, 400)
    for genre, parent in cleaned.items():
        if parent is not None and parent not in cleaned:
            raise LibraryError(NOT_A_GENRE, 400)
        root(cleaned, genre)
    return cleaned


def current_parents(database: Path, space: str) -> tuple[dict[str, str | None], bool]:
    """Return the map the page should show.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        The map, and whether a saved map for this library was merged in.
        With no saved map, the result is the spelling-group seed.

    Raises:
        LibraryError: The space is not allowed, or the database cannot be
            opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    grouped = tag_cleanup.clusters(database, space, "genre")
    conn = gig_check.open_read_only(database)
    try:
        counts = _counts(_genre_rows(conn, space))
    finally:
        conn.close()
    seeded = seed_parents(grouped["groups"], counts)
    saved = _saved_parents()
    if not saved:
        return seeded, False
    return overlay(seeded, saved), True


def family_presets(
    conn: sqlite3.Connection,
    space: str,
    scope: object,
    minimum: int,
    limit: int,
) -> list[dict[str, object]]:
    """Build one genre-family preset per root that has enough tracks.

    Args:
        conn: Open connection. Only SELECT statements run.
        space: Space name.
        scope: Crate id that limits the tracks, or None. The caller already
            checked the crate. Counts here are the whole space; the preset
            scope removes tracks outside the crate when the tree is built.
        minimum: Fewest tracks a family needs.
        limit: Most families to return.

    Returns:
        Presets ``{kind: genre_family, genre, genres}``, largest family
        first. ``genres`` is every spelling that rolls up to that root.
    """
    rows = _genre_rows(conn, space)
    counts = _counts(rows)
    database = Path(library.MASTER)
    try:
        parents, _saved = current_parents(database, space)
    except LibraryError:
        parents = seed_parents([], counts)
    totals: dict[str, int] = {}
    for spelling, count in counts.items():
        family = root(parents, spelling) if spelling in parents else spelling
        totals[family] = totals.get(family, 0) + count
    ranked = [(count, name) for name, count in totals.items() if count >= minimum]
    ranked.sort(key=lambda item: (-item[0], item[1].casefold()))
    presets: list[dict[str, object]] = []
    extra = {"crate": scope} if scope is not None else {}
    for _count, name in ranked[:limit]:
        presets.append(
            {
                "kind": "genre_family",
                "genre": name,
                "genres": members(parents, name),
                **extra,
            }
        )
    return presets


def _rows_for(database: Path, space: str) -> list[dict[str, object]]:
    """Read note rows as plain dicts.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        One dict per track.

    Raises:
        LibraryError: The space is not allowed or the database cannot be read.
    """
    if space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows = _genre_rows(conn, space)
    finally:
        conn.close()
    return [
        {
            "id": int(row["id"]),
            "genre": row["genre"],
            "grouping": row["grouping"],
            "comments": row["comments"],
        }
        for row in rows
    ]


def report(database: Path, space: str) -> dict[str, object]:
    """Return the families for one space, without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        ``parents``, ``families`` (root, children, tracks), and ``saved``.

    Raises:
        LibraryError: The space or the database is not available.
    """
    parents, saved = current_parents(database, space)
    rows = _rows_for(database, space)
    counts: dict[str, int] = {}
    for row in rows:
        genre = row.get("genre")
        if isinstance(genre, str):
            text = genre.strip()
            if text:
                counts[text] = counts.get(text, 0) + 1
    families: list[dict[str, object]] = []
    roots = [genre for genre, parent in parents.items() if parent is None]
    roots.sort(key=lambda genre: (-sum(counts.get(item, 0) for item in members(parents, genre)), genre.casefold()))
    for name in roots:
        kids = members(parents, name)
        families.append(
            {
                "name": name,
                "tracks": sum(counts.get(item, 0) for item in kids),
                "children": [
                    {"name": item, "tracks": counts.get(item, 0)}
                    for item in kids
                    if item != name
                ],
            }
        )
    return {"ok": True, "parents": parents, "families": families, "saved": saved}


def _preview(database: Path, space: str, field: object, overwrite: bool) -> dict[str, object]:
    """Preview a Grouping or Comment write.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        field: ``grouping`` or ``comments``.
        overwrite: True includes rows that already have text.

    Returns:
        The plan from :func:`plan_notes`.

    Raises:
        LibraryError: The field or the library is not available.
    """
    parents, _saved = current_parents(database, space)
    return plan_notes(_rows_for(database, space), parents, _require_field(field), overwrite)


def _apply(space: str, field: object, overwrite: bool) -> dict[str, object]:
    """Write family names into blank notes, or into filled notes when asked.

    Args:
        space: Space name.
        field: ``grouping`` or ``comments``.
        overwrite: True replaces text that is already there.

    Returns:
        The plan with ``written`` true when a row changed. Nothing is
        written when every row is already set or blocked.

    Raises:
        LibraryError: The field is not allowed.
        library.SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    database = Path(library.MASTER)
    parents, _saved = current_parents(database, space)
    plan = plan_notes(_rows_for(database, space), parents, _require_field(field), overwrite)
    changes: list[dict[str, object]] = plan["changes"]  # type: ignore[assignment]
    if not changes:
        return plan
    column = str(plan["field"])

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Write the previewed rows and register the check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result with ``written`` true.
        """
        live = plan_notes(
            [
                {
                    "id": int(row["id"]),
                    "genre": row["genre"],
                    "grouping": row["grouping"],
                    "comments": row["comments"],
                }
                for row in _genre_rows(conn, space)
            ],
            parents,
            column,
            overwrite,
        )
        live_changes: list[dict[str, object]] = live["changes"]  # type: ignore[assignment]
        write.set_target(FIELD_LABELS.get(column, column))
        now = int(time.time())
        expected: dict[int, str] = {}
        for change in live_changes:
            asset_id = int(change["id"])
            target = library._clean_text(column, change["to"])  # pyright: ignore[reportPrivateUsage]
            expected[asset_id] = target
            library._assign(  # pyright: ignore[reportPrivateUsage]
                conn,
                "asset",
                {column: target, "time_modified": now},
                "id = ?",
                asset_id,
            )

        def check(copied: sqlite3.Connection, expected: dict[int, str] = expected, column: str = column) -> None:
            """Fail when a rewritten row does not hold the family name.

            Args:
                copied: Read-only connection to the temporary database copy.
                expected: Asset id to the text that was written.
                column: Column that was written.

            Raises:
                VerifyMismatch: If a row is missing or different.
            """
            if not expected:
                return
            marks = ",".join("?" * len(expected))
            rows = copied.execute(
                f"SELECT id, {column} FROM asset WHERE id IN ({marks})",
                tuple(expected),
            ).fetchall()
            got = {int(row[0]): row[1] for row in rows}
            for asset_id, target in expected.items():
                if got.get(asset_id) != target:
                    raise safe_write.VerifyMismatch("The track fields do not match.")

        write.check(check)
        return {
            "field": column,
            "changes": live_changes,
            "blocked": live["blocked"],
            "written": True,
        }

    result = safe_write.run("genre_families", FIELD_LABELS.get(column, column), run)
    with closing(library.read_conn()) as master:
        for change in result["changes"]:
            library._mirror_asset(  # pyright: ignore[reportPrivateUsage]
                master, int(change["id"]), {column: change["to"]}
            )
    return result


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/genre-families`` request.

    Args:
        payload: ``action`` is ``save``, ``reparent``, ``write-preview``, or
            ``write-apply``. ``save`` takes ``parents``. ``reparent`` takes
            ``genre`` and ``parent`` (null makes a root). Write actions take
            ``field`` (``grouping`` or ``comments``) and optional
            ``overwrite``. ``write-apply`` also needs ``confirm`` true.

    Returns:
        The report, or the write plan. ``save`` and ``reparent`` do not
        change ``master.sqlite``.

    Raises:
        LibraryError: The action or a field is not valid, or confirm is
            missing on a write.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    database = Path(library.MASTER)
    if kind == "save":
        parents, _saved = current_parents(database, space)
        incoming = _check_map(payload.get("parents") if payload.get("parents") is not None else {})
        if set(incoming) != set(parents):
            raise LibraryError(BAD_MAP, 400)
        _remember(incoming)
        return report(database, space)
    if kind == "reparent":
        genre = payload.get("genre")
        if not isinstance(genre, str) or not genre.strip():
            raise LibraryError(NOT_A_GENRE, 400)
        parent = payload.get("parent")
        if parent is not None and not isinstance(parent, str):
            raise LibraryError(NOT_A_GENRE, 400)
        parents, _saved = current_parents(database, space)
        moved = reparent(parents, genre.strip(), None if parent is None else parent.strip())
        _remember(moved)
        return report(database, space)
    overwrite = payload.get("overwrite") is True
    if kind == "write-preview":
        return _preview(database, space, payload.get("field"), overwrite)
    if kind == "write-apply":
        if payload.get("confirm") is not True:
            raise LibraryError(NEEDS_CONFIRM, 400)
        return _apply(space, payload.get("field"), overwrite)
    raise LibraryError("That action is not available.")


