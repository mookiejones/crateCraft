"""Group acapella, instrumental, and original versions of one recording.

Detection reads the library. Nothing is stored until ``apply`` is confirmed.
Confirmed links go in ``related.sqlite`` with the note ``version``. They are
not written to ``master.sqlite``. An optional Serato crate is named
``Versions of`` plus the shared title and is created through
``library.crate_action``, which already runs inside ``safe_write``.
"""

from __future__ import annotations

import re
import sqlite3
from collections.abc import Mapping, Sequence
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path

import library
import related

VERSION_NOTE = "version"
CONFIRM = "Confirm the version crate before it is saved."
CRATE_LIMIT = 400
_SUFFIXES = ("original mix", "a cappella", "acapella", "instrumental", "original")
_PAREN_RE = re.compile(r"[\(\[\{][^()\[\]{}]*[\)\]\}]")
_INNER_RE = re.compile(r"[\(\[\{]([^()\[\]{}]*)[\)\]\}]")


@dataclass(frozen=True)
class Family:
    """One suggested version family.

    Attributes:
        artist: Artist text from the library, not a normalized key.
        stem: Title stem used to group. Lower case.
        title: Short title used in the crate name.
        crate_name: ``Versions of`` plus ``title``.
        tracks: Library tracks in asset id order.
    """

    artist: str
    stem: str
    title: str
    crate_name: str
    tracks: tuple[related.CatalogTrack, ...]


def _collapse(text: str) -> str:
    """Fold case and treat dashes as spaces.

    Args:
        text: Raw title or artist.

    Returns:
        A single-spaced lower-case string. Empty when the input is blank.
    """
    folded = text.casefold().replace("\u2019", "'").replace("`", "'")
    return re.sub(r"[\s_\-–—]+", " ", folded).strip()


def _without_parens(text: str) -> str:
    """Remove parenthetical and bracket groups.

    Args:
        text: Track title.

    Returns:
        The title with those groups removed. Nested groups are removed
        from the inside, up to eight times.
    """
    current = text
    for _ in range(8):
        updated = _PAREN_RE.sub(" ", current)
        updated = re.sub(r"[ \t]+", " ", updated).strip()
        if updated == current:
            return current
        current = updated
    return current


def _strip_suffixes(folded: str) -> str:
    """Remove trailing version suffixes.

    Args:
        folded: Already collapsed text.

    Returns:
        The text with ``original mix``, ``a cappella``, ``acapella``,
        ``instrumental``, and ``original`` removed from the end. A title
        that is only a suffix becomes empty.
    """
    current = folded.strip()
    for _ in range(8):
        removed = False
        for suffix in _SUFFIXES:
            if current == suffix:
                return ""
            tail = " " + suffix
            if current.endswith(tail):
                current = current[: -len(tail)].strip()
                removed = True
                break
        if not removed:
            return current
    return current


def stem(title: str) -> str:
    """Return the version stem of a title.

    Parentheticals are removed first. The suffixes are then removed from
    the end. A remix title that does not share that stem stays separate.

    Args:
        title: Track title as stored.

    Returns:
        The collapsed stem. Empty when nothing remains.
    """
    return _strip_suffixes(_collapse(_without_parens(title)))


def has_version_marker(title: str) -> bool:
    """Return whether a title uses a version suffix.

    Args:
        title: Track title as stored.

    Returns:
        True when a listed suffix is the whole parenthetical, or sits at
        the end of the title. A remix parenthetical is not a marker.
    """
    if _strip_suffixes(_collapse(title)) != _collapse(title):
        return True
    for inner in _INNER_RE.findall(title):
        folded = _collapse(inner)
        if folded and _strip_suffixes(folded) != folded:
            return True
    return False


def _visible_title(title: str) -> str:
    """Return the title with version markers removed, keeping case.

    Args:
        title: Track title as stored.

    Returns:
        The short title. Empty when the title was only a suffix.
    """
    text = _without_parens(title)
    for _ in range(8):
        folded = _collapse(text)
        removed = False
        for suffix in _SUFFIXES:
            if folded == suffix:
                return ""
            if not folded.endswith(" " + suffix):
                continue
            pattern = re.compile(
                r"[\s_\-–—]+" + re.escape(suffix) + r"\s*$",
                re.IGNORECASE,
            )
            updated = pattern.sub("", text).strip()
            if updated != text:
                text = updated
                removed = True
                break
        if not removed:
            break
    return re.sub(r"\s+", " ", text).strip(" -_")


