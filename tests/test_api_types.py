"""Check live ``server.py`` JSON against required fields in ``src/lib/api-types.ts``.

The page types are the contract. A 200 from a route is not enough: a
required field missing from the body, or the wrong JSON type, fails.
"""

from __future__ import annotations

import json
import re
import threading
import unittest
import urllib.error
import urllib.request
from dataclasses import dataclass
from http.server import ThreadingHTTPServer
from pathlib import Path

import library
import server
from tests.fixture import TempLibrary

ROOT = Path(__file__).resolve().parents[1]
API_TYPES = ROOT / "src" / "lib" / "api-types.ts"


@dataclass(frozen=True)
class TsField:
    """One property on a TypeScript interface."""

    name: str
    optional: bool
    type_text: str


def _strip_ts_comments(source: str) -> str:
    """Remove block and line comments from TypeScript source.

    Args:
        source: File text.

    Returns:
        Source with comments replaced by spaces.
    """
    without_block = re.sub(r"/\*.*?\*/", " ", source, flags=re.DOTALL)
    return re.sub(r"//.*?$", " ", without_block, flags=re.MULTILINE)


def _matching_brace(text: str, open_at: int) -> int:
    """Return the index of the closing brace that matches ``text[open_at]``.

    Args:
        text: Source with ``{`` at ``open_at``.
        open_at: Index of the opening brace.

    Returns:
        Index of the matching ``}``.

    Raises:
        ValueError: If the braces are unbalanced.
    """
    depth = 0
    for index in range(open_at, len(text)):
        char = text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index
    raise ValueError("unbalanced braces in api-types.ts")


def parse_interfaces(source: str) -> dict[str, tuple[TsField, ...]]:
    """Read exported interfaces and their properties from ``api-types.ts``.

    Args:
        source: TypeScript text.

    Returns:
        Interface name to fields, in source order. Index signatures are skipped.
    """
    text = _strip_ts_comments(source)
    found: dict[str, tuple[TsField, ...]] = {}
    needle = "export interface "
    start = 0
    while True:
        at = text.find(needle, start)
        if at < 0:
            break
        name_start = at + len(needle)
        name_match = re.match(r"([A-Za-z_][A-Za-z0-9_]*)\s*\{", text[name_start:])
        if name_match is None:
            start = name_start
            continue
        name = name_match.group(1)
        brace = name_start + name_match.end() - 1
        close = _matching_brace(text, brace)
        body = text[brace + 1 : close]
        found[name] = tuple(_parse_fields(body))
        start = close + 1
    return found


def _parse_fields(body: str) -> list[TsField]:
    """Parse properties inside one interface body.

    Args:
        body: Text between the interface braces.

    Returns:
        Fields in source order.
    """
    fields: list[TsField] = []
    index = 0
    length = len(body)
    while index < length:
        while index < length and body[index].isspace():
            index += 1
        if index >= length:
            break
        if body[index] == "[":
            end = body.find(";", index)
            if end < 0:
                break
            index = end + 1
            continue
        name_match = re.match(r"([A-Za-z_][A-Za-z0-9_]*)(\?)?\s*:", body[index:])
        if name_match is None:
            end = body.find(";", index)
            if end < 0:
                break
            index = end + 1
            continue
        name = name_match.group(1)
        optional = name_match.group(2) == "?"
        type_at = index + name_match.end()
        type_text, consumed = _read_type(body[type_at:])
        fields.append(TsField(name=name, optional=optional, type_text=type_text.strip()))
        index = type_at + consumed
    return fields


def _read_type(text: str) -> tuple[str, int]:
    """Read one type until a top-level semicolon.

    Args:
        text: Remainder of the interface body starting at the type.

    Returns:
        The type string and the number of characters consumed, including
        the semicolon when present.
    """
    depth = 0
    angle = 0
    for index, char in enumerate(text):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
        elif char == "<":
            angle += 1
        elif char == ">":
            angle -= 1
        elif char == ";" and depth == 0 and angle == 0:
            return text[:index], index + 1
    return text, len(text)


def _split_union(type_text: str) -> list[str]:
    """Split a union type on top-level ``|``.

    Args:
        type_text: A TypeScript type.

    Returns:
        The alternatives, stripped. A type with no ``|`` is a one-item list.
    """
    parts: list[str] = []
    depth = 0
    angle = 0
    last = 0
    for index, char in enumerate(type_text):
        if char in "{[(":
            depth += 1
        elif char in "}])":
            depth -= 1
        elif char == "<":
            angle += 1
        elif char == ">":
            angle -= 1
        elif char == "|" and depth == 0 and angle == 0:
            parts.append(type_text[last:index].strip())
            last = index + 1
    parts.append(type_text[last:].strip())
    return [part for part in parts if part]


def _is_primitive_type(type_text: str, interfaces: dict[str, tuple[TsField, ...]]) -> bool:
    """Return whether ``type_text`` is only JSON primitives.

    Optional primitives on the page are what the screen reads. SQLite may
    send 0/1 or null for those keys. Nested objects still get a shape check.

    Args:
        type_text: A TypeScript type.
        interfaces: Parsed interfaces.

    Returns:
        True when no named interface is in the type.
    """
    for option in _split_union(type_text):
        item = _named_array_item(option)
        if item is not None:
            if item in interfaces:
                return False
            continue
        if option in interfaces:
            return False
        if option.startswith("{") or option.startswith("Array<") or option.startswith("Record<"):
            return False
    return True


