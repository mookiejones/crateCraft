/**
 * Gain changed: non-zero Autotags Gain dB.
 *
 * GET /api/gain lists tracks. POST preview does not write. POST create
 * with confirm writes Gain changed under crateCraft. POST reset with
 * confirm sets Gain dB to 0 through safe_write with Serato closed.
 * A newer selection ignores a late response. GainChangedPanel paints
 * a Data Grid. The view covers the whole space.
 *
 * Page text is in the locale catalogs under gain.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { GainChangedPlan, GainChangedReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { GainChangedPanel } from "../../pages/GainChangedPanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: GainChangedReport | null = null;
let cratePlan: GainChangedPlan | null = null;
let resetPlan: GainChangedPlan | null = null;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

const BUTTONS = ["gain-refresh", "gain-save", "gain-reset"] as const;

/**
 * Attach Check again, Save crate, Reset, and Confirm actions.
 */
export function wireGainChanged(): void {
  const panel = el("gain-panel");
  if (panel.dataset.gainWired === "true") return;
  panel.dataset.gainWired = "true";
  el("gain-refresh").addEventListener("click", () => {
    void loadGainChanged();
  });
  el("gain-save").addEventListener("click", () => {
    void previewCrate();
  });
  el("gain-reset").addEventListener("click", () => {
    void previewReset();
  });
  el("gain-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-gain-action]");
    if (!button || button.disabled) return;
    if (button.dataset.gainAction === "confirm-crate") void createCrate();
    if (button.dataset.gainAction === "confirm-reset") void applyReset();
  });
}

/**
 * Ask for a scan of the open space.
 */
export async function loadGainChanged(): Promise<void> {
  const token = ++state.gainToken;
  cratePlan = null;
  resetPlan = null;
  beginBusy("check");
  let settle: "report" | "retry" | "none" = "none";
  try {
    const response = await fetch(
      `/api/gain?space=${encodeURIComponent(state.space)}`,
    );
    if (token !== state.gainToken) return;
    const payload = await readJSON<GainChangedReport>(response).catch((): null => null);
    if (token !== state.gainToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("gain.loadFailed")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("gain-status").textContent = "";
    renderGainChangedReport(payload);
    settle = "report";
  } catch {
    if (token !== state.gainToken) return;
    failStatus(t("gain.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.gainToken) return;
    endBusy();
    if (settle === "retry") el("gain-refresh").focus();
    if (settle === "report") el("gain-report").focus();
  }
}

/**
 * Show a scan failure in the status line.
 */
export function showGainChangedFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("gain.loadFailed");
  failStatus(message);
  endBusy();
  el("gain-refresh").focus();
}

/**
 * Paint the counts and the non-zero-gain Data Grid.
 */
export function renderGainChangedReport(payload: GainChangedReport): void {
  el("gain-scope").textContent = t("gig.wholeSpace");
  const report = el("gain-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(GainChangedPanel, {
      payload,
      cratePlan,
      resetPlan,
      writable: state.writable,
    }),
    reportRoot,
  );
}

/**
 * Unmount the Gain-changed Data Grid island.
 */
export function unmountGainChanged(): void {
  state.gainToken += 1;
  if (reportRoot) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = null;
  latest = null;
  cratePlan = null;
  resetPlan = null;
}

/**
 * Repaint from the last report after a language change.
 */
export function repaintGainChanged(): void {
  el("gain-scope").textContent = t("gig.wholeSpace");
  if (latest) renderGainChangedReport(latest);
}

async function previewCrate(): Promise<void> {
  if (!latest?.changed?.length || !state.writable) return;
  const token = ++state.gainToken;
  resetPlan = null;
  beginBusy("save");
  try {
    const payload = await postJSON<GainChangedPlan>("/api/gain", {
      action: "create",
      space: state.space,
    });
    if (token !== state.gainToken) return;
    if (isQueuedWrite(payload)) {
      el("gain-status").textContent = t("gigLock.queued");
      return;
    }
    cratePlan = payload;
    latest = payload;
    el("gain-status").textContent = "";
    renderGainChangedReport(payload);
    el("gain-report").focus();
  } catch (error) {
    if (token !== state.gainToken) return;
    failStatus(failureOf(error).message);
    el("gain-save").focus();
  } finally {
    if (token !== state.gainToken) return;
    endBusy();
  }
}

async function createCrate(): Promise<void> {
  if (!state.writable) return;
  const token = ++state.gainToken;
  beginBusy("confirm");
  try {
    const payload = await postJSON<GainChangedPlan>("/api/gain", {
      action: "create",
      space: state.space,
      confirm: true,
    });
    if (token !== state.gainToken) return;
    if (isQueuedWrite(payload)) {
      el("gain-status").textContent = t("gigLock.queued");
      return;
    }
    cratePlan = payload;
    resetPlan = null;
    latest = payload;
    el("gain-status").textContent = "";
    renderGainChangedReport(payload);
    if (payload.written) await bridge.reloadLibrary();
    if (token !== state.gainToken) return;
    el("gain-report").focus();
  } catch (error) {
    if (token !== state.gainToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("gain-save").focus();
  } finally {
    if (token !== state.gainToken) return;
    endBusy();
  }
}

async function previewReset(): Promise<void> {
  if (!latest?.changed?.length || !state.writable) return;
  const token = ++state.gainToken;
  cratePlan = null;
  beginBusy("reset");
  try {
    const payload = await postJSON<GainChangedPlan>("/api/gain", {
      action: "preview",
      space: state.space,
    });
    if (token !== state.gainToken) return;
    resetPlan = payload;
    latest = payload;
    el("gain-status").textContent = "";
    renderGainChangedReport(payload);
    el("gain-report").focus();
  } catch (error) {
    if (token !== state.gainToken) return;
    failStatus(failureOf(error).message);
    el("gain-reset").focus();
  } finally {
    if (token !== state.gainToken) return;
    endBusy();
  }
}

async function applyReset(): Promise<void> {
  if (!state.writable) return;
  const token = ++state.gainToken;
  beginBusy("confirm-reset");
  try {
    const payload = await postJSON<GainChangedPlan>("/api/gain", {
      action: "reset",
      space: state.space,
      confirm: true,
    });
    if (token !== state.gainToken) return;
    if (isQueuedWrite(payload)) {
      el("gain-status").textContent = t("gigLock.queued");
      return;
    }
    resetPlan = payload;
    cratePlan = null;
    latest = payload;
    el("gain-status").textContent = "";
    renderGainChangedReport(payload);
    el("gain-report").focus();
  } catch (error) {
    if (token !== state.gainToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("gain-reset").focus();
  } finally {
    if (token !== state.gainToken) return;
    endBusy();
  }
}

function beginBusy(kind: "check" | "save" | "confirm" | "reset" | "confirm-reset"): void {
  el("gain-panel").setAttribute("aria-busy", "true");
  for (const id of BUTTONS) el(id).setAttribute("disabled", "true");
  const status = el("gain-status");
  if (kind === "check") status.textContent = t("gain.checking");
  else if (kind === "save") status.textContent = t("gain.saving");
  else if (kind === "confirm") status.textContent = t("gain.confirming");
  else if (kind === "reset" || kind === "confirm-reset") status.textContent = t("gain.resetting");
}

function endBusy(): void {
  el("gain-panel").setAttribute("aria-busy", "false");
  for (const id of BUTTONS) el(id).removeAttribute("disabled");
  if (!state.writable) {
    el("gain-save").setAttribute("disabled", "true");
    el("gain-reset").setAttribute("disabled", "true");
  }
}

function failStatus(message: string): void {
  el("gain-status").textContent = message;
}
