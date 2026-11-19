"""Background library writes with progress, cancel, and undo (#436).

Tag spelling apply and snapshot restore run on a worker thread so the
page can poll ``GET /api/jobs``. Cancel before or during the write
rolls the session back. After commit, cancel is a no-op. Undo restores
the snapshot taken before that write. Recent completed jobs sit in
``jobs.jsonl`` beside ``settings.json``. A running job is dropped on
load so a restart cannot look live.
"""

from __future__ import annotations

import json
import threading
import time
import uuid
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import app_config
import library
import snapshots
import tag_cleanup
import write_queue

STORE_NAME = "jobs.jsonl"
KEEP = 20
KIND_TAG = "tag_spelling"
KIND_RESTORE = "snapshot_restore"
KINDS = frozenset({KIND_TAG, KIND_RESTORE})
QUEUED = "queued"
RUNNING = "running"
SUCCESS = "success"
PARTIAL = "partial"
FAILED = "failed"
CANCELLED = "cancelled"
TERMINAL = frozenset({SUCCESS, PARTIAL, FAILED, CANCELLED})
UNKNOWN_JOB = "That job is not in the list."
CANNOT_UNDO = "That write cannot be undone."
CONFIRM_RESTORE = "Confirm the restore before it is saved."
BAD_REQUEST = "That request is not valid."
UNKNOWN_ACTION = "That action is not available."
LABEL_TAG = "Fixing spellings"
LABEL_RESTORE = "Restoring snapshot"

_lock = threading.Lock()
_run_lock = threading.Lock()
_jobs: dict[str, dict[str, Any]] = {}
_cancel: dict[str, threading.Event] = {}
_threads: list[threading.Thread] = []
_test_hold: threading.Event | None = None
_hold_at = "start"
_loaded = False


class Cancelled(Exception):
    """Raised from ``on_progress`` when the job was cancelled."""


def hold_for_test(at: str = "start") -> None:
    """Block the worker until ``release_hold``. Tests only.

    Args:
        at: ``start`` waits before the write. ``progress`` waits inside
            ``on_progress`` after the first row is assigned.
    """
    global _test_hold, _hold_at
    _test_hold = threading.Event()
    _hold_at = at


def release_hold() -> None:
    """Let a held worker continue. Tests only."""
    if _test_hold is not None:
        _test_hold.set()


def reset() -> None:
    """Cancel workers, join them, and drop in-memory jobs. Tests only."""
    global _test_hold, _hold_at, _loaded
    with _lock:
        for event in _cancel.values():
            event.set()
        if _test_hold is not None:
            _test_hold.set()
        threads = list(_threads)
    for thread in threads:
        thread.join(timeout=5)
    with _lock:
        _jobs.clear()
        _cancel.clear()
        _threads.clear()
        _test_hold = None
        _hold_at = "start"
        _loaded = True


def listing() -> dict[str, object]:
    """Return recent jobs, newest first.

    Returns:
        ``{jobs: [...]}``.
    """
    _ensure_loaded()
    with _lock:
        rows = [_public(job) for job in _jobs.values()]
    rows.sort(key=lambda row: float(row.get("created_at") or 0), reverse=True)
    return {"jobs": rows[:KEEP]}


def get(job_id: str) -> dict[str, object] | None:
    """Return one job, or None when it is not in the list.

    Args:
        job_id: Job id.

    Returns:
        The public job dict, or None.
    """
    _ensure_loaded()
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            return None
        return _public(job)


