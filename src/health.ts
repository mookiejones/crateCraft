/**
 * Read-only library health report.
 *
 * Typed against GET /api/library-health. The request does not write. A
 * newer selection ignores a late response. HealthPanel paints from
 * HealthContext. Missing, duplicate, and unused sections open those
 * views. A track row opens Crates on that id.
 *
 * Page text is in the locale catalogs under health.*.
 */

import { createElement } from "react";
import { readJSON } from "./api";
import type { LibraryHealthReport } from "./api-types";
import { mountIsland, type IslandRoot } from "./app/mount";
import { HealthPanel } from "./components/HealthPanel";
import { HealthListChrome } from "./components/HealthListChrome";
import type { HealthAction } from "./context/HealthContext";
import { el } from "./dom";
import { emitHealth } from "./health-events";
import { crateScopeLabel } from "./health-list";
import { serverMessage, t } from "./i18n";
import { state } from "./state";

let latest: LibraryHealthReport | null = null;
let status = "";
let busy = false;
let go: ((action: HealthAction, id?: number) => void) | null = null;
let panelRoot: IslandRoot | undefined;
let panelHost: HTMLElement | null = null;
let listRoot: IslandRoot | undefined;
let listHost: HTMLElement | null = null;

/**
 * Snapshot HealthProvider reads.
 *
 * @returns Report, status, busy, and crate scope.
 */
export function getHealthSnapshot(): {
  healthReport: LibraryHealthReport | null;
  healthStatus: string;
  healthBusy: boolean;
  healthScope: string;
} {
  return {
    healthReport: latest,
    healthStatus: status,
    healthBusy: busy,
    healthScope: crateScopeLabel(),
  };
}

/**
 * Open Missing files, Duplicates, Files, or a track in Crates.
 *
 * @param action View to open.
 * @param id Track id when action is track.
 * @returns {void}
 */
export function navigateHealth(action: HealthAction, id?: number): void {
  if (typeof id === "number") go?.(action, id);
  else go?.(action);
}

/**
 * Mount the health report and the missing/duplicates chrome.
 *
 * Called once at startup. A later call remounts the same hosts.
 *
 * @param navigate Open Missing files, Duplicates, or a track in Crates.
 * @returns {void}
 */
export function wireHealth(navigate: (action: HealthAction, id?: number) => void): void {
  go = navigate;
  const panel = el("health-panel");
  if (panelRoot && panelHost !== panel) {
    panelRoot.unmount();
    panelRoot = undefined;
  }
  panelHost = panel;
  panelRoot = mountIsland(panel, createElement(HealthPanel), panelRoot);
  mountHealthListChrome();
}

/**
 * Mount Merge copies and Relink on the crate rail.
 *
 * renderShell calls this so views tests see the buttons without app.ts.
 *
 * @returns {void}
 */
export function mountHealthListChrome(): void {
  const host = document.getElementById("health-list-chrome");
  if (!(host instanceof HTMLElement)) return;
  if (listRoot && listHost !== host) {
    listRoot.unmount();
    listRoot = undefined;
  }
  listHost = host;
  listRoot = mountIsland(host, createElement(HealthListChrome), listRoot);
  emitHealth();
}

/**
 * Ask for a read-only health report of the open space and crate.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs.
 *
 * @returns {Promise<void>}
 */
export async function loadHealth(): Promise<void> {
  const token = ++state.healthToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/library-health?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.healthToken) return;
    const payload = await readJSON<LibraryHealthReport>(response).catch((): null => null);
    if (token !== state.healthToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("health.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    status = "";
    emitHealth();
    settle = "report";
  } catch {
    if (token !== state.healthToken) return;
    failStatus(t("health.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.healthToken) return;
    endBusy();
    if (settle === "retry") el("health-refresh").focus();
    if (settle === "report") el("health-report").focus();
  }
}

/**
 * Show a health-report failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadHealth.
 * @returns {void}
 */
export function showHealthFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("health.unreadable");
  failStatus(message);
  endBusy();
  el("health-refresh").focus();
}

/**
 * Keep the last report and refresh labels in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintHealth(): void {
  emitHealth();
}

/**
 * Store a report and paint it. Tests and loadHealth share this path.
 *
 * @param payload JSON from GET /api/library-health.
 * @returns {void}
 */
export function renderHealthReport(payload: LibraryHealthReport): void {
  latest = payload;
  status = "";
  emitHealth();
}

function beginBusy(): void {
  busy = true;
  status = t("health.checking");
  el("health-panel").setAttribute("aria-busy", "true");
  emitHealth();
}

function endBusy(): void {
  busy = false;
  el("health-panel").setAttribute("aria-busy", "false");
  emitHealth();
}

function failStatus(message: string): void {
  status = message;
  emitHealth();
}
