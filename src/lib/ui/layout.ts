/**
 * The divider between the track list and the detail pane.
 *
 * Crates, history, missing, duplicates, and stems all share that sheet,
 * so one splitter and one saved width serve every list view. The width
 * is stored in settings.json through POST /api/settings, not in browser
 * storage, because the desktop app can bind a new port on each launch.
 */

import { postJSON } from "../api";
import type { SettingsPayload } from "../api-types";
import { el } from "../dom";
import { clampWidth, mountSplitter, type Splitter } from "./splitter";
import { setNotice } from "./views";
import { t } from "../i18n";

/** Narrowest track list that still shows title, artist, BPM, key, and time. */
export const TRACK_LIST_MIN_WIDTH = 360;
/** Preferred crate-tree rail width in pixels. */
export const CRATE_TREE_WIDTH = 240;
/** Narrowest crate-tree rail that still shows crate names. */
export const CRATE_TREE_MIN_WIDTH = 160;
/** Open navigation drawer width in pixels. */
export const DRAWER_WIDTH = 200;
/** MUI mini-variant width (`theme.spacing(7)`). */
export const DRAWER_MINI_WIDTH = 56;
/**
 * At this innerWidth and below the drawer stays mini so the Crates
 * room can keep tree, list, and detail. Resize does not write
 * `drawer_open`.
 */
export const DRAWER_MINI_CUTOFF = 980;
/** Matches the detail column's min-width in app.css. */
export const DETAIL_MIN_WIDTH = 300;
/** The 9px list/detail separator column. */
export const SPLITTER_WIDTH = 9;
/** Desktop window default from `desktop.py` DEFAULT_WIDTH. */
export const DESKTOP_WIDTH = 1120;

export interface CratesPanes {
  tree: number;
  list: number;
  detail: number;
}

/**
 * Share Main width among crate tree, track list, and detail.
 *
 * A saved list width is clamped so the tree and the detail keep their
 * minimums when the room is there. When Main is too narrow for every
 * minimum, the three panes scale together and none is zeroed.
 *
 * @param mainWidth `#app-body` width in CSS pixels (window minus drawer).
 * @param savedListWidth Width from settings.json, or null for the default split.
 * @returns Whole-pixel pane widths. `tree + list + SPLITTER_WIDTH + detail`
 *   equals `mainWidth` when `mainWidth` is positive.
 */
export function shareCratesPanes(
  mainWidth: number,
  savedListWidth: number | null,
): CratesPanes {
  const inner = Math.max(0, Math.round(mainWidth) - SPLITTER_WIDTH);
  if (inner <= 0) {
    return { tree: 0, list: 0, detail: 0 };
  }
  const minTree = CRATE_TREE_MIN_WIDTH;
  const minList = TRACK_LIST_MIN_WIDTH;
  const minDetail = DETAIL_MIN_WIDTH;
  const mins = minTree + minList + minDetail;
  if (inner < mins) {
    const tree = Math.max(1, Math.round((inner * minTree) / mins));
    const list = Math.max(1, Math.round((inner * minList) / mins));
    const detail = Math.max(1, inner - tree - list);
    return { tree, list, detail };
  }
  let leftover = inner - mins;
  const treeExtra = Math.min(leftover, CRATE_TREE_WIDTH - minTree);
  const tree = minTree + treeExtra;
  leftover -= treeExtra;
  const defaultList = minList + Math.round((leftover * 1.8) / (1.8 + 0.85));
  const wanted = savedListWidth == null ? defaultList : savedListWidth;
  const sheet = inner - tree;
  const list = clampWidth(wanted, sheet, minList, minDetail);
  const detail = sheet - list;
  return { tree, list, detail };
}

/** Arrow keys repeat quickly. One POST follows the last key in a burst. */
const SAVE_DELAY_MS = 400;

type DrawerOpenListener = (saved: boolean | null) => void;
const drawerOpenListeners = new Set<DrawerOpenListener>();

let splitter: Splitter | null = null;
let changedHere = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * POST the width after a short pause.
 *
 * A failure keeps the width on screen and says it was not saved.
 *
 * @param width Track list width in pixels, or null for the default split.
 * @returns {void}
 */
function save(width: number | null): void {
  changedHere = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    postJSON("/api/settings", { layout: { track_list_width: width } }).catch(() => {
      setNotice(t("layout.widthNotSaved"), "error");
    });
  }, SAVE_DELAY_MS);
}

/**
 * Attach the track list splitter. Called once at startup.
 *
 * @returns {void}
 */
export function wireLayout(): void {
  splitter = mountSplitter({
    handle: el("track-splitter"),
    container: el("browser").parentElement as HTMLElement,
    first: el("browser"),
    property: "--track-list-width",
    minFirst: TRACK_LIST_MIN_WIDTH,
    minSecond: DETAIL_MIN_WIDTH,
    onCommit: save,
  });
  window.addEventListener("resize", () => splitter?.refit());
}

/**
 * Hear saved `layout.drawer_open` from a later /api/settings payload.
 *
 * @param listener Called with true, false, or null (key present but unset).
 * @returns Unsubscribe.
 */
export function subscribeDrawerOpen(listener: DrawerOpenListener): () => void {
  drawerOpenListeners.add(listener);
  return () => {
    drawerOpenListeners.delete(listener);
  };
}

/**
 * POST the mini/open choice. Resize does not call this.
 *
 * @param open True when the labeled 200px rail should be remembered.
 * @returns {void}
 */
export function saveDrawerOpen(open: boolean): void {
  postJSON("/api/settings", { layout: { drawer_open: open } }).catch(() => {
    setNotice(t("layout.widthNotSaved"), "error");
  });
}

/**
 * Apply the saved width and drawer choice from a /api/settings payload.
 *
 * A width the person already changed in this page is kept, so a slow
 * settings response does not snap the divider back. `drawer_open` is
 * applied even when the track-list splitter is not mounted.
 *
 * @param payload Settings object from the server.
 * @returns {void}
 */
export function applyLayout(payload: SettingsPayload): void {
  const layout = payload.layout;
  if (layout && Object.prototype.hasOwnProperty.call(layout, "drawer_open")) {
    const raw = layout.drawer_open;
    const saved = raw === true ? true : raw === false ? false : null;
    for (const listener of drawerOpenListeners) listener(saved);
  }
  if (!splitter || changedHere) return;
  const width = layout?.track_list_width;
  splitter.set(typeof width === "number" ? width : null);
}
