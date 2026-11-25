#!/usr/bin/env python3
"""Flag tracks a CDJ or XDJ will refuse (#330).

The limits come from Pioneer DJ and AlphaTheta operating instructions, not
from a third-party compatibility table. When those manuals disagree, the
common-club profile uses the stricter row and names the manual that forced
it. A file this scan cannot read is ``unknown``. It is never reported as
playable.

The scan reads headers only. It does not convert audio, write headers, edit
cues, or open the library for writing. ``GET /api/player-compat`` is the
same report.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

import bitrate_check
import gig_check
import library
import volumes

NEEDS_CRATE = "Choose a crate, or scan the whole library."
UNKNOWN_PLAYER = "That player is not in the list."

_READ_CAP = 256 * 1024
_MOOV_CAP = 4 * 1024 * 1024
_PCM_GUID = bytes.fromhex("0100000000001000800000aa00389b71")
_FLOAT_GUID = bytes.fromhex("0300000000001000800000aa00389b71")

_MPEG1_L3 = (0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0)
_MPEG2_L3 = (0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0)
_MPEG1_RATE = (44100, 48000, 32000)
_MPEG2_RATE = (22050, 24000, 16000)
_MPEG25_RATE = (11025, 12000, 8000)
_AAC_RATE = (
    96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000,
)

_CONTAINER_EXTENSIONS = {
    "wav": frozenset({".wav"}),
    "aiff": frozenset({".aif", ".aiff"}),
    "flac": frozenset({".flac", ".fla"}),
    "mp3": frozenset({".mp3"}),
    "mp4": frozenset({".m4a", ".aac", ".mp4", ".m4p"}),
    "ogg": frozenset({".ogg", ".oga"}),
}

_HARD = frozenset({
    "drm",
    "extension_mismatch",
    "format_not_listed",
    "he_aac",
    "aac_not_lc",
    "wav_extensible",
    "wav_float",
    "wav_not_pcm",
    "aiff_c",
    "aiff_float",
    "sample_rate",
    "bit_depth",
    "mp3_version",
    "bitrate",
})
_FIX = {
    "drm": "replace_file",
    "extension_mismatch": "rename",
    "format_not_listed": "export_pcm",
    "he_aac": "export_aac_lc",
    "aac_not_lc": "export_aac_lc",
    "wav_extensible": "export_pcm",
    "wav_float": "export_pcm",
    "wav_not_pcm": "export_pcm",
    "aiff_c": "export_pcm",
    "aiff_float": "export_pcm",
    "sample_rate": "export_rate",
    "bit_depth": "export_pcm",
    "mp3_version": "export_mp3",
    "bitrate": "export_bitrate",
    "vbr_no_xing": "add_xing",
    "bitrate_unreadable": "check_deck",
    "aac_unreadable": "check_deck",
    "offline": "connect_drive",
    "missing": "find_file",
    "unreadable": "check_deck",
    "empty": "check_deck",
    "unrecognized": "check_deck",
}


@dataclass(frozen=True)
class Source:
    """One manual the limits were read from.

    Attributes:
        code: Document number or the title printed on the manual.
        url: Public page or PDF for that document.
    """

    code: str
    url: str


@dataclass(frozen=True)
class CodecRule:
    """One row of a player's format table.

    Attributes:
        kind: ``mp3``, ``aac``, ``wav``, ``aiff``, ``flac``, or ``alac``.
        extensions: Suffixes the manual lists for this row.
        rates: Sample rates in Hz.
        depths: Bit depths. Empty means the row does not state one this scan checks.
        versions: ``mpeg1`` / ``mpeg2`` for MP3, or ``lc`` for AAC. Empty means
            the row has no version split.
        min_kbps: Lowest bit rate, or None when the row has no bit rate.
        max_kbps: Highest bit rate, or None when the row has no bit rate.
    """

    kind: str
    extensions: frozenset[str]
    rates: frozenset[int]
    depths: frozenset[int]
    versions: frozenset[str]
    min_kbps: int | None
    max_kbps: int | None


@dataclass(frozen=True)
class Profile:
    """Playable-file limits for one deck, or for the common-club intersection.

    Attributes:
        id: Query value, such as ``cdj-3000`` or ``club``.
        sources: Manuals this profile cites.
        filesystems: File systems the manuals list.
        filesystems_absent: File systems a cited manual names as unsupported.
        codecs: Format rows.
        notes: Why the club profile dropped a looser row. Empty for one deck.
    """

    id: str
    sources: tuple[Source, ...]
    filesystems: frozenset[str]
    filesystems_absent: frozenset[str]
    codecs: tuple[CodecRule, ...]
    notes: tuple[str, ...] = ()


@dataclass(frozen=True)
class Facts:
    """What a header read could prove.

    Attributes:
        container: ``wav``, ``aiff``, ``flac``, ``mp3``, ``mp4``, ``ogg``,
            ``empty``, ``unreadable``, or ``unknown``.
        codec: A short codec id the page translates.
        rate: Sample rate in Hz, or None.
        depth: Bit depth, or None.
        bitrate: Bit rate in kbps, or None.
        version: ``mpeg1``, ``mpeg2``, ``mpeg25``, ``lc``, ``he``, or empty.
        vbr: True when MP3 frames disagree or a Xing tag is present.
        xing: True when a Xing, Info, or VBRI header was found.
        readable: False when the header could not be trusted.
    """

    container: str
    codec: str
    rate: int | None = None
    depth: int | None = None
    bitrate: int | None = None
    version: str = ""
    vbr: bool | None = None
    xing: bool | None = None
    readable: bool = True


def _rule(
    kind: str,
    extensions: str,
    rates: tuple[int, ...],
    *,
    depths: tuple[int, ...] = (),
    versions: tuple[str, ...] = (),
    min_kbps: int | None = None,
    max_kbps: int | None = None,
) -> CodecRule:
    return CodecRule(
        kind,
        frozenset(extensions.split()),
        frozenset(rates),
        frozenset(depths),
        frozenset(versions),
        min_kbps,
        max_kbps,
    )


def _lossy_mp3(rates: tuple[int, ...], versions: tuple[str, ...], min_kbps: int) -> CodecRule:
    return _rule(
        "mp3", ".mp3", rates, versions=versions, min_kbps=min_kbps, max_kbps=320,
    )


def _aac(rates: tuple[int, ...]) -> CodecRule:
    return _rule(
        "aac", ".m4a .aac .mp4", rates, versions=("lc",), min_kbps=16, max_kbps=320,
    )


def _pcm(kind: str, extensions: str, rates: tuple[int, ...]) -> CodecRule:
    return _rule(kind, extensions, rates, depths=(16, 24))


_RATES_48 = (44100, 48000)
_RATES_96 = (44100, 48000, 88200, 96000)
_RATES_MP3_WIDE = (32000, 44100, 48000)
_RATES_AAC_WIDE = (16000, 22050, 24000, 32000, 44100, 48000)
_USB = frozenset({"FAT16", "FAT32", "HFS+"})
_NTFS = frozenset({"NTFS"})
_NTFS_EXFAT = frozenset({"NTFS", "exFAT"})

_NXS = Source(
    "DRI1052",
    "https://downloads.support.alphatheta.com/manuals/CDJ_2000NXS_DRI1052_manual.pdf",
)
_NXS2 = Source(
    "DRI1290A",
    "https://downloads.support.alphatheta.com/manuals/dj-players/CDJ-2000NXS2/CDJ-2000NXS2_DRI1290A_manual.pdf",
)
_CDJ3000 = Source(
    "CDJ-3000 Instruction Manual, Supported file formats; Pioneer DJ news, 10 September 2020",
    "https://www.pioneerdj.com/en/news/2020/cdj-3000-professional-dj-multi-player/",
)
_XZ = Source(
    "DRI1625B",
    "https://downloads.support.alphatheta.com/manuals/all-in-one-dj-systems/XDJ-XZ/XDJ-XZ_DRI1625B_manual.pdf",
)
_XDJ1000 = Source(
    "XDJ-1000MK2 Operating Instructions, Playable music file formats",
    "https://www.pioneerdj.com/en/product/dj-players-turntables/xdj-1000mk2/",
)


def _profile(
    profile_id: str,
    source: Source,
    codecs: tuple[CodecRule, ...],
    absent: frozenset[str],
) -> Profile:
    return Profile(profile_id, (source,), _USB, absent, codecs)


def _decks() -> dict[str, Profile]:
    """Return one profile per cited manual.

    CDJ-3000 MP3 and AAC rates are the 10 September 2020 news table (44.1 and
    48 kHz only). Its bit-rate floors are the instruction-manual row (MP3
    32–320 kbps MPEG-1, AAC-LC 16–320). CDJ-2000NXS2 DRI1290A and
    CDJ-2000NXS DRI1052 keep the wider MP3 and AAC rates. XDJ-XZ DRI1625B
    lists MPEG-1 MP3 only, FLAC to 48 kHz, and no ALAC, and it names exFAT
    as unsupported. XDJ-1000MK2 lists FLAC and ALAC to 48 kHz.
    """
    wide_mp3 = _lossy_mp3(_RATES_MP3_WIDE, ("mpeg1", "mpeg2"), 8)
    mpeg1_mp3 = _lossy_mp3(_RATES_MP3_WIDE, ("mpeg1",), 32)
    cdj3000_mp3 = _lossy_mp3(_RATES_48, ("mpeg1",), 32)
    return {
        "cdj-2000nxs": _profile(
            "cdj-2000nxs",
            _NXS,
            (wide_mp3, _aac(_RATES_AAC_WIDE), _pcm("wav", ".wav", _RATES_48), _pcm("aiff", ".aif .aiff", _RATES_48)),
            _NTFS,
        ),
        "cdj-2000nxs2": _profile(
            "cdj-2000nxs2",
            _NXS2,
            (
                wide_mp3,
                _aac(_RATES_AAC_WIDE),
                _pcm("wav", ".wav", _RATES_96),
                _pcm("aiff", ".aif .aiff", _RATES_96),
                _pcm("flac", ".flac .fla", _RATES_96),
                _pcm("alac", ".m4a", _RATES_96),
            ),
            _NTFS,
        ),
        "cdj-3000": _profile(
            "cdj-3000",
            _CDJ3000,
            (
                cdj3000_mp3,
                _aac(_RATES_48),
                _pcm("wav", ".wav", _RATES_96),
                _pcm("aiff", ".aif .aiff", _RATES_96),
                _pcm("flac", ".flac .fla", _RATES_96),
                _pcm("alac", ".m4a", _RATES_96),
            ),
            _NTFS,
        ),
        "xdj-xz": _profile(
            "xdj-xz",
            _XZ,
            (
                mpeg1_mp3,
                _aac((32000, 44100, 48000)),
                _pcm("wav", ".wav", _RATES_48),
                _pcm("aiff", ".aif .aiff", _RATES_48),
                _pcm("flac", ".flac .fla", _RATES_48),
            ),
            _NTFS_EXFAT,
        ),
        "xdj-1000mk2": _profile(
            "xdj-1000mk2",
            _XDJ1000,
            (
                wide_mp3,
                _aac(_RATES_AAC_WIDE),
                _pcm("wav", ".wav", _RATES_48),
                _pcm("aiff", ".aif .aiff", _RATES_48),
                _pcm("flac", ".flac .fla", _RATES_48),
                _pcm("alac", ".m4a", _RATES_48),
            ),
            _NTFS,
        ),
    }


def _intersect_sets(groups: Sequence[frozenset[str] | frozenset[int]], empty_means_open: bool) -> frozenset:
    if empty_means_open:
        constrained = [item for item in groups if item]
        if not constrained:
            return frozenset()
        groups = constrained
    found = set(groups[0])
    for item in groups[1:]:
        found &= set(item)
    return frozenset(found)


def _club(members: Sequence[Profile]) -> Profile:
    """Intersect the decks. A format missing from one manual is missing here."""
    kinds = set.intersection(*( {rule.kind for rule in member.codecs} for member in members ))
    codecs: list[CodecRule] = []
    for kind in sorted(kinds):
        group = tuple(next(rule for rule in member.codecs if rule.kind == kind) for member in members)
        rates = _intersect_sets(tuple(rule.rates for rule in group), False)
        extensions = _intersect_sets(tuple(rule.extensions for rule in group), False)
        versions = _intersect_sets(tuple(rule.versions for rule in group), True)
        depths = _intersect_sets(tuple(rule.depths for rule in group), True)
        if not rates or not extensions or (any(rule.versions for rule in group) and not versions):
            continue
        mins = [rule.min_kbps for rule in group if rule.min_kbps is not None]
        maxes = [rule.max_kbps for rule in group if rule.max_kbps is not None]
        codecs.append(CodecRule(
            kind,
            frozenset(extensions),
            frozenset(rates),
            frozenset(depths),
            frozenset(versions),
            max(mins) if mins else None,
            min(maxes) if maxes else None,
        ))
    by_kind = {rule.kind: rule for rule in codecs}
    notes: list[str] = []
    if not any(any(rule.kind == "flac" for rule in member.codecs) and "flac" in by_kind for member in members):
        if any(any(rule.kind == "flac" for rule in member.codecs) for member in members):
            notes.append("club_flac")
    if any(any(rule.kind == "alac" for rule in member.codecs) for member in members) and "alac" not in by_kind:
        notes.append("club_alac")
    if "mp3" in by_kind and any(
        next(rule for rule in member.codecs if rule.kind == "mp3").rates - by_kind["mp3"].rates
        for member in members if any(rule.kind == "mp3" for rule in member.codecs)
    ):
        notes.append("club_mp3_rate")
    if "mp3" in by_kind and any(
        "mpeg2" in next(rule for rule in member.codecs if rule.kind == "mp3").versions
        and "mpeg2" not in by_kind["mp3"].versions
        for member in members
    ):
        notes.append("club_mp3_mpeg2")
    if "wav" in by_kind and any(
        next(rule for rule in member.codecs if rule.kind == "wav").rates - by_kind["wav"].rates
        for member in members if any(rule.kind == "wav" for rule in member.codecs)
    ):
        notes.append("club_wav_rate")
    if "aac" in by_kind and any(
        next(rule for rule in member.codecs if rule.kind == "aac").rates - by_kind["aac"].rates
        for member in members if any(rule.kind == "aac" for rule in member.codecs)
    ):
        notes.append("club_aac_rate")
    if any("exFAT" in member.filesystems_absent for member in members):
        notes.append("club_exfat")
    sources = tuple(source for member in members for source in member.sources)
    return Profile(
        "club",
        sources,
        frozenset.intersection(*(member.filesystems for member in members)),
        frozenset.union(*(member.filesystems_absent for member in members)),
        tuple(codecs),
        tuple(notes),
    )


_DECKS = _decks()
_CLUB_ORDER = ("cdj-2000nxs", "cdj-2000nxs2", "cdj-3000", "xdj-xz", "xdj-1000mk2")
PROFILES: dict[str, Profile] = {
    "club": _club(tuple(_DECKS[name] for name in _CLUB_ORDER)),
    **_DECKS,
}
PLAYER_IDS: tuple[str, ...] = ("club", "cdj-3000", "cdj-2000nxs2", "cdj-2000nxs", "xdj-xz", "xdj-1000mk2")


def require_player(player: str) -> Profile:
    """Return the profile named ``player``.

    Args:
        player: A value from :data:`PLAYER_IDS`.

    Returns:
        That profile. ``club`` is the stricter intersection.

    Raises:
        library.LibraryError: The id is not in the list (400).
    """
    found = PROFILES.get(player)
    if found is None:
        raise library.LibraryError(UNKNOWN_PLAYER, 400)
    return found


def _skip_id3(handle: object, start: int, end: int) -> int:
    """Return the offset just after a leading ID3v2 tag."""
    if end - start < 10:
        return start
    blob = _read_at(handle, start, 10)
    if blob[:3] != b"ID3":
        return start
    size = 10 + _synchsafe(blob[6:10])
    if blob[5] & 0x10:
        size += 10
    return min(end, start + size)


def _synchsafe(raw: bytes) -> int:
    value = 0
    for byte in raw[:4]:
        value = (value << 7) | (byte & 0x7F)
    return value


def _read_at(handle: object, offset: int, count: int) -> bytes:
    reader = getattr(handle, "seek")
    reader(offset)
    return getattr(handle, "read")(count)


def _extended80(raw: bytes) -> int | None:
    """Decode an 80-bit AIFF sample rate to a whole number of Hz."""
    if len(raw) < 10:
        return None
    exponent = ((raw[0] & 0x7F) << 8) | raw[1]
    mantissa = int.from_bytes(raw[2:10], "big")
    if exponent == 0 or mantissa == 0:
        return 0
    if exponent == 0x7FFF:
        return None
    shift = exponent - 16383 - 63
    if shift >= 0:
        return mantissa << shift
    return mantissa >> -shift


def _wav_facts(data: bytes) -> Facts:
    if len(data) < 12 or data[8:12] != b"WAVE":
        return Facts("unreadable", "unknown", readable=False)
    if data[:4] == b"RIFX":
        return Facts("unreadable", "unknown", readable=False)
    if data[:4] != b"RIFF":
        return Facts("unknown", "unknown", readable=False)
    offset = 12
    fmt = b""
    while offset + 8 <= len(data):
        kind = data[offset:offset + 4]
        size = int.from_bytes(data[offset + 4:offset + 8], "little")
        payload = data[offset + 8:offset + 8 + size]
        if kind == b"fmt ":
            fmt = payload
            break
        step = 8 + size + (size & 1)
        if step <= 0:
            break
        offset += step
    if len(fmt) < 16:
        return Facts("unreadable", "unknown", readable=False)
    tag = int.from_bytes(fmt[0:2], "little")
    rate = int.from_bytes(fmt[4:8], "little")
    depth = int.from_bytes(fmt[14:16], "little")
    if tag == 0xFFFE:
        guid = fmt[24:40] if len(fmt) >= 40 else b""
        if guid[:4] == _FLOAT_GUID[:4]:
            return Facts("wav", "wav-float", rate or None, depth or None)
        return Facts("wav", "wav-extensible", rate or None, depth or None)
    if tag == 3:
        return Facts("wav", "wav-float", rate or None, depth or None)
    if tag != 1:
        return Facts("wav", "wav-not-pcm", rate or None, depth or None)
    return Facts("wav", "wav", rate or None, depth or None)


def _aiff_facts(data: bytes) -> Facts:
    if len(data) < 12 or data[:4] != b"FORM":
        return Facts("unknown", "unknown", readable=False)
    form = data[8:12]
    if form not in {b"AIFF", b"AIFC"}:
        return Facts("unknown", "unknown", readable=False)
    offset = 12
    comm = b""
    while offset + 8 <= len(data):
        kind = data[offset:offset + 4]
        size = int.from_bytes(data[offset + 4:offset + 8], "big")
        payload = data[offset + 8:offset + 8 + size]
        if kind == b"COMM":
            comm = payload
            break
        step = 8 + size + (size & 1)
        if step <= 0:
            break
        offset += step
    if len(comm) < 18:
        return Facts("unreadable", "unknown", readable=False)
    depth = int.from_bytes(comm[6:8], "big")
    rate = _extended80(comm[8:18])
    if form == b"AIFC":
        compression = comm[18:22]
        if compression in {b"fl32", b"FL32", b"fl64"}:
            return Facts("aiff", "aiff-float", rate, depth or None)
        return Facts("aiff", "aiff-c", rate, depth or None)
    return Facts("aiff", "aiff", rate, depth or None)


def _flac_facts(data: bytes) -> Facts:
    if not data.startswith(b"fLaC") or len(data) < 8:
        return Facts("unreadable", "unknown", readable=False)
    kind = data[4] & 0x7F
    length = int.from_bytes(data[5:8], "big")
    if kind != 0 or length < 18 or len(data) < 8 + 18:
        return Facts("unreadable", "unknown", readable=False)
    info = int.from_bytes(data[8:8 + 18], "big")
    samples = info & ((1 << 36) - 1)
    depth_code = (info >> 36) & 0x1F
    rate = (info >> (36 + 5 + 3)) & ((1 << 20) - 1)
    del samples
    if rate <= 0:
        return Facts("unreadable", "unknown", readable=False)
    return Facts("flac", "flac", rate, depth_code + 1)


def _mp3_word(data: bytes, offset: int) -> dict[str, object] | None:
    if offset + 4 > len(data):
        return None
    word = int.from_bytes(data[offset:offset + 4], "big")
    if word & 0xFFE00000 != 0xFFE00000:
        return None
    version_bits = (word >> 19) & 3
    layer = (word >> 17) & 3
    if version_bits == 1 or layer != 1:
        return None
    bitrate_index = (word >> 12) & 0xF
    rate_index = (word >> 10) & 3
    padding = (word >> 9) & 1
    mode = (word >> 6) & 3
    protection = (word >> 16) & 1
    if rate_index == 3 or bitrate_index in {0, 15}:
        return None
    if version_bits == 3:
        version, rates, bitrates, scale = "mpeg1", _MPEG1_RATE, _MPEG1_L3, 144
    elif version_bits == 2:
        version, rates, bitrates, scale = "mpeg2", _MPEG2_RATE, _MPEG2_L3, 72
    else:
        version, rates, bitrates, scale = "mpeg25", _MPEG25_RATE, _MPEG2_L3, 72
    kbps = bitrates[bitrate_index]
    rate = rates[rate_index]
    length = int(scale * kbps * 1000 / rate) + padding
    if length < 4:
        return None
    return {
        "version": version,
        "kbps": kbps,
        "rate": rate,
        "length": length,
        "mode": mode,
        "protection": protection,
        "version_bits": version_bits,
    }


def _xing_at(data: bytes, offset: int, header: dict[str, object]) -> bool:
    crc = 0 if header["protection"] else 2
    if header["version_bits"] == 3:
        side = 32 if header["mode"] != 3 else 17
    else:
        side = 17 if header["mode"] != 3 else 9
    marks = (offset + 4 + crc + side, offset + 4 + crc + 32)
    for mark in marks:
        tag = data[mark:mark + 4]
        if tag in {b"Xing", b"Info", b"VBRI"}:
            return True
    return False


def _mp3_facts(data: bytes) -> Facts:
    first: dict[str, object] | None = None
    offset = 0
    limit = min(len(data), _READ_CAP)
    while offset + 4 <= limit:
        header = _mp3_word(data, offset)
        if header is not None:
            first = header
            break
        offset += 1
    if first is None:
        return Facts("unknown", "unknown", readable=False)
    length = int(first["length"])
    bitrates = [int(first["kbps"])]
    cursor = offset + length
    frames = 1
    while frames < 12 and cursor + 4 <= limit:
        nxt = _mp3_word(data, cursor)
        if nxt is None or nxt["version"] != first["version"] or nxt["rate"] != first["rate"]:
            break
        bitrates.append(int(nxt["kbps"]))
        cursor += int(nxt["length"])
        frames += 1
    if frames < 2:
        return Facts("unreadable", "unknown", readable=False)
    xing = _xing_at(data, offset, first)
    crc = 0 if first["protection"] else 2
    if first["version_bits"] == 3:
        side = 32 if first["mode"] != 3 else 17
    else:
        side = 17 if first["mode"] != 3 else 9
    tag = data[offset + 4 + crc + side:offset + 8 + crc + side]
    if tag == b"Xing" or data[offset + 4 + crc + 32:offset + 8 + crc + 32] == b"VBRI":
        vbr = True
    else:
        vbr = len(set(bitrates)) > 1
    return Facts(
        "mp3",
        "mp3",
        int(first["rate"]),
        None,
        bitrates[0],
        str(first["version"]),
        vbr,
        xing,
    )


def _desc(data: bytes, index: int) -> tuple[int, bytes, int] | None:
    if index >= len(data):
        return None
    tag = data[index]
    index += 1
    length = 0
    for _ in range(4):
        if index >= len(data):
            return None
        byte = data[index]
        index += 1
        length = (length << 7) | (byte & 0x7F)
        if not byte & 0x80:
            break
    return tag, data[index:index + length], index + length


def _aot(body: bytes) -> tuple[int, int | None]:
    if not body:
        return 0, None
    bits = int.from_bytes(body[: min(4, len(body))], "big")
    width = min(4, len(body)) * 8
    shift = width - 5
    if shift < 0:
        return 0, None
    aot = (bits >> shift) & 0x1F
    used = 5
    if aot == 31:
        if width < 11:
            return 0, None
        aot = 32 + ((bits >> (width - 11)) & 0x3F)
        used = 11
    if width < used + 4:
        return aot, None
    freq = (bits >> (width - used - 4)) & 0xF
    if freq == 0xF:
        return aot, None
    if freq >= len(_AAC_RATE):
        return aot, None
    return aot, _AAC_RATE[freq]


def _find_dsi(data: bytes) -> tuple[int, int | None] | None:
    """Return the AAC audio object type inside an esds payload."""
    index = 0
    while index < len(data):
        parsed = _desc(data, index)
        if parsed is None:
            return None
        tag, body, index = parsed
        if tag == 0x05 and body:
            return _aot(body)
        if tag == 0x03 and len(body) >= 3:
            nested = body[3:]
            if body[2] & 0x80 and len(nested) >= 2:
                nested = nested[2:]
            found = _find_dsi(nested)
        elif tag == 0x04 and len(body) >= 13:
            found = _find_dsi(body[13:])
        else:
            found = _find_dsi(body)
        if found is not None:
            return found
    return None


def _boxes(data: bytes, start: int, end: int):
    offset = start
    while offset + 8 <= end:
        size = int.from_bytes(data[offset:offset + 4], "big")
        kind = data[offset + 4:offset + 8]
        header = 8
        if size == 1 and offset + 16 <= end:
            size = int.from_bytes(data[offset + 8:offset + 16], "big")
            header = 16
        elif size == 0:
            size = end - offset
        if size < header or offset + size > end:
            break
        yield kind, offset + header, offset + size
        offset += size


def _mp4_facts(data: bytes) -> Facts:
    if len(data) < 12:
        return Facts("unreadable", "unknown", readable=False)
    entries: list[tuple[bytes, bytes]] = []

    def walk(start: int, end: int, want_stsd: bool) -> None:
        for kind, payload, stop in _boxes(data, start, end):
            if kind == b"stsd":
                body = data[payload:stop]
                if len(body) < 8:
                    continue
                count = int.from_bytes(body[4:8], "big")
                cursor = 8
                for _ in range(count):
                    if cursor + 8 > len(body):
                        break
                    entry_size = int.from_bytes(body[cursor:cursor + 4], "big")
                    entry_kind = body[cursor + 4:cursor + 8]
                    if entry_size < 8 or cursor + entry_size > len(body):
                        break
                    entries.append((entry_kind, body[cursor + 8:cursor + entry_size]))
                    cursor += entry_size
            elif kind != b"mdat":
                walk(payload, stop, True)

    walk(0, len(data), False)
    if not entries:
        return Facts("unreadable", "unknown", readable=False)
    kind, payload = entries[0]
    rate = None
    depth = None
    if len(payload) >= 28:
        depth = int.from_bytes(payload[18:20], "big") or None
        rate_fixed = int.from_bytes(payload[24:28], "big")
        rate = (rate_fixed >> 16) or None
    if kind == b"drms":
        return Facts("mp4", "drm", rate, depth)
    if kind == b"alac":
        return Facts("mp4", "alac", rate, depth)
    if kind != b"mp4a":
        return Facts("mp4", "unknown", rate, depth, readable=True)
    dsi = None
    for box_kind, box_start, box_end in _boxes(payload, 28, len(payload)):
        if box_kind == b"esds":
            dsi = _find_dsi(payload[box_start + 4:box_end])
            break
    if dsi is None:
        return Facts("mp4", "aac", rate, depth, version="", readable=True)
    aot, aac_rate = dsi
    if aac_rate:
        rate = aac_rate
    if aot in {5, 29, 42}:
        return Facts("mp4", "he-aac", rate, depth, version="he")
    if aot == 2:
        return Facts("mp4", "aac-lc", rate, depth, version="lc")
    if aot:
        return Facts("mp4", "aac", rate, depth, version="other")
    return Facts("mp4", "aac", rate, depth, version="", readable=True)


def _ogg_facts() -> Facts:
    return Facts("ogg", "ogg")


def inspect_bytes(data: bytes, extension: str) -> Facts:
    """Read a container header from bytes already in memory.

    Args:
        data: File prefix, with any leading ID3v2 tag still present.
        extension: Lowercase suffix, including the dot. ``.m4p`` is DRM
            even when the atoms look like plain AAC.

    Returns:
        Header facts. ``readable`` is False when the prefix is not a
        container this scan can judge.
    """
    suffix = extension.lower()
    if not data:
        return Facts("empty", "unknown", readable=False)
    start = 0
    if data[:3] == b"ID3" and len(data) >= 10:
        start = min(len(data), 10 + _synchsafe(data[6:10]))
    view = data[start:]
    if view.startswith(b"RIFF") or view.startswith(b"RIFX"):
        facts = _wav_facts(view)
    elif view.startswith(b"FORM"):
        facts = _aiff_facts(view)
    elif view.startswith(b"fLaC"):
        facts = _flac_facts(view)
    elif view.startswith(b"OggS"):
        facts = _ogg_facts()
    elif len(view) >= 8 and (view[4:8] == b"ftyp" or view[:4] == b"ftyp"):
        facts = _mp4_facts(view if view[4:8] == b"ftyp" else data[start:])
    else:
        facts = _mp3_facts(view)
    if suffix == ".m4p":
        return Facts("mp4", "drm", facts.rate, facts.depth, facts.bitrate, facts.version)
    return facts


def _inspect_path(path: Path) -> Facts:
    """Read only the header of ``path``."""
    try:
        size = path.stat().st_size
    except OSError:
        return Facts("unreadable", "unknown", readable=False)
    if size <= 0:
        return Facts("empty", "unknown", readable=False)
    suffix = path.suffix.lower()
    try:
        with path.open("rb") as handle:
            end = size
            start = _skip_id3(handle, 0, end)
            window = _read_at(handle, start, min(_READ_CAP, end - start))
    except OSError:
        return Facts("unreadable", "unknown", readable=False)
    if len(window) >= 8 and window[4:8] == b"ftyp":
        try:
            with path.open("rb") as handle:
                moov = _extract_moov(handle, start, end)
        except OSError:
            return Facts("unreadable", "unknown", readable=False)
        if moov is None:
            return Facts("unreadable", "unknown", readable=False)
        facts = _mp4_facts(moov)
        if suffix == ".m4p":
            return Facts("mp4", "drm", facts.rate, facts.depth)
        return facts
    return inspect_bytes(window, suffix)


def _extract_moov(handle: object, start: int, end: int) -> bytes | None:
    """Return the moov box, or the whole prefix when the file is small."""
    if end - start <= _READ_CAP:
        return _read_at(handle, start, end - start)
    offset = start
    while offset + 8 <= end:
        header = _read_at(handle, offset, 16)
        if len(header) < 8:
            return None
        size = int.from_bytes(header[:4], "big")
        kind = header[4:8]
        header_len = 8
        if size == 1:
            if len(header) < 16:
                return None
            size = int.from_bytes(header[8:16], "big")
            header_len = 16
        elif size == 0:
            size = end - offset
        if size < header_len:
            return None
        if kind == b"moov":
            if size > _MOOV_CAP:
                return None
            return _read_at(handle, offset, size)
        offset += size
    return None


def _file_label(file_name: object, stored: str) -> str:
    """Return the last path piece, splitting on either slash."""
    raw = file_name if isinstance(file_name, str) and file_name.strip() else stored
    text = raw.replace("\\", "/")
    name = text.rsplit("/", 1)[-1]
    return name or raw


def _rule_for(profile: Profile, facts: Facts) -> CodecRule | None:
    kind = {
        "wav": "wav",
        "wav-extensible": "wav",
        "wav-float": "wav",
        "wav-not-pcm": "wav",
        "aiff": "aiff",
        "aiff-c": "aiff",
        "aiff-float": "aiff",
        "flac": "flac",
        "alac": "alac",
        "aac-lc": "aac",
        "he-aac": "aac",
        "aac": "aac",
        "mp3": "mp3",
    }.get(facts.codec)
    if kind is None:
        return None
    for rule in profile.codecs:
        if rule.kind == kind:
            return rule
    return None


def judge(facts: Facts, profile: Profile, extension: str) -> tuple[str, list[str], str]:
    """Decide will-play, check-first, won't-play, or unknown.

    Args:
        facts: Header read.
        profile: Deck limits.
        extension: Lowercase suffix, including the dot.

    Returns:
        Verdict, reason codes, and one fix code. ``will_play`` means the
        header sits inside the cited table. It does not mean a deck played
        the file. Unreadable files stay ``unknown``.
    """
    suffix = extension.lower()
    if facts.container == "empty":
        return "unknown", ["empty"], _FIX["empty"]
    if not facts.readable or facts.container in {"unreadable", "unknown"}:
        code = "unrecognized" if facts.container == "unknown" else "unreadable"
        return "unknown", [code], _FIX[code]
    reasons: list[str] = []
    if suffix == ".m4p" or facts.codec == "drm":
        reasons.append("drm")
    allowed = _CONTAINER_EXTENSIONS.get(facts.container, frozenset())
    if suffix and suffix not in allowed and "drm" not in reasons:
        reasons.append("extension_mismatch")
    if facts.codec == "unknown" and "drm" not in reasons and "extension_mismatch" not in reasons:
        return "unknown", ["unrecognized"], _FIX["unrecognized"]
    if facts.codec == "wav-extensible":
        reasons.append("wav_extensible")
    elif facts.codec == "wav-float":
        reasons.append("wav_float")
    elif facts.codec == "wav-not-pcm":
        reasons.append("wav_not_pcm")
    elif facts.codec == "aiff-c":
        reasons.append("aiff_c")
    elif facts.codec == "aiff-float":
        reasons.append("aiff_float")
    elif facts.codec == "he-aac":
        reasons.append("he_aac")
    rule = _rule_for(profile, facts)
    if rule is None and "drm" not in reasons and "extension_mismatch" not in reasons:
        reasons.append("format_not_listed")
    if rule is not None and "extension_mismatch" not in reasons and "drm" not in reasons:
        if facts.codec == "aac" and facts.version == "":
            reasons.append("aac_unreadable")
        elif facts.codec == "aac" and facts.version not in {"lc", ""}:
            reasons.append("aac_not_lc")
        if facts.version in {"mpeg1", "mpeg2", "mpeg25"} and rule.versions and facts.version not in rule.versions:
            reasons.append("mp3_version")
        if facts.rate is not None and facts.rate not in rule.rates:
            reasons.append("sample_rate")
        if rule.depths and facts.depth is not None and facts.depth not in rule.depths:
            reasons.append("bit_depth")
        if (
            facts.bitrate is not None
            and rule.min_kbps is not None
            and rule.max_kbps is not None
            and not (rule.min_kbps <= facts.bitrate <= rule.max_kbps)
        ):
            reasons.append("bitrate")
        if facts.container == "mp3" and facts.bitrate is None and "bitrate" not in reasons:
            reasons.append("bitrate_unreadable")
        if facts.container == "mp3" and facts.vbr and not facts.xing:
            reasons.append("vbr_no_xing")
    hard = [code for code in reasons if code in _HARD]
    if hard:
        return "wont_play", reasons, _FIX[hard[0]]
    if reasons:
        return "check_first", reasons, _FIX[reasons[0]]
    return "will_play", [], "none"


def _limits(profile: Profile) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for rule in profile.codecs:
        rows.append({
            "kind": rule.kind,
            "rates": sorted(rule.rates),
            "depths": sorted(rule.depths),
            "versions": sorted(rule.versions),
            "min_kbps": rule.min_kbps,
            "max_kbps": rule.max_kbps,
        })
    return rows


def _profile_body(profile: Profile) -> dict[str, object]:
    return {
        "player": profile.id,
        "documents": [{"code": source.code, "url": source.url} for source in profile.sources],
        "filesystems": sorted(profile.filesystems),
        "filesystems_not_supported": sorted(profile.filesystems_absent),
        "notes": list(profile.notes),
        "limits": _limits(profile),
        "read_only": True,
    }


def _rows(database: Path, space: str, crate_id: int | None) -> list[sqlite3.Row]:
    conn = gig_check.open_read_only(database)
    try:
        rows = conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.file_name, a.portable_id
            FROM asset a
            JOIN space_asset sa ON sa.asset_id = a.id
            JOIN space s ON s.id = sa.space_id
            WHERE s.name = ?
            ORDER BY a.name COLLATE NOCASE, a.id
            """,
            (space,),
        ).fetchall()
        if crate_id is not None:
            library.container_in_space(conn, crate_id, space)
            members = bitrate_check._crate_assets(conn, library.descendant_ids(conn, crate_id))
            rows = [row for row in rows if int(row["id"]) in members]
    finally:
        conn.close()
    return rows


