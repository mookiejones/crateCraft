/**
 * Check for a portable Serato drive, plus smart-crate copy and restore.
 *
 * Organize files shows Check drive on a removable Serato root. Before a
 * gig shows the same check: pick a connected drive with a `_Serato_`
 * folder. The check is GET /api/drive-check for the volume that contains
 * that folder. Nothing on the drive is written by that check. Copy smart
 * crates and Restore smart crates POST /api/portable-smart. A later reply
 * is ignored when a newer check has started.
 */

import { createElement } from "react";
import { fetchLibraryRoots, readJSON } from "../api";
import type { LibraryRoot } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { PortableFindings } from "../../components/StickCuePanel";
import { el } from "../dom";
import { emitFiles } from "../files/files-store";
import { runPortableMount } from "./portable-bind";
import type { StickCueReport } from "./stick-cues";
import { serverMessage, t } from "../i18n";
import { buttonEl } from "../ui/tooltip";
import { portableCheck } from "../ui/tooltip-strings";
import { postPortableSmart, type PortableSmartResult } from "./portable-smart";

/** Findings painted before the rest are counted as "and more". */
export const FINDING_CAP = 100;

let islandRoot: IslandRoot | null = null;

export interface DriveFinding {
  kind: string;
  crate: string;
  track: string;
  path: string;
  found: string;
  fix: string;
}

export interface DriveError {
  crate: string;
  message: string;
}

export interface DriveReport {
  drive: string;
  name: string;
  ready: boolean;
  missing_drive: boolean;
  summary: string;
  findings: DriveFinding[];
  errors: DriveError[];
}

export { portableKindLabel } from "./portable-view";
export type { PortableViewRow } from "./portable-view";

let token = 0;
let latest: DriveReport | null = null;
let stickReport: StickCueReport | null = null;
let stickStatus = "";
let stickDrive = "";
let lastRoots: LibraryRoot[] = [];
let opener: HTMLElement | null = null;
let hasConnected = false;
let statusText = "";
let lastDrive = "";
let busy = false;
let showConfirm = false;
let showOverwrite = false;

export type PortableSnapshot = {
  report: DriveReport | null;
  status: string;
  stickReport?: StickCueReport | null;
  stickStatus?: string;
  stickDrive?: string;
  smartConfirm: boolean;
  smartOverwrite: boolean;
  smartBusy: boolean;
};

type PortableListener = (next: PortableSnapshot) => void;
const listeners = new Set<PortableListener>();

let snapshot: PortableSnapshot = {
  report: null,
  status: "",
  stickReport: null,
  stickStatus: "",
  stickDrive: "",
  smartConfirm: false,
  smartOverwrite: false,
  smartBusy: false,
};

function emitPortable(): void {
  snapshot = {
    report: latest,
    status: statusText,
    stickReport,
    stickStatus,
    stickDrive,
    smartConfirm: showConfirm,
    smartOverwrite: showOverwrite,
    smartBusy: busy,
  };
  for (const listener of listeners) listener(snapshot);
  emitFiles();
}

/**
 * Run a callback after each Gig Check-drive change.
 *
 * The callback is not run immediately. Call `portableSnapshot` for the
 * current snapshot. The returned function removes the callback.
 *
 * @param listener Called with a snapshot. Do not mutate it.
 * @returns Unsubscribes the listener.
 */
