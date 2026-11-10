"""Read Serato session logs to see which library generation was opened.

Serato writes one session log under ``Music/_Serato_/Logs`` when a session
closes. Support describes the file name as the session date and the time
the session finished, and says the file names the Serato DJ Pro or Lite
version. A published note on the Serato 5 library says the lines marked
``[Library]`` name the database that session opened.

Serato DJ Pro 4.0.10 and 5.0.0 write glog lines such as ``Product name:
Serato DJ Pro, Version: 4.0.10 (4010213)`` or ``Version: 5.0.0 (5001251)``
and ``[Library] Opening library asynchronously with master database at
'…/master.sqlite'``. A later backup can name
``master.sqlite.in-progress-backup``; that suffix is not the library
file. ``Surface Version: 4.1`` is OpenGL, not Serato DJ. The parser also
accepts the published markers used in the older fixtures. A log that
does not match is unknown, so a write is refused instead of guessed.
Nothing here creates, edits, or deletes a log file.
"""

from __future__ import annotations

import os
import re
import sys
import threading
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import app_env

# Serato keeps about eleven session logs. A few extras still fit in one read.
_MAX_LOGS = 16
_EDGE = 256 * 1024
_SUFFIXES = frozenset({".log", ".txt"})
_DOTTED = re.compile(r"^[0-9]+(?:\.[0-9]+)*$")
_STAMP = re.compile(
    r"(?<!\d)(\d{4})[-_]?(\d{2})[-_]?(\d{2})\D+(\d{2})[-_.:]?(\d{2})[-_.:]?(\d{2})(?!\d)"
)
_VERSION_LINE = re.compile(
    r"(?i)\b(?:serato\s+dj(?:\s+(?:pro|lite))?|application\s+version|product\s+version)"
    r"(?:\s*,\s*version:)?"
    r"(?:\s+version)?"
    r"[\s:;._-]{0,8}"
    r"(\d+\.\d+(?:\.\d+){0,3})"
    r"(?!\d)"
)
_BUILD = re.compile(r"(?i)\bbuild\s+(\d+\.\d+(?:\.\d+){0,3})(?!\d)")
_PAREN_BUILD = re.compile(r"\((\d{5,})\)")
_PATH_TAIL = r"(?:master\.sqlite|database[ ]V2)(?![A-Za-z0-9._-])"
_CACHE_LOCK = threading.Lock()
_CACHE: tuple[tuple[object, ...], "LogRead"] | None = None
_PATH = re.compile(
    rf"""(?ix)
    (?:
        "(?P<double>[^"\r\n]*?{_PATH_TAIL})"
      | '(?P<single>[^'\r\n]*?{_PATH_TAIL})'
      | (?P<bare>(?:[A-Za-z]:[\\/]|/)(?:[^/\\\r\n]*[\\/])*[^/\\\r\n]*?{_PATH_TAIL})
    )
    """
)


@dataclass(frozen=True)
class LogRead:
    """What the newest session logs said about the library.

    ``state`` is ``missing`` when there is nothing to read, ``parsed`` when
    a dotted version was found, and ``unknown`` when a log had text but no
    dotted version. ``version`` is the version the write gate should trust:
    Serato 5 wins over a newer Serato 4 log. ``newest_version`` is the
    version in the newest log, which can be lower after a downgrade.
    """

    state: str
    version: str
    build: str
    newest_version: str
    downgrade: bool
    database: str
    database_path: str
    log_name: str
    mounted: bool | None

    @staticmethod
    def missing() -> LogRead:
        """Return the result for a folder that was not read.

        Returns:
            A missing read with no version and no database.
        """
        return LogRead("missing", "", "", "", False, "", "", "", None)


def home_logs_dir() -> Path:
    """Return the usual ``_Serato_/Logs`` folder.

    Returns:
        ``~/Music/_Serato_/Logs`` on macOS and Windows. The folder may
        not exist.
    """
    return Path.home() / "Music" / "_Serato_" / "Logs"


