/**
 * Sheet heading and crate-scope chip.
 *
 * The heading repeats the open view and space. Overview, Ready, Tempo
 * drift, Damaged files, and Suspect quality also show which crate the
 * report uses, with a control that selects All tracks.
 */

import { t, type MessageKey } from "../i18n";
import type { ViewMode } from "./nav";

export const VIEW_LABEL_KEYS: Record<ViewMode, MessageKey> = {
  crates: "view.crates",
  history: "view.history",
  stats: "view.stats",
  files: "view.files",
  health: "view.health",
  missing: "view.missing",
  duplicates: "view.duplicates",
  stems: "view.stems",
  scan: "view.scan",
  bitrate: "view.bitrate",
  tags: "view.tags",
  snapshots: "view.snapshots",
  gig: "view.gig",
  portable: "view.portable",
  drift: "view.drift",
};

/** Views whose crate list filters the report on the sheet. */
export const CRATE_SCOPED_MODES: readonly ViewMode[] = [
  "health",
  "gig",
  "drift",
  "scan",
  "bitrate",
];

/**
 * True when the crate tree filters this view's report.
 *
 * @param mode View id.
 * @returns {boolean}
 */
export function isCrateScopedMode(mode: string): boolean {
  return (CRATE_SCOPED_MODES as readonly string[]).includes(mode);
}

/**
 * Heading for the open view.
 *
 * Empty space leaves the view name alone.
 *
 * @param mode View id.
 * @param space Open space name.
 * @returns {string}
 */
export function sheetTitle(mode: string, space: string): string {
  const key = VIEW_LABEL_KEYS[mode as ViewMode] ?? "view.crates";
  const view = t(key);
  const trimmed = space.trim();
  if (!trimmed) return view;
  return t("sheet.title", { view, space: trimmed });
}

/**
 * Crate name the scope chip should show.
 *
 * @param activeCrate Selected crate, or all.
 * @param crates Loaded crates.
 * @returns All tracks, or the crate name.
 */
export function sheetScopeCrate(
  activeCrate: number | "all",
  crates: readonly { id: number; name: string }[],
): string {
  if (activeCrate === "all") return t("crates.allTracks");
  const crate = crates.find((row) => row.id === activeCrate);
  return crate?.name || t("crates.allTracks");
}

/**
 * Visible scope chip text.
 *
 * @param crate All tracks, or a crate name.
 * @returns {string}
 */
export function sheetScopeText(crate: string): string {
  return t("sheet.scope", { crate });
}

/**
 * Paint #sheet-title and #sheet-scope from the open view.
 *
 * Missing nodes are skipped so a test document without the sheet still
 * runs.
 *
 * @param opts Open view, space, and crate selection.
 * @returns {void}
 */
export function paintSheetChrome(opts: {
  mode: string;
  space: string;
  activeCrate: number | "all";
  crates: readonly { id: number; name: string }[];
}): void {
  const title = document.getElementById("sheet-title");
  if (title) title.textContent = sheetTitle(opts.mode, opts.space);
  const scope = document.getElementById("sheet-scope");
  const text = document.getElementById("sheet-scope-text");
  const clear = document.getElementById("sheet-scope-all");
  if (!(scope instanceof HTMLElement) || !(text instanceof HTMLElement)) return;
  const scoped = isCrateScopedMode(opts.mode);
  scope.hidden = !scoped;
  if (!scoped) return;
  text.textContent = sheetScopeText(sheetScopeCrate(opts.activeCrate, opts.crates));
  if (clear instanceof HTMLButtonElement) clear.hidden = opts.activeCrate === "all";
}
