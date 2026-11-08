#!/usr/bin/env python3
"""Group spellings of the same genre or artist, and clean titles (#27).

"Hip Hop", "Hip-Hop", "hiphop", and "HIP HOP" are one genre written four
ways, which splits search, smart crates, and duplicate detection.
``clusters`` reads the library with ``gig_check.open_read_only`` and groups
the values of one field by ``normalize``: case is folded, accents are
removed, ``&`` and ``+`` read as "and", and anything that is not a letter or
a digit is dropped. A group is reported only when it holds two or more
spellings. The suggested spelling is the one most tracks use; a tie goes to
the spelling that sorts first.

``preview`` and ``apply`` take one of those stored spellings. ``preview``
lists the rows in that space whose stored value shares the key and is not
already that spelling. ``apply`` writes that spelling through ``safe_write``
with Serato closed.

``clean_title`` strips a leading track number, URLs, and "(Original Mix)",
moves a trailing feat./ft./featuring credit into remixer when that field is
empty, and title-cases a title that is all upper or all lower. Mixed case
stays. ``preview_titles`` lists the rows that would change.
``apply_titles`` writes those titles through ``safe_write`` with Serato
closed. Audio files are not rewritten. Remembering the mapping for new
imports is a later change.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import time
import unicodedata
from collections.abc import Mapping, Sequence
from contextlib import closing
from pathlib import Path
from typing import NotRequired, TypedDict

import gig_check
import library

FIELDS = ("genre", "artist")
CHOOSE_FIELD = "Choose genre or artist."
CHOOSE_SPELLING = "Choose a spelling."
NOT_IN_GROUP = "That spelling is not in a group."
# The SQL names come from this table, never from the request.
_SQL = {
    "genre": (
        "SELECT a.genre AS value, COUNT(*) AS tracks FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ? AND TRIM(COALESCE(a.genre, '')) != '' GROUP BY a.genre"
    ),
    "artist": (
        "SELECT a.artist AS value, COUNT(*) AS tracks FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ? AND TRIM(COALESCE(a.artist, '')) != '' GROUP BY a.artist"
    ),
}
_TRACKS = {
    "genre": (
        "SELECT a.id AS id, a.genre AS value FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ?"
    ),
    "artist": (
        "SELECT a.id AS id, a.artist AS value FROM asset a "
        "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
        "WHERE s.name = ?"
    ),
}
_NOT_WORD = re.compile(r"[^0-9a-z]+")
_URL = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_PREFIX = re.compile(r"^\s*\d{1,3}\s*[-.)]\s+")
_ORIGINAL = re.compile(r"\s*[\(\[]\s*original\s+mix\s*[\)\]]", re.IGNORECASE)
_FEAT = re.compile(
    r"\s*(?:\(|\[)?\s*(?:feat\.?|ft\.?|featuring)\s+([^)\]]+?)\s*(?:\)|\])?\s*$",
    re.IGNORECASE,
)
_SMALL = frozenset(
    {
        "a",
        "an",
        "and",
        "at",
        "but",
        "by",
        "for",
        "from",
        "in",
        "nor",
        "of",
        "on",
        "or",
        "the",
        "to",
        "vs",
        "vs.",
        "with",
    }
)
_KEEP_UPPER = frozenset({"dj", "mc", "uk", "us", "nyc", "vip", "rip", "tv", "lp", "ep", "bpm"})
_TITLES = (
    "SELECT a.id AS id, a.name AS value, a.remixer AS remixer FROM asset a "
    "JOIN space_asset sa ON sa.asset_id = a.id JOIN space s ON s.id = sa.space_id "
    "WHERE s.name = ?"
)
TITLE_FIELD = "name"
TITLE_VALUE = "titles"

class SpellingCount(TypedDict):
    """One stored spelling and how many tracks use it."""

    value: str
    count: int


class Group(TypedDict):
    """Spellings that share one ``normalize`` key."""

    key: str
    suggested: str
    tracks: int
    spellings: list[SpellingCount]


class Clusters(TypedDict):
    """``clusters`` JSON: distinct values and the groups of two or more."""

    field: str
    values: int
    groups: list[Group]


Change = TypedDict(
    "Change",
    {"id": int, "from": str, "to": str, "remixer": NotRequired[str]},
)


class CleanedTitle(TypedDict):
    """One title after the cleanup rules, and an optional remixer write."""

    name: str
    remixer: str | None


class Plan(TypedDict):
    """Preview or apply JSON for one chosen spelling."""

    field: str
    value: str
    key: str
    changes: list[Change]
    written: bool


def normalize(value: str) -> str:
    """Return the key that equal spellings share.

    Args:
        value: A genre or artist as stored.

    Returns:
        Lower-case letters and digits only, accents removed, with ``&`` and
        ``+`` read as "and". Empty for a blank value.

    Example:
        >>> normalize("Hip-Hop") == normalize("hip hop") == normalize("HIPHOP")
        True
    """
    text = unicodedata.normalize("NFKD", value.casefold())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.replace("&", " and ").replace("+", " and ")
    return _NOT_WORD.sub("", text)


def _needs_case(text: str) -> bool:
    """Return True when every letter is upper or every letter is lower.

    Args:
        text: Title or remixer after the other cleanup rules.

    Returns:
        True when casing should run. False for mixed case or no letters.
    """
    letters = [char for char in text if char.isalpha()]
    if not letters:
        return False
    return all(char.isupper() for char in letters) or all(char.islower() for char in letters)


def _title_case_word(word: str, index: int, last: int) -> str:
    """Title-case one whitespace-separated token.

    Args:
        word: One token from the title.
        index: Position in the title, starting at 0.
        last: Last index in the title.

    Returns:
        The token with DJ-style short tags kept upper, small words lower
        in the middle, and the first letter of other words upper.
    """
    fold = word.casefold()
    letters = "".join(char for char in fold if char.isalpha())
    if letters in _KEEP_UPPER:
        return "".join(char.upper() if char.isalpha() else char for char in word)
    if index not in (0, last) and fold in _SMALL:
        return fold
    if not word:
        return word
    return word[0].upper() + word[1:].casefold()


def _title_case(text: str) -> str:
    """Title-case a cleaned title.

    Args:
        text: Title after prefixes, URLs, and credits were stripped.

    Returns:
        Words joined with single spaces.
    """
    words = text.split()
    last = len(words) - 1
    return " ".join(_title_case_word(word, index, last) for index, word in enumerate(words))


def _tidy(text: str) -> str:
    """Collapse spaces and strip leftover separators.

    Args:
        text: Title mid-cleanup.

    Returns:
        Trimmed text with single spaces.
    """
    text = re.sub(r"[\s|/\-]+$", "", text)
    text = re.sub(r"^[\s|/\-]+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def clean_title(name: str, remixer: str = "") -> CleanedTitle:
    """Apply the title cleanup rules without writing.

    Leading ``01 - `` / ``01.`` / ``1)`` prefixes, URLs, and
    ``(Original Mix)`` come off first. A trailing feat./ft./featuring
    credit moves to remixer only when remixer is blank. All-upper or
    all-lower titles are title-cased; mixed case stays. An empty result
    leaves the stored title.

    Args:
        name: Stored track title.
        remixer: Stored remixer, or blank.

    Returns:
        ``name`` after the rules, and ``remixer`` when that field should
        change, else None.
    """
    stored = name
    held = remixer.strip() if remixer else ""
    text = _URL.sub(" ", name)
    text = _ORIGINAL.sub(" ", text)
    while True:
        stripped = _PREFIX.sub("", text, count=1)
        if stripped == text:
            break
        text = stripped
    feat = ""
    match = _FEAT.search(text)
    if match and not held:
        feat = match.group(1).strip(" .")
        if feat:
            text = text[: match.start()]
    text = _tidy(text)
    if not text:
        return {"name": stored, "remixer": None}
    if _needs_case(text):
        text = _title_case(text)
    new_remixer: str | None = None
    if feat:
        if _needs_case(feat):
            feat = _title_case(feat)
        new_remixer = feat
    if text == stored and new_remixer is None:
        return {"name": stored, "remixer": None}
    return {"name": text, "remixer": new_remixer}


def _require_field(field: str) -> str:
    """Return ``genre`` or ``artist``.

    Args:
        field: Requested field name.

    Returns:
        That field.

    Raises:
        library.LibraryError: The field is not allowed (400).
    """
    if field not in FIELDS:
        raise library.LibraryError(CHOOSE_FIELD, 400)
    return field


def _spelling(value: object, field: str) -> str:
    """Return a non-blank spelling to apply.

    Args:
        value: Chosen genre or artist text.
        field: ``genre`` or ``artist``, for the length error.

    Returns:
        The stripped spelling.

    Raises:
        library.LibraryError: The value is missing, not text, blank, or too long.
    """
    if not isinstance(value, str):
        raise library.LibraryError(CHOOSE_SPELLING, 400)
    text = value.strip()
    if not text:
        raise library.LibraryError(CHOOSE_SPELLING, 400)
    if len(text) > 4000:
        raise library.LibraryError(f"{field} is too long.")
    return text


def clusters(database: Path, space: str, field: str) -> Clusters:
    """Group the spellings of one field that mean the same value.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        field: ``genre`` or ``artist``.

    Returns:
        ``field``, ``values`` (distinct non-blank spellings), and ``groups``,
        largest first. Each group is ``{ key, suggested, tracks, spellings }``
        and each spelling ``{ value, count }``, most used first.

    Raises:
        library.LibraryError: The field or space is not allowed (400), or the
            database is missing or cannot be opened read-only.
    """
    field = _require_field(field)
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows = conn.execute(_SQL[field], (space,)).fetchall()
    finally:
        conn.close()
    counts: dict[str, int] = {}
    for row in rows:
        value = str(row["value"]).strip()
        counts[value] = counts.get(value, 0) + int(row["tracks"])
    grouped: dict[str, list[tuple[str, int]]] = {}
    for value, count in counts.items():
        key = normalize(value)
        if key:
            grouped.setdefault(key, []).append((value, count))
    groups: list[Group] = []
    for key, spellings in grouped.items():
        if len(spellings) < 2:
            continue
        ranked = sorted(spellings, key=lambda item: (-item[1], item[0]))
        groups.append(
            {
                "key": key,
                "suggested": ranked[0][0],
                "tracks": sum(count for _value, count in ranked),
                "spellings": [{"value": value, "count": count} for value, count in ranked],
            }
        )
    groups.sort(key=lambda group: (-group["tracks"], group["key"]))
    return {"field": field, "values": len(counts), "groups": groups}


def _in_group(groups: Sequence[Group], spelling: str) -> str:
    """Return the cluster key when ``spelling`` is one of its stored values.

    Args:
        groups: ``clusters`` groups list.
        spelling: Chosen spelling after strip.

    Returns:
        The group's ``normalize`` key.

    Raises:
        library.LibraryError: The spelling is not in a group with two or more
            stored spellings.
    """
    key = normalize(spelling)
    if not key:
        raise library.LibraryError(NOT_IN_GROUP, 400)
    for group in groups:
        if group["key"] != key:
            continue
        if spelling in {item["value"] for item in group["spellings"]}:
            return key
    raise library.LibraryError(NOT_IN_GROUP, 400)


def _changes(
    conn: sqlite3.Connection, space: str, field: str, spelling: str, key: str
) -> list[Change]:
    """List rows in ``space`` whose field shares ``key`` and is not ``spelling``.

    Args:
        conn: Open library connection.
        space: Space name.
        field: ``genre`` or ``artist``.
        spelling: Canonical value to write.
        key: ``normalize`` key for that group.

    Returns:
        ``{ id, from, to }`` rows, sorted by id.
    """
    rows = conn.execute(_TRACKS[field], (space,)).fetchall()
    changes: list[Change] = []
    for row in rows:
        stored = row["value"]
        if stored is None:
            continue
        text = str(stored)
        if text == spelling:
            continue
        if normalize(text) != key:
            continue
        changes.append({"id": int(row["id"]), "from": text, "to": spelling})
    changes.sort(key=lambda item: item["id"])
    return changes


def _plan(database: Path, space: str, field: str, value: object) -> Plan:
    """Build the apply plan without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        field: ``genre`` or ``artist``.
        value: One stored spelling from that field's group.

    Returns:
        ``field``, ``value``, ``key``, ``changes``, and ``written`` false.

    Raises:
        library.LibraryError: The field, space, or spelling is not allowed, or
            the database cannot be opened read-only.
    """
    field = _require_field(field)
    spelling = _spelling(value, field)
    grouped = clusters(database, space, field)
    key = _in_group(grouped["groups"], spelling)
    conn = gig_check.open_read_only(database)
    try:
        changes = _changes(conn, space, field, spelling, key)
    finally:
        conn.close()
    return {
        "field": field,
        "value": spelling,
        "key": key,
        "changes": changes,
        "written": False,
    }


def preview(database: Path, space: str, field: str, value: object) -> Plan:
    """List the rows an apply would rewrite, without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        field: ``genre`` or ``artist``.
        value: One stored spelling from that field's group.

    Returns:
        Plan JSON with ``written`` false.

    Raises:
        library.LibraryError: The field, space, or spelling is not allowed.
    """
    return _plan(database, space, field, value)


def apply(space: str, field: str, value: object) -> Plan:
    """Rewrite one group's spellings through ``safe_write``.

    Args:
        space: Space name.
        field: ``genre`` or ``artist``.
        value: One stored spelling from that field's group.

    Returns:
        Plan JSON. ``written`` is false when every matching row already holds
        that spelling.

    Raises:
        library.LibraryError: The field, space, or spelling is not allowed.
        library.SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    database = Path(library.MASTER)
    plan = _plan(database, space, field, value)
    if not plan["changes"]:
        return plan
    field_name = plan["field"]
    spelling = plan["value"]
    key = plan["key"]

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> Plan:
        """Rewrite the live rows and register the field check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict with ``written`` true.
        """
        live = _changes(conn, space, field_name, spelling, key)
        write.set_target(spelling)
        now = int(time.time())
        ids = tuple(change["id"] for change in live)
        for change in live:
            library._assign(  # pyright: ignore[reportPrivateUsage]
                conn,
                "asset",
                {field_name: spelling, "time_modified": now},
                "id = ?",
                change["id"],
            )

        def check(
            copied: sqlite3.Connection,
            ids: tuple[int, ...] = ids,
            field_name: str = field_name,
            spelling: str = spelling,
        ) -> None:
            """Fail when a rewritten row does not hold the spelling.

            Args:
                copied: Read-only connection to the temporary database copy.
                ids: Asset ids this write assigned.
                field_name: ``genre`` or ``artist``.
                spelling: Value those rows should have.

            Raises:
                VerifyMismatch: If a row is missing or different.
            """
            if not ids:
                return
            placeholders = ",".join("?" * len(ids))
            sql = f"SELECT id, {field_name} FROM asset WHERE id IN ({placeholders})"
            rows = copied.execute(sql, ids).fetchall()
            got = {int(row[0]): row[1] for row in rows}
            for asset_id in ids:
                if got.get(asset_id) != spelling:
                    raise safe_write.VerifyMismatch("The track fields do not match.")

        write.check(check)
        return {
            "field": field_name,
            "value": spelling,
            "key": key,
            "changes": live,
            "written": True,
        }

    result = safe_write.run("tag_cleanup", spelling, run)
    with closing(library.read_conn()) as master:
        for change in result["changes"]:
            library._mirror_asset(  # pyright: ignore[reportPrivateUsage]
                master, change["id"], {field_name: spelling}
            )
    return result


