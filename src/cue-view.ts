/**
 * Cue pad slots and restore cue diffs (#236).
 *
 * The detail pane paints pads 1–8 with CuePads. restore.ts paints
 * before → after for a changed slot. Colors are the Serato DJ Pro GUI
 * pad defaults from Mixxx's kSeratoDJProHotcueColorPalette assignment
 * `{0, 2, 12, 3, 6, 15, 9, 14}`. A stored hex color wins. Nothing here
 * fetches or writes.
 */

import type { FrameCueSet, Marker } from "./api-types";
import { t } from "./i18n";

/** Pad count Serato DJ Pro shows. Index 0 is pad 1. */
export const CUE_SLOT_COUNT = 8;

/**
 * CSS `var(--cue-slot-N)` for pads 1–8.
 *
 * Hex values live in `tokens.css`. Mixxx maps those pads onto
 * kSeratoDJProHotcueColorPalette at `{0, 2, 12, 3, 6, 15, 9, 14}`.
 * A cue that already stores a hex color keeps that color.
 */
export function cueSlotVar(index: number): string {
  return `var(--cue-slot-${index + 1})`;
}

const CUE_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export interface CueDiff {
  slot: number;
  before: Marker | null;
  after: Marker | null;
}

/**
 * True when `value` is a `#` hex color the page can paint.
 *
 * @param {string} value Stored color text.
 * @returns {boolean} True for 3, 6, or 8 hex digits after `#`.
 */
export function isCueColor(value: string): boolean {
  return CUE_COLOR.test(value);
}

/**
 * Color for one pad.
 *
 * A valid stored hex value is used as-is. Otherwise the Serato GUI
 * default for that pad. An index outside 0–7 with no stored color is
 * blank.
 *
 * @param {number} index Zero-based pad index.
 * @param {string|null|undefined} stored Color from the file, if any.
 * @returns {string} A `#` hex string, or `""`.
 */
export function slotColor(index: number, stored?: string | null): string {
  if (typeof stored === "string" && isCueColor(stored)) return stored;
  if (Number.isInteger(index) && index >= 0 && index < CUE_SLOT_COUNT) {
    return cueSlotVar(index);
  }
  return "";
}

/**
 * Map cues onto pads 1–8.
 *
 * The first cue with each index 0–7 fills that pad. Later cues with the
 * same index are left for `extraCues`. Missing pads are `null`.
 *
 * @param {object[]|undefined} cues Cue rows from the track or a frame.
 * @returns {(object|null)[]} Always eight entries.
 */
export function cueSlots(cues: readonly Marker[] | undefined): Array<Marker | null> {
  const slots: Array<Marker | null> = Array.from({ length: CUE_SLOT_COUNT }, () => null);
  if (!cues) return slots;
  for (const cue of cues) {
    const index = Number(cue.index);
    if (!Number.isInteger(index) || index < 0 || index >= CUE_SLOT_COUNT) continue;
    if (slots[index] == null) slots[index] = cue;
  }
  return slots;
}

/**
 * Cues that are not one of the eight pads.
 *
 * A duplicate index 0–7 after the first, an index outside 0–7, or a
 * missing index is listed. Order is the file order.
 *
 * @param {object[]|undefined} cues Cue rows from the track or a frame.
 * @returns {object[]} Those extra rows, possibly empty.
 */
export function extraCues(cues: readonly Marker[] | undefined): Marker[] {
  if (!cues) return [];
  const seen = new Set<number>();
  const extra: Marker[] = [];
  for (const cue of cues) {
    const index = Number(cue.index);
    if (!Number.isInteger(index) || index < 0 || index >= CUE_SLOT_COUNT) {
      extra.push(cue);
      continue;
    }
    if (seen.has(index)) extra.push(cue);
    else seen.add(index);
  }
  return extra;
}

/**
 * Format a cue time as m:ss.sss.
 *
 * Three decimal places keep a cue distinguishable inside one second.
 *
 * @param {number|string|null|undefined} value Time in milliseconds.
 * @returns {string} Minutes, seconds, and milliseconds.
 */
export function formatCueTime(value: number | string | null | undefined): string {
  const total = Number(value) / 1000;
  const minutes = Math.floor(total / 60);
  return `${minutes}:${(total - minutes * 60).toFixed(3).padStart(6, "0")}`;
}

/**
 * Cue list from a restore frame payload.
 *
 * The snapshot stores `{cues, loops, flips}` or `null`. A grid diff
 * stores an array; that is not a cue list.
 *
 * @param {object|Array|null|undefined} value `before` or `after` on a frame diff.
 * @returns {object[]} Cue rows, or `[]`.
 */
export function cuesFromFrame(value: FrameCueSet | unknown[] | null | undefined): Marker[] {
  if (value == null || Array.isArray(value)) return [];
  return Array.isArray(value.cues) ? value.cues : [];
}

/**
 * One-line label for a cue, or the empty word.
 *
 * @param {object|null} cue The cue, or null for an empty pad.
 * @param {string} empty Word for an empty pad, already translated.
 * @returns {string} Time and name, or `empty`.
 */
export function cueSummary(cue: Marker | null, empty: string): string {
  if (!cue) return empty;
  const named = typeof cue.name === "string" ? cue.name.trim() : "";
  const time = formatCueTime(cue.start_ms);
  return named ? `${time} ${named}` : time;
}

/**
 * Slots whose stored cue changed between two frames.
 *
 * Unchanged pads are omitted. Extra cues (index outside 0–7) are
 * compared by that index after the eight pads.
 *
 * @param {object|Array|null|undefined} before Snapshot or live cues.
 * @param {object|Array|null|undefined} after Snapshot or live cues.
 * @returns {object[]} Changed slots, lowest index first.
 */
