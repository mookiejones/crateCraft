/**
 * Pure helpers for history rescue (#482).
 */

import { t } from "../i18n";
import type { HistoryRescueReport } from "../api-types";

export type HistoryRescueAction = "scan" | "preview" | "restore" | "crates";

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
