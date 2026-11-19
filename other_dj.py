"""Read other DJ apps and refuse trashing a file they still use.

Detection is read-only. An unreadable library does not count as a reference.
A process list that cannot be read does not block a merge. This module does
not write those libraries and does not import ``library``.
"""

from __future__ import annotations

import os
import posixpath
import re
import sqlite3
import subprocess
import sys
import xml.etree.ElementTree as ET
from collections.abc import Callable, Sequence
from pathlib import Path
from urllib.parse import unquote, urlparse

OTHER_DJ_OPEN = "Another DJ app is still open. Quit it before merging duplicates."
_APP_ORDER = ("rekordbox", "Engine DJ", "Traktor", "VirtualDJ", "djay")
_XML_CAP = 32 * 1024 * 1024
_SQL_IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
_PATH_COLUMNS = frozenset(
    {
        "path",
        "filepath",
        "file_path",
        "filename",
        "folderpath",
        "location",
        "orgpath",
        "uri",
        "pathname",
        "file",
    }
)
_LINE_NEEDLES = (
    ("rekordbox", "rekordbox"),
    ("virtualdj", "VirtualDJ"),
    ("traktor", "Traktor"),
    ("engineprime", "Engine DJ"),
    ("engine prime", "Engine DJ"),
    ("enginedj", "Engine DJ"),
    ("engine dj", "Engine DJ"),
)


def file_reason(apps: Sequence[str]) -> str:
    """Return the English sentence for a file another DJ app still uses.

    Args:
        apps: Product names in display order.

    Returns:
        A fixed sentence. Product names are not translated.
    """
    return f"{', '.join(apps)} still uses this file. It was not moved."


def path_key(text: str, *, fold: bool | None = None) -> str:
    """Normalize one stored path for an exact comparison.

    Separators become ``/``. A ``file:`` URL is unquoted. ``..`` is collapsed.
    A trailing slash is dropped. Case is folded on macOS, on Windows, when
    the path looks like a Windows drive, or when ``fold`` is true.

    Args:
        text: Path or file URL.
        fold: Force case folding. None follows the platform and the path.

    Returns:
        The comparison key. Blank input is an empty string.
    """
    raw = text.strip()
    if raw[:5].casefold() == "file:":
        parsed = urlparse(raw)
        path = unquote(parsed.path or "")
        if len(path) >= 3 and path[0] == "/" and path[2] == ":":
            path = path[1:]
        raw = path
    raw = raw.replace("\\", "/")
    if not raw:
        return ""
    while len(raw) > 1 and raw.endswith("/") and not raw.endswith(":/"):
        raw = raw[:-1]
    normalized = posixpath.normpath(raw)
    if normalized == ".":
        return ""
    do_fold = fold
    if do_fold is None:
        do_fold = sys.platform in {"darwin", "win32"} or (
            len(normalized) >= 2 and normalized[1] == ":"
        )
    if do_fold:
        return normalized.casefold()
    return normalized


def traktor_path(directory: str, filename: str) -> str:
    """Join a Traktor ``DIR`` value and ``FILE`` name.

    ``DIR`` uses ``/:`` between folders. ``/:Users/:me/:Music/:`` plus
    ``song.mp3`` becomes ``/Users/me/Music/song.mp3``. A Windows drive letter
    stays at the front without a leading slash.

    Args:
        directory: ``DIR`` attribute.
        filename: ``FILE`` attribute.

    Returns:
        The joined path. An empty file name returns an empty string.
    """
    if not filename:
        return ""
    body = directory
    if body.startswith("/:"):
        body = body[2:]
    parts = [part for part in body.split("/:") if part]
    if parts and len(parts[0]) == 2 and parts[0][1] == ":":
        folder = "/".join(parts)
    elif parts:
        folder = "/" + "/".join(parts)
    else:
        folder = ""
    if folder and not folder.endswith("/"):
        folder += "/"
    return folder + filename


