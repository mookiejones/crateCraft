/**
 * React providers for the page.
 *
 * Player is one domain. List selection and detail fields are another.
 * Each domain has its own context file and one wrapper here. This module
 * reads the player engine and the track-list store; it does not own
 * playback or the library.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import {
  TrackListProvider as TrackListContextProvider,
  type TrackListContextValue,
} from "../context/TrackListContext";
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
import {
  getTrackListActions,
  readTrackList,
  subscribeTrackList,
} from "../track-list-store";

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
  useEffect(() => {
    return subscribeTrackList(() => {
      flushSync(() => {
        setValue(readTrackListValue());
      });
    });
  }, []);
  const current = useMemo(() => value, [value]);
  return <TrackListContextProvider value={current}>{children}</TrackListContextProvider>;
}

/**
 * Nest every domain provider.
 *
 * Player is first. List selection and detail fields are second.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <TrackListRoot>{children}</TrackListRoot>
    </PlayerProvider>
  );
}
