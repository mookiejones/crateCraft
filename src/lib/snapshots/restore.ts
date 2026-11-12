/**
 * Snapshot list and restore dialog engine.
 *
 * Typed against the dry-run fields POST /api/snapshots returns. Confirm
 * stays off when restore_blocked is set. Nothing is written until confirm.
 * The list and dialog are React islands on SnapshotsContext.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import type { DriveBackup, DriveCopy, OperationList, RestorePlan, SnapshotList } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { RestoreDialog } from "../../pages/RestoreDialog";
import { SnapshotsPanel } from "../../pages/SnapshotsPanel";
import type { SnapshotsSnapshot } from "../../containers/SnapshotsContext";
import { messageParams, serverMessage, t } from "../i18n";
import { state } from "../state";

let reloadLibrary: () => Promise<void> = async () => {};

export function bindLibraryReload(reload: () => Promise<void>): void {
  reloadLibrary = reload;
}

const hosts = new WeakMap<HTMLElement, IslandRoot>();
const listeners = new Set<() => void>();
let lastPlan: RestorePlan | null = null;
let planOpen = false;
let planStatus = "";
let taking = false;
let backingDrives = false;
let confirming = false;
let driveNoteError = "";
let statusOverride = "";

export type SnapshotsListener = () => void;

function isDriveCopy(value: unknown): value is DriveCopy {
  if (!value || typeof value !== "object") return false;
  const record = value as DriveCopy;
  return typeof record.status === "string" && (record.label === undefined || typeof record.label === "string");
}

/**
 * Keep a drive report only when the server says the hashes matched.
 *
 * @param value JSON from `drive_backup`.
 * @returns The report, or null when it is missing or not verified.
 */
export function driveBackupFrom(value: unknown): DriveBackup | null {
  if (!value || typeof value !== "object") return null;
  const record = value as DriveBackup;
  if (record.verified !== true) return null;
  const drives = Array.isArray(record.drives) ? record.drives.filter(isDriveCopy) : [];
  return {
    folder: typeof record.folder === "string" ? record.folder : "",
    verified: true,
    drives,
  };
}

/**
 * Current snapshot list, plan, and busy flags.
 *
 * @returns A new object each call. The arrays are the live `state` rows.
 */
export function getSnapshotsState(): SnapshotsSnapshot {
  return {
    snapshots: state.snapshots,
    driveBackup: state.driveBackup,
    operations: state.operations,
    operationsLoading: state.operationsLoading,
    operationsError: state.operationsError,
    snapshotLoading: state.snapshotLoading,
    snapshotError: state.snapshotError,
    snapshotMessage: state.snapshotMessage,
    snapshotUndo: state.snapshotUndo,
    writeBlock: state.writeBlock,
    writeBlockCode: state.writeBlockCode,
    writeBlockParams: state.writeBlockParams,
    seratoRunning: state.seratoRunning,
    snapshotPlanId: state.snapshotPlanId,
    plan: lastPlan,
    planOpen,
    planStatus,
    taking,
    backingDrives,
    confirming,
    driveNoteError,
    statusOverride,
  };
}

/**
 * Subscribe to snapshot-list changes.
 *
 * @param listener Called after a load, plan, or confirm updates the store.
 * @returns Unsubscribe.
 */
export function subscribe(listener: SnapshotsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of [...listeners]) listener();
}

function bindHost(host: HTMLElement | null, node: ReturnType<typeof createElement>): void {
  if (!host) return;
  const existing = hosts.get(host);
  hosts.set(host, mountIsland(host, node, existing));
}

/**
 * Paint the snapshot panel and restore dialog into their page hosts.
 *
 * Called once from app.ts. A missing host does nothing, so a test page
 * that has not installed the markup can still call `loadSnapshots`.
 */
export function mountSnapshots(): void {
  bindHost(document.getElementById("snapshots-panel"), createElement(SnapshotsPanel));
  bindHost(document.getElementById("snapshot-dialog-host"), createElement(RestoreDialog));
}

/**
 * Unmount the snapshot panel and restore-dialog islands.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 *
 * @returns {void}
 */
export function unmountSnapshots(): void {
  for (const id of ["snapshots-panel", "snapshot-dialog-host"] as const) {
    const host = document.getElementById(id);
    if (!(host instanceof HTMLElement)) continue;
    const root = hosts.get(host);
    if (!root) continue;
    try {
      root.unmount();
    } catch {
      // installPage already dropped the host.
    }
    hosts.delete(host);
  }
}

function ensureMounted(): void {
  mountSnapshots();
}

function updateCrateFoot(): void {
  const foot = document.getElementById("crate-foot");
  if (!foot) return;
  foot.textContent = state.snapshotLoading
    ? t("snapshots.reading")
    : t("snapshots.count", { count: state.snapshots.length });
}

function paint(): void {
  ensureMounted();
  updateCrateFoot();
  emit();
}

/**
 * Load the snapshot list.
 *
 * Shows a reading line, then the rows or an empty explanation. A failure
 * stays in the panel with a retry. Does not restore anything.
 *
 * @returns {Promise<void>}
 */