export function subscribePortable(listener: PortableListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Latest drive-check report for the Files dialog.
 *
 * The same object is returned until the next change, so React can
 * subscribe without treating every read as a new snapshot.
 *
 * @returns Report, status line, stick-cue state, and whether Restore or Replace on drive is offered.
 */
export function portableSnapshot(): PortableSnapshot {
  return snapshot;
}

/**
 * Store a stick-cue preview or the line under the buttons.
 *
 * @param report Parsed POST /api/stick-cues body, or null.
 * @param status Reviewing line, or an error sentence.
 * @returns {void}
 */
export function setStickCueState(report: StickCueReport | null, status: string): void {
  stickReport = report;
  stickStatus = status;
  emitPortable();
}

/**
 * Close the portable dialog and restore focus.
 *
 * @returns {void}
 */
export function closePortable(): void {
  const dialog = document.getElementById("portable-dialog");
  if (dialog instanceof HTMLDialogElement) dialog.close();
  if (opener?.isConnected) opener.focus();
}

/**
 * Volume root for a music folder, so the check sees `_Serato_` beside Music.
 *
 * `/Volumes/GIGDRIVE/Music` is `/Volumes/GIGDRIVE`. `E:\Music` is `E:\`.
 * A path that already ends at `_Serato_` uses the folder above it. An
 * empty string stays empty. This does not look at the disk.
 *
 * @param path Music root or drive path from the Files page.
 * @returns Drive root to pass as `drive`.
 */
export function portableDriveRoot(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  const unified = trimmed.replace(/\\/g, "/");
  const marker = unified.search(/\/_Serato_(\/|$)/i);
  const base = marker >= 0 ? unified.slice(0, marker) : unified.replace(/\/+$/, "");
  const volumes = /^\/Volumes\/[^/]+/.exec(base);
  if (volumes) return volumes[0];
  const media = /^\/(?:run\/)?media\/[^/]+\/[^/]+/.exec(base);
  if (media) return media[0];
  const mnt = /^\/mnt\/[^/]+/.exec(base);
  if (mnt) return mnt[0];
  const unc = /^(?:\/\/)[^/]+\/[^/]+/.exec(base);
  if (unc) return trimmed.includes("\\") ? unc[0].replace(/\//g, "\\") : unc[0];
  const win = /^[A-Za-z]:/.exec(trimmed);
  if (win) return `${win[0]}${trimmed.includes("\\") ? "\\" : "/"}`;
  return marker >= 0 ? (trimmed.includes("\\") ? base.replace(/\//g, "\\") : base) : trimmed;
}

/**
 * Removable Serato roots, split into connected and unplugged.
 *
 * An unplugged drive is named, not treated as a missing file. Two
 * folders on the same volume become one choice. This does not look at
 * the disk.
 *
 * @param roots Music roots from GET /api/library-roots.
 * @returns Connected drives for the picker, and unplugged names.
 */
export function portableSeratoRoots(roots: readonly LibraryRoot[]): {
  connected: LibraryRoot[];
  missing: LibraryRoot[];
} {
  const connected: LibraryRoot[] = [];
  const missing: LibraryRoot[] = [];
  const seen = new Set<string>();
  for (const root of roots) {
    if (!root.removable || !root.serato) continue;
    const key = portableDriveRoot(root.path).replace(/\\/g, "/").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (root.missing) missing.push(root);
    else connected.push(root);
  }
  return { connected, missing };
}

/**
 * Accept a drive-check payload. A wrong shape is null, not a throw.
 *
 * @param value JSON body.
 * @returns The report, or null when the contract fields are missing.
 */
export function parseDriveReport(value: unknown): DriveReport | null {
  if (!isRecord(value)) return null;
  if (typeof value.ready !== "boolean" || typeof value.missing_drive !== "boolean") return null;
  if (typeof value.summary !== "string") return null;
  if (!Array.isArray(value.findings) || !Array.isArray(value.errors)) return null;
  const findings: DriveFinding[] = [];
  for (const item of value.findings) {
    if (!isRecord(item) || typeof item.kind !== "string" || typeof item.fix !== "string") return null;
    findings.push({
      kind: item.kind,
      crate: text(item.crate),
      track: text(item.track),
      path: text(item.path),
      found: text(item.found),
      fix: item.fix,
    });
  }
  const errors: DriveError[] = [];
  for (const item of value.errors) {
    if (!isRecord(item) || typeof item.message !== "string") return null;
    errors.push({ crate: text(item.crate), message: item.message });
  }
  return {
    drive: text(value.drive),
    name: text(value.name),
    ready: value.ready,
    missing_drive: value.missing_drive,
    summary: value.summary,
    findings,
    errors,
  };
}

/**
 * Button for one removable Serato root.
 *
 * @param name Label the person sees, used in the tooltip.
 * @param path Music-folder path. The request uses the volume root.
 * @returns The button. It does not open the folder.
 */
export function portableDriveButton(name: string, path: string): HTMLButtonElement {
  const button = buttonEl(portableCheck(name));
  button.className = "files-portable";
  button.dataset.portableName = name;
  button.textContent = t("portable.check");
  button.setAttribute("aria-label", t("portable.checkLabel", { name }));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    void openPortableCheck(path, button);
  });
  return button;
}

/**
 * Ask for the read-only report and show it in the dialog.
 *
 * @param path Music root or drive path.
 * @param trigger Control to focus when the dialog closes.
 * @returns {Promise<void>}
 */
export async function openPortableCheck(path: string, trigger?: HTMLElement): Promise<void> {
  wirePortable();
  runPortableMount();
  opener = trigger ?? null;
  const dialog = el("portable-dialog");
  if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  await runPortableCheck(path);
}

/**
 * Load connected Serato drives and check the one in the picker.
 *
 * Used by the Before a gig view. The dialog stays closed. An unplugged
 * drive is named under the picker and is not listed as a missing file.
 *
 * @returns {Promise<void>}
 */
export async function loadPortableView(): Promise<void> {
  wirePortable();
  beginBusy();
  paintStatus(t("portable.checking"));
  let settle: "report" | "retry" | "none" = "none";
  try {
    const payload = await fetchLibraryRoots();
    lastRoots = payload.roots;
    paintDrivePicker(lastRoots);
    const path = el("portable-drive").value;
    if (!path) {
      clearReport();
      el("portable-view-status").textContent = hasConnected ? "" : t("portable.noDrive");
      el("portable-status").textContent = hasConnected ? "" : t("portable.noDrive");
      return;
    }
    await runPortableCheck(path);
    settle = "report";
  } catch (error) {
    fail(error instanceof Error && error.message ? error.message : t("portable.unreadable"));
    settle = "retry";
  } finally {
    if (!islandRoot) return;
    endBusy();
    if (settle === "retry") el("portable-check").focus();
    if (settle === "report") el("portable-view-verdict").focus();
  }
}

/**
 * Show a drive-check failure in the view status line.
 *
 * The report already on screen stays. Focus moves to Check drive.
 *
 * @param error Failure from loadPortableView.
 * @returns {void}
 */
export function showPortableFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("portable.unreadable");
  fail(message);
  endBusy();
  el("portable-check").focus();
}

/**
 * Paint the last report again in the active language.
 *
 * The server's summary and fix sentences stay as they arrived. Kind
 * labels and the verdict are translated. File rows are left alone.
 *
 * @returns {void}
 */
export function repaintPortable(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(".files-portable")) {
    button.textContent = t("portable.check");
    const name = button.dataset.portableName ?? "";
    if (name) button.setAttribute("aria-label", t("portable.checkLabel", { name }));
  }
  el("portable-check").textContent = t("portable.check");
  if (lastRoots.length) paintDrivePicker(lastRoots);
  if (latest) renderPortableReport(latest);
}

