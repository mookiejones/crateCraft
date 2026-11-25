/**
 * Tooltip keys for t().
 *
 * The sentences live in locales/en.json and locales/es.json under
 * tooltip.*. This module only names those keys and fills placeholders.
 * A language change calls refreshTooltips, which reads the keys again.
 */

import { t, type MessageKey, type Params } from "../i18n";
import type { PrimaryAction } from "../wizard/wizard";

export interface TipSpec {
  key: MessageKey;
  params?: Params;
}

function spec(key: MessageKey, params?: Params): TipSpec {
  return params ? { key, params } : { key };
}

export const tips = {
  space: spec("tooltip.space"),
  crateSearch: spec("tooltip.crateSearch"),
  mergeDuplicates: spec("tooltip.mergeDuplicates"),
  detailCollapse: spec("tooltip.detailCollapse"),
  detailExpand: spec("tooltip.detailExpand"),
  detailActions: spec("tooltip.detailActions"),
  useInCrates: spec("tooltip.useInCrates"),
  cratesReplaceSearch: spec("tooltip.cratesReplaceSearch"),
  cratesReplaceKeep: spec("tooltip.cratesReplaceKeep"),
  cratesReplaceRetire: spec("tooltip.cratesReplaceRetire"),
  cratesReplaceCancel: spec("tooltip.cratesReplaceCancel"),
  cratesReplaceConfirm: spec("tooltip.cratesReplaceConfirm"),
  relink: spec("tooltip.relink"),
  relinkRoot: spec("tooltip.relinkRoot"),
  relinkFind: spec("tooltip.relinkFind"),
  relinkAcceptHigh: spec("tooltip.relinkAcceptHigh"),
  relinkConfirm: spec("tooltip.relinkConfirm"),
  relinkCancel: spec("tooltip.relinkCancel"),
  relinkInclude: spec("tooltip.relinkInclude"),
  relinkPick: spec("tooltip.relinkPick"),
  crateNew: spec("tooltip.crateNew"),
  crateMore: spec("tooltip.crateMore"),
  crateBrowserMore: spec("tooltip.crateBrowserMore"),
  crateRename: spec("tooltip.crateRename"),
  crateSplit: spec("tooltip.crateSplit"),
  crateSaveView: spec("tooltip.crateSaveView"),
  cratePromptName: spec("tooltip.cratePromptName"),
  crateNotConnected: spec("tooltip.crateNotConnected"),
  overwriteSameName: spec("tooltip.overwriteSameName"),
  stickConfirm: spec("tooltip.stickConfirm"),
  stickReview: spec("tooltip.stickReview"),
  stickImport: spec("tooltip.stickImport"),
  cratePromptCancel: spec("tooltip.cratePromptCancel"),
  cratePromptConfirm: spec("tooltip.cratePromptConfirm"),
  relocatePath: spec("tooltip.relocatePath"),
  relocateCancel: spec("tooltip.relocateCancel"),
  relocateConfirm: spec("tooltip.relocateConfirm"),
  confirmCancel: spec("tooltip.confirmCancel"),
  confirmAction: spec("tooltip.confirmAction"),
  forceWrite: spec("tooltip.forceWrite"),
  crateColor: spec("tooltip.crateColor"),
  crateDelete: spec("tooltip.crateDelete"),
  cratePreset: spec("tooltip.cratePreset"),
  crateTree: spec("tooltip.crateTree"),
  crateTreeKind: spec("tooltip.crateTreeKind"),
  crateTreeLow: spec("tooltip.crateTreeLow"),
  crateTreeHigh: spec("tooltip.crateTreeHigh"),
  crateTreeWidth: spec("tooltip.crateTreeWidth"),
  crateTreeStep: spec("tooltip.crateTreeStep"),
  crateTreeMinTracks: spec("tooltip.crateTreeMinTracks"),
  crateTreeLimit: spec("tooltip.crateTreeLimit"),
  crateTreeScope: spec("tooltip.crateTreeScope"),
  crateTreeName: spec("tooltip.crateTreeName"),
  crateTreeCancel: spec("tooltip.crateTreeCancel"),
  crateTreeCreate: spec("tooltip.crateTreeCreate"),
  familiesGenre: spec("tooltip.familiesGenre"),
  familiesMoveTo: spec("tooltip.familiesMoveTo"),
  familiesMove: spec("tooltip.familiesMove"),
  familiesField: spec("tooltip.familiesField"),
  familiesOverwrite: spec("tooltip.familiesOverwrite"),
  familiesPreview: spec("tooltip.familiesPreview"),
  familiesApply: spec("tooltip.familiesApply"),
  familiesDrag: spec("tooltip.familiesDrag"),
  familiesRoot: spec("tooltip.familiesRoot"),
  crateFolderSync: spec("tooltip.crateFolderSync"),
  crateRenameFromTags: spec("tooltip.crateRenameFromTags"),
  crateRefresh: spec("tooltip.crateRefresh"),
  folderSyncPath: spec("tooltip.folderSyncPath"),
  folderSyncSubcrates: spec("tooltip.folderSyncSubcrates"),
  folderSyncFull: spec("tooltip.folderSyncFull"),
  folderSyncCancel: spec("tooltip.folderSyncCancel"),
  folderSyncRun: spec("tooltip.folderSyncRun"),
  presetKind: spec("tooltip.presetKind"),
  presetKey: spec("tooltip.presetKey"),
  presetBpm: spec("tooltip.presetBpm"),
  presetRange: spec("tooltip.presetRange"),
  presetMonths: spec("tooltip.presetMonths"),
  presetConjunction: spec("tooltip.presetConjunction"),
  presetAddRule: spec("tooltip.presetAddRule"),
  presetAddGroup: spec("tooltip.presetAddGroup"),
  presetRuleAttr: spec("tooltip.presetRuleAttr"),
  presetRuleOp: spec("tooltip.presetRuleOp"),
  presetRuleValue: spec("tooltip.presetRuleValue"),
  presetRemoveRule: spec("tooltip.presetRemoveRule"),
  presetRemoveGroup: spec("tooltip.presetRemoveGroup"),
  presetScope: spec("tooltip.presetScope"),
  presetName: spec("tooltip.presetName"),
  presetCancel: spec("tooltip.presetCancel"),
  presetCreate: spec("tooltip.presetCreate"),
  shortcuts: spec("tooltip.shortcuts"),
  shortcutsFilter: spec("tooltip.shortcutsFilter"),
  shortcutsResetAll: spec("tooltip.shortcutsResetAll"),
  shortcutsChange: spec("tooltip.shortcutsChange"),
  shortcutsReset: spec("tooltip.shortcutsReset"),
  drawerToggle: spec("tooltip.drawerToggle"),
  skipToContent: spec("tooltip.skipToContent"),
  playColumn: spec("tooltip.playColumn"),
  columnMenu: spec("tooltip.columnMenu"),
  columnResize: spec("tooltip.columnResize"),
  gridCell: spec("tooltip.gridCell"),
  gridPagination: spec("tooltip.gridPagination"),
  help: spec("tooltip.help"),
  helpBug: spec("tooltip.helpBug"),
  helpFeature: spec("tooltip.helpFeature"),
  helpGithub: spec("tooltip.helpGithub"),
  helpReleases: spec("tooltip.helpReleases"),
  helpClose: spec("tooltip.helpClose"),
  helpHappened: spec("tooltip.helpHappened"),
  helpExpected: spec("tooltip.helpExpected"),
  helpNames: spec("tooltip.helpNames"),
  helpCopyLog: spec("tooltip.helpCopyLog"),
  helpOpen: spec("tooltip.helpOpen"),
  helpReport: spec("tooltip.helpReport"),
  settings: spec("tooltip.settings"),
  search: spec("tooltip.search"),
  searchField: spec("tooltip.searchField"),
  exportM3u: spec("tooltip.exportM3u"),
  exportRekordbox: spec("tooltip.exportRekordbox"),
  fieldEditApply: spec("tooltip.fieldEditApply"),
  fieldEditCheckbox: spec("tooltip.fieldEditCheckbox"),
  fieldEditField: spec("tooltip.fieldEditField"),
  fieldEditPreview: spec("tooltip.fieldEditPreview"),
  fieldEditValue: spec("tooltip.fieldEditValue"),
  fieldEditWriteFiles: spec("tooltip.fieldEditWriteFiles"),
  memoryCues: spec("tooltip.memoryCues"),
  hotLoops: spec("tooltip.hotLoops"),
  rekordboxKey: spec("tooltip.rekordboxKey"),
  importM3u: spec("tooltip.importM3u"),
  jobsCancel: spec("tooltip.jobsCancel"),
  jobsDetails: spec("tooltip.jobsDetails"),
  jobsTray: spec("tooltip.jobsTray"),
  jobsUndo: spec("tooltip.jobsUndo"),
  importFile: spec("tooltip.importFile"),
  reload: spec("tooltip.reload"),
  filesUp: spec("tooltip.filesUp"),
  filesSearch: spec("tooltip.filesSearch"),
  filesRefresh: spec("tooltip.filesRefresh"),
  filesElsewhere: spec("tooltip.filesElsewhere"),
  filesMusicFolders: spec("tooltip.filesMusicFolders"),
  filesRename: spec("tooltip.filesRename"),
  filesRenameFromTags: spec("tooltip.filesRenameFromTags"),
  filesMove: spec("tooltip.filesMove"),
  filesMoveFolder: spec("tooltip.filesMoveFolder"),
  filesReplace: spec("tooltip.filesReplace"),
  filesDelete: spec("tooltip.filesDelete"),
  filesMoveHere: spec("tooltip.filesMoveHere"),
  filesPickCancel: spec("tooltip.filesPickCancel"),
  operationsRefresh: spec("tooltip.operationsRefresh"),
  operationsList: spec("tooltip.operationsList"),
  operationsRetry: spec("tooltip.operationsRetry"),
  snapshotsRefresh: spec("tooltip.snapshotsRefresh"),
  snapshotsTake: spec("tooltip.snapshotsTake"),
  lanStageListen: spec("tooltip.lanStageListen"),
  lanStageStop: spec("tooltip.lanStageStop"),
  lanStageRefresh: spec("tooltip.lanStageRefresh"),
  lanStageHost: spec("tooltip.lanStageHost"),
  lanStagePort: spec("tooltip.lanStagePort"),
  lanStageCode: spec("tooltip.lanStageCode"),
  lanStageCrate: spec("tooltip.lanStageCrate"),
  lanStagePreview: spec("tooltip.lanStagePreview"),
  lanStageSend: spec("tooltip.lanStageSend"),
  lanStageInbox: spec("tooltip.lanStageInbox"),
  lanStageAccept: spec("tooltip.lanStageAccept"),
  lanStageConfirmAccept: spec("tooltip.lanStageConfirmAccept"),
  lanStageUndo: spec("tooltip.lanStageUndo"),
  lanStageDiscard: spec("tooltip.lanStageDiscard"),
  lanStageConfirmDiscard: spec("tooltip.lanStageConfirmDiscard"),
  musicMirrorDest: spec("tooltip.musicMirrorDest"),
  musicMirrorPreview: spec("tooltip.musicMirrorPreview"),
  musicMirrorCopy: spec("tooltip.musicMirrorCopy"),
  musicMirrorRestore: spec("tooltip.musicMirrorRestore"),
  musicMirrorCrate: spec("tooltip.musicMirrorCrate"),
  musicMirrorRelink: spec("tooltip.musicMirrorRelink"),
  stickBackupDest: spec("tooltip.stickBackupDest"),
  stickBackupPreview: spec("tooltip.stickBackupPreview"),
  stickBackupCopy: spec("tooltip.stickBackupCopy"),
  historyRescueSource: spec("tooltip.historyRescueSource"),
  historyRescueScan: spec("tooltip.historyRescueScan"),
  historyRescueCompare: spec("tooltip.historyRescueCompare"),
  historyRescueSession: spec("tooltip.historyRescueSession"),
  historyRescueSessions: spec("tooltip.historyRescueSessions"),
  historyRescueCrates: spec("tooltip.historyRescueCrates"),
  historyRescueRestore: spec("tooltip.historyRescueRestore"),
  backupDrives: spec("tooltip.backupDrives"),
  snapshotsUndo: spec("tooltip.snapshotsUndo"),
  consentDecline: spec("tooltip.consentDecline"),
  consentAccept: spec("tooltip.consentAccept"),
  telemetry: spec("tooltip.telemetry"),
  copyVersion: spec("tooltip.copyVersion"),
  rerunWizard: spec("tooltip.rerunWizard"),
  openLogs: spec("tooltip.openLogs"),
  copyLogs: spec("tooltip.copyLogs"),
  settingsClose: spec("tooltip.settingsClose"),
  logFallback: spec("tooltip.logFallback"),
  mergeTrash: spec("tooltip.mergeTrash"),
  mergeCancel: spec("tooltip.mergeCancel"),
  mergeConfirm: spec("tooltip.mergeConfirm"),
  mergeConfirmTrash: spec("tooltip.mergeConfirmTrash"),
  merging: spec("tooltip.merging"),
  rekordboxCancel: spec("tooltip.rekordboxCancel"),
  rekordboxDownload: spec("tooltip.rekordboxDownload"),
  filesName: spec("tooltip.filesName"),
  filesReplacement: spec("tooltip.filesReplacement"),
  filesCancel: spec("tooltip.filesCancel"),
  filesReview: spec("tooltip.filesReview"),
  filesConfirm: spec("tooltip.filesConfirm"),
  filesMoveTrash: spec("tooltip.filesMoveTrash"),
  shortcutsClose: spec("tooltip.shortcutsClose"),
  quickOpen: spec("tooltip.quickOpen"),
  quickOpenRetry: spec("tooltip.quickOpenRetry"),
  quickOpenClose: spec("tooltip.quickOpenClose"),
  snapshotCancel: spec("tooltip.snapshotCancel"),
  snapshotConfirm: spec("tooltip.snapshotConfirm"),
  wizardFolderUp: spec("tooltip.wizardFolderUp"),
  wizardFolderUse: spec("tooltip.wizardFolderUse"),
  wizardFolderClose: spec("tooltip.wizardFolderClose"),
  wizardNo: spec("tooltip.wizardNo"),
  wizardYes: spec("tooltip.wizardYes"),
  wizardUpdatesNo: spec("tooltip.wizardUpdatesNo"),
  wizardUpdatesYes: spec("tooltip.wizardUpdatesYes"),
  updateToggle: spec("tooltip.updateToggle"),
  updatePrereleases: spec("tooltip.updatePrereleases"),
  updateDownload: spec("tooltip.updateDownload"),
  updateSkip: spec("tooltip.updateSkip"),
  updateDismiss: spec("tooltip.updateDismiss"),
  wizardBack: spec("tooltip.wizardBack"),
  wizardCancel: spec("tooltip.wizardCancel"),
  wizardSecondary: spec("tooltip.wizardSecondary"),
  trackList: spec("tooltip.trackList"),
  filesList: spec("tooltip.filesList"),
  portableClose: spec("tooltip.portableClose"),
  portableSmartCopy: spec("tooltip.portableSmartCopy"),
  portableSmartRestore: spec("tooltip.portableSmartRestore"),
  portableSmartConfirm: spec("tooltip.portableSmartConfirm"),
  portableSmartOverwrite: spec("tooltip.portableSmartOverwrite"),
  snapshotsList: spec("tooltip.snapshotsList"),
  splitter: spec("tooltip.splitter"),
  previous: spec("tooltip.previous"),
  next: spec("tooltip.next"),
  seek: spec("tooltip.seek"),
  volume: spec("tooltip.volume"),
  zoomIn: spec("tooltip.zoomIn"),
  zoomOut: spec("tooltip.zoomOut"),
  overview: spec("tooltip.overview"),
  smartRules: spec("tooltip.smartRules"),
  saveRules: spec("tooltip.saveRules"),
  saveTrack: spec("tooltip.saveTrack"),
  trackColor: spec("tooltip.trackColor"),
  trackRating: spec("tooltip.trackRating"),
  beatgridLock: spec("tooltip.beatgridLock"),
  relocate: spec("tooltip.relocate"),
  removeTrack: spec("tooltip.removeTrack"),
  prepareAdd: spec("tooltip.prepareAdd"),
  prepareRemove: spec("tooltip.prepareRemove"),
  updateRelated: spec("tooltip.updateRelated"),
  relatedCrateOnly: spec("tooltip.relatedCrateOnly"),
  findRelated: spec("tooltip.findRelated"),
  linkNote: spec("tooltip.linkNote"),
  linkRating: spec("tooltip.linkRating"),
  language: spec("tooltip.language"),
  colorway: spec("tooltip.colorway"),
  iconFollowsTheme: spec("tooltip.iconFollowsTheme"),
  gigLock: spec("tooltip.gigLock"),
  protectBpm: spec("tooltip.protectBpm"),
  protectKey: spec("tooltip.protectKey"),
  protectCues: spec("tooltip.protectCues"),
  minCopies: spec("tooltip.minCopies"),
  untrustedVolumes: spec("tooltip.untrustedVolumes"),
  libraryCopies: spec("tooltip.libraryCopies"),
  libraryStays: spec("tooltip.libraryStays"),
  pruneSnapshot: spec("tooltip.pruneSnapshot"),
  trashRestore: spec("tooltip.trashRestore"),
  trashCancel: spec("tooltip.trashCancel"),
  trashPurge: spec("tooltip.trashPurge"),
  gigLockApply: spec("tooltip.gigLockApply"),
  gigLockDrop: spec("tooltip.gigLockDrop"),
  gigLockPreview: spec("tooltip.gigLockPreview"),
  gigLockUndo: spec("tooltip.gigLockUndo"),
  batchPreview: spec("tooltip.batchPreview"),
  batchApply: spec("tooltip.batchApply"),
  batchCancel: spec("tooltip.batchCancel"),
  batchUndo: spec("tooltip.batchUndo"),
  batchQueueCrate: spec("tooltip.batchQueueCrate"),
  batchQueueTrack: spec("tooltip.batchQueueTrack"),
  batchDestination: spec("tooltip.batchDestination"),
  libraryGeneration: spec("tooltip.libraryGeneration"),
  folderAccessAllow: spec("tooltip.folderAccessAllow"),
  statusRefresh: spec("tooltip.statusRefresh"),
  linkMutual: spec("tooltip.linkMutual"),
  versionLink: spec("tooltip.versionLink"),
  versionPlay: spec("tooltip.versionPlay"),
  findVersions: spec("tooltip.findVersions"),
  saveVersions: spec("tooltip.saveVersions"),
  saveLink: spec("tooltip.saveLink"),
  showSearchCopies: spec("tooltip.showSearchCopies"),
  hideSearchCopies: spec("tooltip.hideSearchCopies"),
  openInLibrary: spec("tooltip.openInLibrary"),
  runSetup: spec("tooltip.runSetup"),
  snapshotsRetry: spec("tooltip.snapshotsRetry"),
  reviewRestore: spec("tooltip.reviewRestore"),
  allTracks: spec("tooltip.allTracks"),
  navLibrary: spec("tooltip.navLibrary"),
  navHealth: spec("tooltip.navHealth"),
  navGig: spec("tooltip.navGig"),
  viewCrates: spec("tooltip.viewCrates"),
  viewHistory: spec("tooltip.viewHistory"),
  viewStats: spec("tooltip.viewStats"),
  viewCompare: spec("tooltip.viewCompare"),
  compareShow: spec("tooltip.compareShow"),
  compareSave: spec("tooltip.compareSave"),
  compareA: spec("tooltip.compareA"),
  compareB: spec("tooltip.compareB"),
  compareSubcrates: spec("tooltip.compareSubcrates"),
  statsRefresh: spec("tooltip.statsRefresh"),
  statsCsv: spec("tooltip.statsCsv"),
  statsPeriod: spec("tooltip.statsPeriod"),
  statsFrom: spec("tooltip.statsFrom"),
  statsTo: spec("tooltip.statsTo"),
  statsIdleDays: spec("tooltip.statsIdleDays"),
  statsIdleCrate: spec("tooltip.statsIdleCrate"),
  viewMissing: spec("tooltip.viewMissing"),
  viewDuplicates: spec("tooltip.viewDuplicates"),
  viewStems: spec("tooltip.viewStems"),
  viewFiles: spec("tooltip.viewFiles"),
  viewSnapshots: spec("tooltip.viewSnapshots"),
  viewGig: spec("tooltip.viewGig"),
  viewPortable: spec("tooltip.viewPortable"),
  viewDrift: spec("tooltip.viewDrift"),
  viewCloud: spec("tooltip.viewCloud"),
  viewOctave: spec("tooltip.viewOctave"),
  viewPlayers: spec("tooltip.viewPlayers"),
  cloudRefresh: spec("tooltip.cloudRefresh"),
  portableDrive: spec("tooltip.portableDrive"),
  portableRun: spec("tooltip.portableRun"),
  driftRefresh: spec("tooltip.driftRefresh"),
  octaveRefresh: spec("tooltip.octaveRefresh"),
  playersRefresh: spec("tooltip.playersRefresh"),
  playersTarget: spec("tooltip.playersTarget"),
  playersShow: spec("tooltip.playersShow"),
  octaveFix: spec("tooltip.octaveFix"),
  viewHealth: spec("tooltip.viewHealth"),
  viewScan: spec("tooltip.viewScan"),
  viewBitrate: spec("tooltip.viewBitrate"),
  viewTags: spec("tooltip.viewTags"),
  viewLost: spec("tooltip.viewLost"),
  viewEnergy: spec("tooltip.viewEnergy"),
  viewReanalyze: spec("tooltip.viewReanalyze"),
  viewAudio: spec("tooltip.viewAudio"),
  viewGain: spec("tooltip.viewGain"),
  viewStreams: spec("tooltip.viewStreams"),
  streamsRefresh: spec("tooltip.streamsRefresh"),
  streamsRepair: spec("tooltip.streamsRepair"),
  streamsConfirm: spec("tooltip.streamsConfirm"),
  lostApply: spec("tooltip.lostApply"),
  lostRefresh: spec("tooltip.lostRefresh"),
  energyApply: spec("tooltip.energyApply"),
  energyRefresh: spec("tooltip.energyRefresh"),
  reanalyzeRefresh: spec("tooltip.reanalyzeRefresh"),
  reanalyzePreview: spec("tooltip.reanalyzePreview"),
  reanalyzeConfirm: spec("tooltip.reanalyzeConfirm"),
  reanalyzeClearFrames: spec("tooltip.reanalyzeClearFrames"),
  reanalyzeIncludeLocked: spec("tooltip.reanalyzeIncludeLocked"),
  audioRefresh: spec("tooltip.audioRefresh"),
  audioSave: spec("tooltip.audioSave"),
  audioReanalyze: spec("tooltip.audioReanalyze"),
  audioConfirm: spec("tooltip.audioConfirm"),
  gainRefresh: spec("tooltip.gainRefresh"),
  gainSave: spec("tooltip.gainSave"),
  gainReset: spec("tooltip.gainReset"),
  gainUndo: spec("tooltip.gainUndo"),
  gainConfirmCrate: spec("tooltip.gainConfirmCrate"),
  gainConfirmReset: spec("tooltip.gainConfirmReset"),
  healthRefresh: spec("tooltip.healthRefresh"),
  healthSection: spec("tooltip.healthSection"),
  healthOpenMissing: spec("tooltip.healthOpenMissing"),
  healthOpenDuplicates: spec("tooltip.healthOpenDuplicates"),
  healthOpenFiles: spec("tooltip.healthOpenFiles"),
  healthOpenBitrate: spec("tooltip.healthOpenBitrate"),
  healthTrack: spec("tooltip.healthTrack"),
  notAProblem: spec("tooltip.notAProblem"),
  showDismissed: spec("tooltip.showDismissed"),
  healthFindArt: spec("tooltip.healthFindArt"),
  suspiciousCues: spec("tooltip.suspiciousCues"),
  cueEditUndo: spec("tooltip.cueEditUndo"),
  cueEditDisabled: spec("tooltip.cueEditDisabled"),
  healthPathForms: spec("tooltip.healthPathForms"),
  healthPathFormsReview: spec("tooltip.healthPathFormsReview"),
  healthPathFormsConfirm: spec("tooltip.healthPathFormsConfirm"),
  healthArtCancel: spec("tooltip.healthArtCancel"),
  healthArtEmbed: spec("tooltip.healthArtEmbed"),
  healthArtPick: spec("tooltip.healthArtPick"),
  tagsGenre: spec("tooltip.tagsGenre"),
  tagsArtist: spec("tooltip.tagsArtist"),
  tagsTitles: spec("tooltip.tagsTitles"),
  tagsRefresh: spec("tooltip.tagsRefresh"),
  tagsPreview: spec("tooltip.tagsPreview"),
  tagsApply: spec("tooltip.tagsApply"),
  tagsApplyTitles: spec("tooltip.tagsApplyTitles"),
  tagsApplyMappings: spec("tooltip.tagsApplyMappings"),
  tagsGroup: spec("tooltip.tagsGroup"),
  tagsSpelling: spec("tooltip.tagsSpelling"),
  tagsWriteFiles: spec("tooltip.tagsWriteFiles"),
  gigRefresh: spec("tooltip.gigRefresh"),
  gigTonight: spec("tooltip.gigTonight"),
  scanQuick: spec("tooltip.scanQuick"),
  scanFull: spec("tooltip.scanFull"),
  bitrateRefresh: spec("tooltip.bitrateRefresh"),
  bitrateSave: spec("tooltip.bitrateSave"),
  bitrateConfirm: spec("tooltip.bitrateConfirm"),
  gigBack: spec("tooltip.gigBack"),
  gigNext: spec("tooltip.gigNext"),
  gigExit: spec("tooltip.gigExit"),
  gigRevert: spec("tooltip.gigRevert"),
  gigGroup: spec("tooltip.gigGroup"),
  gigShowAll: spec("tooltip.gigShowAll"),
  sortTitle: spec("tooltip.sortTitle"),
  sortArtist: spec("tooltip.sortArtist"),
  sortBpm: spec("tooltip.sortBpm"),
  sortKey: spec("tooltip.sortKey"),
  sortLength: spec("tooltip.sortLength"),
  sortDeck: spec("tooltip.sortDeck"),
  sortPlayed: spec("tooltip.sortPlayed"),
  sortStart: spec("tooltip.sortStart"),
  sortOrder: spec("tooltip.sortOrder"),
  sortCrateName: spec("tooltip.sortCrateName"),
  sortAdded: spec("tooltip.sortAdded"),
} as const;

