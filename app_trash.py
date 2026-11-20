"""App-owned trash for pruned snapshots and duplicate audio.

Items live under ``config_dir()/trash``, beside settings, never inside the
Serato library folder. A hold keeps the bytes for seven days. Restore puts
them back. Cancel stops the timed purge. Purge deletes only after the
window, and only when the caller confirms.

Snapshot folder moves are not inside ``safe_write``. That session always
opens ``master.sqlite``. Prune does not change the database. Duplicate
audio is held only after the merge's ``safe_write`` has committed. Audio
restore journals a no-op library write first (``library.gate_trash_restore``)
and moves the file after that session returns.

Hold does not check whether Serato is running. Confirm of prune, restore,
and purge does.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import secrets
import shutil
import threading
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from pathlib import Path

HOLD_DAYS = 7

TRASH_NOT_DUE = (
    "This item can still be restored. It is not removed until the window ends."
)
TRASH_CANCELLED = "Timed removal was cancelled. This item stays in the trash."
TRASH_OTHER_DJ = "Another DJ app still uses this file. It was not removed."
TRASH_MISSING = "That trash item could not be read."
TRASH_IN_PLACE = "That file is already in place. Nothing was restored."
TRASH_INSIDE = "The trash folder is inside the Serato library. Nothing was moved."
TRASH_PROTECTED = "That file is part of the Serato library. It was not restored."
TRASH_SHORTCUT = "That item is a shortcut. Nothing was moved."

_MESSAGE_CODES: dict[str, str] = {
    TRASH_NOT_DUE: "trash_not_due",
    TRASH_CANCELLED: "trash_cancelled",
    TRASH_OTHER_DJ: "trash_other_dj",
    TRASH_MISSING: "trash_missing",
    TRASH_IN_PLACE: "trash_in_place",
    TRASH_INSIDE: "trash_inside",
    TRASH_PROTECTED: "trash_protected",
    TRASH_SHORTCUT: "trash_shortcut",
}

_ID_RE_TEXT = r"^[0-9a-f]{32}$"
_HEX_RE_TEXT = r"^[0-9a-f]{64}$"
_LOCK = threading.RLock()
_STAGING_SUFFIX = ".cratecraft-restore"
_PROTECTED_NAMES = frozenset({"master.sqlite", "root.sqlite"})


def _error(message: str) -> Exception:
    """Build a library refusal for a fixed trash sentence.

    Args:
        message: English sentence mapped by ``error_codes``.

    Returns:
        A ``LibraryError``. The code is left unset so ``with_code`` maps it.
    """
    import library

    return library.LibraryError(message)


def _utc_now() -> datetime:
    """Return the current time in UTC.

    Returns:
        An aware datetime.
    """
    return datetime.now(timezone.utc)


def _moment(clock: Callable[[], datetime]) -> datetime:
    """Return an aware UTC time from a clock.

    Args:
        clock: Returns a datetime. A naive value is rejected.

    Returns:
        The same instant in UTC.

    Raises:
        ValueError: If the clock returns a naive datetime.
    """
    moment = clock()
    if moment.tzinfo is None or moment.tzinfo.utcoffset(moment) is None:
        raise ValueError("Trash timestamps need a timezone.")
    return moment.astimezone(timezone.utc)


def _stamp(moment: datetime) -> str:
    """Format an aware datetime as UTC with seconds.

    Args:
        moment: Aware datetime.

    Returns:
        An ISO timestamp ending in ``+00:00``.

    Raises:
        ValueError: If ``moment`` is naive.
    """
    if moment.tzinfo is None or moment.tzinfo.utcoffset(moment) is None:
        raise ValueError("Trash timestamps need a timezone.")
    return moment.astimezone(timezone.utc).replace(microsecond=0).isoformat()


def _parse_stamp(text: str) -> datetime:
    """Parse a stored UTC timestamp.

    Args:
        text: ISO timestamp written by :func:`_stamp`.

    Returns:
        An aware UTC datetime.

    Raises:
        ValueError: If the text is not an aware timestamp.
    """
    moment = datetime.fromisoformat(text)
    if moment.tzinfo is None or moment.tzinfo.utcoffset(moment) is None:
        raise ValueError("Trash timestamps need a timezone.")
    return moment.astimezone(timezone.utc)


def _days_left(now: datetime, purge_at: datetime, cancelled: bool) -> int:
    """Return whole days left in the restore window.

    Args:
        now: Current aware time.
        purge_at: When purge becomes allowed.
        cancelled: True when timed removal was cancelled.

    Returns:
        Zero when cancelled or due. Otherwise the ceiling of the remaining
        days. The instant of a hold is seven.
    """
    if cancelled:
        return 0
    remaining = (purge_at - now).total_seconds()
    if remaining <= 0:
        return 0
    return math.ceil(remaining / 86400)


def _label(now: datetime, purge_at: datetime, cancelled: bool) -> str:
    """Return the page label for one held item.

    Args:
        now: Current aware time.
        purge_at: When purge becomes allowed.
        cancelled: True when timed removal was cancelled.

    Returns:
        ``cancelled``, ``due``, or ``held``.
    """
    if cancelled:
        return "cancelled"
    if now >= purge_at:
        return "due"
    return "held"


def _display_name(name: str) -> str:
    """Return the last path segment, truncated to 200 characters.

    Args:
        name: Caller label or path.

    Returns:
        A name safe to show. It is not a filesystem path.

    Raises:
        LibraryError: If the segment is empty, ``.``, or ``..``.
    """
    if not isinstance(name, str) or "\x00" in name:
        raise _error(TRASH_MISSING)
    segment = name.replace("\\", "/").rstrip("/").split("/")[-1]
    if segment in {"", ".", ".."}:
        raise _error(TRASH_MISSING)
    return segment[:200]


def _file_sha256(path: Path) -> str:
    """Hash one regular file.

    Args:
        path: File to read.

    Returns:
        Lowercase SHA-256 hex.
    """
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _measure(path: Path, kind: str) -> tuple[str, int]:
    """Hash a file or a directory tree and return its size.

    A symlink anywhere in the tree is refused before the caller moves it.
    An empty directory hashes the SHA-256 of empty bytes.

    Args:
        path: File or directory.
        kind: ``audio`` or ``snapshot``.

    Returns:
        Hex digest and total file size in bytes.

    Raises:
        LibraryError: If the path is a shortcut or is not the expected kind.
    """
    if path.is_symlink():
        raise _error(TRASH_SHORTCUT)
    if kind == "audio":
        if not path.is_file():
            raise _error(TRASH_MISSING)
        return _file_sha256(path), path.stat().st_size
    if not path.is_dir():
        raise _error(TRASH_MISSING)
    lines: list[bytes] = []
    size = 0
    children = sorted(path.rglob("*"), key=lambda item: item.relative_to(path).as_posix())
    for child in children:
        if child.is_symlink():
            raise _error(TRASH_SHORTCUT)
        if child.is_dir():
            continue
        if not child.is_file():
            raise _error(TRASH_SHORTCUT)
        rel = child.relative_to(path).as_posix()
        digest = _file_sha256(child)
        size += child.stat().st_size
        lines.append(rel.encode("utf-8") + b"\0" + digest.encode("ascii") + b"\n")
    return hashlib.sha256(b"".join(lines)).hexdigest(), size


def _logical(path: Path) -> Path:
    """Resolve a path that might not exist yet.

    The deepest existing parent is resolved. Missing names are appended
    after that, so the inside-library check can run before ``mkdir``.

    Args:
        path: Absolute or relative path.

    Returns:
        A path with existing parents resolved.

    Raises:
        LibraryError: If a missing segment is ``.`` or ``..``.
    """
    current = Path(path)
    missing: list[str] = []
    while not current.exists():
        parent = current.parent
        if parent == current:
            break
        if current.name in {"", ".", ".."}:
            raise _error(TRASH_MISSING)
        missing.append(current.name)
        current = parent
    try:
        resolved = current.resolve()
    except OSError as exc:
        raise _error(TRASH_MISSING) from exc
    for name in reversed(missing):
        resolved = resolved / name
    return resolved


def _refuse_symlink_chain(path: Path) -> None:
    """Refuse when the path or an existing parent is a symlink.

    Args:
        path: Candidate root. Missing leaf names are walked past.

    Raises:
        LibraryError: If a symlink is on the chain.
    """
    current = Path(path)
    while True:
        if current.is_symlink():
            raise _error(TRASH_SHORTCUT)
        parent = current.parent
        if current.exists() or parent == current:
            break
        current = parent


def _id_ok(value: object) -> bool:
    """Return whether a value is a trash item id.

    Args:
        value: Candidate id.

    Returns:
        True for 32 lowercase hex characters.
    """
    import re

    return isinstance(value, str) and re.fullmatch(_ID_RE_TEXT, value) is not None


def _digest_ok(value: object) -> bool:
    """Return whether a value is a SHA-256 hex digest.

    Args:
        value: Candidate digest.

    Returns:
        True for 64 lowercase hex characters.
    """
    import re

    return isinstance(value, str) and re.fullmatch(_HEX_RE_TEXT, value) is not None


def _expected_rel(item_id: str, kind: str) -> str:
    """Return the only blob path stored for an item.

    Args:
        item_id: Trash id.
        kind: ``audio`` or ``snapshot``.

    Returns:
        ``items/<id>/blob`` or ``items/<id>/tree``.
    """
    leaf = "blob" if kind == "audio" else "tree"
    return f"items/{item_id}/{leaf}"


def _parse_item(key: object, value: object) -> dict[str, object] | None:
    """Return a stored item, or None when the record is not usable.

    Args:
        key: Index key.
        value: JSON object.

    Returns:
        A normalized record. None drops the row from the public list.
    """
    if not _id_ok(key) or not isinstance(value, dict):
        return None
    if value.get("id") != key:
        return None
    kind = value.get("kind")
    if kind not in {"audio", "snapshot"}:
        return None
    name = value.get("name")
    original = value.get("original")
    rel = value.get("rel")
    digest = value.get("sha256")
    status = value.get("status")
    held_at = value.get("held_at")
    purge_at = value.get("purge_at")
    cancelled = value.get("purge_cancelled")
    size = value.get("size")
    if not isinstance(name, str) or not name or "/" in name or "\\" in name or name in {".", ".."}:
        return None
    if not isinstance(original, str) or not original or "\x00" in original:
        return None
    if kind not in {"audio", "snapshot"} or not isinstance(kind, str):
        return None
    if rel != _expected_rel(key, kind):
        return None
    if not _digest_ok(digest) or not isinstance(digest, str):
        return None
    if status not in {"held", "restored", "purged"}:
        return None
    if not isinstance(held_at, str) or not isinstance(purge_at, str):
        return None
    if not isinstance(cancelled, bool):
        return None
    if isinstance(size, bool) or not isinstance(size, int) or size < 0:
        return None
    try:
        _parse_stamp(held_at)
        _parse_stamp(purge_at)
    except ValueError:
        return None
    return {
        "id": key,
        "kind": kind,
        "name": name,
        "original": original,
        "rel": rel,
        "sha256": digest,
        "size": size,
        "held_at": held_at,
        "purge_at": purge_at,
        "purge_cancelled": cancelled,
        "status": status,
    }


def _code_for(exc: Exception) -> str:
    """Return the catalog code for a trash refusal.

    Args:
        exc: Error raised by this module or by the copy-count gate.

    Returns:
        A code. An unknown sentence returns an empty string. A
        ``LibraryError`` that already stored a code keeps that code.
    """
    code = getattr(exc, "code", None)
    if isinstance(code, str) and code:
        return code
    return _MESSAGE_CODES.get(str(exc), "")


def _refuse_serato() -> None:
    """Refuse a confirm while Serato DJ is running.

    Raises:
        SnapshotBlocked: When ``serato_dj_running`` is true.
    """
    import snapshots

    if snapshots.serato_dj_running():
        raise snapshots.SnapshotBlocked(snapshots.SERATO_RUNNING_MESSAGE)


def _audio_protected(dest: Path, library_dir: Path) -> bool:
    """Return whether an audio restore would land in the library folder.

    Args:
        dest: Path the file would return to.
        library_dir: Parent of ``master.sqlite``.

    Returns:
        True for ``master.sqlite``, ``root.sqlite``, or any path inside
        the library folder. Snapshot restores do not call this.
    """
    if dest.name in _PROTECTED_NAMES:
        return True
    resolved = dest.resolve()
    library = _logical(library_dir)
    return resolved == library or library in resolved.parents


def _remove_path(path: Path) -> None:
    """Delete a file or directory this module created.

    Args:
        path: Staging file, blob, or copied tree.

    Raises:
        OSError: If the path is still there.
    """
    if path.is_symlink() or path.is_file():
        path.unlink()
        return
    if path.is_dir():
        shutil.rmtree(path)


class AppTrash:
    """One trash directory beside the crateCraft settings folder."""

    def __init__(
        self,
        root: Path | None = None,
        now: Callable[[], datetime] | None = None,
    ) -> None:
        """Open the trash at ``root`` or at ``config_dir()/trash``.

        Creating this object does not create the directory.

        Args:
            root: Trash directory. None uses the settings folder.
            now: Clock. None uses the current UTC time. Naive values are
                rejected when a timestamp is written.
        """
        if root is None:
            import app_config

            root = app_config.config_dir() / "trash"
        self.root = Path(root)
        self._now = now or _utc_now

    def hold_file(self, path: Path, *, name: str, library_dir: Path) -> dict[str, object]:
        """Move one audio file into the trash.

        Args:
            path: File to hold. A symlink is refused and left in place.
            name: Display name. Only the last segment is stored.
            library_dir: Parent of ``master.sqlite``. The trash root must
                not resolve inside this folder.

        Returns:
            ``id``, ``kind``, and ``name``. The original path is not included.

        Raises:
            LibraryError: If the file cannot be held. The source stays put
                when the move has not started, and is moved back when the
                index cannot be saved.
        """
        return self._hold(Path(path), kind="audio", name=name, library_dir=library_dir)

    def hold_tree(self, path: Path, *, name: str, library_dir: Path) -> dict[str, object]:
        """Move one snapshot directory into the trash.

        Args:
            path: Directory to hold.
            name: Display name, usually the snapshot id.
            library_dir: Parent of ``master.sqlite``.

        Returns:
            ``id``, ``kind``, and ``name``.

        Raises:
            LibraryError: If the directory cannot be held.
        """
        return self._hold(Path(path), kind="snapshot", name=name, library_dir=library_dir)

    def list_public(self) -> list[dict[str, object]]:
        """Return held items without filesystem paths.

        A missing trash directory returns an empty list and is not created.

        Returns:
            Held rows sorted by ``held_at`` then id.

        Raises:
            LibraryError: If the trash root or the index is a symlink.
        """
        with _LOCK:
            if not self.root.exists():
                return []
            if self.root.is_symlink():
                raise _error(TRASH_SHORTCUT)
            rows = [
                self._public(record)
                for record in self._read_items().values()
                if record["status"] == "held"
            ]
            rows.sort(key=lambda row: (str(row["held_at"]), str(row["id"])))
            return rows

    def public_item(self, item_id: str) -> dict[str, object]:
        """Return one held item without its original path.

        Args:
            item_id: Trash id.

        Returns:
            The public row.

        Raises:
            LibraryError: If the id is unknown, not held, or not a trash id.
                The message does not include the id.
        """
        with _LOCK:
            return self._public(self._require_held(item_id))

    def restore(
        self,
        item_id: str,
        *,
        confirm: bool,
        library_dir: Path,
    ) -> dict[str, object]:
        """Preview or put one item back at its original path.

        Preview does not move bytes and does not check Serato. Confirm
        refuses while Serato is running, then copies, checks the hash, and
        only then removes the blob.

        Args:
            item_id: Trash id.
            confirm: True moves the bytes.
            library_dir: Parent of ``master.sqlite``. Audio inside that
                folder is refused. A snapshot may return there.

        Returns:
            ``ok`` and the public item. Preview also sets ``preview`` true.

        Raises:
            LibraryError: If the item cannot be restored.
            SnapshotBlocked: If confirm runs while Serato is open.
        """
        with _LOCK:
            record = self._require_held(item_id)
            if not confirm:
                return {"ok": True, "preview": True, "item": self._public(record)}
            _refuse_serato()
            self._restore_bytes(record, library_dir)
            record["status"] = "restored"
            self._put(record)
            return {"ok": True, "item": self._public(record)}

    def cancel(self, item_id: str) -> dict[str, object]:
        """Stop the timed purge and keep the item.

        A second cancel of the same held item succeeds. Serato may be open.

        Args:
            item_id: Trash id.

        Returns:
            ``ok`` true and the public item. ``label`` is ``cancelled``.

        Raises:
            LibraryError: If the item is missing or not held.
        """
        with _LOCK:
            record = self._require_held(item_id)
            record["purge_cancelled"] = True
            self._put(record)
            return {"ok": True, "item": self._public(record)}

    def purge(
        self,
        item_id: str,
        *,
        confirm: bool,
        library_dir: Path,
    ) -> dict[str, object]:
        """Preview or delete one item after its restore window.

        Preview runs the same refusals and does not delete. Confirm refuses
        while Serato is running. Audio is refused when another DJ app still
        uses the original path, and when the verified-copy gate refuses.
        A snapshot purge does not call the snapshot copy-count gate again.

        Args:
            item_id: Trash id.
            confirm: True deletes after the checks.
            library_dir: Accepted so callers share the restore signature.
                Purge does not write into this folder.

        Returns:
            Preview or ``ok`` true. A refused preview has ``ok`` false,
            ``error``, and ``code``.

        Raises:
            LibraryError: On confirm when the item must stay, or when the
                blob is missing. A missing blob is not marked purged.
            SnapshotBlocked: If confirm runs while Serato is open.
        """
        del library_dir
        with _LOCK:
            record = self._require_held(item_id)
            if confirm:
                _refuse_serato()
            refusal = self._purge_refusal(record)
            if refusal is not None:
                if not confirm:
                    body: dict[str, object] = {
                        "ok": False,
                        "preview": True,
                        "error": str(refusal),
                        "item": self._public(record),
                    }
                    code = _code_for(refusal)
                    if code:
                        body["code"] = code
                    return body
                raise refusal
            self._require_blob(record)
            if not confirm:
                return {"ok": True, "preview": True, "item": self._public(record)}
            self._delete_blob(record)
            record["status"] = "purged"
            self._put(record)
            return {"ok": True, "item": self._public(record)}

    def undo(self, item_id: str) -> dict[str, object]:
        """Hold a restored item again under the same id.

        The bytes at the original path must still match the stored hash.
        The new window is seven days and timed removal is not cancelled.

        Args:
            item_id: Trash id.

        Returns:
            ``ok`` true and the public item.

        Raises:
            LibraryError: If the item is not restored, the bytes changed,
                or the file is gone. Nothing is moved in those cases.
        """
        with _LOCK:
            record = self._require(item_id)
            if record["status"] != "restored":
                raise _error(TRASH_MISSING)
            original = Path(str(record["original"]))
            kind = str(record["kind"])
            if original.is_symlink():
                raise _error(TRASH_SHORTCUT)
            try:
                digest, size = _measure(original, kind)
            except Exception as exc:
                if str(exc) == TRASH_SHORTCUT:
                    raise
                raise _error(TRASH_MISSING) from exc
            if digest != record["sha256"]:
                raise _error(TRASH_MISSING)
            blob = self._blob(record)
            if blob.exists() or blob.is_symlink():
                raise _error(TRASH_MISSING)
            blob.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(original), str(blob))
            try:
                check, _size = _measure(blob, kind)
                if check != digest:
                    raise _error(TRASH_MISSING)
                now = _moment(self._now)
                record["status"] = "held"
                record["purge_cancelled"] = False
                record["held_at"] = _stamp(now)
                record["purge_at"] = _stamp(now + timedelta(days=HOLD_DAYS))
                record["size"] = size
                self._put(record)
            except Exception:
                if not original.exists() and blob.exists():
                    shutil.move(str(blob), str(original))
                raise
            return {"ok": True, "item": self._public(record)}

    def _hold(
        self,
        source: Path,
        *,
        kind: str,
        name: str,
        library_dir: Path,
    ) -> dict[str, object]:
        """Move ``source`` into a new item directory and index it.

        Args:
            source: File or directory.
            kind: ``audio`` or ``snapshot``.
            name: Display name.
            library_dir: Library folder the trash must sit outside.

        Returns:
            ``id``, ``kind``, and ``name``.

        Raises:
            LibraryError: If the hold is refused or cannot be finished.
        """
        with _LOCK:
            if source.is_symlink():
                raise _error(TRASH_SHORTCUT)
            label = _display_name(name)
            self._refuse_placement(library_dir)
            digest, size = _measure(source, kind)
            original = str(source.resolve())
            item_id = self._new_id()
            rel = _expected_rel(item_id, kind)
            self._mkdir_root()
            blob = self.root / rel
            blob.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(source), str(blob))
            try:
                check, measured = _measure(blob, kind)
                if check != digest:
                    raise _error(TRASH_MISSING)
                now = _moment(self._now)
                record: dict[str, object] = {
                    "id": item_id,
                    "kind": kind,
                    "name": label,
                    "original": original,
                    "rel": rel,
                    "sha256": digest,
                    "size": measured,
                    "held_at": _stamp(now),
                    "purge_at": _stamp(now + timedelta(days=HOLD_DAYS)),
                    "purge_cancelled": False,
                    "status": "held",
                }
                self._put(record)
            except Exception:
                if not source.exists() and blob.exists():
                    shutil.move(str(blob), str(source))
                raise
            return {"id": item_id, "kind": kind, "name": label, "size": size}

    def _refuse_placement(self, library_dir: Path) -> None:
        """Refuse a symlink root or a root inside the library folder.

        The directory is not created.

        Args:
            library_dir: Parent of ``master.sqlite``.

        Raises:
            LibraryError: If the trash cannot be used.
        """
        _refuse_symlink_chain(self.root)
        root = _logical(self.root)
        library = _logical(library_dir)
        if root == library or library in root.parents:
            raise _error(TRASH_INSIDE)

    def _mkdir_root(self) -> None:
        """Create the trash directory after the placement checks.

        Raises:
            LibraryError: If the root is a symlink or not a directory.
        """
        _refuse_symlink_chain(self.root)
        self.root.mkdir(parents=True, exist_ok=True)
        if self.root.is_symlink() or not self.root.is_dir():
            raise _error(TRASH_SHORTCUT)

    def _new_id(self) -> str:
        """Return an unused item id.

        Returns:
            32 lowercase hex characters.
        """
        taken = set(self._read_items())
        for _ in range(8):
            item_id = secrets.token_hex(16)
            if item_id not in taken:
                return item_id
        raise _error(TRASH_MISSING)

    def _index_path(self) -> Path:
        """Return the index path.

        Returns:
            ``index.json`` inside the trash root.
        """
        return self.root / "index.json"

    def _read_items(self) -> dict[str, dict[str, object]]:
        """Load the index without creating it.

        Returns:
            Item id to record. A missing index is empty.

        Raises:
            LibraryError: If the index is a symlink or not JSON.
        """
        if not self.root.exists():
            return {}
        if self.root.is_symlink():
            raise _error(TRASH_SHORTCUT)
        index = self._index_path()
        if not index.exists():
            return {}
        if index.is_symlink() or not index.is_file():
            raise _error(TRASH_SHORTCUT)
        try:
            payload = json.loads(index.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise _error(TRASH_MISSING) from exc
        if not isinstance(payload, dict):
            raise _error(TRASH_MISSING)
        raw = payload.get("items")
        if not isinstance(raw, dict):
            return {}
        items: dict[str, dict[str, object]] = {}
        for key, value in raw.items():
            parsed = _parse_item(key, value)
            if parsed is not None:
                items[str(key)] = parsed
        return items

    def _write_items(self, items: dict[str, dict[str, object]]) -> None:
        """Replace the index atomically.

        Args:
            items: Full item map.

        Raises:
            LibraryError: If the index cannot be replaced.
        """
        if self.root.is_symlink():
            raise _error(TRASH_SHORTCUT)
        index = self._index_path()
        if index.is_symlink():
            raise _error(TRASH_SHORTCUT)
        payload = {"version": 1, "items": items}
        tmp = self.root / f".index-{os.getpid()}-{secrets.token_hex(4)}.tmp"
        try:
            tmp.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            os.replace(tmp, index)
        except OSError as exc:
            raise _error(TRASH_MISSING) from exc
        finally:
            if tmp.exists():
                try:
                    tmp.unlink()
                except OSError:
                    pass

    def _put(self, record: dict[str, object]) -> None:
        """Insert or replace one item in the index.

        Args:
            record: Normalized item including ``original``.

        Raises:
            LibraryError: If the index cannot be saved.
        """
        items = self._read_items()
        item_id = str(record["id"])
        items[item_id] = dict(record)
        self._write_items(items)

    def _require(self, item_id: str) -> dict[str, object]:
        """Return one stored item.

        Args:
            item_id: Trash id.

        Returns:
            The stored record, including ``original``.

        Raises:
            LibraryError: If the id is not a trash id or is not in the index.
                The message does not include the caller text.
        """
        if not _id_ok(item_id):
            raise _error(TRASH_MISSING)
        record = self._read_items().get(item_id)
        if record is None:
            raise _error(TRASH_MISSING)
        return record

    def _require_held(self, item_id: str) -> dict[str, object]:
        """Return one held item.

        Args:
            item_id: Trash id.

        Returns:
            The stored record.

        Raises:
            LibraryError: If the item is missing or not held.
        """
        record = self._require(item_id)
        if record["status"] != "held":
            raise _error(TRASH_MISSING)
        return record

    def _public(self, record: dict[str, object]) -> dict[str, object]:
        """Return the page row for one stored item.

        Args:
            record: Stored record.

        Returns:
            Public fields. ``original`` is omitted.
        """
        now = _moment(self._now)
        purge_at = _parse_stamp(str(record["purge_at"]))
        cancelled = bool(record["purge_cancelled"])
        return {
            "id": record["id"],
            "kind": record["kind"],
            "name": record["name"],
            "held_at": record["held_at"],
            "purge_at": record["purge_at"],
            "purge_cancelled": cancelled,
            "status": record["status"],
            "days_left": _days_left(now, purge_at, cancelled),
            "label": _label(now, purge_at, cancelled),
        }

    def _blob(self, record: dict[str, object]) -> Path:
        """Return the blob path when it stays inside the trash root.

        Args:
            record: Stored item.

        Returns:
            The blob path. It may not exist yet.

        Raises:
            LibraryError: If the path would leave the trash root.
        """
        if self.root.is_symlink():
            raise _error(TRASH_SHORTCUT)
        root = self.root.resolve()
        blob = (self.root / str(record["rel"])).resolve()
        if blob != root and root not in blob.parents:
            raise _error(TRASH_MISSING)
        return blob

    def _require_blob(self, record: dict[str, object]) -> Path:
        """Return the blob when it is a real file or directory.

        Args:
            record: Stored item.

        Returns:
            The blob path.

        Raises:
            LibraryError: If the blob is missing or a symlink. A snapshot
                tree that contains a symlink is also refused.
        """
        blob = self._blob(record)
        if blob.is_symlink():
            raise _error(TRASH_SHORTCUT)
        kind = str(record["kind"])
        if kind == "audio":
            if not blob.is_file():
                raise _error(TRASH_MISSING)
            return blob
        if not blob.is_dir():
            raise _error(TRASH_MISSING)
        for child in blob.rglob("*"):
            if child.is_symlink():
                raise _error(TRASH_SHORTCUT)
        return blob

    def _restore_bytes(self, record: dict[str, object], library_dir: Path) -> None:
        """Copy one blob back to its original path, then remove the blob.

        Args:
            record: Held item.
            library_dir: Parent of ``master.sqlite``.

        Raises:
            LibraryError: If the destination is unsafe or the hash does not
                match. A failed copy leaves the blob in the trash.
        """
        dest = Path(str(record["original"]))
        kind = str(record["kind"])
        if dest.is_symlink() or dest.parent.is_symlink():
            raise _error(TRASH_SHORTCUT)
        if dest.exists():
            raise _error(TRASH_IN_PLACE)
        if not dest.parent.is_dir():
            raise _error(TRASH_MISSING)
        if kind == "audio" and _audio_protected(dest, library_dir):
            raise _error(TRASH_PROTECTED)
        staging = dest.parent / f"{dest.name}{_STAGING_SUFFIX}"
        if staging.exists() or staging.is_symlink():
            raise _error(TRASH_IN_PLACE)
        blob = self._require_blob(record)
        try:
            if kind == "audio":
                shutil.copy2(blob, staging)
            else:
                shutil.copytree(blob, staging)
            digest, _size = _measure(staging, kind)
            if digest != record["sha256"]:
                raise _error(TRASH_MISSING)
            os.rename(staging, dest)
        except Exception:
            if staging.exists() or staging.is_symlink():
                _remove_path(staging)
            raise
        try:
            self._delete_blob(record)
        except Exception:
            if dest.exists() and not blob.exists():
                shutil.move(str(dest), str(blob))
            elif dest.exists() and blob.exists():
                _remove_path(dest)
            raise

    def _delete_blob(self, record: dict[str, object]) -> None:
        """Remove one blob and its item directory.

        Args:
            record: Stored item.

        Raises:
            LibraryError: If the blob cannot be removed.
        """
        blob = self._require_blob(record)
        try:
            _remove_path(blob)
            blob.parent.rmdir()
        except OSError as exc:
            raise _error(TRASH_MISSING) from exc

    def _purge_refusal(self, record: dict[str, object]) -> Exception | None:
        """Return why purge must not run, or None when it may.

        Args:
            record: Held item.

        Returns:
            A ``LibraryError`` to show or raise. None when the window is
            open and the audio guards allow the delete.

        Raises:
            LibraryError: Only when the copy-count gate raises. That error
                is returned to the caller of :meth:`purge`, not swallowed.
        """
        if record["purge_cancelled"]:
            return _error(TRASH_CANCELLED)
        now = _moment(self._now)
        purge_at = _parse_stamp(str(record["purge_at"]))
        if now < purge_at:
            return _error(TRASH_NOT_DUE)
        if record["kind"] != "audio":
            return None
        import other_dj
        import verified_copies

        original = str(record["original"])
        apps = other_dj.LibraryIndex(other_dj.locate_libraries()).used_by(original, Path(original))
        if apps:
            return _error(TRASH_OTHER_DJ)
        try:
            verified_copies.require_audio_delete([original])
        except Exception as exc:
            return exc
        return None


def hold_file(
    path: Path,
    *,
    name: str,
    library_dir: Path,
    store: AppTrash | None = None,
) -> dict[str, object]:
    """Hold one audio file in the default trash.

    Args:
        path: File to hold.
        name: Display name.
        library_dir: Parent of ``master.sqlite``.
        store: Trash to use. None opens the settings trash.

    Returns:
        ``id``, ``kind``, and ``name``.
    """
    trash = store if store is not None else AppTrash()
    return trash.hold_file(path, name=name, library_dir=library_dir)


def hold_tree(
    path: Path,
    *,
    name: str,
    library_dir: Path,
    store: AppTrash | None = None,
) -> dict[str, object]:
    """Hold one directory in the default trash.

    Args:
        path: Directory to hold.
        name: Display name.
        library_dir: Parent of ``master.sqlite``.
        store: Trash to use. None opens the settings trash.

    Returns:
        ``id``, ``kind``, and ``name``.
    """
    trash = store if store is not None else AppTrash()
    return trash.hold_tree(path, name=name, library_dir=library_dir)