/**
 * Close control and the Before a gig picker. Safe to call more than once.
 *
 * @returns {void}
 */
export function wirePortable(): void {
  const dialog = el("portable-dialog");
  if (dialog.dataset.portableWired !== "true") {
    dialog.dataset.portableWired = "true";
    el("portable-close").addEventListener("click", () => {
      el("portable-dialog").close();
      if (opener?.isConnected) opener.focus();
    });
  }
  const panel = el("portable-panel");
  if (panel.dataset.portableWired === "true") return;
  panel.dataset.portableWired = "true";
  el("portable-check").addEventListener("click", () => {
    void runPortableCheck(el("portable-drive").value);
  });
  el("portable-drive").addEventListener("change", () => {
    void runPortableCheck(el("portable-drive").value);
  });
  el("portable-smart-copy").addEventListener("click", () => {
    void copyPortableSmart(false);
  });
  el("portable-smart-restore").addEventListener("click", () => {
    void previewPortableRestore();
  });
  el("portable-smart-confirm").addEventListener("click", () => {
    void confirmPortableRestore();
  });
  el("portable-smart-overwrite").addEventListener("click", () => {
    void overwritePortableSmart();
  });
  islandRoot = mountIsland(el("portable-view-findings"), createElement(PortableFindings));
}

/**
 * Unmount the Check-drive Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountPortable(): void {
  token += 1;
  if (!islandRoot) return;
  try {
    islandRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  islandRoot = null;
}

/**
 * Paint the Before a gig panel and notify the Files dialog.
 *
 * The dialog reads `portableSnapshot` through FilesContext. Verdict and
 * summary stay page chrome. Findings are the Check-drive Data Grid.
 *
 * @param report Parsed drive-check body.
 * @returns {void}
 */
