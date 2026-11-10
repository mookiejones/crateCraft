/**
 * Virtual track list.
 *
 * Row height is ROW from state.ts, which matches --row in app.css. Only
 * the rows inside the scroll window are in the DOM. Each pane is one
 * React island. Play still reads PlayerContext. mountTrackList appends
 * the spacer once, before the first paint.
 */

import type { Track } from "../api-types";
import { bridge } from "../bridge";
import { el } from "../dom";
import { createElement } from "react";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { TrackListWindow } from "../../components/TrackListWindow";
import { play } from "../player/player";
import { ROW, state } from "../state";
import { emitTrackList } from "./track-list-store";

const spacer = document.createElement("div");
const rows = document.createElement("div");
spacer.className = "spacer";
rows.className = "rows";
spacer.append(rows);

const spacerB = document.createElement("div");
const rowsB = document.createElement("div");
spacerB.className = "spacer";
rowsB.className = "rows";
spacerB.append(rowsB);

const paneRoots = new WeakMap<HTMLElement, IslandRoot>();

/**
 * Append the scroll spacer to the track list.
 *
 * Called once when the page starts, and again in a test after the
 * document body is replaced. Appending an existing node moves it.
 * Does not fetch.
 *
 * @returns {void}
 */
export function mountTrackList(): void {
  el("list").append(spacer);
}

/**
 * Append the scroll spacer to the second crate pane.
 *
 * Called once when the page starts, and again in a test after the
 * document body is replaced. Does not fetch.
 *
 * @returns {void}
 */
export function mountTrackListB(): void {
  el("list-b").append(spacerB);
}

/**
 * Paint only the track rows inside the scroll window.
 *
 * Row height is ROW. Six extra rows above and below the window keep a
 * fast scroll from flashing empty space. Replaces the row container.
 * Does not fetch track details.
 *
 * @returns {void}
 */
export function paintRows() {
  paintPane(el("list"), spacer, rows, state.view || []);
  if (state.splitCrates && state.mode === "crates") {
    paintPane(el("list-b"), spacerB, rowsB, state.viewB || []);
  }
}

function paintPane(list: HTMLDivElement, paneSpacer: HTMLDivElement, paneRows: HTMLDivElement, view: Track[]): void {
  const height = list.clientHeight || 600;
  // Paint six rows past the window so a fast scroll does not flash empty space.
  const start = Math.max(0, Math.floor(list.scrollTop / ROW) - 6);
  const end = Math.min(view.length, Math.ceil((list.scrollTop + height) / ROW) + 6);
  paneSpacer.style.height = `${view.length * ROW}px`;
  paneRows.style.transform = `translateY(${start * ROW}px)`;
  emitTrackList();
  const pane = list.id === "list-b" ? "b" : "a";
  const root = mountIsland(
    paneRows,
    createElement(TrackListWindow, {
      pane,
      start,
      end,
      onFocusList: () => {
        list.focus({ preventScroll: true });
      },
    }),
    paneRoots.get(paneRows),
  );
  paneRoots.set(paneRows, root);
}

/**
 * Move the list selection by one visible row and keep it on screen.
 *
 * History rows call selectEntry. Library rows call selectTrack. The scroll
 * window follows the row so the selection does not leave the viewport.
 *
 * @param {number} delta 1 for the next row, -1 for the previous row.
 * @returns {void}
 */
/**
 * Move the track selection from a shortcut.
 *
 * The list's own arrow keys call the same helper. Does not fetch by
 * itself; selecting a row does.
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

function moveSelection(delta: number, view: Track[], list: HTMLDivElement) {
  const index = view.findIndex((track) => track.id === state.selectedId);
  const next = view[Math.max(0, Math.min(view.length - 1, index + delta))];
  if (!next) return;
  if (next.entry) bridge.selectEntry(next.id);
  else bridge.selectTrack(next.id);
  const rowTop = view.indexOf(next) * ROW;
  if (rowTop < list.scrollTop) list.scrollTop = rowTop;
  if (rowTop + ROW > list.scrollTop + list.clientHeight) {
    list.scrollTop = rowTop + ROW - list.clientHeight;
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
  const row = target.closest(".row");
  if (!row) return undefined;
  const id = Number(row.getAttribute("data-id"));
  if (!Number.isInteger(id)) return undefined;
  return view.find((item) => item.id === id);
}

/**
 * Attach scroll and arrow-key listeners on the track list.
 *
 * Called once from app.ts after mountTrackList. Scrolling paints the
 * window. Arrow keys move the selection.
 *
 * @returns {void}
 */
function wireListKeys(list: HTMLDivElement): void {
  list.addEventListener("scroll", () => paintRows());
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
