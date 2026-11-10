/**
 * Play history analytics view.
 *
 * GET /api/history-stats is read-only. CSV is the same query as a file.
 * Making the idle list into a crate POSTs preview, then create, through
 * crate_action. Serato must be quit. A newer load ignores a late reply.
 *
 * Page text is in the locale catalogs under stats.*.
 */

import { failureOf, postJSON, readJSON } from "./api";
import type { HistoryIdleCrate, HistoryStatsArtist, HistoryStatsReport, HistoryStatsTrack } from "./api-types";
import { bridge } from "./bridge";
import { el } from "./dom";
import { clockLabel } from "./format";
import { serverMessage, t } from "./i18n";
import { state } from "./state";
import {
  csvHref,
  idleDaysFromInput,
  isStatsPeriod,
  periodRange,
  statsQuery,
  type StatsPeriod,
} from "./history-stats-view";
import { buttonEl } from "./tooltip";
import { tips } from "./tooltip-strings";

const LIST_CAP = 100;

let latest: HistoryStatsReport | null = null;
let crateBusy = false;

/**
 * Attach Show, period, CSV, and the idle-crate button.
 *
 * Called once at startup. A later call is a no-op.
 *
 * @returns {void}
 */
export function wireHistoryStats(): void {
  const panel = el("stats-panel");
  if (panel.dataset.statsWired === "true") return;
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
  panel.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.dataset.statsAction === "crate") void makeIdleCrate();
  });
  syncPeriodFields();
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
    renderHistoryStats(payload);
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
 * Paint plays, top lists, and the idle tracks.
 *
 * Color is not the only signal: each table names the column in words.
 *
 * @param payload JSON from GET /api/history-stats.
 * @returns {void}
 */
export function renderHistoryStats(payload: HistoryStatsReport): void {
  el("stats-scope").textContent = t("gig.wholeSpace");
  const report = el("stats-report");
  const plays = payload.plays ?? 0;
  const sessions = payload.sessions ?? 0;
  const idleDays = payload.idle_days ?? 365;
  const idleCount = payload.not_played_count ?? 0;
  const summary = document.createElement("p");
  summary.className = "gig-note";
  summary.textContent = plays
    ? t("stats.summary", { plays, sessions })
    : t("stats.empty");
  report.replaceChildren(summary);
  report.append(trackTable(payload.top_tracks ?? []));
  report.append(artistTable(payload.top_artists ?? []));
  report.append(idleGroup(payload.not_played ?? [], idleCount, idleDays));
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
  if (latest) renderHistoryStats(latest);
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

function trackTable(rows: HistoryStatsTrack[]): HTMLElement {
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = rows.length > 0;
  const heading = document.createElement("summary");
  heading.textContent = t("gig.groupCount", { label: t("stats.tracks"), count: rows.length });
  details.append(heading);
  if (!rows.length) {
    details.append(noteLine(t("stats.emptyTracks")));
    return details;
  }
  const table = document.createElement("table");
  table.className = "stats-table";
  const head = document.createElement("thead");
  head.append(headerRow(["column.title", "column.artist", "column.plays", "column.lastPlayed"]));
  table.append(head);
  const body = document.createElement("tbody");
  for (const row of rows.slice(0, LIST_CAP)) {
    body.append(dataRow([
      row.name || "—",
      row.artist || "—",
      String(row.plays ?? 0),
      clockLabel(row.last_played) || "—",
    ]));
  }
  table.append(body);
  details.append(table);
  if (rows.length > LIST_CAP) details.append(noteLine(t("stats.more", { count: rows.length - LIST_CAP })));
  return details;
}

function artistTable(rows: HistoryStatsArtist[]): HTMLElement {
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = rows.length > 0;
  const heading = document.createElement("summary");
  heading.textContent = t("gig.groupCount", { label: t("stats.artists"), count: rows.length });
  details.append(heading);
  if (!rows.length) {
    details.append(noteLine(t("stats.emptyArtists")));
    return details;
  }
  const table = document.createElement("table");
  table.className = "stats-table";
  const head = document.createElement("thead");
  head.append(headerRow(["column.artist", "column.plays", "stats.artistTracks", "column.lastPlayed"]));
  table.append(head);
  const body = document.createElement("tbody");
  for (const row of rows.slice(0, LIST_CAP)) {
    body.append(dataRow([
      row.artist || "—",
      String(row.plays ?? 0),
      String(row.tracks ?? 0),
      clockLabel(row.last_played) || "—",
    ]));
  }
  table.append(body);
  details.append(table);
  if (rows.length > LIST_CAP) details.append(noteLine(t("stats.more", { count: rows.length - LIST_CAP })));
  return details;
}

function idleGroup(rows: HistoryStatsTrack[], count: number, idleDays: number): HTMLElement {
  const details = document.createElement("details");
  details.className = "gig-group";
  details.open = count > 0;
  const heading = document.createElement("summary");
  heading.textContent = t("gig.groupCount", { label: t("stats.idle"), count });
  details.append(heading);
  details.append(noteLine(t("stats.idleHint", { days: idleDays })));
  const crate = buttonEl(tips.statsIdleCrate);
  crate.dataset.statsAction = "crate";
  crate.textContent = t("stats.idleCrate");
  crate.disabled = crateBusy || !state.writable || count === 0;
  details.append(crate);
  if (!count) {
    details.append(noteLine(t("stats.emptyIdle")));
    return details;
  }
  const list = document.createElement("ul");
  for (const row of rows.slice(0, LIST_CAP)) {
    const item = document.createElement("li");
    const last = row.last_played == null ? t("stats.never") : clockLabel(row.last_played) || "—";
    item.textContent = t("stats.idleRow", {
      title: [row.artist, row.name].filter(Boolean).join(" — ") || row.name || "—",
      last,
    });
    list.append(item);
  }
  details.append(list);
  if (count > rows.length) details.append(noteLine(t("stats.more", { count: count - rows.length })));
  else if (rows.length > LIST_CAP) details.append(noteLine(t("stats.more", { count: rows.length - LIST_CAP })));
  return details;
}

async function makeIdleCrate(): Promise<void> {
  if (crateBusy) return;
  const idleDays = idleDaysFromInput(el("stats-idle-days").value);
  const name = t("stats.idleCrateName", { days: idleDays });
  crateBusy = true;
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
    if (!confirm(t("stats.confirmCrate", { name: label, count, days: idleDays }))) return;
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
    if (latest) renderHistoryStats(latest);
  }
}

function headerRow(keys: Array<"column.title" | "column.artist" | "column.plays" | "column.lastPlayed" | "stats.artistTracks">): HTMLTableRowElement {
  const row = document.createElement("tr");
  for (const key of keys) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = t(key);
    row.append(cell);
  }
  return row;
}

function dataRow(values: string[]): HTMLTableRowElement {
  const row = document.createElement("tr");
  for (const value of values) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
  }
  return row;
}

function noteLine(text: string): HTMLParagraphElement {
  const line = document.createElement("p");
  line.className = "gig-note";
  line.textContent = text;
  return line;
}
