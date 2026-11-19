"""Compile crate presets into Serato smart-crate rules when they fit (#26).

Serato smart crates are one flat list of STRING, UINT32, or TIME predicates
with a single AND or OR. A preset that needs crate scope, play history, or
mixed nested conjunctions stays a normal ``⟳`` crate. Unscoped harmonic and
BPM, and a flattenable custom rule tree, become type 2 with a ``.scrate``
filename.
"""

from __future__ import annotations

import math
import sqlite3
import time
from collections.abc import Mapping, Sequence
from typing import cast

import library
import related
from library import LibraryError

STRING_ATTRS = frozenset({"album", "artist", "comments", "genre", "key", "name", "type"})
UINT32_ATTRS = frozenset({"bpm", "stems_analyze_state"})
TIME_ATTRS = frozenset({"time_added"})
STRING_OPS = frozenset({"IS", "CONTAINS", "IS_NOT", "DOES_NOT_CONTAIN"})
UINT32_OPS = frozenset({"GREATER_THAN_OR_EQUAL_TO", "LESS_THAN_OR_EQUAL_TO"})
TIME_OPS = frozenset({"AFTER", "BEFORE"})
CONJUNCTIONS = frozenset({"AND", "OR"})
TITLE_ALIAS = "title"
MAX_RULES = 20
BAD_RULES = "Choose at least one complete rule."
_ASSET_SQL = """
    SELECT a.id, a.name, a.artist, a.album, a.genre, a.comments, a.key, a.bpm,
           a.type, a.time_added, a.stems_analyze_state
    FROM asset a
    JOIN space_asset sa ON sa.asset_id = a.id
    JOIN space s ON s.id = sa.space_id
    WHERE s.name = ?
    ORDER BY a.name COLLATE NOCASE, a.artist COLLATE NOCASE, a.id
"""


def _number(value: object) -> float | None:
    """Read a JSON number, refusing booleans and text.

    Args:
        value: Value from a rule or an asset row.

    Returns:
        The float, or None when the value is not a finite number.
    """
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    if number != number or number in (float("inf"), float("-inf")):
        return None
    return number


def _display_key(alias: str) -> str:
    """Turn a ``_KEY_VALUES`` key into the spelling Serato stores.

    Args:
        alias: Lowercase Camelot or traditional name.

    Returns:
        ``1A``, ``Am``, ``G#m``.
    """
    if len(alias) >= 2 and alias[-1] in "ab" and alias[:-1].isdigit():
        return alias[:-1] + alias[-1].upper()
    return alias[0].upper() + alias[1:]


def _key_aliases(kind: int) -> list[str]:
    """List stored spellings of one Serato key type, Camelot first.

    Args:
        kind: Integer from :data:`library._KEY_VALUES`.

    Returns:
        Unique display names, sorted.
    """
    names = [_display_key(alias) for alias, value in library._KEY_VALUES.items() if value == kind]
    camelot = [name for name in names if name[-1] in "AB" and name[:-1].isdigit()]
    traditional = [name for name in names if name not in camelot]
    return sorted(camelot, key=lambda name: (len(name), name)) + sorted(traditional)


def _native_leaf(attribute: str, operation: str, value: object) -> dict[str, object] | None:
    """Build one Serato rule dict, or None when the leaf is not native.

    Args:
        attribute: Field name after the title alias.
        operation: Serato operation.
        value: STRING/UINT32 ``value`` or TIME ``partial_date``.

    Returns:
        A rule with ``type``, ``attribute``, ``operation``, ``version``,
        and ``value`` or ``partial_date``.
    """
    if attribute in STRING_ATTRS and operation in STRING_OPS and isinstance(value, str):
        return {
            "type": "STRING",
            "attribute": attribute,
            "operation": operation,
            "version": 1,
            "value": value,
        }
    if attribute in UINT32_ATTRS and operation in UINT32_OPS:
        number = _number(value)
        if number is None or number < 0 or not number.is_integer():
            return None
        return {
            "type": "UINT32",
            "attribute": attribute,
            "operation": operation,
            "version": 1,
            "value": int(number),
        }
    if attribute in TIME_ATTRS and operation in TIME_OPS:
        if isinstance(value, bool) or not isinstance(value, int):
            return None
        return {
            "type": "TIME",
            "attribute": attribute,
            "operation": operation,
            "version": 1,
            "partial_date": value,
        }
    return None


