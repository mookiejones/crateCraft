/**
 * Pure gig-check labels and list rows.
 *
 * The React screen and the engine share these helpers. Strings come from
 * the locale catalogs. Server sentences stay as returned.
 */

import type { GigChanges, GigReport, GigTagDiff } from "../api-types";
import { t, type MessageKey } from "../i18n";
import { fileName } from "../snapshots/restore-view";
import { cloudLocationText } from "./cloud-files-view";

export const GIG_STEP_COUNT = 6;

export interface GigStep {
  title: MessageKey;
  action: MessageKey;
  empty: MessageKey;
}

export const GIG_STEPS: readonly GigStep[] = [
  { title: "gig.drives", action: "gig.drivesAction", empty: "gig.drivesEmpty" },
  { title: "gig.missing", action: "gig.missingAction", empty: "gig.missingEmpty" },
  { title: "gig.cloud", action: "gig.cloudAction", empty: "gig.cloudEmpty" },
  { title: "gig.streaming", action: "gig.streamingAction", empty: "gig.streamingEmpty" },
  { title: "gig.emptyCrates", action: "gig.emptyCratesAction", empty: "gig.emptyCratesEmpty" },
  { title: "gig.since", action: "gig.sinceAction", empty: "gig.sinceEmpty" },
];

type GigPathGroup = Exclude<keyof GigChanges, "tag_diffs">;

export const GIG_CHANGE_GROUPS: ReadonlyArray<readonly [MessageKey, GigPathGroup]> = [
  ["gig.cratesAdded", "crates_added"],
  ["gig.cratesRemoved", "crates_removed"],
  ["gig.cratesEdited", "crates_edited"],
  ["gig.tracksAdded", "tracks_added"],
  ["gig.tracksRemoved", "tracks_removed"],
  ["gig.cuesEdited", "cues_edited"],
  ["gig.gridsEdited", "grids_edited"],
  ["gig.tagsEdited", "tags_edited"],
];

const TAG_FIELD_KEYS: Record<string, MessageKey> = {
  title: "field.title",
  artist: "field.artist",
  bpm: "field.bpm",
  key: "field.key",
};

/**
 * One Since-last-gig line for title, artist, BPM, or key.
 *
 * @param diff Field diffs for one path.
 * @returns `a.mp3: Title Mix → Song; BPM 120 → 240`.
 */
export function tagDiffText(diff: GigTagDiff): string {
  const fields = (diff.fields || [])
    .map((item) => t("gig.tagField", {
      field: TAG_FIELD_KEYS[item.field] ? t(TAG_FIELD_KEYS[item.field]!) : item.field,
      before: item.before || t("gig.tagEmpty"),
      after: item.after || t("gig.tagEmpty"),
    }))
    .join("; ");
  return t("gig.tagDiff", { name: fileName(diff.path), fields });
}

/**
 * Tag group lines: field diffs when present, else the path.
 *
 * @param changes Diff from GET /api/gig-check.
 * @returns Display rows for Tags edited.
 */
export function tagEditLines(changes: GigChanges | null | undefined): string[] {
  if (!changes) return [];
  const diffs = new Map((changes.tag_diffs || []).map((item) => [item.path, item]));
  if (changes.tags_edited.length) {
    return changes.tags_edited.map((path) => {
      const diff = diffs.get(path);
      return diff ? tagDiffText(diff) : path;
    });
  }
  return (changes.tag_diffs || []).map(tagDiffText);
}

/**
 * Lines for one numbered gig step, not the since-last-gig screen.
 *
 * @param payload Report from GET /api/gig-check.
 * @param index Step from 0 to 4.
 * @returns Display rows for that step.
 */
export function gigLinesFor(payload: GigReport, index: number): string[] {
  if (index === 0) {
    return (payload.unavailable_drives || []).map((drive) =>
      t("gig.driveUnavailable", { name: drive.name, count: drive.track_count }),
    );
  }
  if (index === 1) return (payload.missing_files || []).map((item) => item.path);
  if (index === 2) {
    const locations = (payload.cloud_locations || []).map((item) => cloudLocationText(item));
    const files = (payload.cloud_files || []).map((item) => item.path);
    const unknown = (payload.unknown_files || []).map((item) => t("gig.cloudUnknown", { path: item.path }));
    return [...locations, ...files, ...unknown];
  }
  if (index === 3) return (payload.streaming_tracks || []).map((item) => `${item.service}: ${item.title}`);
  if (index === 4) return (payload.empty_crates || []).map((item) => `${item.name} — ${item.warning}`);
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
