#!/usr/bin/env python3
"""Find smart crates that lost their rules, and put those rules back (#489).

A read-only scan lists type-2 containers with no ``smart_crate_rules`` row,
or a row whose rules text is blank. The library is opened through
``gig_check.open_read_only``, which copies ``master.sqlite`` first, so the
scan does not create ``-wal`` or ``-shm`` and does not change the file's
mtime.

A confirmed repair writes only the selected crates' rules, through
``safe_write``, and only while Serato is quit and the version gate allows
it. Probed Serato 5.1.0 is that gate: a version that is not probed, or a
5.1.0 library whose ``user_version`` is not 203, does not write. The rules
text is copied as stored. A backup, snapshot, sandbox copy, or the drive
database is preferred over a portable ``.scrate``, because the database
text keeps fields this app does not decode. A ``.scrate`` is used only
when no database copy still has the rules, and only when every rule in
that file maps onto the native model. Anything else is listed as
unrestorable. Rules are not invented.

After the write, the rules row is read back. A miss rolls the snapshot
back. Re-running the scan does not write.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import tempfile
import time
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import gig_check
import library
import portable_smart
import serato_web.completeness as completeness
import snapshots
from library import LibraryError

STILL_MISSING = "The smart-crate rules are still missing."
_ACTIONS = frozenset({"preview", "apply", "undo"})
_DATABASE_KINDS = frozenset({"snapshot", "backup", "sandbox", "mirror"})


@dataclass(frozen=True)
class _Source:
    """One place a missing rules blob might still exist."""

    kind: str
    at: float
    shown: str
    rules: Mapping[str, str]
    priority: int


def _text(value: object) -> str:
    """Return a stripped string, or an empty one.

    Args:
        value: A stored column.

    Returns:
        The stripped text, or ``""``.
    """
    return value.strip() if isinstance(value, str) else ""


def _present(value: object) -> bool:
    """Return whether a rules column still holds text.

    Args:
        value: ``smart_crate_rules.rules``.

    Returns:
        True when the value is a non-blank string.
    """
    return isinstance(value, str) and bool(value.strip())


def _parse_ids(raw: object) -> list[int] | None:
    """Return unique crate ids, or None when the request names none.

    Args:
        raw: Request ``ids``. Missing or null is None.

    Returns:
        Deduplicated ids in first-seen order, or None.

    Raises:
        LibraryError: The value is present and is not a list of whole
            numbers (400).
    """
    if raw is None:
        return None
    if not isinstance(raw, list):
        raise LibraryError("That request is not valid.", 400)
    unique: list[int] = []
    seen: set[int] = set()
    for item in raw:
        if isinstance(item, bool) or not isinstance(item, int):
            raise LibraryError("That request is not valid.", 400)
        if item in seen:
            continue
        seen.add(item)
        unique.append(item)
    return unique


def _iso(stamp: float) -> str:
    """Format a Unix time as UTC text.

    Args:
        stamp: Seconds since the epoch.

    Returns:
        ``YYYY-MM-DDTHH:MM:SSZ``. An invalid stamp is an empty string.
    """
    if stamp != stamp or stamp < 0:
        return ""
    try:
        moment = datetime.fromtimestamp(stamp, timezone.utc)
    except (OverflowError, OSError, ValueError):
        return ""
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_iso(text: str) -> float:
    """Parse a snapshot timestamp.

    Args:
        text: ISO-8601 text from a snapshot manifest, with a ``Z`` suffix.

    Returns:
        Seconds since the epoch, or 0 when the text does not parse.
    """
    raw = text.strip()
    if raw.endswith("Z"):
        raw = raw[:-1]
    for pattern in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
        try:
            moment = datetime.strptime(raw, pattern).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        return moment.timestamp()
    return 0.0


def _keys(portable: str, filename: str) -> list[str]:
    """Return lookup keys for one crate, exact id first.

    Args:
        portable: ``container.portable_id``. Blank is skipped.
        filename: Export name such as ``Warmup.scrate``.

    Returns:
        Keys. A case-folded id follows the exact id. The filename is
        case-folded so a drive file and the library can still meet.
    """
    found: list[str] = []
    token = portable.strip()
    if token:
        found.append("portable:" + token)
        found.append("portable-fold:" + token.casefold())
    if filename:
        found.append("file:" + filename.casefold())
    return found


def _remember(index: dict[str, str], key: str, rules: str) -> None:
    """Store one rules blob without replacing an earlier copy.

    Args:
        index: Keys to exact rules text.
        key: Lookup key.
        rules: Rules column text.
    """
    if key and rules and key not in index:
        index[key] = rules


def _index_rules(conn: sqlite3.Connection) -> dict[str, str]:
    """Index smart-crate rules by portable id and export filename.

    Args:
        conn: Open read-only connection. It is not written.

    Returns:
        Lookup keys to the exact ``rules`` text. A blank rules value is
        left out. A database with no rules table is empty.
    """
    index: dict[str, str] = {}
    tables = library._tables(conn)  # pyright: ignore[reportPrivateUsage]
    if "container" not in tables or "smart_crate_rules" not in tables:
        return index
    rows = conn.execute(
        """
        SELECT c.id, c.portable_id, r.rules
        FROM container c
        JOIN smart_crate_rules r ON r.container_id = c.id
        WHERE c.type = 2
        """
    ).fetchall()
    for row in rows:
        rules = row["rules"]
        if not _present(rules):
            continue
        text = str(rules)
        portable = _text(row["portable_id"])
        filename = ""
        try:
            filename = library._filename(conn, int(row["id"]), 2)  # pyright: ignore[reportPrivateUsage]
        except (LibraryError, sqlite3.Error, TypeError, ValueError):
            filename = ""
        for key in _keys(portable, filename):
            _remember(index, key, text)
    return index


def _index_database(path: Path) -> dict[str, str]:
    """Index rules in a database copy.

    Args:
        path: ``master.sqlite`` or ``root.sqlite``. A shortcut is skipped.

    Returns:
        The rules index. An unreadable file is empty. The file is not
        opened in place.
    """
    if path.is_symlink() or not path.is_file():
        return {}
    try:
        with library.copied_read_conn(path) as conn:
            return _index_rules(conn)
    except (LibraryError, OSError, sqlite3.Error):
        return {}


def _index_bytes(data: bytes) -> dict[str, str]:
    """Index rules in a snapshot's database bytes.

    Args:
        data: ``master.sqlite`` bytes from a snapshot.

    Returns:
        The rules index. The bytes are written under a temporary directory
        and opened from that copy.
    """
    if not data.startswith(b"SQLite format 3"):
        return {}
    try:
        with tempfile.TemporaryDirectory(prefix="cratecraft-smart-") as raw:
            path = Path(raw) / "master.sqlite"
            path.write_bytes(data)
            return _index_database(path)
    except OSError:
        return {}


def _real_dir(path: Path) -> bool:
    """Return whether a path is a real directory.

    Args:
        path: Candidate.

    Returns:
        True when it is a directory and not a shortcut.
    """
    return path.is_dir() and not path.is_symlink()


def _contained(root: Path, path: Path) -> bool:
    """Return whether a path stays inside a directory.

    Args:
        root: Directory that must contain ``path``.
        path: File or directory to check.

    Returns:
        True when the resolved path is ``root`` or a descendant.
    """
    try:
        path.resolve().relative_to(root.resolve())
    except (OSError, ValueError):
        return False
    return True


def _scrates_under(folder: Path, root: Path) -> list[Path]:
    """List ``.scrate`` files in one folder, without following shortcuts.

    Args:
        folder: ``SmartCrates`` directory.
        root: Directory the folder must stay inside.

    Returns:
        Regular ``.scrate`` files. A shortcut file is skipped.
    """
    if not _real_dir(folder) or not _contained(root, folder):
        return []
    found: list[Path] = []
    try:
        children = list(folder.iterdir())
    except OSError:
        return []
    for path in children:
        if path.is_symlink() or not path.is_file():
            continue
        if path.suffix.casefold() != ".scrate":
            continue
        if not _contained(root, path):
            continue
        found.append(path)
    return found


def _snapshot_sources(master: Path) -> list[_Source]:
    """Read rules from finished snapshots, newest data kept as stored.

    Args:
        master: Live ``master.sqlite``. The snapshot store beside it is
            only read. ``recover`` is false, so opening the store does not
            roll a journal back.

    Returns:
        One source per snapshot that has a database copy.
    """
    try:
        store = snapshots.SnapshotStore(master, drives=[], recover=False)
        listed = store.list_snapshots()
    except (OSError, snapshots.SnapshotError):
        return []
    found: list[_Source] = []
    for info in listed:
        try:
            data = store.database_bytes(str(info["id"]))
        except (OSError, snapshots.SnapshotError, sqlite3.Error, TypeError, ValueError):
            continue
        if not data:
            continue
        shown = str(info.get("created") or "")
        found.append(_Source("snapshot", _parse_iso(shown), shown, _index_bytes(data), 4))
    return found


def _backup_sources(master: Path) -> list[_Source]:
    """Read rules from finished and legacy library backups.

    Args:
        master: Live ``master.sqlite``.

    Returns:
        One source per backup folder that still has ``master.sqlite``.
        The snapshot store and the sandbox folder are not included here.
    """
    parent = master.resolve().parent / "Backups"
    if not _real_dir(parent):
        return []
    found: list[_Source] = []
    try:
        children = list(parent.iterdir())
    except OSError:
        return []
    for child in children:
        if child.name in {"snapshots", "sandbox"}:
            continue
        if not _real_dir(child):
            continue
        try:
            status = completeness.backup_status(child)
        except OSError:
            continue
        if status not in {"complete", completeness.LEGACY_STATUS}:
            continue
        database = child / "master.sqlite"
        if database.is_symlink() or not database.is_file() or not _contained(child, database):
            continue
        try:
            when = database.stat().st_mtime
        except OSError:
            continue
        found.append(_Source("backup", when, _iso(when), _index_database(database), 3))
    return found


def _sandbox_source(master: Path) -> _Source | None:
    """Read rules from ``Backups/sandbox/master.sqlite`` when that file exists.

    Args:
        master: Live ``master.sqlite``.

    Returns:
        The sandbox source, or None. A shortcut is not followed. The
        sandbox profile in #366 is not built; this only reads a database
        a profile would leave in that folder.
    """
    folder = master.resolve().parent / "Backups" / "sandbox"
    database = folder / "master.sqlite"
    if not _real_dir(folder) or database.is_symlink() or not database.is_file():
        return None
    if not _contained(folder, database):
        return None
    try:
        when = database.stat().st_mtime
    except OSError:
        return None
    return _Source("sandbox", when, _iso(when), _index_database(database), 2)


def _mirror_source(master: Path) -> _Source | None:
    """Read rules from ``root.sqlite`` beside the library.

    Args:
        master: Live ``master.sqlite``.

    Returns:
        The drive-database source, or None. The file is copied before it
        is opened.
    """
    database = master.resolve().parent / "root.sqlite"
    if database.is_symlink() or not database.is_file():
        return None
    try:
        when = database.stat().st_mtime
    except OSError:
        return None
    return _Source("mirror", when, _iso(when), _index_database(database), 1)


def _rules_from_scrate(data: bytes, space: str) -> str | None:
    """Rebuild native rules JSON from a portable ``.scrate``.

    Args:
        data: File bytes.
        space: Space name stored on the blob.

    Returns:
        Compact JSON, or None when any rule does not map. An unknown
        field is not dropped into a shorter rule list.
    """
    parsed = portable_smart.read_scrate(data)
    if parsed.get("mode") != "smart":
        return None
    rules = parsed.get("rules")
    if not isinstance(rules, list) or not rules:
        return None
    conjunction = parsed.get("conjunction")
    if conjunction not in {"AND", "OR"}:
        return None
    live = parsed.get("live_updates")
    blob = {
        "spaces": [space],
        "conjunction": conjunction,
        "live_updates": True if not isinstance(live, bool) else live,
        "rules": [dict(item) for item in rules if isinstance(item, Mapping)],
    }
    if len(blob["rules"]) != len(rules):  # type: ignore[arg-type]
        return None
    return json.dumps(blob, ensure_ascii=False, separators=(",", ":"))


def _scrate_source(path: Path, space: str, root: Path) -> _Source | None:
    """Read one ``.scrate`` when every rule maps.

    Args:
        path: Crate file.
        space: Space name stored on the rebuilt blob.
        root: Directory the file must stay inside.

    Returns:
        A rules source, or None.
    """
    if path.is_symlink() or not path.is_file() or not _contained(root, path):
        return None
    try:
        data = path.read_bytes()
        when = path.stat().st_mtime
    except OSError:
        return None
    text = _rules_from_scrate(data, space)
    if text is None:
        return None
    return _Source("rules", when, _iso(when), {"file:" + path.name.casefold(): text}, 0)


def _drive_rule_sources(space: str) -> list[_Source]:
    """Read portable smart crates on connected drives.

    Args:
        space: Space name stored on a rebuilt blob.

    Returns:
        One source per ``.scrate`` whose rules all map. An unplugged
        drive is skipped.
    """
    found: list[_Source] = []
    try:
        specs = library._discovered_drives()  # pyright: ignore[reportPrivateUsage]
    except (LibraryError, OSError, sqlite3.Error):
        return found
    for spec in specs:
        if not spec.present or spec.serato_root is None:
            continue
        root = Path(spec.serato_root)
        if not _real_dir(root):
            continue
        for name in ("SmartCrates", "Subcrates"):
            for path in _scrates_under(root / name, root):
                source = _scrate_source(path, space, root)
                if source is not None:
                    found.append(source)
    return found


def _backup_rule_sources(master: Path, space: str) -> list[_Source]:
    """Read ``.scrate`` files saved inside a library backup's drive copy.

    Args:
        master: Live ``master.sqlite``.
        space: Space name stored on a rebuilt blob.

    Returns:
        One source per mapped file under ``Backups/*/drives``.
    """
    parent = master.resolve().parent / "Backups"
    if not _real_dir(parent):
        return []
    found: list[_Source] = []
    try:
        children = list(parent.iterdir())
    except OSError:
        return []
    for child in children:
        drives = child / "drives"
        if not _real_dir(drives) or not _contained(parent, drives):
            continue
        try:
            drive_dirs = list(drives.iterdir())
        except OSError:
            continue
        for drive in drive_dirs:
            if not _real_dir(drive) or not _contained(drives, drive):
                continue
            for folder in (drive / "SmartCrates", drive / "_Serato_" / "SmartCrates", drive / "Subcrates"):
                for path in _scrates_under(folder, drive):
                    source = _scrate_source(path, space, drive)
                    if source is not None:
                        found.append(source)
    return found


def _sources(master: Path, space: str) -> list[_Source]:
    """Collect every rules source for one library.

    Args:
        master: Live ``master.sqlite``. It is not opened here.
        space: Space name used when a ``.scrate`` is rebuilt.

    Returns:
        Database copies first in the list, then saved rule files. Choice
        uses the timestamp, not this order.
    """
    found = _snapshot_sources(master)
    found.extend(_backup_sources(master))
    sandbox = _sandbox_source(master)
    if sandbox is not None:
        found.append(sandbox)
    mirror = _mirror_source(master)
    if mirror is not None:
        found.append(mirror)
    found.extend(_drive_rule_sources(space))
    found.extend(_backup_rule_sources(master, space))
    return found


def _lookup(source: _Source, keys: Sequence[str]) -> str | None:
    """Return the rules text a source has for one crate.

    Args:
        source: One backup, sandbox, or saved file.
        keys: Lookup keys, exact id first.

    Returns:
        The exact rules text, or None.
    """
    for key in keys:
        text = source.rules.get(key)
        if text:
            return text
    return None


def _choose(sources: Sequence[_Source], keys: Sequence[str]) -> tuple[str, _Source] | None:
    """Pick the newest database copy that still has these rules.

    Args:
        sources: Candidates.
        keys: Lookup keys for one broken crate.

    Returns:
        The rules text and its source. A saved ``.scrate`` is used only
        when no database copy has the rules. None when nothing matches.
    """
    chosen: tuple[str, _Source] | None = None
    rank: tuple[float, int] | None = None
    for kind_set in (_DATABASE_KINDS, frozenset({"rules"})):
        for source in sources:
            if source.kind not in kind_set:
                continue
            text = _lookup(source, keys)
            if text is None:
                continue
            source_rank = (source.at, source.priority)
            if rank is None or source_rank > rank:
                chosen = (text, source)
                rank = source_rank
        if chosen is not None:
            return chosen
    return None


def _broken_rows(conn: sqlite3.Connection, space: str) -> list[dict[str, object]]:
    """List type-2 crates in one space whose rules row is missing or blank.

    Args:
        conn: Open connection. It is not written.
        space: Space name.

    Returns:
        One row per broken crate, without a source yet. ``reason`` is
        ``missing_table`` when ``smart_crate_rules`` does not exist, and
        ``missing_rules`` otherwise.
    """
    tables = library._tables(conn)  # pyright: ignore[reportPrivateUsage]
    if "container" not in tables or "space" not in tables:
        return []
    has_rules = "smart_crate_rules" in tables
    rows = conn.execute(
        """
        SELECT c.id, c.name, c.portable_id
        FROM container c
        JOIN space s ON s.id = c.space_id
        WHERE s.name = ? AND c.type = 2
        ORDER BY c.list_order, c.id
        """,
        (space,),
    ).fetchall()
    found: list[dict[str, object]] = []
    for row in rows:
        crate_id = int(row["id"])
        rules: object = None
        if has_rules:
            stored = conn.execute(
                "SELECT rules FROM smart_crate_rules WHERE container_id = ?",
                (crate_id,),
            ).fetchone()
            rules = None if stored is None else stored["rules"]
        if has_rules and _present(rules):
            continue
        filename = ""
        try:
            filename = library._filename(conn, crate_id, 2)  # pyright: ignore[reportPrivateUsage]
        except (LibraryError, sqlite3.Error, TypeError, ValueError):
            filename = ""
        names: list[str] = []
        try:
            names = library._ancestry(conn, crate_id)  # pyright: ignore[reportPrivateUsage]
        except (LibraryError, sqlite3.Error, TypeError, ValueError):
            names = []
        if not names:
            names = [library.display_name(_text(row["name"]))]
        found.append(
            {
                "id": crate_id,
                "name": names[-1],
                "path": " / ".join(names),
                "reason": "missing_rules" if has_rules else "missing_table",
                "portable": _text(row["portable_id"]),
                "filename": filename,
                "has_table": has_rules,
            }
        )
    return found


def _describe(row: Mapping[str, object], sources: Sequence[_Source]) -> dict[str, object]:
    """Attach the chosen source to one broken crate.

    Args:
        row: A row from :func:`_broken_rows`.
        sources: Rules sources. They are not written.

    Returns:
        The crate the page lists. ``rules`` is included only so a later
        write in this process can copy the exact text. A crate with no
        source, or no rules table to write into, is unrestorable.
    """
    keys = _keys(str(row["portable"]), str(row["filename"]))
    chosen = _choose(sources, keys) if row.get("has_table") else None
    body: dict[str, object] = {
        "id": row["id"],
        "name": row["name"],
        "path": row["path"],
        "reason": row["reason"],
        "restorable": chosen is not None,
        "source": None if chosen is None else chosen[1].kind,
        "source_at": None if chosen is None else (chosen[1].shown or None),
    }
    if chosen is not None:
        body["rules"] = chosen[0]
    return body


def _public_crate(row: Mapping[str, object]) -> dict[str, object]:
    """Drop the rules text from one crate before it is sent to the page.

    Args:
        row: A described crate.

    Returns:
        The same fields except ``rules``.
    """
    return {key: value for key, value in row.items() if key != "rules"}


def scan(database: Path, space: str, ids: list[int] | None = None) -> dict[str, object]:
    """List smart crates that lost their rules.

    Args:
        database: ``master.sqlite``.
        space: Space name, such as ``Serato Library``.
        ids: Crate ids to keep, or None for every broken crate.

    Returns:
        ``checked`` is the number of broken crates before ``ids`` filters
        them. ``crates`` lists ``id``, ``name``, ``path``, ``reason``
        (``missing_rules`` or ``missing_table``), ``restorable``,
        ``source`` (``snapshot``, ``backup``, ``sandbox``, ``mirror``,
        ``rules``, or null), and ``source_at``. ``preview`` is false.
        ``written`` is false.

    Raises:
        LibraryError: The space is unknown, or the database is missing or
            cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows = _broken_rows(conn, space)
    finally:
        conn.close()
    sources = _sources(Path(database), space)
    crates = [_describe(row, sources) for row in rows]
    checked = len(crates)
    if ids is not None:
        wanted = set(ids)
        crates = [item for item in crates if int(item["id"]) in wanted]
    return {
        "checked": checked,
        "crates": [_public_crate(item) for item in crates],
        "preview": False,
        "written": False,
        "snapshot_id": None,
    }


def _plan_rows(database: Path, space: str, ids: list[int] | None) -> tuple[int, list[dict[str, object]]]:
    """Return broken crates, including the rules text for a restorable one.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        ids: Crate ids to keep, or None for every broken crate.

    Returns:
        The unfiltered count and the described crates.

    Raises:
        LibraryError: The space is unknown, or the database cannot be read.
    """
    if space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    conn = gig_check.open_read_only(database)
    try:
        rows = _broken_rows(conn, space)
    finally:
        conn.close()
    sources = _sources(Path(database), space)
    crates = [_describe(row, sources) for row in rows]
    checked = len(crates)
    if ids is not None:
        wanted = set(ids)
        crates = [item for item in crates if int(item["id"]) in wanted]
    return checked, crates


def preview(database: Path, space: str, ids: list[int] | None = None) -> dict[str, object]:
    """Return the scan without writing.

    Args:
        database: ``master.sqlite``.
        space: Space name.
        ids: Crate ids to keep, or None for every broken crate.

    Returns:
        The scan with ``preview`` true and ``written`` false.

    Raises:
        LibraryError: The space is unknown, or the database cannot be read.
    """
    result = scan(database, space, ids)
    result["preview"] = True
    result["written"] = False
    return result


def _column_names(conn: sqlite3.Connection) -> set[str]:
    """Return ``smart_crate_rules`` column names.

    Args:
        conn: Open connection.

    Returns:
        Column names. Empty when the table is missing.
    """
    if "smart_crate_rules" not in library._tables(conn):  # pyright: ignore[reportPrivateUsage]
        return set()
    return set(library._columns(conn, "smart_crate_rules"))  # pyright: ignore[reportPrivateUsage]


def _put_rules(conn: sqlite3.Connection, crate_id: int, rules: str) -> None:
    """Insert the exact rules text when the row is missing or blank.

    Args:
        conn: Open write connection.
        crate_id: Smart crate id.
        rules: Exact rules text to store.

    Raises:
        LibraryError: The rules table does not exist.

    A row that already has rules is left unchanged. Other columns on a
    blank row stay as they are, except ``version`` when that column exists.
    """
    columns = _column_names(conn)
    if "rules" not in columns or "container_id" not in columns:
        raise LibraryError("This library has no smart-crate rules table.", 409)
    existing = conn.execute(
        "SELECT rules FROM smart_crate_rules WHERE container_id = ?",
        (crate_id,),
    ).fetchone()
    if existing is not None and _present(existing["rules"]):
        return
    if existing is None:
        fields = ["container_id", "rules"]
        values: list[object] = [crate_id, rules]
        if "version" in columns:
            fields.append("version")
            values.append(1)
        if "revision" in columns:
            fields.append("revision")
            values.append(int(time.time()))
        if "needs_refresh" in columns:
            fields.append("needs_refresh")
            values.append(1)
        names = ", ".join(fields)
        marks = ", ".join("?" for _ in fields)
        conn.execute(
            f"INSERT INTO smart_crate_rules ({names}) VALUES ({marks})",
            values,
        )
    else:
        sets = ["rules = ?"]
        values = [rules]
        if "version" in columns:
            sets.append("version = ?")
            values.append(1)
        values.append(crate_id)
        conn.execute(
            f"UPDATE smart_crate_rules SET {', '.join(sets)} WHERE container_id = ?",
            values,
        )
    library._mark_smart(conn, crate_id)  # pyright: ignore[reportPrivateUsage]


def _mirror_blank(conn: sqlite3.Connection, crate_id: int, rules: str) -> None:
    """Copy rules into the drive database when that row is missing or blank.

    Args:
        conn: Open master write connection.
        crate_id: Master container id.
        rules: Exact rules text.

    A drive database that already has rules is left as it was. A missing
    drive database is skipped.
    """
    external = library._external_ids(conn, [crate_id])  # pyright: ignore[reportPrivateUsage]
    root_path = library._location_paths(conn).get(3)  # pyright: ignore[reportPrivateUsage]
    if not external or root_path is None:
        return
    target = external[0]

    def apply(root: sqlite3.Connection) -> None:
        """Insert rules on the location crate when its row is blank.

        Args:
            root: Location database connection.
        """
        if "smart_crate_rules" not in library._tables(root):  # pyright: ignore[reportPrivateUsage]
            return
        columns = library._columns(root, "smart_crate_rules")  # pyright: ignore[reportPrivateUsage]
        if "rules" not in columns or "container_id" not in columns:
            return
        _put_rules(root, target, rules)

    library._with_location(root_path, apply)  # pyright: ignore[reportPrivateUsage]


def _fingerprint(conn: sqlite3.Connection) -> tuple[object, ...]:
    """Capture containers, members, and rules rows a repair must not change.

    Args:
        conn: Open connection.

    Returns:
        Container rows, member rows, and rules rows, in id order.
    """
    containers = conn.execute(
        """
        SELECT id, parent_id, name, type, list_order
        FROM container
        ORDER BY id
        """
    ).fetchall()
    members: list[object] = []
    if "container_asset" in library._tables(conn):  # pyright: ignore[reportPrivateUsage]
        members = conn.execute(
            """
            SELECT id, container_id, asset_id, list_order
            FROM container_asset
            ORDER BY id
            """
        ).fetchall()
    rules: list[object] = []
    if "smart_crate_rules" in library._tables(conn):  # pyright: ignore[reportPrivateUsage]
        rules = conn.execute(
            "SELECT container_id, rules FROM smart_crate_rules ORDER BY container_id"
        ).fetchall()
    return (
        [tuple(row) for row in containers],
        [tuple(row) for row in members],
        [(int(row[0]), row[1]) for row in rules],
    )


def apply(space: str, ids: list[int]) -> dict[str, object]:
    """Restore rules for the selected crates through ``safe_write``.

    Args:
        space: Space name.
        ids: Crate ids to restore. An empty list writes nothing.

    Returns:
        The scan of those ids. ``written`` is true only when a rules row
        was inserted. ``snapshot_id`` is set when a write was checked.
        ``rules`` is not included.

    Raises:
        LibraryError: The space is unknown, the rules did not read back,
            or the version gate refuses the library.
        SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    database = Path(library.MASTER)
    checked, crates = _plan_rows(database, space, ids)
    selected = [item for item in crates if item.get("restorable") and "rules" in item]
    if not ids or not selected:
        return {
            "checked": checked,
            "crates": [_public_crate(item) for item in crates],
            "preview": False,
            "written": False,
            "snapshot_id": None,
        }

    def run(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Insert still-missing rules and register the read-back.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict. ``written`` is false when every selected
            crate already has rules.
        """
        live = {int(item["id"]): item for item in _broken_rows(conn, space)}
        sources = _sources(database, space)
        expected: dict[int, str] = {}
        restored: list[dict[str, object]] = []
        before = _fingerprint(conn)
        for crate_id in ids:
            row = live.get(crate_id)
            if row is None or not row.get("has_table"):
                continue
            chosen = _choose(sources, _keys(str(row["portable"]), str(row["filename"])))
            if chosen is None:
                continue
            rules, source = chosen
            _put_rules(conn, crate_id, rules)
            _mirror_blank(conn, crate_id, rules)
            expected[crate_id] = rules
            described = _describe(row, sources)
            described["source"] = source.kind
            described["source_at"] = source.shown or None
            restored.append(_public_crate(described))
        if not expected:
            return {
                "checked": checked,
                "crates": restored,
                "preview": False,
                "written": False,
                "snapshot_id": None,
            }
        write.set_target("Broken smart crates")

        def check(
            copied: sqlite3.Connection,
            expected: dict[int, str] = expected,
            before: tuple[object, ...] = before,
        ) -> None:
            """Fail when a rules row is missing or another crate changed.

            Args:
                copied: Read-only connection to the temporary database copy.
                expected: Crate id to the rules text this write asked for.
                before: Containers, members, and rules from before the write.

            Raises:
                VerifyMismatch: The read-back does not match.
            """
            for crate_id, rules in expected.items():
                row = copied.execute(
                    "SELECT rules FROM smart_crate_rules WHERE container_id = ?",
                    (crate_id,),
                ).fetchone()
                if row is None or row[0] != rules:
                    raise safe_write.VerifyMismatch(STILL_MISSING)
                kind = copied.execute(
                    "SELECT type FROM container WHERE id = ?",
                    (crate_id,),
                ).fetchone()
                if kind is None or int(kind[0]) != 2:
                    raise safe_write.VerifyMismatch(STILL_MISSING)
            after = _fingerprint(copied)
            if after[0] != before[0] or after[1] != before[1]:
                raise safe_write.VerifyMismatch(STILL_MISSING)
            previous_rules = {int(item[0]): item[1] for item in before[2]}  # type: ignore[index,union-attr]
            current_rules = {int(item[0]): item[1] for item in after[2]}  # type: ignore[index,union-attr]
            for crate_id, rules in previous_rules.items():
                if crate_id in expected:
                    continue
                if current_rules.get(crate_id) != rules:
                    raise safe_write.VerifyMismatch(STILL_MISSING)
            for crate_id in expected:
                if current_rules.get(crate_id) != expected[crate_id]:
                    raise safe_write.VerifyMismatch(STILL_MISSING)

        write.check(check)
        return {
            "checked": checked,
            "crates": restored,
            "preview": False,
            "written": True,
            "snapshot_id": write.snapshot_id,
        }

    return safe_write.run("broken_smart", "Broken smart crates", run)


def undo(snapshot_id: object) -> dict[str, object]:
    """Put one repair preimage back.

    Args:
        snapshot_id: Id returned by a repair that wrote.

    Returns:
        The undo result. ``written`` is true.

    Raises:
        LibraryError: The id is missing or the preimage cannot be restored.
        SeratoOpen: If Serato DJ is open.
    """
    import safe_write

    if not isinstance(snapshot_id, str) or not snapshot_id.strip():
        raise LibraryError("The pre-write snapshot is missing.", 409)
    record = safe_write.undo_preimage(
        snapshot_id,
        operation="broken_smart_undo",
        target="Broken smart crates",
    )
    return {
        "ok": True,
        "action": "undo",
        "checked": 0,
        "crates": [],
        "preview": False,
        "written": True,
        "snapshot_id": snapshot_id,
        "operation": record,
    }


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/broken-smart`` request.

    Args:
        payload: ``action`` is ``preview``, ``apply``, or ``undo``.
            ``preview`` and ``apply`` take ``space`` and optional ``ids``.
            ``apply`` writes only when ``confirm`` is true and ``ids`` is
            a list. ``undo`` takes ``snapshot_id`` and ``confirm`` true.

    Returns:
        That action's result.

    Raises:
        LibraryError: The action or a field is not valid.
        SeratoOpen: If a write runs while Serato DJ is open.
    """
    kind = payload.get("action")
    if kind == "undo":
        if payload.get("confirm") is not True:
            raise LibraryError("That request is not valid.", 400)
        return undo(payload.get("snapshot_id"))
    space = payload.get("space") or library.LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    if kind not in _ACTIONS or not isinstance(kind, str):
        raise LibraryError("That action is not available.")
    ids = _parse_ids(payload.get("ids"))
    if kind == "preview" or payload.get("confirm") is not True:
        return preview(Path(library.MASTER), space, ids)
    if ids is None:
        raise LibraryError("That request is not valid.", 400)
    return apply(space, ids)


def main(argv: Sequence[str] | None = None) -> int:
    """Print the scan as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the scan was printed, 1 when the library could not be read.
    """
    import sys

    parser = argparse.ArgumentParser(
        description="List smart crates that lost their rules. Read-only."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        result = scan(args.database, args.space)
    except LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
