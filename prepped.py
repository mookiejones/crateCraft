"""Read-only prepped mark for one library track.

A track is prepped only when it has cue points, Serato has analysed it,
and the audio file opens for reading. Any unknown input keeps the mark
unknown. Loops are not cues. Nothing here writes cues, analysis, or crates.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from pathlib import Path
from typing import TypedDict

import cloud_files
import tags
import volumes

PIECES = ("cues", "analysed", "file")
# Bit 2 of asset.analysis_flags. Same value as reanalyze.ANALYZED_BIT.
# This module does not import the re-analyze writer.
ANALYZED_BIT = 4

OpenCheck = Callable[[Path], bool]
TagReader = Callable[[str], tags.SeratoTags]


class PreppedFields(TypedDict):
    """The six fields added to a library track.

    Attributes:
        prepped: True only when cues, analysis, and the file are all true.
            None when any of those is unknown. False when every input is
            known and at least one is false.
        prepped_missing: Known-false piece names, in the order cues,
            analysed, file.
        prepped_unknown: Unknown piece names, in that same order.
        has_cues: Cue-point tri-state. Loops do not count.
        analysed: Analysis tri-state.
        file_present: File-open tri-state.
    """

    prepped: bool | None
    prepped_missing: list[str]
    prepped_unknown: list[str]
    has_cues: bool | None
    analysed: bool | None
    file_present: bool | None


def _tri(value: object) -> bool | None:
    """Return True, False, or None. Any other value is unknown.

    Args:
        value: A tri-state input. ``1`` is not true.

    Returns:
        The same boolean, or None.
    """
    if value is True or value is False or value is None:
        return value
    return None


def prepped_mark(
    has_cues: object,
    analysed: object,
    file_present: object,
) -> PreppedFields:
    """Combine the three tri-states into the prepped mark.

    Args:
        has_cues: True when at least one cue point was read. False when
            the file was read and the cue list was empty. None when cues
            were not read. A value that is not a boolean or None is unknown.
        analysed: True when the analysis bit or a beatgrid says the track
            is analysed. False when that is known to be absent. None when
            neither was read.
        file_present: True when the file opened for reading. False when a
            local path did not open. None when the check was skipped.

    Returns:
        ``prepped`` is true only when every input is true. It is None when
        any input is unknown, including a non-boolean. It is false only
        when every input is known and at least one is false. Missing and
        unknown pieces are named ``cues``, ``analysed``, and ``file``.
    """
    cues = _tri(has_cues)
    analysed_value = _tri(analysed)
    present = _tri(file_present)
    inputs = (("cues", cues), ("analysed", analysed_value), ("file", present))
    missing = [name for name, value in inputs if value is False]
    unknown = [name for name, value in inputs if value is None]
    prepped: bool | None
    if unknown:
        prepped = None
    elif missing:
        prepped = False
    else:
        prepped = True
    return {
        "prepped": prepped,
        "prepped_missing": missing,
        "prepped_unknown": unknown,
        "has_cues": cues,
        "analysed": analysed_value,
        "file_present": present,
    }


def analysis_bit(flags: object) -> bool | None:
    """Return Serato's analysed bit, or None when the flags are not an int.

    Args:
        flags: ``asset.analysis_flags``. A bool is not treated as an int.

    Returns:
        True when bit 2 (value 4) is set. False when the flags are an int
        and that bit is clear, including zero. None for None, bool, and
        any other type.
    """
    if isinstance(flags, bool) or not isinstance(flags, int):
        return None
    return bool(flags & ANALYZED_BIT)


def analysed_state(flags: object, beatgrid: bool | None) -> bool | None:
    """Combine the analysis bit and a beatgrid into one tri-state.

    Args:
        flags: ``asset.analysis_flags``.
        beatgrid: True when a grid or an unreadable BeatGrid frame was
            read. False when the file was read and neither was there.
            None when the file was not read.

    Returns:
        True when the bit is set or a beatgrid was read. False when the
        bit is clear, or when the file was read with no grid and the bit
        is not set. None only when both are unknown.
    """
    bit = analysis_bit(flags)
    if bit is True or beatgrid is True:
        return True
    if bit is False or beatgrid is False:
        return False
    return None


def cues_from_tags(parsed: tags.SeratoTags | None) -> bool | None:
    """Return whether a tag read found a cue point.

    Args:
        parsed: Tags from a file that opened, or None when the file was
            not read. An empty cue list is false. Loops do not count.

    Returns:
        True, false, or None.
    """
    if parsed is None:
        return None
    cues = parsed.get("cues")
    if not isinstance(cues, list):
        return None
    return len(cues) > 0


def grid_from_tags(parsed: tags.SeratoTags | None) -> bool | None:
    """Return whether a tag read found a beatgrid.

    Args:
        parsed: Tags from a file that opened, or None when the file was
            not read. An unreadable BeatGrid frame still counts.

    Returns:
        True, false, or None.
    """
    if parsed is None:
        return None
    return bool(parsed.get("beatgrid") or parsed.get("beatgrid_warning"))


def _mounted_external_root(
    portable_id: str,
    location_uri: str,
    mounts: volumes.Mounts,
) -> str | None:
    """Return the root of a mounted external volume, or None for the boot drive.

    Args:
        portable_id: Path Serato stored.
        location_uri: ``connection.database_uri``, or empty.
        mounts: Shared mount cache.

    Returns:
        The volume root when a location URI or an absolute stored path
        names a mounted external drive. None otherwise.
    """
    location_volume = (
        volumes.external_volume(volumes.location_path(location_uri)) if location_uri else None
    )
    path_volume = volumes.external_volume(portable_id) if Path(portable_id).is_absolute() else None
    if location_volume is not None and mounts.mounted(location_volume):
        return location_volume.root
    if path_volume is not None and mounts.mounted(path_volume):
        return path_volume.root
    return None


def locate(
    portable_id: str,
    location_uri: str,
    mounts: volumes.Mounts,
    roots: Sequence[cloud_files.CloudRoot],
    open_check: OpenCheck = volumes.opens_for_read,
) -> tuple[bool | None, Path | None]:
    """Return whether the audio file is present, and the path that opened.

    The order matches the gig check: an unplugged drive is not opened, a
    cloud placeholder is not opened, and a local file is present only when
    it opens for reading. A Windows drive letter is recognized on every
    operating system. ``Path.is_absolute`` is false for ``C:\\...`` on
    POSIX, so a letter is tested before path candidates.

    Args:
        portable_id: Path Serato stored.
        location_uri: ``connection.database_uri``, or empty.
        mounts: Shared mount cache.
        roots: Cloud folders from one ``discover_roots`` call.
        open_check: Read-only open. Tests pass a stand-in. The default
            is ``volumes.opens_for_read``.

    Returns:
        ``(True, path)`` when a local candidate opens. ``(False, None)``
        when a local candidate does not open. ``(None, None)`` when the
        path is empty, contains NUL, names an unplugged volume, is a
        cloud placeholder, cannot be classified, or has no candidate.
    """
    if not portable_id or "\0" in portable_id:
        return None, None
    letter = volumes.volume_of(portable_id)
    if letter is not None and letter.kind == "letter" and not mounts.mounted(letter):
        return None, None
    if volumes.absent_volume(portable_id, location_uri, mounts) is not None:
        return None, None
    external_root = _mounted_external_root(portable_id, location_uri, mounts)
    candidates = volumes.path_candidates(portable_id, external_root)
    if not candidates:
        return None, None
    saw_missing = False
    for candidate in candidates:
        try:
            probe = cloud_files.probe_path(candidate)
        except OSError:
            return None, None
        provider = cloud_files.provider_for(str(candidate), roots)
        availability = cloud_files.classify(probe, provider)
        if availability.status in {"cloud", "unknown"}:
            return None, None
        if availability.status != "local":
            saw_missing = True
            continue
        try:
            opened = open_check(candidate)
        except OSError:
            return None, None
        if opened:
            return True, candidate
        saw_missing = True
    if saw_missing:
        return False, None
    return None, None


def assess(
    portable_id: str,
    location_uri: str,
    analysis_flags: object,
    mounts: volumes.Mounts,
    roots: Sequence[cloud_files.CloudRoot],
    open_check: OpenCheck = volumes.opens_for_read,
    read_tags: TagReader = tags.read_serato_tags,
) -> PreppedFields:
    """Read one track's prepped fields without writing.

    Args:
        portable_id: Path Serato stored. Empty is uncheckable.
        location_uri: Location database URI, or empty.
        analysis_flags: ``asset.analysis_flags``. NULL stays unknown
            unless a beatgrid was read.
        mounts: Shared mount cache for this library load.
        roots: Cloud folders discovered once for this load.
        open_check: Read-only open used by tests.
        read_tags: Tag reader. The default reads the file that opened.
            A file that was not opened is not passed here, so an empty
            cue list means the file was read.

    Returns:
        The six prepped fields. Cue and beatgrid reads happen only after
        a successful open of that same path. A file that was not opened
        leaves cues unknown. The analysis bit can still mark the track
        analysed when the file was not read. That does not make it prepped.
    """
    present, path = locate(portable_id, location_uri, mounts, roots, open_check)
    parsed: tags.SeratoTags | None = None
    if path is not None:
        try:
            parsed = read_tags(str(path))
        except OSError:
            parsed = None
    return prepped_mark(
        cues_from_tags(parsed),
        analysed_state(analysis_flags, grid_from_tags(parsed)),
        present,
    )
