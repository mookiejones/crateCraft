/**
 * Locale keys for the Serato shortcut catalog.
 *
 * Numbered cue, loop, and sample rows share one template. Named rows
 * each have a key. This module does not import shortcuts.ts.
 */

import { t, type MessageKey } from "../i18n";
import type { CatalogGroup } from "./shortcut-catalog";

const NUMBERED: Record<string, MessageKey> = {
  "cue-jump": "shortcuts.catalog.cueJump",
  "delete-cue": "shortcuts.catalog.deleteCue",
  autoloop: "shortcuts.catalog.autoloop",
  "loop-roll": "shortcuts.catalog.loopRoll",
  "sample-load": "shortcuts.catalog.sampleLoad",
  "sample-play": "shortcuts.catalog.samplePlay",
  "sample-stop": "shortcuts.catalog.sampleStop",
};

const ACTION_KEY: Record<string, MessageKey> = {
  "load-selected": "shortcuts.catalog.loadSelected",
  "load-selected-right": "shortcuts.catalog.loadSelectedRight",
  "double-loaded-left": "shortcuts.catalog.doubleLoadedLeft",
  "double-loaded-right": "shortcuts.catalog.doubleLoadedRight",
  "eject-left": "shortcuts.catalog.ejectLeft",
  "eject-right": "shortcuts.catalog.ejectRight",
  "play-pause": "shortcuts.playPause",
  "play-pause-right": "shortcuts.catalog.playPauseRight",
  "reverse-left": "shortcuts.catalog.reverseLeft",
  "reverse-right": "shortcuts.catalog.reverseRight",
  "set-next-cue-left": "shortcuts.catalog.setNextCueLeft",
  "set-next-cue-right": "shortcuts.catalog.setNextCueRight",
  "temp-cue-left": "shortcuts.catalog.tempCueLeft",
  "temp-cue-right": "shortcuts.catalog.tempCueRight",
  "play-next": "shortcuts.catalog.playNext",
  "load-next-right": "shortcuts.catalog.loadNextRight",
  "play-previous": "shortcuts.catalog.playPrevious",
  "load-prev-right": "shortcuts.catalog.loadPrevRight",
  "seek-back": "shortcuts.seekBack",
  "rewind-right": "shortcuts.catalog.rewindRight",
  "seek-forward": "shortcuts.seekForward",
  "ff-right": "shortcuts.catalog.ffRight",
  "pitch-bend-down-left": "shortcuts.catalog.pitchBendDownLeft",
  "pitch-bend-down-right": "shortcuts.catalog.pitchBendDownRight",
  "pitch-bend-up-left": "shortcuts.catalog.pitchBendUpLeft",
  "pitch-bend-up-right": "shortcuts.catalog.pitchBendUpRight",
  "pitch-down-left": "shortcuts.catalog.pitchDownLeft",
  "pitch-down-right": "shortcuts.catalog.pitchDownRight",
  "pitch-up-left": "shortcuts.catalog.pitchUpLeft",
  "pitch-up-right": "shortcuts.catalog.pitchUpRight",
  "censor-left": "shortcuts.catalog.censorLeft",
  "censor-right": "shortcuts.catalog.censorRight",
  "keylock-left": "shortcuts.catalog.keylockLeft",
  "keylock-right": "shortcuts.catalog.keylockRight",
  flip: "shortcuts.catalog.flip",
  "loop-on-left": "shortcuts.catalog.loopOnLeft",
  "loop-on-right": "shortcuts.catalog.loopOnRight",
  "slot-reloop-left": "shortcuts.catalog.slotReloopLeft",
  "slot-reloop-right": "shortcuts.catalog.slotReloopRight",
  "loop-in-left": "shortcuts.catalog.loopInLeft",
  "loop-in-right": "shortcuts.catalog.loopInRight",
  "loop-out-left": "shortcuts.catalog.loopOutLeft",
  "loop-out-right": "shortcuts.catalog.loopOutRight",
  "loop-slot-up-left": "shortcuts.catalog.loopSlotUpLeft",
  "loop-slot-up-right": "shortcuts.catalog.loopSlotUpRight",
  "loop-slot-down-left": "shortcuts.catalog.loopSlotDownLeft",
  "loop-slot-down-right": "shortcuts.catalog.loopSlotDownRight",
  "list-previous": "shortcuts.listPrevious",
  "list-next": "shortcuts.listNext",
  "crate-previous": "shortcuts.catalog.cratePrevious",
  "crate-next": "shortcuts.catalog.crateNext",
  "focus-next-pane": "shortcuts.catalog.focusNextPane",
  "focus-search": "shortcuts.focusSearch",
  "reveal-track": "shortcuts.catalog.revealTrack",
  "locate-playing": "shortcuts.catalog.locatePlaying",
  "select-all": "shortcuts.catalog.selectAll",
  "undo-load": "shortcuts.catalog.undoLoad",
  "delete-row": "shortcuts.catalog.deleteRow",
  "remove-from-library": "shortcuts.catalog.removeFromLibrary",
  "trash-track": "shortcuts.catalog.trashTrack",
  "view-prepare": "shortcuts.catalog.viewPrepare",
  "waveform-zoom-in": "shortcuts.catalog.waveformZoomIn",
  "waveform-zoom-out": "shortcuts.catalog.waveformZoomOut",
  "zoom-library-in": "shortcuts.catalog.zoomLibraryIn",
  "zoom-library-out": "shortcuts.catalog.zoomLibraryOut",
  "start-recording": "shortcuts.catalog.startRecording",
  "open-external": "shortcuts.catalog.openExternal",
  "bpm-double": "shortcuts.catalog.bpmDouble",
  "bpm-halve": "shortcuts.catalog.bpmHalve",
  "beatgrid-edit": "shortcuts.catalog.beatgridEdit",
  "exit-app": "shortcuts.catalog.exitApp",
  "quick-open": "shortcuts.quickOpen",
  "cheat-sheet": "shortcuts.cheatSheet",
  "list-open": "shortcuts.listOpen",
  dismiss: "shortcuts.dismiss",
  "view-library": "crates.allTracks",
  "view-crates": "view.crates",
  "view-files": "view.files",
  "view-history": "view.history",
  "view-snapshots": "view.snapshots",
};

