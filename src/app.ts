/**
 * crateCraft page.
 *
 * Wires the screen and starts the first load. The view modules do not
 * fetch when they are imported. This file attaches listeners, then calls
 * loadLibrary. Settings load when the dialogs wire. server.py uses port
 * 8765. The desktop app uses a free port, and this page calls the same
 * origin. Snapshot UI is src/lib/snapshots/restore.ts on SnapshotsContext. The gig check is src/lib/gig/gig.ts.
 * Tempo drift is src/lib/gig/drift.ts.
 * The damaged-file scan is src/lib/health/scan.ts.
 * The suspect-quality report is src/lib/health/bitrate.ts.
 * The library health report is src/lib/health/health.ts.
 * Play stats are src/lib/history/history-stats.ts.
 * Tag spellings are src/lib/health/tags.ts.
 * Crate presets are src/lib/crates/presets.ts.
 * Folder sync is src/lib/crates/folder-sync.ts.
 * Help is src/lib/ui/help.ts. It does not post to GitHub.
 * The portable drive check is src/lib/gig/portable.ts, on Files and under Before a gig. It does not write.
 * This file does not open master.sqlite itself. The page language is set
 * before the first paint and every view repaints when it changes; see
 * src/lib/i18n.ts.
 */

import { wireDialogs } from "./lib/ui/dialogs";
import { wireGigCheck } from "./lib/gig/gig";
import { wireDrift } from "./lib/gig/drift";
import { wireHealth } from "./lib/health/health";
import { wireHistoryStats } from "./lib/history/history-stats";
import { wireScan } from "./lib/health/scan";
import { wireBitrate } from "./lib/health/bitrate";
import { wireTags } from "./lib/health/tags";
import { wireHelp } from "./lib/ui/help";
import { wirePortable } from "./lib/gig/portable";
import { wireLayout } from "./lib/ui/layout";
import { wireLocale } from "./lib/ui/locale-wiring";
import { bindLibraryReload, mountSnapshots } from "./lib/snapshots/restore";
import { registerPlayerControls, wireShortcuts } from "./lib/ui/shortcuts";
import { state } from "./lib/state";
import { loadUpdate, wireUpdate } from "./lib/ui/update";
import { loadVersion, wireVersion } from "./lib/ui/version";
import { wireFolderSync } from "./lib/crates/folder-sync";
import { refreshPresetsOnOpen, wirePresets } from "./lib/crates/presets";
import { loadLibrary, setMode, showFailure, wireLibrary } from "./lib/ui/views";
import { mountPlayer, playerControls } from "./lib/player/player";
import { mountAppShell } from "./lib/ui/app-shell";
import { mountSettings } from "./lib/ui/settings";
import { installDesktopActions } from "./lib/ui/desktop-actions";
import { applyStaticTooltips, installTooltips } from "./lib/ui/tooltip";
import { wireDualCrates } from "./lib/crates/dual-crate";
import { mountTrackList, mountTrackListB, wireVirtualScroll } from "./lib/ui/virtual-scroll";

wireLocale();
mountAppShell();
installTooltips();
applyStaticTooltips();
mountTrackList();
mountTrackListB();
wireDualCrates();
mountPlayer();
mountSettings();
mountSnapshots();
registerPlayerControls(playerControls);
wireLibrary();
wireVirtualScroll();
wireShortcuts();
installDesktopActions();
wireDialogs();
wirePresets();
wireFolderSync();
wireHelp();
wireGigCheck(() => {
  setMode("crates");
});
wireHealth((action, id) => {
  if (action === "track" && id != null) state.selectedId = id;
  if (action === "missing") setMode("missing");
  else if (action === "duplicates") setMode("duplicates");
  else if (action === "files") setMode("files");
  else if (action === "bitrate") setMode("bitrate");
  else setMode("crates");
});
wireDrift();
wireHistoryStats();
wireScan();
wireBitrate();
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
