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
import { mountSplitter, type Splitter } from "./splitter";
import { setNotice } from "./views";
import { t } from "../i18n";

/** Narrowest track list that still shows title, artist, BPM, key, and time. */
export const TRACK_LIST_MIN_WIDTH = 360;
/** Open navigation drawer width in pixels. */
export const DRAWER_WIDTH = 200;
/** MUI mini-variant width (`theme.spacing(7)`). */
export const DRAWER_MINI_WIDTH = 56;
/**
 * Below this innerWidth the drawer stays mini.
 * Resize does not write `drawer_open`.
 */
export const DRAWER_MINI_CUTOFF = TRACK_LIST_MIN_WIDTH + DRAWER_WIDTH;
/** Matches the detail column's minmax(300px, …) in app.css. */
export const DETAIL_MIN_WIDTH = 300;
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