export const GROUP_HEADING: Record<CatalogGroup, MessageKey> = {
  playback: "shortcuts.groupPlayback",
  loop: "shortcuts.groupLoop",
  sample: "shortcuts.groupSample",
  library: "shortcuts.groupLibrary",
  cratecraft: "shortcuts.groupCratecraft",
};

/**
 * Return the action sentence for one catalog id.
 *
 * @param id Catalog id.
 * @returns Translated label, or the id when no key exists.
 */
export function catalogActionLabel(id: string): string {
  const numbered = /^(cue-jump|delete-cue|autoloop|loop-roll|sample-load|sample-play|sample-stop)-(\d+)$/.exec(id);
  const prefix = numbered?.[1];
  const n = numbered?.[2];
  if (prefix && n) {
    const template = NUMBERED[prefix];
    if (template) return t(template, { n });
  }
  const key = ACTION_KEY[id];
  return key ? t(key) : id;
}

/**
 * Return whether every catalog id has a label mapping.
 *
 * Tests call this so a new CATALOG row cannot ship unlabeled.
 *
 * @param ids Catalog ids.
 * @returns Ids with no ACTION_KEY or numbered template.
 */
export function unlabeledCatalogIds(ids: readonly string[]): string[] {
  return ids.filter((id) => {
    if (/^(cue-jump|delete-cue|autoloop|loop-roll|sample-load|sample-play|sample-stop)-\d+$/.test(id)) {
      return false;
    }
    return ACTION_KEY[id] === undefined;
  });
}
