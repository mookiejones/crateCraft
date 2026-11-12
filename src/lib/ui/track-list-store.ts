/**
 * Shared list and detail snapshot for React islands.
 *
 * `state` stays the source of truth. This module copies the fields the
 * track list and detail pane read, plus the open detail, so each island's
 * TrackList provider can subscribe without owning the library.
 */

import type { Crate, SeratoStatus, Track } from "../api-types";
import { isNumericSort } from "../format";
import { getLocale } from "../i18n";
import { play } from "../player/player";
import { state } from "../state";
import { bridge } from "../bridge";

/** What the detail pane is showing. */
export type TrackDetailState =
  | { kind: "none" }
  | { kind: "empty"; message: string }
  | { kind: "reading" }
  | { kind: "error"; message: string }
  | { kind: "entry"; entry: Track }
  | { kind: "track"; track: Track };

export type TrackListSnapshot = {
  selectedId: number | null;
  mode: string;
  writable: boolean;
  splitCrates: boolean;
  focusedPane: "a" | "b";
  view: readonly Track[];
  viewB: readonly Track[];
  crates: readonly Crate[];
  tracks: readonly Track[];
  space: string;
  serato: SeratoStatus | null | undefined;
  duplicateGroupSelected: boolean;
  duplicatesPending: boolean;
  locale: string;
  sort: string;
  sortDir: number;
  detail: TrackDetailState;
};

export type TrackSaveFields = {
  name: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  composer: string;
  remixer: string;
  label: string;
  grouping: string;
  comments: string;
  key: string;
  emoji: string;
  bpm: number | null;
  color: number;
  rating: number | null;
  is_beatgrid_locked: boolean;
};

export type TrackListActions = {
  selectTrack: (id: number) => void;
  selectEntry: (id: number) => void;
  play: (id: number) => void;
  saveTrack: (id: number, fields: TrackSaveFields) => Promise<void>;
  revealTrack: (id: number) => Promise<void>;
  prepareTrack: (id: number, add: boolean) => Promise<void>;
  relocateTrack: (track: Track) => Promise<void>;
  removeTrack: (id: number) => Promise<void>;
  setMembership: (assetId: number, crateId: number, add: boolean) => Promise<boolean>;
  openInLibrary: (id: number) => void;
  setNotice: (text: string) => void;
  setSort: (key: string) => void;
};

const listeners = new Set<() => void>();
let detail: TrackDetailState = { kind: "none" };
let actions: TrackListActions = {
  selectTrack(id) {
    void bridge.selectTrack(id);
  },
  selectEntry(id) {
    bridge.selectEntry(id);
  },
  play,
  async saveTrack() {},
  async revealTrack() {},
  async prepareTrack() {},
  async relocateTrack() {},
  async removeTrack() {},
  async setMembership() {
    return false;
  },
  openInLibrary() {},
  setNotice() {},
  setSort(key) {
    if (state.sort === key) state.sortDir *= -1;
    else {
      state.sort = key;
      state.sortDir = isNumericSort(key) ? -1 : 1;
    }
    emitTrackList();
  },
};

function duplicateGroupSelected(): boolean {
  if (state.mode !== "duplicates" || state.selectedId == null) return false;
  return (state.duplicateGroups || []).some((group) => (group.ids || []).includes(state.selectedId as number));
}

/**
 * Copy the list and detail fields React reads.
 *
 * @returns A snapshot of `state` plus the open detail.
 */
export function readTrackList(): TrackListSnapshot {
  return {
    selectedId: state.selectedId,
    mode: state.mode,
    writable: state.writable,
    splitCrates: state.splitCrates,
    focusedPane: state.focusedPane,
    view: state.view || [],
    viewB: state.viewB || [],
    crates: state.crates,
    tracks: state.tracks,
    space: state.space,
    serato: state.serato,
    duplicateGroupSelected: duplicateGroupSelected(),
    duplicatesPending: state.mode === "duplicates" && !state.duplicateIds,
    locale: getLocale(),
    sort: state.sort,
    sortDir: state.sortDir,
    detail,
  };
}

/**
 * The registered save and navigation actions.
 *
 * @returns The current action table.
 */
export function getTrackListActions(): TrackListActions {
  return actions;
}

/**
 * Replace the action table. `views.ts` registers the real writers.
 *
 * @param next Action table.
 * @returns {void}
 */
export function registerTrackListActions(next: TrackListActions): void {
  actions = next;
}

/**
 * The open detail pane payload.
 *
 * @returns The current detail state.
 */
export function getTrackDetail(): TrackDetailState {
  return detail;
}

/**
 * Store the open detail and notify subscribers.
 *
 * @param next Detail to show.
 * @returns {void}
 */
export function setTrackDetail(next: TrackDetailState): void {
  detail = next;
  emitTrackList();
}

/**
 * Tell every TrackList provider to read again.
 *
 * @returns {void}
 */
export function emitTrackList(): void {
  for (const listener of listeners) listener();
}

/**
 * Subscribe to list and detail changes.
 *
 * @param listener Called after `emitTrackList`.
 * @returns Unsubscribe.
 */
export function subscribeTrackList(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
