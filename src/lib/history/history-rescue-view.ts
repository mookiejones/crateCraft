/**
 * Pure helpers for history rescue (#482).
 */

import { t } from "../i18n";
import type { HistoryRescueReport } from "../api-types";

export type HistoryRescueAction = "scan" | "preview" | "restore" | "crates";

export type HistoryRescueSide = "only_source" | "only_live" | "disagree";

export type HistoryRescueSessionRow = {
  id: number;
  name: string;
  side: HistoryRescueSide;
  /** True when this id can be restored or rebuilt from the source. */
  selectable: boolean;
};

/**
 * Parse comma-separated session ids.
 */
export function parseSessionIds(raw: string): number[] {
  const ids: number[] = [];
  for (const part of raw.split(/[,\s]+/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (!/^\d+$/.test(trimmed)) continue;
    ids.push(Number(trimmed));
  }
  return ids;
}

function asSession(raw: unknown): { id: number; name: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { id?: unknown; name?: unknown };
  if (typeof row.id !== "number" || !Number.isFinite(row.id)) return null;
  return {
    id: row.id,
    name: typeof row.name === "string" && row.name ? row.name : "Session",
  };
}

/**
 * Flatten compare buckets into rows the panel can list and select.
 */
export function historyRescueSessionRows(
  report: HistoryRescueReport | null,
): HistoryRescueSessionRow[] {
  if (!report) return [];
  const rows: HistoryRescueSessionRow[] = [];
  const seen = new Set<number>();
  for (const raw of report.only_source ?? []) {
    const session = asSession(raw);
    if (!session || seen.has(session.id)) continue;
    seen.add(session.id);
    rows.push({ ...session, side: "only_source", selectable: true });
  }
  for (const raw of report.disagree ?? []) {
    if (!raw || typeof raw !== "object") continue;
    const source = asSession((raw as { source?: unknown }).source);
    if (!source || seen.has(source.id)) continue;
    seen.add(source.id);
    rows.push({ ...source, side: "disagree", selectable: true });
  }
  for (const raw of report.only_live ?? []) {
    const session = asSession(raw);
    if (!session || seen.has(session.id)) continue;
    seen.add(session.id);
    rows.push({ ...session, side: "only_live", selectable: false });
  }
  return rows;
}

/**
 * Locale label for a compare side.
 */
export function historyRescueSideLabel(side: HistoryRescueSide): string {
  if (side === "only_source") return t("historyRescue.sideOnlySource");
  if (side === "only_live") return t("historyRescue.sideOnlyLive");
  return t("historyRescue.sideDisagree");
}

/**
 * Status line from a history-rescue report.
 */
export function historyRescueStatusText(report: HistoryRescueReport | null): string {
  if (!report) return "";
  if (report.written && report.action === "crates") {
    return t("historyRescue.cratesDone", { count: Number(report.crate_count) || 0 });
  }
  if (report.written && report.action === "restore") {
    return t("historyRescue.restored", { count: Number(report.restored_count) || 0 });
  }
  if (
    report.action === "restore" &&
    report.written === false &&
    (Number(report.skipped_count) || 0) > 0 &&
    (Number(report.restored_count) || 0) === 0
  ) {
    return t("historyRescue.skippedLive", { count: Number(report.skipped_count) || 0 });
  }
  if (report.write_back && report.write_back.allowed === false && report.write_back.reason) {
    return String(report.write_back.reason);
  }
  if (
    report.only_source_count != null ||
    report.only_live_count != null ||
    report.disagree_count != null
  ) {
    return t("historyRescue.status", {
      only_source: Number(report.only_source_count) || 0,
      only_live: Number(report.only_live_count) || 0,
      disagree: Number(report.disagree_count) || 0,
    });
  }
  const sources = report.sources;
  if (Array.isArray(sources)) {
    return String(sources.length);
  }
  return "";
}
