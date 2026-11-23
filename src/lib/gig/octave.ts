/**
 * BPM-check report engine.
 *
 * Typed against the fields GET /api/bpm-sanity returns. The check itself
 * does not write. A newer selection ignores a late response. The report
 * is painted by `OctaveReport` on `GigContext`. A check needs a crate.
 * ×2 and ÷2 go through `octave-apply.ts` after a confirm.
 *
 * Page text is in the locale catalogs under octave.*.
 */

import { createElement } from "react";
import { readJSON } from "../api";
import type { BpmSanityReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import type { OctaveSnapshot } from "../../containers/GigContext";
import { OctaveReport as OctaveReportView } from "../../pages/OctaveReport";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { state } from "../state";
import { onOctaveBusy, onOctaveReload } from "./octave-apply";
import { octaveScopeLabel } from "./octave-view";

type OctaveListener = (snapshot: OctaveSnapshot) => void;

const listeners = new Set<OctaveListener>();

let latest: BpmSanityReport | null = null;
let busy = false;
let islandRoot: IslandRoot | null = null;

function emit(): void {
  const snapshot = getOctaveSnapshot();
  for (const listener of listeners) listener(snapshot);
}

function setOctaveBusy(value: boolean): void {
  busy = value;
  emit();
}

function beginBusy(): void {
  const button = el("octave-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("octave-panel").setAttribute("aria-busy", "true");
  el("octave-status").textContent = t("octave.checking");
}

function endBusy(): void {
  const button = el("octave-refresh");
  button.disabled = state.activeCrate === "all";
  button.setAttribute("aria-busy", "false");
  el("octave-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("octave-status").textContent = message;
}

function updateScope(): void {
  el("octave-scope").textContent = octaveScopeLabel();
}

/**
 * Return a copy of the BPM-check snapshot.
 *
 * @returns The current report, scope label, and whether a fix is in progress.
 */
export function getOctaveSnapshot(): OctaveSnapshot {
  return { report: latest, scope: octaveScopeLabel(), busy };
}

/**
 * Run a callback after each BPM-check change.
 *
 * The callback is not run immediately. Call `getOctaveSnapshot` for the
 * current snapshot. The returned function removes the callback.
 *
 * @param listener Called with a snapshot. Do not mutate it.
 * @returns Unsubscribes the listener.
 */
export function subscribeOctave(listener: OctaveListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Attach Check again and mount the React report.
 *
 * Called once at startup. A later call is a no-op. Also registers the
 * reload and busy hooks the row buttons use.
 *
 * @returns {void}
 */
export function wireOctave(): void {
  const panel = el("octave-panel");
  if (panel.dataset.octaveWired === "true") return;
  panel.dataset.octaveWired = "true";
  onOctaveReload(() => loadOctave());
  onOctaveBusy(setOctaveBusy);
  el("octave-refresh").addEventListener("click", () => {
    void loadOctave();
  });
  islandRoot = mountIsland(el("octave-report"), createElement(OctaveReportView));
}

/**
 * Unmount the BPM-check Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 * A pending load is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountOctave(): void {
  state.octaveToken += 1;
  if (!islandRoot) return;
  try {
    islandRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  islandRoot = null;
}

/**
 * Ask for a read-only BPM check of the open crate.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. A whole-space check is
 * refused before the request.
 *
 * @returns {Promise<void>}
 */
export async function loadOctave(): Promise<void> {
  const token = ++state.octaveToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  if (state.activeCrate === "all") {
    failStatus(t("error.bpm_needs_crate"));
    endBusy();
    updateScope();
    emit();
    el("octave-refresh").focus();
    return;
  }
  const crate = String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/bpm-sanity?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.octaveToken) return;
    const payload = await readJSON<BpmSanityReport>(response).catch((): null => null);
    if (token !== state.octaveToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("octave.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("octave-status").textContent = "";
    updateScope();
    emit();
    settle = "report";
  } catch {
    if (token !== state.octaveToken) return;
    failStatus(t("octave.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.octaveToken) return;
    endBusy();
    if (settle === "retry") el("octave-refresh").focus();
    if (settle === "report") el("octave-report").focus();
  }
}

/**
 * Show a BPM-check failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadOctave.
 * @returns {void}
 */
export function showOctaveFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("octave.unreadable");
  failStatus(message);
  endBusy();
  el("octave-refresh").focus();
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintOctave(): void {
  updateScope();
  emit();
}
