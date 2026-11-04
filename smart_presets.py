"""DJ presets that the app evaluates and saves as a normal crate (part 1 of #26).

Serato smart crates take one flat list of rules over the whole library. They
cannot say "Camelot neighbours of 8A" or "BPM 124 plus or minus 3, only inside
crate Bar set". A preset here is evaluated by the app and saved as a normal
crate whose name ends in ``⟳``. Serato plays it like any crate. It goes stale
until it is refreshed, so the preset is remembered in ``preset-crates.json``
beside ``settings.json`` (never in the Serato folder), keyed by the library
file and the crate id.

Presets:

- ``harmonic``: tracks whose key is the chosen key, one Camelot step either
  side in the same letter, or the relative key (same number, other letter).
  This is ``related.key_relation``, the rule the related-track suggestions use.
- ``bpm``: tracks whose BPM is within ``range`` of ``bpm``.
- ``unplayed``: tracks with no played history entry in the last ``months``
  months, including tracks never played.

Each preset can be scoped to one crate and the crates nested under it.

``preview`` reads the library read-only. ``create`` and ``refresh`` go through
``safe_write.run`` like every other crate edit, so they are refused while
Serato is running, backed up first, and checked after the commit.
"""

from __future__ import annotations

import json
import os
import sqlite3
import tempfile
import time
from collections.abc import Mapping
from contextlib import closing
from pathlib import Path

import app_config
import library
import related
from library import LIBRARY_SPACE, LibraryError

STORE_NAME = "preset-crates.json"
SUFFIX = " ⟳"
MONTH_SECONDS = 30.44 * 24 * 3600

KINDS = ("harmonic", "bpm", "unplayed")
DEFAULT_BPM_RANGE = 3.0
MAX_BPM_RANGE = 50.0
MAX_MONTHS = 240
PREVIEW_LIMIT = 200

# Fixed sentences. error_codes maps the same text to a stable code.
UNKNOWN_PRESET = "That crate preset is not available."
BAD_KEY = "Choose a musical key for the harmonic preset."
BAD_BPM = "Choose a BPM above zero and a range of 0 to 50."
BAD_MONTHS = "Choose between 1 and 240 months."
NOT_A_PRESET_CRATE = "That crate was not made from a preset."
PRESET_CRATE_GONE = "That preset crate is no longer in the library."


def check_key(key: object) -> str:
    """Check the key of a harmonic preset.

    Args:
        key: A Camelot (``8A``) or traditional (``Am``) key name.

    Returns:
        The key text without surrounding spaces.

    Raises:
        LibraryError: If the key is empty or unknown.

    Example:
        >>> check_key(" 8A ")
        '8A'
    """
    if not isinstance(key, str) or related.camelot_code(key) is None:
        raise LibraryError(BAD_KEY)
    return key.strip()


def _number(value: object) -> float | None:
    """Read a JSON number, refusing booleans and text.

    Args:
        value: Value from the request.

    Returns:
        The float, or None when the value is not a finite number.
    """
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    if number != number or number in (float("inf"), float("-inf")):
        return None
    return number