export function renderPortableReport(report: DriveReport): void {
  latest = report;
  const verdictText = report.missing_drive
    ? t("portable.missing")
    : report.ready
      ? t("portable.ready")
      : t("portable.notReady");
  el("portable-view-verdict").textContent = verdictText;
  el("portable-view-summary").textContent = report.summary;
  el("portable-view-status").textContent = "";
  statusText = "";
  emitPortable();
}

/**
 * Ask GET /api/drive-check for one volume. Does not write.
 *
 * @param path Music root or drive path.
 * @returns {Promise<void>}
 */
export async function runPortableCheck(path: string): Promise<void> {
  wirePortable();
  const drive = portableDriveRoot(path);
  const mine = ++token;
  latest = null;
  lastDrive = drive;
  showConfirm = false;
  showOverwrite = false;
  stickDrive = drive;
  stickReport = null;
  stickStatus = "";
  clearReport();
  paintStatus(t("portable.checking"));
  paintSmartButtons();
  if (!drive) {
    fail(t("portable.unreadable"));
    return;
  }
  beginBusy();
  try {
    const response = await fetch(`/api/drive-check?drive=${encodeURIComponent(drive)}`);
    if (mine !== token) return;
    const body: unknown = await readJSON<unknown>(response).catch((): null => null);
    if (mine !== token) return;
    if (!response.ok) {
      fail(serverMessage(errorBody(body), t("portable.unreadable")));
      return;
    }
    const report = parseDriveReport(body);
    if (!report) {
      fail(t("portable.unreadable"));
      return;
    }
    latest = report;
    paintStatus("");
    renderPortableReport(report);
  } catch {
    if (mine !== token) return;
    fail(t("portable.unreachable"));
  } finally {
    if (mine === token) endBusy();
  }
}

function paintDrivePicker(roots: readonly LibraryRoot[]): void {
  const { connected, missing } = portableSeratoRoots(roots);
  hasConnected = connected.length > 0;
  const select = el("portable-drive");
  const previous = select.value;
  const options = connected.map((root) => {
    const option = document.createElement("option");
    option.value = root.path;
    option.textContent = root.label;
    return option;
  });
  select.replaceChildren(...options);
  const keep = connected.some((root) => root.path === previous) ? previous : (connected[0]?.path ?? "");
  select.value = keep;
  select.disabled = !hasConnected;
  el("portable-check").disabled = !hasConnected;
  paintSmartButtons();
  const note = el("portable-offline");
  if (!missing.length) {
    note.textContent = "";
    return;
  }
  note.textContent = missing.map((root) => t("portable.offlineNamed", { name: root.label })).join(" ");
}

function fail(message: string): void {
  latest = null;
  clearReport();
  paintStatus(message);
}

function clearReport(): void {
  el("portable-view-verdict").textContent = "";
  el("portable-view-summary").textContent = "";
}

function paintStatus(message: string): void {
  statusText = message;
  el("portable-view-status").textContent = message;
  emitPortable();
}

function beginBusy(): void {
  busy = true;
  const button = el("portable-check");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("portable-panel").setAttribute("aria-busy", "true");
  paintSmartButtons();
  emitPortable();
}

function endBusy(): void {
  busy = false;
  const button = el("portable-check");
  button.disabled = !hasConnected;
  button.setAttribute("aria-busy", "false");
  el("portable-panel").setAttribute("aria-busy", "false");
  paintSmartButtons();
  emitPortable();
}

/** Where the click came from. The dialog keeps the drive that was checked. */
export type SmartSource = "panel" | "dialog";

/**
 * Copy smart crates onto the selected drive.
 *
 * @param overwrite True replaces a drive file that already uses the name.
 * @param source Panel uses the picker. Dialog uses the drive that was checked.
 * @returns {Promise<void>}
 */
export async function copyPortableSmart(
  overwrite: boolean,
  source: SmartSource = "panel",
): Promise<void> {
  await runSmart("copy", overwrite ? { overwrite: true } : {}, source);
}

