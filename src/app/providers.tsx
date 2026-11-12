/**
 * React providers for the page.
 *
 * Player is one domain. The crate rail is the next. Waveform zoom and
 * overview are another. Before a gig is a fourth. Files is a fifth.
 * History is a sixth. Settings is a seventh. Track list selection and
 * detail fields are an eighth. Snapshots is a ninth. The first-run
 * wizard is a tenth; this file mounts an idle value so the domain is
 * present on every island. The wizard bundle supplies the live value.
 * Library health is an eleventh. Later screens add their own context
 * file and one wrapper here. This module reads those engines; it does
 * not own fetch, playback, crate writes, history loads, the folder
 * load, the settings file, restore writes, setup fetch, or health
 * fetches.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { failureOf } from "../lib/api";
import { MuiThemeRoot } from "./mui-theme-root";
import { CrateProvider as CrateContextProvider } from "../containers/CrateContext";
import {
  FilesProvider as FilesContextProvider,
  type FilesContextValue,
} from "../containers/FilesContext";
import {
  GigStateProvider,
  type GigContextValue,
} from "../containers/GigContext";
import {
  HealthProvider as HealthContextProvider,
  type HealthContextValue,
} from "../containers/HealthContext";
import {
  HistoryProvider as HistoryContextProvider,
  historyActions,
  subscribeHistory,
  type HistoryContextValue,
} from "../containers/HistoryContext";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../containers/PlayerContext";
import { WaveformProvider } from "../containers/WaveformContext";
import { readCrateValue, subscribeCrates } from "../lib/crates/crate-store";
import {
  browserRows,
  cancelFilesPick,
  closeFilesDialog,
  confirmFiles,
  confirmMoveHere,
  filesRowHeight,
  getFilesDialog,
  goFilesUp,
  markFilesActive,
  onFilesKey,
  onFilesSearchInput,
  openBrowserRow,
  openFilesCrumb,
  refreshFiles,
  reviewFiles,
  selectedFiles,
  setDialogName,
  setDialogReplacement,
  setDialogStatus,
  startDelete,
  startMoveFiles,
  startMoveFolder,
  startRename,
  startRenameFromTags,
  startReplace,
  subscribeFiles,
  toggleFile,
  toggleFilesElsewhere,
} from "../lib/files/files";
import {
  backGigStep,
  exitGigCheck,
  getGigSnapshot,
  nextGigStep,
  subscribeGig,
} from "../lib/gig/gig";
import { getDriftSnapshot, subscribeDrift } from "../lib/gig/drift";
import { subscribeHealth } from "../lib/health/health-events";
import { getHealthListSnapshot } from "../lib/health/health-list";
import { getHealthSnapshot, loadHealth, navigateHealth } from "../lib/health/health";
import { expandScan, getScanSnapshot, loadScan } from "../lib/health/scan";
import {
  applyGroup,
  applyMappings,
  applyTitles,
  getTagsSnapshot,
  loadTags,
  previewGroup,
  selectSpelling,
  setTagsField,
} from "../lib/health/tags";
import { LOCALE_EVENT, onLocaleChange } from "../lib/i18n";
import {
  SettingsProvider as SettingsContextProvider,
  type SettingsContextValue,
} from "../containers/SettingsContext";
import {
  SnapshotsProvider as SnapshotsContextProvider,
  type SnapshotsContextValue,
} from "../containers/SnapshotsContext";
import {
  TrackListProvider as TrackListContextProvider,
  type TrackListContextValue,
} from "../containers/TrackListContext";
import {
  idleWizardValue,
  WizardProvider as WizardContextProvider,
} from "../containers/WizardContext";
import {
  SEEK_STEP_LARGE_SECONDS,
  SEEK_STEP_SECONDS,
  canSkip,
  canTogglePlay,
  formatPlayerTime,
  getMediaDuration,
  getMediaTime,
  getPlayerCues,
  getPlayerState,
  next,
  pause,
  play,
  playOrToggle,
  previous,
  seek,
  seekBy,
  setVolume,
  subscribe,
  togglePlayPause,
} from "../lib/player/player";
import { portableSnapshot } from "../lib/gig/portable";
import {
  backupDriveCrates,
  closePlan,
  confirmSnapshotRestore,
  failSnapshots,
  getSnapshotsState,
  loadOperations,
  loadSnapshots,
  openSnapshotPlan,
  setSnapshotDialogStatus,
  subscribe as subscribeSnapshots,
  takeSnapshot,
} from "../lib/snapshots/restore";
import {
  closeSettings,
  copyLogs,
  copySettingsVersion,
  getSettingsState,
  openLogs,
  rerunSetup,
  saveColorway,
  saveIconFollow,
  saveLanguage,
  saveSharing,
  saveUpdateEnabled,
  saveUpdatePrereleases,
  subscribeSettings,
} from "../lib/ui/settings";
import { state } from "../lib/state";
import {
  getTrackListActions,
  readTrackList,
  subscribeTrackList,
} from "../lib/ui/track-list-store";

function readPlayerValue(): PlayerContextValue {
  return {
    ...getPlayerState(),
    cues: getPlayerCues(),
    canTogglePlay: canTogglePlay(),
    canSkipPrevious: canSkip(-1),
    canSkipNext: canSkip(1),
    play,
    pause,
    playOrToggle,
    togglePlayPause,
    next,
    previous,
    seek,
    seekBy,
    setVolume,
    mediaTime: getMediaTime,
    mediaDuration: getMediaDuration,
    formatTime: formatPlayerTime,
    seekStep: SEEK_STEP_SECONDS,
    seekStepLarge: SEEK_STEP_LARGE_SECONDS,
  };
}

function readSettingsValue(): SettingsContextValue {
  return {
    ...getSettingsState(),
    saveLanguage,
    saveColorway,
    saveIconFollow,
    saveSharing: async (on) => {
      await saveSharing(on);
    },
    saveUpdateEnabled,
    saveUpdatePrereleases,
    openLogs,
    copyLogs,
    copyVersion: copySettingsVersion,
    rerunSetup,
    close: closeSettings,
  };
}

function readGigValue(): GigContextValue {
  return {
    gig: getGigSnapshot(),
    drift: getDriftSnapshot(),
    nextStep: nextGigStep,
    backStep: backGigStep,
    exit: exitGigCheck,
  };
}

function readFilesValue(): FilesContextValue {
  const dialog = getFilesDialog();
  const portable = portableSnapshot();
  const selectedEntries = selectedFiles();
  return {
    writable: state.writable,
    path: state.filesPath,
    parent: state.filesParent,
    entries: state.filesEntries,
    selected: state.filesSelected,
    pick: state.filesPick,
    pickPaths: state.filesPickPaths,
    pickSource: state.filesPickSource,
    loading: state.filesLoading,
    error: state.filesError,
    message: state.filesMessage,
    truncated: state.filesTruncated,
    atRoots: state.filesAtRoots,
    roots: state.filesRoots,
    root: state.filesRoot,
    breadcrumb: state.filesBreadcrumb,
    elsewhere: state.filesElsewhere,
    active: state.filesActive,
    query: state.filesQuery,
    searching: state.filesSearching,
    rows: browserRows(),
    selectedEntries,
    locked: !state.writable || state.filesLoading || state.filesAtRoots,
    rowHeight: filesRowHeight(),
    dialogAction: dialog.action,
    dialogOpen: dialog.open,
    dialogName: dialog.name,
    dialogReplacement: dialog.replacement,
    dialogStatus: dialog.status,
    dialogPreview: dialog.preview,
    dialogScope: dialog.scope,
    portableReport: portable.report,
    portableStatus: portable.status,
    goUp: goFilesUp,
    refresh: refreshFiles,
    toggleElsewhere: toggleFilesElsewhere,
    openCrumb: openFilesCrumb,
    openRow: (entry, index) => {
      state.filesActive = index;
      openBrowserRow(entry);
    },
    toggleFile,
    markActive: markFilesActive,
    onListKey: onFilesKey,
    onSearchInput: onFilesSearchInput,
    startRename,
    startRenameFromTags: (trigger) => startRenameFromTags(trigger, "paths"),
    startMove: startMoveFiles,
    startMoveFolder,
    startReplace,
    startDelete,
    confirmMoveHere,
    cancelPick: cancelFilesPick,
    setDialogName,
    setDialogReplacement,
    review: () => reviewFiles().catch((error: unknown) => {
      setDialogStatus(failureOf(error).message);
    }),
    confirm: () => confirmFiles().catch((error: unknown) => {
      setDialogStatus(failureOf(error).message);
    }),
    closeDialog: closeFilesDialog,
  };
}

/**
 * Mount the player domain at the root of one React island.
 *
 * Updates are flushed so existing tests and the list paint see Play and
 * Pause in the same turn as the engine change.
 *
 * @param children Island that calls `usePlayer`.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readPlayerValue);
  useEffect(() => {
    return subscribe(() => {
      flushSync(() => {
        setValue(readPlayerValue());
      });
    });
  }, []);
  const current = useMemo(() => value, [value]);
  return <PlayerContextProvider value={current}>{children}</PlayerContextProvider>;
}

function readHistoryValue(): HistoryContextValue {
  return {
    sessions: state.historySessions,
    historyId: state.historyId,
    entries: state.entries,
    selectedId: state.selectedId,
    loadHistory: () => historyActions.loadHistory(),
    openSession: (id) => historyActions.openSession(id),
    selectEntry: (id) => historyActions.selectEntry(id),
    openInLibrary: (assetId) => historyActions.openInLibrary(assetId),
  };
}

/**
 * Mount the history domain at the root of one React island.
 *
 * Updates are flushed so the session list and history detail stay in
 * step with `state`.
 *
 * @param children Island that calls `useHistory`.
 */