def _candidate_keys(stored: str | None, audio: Path | None) -> list[str]:
    """Return comparison keys for a library path and a resolved file.

    Args:
        stored: Path text from the library, or None.
        audio: File on disk, or None.

    Returns:
        Unique non-empty keys. The resolved path is included when it exists.
    """
    raw: list[str] = []
    if stored:
        raw.append(stored)
    if audio is not None:
        raw.append(str(audio))
        try:
            raw.append(str(audio.resolve()))
        except OSError:
            pass
    keys: list[str] = []
    for item in raw:
        key = path_key(item)
        if key and key not in keys:
            keys.append(key)
    return keys


def _quote_ident(name: str) -> str | None:
    """Return a schema name that is safe to interpolate.

    Args:
        name: Table or column name from ``sqlite_master``.

    Returns:
        The same name, or None when it is not a plain identifier.
    """
    if _SQL_IDENT.match(name):
        return name
    return None


def _open_ro(path: Path) -> sqlite3.Connection:
    """Open a SQLite file that cannot be written.

    Args:
        path: Database file.

    Returns:
        A connection with ``mode=ro`` and ``query_only``.

    Raises:
        sqlite3.Error: If the file is not a readable SQLite database.
    """
    uri = path.resolve().as_uri() + "?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.execute("PRAGMA query_only = ON")
    return conn


def _xml_too_big(path: Path) -> bool:
    """Return whether an XML library is over the read cap.

    Args:
        path: XML file.

    Returns:
        True when the size cannot be read or is over ``_XML_CAP``.
    """
    try:
        return path.stat().st_size > _XML_CAP
    except OSError:
        return True


def _virtualdj_paths(path: Path) -> list[str]:
    """Read ``FilePath`` attributes from a VirtualDJ database.

    Args:
        path: ``database.xml``.

    Returns:
        Stored paths. An oversized or unreadable file returns an empty list.
    """
    if _xml_too_big(path):
        return []
    found: list[str] = []
    try:
        for _event, elem in ET.iterparse(path, events=("end",)):
            raw = elem.attrib.get("FilePath")
            if raw:
                found.append(raw)
            elem.clear()
    except (ET.ParseError, OSError):
        return []
    return found


def _traktor_paths(path: Path) -> list[str]:
    """Read ``LOCATION`` entries from a Traktor collection.

    Args:
        path: ``collection.nml``.

    Returns:
        Joined paths. An oversized or unreadable file returns an empty list.
    """
    if _xml_too_big(path):
        return []
    found: list[str] = []
    try:
        for _event, elem in ET.iterparse(path, events=("end",)):
            if elem.tag.endswith("LOCATION"):
                directory = elem.attrib.get("DIR") or ""
                filename = elem.attrib.get("FILE") or ""
                joined = traktor_path(directory, filename)
                if joined:
                    found.append(joined)
            elem.clear()
    except (ET.ParseError, OSError):
        return []
    return found


def _rekordbox_paths(path: Path) -> list[str]:
    """Read plaintext rekordbox ``djmdContent`` paths.

    An encrypted or unreadable database returns an empty list. That is
    "cannot tell", not a reference.

    Args:
        path: ``master.db``.

    Returns:
        ``FolderPath`` joined with ``FileNameL``.
    """
    try:
        conn = _open_ro(path)
    except sqlite3.Error:
        return []
    try:
        try:
            rows = conn.execute("SELECT FolderPath, FileNameL FROM djmdContent").fetchall()
        except sqlite3.Error:
            return []
        found: list[str] = []
        for folder, name in rows:
            if not isinstance(name, str) or not name:
                continue
            prefix = folder.replace("\\", "/") if isinstance(folder, str) else ""
            if prefix and not prefix.endswith("/"):
                prefix += "/"
            found.append(prefix + name)
        return found
    finally:
        conn.close()


def _engine_paths(path: Path) -> list[str]:
    """Read ``Track.path`` from an Engine DJ ``m.db``.

    Args:
        path: Engine database.

    Returns:
        Path strings. A missing table returns an empty list.
    """
    try:
        conn = _open_ro(path)
    except sqlite3.Error:
        return []
    try:
        try:
            rows = conn.execute("SELECT path FROM Track").fetchall()
        except sqlite3.Error:
            return []
        return [row[0] for row in rows if isinstance(row[0], str) and row[0]]
    finally:
        conn.close()


