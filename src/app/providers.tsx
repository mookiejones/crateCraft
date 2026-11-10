/**
 * React providers for the page.
 *
 * Player state is one domain. The crate rail is the next. Waveform zoom
 * and overview are another. Each screen adds its own context file and
 * one wrapper here. This module reads the player engine and the crate
 * snapshot; it does not own playback or crate writes.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { CrateProvider as CrateContextProvider } from "../context/CrateContext";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import { WaveformProvider } from "../context/WaveformContext";
import { readCrateValue, subscribeCrates } from "../crate-store";
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
 * Nest every domain provider.
 *
 * Player is the first domain. Crates add one wrapper here. Waveform zoom
 * and overview wrap inside that.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <CrateProvider>
        <WaveformProvider>{children}</WaveformProvider>
      </CrateProvider>
    </PlayerProvider>
  );
}