export function HistoryProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readHistoryValue);
  useEffect(() => {
    return subscribeHistory(() => {
      flushSync(() => {
        setValue(readHistoryValue());
      });
    });
  }, []);
  const current = useMemo(() => value, [value]);
  return <HistoryContextProvider value={current}>{children}</HistoryContextProvider>;
}

/**
 * Mount the Before a gig domain at the root of one React island.
 *
 * Updates are flushed so existing tests see the report in the same turn
 * as the engine change.
 *
 * @param children Island that calls `useGig`.
 */
export function GigProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readGigValue);
  useEffect(() => {
    const refresh = () => {
      flushSync(() => {
        setValue(readGigValue());
      });
    };
    const stopGig = subscribeGig(refresh);
    const stopDrift = subscribeDrift(refresh);
    return () => {
      stopGig();
      stopDrift();
    };
  }, []);
  const current = useMemo(() => value, [value]);
  return <GigStateProvider value={current}>{children}</GigStateProvider>;
}

/**
 * Mount the Files domain at the root of one React island.
 *
 * Updates are flushed so existing tests see the folder in the same turn
 * as the store change.
 *
 * @param children Island that calls `useFiles`.
 */
export function FilesProvider({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(readFilesValue);
  useEffect(() => {
    const refresh = () => {
      if (!hostRef.current?.isConnected) return;
      flushSync(() => {
        setValue(readFilesValue());
      });
    };
    const unsub = subscribeFiles(refresh);
    document.addEventListener(LOCALE_EVENT, refresh);
    return () => {
      unsub();
      document.removeEventListener(LOCALE_EVENT, refresh);
    };
  }, []);
  const current = useMemo(() => value, [value]);
  return (
    <FilesContextProvider value={current}>
      <span ref={hostRef} hidden />
      {children}
    </FilesContextProvider>
  );
}

/**
 * Mount the crate domain at the root of one React island.
 *
 * Updates are flushed so the rail and action buttons match `state` in
 * the same turn as emitCrates.
 *
 * @param children Island that calls `useCrates`.
 */
export function CrateProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readCrateValue);
  useEffect(() => {
    return subscribeCrates(() => {
      flushSync(() => {
        setValue(readCrateValue());
      });
    });
  }, []);
  const current = useMemo(() => value, [value]);
  return <CrateContextProvider value={current}>{children}</CrateContextProvider>;
}

