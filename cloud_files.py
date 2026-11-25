#!/usr/bin/env python3
"""Tell a local file from a cloud placeholder without downloading it.

Scanning uses ``os.stat`` only. On Windows the cloud bits come from
``st_file_attributes`` (the same values ``GetFileAttributes`` reports).
Nothing here opens a file, reads bytes, changes pinning, or writes the
Serato database.

Apple's technote TN3150 says ``SF_DATALESS`` in ``stat.st_flags`` marks a
dataless file, and that ``stat`` does not materialize that file. The same
note says ``stat`` can materialize a dataless parent folder. This module
still does not read audio. Microsoft's cloud-files guidance says
``FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS`` means the bytes are not fully
local and a read can hydrate them, so those files are not opened.

``optimize-storage`` in ``~/Library/Preferences/com.apple.bird.plist`` is
the iCloud "Optimize Mac Storage" switch (``defaults read com.apple.bird
optimize-storage``). Only a boolean true or an integer 1 counts as on.
A missing key, a false, or a zero is not reported as on.
"""

from __future__ import annotations

import json
import os
import plistlib
import stat
import sys
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path

# Apple TN3150. The flag is 0x40000000 in sys/stat.h. Python names it
# SF_DATALESS on macOS; the number is used when the name is absent.
SF_DATALESS = int(getattr(stat, "SF_DATALESS", 0x40000000))

# winnt.h. A read of a file with RECALL_ON_DATA_ACCESS can download it.
FILE_ATTRIBUTE_OFFLINE = 0x1000
FILE_ATTRIBUTE_RECALL_ON_OPEN = 0x00040000
FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS = 0x00400000

SUPPORTED_PROVIDERS = frozenset({"icloud", "dropbox", "onedrive"})
STATUSES = frozenset({"local", "cloud", "missing", "unknown"})

_INFO_LIMIT = 1_000_000


@dataclass(frozen=True, slots=True)
class Probe:
    """Metadata for one path. No file was opened to build it.

    Attributes:
        kind: ``file``, ``missing``, ``unreadable``, or ``not_file``.
        platform: ``sys.platform`` value the flags were read on.
        flags_known: True when ``st_flags`` was present.
        dataless: True when ``SF_DATALESS`` was set.
        icloud_stub: True when the path is absent and ``.name.icloud`` is there.
        attributes_known: True when Windows file attributes were present.
        recall_on_data_access: Windows bit that hydrates on read.
        recall_on_open: Windows bit that hydrates on open.
        offline: Windows offline attribute.
    """

    kind: str
    platform: str
    flags_known: bool = False
    dataless: bool = False
    icloud_stub: bool = False
    attributes_known: bool = False
    recall_on_data_access: bool = False
    recall_on_open: bool = False
    offline: bool = False


@dataclass(frozen=True, slots=True)
class Availability:
    """How a track can be played from this computer.

    Attributes:
        status: ``local``, ``cloud``, ``missing``, or ``unknown``.
        provider: ``icloud``, ``dropbox``, ``onedrive``, ``other``,
            ``file-provider``, or empty when no cloud folder matched.
        reason: Stable code for tests and the page.
    """

    status: str
    provider: str
    reason: str


@dataclass(frozen=True, slots=True)
class CloudRoot:
    """One cloud-managed folder this computer has.

    Attributes:
        provider: ``icloud``, ``dropbox``, ``onedrive``, or ``other``.
        path: Absolute folder path as discovered, not a rewritten one.
    """

    provider: str
    path: str


@dataclass(frozen=True, slots=True)
class CloudTrack:
    """One library row whose audio is not counted as local.

    Attributes:
        path: Path that was classified.
        title: Track title.
        artist: Artist.
        crate: Crate label, or the scope name.
        provider: Cloud folder name, or ``file-provider``.
        status: ``cloud`` or ``unknown``.
        reason: Why that status was chosen.
    """

    path: str
    title: str
    artist: str
    crate: str
    provider: str
    status: str
    reason: str


