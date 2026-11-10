/**
 * Crate-rail snapshot and the actions the React tree calls.
 *
 * Library writes stay in views.ts, presets, folder-sync, dual-crate, and
 * dialogs. Those modules bind the functions. This file does not import
 * them, so AppProviders can read the snapshot without a cycle.
 */

import { crateRailRows, type CrateRailRow } from "./crate-tree";
import { isPresetCrate } from "./preset-view";
import { state } from "./state";

export type { CrateRailRow };

export type CrateId = number | "all";

export type CrateActions = {
  select: (id: CrateId, event?: MouseEvent) => void;
  toggle: (id: CrateId) => void;
  create: () => void;
  rename: () => void;
  color: () => void;
  remove: () => void;
  preset: () => void;
  folderSync: () => void;
  renameFromTags: (button: HTMLButtonElement) => void;
  refresh: () => void;
  split: () => void;
  saveView: () => void;
  exportM3u: () => void;
  exportRekordbox: () => void;
};

const noop = (): void => undefined;

const actions: CrateActions = {
  select: noop,
  toggle: noop,
  create: noop,
  rename: noop,
  color: noop,
  remove: noop,
  preset: noop,
  folderSync: noop,
  renameFromTags: noop,
  refresh: noop,
  split: noop,
  saveView: noop,
  exportM3u: noop,
  exportRekordbox: noop,
};

const listeners = new Set<() => void>();

/**
 * Replace crate actions the React tree should call.
 *
 * Partial so each module can bind only the functions it owns.
 *
 * @param next Actions to merge.
 */
export function bindCrateActions(next: Partial<CrateActions>): void {
  Object.assign(actions, next);
}

/**
 * Subscribe to crate-rail snapshot changes.
 *
 * @param listener Called after emitCrates.
 * @returns Unsubscribe.
 */
export function subscribeCrates(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Push the current crate snapshot to React islands.
 */
export function emitCrates(): void {
  for (const listener of listeners) listener();
}

function folderSyncBlocked(): boolean {
  const id = state.activeCrate;
  const crate = typeof id === "number" ? state.crates.find((row) => row.id === id) : undefined;
  return !state.writable || id === "all" || Boolean(crate?.smart);
}

export type CrateSnapshot = {
  rows: CrateRailRow[];
  writable: boolean;
  crateChosen: boolean;
  canCreate: boolean;
  canRename: boolean;
  canColor: boolean;
  canDelete: boolean;
  canPreset: boolean;
  canFolderSync: boolean;
  canRenameFromTags: boolean;
  canRefresh: boolean;
  refreshHidden: boolean;
  splitHidden: boolean;
  splitPressed: boolean;
  canSaveView: boolean;
  saveViewHidden: boolean;
  exportHidden: boolean;
};

/**
 * Read crate-rail flags and rows from page state.
 *
 * @returns Snapshot for CrateProvider.
 */
export function readCrateSnapshot(): CrateSnapshot {
  const crateChosen = state.activeCrate !== "all";
  const cratesMode = state.mode === "crates";
  const preset = isPresetCrate(state.activeCrate);
  const blocked = folderSyncBlocked();
  return {
    rows: crateRailRows(),
    writable: state.writable,
    crateChosen,
    canCreate: state.writable,
    canRename: state.writable && crateChosen,
    canColor: state.writable && crateChosen,
    canDelete: state.writable && crateChosen,
    canPreset: state.writable,
    canFolderSync: !blocked,
    canRenameFromTags: !blocked,
    canRefresh: state.writable && preset,
    refreshHidden: !preset,
    splitHidden: !cratesMode,
    splitPressed: state.splitCrates && cratesMode,
    canSaveView: state.writable,
    saveViewHidden: !cratesMode,
    exportHidden: !cratesMode,
  };
}

export type CrateContextValue = CrateSnapshot & CrateActions;

/**
 * Snapshot plus the bound crate actions.
 *
 * @returns Value for CrateProvider.
 */
export function readCrateValue(): CrateContextValue {
  return {
    ...readCrateSnapshot(),
    ...actions,
  };
}