const WIZARD: Record<PrimaryAction, MessageKey> = {
  "get-started": "tooltip.wizard.getStarted",
  looking: "tooltip.wizard.looking",
  "use-library": "tooltip.wizard.useLibrary",
  "check-again": "tooltip.wizard.checkAgain",
  "take-snapshot": "tooltip.wizard.takeSnapshot",
  "try-again": "tooltip.wizard.tryAgain",
  continue: "tooltip.wizard.continue",
  "open-library": "tooltip.wizard.openLibrary",
  none: "tooltip.wizard.none",
};

/** Tooltip for the wizard's main button. Saving uses its own sentence. */
export function wizardPrimaryTip(action: PrimaryAction, saving: boolean): TipSpec {
  if (saving) return spec("tooltip.wizard.saving");
  return spec(WIZARD[action]);
}

/**
 * Play or Pause, including Space, without repeating only the button name.
 *
 * @param action Visible action, already translated.
 * @param name Track title, or empty when nothing is loaded.
 */
export function playTip(action: string, name: string): TipSpec {
  if (name) return spec("tooltip.transportNamed", { action, name });
  return spec("tooltip.transport", { action });
}

/** Column sort. Unknown keys use the visible column name. */
export function sortTip(key: string, label: string): TipSpec {
  const known: Record<string, MessageKey> = {
    name: "tooltip.sortTitle",
    artist: "tooltip.sortArtist",
    bpm: "tooltip.sortBpm",
    key: "tooltip.sortKey",
    energy: "tooltip.sortEnergy",
    genre: "tooltip.sortGenre",
    time_added: "tooltip.sortDateAdded",
    last_played: "tooltip.sortLastPlayed",
    play_count: "tooltip.sortPlays",
    length_ms: "tooltip.sortLength",
    deck: "tooltip.sortDeck",
    played: "tooltip.sortPlayed",
    start: "tooltip.sortStart",
  };
  const message = known[key];
  if (message) return spec(message);
  return spec("tooltip.sortBy", { label });
}

