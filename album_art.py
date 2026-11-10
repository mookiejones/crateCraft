#!/usr/bin/env python3
"""Find tracks with no artwork and embed a Cover Art Archive image (#32).

``missing`` lists present files that ``tags.read_file_health`` says have
no cover. ``preview`` looks up MusicBrainz and Cover Art Archive and
returns JPEG/PNG thumbnails as data URLs. Nothing is written until
``embed`` with ``confirm`` true. That write goes through ``safe_write``
with the audio file snapshotted, is refused while Serato DJ is running,
and uses ``tags.embed_front_cover`` so Serato GEOB frames and FLAC
Vorbis comments stay as they are. Network calls go through ``fetch_url``,
which tests replace. Cover bytes are fetched only from Cover Art Archive
URLs built from a MusicBrainz release id.
"""

from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable, Mapping, Sequence
from pathlib import Path
from typing import Any

import app_config
import gig_check
import library
import library_health
import tags

Fetch = Callable[[str], tuple[int, bytes, str]]
Sleep = Callable[[float], None]

ALREADY = tags.ARTWORK_PRESENT
FORMAT = tags.ARTWORK_FORMAT
LOOKUP = "Cover lookup failed."
NO_COVER = "No cover was found for this track."
NO_SEARCH = "This track has no title or artist to search."
NOT_IMAGE = tags.ARTWORK_NOT_IMAGE
NEEDS_CONFIRM = "Confirm the cover before it is saved."
NEEDS_RELEASE = "Choose a cover before it is saved."
WRITE_FAILED = tags.ARTWORK_WRITE_FAILED
TIMEOUT_SECONDS = 10.0
IMAGE_LIMIT = 2 * 1024 * 1024
CANDIDATE_CAP = 3
MB_RECORDING_CAP = 5
MB_SEARCH = "https://musicbrainz.org/ws/2/recording/"
CAA_FRONT = "https://coverartarchive.org/release/{release_id}/front"
CAA_THUMB = "https://coverartarchive.org/release/{release_id}/front-250"
CONTACT = "https://github.com/mookiejones/crateCraft"
_RELEASE_ID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def _user_agent() -> str:
    """Return the User-Agent MusicBrainz requires."""
    return f"crateCraft/{app_config.APP_VERSION} ({CONTACT})"


