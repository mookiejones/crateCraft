/**
 * Beatgrid block in the track detail pane (#238).
 *
 * The list is view-only. A BeatGrid frame this parser cannot read is
 * flagged as suspect. Nothing here fetches or writes.
 */

import type { Marker, Track } from "./api-types";
import { formatNumber, t, type MessageKey } from "./i18n";

/** Locale key for each `beatgrid_warning_code` from `GET /api/track`. */
export const GRID_WARNING_KEYS = {
  beatgrid_too_short: "markers.gridTooShort",
  beatgrid_version: "markers.gridVersion",
  beatgrid_empty: "markers.gridEmpty",
  beatgrid_too_many: "markers.gridTooMany",
  beatgrid_truncated: "markers.gridTruncated",
} as const satisfies Record<string, MessageKey>;

/**
 * True when the beatgrid block should say it is view-only.
 *
 * A missing file has no block. Every on-disk read is view-only.
 *
 * @param {boolean|undefined} unavailable `markers_unavailable` from the track.
 * @returns {boolean} True when the file could be read.
 */
export function beatgridViewOnly(unavailable: boolean | undefined): boolean {
  return unavailable !== true;
}

/**
 * True when `GET /api/track` named a BeatGrid this parser could not read.
 *
 * @param {string|null|undefined} code `beatgrid_warning_code`.
 * @returns {boolean} True for a non-empty code.
 */
export function beatgridIsSuspect(code: string | null | undefined): boolean {
  return typeof code === "string" && code !== "";
}

/**
 * Locale key for a beatgrid warning code.
 *
 * @param {string|null|undefined} code `beatgrid_warning_code`.
 * @returns {string|null} A `markers.grid*` key, or null when there is no code.
 */
export function beatgridWarningKey(code: string | null | undefined): MessageKey | null {
  if (!beatgridIsSuspect(code) || code == null) return null;
  if (Object.hasOwn(GRID_WARNING_KEYS, code)) {
    return GRID_WARNING_KEYS[code as keyof typeof GRID_WARNING_KEYS];
  }
  return "markers.gridUnknown";
}

/**
 * Format a beatgrid position for the panel.
 *
 * Three decimal places hide the binary noise in a stored float, such as
 * 1.2300000190734863. The export does not use this string. A value that
 * is not a finite number is left blank.
 *
 * @param {number|string|null|undefined} value Position in seconds.
 * @returns {string} Seconds with three decimal places, plus "s".
 */
export function beatSeconds(value: number | string | null | undefined): string {
  if (value === "" || value == null) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return `${number.toFixed(3)}s`;
}

/**
 * Paint the beatgrid heading, view-only note, suspect flag, and rows.
 *
 * A missing file leaves the section unchanged. Does not fetch.
 *
 * @param {HTMLElement} section Marker section.
 * @param {object} track Track payload including beatgrid fields.
 * @returns {void}
 */
export function appendBeatgrid(section: HTMLElement, track: Track): void {
  if (!beatgridViewOnly(track.markers_unavailable)) return;
  const heading = document.createElement("h4");
  heading.textContent = t("markers.gridHeading");
  section.append(heading);
  const viewOnly = document.createElement("p");
  viewOnly.className = "detail-kicker";
  viewOnly.textContent = t("markers.gridViewOnly");
  section.append(viewOnly);
  if (beatgridIsSuspect(track.beatgrid_warning_code)) {
    const warn = document.createElement("p");
    warn.className = "detail-kicker warn";
    warn.setAttribute("role", "status");
    const key = beatgridWarningKey(track.beatgrid_warning_code);
    const reason = key === "markers.gridUnknown"
      ? (typeof track.beatgrid_warning === "string" && track.beatgrid_warning
        ? track.beatgrid_warning
        : t("markers.gridUnknown"))
      : t(key ?? "markers.gridUnknown");
    warn.textContent = t("markers.gridSuspect", { reason });
    section.append(warn);
  } else if (!(track.beatgrid && track.beatgrid.length > 0)) {
    const empty = document.createElement("p");
    empty.className = "detail-kicker";
    empty.textContent = t("markers.gridNone");
    section.append(empty);
  }
  for (const mark of track.beatgrid || []) {
    section.append(paintBeatMarker(mark));
  }
}

/**
 * One beatgrid row: time and BPM or beat count.
 *
 * @param {object} mark Marker from `GET /api/track`.
 * @returns {HTMLElement} The row, not yet inserted.
 */
export function paintBeatMarker(mark: Marker): HTMLElement {
  const row = document.createElement("div");
  row.className = "marker";
  const time = document.createElement("span");
  time.textContent = beatSeconds(mark.position);
  const name = document.createElement("span");
  const bpmNumber = Number(mark.bpm);
  if (mark.bpm != null && mark.bpm !== "" && Number.isFinite(bpmNumber)) {
    name.textContent = t("markers.bpm", { bpm: formatNumber(bpmNumber, { maximumFractionDigits: 20 }) });
  } else if (mark.beats != null) {
    name.textContent = t("markers.beats", { count: Number(mark.beats) });
  } else {
    name.textContent = "";
  }
  row.append(document.createElement("span"), document.createElement("span"), time, name);
  return row;
}
