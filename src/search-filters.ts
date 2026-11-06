/**
 * Filter words in the track search box (#13).
 *
 * Plain words still search title, artist, album, genre, key, and file.
 * These words filter instead, and combine with the selected crate:
 *
 * - `bpm:124` rounds to 124, `bpm:120-128` is a range, `bpm:124~3` is
 *   124 plus or minus 3, and `bpm:>120` or `bpm:<100` is open-ended.
 *   Every bound is inclusive.
 * - `key:8A` is that key, written as Camelot or as a key name (`Am`).
 * - `mix:8A` is that key, one Camelot step either way in the same letter,
 *   or the relative key. It is the rule related-track suggestions and the
 *   harmonic crate preset use.
 *
 * A word that looks like a filter but cannot be read (`bpm:fast`) stays a
 * plain search word, so a typo narrows the list instead of being dropped.
 * Nothing here fetches or writes.
 */

import type { Track } from "./api-types";

export type SearchFilter =
  | { kind: "bpm"; min: number; max: number }
  | { kind: "key"; keys: ReadonlySet<number> };

export interface ParsedQuery {
  /** Lowercased plain words. */
  terms: string[];
  filters: SearchFilter[];
}

/** Serato's key numbers: 0-11 are 1A-12A, 12-23 are 1B-12B. Same table as library._KEY_VALUES. */
const KEY_VALUES: Readonly<Record<string, number>> = {
  "g#m": 0, abm: 0, "1a": 0,
  ebm: 1, "d#m": 1, "2a": 1,
  bbm: 2, "a#m": 2, "3a": 2,
  fm: 3, "4a": 3,
  cm: 4, "5a": 4,
  gm: 5, "6a": 5,
  dm: 6, "7a": 6,
  am: 7, "8a": 7,
  em: 8, "9a": 8,
  bm: 9, "10a": 9,
  "f#m": 10, gbm: 10, "11a": 10,
  "c#m": 11, dbm: 11, "12a": 11,
  b: 12, "1b": 12,
  "f#": 13, gb: 13, "2b": 13,
  "c#": 14, db: 14, "3b": 14,
  "g#": 15, ab: 15, "4b": 15,
  "d#": 16, eb: 16, "5b": 16,
  "a#": 17, bb: 17, "6b": 17,
  f: 18, "7b": 18,
  c: 19, "8b": 19,
  g: 20, "9b": 20,
  d: 21, "10b": 21,
  a: 22, "11b": 22,
  e: 23, "12b": 23,
};

const NUMBER = String.raw`(\d+(?:\.\d+)?)`;
const EXACT = new RegExp(`^${NUMBER}$`);
const RANGE = new RegExp(`^${NUMBER}-${NUMBER}$`);
const AROUND = new RegExp(`^${NUMBER}~${NUMBER}$`);
const ABOVE = new RegExp(`^>${NUMBER}$`);
const BELOW = new RegExp(`^<${NUMBER}$`);

/**
 * Map a key name to Serato's key number.
 *
 * @param {string | null | undefined} value Camelot (`8A`) or key name (`Am`), any case.
 * @returns {number} 0-23, or -1 when blank or unknown.
 */
export function keyNumber(value: string | null | undefined): number {
  if (!value) return -1;
  return KEY_VALUES[value.trim().toLowerCase()] ?? -1;
}

/**
 * List the key numbers that mix with one key.
 *
 * @param {number} key A key number from 0 to 23.
 * @returns {Set<number>} The key, one step down and up in the same letter (12 wraps to 1), and the relative key.
 */
export function mixingKeys(key: number): Set<number> {
  const base = key < 12 ? 0 : 12;
  const index = key - base;
  return new Set([key, base + ((index + 1) % 12), base + ((index + 11) % 12), (key + 12) % 24]);
}

/**
 * Read the value after `bpm:`.
 *
 * @param {string} value Text after the colon.
 * @returns {SearchFilter | null} The range, or null when it cannot be read.
 */
function bpmFilter(value: string): SearchFilter | null {
  let match = RANGE.exec(value);
  if (match) {
    const low = Number(match[1]);
    const high = Number(match[2]);
    return low <= high ? { kind: "bpm", min: low, max: high } : { kind: "bpm", min: high, max: low };
  }
  match = AROUND.exec(value);
  if (match) {
    const center = Number(match[1]);
    const spread = Number(match[2]);
    return { kind: "bpm", min: center - spread, max: center + spread };
  }
  match = ABOVE.exec(value);
  if (match) return { kind: "bpm", min: Number(match[1]), max: Number.POSITIVE_INFINITY };
  match = BELOW.exec(value);
  if (match) return { kind: "bpm", min: 0, max: Number(match[1]) };
  match = EXACT.exec(value);
  if (match) {
    const whole = Number(match[1]);
    return Number.isInteger(whole)
      ? { kind: "bpm", min: whole - 0.5, max: whole + 0.5 - 1e-6 }
      : { kind: "bpm", min: whole, max: whole };
  }
  return null;
}

/**
 * Split the search box into plain words and filters.
 *
 * @param {string} text The search box value.
 * @returns {ParsedQuery} Lowercased words and the filters that could be read.
 */
export function parseQuery(text: string): ParsedQuery {
  const terms: string[] = [];
  const filters: SearchFilter[] = [];
  for (const word of text.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)) {
    const colon = word.indexOf(":");
    const name = colon > 0 ? word.slice(0, colon) : "";
    const value = colon > 0 ? word.slice(colon + 1) : "";
    let filter: SearchFilter | null = null;
    if (name === "bpm") filter = bpmFilter(value);
    else if (name === "key" || name === "mix") {
      const key = keyNumber(value);
      if (key >= 0) filter = { kind: "key", keys: name === "mix" ? mixingKeys(key) : new Set([key]) };
    }
    if (filter) filters.push(filter);
    else terms.push(word);
  }
  return { terms, filters };
}

/**
 * Tell whether a track passes every filter.
 *
 * A track with no BPM, or a BPM of zero, never passes a BPM filter. A
 * track whose key cannot be read never passes a key filter.
 *
 * @param {Track} track Track or history row.
 * @param {SearchFilter[]} filters Filters from parseQuery.
 * @returns {boolean} True when every filter passes, or there are none.
 */
export function matchesFilters(track: Track, filters: readonly SearchFilter[]): boolean {
  for (const filter of filters) {
    if (filter.kind === "bpm") {
      const bpm = Number(track.bpm);
      if (!(track.bpm != null && track.bpm !== "" && Number.isFinite(bpm) && bpm > 0)) return false;
      if (bpm < filter.min - 1e-9 || bpm > filter.max + 1e-9) return false;
    } else if (!filter.keys.has(keyNumber(track.key))) {
      return false;
    }
  }
  return true;
}