/**
 * Preview a restore. Nothing is written.
 *
 * @param source Panel uses the picker. Dialog uses the drive that was checked.
 * @returns {Promise<void>}
 */
export async function previewPortableRestore(source: SmartSource = "panel"): Promise<void> {
  await runSmart("preview", {}, source);
}

/**
 * Write the previewed restore. Quit Serato first.
 *
 * @param source Panel uses the picker. Dialog uses the drive that was checked.
 * @returns {Promise<void>}
 */
export async function confirmPortableRestore(source: SmartSource = "panel"): Promise<void> {
  await runSmart("restore", { confirm: true }, source);
}

/**
 * Replace smart-crate files already on the drive.
 *
 * @param source Panel uses the picker. Dialog uses the drive that was checked.
 * @returns {Promise<void>}
 */
export async function overwritePortableSmart(source: SmartSource = "panel"): Promise<void> {
  await runSmart("copy", { overwrite: true }, source);
}

function selectedDrive(source: SmartSource): string {
  if (source === "panel") {
    const node = document.getElementById("portable-drive");
    if (node instanceof HTMLSelectElement && node.value) {
      const root = portableDriveRoot(node.value);
      if (root) return root;
    }
  }
  return lastDrive;
}

async function runSmart(
  action: "preview" | "copy" | "restore",
  extra: { overwrite?: boolean; confirm?: boolean },
  source: SmartSource,
): Promise<void> {
  const drive = selectedDrive(source);
  if (!drive) {
    paintStatus(t("portable.unreadable"));
    return;
  }
  lastDrive = drive;
  beginBusy();
  paintStatus(t("portable.smartBusy"));
  try {
    const result = await postPortableSmart(drive, action, extra);
    showConfirm = false;
    showOverwrite = false;
    const crates = result.crates ?? [];
    if (result.action === "copy") {
      showOverwrite = result.needs_overwrite === true;
    } else if (result.action === "preview" || (result.needs_confirm === true && result.written !== true)) {
      showConfirm = crates.some((crate) => (
        crate.status === "create" || crate.status === "update" || crate.status === "needs_confirm"
      ));
    }
    paintStatus(smartStatus(result));
  } catch (error) {
    showConfirm = false;
    showOverwrite = false;
    paintStatus(error instanceof Error && error.message ? error.message : t("portable.unreadable"));
  } finally {
    endBusy();
  }
}

function smartStatus(result: PortableSmartResult): string {
  if (result.ok === false) return result.detail || t("portable.unreadable");
  const crates = result.crates ?? [];
  const fallback = crates.filter((crate) => (
    crate.mode === "fallback"
    && crate.status !== "skip"
    && crate.status !== "nothing"
    && crate.name
  ));
  const bits: string[] = [];
  if (result.action === "copy") {
    if (result.written) bits.push(t("portable.smartCopied"));
    if (result.needs_overwrite) bits.push(t("portable.smartKept"));
    if (!bits.length) bits.push(t("portable.smartNothing"));
  } else if (result.action === "preview") {
    bits.push(result.needs_confirm ? t("portable.smartNeedsConfirm") : t("portable.smartPreview"));
  } else if (result.written) {
    bits.push(t("portable.smartRestored"));
  } else if (result.needs_confirm) {
    bits.push(t("portable.smartNeedsConfirm"));
  } else {
    bits.push(t("portable.smartNothing"));
  }
  if (fallback.length) {
    bits.push(`${fallback.map((crate) => crate.name).join(", ")}. ${t("portable.smartFallback")}`);
  }
  return bits.join(" ");
}

function paintSmartButtons(): void {
  const locked = busy || !hasConnected;
  el("portable-smart-copy").disabled = locked;
  el("portable-smart-restore").disabled = locked;
  el("portable-smart-confirm").disabled = locked;
  el("portable-smart-overwrite").disabled = locked;
  el("portable-smart-confirm").hidden = !showConfirm;
  el("portable-smart-overwrite").hidden = !showOverwrite;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function errorBody(value: unknown): { error?: string; code?: string } | null {
  if (!isRecord(value)) return null;
  const body: { error?: string; code?: string } = {};
  if (typeof value.error === "string") body.error = value.error;
  if (typeof value.code === "string") body.code = value.code;
  if (body.error === undefined && body.code === undefined) return null;
  return body;
}
