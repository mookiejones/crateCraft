#!/usr/bin/env python3
"""Report where Serato keeps a library. This command does not open or write it.

Serato 3 stores the library in ``~/Music/_Serato_/database V2``. Serato 4
and Serato 5 display ``master.sqlite`` under Application Support (macOS) or
``%LOCALAPPDATA%\\Serato\\Library`` (Windows). ``database V2`` is still
written when Serato quits, and crates for an external drive stay in that
drive's ``_Serato_`` folder. Serato 4 and 5 delete a ``.crate`` file the
database has never recorded, at the next launch.

Protect Library is the plist key ``library_protect`` (1 on, 0 off). A
missing file is unknown. The key does not lock ``master.sqlite``. Lucid
and Flexible beatgrid bytes are not located here. This probe does not
invent that layout, and it does not open a database.
"""

from __future__ import annotations

import argparse
import json
import platform
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Place:
    """One path Serato may use.

    Attributes:
        role: Stable name, such as ``master`` or ``drive-crates``.
        path: Absolute path. Not opened except by the caller's exists check.
        since: First major version that uses this path: ``3``, ``4``, or ``5``.
        note: What changed, in one sentence.
    """

    role: str
    path: Path
    since: str
    note: str


def mac_places(home: Path) -> list[Place]:
    """Return the macOS locations for a home directory.

    Args:
        home: Home directory. Not required to exist.

    Returns:
        The Music ``_Serato_`` tree, the Serato 4/5 Library folder, and
        the Protect Library plist.
    """
    serato = home / "Music" / "_Serato_"
    library = home / "Library" / "Application Support" / "Serato" / "Library"
    return [
        Place("database-v2", serato / "database V2", "3", "Serato 3 library. Serato 4 and 5 still write this on quit."),
        Place("crates", serato / "Subcrates", "3", "Crate files. Serato 4 and 5 delete a file the database does not know."),
        Place("smart-crates", serato / "SmartCrates", "3", "Smart crate rules. Not copied onto a portable drive."),
        Place("logs", serato / "Logs", "3", "Session logs. A [Library] line names the database Serato opened."),
        Place("order", serato / "neworder.pref", "3", "Crate order."),
        Place("export-backups", serato / "Export Backups", "3", "Serato's own one-slot backup. Leave it untouched."),
        Place("lexicon", serato / "Lexicon", "3", "Another app's backups. Leave it untouched."),
        Place("master", library / "master.sqlite", "4", "Library Serato 4 and Serato 5 display."),
        Place("root", library / "root.sqlite", "4", "Location database for the internal drive."),
        Place(
            "protect-library",
            home / "Library" / "Preferences" / "com.serato.seratodj.plist",
            "5",
            "library_protect is 1 or 0. Missing means unknown. It does not lock the database.",
        ),
    ]


def windows_places(home: Path, local_app_data: Path) -> list[Place]:
    """Return the Windows locations.

    Args:
        home: User profile.
        local_app_data: ``%LOCALAPPDATA%``.

    Returns:
        The Music ``_Serato_`` tree and the Serato 4/5 Library folder.
        Protect Library has no confirmed Windows location in this probe.
    """
    serato = home / "Music" / "_Serato_"
    library = local_app_data / "Serato" / "Library"
    return [
        Place("database-v2", serato / "database V2", "3", "Serato 3 library. Serato 4 and 5 still write this on quit."),
        Place("crates", serato / "Subcrates", "3", "Crate files. Serato 4 and 5 delete a file the database does not know."),
        Place("smart-crates", serato / "SmartCrates", "3", "Smart crate rules."),
        Place("logs", serato / "Logs", "3", "Session logs."),
        Place("master", library / "master.sqlite", "4", "Library Serato 4 and Serato 5 display."),
        Place("root", library / "root.sqlite", "4", "Location database for the internal drive."),
    ]


def drive_places(volume: Path) -> list[Place]:
    """Return the ``_Serato_`` locations on one external volume.

    Args:
        volume: Drive root, such as ``/Volumes/MUSIC`` or ``E:\\``.

    Returns:
        ``database V2`` and ``Subcrates`` for tracks stored on that drive.
        The same layout is used from Serato 3 through Serato 5.
    """
    serato = volume / "_Serato_"
    return [
        Place("drive-database", serato / "database V2", "3", "Tracks that live on this drive."),
        Place("drive-crates", serato / "Subcrates", "3", "Crates for this drive, with paths relative to the drive."),
    ]


def survey(
    home: Path,
    *,
    system: str,
    local_app_data: Path | None = None,
    volumes: list[Path] | None = None,
    exists: Callable[[Path], bool] | None = None,
) -> dict[str, object]:
    """Report which known locations exist. No path is opened or created.

    Args:
        home: Home directory.
        system: ``Darwin``, ``Windows``, or another ``platform.system`` value.
        local_app_data: Windows local app data. Ignored on macOS.
        volumes: External drive roots to include.
        exists: Predicate used instead of ``Path.exists``. Tests pass this
            so the real home is never touched.

    Returns:
        ``shape`` is ``serato3`` when only ``database V2`` is present,
        ``serato4-or-5`` when ``master.sqlite`` is present, and ``absent``
        when neither is. Serato 5 is not distinguished from Serato 4 by
        these files. ``protect_library`` is ``present``, ``missing``, or
        ``not-on-this-os``.
    """
    check = Path.exists if exists is None else exists
    if system == "Darwin":
        places = mac_places(home)
    elif system == "Windows":
        places = windows_places(home, local_app_data or (home / "AppData" / "Local"))
    else:
        places = mac_places(home)
    rows = [_row(place, check) for place in places]
    for volume in volumes or []:
        rows.extend(_row(place, check) for place in drive_places(volume))
    present = {row["role"] for row in rows if row["exists"]}
    if "master" in present:
        shape = "serato4-or-5"
    elif "database-v2" in present:
        shape = "serato3"
    else:
        shape = "absent"
    if system == "Darwin":
        protect = "present" if "protect-library" in present else "missing"
    else:
        protect = "not-on-this-os"
    return {
        "shape": shape,
        "protect_library_plist": protect,
        "lucid_beatgrid": "unconfirmed",
        "places": rows,
    }


def main(argv: list[str] | None = None) -> int:
    """Print the survey as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0. The command does not create a missing path.
    """
    parser = argparse.ArgumentParser(description="Show where Serato stores a library. Read-only.")
    parser.add_argument("--home", type=Path, default=Path.home())
    parser.add_argument("--system", default=platform.system())
    parser.add_argument("--local-app-data", type=Path, default=None)
    parser.add_argument("--volume", type=Path, action="append", default=[])
    args = parser.parse_args(argv)
    report = survey(
        args.home,
        system=args.system,
        local_app_data=args.local_app_data,
        volumes=args.volume,
    )
    json.dump(report, sys.stdout, indent=2, default=str)
    sys.stdout.write("\n")
    return 0


def _row(place: Place, exists: Callable[[Path], bool]) -> dict[str, object]:
    """Return one place and whether it exists.

    Args:
        place: Known location.
        exists: Existence check. Must not create the path.

    Returns:
        Role, path, version, note, and ``exists``.
    """
    return {
        "role": place.role,
        "path": str(place.path),
        "since": place.since,
        "note": place.note,
        "exists": bool(exists(place.path)),
    }


if __name__ == "__main__":
    raise SystemExit(main())
