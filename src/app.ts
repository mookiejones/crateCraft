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
 * Play stats fetch is src/lib/history/history-stats.ts. StatsPanel paints the report.
 * Tag spellings are src/lib/health/tags.ts.
 * Lost tags are src/lib/health/lost-tags.ts.
 * Energy is src/lib/health/energy.ts.
 * Re-analyze is src/lib/health/reanalyze.ts.
 * Audio changed is src/lib/health/audio-changed.ts.
 * Compare crates is src/lib/crates/crate-compare.ts.
 * Crate presets are src/lib/crates/presets.ts.
 * Folder sync is src/lib/crates/folder-sync.ts.
 * Help is src/lib/ui/help.ts. It does not post to GitHub.
 * The portable drive check is src/lib/gig/portable.ts, on Files and under Before a gig. It does not write.
 * This file does not open master.sqlite itself. The page language is set
 * before the first paint and every view repaints when it changes; see
 * src/lib/i18n.ts.
 */

import { wireDialogs } from "./lib/ui/dialogs";
import { mountSharedDialogs } from "./lib/ui/shared-dialog-mount";
import { wireGigCheck } from "./lib/gig/gig";
import { wireDrift } from "./lib/gig/drift";
import { wireOctave } from "./lib/gig/octave";
import { wireHealth } from "./lib/health/health";
import { wireHistoryStats } from "./lib/history/history-stats";
import { wireScan } from "./lib/health/scan";
import { wireBitrate } from "./lib/health/bitrate";
import { wireTags } from "./lib/health/tags";
import { wireLostTags } from "./lib/health/lost-tags";
import { wireEnergy } from "./lib/health/energy";
import { wireReanalyze } from "./lib/health/reanalyze";
import { wireAudioChanged } from "./lib/health/audio-changed";
import { wireCrateCompare } from "./lib/crates/crate-compare";
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
import { wireCrateTrees } from "./lib/crates/crate-trees";
import { applyIncomingHash, applyStatus, loadLibrary, setMode, setNotice, showFailure, wireHashRoutes, wireLibrary } from "./lib/ui/views";
import { wireStatusPoll } from "./lib/ui/status-poll";
import { mountPlayer, playerControls } from "./lib/player/player";
import { mountAppShell } from "./lib/ui/app-shell";
import { mountSettings } from "./lib/ui/settings";
import { installDesktopActions } from "./lib/ui/desktop-actions";
import { applyStaticTooltips, installTooltips } from "./lib/ui/tooltip";
import { wireDualCrates } from "./lib/crates/dual-crate";
import { mountTrackList, mountTrackListB, wireVirtualScroll } from "./lib/ui/virtual-scroll";

wireLocale();
mountAppShell();
mountSharedDialogs();
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
wireHashRoutes();
wireVirtualScroll();
wireShortcuts();
installDesktopActions();
wireDialogs();
wirePresets();
wireCrateTrees();
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
wireOctave();
wireHistoryStats();
wireScan();
wireBitrate();
wireTags();
wireLostTags();
wireEnergy();
wireReanalyze();
wireAudioChanged();
wireCrateCompare();
wirePortable();
wireLayout();
wireStatusPoll({ applyStatus, setNotice });
wireVersion();
void loadVersion();
wireUpdate();
void loadUpdate();
bindLibraryReload(loadLibrary);
loadLibrary()
  .then(async () => {
    await applyIncomingHash();
    return refreshPresetsOnOpen();
  })
  .catch(showFailure);
