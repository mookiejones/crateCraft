/**
 * Mount the Snapshots view from SnapshotsContext.
 *
 * The spec loads index.html first. This bundle does not open a window
 * and does not read a Serato library.
 */

import { mountSnapshots, renderSnapshots } from "../src/lib/snapshots/restore";
import { state } from "../src/lib/state";
import { applyStaticTooltips, installTooltips } from "../src/lib/ui/tooltip";

state.snapshotLoading = false;
state.snapshotError = "";
state.snapshotMessage = "";
state.snapshotUndo = null;
state.writeBlock = "";
state.driveBackup = null;
state.operations = [];
state.operationsLoading = false;
state.operationsError = "";
state.snapshots = [
  {
    id: "snap-1",
    created: "2026-01-01 12:00",
    trigger: "manual",
    serato_version: "4.0.10",
    serato_build: "4010213",
    reason: "Safety copy",
  },
];

applyStaticTooltips();
installTooltips();
mountSnapshots();
renderSnapshots();
document.body.dataset.snapshots = "ready";