def start(payload: Mapping[str, object]) -> dict[str, object]:
    """Queue a write job and start the worker.

    Gig Lock still queues a tag spelling apply as ``/api/tag-clusters``.

    Args:
        payload: ``kind`` plus the fields that kind needs.

    Returns:
        The new job, or a Gig Lock ``queued`` body.

    Raises:
        LibraryError: Unknown kind, missing fields, or restore without
            ``confirm`` true.
    """
    _ensure_loaded()
    kind = payload.get("kind")
    if kind not in KINDS:
        raise library.LibraryError(BAD_REQUEST, 400)
    if kind == KIND_TAG:
        queued = _maybe_queue_tag(payload)
        if queued is not None:
            return queued
        space = _text(payload.get("space"))
        field = _text(payload.get("field"))
        value = payload.get("value")
        if not space or not field or not isinstance(value, str) or not value:
            raise library.LibraryError(BAD_REQUEST, 400)
        files = payload.get("files") is True
        label = LABEL_TAG
        body = {
            "space": space,
            "field": field,
            "value": value,
            "files": files,
        }
    else:
        if payload.get("confirm") is not True:
            raise library.LibraryError(CONFIRM_RESTORE, 400)
        snapshot_id = _text(payload.get("id"))
        if not snapshot_id:
            raise library.LibraryError(BAD_REQUEST, 400)
        label = LABEL_RESTORE
        body = {"id": snapshot_id}
    job_id = uuid.uuid4().hex
    now = time.time()
    job: dict[str, Any] = {
        "id": job_id,
        "kind": kind,
        "label": label,
        "state": QUEUED,
        "done": 0,
        "total": 0,
        "current": "",
        "errors": [],
        "snapshot_id": None,
        "cancelable": True,
        "created_at": now,
        "finished_at": None,
        "_body": body,
    }
    event = threading.Event()
    with _lock:
        _jobs[job_id] = job
        _cancel[job_id] = event
    thread = threading.Thread(target=_worker, args=(job_id,), daemon=True)
    with _lock:
        _threads.append(thread)
    thread.start()
    found = get(job_id)
    assert found is not None
    return found


def cancel(job_id: str) -> dict[str, object]:
    """Request cancel. After commit this is a no-op.

    Args:
        job_id: Job id.

    Returns:
        The job after the cancel flag is set.

    Raises:
        LibraryError: Unknown id.
    """
    _ensure_loaded()
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            raise library.LibraryError(UNKNOWN_JOB, 400)
        if job["state"] in TERMINAL:
            return _public(job)
        event = _cancel.get(job_id)
        if event is not None:
            event.set()
        return _public(job)


def undo(job_id: str) -> dict[str, object]:
    """Restore the snapshot taken before this job's write.

    Args:
        job_id: Job id.

    Returns:
        The snapshot restore result.

    Raises:
        LibraryError: Unknown id, or the write has no snapshot.
        SnapshotError: Restore refused.
        SnapshotBlocked: Serato or Protect Library blocks the restore.
    """
    _ensure_loaded()
    with _lock:
        job = _jobs.get(job_id)
        if job is None:
            raise library.LibraryError(UNKNOWN_JOB, 400)
        snapshot_id = job.get("snapshot_id")
    if not isinstance(snapshot_id, str) or not snapshot_id:
        raise library.LibraryError(CANNOT_UNDO, 400)
    return snapshots.current_store().restore(snapshot_id)


def _maybe_queue_tag(payload: Mapping[str, object]) -> dict[str, object] | None:
    """Enqueue a tag apply when Gig Lock would queue ``/api/tag-clusters``.

    Args:
        payload: Start body.

    Returns:
        The queue item, or None to run as a job.
    """
    cluster: dict[str, object] = {
        "action": "apply",
        "space": payload.get("space"),
        "field": payload.get("field"),
        "value": payload.get("value"),
    }
    if payload.get("files") is True:
        cluster["files"] = True
    if write_queue.should_queue("/api/tag-clusters", cluster, is_preview=False):
        return write_queue.enqueue("/api/tag-clusters", cluster)
    return None


def _worker(job_id: str) -> None:
    """Run one job on a background thread.

    Args:
        job_id: Job id.
    """
    try:
        _wait_if_held("start")
        if _is_cancelled(job_id):
            _finish(job_id, CANCELLED)
            return
        _set_state(job_id, RUNNING)
        with _run_lock:
            with snapshots.own_writes() as store:
                if _is_cancelled(job_id):
                    _finish(job_id, CANCELLED)
                    return
                kind = _kind(job_id)
                if kind == KIND_TAG:
                    _run_tag(job_id, store)
                else:
                    _run_restore(job_id, store)
    except Cancelled:
        _finish(job_id, CANCELLED)
    except (library.LibraryError, library.SeratoOpen, snapshots.SnapshotError, snapshots.SnapshotBlocked) as exc:
        _finish(job_id, FAILED, errors=[exc.message])
    except Exception as exc:
        _finish(job_id, FAILED, errors=[str(exc) or FAILED])


