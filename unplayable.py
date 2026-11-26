#!/usr/bin/env python3
"""Name why a library track cannot be played, without storing the answer.

Gig check and the crate list both call ``unplayable_reason``. The words are
``streaming``, ``drive offline``, ``file missing``, ``no path``, and
``unknown``. A file that opens has no reason. Nothing here is cached, and
nothing is written. Streaming audio is not downloaded. A cloud placeholder
is classified with ``stat`` and is not opened.
"""

from __future__ import annotations

import errno
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import NamedTuple

import cloud_files
import volumes

STREAMING = "streaming"
DRIVE_OFFLINE = "drive offline"
FILE_MISSING = "file missing"
NO_PATH = "no path"
UNKNOWN = "unknown"
REASONS = frozenset({STREAMING, DRIVE_OFFLINE, FILE_MISSING, NO_PATH, UNKNOWN})

# Apple Music is third_party_type 6. iTunes (1) is a local library.
# Same marker as gig_check.APPLE_MUSIC_THIRD_PARTY.
STREAMING_THIRD_PARTY = 6

READ_MODE = "rb"
_OPEN_OK = "ok"
_OPEN_MISSING = "missing"
_OPEN_UNKNOWN = "unknown"
_MISSING_ERRNO = frozenset({errno.ENOENT, errno.ENOTDIR})
_DENIED_ERRNO = frozenset({errno.EACCES, errno.EPERM})


class Outcome(NamedTuple):
    """One live check. Not stored.

    Attributes:
        reason: One of ``REASONS``, or None when the file opens or the
            audio is a cloud placeholder the crate badge does not name.
        path: Path that was checked, or the stored path when nothing was opened.
        drive: Drive name when ``reason`` is ``drive offline``. Empty otherwise.
        availability: Cloud classification when this path was probed.
            None for streaming, an absent drive, no path, a permission
            failure, and a file that opened.
    """

    reason: str | None
    path: str
    drive: str
    availability: cloud_files.Availability | None


def open_state(path: Path) -> str:
    """Open a file for reading and say whether that worked.

    Args:
        path: File to open. A cloud placeholder must not be passed here.
            The caller skips those after ``cloud_files.classify``.

    Returns:
        ``ok`` when the file opens, ``missing`` when it is not there, or
        ``unknown`` when permission or another error blocks the check.
        The handle is closed. Nothing is written.
    """
    try:
        with path.open(READ_MODE):
            return _OPEN_OK
    except FileNotFoundError:
        return _OPEN_MISSING
    except PermissionError:
        return _OPEN_UNKNOWN
    except IsADirectoryError:
        return _OPEN_MISSING
    except OSError as exc:
        if exc.errno in _MISSING_ERRNO:
            return _OPEN_MISSING
        return _OPEN_UNKNOWN


def unplayable_reason(
    portable_id: str,
    location_uri: str = "",
    third_party: int | None = None,
    mounts: volumes.Mounts | None = None,
    roots: Sequence[cloud_files.CloudRoot] | None = None,
    opener: Callable[[Path], str] | None = None,
) -> Outcome:
    """Return the live unplayable reason for one track.

    Streaming wins before a drive check and before any open. No path is
    both the stored path and the location URI being empty. An unplugged
    drive is not a missing file. A letter or UNC path names a drive even
    when this operating system does not treat that spelling as absolute.
    The reason is computed for this call only.

    Args:
        portable_id: Path Serato stored. Empty when the row has none.
        location_uri: ``connection.database_uri``, or empty.
        third_party: ``third_party_type``. Only 6 is streaming.
        mounts: Shared mount cache for this request. A new cache is used
            when omitted. This cache remembers drive roots, not reasons.
        roots: Cloud folders already discovered. None discovers them once
            for this call. An empty sequence skips discovery.
        opener: Reads one local file. None uses ``open_state``. Tests pass
            a substitute. A cloud or streaming path is not passed to it.

    Returns:
        The reason, the path, the drive name, and any cloud availability.
        ``reason`` is None when the file opens or the audio is cloud-only.

    Raises:
        Nothing. ``OSError`` and ``ValueError`` become ``unknown``.
    """
    try:
        return _reason(portable_id, location_uri, third_party, mounts, roots, opener)
    except (OSError, ValueError):
        return Outcome(UNKNOWN, portable_id or "", "", None)


