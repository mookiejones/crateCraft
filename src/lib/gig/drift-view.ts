/**
 * Pure tempo-drift labels and list rows.
 *
 * The React screen and the engine share these helpers. Strings come from
 * the locale catalogs.
 */

import type { TempoDriftFlag } from "../api-types";
import { t, type MessageKey } from "../i18n";
import { state } from "../state";

export const DRIFT_REASON_ORDER = ["drifting", "live", "pending_map"] as const;

const REASON_KEYS: Record<string, MessageKey> = {
  drifting: "drift.reason.drifting",
  live: "drift.reason.live",
  pending_map: "drift.reason.pending_map",
};

/**
 * Crate name for the scope line, or the whole-space sentence.
 *
 * @returns Scope label for the open crate.
 */
export function driftScopeLabel(): string {
  if (state.activeCrate === "all") return t("gig.wholeSpace");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("gig.wholeSpace");
}

/**
 * Reason kinds present in the flags, known order first.
 *
 * @param flags Flagged tracks from GET /api/tempo-drift.
 * @returns Unique reason words.
 */
export function driftReasonKinds(flags: readonly TempoDriftFlag[]): string[] {
  const seen = new Set(flags.flatMap((item) => item.reasons));
  const known = DRIFT_REASON_ORDER.filter((kind) => seen.has(kind));
  const extra = [...seen].filter((kind) => !DRIFT_REASON_ORDER.includes(kind as (typeof DRIFT_REASON_ORDER)[number])).sort();
  return [...known, ...extra];
}

/**
 * Heading for one reason kind.
 *
 * @param kind Stored reason word.
 * @returns Localized heading.
 */
export function driftReasonHeading(kind: string): string {
  return t(REASON_KEYS[kind] ?? "drift.reason.unknown");
}

/**
 * One flagged-track sentence.
 *
 * @param item Flag from GET /api/tempo-drift.
 * @returns Display row.
 */
export function driftFlagLine(item: TempoDriftFlag): string {
  const title = [item.artist, item.name].filter(Boolean).join(" — ") || item.file;
  const reasons = item.reasons.map(driftReasonHeading).join(", ");
  const bpm = item.bpm_min != null && item.bpm_max != null
    ? t("drift.bpmRange", { min: item.bpm_min, max: item.bpm_max })
    : "";
  return t("drift.row", { title, file: item.file, reasons, bpm });
}