def _run_tag(job_id: str, store: snapshots.SnapshotStore) -> None:
    """Apply one tag spelling group.

    Args:
        job_id: Job id.
        store: Snapshot store from ``own_writes``.
    """
    body = _body(job_id)

    def on_progress(done: int, total: int, current: str) -> None:
        """Record progress and abort when cancelled.

        Args:
            done: Rows finished.
            total: Rows in this apply.
            current: Spelling being rewritten.

        Raises:
            Cancelled: The job was cancelled.
        """
        _update_progress(job_id, done, total, current)
        _wait_if_held("progress")
        if _is_cancelled(job_id):
            raise Cancelled()

    info = store.take("before-write", "Before a library write.")
    snapshot_id = info["id"]
    result = tag_cleanup.apply(
        str(body["space"]),
        str(body["field"]),
        body["value"],
        bool(body.get("files")),
        on_progress=on_progress,
    )
    skipped = result.get("files_skipped") if isinstance(result, dict) else None
    errors: list[str] = []
    state = SUCCESS
    if isinstance(skipped, list) and skipped:
        state = PARTIAL
        for item in skipped:
            if isinstance(item, dict):
                reason = item.get("reason")
                if isinstance(reason, str) and reason:
                    errors.append(reason)
    total = 0
    if isinstance(result, dict):
        changes = result.get("changes")
        if isinstance(changes, list):
            total = len(changes)
    _finish(job_id, state, errors=errors, snapshot_id=snapshot_id, done=total, total=total)


def _run_restore(job_id: str, store: snapshots.SnapshotStore) -> None:
    """Restore one snapshot.

    Args:
        job_id: Job id.
        store: Snapshot store from ``own_writes``.
    """
    body = _body(job_id)
    snapshot_id = str(body["id"])
    _update_progress(job_id, 0, 1, snapshot_id)
    _wait_if_held("progress")
    if _is_cancelled(job_id):
        raise Cancelled()
    result = store.restore(snapshot_id)
    undo_id = result.get("undo_snapshot")
    snapshot_before = undo_id if isinstance(undo_id, str) else None
    skipped = result.get("crates_skipped")
    errors: list[str] = []
    state = SUCCESS
    if isinstance(skipped, list) and skipped:
        state = PARTIAL
        for item in skipped:
            if isinstance(item, dict):
                name = item.get("name") or item.get("path")
                if isinstance(name, str) and name:
                    errors.append(name)
    _finish(
        job_id,
        state,
        errors=errors,
        snapshot_id=snapshot_before,
        done=1,
        total=1,
    )


def _finish(
    job_id: str,
    state: str,
    *,
    errors: list[str] | None = None,
    snapshot_id: str | None = None,
    done: int | None = None,
    total: int | None = None,
) -> None:
    """Mark a job terminal and persist completed rows.

    Args:
        job_id: Job id.
        state: Terminal state.
        errors: Error sentences.
        snapshot_id: Before-write snapshot for undo.
        done: Final done count.
        total: Final total count.
    """
    with _lock:
        job = _jobs.get(job_id)
        if job is None or job["state"] in TERMINAL:
            return
        job["state"] = state
        job["cancelable"] = False
        job["finished_at"] = time.time()
        if errors:
            job["errors"] = list(errors)
        if snapshot_id:
            job["snapshot_id"] = snapshot_id
        if done is not None:
            job["done"] = done
        if total is not None:
            job["total"] = total
    _persist()


def _set_state(job_id: str, state: str) -> None:
    """Set a non-terminal state.

    Args:
        job_id: Job id.
        state: New state.
    """
    with _lock:
        job = _jobs.get(job_id)
        if job is None or job["state"] in TERMINAL:
            return
        job["state"] = state


def _update_progress(job_id: str, done: int, total: int, current: str) -> None:
    """Write progress fields.

    Args:
        job_id: Job id.
        done: Rows finished.
        total: Rows in this apply.
        current: Current item label.
    """
    with _lock:
        job = _jobs.get(job_id)
        if job is None or job["state"] in TERMINAL:
            return
        job["done"] = done
        job["total"] = total
        job["current"] = current
        job["state"] = RUNNING


