/**
 * Stored gain: list non-zero Autotags gain and reset it to 0 dB.
 *
 * GET /api/gain-changed is read-only. POST create and reset write only
 * when confirm is true, with Serato closed. Reset reads the gain back
 * and rolls the snapshot back when it is not 0 dB. Undo puts that
 * snapshot back. GainChangedPanel paints the grid. The view covers the
 * whole space.
 *
 * Page text is in the locale catalogs under gain.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { GainChangedReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { GainChangedPanel } from "../../pages/GainChangedPanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { t } from "../i18n";
import { state } from "../state";

let latest: GainChangedReport | null = null;
let confirmCrate = false;
let confirmReset = false;
let snapshotId = "";
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

const BUTTONS = ["gain-refresh", "gain-save", "gain-reset", "gain-undo"] as const;

/**
 * Attach Check again, Save crate, Reset, Undo, and the confirm buttons.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireGainChanged(): void {
  const panel = el("gain-panel");
  if (panel.dataset.gainWired === "true") return;
  panel.dataset.gainWired = "true";
  el("gain-refresh").addEventListener("click", () => {
    void loadGainChanged();
  });
  el("gain-save").addEventListener("click", () => {
    confirmReset = false;
    confirmCrate = true;
    if (latest) renderGainChangedReport(latest);
    el("gain-report").focus();
  });
  el("gain-reset").addEventListener("click", () => {
    confirmCrate = false;
    confirmReset = true;
    if (latest) renderGainChangedReport(latest);
    el("gain-report").focus();
  });
  el("gain-undo").addEventListener("click", () => {
    void undoReset();
  });
  el("gain-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-gain-action]");
    if (!button || button.disabled) return;
    if (button.dataset.gainAction === "confirm-crate") void createCrate();
    if (button.dataset.gainAction === "confirm-reset") void resetGain();
  });
}

/**
 * Ask for a scan of the open space.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. Nothing is written.
 *
 * @returns {Promise<void>}
 */
export async function loadGainChanged(): Promise<void> {
  const token = ++state.gainToken;
  confirmCrate = false;
  confirmReset = false;
  beginBusy("check");
  let settle: "report" | "none" = "none";
  try {
    const response = await fetch(
      `/api/gain-changed?space=${encodeURIComponent(state.space)}`,
    );
    if (token !== state.gainToken) return;
    if (!response.ok) {
      const failed = await readJSON<GainChangedReport>(response).catch((): null => null);
      throw new Error(failed?.error || t("gain.loadFailed"));
    }
    const payload = await readJSON<GainChangedReport>(response).catch((): null => null);
    if (token !== state.gainToken) return;
    if (!payload || !Array.isArray(payload.tracks)) throw new Error(t("gain.loadFailed"));
    latest = payload;
    el("gain-status").textContent = "";
    renderGainChangedReport(payload);
    settle = "report";
  } catch (error) {
    if (token !== state.gainToken) return;
    showGainChangedFailure(error);
  } finally {
    if (token === state.gainToken) endBusy();
    if (settle === "report") el("gain-report").focus();
  }
}

/**
 * Show a scan or write failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from the gain view.
 * @returns {void}
 */
export function showGainChangedFailure(error: unknown): void {
  const failed = failureOf(error);
  const message = failed.message || t("gain.loadFailed");
  el("gain-status").textContent = message;
  endBusy();
  if (failed.status === 409) bridge.lockDown(error);
  el("gain-refresh").focus();
}

/**
 * Paint the counts and the gain Data Grid.
 *
 * @param payload JSON from GET /api/gain-changed.
 * @returns {void}
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
      confirmCrate,
      confirmReset,
      writable: state.writable,
    }),
    reportRoot,
  );
}

/**
 * Unmount the gain Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 *
 * @returns {void}
 */