def fetch_url(url: str) -> tuple[int, bytes, str]:
    """GET one URL. Tests replace this.

    Args:
        url: Absolute http(s) URL.

    Returns:
        Status, body (capped), and the Content-Type type token. Status 0
        means the request did not complete.
    """
    request = urllib.request.Request(
        url,
        headers={"User-Agent": _user_agent(), "Accept": "*/*"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = response.read(IMAGE_LIMIT + 1)
            if len(body) > IMAGE_LIMIT:
                return 413, b"", ""
            ctype = response.headers.get("Content-Type", "") or ""
            return int(response.status), body, ctype.split(";")[0].strip()
    except urllib.error.HTTPError as exc:
        try:
            exc.read(IMAGE_LIMIT)
        except OSError:
            pass
        exc.close()
        return int(exc.code), b"", ""
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        return 0, b"", ""


def missing(database: Path, space: str, crate_id: int | None = None) -> dict[str, object]:
    """List present files in the space, or one crate, that have no artwork.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        crate_id: A crate; its subcrates are included. None checks the space.

    Returns:
        ``space``, ``crate``, ``checked``, and ``tracks`` (the health
        ``no_artwork`` sample).

    Raises:
        library.LibraryError: Unknown space, a crate not in the space, or
            a database that cannot be opened read-only.
    """
    report = library_health.report(database, space, crate_id)
    section = report["no_artwork"]
    tracks = section["tracks"] if isinstance(section, dict) else []
    return {
        "space": report["space"],
        "crate": report["crate"],
        "checked": report["checked"],
        "tracks": tracks,
    }


def action(payload: Mapping[str, object], fetch: Fetch | None = None, sleep: Sleep | None = None) -> dict[str, object]:
    """Dispatch preview or embed from a POST body.

    Args:
        payload: JSON object. ``action`` is ``preview`` or ``embed``.
        fetch: Network GET. None uses :func:`fetch_url`.
        sleep: Pause before a MusicBrainz request. None uses ``time.sleep``.

    Returns:
        The preview or embed plan.

    Raises:
        library.LibraryError: A bad action, a missing track, a refused
            write, or a lookup that cannot run.
        library.SeratoOpen: Serato holds the library on embed.
    """
    kind = payload.get("action")
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise library.LibraryError("That space is not available here.")
    track_id = payload.get("id")
    if not isinstance(track_id, int) or isinstance(track_id, bool) or track_id <= 0:
        raise library.LibraryError("Track id is required.")
    if kind == "preview":
        return preview(Path(library.MASTER), space, track_id, fetch=fetch, sleep=sleep)
    if kind == "embed":
        release_id = payload.get("release_id")
        confirm = payload.get("confirm") is True
        return embed(
            space,
            track_id,
            release_id,
            confirm=confirm,
            fetch=fetch,
            sleep=sleep,
        )
    raise library.LibraryError("That action is not available.")


def preview(
    database: Path,
    space: str,
    track_id: int,
    fetch: Fetch | None = None,
    sleep: Sleep | None = None,
) -> dict[str, object]:
    """Look up covers for one track without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        track_id: Asset id in that space.
        fetch: Network GET.
        sleep: Pause before MusicBrainz.

    Returns:
        ``preview`` true, ``written`` false, the track fields, and
        ``candidates``. An empty list means nothing was found.

    Raises:
        library.LibraryError: The track is missing, the file is gone, the
            file already has art, the format cannot take art, there is
            nothing to search, or MusicBrainz could not be reached.
    """
    getter = fetch or fetch_url
    pause = sleep or time.sleep
    track = _load_track(database, space, track_id)
    _require_writable_file(track["path"])
    query = _search_query(str(track["name"]), str(track["artist"]), str(track["album"]))
    if query is None:
        raise library.LibraryError(NO_SEARCH, 400)
    try:
        recordings = _search_recordings(query, getter, pause)
    except LookupError as exc:
        raise library.LibraryError(LOOKUP, 400) from exc
    candidates = _candidates_from_recordings(recordings, getter)
    return _plan(track, candidates, written=False)


def embed(
    space: str,
    track_id: int,
    release_id: object,
    *,
    confirm: bool,
    fetch: Fetch | None = None,
    sleep: Sleep | None = None,
) -> dict[str, object]:
    """Preview, or write a Cover Art Archive front cover through ``safe_write``.

    Args:
        space: Space name.
        track_id: Asset id in that space.
        release_id: MusicBrainz release UUID.
        confirm: True performs the write. Any other value is a preview.
        fetch: Network GET.
        sleep: Unused on embed; accepted so the POST dispatcher can pass it.

    Returns:
        The plan. ``written`` is true only after a successful embed.

    Raises:
        library.LibraryError: A refused write, a missing cover, or a bad id.
        library.SeratoOpen: Serato holds the library.
    """
    del sleep
    getter = fetch or fetch_url
    track = _load_track(Path(library.MASTER), space, track_id)
    path = _require_writable_file(track["path"])
    if not isinstance(release_id, str) or _RELEASE_ID.match(release_id.strip()) is None:
        raise library.LibraryError(NEEDS_RELEASE, 400)
    chosen = release_id.strip().lower()
    image = _cover_bytes(chosen, getter, thumb=False)
    if image is None:
        raise library.LibraryError(NO_COVER, 400)
    blob, mime = image
    candidate = {
        "release_id": chosen,
        "title": track["album"] or track["name"],
        "artist": track["artist"],
        "mime": mime,
        "thumb": _data_url(blob, mime),
    }
    if not confirm:
        return _plan(track, [candidate], written=False)
    import safe_write

    def apply(_conn: Any, write: Any) -> dict[str, object]:
        write.set_target(track["name"] or track["file"] or "track")
        try:
            tags.embed_front_cover(path, blob)
        except tags.ArtworkWriteError as exc:
            raise library.LibraryError(exc.message, 400) from exc
        health = tags.read_file_health(str(path))
        if not health["artwork"]:
            raise safe_write.VerifyMismatch("The artwork was not written.")
        return _plan(track, [candidate], written=True)

    result = safe_write.run("album_art", track["name"] or track["file"] or "track", apply, extra_files=[path])
    result["written"] = True
    return result


def _load_track(database: Path, space: str, track_id: int) -> dict[str, str | int]:
    """Return one space asset and its resolved path.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        track_id: Asset id.

    Returns:
        ``id``, ``name``, ``artist``, ``album``, ``file``, and ``path``.

    Raises:
        library.LibraryError: Unknown space or a track not in that space.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        row = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.album, a.file_name, a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ? AND a.id = ?
            """,
            (space, track_id),
        ).fetchone()
    finally:
        conn.close()
    if row is None:
        raise library.LibraryError("Track is not in this space.", 404)
    stored = row["portable_id"] if isinstance(row["portable_id"], str) else None
    resolved = library.resolved_path(stored) if stored else None
    return {
        "id": int(row["id"]),
        "name": str(row["name"] or ""),
        "artist": str(row["artist"] or ""),
        "album": str(row["album"] or ""),
        "file": str(row["file_name"] or ""),
        "path": resolved or "",
    }


def _require_writable_file(stored: object) -> Path:
    """Return a real audio file that can take a cover.

    Args:
        stored: Resolved path string from ``_load_track``.

    Returns:
        The path.

    Raises:
        library.LibraryError: Missing, a shortcut, already has art, or
            a format this writer will not rewrite.
    """
    if not isinstance(stored, str) or not stored:
        raise library.LibraryError("That file is not on disk.", 400)
    path = Path(stored)
    try:
        if path.is_symlink() or not path.is_file():
            raise library.LibraryError("That file is not on disk.", 400)
    except OSError as exc:
        raise library.LibraryError("That file is not on disk.", 400) from exc
    health = tags.read_file_health(str(path))
    if health["artwork"]:
        raise library.LibraryError(ALREADY, 400)
    suffix = path.suffix.lower()
    with path.open("rb") as handle:
        head = handle.read(12)
    if head.startswith(b"fLaC") or suffix == ".mp3":
        return path
    raise library.LibraryError(FORMAT, 400)


def _search_query(name: str, artist: str, album: str) -> str | None:
    """Build a MusicBrainz Lucene query, or None when there is nothing to send.

    Args:
        name: Track title.
        artist: Artist.
        album: Album, optional.

    Returns:
        A query string, or None when title and artist are both blank.
    """
    parts: list[str] = []
    title = name.strip()
    who = artist.strip()
    release = album.strip()
    if title:
        parts.append(f"recording:{_lucene(title)}")
    if who:
        parts.append(f"artist:{_lucene(who)}")
    if release:
        parts.append(f"release:{_lucene(release)}")
    if not title and not who:
        return None
    return " AND ".join(parts)


def _lucene(text: str) -> str:
    """Quote a user field so it is one Lucene phrase.

    Args:
        text: Title, artist, or album.

    Returns:
        A double-quoted token with inner quotes removed.
    """
    cleaned = " ".join(text.replace('"', " ").split())
    return f'"{cleaned}"'


def _search_recordings(query: str, fetch: Fetch, sleep: Sleep) -> list[dict[str, object]]:
    """Search MusicBrainz recordings.

    Args:
        query: Lucene query.
        fetch: Network GET.
        sleep: Pause before the request.

    Returns:
        Recording objects, possibly empty.

    Raises:
        LookupError: The request did not return JSON.
    """
    params = urllib.parse.urlencode({"query": query, "fmt": "json", "limit": str(MB_RECORDING_CAP)})
    url = f"{MB_SEARCH}?{params}"
    sleep(1.0)
    status, body, _ctype = fetch(url)
    if status == 0 or status >= 500:
        raise LookupError(LOOKUP)
    if status != 200:
        return []
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise LookupError(LOOKUP) from exc
    if not isinstance(payload, dict):
        return []
    rows = payload.get("recordings")
    if not isinstance(rows, list):
        return []
    return [row for row in rows if isinstance(row, dict)]


def _candidates_from_recordings(recordings: Sequence[Mapping[str, object]], fetch: Fetch) -> list[dict[str, str]]:
    """Fetch Cover Art Archive thumbs for unique release ids.

    Args:
        recordings: MusicBrainz recording objects.
        fetch: Network GET.

    Returns:
        Up to ``CANDIDATE_CAP`` candidates with data-URL thumbs.
    """
    seen: set[str] = set()
    candidates: list[dict[str, str]] = []
    for recording in recordings:
        title = _credit_title(recording.get("title"))
        artist = _artist_credit(recording.get("artist-credit"))
        releases = recording.get("releases")
        if not isinstance(releases, list):
            continue
        for release in releases:
            if not isinstance(release, dict):
                continue
            raw_id = release.get("id")
            if not isinstance(raw_id, str) or _RELEASE_ID.match(raw_id) is None:
                continue
            release_id = raw_id.lower()
            if release_id in seen:
                continue
            seen.add(release_id)
            image = _cover_bytes(release_id, fetch, thumb=True)
            if image is None:
                continue
            blob, mime = image
            album = _credit_title(release.get("title")) or title
            who = _artist_credit(release.get("artist-credit")) or artist
            candidates.append(
                {
                    "release_id": release_id,
                    "title": album,
                    "artist": who,
                    "mime": mime,
                    "thumb": _data_url(blob, mime),
                }
            )
            if len(candidates) >= CANDIDATE_CAP:
                return candidates
    return candidates


def _cover_bytes(release_id: str, fetch: Fetch, *, thumb: bool) -> tuple[bytes, str] | None:
    """GET a Cover Art Archive front cover for one release id.

    Args:
        release_id: MusicBrainz UUID, already validated.
        fetch: Network GET.
        thumb: True uses the 250 px front. False uses the full front.

    Returns:
        Image bytes and MIME type, or None when CAA has no JPEG/PNG.
    """
    if _RELEASE_ID.match(release_id) is None:
        return None
    template = CAA_THUMB if thumb else CAA_FRONT
    url = template.format(release_id=release_id)
    if not url.startswith("https://coverartarchive.org/release/"):
        return None
    status, body, _ctype = fetch(url)
    if status != 200 or not body:
        return None
    mime = tags.image_mime(body)
    if mime is None:
        return None
    return body, mime


def _credit_title(value: object) -> str:
    """Return a stripped title string."""
    return value.strip() if isinstance(value, str) else ""


def _artist_credit(value: object) -> str:
    """Join MusicBrainz artist-credit names.

    Args:
        value: ``artist-credit`` list.

    Returns:
        A display name, possibly empty.
    """
    if not isinstance(value, list):
        return ""
    parts: list[str] = []
    for item in value:
        if isinstance(item, dict):
            name = item.get("name")
            join = item.get("joinphrase")
            if isinstance(name, str) and name.strip():
                parts.append(name.strip())
            if isinstance(join, str) and join:
                parts.append(join)
        elif isinstance(item, str) and item.strip():
            parts.append(item.strip())
    return "".join(parts).strip()


def _data_url(blob: bytes, mime: str) -> str:
    """Return a data URL for a preview ``<img>``.

    Args:
        blob: Image bytes.
        mime: ``image/jpeg`` or ``image/png``.

    Returns:
        A ``data:`` URL.
    """
    return f"data:{mime};base64,{base64.b64encode(blob).decode('ascii')}"


def _plan(track: Mapping[str, str | int], candidates: Sequence[Mapping[str, str]], *, written: bool) -> dict[str, object]:
    """Return the JSON object the page reads.

    Args:
        track: Fields from ``_load_track``.
        candidates: Cover choices.
        written: True after a successful embed.

    Returns:
        Preview or embed payload. Paths are omitted.
    """
    return {
        "preview": not written,
        "written": written,
        "id": int(track["id"]),
        "name": str(track["name"]),
        "artist": str(track["artist"]),
        "album": str(track["album"]),
        "file": str(track["file"]),
        "candidates": [dict(item) for item in candidates],
    }


def main(argv: Sequence[str] | None = None) -> int:
    """List tracks with no art, or print a preview for one id.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when JSON was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="List tracks with no artwork, or look up a cover. Lookup is read-only."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--crate", type=int, default=None)
    parser.add_argument("--id", type=int, default=None, help="Look up covers for this track id.")
    args = parser.parse_args(argv)
    try:
        if args.id is None:
            result = missing(args.database, args.space, args.crate)
        else:
            result = preview(args.database, args.space, args.id)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
