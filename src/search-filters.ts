/**
 * Filter words in the track search box (#13).
 *
 * Plain words still search title, artist, album, genre, key, and file.
 * The field picker (`#search-field`) scopes those remaining words to one
 * field. Comments, grouping, and composer are not in All fields; they
 * match through that picker or through `comments:`, `grouping:`, and
 * `composer:`. These words filter instead, and combine with the selected
 * crate:
 *
 * - `bpm:124` rounds to 124, `bpm:120-128` is a range, `bpm:124~3` is
 *   124 plus or minus 3, and `bpm:>120` or `bpm:<100` is open-ended.
 *   Every bound is inclusive. `bpm:none` or `bpm:no` is no BPM.
 * - `key:8A` is that key, written as Camelot or as a key name (`Am`).
 *   `key:none` or `key:no` is a blank key.
 * - `mix:8A` is that key, one Camelot step either way in the same letter,
 *   or the relative key. It is the rule related-track suggestions and the
 *   harmonic crate preset use.
 * - `missing:yes` is a connected-drive missing file. Offline is not missing.
 * - `nokeybpm:yes` is a blank key or no BPM.
 * - `cues:none` or `cues:no` is a track whose cue flag is empty
 *   (`has_cues` false, `markers_found` false, or an empty `cues` list).
 *   A list row without those fields does not match.
 * - `comments:peak`, `grouping:warm`, `composer:ada`, and the same
 *   prefixes for title, artist, album, genre, and file search that one
 *   field. An empty value (`comments:`) stays a plain word.
 *
 * A word that looks like a filter but cannot be read (`bpm:fast`) stays a
 * plain search word, so a typo narrows the list instead of being dropped.
 * Nothing here fetches or writes.
 */

import type { Track } from "./api-types";

export const TEXT_SEARCH_FIELDS = [
  "comments",
  "grouping",
  "composer",
  "title",
  "artist",
  "album",
  "genre",
  "file",
] as const;

export type TextSearchField = (typeof TEXT_SEARCH_FIELDS)[number];

export type SearchFilter =
  | { kind: "bpm"; min: number; max: number }
  | { kind: "key"; keys: ReadonlySet<number> }
  | { kind: "missing" }
  | { kind: "nokey" }
  | { kind: "nobpm" }
  | { kind: "nokeybpm" }
  | { kind: "nocues" }
  | { kind: "field"; field: TextSearchField; value: string };

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
const NONE = new Set(["none", "no", "off"]);
const YES = new Set(["yes", "true", "1"]);

function isNone(value: string): boolean {
  return NONE.has(value);
}

function isYes(value: string): boolean {
  return YES.has(value);
}

const TEXT_FIELD_SET: ReadonlySet<string> = new Set(TEXT_SEARCH_FIELDS);

/**
 * Tell whether a search-field value is one of the picker fields.
 *
 * @param {string} value Select value or prefix name.
 * @returns {boolean} True for comments, grouping, composer, title, artist, album, genre, or file.
 */
export function isTextSearchField(value: string): value is TextSearchField {
  return TEXT_FIELD_SET.has(value);
}

/**
 * Read one searchable text field from a track.
 *
 * Title is `name` on the library payload. A missing field is empty.
 *
 * @param {Track} track Track or history row.
 * @param {TextSearchField} field Picker or prefix field.
 * @returns {string} Stored text, or an empty string.
 */
export function textField(track: Track, field: TextSearchField): string {
  if (field === "title") return String(track.name ?? "");
  return String(track[field] ?? "");
}

/**
 * Build the lowercase haystack for remaining search words.
 *
 * All fields is title, artist, album, genre, key, and file. Comments,
 * grouping, and composer stay out of that haystack.
 *
 * @param {Track} track Track or history row.
 * @param {TextSearchField} [field] One field from the picker, or all fields.
 * @returns {string} Lowercased text to match against.
 */
export function trackHaystack(track: Track, field?: TextSearchField): string {
  if (field) return textField(track, field).toLocaleLowerCase();
  return `${track.name} ${track.artist} ${track.album} ${track.genre} ${track.key} ${track.file}`.toLocaleLowerCase();
}

