/**
 * Pure helpers for the Music files panel on Backups (#394).
 */

import { t } from "../i18n";
import type { MusicMirrorReport } from "../api-types";

export type MusicMirrorAction = "preview" | "copy" | "restore" | "crate" | "relink";

/**
 * True when the dest field has a folder path.
 *
 * @param dest Backup folder typed in the panel.
 * @returns True when dest is not blank.
 */
export function hasMirrorDest(dest: string): boolean {
  return dest.trim().length > 0;
}

/**
 * Status line from a mirror report.
 *
 * @param report Latest GET or POST payload, or null before Preview.
 * @returns Localized counts, or an empty string.
 */
export function mirrorStatusText(report: MusicMirrorReport | null): string {
  if (!report) return "";
  return t("musicMirror.status", {
    copy: Number(report.copy_count) || 0,
    only: Number(report.only_laptop_count) || 0,
    restore: Number(report.restore_count) || 0,
    newer: Number(report.skip_newer_count) || 0,
    mismatch: Number(report.mismatch_count) || 0,
  });
}
