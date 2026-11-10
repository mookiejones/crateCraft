/**
 * React providers for the page.
 *
 * Player, waveform zoom, and Settings are separate domains. Each has
 * its own context file and one wrapper here. This module reads those
 * stores; it does not own playback or the settings file.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import { WaveformProvider } from "../context/WaveformContext";
import {
  SettingsProvider as SettingsContextProvider,
  type SettingsContextValue,
} from "../context/SettingsContext";
import { onLocaleChange } from "../i18n";
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
} from "../settings";

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

/**
 * Nest every domain provider.
 *
 * Player is the first domain. Waveform zoom and overview wrap inside
 * it. Settings is the third.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <WaveformProvider>
        <SettingsProvider>{children}</SettingsProvider>
      </WaveformProvider>
    </PlayerProvider>
  );
}