/**
 * Mount the Settings domain at the root of one React island.
 *
 * Updates are flushed so tests see the picker and About in the same
 * turn as a save. A language change also repaints, because labels live
 * in the catalogs.
 *
 * @param children Island that calls `useSettings`.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readSettingsValue);
  useEffect(() => {
    const refresh = (): void => {
      flushSync(() => {
        setValue(readSettingsValue());
      });
    };
    const stopStore = subscribeSettings(refresh);
    const stopLocale = onLocaleChange(refresh);
    return () => {
      stopStore();
      stopLocale();
    };
  }, []);
  const current = useMemo(() => value, [value]);
  return <SettingsContextProvider value={current}>{children}</SettingsContextProvider>;
}

function readTrackListValue(): TrackListContextValue {
  return {
    ...readTrackList(),
    ...getTrackListActions(),
  };
}

/**
 * Mount the list and detail domain at the root of one React island.
 *
 * Updates are flushed so a selection change paints in the same turn.
 *
 * @param children Island that calls `useTrackList`.
 */
export function TrackListRoot({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readTrackListValue);
  useLayoutEffect(() => {
    return subscribeTrackList(() => {
      flushSync(() => {
        setValue(readTrackListValue());
      });
    });
  }, []);
  const current = useMemo(() => value, [value]);
  return <TrackListContextProvider value={current}>{children}</TrackListContextProvider>;
}

