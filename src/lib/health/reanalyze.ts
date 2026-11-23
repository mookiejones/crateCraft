/**
 * Re-analyze in Serato: mark tracks unanalyzed so Serato rebuilds grids.
 *
 * GET /api/reanalyze is read-only and needs a crate. POST preview then
 * apply with confirm writes through safe_write with Serato closed.
 * Markers2 cues stay. Default clears BeatGrid and Autotags. A newer
 * selection ignores a late response. ReanalyzePanel paints a Data Grid.
 *
 * Page text is in the locale catalogs under reanalyze.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { ReanalyzePlan } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { ReanalyzePanel } from "../../pages/ReanalyzePanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: ReanalyzePlan | null = null;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

/**
 * Attach Check again, Preview, and Confirm.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireReanalyze(): void {
  const panel = el("reanalyze-panel");
  if (panel.dataset.reanalyzeWired === "true") return;
  panel.dataset.reanalyzeWired = "true";
  el("reanalyze-refresh").addEventListener("click", () => {
    void loadReanalyze();
  });
  el("reanalyze-preview").addEventListener("click", () => {
    void previewReanalyze();
  });
  el("reanalyze-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-reanalyze-action]");
    if (!button || button.disabled) return;
    if (button.dataset.reanalyzeAction === "confirm") void applyReanalyze();
  });
}

/**
 * Ask for a read-only re-analyze plan of the open crate.
 *
 * @returns {Promise<void>}
 */
export async function loadReanalyze(): Promise<void> {
  const token = ++state.reanalyzeToken;
  beginBusy("check");
  let settle: "report" | "retry" | "none" = "none";
  if (state.activeCrate === "all") {
    failStatus(t("error.reanalyze_needs_crate"));
    endBusy();
    el("reanalyze-refresh").focus();
    return;
  }
  const crate = String(state.activeCrate);
  const clearFrames = clearFramesOn();
  const includeLocked = includeLockedOn();
  try {
    const response = await fetch(
      `/api/reanalyze?space=${encodeURIComponent(state.space)}`
        + `&crate=${encodeURIComponent(crate)}`
        + `&clear_frames=${clearFrames ? "1" : "0"}`
        + `&include_locked=${includeLocked ? "1" : "0"}`,
    );
    if (token !== state.reanalyzeToken) return;
    const payload = await readJSON<ReanalyzePlan>(response).catch((): null => null);
    if (token !== state.reanalyzeToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("reanalyze.loadFailed")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("reanalyze-status").textContent = "";
    renderReanalyzeReport(payload);
    settle = "report";
  } catch {
    if (token !== state.reanalyzeToken) return;
    failStatus(t("reanalyze.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.reanalyzeToken) return;
    endBusy();
    if (settle === "retry") el("reanalyze-refresh").focus();
    if (settle === "report") el("reanalyze-report").focus();
  }
}

/**
 * Show a re-analyze failure in the status line.
 *
 * @param error Failure from loadReanalyze.
 * @returns {void}
 */
export function showReanalyzeFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("reanalyze.loadFailed");
  failStatus(message);
  endBusy();
  el("reanalyze-refresh").focus();
}

/**
 * Paint the counts and the Data Grid.
 *
 * @param payload JSON from GET or POST /api/reanalyze.
 * @returns {void}
 */
export function renderReanalyzeReport(payload: ReanalyzePlan): void {
  el("reanalyze-scope").textContent = scopeLabel();
  const report = el("reanalyze-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(ReanalyzePanel, {
      payload,
      writable: state.writable,
      confirmReady: Boolean(payload.preview && payload.count && state.writable),
    }),
    reportRoot,
  );
}

/**
 * Unmount the Re-analyze Data Grid island.
 *
 * @returns {void}
 */
export function unmountReanalyze(): void {
  state.reanalyzeToken += 1;
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
 * @returns {void}
 */
export function repaintReanalyze(): void {
  el("reanalyze-scope").textContent = scopeLabel();
  if (latest) renderReanalyzeReport(latest);
}

async function previewReanalyze(): Promise<void> {
  if (state.activeCrate === "all") {
    failStatus(t("error.reanalyze_needs_crate"));
    return;
  }
  const token = ++state.reanalyzeToken;
  beginBusy("preview");
  try {
    const payload = await postJSON<ReanalyzePlan>("/api/reanalyze", {
      action: "preview",
      space: state.space,
      crate: state.activeCrate,
      clear_frames: clearFramesOn(),
      include_locked: includeLockedOn(),
    });
    if (token !== state.reanalyzeToken) return;
    latest = payload;
    el("reanalyze-status").textContent = payload.count
      ? t("reanalyze.previewReady", { count: payload.count })
      : t("reanalyze.previewEmpty");
    renderReanalyzeReport(payload);
    el("reanalyze-report").focus();
  } catch (error) {
    if (token !== state.reanalyzeToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    el("reanalyze-preview").focus();
  } finally {
    if (token !== state.reanalyzeToken) return;
    endBusy();
  }
}

async function applyReanalyze(): Promise<void> {
  if (state.activeCrate === "all" || !latest?.count || !state.writable) return;
  if (!latest.preview) return;
  const token = ++state.reanalyzeToken;
  const crate = state.activeCrate;
  beginBusy("apply");
  try {
    const payload = await postJSON<ReanalyzePlan>("/api/reanalyze", {
      action: "apply",
      confirm: true,
      space: state.space,
      crate,
      clear_frames: clearFramesOn(),
      include_locked: includeLockedOn(),
    });
    if (token !== state.reanalyzeToken) return;
    if (isQueuedWrite(payload)) {
      el("reanalyze-status").textContent = t("gigLock.queued");
      return;
    }
    const writtenCount = payload.written ? payload.count : 0;
    await bridge.reloadLibrary();
    if (token !== state.reanalyzeToken) return;
    latest = payload;
    el("reanalyze-status").textContent = writtenCount
      ? t("reanalyze.written", { count: writtenCount })
      : "";
    renderReanalyzeReport(payload);
    el("reanalyze-report").focus();
  } catch (error) {
    if (token !== state.reanalyzeToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("reanalyze-preview").focus();
  } finally {
    if (token !== state.reanalyzeToken) return;
    endBusy();
  }
}

function clearFramesOn(): boolean {
  const input = document.getElementById("reanalyze-clear-frames") as HTMLInputElement | null;
  return input?.checked !== false;
}

function includeLockedOn(): boolean {
  const input = document.getElementById("reanalyze-include-locked") as HTMLInputElement | null;
  return input?.checked === true;
}

function beginBusy(kind: "check" | "preview" | "apply"): void {
  for (const id of ["reanalyze-refresh", "reanalyze-preview"] as const) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("reanalyze-panel").setAttribute("aria-busy", "true");
  if (kind === "check") el("reanalyze-status").textContent = t("reanalyze.checking");
  if (kind === "preview") el("reanalyze-status").textContent = t("reanalyze.previewing");
  if (kind === "apply") el("reanalyze-status").textContent = t("reanalyze.applying");
}

function endBusy(): void {
  for (const id of ["reanalyze-refresh", "reanalyze-preview"] as const) {
    const button = el(id);
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
  el("reanalyze-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("reanalyze-status").textContent = message;
}

function scopeLabel(): string {
  if (state.activeCrate === "all") return t("crates.allTracks");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("crates.allTracks");
}
