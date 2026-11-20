/**
 * Audio changed: a file replaced under the same path.
 *
 * GET /api/audio-changed records a first baseline and lists a later
 * size, duration, or hash change. POST preview does not write a crate.
 * POST create with confirm writes Audio changed through safe_write with
 * Serato closed. POST reanalyze never rewrites cues or the beatgrid.
 * An unplugged drive is not a swap. A newer selection ignores a late
 * response. AudioChangedPanel paints a Data Grid. The view covers the
 * whole space.
 *
 * Page text is in the locale catalogs under audio.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import { isQueuedWrite } from "../crates/queue-notice";
import type { AudioChangedPlan, AudioChangedReport, AudioReanalyzePlan } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { AudioChangedPanel } from "../../pages/AudioChangedPanel";
import { bridge } from "../bridge";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

let latest: AudioChangedReport | null = null;
let cratePlan: AudioChangedPlan | null = null;
let reanalyzePlan: AudioReanalyzePlan | null = null;
let reportRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

const BUTTONS = ["audio-refresh", "audio-save", "audio-reanalyze"] as const;

/**
 * Attach Check again, Save crate, Re-analyze, and Confirm crate.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireAudioChanged(): void {
  const panel = el("audio-panel");
  if (panel.dataset.audioWired === "true") return;
  panel.dataset.audioWired = "true";
  el("audio-refresh").addEventListener("click", () => {
    void loadAudioChanged();
  });
  el("audio-save").addEventListener("click", () => {
    void previewCrate();
  });
  el("audio-reanalyze").addEventListener("click", () => {
    void previewReanalyze();
  });
  el("audio-report").addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-audio-action]");
    if (!button || button.disabled) return;
    if (button.dataset.audioAction === "confirm") void createCrate();
  });
}

/**
 * Ask for a scan of the open space.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. The first baseline is not
 * a swap.
 *
 * @returns {Promise<void>}
 */
