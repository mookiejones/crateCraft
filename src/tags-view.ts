/**
 * Pure copy helpers for the Tag spellings view.
 *
 * No DOM. tags.ts paints with these sentences. A language change can
 * call them again from the last payload.
 */

import type { TagClusterChange, TagClusterGroup, TagClusterPlan } from "./api-types";
import { t } from "./i18n";

export type TagField = "genre" | "artist" | "titles";

export interface SpellingChange {
  from: string;
  to: string;
  count: number;
  remixer?: string;
  field?: string;
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
  if (field === "titles") return titlesSummary(groups);
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
 * One-line count of titles that would change.
 *
 * @param changes Rows in the title-cleanup plan.
 * @returns {string}
 */
export function titlesSummary(changes: number): string {
  if (!changes) return t("tags.summaryTitlesClear");
  return t("tags.summaryTitles", { count: changes });
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
 * Status line after a title-cleanup preview.
 *
 * @param plan JSON from POST /api/tag-clusters action clean-preview.
 * @returns {string}
 */
export function titlesPreviewSummary(plan: TagClusterPlan): string {
  if (!plan.changes.length) return t("tags.summaryTitlesClear");
  return t("tags.titlesPreviewSummary", { count: plan.changes.length });
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
 * Status line after a title-cleanup write.
 *
 * @param plan JSON from POST /api/tag-clusters action clean-apply.
 * @returns {string}
 */
export function titlesWrittenSummary(plan: TagClusterPlan): string {
  return t("tags.titlesWritten", { count: plan.changes.length });
}

/**
 * Status line after a saved-mapping preview.
 *
 * @param plan JSON from POST /api/tag-clusters action refresh-preview.
 * @returns {string}
 */
export function mappingPreviewSummary(plan: TagClusterPlan): string {
  if (!plan.changes.length) return t("tags.noChanges");
  return t("tags.mappingSummary", { count: plan.changes.length });
}

/**
 * Status line after a saved-mapping write.
 *
 * @param plan JSON from POST /api/tag-clusters action refresh-apply.
 * @returns {string}
 */
export function mappingWrittenSummary(plan: TagClusterPlan): string {
  return t("tags.mappingWritten", { count: plan.changes.length });
}

/**
 * Field word for a mapping preview line.
 *
 * @param field Stored field name, usually genre or artist.
 * @returns {string}
 */
export function mappingFieldLabel(field: string): string {
  if (field === "genre") return t("tags.genre");
  if (field === "artist") return t("tags.artist");
  return field;
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
    const remixer = change.remixer ?? "";
    const field = change.field ?? "";
    const id = `${field}\0${change.from}\0${change.to}\0${remixer}`;
    const existing = rows.get(id);
    if (existing) existing.count += 1;
    else {
      const row: SpellingChange = { from: change.from, to: change.to, count: 1 };
      if (change.remixer) row.remixer = change.remixer;
      if (change.field) row.field = change.field;
      rows.set(id, row);
    }
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
  return groupChanges(changes).map((row) => {
    if (row.field) {
      return t("tags.previewLineField", {
        field: mappingFieldLabel(row.field),
        from: row.from,
        to: row.to,
        count: row.count,
      });
    }
    return row.remixer
      ? t("tags.previewLineRemixer", {
        from: row.from,
        to: row.to,
        remixer: row.remixer,
        count: row.count,
      })
      : t("tags.previewLine", { from: row.from, to: row.to, count: row.count });
  });
}