def session_directory() -> Path | None:
    """Return the logs folder this process may read, or None.

    ``CRATECRAFT_LOGS`` (or the older ``SERATO_LIBRARY_LOGS``) wins when it is absolute. A relative value is
    ignored. Otherwise the real logs are read only while this process is
    pointed at the live Serato library. A test library never reads them.

    Returns:
        The logs directory, or None when logs must be left alone.
    """
    override = (app_env.get("LOGS", "") or "").strip()
    if override:
        candidate = Path(override)
        return candidate if candidate.is_absolute() else None
    if not _using_live_library():
        return None
    return home_logs_dir()


def read_session_log() -> LogRead:
    """Read the session logs this process is allowed to open.

    Returns:
        The parsed logs, or a missing read when the folder is not used.
    """
    folder = session_directory()
    if folder is None:
        return LogRead.missing()
    return parse_logs(folder)


def parse_logs(directory: Path) -> LogRead:
    """Parse the newest session logs in one folder.

    A symlink for the folder is not followed. A symlink for a file is
    skipped. The ``[Library]`` path is taken only from the newest log that
    has text. The result is cached by that folder and each log file's
    mtime, because ``status`` polls this. The function only reads. It does
    not create or change files.

    Args:
        directory: The ``Logs`` folder, not its parent.

    Returns:
        A missing read when the folder is absent, empty, or not a real
        directory. A parsed or unknown read otherwise.
    """
    global _CACHE
    files = _log_files(directory)
    key = _cache_key(directory, files)
    with _CACHE_LOCK:
        if _CACHE is not None and _CACHE[0] == key:
            return _CACHE[1]
    read = _parse_listed(files)
    with _CACHE_LOCK:
        _CACHE = (key, read)
    return read


def _cache_key(directory: Path, files: list[Path]) -> tuple[object, ...]:
    """Return the cache key for one logs folder.

    Args:
        directory: The folder that was listed.
        files: Newest-first log files from that folder.

    Returns:
        The folder path plus each file's name and mtime. A new or edited
        log changes the key.
    """
    rows: list[tuple[str, int]] = []
    for path in files:
        try:
            rows.append((path.name, path.stat().st_mtime_ns))
        except OSError:
            rows.append((path.name, -1))
    return (str(directory), tuple(rows))


def _parse_listed(files: list[Path]) -> LogRead:
    """Parse an already listed, newest-first set of log files.

    Args:
        files: Regular log files. The first file with text is the newest
            session.

    Returns:
        A missing read when every file is empty. A parsed or unknown read
        otherwise.
    """
    if not files:
        return LogRead.missing()
    newest_version = ""
    newest_build = ""
    saw_newest = False
    five: tuple[str, str] | None = None
    first: tuple[str, str] | None = None
    database_path = ""
    log_name = ""
    any_text = False
    for path in files:
        text = _read_text(path)
        if not text.strip():
            continue
        any_text = True
        version, build = _first_version(text)
        if not saw_newest:
            saw_newest = True
            newest_version = version
            newest_build = build
            log_name = path.name
            # Older sessions must not name the database. Only this file does.
            database_path = _library_path(text)
        if version and _major(version) is not None and _major(version) >= 5 and five is None:
            five = (version, build)
        if version and first is None:
            first = (version, build)
    if not any_text:
        return LogRead.missing()
    database = _database_name(database_path)
    mounted = volume_mounted(database_path) if database_path else None
    if five is not None:
        newest_major = _major(newest_version)
        downgrade = newest_major is None or newest_major < 5
        version, build = five if downgrade else (newest_version, newest_build or five[1])
        return LogRead(
            "parsed",
            version,
            build or version,
            newest_version,
            downgrade,
            database,
            database_path,
            log_name,
            mounted,
        )
    if first is None:
        return LogRead(
            "unknown",
            "unknown",
            "unknown",
            newest_version,
            False,
            database,
            database_path,
            log_name,
            mounted,
        )
    return LogRead(
        "parsed",
        first[0],
        first[1] or first[0],
        newest_version or first[0],
        False,
        database,
        database_path,
        log_name,
        mounted,
    )


