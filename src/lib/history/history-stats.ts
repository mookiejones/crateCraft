/**
 * Play history analytics view.
 *
 * GET /api/history-stats is read-only. CSV is the same query as a file.
 * Making the idle list into a crate POSTs preview, then create, through
 * crate_action. Serato must be quit. A newer load ignores a late reply.
 * StatsPanel paints the report from StatsContext.
 *
 * Page text is in the locale catalogs under stats.*.
 */

import { createElement } from "react";
import { failureOf, postJSON, readJSON } from "../api";
import type { HistoryIdleCrate, HistoryStatsReport } from "../api-types";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { bridge } from "../bridge";
import type { StatsContextValue } from "../../containers/StatsContext";
import { el } from "../dom";
import { serverMessage, t } from "../i18n";
import { StatsPanel } from "../../pages/StatsPanel";
import { state } from "../state";
import { openConfirm } from "../ui/shared-dialog";
import {
  csvHref,
  idleDaysFromInput,
  isStatsPeriod,
  periodRange,
  statsQuery,
  type StatsPeriod,
} from "./history-stats-view";

type StatsListener = () => void;

const listeners = new Set<StatsListener>();

let latest: HistoryStatsReport | null = null;
let crateBusy = false;
let panelRoot: IslandRoot | undefined;
let reportHost: HTMLElement | null = null;

function emit(): void {
  for (const listener of [...listeners]) listener();
}

/**
 * Snapshot StatsProvider reads.
 *
 * @returns Report, crate busy flag, and whether the library is writable.
 */
export function getStatsSnapshot(): Omit<StatsContextValue, "makeIdleCrate"> {
  return {
    report: latest,
    crateBusy,
    writable: state.writable,
  };
}

/**
 * Run `listener` after a Play stats report or crate-busy change.
 *
 * @param listener Snapshot reader.
 * @returns Unsubscribe.
 */
export function subscribeStats(listener: StatsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Attach Show, period, CSV, and mount the React report.
 *
 * Called once at startup. A later call remounts the same host.
 *
 * @returns {void}
 */
export function wireHistoryStats(): void {
  const panel = el("stats-panel");
  const report = el("stats-report");
  if (panelRoot && reportHost !== report) {
    try {
      panelRoot.unmount();
    } catch {
      // installPage replaces the body; the host is already gone.
    }
    panelRoot = undefined;
    latest = null;
    crateBusy = false;
  }
  if (panel.dataset.statsWired !== "true") {
    panel.dataset.statsWired = "true";
    el("stats-refresh").addEventListener("click", () => {
      void loadHistoryStats();
    });
    el("stats-period").addEventListener("change", () => {
      syncPeriodFields();
      if (currentPeriod() !== "custom") void loadHistoryStats();
    });
    el("stats-csv").addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = csvHref(currentQuery());
      link.download = "play-stats.csv";
      link.click();
    });
    syncPeriodFields();
  }
  reportHost = report;
  panelRoot = mountIsland(report, createElement(StatsPanel), panelRoot);
}

/**
 * Ask for the read-only stats of the open space.
 *
 * The previous report stays until this reply arrives. Show is disabled
 * while the request runs.
 *
 * @returns {Promise<void>}
 */
export async function loadHistoryStats(): Promise<void> {
  const token = ++state.statsToken;
  beginBusy();
  let settle: "report" | "retry" | "none" = "none";
  try {
    const response = await fetch(`/api/history-stats?${currentQuery()}`);
    if (token !== state.statsToken) return;
    const payload = await readJSON<HistoryStatsReport>(response).catch((): null => null);
    if (token !== state.statsToken) return;
    if (!response.ok || payload === null) {
      failStatus(serverMessage(payload, t("stats.unreadable")));
      settle = "retry";
      return;
    }
    latest = payload;
    el("stats-status").textContent = "";
    el("stats-scope").textContent = t("gig.wholeSpace");
    emit();
    settle = "report";
  } catch {
    if (token !== state.statsToken) return;
    failStatus(t("stats.unreachable"));
    settle = "retry";
  } finally {
    if (token !== state.statsToken) return;
    endBusy();
    if (settle === "retry") el("stats-refresh").focus();
    if (settle === "report") el("stats-report").focus();
  }
}

/**
 * Show a stats failure in the status line.
 *
 * The report already on screen stays. Focus moves to Show.
 *
 * @param error Failure from loadHistoryStats.
 * @returns {void}
 */
export function showHistoryStatsFailure(error: unknown): void {
  const message = error instanceof Error && error.message
    ? error.message
    : t("stats.unreadable");
  failStatus(message);
  endBusy();
  el("stats-refresh").focus();
}

/**
 * Paint the last report again in the active language.
 *
 * locale-wiring calls this on a language change. Nothing is fetched.
 *
 * @returns {void}
 */
export function repaintHistoryStats(): void {
  el("stats-scope").textContent = t("gig.wholeSpace");
  syncPeriodFields();
  emit();
}

function currentPeriod(): StatsPeriod {
  const value = el("stats-period").value;
  return isStatsPeriod(value) ? value : "all";
}

function currentQuery(): string {
  const range = periodRange(
    currentPeriod(),
    el("stats-from").value,
    el("stats-to").value,
    Date.now(),
  );
  return statsQuery(state.space, range, idleDaysFromInput(el("stats-idle-days").value));
}

function syncPeriodFields(): void {
  const custom = currentPeriod() === "custom";
  el("stats-from").disabled = !custom;
  el("stats-to").disabled = !custom;
}

function beginBusy(): void {
  const button = el("stats-refresh");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("stats-panel").setAttribute("aria-busy", "true");
  el("stats-status").textContent = t("stats.checking");
}

function endBusy(): void {
  const button = el("stats-refresh");
  button.disabled = false;
  button.setAttribute("aria-busy", "false");
  el("stats-panel").setAttribute("aria-busy", "false");
}

function failStatus(message: string): void {
  el("stats-status").textContent = message;
}

/**
 * Preview then create a crate of idle tracks.
 *
 * Confirm uses the shared MUI dialog. Serato must be quit.
 *
 * @returns {Promise<void>}
 */
export async function makeIdleCrate(): Promise<void> {
  if (crateBusy) return;
  const idleDays = idleDaysFromInput(el("stats-idle-days").value);
  const name = t("stats.idleCrateName", { days: idleDays });
  crateBusy = true;
  emit();
  try {
    const preview = await postJSON<HistoryIdleCrate>("/api/history-stats", {
      action: "preview",
      space: state.space,
      idle_days: idleDays,
      name,
    });
    const count = preview.count ?? 0;
    if (!count) {
      el("stats-status").textContent = t("stats.emptyIdle");
      return;
    }
    const label = String(preview.name || name);
    if (!(await openConfirm({
      title: t("stats.idleCrate"),
      message: t("stats.confirmCrate", { name: label, count, days: idleDays }),
      confirmLabel: t("stats.idleCrate"),
    }))) return;
    const created = await postJSON<HistoryIdleCrate>("/api/history-stats", {
      action: "create",
      space: state.space,
      idle_days: idleDays,
      name: label,
    });
    if (!created.written) {
      el("stats-status").textContent = t("stats.emptyIdle");
      return;
    }
    await bridge.reloadLibrary();
    await loadHistoryStats();
    el("stats-status").textContent = created.warning || t("stats.written", {
      name: String(created.name || label),
      count: created.count ?? count,
    });
  } catch (error) {
    if (failureOf(error).status === 409) {
      bridge.lockDown(error);
      return;
    }
    el("stats-status").textContent = failureOf(error).message;
  } finally {
    crateBusy = false;
    emit();
  }
}
