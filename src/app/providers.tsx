/**
 * React providers for the page.
 *
 * Player is one domain. Waveform zoom and overview are another. Before
 * a gig (gig check and Tempo drift) is a third. Files is a fourth.
 * History is a fifth. Later screens add their own context file and one
 * wrapper here. This module reads those engines; it does not own fetch,
 * playback, history loads, or the folder load.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { failureOf } from "../api";
import {
  FilesProvider as FilesContextProvider,
  type FilesContextValue,
} from "../context/FilesContext";
import {
  GigStateProvider,
  type GigContextValue,
} from "../context/GigContext";
import {
  HistoryProvider as HistoryContextProvider,
  historyActions,
  subscribeHistory,
  type HistoryContextValue,
} from "../context/HistoryContext";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import { WaveformProvider } from "../context/WaveformContext";
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
} from "../files";
import {
  backGigStep,
  exitGigCheck,
  getGigSnapshot,
  nextGigStep,
  subscribeGig,
} from "../gig";
import { getDriftSnapshot, subscribeDrift } from "../drift";
import { LOCALE_EVENT } from "../i18n";
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
} from "../player";
import { portableSnapshot } from "../portable";
import { state } from "../state";

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
 * Nest every domain provider.
 *
 * Player is the first domain. Waveform zoom and overview wrap inside it.
 * Before a gig wraps inside waveform. Files wraps inside Before a gig.
 * History wraps inside Files.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <WaveformProvider>
        <GigProvider>
          <FilesProvider>
            <HistoryProvider>{children}</HistoryProvider>
          </FilesProvider>
        </GigProvider>
      </WaveformProvider>
    </PlayerProvider>
  );
}