def normalize(preset: object) -> dict[str, object]:
    """Check a preset and fill its defaults.

    Args:
        preset: JSON object with ``kind`` and that kind's fields, plus an
            optional ``crate`` id that limits the preset to that crate.

    Returns:
        A new dict holding only the fields the preset uses.

    Raises:
        LibraryError: If the kind is unknown or a field is out of range.

    Example:
        >>> normalize({"kind": "bpm", "bpm": 124})
        {'kind': 'bpm', 'bpm': 124.0, 'range': 3.0}
    """
    if not isinstance(preset, Mapping):
        raise LibraryError(UNKNOWN_PRESET)
    kind = preset.get("kind")
    if kind not in KINDS:
        raise LibraryError(UNKNOWN_PRESET)
    clean: dict[str, object] = {"kind": kind}
    if kind == "harmonic":
        clean["key"] = check_key(preset.get("key"))
    elif kind == "bpm":
        bpm = _number(preset.get("bpm"))
        spread = _number(preset.get("range", DEFAULT_BPM_RANGE))
        if bpm is None or bpm <= 0 or spread is None or not 0 <= spread <= MAX_BPM_RANGE:
            raise LibraryError(BAD_BPM)
        clean["bpm"] = bpm
        clean["range"] = spread
    else:
        months = preset.get("months", 12)
        if isinstance(months, bool) or not isinstance(months, int) or not 1 <= months <= MAX_MONTHS:
            raise LibraryError(BAD_MONTHS)
        clean["months"] = months
    crate = preset.get("crate")
    if crate is not None:
        if isinstance(crate, bool) or not isinstance(crate, int):
            raise LibraryError("That crate is not in this space.")
        clean["crate"] = crate
    return clean


def default_name(preset: Mapping[str, object]) -> str:
    """Name a preset crate when the page does not send a name.

    Args:
        preset: A preset from :func:`normalize`.

    Returns:
        A short English name ending in ``⟳``.

    Example:
        >>> default_name({"kind": "bpm", "bpm": 124.0, "range": 3.0})
        'BPM 124 ±3 ⟳'
    """
    kind = preset["kind"]
    if kind == "harmonic":
        label = f"Mixes with {preset['key']}"
    elif kind == "bpm":
        label = f"BPM {_trim(preset['bpm'])} ±{_trim(preset['range'])}"
    else:
        label = f"Not played in {preset['months']} months"
    return label + SUFFIX


def _trim(value: object) -> str:
    """Print a number without a trailing ``.0``.

    Args:
        value: A float or int.

    Returns:
        ``124`` for 124.0, ``2.5`` for 2.5.
    """
    number = float(value)  # type: ignore[arg-type]
    return str(int(number)) if number.is_integer() else f"{number:g}"


def matching_ids(
    conn: sqlite3.Connection,
    space: str,
    preset: Mapping[str, object],
    now: float | None = None,
) -> list[int]:
    """Find the tracks a preset selects.

    Args:
        conn: Open connection. Only SELECT statements run.
        space: Space name.
        preset: A preset from :func:`normalize`.
        now: Unix time used for ``unplayed``. None uses the clock.

    Returns:
        Asset ids in title, artist, id order. A scoped preset only looks at
        tracks in that crate and the crates nested under it.

    Raises:
        LibraryError: If the scope crate is not in the space.
    """
    params: list[object] = [space]
    sql = """
        SELECT a.id, a.key, a.bpm FROM asset a
        JOIN space_asset sa ON sa.asset_id = a.id
        JOIN space s ON s.id = sa.space_id
        WHERE s.name = ?
    """
    crate = preset.get("crate")
    if crate is not None:
        library.container_in_space(conn, int(crate), space)  # type: ignore[arg-type]
        ids = library.descendant_ids(conn, int(crate))  # type: ignore[arg-type]
        marks = ",".join("?" * len(ids))
        sql += f"""
          AND a.id IN (
            SELECT ca.asset_id FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            WHERE lc.container_id IN ({marks})
          )
        """
        params.extend(ids)
    sql += " ORDER BY a.name COLLATE NOCASE, a.artist COLLATE NOCASE, a.id"
    rows = conn.execute(sql, params).fetchall()
    kind = preset["kind"]
    if kind == "harmonic":
        anchor = str(preset["key"])
        return [
            int(row[0])
            for row in rows
            if isinstance(row[1], str) and related.key_relation(anchor, row[1]) is not None
        ]
    if kind == "bpm":
        target = float(preset["bpm"])  # type: ignore[arg-type]
        spread = float(preset["range"])  # type: ignore[arg-type]
        found: list[int] = []
        for row in rows:
            bpm = _number(row[2])
            if bpm is not None and bpm > 0 and abs(bpm - target) <= spread + 1e-9:
                found.append(int(row[0]))
        return found
    cutoff = (time.time() if now is None else now) - int(preset["months"]) * MONTH_SECONDS  # type: ignore[arg-type]
    recent = {
        int(row[0])
        for row in conn.execute(
            "SELECT DISTINCT asset_id FROM history_entry WHERE played AND start_time >= ? AND asset_id IS NOT NULL",
            (cutoff,),
        )
    }
    return [int(row[0]) for row in rows if int(row[0]) not in recent]


