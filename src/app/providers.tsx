/**
 * React providers for the page.
 *
 * Player, History, and waveform zoom/overview are separate domains.
 * Each has its own context file and one wrapper here. This module reads
 * those stores; it does not own playback or history fetches.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
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
 * Nest every domain provider.
 *
 * Player is the first domain. Waveform zoom and overview wrap inside it.
 * History is the second. A later screen adds one line here.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <WaveformProvider>
        <HistoryProvider>{children}</HistoryProvider>
      </WaveformProvider>
    </PlayerProvider>
  );
}
