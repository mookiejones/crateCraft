/**
 * React providers for the page.
 *
 * Player is one domain. Before a gig (gig check and Tempo drift) is
 * another. Later screens add their own context file and one wrapper
 * here. This module reads those engines; it does not own fetch or
 * playback.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  GigStateProvider,
  type GigContextValue,
} from "../context/GigContext";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import {
  backGigStep,
  exitGigCheck,
  getGigSnapshot,
  nextGigStep,
  subscribeGig,
} from "../gig";
import { getDriftSnapshot, subscribeDrift } from "../drift";
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

function readGigValue(): GigContextValue {
  return {
    gig: getGigSnapshot(),
    drift: getDriftSnapshot(),
    nextStep: nextGigStep,
    backStep: backGigStep,
    exit: exitGigCheck,
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
 * Nest every domain provider.
 *
 * Player is the first domain. Before a gig is the second.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <GigProvider>{children}</GigProvider>
    </PlayerProvider>
  );
}
