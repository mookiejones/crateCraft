"""Read a Serato ``master.sqlite`` schema without opening the live file.

``probe_database`` copies the file (and a ``-wal`` or ``-shm`` beside it)
into a temporary directory, then reads ``PRAGMA user_version`` and the
schema from that copy. The original is only read as bytes, and the probe
refuses when those bytes change.

The write gate uses :func:`read_user_version`, which reads the 4-byte
``user_version`` in the SQLite header. It does not open the database, so
it does not create ``-wal`` or ``-shm``.
"""

from __future__ import annotations

import hashlib
import shutil
import sqlite3
import tempfile
from pathlib import Path
from urllib.parse import quote

# Serato version -> PRAGMA user_version from a copied master.sqlite.
# 5.0.0's recorded probe is the path note in docs/serato-5-macos.md.
# That note did not include this number, so 5.0.0 is not checked here.
# 5.1.0 was read from a copied library (issue #471).
PROBED_USER_VERSIONS: dict[str, int] = {"5.1.0": 203}

SQLITE_MAGIC = b"SQLite format 3\x00"
_USER_VERSION_OFFSET = 60
_HEADER_BYTES = 64

# Columns crateCraft reads or writes on master.sqlite, with the type in the
# 5.1.0 dump. A writer that names one of these without a column check needs
# the type it already sends. ``file_bit_rate`` and ``file_sample_rate`` are
# read and are REAL; the test fixture declares them INTEGER.
TOUCHED_COLUMNS: dict[str, dict[str, str]] = {
    "lock": {
        "owner_process_id": "INTEGER",
        "owner_process_name": "TEXT",
    },
    "space": {
        "id": "INTEGER",
        "name": "TEXT",
    },
    "location": {
        "id": "INTEGER",
        "path": "TEXT",
    },
    "connection": {
        "location_id": "INTEGER",
        "database_uri": "TEXT",
    },
    "serato": {
        "database_name": "TEXT",
        "time_created": "INTEGER",
        "time_last_connected": "INTEGER",
        "last_host_id": "TEXT",
    },
    "container": {
        "id": "INTEGER",
        "parent_id": "INTEGER",
        "name": "TEXT",
        "type": "INTEGER",
        "list_order": "INTEGER",
        "space_id": "INTEGER",
        "time_added": "INTEGER",
        "expanded": "INTEGER",
        "portable_id": "TEXT",
        "color": "INTEGER",
    },
    "location_container": {
        "id": "INTEGER",
        "container_id": "INTEGER",
        "location_id": "INTEGER",
        "external_container_id": "INTEGER",
    },
    "space_asset": {
        "id": "INTEGER",
        "asset_id": "INTEGER",
        "space_id": "INTEGER",
    },
    "container_asset": {
        "id": "INTEGER",
        "asset_id": "INTEGER",
        "location_container_id": "INTEGER",
        "space_asset_id": "INTEGER",
        "external_container_asset_id": "INTEGER",
        "list_order": "INTEGER",
        "time_added": "INTEGER",
    },
    "smart_crate_rules": {
        "container_id": "INTEGER",
        "version": "INTEGER",
        "rules": "TEXT",
    },
    "dj_container_metadata": {
        "container_id": "INTEGER",
        "export_state": "INTEGER",
        "filename": "TEXT",
    },
    "dj_asset_metadata": {
        "asset_id": "INTEGER",
        "external_id": "INTEGER",
    },
    "updated_smart_crate": {
        "container_id": "INTEGER",
    },
    "asset": {
        "id": "INTEGER",
        "external_id": "INTEGER",
        "location_id": "INTEGER",
        "portable_id": "TEXT",
        "file_name": "TEXT",
        "file_size": "INTEGER",
        "file_bit_rate": "REAL",
        "file_sample_rate": "REAL",
        "type": "TEXT",
        "format": "TEXT",
        "artist": "TEXT",
        "color": "INTEGER",
        "comments": "TEXT",
        "grouping": "TEXT",
        "remixer": "TEXT",
        "name": "TEXT",
        "album": "TEXT",
        "composer": "TEXT",
        "year": "TEXT",
        "genre": "TEXT",
        "key": "TEXT",
        "label": "TEXT",
        "bpm": "REAL",
        "length_sec": "INTEGER",
        "length_ms": "INTEGER",
        "time_added": "INTEGER",
        "time_modified": "INTEGER",
        "is_corrupt": "INTEGER",
        "is_missing": "INTEGER",
        "is_readonly": "INTEGER",
        "is_beatgrid_locked": "INTEGER",
        "is_stale": "INTEGER",
        "is_whitelabel": "INTEGER",
        "is_karaoke": "INTEGER",
        "dj_play_count": "INTEGER",
        "dj_recently_played": "INTEGER",
        "analysis_flags": "INTEGER",
        "stems_analyze_state": "INTEGER",
        "key_value": "INTEGER",
        "rating": "REAL",
        "emoji": "TEXT",
        "import_id": "BLOB",
        "explicit": "INTEGER",
        "pending_tempo_map_analysis": "INTEGER",
    },
    "history_session": {
        "id": "INTEGER",
        "start_time": "INTEGER",
        "end_time": "INTEGER",
        "notes": "TEXT",
        "name": "TEXT",
    },
    "history_entry": {
        "id": "INTEGER",
        "session_id": "INTEGER",
        "asset_id": "INTEGER",
        "name": "TEXT",
        "artist": "TEXT",
        "album": "TEXT",
        "bpm": "REAL",
        "key": "TEXT",
        "length_ms": "INTEGER",
        "start_time": "INTEGER",
        "end_time": "INTEGER",
        "played": "INTEGER",
        "deck": "TEXT",
        "notes": "TEXT",
        "file_name": "TEXT",
        "is_missing": "INTEGER",
    },
}

