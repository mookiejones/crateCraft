"""Plan a side-by-side crateCraft install.

The release packer still writes a disk image or a zip. It does not delete
an installed app. Launching the desktop app does not delete a sibling
copy. This module only names the new path and the older versioned copies
that may be removed after the new app is running. It does not remove them.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

_UNSAFE = re.compile(r"[^A-Za-z0-9._-]+")
_APP_SUFFIXES = (".app", ".exe")


@dataclass(frozen=True)
class SideBySidePlan:
    """Where the new app goes, and which older copies may be removed later.

    Attributes:
        new_app: Versioned path under the destination. Not created here.
        delete: Previous versioned apps. Empty until the new app is running.
    """

    new_app: Path
    delete: tuple[Path, ...]


def versioned_app_name(version: str) -> str:
    """Return a single path component for one crateCraft version.

    Args:
        version: Version string, such as ``v1.2.3`` or ``0.0.0+dev``.

    Returns:
        ``crateCraft-`` plus a name that is safe as one path component.
        Characters other than letters, digits, dot, underscore, and
        hyphen become a hyphen.
    """
    cleaned = _UNSAFE.sub("-", version).strip(".-")
    if not cleaned:
        cleaned = "unknown"
    return f"crateCraft-{cleaned}"


def _stem(name: str) -> str:
    """Return a file name without one ``.app`` or ``.exe`` suffix.

    Args:
        name: File or directory name. Not a path.

    Returns:
        The name, or the name without that suffix.
    """
    for suffix in _APP_SUFFIXES:
        if name.endswith(suffix):
            return name[: -len(suffix)]
    return name


def side_by_side_plan(dest_dir: Path, version: str, new_running: bool) -> SideBySidePlan:
    """Name the new app and the older versioned copies to remove later.

    Args:
        dest_dir: Directory that holds installed copies. It is not created.
        version: Version being installed.
        new_running: True only after that new app is running. Until then
            the older copies stay in place.

    Returns:
        The new path, and the previous versioned apps when ``new_running``
        is true. An unversioned ``crateCraft.app`` or ``crateCraft.exe`` is
        never listed. Nothing is deleted.
    """
    dest = Path(dest_dir)
    new_name = versioned_app_name(version)
    new_app = dest / new_name
    if not dest.is_dir():
        return SideBySidePlan(new_app, ())
    previous: list[Path] = []
    for child in dest.iterdir():
        stem = _stem(child.name)
        if not stem.startswith("crateCraft-") or stem == "crateCraft-":
            continue
        if stem == new_name:
            continue
        previous.append(child)
    previous.sort(key=lambda path: path.name)
    delete = tuple(previous) if new_running else ()
    return SideBySidePlan(new_app, delete)
