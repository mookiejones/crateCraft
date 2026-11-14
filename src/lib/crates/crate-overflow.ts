/**
 * Which crate action ids stay on the row and which sit under More.
 *
 * Native menu and tests still click the overflow ids. This module does
 * not paint.
 */

export const CRATE_PRIMARY_ACTION_IDS = ["crate-new", "crate-rename", "crate-delete"] as const;

export const CRATE_RAIL_OVERFLOW_IDS = [
  "crate-color",
  "crate-preset",
  "crate-folder-sync",
  "crate-rename-from-tags",
  "crate-refresh",
] as const;

export const CRATE_SHEET_OVERFLOW_IDS = ["crate-split", "crate-save-view", "export-m3u"] as const;

export const CRATE_OVERFLOW_ACTION_IDS = [
  ...CRATE_RAIL_OVERFLOW_IDS,
  ...CRATE_SHEET_OVERFLOW_IDS,
] as const;

export type CratePrimaryActionId = (typeof CRATE_PRIMARY_ACTION_IDS)[number];
export type CrateOverflowActionId = (typeof CRATE_OVERFLOW_ACTION_IDS)[number];

const PRIMARY = new Set<string>(CRATE_PRIMARY_ACTION_IDS);
const OVERFLOW = new Set<string>(CRATE_OVERFLOW_ACTION_IDS);

/**
 * Return whether `id` is New, Rename, or Delete.
 *
 * @param id Control id.
 */
export function isCratePrimaryAction(id: string): id is CratePrimaryActionId {
  return PRIMARY.has(id);
}

/**
 * Return whether `id` belongs under More.
 *
 * @param id Control id.
 */
export function isCrateOverflowAction(id: string): id is CrateOverflowActionId {
  return OVERFLOW.has(id);
}
