/**
 * crateCraft page.
 *
 * Wires the screen and starts the first load. The view modules do not
 * fetch when they are imported. This file attaches listeners, then calls
 * loadLibrary. Settings load when the dialogs wire. server.py uses port
 * 8765. The desktop app uses a free port, and this page calls the same
 * origin. Snapshot UI is src/restore.ts. The gig check is src/gig.ts.
 * Tempo drift is src/drift.ts.
 * The damaged-file scan is src/scan.ts.
 * The library health report is src/health.ts.
 * Play stats are src/history-stats.ts.
 * Tag spellings are src/tags.ts.
 * Crate presets are src/presets.ts.
 * Folder sync is src/folder-sync.ts.
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
import { wireDrift } from "./drift";
import { wireHealth } from "./health";
import { wireHistoryStats } from "./history-stats";
import { wireScan } from "./scan";
import { wireTags } from "./tags";
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
import { loadUpdate, wireUpdate } from "./update";
import { loadVersion, wireVersion } from "./version";
import { wireFolderSync } from "./folder-sync";
import { refreshPresetsOnOpen, wirePresets } from "./presets";
import { loadLibrary, setMode, showFailure, wireLibrary } from "./views";
import { mountPlayer, playerControls } from "./player";
import { installDesktopActions } from "./desktop-actions";
import { applyStaticTooltips, installTooltips } from "./tooltip";
import { wireDualCrates } from "./dual-crate";
import { mountTrackList, mountTrackListB, wireVirtualScroll } from "./virtual-scroll";

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
mountTrackListB();
wireDualCrates();
mountPlayer();
registerPlayerControls(playerControls);
wireLibrary();
wireVirtualScroll();
wireShortcuts();
installDesktopActions();
wireDialogs();
wirePresets();
wireFolderSync();
wireHelp();
wireSnapshots();
wireGigCheck(() => {
  setMode("crates");
});
wireHealth((action, id) => {
  if (action === "track" && id != null) state.selectedId = id;
  if (action === "missing") setMode("missing");
  else if (action === "duplicates") setMode("duplicates");
  else if (action === "files") setMode("files");
  else setMode("crates");
});
wireDrift();
wireHistoryStats();
wireScan();
wireTags();
wirePortable();
wireLayout();
wireVersion();
void loadVersion();
wireUpdate();
void loadUpdate();
bindLibraryReload(loadLibrary);
loadLibrary()
  .then(() => refreshPresetsOnOpen())
  .catch(showFailure);