/** Rail primary, or undefined when that parent has no tooltip yet. */
export function navTip(id: string): TipSpec | undefined {
  const known: Record<string, TipSpec> = {
    library: tips.navLibrary,
    files: tips.viewFiles,
    health: tips.navHealth,
    backups: tips.viewSnapshots,
    gig: tips.navGig,
  };
  return known[id];
}

/** View tab, or undefined when that view has no tooltip yet. */
export function viewTip(view: string): TipSpec | undefined {
  const known: Record<string, TipSpec> = {
    crates: tips.viewCrates,
    history: tips.viewHistory,
    stats: tips.viewStats,
    compare: tips.viewCompare,
    missing: tips.viewMissing,
    duplicates: tips.viewDuplicates,
    stems: tips.viewStems,
    files: tips.viewFiles,
    snapshots: tips.viewSnapshots,
    gig: tips.viewGig,
    portable: tips.viewPortable,
    drift: tips.viewDrift,
    cloud: tips.viewCloud,
    octave: tips.viewOctave,
    players: tips.viewPlayers,
    health: tips.viewHealth,
    scan: tips.viewScan,
    bitrate: tips.viewBitrate,
    tags: tips.viewTags,
    lost: tips.viewLost,
    energy: tips.viewEnergy,
    reanalyze: tips.viewReanalyze,
    audio: tips.viewAudio,
    gain: tips.viewGain,
    streams: tips.viewStreams,
  };
  return known[view];
}