export function unmountGainChanged(): void {
  state.gainToken += 1;
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
export function repaintGainChanged(): void {
  el("gain-scope").textContent = t("gig.wholeSpace");
  if (latest) renderGainChangedReport(latest);
}

async function createCrate(): Promise<void> {
  if (!state.writable || !latest?.tracks.length) return;
  const token = ++state.gainToken;
  beginBusy("crate");
  try {
    const payload = await postJSON<GainChangedReport>("/api/gain-changed", {
      action: "create",
      confirm: true,
      space: state.space,
    });
    if (token !== state.gainToken) return;
    if (isQueuedWrite(payload)) {
      el("gain-status").textContent = t("gigLock.queued");
      return;
    }
    confirmCrate = false;
    latest = payload;
    const added = payload.added ?? payload.tracks.length;
    el("gain-status").textContent = payload.written
      ? t("gain.writtenCrate", { count: added, folder: payload.folder, name: payload.name })
      : t("gain.previewEmpty");
    renderGainChangedReport(payload);
    if (payload.written) await bridge.reloadLibrary();
    if (token !== state.gainToken) return;
    el("gain-report").focus();
  } catch (error) {
    if (token !== state.gainToken) return;
    showGainChangedFailure(error);
  } finally {
    if (token === state.gainToken) endBusy();
  }
}

async function resetGain(): Promise<void> {
  if (!state.writable || !latest?.tracks.length) return;
  const token = ++state.gainToken;
  beginBusy("reset");
  try {
    const payload = await postJSON<GainChangedReport>("/api/gain-changed", {
      action: "reset",
      confirm: true,
      space: state.space,
    });
    if (token !== state.gainToken) return;
    if (isQueuedWrite(payload)) {
      el("gain-status").textContent = t("gigLock.queued");
      return;
    }
    confirmReset = false;
    snapshotId = payload.snapshot_id || snapshotId;
    latest = payload;
    const count = payload.reset ?? 0;
    el("gain-status").textContent = payload.written
      ? t("gain.resetDone", { count })
      : t("gain.previewEmpty");
    renderGainChangedReport(payload);
    el("gain-report").focus();
  } catch (error) {
    if (token !== state.gainToken) return;
    showGainChangedFailure(error);
  } finally {
    if (token === state.gainToken) endBusy();
  }
}

async function undoReset(): Promise<void> {
  if (!state.writable || !snapshotId) return;
  const token = ++state.gainToken;
  beginBusy("undo");
  try {
    const payload = await postJSON<GainChangedReport>("/api/gain-changed", {
      action: "undo",
      confirm: true,
      snapshot_id: snapshotId,
      space: state.space,
    });
    if (token !== state.gainToken) return;
    if (isQueuedWrite(payload)) {
      el("gain-status").textContent = t("gigLock.queued");
      return;
    }
    snapshotId = "";
    await loadGainChanged();
    el("gain-status").textContent = t("gain.undone");
  } catch (error) {
    if (token !== state.gainToken) return;
    showGainChangedFailure(error);
  } finally {
    if (token === state.gainToken) endBusy();
  }
}

function beginBusy(kind: "check" | "crate" | "reset" | "undo"): void {
  for (const id of BUTTONS) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  el("gain-panel").setAttribute("aria-busy", "true");
  const status = kind === "crate"
    ? t("gain.saving")
    : kind === "reset"
      ? t("gain.resetting")
      : kind === "undo"
        ? t("gain.undoing")
        : t("gain.checking");
  el("gain-status").textContent = status;
}

function endBusy(): void {
  const refresh = el("gain-refresh");
  refresh.disabled = false;
  refresh.setAttribute("aria-busy", "false");
  const listed = Boolean(latest?.tracks.length);
  const save = el("gain-save");
  save.disabled = !state.writable || !listed;
  save.setAttribute("aria-busy", "false");
  const reset = el("gain-reset");
  reset.disabled = !state.writable || !listed;
  reset.setAttribute("aria-busy", "false");
  const undo = el("gain-undo");
  undo.disabled = !state.writable || !snapshotId;
  undo.setAttribute("aria-busy", "false");
  el("gain-panel").setAttribute("aria-busy", "false");
}
