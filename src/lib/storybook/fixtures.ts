/**
 * Storybook-only fixtures. The page bundle does not import this folder.
 */

import type {
  BitrateCheckReport,
  BitrateCratePlan,
  FileEntry,
  FileScanReport,
  GigReport,
  HistorySession,
  HistoryStatsReport,
  LibraryHealthReport,
  RestorePlan,
  SnapshotInfo,
  TagClusterPlan,
  TagClusters,
  TempoDriftReport,
  Track,
} from "../api-types";
import type { CrateContextValue } from "../crates/crate-store";
import type { CrateRailRow } from "../crates/crate-tree";
import type { DriveReport } from "../gig/portable";
import { formatPlayerTime } from "../player/player";
import type { WaveformEngine } from "../player/waveform-view";
import type { FilesContextValue } from "../../containers/FilesContext";
import type { GigContextValue } from "../../containers/GigContext";
import type { HealthContextValue } from "../../containers/HealthContext";
import type { HistoryContextValue } from "../../containers/HistoryContext";
import type { PlayerContextValue } from "../../containers/PlayerContext";
import type { SettingsContextValue } from "../../containers/SettingsContext";
import type { SnapshotsContextValue } from "../../containers/SnapshotsContext";
import type { StatsContextValue } from "../../containers/StatsContext";
import type { TrackListContextValue } from "../../containers/TrackListContext";
import type { WaveformClock } from "../../containers/WaveformContext";
import { idleWizardValue, type WizardContextValue } from "../../containers/WizardContext";
import type { WizardModel, WizardStep } from "../wizard/wizard";

function noop(): void {}
async function noopAsync(): Promise<void> {}
async function noopBool(): Promise<boolean> {
  return true;
}

export function storyTrack(id: number, name: string, extra: Partial<Track> = {}): Track {
  return { id, name, artist: "Ada", bpm: 124, key: "8A", file: `${name.toLowerCase()}.mp3`, ...extra };
}

export const nightTrack: Track = storyTrack(4, "Night", {
  title: "Night",
  album: "Live",
  resolved_path: "/Music/Night.mp3",
  cues: [{ index: 0, start_ms: 1500, color: "#CC0000", name: "Drop" }],
  beatgrid: [
    { position: "0.500", beats: 4 },
    { position: "2.000", bpm: 128 },
  ],
  edit: { name: "Night", artist: "Ada" },
});

export const dawnTrack: Track = storyTrack(5, "Dawn");

export const crateRows: CrateRailRow[] = [
  {
    id: "all",
    name: "All tracks",
    depth: 0,
    childCount: 2,
    smart: false,
    parent: null,
    color: null,
    count: 2,
    holds: false,
    expanded: true,
    selected: true,
    pane: "a",
  },
  {
    id: 2,
    name: "House",
    depth: 1,
    childCount: 1,
    smart: false,
    parent: 1,
    color: 0xcc0000,
    count: 1,
    holds: true,
    expanded: true,
    selected: false,
    pane: null,
  },
  {
    id: 3,
    name: "Deep",
    depth: 2,
    childCount: 0,
    smart: true,
    parent: 2,
    color: null,
    count: 2,
    holds: false,
    expanded: false,
    selected: false,
    pane: null,
  },
];

export function crateValue(partial: Partial<CrateContextValue> = {}): CrateContextValue {
  return {
    rows: crateRows,
    writable: true,
    crateChosen: false,
    canCreate: true,
    canRename: false,
    canColor: false,
    canDelete: false,
    canPreset: true,
    canFolderSync: false,
    canRenameFromTags: false,
    canRefresh: false,
    refreshHidden: true,
    splitHidden: false,
    splitPressed: false,
    canSaveView: true,
    saveViewHidden: false,
    exportHidden: false,
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
    ...partial,
  };
}

export const musicRootEntries: FileEntry[] = [
  {
    name: "Music (dj)",
    kind: "folder",
    path: "/Users/dj/Music",
    detail: "/Users/dj/Music",
    serato: true,
    removable: false,
    missing: false,
  },
  {
    name: "Music (GIGDRIVE)",
    kind: "folder",
    path: "/Volumes/GIGDRIVE/Music",
    detail: "/Volumes/GIGDRIVE/Music",
    serato: true,
    removable: true,
    missing: false,
  },
];

export const driveReport: DriveReport = {
  drive: "/Volumes/GIGDRIVE",
  name: "GIGDRIVE",
  ready: false,
  missing_drive: false,
  summary: "1 track is not on this drive.",
  findings: [
    {
      kind: "off_drive",
      crate: "Friday",
      track: "Gone",
      path: "/Music/gone.mp3",
      found: "",
      fix: "Copy the file onto GIGDRIVE.",
    },
  ],
  errors: [],
};

