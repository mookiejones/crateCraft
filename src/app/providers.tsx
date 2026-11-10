/**
 * React providers for the page.
 *
 * Player state is one domain. Files is another. Each screen adds its
 * own context file and one wrapper here. This module reads those stores;
 * it does not own playback or the folder load.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  FilesProvider as FilesContextProvider,
  type FilesContextValue,
} from "../context/FilesContext";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import { failureOf } from "../api";
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
import { LOCALE_EVENT } from "../i18n";
import {
  canSkip,
  canTogglePlay,
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
 * Player is the first domain. Files is the second. A later screen adds
 * one line here.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <FilesProvider>{children}</FilesProvider>
    </PlayerProvider>
  );
}