def crate_name_for(title: str) -> str:
    """Return the Serato crate name for one family.

    Args:
        title: Short title from :func:`_visible_title`.

    Returns:
        ``Versions of`` plus the title, at most 400 characters. The Serato
        name separator is removed. An empty title uses ``Untitled``.
    """
    cleaned = title.replace(library.NAME_SPLIT, " ").strip()
    if not cleaned:
        cleaned = "Untitled"
    prefix = "Versions of "
    room = CRATE_LIMIT - len(prefix)
    if len(cleaned) > room:
        cleaned = cleaned[:room].rstrip()
    return prefix + cleaned


def group_tracks(catalog: Sequence[related.CatalogTrack]) -> list[Family]:
    """Group tracks that share an artist and a version stem.

    A family needs two tracks and at least one version suffix. The same
    title with no suffix is not a family. A remix whose stem differs is
    not included. An empty catalog returns no groups.

    Args:
        catalog: Tracks in one space.

    Returns:
        Families in crate-name order. Tracks inside a family are in asset
        id order.
    """
    buckets: dict[tuple[str, str], list[related.CatalogTrack]] = {}
    for track in catalog:
        artist_key = _collapse(track.artist)
        title_stem = stem(track.title)
        if not artist_key or not title_stem:
            continue
        buckets.setdefault((artist_key, title_stem), []).append(track)
    families: list[Family] = []
    for tracks in buckets.values():
        if len(tracks) < 2:
            continue
        if not any(has_version_marker(track.title) for track in tracks):
            continue
        ordered = tuple(sorted(tracks, key=lambda track: track.asset_id))
        visibles = [_visible_title(track.title) for track in ordered]
        visibles = [title for title in visibles if title]
        short = min(visibles, key=lambda title: (len(title), title.casefold())) if visibles else ""
        title = short or ordered[0].title.strip() or "Untitled"
        families.append(
            Family(
                artist=ordered[0].artist,
                stem=stem(ordered[0].title),
                title=title,
                crate_name=crate_name_for(title),
                tracks=ordered,
            )
        )
    families.sort(key=lambda family: (family.crate_name.casefold(), family.artist.casefold()))
    return families


def _track_row(track: related.CatalogTrack) -> dict[str, object]:
    """Return one track for a preview payload.

    Args:
        track: Catalog track.

    Returns:
        ``id``, ``title``, and ``artist``.
    """
    return {"id": track.asset_id, "title": track.title, "artist": track.artist}


def _family_payload(family: Family) -> dict[str, object]:
    """Return one family for the JSON body.

    Args:
        family: Suggested group.

    Returns:
        Artist, stem, crate name, and track ids. The note that apply
        stores is ``version``.
    """
    return {
        "artist": family.artist,
        "stem": family.stem,
        "title": family.title,
        "crate_name": family.crate_name,
        "note": VERSION_NOTE,
        "track_ids": [track.asset_id for track in family.tracks],
        "tracks": [_track_row(track) for track in family.tracks],
    }


