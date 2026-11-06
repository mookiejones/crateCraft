/**
 * Read-only damaged-file scan view.
 *
 * Typed against the fields GET /api/file-scan returns. The request does
 * not write. A newer selection ignores a late response. The report is
 * painted with text nodes. A full decode needs a crate.
 *
 * Page text is in the locale catalogs under scan.*.
 */

import { readJSON } from "./api";
import type { FileScanProblem, FileScanReport } from "./api-types";
import { el } from "./dom";
import { serverMessage, t, type MessageKey } from "./i18n";
import { state } from "./state";
import { buttonEl } from "./tooltip";
import { tips } from "./tooltip-strings";

const LIST_CAP = 100;
const PROBLEM_ORDER = [
  "empty",
  "unreadable",
  "wrong_format",
  "serato_flagged",
  "undecodable",
  "decode_error",
  "short",
] as const;

const PROBLEM_KEYS: Record<string, MessageKey> = {
  empty: "scan.problem.empty",
  unreadable: "scan.problem.unreadable",
  wrong_format: "scan.problem.wrong_format",
  serato_flagged: "scan.problem.serato_flagged",
  undecodable: "scan.problem.undecodable",
  decode_error: "scan.problem.decode_error",
  short: "scan.problem.short",
};

type ScanDepth = "quick" | "full";

let latest: FileScanReport | null = null;
let lastDepth: ScanDepth = "quick";

/**
 * Attach Quick check and Full decode.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireScan(): void {
  const panel = el("scan-panel");
  if (panel.dataset.scanWired === "true") return;
  panel.dataset.scanWired = "true";
  el("scan-quick").addEventListener("click", () => {
    void loadScan("quick");
  });
  el("scan-full").addEventListener("click", () => {
    void loadScan("full");
  });
}

/**
 * Ask for a read-only file check of the open space and crate.
 *
 * The previous report stays on screen until this reply arrives. Both
 * check buttons are disabled while the request runs. A full decode of
 * the whole space is refused before the request.
 *
 * @param depth `quick` reads headers; `full` also decodes. Omit to
 *     repeat the last depth, falling back to quick when no crate is
 *     selected.
 * @returns {Promise<void>}
 */