@dataclass(frozen=True, slots=True)
class CloudLocation:
    """A Serato folder or music root that sits inside a cloud folder.

    Attributes:
        role: ``library`` or ``music``.
        provider: Cloud provider id.
        path: The cloud folder that contains it.
        optimize_storage: True only when Optimize Mac Storage was read as on
            for an iCloud location. None otherwise, including when the
            switch is off or could not be read.
    """

    role: str
    provider: str
    path: str
    optimize_storage: bool | None


def dataless_bits(flags: int | None) -> tuple[bool, bool]:
    """Return whether macOS flags were readable and whether the file is dataless.

    Args:
        flags: ``st_flags``, or None when this platform has no such field.

    Returns:
        ``flags_known`` and ``dataless``. A missing field is not dataless.
    """
    if flags is None:
        return False, False
    return True, bool(int(flags) & SF_DATALESS)


def windows_attribute_bits(attributes: int | None) -> tuple[bool, bool, bool, bool]:
    """Return the Windows cloud bits from a file-attribute mask.

    Args:
        attributes: ``st_file_attributes``, or None when this is not Windows.

    Returns:
        ``attributes_known``, ``recall_on_data_access``, ``recall_on_open``,
        and ``offline``. None means the bits were not read.
    """
    if attributes is None:
        return False, False, False, False
    value = int(attributes)
    return (
        True,
        bool(value & FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS),
        bool(value & FILE_ATTRIBUTE_RECALL_ON_OPEN),
        bool(value & FILE_ATTRIBUTE_OFFLINE),
    )


def _probe(
    kind: str,
    platform: str,
    *,
    flags_known: bool = False,
    dataless: bool = False,
    icloud_stub: bool = False,
    attributes_known: bool = False,
    recall_on_data_access: bool = False,
    recall_on_open: bool = False,
    offline: bool = False,
) -> Probe:
    """Build a probe. Callers pass only the bits they know.

    Args:
        kind: ``file``, ``missing``, ``unreadable``, or ``not_file``.
        platform: Platform the stat ran on.
        flags_known: Whether ``st_flags`` existed.
        dataless: ``SF_DATALESS``.
        icloud_stub: A ``.name.icloud`` sibling stands in for the file.
        attributes_known: Whether Windows attributes existed.
        recall_on_data_access: Windows recall-on-read bit.
        recall_on_open: Windows recall-on-open bit.
        offline: Windows offline bit.

    Returns:
        A frozen probe.
    """
    return Probe(
        kind,
        platform,
        flags_known,
        dataless,
        icloud_stub,
        attributes_known,
        recall_on_data_access,
        recall_on_open,
        offline,
    )


def _icloud_stub_exists(path: Path) -> bool:
    """Return whether an older iCloud placeholder sits beside this path.

    The stub is ``.filename.ext.icloud``. ``lstat`` does not read it, so
    the placeholder is not downloaded.

    Args:
        path: The audio path Serato stored. It is not opened.

    Returns:
        True when that sibling is a regular file.
    """
    if not path.name:
        return False
    stub = path.with_name("." + path.name + ".icloud")
    try:
        info = os.lstat(stub)
    except OSError:
        return False
    return stat.S_ISREG(info.st_mode)


def probe_path(path: Path) -> Probe:
    """Stat one path without opening or reading it.

    Args:
        path: File to classify.

    Returns:
        A probe. A missing path whose ``.icloud`` stub exists is a file
        with ``icloud_stub`` set, not a missing file.
    """
    platform = sys.platform
    if not path.name and not str(path):
        return _probe("missing", platform)
    try:
        info = os.stat(path)
    except FileNotFoundError:
        if _icloud_stub_exists(path):
            return _probe("file", platform, icloud_stub=True, flags_known=True)
        return _probe("missing", platform)
    except OSError:
        return _probe("unreadable", platform)
    if not stat.S_ISREG(info.st_mode):
        return _probe("not_file", platform)
    flags_known, dataless = dataless_bits(getattr(info, "st_flags", None))
    attributes_known, recall_data, recall_open, offline = windows_attribute_bits(
        getattr(info, "st_file_attributes", None)
    )
    return _probe(
        "file",
        platform,
        flags_known=flags_known,
        dataless=dataless,
        attributes_known=attributes_known,
        recall_on_data_access=recall_data,
        recall_on_open=recall_open,
        offline=offline,
    )


