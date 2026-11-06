/**
 * Serato library page.
 *
 * Wires the screen and starts the first load. The view modules do not
 * fetch when they are imported. This file attaches listeners, then calls
 * loadLibrary. Settings load when the dialogs wire. server.py uses port
 * 8765. The desktop app uses a free port, and this page calls the same
 * origin. Snapshot UI is src/restore.ts. The gig check is src/gig.ts.
 * Crate presets are src/presets.ts.
 * Help is src/help.ts. It does not post to GitHub.
 * The portable drive check is src/portable.ts. It does not write.
 * This file does not open master.sqlite itself. The page language is set
 * before the first paint and every view repaints when it changes; see
 * src/i18n.ts.
 */

import { failureOf } from "./api";
import { wireDialogs } from "./dialogs";
import { el } from "./dom";
import { wireGigCheck } from "./gig";
import { wireHelp } from "./help";
import { wirePortable } from "./portable";
import { wireLayout } from "./layout";
import { wireLocale } from "./locale-wiring";
import {
  bindLibraryReload,
  backupDriveCrates,
  confirmSnapshotRestore,
  failSnapshots,
  loadOperations,
  loadSnapshots,
  openSnapshotPlan,
  setSnapshotDialogStatus,
  takeSnapshot,
} from "./restore";
import { registerPlayerControls, wireShortcuts } from "./shortcuts";
import { state } from "./state";
import { loadVersion, wireVersion } from "./version";
import { refreshPresetsOnOpen, wirePresets } from "./presets";
import { loadLibrary, setMode, showFailure, wireLibrary } from "./views";
import { mountPlayer, playerControls } from "./player";
import { installDesktopActions } from "./desktop-actions";
import { applyStaticTooltips, installTooltips } from "./tooltip";
import { mountTrackList, wireVirtualScroll } from "./virtual-scroll";

/**
 * Attach the snapshot-list listeners.
 *
 * Refresh, take, undo, and the restore dialog call src/restore.ts.
 * Called once at startup. Does not restore anything by itself.
 *
 * @returns {void}
 */
function wireSnapshots(): void {
  el("snapshots-refresh").addEventListener("click", () => {
    loadSnapshots().catch((error) => failSnapshots(error));
  });

  el("operations-refresh").addEventListener("click", () => {
    loadOperations().catch(() => undefined);
  });

  el("snapshots-take").addEventListener("click", () => {
    takeSnapshot().catch((error) => failSnapshots(error));
  });

  el("snapshots-drives").addEventListener("click", () => {
    backupDriveCrates().catch((error) => failSnapshots(error));
  });

  el("snapshots-undo-button").addEventListener("click", () => {
    const pending = state.snapshotUndo;
    if (!pending || !pending.restore_id) return;
    openSnapshotPlan(pending.restore_id).catch((error) => failSnapshots(error));
  });

  el("snapshot-cancel").addEventListener("click", () => {
    el("snapshot-dialog").close();
  });

  el("snapshot-confirm").addEventListener("click", () => {
    confirmSnapshotRestore().catch((error) => setSnapshotDialogStatus(failureOf(error).message));
  });
}

wireLocale();
installTooltips();
applyStaticTooltips();
mountTrackList();
mountPlayer();
registerPlayerControls(playerControls);
wireLibrary();
wireVirtualScroll();
wireShortcuts();
installDesktopActions();
wireDialogs();
wirePresets();
wireHelp();
wireSnapshots();
wireGigCheck(() => {
  setMode("crates");
});
wirePortable();
wireLayout();
wireVersion();
void loadVersion();
bindLibraryReload(loadLibrary);
loadLibrary()
  .then(() => refreshPresetsOnOpen())
  .catch(showFailure);
