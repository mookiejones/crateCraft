/**
 * Storybook Controls args for context islands.
 *
 * Pages and containers read hooks, not props. These helpers copy scalar
 * Controls into the fixture values stories pass to the container
 * providers. They never call `readCrateValue` or the other live stores.
 */

import type { FileEntry } from "../api-types";
import type { CrateContextValue } from "../crates/crate-store";
import type { Colorway } from "../ui/settings";
import type { Notice, NoticeSeverity } from "../ui/notice-store";
import type { WizardStep } from "../wizard/wizard";
import type { FilesContextValue } from "../../containers/FilesContext";
import type { GigContextValue } from "../../containers/GigContext";
import type { HealthContextValue } from "../../containers/HealthContext";
import type { HistoryContextValue } from "../../containers/HistoryContext";
import type { NoticeContextValue } from "../../containers/NoticeContext";
import type { PlayerContextValue } from "../../containers/PlayerContext";
import type { SettingsContextValue } from "../../containers/SettingsContext";
import type { SnapshotsContextValue } from "../../containers/SnapshotsContext";
import type { StatsContextValue } from "../../containers/StatsContext";
import type { TrackListContextValue } from "../../containers/TrackListContext";
import type { WizardContextValue } from "../../containers/WizardContext";
import {
  crateRows,
  crateValue,
  driveReport,
  driftReport,
  filesValue,
  gigReport,
  gigValue,
  healthReport,
  healthValue,
  historyValue,
  musicRootEntries,
  playerValue,
  restorePlan,
  scanReport,
  settingsValue,
  snapshotInfo,
  snapshotsValue,
  statsReport,
  statsValue,
  tagClusters,
  tagPlan,
  trackListValue,
  wizardModel,
  wizardValue,
} from "./fixtures";

function noop(): void {}

export type CrateStoryArgs = {
  empty: boolean;
  writable: boolean;
  crateChosen: boolean;
  splitPressed: boolean;
};

export const crateStoryArgs: CrateStoryArgs = {
  empty: false,
  writable: true,
  crateChosen: false,
  splitPressed: false,
};

export const crateArgTypes = {
  empty: { control: "boolean" as const, description: "No crates in the rail." },
  writable: { control: "boolean" as const, description: "Library writes are allowed." },
  crateChosen: {
    control: "boolean" as const,
    description: "A crate other than All tracks is selected.",
  },
  splitPressed: { control: "boolean" as const, description: "Split crates view is on." },
};

/**
 * Fixture crate rail driven by Controls.
 *
 * @param args Empty rail, write flag, selected crate, split toggle.
 * @returns Value for the container CrateProvider.
 */
export function crateValueFromArgs(args: CrateStoryArgs): CrateContextValue {
  const chosen = args.writable && args.crateChosen;
  const rows = args.empty
    ? []
    : crateRows.map((row) => ({
        ...row,
        selected: args.crateChosen ? row.id === 2 : row.id === "all",
      }));
  return crateValue({
    rows,
    writable: args.writable,
    crateChosen: args.crateChosen,
    canCreate: args.writable,
    canRename: chosen,
    canColor: chosen,
    canDelete: chosen,
    canPreset: args.writable,
    canFolderSync: chosen,
    canRenameFromTags: chosen,
    splitPressed: args.splitPressed,
    canSaveView: args.writable,
  });
}

export type SettingsStoryArgs = {
  colorway: Colorway;
  language: "en" | "es";
  telemetryOn: boolean;
  iconFollowsTheme: boolean;
};

export const settingsStoryArgs: SettingsStoryArgs = {
  colorway: "serato-like",
  language: "en",
  telemetryOn: false,
  iconFollowsTheme: true,
};

export const settingsArgTypes = {
  colorway: {
    control: "select" as const,
    options: ["serato-like", "dark-club", "light", "classic"],
    description: "Appearance palette.",
  },
  language: {
    control: "select" as const,
    options: ["en", "es"],
    description: "Settings language field.",
  },
  telemetryOn: { control: "boolean" as const, description: "Sharing checkbox is on." },
  iconFollowsTheme: { control: "boolean" as const, description: "App icon follows the colorway." },
};

