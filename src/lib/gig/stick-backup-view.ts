/**
 * Pure helpers for the stick backup panel on Check drive (#481).
 */

import { t } from "../i18n";
import type { StickBackupReport } from "../api-types";

export type StickBackupAction = "preview" | "copy";

/**
 * True when the dest field has a folder path.
 */
export function hasStickBackupDest(dest: string): boolean {
  return dest.trim().length > 0;
}

/**
 * Status line from a stick-backup report.
 */
export function stickBackupStatusText(report: StickBackupReport | null): string {
  if (!report) return "";
  if (report.written && report.verified) {
    return t("stickBackup.verified");
  }
  if (report.written && report.verified === false) {
    return t("stickBackup.failed");
  }
  const parts = [
    t("stickBackup.status", {
      copy: Number(report.copy_count) || 0,
      skip: Number(report.skip_count) || 0,
      mismatch: Number(report.mismatch_count) || 0,
    }),
  ];
  if (typeof report.warning === "string" && report.warning) {
    parts.push(report.warning);
  }
  const last = report.last_backup;
  if (last && typeof last.dest === "string" && typeof last.at === "string") {
    parts.push(
      t("stickBackup.last", {
        dest: last.dest,
        date: last.at.slice(0, 10),
      }),
    );
  }
  return parts.join(" ");
}