export function cueDiffRows(
  before: FrameCueSet | unknown[] | null | undefined,
  after: FrameCueSet | unknown[] | null | undefined,
): CueDiff[] {
  const beforeCues = cuesFromFrame(before);
  const afterCues = cuesFromFrame(after);
  const beforeSlots = cueSlots(beforeCues);
  const afterSlots = cueSlots(afterCues);
  const diffs: CueDiff[] = [];
  for (let slot = 0; slot < CUE_SLOT_COUNT; slot += 1) {
    const left = beforeSlots[slot] ?? null;
    const right = afterSlots[slot] ?? null;
    if (cueSignature(left) === cueSignature(right)) continue;
    diffs.push({ slot, before: left, after: right });
  }
  const beforeExtra = extraCues(beforeCues);
  const afterExtra = extraCues(afterCues);
  const indexes = new Set<number>();
  for (const cue of [...beforeExtra, ...afterExtra]) {
    const index = Number(cue.index);
    if (Number.isInteger(index)) indexes.add(index);
  }
  const sorted = [...indexes].sort((left, right) => left - right);
  for (const index of sorted) {
    const left = beforeExtra.find((cue) => Number(cue.index) === index) ?? null;
    const right = afterExtra.find((cue) => Number(cue.index) === index) ?? null;
    if (cueSignature(left) === cueSignature(right)) continue;
    diffs.push({ slot: index, before: left, after: right });
  }
  return diffs;
}

/**
 * Paint pads 1–8, then any extra cues, onto a section.
 *
 * @param {HTMLElement} section Marker section.
 * @param {object[]|undefined} cues Cue rows from the track.
 * @returns {void}
 */
export function appendCueSlots(section: HTMLElement, cues: readonly Marker[] | undefined): void {
  const slots = cueSlots(cues);
  for (let slot = 0; slot < slots.length; slot += 1) {
    section.append(paintCueSlot(slot, slots[slot] ?? null));
  }
  for (const extra of extraCues(cues)) {
    const index = Number(extra.index);
    const slot = Number.isInteger(index) ? index : -1;
    section.append(paintCueSlot(slot, extra));
  }
}

/**
 * One pad row: number, swatch, time, name or Empty.
 *
 * @param {number} slot Zero-based pad index, or -1 when the index is missing.
 * @param {object|null} cue The cue, or null for an empty pad.
 * @returns {HTMLElement} The row, not yet inserted.
 */
export function paintCueSlot(slot: number, cue: Marker | null): HTMLElement {
  const row = document.createElement("div");
  row.className = cue ? "marker" : "marker marker-empty";
  const number = document.createElement("span");
  number.className = "marker-slot";
  number.textContent = slot >= 0 ? String(slot + 1) : "";
  const swatch = document.createElement("span");
  swatch.className = "swatch";
  const color = slotColor(slot, cue?.color);
  if (color) swatch.style.background = color;
  const time = document.createElement("span");
  time.textContent = cue ? formatCueTime(cue.start_ms) : "—";
  const name = document.createElement("span");
  const named = cue && typeof cue.name === "string" ? cue.name.trim() : "";
  if (cue) {
    name.textContent = named || t("markers.cue", { number: slot >= 0 ? slot + 1 : 0 });
  } else {
    name.textContent = t("markers.cueEmpty");
  }
  row.append(number, swatch, time, name);
  return row;
}

/**
 * One restore line: pad number, before swatch and text, arrow, after.
 *
 * @param {object} diff One changed slot.
 * @returns {HTMLElement} The row, not yet inserted.
 */
export function paintCueDiffRow(diff: CueDiff): HTMLElement {
  const row = document.createElement("p");
  row.className = "cue-diff";
  const empty = t("markers.cueEmpty");
  const beforeText = cueSummary(diff.before, empty);
  const afterText = cueSummary(diff.after, empty);
  row.setAttribute(
    "aria-label",
    `${t("markers.cue", { number: diff.slot + 1 })}: ${t("plan.cueDiff", { before: beforeText, after: afterText })}`,
  );
  const number = document.createElement("span");
  number.className = "marker-slot";
  number.textContent = String(diff.slot + 1);
  const arrow = document.createElement("span");
  arrow.className = "cue-diff-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  row.append(number, paintCueSide(diff.before, diff.slot), arrow, paintCueSide(diff.after, diff.slot));
  return row;
}

/**
 * Compare the stored fields that make a cue look different.
 *
 * @param {object|null} cue The cue, or null.
 * @returns {string} A stable key.
 */
function cueSignature(cue: Marker | null): string {
  if (!cue) return "";
  const start = Number(cue.start_ms);
  const color = typeof cue.color === "string" ? cue.color : "";
  const name = typeof cue.name === "string" ? cue.name : "";
  return `${start}\0${color}\0${name}`;
}

/**
 * One side of a restore cue line.
 *
 * @param {object|null} cue The cue, or null for empty.
 * @param {number} slot Zero-based pad index.
 * @returns {HTMLElement} Swatch plus text.
 */
function paintCueSide(cue: Marker | null, slot: number): HTMLElement {
  const side = document.createElement("span");
  side.className = cue ? "cue-diff-side" : "cue-diff-side marker-empty";
  const swatch = document.createElement("span");
  swatch.className = "swatch";
  const color = slotColor(slot, cue?.color);
  if (color) swatch.style.background = color;
  const text = document.createElement("span");
  text.textContent = cueSummary(cue, t("markers.cueEmpty"));
  side.append(swatch, text);
  return side;
}