/**
 * Fixture Settings snapshot driven by Controls.
 *
 * @param args Colorway, language, sharing, icon follow.
 * @returns Value for SettingsProvider.
 */
export function settingsValueFromArgs(args: SettingsStoryArgs): SettingsContextValue {
  return settingsValue({
    colorway: args.colorway,
    language: args.language,
    telemetryOn: args.telemetryOn,
    telemetryConfigured: args.telemetryOn,
    iconFollowsTheme: args.iconFollowsTheme,
  });
}

export type FilesStoryArgs = {
  loading: boolean;
  atRoots: boolean;
  writable: boolean;
  dialogAction: "" | "rename" | "delete";
};

export const filesStoryArgs: FilesStoryArgs = {
  loading: false,
  atRoots: true,
  writable: true,
  dialogAction: "",
};

export const filesArgTypes = {
  loading: { control: "boolean" as const, description: "Folder listing is in flight." },
  atRoots: { control: "boolean" as const, description: "Music roots instead of a folder." },
  writable: { control: "boolean" as const, description: "File writes are allowed." },
  dialogAction: {
    control: "select" as const,
    options: ["", "rename", "delete"],
    description: "Open the review dialog for this action.",
  },
};

const folderRows: FileEntry[] = [
  { name: "Night.mp3", kind: "file", path: "/Users/dj/Music/Night.mp3", in_library: true },
  { name: "House", kind: "dir", path: "/Users/dj/Music/House" },
];

/**
 * Fixture Files snapshot driven by Controls.
 *
 * @param args Loading, roots vs folder, write flag, review dialog.
 * @returns Value for FilesProvider.
 */
export function filesValueFromArgs(args: FilesStoryArgs): FilesContextValue {
  const open = args.dialogAction !== "";
  return filesValue({
    writable: args.writable,
    loading: args.loading,
    atRoots: args.atRoots,
    path: args.atRoots ? "" : "/Users/dj/Music",
    parent: args.atRoots ? null : "",
    breadcrumb: args.atRoots ? [] : [{ name: "Music", path: "/Users/dj/Music" }],
    rows: args.loading ? [] : args.atRoots ? musicRootEntries : folderRows,
    dialogAction: args.dialogAction,
    dialogOpen: open,
    dialogName: args.dialogAction === "rename" ? "Night.mp3" : "",
    dialogPreview: open
      ? {
          ok: true,
          needs_confirm: true,
          summary: args.dialogAction === "delete" ? "Move 1 file to trash." : "Rename Night.mp3",
        }
      : null,
  });
}

export type HealthStoryArgs = {
  hasReport: boolean;
  busy: boolean;
  hasScan: boolean;
  hasTags: boolean;
  mode: "health" | "duplicates" | "missing";
};

export const healthStoryArgs: HealthStoryArgs = {
  hasReport: false,
  busy: false,
  hasScan: false,
  hasTags: false,
  mode: "health",
};

export const healthArgTypes = {
  hasReport: { control: "boolean" as const, description: "Library health report is loaded." },
  busy: { control: "boolean" as const, description: "Health check is running." },
  hasScan: { control: "boolean" as const, description: "Damaged-files report is loaded." },
  hasTags: { control: "boolean" as const, description: "Tag spelling clusters are loaded." },
  mode: {
    control: "select" as const,
    options: ["health", "duplicates", "missing"],
    description: "Health list chrome: merge or relink.",
  },
};

/**
 * Fixture health-group snapshot driven by Controls.
 *
 * @param args Report, busy, scan, tags, chrome mode.
 * @returns Value for HealthProvider.
 */
export function healthValueFromArgs(args: HealthStoryArgs): HealthContextValue {
  const duplicates = args.mode === "duplicates";
  const missing = args.mode === "missing";
  return healthValue({
    healthReport: args.hasReport ? healthReport : null,
    healthBusy: args.busy,
    healthStatus: args.busy ? "Checking…" : "",
    scanReport: args.hasScan ? scanReport : null,
    scanExpanded: args.hasScan ? new Set(["empty"]) : new Set(),
    tagsClusters: args.hasTags ? tagClusters : null,
    tagsPlans: args.hasTags ? new Map([["hiphop", tagPlan]]) : new Map(),
    mode: args.mode,
    mergeVisible: duplicates,
    mergeDisabled: !duplicates,
    relinkVisible: missing,
    relinkDisabled: !missing,
  });
}

