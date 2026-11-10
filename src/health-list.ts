/**
 * Missing files, Duplicates, and Stems chrome that shares HealthContext.
 *
 * The track list stays in views.ts. This module names the mode note and
 * whether Merge copies or Relink is offered.
 */

import { t } from "./i18n";
import { state } from "./state";

/**
 * Scope line for a crate-scoped health report.
 *
 * @returns Whole space, or the selected crate name.
 */
export function crateScopeLabel(): string {
  if (state.activeCrate === "all") return t("gig.wholeSpace");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("gig.wholeSpace");
}

/**
 * Note under the crate list for Missing, Duplicates, or Stems.
 *
 * Empty on every other view so views.ts can write those notes itself.
 *
 * @returns {string}
 */
export function healthListNote(): string {
  if (state.mode === "missing") {
    const offlineCount = state.tracks.filter((track) => track.offline).length;
    return offlineCount
      ? t("mode.missingOffline", { count: offlineCount })
      : t("mode.missing");
  }
  if (state.mode === "duplicates") return t("mode.duplicates");
  if (state.mode === "stems") return t("mode.stems");
  return "";
}

/**
 * True when the selected row is in a duplicate group.
 *
 * @returns {boolean}
 */
export function selectedDuplicateGroupOpen(): boolean {
  if (state.mode !== "duplicates" || state.selectedId == null) return false;
  return (state.duplicateGroups || []).some((group) => (group.ids || []).includes(state.selectedId as number));
}

/**
 * Merge and Relink visibility for the health-list chrome.
 *
 * @returns Snapshot fields for those two buttons.
 */
export function getHealthListSnapshot(): {
  mode: string;
  modeNote: string;
  mergeVisible: boolean;
  mergeDisabled: boolean;
  relinkVisible: boolean;
  relinkDisabled: boolean;
} {
  const mergeVisible = state.mode === "duplicates";
  const relinkVisible = state.mode === "missing";
  return {
    mode: state.mode,
    modeNote: healthListNote(),
    mergeVisible,
    mergeDisabled: !mergeVisible || !state.writable || !selectedDuplicateGroupOpen(),
    relinkVisible,
    relinkDisabled: !relinkVisible || !state.writable,
  };
}
