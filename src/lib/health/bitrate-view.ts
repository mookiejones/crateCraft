/**
 * Pure copy helpers for the Suspect quality report.
 *
 * No DOM. bitrate.ts fetches; BitrateReport paints.
 */

import type { BitrateSuspect } from "../api-types";
import { t, type MessageKey } from "../i18n";

const REASON_KEYS: Record<string, MessageKey> = {
  upsampled: "bitrate.reason.upsampled",
  lossy_source: "bitrate.reason.lossy_source",
};

/**
 * Reason label in the active language.
 *
 * @param kind Reason key from GET /api/bitrate-check.
 * @returns {string}
 */
export function bitrateReasonHeading(kind: string): string {
  return t(REASON_KEYS[kind] ?? "bitrate.reason.unknown");
}

/**
 * Artist — title, or the file name when both tags are blank.
 *
 * @param item One flagged track.
 * @returns {string}
 */
export function bitrateTrackTitle(item: BitrateSuspect): string {
  return [item.artist, item.name].filter(Boolean).join(" — ") || item.file;
}

/**
 * Stated vs estimated kbps, without the leading separator.
 *
 * @param item One flagged track.
 * @returns {string}
 */
export function bitrateDetail(item: BitrateSuspect): string {
  if (item.stated_kbps != null && item.estimated_kbps != null) {
    return t("bitrate.column.detail", { stated: item.stated_kbps, estimated: item.estimated_kbps });
  }
  if (item.estimated_kbps != null) {
    return t("bitrate.column.detailEstimate", { estimated: item.estimated_kbps });
  }
  return "";
}