def _flatten_rules(preset: Mapping[str, object]) -> list[dict[str, object]] | None:
    """Collapse same-conjunction groups into one flat list.

    Args:
        preset: A ``rules`` preset from :func:`smart_presets.normalize`.

    Returns:
        Native rule dicts, or None when a group uses a different
        conjunction, nests deeper, or a leaf is not native.
    """
    parent = str(preset.get("conjunction") or "")
    if parent not in CONJUNCTIONS:
        return None
    flat: list[dict[str, object]] = []
    raw_rules = preset.get("rules")
    if not isinstance(raw_rules, list) or not raw_rules:
        return None
    for item in raw_rules:
        if not isinstance(item, Mapping):
            return None
        if "conjunction" in item:
            child = str(item.get("conjunction") or "")
            nested = item.get("rules")
            if child != parent or not isinstance(nested, list) or not nested:
                return None
            for leaf in nested:
                if not isinstance(leaf, Mapping) or "conjunction" in leaf:
                    return None
                compiled = _leaf_from_preset(leaf)
                if compiled is None:
                    return None
                flat.append(compiled)
            continue
        compiled = _leaf_from_preset(item)
        if compiled is None:
            return None
        flat.append(compiled)
    return flat or None


def _leaf_from_preset(leaf: Mapping[str, object]) -> dict[str, object] | None:
    """Compile one preset leaf to a native rule.

    Args:
        leaf: ``attribute``, ``operation``, and ``value`` or ``partial_date``.

    Returns:
        The native rule, or None.
    """
    attribute = str(leaf.get("attribute") or "")
    if attribute == TITLE_ALIAS:
        attribute = "name"
    operation = str(leaf.get("operation") or "")
    if "partial_date" in leaf:
        return _native_leaf(attribute, operation, leaf.get("partial_date"))
    return _native_leaf(attribute, operation, leaf.get("value"))


def _harmonic_rules(key: str) -> list[dict[str, object]]:
    """STRING key IS for every spelling of the same, relative, and adjacent keys.

    Args:
        key: Anchor key from the harmonic preset.

    Returns:
        Native STRING rules, Camelot then traditional, in Camelot order.
    """
    kinds: list[int] = []
    seen: set[int] = set()
    for alias, kind in library._KEY_VALUES.items():
        if kind in seen:
            continue
        if related.key_relation(key, alias) is None:
            continue
        seen.add(kind)
        kinds.append(kind)
    kinds.sort()
    rules: list[dict[str, object]] = []
    for kind in kinds:
        for name in _key_aliases(kind):
            compiled = _native_leaf("key", "IS", name)
            if compiled is not None:
                rules.append(compiled)
    return rules


def _bpm_rules(bpm: float, spread: float) -> list[dict[str, object]]:
    """UINT32 BPM ≥ floor(bpm − range) and ≤ ceil(bpm + range).

    Args:
        bpm: Centre tempo.
        spread: Inclusive plus-or-minus.

    Returns:
        Two native UINT32 rules.
    """
    low = max(0, int(math.floor(bpm - spread)))
    high = int(math.ceil(bpm + spread))
    low_rule = _native_leaf("bpm", "GREATER_THAN_OR_EQUAL_TO", low)
    high_rule = _native_leaf("bpm", "LESS_THAN_OR_EQUAL_TO", high)
    assert low_rule is not None and high_rule is not None
    return [low_rule, high_rule]


def _blob(space: str, conjunction: str, rules: Sequence[Mapping[str, object]]) -> dict[str, object]:
    """Wrap native rules in the live Serato JSON envelope.

    Args:
        space: Space name stored in ``spaces``.
        conjunction: ``AND`` or ``OR``.
        rules: Compiled leaves.

    Returns:
        The object written to ``smart_crate_rules.rules``.
    """
    return {
        "spaces": [space],
        "conjunction": conjunction,
        "live_updates": True,
        "rules": [dict(rule) for rule in rules],
    }


def to_native(preset: Mapping[str, object], space: str) -> dict[str, object] | None:
    """Compile a preset to Serato smart-crate JSON when the flat model fits.

    Args:
        preset: A preset from :func:`smart_presets.normalize`.
        space: Space name stored on the rules blob.

    Returns:
        The rules object, or None when the preset needs a ``⟳`` crate.
    """
    if preset.get("crate") is not None:
        return None
    kind = preset.get("kind")
    if kind == "harmonic":
        rules = _harmonic_rules(str(preset["key"]))
        return _blob(space, "OR", rules) if rules else None
    if kind == "bpm":
        return _blob(space, "AND", _bpm_rules(float(preset["bpm"]), float(preset["range"])))  # type: ignore[arg-type]
    if kind == "rules":
        flat = _flatten_rules(preset)
        if flat is None:
            return None
        return _blob(space, str(preset["conjunction"]), flat)
    return None


