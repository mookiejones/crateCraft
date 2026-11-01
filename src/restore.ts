/**
 * Snapshot list and restore dialog.
 *
 * Typed against the dry-run fields POST /api/snapshots returns. Confirm
 * stays off when restore_blocked is set. Nothing is written until confirm.
 */

import { failureOf, postJSON, readJSON } from "./api";
import type { FrameDiff, OperationEntry, OperationList, PlanName, RestorePlan, SnapshotList } from "./api-types";
import { el } from "./dom";
import { state } from "./state";
import { codedText, formatDate, formatList, messageParams, serverMessage, t, type MessageKey } from "./i18n";
import { buttonEl } from "./tooltip";
import { tips } from "./tooltip-strings";

let reloadLibrary: () => Promise<void> = async () => {};

export function bindLibraryReload(reload: () => Promise<void>): void {
  reloadLibrary = reload;
}

// --- snapshots (issue 35). Keep this block together for the TypeScript move in #59. ---

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
  const operationsPromise = loadOperations();
  renderSnapshots();
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
    state.snapshotLoading = false;
    renderSnapshots();
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
  renderOperations();
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
  renderOperations();
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
  renderSnapshots();
}

/**
 * Paint the snapshot list, the Serato 5 note, and an outside-change undo.
 *
 * Text is set with textContent. Restore stays available as a button on
 * each row; the dialog decides whether confirm is allowed.
 *
 * @returns {void}
 */
export function renderSnapshots() {
  renderOperations();
  el("crate-foot").textContent = state.snapshotLoading
    ? t("snapshots.reading")
    : t("snapshots.count", { count: state.snapshots.length });
  const status = el("snapshots-status");
  const block = el("snapshots-block");
  const undo = el("snapshots-undo");
  const list = el("snapshots-list");
  list.setAttribute("aria-busy", String(state.snapshotLoading));
  if (state.writeBlock) {
    block.hidden = false;
    block.textContent = codedText(state.writeBlock, state.writeBlockCode, state.writeBlockParams);
  } else {
    block.hidden = true;
    block.textContent = "";
  }
  if (state.snapshotUndo && state.snapshotUndo.restore_id) {
    undo.hidden = false;
    el("snapshots-undo-text").textContent = state.snapshotUndo.source === "Lexicon"
      ? t("snapshots.outsideChangeLexicon")
      : t("snapshots.outsideChange");
  } else {
    undo.hidden = true;
  }
  list.replaceChildren();
  if (state.snapshotLoading) {
    status.textContent = t("snapshots.reading");
    return;
  }
  if (state.snapshotError) {
    status.textContent = state.snapshotError;
    const retry = buttonEl(tips.snapshotsRetry);
    retry.textContent = t("common.tryAgain");
    retry.addEventListener("click", () => loadSnapshots().catch((error) => failSnapshots(error)));
    list.append(retry);
    return;
  }
  status.textContent = state.snapshotMessage ? t(state.snapshotMessage) : "";
  if (!state.snapshots.length) {
    const empty = document.createElement("p");
    empty.textContent = t("snapshots.empty");
    list.append(empty);
    return;
  }
  for (const item of state.snapshots) {
    const card = document.createElement("article");
    card.className = "snapshot-card";
    card.setAttribute("role", "listitem");
    const title = document.createElement("p");
    title.textContent = `${item.created || t("snapshots.unknownTime")} · ${item.trigger || t("snapshots.trigger")}`;
    const detail = document.createElement("p");
    const version = item.serato_version && item.serato_version !== "unknown"
      ? t("snapshots.seratoVersion", { version: item.serato_version, build: String(item.serato_build ?? "") })
      : t("snapshots.seratoUnknown");
    const drives = (item.unavailable_drives || []).length
      ? ` ${t("snapshots.unavailableDrives", { drives: formatList(item.unavailable_drives || []) })}`
      : "";
    detail.textContent = `${version}. ${item.reason || ""}${drives}`;
    const restore = buttonEl(tips.reviewRestore);
    restore.textContent = t("snapshots.reviewRestore");
    restore.addEventListener("click", () => openSnapshotPlan(item.id).catch((error) => setSnapshotDialogStatus(failureOf(error).message)));
    card.append(title, detail, restore);
    list.append(card);
  }
}

const OPERATION_ACTIONS: Record<string, MessageKey> = {
  crate_create: "operations.action.crateCreate",
  crate_rename: "operations.action.crateRename",
  crate_delete: "operations.action.crateDelete",
  crate_color: "operations.action.crateColor",
  crate_expanded: "operations.action.crateExpanded",
  crate_rules: "operations.action.crateRules",
  crate_add: "operations.action.crateAdd",
  crate_remove: "operations.action.crateRemove",
  crate_prepare: "operations.action.cratePrepare",
  crate_remove_library: "operations.action.crateRemoveLibrary",
  save_track: "operations.action.saveTrack",
  import_m3u: "operations.action.importM3u",
  merge_duplicates: "operations.action.mergeDuplicates",
  rename: "operations.action.rename",
  move: "operations.action.move",
  move_folder: "operations.action.moveFolder",
  replace: "operations.action.replace",
  delete: "operations.action.delete",
  restore: "operations.action.restore",
  restore_recover: "operations.action.restoreRecover",
};

