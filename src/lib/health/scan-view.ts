/**
 * Pure copy helpers for the Damaged files report.
 *
 * No DOM. scan.ts fetches; ScanPanel paints.
 */

import type { FileScanProblem } from "../api-types";
import { t, type MessageKey } from "../i18n";

const PROBLEM_KEYS: Record<string, MessageKey> = {
  empty: "scan.problem.empty",
  unreadable: "scan.problem.unreadable",
  wrong_format: "scan.problem.wrong_format",
  serato_flagged: "scan.problem.serato_flagged",
  undecodable: "scan.problem.undecodable",
  decode_error: "scan.problem.decode_error",
  short: "scan.problem.short",
};

/**
 * Problem heading in the active language.
 *
 * @param kind Problem key from GET /api/file-scan.
 * @returns {string}
 */
export function scanProblemHeading(kind: string): string {
  return t(PROBLEM_KEYS[kind] ?? "scan.problem.unknown");
}

/**
 * Problem column text, including format or decode detail when present.
 *
 * @param item One damaged file.
 * @returns {string}
 */
export function scanProblemDetail(item: FileScanProblem): string {
  const heading = scanProblemHeading(item.problem);
  if (item.problem === "wrong_format" && item.detail) {
    return t("scan.wrongFormatDetail", { detail: item.detail });
  }
  if ((item.problem === "decode_error" || item.problem === "short") && item.detail) {
    return t(item.problem === "short" ? "scan.shortDetail" : "scan.decodeErrorDetail", {
      detail: item.detail,
    });
  }
  if (item.problem === "serato_flagged" && item.detail) {
    return `${heading}: ${item.detail}`;
  }
  return heading;
}

/**
 * Artist — title, or the file name when both tags are blank.
 *
 * @param item One damaged file.
 * @returns {string}
 */
export function scanTrackTitle(item: FileScanProblem): string {
  return [item.artist, item.name].filter(Boolean).join(" — ") || item.file;
}
