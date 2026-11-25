#!/usr/bin/env python3
"""Send selected crates and their audio to a paired computer on the LAN (#467).

The copy lands in a staged folder beside settings, not in the Serato
library. Nothing is mirrored in the background. The receiving computer
writes crates only after a separate confirm, and only through
``safe_write`` while Serato is quit. ``python3 lan_stage.py`` prints
status and does not listen.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import http.client
import ipaddress
import json
import os
import re
import shutil
import socket
import sqlite3
import sys
import threading
import time
import urllib.parse
from collections.abc import Mapping
from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import app_config
import library
import volumes
from library import LibraryError

CHUNK = 1024 * 1024
ROW_CAP = 200
MAX_CRATES = 500
MAX_FILES = 10000
MAX_FILE_BYTES = 2_000_000_000
MAX_JSON = 2_000_000
CODE_BYTES = 4
CODE_TRIES = 5
CODE_TTL_SECONDS = 15 * 60
ID_RE = re.compile(r"^[0-9a-f]{16}$")
_RESERVED_DEVICE = re.compile(r"^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)", re.IGNORECASE)
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
GENERATED_FOLDER = "_crateCraft generated"
FOLDER_NAME = "From backup Mac"
STAGE_DIR_NAME = "lan-stage"
CODE_HEADER = "X-CrateCraft-Code"
HASH_HEADER = "X-Content-SHA256"
PROTOCOL = 1
LISTEN_PORTS = range(8766, 8776)

CHOOSE_CRATES = "Choose at least one crate."
TOO_MANY = "Choose fewer crates."
FINGERPRINT = "The library changed since the preview. Preview again."
BAD_CODE = "That pairing code is not valid."
LOCKED = "Too many pairing attempts. Listen again for a new code."
EXPIRED = "That pairing code has expired. Listen again for a new code."
BAD_HOST = "That address is not on this local network."
BAD_PORT = "That port is not valid."
NOT_LISTENING = "The other Mac is not listening for a staged copy."
NOT_STAGED = "That staged copy is not on this Mac."
ALREADY = "That staged copy is already in this library."
IN_PROGRESS = "That staged copy is already being added."
STAGE_SNAPSHOT = "That snapshot is not the staged copy."
STAGE_LIBRARY = "A staged copy cannot be stored in the Serato library."
STAGE_SERATO = "A staged copy cannot be stored in the Serato folder."
LISTEN_FAILED = "This Mac could not listen on the local network."
NO_SPACE = "There is not enough disk space for this staged copy."
STAGE_NAME = "That staged crate name could not be saved."

REASONS = {
    "missing": "The file is not on this computer.",
    "offline": "The drive is not connected.",
    "unreadable": "The file could not be read.",
    "shortcut": "Shortcuts are not copied.",
    "unsafe_name": "That file name is not safe to stage.",
    "changed": "The file changed since the preview.",
    "mismatch": "The file did not match.",
    "not_in_library": "This library does not have this file yet.",
}

_lock = threading.Lock()
_listener: "_Listener | None" = None


def peer_allowed(ip: str) -> bool:
    """Return whether ``ip`` is loopback, private, or link-local.

    Args:
        ip: Address string from a socket or a DNS answer. A zone index
            is ignored. An IPv4 address mapped in IPv6 uses the IPv4 value.

    Returns:
        True for an address on this network. False for a public address,
        an unspecified address, or text that is not an IP.
    """
    text = ip.split("%", 1)[0]
    try:
        addr = ipaddress.ip_address(text)
    except ValueError:
        return False
    if isinstance(addr, ipaddress.IPv6Address) and addr.ipv4_mapped is not None:
        addr = addr.ipv4_mapped
    if addr.is_loopback or addr.is_link_local:
        return True
    if addr.is_unspecified or addr.is_multicast or addr.is_reserved:
        return False
    if isinstance(addr, ipaddress.IPv4Address):
        return addr in ipaddress.ip_network("10.0.0.0/8") or addr in ipaddress.ip_network(
            "172.16.0.0/12"
        ) or addr in ipaddress.ip_network("192.168.0.0/16")
    return addr in ipaddress.ip_network("fc00::/7")


def safe_file_name(name: object) -> str | None:
    """Return a single path segment, or None when the name can escape.

    Args:
        name: Candidate file name. Separators, ``..``, ``_Serato_``,
            a trailing dot or space, and Windows device names (``CON``,
            ``PRN``, ``AUX``, ``NUL``, ``COM1``–``COM9``, ``LPT1``–``LPT9``,
            with any extension) are refused on every platform.

    Returns:
        The name when it is one safe segment, otherwise None.
    """
    if not isinstance(name, str) or not name or len(name) > 240:
        return None
    if name in {".", ".."} or "/" in name or "\\" in name or "\x00" in name:
        return None
    if name.endswith(".") or name.endswith(" "):
        return None
    if name.casefold() == "_serato_":
        return None
    if _RESERVED_DEVICE.match(name):
        return None
    return name


def file_name_of(path: str) -> str:
    """Return the last segment of a stored path.

    Args:
        path: A POSIX or Windows path. Both separators are split so a
            Windows path keeps its file name on Linux.

    Returns:
        The last segment, which may still be unsafe.
    """
    return path.replace("\\", "/").rsplit("/", 1)[-1]


def hello_acceptable(payload: object) -> bool:
    """Return whether a hello body is a staged-copy listener.

    Args:
        payload: JSON object from ``GET /v1/hello``.

    Returns:
        True only for this protocol with auto-mirror off.
    """
    if not isinstance(payload, dict):
        return False
    return (
        payload.get("product") == "crateCraft"
        and payload.get("role") == "stage"
        and payload.get("auto_mirror") is False
        and payload.get("version") == PROTOCOL
    )


def stage_root() -> Path:
    """Return the staged-copy folder beside settings.

    Returns:
        ``lan-stage`` under the config directory. The directory is not
        created here.
    """
    return app_config.config_dir() / STAGE_DIR_NAME


def assert_stage_root(root: Path) -> None:
    """Refuse a stage folder inside Serato or the library directory.

    Args:
        root: Folder that would hold staged copies.

    Raises:
        LibraryError: If the folder is the library, inside it, or any
            path part is ``_Serato_``.
    """
    if any(part.casefold() == "_serato_" for part in root.parts):
        raise LibraryError(STAGE_SERATO)
    master = Path(library.MASTER).expanduser()
    try:
        library_dir = master.resolve(strict=False).parent
        resolved = root.resolve(strict=False)
    except OSError as exc:
        raise LibraryError(STAGE_LIBRARY) from exc
    if resolved == library_dir or library_dir in resolved.parents:
        raise LibraryError(STAGE_LIBRARY)


def _contained(root: Path, name: str) -> Path:
    """Return one child of ``root`` that cannot climb out of it.

    ``normpath`` collapses ``..`` before the prefix check. The separator
    stops a sibling whose name only starts with the folder name. A
    shortcut is refused before ``realpath`` follows it.

    Args:
        root: Directory the child must stay inside.
        name: One path segment from the request or a fixed file name.

    Returns:
        The absolute path of that child.

    Raises:
        LibraryError: If ``name`` is not one segment, the path leaves
            ``root``, or the child is a shortcut.
    """
    if (
        not isinstance(name, str)
        or not name
        or name in {".", ".."}
        or "/" in name
        or "\\" in name
        or "\x00" in name
    ):
        raise LibraryError(NOT_STAGED)
    base = os.path.realpath(root)
    joined = os.path.normpath(os.path.join(base, name))
    # normpath collapses ".." before the prefix check. The separator
    # stops a sibling such as "lan-stage-evil" from matching "lan-stage".
    if not joined.startswith(base + os.sep):
        raise LibraryError(NOT_STAGED)
    if os.path.islink(joined):
        raise LibraryError(NOT_STAGED)
    candidate = os.path.realpath(joined)
    if not candidate.startswith(base + os.sep):
        raise LibraryError(NOT_STAGED)
    return Path(candidate)


def _finish(body: dict[str, object]) -> dict[str, object]:
    """Attach the auto-mirror flag. It is always false.

    Args:
        body: Response fields.

    Returns:
        The same dict, with ``auto_mirror`` false.
    """
    body["auto_mirror"] = False
    return body


def _reason(code: str) -> dict[str, object]:
    """Return the public skip or failure fields for one code.

    Args:
        code: Key in ``REASONS``.

    Returns:
        ``reason_code`` and the English sentence.
    """
    return {"reason_code": code, "reason": REASONS[code]}


def _hash_file(path: Path) -> str | None:
    """SHA-256 of a file, or None when it cannot be read.

    Args:
        path: Regular file. A shortcut is not opened.

    Returns:
        Lowercase hex, or None on an OS error.
    """
    digest = hashlib.sha256()
    try:
        with path.open("rb") as handle:
            while True:
                chunk = handle.read(CHUNK)
                if not chunk:
                    break
                digest.update(chunk)
    except OSError:
        return None
    return digest.hexdigest()


def _codes_match(offered: str, expected: str) -> bool:
    """Compare pairing codes without leaking which character differed.

    Args:
        offered: Header value.
        expected: Code this listener is showing.

    Returns:
        True when the bytes match.
    """
    if len(offered) > 64:
        return False
    left = offered.encode("utf-8")
    right = expected.encode("utf-8")
    if len(left) != len(right):
        hmac.compare_digest(right, right)
        return False
    return hmac.compare_digest(left, right)


def _pairing_error(payload: Mapping[str, object]) -> None:
    """Raise the listener's pairing refusal.

    Args:
        payload: JSON body from a 403 response.

    Raises:
        LibraryError: ``BAD_CODE``, ``LOCKED``, or ``EXPIRED`` when the
            listener sent one of those sentences. Anything else is a bad code.
    """
    message = payload.get("error")
    if message in {BAD_CODE, LOCKED, EXPIRED}:
        raise LibraryError(str(message))
    raise LibraryError(BAD_CODE)


def _crate_ids(value: object) -> list[int]:
    """Return unique crate ids from a request.

    Args:
        value: JSON list. Booleans are not ids.

    Returns:
        Ids in first-seen order.

    Raises:
        LibraryError: If the list is empty, too long, or not integers.
    """
    if not isinstance(value, list) or not value:
        raise LibraryError(CHOOSE_CRATES)
    if len(value) > MAX_CRATES:
        raise LibraryError(TOO_MANY)
    ids: list[int] = []
    seen: set[int] = set()
    for item in value:
        if isinstance(item, bool) or not isinstance(item, int):
            raise LibraryError(CHOOSE_CRATES)
        if item in seen:
            continue
        seen.add(item)
        ids.append(item)
    return ids


def _space(value: object) -> str:
    """Return an allowed space name.

    Args:
        value: Request field. None uses the Serato Library space.

    Returns:
        The space name.

    Raises:
        LibraryError: If the space is not one this app opens.
    """
    space = library.LIBRARY_SPACE if value is None or value == "" else value
    if not isinstance(space, str) or space not in library.ALLOWED_SPACES:
        raise LibraryError("That space is not available here.")
    return space


def _members(conn: sqlite3.Connection, crate_id: int) -> list[sqlite3.Row]:
    """Return tracks stored on one crate, in crate order.

    Args:
        conn: Read connection.
        crate_id: Container id.

    Returns:
        Asset rows. A crate with no location container is empty.
    """
    return list(
        conn.execute(
            """
            SELECT a.id, a.name, a.artist, a.portable_id, a.file_name, a.is_missing
            FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            JOIN asset a ON a.id = ca.asset_id
            WHERE lc.container_id = ?
            ORDER BY ca.list_order, ca.id
            """,
            (crate_id,),
        )
    )


def _stored_color(conn: sqlite3.Connection, crate_id: int) -> int | None:
    """Return a crate color in the 24-bit range, or None.

    Args:
        conn: Read connection.
        crate_id: Container id.

    Returns:
        The stored color. White and a missing column are None.
    """
    if "color" not in library._columns(conn, "container"):
        return None
    row = conn.execute("SELECT color FROM container WHERE id = ?", (crate_id,)).fetchone()
    if row is None or row[0] is None or isinstance(row[0], bool):
        return None
    try:
        value = int(row[0])
    except (TypeError, ValueError):
        return None
    if value < 0 or value > 0xFFFFFF or value == 0xFFFFFF:
        return None
    return value


def _unique_rel(name: str, used: set[str]) -> str:
    """Return a file name that is not already in this transfer.

    Args:
        name: Safe file name.
        used: Names already chosen. Updated with the result.

    Returns:
        ``name``, or ``name`` with a numeric suffix.
    """
    if name not in used:
        used.add(name)
        return name
    stem = Path(name).stem or "track"
    suffix = Path(name).suffix
    number = 2
    while True:
        candidate = f"{stem}-{number}{suffix}"
        if candidate not in used and safe_file_name(candidate):
            used.add(candidate)
            return candidate
        number += 1


def _classify_file(stored: str, display: str) -> dict[str, object]:
    """Decide whether one library file can be staged.

    An unplugged drive is checked before the file is opened. A shortcut
    is skipped and its target is not read.

    Args:
        stored: Portable path from the library.
        display: File name to show when the path has none.

    Returns:
        A file dict with ``ok`` true, or a skip dict with a reason code.
    """
    if volumes.absent_volume(stored):
        return {"ok": False, "file": display or file_name_of(stored), "source": stored, **_reason("offline")}
    raw = library._resolved(stored)
    path = Path(raw) if raw else Path(stored)
    try:
        if path.is_symlink():
            return {"ok": False, "file": display or path.name, "source": stored, **_reason("shortcut")}
        if not path.is_file():
            return {"ok": False, "file": display or file_name_of(stored), "source": stored, **_reason("missing")}
        stat = path.stat()
    except OSError:
        return {"ok": False, "file": display or file_name_of(stored), "source": stored, **_reason("unreadable")}
    name = safe_file_name(file_name_of(path.name))
    if name is None:
        return {"ok": False, "file": display or path.name, "source": stored, **_reason("unsafe_name")}
    return {
        "ok": True,
        "file": name,
        "source": str(path),
        "stored": stored,
        "size": int(stat.st_size),
        "mtime_ns": int(getattr(stat, "st_mtime_ns", int(stat.st_mtime * 1_000_000_000))),
    }


def _plan(space: str, crate_ids: list[int]) -> dict[str, object]:
    """Read the crates and files a send would stage.

    Args:
        space: Space name.
        crate_ids: Selected crate ids.

    Returns:
        Crates, sendable files, skipped files, counts, and a fingerprint.
        Nothing is written.

    Raises:
        LibraryError: If a crate is not in the space.
    """
    crates: list[dict[str, object]] = []
    files: list[dict[str, object]] = []
    skipped: list[dict[str, object]] = []
    seen_sources: set[str] = set()
    used_names: set[str] = set()
    with closing(library.read_conn()) as conn:
        for crate_id in crate_ids:
            row = library._container(conn, crate_id, space)
            if int(row["type"]) == 0:
                raise LibraryError(CHOOSE_CRATES)
            name = library.display_name(str(row["name"]))
            color = _stored_color(conn, crate_id)
            rels: list[str] = []
            for asset in _members(conn, crate_id):
                stored = asset["portable_id"] if isinstance(asset["portable_id"], str) else ""
                label = asset["file_name"] if isinstance(asset["file_name"], str) else ""
                title = asset["name"] if isinstance(asset["name"], str) else ""
                artist = asset["artist"] if isinstance(asset["artist"], str) else ""
                if not stored:
                    skipped.append({"file": label or title or "track", "name": title, "artist": artist, **_reason("missing")})
                    continue
                if stored in seen_sources:
                    for item in files:
                        if item.get("stored") == stored:
                            rels.append(str(item["rel"]))
                            break
                    continue
                seen_sources.add(stored)
                classified = _classify_file(stored, label or title)
                classified["name"] = title
                classified["artist"] = artist
                if not classified["ok"]:
                    skipped.append(classified)
                    continue
                rel = _unique_rel(str(classified["file"]), used_names)
                classified["rel"] = rel
                files.append(classified)
                rels.append(rel)
            crates.append(
                {
                    "id": crate_id,
                    "name": name,
                    "color": color,
                    "smart": int(row["type"]) == 2,
                    "ancestry": library._ancestry(conn, crate_id),
                    "rels": rels,
                    "tracks": len(rels),
                }
            )
    fingerprint = _fingerprint(crates, files, skipped)
    byte_count = sum(int(item["size"]) for item in files)
    return {
        "space": space,
        "crates": crates,
        "files": files,
        "skipped": skipped,
        "file_count": len(files),
        "byte_count": byte_count,
        "skipped_count": len(skipped),
        "failed": [],
        "failed_count": 0,
        "fingerprint": fingerprint,
    }


def _fingerprint(
    crates: list[dict[str, object]],
    files: list[dict[str, object]],
    skipped: list[dict[str, object]],
) -> str:
    """Hash the plan so a send cannot drift from its preview.

    Args:
        crates: Crate rows from ``_plan``.
        files: Sendable files.
        skipped: Skipped files.

    Returns:
        SHA-256 hex of the canonical plan.
    """
    body = {
        "crates": [
            {"id": item["id"], "name": item["name"], "color": item["color"], "rels": item["rels"]}
            for item in crates
        ],
        "files": [
            {"stored": item.get("stored"), "size": item.get("size"), "mtime_ns": item.get("mtime_ns"), "rel": item.get("rel")}
            for item in files
        ],
        "skipped": [
            {"source": item.get("source"), "reason_code": item.get("reason_code"), "file": item.get("file")}
            for item in skipped
        ],
    }
    blob = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()


def _public_rows(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    """Return the fields the page lists, capped.

    Args:
        rows: Internal file rows.

    Returns:
        Up to ``ROW_CAP`` rows without the stored path.
    """
    public: list[dict[str, object]] = []
    for item in rows[:ROW_CAP]:
        public.append(
            {
                "file": item.get("file"),
                "name": item.get("name") or "",
                "artist": item.get("artist") or "",
                "rel": item.get("rel"),
                "size": item.get("size"),
                "reason_code": item.get("reason_code"),
                "reason": item.get("reason"),
            }
        )
    return public


def _public_plan(plan: dict[str, object], *, preview: bool) -> dict[str, object]:
    """Shape a plan for the page.

    Args:
        plan: Result of ``_plan`` plus optional send fields.
        preview: True when nothing was sent.

    Returns:
        Counts for the whole plan and capped lists.
    """
    crates = [
        {
            "id": item["id"],
            "name": item["name"],
            "color": item["color"],
            "smart": item["smart"],
            "ancestry": item["ancestry"],
            "tracks": item["tracks"],
        }
        for item in plan["crates"]  # type: ignore[index]
    ]
    return _finish(
        {
            "ok": True,
            "preview": preview,
            "written": False,
            "library_written": False,
            "staged": False,
            "space": plan["space"],
            "crates": crates,
            "files": _public_rows(list(plan["files"])),  # type: ignore[arg-type]
            "skipped": _public_rows(list(plan["skipped"])),  # type: ignore[arg-type]
            "failed": _public_rows(list(plan["failed"])),  # type: ignore[arg-type]
            "file_count": plan["file_count"],
            "byte_count": plan["byte_count"],
            "skipped_count": plan["skipped_count"],
            "failed_count": plan["failed_count"],
            "fingerprint": plan["fingerprint"],
        }
    )


def preview(space: str, crate_ids: list[int]) -> dict[str, object]:
    """Count the files and bytes a send would stage.

    Args:
        space: Space name.
        crate_ids: Selected crate ids.

    Returns:
        The public plan. Nothing is sent and the listener is not started.
    """
    return _public_plan(_plan(space, crate_ids), preview=True)


def _normalize_host(value: object) -> str:
    """Return a host that resolves only to local addresses.

    Args:
        value: Address or hostname. A URL is refused.

    Returns:
        The host text to dial.

    Raises:
        LibraryError: If any resolved address is public, or the name
            does not resolve.
    """
    if not isinstance(value, str):
        raise LibraryError(BAD_HOST)
    text = value.strip()
    if text.startswith("[") and text.endswith("]"):
        text = text[1:-1]
    if not text or len(text) > 253 or any(ch in text for ch in "\x00/\\@ \t\r\n"):
        raise LibraryError(BAD_HOST)
    try:
        infos = socket.getaddrinfo(text, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise LibraryError(BAD_HOST) from exc
    ips = [info[4][0] for info in infos]
    if not ips or any(not peer_allowed(ip) for ip in ips):
        raise LibraryError(BAD_HOST)
    return text


def _normalize_port(value: object) -> int:
    """Return a TCP port.

    Args:
        value: JSON number or a digit string.

    Returns:
        The port.

    Raises:
        LibraryError: If the value is not a port.
    """
    if isinstance(value, str) and value.isdigit():
        value = int(value)
    if isinstance(value, bool) or not isinstance(value, int) or value < 1 or value > 65535:
        raise LibraryError(BAD_PORT)
    return value


def _url_host(host: str) -> str:
    """Return a host safe to put in an HTTP URL.

    Args:
        host: Normalized host.

    Returns:
        The host, with brackets when it is IPv6.
    """
    if ":" in host:
        return f"[{host}]"
    return host


def _read_response(response: http.client.HTTPResponse) -> dict[str, object]:
    """Decode a JSON object from one HTTP response.

    Args:
        response: Finished response. The body is read here.

    Returns:
        The object, or an empty dict when the body is not an object.
    """
    raw = response.read(MAX_JSON + 1)
    if len(raw) > MAX_JSON:
        return {"error": NOT_LISTENING}
    try:
        payload = json.loads(raw.decode("utf-8") or "{}")
    except (UnicodeError, json.JSONDecodeError):
        return {"error": NOT_LISTENING}
    if not isinstance(payload, dict):
        return {"error": NOT_LISTENING}
    return payload


def _http_json(
    method: str,
    host: str,
    port: int,
    path: str,
    code: str,
    body: dict[str, object] | None,
) -> dict[str, object]:
    """Send one JSON request to a staged-copy listener.

    Args:
        method: ``GET`` or ``POST``.
        host: Normalized host.
        port: Listener port.
        path: Absolute path and optional query.
        code: Pairing code.
        body: JSON object for POST. None for GET.

    Returns:
        The JSON object. HTTP errors still return the object so the
        caller can read ``error``.

    Raises:
        LibraryError: If the other computer does not answer.
    """
    data = None if body is None else json.dumps(body).encode("utf-8")
    conn = http.client.HTTPConnection(_url_host(host), port, timeout=60)
    try:
        headers = {CODE_HEADER: code, "Connection": "close"}
        if data is not None:
            headers["Content-Type"] = "application/json"
        conn.request(method, path, body=data, headers=headers)
        response = conn.getresponse()
        payload = _read_response(response)
        payload["_status"] = response.status
        return payload
    except (OSError, http.client.HTTPException) as exc:
        raise LibraryError(NOT_LISTENING) from exc
    finally:
        conn.close()


def _put_file(
    host: str,
    port: int,
    code: str,
    transfer_id: str,
    index: int,
    path: Path,
    size: int,
    digest: str,
) -> dict[str, object]:
    """Stream one file to the listener.

    Args:
        host: Normalized host.
        port: Listener port.
        code: Pairing code.
        transfer_id: Staged copy id.
        index: File index in the manifest.
        path: Local file. Read again so the bytes match ``digest``.
        size: Byte count from the hash pass.
        digest: SHA-256 hex.

    Returns:
        The listener's JSON object.

    Raises:
        OSError: If the file or the connection fails.
        LibraryError: If the listener does not answer with JSON.
    """
    timeout = max(60, size // (256 * 1024) + 30)
    conn = http.client.HTTPConnection(_url_host(host), port, timeout=timeout)
    try:
        query = urllib.parse.urlencode({"id": transfer_id, "index": str(index)})
        conn.putrequest("PUT", f"/v1/file?{query}")
        conn.putheader(CODE_HEADER, code)
        conn.putheader(HASH_HEADER, digest)
        conn.putheader("Content-Length", str(size))
        conn.putheader("Connection", "close")
        conn.endheaders()
        with path.open("rb") as handle:
            while True:
                chunk = handle.read(CHUNK)
                if not chunk:
                    break
                conn.send(chunk)
        response = conn.getresponse()
        payload = _read_response(response)
        payload["_status"] = response.status
        return payload
    except http.client.HTTPException as exc:
        raise LibraryError(NOT_LISTENING) from exc
    finally:
        conn.close()


def _label() -> str:
    """Return a short name for this computer.

    Returns:
        The hostname with control characters removed, capped at 80.
    """
    raw = socket.gethostname()
    cleaned = "".join(ch for ch in raw if ch.isprintable() and ch not in "\r\n\t")
    return (cleaned or "Mac")[:80]


def send_copy(
    host: object,
    port: object,
    code: object,
    space: str,
    crate_ids: list[int],
    fingerprint: object,
    confirm: object,
) -> dict[str, object]:
    """Send the previewed crates into the other computer's staged folder.

    Args:
        host: Listening computer. Public addresses are refused.
        port: Listener port.
        code: Pairing code shown on that computer.
        space: Space name.
        crate_ids: Selected crate ids.
        fingerprint: Fingerprint from ``preview``.
        confirm: True performs the send. Any other value returns the
            preview and does not open a connection.

    Returns:
        The plan. ``staged`` is true when the listener committed.
        ``library_written`` stays false. Failed files are listed.

    Raises:
        LibraryError: If the preview is stale, the code is refused, or
            the listener cannot be reached at all.
    """
    plan = _plan(space, crate_ids)
    if confirm is not True:
        return _public_plan(plan, preview=True)
    if not isinstance(fingerprint, str) or fingerprint != plan["fingerprint"]:
        raise LibraryError(FINGERPRINT)
    if not isinstance(code, str) or not code.strip():
        raise LibraryError(BAD_CODE)
    pairing = code.strip()
    peer = _normalize_host(host)
    number = _normalize_port(port)
    hello = _http_json("GET", peer, number, "/v1/hello", pairing, None)
    if hello.get("_status") == 403:
        _pairing_error(hello)
    if not hello_acceptable(hello):
        raise LibraryError(NOT_LISTENING)
    pending: list[dict[str, object]] = []
    failed: list[dict[str, object]] = []
    for item in list(plan["files"]):
        path = Path(str(item["source"]))
        try:
            stat = path.stat()
        except OSError:
            failed.append({**item, **_reason("unreadable")})
            continue
        if path.is_symlink() or int(stat.st_size) != int(item["size"]):
            failed.append({**item, **_reason("changed")})
            continue
        digest = _hash_file(path)
        if digest is None:
            failed.append({**item, **_reason("unreadable")})
            continue
        item["sha256"] = digest
        pending.append(item)
    manifest_files: list[dict[str, object]] = []
    for index, item in enumerate(pending):
        item["index"] = index
        manifest_files.append(
            {
                "index": index,
                "rel": item["rel"],
                "size": item["size"],
                "sha256": item["sha256"],
                "name": item.get("name") or "",
                "artist": item.get("artist") or "",
                "status": "pending",
            }
        )
    begin_body: dict[str, object] = {
        "label": _label(),
        "fingerprint": plan["fingerprint"],
        "auto_mirror": False,
        "crates": [
            {
                "name": item["name"],
                "color": item["color"],
                "smart": item["smart"],
                "ancestry": item["ancestry"],
                "rels": [rel for rel in item["rels"] if rel in {row["rel"] for row in manifest_files}],
            }
            for item in plan["crates"]
        ],
        "files": manifest_files,
        "skipped": [
            {"file": item.get("file"), "name": item.get("name") or "", "artist": item.get("artist") or "", "reason_code": item.get("reason_code")}
            for item in plan["skipped"]
        ],
        "byte_count": sum(int(item["size"]) for item in pending),
    }
    started = _http_json("POST", peer, number, "/v1/begin", pairing, begin_body)
    if started.get("_status") == 403:
        _pairing_error(started)
    if started.get("_status") != 200 or not isinstance(started.get("id"), str):
        message = started.get("error")
        if message in {NO_SPACE, STAGE_LIBRARY, STAGE_SERATO, BAD_CODE}:
            raise LibraryError(str(message))
        raise LibraryError(NOT_LISTENING)
    transfer_id = str(started["id"])
    sent = 0
    for item in pending:
        try:
            result = _put_file(
                peer,
                number,
                pairing,
                transfer_id,
                int(item["index"]),
                Path(str(item["source"])),
                int(item["size"]),
                str(item["sha256"]),
            )
        except (OSError, LibraryError):
            failed.append({**item, **_reason("unreadable")})
            continue
        if result.get("ok") is True:
            sent += 1
        else:
            failed.append({**item, **_reason("mismatch")})
    committed = _http_json("POST", peer, number, f"/v1/commit?id={transfer_id}", pairing, {"id": transfer_id})
    if committed.get("_status") != 200:
        raise LibraryError(NOT_LISTENING)
    remote_failed = committed.get("failed")
    if isinstance(remote_failed, list):
        for item in remote_failed:
            if isinstance(item, dict) and item.get("file") not in {row.get("file") for row in failed}:
                failed.append(item)
    public = _public_plan(plan, preview=False)
    public["staged"] = True
    public["id"] = transfer_id
    public["sent"] = sent
    public["failed"] = _public_rows(failed)
    public["failed_count"] = len(failed)
    public["file_count"] = len(pending)
    public["byte_count"] = begin_body["byte_count"]
    return public


def _lan_addresses(bind_host: str) -> list[str]:
    """Return addresses the other computer can dial.

    Args:
        bind_host: Address the listener socket is bound to.

    Returns:
        That host when the socket is bound to one address. Otherwise
        private IPv4 addresses, or loopback when none are found.
    """
    if bind_host not in {"0.0.0.0", "::", ""}:
        return [bind_host]
    found: list[str] = []
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            sock.connect(("192.168.0.1", 1))
            ip = sock.getsockname()[0]
        finally:
            sock.close()
        if isinstance(ip, str) and peer_allowed(ip) and not ipaddress.ip_address(ip).is_loopback:
            found.append(ip)
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET, socket.SOCK_STREAM):
            ip = info[4][0]
            if ip not in found and peer_allowed(ip) and not ipaddress.ip_address(ip).is_loopback:
                found.append(ip)
    except (socket.gaierror, ValueError):
        pass
    return found or ["127.0.0.1"]


def _bind_host() -> str:
    """Return one private address to listen on.

    Returns:
        The first non-loopback local address, or ``127.0.0.1`` when this
        computer has none. The listener does not bind every interface.
    """
    for ip in _lan_addresses("0.0.0.0"):
        try:
            addr = ipaddress.ip_address(ip.split("%", 1)[0])
        except ValueError:
            continue
        if peer_allowed(ip) and not addr.is_loopback:
            return ip
    return "127.0.0.1"


class _Listener:
    """One staged-copy listener. It does not serve the library API."""

    def __init__(
        self,
        httpd: ThreadingHTTPServer | None,
        thread: threading.Thread | None,
        code: str,
        host: str,
    ) -> None:
        self.httpd = httpd
        self.thread = thread
        self.code = code
        self.host = host
        self.port = 0 if httpd is None else int(httpd.server_address[1])
        self.started = time.monotonic()
        self.failures: dict[str, int] = {}
        self.locked: set[str] = set()
        self._gate = threading.Lock()

    def alive(self) -> bool:
        """Return whether the accept loop is still running."""
        return self.thread is not None and self.thread.is_alive()

    def _rotate(self) -> str:
        """Replace the code. The caller holds ``_gate``."""
        self.code = os.urandom(CODE_BYTES).hex()
        self.started = time.monotonic()
        self.failures.clear()
        self.locked.clear()
        return self.code

    def rotate(self) -> str:
        """Issue a new pairing code and clear lockouts.

        Returns:
            The new code.
        """
        with self._gate:
            return self._rotate()

    def fresh_code(self) -> str:
        """Return the code, rotating it when the timeout has passed.

        Returns:
            The code a sender must present now.
        """
        with self._gate:
            if time.monotonic() - self.started >= CODE_TTL_SECONDS:
                return self._rotate()
            return self.code

    def check_code(self, peer: str, offered: str) -> str | None:
        """Accept a pairing code or return the refusal sentence.

        Five wrong tries from one address lock that address out until the
        code rotates. An expired code is rotated and refused. A locked
        address is refused even when it later sends the right code.

        Args:
            peer: Client address.
            offered: Header value.

        Returns:
            None when the code is current. Otherwise ``LOCKED``,
            ``EXPIRED``, or ``BAD_CODE``.
        """
        key = peer.split("%", 1)[0]
        try:
            addr = ipaddress.ip_address(key)
        except ValueError:
            addr = None
        if isinstance(addr, ipaddress.IPv6Address) and addr.ipv4_mapped is not None:
            key = str(addr.ipv4_mapped)
        elif addr is not None:
            key = str(addr)
        with self._gate:
            if key in self.locked:
                _codes_match(offered, self.code)
                return LOCKED
            if time.monotonic() - self.started >= CODE_TTL_SECONDS:
                self._rotate()
                return EXPIRED
            if _codes_match(offered, self.code):
                self.failures.pop(key, None)
                return None
            count = self.failures.get(key, 0) + 1
            self.failures[key] = count
            if count >= CODE_TRIES:
                self.locked.add(key)
                return LOCKED
            return BAD_CODE


def _handler_type(listener: _Listener) -> type[BaseHTTPRequestHandler]:
    """Build a handler bound to one listener.

    Args:
        listener: Listener that checks and rotates the pairing code.

    Returns:
        A request-handler class.
    """

    class Handler(BaseHTTPRequestHandler):
        """Staged-copy protocol only. Paths outside it are 404."""

        stage = listener
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt: str, *args: object) -> None:
            """Drop request logs so the pairing code is not written."""
            del fmt, args

        def _send(self, status: int, payload: dict[str, object]) -> None:
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(body)

        def _peer_ok(self) -> bool:
            host = self.client_address[0]
            if peer_allowed(host):
                return True
            self._send(403, {"error": BAD_HOST})
            return False

        def _code_ok(self) -> bool:
            offered = self.headers.get(CODE_HEADER) or ""
            reason = self.stage.check_code(self.client_address[0], offered)
            if reason is None:
                return True
            self._send(403, {"error": reason})
            return False

        def _length(self, limit: int) -> int | None:
            raw = self.headers.get("Content-Length") or "0"
            try:
                length = int(raw)
            except ValueError:
                self._send(400, {"error": "That request is not valid."})
                return None
            if length < 0 or length > limit:
                self._send(413, {"error": "That upload is too large."})
                return None
            return length

        def do_GET(self) -> None:  # noqa: N802 - stdlib name
            """Answer hello. Any other path is 404."""
            if not self._peer_ok():
                return
            if urlparse(self.path).path != "/v1/hello":
                self._send(404, {"error": "That action is not available."})
                return
            if not self._code_ok():
                return
            self._send(
                200,
                {
                    "ok": True,
                    "product": "crateCraft",
                    "role": "stage",
                    "auto_mirror": False,
                    "version": PROTOCOL,
                },
            )

        def do_POST(self) -> None:  # noqa: N802 - stdlib name
            """Start or commit a staged copy."""
            if not self._peer_ok() or not self._code_ok():
                return
            parsed = urlparse(self.path)
            length = self._length(MAX_JSON)
            if length is None:
                return
            raw = self.rfile.read(length)
            try:
                payload = json.loads(raw.decode("utf-8") or "{}")
            except (UnicodeError, json.JSONDecodeError):
                self._send(400, {"error": "The request body is not JSON."})
                return
            if not isinstance(payload, dict):
                self._send(400, {"error": "The request body is not an object."})
                return
            try:
                if parsed.path == "/v1/begin":
                    self._send(200, begin_transfer(payload))
                    return
                if parsed.path == "/v1/commit":
                    query = urllib.parse.parse_qs(parsed.query)
                    transfer_id = payload.get("id") or (query.get("id") or [""])[0]
                    self._send(200, commit_transfer(transfer_id))
                    return
            except LibraryError as exc:
                self._send(exc.status, {"error": exc.message})
                return
            self._send(404, {"error": "That action is not available."})

        def do_PUT(self) -> None:  # noqa: N802 - stdlib name
            """Store one file into the staged folder."""
            if not self._peer_ok() or not self._code_ok():
                return
            parsed = urlparse(self.path)
            if parsed.path != "/v1/file":
                self._send(404, {"error": "That action is not available."})
                return
            query = urllib.parse.parse_qs(parsed.query)
            transfer_id = (query.get("id") or [""])[0]
            raw_index = (query.get("index") or [""])[0]
            if not raw_index.isdigit():
                self._send(400, {"error": "That request is not valid."})
                return
            try:
                manifest = _load(str(transfer_id))
            except LibraryError as exc:
                self._send(exc.status, {"error": exc.message})
                return
            files = manifest.get("files")
            index = int(raw_index)
            if not isinstance(files, list) or index >= len(files) or not isinstance(files[index], dict):
                self._send(400, {"error": "That request is not valid."})
                return
            expected = files[index]
            size = expected.get("size")
            if isinstance(size, bool) or not isinstance(size, int):
                self._send(400, {"error": "That request is not valid."})
                return
            length = self._length(min(size, MAX_FILE_BYTES) if size <= MAX_FILE_BYTES else 0)
            if length is None:
                return
            if length != size:
                if length:
                    self.rfile.read(length)
                self._mark_failed(str(transfer_id), index, "mismatch")
                self._send(200, {"ok": False, **_reason("mismatch")})
                return
            try:
                ok = _store_upload(str(transfer_id), index, expected, self.rfile, length, self.headers.get(HASH_HEADER) or "")
            except LibraryError as exc:
                self._send(exc.status, {"error": exc.message})
                return
            if ok:
                self._send(200, {"ok": True})
            else:
                self._send(200, {"ok": False, **_reason("mismatch")})

    return Handler


def listen(host: str | None = None, port: int | None = None) -> dict[str, object]:
    """Listen for one staged copy. Does not read or write the library.

    A second call while the listener is up returns the current code. It
    does not start a mirror. The code expires, and a finished copy
    rotates it. The socket binds one local address, not every interface.

    Args:
        host: Bind address. None uses one private address, or loopback
            when this computer has none. Tests pass loopback.
        port: Port, 0 for an ephemeral port, or None to try 8766–8775.

    Returns:
        Listening status, including the pairing code and port.

    Raises:
        LibraryError: If the port cannot be bound.
    """
    global _listener
    with _lock:
        if _listener is not None and _listener.alive():
            return _status_locked()
        chosen = _bind_host() if host is None else host
        stage = _Listener(None, None, os.urandom(CODE_BYTES).hex(), chosen)
        handler = _handler_type(stage)
        try:
            if port == 0:
                httpd = ThreadingHTTPServer((chosen, 0), handler)
            elif port is None:
                httpd = _bind_range(chosen, handler)
            else:
                httpd = ThreadingHTTPServer((chosen, port), handler)
        except OSError as exc:
            raise LibraryError(LISTEN_FAILED) from exc
        httpd.daemon_threads = True
        thread = threading.Thread(target=httpd.serve_forever, name="crateCraft-lan-stage", daemon=True)
        thread.start()
        stage.httpd = httpd
        stage.thread = thread
        stage.port = int(httpd.server_address[1])
        _listener = stage
        return _status_locked()


def _bind_range(host: str, handler: type[BaseHTTPRequestHandler]) -> ThreadingHTTPServer:
    """Bind the first free port in the staged-copy range.

    Args:
        host: Bind address.
        handler: Request handler class.

    Returns:
        A bound server.

    Raises:
        OSError: If every port in the range is busy.
    """
    last: OSError | None = None
    for candidate in LISTEN_PORTS:
        try:
            return ThreadingHTTPServer((host, candidate), handler)
        except OSError as exc:
            last = exc
    assert last is not None
    raise last


def _rotate_pairing() -> None:
    """Rotate the live pairing code after a copy has been staged."""
    with _lock:
        if _listener is not None:
            _listener.rotate()


def stop() -> dict[str, object]:
    """Stop the listener. A staged folder that already arrived stays.

    Returns:
        Status with ``listening`` false. Safe to call when nothing is
        listening.
    """
    global _listener
    with _lock:
        current = _listener
        _listener = None
    if current is not None:
        current.httpd.shutdown()
        current.httpd.server_close()
        current.thread.join(timeout=5)
    return status()


def _status_locked() -> dict[str, object]:
    """Return status. The caller holds ``_lock``."""
    current = _listener
    listening = current is not None and current.alive()
    return _finish(
        {
            "ok": True,
            "listening": listening,
            "code": current.fresh_code() if listening and current is not None else "",
            "port": current.port if listening and current is not None else None,
            "host": current.host if listening and current is not None else "",
            "addresses": _lan_addresses(current.host) if listening and current is not None else [],
            "inbox": _inbox_summaries(),
            "library_written": False,
            "written": False,
            "preview": True,
        }
    )


def status() -> dict[str, object]:
    """Return whether this computer is listening, and any staged copies.

    Returns:
        Status. This does not start the listener.
    """
    with _lock:
        return _status_locked()


def _inbox_summaries() -> list[dict[str, object]]:
    """List staged and accepted copies. Incomplete uploads are omitted."""
    root = stage_root()
    if not root.is_dir():
        return []
    rows: list[dict[str, object]] = []
    try:
        children = sorted(root.iterdir())
    except OSError:
        return []
    for child in children:
        try:
            if child.is_symlink() or not child.is_dir() or not ID_RE.fullmatch(child.name):
                continue
            manifest = json.loads((child / "manifest.json").read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            continue
        if not isinstance(manifest, dict):
            continue
        if manifest.get("status") not in {"staged", "accepted"}:
            continue
        manifest["auto_mirror"] = False
        rows.append(_summary(manifest))
    return rows


def _summary(manifest: Mapping[str, object]) -> dict[str, object]:
    """Return the inbox fields for one manifest.

    Args:
        manifest: Parsed manifest. ``auto_mirror`` is forced false.

    Returns:
        Id, label, counts, status, and snapshot id when one was stored.
    """
    files = manifest.get("files") if isinstance(manifest.get("files"), list) else []
    skipped = manifest.get("skipped") if isinstance(manifest.get("skipped"), list) else []
    failed = [item for item in files if isinstance(item, dict) and item.get("status") == "failed"]
    ok = [item for item in files if isinstance(item, dict) and item.get("status") == "ok"]
    return {
        "id": manifest.get("id"),
        "label": manifest.get("label") or "",
        "status": manifest.get("status"),
        "file_count": len(ok),
        "byte_count": manifest.get("byte_count") or 0,
        "skipped_count": len(skipped),
        "failed_count": len(failed),
        "crates": len(manifest.get("crates") or []) if isinstance(manifest.get("crates"), list) else 0,
        "snapshot_id": manifest.get("snapshot_id"),
        "auto_mirror": False,
    }


def _manifest_path(transfer_id: str) -> Path:
    """Return the manifest path after the id and the stage root are checked.

    Args:
        transfer_id: 16 hex characters.

    Returns:
        Path to ``manifest.json``.

    Raises:
        LibraryError: If the id or the stage root is unsafe, or the
            manifest is not a real file inside the stage folder.
    """
    if not isinstance(transfer_id, str) or not ID_RE.fullmatch(transfer_id):
        raise LibraryError(NOT_STAGED)
    root = stage_root()
    assert_stage_root(root)
    return _contained(_contained(root, transfer_id), "manifest.json")


def _load(transfer_id: str) -> dict[str, object]:
    """Read one manifest.

    Args:
        transfer_id: Staged copy id.

    Returns:
        The manifest object.

    Raises:
        LibraryError: If it is missing or not an object.
    """
    path = _manifest_path(transfer_id)
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise LibraryError(NOT_STAGED) from exc
    if not isinstance(payload, dict):
        raise LibraryError(NOT_STAGED)
    payload["auto_mirror"] = False
    return payload


def _save(manifest: Mapping[str, object]) -> None:
    """Write a manifest atomically inside its transfer folder.

    Args:
        manifest: Object that includes ``id``.

    Raises:
        LibraryError: If the folder is unsafe or the write fails.
    """
    transfer_id = manifest.get("id")
    if not isinstance(transfer_id, str):
        raise LibraryError(NOT_STAGED)
    path = _manifest_path(transfer_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = _contained(path.parent, "manifest.json.partial")
    payload = dict(manifest)
    payload["auto_mirror"] = False
    try:
        temp.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        os.replace(temp, path)
    except OSError as exc:
        raise LibraryError(NOT_STAGED) from exc


def _color_value(value: object) -> int | None:
    """Return a stored color, or None when it is empty or white.

    Args:
        value: Manifest color.

    Returns:
        The color.

    Raises:
        LibraryError: If the value is not a 24-bit color or null.
    """
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 0 or value > 0xFFFFFF:
        raise LibraryError("That request is not valid.")
    if value == 0xFFFFFF:
        return None
    return value


def begin_transfer(payload: Mapping[str, object]) -> dict[str, object]:
    """Create a staged folder from a manifest. Does not touch the library.

    Args:
        payload: Crates, files, and skipped rows. ``auto_mirror`` is
            stored false whatever the sender sent.

    Returns:
        ``id`` of the new staged copy.

    Raises:
        LibraryError: If the manifest is invalid, the stage folder is
            unsafe, or the disk does not have room.
    """
    crates = payload.get("crates")
    files = payload.get("files")
    skipped = payload.get("skipped")
    if not isinstance(crates, list) or not isinstance(files, list):
        raise LibraryError("That request is not valid.")
    if len(crates) > MAX_CRATES or len(files) > MAX_FILES:
        raise LibraryError(TOO_MANY)
    if skipped is None:
        skipped = []
    if not isinstance(skipped, list):
        raise LibraryError("That request is not valid.")
    if not crates:
        raise LibraryError(CHOOSE_CRATES)
    clean_crates: list[dict[str, object]] = []
    for item in crates:
        if not isinstance(item, dict) or not isinstance(item.get("name"), str) or not item["name"].strip():
            raise LibraryError("That request is not valid.")
        if len(item["name"]) > 200:
            raise LibraryError("That request is not valid.")
        rels = item.get("rels")
        if not isinstance(rels, list) or any(not isinstance(rel, str) for rel in rels):
            raise LibraryError("That request is not valid.")
        clean_crates.append(
            {
                "name": item["name"].strip(),
                "color": _color_value(item.get("color")),
                "smart": item.get("smart") is True,
                "ancestry": [part for part in item.get("ancestry", []) if isinstance(part, str)][:20]
                if isinstance(item.get("ancestry"), list)
                else [],
                "rels": list(rels),
            }
        )
    clean_files: list[dict[str, object]] = []
    byte_count = 0
    for index, item in enumerate(files):
        if not isinstance(item, dict):
            raise LibraryError("That request is not valid.")
        rel = safe_file_name(item.get("rel"))
        size = item.get("size")
        digest = item.get("sha256")
        if rel is None or isinstance(size, bool) or not isinstance(size, int) or size < 0 or size > MAX_FILE_BYTES:
            raise LibraryError("That request is not valid.")
        if not isinstance(digest, str) or not SHA_RE.fullmatch(digest):
            raise LibraryError("That request is not valid.")
        byte_count += size
        clean_files.append(
            {
                "index": index,
                "rel": rel,
                "size": size,
                "sha256": digest,
                "name": item.get("name") if isinstance(item.get("name"), str) else "",
                "artist": item.get("artist") if isinstance(item.get("artist"), str) else "",
                "status": "pending",
            }
        )
    known = {str(item["rel"]) for item in clean_files}
    for crate in clean_crates:
        for rel in crate["rels"]:
            if rel not in known:
                raise LibraryError("That request is not valid.")
    root = stage_root()
    assert_stage_root(root)
    try:
        root.mkdir(parents=True, exist_ok=True)
        free = shutil.disk_usage(root).free
    except OSError as exc:
        raise LibraryError(NO_SPACE) from exc
    if free < byte_count + 8 * 1024 * 1024:
        raise LibraryError(NO_SPACE)
    transfer_id = os.urandom(8).hex()
    folder = _contained(root, transfer_id)
    try:
        folder.mkdir(parents=False)
        _contained(folder, "files").mkdir()
    except OSError as exc:
        raise LibraryError(NOT_STAGED) from exc
    label = payload.get("label")
    if not isinstance(label, str):
        label = ""
    label = "".join(ch for ch in label if ch.isprintable())[:80]
    manifest: dict[str, object] = {
        "id": transfer_id,
        "status": "open",
        "label": label,
        "fingerprint": payload.get("fingerprint") if isinstance(payload.get("fingerprint"), str) else "",
        "crates": clean_crates,
        "files": clean_files,
        "skipped": [
            {
                "file": item.get("file") if isinstance(item, dict) else "",
                "name": item.get("name") if isinstance(item, dict) else "",
                "artist": item.get("artist") if isinstance(item, dict) else "",
                "reason_code": item.get("reason_code") if isinstance(item, dict) else "",
            }
            for item in skipped
            if isinstance(item, dict)
        ],
        "byte_count": byte_count,
        "auto_mirror": False,
        "snapshot_id": None,
    }
    _save(manifest)
    return {"ok": True, "id": transfer_id, "auto_mirror": False}


def _mark_failed(transfer_id: str, index: int, reason_code: str) -> None:
    """Record one file as failed.

    Args:
        transfer_id: Staged copy id.
        index: File index.
        reason_code: Key in ``REASONS``.
    """
    manifest = _load(transfer_id)
    files = manifest.get("files")
    if not isinstance(files, list) or index >= len(files) or not isinstance(files[index], dict):
        return
    files[index]["status"] = "failed"
    files[index]["reason_code"] = reason_code
    _save(manifest)


def _store_upload(
    transfer_id: str,
    index: int,
    expected: Mapping[str, object],
    stream: object,
    length: int,
    digest_header: str,
) -> bool:
    """Write one upload into the staged files folder.

    Args:
        transfer_id: Staged copy id.
        index: File index.
        expected: Manifest file row.
        stream: Readable body (``rfile``).
        length: Byte count, already checked against the manifest.
        digest_header: SHA-256 the sender claims.

    Returns:
        True when the bytes match. False when they do not. A mismatch
        deletes the partial file and records the failure.

    Raises:
        LibraryError: If the destination would leave the staged folder.
    """
    rel = safe_file_name(expected.get("rel"))
    if rel is None:
        raise LibraryError(NOT_STAGED)
    folder = _manifest_path(transfer_id).parent
    dest = _contained(_contained(folder, "files"), rel)
    partial = _contained(folder, f"partial-{index}")
    digest = hashlib.sha256()
    remaining = length
    try:
        with partial.open("wb") as handle:
            while remaining:
                chunk = stream.read(min(CHUNK, remaining))  # type: ignore[attr-defined]
                if not chunk:
                    break
                handle.write(chunk)
                digest.update(chunk)
                remaining -= len(chunk)
    except OSError as exc:
        partial.unlink(missing_ok=True)
        raise LibraryError(NOT_STAGED) from exc
    actual = digest.hexdigest()
    wanted = str(expected.get("sha256") or "")
    header_ok = (not digest_header) or _codes_match(digest_header.lower(), wanted)
    if remaining or actual != wanted or not header_ok:
        partial.unlink(missing_ok=True)
        _mark_failed(transfer_id, index, "mismatch")
        return False
    try:
        os.replace(partial, dest)
    except OSError as exc:
        partial.unlink(missing_ok=True)
        raise LibraryError(NOT_STAGED) from exc
    manifest = _load(transfer_id)
    files = manifest.get("files")
    if isinstance(files, list) and index < len(files) and isinstance(files[index], dict):
        files[index]["status"] = "ok"
        files[index]["sha256"] = actual
        _save(manifest)
    return True


def commit_transfer(transfer_id: object) -> dict[str, object]:
    """Mark a staged copy ready to review.

    Args:
        transfer_id: Id from begin.

    Returns:
        Counts, including failed files. The library is not opened.

    Raises:
        LibraryError: If the id is unknown.
    """
    if not isinstance(transfer_id, str):
        raise LibraryError(NOT_STAGED)
    manifest = _load(transfer_id)
    if manifest.get("status") not in {"open", "staged"}:
        return _finish(
            {
                "ok": True,
                "id": transfer_id,
                "status": manifest.get("status"),
                "library_written": False,
                "written": False,
                "sent": 0,
                "failed": [],
                "failed_count": 0,
            }
        )
    files = manifest.get("files") if isinstance(manifest.get("files"), list) else []
    failed = []
    ok = 0
    for item in files:
        if not isinstance(item, dict):
            continue
        if item.get("status") == "ok":
            ok += 1
        elif item.get("status") != "ok":
            if item.get("status") == "pending":
                item["status"] = "failed"
                item["reason_code"] = item.get("reason_code") or "mismatch"
            failed.append(
                {
                    "file": item.get("rel"),
                    "name": item.get("name") or "",
                    "artist": item.get("artist") or "",
                    **_reason(str(item.get("reason_code") or "mismatch")),
                }
            )
    manifest["status"] = "staged"
    _save(manifest)
    _rotate_pairing()
    return _finish(
        {
            "ok": True,
            "id": transfer_id,
            "status": "staged",
            "sent": ok,
            "failed": failed[:ROW_CAP],
            "failed_count": len(failed),
            "library_written": False,
            "written": False,
        }
    )


def review(transfer_id: object) -> dict[str, object]:
    """Return one staged copy for the page.

    Args:
        transfer_id: Staged copy id.

    Returns:
        Crates, counts, and capped file lists. Nothing is written.

    Raises:
        LibraryError: If the copy is not staged or accepted.
    """
    if not isinstance(transfer_id, str):
        raise LibraryError(NOT_STAGED)
    manifest = _load(transfer_id)
    if manifest.get("status") not in {"staged", "accepted", "accepting"}:
        raise LibraryError(NOT_STAGED)
    return _review_body(manifest)


def _review_body(manifest: Mapping[str, object]) -> dict[str, object]:
    """Shape a manifest for the page.

    Args:
        manifest: Parsed manifest.

    Returns:
        The review object. ``auto_mirror`` is false.
    """
    files = [item for item in manifest.get("files", []) if isinstance(item, dict)] if isinstance(manifest.get("files"), list) else []
    skipped = [item for item in manifest.get("skipped", []) if isinstance(item, dict)] if isinstance(manifest.get("skipped"), list) else []
    failed = [item for item in files if item.get("status") == "failed"]
    ok = [item for item in files if item.get("status") == "ok"]
    crates = manifest.get("crates") if isinstance(manifest.get("crates"), list) else []
    return _finish(
        {
            "ok": True,
            "preview": True,
            "written": False,
            "library_written": False,
            "id": manifest.get("id"),
            "label": manifest.get("label") or "",
            "status": manifest.get("status"),
            "crates": [
                {
                    "name": item.get("name"),
                    "color": item.get("color"),
                    "smart": item.get("smart") is True,
                    "ancestry": item.get("ancestry") if isinstance(item.get("ancestry"), list) else [],
                    "tracks": len(item.get("rels") or []) if isinstance(item.get("rels"), list) else 0,
                }
                for item in crates
                if isinstance(item, dict)
            ],
            "files": _public_rows([{**item, "file": item.get("rel")} for item in ok]),
            "skipped": _public_rows(skipped),
            "failed": _public_rows([{**item, "file": item.get("rel"), **_reason(str(item.get("reason_code") or "mismatch"))} for item in failed]),
            "file_count": len(ok),
            "byte_count": manifest.get("byte_count") or 0,
            "skipped_count": len(skipped),
            "failed_count": len(failed),
            "snapshot_id": manifest.get("snapshot_id"),
        }
    )


def _library_hashes(conn: sqlite3.Connection, space: str, sizes: set[int]) -> dict[tuple[int, str], int]:
    """Index library files whose size is one this staged copy needs.

    Args:
        conn: Read or write connection.
        space: Space name.
        sizes: Sizes of staged files that arrived.

    Returns:
        ``(size, sha256)`` to asset id. A shortcut is not hashed.
    """
    if not sizes:
        return {}
    rows = conn.execute(
        """
        SELECT a.id, a.portable_id
        FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
        """,
        (space,),
    )
    found: dict[tuple[int, str], int] = {}
    for row in rows:
        stored = row["portable_id"] if isinstance(row["portable_id"], str) else ""
        raw = library._resolved(stored) if stored else None
        if not raw:
            continue
        path = Path(raw)
        try:
            if path.is_symlink() or not path.is_file():
                continue
            size = path.stat().st_size
        except OSError:
            continue
        if size not in sizes:
            continue
        digest = _hash_file(path)
        if digest is None:
            continue
        found.setdefault((size, digest), int(row["id"]))
    return found


def _accept_plan(conn: sqlite3.Connection, space: str, manifest: Mapping[str, object]) -> dict[str, object]:
    """Match staged files to tracks this library already has.

    Args:
        conn: Open connection.
        space: Space that receives the crates.
        manifest: Staged manifest.

    Returns:
        Crates with matched asset ids, plus unmatched file rows.
        New asset rows are not invented.
    """
    files = [item for item in manifest.get("files", []) if isinstance(item, dict)] if isinstance(manifest.get("files"), list) else []
    arrived = {
        str(item.get("rel")): item
        for item in files
        if item.get("status") == "ok" and isinstance(item.get("rel"), str)
    }
    sizes = {int(item["size"]) for item in arrived.values() if isinstance(item.get("size"), int)}
    index = _library_hashes(conn, space, sizes)
    try:
        folder = _contained(_manifest_path(str(manifest["id"])).parent, "files")
    except LibraryError:
        folder = None
    unmatched: list[dict[str, object]] = []
    crates_out: list[dict[str, object]] = []
    raw_crates = manifest.get("crates") if isinstance(manifest.get("crates"), list) else []
    for crate in raw_crates:
        if not isinstance(crate, dict):
            continue
        ids: list[int] = []
        rels = crate.get("rels") if isinstance(crate.get("rels"), list) else []
        for rel in rels:
            item = arrived.get(str(rel))
            if item is None:
                continue
            size = item.get("size")
            digest = item.get("sha256")
            asset_id = index.get((int(size), str(digest))) if isinstance(size, int) and isinstance(digest, str) else None
            if asset_id is None:
                on_disk = False
                if folder is not None and isinstance(rel, str):
                    try:
                        on_disk = _contained(folder, rel).is_file()
                    except LibraryError:
                        on_disk = False
                unmatched.append(
                    {
                        "file": rel,
                        "name": item.get("name") or "",
                        "artist": item.get("artist") or "",
                        "size": size,
                        "on_disk": on_disk,
                        **_reason("not_in_library"),
                    }
                )
                continue
            if asset_id not in ids:
                ids.append(asset_id)
        crates_out.append(
            {
                "name": crate.get("name"),
                "color": crate.get("color"),
                "smart": crate.get("smart") is True,
                "ids": ids,
            }
        )
    return {"crates": crates_out, "unmatched": unmatched}


def _accept_preview(space: str, manifest: Mapping[str, object]) -> dict[str, object]:
    """Describe the library write without opening a write session.

    Args:
        space: Space name.
        manifest: Staged manifest.

    Returns:
        Preview with matched and unmatched counts. ``written`` is false.
    """
    with closing(library.read_conn()) as conn:
        plan = _accept_plan(conn, space, manifest)
    matched = sum(len(item["ids"]) for item in plan["crates"])  # type: ignore[index]
    return _finish(
        {
            "ok": True,
            "preview": True,
            "written": False,
            "library_written": False,
            "id": manifest.get("id"),
            "folder": GENERATED_FOLDER,
            "name": FOLDER_NAME,
            "crates": [
                {"name": item["name"], "color": item["color"], "smart": item["smart"], "matched": len(item["ids"])}
                for item in plan["crates"]
            ],
            "matched": matched,
            "unmatched": _public_rows(list(plan["unmatched"])),  # type: ignore[arg-type]
            "unmatched_count": len(plan["unmatched"]),  # type: ignore[arg-type]
            "snapshot_id": manifest.get("snapshot_id"),
        }
    )


def accept(transfer_id: object, space: str, confirm: object) -> dict[str, object]:
    """Add staged crates to this library after confirm.

    Colors are copied. Tracks are added only when this library already
    has the same file bytes. Other files stay in the staged folder and
    are listed. An empty crate list does not write.

    Args:
        transfer_id: Staged copy id.
        space: Space name.
        confirm: True writes. Any other value is a preview.

    Returns:
        The preview, or the write result with ``snapshot_id``.

    Raises:
        LibraryError: If the copy is not staged, already added, or the
            write is refused.
        library.SeratoOpen: If Serato still holds the library.
    """
    if not isinstance(transfer_id, str):
        raise LibraryError(NOT_STAGED)
    manifest = _load(transfer_id)
    status_name = manifest.get("status")
    if status_name == "accepted":
        raise LibraryError(ALREADY)
    if status_name == "accepting":
        raise LibraryError(IN_PROGRESS)
    if status_name != "staged":
        raise LibraryError(NOT_STAGED)
    if confirm is not True:
        return _accept_preview(space, manifest)
    crates = manifest.get("crates")
    if not isinstance(crates, list) or not crates:
        body = _accept_preview(space, manifest)
        body["written"] = False
        return body
    manifest["status"] = "accepting"
    _save(manifest)
    try:
        result = _accept_write(space, manifest)
    except Exception:
        current = _load(transfer_id)
        if current.get("status") == "accepting":
            current["status"] = "staged"
            _save(current)
        raise
    manifest = _load(transfer_id)
    manifest["status"] = "accepted"
    manifest["snapshot_id"] = result.get("snapshot_id")
    manifest["crate_ids"] = result.get("crate_ids")
    _save(manifest)
    result["id"] = transfer_id
    return _finish(result)


def _accept_write(space: str, manifest: Mapping[str, object]) -> dict[str, object]:
    """Write the staged crates inside one safe-write session.

    Args:
        space: Space name.
        manifest: Staged manifest. Status is already ``accepting``.

    Returns:
        ``written`` true, crate ids, colors, and ``snapshot_id``.
    """
    import safe_write
    import smart_presets

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Create the folder and the crates, then check names, colors, and members."""
        plan = _accept_plan(conn, space, manifest)
        root_id = library._space_root(conn, space)
        generated_id = library._find_child(conn, root_id, GENERATED_FOLDER, 1)
        if generated_id is None:
            made = library._create_crate(conn, space, root_id, GENERATED_FOLDER, False, None)
            generated_id = made["id"]
            if not isinstance(generated_id, int):
                raise LibraryError("The crate could not be created.")
            _expect_name(write, generated_id, GENERATED_FOLDER)
        else:
            generated_id = int(generated_id)
        parent_id = library._find_child(conn, generated_id, FOLDER_NAME, 1)
        if parent_id is None:
            parent = library._create_crate(conn, space, generated_id, FOLDER_NAME, False, None)
            parent_id = parent["id"]
            if not isinstance(parent_id, int):
                raise LibraryError("The crate could not be created.")
            _expect_name(write, parent_id, FOLDER_NAME)
        else:
            parent_id = int(parent_id)
        write.set_target(FOLDER_NAME)
        made_crates: list[dict[str, object]] = []
        for crate in plan["crates"]:
            base = str(crate["name"])
            name = _fresh_name(conn, parent_id, base)
            created = library._create_crate(conn, space, parent_id, name, False, None)
            crate_id = created["id"]
            if not isinstance(crate_id, int):
                raise LibraryError("The crate could not be created.")
            color = crate.get("color")
            if isinstance(color, int):
                library._set_color(conn, space, crate_id, color)
            ids = [int(asset_id) for asset_id in crate["ids"]]  # type: ignore[index]
            for asset_id in ids:
                library._membership(conn, crate_id, asset_id, space, True)
            _expect_name(write, crate_id, name)
            _expect_color(write, crate_id, color if isinstance(color, int) else None)
            smart_presets._expect_members(write, crate_id, tuple(ids))
            made_crates.append({"id": crate_id, "name": name, "color": color if isinstance(color, int) else None, "matched": len(ids)})
        snapshot_id = write.snapshot_id
        return {
            "ok": True,
            "preview": False,
            "written": True,
            "library_written": True,
            "folder": GENERATED_FOLDER,
            "name": FOLDER_NAME,
            "crates": made_crates,
            "crate_ids": [item["id"] for item in made_crates],
            "matched": sum(int(item["matched"]) for item in made_crates),
            "unmatched": _public_rows(list(plan["unmatched"])),  # type: ignore[arg-type]
            "unmatched_count": len(plan["unmatched"]),  # type: ignore[arg-type]
            "snapshot_id": snapshot_id if isinstance(snapshot_id, str) else None,
        }

    return safe_write.run("lan_stage", FOLDER_NAME, apply)