def _verifiable(probe: Probe) -> bool:
    """Return whether this platform can see placeholder flags.

    Args:
        probe: Stat result.

    Returns:
        True on macOS when ``st_flags`` was present, and on Windows when
        file attributes were present. Linux cannot verify hydration.
    """
    if probe.platform == "darwin":
        return probe.flags_known
    if probe.platform == "win32":
        return probe.attributes_known
    return False


def classify(probe: Probe, provider: str) -> Availability:
    """Turn a probe and a cloud-folder name into local, cloud, missing, or unknown.

    A file in a folder this check does not support (``other``) is never
    ``local``. A supported cloud folder is ``local`` only when this
    platform can see that the placeholder bits are clear. A positive
    placeholder bit is ``cloud`` for every provider, including ``other``.

    Args:
        probe: Metadata from ``probe_path`` or a test.
        provider: ``icloud``, ``dropbox``, ``onedrive``, ``other``, or empty.

    Returns:
        The status, the provider to show, and a reason code.
    """
    named = provider or ""
    if probe.icloud_stub or probe.dataless:
        return Availability("cloud", named or "file-provider", "icloud_stub" if probe.icloud_stub else "dataless")
    if probe.kind == "missing":
        return Availability("missing", named, "not_found")
    if probe.kind == "unreadable":
        return Availability("unknown", named, "unreadable")
    if probe.kind != "file":
        return Availability("unknown", named, "not_a_file")
    if probe.recall_on_data_access or probe.recall_on_open:
        return Availability("cloud", named or "file-provider", "recall")
    if probe.offline and named:
        return Availability("cloud", named, "offline_attribute")
    if probe.offline:
        return Availability("unknown", "", "offline_attribute")
    if named == "other":
        return Availability("unknown", "other", "unsupported_provider")
    if named in SUPPORTED_PROVIDERS and not _verifiable(probe):
        return Availability("unknown", named, "unverified_cloud")
    return Availability("local", named, "present")


def _key(path: str, *, fold: bool) -> str:
    """Normalize a path for a prefix test, without touching the disk.

    Args:
        path: A stored path or a discovered folder.
        fold: True on Windows, where the match ignores case.

    Returns:
        Slash-separated path with ``.`` and ``..`` removed. Empty when
        ``path`` is empty.
    """
    text = path.strip().replace("\\", "/")
    if not text:
        return ""
    drive = ""
    rest = text
    if len(text) >= 2 and text[1] == ":":
        drive = text[:2]
        rest = text[2:]
        if fold:
            drive = drive.casefold()
    parts: list[str] = []
    for part in rest.split("/"):
        if part in {"", "."}:
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part.casefold() if fold else part)
    body = "/".join(parts)
    if drive:
        return f"{drive}/{body}" if body else drive
    if text.startswith("/"):
        return "/" + body if body else "/"
    return body


def _within_key(path_key: str, root_key: str) -> bool:
    """Return whether ``path_key`` is ``root_key`` or a file inside it.

    Args:
        path_key: Normalized file path.
        root_key: Normalized folder path.

    Returns:
        True when the file is that folder or a descendant. ``Dropbox-extra``
        does not match a root named ``Dropbox``.
    """
    if not path_key or not root_key or root_key in {"/", ""}:
        return False
    if path_key == root_key:
        return True
    prefix = root_key if root_key.endswith("/") else root_key + "/"
    return path_key.startswith(prefix)


def provider_for(path: str, roots: Sequence[CloudRoot], *, casefold: bool | None = None) -> str:
    """Return the cloud provider that contains this path, if any.

    Args:
        path: File or folder path.
        roots: Folders from ``discover_roots``.
        casefold: True to ignore case. None uses Windows when this process
            is Windows.

    Returns:
        The provider of the longest matching root, or empty.
    """
    fold = sys.platform == "win32" if casefold is None else casefold
    key = _key(path, fold=fold)
    best = ""
    best_len = -1
    for root in roots:
        root_key = _key(root.path, fold=fold)
        if _within_key(key, root_key) and len(root_key) > best_len:
            best = root.provider
            best_len = len(root_key)
    return best


