/**
 * Pure copy helpers for the Tag spellings view.
 *
 * No DOM. tags.ts paints with these sentences. A language change can
 * call them again from the last payload.
 */

import type { TagClusterChange, TagClusterGroup, TagClusterPlan } from "./api-types";
import { t } from "./i18n";

export type TagField = "genre" | "artist";

export interface SpellingChange {
  from: string;
  to: string;
  count: number;
}

/**
 * One-line count of values and groups for the open field.
 *
 * @param field Genre or artist.
 * @param values Distinct stored spellings in the space.
 * @param groups Clusters that have more than one spelling.
 * @returns {string}
 */
export function tagsSummary(field: TagField, values: number, groups: number): string {
  if (groups === 0) {
    return field === "genre"
      ? t("tags.summaryGenreClear", { count: values })
      : t("tags.summaryArtistClear", { count: values });
  }
  return field === "genre"
    ? t("tags.summaryGenre", { values, count: groups })
    : t("tags.summaryArtist", { values, count: groups });
}

/**
 * Details summary for one cluster.
 *
 * @param group Cluster from GET /api/tag-clusters.
 * @returns {string}
 */
export function groupHeading(group: TagClusterGroup): string {
  return t("tags.group", {
    name: group.suggested,
    spellings: t("tags.spellingCount", { count: group.spellings.length }),
    tracks: t("tags.trackCount", { count: group.tracks }),
  });
}

/**
 * Radio label for one stored spelling.
 *
 * @param value Stored text.
 * @param count Tracks that use it.
 * @param suggested True when this is the group's suggested spelling.
 * @returns {string}
 */
export function spellingLabel(value: string, count: number, suggested: boolean): string {
  const base = t("tags.row", { value, count });
  return suggested ? `${base} — ${t("tags.suggested")}` : base;
}

/**
 * Status line after a preview.
 *
 * @param plan JSON from POST /api/tag-clusters action preview.
 * @returns {string}
 */
export function previewSummary(plan: TagClusterPlan): string {
  if (!plan.changes.length) return t("tags.noChanges");
  return t("tags.previewSummary", { count: plan.changes.length, value: plan.value });
}

/**
 * Status line after a write.
 *
 * @param plan JSON from POST /api/tag-clusters action apply.
 * @returns {string}
 */
export function writtenSummary(plan: TagClusterPlan): string {
  return t("tags.written", { count: plan.changes.length, value: plan.value });
}

/**
 * Collapse identical from→to pairs and count them.
 *
 * @param changes Row diffs from a plan.
 * @returns {SpellingChange[]}
 */
export function groupChanges(changes: TagClusterChange[]): SpellingChange[] {
  const rows = new Map<string, SpellingChange>();
  for (const change of changes) {
    const id = `${change.from}\0${change.to}`;
    const existing = rows.get(id);
    if (existing) existing.count += 1;
    else rows.set(id, { from: change.from, to: change.to, count: 1 });
  }
  return [...rows.values()];
}

/**
 * Preview lines, one per distinct from→to pair.
 *
 * @param changes Row diffs from a plan.
 * @returns {string[]}
 */
export function previewLines(changes: TagClusterChange[]): string[] {
  return groupChanges(changes).map((row) =>
    t("tags.previewLine", { from: row.from, to: row.to, count: row.count }),
  );
}