def _named_array_item(type_text: str) -> str | None:
    """Return the interface name for ``Name[]``, or None.

    Args:
        type_text: A TypeScript type.

    Returns:
        The item interface name when the type is a named array.
    """
    match = re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*)\s*\[\s*\]", type_text)
    if match is None:
        return None
    return match.group(1)


def _json_matches_type(
    value: object,
    type_text: str,
    interfaces: dict[str, tuple[TsField, ...]],
    path: str,
) -> list[str]:
    """Return problems when ``value`` does not fit ``type_text``.

    Extra JSON keys are allowed. Required TypeScript fields must be present.

    Args:
        value: Decoded JSON.
        type_text: TypeScript type for this value.
        interfaces: Parsed ``api-types.ts`` interfaces.
        path: Dotted path for error text.

    Returns:
        Human-readable problems. Empty means the value fits.
    """
    problems: list[str] = []
    alternatives = _split_union(type_text)
    if len(alternatives) > 1:
        for option in alternatives:
            option_problems = _json_matches_type(value, option, interfaces, path)
            if not option_problems:
                return []
        problems.append(f"{path}: {value!r} does not match {type_text}")
        return problems

    text = alternatives[0]
    if text == "null":
        if value is not None:
            problems.append(f"{path}: expected null, got {value!r}")
        return problems
    if text == "undefined":
        return problems
    if text.startswith("{") or text.startswith("Record<") or text.startswith("Array<"):
        if text.startswith("Array<"):
            if not isinstance(value, list):
                problems.append(f"{path}: expected array, got {type(value).__name__}")
            return problems
        if not isinstance(value, dict):
            problems.append(f"{path}: expected object, got {type(value).__name__}")
        return problems
    item = _named_array_item(text)
    if item is not None:
        if not isinstance(value, list):
            problems.append(f"{path}: expected {text}, got {type(value).__name__}")
            return problems
        if item in interfaces:
            for index, entry in enumerate(value):
                problems.extend(_json_matches_type(entry, item, interfaces, f"{path}[{index}]"))
        return problems
    if text in interfaces:
        if not isinstance(value, dict):
            problems.append(f"{path}: expected {text} object, got {type(value).__name__}")
            return problems
        for field in interfaces[text]:
            if field.name not in value:
                if not field.optional:
                    problems.append(f"{path}.{field.name}: missing required {text} field")
                continue
            present = value[field.name]
            if field.optional and present is None:
                continue
            if field.optional and _is_primitive_type(field.type_text, interfaces):
                continue
            problems.extend(
                _json_matches_type(present, field.type_text, interfaces, f"{path}.{field.name}")
            )
        return problems
    literals = re.findall(r'"([^"]*)"', text)
    if literals and all(token.startswith('"') for token in _split_union(text) if token):
        if value not in literals:
            problems.append(f"{path}: expected one of {literals}, got {value!r}")
        return problems
    if text == "string":
        if not isinstance(value, str):
            problems.append(f"{path}: expected string, got {type(value).__name__}")
        return problems
    if text == "number":
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            problems.append(f"{path}: expected number, got {type(value).__name__}")
        return problems
    if text == "boolean":
        # SQLite stores 0/1. The page already treats those as booleans.
        if isinstance(value, bool) or value in (0, 1):
            return problems
        problems.append(f"{path}: expected boolean, got {type(value).__name__}")
        return problems
    if text == "unknown" or text == "object":
        return problems
    return problems


class ApiTypeContractTests(unittest.TestCase):
    """``api-types.ts`` still names the required fields the page relies on."""

    def test_version_payload_requires_three_fields(self) -> None:
        """Keep version, commit, and source required on GET /api/version.

        Returns:
            None. The test fails if those fields become optional or vanish.
        """
        interfaces = parse_interfaces(API_TYPES.read_text(encoding="utf-8"))
        fields = {item.name: item for item in interfaces["VersionPayload"]}
        self.assertFalse(fields["version"].optional)
        self.assertFalse(fields["commit"].optional)
        self.assertFalse(fields["source"].optional)
        self.assertEqual(fields["version"].type_text, "string")
        self.assertEqual(fields["commit"].type_text, "string | null")
        self.assertIn("release", fields["source"].type_text)
        self.assertIn("git", fields["source"].type_text)
        self.assertIn("dev", fields["source"].type_text)

    def test_library_payload_requires_tracks_and_crates(self) -> None:
        """Keep the GET /api/library lists required.

        Returns:
            None. The test fails if tracks or crates become optional.
        """
        interfaces = parse_interfaces(API_TYPES.read_text(encoding="utf-8"))
        fields = {item.name: item for item in interfaces["LibraryPayload"]}
        self.assertFalse(fields["tracks"].optional)
        self.assertFalse(fields["crates"].optional)
        self.assertEqual(fields["tracks"].type_text, "Track[]")
        self.assertEqual(fields["crates"].type_text, "Crate[]")
        track = {item.name: item for item in interfaces["Track"]}
        crate = {item.name: item for item in interfaces["Crate"]}
        self.assertFalse(track["id"].optional)
        self.assertFalse(crate["id"].optional)
        self.assertFalse(crate["name"].optional)

    def test_checker_rejects_a_library_body_without_tracks(self) -> None:
        """A 200 object that omits tracks is not a LibraryPayload.

        Returns:
            None. The test fails if the checker treats a missing required
            field as a match.
        """
        interfaces = parse_interfaces(API_TYPES.read_text(encoding="utf-8"))
        problems = _json_matches_type({"crates": []}, "LibraryPayload", interfaces, "body")
        self.assertTrue(any("tracks" in item for item in problems), problems)

    def test_checker_rejects_the_wrong_json_type(self) -> None:
        """A string version is not a VersionPayload.

        A route-exists check would pass this. The shape check must not.

        Returns:
            None. The test fails if a string body matches VersionPayload.
        """
        interfaces = parse_interfaces(API_TYPES.read_text(encoding="utf-8"))
        problems = _json_matches_type("ok", "VersionPayload", interfaces, "body")
        self.assertTrue(problems)


