/**
 * Virtual track list.
 *
 * Row height is ROW from state.ts, which matches --row in app.css. Only
 * the rows inside the scroll window are in the DOM. mountTrackList appends
 * the spacer once, before the first paint.
 */

import type { Track } from "./api-types";
import { bridge } from "./bridge";
import { el } from "./dom";
import { clockLabel, colorHex, dateLabel, energyLabel, lengthLabel } from "./format";
import { getPlayerState, play, playOrToggle, subscribe } from "./player";
import { playerStrings } from "./player-strings";
import { ROW, state } from "./state";
import { formatNumber, t } from "./i18n";
import { buttonEl, setTooltip } from "./tooltip";
import { playRow, selectRow } from "./tooltip-strings";

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
  paneRows.replaceChildren();
  if (!view.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = state.mode === "duplicates" && !state.duplicateIds ? t("list.readingDuplicates") : t("list.noMatches");
    paneRows.append(empty);
    return;
  }
  for (let index = start; index < end; index += 1) {
    const track = view[index]!;
    const button = document.createElement("div");
    button.className = "row";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(track.id === state.selectedId));
    button.dataset.id = String(track.id);
    setTooltip(button, selectRow(track.name || "Untitled"));

    const titleCell = document.createElement("span");
    titleCell.className = "cell";
    const line = document.createElement("span");
    line.className = "title-line";
    if (!track.entry) {
      const playingNow = getPlayerState();
      const playingThis = playingNow.trackId === track.id && playingNow.playing;
      const playButton = buttonEl(playRow(track.name || playerStrings.untitled));
      playButton.className = "row-play";
      const labelName = track.name || playerStrings.untitled;
      const action = playingThis ? playerStrings.pause : playerStrings.play;
      playButton.setAttribute("aria-label", `${action} ${labelName}`);
      playButton.setAttribute("aria-pressed", String(playingThis));
      const icon = document.createElement("span");
      icon.className = "row-play-icon";
      icon.setAttribute("aria-hidden", "true");
      playButton.append(icon);
      playButton.addEventListener("click", (event) => {
        event.stopPropagation();
        bridge.selectTrack(track.id);
        playOrToggle(track.id);
        list.focus({ preventScroll: true });
      });
      playButton.addEventListener("dblclick", (event) => event.stopPropagation());
      line.append(playButton);
    }
    const hex = colorHex(track.color);
    if (hex) {
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = hex;
      line.append(swatch);
    }
    if (track.emoji) {
      const emoji = document.createElement("span");
      emoji.textContent = track.emoji;
      line.append(emoji);
    }
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = track.name || t("track.untitled");
    line.append(title);
    if (track.offline) {
      const offline = document.createElement("span");
      offline.className = "offline-word";
      offline.textContent = t("track.offlineBadge");
      line.append(offline);
    } else if (track.missing) {
      const missing = document.createElement("span");
      missing.className = "missing-word";
      missing.textContent = t("track.missingBadge");
      line.append(missing);
    }
    if (track.stems) {
      const stems = document.createElement("span");
      stems.className = "missing-word";
      stems.textContent = t("track.stemsBadge");
      line.append(stems);
    }
    titleCell.append(line);

    const artist = document.createElement("span");
    artist.className = "cell";
    artist.textContent = track.artist ?? "";

    const cells: HTMLSpanElement[] = [];
    const add = (text: string, numeric = false) => {
      const cell = document.createElement("span");
      cell.className = numeric ? "cell num" : "cell";
      cell.textContent = text;
      cells.push(cell);
    };
    if (track.entry) {
      add(track.deck || "");
      add(track.played || "");
      add(clockLabel(track.start), true);
    } else {
      add(
        track.bpm == null ? "" : formatNumber(Math.round(Number(track.bpm) * 100) / 100, { maximumFractionDigits: 2 }),
        true,
      );
      add(track.key ?? "");
      add(energyLabel(track.rating), true);
      add(track.genre ?? "");
      add(dateLabel(track.time_added), true);
      add(dateLabel(track.last_played), true);
      add(track.play_count == null ? "" : formatNumber(Number(track.play_count)), true);
      add(lengthLabel(track.length_ms), true);
    }

    button.append(titleCell, artist, ...cells);
    button.addEventListener("click", () => {
      if (track.entry) bridge.selectEntry(track.id);
      else bridge.selectTrack(track.id);
      list.focus({ preventScroll: true });
    });
    button.addEventListener("dblclick", () => {
      if (!track.entry) play(track.id);
    });
    paneRows.append(button);
  }
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
  let paintedId: number | null = null;
  let paintedPlaying = false;
  subscribe((next) => {
    if (next.trackId === paintedId && next.playing === paintedPlaying) return;
    paintedId = next.trackId;
    paintedPlaying = next.playing;
    paintRows();
  });
}