def _title_changes(conn: sqlite3.Connection, space: str) -> list[Change]:
    """List rows in ``space`` whose title (or remixer) the rules would rewrite.

    Args:
        conn: Open library connection.
        space: Space name.

    Returns:
        ``{ id, from, to }`` rows, with ``remixer`` when that field changes,
        sorted by id. Blank titles are skipped.
    """
    rows = conn.execute(_TITLES, (space,)).fetchall()
    changes: list[Change] = []
    for row in rows:
        stored = row["value"]
        if stored is None:
            continue
        text = str(stored)
        if not text.strip():
            continue
        held = "" if row["remixer"] is None else str(row["remixer"])
        cleaned = clean_title(text, held)
        if cleaned["name"] == text and cleaned["remixer"] is None:
            continue
        change: Change = {"id": int(row["id"]), "from": text, "to": cleaned["name"]}
        if cleaned["remixer"] is not None:
            change["remixer"] = cleaned["remixer"]
        changes.append(change)
    changes.sort(key=lambda item: item["id"])
    return changes


def _title_plan(database: Path, space: str) -> Plan:
    """Build the title-cleanup plan without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        Plan JSON with ``field`` ``name``, ``value`` ``titles``, and
        ``written`` false.

    Raises:
        library.LibraryError: The space is unknown or the database cannot
            be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        changes = _title_changes(conn, space)
    finally:
        conn.close()
    return {
        "field": TITLE_FIELD,
        "value": TITLE_VALUE,
        "key": "clean",
        "changes": changes,
        "written": False,
    }


def preview_titles(database: Path, space: str) -> Plan:
    """List the titles an apply would rewrite, without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.

    Returns:
        Plan JSON with ``written`` false.

    Raises:
        library.LibraryError: The space is unknown or the database cannot
            be opened read-only.
    """
    return _title_plan(database, space)


def apply_titles(space: str) -> Plan:
    """Rewrite cleaned titles through ``safe_write``.

    Args:
        space: Space name.

    Returns:
        Plan JSON. ``written`` is false when every title already matches
        the rules.

    Raises:
        library.LibraryError: The space is unknown.
        library.SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    database = Path(library.MASTER)
    plan = _title_plan(database, space)
    if not plan["changes"]:
        return plan

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> Plan:
        """Rewrite the live titles and register the field check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict with ``written`` true.
        """
        live = _title_changes(conn, space)
        write.set_target("titles")
        now = int(time.time())
        ids = tuple(change["id"] for change in live)
        expected: dict[int, tuple[str, str | None]] = {}
        for change in live:
            values: dict[str, object] = {
                "name": change["to"],
                "time_modified": now,
            }
            remixer = change.get("remixer")
            if remixer is not None:
                values["remixer"] = remixer
            library._assign(  # pyright: ignore[reportPrivateUsage]
                conn,
                "asset",
                values,
                "id = ?",
                change["id"],
            )
            expected[change["id"]] = (change["to"], remixer)

        def check(
            copied: sqlite3.Connection,
            expected: dict[int, tuple[str, str | None]] = expected,
        ) -> None:
            """Fail when a rewritten row does not hold the cleaned title.

            Args:
                copied: Read-only connection to the temporary database copy.
                expected: Asset id to (name, remixer or None).

            Raises:
                VerifyMismatch: If a row is missing or different.
            """
            if not expected:
                return
            ids = tuple(expected)
            placeholders = ",".join("?" * len(ids))
            sql = f"SELECT id, name, remixer FROM asset WHERE id IN ({placeholders})"
            rows = copied.execute(sql, ids).fetchall()
            got = {int(row[0]): (row[1], row[2]) for row in rows}
            for asset_id, (name, remixer) in expected.items():
                have = got.get(asset_id)
                if have is None or have[0] != name:
                    raise safe_write.VerifyMismatch("The track fields do not match.")
                if remixer is not None and have[1] != remixer:
                    raise safe_write.VerifyMismatch("The track fields do not match.")

        write.check(check)
        return {
            "field": TITLE_FIELD,
            "value": TITLE_VALUE,
            "key": "clean",
            "changes": live,
            "written": True,
        }

    result = safe_write.run("tag_cleanup", "titles", run)
    with closing(library.read_conn()) as master:
        for change in result["changes"]:
            values: dict[str, object] = {"name": change["to"]}
            if "remixer" in change:
                values["remixer"] = change["remixer"]
            library._mirror_asset(  # pyright: ignore[reportPrivateUsage]
                master, change["id"], values
            )
    return result