def fits_native(preset: Mapping[str, object]) -> bool:
    """Return whether a preset can be a live Serato smart crate.

    Args:
        preset: A preset from :func:`smart_presets.normalize`.

    Returns:
        True when :func:`to_native` would return a blob.
    """
    return to_native(preset, library.LIBRARY_SPACE) is not None


def _ymd(stamp: object) -> int | None:
    """Calendar day of a Unix timestamp as YYYYMMDD in local time.

    Args:
        stamp: ``asset.time_added``.

    Returns:
        The packed date, or None when stamp is missing.
    """
    number = _number(stamp)
    if number is None:
        return None
    local = time.localtime(int(number))
    return local.tm_year * 10000 + local.tm_mon * 100 + local.tm_mday


def _string_match(haystack: object, needle: object, operation: str) -> bool:
    """Compare two texts the way Serato STRING rules do.

    Args:
        haystack: Stored field.
        needle: Rule value.
        operation: STRING operation.

    Returns:
        True when the row matches.
    """
    left = library.serato_str_norm(haystack) or ""
    right = library.serato_str_norm(needle) or ""
    if operation == "IS":
        return left == right
    if operation == "IS_NOT":
        return left != right
    if operation == "CONTAINS":
        return right in left
    if operation == "DOES_NOT_CONTAIN":
        return right not in left
    return False


def _uint_match(stored: object, bound: object, operation: str, attribute: str) -> bool:
    """Compare a UINT32 rule to a stored number.

    BPM keeps the float so 120 ±3 still includes 117.0. Other UINT32
    fields compare as integers.

    Args:
        stored: Asset column.
        bound: Rule value.
        operation: UINT32 operation.
        attribute: Field name.

    Returns:
        True when the row matches.
    """
    number = _number(stored)
    limit = _number(bound)
    if number is None or limit is None:
        return False
    if attribute == "bpm":
        if number <= 0:
            return False
        if operation == "GREATER_THAN_OR_EQUAL_TO":
            return number >= limit
        if operation == "LESS_THAN_OR_EQUAL_TO":
            return number <= limit
        return False
    whole = int(number)
    edge = int(limit)
    if operation == "GREATER_THAN_OR_EQUAL_TO":
        return whole >= edge
    if operation == "LESS_THAN_OR_EQUAL_TO":
        return whole <= edge
    return False


def _time_match(stored: object, partial_date: object, operation: str) -> bool:
    """Compare ``time_added`` to a YYYYMMDD partial date.

    Args:
        stored: Unix timestamp.
        partial_date: Packed date.
        operation: ``AFTER`` or ``BEFORE``.

    Returns:
        True when the row matches.
    """
    day = _ymd(stored)
    if day is None or isinstance(partial_date, bool) or not isinstance(partial_date, int):
        return False
    if operation == "AFTER":
        return day > partial_date
    if operation == "BEFORE":
        return day < partial_date
    return False


def leaf_matches(row: Mapping[str, object], rule: Mapping[str, object]) -> bool:
    """Evaluate one native or preset leaf against an asset row.

    Args:
        row: Asset fields keyed by attribute name.
        rule: A native rule or a preset leaf.

    Returns:
        True when the row matches that leaf.
    """
    attribute = str(rule.get("attribute") or "")
    if attribute == TITLE_ALIAS:
        attribute = "name"
    operation = str(rule.get("operation") or "")
    if attribute in STRING_ATTRS:
        return _string_match(row.get(attribute), rule.get("value"), operation)
    if attribute in UINT32_ATTRS:
        return _uint_match(row.get(attribute), rule.get("value"), operation, attribute)
    if attribute in TIME_ATTRS:
        return _time_match(row.get(attribute), rule.get("partial_date"), operation)
    return False


def tree_matches(row: Mapping[str, object], conjunction: str, rules: Sequence[object]) -> bool:
    """Evaluate a (possibly nested) rule tree against one asset.

    Args:
        row: Asset fields.
        conjunction: ``AND`` or ``OR``.
        rules: Leaves and groups.

    Returns:
        True when the row matches the tree. An empty list is a miss.
    """
    if not rules:
        return False
    hits: list[bool] = []
    for item in rules:
        if not isinstance(item, Mapping):
            return False
        if "conjunction" in item and "attribute" not in item:
            child_rules = item.get("rules")
            if not isinstance(child_rules, list):
                return False
            hits.append(tree_matches(row, str(item.get("conjunction") or ""), child_rules))
            continue
        hits.append(leaf_matches(row, item))
    if conjunction == "OR":
        return any(hits)
    return all(hits)


