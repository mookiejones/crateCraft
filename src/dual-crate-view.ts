/**
 * Pure helpers for dual crate panes and save-this-list (#13).
 *
 * views.ts paints the rail and lists with these, and dual-crate.ts
 * wires Split and Save view. Keeping these here means views.ts does
 * not import dual-crate.ts, which imports views.ts. Nothing here fetches.
 */

import type { Track } from "./api-types";
import { el } from "./dom";
import { state } from "./state";

export type Pane = "a" | "b";
export type CrateId = number | "all";

/**
 * Choose which pane a crate-rail click should fill.
 *
 * When the list is not split, the click always fills pane A. Alt or
 * Shift while split fills the other pane.
 *
 * @param split Whether two panes are showing.
 * @param focused The pane that currently receives a plain click.
 * @param altKey True when Alt or Shift was held.
 * @returns The pane that should take the crate.
 */
export function clickPane(split: boolean, focused: Pane, altKey: boolean): Pane {
  if (!split) return "a";
  if (altKey) return focused === "a" ? "b" : "a";
  return focused;
}

/**
 * Return the crate each pane shows.
 *
 * Pane B is null until split is on.
 *
 * @param active Pane A's crate.
 * @param second Pane B's crate.
 * @param split Whether two panes are showing.
 * @returns The crate ids, with b null when not split.
 */
export function paneCrates(
  active: CrateId,
  second: CrateId,
  split: boolean,
): { a: CrateId; b: CrateId | null } {
  return { a: active, b: split ? second : null };
}

/**
 * Mark a crate-rail row as sitting in pane A, B, both, or neither.
 *
 * @param id The crate on that row.
 * @param a Pane A's crate.
 * @param b Pane B's crate, or null when not split.
 * @returns The mark, or null when the row is in neither pane.
 */
export function railMark(id: CrateId, a: CrateId, b: CrateId | null): "a" | "b" | "both" | null {
  const inA = id === a;
  const inB = b != null && id === b;
  if (inA && inB) return "both";
  if (inA) return "a";
  if (inB) return "b";
  return null;
}

/**
 * Collect playable track ids from a painted list, in list order.
 *
 * History rows and duplicate ids are skipped. The first copy of a
 * repeated id is kept.
 *
 * @param view The rows currently shown in a pane.
 * @returns Asset ids to send as create `assets`.
 */
export function saveViewIds(view: Track[]): number[] {
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const track of view) {
    if (track.entry) continue;
    if (!Number.isInteger(track.id) || track.id < 0) continue;
    if (seen.has(track.id)) continue;
    seen.add(track.id);
    ids.push(track.id);
  }
  return ids;
}

/**
 * Return the list the focused pane is showing.
 *
 * @returns Pane B's rows when split and B is focused, otherwise pane A.
 */
export function focusedView(): Track[] {
  if (state.splitCrates && state.focusedPane === "b") return state.viewB;
  return state.view;
}

/**
 * Show or hide the second pane and mark the rail for both crates.
 *
 * Split is page-only. Save view stays disabled while the library is locked.
 * Does not fetch.
 *
 * @returns {void}
 */
export function paintDualChrome(): void {
  const cratesMode = state.mode === "crates";
  const split = state.splitCrates && cratesMode;
  el("crate-panes").classList.toggle("split", split);
  el("crate-pane-b").hidden = !split;
  el("crate-pane-a-label").hidden = !split;
  const toggle = el("crate-split");
  toggle.hidden = !cratesMode;
  toggle.setAttribute("aria-pressed", String(split));
  const save = el("crate-save-view");
  save.hidden = !cratesMode;
  save.disabled = !state.writable;
  el("crate-pane-a").dataset.focused = String(!split || state.focusedPane === "a");
  el("crate-pane-b").dataset.focused = String(split && state.focusedPane === "b");
  const panes = paneCrates(state.activeCrate, state.secondCrate, split);
  for (const button of el("crate-list").querySelectorAll<HTMLButtonElement>(".crate")) {
    const raw = button.dataset.id;
    const id: CrateId = raw === "all" ? "all" : Number(raw);
    const mark = Number.isFinite(id as number) || id === "all"
      ? railMark(id, panes.a, panes.b)
      : null;
    if (mark) button.dataset.pane = mark;
    else delete button.dataset.pane;
  }
}