export async function loadSnapshots() {
  state.snapshotLoading = true;
  state.snapshotError = "";
  statusOverride = "";
  const operationsPromise = loadOperations();
  paint();
  try {
    const response = await fetch("/api/snapshots");
    const payload = await readJSON<SnapshotList>(response);
    if (!response.ok) throw new Error(serverMessage(payload, t("snapshots.unreadable")));
    state.snapshots = payload.snapshots || [];
    state.snapshotUndo = payload.pending_undo || null;
    state.writeBlock = payload.write_block || "";
    state.writeBlockCode = payload.write_block_code || "";
    state.writeBlockParams = messageParams(payload.write_block_params) ?? null;
    state.seratoRunning = Boolean(payload.serato_running);
    state.driveBackup = driveBackupFrom(payload.drive_backup);
    state.snapshotLoading = false;
    paint();
  } finally {
    await operationsPromise;
  }
}

/**
 * Load the operation log.
 *
 * A failure stays in the log panel and does not change the snapshot list.
 * The log does not include file paths.
 *
 * @returns {Promise<void>}
 */
export async function loadOperations() {
  state.operationsLoading = true;
  state.operationsError = "";
  paint();
  try {
    const response = await fetch("/api/operations");
    const payload = await readJSON<OperationList>(response);
    if (!response.ok) throw new Error(serverMessage(payload, t("operations.unreadable")));
    state.operations = Array.isArray(payload.operations) ? payload.operations : [];
    state.operationsLoading = false;
  } catch (error) {
    state.operationsLoading = false;
    state.operationsError = failureOf(error).message || t("operations.unreadable");
  }
  paint();
}

/**
 * Show a snapshot-list failure.
 *
 * @param {Error} error Failed request.
 * @returns {void}
 */
export function failSnapshots(error: unknown) {
  state.snapshotLoading = false;
  state.snapshotError = failureOf(error).message || t("snapshots.unreadable");
  paint();
}

/**
 * Paint the snapshot list, the Serato 5 note, and an outside-change undo.
 *
 * Restore stays available as a button on each row; the dialog decides
 * whether confirm is allowed.
 *
 * @returns {void}
 */
export function renderSnapshots() {
  paint();
}

/**
 * Paint the operation log under the snapshot list.
 *
 * @returns {void}
 */
export function renderOperations() {
  paint();
}

/**
 * Ask for a restore plan and open the MUI dialog.
 *
 * The plan is a dry run. Confirm stays off when the server says the
 * restore is blocked. Open state is `planOpen`; this does not call
 * `showModal`.
 *
 * @param {string} snapshotId Snapshot to review.
 * @returns {Promise<void>}
 */
export async function openSnapshotPlan(snapshotId: string) {
  state.snapshotPlanId = snapshotId;
  lastPlan = null;
  planOpen = true;
  planStatus = "";
  paint();
  const plan = await postJSON<RestorePlan>("/api/snapshots", { action: "plan", id: snapshotId });
  lastPlan = plan;
  paint();
}

/**
 * Paint the open restore dialog again in the active language.
 *
 * @returns {void}
 */
export function repaintSnapshotPlan() {
  if (planOpen) paint();
}

/**
 * Copy each connected drive's Serato folder into the backup on this computer.
 *
 * The request does not change the library. An unplugged drive is listed
 * and skipped. A failure stays on the drive line. The snapshot list is
 * left in place.
 *
 * @returns {Promise<void>}
 */
export async function backupDriveCrates(): Promise<void> {
  backingDrives = true;
  driveNoteError = "";
  paint();
  try {
    const payload = await postJSON<SnapshotList & { created?: boolean }>("/api/snapshots", { action: "backup-drives" });
    state.driveBackup = driveBackupFrom(payload.drive_backup);
    state.snapshotMessage = payload.created ? "snapshots.drivesSaved" : "snapshots.drivesAlready";
    driveNoteError = "";
    paint();
  } catch (error) {
    state.snapshotMessage = "";
    driveNoteError = failureOf(error).message || t("snapshots.unreadable");
    paint();
  } finally {
    backingDrives = false;
    paint();
  }
}

/**
 * Set the restore dialog status line.
 *
 * @param {string} message Status text.
 * @returns {void}
 */
export function setSnapshotDialogStatus(message: string) {
  planStatus = message;
  paint();
}

/**
 * Close the restore dialog without writing.
 *
 * @returns {void}
 */
export function closePlan(): void {
  planOpen = false;
  paint();
}

/**
 * Save a manual snapshot and reload the list.
 *
 * @returns {Promise<void>}
 */
export async function takeSnapshot() {
  taking = true;
  paint();
  try {
    await postJSON("/api/snapshots", { action: "create" });
    state.snapshotMessage = "snapshots.saved";
    await loadSnapshots();
  } finally {
    taking = false;
    paint();
  }
}

/**
 * Confirm the open restore after the dry run.
 *
 * @returns {Promise<void>}
 */
export async function confirmSnapshotRestore() {
  confirming = true;
  planStatus = "";
  paint();
  try {
    const undoing = state.snapshotUndo && state.snapshotUndo.restore_id === state.snapshotPlanId;
    const body = undoing
      ? { action: "undo", confirm: true }
      : { action: "restore", id: state.snapshotPlanId, confirm: true };
    const result = await postJSON<RestorePlan>("/api/snapshots", body);
    const skipped = result.crates_skipped || [];
    closePlan();
    state.snapshotMessage = skipped.length ? "" : "snapshots.restored";
    await loadSnapshots();
    await reloadLibrary();
    if (skipped.length) {
      const names = skipped.map((item) => item.name || item.path || t("plan.item")).join(", ");
      statusOverride = t("snapshots.skippedCrates", { count: skipped.length, names });
      paint();
    }
  } catch (error) {
    planStatus = failureOf(error).message;
    confirming = false;
    await loadOperations();
    paint();
  } finally {
    confirming = false;
    paint();
  }
}