def _row_fields(row: sqlite3.Row) -> dict[str, object]:
    """Map an asset SELECT row to attribute names.

    Args:
        row: Columns from :data:`_ASSET_SQL`.

    Returns:
        Fields keyed the way native rules name them.
    """
    return {
        "id": row[0],
        "name": row[1],
        "artist": row[2],
        "album": row[3],
        "genre": row[4],
        "comments": row[5],
        "key": row[6],
        "bpm": row[7],
        "type": row[8],
        "time_added": row[9],
        "stems_analyze_state": row[10],
    }


def asset_ids(conn: sqlite3.Connection, space: str, rules: Mapping[str, object]) -> list[int]:
    """Find tracks a native smart-crate blob would match.

    Args:
        conn: Open connection. Only SELECT statements run.
        space: Space name. The blob's ``spaces`` list is ignored so a
            crate in this space still lists its matches here.
        rules: Parsed ``smart_crate_rules.rules`` JSON.

    Returns:
        Asset ids in title, artist, id order.
    """
    conjunction = str(rules.get("conjunction") or "AND")
    raw = rules.get("rules")
    if not isinstance(raw, list):
        return []
    found: list[int] = []
    for row in conn.execute(_ASSET_SQL, (space,)):
        fields = _row_fields(row)
        if tree_matches(fields, conjunction, raw):
            found.append(int(cast(int, fields["id"])))
    return found


def parse_rules(blob: object) -> dict[str, object] | None:
    """Read stored smart-crate JSON.

    Args:
        blob: Text, bytes, or an already-parsed dict.

    Returns:
        The rules object, or None when it has no rules list.
    """
    parsed: object = blob
    if isinstance(parsed, (bytes, bytearray)):
        parsed = parsed.decode("utf-8")
    if isinstance(parsed, str):
        try:
            import json

            parsed = json.loads(parsed)
        except ValueError:
            return None
    if not isinstance(parsed, dict) or not isinstance(parsed.get("rules"), list):
        return None
    return cast(dict[str, object], parsed)


def normalize_leaf(raw: object) -> dict[str, object]:
    """Check one custom-rule leaf.

    Args:
        raw: JSON object with ``attribute``, ``operation``, and a value.

    Returns:
        The cleaned leaf.

    Raises:
        LibraryError: If the leaf is incomplete or not a native predicate.
    """
    if not isinstance(raw, Mapping):
        raise LibraryError(BAD_RULES)
    attribute = raw.get("attribute")
    if attribute == TITLE_ALIAS:
        attribute = "name"
    if not isinstance(attribute, str):
        raise LibraryError(BAD_RULES)
    operation = raw.get("operation")
    if not isinstance(operation, str):
        raise LibraryError(BAD_RULES)
    if attribute in STRING_ATTRS:
        value = raw.get("value")
        if operation not in STRING_OPS or not isinstance(value, str) or not value.strip():
            raise LibraryError(BAD_RULES)
        return {"attribute": attribute, "operation": operation, "value": value.strip()}
    if attribute in UINT32_ATTRS:
        number = _number(raw.get("value"))
        if operation not in UINT32_OPS or number is None or number < 0 or not number.is_integer():
            raise LibraryError(BAD_RULES)
        return {"attribute": attribute, "operation": operation, "value": int(number)}
    if attribute in TIME_ATTRS:
        date = raw.get("partial_date")
        if operation not in TIME_OPS or isinstance(date, bool) or not isinstance(date, int):
            raise LibraryError(BAD_RULES)
        if not 19000101 <= date <= 21001231:
            raise LibraryError(BAD_RULES)
        return {"attribute": attribute, "operation": operation, "partial_date": date}
    raise LibraryError(BAD_RULES)


def normalize_tree(raw: object, depth: int = 0) -> dict[str, object]:
    """Check a custom-rule tree: one extra group level, native leaves only.

    Args:
        raw: JSON object with ``conjunction`` and ``rules``.
        depth: 0 at the preset root. Groups are depth 1.

    Returns:
        The cleaned tree without ``kind``.

    Raises:
        LibraryError: If the tree is empty, too deep, or a leaf is bad.
    """
    if not isinstance(raw, Mapping):
        raise LibraryError(BAD_RULES)
    conjunction = raw.get("conjunction", "AND")
    if conjunction not in CONJUNCTIONS:
        raise LibraryError(BAD_RULES)
    rules = raw.get("rules")
    if not isinstance(rules, list) or not rules or len(rules) > MAX_RULES:
        raise LibraryError(BAD_RULES)
    cleaned: list[dict[str, object]] = []
    for item in rules:
        if isinstance(item, Mapping) and "conjunction" in item and "attribute" not in item:
            if depth >= 1:
                raise LibraryError(BAD_RULES)
            cleaned.append(normalize_tree(item, depth + 1))
            continue
        cleaned.append(normalize_leaf(item))
    return {"conjunction": conjunction, "rules": cleaned}
