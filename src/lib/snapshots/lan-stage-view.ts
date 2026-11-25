/**
 * Pure copy for Backup Mac. Nothing here fetches or writes.
 */

import type { LanStageReport } from "../api-types";
import { t, type MessageKey } from "../i18n";

const REASONS: Record<string, MessageKey> = {
  missing: "lanStage.reason.missing",
  offline: "lanStage.reason.offline",
  unreadable: "lanStage.reason.unreadable",
  shortcut: "lanStage.reason.shortcut",
  unsafe_name: "lanStage.reason.unsafe_name",
  changed: "lanStage.reason.changed",
  mismatch: "lanStage.reason.mismatch",
  not_in_library: "lanStage.reason.not_in_library",
};

/**
 * Format a byte count for the status line.
 *
 * @param bytes Size from the plan. A bad value is zero.
 * @returns A short size in the active language.
 */
export function byteText(bytes: number): string {
  const size = Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
  if (size < 1024) return t("lanStage.sizeB", { count: Math.round(size) });
  if (size < 1024 * 1024) return t("lanStage.sizeK", { count: Math.round(size / 1024) });
  if (size < 1024 * 1024 * 1024) return t("lanStage.sizeM", { count: Math.round((size / (1024 * 1024)) * 10) / 10 });
  return t("lanStage.sizeG", { count: Math.round((size / (1024 * 1024 * 1024)) * 10) / 10 });
}

/**
 * Translate a skip or failure code.
 *
 * @param code Reason code from the server, if any.
 * @returns The sentence for that code, or a generic skip.
 */
export function reasonText(code: string | undefined): string {
  const key = code ? REASONS[code] : undefined;
  return key ? t(key) : t("lanStage.reason.unknown");
}

/**
 * Status line for a preview or a finished send.
 *
 * @param report Plan, or null when nothing has been read.
 * @returns The counts, or an empty string.
 */
export function stageStatusText(report: LanStageReport | null): string {
  if (!report) return "";
  return t("lanStage.status", {
    files: report.file_count ?? 0,
    size: byteText(report.byte_count ?? 0),
    skipped: report.skipped_count ?? 0,
    failed: report.failed_count ?? 0,
  });
}

/**
 * Line shown while this Mac is listening, or the idle sentence.
 *
 * @param report Status from listen or refresh.
 * @returns The listening sentence, or the idle sentence.
 */
export function listeningText(report: LanStageReport | null): string {
  if (!report?.listening) return t("lanStage.idle");
  const addresses = (report.addresses ?? []).join(", ");
  return t("lanStage.listening", {
    port: report.port ?? 0,
    code: report.code || "",
    addresses,
  });
}

/**
 * True when at least one crate is selected.
 *
 * @param ids Selected crate ids.
 * @returns True when preview can run.
 */
export function canPreview(ids: readonly number[]): boolean {
  return ids.length > 0;
}

/**
 * True when the selected crates are the ones just previewed.
 *
 * Changing the selection requires another preview. A send is never
 * armed by itself.
 *
 * @param ids Selected crate ids.
 * @param previewIds Ids from the last preview.
 * @param fingerprint Fingerprint from that preview.
 * @returns True when Send may post confirm true.
 */
export function canSend(
  ids: readonly number[],
  previewIds: readonly number[],
  fingerprint: string,
): boolean {
  if (!fingerprint || ids.length === 0 || ids.length !== previewIds.length) return false;
  const left = [...ids].sort((a, b) => a - b);
  const right = [...previewIds].sort((a, b) => a - b);
  return left.every((id, index) => id === right[index]);
}

/**
 * Sentence after a confirmed add.
 *
 * @param report Accept result.
 * @returns The added-crates sentence, or an empty string when nothing was written.
 */
export function addedText(report: LanStageReport | null): string {
  if (!report?.library_written) return "";
  return t("lanStage.added", {
    crates: report.crates?.length ?? 0,
    matched: report.matched ?? 0,
    unmatched: report.unmatched_count ?? 0,
  });
}