def _djay_paths(path: Path) -> list[str]:
    """Read path-like text columns from a djay SQLite library.

    Only columns whose names are on the whitelist are selected. Other text
    is ignored, so a note that mentions a file name is not a reference.

    Args:
        path: djay database.

    Returns:
        Values from those columns. An unreadable file returns an empty list.
    """
    try:
        conn = _open_ro(path)
    except sqlite3.Error:
        return []
    try:
        try:
            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        except sqlite3.Error:
            return []
        found: list[str] = []
        for (table_name,) in tables:
            if not isinstance(table_name, str):
                continue
            table = _quote_ident(table_name)
            if table is None or table_name.startswith("sqlite_"):
                continue
            try:
                info = conn.execute(f"PRAGMA table_info({table})").fetchall()
            except sqlite3.Error:
                continue
            columns: list[str] = []
            for row in info:
                column_name = row[1]
                if not isinstance(column_name, str):
                    continue
                if column_name.casefold() not in _PATH_COLUMNS:
                    continue
                quoted = _quote_ident(column_name)
                if quoted is not None:
                    columns.append(quoted)
            for column in columns:
                try:
                    values = conn.execute(f"SELECT {column} FROM {table}").fetchall()
                except sqlite3.Error:
                    continue
                for (value,) in values:
                    if isinstance(value, str) and value:
                        found.append(value)
        return found
    finally:
        conn.close()


def _read_paths(label: str, path: Path) -> list[str]:
    """Read paths from one known library file.

    Args:
        label: App name from ``_APP_ORDER``.
        path: Library file that exists.

    Returns:
        Stored paths. An unknown label returns an empty list.
    """
    if label == "rekordbox":
        return _rekordbox_paths(path)
    if label == "Engine DJ":
        return _engine_paths(path)
    if label == "Traktor":
        return _traktor_paths(path)
    if label == "VirtualDJ":
        return _virtualdj_paths(path)
    if label == "djay":
        return _djay_paths(path)
    return []


class LibraryIndex:
    """Paths referenced by other DJ libraries, keyed for an exact match.

    A basename does not match a full path. A prefix such as ``song.mp3.bak``
    does not match ``song.mp3``.
    """

    def __init__(self, libraries: Sequence[tuple[str, Path]] | None = None) -> None:
        """Index the libraries the caller already located.

        Args:
            libraries: ``(app label, path)`` pairs. Missing files are skipped.
        """
        self._by_key: dict[str, list[str]] = {}
        for label, path in libraries or ():
            try:
                if not path.is_file():
                    continue
            except OSError:
                continue
            for raw in _read_paths(label, path):
                key = path_key(raw)
                if not key:
                    continue
                apps = self._by_key.setdefault(key, [])
                if label not in apps:
                    apps.append(label)

    def used_by(self, stored: str | None, audio: Path | None) -> list[str]:
        """Return apps that reference this file.

        Args:
            stored: Path text from the Serato library.
            audio: Resolved file, or None when it is not on disk.

        Returns:
            Product names in ``_APP_ORDER``. Empty when nothing matches.
        """
        found: list[str] = []
        for key in _candidate_keys(stored, audio):
            for label in self._by_key.get(key, ()):
                if label not in found:
                    found.append(label)
        return [label for label in _APP_ORDER if label in found]


def _env_path(name: str) -> Path | None:
    """Return an absolute environment path, or None when it is unset.

    Args:
        name: Environment variable.

    Returns:
        The path, or None when the variable is missing or relative.
    """
    raw = os.environ.get(name, "")
    if not raw:
        return None
    path = Path(raw)
    if not path.is_absolute():
        return None
    return path


def _add_library(
    found: list[tuple[str, Path]],
    seen: set[Path],
    label: str,
    path: Path,
) -> None:
    """Append a library file once.

    Args:
        found: Pairs collected so far.
        seen: Resolved paths already recorded.
        label: App name.
        path: Candidate file.
    """
    try:
        if not path.is_file():
            return
        key = path.resolve()
    except OSError:
        return
    if key in seen:
        return
    seen.add(key)
    found.append((label, path))


