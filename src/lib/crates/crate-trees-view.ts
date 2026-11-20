/**
 * Pure helpers for the crate-tree dialog (part 2 of #31).
 *
 * crate-trees.ts runs the dialog and the requests. Nothing here fetches.
 */

import type { CrateTreeKind, CrateTreeSpec } from "../api-types";
import { el } from "../dom";
import { t } from "../i18n";
import { scopeCrate } from "./preset-view";

export type { CrateTreeKind, CrateTreeSpec };

const MAX_BPM = 400;
const MAX_WIDTH = 50;
const MAX_BANDS = 60;
const MAX_GENRES = 100;

export interface CrateTreeChild {
  name: string;
  count: number;
}

export interface CrateTreePreviewReply {
  name?: string;
  children?: CrateTreeChild[];
}

export interface CrateTreeCreateReply {
  id?: number;
  name?: string;
  children?: Array<{ id?: number; name?: string; count?: number }>;
  warning?: string | null;
  queued?: boolean;
}

/**
 * Name a tree's parent crate in the page language.
 *
 * @param {CrateTreeKind} kind The tree kind.
 * @returns {string} BPM bands, Keys, Genres, or Genre families.
 */
export function defaultTreeName(kind: CrateTreeKind): string {
  if (kind === "bpm") return t("crateTree.name.bpm");
  if (kind === "key") return t("crateTree.name.key");
  if (kind === "family") return t("crateTree.name.family");
  return t("crateTree.name.genre");
}

/**
 * Read a whole or decimal number from an input.
 *
 * @param {HTMLInputElement} input The field.
 * @param {number} fallback Used when the field is blank.
 * @returns {number | null} The number, the fallback, or null when the text is not a number.
 */
function numberOrDefault(input: HTMLInputElement, fallback: number): number | null {
  const text = input.value.trim();
  if (!text) return fallback;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * Read a whole number from an input.
 *
 * @param {HTMLInputElement} input The field.
 * @param {number} fallback Used when the field is blank.
 * @returns {number | null} The integer, the fallback, or null when the text is not a whole number.
 */
function integerOrDefault(input: HTMLInputElement, fallback: number): number | null {
  const value = numberOrDefault(input, fallback);
  return value != null && Number.isInteger(value) ? value : null;
}

/**
 * Count the BPM bands a tree would make.
 *
 * Stops after one more than the cap so a tiny step cannot loop forever.
 *
 * @param {number} low First band start.
 * @param {number} high No band starts at or above this.
 * @param {number} width Band width.
 * @param {number} step Distance between starts.
 * @returns {number} Band count, at most MAX_BANDS + 1.
 */
function bandCount(low: number, high: number, width: number, step: number): number {
  let n = 0;
  let start = low;
  while (start < high - 1e-9 && n <= MAX_BANDS) {
    n += 1;
    start += step;
  }
  return n;
}

/**
 * Build the tree the dialog describes.
 *
 * Only checks what the page can check. The server checks every field again.
 *
 * @returns {CrateTreeSpec | null} The tree, or null while a field is blank or out of range.
 */
export function readTreeForm(): CrateTreeSpec | null {
  const kind = el("crate-tree-kind").value as CrateTreeKind;
  const scope = scopeCrate();
  const crate = scope && el("crate-tree-scope").checked ? { crate: scope.id } : {};
  if (kind === "key") return { kind, ...crate };
  if (kind === "bpm") {
    const low = numberOrDefault(el("crate-tree-low"), 80);
    const high = numberOrDefault(el("crate-tree-high"), 140);
    const width = numberOrDefault(el("crate-tree-width"), 10);
    const step = numberOrDefault(el("crate-tree-step"), width ?? 10);
    if (
      low == null ||
      high == null ||
      width == null ||
      step == null ||
      low < 1 ||
      high > MAX_BPM ||
      high <= low ||
      width < 1 ||
      width > MAX_WIDTH ||
      step < 1 ||
      step > width ||
      bandCount(low, high, width, step) > MAX_BANDS
    ) {
      return null;
    }
    return { kind, low, high, width, step, ...crate };
  }
  if (kind === "genre" || kind === "family") {
    const minTracks = integerOrDefault(el("crate-tree-min-tracks"), 2);
    const limit = integerOrDefault(el("crate-tree-limit"), 40);
    if (minTracks == null || limit == null || minTracks < 1 || limit < 1 || limit > MAX_GENRES) {
      return null;
    }
    return { kind, min_tracks: minTracks, limit, ...crate };
  }
  return null;
}

/**
 * Show only the fields of the chosen tree kind.
 *
 * @returns {void}
 */
export function syncTreeFields(): void {
  const kind = el("crate-tree-kind").value;
  const shown = kind === "family" ? "genre" : kind;
  for (const field of document.querySelectorAll<HTMLElement>("#crate-tree-dialog [data-tree-kind]")) {
    field.hidden = field.dataset.treeKind !== shown;
  }
}

/**
 * Describe a preview in the active language.
 *
 * @param {CrateTreeChild[]} children Subcrates the tree would make.
 * @returns {string} The preview sentence.
 */
export function crateTreePreviewText(children: CrateTreeChild[]): string {
  if (children.length === 0) return t("crateTree.empty");
  const listed = children
    .map((child) => t("crateTree.child", { name: child.name, count: child.count }))
    .join(", ");
  return `${t("crateTree.preview", { count: children.length })} ${listed}`;
}

/**
 * Return whether a preview would create at least one subcrate.
 *
 * @param {CrateTreeChild[]} children Subcrates the tree would make.
 * @returns {boolean} True when Create may write.
 */
export function crateTreeHasChildren(children: CrateTreeChild[]): boolean {
  return children.length > 0;
}
