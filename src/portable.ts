/**
 * Read-only check for a portable Serato drive.
 *
 * The Files page shows Check drive on a removable Serato root. The
 * request is GET /api/drive-check for the volume that contains that
 * folder. Nothing on the drive is written. A later reply is ignored
 * when a newer check has started.
 */

import { readJSON } from "./api";
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
let opener: HTMLElement | null = null;
let wired = false;

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
 * Ask for the read-only report and show it.
 *
 * @param path Music root or drive path.
 * @param trigger Control to focus when the dialog closes.
 * @returns {Promise<void>}
 */
export async function openPortableCheck(path: string, trigger?: HTMLElement): Promise<void> {
  wirePortable();
  const drive = portableDriveRoot(path);
  const mine = ++token;
  opener = trigger ?? null;
  const dialog = el("portable-dialog");
  latest = null;
  el("portable-verdict").textContent = "";
  el("portable-summary").textContent = "";
  el("portable-findings").replaceChildren();
  el("portable-status").textContent = t("portable.checking");
  if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  if (!drive) {
    el("portable-status").textContent = t("portable.unreadable");
    return;
  }
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
    el("portable-status").textContent = "";
    renderPortableReport(report);
  } catch {
    if (mine !== token) return;
    fail(t("portable.unreachable"));
  }
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
  if (latest) renderPortableReport(latest);
}

/**
 * Close control. Safe to call more than once.
 *
 * @returns {void}
 */
export function wirePortable(): void {
  if (wired) return;
  wired = true;
  el("portable-close").addEventListener("click", () => {
    el("portable-dialog").close();
    if (opener?.isConnected) opener.focus();
  });
}

/**
 * Paint the verdict, the summary, and the finding lines.
 *
 * @param report Parsed drive-check body.
 * @returns {void}
 */
export function renderPortableReport(report: DriveReport): void {
  latest = report;
  const verdict = el("portable-verdict");
  if (report.missing_drive) verdict.textContent = t("portable.missing");
  else if (report.ready) verdict.textContent = t("portable.ready");
  else verdict.textContent = t("portable.notReady");
  el("portable-summary").textContent = report.summary;
  const list = el("portable-findings");
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
  list.replaceChildren(...items);
}

function kindLabel(kind: string): string {
  const key = KIND_KEY[kind];
  return key ? t(key) : kind;
}

function fail(message: string): void {
  latest = null;
  el("portable-verdict").textContent = "";
  el("portable-summary").textContent = "";
  el("portable-findings").replaceChildren();
  el("portable-status").textContent = message;
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
