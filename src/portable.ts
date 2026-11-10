/**
 * Read-only check for a portable Serato drive.
 *
 * Organize files shows Check drive on a removable Serato root. Before a
 * gig shows the same check: pick a connected drive with a `_Serato_`
 * folder. The request is GET /api/drive-check for the volume that
 * contains that folder. Nothing on the drive is written. A later reply
 * is ignored when a newer check has started.
 */

import { fetchLibraryRoots, readJSON } from "./api";
import type { LibraryRoot } from "./api-types";
import { el } from "./dom";
import { serverMessage, t, type MessageKey } from "./i18n";
import { buttonEl } from "./tooltip";
import { portableCheck } from "./tooltip-strings";

/** Findings painted before the rest are counted as "and more". */
export const FINDING_CAP = 100;

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

const KIND_KEY: Readonly<Record<string, MessageKey>> = {
  off_drive: "portable.kindOffDrive",
  missing: "portable.kindMissing",
  smart_crate: "portable.kindSmartCrate",
  unsafe_name: "portable.kindUnsafeName",
  path_length: "portable.kindPathLength",
  file_size: "portable.kindFileSize",
};

let token = 0;
let latest: DriveReport | null = null;
let lastRoots: LibraryRoot[] = [];
let opener: HTMLElement | null = null;
let hasConnected = false;

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
}

/**
 * Paint the verdict, the summary, and the finding lines.
 *
 * The Files dialog and the Before a gig panel share this painter.
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
  const items = findingItems(report);
  for (const surface of surfaces()) {
    surface.verdict.textContent = verdictText;
    surface.summary.textContent = report.summary;
    surface.findings.replaceChildren(...items.map((item) => item.cloneNode(true) as HTMLLIElement));
    surface.status.textContent = "";
  }
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
  clearReport();
  paintStatus(t("portable.checking"));
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
  const note = el("portable-offline");
  if (!missing.length) {
    note.textContent = "";
    return;
  }
  note.textContent = missing.map((root) => t("portable.offlineNamed", { name: root.label })).join(" ");
}

function findingItems(report: DriveReport): HTMLLIElement[] {
  const items: HTMLLIElement[] = [];
  const shown = report.findings.slice(0, FINDING_CAP);
  for (const finding of shown) {
    const row = document.createElement("li");
    const kind = document.createElement("span");
    kind.className = "portable-kind";
    kind.textContent = kindLabel(finding.kind);
    row.append(kind);
    if (finding.fix) {
      row.append(document.createTextNode(" "));
      const fix = document.createElement("span");
      fix.className = "portable-fix";
      fix.textContent = finding.fix;
      row.append(fix);
    }
    items.push(row);
  }
  for (const error of report.errors) {
    const row = document.createElement("li");
    row.textContent = error.crate ? `${error.crate}: ${error.message}` : error.message;
    items.push(row);
  }
  const hidden = report.findings.length - shown.length;
  if (hidden > 0) {
    const row = document.createElement("li");
    row.textContent = t("files.andMore", { count: hidden });
    items.push(row);
  }
  return items;
}

function surfaces(): Array<{
  verdict: HTMLParagraphElement;
  summary: HTMLParagraphElement;
  findings: HTMLUListElement;
  status: HTMLParagraphElement;
}> {
  return [
    {
      verdict: el("portable-verdict"),
      summary: el("portable-summary"),
      findings: el("portable-findings"),
      status: el("portable-status"),
    },
    {
      verdict: el("portable-view-verdict"),
      summary: el("portable-view-summary"),
      findings: el("portable-view-findings"),
      status: el("portable-view-status"),
    },
  ];
}

function kindLabel(kind: string): string {
  const key = KIND_KEY[kind];
  return key ? t(key) : kind;
}

function fail(message: string): void {
  latest = null;
  clearReport();
  paintStatus(message);
}

function clearReport(): void {
  for (const surface of surfaces()) {
    surface.verdict.textContent = "";
    surface.summary.textContent = "";
    surface.findings.replaceChildren();
  }
}

function paintStatus(message: string): void {
  for (const surface of surfaces()) surface.status.textContent = message;
}

function beginBusy(): void {
  const button = el("portable-check");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("portable-panel").setAttribute("aria-busy", "true");
}

function endBusy(): void {
  const button = el("portable-check");
  button.disabled = !hasConnected;
  button.setAttribute("aria-busy", "false");
  el("portable-panel").setAttribute("aria-busy", "false");
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