const OPERATION_OUTCOMES: Record<string, MessageKey> = {
  verified: "operations.outcome.verified",
  rolled_back: "operations.outcome.rolledBack",
  refused: "operations.outcome.refused",
  rollback_failed: "operations.outcome.rollbackFailed",
};

/**
 * Paint the operation log under the snapshot list.
 *
 * Text is set with textContent. A failed rollback uses an alert. The
 * rows do not include file paths.
 *
 * @returns {void}
 */
export function renderOperations() {
  const alert = el("operations-alert");
  const status = el("operations-status");
  const list = el("operations-list");
  list.setAttribute("aria-busy", String(state.operationsLoading));
  const latest = state.operations[state.operations.length - 1];
  const failed = latest?.result === "rollback_failed";
  alert.hidden = !failed;
  alert.textContent = failed ? t("operations.rollbackFailed") : "";
  list.replaceChildren();
  if (state.operationsLoading && state.operations.length === 0) {
    status.textContent = t("operations.reading");
    return;
  }
  if (state.operationsError) {
    status.textContent = state.operationsError;
    const retry = buttonEl(tips.operationsRetry);
    retry.textContent = t("common.tryAgain");
    retry.addEventListener("click", () => {
      loadOperations().catch(() => undefined);
    });
    list.append(retry);
    return;
  }
  status.textContent = "";
  if (!state.operations.length) {
    const empty = document.createElement("p");
    empty.textContent = t("operations.empty");
    list.append(empty);
    return;
  }
  for (const item of [...state.operations].reverse()) {
    list.append(operationCard(item));
  }
}

function operationCard(item: OperationEntry) {
  const card = document.createElement("article");
  card.className = "operation-card snapshot-card";
  card.setAttribute("role", "listitem");
  const actionName = item.action || item.operation || "";
  const actionKey = OPERATION_ACTIONS[actionName];
  const outcomeKey = OPERATION_OUTCOMES[item.result || ""] ?? "operations.outcome.refused";
  const title = document.createElement("p");
  title.textContent = t("operations.entry", {
    time: operationTime(item.time || ""),
    action: actionKey ? t(actionKey) : t("operations.actionOther"),
    target: item.target || t("operations.noTarget"),
    outcome: t(outcomeKey),
  });
  card.append(title);
  if (item.snapshot_before && item.snapshot_after) {
    const detail = document.createElement("p");
    detail.textContent = t("operations.snapshots", {
      before: item.snapshot_before,
      after: item.snapshot_after,
    });
    card.append(detail);
  } else if (item.snapshot_before) {
    const detail = document.createElement("p");
    detail.textContent = t("operations.beforeOnly", { before: item.snapshot_before });
    card.append(detail);
  }
  return card;
}

function operationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || t("snapshots.unknownTime");
  return formatDate(date, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Ask for a restore plan and open the dialog.
 *
 * The plan is a dry run. Confirm stays off when the server says the
 * restore is blocked.
 *
 * @param {string} snapshotId Snapshot to review.
 * @returns {Promise<void>}
 */
export async function openSnapshotPlan(snapshotId: string) {
  state.snapshotPlanId = snapshotId;
  const planBox = el("snapshot-plan");
  const block = el("snapshot-block");
  const confirm = el("snapshot-confirm");
  planBox.replaceChildren();
  block.textContent = t("snapshots.readingPlan");
  confirm.disabled = true;
  setSnapshotDialogStatus("");
  el("snapshot-dialog").showModal();
  const plan = await postJSON("/api/snapshots", { action: "plan", id: snapshotId });
  paintSnapshotPlan(plan);
}

/**
 * Fill the restore dialog from a dry-run plan.
 *
 * @param {object} plan Response from action plan. Reads plan.crates,
 *   plan.tracks, plan.cues, plan.grids, plan.dry_run, and plan.restore_blocked.
 * @returns {void}
 */
let lastPlan: RestorePlan | null = null;

/**
 * Paint the open restore dialog again in the active language.
 *
 * @returns {void}
 */
export function repaintSnapshotPlan() {
  if (lastPlan && el("snapshot-dialog").open) paintSnapshotPlan(lastPlan);
}

function paintSnapshotPlan(plan: RestorePlan) {
  lastPlan = plan;
  const planBox = el("snapshot-plan");
  const block = el("snapshot-block");
  const confirm = el("snapshot-confirm");
  planBox.replaceChildren();
  const crates = plan.crates || {};
  const tracks = plan.tracks || {};
  appendPlanLine(planBox, t("plan.cratesAdded"), crates.added);
  appendPlanLine(planBox, t("plan.cratesRemoved"), crates.removed);
  appendPlanLine(planBox, t("plan.cratesChanged"), crates.changed);
  appendPlanLine(planBox, t("plan.cratesUnavailable"), crates.unavailable);
  appendPlanLine(planBox, t("plan.tracksAdded"), tracks.added);
  appendPlanLine(planBox, t("plan.tracksRemoved"), tracks.removed);
  appendPlanLine(planBox, t("plan.tracksUnavailable"), tracks.unavailable);
  appendFrameDiffs(planBox, t("plan.cueChanges"), plan.cues);
  appendFrameDiffs(planBox, t("plan.gridChanges"), plan.grids);
  const deleted = plan.deleted || {};
  appendPlanLine(planBox, t("plan.deletedCrates"), deleted.crates);
  appendPlanLine(planBox, t("plan.deletedTracks"), deleted.tracks);
  appendPlanLine(planBox, t("plan.deletedCues"), deleted.cues);
  appendPlanLine(planBox, t("plan.deletedGrids"), deleted.grids);
  if (plan.restore_blocked) {
    block.textContent = codedText(
      plan.restore_blocked,
      plan.restore_blocked_code,
      messageParams(plan.restore_blocked_params),
    );
    confirm.disabled = true;
  } else {
    block.textContent = plan.dry_run ? t("plan.nothingChanged") : "";
    confirm.disabled = false;
  }
}

/**
 * Add one labelled count or name list to the restore plan.
 *
 * @param {HTMLElement} parent Plan container.
 * @param {string} label Section name.
 * @param {object[]|undefined} rows Diff rows.
 * @returns {void}
 */
function appendPlanLine(parent: HTMLElement, label: string, rows: PlanName[] | undefined) {
  const line = document.createElement("p");
  const items = rows || [];
  if (!items.length) {
    line.textContent = t("plan.none", { label });
  } else {
    const names = items.slice(0, 8).map((item) => item.name || item.path || item.drive_label || t("plan.item"));
    const extra = items.length > names.length ? t("plan.andMore", { count: items.length - names.length }) : "";
    const listed = `${names.join(", ")}${extra}`;
    line.textContent = t("plan.listed", { label, count: items.length, names: listed });
  }
  parent.append(line);
}

/**
 * Add per-file cue or grid differences.
 *
 * @param {HTMLElement} parent Plan container.
 * @param {string} label Section name.
 * @param {object[]|undefined} rows Files whose frames would change.
 * @returns {void}
 */
function appendFrameDiffs(parent: HTMLElement, label: string, rows: FrameDiff[] | undefined) {
  const items = rows || [];
  const line = document.createElement("p");
  if (!items.length) {
    line.textContent = t("plan.none", { label });
    parent.append(line);
    return;
  }
  line.textContent = t("plan.files", { label, count: items.length });
  parent.append(line);
  for (const item of items.slice(0, 12)) {
    const row = document.createElement("p");
    row.textContent = fileName(item.path || "");
    parent.append(row);
  }
}

/**
 * Return the last path segment for a restore line.
 *
 * @param {string} path File path.
 * @returns {string} The file name, or the whole path when it has no slash.
 */
function fileName(path: string) {
  const parts = String(path).split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/**
 * Set the restore dialog status line.
 *
 * @param {string} message Status text.
 * @returns {void}
 */
export function setSnapshotDialogStatus(message: string) {
  el("snapshot-status").textContent = message;
}

/**
 * Save a manual snapshot and reload the list.
 *
 * @returns {Promise<void>}
 */
export async function takeSnapshot() {
  const button = el("snapshots-take");
  button.disabled = true;
  button.textContent = t("snapshots.saving");
  try {
    await postJSON("/api/snapshots", { action: "create" });
    state.snapshotMessage = "snapshots.saved";
    await loadSnapshots();
  } finally {
    button.disabled = false;
    button.textContent = t("snapshots.take");
  }
}

/**
 * Confirm the open restore after the dry run.
 *
 * @returns {Promise<void>}
 */
export async function confirmSnapshotRestore() {
  const confirm = el("snapshot-confirm");
  confirm.disabled = true;
  confirm.textContent = t("snapshots.restoring");
  setSnapshotDialogStatus("");
  try {
    const undoing = state.snapshotUndo && state.snapshotUndo.restore_id === state.snapshotPlanId;
    const body = undoing
      ? { action: "undo", confirm: true }
      : { action: "restore", id: state.snapshotPlanId, confirm: true };
    await postJSON("/api/snapshots", body);
    el("snapshot-dialog").close();
    state.snapshotMessage = "snapshots.restored";
    await loadSnapshots();
    await reloadLibrary();
  } catch (error) {
    setSnapshotDialogStatus(failureOf(error).message);
    confirm.disabled = false;
    await loadOperations();
  } finally {
    confirm.textContent = t("snapshots.restore");
  }
}