def confirms_library(database_path: str, database: str, master: Path) -> bool:
    """Return whether a logged database path is this master file.

    Args:
        database_path: Path text from a ``[Library]`` line.
        database: ``master.sqlite`` or ``database V2``.
        master: The ``master.sqlite`` this process has open.

    Returns:
        True only when both paths are real files, neither is a shortcut,
        and they are the same file. ``database V2`` does not confirm a
        SQLite library.
    """
    if database != "master.sqlite" or not database_path:
        return False
    logged = Path(database_path)
    current = Path(master)
    try:
        if logged.is_symlink() or current.is_symlink():
            return False
        if not logged.is_file() or not current.is_file():
            return False
        return _same_path(logged.resolve(), current.resolve())
    except OSError:
        return False


def _same_path(logged: Path, current: Path) -> bool:
    """Return whether two resolved paths are the same library file.

    Args:
        logged: Path from the session log, already resolved.
        current: The open ``master.sqlite``, already resolved.

    Returns:
        True when the paths match. On macOS the comparison ignores case,
        because the volume can be case-insensitive. ``os.path.normcase``
        does not fold case there, so the strings are casefolded.
    """
    left = str(logged)
    right = str(current)
    if sys.platform == "darwin":
        return left.casefold() == right.casefold()
    return left == right


def volume_root(path: str) -> str | None:
    """Return the external volume a logged path sits on.

    Args:
        path: Database path from a log line.

    Returns:
        ``/Volumes/<name>``, a Windows drive root, or a UNC share.
        A path that is not one of those is None.
    """
    if not path:
        return None
    posix = path.replace("\\", "/")
    if posix.startswith("/Volumes/"):
        parts = [part for part in posix.split("/") if part]
        if len(parts) >= 2 and parts[0] == "Volumes":
            return "/Volumes/" + parts[1]
        return None
    if len(path) >= 2 and path[0].isalpha() and path[1] == ":":
        return path[0].upper() + ":\\"
    raw = path.replace("/", "\\")
    if raw.startswith("\\\\"):
        bits = [bit for bit in raw.split("\\") if bit]
        if len(bits) >= 2:
            return "\\\\" + bits[0] + "\\" + bits[1]
    return None


def volume_mounted(path: str, exists: Callable[[str], bool] | None = None) -> bool | None:
    """Return whether the logged path's volume is connected.

    Args:
        path: Database path from a log line.
        exists: Replacement for the directory check. Tests pass one.

    Returns:
        None when the path is not on an external volume this parser
        classifies. True or False for a volume root.
    """
    root = volume_root(path)
    if root is None:
        return None
    if exists is not None:
        return exists(root)
    try:
        return Path(root).is_dir()
    except OSError:
        return False


def _using_live_library() -> bool:
    """Return whether this process is pointed at the real Serato library.

    Returns:
        True when ``library.MASTER`` is the live path.
    """
    import library

    try:
        return Path(library.MASTER).resolve() == Path(library.LIVE_MASTER).resolve()
    except OSError:
        return False


def _log_files(directory: Path) -> list[Path]:
    """Return the newest log files in a real directory.

    Args:
        directory: Candidate logs folder.

    Returns:
        Up to ``_MAX_LOGS`` regular files, newest session first. An empty
        list when the folder is missing, a shortcut, or unreadable.
    """
    try:
        if directory.is_symlink() or not directory.is_dir():
            return []
        found: list[Path] = []
        for child in directory.iterdir():
            if child.is_symlink() or not child.is_file():
                continue
            if child.suffix.lower() not in _SUFFIXES:
                continue
            found.append(child)
    except OSError:
        return []
    stamped = [path for path in found if _filename_stamp(path.name)]
    plain = [path for path in found if not _filename_stamp(path.name)]
    stamped.sort(key=lambda path: (_filename_stamp(path.name), path.name), reverse=True)
    plain.sort(key=lambda path: (_mtime(path), path.name), reverse=True)
    return (stamped + plain)[:_MAX_LOGS]