function hasBpm(track: Track): boolean {
  const bpm = Number(track.bpm);
  return track.bpm != null && track.bpm !== "" && Number.isFinite(bpm) && bpm > 0;
}

function hasKey(track: Track): boolean {
  return Boolean(String(track.key ?? "").trim());
}

/**
 * Read whether the track has cue data the list already knows.
 *
 * GET /api/library does not open audio files, so most rows omit these
 * fields and this returns null. Tests and GET /api/track can set them.
 *
 * @param {Track} track Track or history row.
 * @returns {boolean | null} True, false, or null when unknown.
 */
export function cueFlag(track: Track): boolean | null {
  if (track.has_cues === true) return true;
  if (track.has_cues === false) return false;
  if (track.markers_found === true) return true;
  if (track.markers_found === false) return false;
  if (Array.isArray(track.cues)) {
    const loops = Array.isArray(track.loops) ? track.loops.length : 0;
    return track.cues.length > 0 || loops > 0;
  }
  return null;
}

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
    if (name === "missing" && isYes(value)) filter = { kind: "missing" };
    else if (name === "cues" && isNone(value)) filter = { kind: "nocues" };
    else if (name === "nokeybpm" && isYes(value)) filter = { kind: "nokeybpm" };
    else if (name === "bpm" && isNone(value)) filter = { kind: "nobpm" };
    else if (name === "key" && isNone(value)) filter = { kind: "nokey" };
    else if (name === "bpm") filter = bpmFilter(value);
    else if (name === "key" || name === "mix") {
      const key = keyNumber(value);
      if (key >= 0) filter = { kind: "key", keys: name === "mix" ? mixingKeys(key) : new Set([key]) };
    } else if (isTextSearchField(name) && value) {
      filter = { kind: "field", field: name, value };
    }
    if (filter) filters.push(filter);
    else terms.push(word);
  }
  return { terms, filters };
}

/**
 * Tell whether a track passes every filter.
 *
 * A track with no BPM, or a BPM of zero, never passes a BPM range
 * filter. A track whose key cannot be read never passes a key filter.
 * `cues:none` does not match a row whose cue flag is unknown.
 *
 * @param {Track} track Track or history row.
 * @param {SearchFilter[]} filters Filters from parseQuery.
 * @returns {boolean} True when every filter passes, or there are none.
 */
export function matchesFilters(track: Track, filters: readonly SearchFilter[]): boolean {
  for (const filter of filters) {
    if (filter.kind === "bpm") {
      if (!hasBpm(track)) return false;
      const bpm = Number(track.bpm);
      if (bpm < filter.min - 1e-9 || bpm > filter.max + 1e-9) return false;
    } else if (filter.kind === "missing") {
      if (!track.missing) return false;
    } else if (filter.kind === "nokey") {
      if (hasKey(track)) return false;
    } else if (filter.kind === "nobpm") {
      if (hasBpm(track)) return false;
    } else if (filter.kind === "nokeybpm") {
      if (hasKey(track) && hasBpm(track)) return false;
    } else if (filter.kind === "nocues") {
      if (cueFlag(track) !== false) return false;
    } else if (filter.kind === "field") {
      if (!textField(track, filter.field).toLocaleLowerCase().includes(filter.value)) return false;
    } else if (!filter.keys.has(keyNumber(track.key))) {
      return false;
    }
  }
  return true;
}

/**
 * Return whether a track contains every search word and passes every filter.
 *
 * Remaining words search the haystack from trackHaystack. An empty query
 * matches everything. No request is made.
 *
 * @param {Track} track Track or history row.
 * @param {ParsedQuery} query Words and filters from parseQuery.
 * @param {TextSearchField} [field] Picker field for remaining words.
 * @returns {boolean} True when every word occurs and every filter passes.
 */
export function matchesQuery(track: Track, query: ParsedQuery, field?: TextSearchField): boolean {
  if (!matchesFilters(track, query.filters)) return false;
  if (!query.terms.length) return true;
  const hay = trackHaystack(track, field);
  return query.terms.every((term) => hay.includes(term));
}