def _require_space(space: str) -> None:
    """Reject a space this library does not edit.

    Args:
        space: Requested space name.

    Raises:
        LibraryError: If the space is not allowed.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")


def _families(space: str) -> list[Family]:
    """Read one space and group it.

    Args:
        space: Allowed space name.

    Returns:
        The families. An empty library returns none.

    Raises:
        LibraryError: If the space is not allowed or the library cannot
            be read.
    """
    _require_space(space)
    return group_tracks(related.load_catalog(space))


def _ro(path: object) -> sqlite3.Connection:
    """Open a SQLite file without writing it.

    Args:
        path: Database path.

    Returns:
        A read-only connection. The caller closes it.
    """
    database = Path(path)
    uri = "file:" + database.resolve().as_posix() + "?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.execute("PRAGMA query_only=ON")
    return conn


def _linked_pairs() -> set[frozenset[str]]:
    """Return mutual version links already stored.

    Returns:
        Pairs of canonical paths whose note is ``version``. Missing file
        means there are none. The sidecar file is not created.
    """
    database = related.related_db_path()
    if not database.is_file():
        return set()
    pairs: set[frozenset[str]] = set()
    conn = _ro(database)
    try:
        rows = conn.execute(
            """
            SELECT a.path, b.path, l.note, l.mutual
            FROM link l
            JOIN track a ON a.id = l.from_track_id
            JOIN track b ON b.id = l.to_track_id
            """
        ).fetchall()
    finally:
        conn.close()
    for left, right, note, mutual in rows:
        if note != VERSION_NOTE or mutual != 1:
            continue
        if not isinstance(left, str) or not isinstance(right, str):
            continue
        try:
            pairs.add(frozenset((related.identity_path(left), related.identity_path(right))))
        except library.LibraryError:
            continue
    return pairs


def _missing_pairs(family: Family, linked: set[frozenset[str]]) -> list[tuple[related.CatalogTrack, related.CatalogTrack]]:
    """Return track pairs that still need a version link.

    Args:
        family: One group.
        linked: Pairs already stored as mutual ``version`` links.

    Returns:
        Pairs in asset id order. A track with no path is skipped.
    """
    missing: list[tuple[related.CatalogTrack, related.CatalogTrack]] = []
    tracks = family.tracks
    for index, source in enumerate(tracks):
        if not source.path:
            continue
        for target in tracks[index + 1 :]:
            if not target.path:
                continue
            if frozenset((source.path, target.path)) in linked:
                continue
            missing.append((source, target))
    return missing


def _normal_crates(conn: sqlite3.Connection, space: str) -> list[tuple[int, str]]:
    """List normal crates in one space.

    Args:
        conn: Open read connection.
        space: Space name.

    Returns:
        ``(id, visible name)`` pairs.
    """
    rows = conn.execute(
        """
        SELECT c.id, c.name
        FROM container c
        JOIN space s ON s.id = c.space_id
        WHERE s.name = ? AND c.type = 1
        """,
        (space,),
    ).fetchall()
    found: list[tuple[int, str]] = []
    for row in rows:
        name = row[1] if isinstance(row[1], str) else ""
        found.append((int(row[0]), library.display_name(name)))
    return found


def _members(conn: sqlite3.Connection, crate_id: int) -> set[int]:
    """Return asset ids in one crate.

    Args:
        conn: Open read connection.
        crate_id: Container id.

    Returns:
        Asset ids linked through ``location_container``.
    """
    rows = conn.execute(
        """
        SELECT ca.asset_id
        FROM container_asset ca
        JOIN location_container lc ON lc.id = ca.location_container_id
        WHERE lc.container_id = ?
        """,
        (crate_id,),
    ).fetchall()
    return {int(row[0]) for row in rows if row[0] is not None}


def _crate_state(space: str, name: str, want: set[int]) -> tuple[int | None, set[int]]:
    """Find a crate with this visible name.

    Args:
        space: Space name.
        name: Visible crate name.
        want: Asset ids the family needs.

    Returns:
        The crate id and its members. The id is None when no crate has
        that name. A crate that already holds every wanted id wins over
        a partial one.
    """
    want_name = name.casefold()
    hits: list[tuple[int, set[int]]] = []
    with closing(library.read_conn()) as conn:
        for crate_id, visible in _normal_crates(conn, space):
            if visible.casefold() != want_name:
                continue
            hits.append((crate_id, _members(conn, crate_id)))
    for crate_id, members in hits:
        if want <= members:
            return crate_id, members
    if hits:
        return hits[0]
    return None, set()


def _link_pair(source: related.CatalogTrack, target: related.CatalogTrack, space: str) -> None:
    """Store one mutual version link.

    Args:
        source: First track.
        target: Second track.
        space: Space used to fill titles from the library.

    The note is exactly ``version``. ``master.sqlite`` is not written.
    """
    related.add_link(
        source.path,
        target.path,
        mutual=True,
        note=VERSION_NOTE,
        source_title=source.title,
        source_artist=source.artist,
        source_length_ms=source.length_ms,
        target_title=target.title,
        target_artist=target.artist,
        target_length_ms=target.length_ms,
        space=space,
    )


def _write_crate(space: str, family: Family) -> dict[str, object] | None:
    """Create or fill the Versions crate when members are missing.

    Args:
        space: Space name.
        family: Group to write.

    Returns:
        The crate result when a write ran. None when the crate already
        holds every track. No write runs in that case.

    Raises:
        LibraryError: If the crate write is refused.
        SeratoOpen: If Serato holds the library.
    """
    want = {track.asset_id for track in family.tracks}
    crate_id, members = _crate_state(space, family.crate_name, want)
    if crate_id is not None and want <= members:
        return None
    if crate_id is None:
        made = library.crate_action(
            {
                "action": "create",
                "space": space,
                "name": family.crate_name,
                "assets": [track.asset_id for track in family.tracks],
            }
        )
        return {"id": made.get("id"), "name": family.crate_name, "track_ids": [track.asset_id for track in family.tracks]}
    missing = [track.asset_id for track in family.tracks if track.asset_id not in members]
    for asset_id in missing:
        library.crate_action(
            {
                "action": "add",
                "space": space,
                "id": crate_id,
                "asset": asset_id,
            }
        )
    return {"id": crate_id, "name": family.crate_name, "track_ids": [track.asset_id for track in family.tracks]}


def preview(space: str = library.LIBRARY_SPACE) -> dict[str, object]:
    """List version families without writing.

    Args:
        space: Space name. Defaults to Serato Library.

    Returns:
        ``preview`` true, ``written`` false, and ``groups``. Each group
        has ``crate_name`` and ``track_ids``. An empty library has no
        groups.

    Raises:
        LibraryError: If the space is not allowed.
    """
    families = _families(space)
    return {
        "preview": True,
        "written": False,
        "groups": [_family_payload(family) for family in families],
    }


def apply(space: str = library.LIBRARY_SPACE) -> dict[str, object]:
    """Save version links and crates for every family that still needs them.

    Args:
        space: Space name. Defaults to Serato Library.

    Returns:
        ``written`` false when every family already has its links and its
        crate. Otherwise the crates that were written and the number of
        new links. Audio tags are not rewritten.

    Raises:
        LibraryError: If the space is not allowed or a crate write fails.
        SeratoOpen: If a crate write runs while Serato holds the library.
    """
    families = _families(space)
    linked = _linked_pairs()
    plan = [(family, _missing_pairs(family, linked)) for family in families]
    needs_crate = False
    for family, _pairs in plan:
        want = {track.asset_id for track in family.tracks}
        crate_id, members = _crate_state(space, family.crate_name, want)
        if crate_id is None or not want <= members:
            needs_crate = True
            break
    needs_links = any(pairs for _family, pairs in plan)
    if not needs_crate and not needs_links:
        return {
            "preview": False,
            "written": False,
            "groups": [_family_payload(family) for family in families],
            "crates": [],
            "links": 0,
        }
    crates: list[dict[str, object]] = []
    if needs_crate:
        for family, _pairs in plan:
            saved = _write_crate(space, family)
            if saved is not None:
                crates.append(saved)
    link_count = 0
    if needs_links:
        for family, pairs in plan:
            for source, target in pairs:
                _link_pair(source, target, space)
                link_count += 1
    return {
        "preview": False,
        "written": bool(crates or link_count),
        "groups": [_family_payload(family) for family in families],
        "crates": crates,
        "links": link_count,
    }


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/version-family`` request.

    Args:
        payload: ``action`` is ``preview`` or ``apply``. ``apply`` writes
            only when ``confirm`` is the boolean true. ``space`` is
            optional.

    Returns:
        The preview or apply body.

    Raises:
        LibraryError: If the action, the space, or ``confirm`` is invalid.
            ``apply`` without ``confirm`` true does not write.
        SeratoOpen: If a crate write runs while Serato holds the library.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    if kind == "preview":
        return preview(space)
    if kind == "apply":
        if payload.get("confirm") is not True:
            raise library.LibraryError(CONFIRM)
        return apply(space)
    raise library.LibraryError("That action is not available.")
