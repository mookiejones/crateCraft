/**
 * Read-only tempo-drift report engine.
 *
 * Typed against the fields GET /api/tempo-drift returns. The request
 * does not write. A newer selection ignores a late response. The report
 * is painted by `DriftReport` on `GigContext`. A check needs a crate
 * because it decodes.
 *
 * Page text is in the locale catalogs under drift.*.
 */

import { createElement } from "react";
import { readJSON } from "../api";
import type { TempoDriftReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { DriftReport as DriftReportView } from "../../pages/DriftReport";
import type { DriftSnapshot } from "../../containers/GigContext";
import { el } from "../dom";
import { driftScopeLabel } from "./drift-view";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

type DriftListener = (snapshot: DriftSnapshot) => void;

const listeners = new Set<DriftListener>();

let latest: TempoDriftReport | null = null;
let islandRoot: IslandRoot | null = null;

function emit(): void {
  const snapshot = getDriftSnapshot();
  for (const listener of listeners) listener(snapshot);
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

function updateScope(): void {
  el("drift-scope").textContent = driftScopeLabel();
}

/**
 * Return a copy of the tempo-drift snapshot.
 *
 * @returns The current report and scope label.
 */
export function getDriftSnapshot(): DriftSnapshot {
  return { report: latest, scope: driftScopeLabel() };
}

/**
 * Run a callback after each tempo-check change.
 *
 * The callback is not run immediately. Call `getDriftSnapshot` for the
 * current snapshot. The returned function removes the callback.
 *
 * @param listener Called with a snapshot. Do not mutate it.
 * @returns Unsubscribes the listener.
 */
export function subscribeDrift(listener: DriftListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Attach Check again and mount the React report.
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
  islandRoot = mountIsland(el("drift-report"), createElement(DriftReportView));
}

/**
 * Unmount the Tempo-drift Data Grid island.
 *
 * Tests replace `document.body` between cases. Unmount first so the
 * Data Grid scheduler does not run after jsdom tears the window down.
 *
 * @returns {void}
 */
export function unmountDrift(): void {
  if (!islandRoot) return;
  try {
    islandRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  islandRoot = null;
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
    updateScope();
    emit();
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
    updateScope();
    emit();
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
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintDrift(): void {
  updateScope();
  emit();
}