def _store_path() -> Path:
    """Return ``preset-crates.json`` beside ``settings.json``.

    Returns:
        The path. The file may not exist yet.
    """
    return app_config.config_dir() / STORE_NAME


def _library_key() -> str:
    """Key stored presets by the library file they belong to.

    Returns:
        The resolved path of ``library.MASTER``.
    """
    return str(Path(library.MASTER).resolve())


def _read_store() -> dict[str, dict[str, dict[str, object]]]:
    """Read every remembered preset crate.

    Returns:
        ``{library path: {crate id: record}}``. A missing or damaged file
        reads as empty, so a bad file never blocks the library.
    """
    try:
        data = json.loads(_store_path().read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    return {
        str(path): {str(cid): rec for cid, rec in crates.items() if isinstance(rec, dict)}
        for path, crates in data.items()
        if isinstance(crates, dict)
    }


def _write_store(data: Mapping[str, Mapping[str, object]]) -> None:
    """Replace ``preset-crates.json`` in one step.

    Args:
        data: The whole store.

    Writes a temporary file in the same folder and renames it over the old one.
    """
    path = _store_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temp = tempfile.mkstemp(prefix=".preset-crates-", suffix=".json", dir=path.parent)
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as out:
            json.dump(data, out, indent=2, sort_keys=True, ensure_ascii=False)
        os.replace(temp, path)
    except BaseException:
        Path(temp).unlink(missing_ok=True)
        raise


def remembered(crate_id: int) -> dict[str, object] | None:
    """Look up the preset saved for one crate of this library.

    Args:
        crate_id: Container id.

    Returns:
        ``{"space", "preset", "updated"}``, or None for a crate that was not
        made from a preset.
    """
    return _read_store().get(_library_key(), {}).get(str(crate_id))


def list_remembered() -> dict[str, dict[str, object]]:
    """List the preset crates of this library.

    Returns:
        ``{crate id: record}`` for ``library.MASTER``.
    """
    return dict(_read_store().get(_library_key(), {}))


def _remember(crate_id: int, record: Mapping[str, object] | None) -> None:
    """Save or forget the preset of one crate.

    Args:
        crate_id: Container id.
        record: The record to save, or None to forget it.
    """
    data: dict[str, dict[str, object]] = dict(_read_store())
    key = _library_key()
    crates = dict(data.get(key, {}))
    if record is None:
        crates.pop(str(crate_id), None)
    else:
        crates[str(crate_id)] = dict(record)
    if crates:
        data[key] = crates
    else:
        data.pop(key, None)
    _write_store(data)


def preview(space: str, preset: object) -> dict[str, object]:
    """Count the tracks a preset would put in a crate, without writing.

    Args:
        space: Space name.
        preset: Preset JSON.

    Returns:
        ``preset`` (normalized), ``name``, ``count``, and up to 200 ``ids``.

    Raises:
        LibraryError: If the preset is invalid or the library is missing.
    """
    clean = normalize(preset)
    with closing(library.read_conn()) as conn:
        ids = matching_ids(conn, space, clean)
    return {
        "ok": True,
        "preset": clean,
        "name": default_name(clean),
        "count": len(ids),
        "ids": ids[:PREVIEW_LIMIT],
    }


def _members(conn: sqlite3.Connection, crate_id: int) -> list[int]:
    """List the tracks in one crate (not its subcrates).

    Args:
        conn: Open connection.
        crate_id: Container id.

    Returns:
        Asset ids in crate order.
    """
    return [
        int(row[0])
        for row in conn.execute(
            """
            SELECT ca.asset_id FROM container_asset ca
            JOIN location_container lc ON lc.id = ca.location_container_id
            WHERE lc.container_id = ?
            ORDER BY ca.list_order, ca.id
            """,
            (crate_id,),
        )
    ]


def _expect_members(write: object, crate_id: int, wanted: tuple[int, ...]) -> None:
    """Register a check that the crate holds exactly ``wanted`` after the commit.

    Args:
        write: The ``safe_write.Session``.
        crate_id: Container id.
        wanted: Asset ids the crate must hold.
    """
    import safe_write

    def check(copied: sqlite3.Connection) -> None:
        """Fail when the saved crate differs from the preset result.

        Args:
            copied: Read-only connection to the temporary database copy.

        Raises:
            VerifyMismatch: If a track is missing or extra.
        """
        if sorted(_members(copied, crate_id)) != sorted(wanted):
            raise safe_write.VerifyMismatch("The preset crate does not hold the expected tracks.")

    write.check(check)  # type: ignore[attr-defined]


def create(space: str, preset: object, parent: int | None = None, name: str = "") -> dict[str, object]:
    """Save a preset's tracks as a new normal crate and remember the preset.

    Args:
        space: Space name.
        preset: Preset JSON.
        parent: Parent crate id, or None for the top level.
        name: Crate name. Empty uses :func:`default_name`. ``⟳`` is added
            when the name does not already end in it.

    Returns:
        ``id``, ``name``, ``added``, ``preset``, ``updated``, and ``warning``.

    Raises:
        LibraryError: If the preset is invalid or the crate cannot be made.
        SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    clean = normalize(preset)
    label = (name or "").strip() or default_name(clean)
    if not label.endswith(SUFFIX.strip()):
        label += SUFFIX

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Create the crate, add the matches, and register the check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict.
        """
        ids = matching_ids(conn, space, clean)
        created = library._create_crate(conn, space, parent, label, False, None)
        crate_id = created["id"]
        if not isinstance(crate_id, int):
            raise LibraryError("The crate could not be created.")
        for asset_id in ids:
            library._membership(conn, crate_id, asset_id, space, True)
        if isinstance(created.get("name"), str):
            write.set_target(str(created["name"]))
        _expect_members(write, crate_id, tuple(ids))
        return {
            "ok": True,
            "id": crate_id,
            "name": created["name"],
            "added": len(ids),
            "preset": clean,
            "warning": created.get("warning"),
        }

    result = safe_write.run("preset_create", label, apply)
    crate_id = int(result["id"])  # type: ignore[arg-type]
    updated = int(time.time())
    record: dict[str, object] = {"space": space, "preset": clean, "updated": updated}
    record.update(_identity(crate_id) or {})
    _remember(crate_id, record)
    result["updated"] = updated
    return result


def _identity(crate_id: int) -> dict[str, object] | None:
    """Read what tells this crate apart from a later crate given the same id.

    SQLite can hand a deleted crate's id to the next new crate. A refresh
    must never rewrite that other crate, so the stored name and the time the
    crate was added are remembered and compared.

    Args:
        crate_id: Container id.

    Returns:
        ``{"stored_name", "time_added", "type", "space"}``, or None when
        the crate is gone.
    """
    with closing(library.read_conn()) as conn:
        row = conn.execute(
            """
            SELECT c.name, c.time_added, c.type, s.name FROM container c
            JOIN space s ON s.id = c.space_id WHERE c.id = ?
            """,
            (crate_id,),
        ).fetchone()
    if row is None:
        return None
    return {"stored_name": row[0], "time_added": row[1], "type": row[2], "crate_space": row[3]}


def refresh(crate_id: int) -> dict[str, object]:
    """Bring a preset crate up to date with its preset.

    Tracks that no longer match are removed, new matches are added, and
    tracks that still match keep their place.

    Args:
        crate_id: Container id of a crate made by :func:`create`.

    Returns:
        ``id``, ``added``, ``removed``, ``count``, ``updated``, and ``warning``.

    Raises:
        LibraryError: If the crate was not made from a preset, or is gone.
            A crate that is gone is also forgotten.
        SeratoOpen: If Serato still has the library open.
    """
    import safe_write

    record = remembered(crate_id)
    if record is None:
        raise LibraryError(NOT_A_PRESET_CRATE, 404)
    space = str(record.get("space") or LIBRARY_SPACE)
    clean = normalize(record.get("preset"))
    found = _identity(crate_id)
    if (
        found is None
        or found["type"] != 1
        or found["crate_space"] != space
        or found["stored_name"] != record.get("stored_name")
        or found["time_added"] != record.get("time_added")
    ):
        _remember(crate_id, None)
        raise LibraryError(PRESET_CRATE_GONE, 404)

    def apply(conn: sqlite3.Connection, write: safe_write.Session) -> dict[str, object]:
        """Add new matches, drop old ones, and register the check.

        Args:
            conn: Open write connection.
            write: Session that records the expected rows.

        Returns:
            The result dict.
        """
        wanted = matching_ids(conn, space, clean)
        current = _members(conn, crate_id)
        keep = set(wanted)
        have = set(current)
        removed = [asset_id for asset_id in current if asset_id not in keep]
        added = [asset_id for asset_id in wanted if asset_id not in have]
        warning: object = None
        for asset_id in removed:
            warning = library._membership(conn, crate_id, asset_id, space, False).get("warning") or warning
        for asset_id in added:
            warning = library._membership(conn, crate_id, asset_id, space, True).get("warning") or warning
        _expect_members(write, crate_id, tuple(wanted))
        return {
            "ok": True,
            "id": crate_id,
            "added": len(added),
            "removed": len(removed),
            "count": len(wanted),
            "warning": warning,
        }

    result = safe_write.run("preset_refresh", str(display_name_of(record)), apply)
    updated = int(time.time())
    _remember(crate_id, {**record, "preset": clean, "updated": updated})
    result["updated"] = updated
    return result


def display_name_of(record: Mapping[str, object]) -> str:
    """Return the name the page shows for a remembered crate.

    Args:
        record: A stored preset record.

    Returns:
        The display name, or ``preset crate`` when none was stored.
    """
    stored = record.get("stored_name")
    return library.display_name(stored) if isinstance(stored, str) else "preset crate"


def action(payload: Mapping[str, object]) -> dict[str, object]:
    """Run one ``POST /api/smart-preset`` request.

    Args:
        payload: ``action`` is ``preview``, ``create``, ``refresh``, or
            ``list``. ``preview`` and ``create`` take ``space`` and ``preset``;
            ``create`` also takes ``parent`` and ``name``. ``refresh`` takes ``id``.

    Returns:
        That action's result.

    Raises:
        LibraryError: If the action or its fields are invalid.
    """
    kind = payload.get("action")
    space = payload.get("space") or LIBRARY_SPACE
    if not isinstance(space, str):
        raise LibraryError("That space is not available here.")
    if kind == "preview":
        return preview(space, payload.get("preset"))
    if kind == "create":
        parent = payload.get("parent")
        if parent is not None and (isinstance(parent, bool) or not isinstance(parent, int)):
            raise LibraryError("That crate is not in this space.")
        name = payload.get("name") or ""
        if not isinstance(name, str):
            raise LibraryError("That request is not valid.")
        return create(space, payload.get("preset"), parent, name)
    if kind == "refresh":
        crate_id = payload.get("id")
        if isinstance(crate_id, bool) or not isinstance(crate_id, int):
            raise LibraryError(NOT_A_PRESET_CRATE, 404)
        return refresh(crate_id)
    if kind == "list":
        return {"ok": True, "crates": list_remembered()}
    raise LibraryError("That action is not available.")
