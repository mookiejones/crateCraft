/**
 * Read-only cloud-only report engine.
 *
 * Typed against the fields GET /api/cloud-files returns. The request
 * does not write and does not download audio. A newer selection ignores
 * a late response. The report is painted by `CloudFilesReport` on
 * `GigContext`.
 *
 * Page text is in the locale catalogs under cloud.*.
 */

import { createElement } from "react";
import { readJSON } from "../api";
import type { CloudFilesReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { CloudFilesReport as CloudFilesReportView } from "../../pages/CloudFilesReport";
import type { CloudSnapshot } from "../../containers/GigContext";
import { el } from "../dom";
import { cloudScopeLabel } from "./cloud-files-view";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

type CloudListener = (snapshot: CloudSnapshot) => void;

const listeners = new Set<CloudListener>();

let latest: CloudFilesReport | null = null;
let islandRoot: IslandRoot | null = null;

function emit(): void {
  const snapshot = getCloudSnapshot();
  for (const listener of listeners) listener(snapshot);
}

function beginBusy(): void {
  const button = el("cloud-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("cloud-panel").setAttribute("aria-busy", "true");
  el("cloud-status").textContent = t("cloud.checking");
}

function endBusy(): void {
  const button = el("cloud-refresh");
  button.disabled = false;
  button.setAttribute("aria-busy", "false");
  el("cloud-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("cloud-status").textContent = message;
}

function updateScope(): void {
  el("cloud-scope").textContent = cloudScopeLabel();
}

/**
 * Return a copy of the cloud-only snapshot.
 *
 * @returns The current report and scope label.
 */
export function getCloudSnapshot(): CloudSnapshot {
  return { report: latest, scope: cloudScopeLabel() };
}

/**
 * Run a callback after each cloud-check change.
 *
 * The callback is not run immediately. Call `getCloudSnapshot` for the
 * current snapshot. The returned function removes the callback.
 *
 * @param listener Called with a snapshot. Do not mutate it.
 * @returns Unsubscribes the listener.
 */
export function subscribeCloud(listener: CloudListener): () => void {
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
export function wireCloud(): void {
  const panel = el("cloud-panel");
  if (panel.dataset.cloudWired === "true") return;
  panel.dataset.cloudWired = "true";
  el("cloud-refresh").addEventListener("click", () => {
    void loadCloud();
  });
  islandRoot = mountIsland(el("cloud-report"), createElement(CloudFilesReportView));
}

/**
 * Unmount the Cloud-only island.
 *
 * Tests replace `document.body` between cases. Unmount first so a React
 * update does not run after jsdom tears the window down. A pending load
 * is ignored so it does not look up a host that is gone.
 *
 * @returns {void}
 */
export function unmountCloud(): void {
  state.cloudToken += 1;
  if (!islandRoot) return;
  try {
    islandRoot.unmount();
  } catch {
    // installPage already dropped the host.
  }
  islandRoot = null;
}

/**
 * Ask for a read-only cloud check of the open space and crate.
 *
 * The previous report stays on screen until this reply arrives. Check
 * again is disabled while the request runs. All tracks is allowed.
 *
 * @returns {Promise<void>}
 */
export async function loadCloud(): Promise<void> {
  const token = ++state.cloudToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  const crate = state.activeCrate === "all" ? "all" : String(state.activeCrate);
  try {
    const response = await fetch(
      `/api/cloud-files?space=${encodeURIComponent(state.space)}&crate=${encodeURIComponent(crate)}`,
    );
    if (token !== state.cloudToken) return;
    const payload = await readJSON<CloudFilesReport>(response).catch((): null => null);
    if (token !== state.cloudToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("cloud.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("cloud-status").textContent = "";
    updateScope();
    emit();
    settle = "report";
  } catch {
    if (token !== state.cloudToken) return;
    failStatus(t("cloud.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.cloudToken) return;
    endBusy();
    if (settle === "retry") el("cloud-refresh").focus();
    if (settle === "report") el("cloud-report").focus();
  }
}

/**
 * Show a cloud-check failure in the status line.
 *
 * The report already on screen stays. Focus moves to Check again.
 *
 * @param error Failure from loadCloud.
 * @returns {void}
 */
export function showCloudFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("cloud.unreadable");
  failStatus(message);
  endBusy();
  el("cloud-refresh").focus();
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintCloud(): void {
  updateScope();
  emit();
}