export async function loadAudioChanged(): Promise<void> {
  const token = ++state.audioToken;
  cratePlan = null;
  reanalyzePlan = null;
  beginBusy("check");
  let settle: "report" | "retry" | "none" = "none";
  try {
    const response = await fetch(
      `/api/audio-changed?space=${encodeURIComponent(state.space)}`,
    );
    if (token !== state.audioToken) return;
    const payload = await readJSON<AudioChangedReport>(response).catch((): null => null);
    if (token !== state.audioToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("audio.loadFailed")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("audio-status").textContent = "";
    renderAudioChangedReport(payload);
    settle = "report";
  } catch {
    if (token !== state.audioToken) return;
    failStatus(t("audio.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.audioToken) return;
    endBusy();
    if (settle === "retry") el("audio-refresh").focus();
    if (settle === "report") el("audio-report").focus();
  }
}

/**
 * Show a scan failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadAudioChanged.
 * @returns {void}
 */
export function showAudioChangedFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("audio.loadFailed");
  failStatus(message);
  endBusy();
  el("audio-refresh").focus();
}

/**
 * Paint the counts and the replaced-file Data Grid.
 *
 * @param payload JSON from GET /api/audio-changed.
 * @returns {void}
 */
export function renderAudioChangedReport(payload: AudioChangedReport): void {
  el("audio-scope").textContent = t("gig.wholeSpace");
  const report = el("audio-report");
  if (reportRoot && reportHost !== report) {
    reportRoot.unmount();
    reportRoot = undefined;
  }
  reportHost = report;
  reportRoot = mountIsland(
    report,
    createElement(AudioChangedPanel, {
      payload,
      cratePlan,
      reanalyzePlan,
      writable: state.writable,
    }),
    reportRoot,
  );
}

/**
 * Unmount the Audio-changed Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountAudioChanged(): void {
  state.audioToken += 1;
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
export function repaintAudioChanged(): void {
  el("audio-scope").textContent = t("gig.wholeSpace");
  if (latest) renderAudioChangedReport(latest);
}

async function previewCrate(): Promise<void> {
  if (!latest?.changed?.length || !state.writable) return;
  const token = ++state.audioToken;
  reanalyzePlan = null;
  beginBusy("save");
  try {
    const payload = await postJSON<AudioChangedPlan>("/api/audio-changed", {
      action: "preview",
      space: state.space,
    });
    if (token !== state.audioToken) return;
    if (isQueuedWrite(payload)) {
      el("audio-status").textContent = t("gigLock.queued");
      return;
    }
    cratePlan = payload;
    latest = payload;
    el("audio-status").textContent = "";
    renderAudioChangedReport(payload);
    el("audio-report").focus();
  } catch (error) {
    if (token !== state.audioToken) return;
    failStatus(failureOf(error).message);
    el("audio-save").focus();
  } finally {
    if (token !== state.audioToken) return;
    endBusy();
  }
}

async function createCrate(): Promise<void> {
  if (!state.writable) return;
  const token = ++state.audioToken;
  beginBusy("confirm");
  try {
    const payload = await postJSON<AudioChangedPlan>("/api/audio-changed", {
      action: "create",
      confirm: true,
      space: state.space,
    });
    if (token !== state.audioToken) return;
    if (isQueuedWrite(payload)) {
      el("audio-status").textContent = t("gigLock.queued");
      return;
    }
    cratePlan = payload;
    reanalyzePlan = null;
    latest = payload;
    const added = payload.added ?? 0;
    el("audio-status").textContent = payload.written
      ? t("audio.written", { count: added, name: payload.name ?? "" })
      : "";
    renderAudioChangedReport(payload);
    if (payload.written) await bridge.reloadLibrary();
    if (token !== state.audioToken) return;
    el("audio-report").focus();
  } catch (error) {
    if (token !== state.audioToken) return;
    const failed = failureOf(error);
    failStatus(failed.message);
    if (failed.status === 409) bridge.lockDown(error);
    el("audio-save").focus();
  } finally {
    if (token !== state.audioToken) return;
    endBusy();
  }
}

async function previewReanalyze(): Promise<void> {
  if (!latest?.changed?.length) return;
  const token = ++state.audioToken;
  beginBusy("reanalyze");
  try {
    const payload = await postJSON<AudioReanalyzePlan>("/api/audio-changed", {
      action: "reanalyze",
      space: state.space,
    });
    if (token !== state.audioToken) return;
    reanalyzePlan = payload;
    latest = payload;
    el("audio-status").textContent = "";
    renderAudioChangedReport(payload);
    el("audio-report").focus();
  } catch (error) {
    if (token !== state.audioToken) return;
    failStatus(failureOf(error).message);
    el("audio-reanalyze").focus();
  } finally {
    if (token !== state.audioToken) return;
    endBusy();
  }
}

function beginBusy(kind: "check" | "save" | "confirm" | "reanalyze"): void {
  for (const id of BUTTONS) {
    const button = el(id);
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-audio-action='confirm']")) {
    button.disabled = true;
  }
  el("audio-panel").setAttribute("aria-busy", "true");
  const status = kind === "save"
    ? t("audio.saving")
    : kind === "confirm"
      ? t("audio.confirming")
      : kind === "reanalyze"
        ? t("audio.reanalyzing")
        : t("audio.checking");
  el("audio-status").textContent = status;
}

function endBusy(): void {
  const refresh = el("audio-refresh");
  refresh.disabled = false;
  refresh.setAttribute("aria-busy", "false");
  const save = el("audio-save");
  save.disabled = !state.writable || !latest?.changed?.length;
  save.setAttribute("aria-busy", "false");
  const reanalyze = el("audio-reanalyze");
  reanalyze.disabled = !latest?.changed?.length;
  reanalyze.setAttribute("aria-busy", "false");
  el("audio-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("audio-status").textContent = message;
}
