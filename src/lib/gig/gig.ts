/**
 * Read-only gig check engine.
 *
 * Typed against the fields GET /api/gig-check returns. The request does
 * not write. A newer selection ignores a late response. The report is
 * painted by `GigReport` on `GigContext`. Five steps lead to a done
 * screen. #gig-ready-art is the empty slot for the done artwork Pixel
 * supplies.
 *
 * Page text is in the locale catalogs under gig.*. The report sentences
 * the server writes (holding_it_back, snapshot_note, empty-crate
 * warnings) stay in English, as the Rekordbox loss report does.
 */

import { createElement } from "react";
import { readJSON } from "../api";
import type { GigReport } from "../api-types";
import { mountIsland } from "../../app/mount";
import { GigReport as GigReportView } from "../../pages/GigReport";
import type { GigSnapshot } from "../../containers/GigContext";
import { el } from "../dom";
import { GIG_STEP_COUNT, gigScopeLabel } from "./gig-view";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

type GigListener = (snapshot: GigSnapshot) => void;

const listeners = new Set<GigListener>();

let stepIndex = 0;
let latest: GigReport | null = null;
let checkedAt: Date | null = null;
let exitGig: () => void = () => {};

function emit(): void {
  const snapshot = getGigSnapshot();
  for (const listener of listeners) listener(snapshot);
}

function focusHeading(): void {
  const headingNode = document.getElementById("gig-step-heading");
  if (headingNode instanceof HTMLElement) headingNode.focus();
}

function beginBusy(): void {
  const button = el("gig-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("gig-panel").setAttribute("aria-busy", "true");
  el("gig-status").textContent = t("gig.checking");
}

function endBusy(): void {
  const button = el("gig-refresh");
  button.disabled = false;
  button.setAttribute("aria-busy", "false");
  el("gig-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("gig-status").textContent = message;
}

function updateScope(payload: GigReport): void {
  el("gig-scope").textContent = gigScopeLabel(payload);
}

/**
 * Return a copy of the gig-check snapshot.
 *
 * @returns The current report, step, and check time.
 */
export function getGigSnapshot(): GigSnapshot {
  return { report: latest, stepIndex, checkedAt };
}

/**
 * Run a callback after each gig-check change.
 *
 * The callback is not run immediately. Call `getGigSnapshot` for the
 * current snapshot. The returned function removes the callback.
 *
 * @param listener Called with a snapshot. Do not mutate it.
 * @returns Unsubscribes the listener.
 */
export function subscribeGig(listener: GigListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Advance one gig step, or stay on the done screen.
 *
 * @returns {void}
 */
export function nextGigStep(): void {
  if (!latest) return;
  stepIndex = Math.min(stepIndex + 1, GIG_STEP_COUNT);
  emit();
  focusHeading();
}

/**
 * Go back one gig step.
 *
 * @returns {void}
 */
export function backGigStep(): void {
  if (!latest) return;
  stepIndex = Math.max(0, stepIndex - 1);
  emit();
  focusHeading();
}

/**
 * Leave the Gig view through the handler `wireGigCheck` stored.
 *
 * @returns {void}
 */
export function exitGigCheck(): void {
  exitGig();
}

/**
 * Attach Check again and mount the React report.
 *
 * Called once at startup. A later call only replaces the exit handler.
 *
 * @param exit Leaves the Gig view.
 * @returns {void}
 */
export function wireGigCheck(exit: () => void): void {
  exitGig = exit;
  const panel = el("gig-panel");
  if (panel.dataset.gigWired === "true") return;
  panel.dataset.gigWired = "true";
  el("gig-refresh").addEventListener("click", () => {
    void loadGigCheck(true);
  });
  mountIsland(el("gig-report"), createElement(GigReportView));
}

/**
 * Ask for a read-only gig check of the open space and crate.
 *
 * The previous report stays on screen until this reply arrives. The
 * Check again button is disabled while the request runs.
 *
 * @param keepStep Keep the step the person is on. Check again passes true.
 * @returns {Promise<void>}
 */
export async function loadGigCheck(keepStep = false): Promise<void> {
  const token = ++state.gigToken;
  if (!keepStep) stepIndex = 0;
  beginBusy();
  let settle: "heading" | "retry" | "none" = "none";
  const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/gig-check?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.gigToken) return;
    const payload = await readJSON<GigReport>(response).catch((): null => null);
    if (token !== state.gigToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("gig.unreadable")));
      settle = "retry";
      return;
    }
    checkedAt = new Date();
    latest = payload;
    el("gig-status").textContent = "";
    updateScope(payload);
    emit();
    settle = "heading";
  } catch {
    if (token !== state.gigToken) return;
    failStatus(t("gig.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.gigToken) return;
    endBusy();
    if (settle === "retry") el("gig-refresh").focus();
    if (settle === "heading") focusHeading();
  }
}

/**
 * Show a gig-check failure in the status line, not in the track detail.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param {unknown} error Failure from loadGigCheck.
 * @returns {void}
 */
export function showGigFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("gig.unreadable");
  failStatus(message);
  endBusy();
  el("gig-refresh").focus();
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched,
 * and the step the person is on is kept.
 *
 * @returns {void}
 */
export function repaintGig(): void {
  if (!latest) return;
  updateScope(latest);
  emit();
}
