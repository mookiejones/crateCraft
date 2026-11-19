"""Per-field protection for BPM, key, and cues.

The choice lives in ``protected-fields.json`` beside ``settings.json``.
It is not written into the Serato folder. Missing means every field can
change. A protected field that a save would change is left as it was
and named in the result.
"""

from __future__ import annotations

import json
from typing import Mapping

import app_config

STORE_NAME = "protected-fields.json"
NAMES = ("bpm", "key", "cues")


def load() -> dict[str, bool]:
    """Return the stored protection flags.

    Returns:
        ``bpm``, ``key``, and ``cues``. Missing or unreadable storage
        is all false.
    """
    flags = {name: False for name in NAMES}
    path = app_config.config_dir() / STORE_NAME
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return flags
    if not isinstance(raw, dict):
        return flags
    for name in NAMES:
        value = raw.get(name)
        if isinstance(value, bool):
            flags[name] = value
    return flags


def save(value: object) -> dict[str, bool]:
    """Store one or more protection flags.

    Args:
        value: Map of ``bpm``, ``key``, or ``cues`` to a boolean.

    Returns:
        The flags after the update.

    Raises:
        ValueError: If the map is empty, names an unknown field, or
            holds a non-boolean.
        OSError: If the file cannot be written.
    """
    if not isinstance(value, dict) or not value:
        raise ValueError("protected_fields needs bpm, key, or cues.")
    flags = load()
    for key, item in value.items():
        if key not in NAMES or not isinstance(item, bool):
            raise ValueError("protected_fields needs bpm, key, or cues.")
        flags[key] = item
    path = app_config.config_dir() / STORE_NAME
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(flags), encoding="utf-8")
    return flags


def overwrite_set(value: object) -> set[str]:
    """Return field names a caller is allowed to change this once.

    Args:
        value: A list of ``bpm``, ``key``, or ``cues``, or anything else.

    Returns:
        Known names from that list. An empty set when ``value`` is not
        a list.
    """
    if not isinstance(value, (list, tuple)):
        return set()
    return {item for item in value if isinstance(item, str) and item in NAMES}


def blocked(names: list[str], overwrite: object) -> list[str]:
    """Return protected names this write must not change.

    Args:
        names: Fields the write wants to change.
        overwrite: One-shot exceptions. See :func:`overwrite_set`.

    Returns:
        Protected names that are not in ``overwrite``, in ``names`` order.
    """
    flags = load()
    allowed = overwrite_set(overwrite)
    return [name for name in names if flags.get(name) and name not in allowed]


def same(left: object, right: object) -> bool:
    """Return whether two stored field values are the same.

    Args:
        left: Value already in the library.
        right: Value the save would write.

    Returns:
        True when both numbers match, or both texts match. Blank and
        None match.
    """
    if isinstance(left, (int, float)) or isinstance(right, (int, float)):
        if isinstance(left, bool) or isinstance(right, bool):
            return left == right
        try:
            return abs(float(left) - float(right)) < 1e-6  # type: ignore[arg-type]
        except (TypeError, ValueError):
            return False
    return str(left or "") == str(right or "")


def changed(before: Mapping[str, object], updates: Mapping[str, object], overwrite: object) -> list[str]:
    """Return protected fields ``updates`` would change.

    Args:
        before: Current ``bpm`` and ``key``.
        updates: Columns the save wants to write.
        overwrite: One-shot exceptions.

    Returns:
        Protected names whose new value differs from ``before``.
    """
    names = [name for name in ("bpm", "key") if name in updates]
    held = blocked(names, overwrite)
    return [name for name in held if not same(before.get(name), updates.get(name))]
