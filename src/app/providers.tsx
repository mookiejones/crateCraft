/**
 * React providers for the page.
 *
 * Player state is one domain. Waveform zoom and overview are another.
 * Snapshots is another. Each screen adds its own context file and one
 * wrapper here. This module reads the engines; it does not own playback
 * or restore writes.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import { WaveformProvider } from "../context/WaveformContext";
import {
  SnapshotsProvider as SnapshotsContextProvider,
  type SnapshotsContextValue,
} from "../context/SnapshotsContext";
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
} from "../restore";

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
 * Nest every domain provider.
 *
 * Player is the first domain. Waveform zoom and overview wrap inside it.
 * Snapshots wraps inside waveform.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <WaveformProvider>
        <SnapshotsProvider>{children}</SnapshotsProvider>
      </WaveformProvider>
    </PlayerProvider>
  );
}
