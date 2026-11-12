/**
 * Suspect-quality (fake 320) report view.
 *
 * GET /api/bitrate-check is read-only. POST preview lists a crate of
 * flagged tracks. POST create writes that crate through safe_write with
 * Serato closed. A newer selection ignores a late response. BitrateReport
 * paints a Data Grid. A check needs a crate because it decodes.
 *
 * Page text is in the locale catalogs under bitrate.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import type { BitrateCheckReport, BitrateCratePlan } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { BitrateReport } from "../../pages/BitrateReport";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: BitrateCheckReport | null = null;
let cratePlan: BitrateCratePlan | null = null;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

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
 * Paint the counts and the flagged-track Data Grid.
 *
 * Color is not the only signal: each row names the reason in words.
 *
 * @param payload JSON from GET /api/bitrate-check.
 * @returns {void}
 */
export function renderBitrateReport(payload: BitrateCheckReport): void {
  el("bitrate-scope").textContent = scopeLabel();
  const report = el("bitrate-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(BitrateReport, {
      payload,
      cratePlan,
      writable: state.writable,
    }),
    reportRoot,
  );
}

/**
 * Unmount the Suspect-quality Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountBitrate(): void {
  state.bitrateToken += 1;
  if (!reportRoot) return;
  try {
    reportRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  reportRoot = undefined;
  reportHost = null;
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