def _fresh_name(conn: sqlite3.Connection, parent_id: int, name: str) -> str:
    """Return a child name that is not already under the parent.

    Args:
        conn: Write connection.
        parent_id: Parent crate id.
        name: Preferred name.

    Returns:
        ``name``, or ``name`` plus a number.

    Raises:
        LibraryError: If fifty suffixes are already taken.
    """
    candidate = name
    for number in range(2, 52):
        if library._find_child(conn, parent_id, candidate, 1) is None:
            return candidate
        candidate = f"{name} {number}"
    raise LibraryError(STAGE_NAME)


def _expect_name(write: object, crate_id: int, name: str) -> None:
    """Register a check that the crate kept its display name.

    Args:
        write: Safe-write session.
        crate_id: Container id.
        name: Display name.
    """
    import safe_write

    def check(copied: sqlite3.Connection, crate_id: int = crate_id, name: str = name) -> None:
        row = copied.execute("SELECT name FROM container WHERE id = ?", (crate_id,)).fetchone()
        if row is None or library.display_name(str(row[0])) != name:
            raise safe_write.VerifyMismatch("The crate name does not match.")

    write.check(check)  # type: ignore[attr-defined]


def _expect_color(write: object, crate_id: int, color: int | None) -> None:
    """Register a check that the crate kept its color.

    Args:
        write: Safe-write session.
        crate_id: Container id.
        color: Stored color, or None when the staged crate had none.
    """
    import safe_write

    def check(copied: sqlite3.Connection, crate_id: int = crate_id, color: int | None = color) -> None:
        row = copied.execute("SELECT color FROM container WHERE id = ?", (crate_id,)).fetchone()
        stored = None if row is None or row[0] is None else int(row[0])
        if stored != color:
            raise safe_write.VerifyMismatch("The crate color does not match.")

    write.check(check)  # type: ignore[attr-defined]


