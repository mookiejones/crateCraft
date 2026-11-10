/**
 * Suspect-quality (fake 320) report view.
 *
 * GET /api/bitrate-check is read-only. POST preview lists a crate of
 * flagged tracks. POST create writes that crate through safe_write with
 * Serato closed. A newer selection ignores a late response. The report
 * is painted with text nodes. A check needs a crate because it decodes.
 *
 * Page text is in the locale catalogs under bitrate.*.
 */

import { failureOf, postJSON, readJSON } from "./api";
import type { BitrateCheckReport, BitrateCratePlan, BitrateSuspect } from "./api-types";
import { bridge } from "./bridge";
import { el } from "./dom";
import { serverMessage, t, type MessageKey } from "./i18n";
import { state } from "./state";
import { buttonEl } from "./tooltip";
import { tips } from "./tooltip-strings";

const LIST_CAP = 100;
const REASON_ORDER = ["upsampled", "lossy_source"] as const;

const REASON_KEYS: Record<string, MessageKey> = {
  upsampled: "bitrate.reason.upsampled",
  lossy_source: "bitrate.reason.lossy_source",
};

let latest: BitrateCheckReport | null = null;
let cratePlan: BitrateCratePlan | null = null;

/**
 * Attach Check again, Save crate, and Confirm crate.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireBitrate(): void {
  const panel = el("bitrate-panel");
  if (panel.dataset.bitrateWired === "true") return;
  panel.dataset.bitrateWired = "true";
  el("bitrate-refresh").addEventListener("click", () => {
    void loadBitrate();
  });
  el("bitrate-save").addEventListener("click", () => {
    void previewCrate();
  });
  el("bitrate-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-bitrate-action]");
    if (!button || button.disabled) return;
    if (button.dataset.bitrateAction === "confirm") void createCrate();
  });
}

/**
 * Ask for a read-only bitrate check of the open crate.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. A whole-space check is
 * refused before the request.
 *
 * @returns {Promise<void>}
 */