def _is_dir(path: Path) -> bool:
    """Return whether a path is a directory.

    Args:
        path: Folder to test.

    Returns:
        True when it is a directory. False when it is missing or not a folder.
        This does not read files inside it.
    """
    try:
        return path.is_dir()
    except OSError:
        return False


def _provider_name(folder_name: str) -> str:
    """Map a CloudStorage folder name to a provider id.

    Args:
        folder_name: The last path segment.

    Returns:
        ``dropbox``, ``onedrive``, ``icloud``, or ``other``.
    """
    folded = folder_name.casefold()
    if folded.startswith("dropbox"):
        return "dropbox"
    if folded.startswith("onedrive"):
        return "onedrive"
    if folded.startswith("icloud"):
        return "icloud"
    return "other"


def _read_json(path: Path) -> dict[str, object] | None:
    """Read a small JSON object. A large or broken file is ignored.

    Args:
        path: ``info.json`` or similar. Not an audio file.

    Returns:
        The object, or None.
    """
    try:
        if path.stat().st_size > _INFO_LIMIT:
            return None
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return None
    if not isinstance(loaded, dict):
        return None
    return loaded


def _dropbox_info_paths(home: Path, environ: Mapping[str, str]) -> list[Path]:
    """Return Dropbox folder paths named in ``info.json``.

    Args:
        home: Home directory to look under.
        environ: Environment, for ``APPDATA`` and ``LOCALAPPDATA``.

    Returns:
        Existing directories. Missing files are skipped.
    """
    candidates = [home / ".dropbox" / "info.json"]
    for key in ("APPDATA", "LOCALAPPDATA"):
        base = environ.get(key, "")
        if base:
            candidates.append(Path(base) / "Dropbox" / "info.json")
    found: list[Path] = []
    for info_path in candidates:
        payload = _read_json(info_path)
        if payload is None:
            continue
        for account in payload.values():
            if not isinstance(account, dict):
                continue
            raw = account.get("path")
            if isinstance(raw, str) and raw:
                folder = Path(raw)
                if _is_dir(folder):
                    found.append(folder)
    return found


def discover_roots(
    home: Path | None = None,
    environ: Mapping[str, str] | None = None,
    platform: str | None = None,
) -> tuple[CloudRoot, ...]:
    """Find iCloud, Dropbox, OneDrive, and other cloud folders.

    Args:
        home: Home directory. None uses the current user's home.
        environ: Environment mapping. None uses ``os.environ``.
        platform: ``darwin``, ``win32``, or ``linux``. None uses this process.
            The platform picks which well-known folders are checked. It does
            not decide whether a file is hydrated.

    Returns:
        One root per folder, longest paths kept when two names are the same
        folder. The order is the provider, then the path.
    """
    base = Path.home() if home is None else home
    env = os.environ if environ is None else environ
    system = sys.platform if platform is None else platform
    found: list[CloudRoot] = []

    def add(provider: str, folder: Path) -> None:
        if provider not in {"icloud", "dropbox", "onedrive", "other"}:
            return
        if not _is_dir(folder):
            return
        found.append(CloudRoot(provider, str(folder)))

    add("icloud", base / "Library" / "Mobile Documents" / "com~apple~CloudDocs")
    add("icloud", base / "iCloud Drive")
    add("icloud", base / "iCloudDrive")
    add("dropbox", base / "Dropbox")
    add("onedrive", base / "OneDrive")
    storage = base / "Library" / "CloudStorage"
    if _is_dir(storage):
        try:
            names = list(storage.iterdir())
        except OSError:
            names = []
        for child in names:
            add(_provider_name(child.name), child)
    if system == "win32":
        for key, value in env.items():
            if key == "OneDrive" or key.startswith("OneDrive"):
                if value:
                    add("onedrive", Path(value))
    for folder in _dropbox_info_paths(base, env):
        add("dropbox", folder)
    fold = system == "win32"
    unique: dict[str, CloudRoot] = {}
    for root in found:
        unique.setdefault(_key(root.path, fold=fold), root)
    return tuple(sorted(unique.values(), key=lambda item: (item.provider, _key(item.path, fold=fold))))


