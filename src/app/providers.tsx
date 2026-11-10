/**
 * React providers for the page.
 *
 * Player state is one domain. Library health is another. Waveform zoom
 * and overview are another. Each has its own context file and one
 * wrapper here. This module reads those stores; it does not own
 * playback or health fetches.
 */

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  HealthProvider as HealthContextProvider,
  type HealthContextValue,
} from "../context/HealthContext";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import { WaveformProvider } from "../context/WaveformContext";
import { subscribeHealth } from "../health-events";
import { getHealthListSnapshot } from "../health-list";
import {
  getHealthSnapshot,
  loadHealth,
  navigateHealth,
} from "../health";
import {
  expandScan,
  getScanSnapshot,
  loadScan,
} from "../scan";
import {
  applyGroup,
  applyMappings,
  applyTitles,
  getTagsSnapshot,
  loadTags,
  previewGroup,
  selectSpelling,
  setTagsField,
} from "../tags";
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
 * Player is first. Waveform zoom wraps inside it. Health is the
 * Library health group.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <WaveformProvider>
        <HealthProvider>{children}</HealthProvider>
      </WaveformProvider>
    </PlayerProvider>
  );
}