def action(payload: Mapping[str, object]) -> Plan:
    """Run one ``POST /api/tag-clusters`` request.

    Args:
        payload: ``action`` is ``preview``, ``apply``, ``clean-preview``, or
            ``clean-apply``. Spelling actions take ``space``, ``field``, and
            ``value``. Title cleanup takes ``space``.

    Returns:
        That action's result.

    Raises:
        library.LibraryError: If the action or its fields are invalid.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    if kind == "clean-preview":
        return preview_titles(Path(library.MASTER), space)
    if kind == "clean-apply":
        return apply_titles(space)
    field = payload.get("field", "genre")
    if field is None:
        field = "genre"
    if not isinstance(field, str):
        raise library.LibraryError(CHOOSE_FIELD, 400)
    value = payload.get("value")
    if kind == "preview":
        return preview(Path(library.MASTER), space, field, value)
    if kind == "apply":
        return apply(space, field, value)
    raise library.LibraryError("That action is not available.")


def main(argv: Sequence[str] | None = None) -> int:
    """Print the groups, a preview, or apply a spelling.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the JSON was printed, 1 when the library could not be read or
        written.
    """
    parser = argparse.ArgumentParser(
        description="Group spellings of one genre or artist, apply one, or clean titles."
    )
    parser.add_argument("field", choices=FIELDS, nargs="?")
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--value", help="Stored spelling to preview or apply")
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Preview or apply title cleanup instead of spelling groups.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write through safe_write. With --clean, writes titles.",
    )
    args = parser.parse_args(argv)
    if args.clean and args.field is not None:
        parser.error("Title cleanup does not take a field.")
    if not args.clean and args.field is None:
        parser.error("Choose genre or artist.")
    if args.apply and not args.clean and args.value is None:
        parser.error("Choose a spelling with --value.")
    previous = library.MASTER
    try:
        library.MASTER = str(args.database)
        if args.clean:
            result = apply_titles(args.space) if args.apply else preview_titles(args.database, args.space)
        elif args.value is None:
            result = clusters(args.database, args.space, args.field)
        elif args.apply:
            result = apply(args.space, args.field, args.value)
        else:
            result = preview(args.database, args.space, args.field, args.value)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    finally:
        library.MASTER = previous
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
