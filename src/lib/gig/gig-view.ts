/**
 * Pure gig-check labels and list rows.
 *
 * The React screen and the engine share these helpers. Strings come from
 * the locale catalogs. Server sentences stay as returned.
 */

import type { GigReport } from "../api-types";
import { t, type MessageKey } from "../i18n";

export const GIG_STEP_COUNT = 5;

export interface GigStep {
  title: MessageKey;
  action: MessageKey;
  empty: MessageKey;
}

export const GIG_STEPS: readonly GigStep[] = [
  { title: "gig.drives", action: "gig.drivesAction", empty: "gig.drivesEmpty" },
  { title: "gig.missing", action: "gig.missingAction", empty: "gig.missingEmpty" },
  { title: "gig.streaming", action: "gig.streamingAction", empty: "gig.streamingEmpty" },
  { title: "gig.emptyCrates", action: "gig.emptyCratesAction", empty: "gig.emptyCratesEmpty" },
  { title: "gig.since", action: "gig.sinceAction", empty: "gig.sinceEmpty" },
];

export const GIG_CHANGE_GROUPS: ReadonlyArray<readonly [MessageKey, keyof NonNullable<GigReport["changes"]>]> = [
  ["gig.cratesAdded", "crates_added"],
  ["gig.cratesRemoved", "crates_removed"],
  ["gig.cratesEdited", "crates_edited"],
  ["gig.tracksAdded", "tracks_added"],
  ["gig.tracksRemoved", "tracks_removed"],
  ["gig.cuesEdited", "cues_edited"],
  ["gig.gridsEdited", "grids_edited"],
  ["gig.tagsEdited", "tags_edited"],
];

/**
 * Lines for one numbered gig step, not the since-last-gig screen.
 *
 * @param payload Report from GET /api/gig-check.
 * @param index Step from 0 to 3.
 * @returns Display rows for that step.
 */
export function gigLinesFor(payload: GigReport, index: number): string[] {
  if (index === 0) {
    return (payload.unavailable_drives || []).map((drive) =>
      t("gig.driveUnavailable", { name: drive.name, count: drive.track_count }),
    );
  }
  if (index === 1) return (payload.missing_files || []).map((item) => item.path);
  if (index === 2) return (payload.streaming_tracks || []).map((item) => `${item.service}: ${item.title}`);
  if (index === 3) return (payload.empty_crates || []).map((item) => `${item.name} — ${item.warning}`);
  return [];
}

/**
 * Crate name for the scope line, or the whole-space sentence.
 *
 * @param payload Report from GET /api/gig-check.
 * @returns Scope label.
 */
export function gigScopeLabel(payload: GigReport): string {
  return payload.scope?.crate_name || t("gig.wholeSpace");
}
