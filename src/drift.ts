/**
 * Read-only tempo-drift report view.
 *
 * Typed against the fields GET /api/tempo-drift returns. The request
 * does not write. A newer selection ignores a late response. The report
 * is painted with text nodes. A check needs a crate because it decodes.
 *
 * Page text is in the locale catalogs under drift.*.
 */

import { readJSON } from "./api";
import type { TempoDriftFlag, TempoDriftReport } from "./api-types";
import { el } from "./dom";
import { serverMessage, t, type MessageKey } from "./i18n";
import { state } from "./state";
import { buttonEl } from "./tooltip";
import { tips } from "./tooltip-strings";

const LIST_CAP = 100;
const REASON_ORDER = ["drifting", "live", "pending_map"] as const;

const REASON_KEYS: Record<string, MessageKey> = {
  drifting: "drift.reason.drifting",
  live: "drift.reason.live",
  pending_map: "drift.reason.pending_map",
};

let latest: TempoDriftReport | null = null;

/**
 * Attach Check again.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireDrift(): void {
  const panel = el("drift-panel");
  if (panel.dataset.driftWired === "true") return;
  panel.dataset.driftWired = "true";
  el("drift-refresh").addEventListener("click", () => {
    void loadDrift();
  });
}

/**
 * Ask for a read-only tempo check of the open crate.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. A whole-space check is
 * refused before the request.
 *
 * @returns {Promise<void>}
 */
export async function loadDrift(): Promise<void> {
  const token = ++state.driftToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  if (state.activeCrate === "all") {
    failStatus(t("error.tempo_needs_crate"));
    endBusy();
    el("drift-refresh").focus();
    return;
  }
  const crate = String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/tempo-drift?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.driftToken) return;
    const payload = await readJSON<TempoDriftReport>(response).catch((): null => null);
    if (token !== state.driftToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("drift.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("drift-status").textContent = "";
    renderDriftReport(payload);
    settle = "report";
  } catch {
    if (token !== state.driftToken) return;
    failStatus(t("drift.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.driftToken) return;
    endBusy();
    if (settle === "retry") el("drift-refresh").focus();
    if (settle === "report") el("drift-report").focus();
  }
}

/**
 * Show a tempo-check failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadDrift.
 * @returns {void}
 */
export function showDriftFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("drift.unreadable");
  failStatus(message);
  endBusy();
  el("drift-refresh").focus();
}

/**
 * Paint the counts and the flagged-track list.
 *
 * Color is not the only signal: each row names the reasons in words.
 *
 * @param payload JSON from GET /api/tempo-drift.
 * @returns {void}
 */
export function renderDriftReport(payload: TempoDriftReport): void {
  el("drift-scope").textContent = scopeLabel();
  const report = el("drift-report");
  const flags = payload.flags || [];
  const summary = document.createElement("p");
  summary.className = "gig-note";
  summary.textContent = flags.length
    ? t("drift.summary", { checked: payload.checked, count: flags.length })
    : t("drift.summaryClear", { checked: payload.checked });
  report.replaceChildren(summary);
  if (payload.not_found) {
    report.append(noteLine(t("drift.notFound", { count: payload.not_found })));
  }
  if (payload.unreadable) {
    report.append(noteLine(t("drift.unreadableFiles", { count: payload.unreadable })));
  }
  if (payload.unchecked) {
    report.append(noteLine(t("drift.unchecked", { count: payload.unchecked })));
  }
  if (payload.too_quiet) {
    report.append(noteLine(t("drift.tooQuiet", { count: payload.too_quiet })));
  }
  if (payload.mapped) {
    report.append(noteLine(t("drift.mapped", { count: payload.mapped })));
  }
  if (!flags.length) {
    report.append(noteLine(t("drift.empty")));
    return;
  }
  for (const kind of reasonKinds(flags)) {
    const rows = flags.filter((item) => item.reasons.includes(kind));
    report.append(detailsGroup(reasonHeading(kind), rows.map(flagLine)));
  }
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintDrift(): void {
  el("drift-scope").textContent = scopeLabel();
  if (latest) renderDriftReport(latest);
}

function beginBusy(): void {
  const button = el("drift-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("drift-panel").setAttribute("aria-busy", "true");
  el("drift-status").textContent = t("drift.checking");
}

function endBusy(): void {
  const button = el("drift-refresh");
  button.disabled = state.activeCrate === "all";
  button.setAttribute("aria-busy", "false");
  el("drift-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("drift-status").textContent = message;
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

function reasonKinds(flags: TempoDriftFlag[]): string[] {
  const seen = new Set(flags.flatMap((item) => item.reasons));
  const known = REASON_ORDER.filter((kind) => seen.has(kind));
  const extra = [...seen].filter((kind) => !REASON_ORDER.includes(kind as (typeof REASON_ORDER)[number])).sort();
  return [...known, ...extra];
}

function reasonHeading(kind: string): string {
  return t(REASON_KEYS[kind] ?? "drift.reason.unknown");
}

function flagLine(item: TempoDriftFlag): string {
  const title = [item.artist, item.name].filter(Boolean).join(" — ") || item.file;
  const reasons = item.reasons.map(reasonHeading).join(", ");
  const bpm = item.bpm_min != null && item.bpm_max != null
    ? t("drift.bpmRange", { min: item.bpm_min, max: item.bpm_max })
    : "";
  return t("drift.row", { title, file: item.file, reasons, bpm });
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