export function filesValue(partial: Partial<FilesContextValue> = {}): FilesContextValue {
  return {
    writable: true,
    path: "",
    parent: null,
    entries: musicRootEntries,
    selected: new Set(),
    pick: null,
    pickPaths: [],
    pickSource: "",
    loading: false,
    error: "",
    message: "",
    truncated: false,
    atRoots: true,
    roots: [],
    root: null,
    breadcrumb: [],
    elsewhere: false,
    active: 0,
    query: "",
    searching: false,
    rows: musicRootEntries,
    selectedEntries: [],
    locked: false,
    rowHeight: 48,
    dialogAction: "",
    dialogOpen: false,
    dialogName: "",
    dialogReplacement: "",
    dialogStatus: "",
    dialogPreview: null,
    dialogScope: "paths",
    portableReport: null,
    portableStatus: "",
    goUp: noop,
    refresh: noop,
    toggleElsewhere: noop,
    openCrumb: noop,
    openRow: noop,
    toggleFile: noop,
    markActive: noop,
    onListKey: (_event: globalThis.KeyboardEvent) => {},
    onSearchInput: noop,
    startRename: noop,
    startRenameFromTags: noop,
    startMove: noop,
    startMoveFolder: noop,
    startReplace: noop,
    startDelete: noop,
    confirmMoveHere: noop,
    cancelPick: noop,
    setDialogName: noop,
    setDialogReplacement: noop,
    review: noopAsync,
    confirm: noopAsync,
    closeDialog: noop,
    ...partial,
  };
}

const emptyHealthSection = { count: 0, tracks: [] as LibraryHealthReport["missing"]["tracks"] };

export const healthReport: LibraryHealthReport = {
  space: "Serato Library",
  crate: 5,
  checked: 12,
  missing: {
    count: 1,
    tracks: [{ id: 10, name: "Gone", artist: "A", file: "gone.mp3" }],
  },
  no_bpm: emptyHealthSection,
  no_key: emptyHealthSection,
  no_beatgrid: emptyHealthSection,
  no_artwork: emptyHealthSection,
  empty_genre: emptyHealthSection,
  no_crate: emptyHealthSection,
  unused: { count: 0, files: [] },
  duplicates: { count: 0, groups: [] },
};

export const scanReport: FileScanReport = {
  depth: "quick",
  crate: 5,
  checked: 12,
  not_found: 0,
  unchecked: 0,
  counts: { empty: 1 },
  problems: [
    {
      id: 11,
      name: "Blank",
      artist: "A",
      file: "blank.mp3",
      problem: "empty",
      detail: "",
    },
  ],
};

export const tagClusters: TagClusters = {
  field: "genre",
  values: 2,
  groups: [
    {
      key: "hiphop",
      suggested: "Hip Hop",
      tracks: 5,
      spellings: [
        { value: "Hip Hop", count: 3 },
        { value: "Hip-Hop", count: 2 },
      ],
    },
  ],
};

export const tagPlan: TagClusterPlan = {
  field: "genre",
  value: "Hip Hop",
  key: "hiphop",
  written: false,
  changes: [{ id: 1, from: "Hip-Hop", to: "Hip Hop" }],
};

export function healthValue(partial: Partial<HealthContextValue> = {}): HealthContextValue {
  return {
    healthReport: null,
    healthStatus: "",
    healthBusy: false,
    healthScope: "Friday",
    scanReport: null,
    scanStatus: "",
    scanBusy: false,
    scanScope: "Friday",
    scanFullDisabled: false,
    scanExpanded: new Set(),
    tagsField: "genre",
    tagsClusters: null,
    titlePlan: null,
    mappingPlan: null,
    tagsPlans: new Map(),
    tagsSelected: new Map(),
    tagsOpen: new Set(),
    tagsStatus: "",
    tagsBusy: false,
    tagsActionKey: "",
    tagsWritable: true,
    mode: "health",
    modeNote: "",
    mergeVisible: false,
    mergeDisabled: true,
    relinkVisible: false,
    relinkDisabled: true,
    loadHealth: noopAsync,
    loadScan: noopAsync,
    expandScan: noop,
    loadTags: noopAsync,
    setTagsField: noop,
    selectSpelling: noop,
    previewGroup: noopAsync,
    applyGroup: noopAsync,
    applyTitles: noopAsync,
    applyMappings: noopAsync,
    navigate: noop,
    ...partial,
  };
}

export const gigReport: GigReport = {
  ready: false,
  score: 72,
  hard_red: true,
  holding_it_back: [{ code: "missing_files", points: 8, hard_red: true, summary: "1 missing file." }],
  missing_files: [{ path: "/Music/gone.mp3", title: "Gone", artist: "A", crate: "Friday" }],
  unavailable_drives: [{ name: "GIGDRIVE", track_count: 2, crates: ["Friday"] }],
  streaming_tracks: [],
  empty_crates: [],
  snapshot_note: "",
  changes: {
    crates_added: [],
    crates_removed: [],
    crates_edited: [],
    tracks_added: [],
    tracks_removed: [],
    cues_edited: [],
    grids_edited: [],
    tags_edited: [],
  },
  scope: { space: "Serato Library", crate_id: 5, crate_name: "Friday" },
};