# Columns the test fixture adds that the 5.1.0 master does not have.
# Writers skip these when PRAGMA table_info does not list them.
ABSENT_ON_510: dict[str, tuple[str, ...]] = {
    "serato": ("revision",),
    "container": ("revision",),
    "container_asset": ("container_id", "revision"),
    "space_asset": ("revision",),
    "smart_crate_rules": ("needs_refresh", "revision"),
    "dj_container_metadata": ("revision",),
}


class ProbeError(Exception):
    """The probe could not read a copy, or it refused the path.

    The message does not include the filesystem path.
    """


def read_user_version(path: Path) -> int | None:
    """Read ``PRAGMA user_version`` from the SQLite file header.

    Args:
        path: Database file. The first 64 bytes are read. The file is not
            opened with ``sqlite3``, so no ``-wal`` or ``-shm`` is created.

    Returns:
        The big-endian integer at offset 60, or None when the file cannot
        be read or does not start with the SQLite magic. ``0`` is a real
        version and is returned as ``0``.
    """
    try:
        with path.open("rb") as handle:
            header = handle.read(_HEADER_BYTES)
    except OSError:
        return None
    if len(header) < _HEADER_BYTES or not header.startswith(SQLITE_MAGIC):
        return None
    return int.from_bytes(header[_USER_VERSION_OFFSET:_USER_VERSION_OFFSET + 4], "big")


def probe_database(path: Path) -> dict[str, object]:
    """Copy a database and return its schema and ``user_version``.

    Args:
        path: Database file. A symlink, a directory, and a missing path are
            refused before anything is copied. A ``-wal`` or ``-shm`` that
            is itself a symlink is refused.

    Returns:
        ``file`` (the basename), ``user_version``, ``schema_version``, and
        ``schema`` (the ``CREATE`` text from the copy).

    Raises:
        ProbeError: If the path is refused, the copy cannot be read, or the
            original bytes or mtime change while the copy is open.
    """
    source = Path(path)
    if source.is_symlink():
        raise ProbeError("Refusing a symlink.")
    if not source.is_file():
        raise ProbeError("That database is not a file.")
    before = _fingerprint(source)
    sidecars: list[tuple[Path, tuple[int, int, str]]] = []
    for suffix in ("-wal", "-shm"):
        side = Path(str(source) + suffix)
        if side.is_symlink():
            raise ProbeError("Refusing a symlink.")
        if side.exists() and not side.is_file():
            raise ProbeError("That database is not a file.")
        if side.is_file():
            sidecars.append((side, _fingerprint(side)))
    try:
        report = _probe_copy(source, sidecars)
    finally:
        _require_unchanged(source, before)
        for side, fingerprint in sidecars:
            _require_unchanged(side, fingerprint)
    return report