def scan(
    database: Path,
    space: str,
    crate_id: int | None = None,
    player: str = "club",
    scope: str | None = None,
) -> dict[str, object]:
    """Judge one crate, or a whole space, against one player.

    Args:
        database: ``master.sqlite``. Opened read-only.
        space: Space name, such as ``Serato Library``.
        crate_id: Crate id, or None for the whole space.
        player: A :data:`PLAYER_IDS` value. Defaults to ``club``.
        scope: ``crate`` or ``library``. Omitted, a crate id means ``crate``
            and a missing crate id means ``library``.

    Returns:
        The profile citation, filesystem notes, counts, and one row per
        track. ``file`` is the file name, not the path. ``verdict`` is
        ``will_play``, ``check_first``, ``wont_play``, or ``unknown``.

    Raises:
        library.LibraryError: Unknown space, unknown player, a crate scope
            with no crate (400), a crate that is not in the space (404), or
            a database that cannot be opened read-only.
    """
    if space not in library.ALLOWED_SPACES:
        raise library.LibraryError("That space is not available here.")
    profile = require_player(player)
    chosen = scope
    if chosen is None:
        chosen = "library" if crate_id is None else "crate"
    if chosen not in {"library", "crate"}:
        raise library.LibraryError("That request is not valid.", 400)
    if chosen == "library":
        crate_id = None
    elif crate_id is None:
        raise library.LibraryError(NEEDS_CRATE, 400)
    counts = {"will_play": 0, "check_first": 0, "wont_play": 0, "unknown": 0}
    tracks: list[dict[str, object]] = []
    mounts = volumes.Mounts()
    for row in _rows(database, space, crate_id):
        stored = row["portable_id"] if isinstance(row["portable_id"], str) else ""
        label = _file_label(row["file_name"], stored)
        suffix = Path(label).suffix.lower()
        base = {
            "id": int(row["id"]),
            "name": str(row["name"] or ""),
            "artist": str(row["artist"] or ""),
            "file": label,
            "extension": suffix,
            "codec": "unknown",
            "rate_hz": None,
            "depth": None,
            "bitrate_kbps": None,
            "version": "",
        }
        if stored and volumes.absent_volume(stored, mounts=mounts) is not None:
            verdict, reasons, fix = "unknown", ["offline"], _FIX["offline"]
        else:
            resolved = library.resolved_path(stored) if stored else None
            path = Path(resolved) if resolved else None
            try:
                present = path is not None and path.is_file()
            except (OSError, ValueError):
                present = False
            if path is None or not present:
                verdict, reasons, fix = "unknown", ["missing"], _FIX["missing"]
            else:
                facts = _inspect_path(path)
                verdict, reasons, fix = judge(facts, profile, suffix or path.suffix.lower())
                base["codec"] = facts.codec
                base["rate_hz"] = facts.rate
                base["depth"] = facts.depth
                base["bitrate_kbps"] = facts.bitrate
                base["version"] = facts.version
        counts[verdict] += 1
        tracks.append({**base, "verdict": verdict, "reasons": reasons, "fix": fix})
    opened = counts["will_play"] + counts["check_first"] + counts["wont_play"]
    return {
        **_profile_body(profile),
        "scope": chosen,
        "crate": crate_id,
        "checked": opened,
        "counts": counts,
        "tracks": tracks,
    }


def main(argv: Sequence[str] | None = None) -> int:
    """Print the report as JSON.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0 when the report was printed, 1 when the library could not be read.
    """
    parser = argparse.ArgumentParser(
        description="List tracks a CDJ or XDJ will refuse. Read-only."
    )
    parser.add_argument("--database", type=Path, default=Path(library.MASTER))
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    parser.add_argument("--crate", type=int, default=None)
    parser.add_argument("--player", default="club")
    parser.add_argument("--scope", choices=("crate", "library"), default=None)
    args = parser.parse_args(argv)
    try:
        result = scan(args.database, args.space, args.crate, args.player, args.scope)
    except library.LibraryError as exc:
        print(exc.message, file=sys.stderr)
        return 1
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