export type PlayerStoryArgs = {
  playing: boolean;
  empty: boolean;
  currentTime: number;
  volume: number;
};

export const playerStoryArgs: PlayerStoryArgs = {
  playing: false,
  empty: false,
  currentTime: 12,
  volume: 0.8,
};

export const playerArgTypes = {
  playing: { control: "boolean" as const, description: "Transport is playing." },
  empty: { control: "boolean" as const, description: "No track is loaded." },
  currentTime: {
    control: { type: "range" as const, min: 0, max: 180, step: 1 },
    description: "Playhead in seconds.",
  },
  volume: {
    control: { type: "range" as const, min: 0, max: 1, step: 0.05 },
    description: "Output volume.",
  },
};

/**
 * Fixture player snapshot driven by Controls.
 *
 * @param args Playing, empty deck, playhead, volume.
 * @returns Value for PlayerProvider.
 */
export function playerValueFromArgs(args: PlayerStoryArgs): PlayerContextValue {
  if (args.empty) {
    return playerValue({
      trackId: null,
      title: "",
      artist: "",
      playing: false,
      currentTime: 0,
      duration: 0,
      volume: args.volume,
      canTogglePlay: false,
      canSkipPrevious: false,
      canSkipNext: false,
      cues: [],
    });
  }
  return playerValue({
    playing: args.playing,
    currentTime: args.currentTime,
    volume: args.volume,
  });
}

export type WizardStoryArgs = {
  step: WizardStep;
};

export const wizardStoryArgs: WizardStoryArgs = { step: "welcome" };

export const wizardArgTypes = {
  step: {
    control: "select" as const,
    options: ["welcome", "library", "snapshot", "consent", "updates", "done"],
    description: "First-run wizard step.",
  },
};

/**
 * Fixture wizard snapshot driven by Controls.
 *
 * @param args Wizard step.
 * @returns Value for WizardProvider.
 */
export function wizardValueFromArgs(args: WizardStoryArgs): WizardContextValue {
  return wizardValue({ model: wizardModel(args.step) });
}

export type HistoryStoryArgs = {
  empty: boolean;
};

export const historyStoryArgs: HistoryStoryArgs = { empty: false };

export const historyArgTypes = {
  empty: { control: "boolean" as const, description: "No history sessions." },
};

/**
 * Fixture history snapshot driven by Controls.
 *
 * @param args Empty session list.
 * @returns Value for HistoryProvider.
 */
export function historyValueFromArgs(args: HistoryStoryArgs): HistoryContextValue {
  if (!args.empty) return historyValue();
  return historyValue({ sessions: [], historyId: null, entries: [], selectedId: null });
}

export type SnapshotsStoryArgs = {
  empty: boolean;
  loading: boolean;
  planOpen: boolean;
  blocked: boolean;
};

export const snapshotsStoryArgs: SnapshotsStoryArgs = {
  empty: false,
  loading: false,
  planOpen: false,
  blocked: false,
};

export const snapshotsArgTypes = {
  empty: { control: "boolean" as const, description: "No snapshots in the list." },
  loading: { control: "boolean" as const, description: "Snapshot list is loading." },
  planOpen: { control: "boolean" as const, description: "Restore plan dialog is open." },
  blocked: { control: "boolean" as const, description: "Restore is blocked while Serato is open." },
};

/**
 * Fixture snapshot list driven by Controls.
 *
 * @param args Empty, loading, plan dialog, blocked restore.
 * @returns Value for SnapshotsProvider.
 */
export function snapshotsValueFromArgs(args: SnapshotsStoryArgs): SnapshotsContextValue {
  return snapshotsValue({
    snapshots: args.empty || args.loading ? [] : [snapshotInfo],
    snapshotLoading: args.loading,
    plan: args.planOpen
      ? {
          ...restorePlan,
          restore_blocked: args.blocked ? "Quit Serato before restoring." : null,
        }
      : null,
    planOpen: args.planOpen,
  });
}