class LiveApiShapeTests(unittest.TestCase):
    """GET JSON from ``Handler`` and match it to ``api-types.ts``."""

    def setUp(self) -> None:
        """Start a temporary library and an HTTP server on a free port.

        Returns:
            None.
        """
        self.library = TempLibrary()
        self.library.__enter__()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.httpd.server_address
        self.base = f"http://{host}:{port}"
        self.interfaces = parse_interfaces(API_TYPES.read_text(encoding="utf-8"))

    def tearDown(self) -> None:
        """Stop the test server and delete the temporary library.

        Returns:
            None.
        """
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=3)
        self.library.__exit__(None, None, None)

    def get_json(self, path: str) -> tuple[int, object]:
        """GET one JSON route from the test server.

        Args:
            path: Absolute path and query.

        Returns:
            Status and decoded JSON.
        """
        request = urllib.request.Request(self.base + path)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                body = response.read()
                status = response.status
        except urllib.error.HTTPError as exc:
            body = exc.read()
            status = exc.code
            exc.close()
        return status, json.loads(body.decode("utf-8"))

    def assert_shape(self, path: str, type_name: str) -> object:
        """GET ``path`` and require a 200 body that matches ``type_name``.

        Args:
            path: Absolute path and query.
            type_name: Interface in ``api-types.ts``.

        Returns:
            The decoded JSON body.
        """
        status, payload = self.get_json(path)
        self.assertEqual(status, 200, f"{path} status {status}: {payload!r}")
        problems = _json_matches_type(payload, type_name, self.interfaces, path)
        self.assertEqual(problems, [], f"{path} vs {type_name}: " + "; ".join(problems))
        return payload

    def test_json_routes_match_api_types(self) -> None:
        """Hit the JSON GET routes the page types, not only that they exist.

        Each body is checked against required fields parsed from
        ``src/lib/api-types.ts``. Extra server keys are allowed. Audio, M3U,
        Rekordbox XML, and waveform bytes are not JSON and stay out.

        Returns:
            None. The test fails if a required field is missing or mistyped.
        """
        self.assert_shape("/api/version", "VersionPayload")
        library = self.assert_shape("/api/library", "LibraryPayload")
        self.assertIsInstance(library, dict)
        tracks = library["tracks"]
        self.assertGreaterEqual(len(tracks), 1)
        track_id = tracks[0]["id"]
        self.assert_shape(f"/api/track?id={track_id}", "Track")
        self.assert_shape("/api/library-roots", "LibraryRootsPayload")
        self.assert_shape("/api/settings", "SettingsPayload")
        self.assert_shape("/api/status", "SeratoStatus")
        self.assert_shape("/api/duplicates", "DuplicatePayload")
        self.assert_shape("/api/history", "HistoryPayload")
        self.assert_shape("/api/history?session=1", "HistoryPayload")
        self.assert_shape("/api/files", "FilesPayload")
        self.assert_shape("/api/operations", "OperationList")
        self.assert_shape("/api/snapshots", "SnapshotList")
        self.assert_shape("/api/logs", "LogsPayload")
        self.assert_shape("/api/relink?space=Serato%20Library", "RelinkPlan")
        self.assert_shape("/api/gig-check", "GigReport")
        self.assert_shape("/api/file-scan", "FileScanReport")
        self.assert_shape("/api/library-health", "LibraryHealthReport")
        self.assert_shape("/api/album-art", "AlbumArtMissing")
        self.assert_shape("/api/tag-clusters?field=genre", "TagClusters")

    def test_version_without_opening_the_library(self) -> None:
        """GET /api/version still matches VersionPayload with no master file.

        Returns:
            None. The test fails if the three fields are missing.
        """
        missing = self.library.root / "absent.sqlite"
        old = library.MASTER
        try:
            library.MASTER = missing
            self.assert_shape("/api/version", "VersionPayload")
        finally:
            library.MASTER = old