function readSnapshotsValue(): SnapshotsContextValue {
  return {
    ...getSnapshotsState(),
    loadSnapshots,
    loadOperations,
    takeSnapshot,
    backupDriveCrates,
    openSnapshotPlan,
    confirmSnapshotRestore,
    closePlan,
    failSnapshots,
    setSnapshotDialogStatus,
  };
}

/**
 * Mount the snapshots domain at the root of one React island.
 *
 * Updates are flushed so existing tests see the list and restore plan
 * in the same turn as the engine change.
 *
 * @param children Island that calls `useSnapshots`.
 */
export function SnapshotsProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readSnapshotsValue);
  useEffect(() => {
    return subscribeSnapshots(() => {
      flushSync(() => {
        setValue(readSnapshotsValue());
      });
    });
  }, []);
  const current = useMemo(() => value, [value]);
  return <SnapshotsContextProvider value={current}>{children}</SnapshotsContextProvider>;
}

/**
 * Mount an idle wizard domain at the root of one React island.
 *
 * Live setup state is supplied by the wizard bundle. This wrapper keeps
 * `useWizard` defined on the main page.
 *
 * @param children Island that may call `useWizard`.
 */
export function WizardProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => idleWizardValue(), []);
  return <WizardContextProvider value={value}>{children}</WizardContextProvider>;
}

function readHealthValue(): HealthContextValue {
  return {
    ...getHealthSnapshot(),
    ...getScanSnapshot(),
    ...getTagsSnapshot(),
    ...getHealthListSnapshot(),
    loadHealth,
    loadScan,
    expandScan,
    loadTags,
    setTagsField,
    selectSpelling,
    previewGroup,
    applyGroup,
    applyTitles,
    applyMappings,
    navigate: navigateHealth,
  };
}

/**
 * Mount the Library health domain at the root of one React island.
 *
 * @param children Island that calls `useHealth`.
 */
export function HealthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(readHealthValue);
  useLayoutEffect(() => {
    return subscribeHealth(() => {
      flushSync(() => {
        setValue(readHealthValue());
      });
    });
  }, []);
  const current = useMemo(() => value, [value]);
  return <HealthContextProvider value={current}>{children}</HealthContextProvider>;
}

/**
 * Nest every domain provider.
 *
 * MUI ThemeProvider is the outer wrap, mapped to the saved colorway.
 * Player is the first domain. Crates wrap inside it. Waveform wraps
 * inside crates. Before a gig wraps inside waveform. Files wraps inside
 * Before a gig. History wraps inside Files. Settings wraps inside History.
 * Track list wraps inside Settings. Snapshots wraps inside Track list.
 * An idle wizard wraps the island so `useWizard` is defined. Library
 * health wraps inside the wizard.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MuiThemeRoot>
      <PlayerProvider>
        <CrateProvider>
          <WaveformProvider>
            <GigProvider>
              <FilesProvider>
                <HistoryProvider>
                  <SettingsProvider>
                    <TrackListRoot>
                      <SnapshotsProvider>
                        <WizardProvider>
                          <HealthProvider>{children}</HealthProvider>
                        </WizardProvider>
                      </SnapshotsProvider>
                    </TrackListRoot>
                  </SettingsProvider>
                </HistoryProvider>
              </FilesProvider>
            </GigProvider>
          </WaveformProvider>
        </CrateProvider>
      </PlayerProvider>
    </MuiThemeRoot>
  );
}