def undo(snapshot_id: object, transfer_id: object, confirm: object) -> dict[str, object]:
    """Put back the snapshot from an add.

    Args:
        snapshot_id: ``snapshot_id`` from accept.
        transfer_id: Staged copy id, or None. When the manifest records
            a different snapshot, the undo is refused.
        confirm: True restores. Any other value does not.

    Returns:
        Preview, or ``undone`` true.

    Raises:
        LibraryError: If the snapshot does not belong to this copy, or
            the restore is refused.
        library.SeratoOpen: If Serato still holds the library.
    """
    if not isinstance(snapshot_id, str) or not snapshot_id:
        raise LibraryError(STAGE_SNAPSHOT)
    if confirm is not True:
        return _finish(
            {
                "ok": True,
                "preview": True,
                "written": False,
                "library_written": False,
                "snapshot_id": snapshot_id,
                "undone": False,
            }
        )
    if isinstance(transfer_id, str) and transfer_id:
        try:
            manifest = _load(transfer_id)
        except LibraryError:
            manifest = None
        if manifest is not None and manifest.get("snapshot_id") not in (None, "", snapshot_id):
            raise LibraryError(STAGE_SNAPSHOT)
    import safe_write

    safe_write.undo_preimage(snapshot_id, operation="lan_stage_undo", target=FOLDER_NAME)
    if isinstance(transfer_id, str) and transfer_id:
        try:
            manifest = _load(transfer_id)
        except LibraryError:
            manifest = None
        if manifest is not None and manifest.get("snapshot_id") in (None, "", snapshot_id):
            manifest["status"] = "staged"
            manifest["snapshot_id"] = None
            _save(manifest)
    return _finish(
        {
            "ok": True,
            "preview": False,
            "written": True,
            "library_written": True,
            "undone": True,
            "snapshot_id": snapshot_id,
        }
    )