export const driftReport: TempoDriftReport = {
  crate: 5,
  checked: 12,
  not_found: 0,
  unreadable: 0,
  too_quiet: 0,
  unchecked: 0,
  mapped: 0,
  flags: [
    {
      id: 1,
      name: "Old Tape",
      artist: "A",
      file: "tape.wav",
      reasons: ["drifting"],
      bpm_min: 90,
      bpm_max: 120,
    },
  ],
};

export function gigValue(partial: Partial<GigContextValue> = {}): GigContextValue {
  return {
    gig: { report: gigReport, stepIndex: 0, checkedAt: new Date("2026-01-01T12:00:00Z") },
    drift: { report: driftReport, scope: "Friday" },
    portable: { report: driveReport, status: driveReport.summary },
    nextStep: noop,
    backStep: noop,
    exit: noop,
    ...partial,
  };
}

export const statsReport: HistoryStatsReport = {
  from: null,
  to: null,
  plays: 8,
  sessions: 3,
  idle_days: 365,
  not_played_count: 2,
  top_tracks: [
    { asset_id: 11, name: "Anthem", artist: "Beta", plays: 3, last_played: 1_800_000_000 },
  ],
  top_artists: [{ artist: "Beta", plays: 4, tracks: 2, last_played: 1_800_000_000 }],
  not_played: [
    { id: 13, name: "Dusty", artist: "Gamma", last_played: null, play_count: 4 },
  ],
};

export function statsValue(partial: Partial<StatsContextValue> = {}): StatsContextValue {
  return {
    report: statsReport,
    crateBusy: false,
    writable: true,
    makeIdleCrate: noopAsync,
    ...partial,
  };
}

export const bitrateReport: BitrateCheckReport = {
  crate: 5,
  checked: 12,
  not_found: 2,
  unreadable: 1,
  too_quiet: 1,
  unchecked: 1,
  suspects: [
    {
      id: 1,
      name: "Fake",
      artist: "A",
      file: "fake.mp3",
      reason: "upsampled",
      stated_kbps: 320,
      estimated_kbps: 128,
      cutoff_hz: 16000,
    },
    {
      id: 2,
      name: "Tape",
      artist: "B",
      file: "tape.flac",
      reason: "lossy_source",
      stated_kbps: null,
      estimated_kbps: 192,
      cutoff_hz: 19000,
    },
  ],
};

export const bitratePlan: BitrateCratePlan = {
  ...bitrateReport,
  preview: true,
  written: false,
  name: "Suspect quality",
  added: 2,
  saved: null,
};

export const historySessions: HistorySession[] = [
  { id: 4, name: "Friday", played: 3 },
  { id: 5, name: "Saturday", played: 0 },
];

export const historyEntry: Track = {
  id: 9,
  name: "Alpha",
  artist: "Artist",
  file: "a.mp3",
  deck: "1",
  played: "Yes",
  start_time: 100,
  asset_id: 1,
  entry: true,
};

export function historyValue(partial: Partial<HistoryContextValue> = {}): HistoryContextValue {
  return {
    sessions: historySessions,
    historyId: 4,
    entries: [historyEntry],
    selectedId: 9,
    loadHistory: noopAsync,
    openSession: noopAsync,
    selectEntry: noop,
    openInLibrary: noopAsync,
    ...partial,
  };
}

export function playerValue(partial: Partial<PlayerContextValue> = {}): PlayerContextValue {
  return {
    trackId: 4,
    title: "Night",
    artist: "Ada",
    playing: false,
    currentTime: 12,
    duration: 180,
    volume: 0.8,
    error: "",
    cues: [{ seconds: 1.5, color: "#CC0000", label: "Drop" }],
    canTogglePlay: true,
    canSkipPrevious: true,
    canSkipNext: true,
    play: noop,
    pause: noop,
    playOrToggle: noop,
    togglePlayPause: noop,
    next: noop,
    previous: noop,
    seek: noop,
    seekBy: noop,
    setVolume: noop,
    mediaTime: () => 12,
    mediaDuration: () => 180,
    formatTime: formatPlayerTime,
    seekStep: 5,
    seekStepLarge: 30,
    ...partial,
  };
}