def _is_cancelled(job_id: str) -> bool:
    """Return whether cancel was requested.

    Args:
        job_id: Job id.

    Returns:
        True when the cancel event is set.
    """
    with _lock:
        event = _cancel.get(job_id)
    return event is not None and event.is_set()


def _kind(job_id: str) -> str:
    """Return the job kind.

    Args:
        job_id: Job id.

    Returns:
        ``tag_spelling`` or ``snapshot_restore``.
    """
    with _lock:
        job = _jobs[job_id]
        return str(job["kind"])


def _body(job_id: str) -> dict[str, Any]:
    """Return the private start payload.

    Args:
        job_id: Job id.

    Returns:
        The stored body.
    """
    with _lock:
        job = _jobs[job_id]
        body = job["_body"]
        return dict(body)


def _wait_if_held(where: str) -> None:
    """Block when a test hold is armed for this point.

    Args:
        where: ``start`` or ``progress``.
    """
    hold = _test_hold
    if hold is not None and _hold_at == where:
        hold.wait(timeout=30)


def _public(job: Mapping[str, Any]) -> dict[str, object]:
    """Copy the JSON fields the page reads.

    Args:
        job: Internal job.

    Returns:
        Public dict.
    """
    return {
        "id": job["id"],
        "kind": job["kind"],
        "label": job["label"],
        "state": job["state"],
        "done": job["done"],
        "total": job["total"],
        "current": job["current"],
        "errors": list(job["errors"]),
        "snapshot_id": job["snapshot_id"],
        "cancelable": job["cancelable"],
        "created_at": job["created_at"],
        "finished_at": job["finished_at"],
    }


def _text(value: object) -> str | None:
    """Return a non-empty string.

    Args:
        value: JSON field.

    Returns:
        Stripped text, or None.
    """
    if not isinstance(value, str):
        return None
    text = value.strip()
    return text or None


def _store_path() -> Path:
    """Return ``jobs.jsonl`` beside settings.

    Returns:
        Store path.
    """
    return app_config.config_dir() / STORE_NAME


def _ensure_loaded() -> None:
    """Load completed jobs from disk once."""
    global _loaded
    with _lock:
        if _loaded:
            return
        _loaded = True
        path = _store_path()
        if not path.is_file() or path.is_symlink():
            return
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            return
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(row, dict):
                continue
            job_id = row.get("id")
            state = row.get("state")
            if not isinstance(job_id, str) or state not in TERMINAL:
                continue
            _jobs[job_id] = {
                "id": job_id,
                "kind": row.get("kind") if row.get("kind") in KINDS else KIND_TAG,
                "label": row.get("label") if isinstance(row.get("label"), str) else LABEL_TAG,
                "state": state,
                "done": int(row["done"]) if isinstance(row.get("done"), int) else 0,
                "total": int(row["total"]) if isinstance(row.get("total"), int) else 0,
                "current": row.get("current") if isinstance(row.get("current"), str) else "",
                "errors": list(row["errors"]) if isinstance(row.get("errors"), list) else [],
                "snapshot_id": row.get("snapshot_id") if isinstance(row.get("snapshot_id"), str) else None,
                "cancelable": False,
                "created_at": float(row["created_at"]) if isinstance(row.get("created_at"), (int, float)) else 0.0,
                "finished_at": float(row["finished_at"]) if isinstance(row.get("finished_at"), (int, float)) else None,
                "_body": {},
            }


def _persist() -> None:
    """Rewrite ``jobs.jsonl`` with the newest completed jobs."""
    with _lock:
        rows = [
            _public(job)
            for job in _jobs.values()
            if job["state"] in TERMINAL
        ]
    rows.sort(key=lambda row: float(row.get("created_at") or 0), reverse=True)
    rows = rows[:KEEP]
    path = _store_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        handle, temp = __import__("tempfile").mkstemp(
            prefix=".jobs-", suffix=".jsonl", dir=path.parent
        )
    except OSError:
        return
    try:
        with open(handle, "w", encoding="utf-8") as stream:
            for row in rows:
                stream.write(json.dumps(row, ensure_ascii=True) + "\n")
        Path(temp).replace(path)
    except OSError:
        try:
            Path(temp).unlink()
        except OSError:
            pass
