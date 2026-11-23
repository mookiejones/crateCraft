/**
 * Pure BPM-check labels and list rows.
 *
 * The React screen and the apply helper share these. Strings come from
 * the locale catalogs.
 */

import type { BpmSanityFlag } from "../api-types";
import { t } from "../i18n";
import { state } from "../state";

/**
 * Crate name for the scope line, or the whole-space sentence.
 *
 * @returns Scope label for the open crate.
 */
export function octaveScopeLabel(): string {
  if (state.activeCrate === "all") return t("gig.wholeSpace");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("gig.wholeSpace");
}

/**
 * Show a stored BPM the way the check rounds it.
 *
 * Six decimal places, then a plain number, so 128 stays "128".
 *
 * @param value Stored or suggested BPM.
 * @returns Display text.
 */
export function formatStoredBpm(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 1e6) / 1e6);
}

export type OctaveViewRow = {
  id: number;
  title: string;
  file: string;
  bpm: string;
  suggested: string;
  fix: "x2" | "div2";
  name: string;
};

/**
 * Data Grid rows for half and double BPMs.
 *
 * @param flags Flagged tracks from GET /api/bpm-sanity.
 * @returns Rows for the report grid.
 */
export function octaveViewRows(flags: readonly BpmSanityFlag[]): OctaveViewRow[] {
  return flags.map((item) => ({
    id: item.id,
    title: [item.artist, item.name].filter(Boolean).join(" — ") || item.file,
    file: item.file,
    bpm: formatStoredBpm(item.bpm),
    suggested: formatStoredBpm(item.suggested),
    fix: item.fix === "div2" ? "div2" : "x2",
    name: item.name || item.file,
  }));
}