export function settingsValue(partial: Partial<SettingsContextValue> = {}): SettingsContextValue {
  return {
    language: "en",
    languageStatus: "",
    colorway: "serato-like",
    iconFollowsTheme: true,
    iconStatus: "",
    telemetryOn: false,
    telemetryConfigured: false,
    sharingBusy: false,
    settingsStatus: "",
    logFallback: "",
    logFallbackHidden: true,
    logsBusy: false,
    aboutVersion: "0.0.0+dev",
    versionCopyStatus: "",
    updateEnabled: false,
    updatePrereleases: false,
    updatePrereleasesDisabled: true,
    updateBusy: false,
    updateStatus: "",
    saveLanguage: noopAsync,
    saveColorway: noopAsync,
    saveIconFollow: noopAsync,
    saveSharing: noopAsync,
    saveUpdateEnabled: noopAsync,
    saveUpdatePrereleases: noopAsync,
    openLogs: noopAsync,
    copyLogs: noopAsync,
    copyVersion: noopAsync,
    rerunSetup: noop,
    close: noop,
    ...partial,
  };
}

export const snapshotInfo: SnapshotInfo = {
  id: "snap-1",
  created: "2026-01-01 12:00",
  trigger: "manual",
  serato_version: "4.0.10",
  serato_build: "4010213",
  reason: "Safety copy",
};

export const restorePlan: RestorePlan = {
  dry_run: true,
  restore_blocked: null,
};

export function snapshotsValue(partial: Partial<SnapshotsContextValue> = {}): SnapshotsContextValue {
  return {
    snapshots: [snapshotInfo],
    driveBackup: null,
    operations: [],
    operationsLoading: false,
    operationsError: "",
    snapshotLoading: false,
    snapshotError: "",
    snapshotMessage: "",
    snapshotUndo: null,
    writeBlock: "",
    writeBlockCode: "",
    writeBlockParams: null,
    seratoRunning: false,
    snapshotPlanId: "",
    plan: null,
    planOpen: false,
    planStatus: "",
    taking: false,
    backingDrives: false,
    confirming: false,
    driveNoteError: "",
    statusOverride: "",
    loadSnapshots: noopAsync,
    loadOperations: noopAsync,
    takeSnapshot: noopAsync,
    backupDriveCrates: noopAsync,
    openSnapshotPlan: noopAsync,
    confirmSnapshotRestore: noopAsync,
    closePlan: noop,
    failSnapshots: noop,
    setSnapshotDialogStatus: noop,
    ...partial,
  };
}

export function trackListValue(partial: Partial<TrackListContextValue> = {}): TrackListContextValue {
  const view = [nightTrack, dawnTrack];
  return {
    selectedId: 4,
    mode: "crates",
    writable: true,
    splitCrates: false,
    focusedPane: "a",
    view,
    viewB: [],
    crates: [{ id: 2, name: "House" }],
    tracks: view,
    space: "Serato Library",
    serato: { writable: true },
    duplicateGroupSelected: false,
    duplicatesPending: false,
    locale: "en",
    sort: "name",
    sortDir: 1,
    detail: { kind: "track", track: nightTrack },
    selectTrack: noop,
    selectEntry: noop,
    play: noop,
    saveTrack: noopAsync,
    revealTrack: noopAsync,
    prepareTrack: noopAsync,
    relocateTrack: noopAsync,
    removeTrack: noopAsync,
    setMembership: noopBool,
    openInLibrary: noop,
    setNotice: noop,
    setSort: noop,
    ...partial,
  };
}

export function storyClock(partial: Partial<WaveformClock> = {}): WaveformClock {
  return {
    seek: noop,
    seekBy: noop,
    getTime: () => 12,
    getDuration: () => 180,
    getPlaying: () => false,
    formatTime: formatPlayerTime,
    seekStep: 5,
    seekStepLarge: 30,
    ...partial,
  };
}

export function dummyWaveformEngine(): WaveformEngine {
  return {
    setClock: noop,
    setPublish: noop,
    attach: noop,
    detach: noop,
    setTrack: noop,
    zoom: noop,
    setMarkers: noop,
    sync: noop,
    destroy: noop,
    showComputed: noop,
    showUnavailable: noop,
    relabel: noop,
    pixelsPerSecond: () => 80,
    bindRoot: noop,
  } as unknown as WaveformEngine;
}

export function wizardModel(step: WizardStep): WizardModel {
  const later = step === "consent" || step === "updates" || step === "done";
  return {
    step,
    complete: step === "done",
    dismissed: false,
    context: {
      needsConsent: true,
      library: step === "welcome" ? "pending" : "found",
      seratoRunning: false,
      snapshot: later || step === "snapshot" ? "saved" : "idle",
      consent: step === "updates" || step === "done" ? true : null,
      needsUpdates: true,
      updates: step === "done" ? true : null,
    },
  };
}

export function wizardValue(partial: Partial<WizardContextValue> = {}): WizardContextValue {
  return { ...idleWizardValue(), ...partial };
}