def _reason(
    portable_id: str,
    location_uri: str,
    third_party: int | None,
    mounts: volumes.Mounts | None,
    roots: Sequence[cloud_files.CloudRoot] | None,
    opener: Callable[[Path], str] | None,
) -> Outcome:
    """Classify one track. ``unplayable_reason`` catches path errors.

    Args:
        portable_id: Path Serato stored.
        location_uri: Location database URI, or empty.
        third_party: Streaming marker column.
        mounts: Mount cache, or None for a fresh one.
        roots: Cloud roots, None to discover, or empty to skip.
        opener: Local open, or None for ``open_state``.

    Returns:
        One ``Outcome``. Cloud-only audio has reason None and an
        availability whose status is ``cloud``.
    """
    stored = portable_id or ""
    uri = location_uri or ""
    if _is_streaming(third_party):
        return Outcome(STREAMING, stored, "", None)
    if not stored.strip() and not uri.strip():
        return Outcome(NO_PATH, "", "", None)

    cache = mounts if mounts is not None else volumes.Mounts()
    known = cloud_files.discover_roots() if roots is None else tuple(roots)
    location_volume = _location_volume(uri)
    path_volume = _portable_volume(stored)
    absent = _absent(location_volume, path_volume, cache)
    if absent is not None:
        return Outcome(DRIVE_OFFLINE, stored, absent.name, None)

    external_root: str | None = None
    chosen = path_volume
    if location_volume is not None and cache.mounted(location_volume):
        external_root = location_volume.root
        chosen = location_volume
    elif path_volume is not None and cache.mounted(path_volume):
        external_root = path_volume.root
    candidates = _candidates(stored, external_root, chosen)
    if not candidates:
        return Outcome(UNKNOWN, stored, "", None)

    check = opener if opener is not None else open_state
    blocked = ""
    missing_path = ""
    for candidate in candidates:
        probe = cloud_files.probe_path(candidate)
        provider = cloud_files.provider_for(str(candidate), known)
        availability = cloud_files.classify(probe, provider)
        if availability.status == "cloud":
            return Outcome(None, str(candidate), "", availability)
        if availability.status == "unknown":
            return Outcome(UNKNOWN, str(candidate), "", availability)
        if availability.status != "local":
            if not missing_path:
                missing_path = str(candidate)
            continue
        state = check(candidate)
        if state == _OPEN_OK:
            return Outcome(None, str(candidate), "", None)
        if state == _OPEN_MISSING:
            if not missing_path:
                missing_path = str(candidate)
            continue
        if not blocked:
            blocked = str(candidate)
    if blocked:
        return Outcome(UNKNOWN, blocked, "", None)
    reported = missing_path or str(candidates[0])
    return Outcome(FILE_MISSING, reported, "", None)


def _is_streaming(third_party: int | None) -> bool:
    """Return whether this column is the Apple Music streaming marker.

    Args:
        third_party: Stored integer, or None. A bool is not a marker.

    Returns:
        True only for ``STREAMING_THIRD_PARTY``.
    """
    if isinstance(third_party, bool) or not isinstance(third_party, int):
        return False
    return third_party == STREAMING_THIRD_PARTY


def _location_volume(location_uri: str) -> volumes.Volume | None:
    """Return the external drive named by a location URI.

    Args:
        location_uri: ``connection.database_uri``. Empty yields None.

    Returns:
        The volume, or None when the URI is empty or names the boot drive.
    """
    if not location_uri.strip():
        return None
    return volumes.external_volume(volumes.location_path(location_uri))


def _portable_volume(portable_id: str) -> volumes.Volume | None:
    """Return the external drive a stored path names.

    A Windows drive letter and a UNC root count on every operating system,
    including when ``Path.is_absolute`` is false. A POSIX volume still has
    to be absolute on this machine. A relative path names no drive.

    Args:
        portable_id: Path Serato stored.

    Returns:
        The volume, or None for a relative path and for the boot drive.
    """
    if not portable_id.strip():
        return None
    volume = volumes.external_volume(portable_id)
    if volume is None:
        return None
    if volume.kind in {"letter", "unc"} or Path(portable_id).is_absolute():
        return volume
    return None


def _absent(
    location_volume: volumes.Volume | None,
    path_volume: volumes.Volume | None,
    mounts: volumes.Mounts,
) -> volumes.Volume | None:
    """Return the first of these volumes that is not connected.

    Args:
        location_volume: Drive from the location URI. Tried first.
        path_volume: Drive from the stored path.
        mounts: Mount cache for this request.

    Returns:
        The unplugged volume, or None when both are connected or absent.
    """
    if location_volume is not None and not mounts.mounted(location_volume):
        return location_volume
    if path_volume is not None and not mounts.mounted(path_volume):
        return path_volume
    return None


def _candidates(
    portable_id: str,
    external_root: str | None,
    volume: volumes.Volume | None,
) -> tuple[Path, ...]:
    """Return paths to open for a stored id whose drive is connected.

    Args:
        portable_id: Path Serato stored.
        external_root: Root of the mounted drive, or None for the boot drive.
        volume: Drive the path names, when it names one.

    Returns:
        Candidates. A letter or UNC path that this OS does not call
        absolute is opened as stored. Every other id uses
        ``volumes.path_candidates``.
    """
    if not portable_id:
        return ()
    raw = Path(portable_id)
    if volume is not None and volume.kind in {"letter", "unc"} and not raw.is_absolute():
        return (raw,)
    return volumes.path_candidates(portable_id, external_root)
