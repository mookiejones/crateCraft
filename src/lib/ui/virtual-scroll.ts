/**
 * Track list panes.
 *
 * Each `#list` / `#list-b` host is one MUI X Data Grid Community island.
 * The grid owns headers, row virtualization, resize, and hide. Row
 * height is ROW from state.ts, which matches --row in app.css. Play
 * still reads PlayerContext.
 */

import type { Track } from "../api-types";
import { bridge } from "../bridge";
import { el } from "../dom";
import { createElement } from "react";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { attachGridTooltips, TrackListWindow } from "../../components/TrackListWindow";
import { play } from "../player/player";
import { ROW, state } from "../state";
import { ensureGridDom } from "./grid-dom-stubs";
import { emitTrackList } from "./track-list-store";

const paneRoots = new WeakMap<HTMLElement, IslandRoot>();

function mountPane(list: HTMLDivElement, pane: "a" | "b"): void {
  const root = mountIsland(
    list,
    createElement(TrackListWindow, {
      pane,
      onFocusList: () => {
        list.focus({ preventScroll: true });
      },
    }),
    paneRoots.get(list),
  );
  paneRoots.set(list, root);
  attachGridTooltips(list);
}

/**
 * Mount the Data Grid into the track list.
 *
 * Called once when the page starts, and again in a test after the
 * document body is replaced. Does not fetch.
 *
 * @returns {void}
 */
export function mountTrackList(): void {
  ensureGridDom();
  mountPane(el("list"), "a");
}

/**
 * Mount the Data Grid into the second crate pane.
 *
 * Called once when the page starts, and again in a test after the
 * document body is replaced. Does not fetch.
 *
 * @returns {void}
 */
export function mountTrackListB(): void {
  ensureGridDom();
  mountPane(el("list-b"), "b");
}

/**
 * Refresh the Data Grid islands from the current view.
 *
 * Mounts a pane that is not yet an island (split-on, or a replaced
 * document). The grid virtualizes; this does not paint extra DOM rows.
 *
 * @returns {void}
 */
export function paintRows() {
  ensureGridDom();
  if (!paneRoots.has(el("list"))) mountPane(el("list"), "a");
  if (state.splitCrates && state.mode === "crates") {
    if (!paneRoots.has(el("list-b"))) mountPane(el("list-b"), "b");
  }
  emitTrackList();
  attachGridTooltips(el("list"));
  if (state.splitCrates && state.mode === "crates") attachGridTooltips(el("list-b"));
}

/**
 * Move the track selection from a shortcut.
 *
 * History rows call selectEntry. Library rows call selectTrack. The
 * list's own arrow keys call the same helper. Does not fetch by itself.
 *
 * @param delta 1 for the next row, -1 for the previous row.
 * @returns {void}
 */
export function moveTrackList(delta: number): void {
  const list = focusedList();
  moveSelection(delta, viewForList(list), list);
}

/**
 * Open the selected track in the detail pane.
 *
 * When nothing is selected, the first visible row opens. History rows
 * use the entry already loaded with the session.
 *
 * @returns {void}
 */
export function openTrackList(): void {
  const view = viewForList(focusedList());
  const current = view.find((track) => track.id === state.selectedId) ?? view[0];
  if (!current) return;
  if (current.entry) bridge.selectEntry(current.id);
  else void bridge.selectTrack(current.id);
}

function focusedList(): HTMLDivElement {
  if (state.splitCrates && state.focusedPane === "b") return el("list-b");
  return el("list");
}

function viewForList(list: HTMLElement): Track[] {
  if (list.id === "list-b") return state.viewB || [];
  return state.view || [];
}

function scrollerFor(list: HTMLDivElement): HTMLElement {
  return list.querySelector(".MuiDataGrid-virtualScroller") ?? list;
}

function moveSelection(delta: number, view: Track[], list: HTMLDivElement) {
  const index = view.findIndex((track) => track.id === state.selectedId);
  const next = view[Math.max(0, Math.min(view.length - 1, index + delta))];
  if (!next) return;
  if (next.entry) bridge.selectEntry(next.id);
  else bridge.selectTrack(next.id);
  const rowTop = view.indexOf(next) * ROW;
  const scroller = scrollerFor(list);
  if (rowTop < scroller.scrollTop) scroller.scrollTop = rowTop;
  if (rowTop + ROW > scroller.scrollTop + scroller.clientHeight) {
    scroller.scrollTop = rowTop + ROW - scroller.clientHeight;
  }
}

/**
 * Return the track row that holds the event target.
 *
 * Enter on a focused row plays that row. Enter while the list itself is
 * focused plays the selection instead. A history row is left for the caller
 * to skip. Does not fetch.
 *
 * @param target Event target.
 * @returns The visible row, or undefined when the target is not a row.
 */
function focusedTrack(target: EventTarget | null, view: Track[]): Track | undefined {
  if (!(target instanceof Element)) return undefined;
  const row = target.closest(".row, .MuiDataGrid-row");
  if (!row) return undefined;
  const id = Number(row.getAttribute("data-id"));
  if (!Number.isInteger(id)) return undefined;
  return view.find((item) => item.id === id);
}

/**
 * Attach arrow-key listeners on the track list.
 *
 * Called once from app.ts after mountTrackList. Arrow keys move the
 * selection. Enter plays the focused or selected library row. The Data
 * Grid virtualizes on its own scroll.
 *
 * @returns {void}
 */
function wireListKeys(list: HTMLDivElement): void {
  list.addEventListener("keydown", (event) => {
    const view = viewForList(list);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1, view, list);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1, view, list);
    } else if (event.key === "Enter") {
      const chosen = focusedTrack(event.target, view) ?? view.find((item) => item.id === state.selectedId);
      if (!chosen || chosen.entry) return;
      event.preventDefault();
      void bridge.selectTrack(chosen.id);
      play(chosen.id);
    }
  });
}

export function wireVirtualScroll(): void {
  wireListKeys(el("list"));
  wireListKeys(el("list-b"));
}