def _probe_copy(
    source: Path,
    sidecars: list[tuple[Path, tuple[int, int, str]]],
) -> dict[str, object]:
    """Read schema pragmas from a temporary copy.

    Args:
        source: Original database. It is copied and not passed to sqlite.
        sidecars: ``-wal`` and ``-shm`` files already fingerprinted.

    Returns:
        The probe record.

    Raises:
        ProbeError: If the copy cannot be read.
    """
    with tempfile.TemporaryDirectory(prefix="serato5-probe-") as tmp:
        root = Path(tmp)
        dest = root / source.name
        shutil.copy2(source, dest)
        for side, _fingerprint_value in sidecars:
            shutil.copy2(side, root / side.name)
        uri = _read_only_uri(dest)
        try:
            conn = sqlite3.connect(uri, uri=True)
        except sqlite3.Error as exc:
            raise ProbeError("The copy could not be read.") from exc
        try:
            conn.execute("PRAGMA query_only=ON")
            user_version = conn.execute("PRAGMA user_version").fetchone()
            schema_version = conn.execute("PRAGMA schema_version").fetchone()
            rows = conn.execute(
                "SELECT sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type, name"
            ).fetchall()
        except sqlite3.Error as exc:
            raise ProbeError("The copy could not be read.") from exc
        finally:
            conn.close()
    if user_version is None or schema_version is None:
        raise ProbeError("The copy could not be read.")
    schema = "\n".join(str(row[0]) for row in rows)
    return {
        "file": source.name,
        "user_version": int(user_version[0]),
        "schema_version": int(schema_version[0]),
        "schema": schema,
    }


def _read_only_uri(path: Path) -> str:
    """Return a ``mode=ro`` URI for a copied database.

    Args:
        path: Copy inside the temporary directory.

    Returns:
        An absolute ``file://`` URI. The path is escaped so a space cannot
        end the URI early. A Windows drive letter gets an empty authority.
    """
    posix = path.resolve().as_posix()
    if len(posix) >= 2 and posix[1] == ":":
        posix = "/" + posix
    return "file://" + quote(posix, safe="/:") + "?mode=ro"


def _fingerprint(path: Path) -> tuple[int, int, str]:
    """Hash a file and record its size and mtime.

    Args:
        path: File to read. It is not opened with sqlite.

    Returns:
        Size, ``st_mtime_ns``, and the SHA-256 hex digest.

    Raises:
        ProbeError: If the file cannot be read.
    """
    digest = hashlib.sha256()
    try:
        stat = path.stat()
        with path.open("rb") as handle:
            while True:
                chunk = handle.read(1024 * 1024)
                if not chunk:
                    break
                digest.update(chunk)
    except OSError as exc:
        raise ProbeError("That database could not be read.") from exc
    return (stat.st_size, stat.st_mtime_ns, digest.hexdigest())


def _require_unchanged(path: Path, fingerprint: tuple[int, int, str]) -> None:
    """Refuse when a file's bytes or mtime changed.

    Args:
        path: File that was fingerprinted before the copy was opened.
        fingerprint: Size, mtime, and SHA-256 from before the probe.

    Raises:
        ProbeError: If the fingerprint does not match.
    """
    if _fingerprint(path) != fingerprint:
        raise ProbeError("The original database changed while it was copied.")
