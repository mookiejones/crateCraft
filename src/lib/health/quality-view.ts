/**
 * Quality-line text for the library health overview.
 *
 * Format, bitrate, and peak are already measured. A missing fact is left
 * out. An empty line is "" so the page does not invent a number.
 */

import type { TrackQuality } from "../api-types";
import { t } from "../i18n";

/**
 * Join the measured quality facts into one short line.
 *
 * @param quality Format, bitrate, and peak from the report. Null fields are skipped.
 * @returns The line, or "" when nothing was measured.
 */
export function qualityLine(quality: TrackQuality | null | undefined): string {
  if (!quality) return "";
  const parts: string[] = [];
  if (quality.format) parts.push(quality.format);
  if (typeof quality.bitrate_kbps === "number") {
    parts.push(t("health.qualityBitrate", { bitrate: quality.bitrate_kbps }));
  }
  if (typeof quality.peak_db === "number") {
    parts.push(t("health.qualityPeak", { peak: quality.peak_db }));
  }
  return parts.join(" · ");
}