def optimize_from_plist_bytes(data: bytes | None) -> bool | None:
    """Read Optimize Mac Storage from bird plist bytes.

    Args:
        data: The plist, or None when the file was not read.

    Returns:
        True when ``optimize-storage`` is boolean true or integer 1.
        None for every other value, including false, zero, and a broken file.
        None does not mean the switch is off.
    """
    if not data:
        return None
    try:
        loaded = plistlib.loads(data)
    except (plistlib.InvalidFileException, ValueError, TypeError):
        return None
    if not isinstance(loaded, dict):
        return None
    value = loaded.get("optimize-storage")
    if value is True:
        return True
    if isinstance(value, int) and not isinstance(value, bool) and value == 1:
        return True
    return None


def optimize_mac_storage_enabled(
    plist_path: Path | None = None,
    *,
    platform: str | None = None,
) -> bool | None:
    """Return whether Optimize Mac Storage is on.

    Args:
        plist_path: Plist to read. None uses ``com.apple.bird.plist`` in the
            home Library folder.
        platform: None uses this process. Any platform other than ``darwin``
            returns None and does not read a file.

    Returns:
        True only when the plist says the switch is on. None when it is not
        macOS, the file is missing, or the key is not the on value.
    """
    system = sys.platform if platform is None else platform
    if system != "darwin":
        return None
    path = (
        Path.home() / "Library" / "Preferences" / "com.apple.bird.plist"
        if plist_path is None
        else plist_path
    )
    try:
        data = path.read_bytes()
    except OSError:
        return None
    return optimize_from_plist_bytes(data)


def locations_for(
    library_dirs: Sequence[str],
    track_paths: Sequence[str],
    roots: Sequence[CloudRoot],
    *,
    optimize: bool | None,
    casefold: bool | None = None,
) -> tuple[CloudLocation, ...]:
    """Warn when the Serato folder or a music path sits in a cloud folder.

    Args:
        library_dirs: Directories that hold ``master.sqlite`` or the Serato folder.
        track_paths: Paths classified in this check.
        roots: Discovered cloud folders.
        optimize: True when Optimize Mac Storage was read as on. None does
            not claim it is on. The flag is stored only on iCloud rows.
        casefold: True to ignore case. None follows Windows.

    Returns:
        One library row per cloud folder that contains a library directory,
        then one music row per cloud folder that contains a track path.
    """
    fold = sys.platform == "win32" if casefold is None else casefold

    def matching(paths: Sequence[str]) -> list[CloudRoot]:
        hits: list[CloudRoot] = []
        seen: set[str] = set()
        for raw in paths:
            if not raw:
                continue
            key = _key(raw, fold=fold)
            for root in roots:
                root_key = _key(root.path, fold=fold)
                if not _within_key(key, root_key):
                    continue
                if root_key in seen:
                    continue
                seen.add(root_key)
                hits.append(root)
        return hits

    rows: list[CloudLocation] = []
    for root in matching(library_dirs):
        flag = True if optimize is True and root.provider == "icloud" else None
        rows.append(CloudLocation("library", root.provider, root.path, flag))
    for root in matching(track_paths):
        flag = True if optimize is True and root.provider == "icloud" else None
        rows.append(CloudLocation("music", root.provider, root.path, flag))
    return tuple(rows)


_PLACES = {
    "icloud": "iCloud Drive",
    "dropbox": "Dropbox",
    "onedrive": "OneDrive",
    "other": "a cloud folder this check does not fully know",
    "file-provider": "a cloud placeholder",
}


def location_summary(location: CloudLocation) -> str:
    """One English sentence for the command line and Holding it back.

    Args:
        location: A library or music warning.

    Returns:
        The sentence. Optimize Mac Storage is named only when
        ``optimize_storage`` is True.
    """
    place = _PLACES.get(location.provider, "a cloud folder")
    if location.role == "library":
        text = f"The Serato library folder is inside {place}. It may be unavailable at the gig."
    else:
        text = (
            f"Music files are inside {place}. "
            "Download them on this computer before the gig. This check does not download them."
        )
    if location.optimize_storage is True:
        text += " Optimize Mac Storage is on, so macOS can remove local copies."
    return text