export async function loadScan(depth?: ScanDepth): Promise<void> {
  const chosen = resolveDepth(depth);
  const token = ++state.scanToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  if (chosen === "full" && state.activeCrate === "all") {
    failStatus(t("error.scan_full_needs_crate"));
    endBusy();
    el("scan-full").focus();
    return;
  }
  lastDepth = chosen;
  const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/file-scan?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}&depth=${encodeURIComponent(chosen)}`,
    );
    if (token !== state.scanToken) return;
    const payload = await readJSON<FileScanReport>(response).catch((): null => null);
    if (token !== state.scanToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("scan.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("scan-status").textContent = "";
    renderScanReport(payload);
    settle = "report";
  } catch {
    if (token !== state.scanToken) return;
    failStatus(t("scan.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.scanToken) return;
    endBusy();
    if (settle === "retry") el("scan-quick").focus();
    if (settle === "report") el("scan-report").focus();
  }
}

/**
 * Show a scan failure in the status line.
 *
 * The report already on screen stays. Focus moves to Quick check.
 *
 * @param error Failure from loadScan.
 * @returns {void}
 */
export function showScanFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("scan.unreadable");
  failStatus(message);
  endBusy();
  el("scan-quick").focus();
}

/**
 * Paint the counts and the damaged-file list.
 *
 * Color is not the only signal: each row names the problem in words.
 *
 * @param payload JSON from GET /api/file-scan.
 * @returns {void}
 */
export function renderScanReport(payload: FileScanReport): void {
  el("scan-scope").textContent = scopeLabel();
  const report = el("scan-report");
  const problems = payload.problems || [];
  const summary = document.createElement("p");
  summary.className = "gig-note";
  summary.textContent = problems.length
    ? t("scan.summary", { checked: payload.checked, count: problems.length })
    : t("scan.summaryClear", { checked: payload.checked });
  report.replaceChildren(summary);
  if (payload.not_found) {
    report.append(noteLine(t("scan.notFound", { count: payload.not_found })));
  }
  if (payload.unchecked) {
    report.append(noteLine(t("scan.unchecked", { count: payload.unchecked })));
  }
  if (!problems.length) {
    report.append(noteLine(t("scan.empty")));
    return;
  }
  for (const kind of problemKinds(problems)) {
    const rows = problems.filter((item) => item.problem === kind);
    report.append(detailsGroup(problemHeading(kind), rows.map(problemLine)));
  }
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintScan(): void {
  el("scan-scope").textContent = scopeLabel();
  if (latest) renderScanReport(latest);
}

function resolveDepth(depth: ScanDepth | undefined): ScanDepth {
  if (depth === "quick" || depth === "full") return depth;
  if (lastDepth === "full" && state.activeCrate === "all") return "quick";
  return lastDepth;
}

function beginBusy(): void {
  for (const id of ["scan-quick", "scan-full"] as const) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("scan-panel").setAttribute("aria-busy", "true");
  el("scan-status").textContent = t("scan.checking");
}

function endBusy(): void {
  el("scan-quick").disabled = false;
  el("scan-quick").setAttribute("aria-busy", "false");
  const full = el("scan-full");
  full.disabled = state.activeCrate === "all";
  full.setAttribute("aria-busy", "false");
  el("scan-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("scan-status").textContent = message;
}

function scopeLabel(): string {
  if (state.activeCrate === "all") return t("gig.wholeSpace");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("gig.wholeSpace");
}

function noteLine(text: string): HTMLParagraphElement {
  const line = document.createElement("p");
  line.className = "gig-note";
  line.textContent = text;
  return line;
}

function problemKinds(problems: FileScanProblem[]): string[] {
  const seen = new Set(problems.map((item) => item.problem));
  const known = PROBLEM_ORDER.filter((kind) => seen.has(kind));
  const extra = [...seen].filter((kind) => !PROBLEM_ORDER.includes(kind as (typeof PROBLEM_ORDER)[number])).sort();
  return [...known, ...extra];
}

function problemHeading(kind: string): string {
  return t(PROBLEM_KEYS[kind] ?? "scan.problem.unknown");
}

function problemLine(item: FileScanProblem): string {
  const title = [item.artist, item.name].filter(Boolean).join(" — ") || item.file;
  const label = problemDetail(item);
  return t("scan.row", { title, file: item.file, problem: label });
}

function problemDetail(item: FileScanProblem): string {
  const heading = problemHeading(item.problem);
  if (item.problem === "wrong_format" && item.detail) {
    return t("scan.wrongFormatDetail", { detail: item.detail });
  }
  if ((item.problem === "decode_error" || item.problem === "short") && item.detail) {
    return t(item.problem === "short" ? "scan.shortDetail" : "scan.decodeErrorDetail", {
      detail: item.detail,
    });
  }
  if (item.problem === "serato_flagged" && item.detail) {
    return `${heading}: ${item.detail}`;
  }
  return heading;
}

function detailsGroup(label: string, lines: string[]): HTMLDetailsElement {
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = true;
  const summary = document.createElement("summary");
  summary.textContent = t("gig.groupCount", { label, count: lines.length });
  const list = document.createElement("ul");
  const shown = lines.slice(0, LIST_CAP);
  for (const line of shown) list.append(item(line));
  details.append(summary, list);
  if (lines.length > LIST_CAP) {
    const show = buttonEl(tips.gigShowAll);
    show.className = "gig-show-all";
    show.textContent = t("gig.showAll", { count: lines.length });
    show.addEventListener("click", () => {
      list.replaceChildren();
      for (const line of lines) list.append(item(line));
      show.remove();
    });
    details.append(show);
  }
  return details;
}

function item(text: string): HTMLLIElement {
  const row = document.createElement("li");
  row.textContent = text;
  return row;
}
