/**
 * React providers for the page.
 *
 * Player and wizard are separate domains. The wizard bundle mounts its
 * own live `WizardProvider` value; this file supplies an idle wizard so
 * the domain is present on every island without pulling the setup fetch
 * into `app.js`. This module reads the player engine; it does not own
 * playback.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  PlayerProvider as PlayerContextProvider,
  type PlayerContextValue,
} from "../context/PlayerContext";
import {
  idleWizardValue,
  WizardProvider as WizardContextProvider,
} from "../context/WizardContext";
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

/**
 * Nest every domain provider.
 *
 * Player and wizard each have a context file. A later screen adds one
 * line here.
 *
 * @param children Page island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <WizardProvider>{children}</WizardProvider>
    </PlayerProvider>
  );
}