export type GigStoryArgs = {
  ready: boolean;
  empty: boolean;
  emptyPortable: boolean;
  emptyDrift: boolean;
};

export const gigStoryArgs: GigStoryArgs = {
  ready: false,
  empty: false,
  emptyPortable: false,
  emptyDrift: false,
};

export const gigArgTypes = {
  ready: { control: "boolean" as const, description: "Gig check score is 100." },
  empty: { control: "boolean" as const, description: "No gig report yet." },
  emptyPortable: { control: "boolean" as const, description: "No drive findings." },
  emptyDrift: { control: "boolean" as const, description: "No tempo-drift flags." },
};

/**
 * Fixture gig-check snapshot driven by Controls.
 *
 * @param args Ready score, empty report, hidden drive or drift.
 * @returns Value for GigStateProvider.
 */
export function gigValueFromArgs(args: GigStoryArgs): GigContextValue {
  if (args.empty) {
    return gigValue({ gig: { report: null, stepIndex: 0, checkedAt: null } });
  }
  return gigValue({
    gig: {
      report: args.ready
        ? { ...gigReport, ready: true, score: 100, hard_red: false, holding_it_back: [] }
        : gigReport,
      stepIndex: 0,
      checkedAt: new Date("2026-01-01T12:00:00Z"),
    },
    portable: args.emptyPortable
      ? { report: null, status: "" }
      : { report: driveReport, status: driveReport.summary },
    drift: args.emptyDrift ? { report: null, scope: "" } : { report: driftReport, scope: "Friday" },
  });
}

export type StatsStoryArgs = {
  empty: boolean;
  writable: boolean;
};

export const statsStoryArgs: StatsStoryArgs = { empty: false, writable: true };

export const statsArgTypes = {
  empty: { control: "boolean" as const, description: "No play-stats report." },
  writable: { control: "boolean" as const, description: "Idle-crate create is allowed." },
};

/**
 * Fixture play-stats snapshot driven by Controls.
 *
 * @param args Empty report, write flag.
 * @returns Value for StatsProvider.
 */
export function statsValueFromArgs(args: StatsStoryArgs): StatsContextValue {
  return statsValue({
    report: args.empty ? null : statsReport,
    writable: args.writable,
  });
}

export type TrackListStoryArgs = {
  empty: boolean;
  writable: boolean;
};

export const trackListStoryArgs: TrackListStoryArgs = { empty: false, writable: true };

export const trackListArgTypes = {
  empty: { control: "boolean" as const, description: "No tracks in the grid." },
  writable: { control: "boolean" as const, description: "Track edits are allowed." },
};

/**
 * Fixture track-list snapshot driven by Controls.
 *
 * @param args Empty grid, write flag.
 * @returns Value for TrackListProvider.
 */
export function trackListValueFromArgs(args: TrackListStoryArgs): TrackListContextValue {
  if (!args.empty) return trackListValue({ writable: args.writable });
  return trackListValue({
    writable: args.writable,
    view: [],
    tracks: [],
    selectedId: null,
    detail: { kind: "none" },
  });
}

export type NoticeStoryArgs = {
  severity: NoticeSeverity | "hidden";
  text: string;
};

export const noticeStoryArgs: NoticeStoryArgs = {
  severity: "error",
  text: "That file is not on disk.",
};

export const noticeArgTypes = {
  severity: {
    control: "select" as const,
    options: ["error", "warning", "info", "success", "hidden"],
    description: "Banner severity, or hidden to clear it.",
  },
  text: { control: "text" as const, description: "Banner copy." },
};

/**
 * Fixture notice snapshot driven by Controls.
 *
 * @param args Severity and text. `hidden` clears the banner.
 * @returns Value for NoticeProvider.
 */
export function noticeValueFromArgs(args: NoticeStoryArgs): NoticeContextValue {
  if (args.severity === "hidden" || args.text === "") {
    return { notice: null, dismiss: noop };
  }
  const notice: Notice = { text: args.text, severity: args.severity };
  return { notice, dismiss: noop };
}