/** Crate-sort button, or undefined when that key has no tooltip yet. */
export function crateSortTip(key: string): TipSpec | undefined {
  if (key === "order") return tips.sortOrder;
  if (key === "name") return tips.sortCrateName;
  if (key === "added") return tips.sortAdded;
  return undefined;
}

/** Static control looked up by id. */
export function staticTip(id: string): TipSpec | undefined {
  const known: Record<string, TipSpec> = {
    space: tips.space,
    "crate-search": tips.crateSearch,
    "merge-duplicates": tips.mergeDuplicates,
    "open-relink": tips.relink,
    "relink-root": tips.relinkRoot,
    "relink-find": tips.relinkFind,
    "relink-accept-high": tips.relinkAcceptHigh,
    "relink-confirm": tips.relinkConfirm,
    "relink-cancel": tips.relinkCancel,
    "crate-new": tips.crateNew,
    "crate-actions-more": tips.crateMore,
    "crate-browser-more": tips.crateBrowserMore,
    "crate-split": tips.crateSplit,
    "crate-save-view": tips.crateSaveView,
    "crate-rename": tips.crateRename,
    "crate-color": tips.crateColor,
    "crate-delete": tips.crateDelete,
    "crate-preset": tips.cratePreset,
    "crate-tree": tips.crateTree,
    "crate-tree-kind": tips.crateTreeKind,
    "crate-tree-low": tips.crateTreeLow,
    "crate-tree-high": tips.crateTreeHigh,
    "crate-tree-width": tips.crateTreeWidth,
    "crate-tree-step": tips.crateTreeStep,
    "crate-tree-min-tracks": tips.crateTreeMinTracks,
    "crate-tree-limit": tips.crateTreeLimit,
    "crate-tree-scope": tips.crateTreeScope,
    "crate-tree-name": tips.crateTreeName,
    "crate-tree-cancel": tips.crateTreeCancel,
    "crate-tree-create": tips.crateTreeCreate,
    "crate-folder-sync": tips.crateFolderSync,
    "crate-rename-from-tags": tips.crateRenameFromTags,
    "crate-refresh": tips.crateRefresh,
    "crate-queue-batch": tips.batchQueueCrate,
    "folder-sync-path": tips.folderSyncPath,
    "folder-sync-subcrates": tips.folderSyncSubcrates,
    "folder-sync-full": tips.folderSyncFull,
    "folder-sync-cancel": tips.folderSyncCancel,
    "folder-sync-run": tips.folderSyncRun,
    "preset-kind": tips.presetKind,
    "preset-key": tips.presetKey,
    "preset-bpm": tips.presetBpm,
    "preset-range": tips.presetRange,
    "preset-months": tips.presetMonths,
    "preset-conjunction": tips.presetConjunction,
    "preset-add-rule": tips.presetAddRule,
    "preset-add-group": tips.presetAddGroup,
    "preset-scope": tips.presetScope,
    "preset-name": tips.presetName,
    "preset-cancel": tips.presetCancel,
    "preset-create": tips.presetCreate,
    "drawer-toggle": tips.drawerToggle,
    "skip-to-content": tips.skipToContent,
    "open-help": tips.help,
    "shortcuts-title": tips.shortcuts,
    "shortcuts-filter": tips.shortcutsFilter,
    "shortcuts-reset-all": tips.shortcutsResetAll,
    "open-settings": tips.settings,
    search: tips.search,
    "sheet-scope-all": tips.allTracks,
    "search-field": tips.searchField,
    "export-m3u": tips.exportM3u,
    "export-rekordbox": tips.exportRekordbox,
    "rekordbox-memory": tips.memoryCues,
    "rekordbox-hot-loops": tips.hotLoops,
    "rekordbox-key": tips.rekordboxKey,
    "import-m3u": tips.importM3u,
    "import-file": tips.importFile,
    reload: tips.reload,
    "files-up": tips.filesUp,
    "files-search": tips.filesSearch,
    "files-refresh": tips.filesRefresh,
    "files-elsewhere": tips.filesElsewhere,
    "files-rename": tips.filesRename,
    "files-rename-from-tags": tips.filesRenameFromTags,
    "files-move": tips.filesMove,
    "files-move-folder": tips.filesMoveFolder,
    "files-replace": tips.filesReplace,
    "files-delete": tips.filesDelete,
    "files-move-here": tips.filesMoveHere,
    "files-pick-cancel": tips.filesPickCancel,
    "operations-refresh": tips.operationsRefresh,
    "operations-list": tips.operationsList,
    "snapshots-refresh": tips.snapshotsRefresh,
    "gig-refresh": tips.gigRefresh,
    "tonight-build": tips.gigTonight,
    "drift-refresh": tips.driftRefresh,
    "cloud-refresh": tips.cloudRefresh,
    "octave-refresh": tips.octaveRefresh,
    "players-refresh": tips.playersRefresh,
    "players-target": tips.playersTarget,
    "players-show": tips.playersShow,
    "health-refresh": tips.healthRefresh,
    "album-art-cancel": tips.healthArtCancel,
    "album-art-embed": tips.healthArtEmbed,
    "stats-refresh": tips.statsRefresh,
    "stats-csv": tips.statsCsv,
    "stats-period": tips.statsPeriod,
    "stats-from": tips.statsFrom,
    "stats-to": tips.statsTo,
    "stats-idle-days": tips.statsIdleDays,
    "compare-a": tips.compareA,
    "compare-b": tips.compareB,
    "compare-subcrates": tips.compareSubcrates,
    "compare-refresh": tips.compareShow,
    "scan-quick": tips.scanQuick,
    "scan-full": tips.scanFull,
    "bitrate-refresh": tips.bitrateRefresh,
    "bitrate-save": tips.bitrateSave,
    "tags-genre": tips.tagsGenre,
    "tags-artist": tips.tagsArtist,
    "tags-titles": tips.tagsTitles,
    "tags-refresh": tips.tagsRefresh,
    "lost-refresh": tips.lostRefresh,
    "lost-apply": tips.lostApply,
    "energy-refresh": tips.energyRefresh,
    "energy-apply": tips.energyApply,
    "reanalyze-refresh": tips.reanalyzeRefresh,
    "reanalyze-preview": tips.reanalyzePreview,
    "reanalyze-clear-frames": tips.reanalyzeClearFrames,
    "reanalyze-include-locked": tips.reanalyzeIncludeLocked,
    "audio-refresh": tips.audioRefresh,
    "audio-save": tips.audioSave,
    "audio-reanalyze": tips.audioReanalyze,
    "gain-refresh": tips.gainRefresh,
    "gain-save": tips.gainSave,
    "gain-reset": tips.gainReset,
    "gain-undo": tips.gainUndo,
    "streams-refresh": tips.streamsRefresh,
    "streams-repair": tips.streamsRepair,
    "snapshots-take": tips.snapshotsTake,
    "lan-stage-listen": tips.lanStageListen,
    "lan-stage-stop": tips.lanStageStop,
    "lan-stage-refresh": tips.lanStageRefresh,
    "lan-stage-host": tips.lanStageHost,
    "lan-stage-port": tips.lanStagePort,
    "lan-stage-code": tips.lanStageCode,
    "lan-stage-preview": tips.lanStagePreview,
    "lan-stage-send": tips.lanStageSend,
    "lan-stage-inbox": tips.lanStageInbox,
    "lan-stage-accept": tips.lanStageAccept,
    "lan-stage-accept-confirm": tips.lanStageConfirmAccept,
    "lan-stage-undo": tips.lanStageUndo,
    "lan-stage-discard": tips.lanStageDiscard,
    "lan-stage-discard-confirm": tips.lanStageConfirmDiscard,
    "music-mirror-dest": tips.musicMirrorDest,
    "music-mirror-preview": tips.musicMirrorPreview,
    "music-mirror-copy": tips.musicMirrorCopy,
    "music-mirror-restore": tips.musicMirrorRestore,
    "music-mirror-crate": tips.musicMirrorCrate,
    "music-mirror-relink": tips.musicMirrorRelink,
    "stick-backup-dest": tips.stickBackupDest,
    "stick-backup-preview": tips.stickBackupPreview,
    "stick-backup-copy": tips.stickBackupCopy,
    "history-rescue-source": tips.historyRescueSource,
    "history-rescue-scan": tips.historyRescueScan,
    "history-rescue-compare": tips.historyRescueCompare,
    "history-rescue-sessions": tips.historyRescueSessions,
    "history-rescue-crates": tips.historyRescueCrates,
    "history-rescue-restore": tips.historyRescueRestore,
    "snapshots-drives": tips.backupDrives,
    "snapshots-undo-button": tips.snapshotsUndo,
    "consent-decline": tips.consentDecline,
    "consent-accept": tips.consentAccept,
    "telemetry-toggle": tips.telemetry,
    "copy-version": tips.copyVersion,
    "rerun-wizard": tips.rerunWizard,
    "open-logs": tips.openLogs,
    "copy-logs": tips.copyLogs,
    "about-github": tips.helpGithub,
    "help-bug": tips.helpBug,
    "help-feature": tips.helpFeature,
    "help-github": tips.helpGithub,
    "help-releases": tips.helpReleases,
    "help-close": tips.helpClose,
    "help-happened": tips.helpHappened,
    "help-expected": tips.helpExpected,
    "help-names": tips.helpNames,
    "help-copy-log": tips.helpCopyLog,
    "help-open-github": tips.helpOpen,
    "help-report-close": tips.helpClose,
    "help-log-fallback": tips.helpReport,
    "settings-close": tips.settingsClose,
    "log-fallback": tips.logFallback,
    "language-select": tips.language,
    "colorway-select": tips.colorway,
    "icon-follows-theme": tips.iconFollowsTheme,
    "gig-lock": tips.gigLock,
    "min-copies": tips.minCopies,
    "untrusted-volumes": tips.untrustedVolumes,
    "library-generation": tips.libraryGeneration,
    "folder-access-allow": tips.folderAccessAllow,
    "status-refresh": tips.statusRefresh,
    "merge-trash": tips.mergeTrash,
    "merge-cancel": tips.mergeCancel,
    "merge-confirm": tips.mergeConfirm,
    "crates-replace-search": tips.cratesReplaceSearch,
    "crates-replace-keep": tips.cratesReplaceKeep,
    "crates-replace-retire": tips.cratesReplaceRetire,
    "crates-replace-cancel": tips.cratesReplaceCancel,
    "crates-replace-confirm": tips.cratesReplaceConfirm,
    "crate-prompt-input": tips.cratePromptName,
    "crate-prompt-cancel": tips.cratePromptCancel,
    "crate-prompt-confirm": tips.cratePromptConfirm,
    "overwrite-same-name": tips.overwriteSameName,
    "stick-confirm": tips.stickConfirm,
    "stick-review": tips.stickReview,
    "stick-import": tips.stickImport,
    "stick-review-files": tips.stickReview,
    "stick-import-files": tips.stickImport,
    "confirm-cancel": tips.confirmCancel,
    "confirm-confirm": tips.confirmAction,
    "rekordbox-cancel": tips.rekordboxCancel,
    "rekordbox-download": tips.rekordboxDownload,
    "files-name": tips.filesName,
    "files-replacement": tips.filesReplacement,
    "files-cancel": tips.filesCancel,
    "files-review": tips.filesReview,
    "files-confirm": tips.filesConfirm,
    "portable-close": tips.portableClose,
    "portable-drive": tips.portableDrive,
    "portable-check": tips.portableRun,
    "portable-smart-copy": tips.portableSmartCopy,
    "portable-smart-restore": tips.portableSmartRestore,
    "portable-smart-confirm": tips.portableSmartConfirm,
    "portable-smart-overwrite": tips.portableSmartOverwrite,
    "quick-open-query": tips.quickOpen,
    "quick-open-retry": tips.quickOpenRetry,
    "quick-open-close": tips.quickOpenClose,
    "snapshot-cancel": tips.snapshotCancel,
    "snapshot-confirm": tips.snapshotConfirm,
    "wizard-folder-up": tips.wizardFolderUp,
    "wizard-folder-use": tips.wizardFolderUse,
    "wizard-folder-close": tips.wizardFolderClose,
    "wizard-no": tips.wizardNo,
    "wizard-yes": tips.wizardYes,
    "wizard-updates-no": tips.wizardUpdatesNo,
    "wizard-updates-yes": tips.wizardUpdatesYes,
    "update-toggle": tips.updateToggle,
    "update-prereleases": tips.updatePrereleases,
    "update-download": tips.updateDownload,
    "update-skip": tips.updateSkip,
    "update-dismiss": tips.updateDismiss,
    "wizard-back": tips.wizardBack,
    "wizard-cancel": tips.wizardCancel,
    "wizard-secondary": tips.wizardSecondary,
    "wizard-primary": spec("tooltip.wizard.getStarted"),
    list: tips.trackList,
    "list-b": tips.trackList,
    "files-list": tips.filesList,
    "snapshots-list": tips.snapshotsList,
    "track-splitter": tips.splitter,
  };
  return known[id];
}