export async function loadBitrate(): Promise<void> {
  const token = ++state.bitrateToken;
  cratePlan = null;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  if (state.activeCrate === "all") {
    failStatus(t("error.bitrate_needs_crate"));
    endBusy();
    el("bitrate-refresh").focus();
    return;
  }
  const crate = String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/bitrate-check?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.bitrateToken) return;
    const payload = await readJSON<BitrateCheckReport>(response).catch((): null => null);
    if (token !== state.bitrateToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("bitrate.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("bitrate-status").textContent = "";
    renderBitrateReport(payload);
    settle = "report";
  } catch {
    if (token !== state.bitrateToken) return;
    failStatus(t("bitrate.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.bitrateToken) return;
    endBusy();
    if (settle === "retry") el("bitrate-refresh").focus();
    if (settle === "report") el("bitrate-report").focus();
  }
}

/**
 * Show a bitrate-check failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadBitrate.
 * @returns {void}
 */
export function showBitrateFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("bitrate.unreadable");
  failStatus(message);
  endBusy();
  el("bitrate-refresh").focus();
}

/**
 * Paint the counts and the flagged-track list.
 *
 * Color is not the only signal: each row names the reason in words.
 *
 * @param payload JSON from GET /api/bitrate-check.
 * @returns {void}
 */
export function renderBitrateReport(payload: BitrateCheckReport): void {
  el("bitrate-scope").textContent = scopeLabel();
  const report = el("bitrate-report");
  const suspects = payload.suspects || [];
  const summary = document.createElement("p");
  summary.className = "gig-note";
  summary.textContent = suspects.length
    ? t("bitrate.summary", { checked: payload.checked, count: suspects.length })
    : t("bitrate.summaryClear", { checked: payload.checked });
  report.replaceChildren(summary);
  if (payload.not_found) {
    report.append(noteLine(t("bitrate.notFound", { count: payload.not_found })));
  }
  if (payload.unreadable) {
    report.append(noteLine(t("bitrate.unreadableFiles", { count: payload.unreadable })));
  }
  if (payload.unchecked) {
    report.append(noteLine(t("bitrate.unchecked", { count: payload.unchecked })));
  }
  if (payload.too_quiet) {
    report.append(noteLine(t("bitrate.tooQuiet", { count: payload.too_quiet })));
  }
  if (!suspects.length) {
    report.append(noteLine(t("bitrate.empty")));
    paintPlan(report);
    return;
  }
  for (const kind of reasonKinds(suspects)) {
    const rows = suspects.filter((item) => item.reason === kind);
    report.append(detailsGroup(reasonHeading(kind), rows.map(suspectLine)));
  }
  paintPlan(report);
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintBitrate(): void {
  el("bitrate-scope").textContent = scopeLabel();
  if (latest) renderBitrateReport(latest);
}

async function previewCrate(): Promise<void> {
  if (state.activeCrate === "all") {
    failStatus(t("error.bitrate_needs_crate"));
    el("bitrate-refresh").focus();
    return;
  }
  const token = ++state.bitrateToken;
  beginBusy("preview");
  try {
    const payload = await postJSON<BitrateCratePlan>("/api/bitrate-check", {
      action: "preview",
      space: state.space,
      crate: state.activeCrate,
    });
    if (token !== state.bitrateToken) return;
    cratePlan = payload;
    latest = payload;
    el("bitrate-status").textContent = payload.added
      ? t("bitrate.preview", { count: payload.added, name: payload.name })
      : t("bitrate.previewEmpty");
    renderBitrateReport(payload);
    const confirm = el("bitrate-report").querySelector<HTMLButtonElement>("[data-bitrate-action='confirm']");
    (confirm ?? el("bitrate-save")).focus();
  } catch (error) {
    if (token !== state.bitrateToken) return;
    failStatus(failureOf(error).message);
    el("bitrate-save").focus();
  } finally {
    if (token !== state.bitrateToken) return;
    endBusy();
  }
}

async function createCrate(): Promise<void> {
  if (!cratePlan || !cratePlan.added || state.activeCrate === "all") return;
  const token = ++state.bitrateToken;
  beginBusy("create");
  try {
    const payload = await postJSON<BitrateCratePlan>("/api/bitrate-check", {
      action: "create",
      space: state.space,
      crate: state.activeCrate,
    });
    if (token !== state.bitrateToken) return;
    await bridge.reloadLibrary();
    if (token !== state.bitrateToken) return;
    cratePlan = payload;
    latest = payload;
    el("bitrate-status").textContent = payload.written
      ? t("bitrate.written", { count: payload.added, name: payload.name })
      : t("bitrate.previewEmpty");
    renderBitrateReport(payload);
    el("bitrate-report").focus();
  } catch (error) {
    if (token !== state.bitrateToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("bitrate-save").focus();
  } finally {
    if (token !== state.bitrateToken) return;
    endBusy();
  }
}

function beginBusy(kind: "check" | "preview" | "create" = "check"): void {
  for (const id of ["bitrate-refresh", "bitrate-save"] as const) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("bitrate-panel").setAttribute("aria-busy", "true");
  const status = kind === "create"
    ? t("bitrate.saving")
    : kind === "preview"
      ? t("bitrate.checking")
      : t("bitrate.checking");
  el("bitrate-status").textContent = status;
}

function endBusy(): void {
  const noCrate = state.activeCrate === "all";
  const refresh = el("bitrate-refresh");
  refresh.disabled = noCrate;
  refresh.setAttribute("aria-busy", "false");
  const save = el("bitrate-save");
  const flagged = Boolean(latest?.suspects.length);
  save.disabled = noCrate || !flagged;
  save.setAttribute("aria-busy", "false");
  el("bitrate-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("bitrate-status").textContent = message;
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

function reasonKinds(suspects: BitrateSuspect[]): string[] {
  const seen = new Set(suspects.map((item) => item.reason));
  const known = REASON_ORDER.filter((kind) => seen.has(kind));
  const extra = [...seen].filter((kind) => !REASON_ORDER.includes(kind as (typeof REASON_ORDER)[number])).sort();
  return [...known, ...extra];
}

function reasonHeading(kind: string): string {
  return t(REASON_KEYS[kind] ?? "bitrate.reason.unknown");
}

function suspectLine(item: BitrateSuspect): string {
  const title = [item.artist, item.name].filter(Boolean).join(" — ") || item.file;
  const reason = reasonHeading(item.reason);
  const detail = item.stated_kbps != null && item.estimated_kbps != null
    ? t("bitrate.detail", { stated: item.stated_kbps, estimated: item.estimated_kbps })
    : item.estimated_kbps != null
      ? t("bitrate.detailEstimate", { estimated: item.estimated_kbps })
      : "";
  return t("bitrate.row", { title, file: item.file, reason, detail });
}

function paintPlan(report: HTMLElement): void {
  if (!cratePlan) return;
  if (cratePlan.written && cratePlan.saved) {
    report.append(noteLine(t("bitrate.written", { count: cratePlan.added, name: cratePlan.name })));
    return;
  }
  if (!cratePlan.added) {
    report.append(noteLine(t("bitrate.previewEmpty")));
    return;
  }
  report.append(noteLine(t("bitrate.preview", { count: cratePlan.added, name: cratePlan.name })));
  const confirm = buttonEl(tips.bitrateConfirm);
  confirm.dataset.bitrateAction = "confirm";
  confirm.textContent = t("bitrate.confirmCrate");
  confirm.disabled = !state.writable;
  report.append(confirm);
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