def locate_libraries(home: Path | None = None) -> list[tuple[str, Path]]:
    """Find other DJ library files under a home directory.

    An explicit ``home`` does not read ``APPDATA`` or ``LOCALAPPDATA``.
    Those variables are used only for the real home, and only when set.
    A missing file is skipped.

    Args:
        home: Profile root. None uses the current user's home.

    Returns:
        ``(app label, path)`` for files that exist.
    """
    use_env = home is None
    root = Path.home() if home is None else home
    found: list[tuple[str, Path]] = []
    seen: set[Path] = set()

    def add(label: str, path: Path) -> None:
        _add_library(found, seen, label, path)

    add("rekordbox", root / "Library/Pioneer/rekordbox/master.db")
    add("rekordbox", root / "AppData/Roaming/Pioneer/rekordbox/master.db")
    add("Engine DJ", root / "Music/Engine Library/Database2/m.db")
    native = root / "Documents/Native Instruments"
    try:
        native_exists = native.is_dir()
    except OSError:
        native_exists = False
    if native_exists:
        for path in sorted(native.glob("Traktor*/collection.nml")):
            add("Traktor", path)
    add("VirtualDJ", root / "Library/Application Support/VirtualDJ/database.xml")
    add("VirtualDJ", root / "Documents/VirtualDJ/database.xml")
    add("VirtualDJ", root / "AppData/Roaming/VirtualDJ/database.xml")
    add("djay", root / "Library/Application Support/djay/djay Media Library.db")
    add("djay", root / "Music/djay/djay Media Library.db")
    add("djay", root / "AppData/Local/djay/djay Media Library.db")
    if use_env:
        appdata = _env_path("APPDATA")
        local = _env_path("LOCALAPPDATA")
        if appdata is not None:
            add("rekordbox", appdata / "Pioneer/rekordbox/master.db")
            add("VirtualDJ", appdata / "VirtualDJ/database.xml")
        if local is not None:
            add("djay", local / "djay/djay Media Library.db")
    return found


def _process_basename(line: str) -> str:
    """Return the executable name from one process line.

    Args:
        line: ``ps`` comm or one ``tasklist`` CSV row.

    Returns:
        The basename, case-folded. A directory in the path is not the name.
    """
    token = line.strip()
    if token.startswith('"'):
        end = token.find('"', 1)
        if end > 1:
            token = token[1:end]
    else:
        token = token.split(" ", 1)[0]
    name = token.replace("\\", "/").rsplit("/", 1)[-1]
    return name.casefold()


def labels_in_process(line: str) -> list[str]:
    """Return DJ apps named by one process line.

    The word "engine" alone does not match. ``djay`` matches the executable
    basename only, so a folder named djay in a path does not count.

    Args:
        line: One process command or image name.

    Returns:
        Product names found on this line, in scan order.
    """
    folded = line.casefold()
    found: list[str] = []
    for needle, label in _LINE_NEEDLES:
        if needle in folded and label not in found:
            found.append(label)
    if "djay" in _process_basename(line) and "djay" not in found:
        found.append("djay")
    return found


def default_process_names() -> list[str]:
    """List running process names.

    Uses ``ps`` or ``tasklist``. A failure or a timeout returns an empty list.

    Returns:
        One line per process. Empty when the listing cannot be read.
    """
    try:
        if sys.platform == "win32":
            completed = subprocess.run(
                ["tasklist", "/FO", "CSV", "/NH"],
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
            )
        else:
            completed = subprocess.run(
                ["ps", "-ax", "-o", "comm="],
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
            )
    except (OSError, subprocess.TimeoutExpired):
        return []
    if completed.returncode != 0:
        return []
    return [line.strip() for line in completed.stdout.splitlines() if line.strip()]


process_names: Callable[[], list[str]] = default_process_names


def apps_open(names: Sequence[str] | None = None) -> list[str]:
    """Return DJ apps that are running.

    Args:
        names: Process lines to scan. None uses ``process_names``.

    Returns:
        Product names in a stable order. Empty when none match.
    """
    lines = list(names) if names is not None else list(process_names())
    seen: set[str] = set()
    for line in lines:
        seen.update(labels_in_process(line))
    return [label for label in _APP_ORDER if label in seen]