export function expandCrate(name: string): TipSpec {
  return spec("tooltip.expandCrate", { name });
}

export function collapseCrate(name: string): TipSpec {
  return spec("tooltip.collapseCrate", { name });
}

export function openCrate(name: string): TipSpec {
  return spec("tooltip.openCrate", { name });
}

export function sessionTip(name: string): TipSpec {
  return spec("tooltip.session", { name });
}

export function playRow(name: string): TipSpec {
  return spec("tooltip.playRow", { name });
}

export function selectRow(name: string): TipSpec {
  return spec("tooltip.selectRow", { name });
}

export function cueTip(label: string): TipSpec {
  return spec("tooltip.cue", { label });
}

export const cueEditApplyTip = spec("tooltip.cueEditApply");
export const cueEditDiscardTip = spec("tooltip.cueEditDiscard");
export const cueEditTimeTip = spec("tooltip.cueEditTime");
export const cueEditNameTip = spec("tooltip.cueEditName");
export const cueEditColorTip = spec("tooltip.cueEditColor");
export const cueEditDeleteTip = spec("tooltip.cueEditDelete");
export const cueEditSetTip = spec("tooltip.cueEditSet");
export const cueEditSwapTip = spec("tooltip.cueEditSwap");

export function cueEditNudgeTip(deltaMs: number, beat = false): TipSpec {
  if (beat) {
    return spec(deltaMs < 0 ? "tooltip.cueEditBeatBack" : "tooltip.cueEditBeatForward");
  }
  return spec("tooltip.cueEditNudge", { ms: Math.abs(deltaMs), sign: deltaMs < 0 ? "−" : "+" });
}

