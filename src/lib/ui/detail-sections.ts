/**
 * Detail-pane sections: counts, open/closed map, and scroll.
 *
 * Closed cards live in `layout.detail_sections`. A missing id is open.
 * The map is shared across tracks. Nothing here reads the library.
 */

import { useSyncExternalStore } from "react";
import { postJSON } from "../api";
import type { Track } from "../api-types";
import { t } from "../i18n";
import { prefersReducedMotion } from "./motion";
import { setNotice } from "./notice-store";

/** DOM order of the detail cards. Scroll spy follows this order. */
export const DETAIL_SECTION_IDS = ["related", "markers", "crates", "copies", "fields"] as const;

export type DetailSectionId = (typeof DETAIL_SECTION_IDS)[number];

/** Known ids only. False means closed. A missing id means open. */
export type DetailSectionMap = Partial<Record<DetailSectionId, boolean>>;

const KNOWN = new Set<string>(DETAIL_SECTION_IDS);

let openMap: DetailSectionMap = {};
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function snapshot(): DetailSectionMap {
  return openMap;
}

/**
 * True when `value` is a detail section id.
 *
 * @param value Candidate from a dataset or a settings key.
 * @returns True for the five known ids.
 */
export function isDetailSectionId(value: string | undefined): value is DetailSectionId {
  return value != null && KNOWN.has(value);
}

/**
 * Cues, loops, and flips. The beatgrid is not part of this count.
 *
 * @param track Open track.
 * @returns Marker rows already on the track payload.
 */
export function markerCount(track: Track): number {
  return (track.cues?.length ?? 0) + (track.loops?.length ?? 0) + (track.flips?.length ?? 0);
}

/**
 * Crates this track is in. Not the number of crates in the library.
 *
 * @param track Open track.
 * @returns `crate_ids` length, or 0.
 */
export function crateMembershipCount(track: Track): number {
  return track.crate_ids?.length ?? 0;
}

/**
 * Other copies of this track.
 *
 * @param track Open track.
 * @returns `copies` length, or 0.
 */
export function copyCount(track: Track): number {
  return track.copies?.length ?? 0;
}

/**
 * Field groups on the track. One chip covers every group.
 *
 * @param track Open track.
 * @returns `groups` length, or 0.
 */
export function fieldGroupCount(track: Track): number {
  return track.groups?.length ?? 0;
}

/**
 * True when the beatgrid block has rows.
 *
 * @param track Open track.
 * @returns True when `beatgrid` is a non-empty list.
 */
export function hasBeatgrid(track: Track): boolean {
  return Array.isArray(track.beatgrid) && track.beatgrid.length > 0;
}

/**
 * True when Cues should be the one-line empty state.
 *
 * A beatgrid, or a file whose markers could not be read, keeps its block.
 *
 * @param track Open track.
 * @returns True when there is nothing to show.
 */
export function markersAreEmpty(track: Track): boolean {
  return markerCount(track) === 0 && !hasBeatgrid(track) && track.markers_unavailable !== true;
}

/**
 * Keep known boolean ids. Drop everything else.
 *
 * @param raw Settings value.
 * @returns A map the page can store. Unknown ids and non-booleans are omitted.
 */
export function parseDetailSections(raw: unknown): DetailSectionMap {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const next: DetailSectionMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isDetailSectionId(key) || typeof value !== "boolean") continue;
    next[key] = value;
  }
  return next;
}

/**
 * Replace the open map from a settings payload.
 *
 * @param raw `layout.detail_sections`, or anything the page received.
 * @returns {void}
 */
export function applyDetailSections(raw: unknown): void {
  openMap = parseDetailSections(raw);
  emit();
}

/**
 * Hear open-map changes.
 *
 * @param listener Called after a click or `applyDetailSections`.
 * @returns Unsubscribe.
 */
export function subscribeDetailSections(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Clear the map for a test. Listeners stay.
 *
 * @returns {void}
 */
export function resetDetailSectionsForTests(): void {
  openMap = {};
  emit();
}

/**
 * Whether one card is open. Missing means open. False means closed.
 *
 * @param id Section id.
 * @returns True when the card body should show.
 */
export function useDetailSectionOpen(id: DetailSectionId): boolean {
  const map = useSyncExternalStore(subscribeDetailSections, snapshot, snapshot);
  return map[id] !== false;
}

/**
 * Scroll behavior for a chip jump.
 *
 * @returns `"auto"` when the person asked for less motion, otherwise `"smooth"`.
 */
export function sectionScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

/** Ignore the scroll spy this long after a chip click so it cannot snap back. */
export const DETAIL_JUMP_LOCK_MS = 700;

/**
 * Scroll a section to the top of the detail pane.
 *
 * @param id Section id.
 * @param scope Element that contains the cards. Usually `.detail-body`.
 * @returns {void}
 */
export function scrollDetailSection(id: DetailSectionId, scope: ParentNode): void {
  const node = scope.querySelector(`[data-detail-section="${id}"]`);
  if (!(node instanceof HTMLElement)) return;
  node.scrollIntoView({ block: "start", behavior: sectionScrollBehavior() });
}

/**
 * Remember one card as open or closed, then POST the whole map.
 *
 * An open card drops its key so a missing key stays the default.
 * A failed save leaves the card as clicked and says it was not saved.
 *
 * @param id Section id.
 * @param open True to show the card on every track.
 * @returns {void}
 */
export function setDetailSectionOpen(id: DetailSectionId, open: boolean): void {
  const next: DetailSectionMap = { ...openMap };
  if (open) delete next[id];
  else next[id] = false;
  openMap = next;
  emit();
  postJSON("/api/settings", { layout: { detail_sections: { ...next } } }).catch(() => {
    setNotice(t("detail.sectionsNotSaved"), "error");
  });
}
