/**
 * Field-editor labels, show gate, and Apply-ready fingerprint.
 *
 * No fetch. FieldEditorBar paints with these sentences. A language
 * change can call them again from the last plan.
 */

import type { TagClusterPlan } from "../api-types";
import { t, type MessageKey } from "../i18n";

export const EDIT_FIELDS = [
  "name",
  "artist",
  "album",
  "genre",
  "year",
  "composer",
  "remixer",
  "label",
  "grouping",
  "comments",
  "key",
] as const;

export type EditField = (typeof EDIT_FIELDS)[number];

export type FieldEditRequest = {
  ids: readonly number[];
  field: string;
  value: string;
};

const FIELD_LABELS: Record<EditField, MessageKey> = {
  name: "column.title",
  artist: "column.artist",
  album: "field.album",
  genre: "field.genre",
  year: "field.year",
  composer: "field.composer",
  remixer: "field.remixer",
  label: "field.label",
  grouping: "field.grouping",
  comments: "field.comments",
  key: "column.key",
};

/**
 * Return whether the field editor bar should show.
 *
 * @param count Checked crate rows.
 * @returns True when two or more rows are selected.
 */
export function fieldEditShows(count: number): boolean {
  return count >= 2;
}

/**
 * Label for one editable library field.
 *
 * @param field Column name from EDIT_FIELDS.
 * @returns Title, Artist, Genre, Key, and the other field labels.
 */
export function fieldEditLabel(field: EditField): string {
  return t(FIELD_LABELS[field]);
}

/**
 * Stable ids + field + value string for Apply-ready.
 *
 * @param request Current or previewed edit.
 * @returns Fingerprint compared on Apply.
 */
export function fieldEditFingerprint(request: FieldEditRequest): string {
  return `${request.ids.join(",")}|${request.field}|${request.value}`;
}

/**
 * Return whether Apply may write the last preview.
 *
 * @param plan Last edit-preview reply.
 * @param previewed Request that produced `plan`.
 * @param current Field, value, and ids now in the bar.
 * @param writable Library writes are allowed.
 * @param busy A preview or apply is in flight.
 * @returns True when the preview still matches and at least one row would change.
 */
export function fieldEditApplyReady(
  plan: TagClusterPlan | null,
  previewed: FieldEditRequest | null,
  current: FieldEditRequest,
  writable: boolean,
  busy: boolean,
): boolean {
  if (!plan || !previewed || !writable || busy || plan.changes.length === 0) {
    return false;
  }
  return fieldEditFingerprint(previewed) === fieldEditFingerprint(current);
}

/**
 * Count of checked crate rows.
 *
 * @param count Selected ids.
 * @returns Localized selected sentence.
 */
export function fieldEditSelectedText(count: number): string {
  return t("fieldEdit.selected", { count });
}

/**
 * One-line preview of rows that would change.
 *
 * @param plan Last edit-preview reply.
 * @returns Localized preview sentence, or no-change copy.
 */
export function fieldEditPreviewText(plan: TagClusterPlan): string {
  if (!plan.changes.length) return t("fieldEdit.noChanges");
  return t("tags.previewSummary", { count: plan.changes.length, value: plan.value });
}

/**
 * One-line write confirmation.
 *
 * @param plan Last edit-apply reply.
 * @returns Localized written sentence.
 */
export function fieldEditWrittenText(plan: TagClusterPlan): string {
  return t("tags.written", { count: plan.changes.length, value: plan.value });
}