export function editField(label: string): TipSpec {
  return spec("tooltip.editField", { label });
}

export function revealTip(manager: string): TipSpec {
  return spec("tooltip.reveal", { name: manager });
}

export function detailSectionTip(section: string): TipSpec {
  return spec("tooltip.detailSection", { section });
}

export function openCopy(name: string): TipSpec {
  return spec("tooltip.openCopy", { name });
}

export function openReplaceCopy(name: string): TipSpec {
  return spec("tooltip.openReplaceCopy", { name });
}

export function openRelated(name: string): TipSpec {
  return spec("tooltip.openRelated", { name });
}

export function removeRelatedTip(name: string): TipSpec {
  return spec("tooltip.removeRelated", { name });
}

export function chooseRelated(name: string): TipSpec {
  return spec("tooltip.chooseRelated", { name });
}

export function saveSuggestion(name: string): TipSpec {
  return spec("tooltip.saveSuggestion", { name });
}

export function membershipTip(name: string): TipSpec {
  return spec("tooltip.membership", { name });
}

export function openCrumb(name: string): TipSpec {
  return spec("tooltip.openCrumb", { name });
}

export function openFile(name: string): TipSpec {
  return spec("tooltip.openFile", { name });
}

export function portableCheck(name: string): TipSpec {
  return spec("tooltip.portableCheck", { name });
}

export function missingDrive(name: string): TipSpec {
  return spec("tooltip.missingDrive", { name });
}

export function fileShortcut(name: string): TipSpec {
  return spec("tooltip.fileShortcut", { name });
}

export function selectFile(name: string, path = ""): TipSpec {
  if (path && path !== name) return spec("tooltip.selectFilePath", { name, path });
  return spec("tooltip.selectFile", { name });
}

export function wizardFolder(name: string): TipSpec {
  return spec("tooltip.wizardFolder", { name });
}

export function keepCopy(name: string): TipSpec {
  return spec("tooltip.keepCopy", { name });
}

export function quickOpenHit(kind: string, title: string, detail: string): TipSpec {
  if (detail) return spec("tooltip.quickOpenHitDetail", { kind, title, detail });
  return spec("tooltip.quickOpenHit", { kind, title });
}

/** The sentence for a spec, in the active locale. Tests read this. */
export function tipText(item: TipSpec): string {
  return t(item.key, item.params);
}