def _filename_stamp(name: str) -> int:
    """Return the session date and time encoded in a log file name.

    Args:
        name: File name, not a path.

    Returns:
        ``YYYYMMDDHHMMSS``, or 0 when the name has no session stamp.
    """
    match = _STAMP.search(name)
    if match is None:
        return 0
    year, month, day, hour, minute, second = (int(part) for part in match.groups())
    if not (1 <= month <= 12 and 1 <= day <= 31 and 0 <= hour <= 23 and 0 <= minute <= 59 and 0 <= second <= 60):
        return 0
    return year * 10**10 + month * 10**8 + day * 10**6 + hour * 10**4 + minute * 10**2 + second


def _mtime(path: Path) -> float:
    """Return a file's modified time, or 0 when it cannot be stated.

    Args:
        path: Log file.

    Returns:
        The modified time in seconds.
    """
    try:
        return path.stat().st_mtime
    except OSError:
        return 0.0


def _read_text(path: Path) -> str:
    """Read the start and end of a log without following a shortcut.

    Args:
        path: Log file.

    Returns:
        Decoded text. A shortcut, a missing file, or a read error is empty.
    """
    try:
        if path.is_symlink() or not path.is_file():
            return ""
        size = path.stat().st_size
        with path.open("rb") as handle:
            if size <= _EDGE * 2:
                blob = handle.read(_EDGE * 2 + 1)
            else:
                head = handle.read(_EDGE)
                handle.seek(max(size - _EDGE, 0))
                tail = handle.read(_EDGE)
                blob = head + b"\n" + tail
    except OSError:
        return ""
    return blob.decode("utf-8", errors="replace")


def _first_version(text: str) -> tuple[str, str]:
    """Return the first Serato version in a log.

    Args:
        text: Log text.

    Returns:
        Version and build, or two empty strings.
    """
    for line in text.splitlines():
        match = _VERSION_LINE.search(line)
        if match is None:
            continue
        version, build = _split_version(match.group(1))
        if not _DOTTED.fullmatch(version):
            continue
        named = _BUILD.search(line)
        if named is not None and _DOTTED.fullmatch(named.group(1)):
            build = named.group(1)
        else:
            paren = _PAREN_BUILD.search(line)
            if paren is not None and _DOTTED.fullmatch(paren.group(1)):
                build = paren.group(1)
        return version, build
    return "", ""


def _split_version(raw: str) -> tuple[str, str]:
    """Split a dotted version into a short version and a build.

    Args:
        raw: A dotted number from a log line.

    Returns:
        The first three components, and the full string as the build when
        a fourth component is present.
    """
    parts = [part for part in raw.split(".") if part]
    if len(parts) >= 4:
        return ".".join(parts[:3]), raw
    return raw, raw


def _major(version: str) -> int | None:
    """Return the first component of a dotted version.

    Args:
        version: A version string.

    Returns:
        The major component, or None when the text is not a dotted number.
    """
    if not version or not _DOTTED.fullmatch(version):
        return None
    return int(version.split(".", 1)[0])


def _library_path(text: str) -> str:
    """Return the last database path on a ``[Library]`` line.

    Args:
        text: Log text.

    Returns:
        The path, or an empty string when no ``[Library]`` line names
        ``master.sqlite`` or ``database V2``.
    """
    found = ""
    for line in text.splitlines():
        if "[Library]" not in line:
            continue
        for match in _PATH.finditer(line):
            path = match.group("double") or match.group("single") or match.group("bare") or ""
            path = path.strip().rstrip(".,;:")
            if path:
                found = path
    return found


def _database_name(path: str) -> str:
    """Return the database file name a logged path ends with.

    Args:
        path: Path text, or empty.

    Returns:
        ``master.sqlite``, ``database V2``, or an empty string.
    """
    if not path:
        return ""
    folded = path.replace("\\", "/").rstrip("/").casefold()
    if folded.endswith("/master.sqlite") or folded == "master.sqlite":
        return "master.sqlite"
    if folded.endswith("database v2"):
        return "database V2"
    return ""