def discard(transfer_id: object, confirm: object) -> dict[str, object]:
    """Remove one staged folder. The Serato library is not opened.

    Args:
        transfer_id: 16 hex characters. Anything else is refused.
        confirm: True deletes. Any other value lists the copy and
            leaves it on disk.

    Returns:
        ``library_written`` false. ``removed`` true after a delete.

    Raises:
        LibraryError: If the id is not a real directory inside the
            stage folder, or the copy is mid-add.
    """
    if not isinstance(transfer_id, str) or not ID_RE.fullmatch(transfer_id):
        raise LibraryError(NOT_STAGED)
    root = stage_root()
    assert_stage_root(root)
    try:
        target = _contained(root, transfer_id)
    except LibraryError:
        raise
    except OSError as exc:
        raise LibraryError(NOT_STAGED) from exc
    if not target.is_dir():
        raise LibraryError(NOT_STAGED)
    try:
        manifest = _load(transfer_id)
    except LibraryError:
        manifest = {}
    if manifest.get("status") == "accepting":
        raise LibraryError(IN_PROGRESS)
    if confirm is not True:
        return _finish(
            {
                "ok": True,
                "preview": True,
                "written": False,
                "library_written": False,
                "removed": False,
                "id": transfer_id,
            }
        )
    shutil.rmtree(target)
    return _finish(
        {
            "ok": True,
            "preview": False,
            "written": False,
            "library_written": False,
            "removed": True,
            "id": transfer_id,
        }
    )


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/lan-stage`` request.

    Args:
        payload: ``action`` is ``preview``, ``listen``, ``stop``,
            ``status``, ``send``, ``inbox``, ``review``, ``accept``,
            ``undo``, or ``discard``. Sends and library writes need
            ``confirm`` true. There is no mirror action.

    Returns:
        That action's result. ``auto_mirror`` is false.

    Raises:
        LibraryError: If the action or its fields are invalid.
        library.SeratoOpen: If accept or undo runs while Serato holds
            the library.
    """
    kind = payload.get("action")
    if kind in {None, "", "status"}:
        return status()
    if kind == "listen":
        return listen()
    if kind == "stop":
        return stop()
    if kind == "inbox":
        body = status()
        body["preview"] = True
        return body
    if kind == "preview":
        return preview(_space(payload.get("space")), _crate_ids(payload.get("crates")))
    if kind == "send":
        return send_copy(
            payload.get("host"),
            payload.get("port"),
            payload.get("code"),
            _space(payload.get("space")),
            _crate_ids(payload.get("crates")),
            payload.get("fingerprint"),
            payload.get("confirm"),
        )
    if kind == "review":
        return review(payload.get("id"))
    if kind == "accept":
        return accept(payload.get("id"), _space(payload.get("space")), payload.get("confirm"))
    if kind == "undo":
        return undo(payload.get("snapshot_id"), payload.get("id"), payload.get("confirm"))
    if kind == "discard":
        return discard(payload.get("id"), payload.get("confirm"))
    raise LibraryError("That action is not available.")


def main(argv: list[str] | None = None) -> int:
    """Print status, or a read-only preview. Does not listen or send.

    Args:
        argv: Arguments, or None for ``sys.argv``.

    Returns:
        0. A refused preview still prints JSON and returns 0 so a script
        can read the error. Listening is not a flag.
    """
    parser = argparse.ArgumentParser(description="Show Backup Mac status. Does not listen or send.")
    parser.add_argument("--preview", action="store_true", help="Count files for the given crates. Writes nothing.")
    parser.add_argument("--crate", action="append", type=int, default=[], help="Crate id. Repeat for each crate.")
    parser.add_argument("--space", default=library.LIBRARY_SPACE)
    args = parser.parse_args(argv)
    try:
        if args.preview:
            payload: dict[str, object] = preview(args.space, list(args.crate))
        else:
            payload = status()
    except LibraryError as exc:
        payload = {"error": exc.message, "auto_mirror": False}
    print(json.dumps(payload))
    return 0


if __name__ == "__main__":
    sys.exit(main())
