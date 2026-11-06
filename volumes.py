"""Find the drive a stored Serato path lives on, and whether it is plugged in.

Shared by the gig check and relink. A track on a drive that is not mounted
is unavailable, not missing: the file may be fine on a drive that is in a
bag. Every function here only reads. ``Mounts`` caches one answer per drive
root for a single pass, and a UNC root that does not answer within a second
and a half counts as absent so one dead share cannot stall a check.
"""

from __future__ import annotations

import os
import re
import sys
import threading
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import unquote, urlparse

READ_MODE = "rb"
_LETTER = re.compile(r"^(?P<letter>[A-Za-z]):[\\/]")
_UNC = re.compile(r"^(?P<root>\\\\[^\\]+\\[^\\]+|//[^/]+/[^/]+)")


@dataclass(frozen=True, slots=True)
class Volume:
    """A drive a path can sit on.

    Attributes:
        name: Name shown once in the report.
        root: Directory or drive root whose absence means the drive is out.
        kind: ``letter``, ``unc``, or ``posix``.
    """

    name: str
    root: str
    kind: str



def location_path(uri: str) -> str:
    """Turn a connection URI into the path whose drive we test.

    Args:
        uri: ``connection.database_uri``, a file URI or a plain path.

    Returns:
        A filesystem path. A Windows ``file:///Z:/...`` URI keeps the drive
        letter. The leading slash urlparse leaves in front of ``Z:`` is removed.
    """
    if uri.startswith("file:"):
        parsed = unquote(urlparse(uri).path)
        if len(parsed) >= 4 and parsed[0] == "/" and parsed[2] == ":":
            parsed = parsed[1:]
        return parsed
    return uri


def posix_volume(path: str) -> Volume | None:
    """Return the external volume of a POSIX path.

    Args:
        path: Absolute path using forward slashes.

    Returns:
        The volume, or None when the path is on the boot volume. macOS
        volumes are ``/Volumes/NAME``. Linux desktop mounts are ``/media``,
        ``/run/media``, and ``/mnt``.
    """
    parts = path.split("/")
    # ('', 'Volumes', 'NAME', ...)
    if len(parts) >= 3 and parts[1] == "Volumes" and parts[2]:
        name = parts[2]
        return Volume(name, f"/Volumes/{name}", "posix")
    if len(parts) >= 5 and parts[1] == "run" and parts[2] == "media" and parts[4]:
        name = parts[4]
        root = "/" + "/".join(parts[1:5])
        return Volume(name, root, "posix")
    if len(parts) >= 4 and parts[1] == "media" and parts[3]:
        name = parts[3]
        root = "/" + "/".join(parts[1:4])
        return Volume(name, root, "posix")
    if len(parts) >= 3 and parts[1] == "mnt" and parts[2]:
        name = parts[2]
        return Volume(name, f"/mnt/{name}", "posix")
    return None


def volume_of(path: str) -> Volume | None:
    """Return the volume a path addresses, including the boot drive letter.

    Args:
        path: Stored path or a location-database path.

    Returns:
        A volume, or None for a relative path or a POSIX boot-volume path.
        A Windows drive letter is returned on every operating system so a
        ``Z:`` path is never treated as a missing file on the boot drive.
    """
    if not path:
        return None
    letter = _LETTER.match(path)
    if letter:
        name = letter.group("letter").upper() + ":"
        return Volume(name, name + "\\", "letter")
    if path.startswith("\\\\") or path.startswith("//"):
        match = _UNC.match(path)
        if match is None:
            return None
        root = match.group("root").replace("/", "\\")
        if not root.startswith("\\\\"):
            root = "\\\\" + root.lstrip("\\")
        return Volume(root, root, "unc")
    if sys.platform == "win32":
        return None
    if path.startswith("/"):
        return posix_volume(path)
    return None


def external_volume(path: str) -> Volume | None:
    """Return a volume only when it is not the boot drive.

    Args:
        path: Stored path or a location-database path.

    Returns:
        The external volume, or None for the boot drive and for relative paths.
        On Windows the system drive comes from ``SystemDrive``.
    """
    volume = volume_of(path)
    if volume is None:
        return None
    if volume.kind == "letter" and sys.platform == "win32":
        system = os.environ.get("SystemDrive", "C:").upper()
        if volume.name.upper() == system:
            return None
    return volume


class Mounts:
    """Remembers, per check, whether each drive root was present."""

    def __init__(self) -> None:
        """Start with an empty cache. Drive letters are read at most once."""
        self._cache: dict[str, bool] = {}
        self._letters: set[str] | None = None

    def mounted(self, volume: Volume) -> bool:
        """Return whether this volume's root is connected.

        Args:
            volume: Drive to test.

        Returns:
            True when the drive letter is in ``os.listdrives`` or the volume
            directory exists. A UNC root that does not answer within a second
            and a half counts as absent, so one dead share cannot stall the check.
        """
        cached = self._cache.get(volume.root)
        if cached is not None:
            return cached
        if volume.kind == "letter":
            present = volume.name.upper() in self._windows_letters()
        elif volume.kind == "unc":
            present = directory_exists(volume.root, timeout=1.5)
        else:
            present = directory_exists(volume.root, timeout=None)
        self._cache[volume.root] = present
        return present

    def _windows_letters(self) -> set[str]:
        """Return mounted Windows drive letters.

        Returns:
            Letters such as ``C:``. Empty when this is not Windows.
        """
        if self._letters is not None:
            return self._letters
        found: set[str] = set()
        listdrives = getattr(os, "listdrives", None)
        if sys.platform == "win32" and listdrives is not None:
            for drive in listdrives():
                if len(drive) >= 2 and drive[1] == ":":
                    found.add(drive[:2].upper())
        self._letters = found
        return found


def directory_exists(root: str, timeout: float | None) -> bool:
    """Return whether a directory exists.

    Args:
        root: Directory to test.
        timeout: Seconds to wait. None tests directly. A number is for a
            UNC root that might not answer.

    Returns:
        True when the directory is there. False when it is missing, cannot
        be read, or does not answer in time.
    """
    if timeout is None:
        try:
            return Path(root).is_dir()
        except OSError:
            return False
    answered: list[bool] = []

    def probe() -> None:
        try:
            answered.append(Path(root).is_dir())
        except OSError:
            answered.append(False)

    worker = threading.Thread(target=probe, daemon=True)
    worker.start()
    worker.join(timeout)
    if worker.is_alive() or not answered:
        return False
    return answered[0]


def opens_for_read(path: Path) -> bool:
    """Return whether a file can be opened for reading.

    Args:
        path: File to open.

    Returns:
        True when the file opens with ``rb``. False when it is missing or
        cannot be read. The handle is closed without writing.
    """
    try:
        with path.open(READ_MODE):
            return True
    except OSError:
        return False


def path_candidates(portable_id: str, external_root: str | None) -> tuple[Path, ...]:
    """Return the paths a stored id might occupy on a mounted drive.

    Args:
        portable_id: Path Serato stored.
        external_root: Root of a mounted external drive, or None for the boot drive.

    Returns:
        Absolute candidates. An absolute id is used as stored. A relative id
        on an external drive is joined to that drive. A relative id on the
        boot drive is tried under the home directory, then at the filesystem root,
        which is the same order ``library.resolved_path`` uses.
    """
    if not portable_id:
        return ()
    raw = Path(portable_id)
    if raw.is_absolute():
        return (raw,)
    if external_root is not None:
        return (Path(external_root) / portable_id,)
    return (Path.home() / portable_id, Path(os.sep) / portable_id)
