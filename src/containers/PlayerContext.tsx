/**
 * Shared player state for the bar, list Play, and detail Play.
 *
 * The audio engine stays in `player.ts`. This context is the one React
 * read path. Providers subscribe to that engine so every mounted island
 * sees the same snapshot.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { CueMarker, PlayerSnapshot } from "../lib/player/player";

export type PlayerContextValue = PlayerSnapshot & {
  cues: readonly CueMarker[];
  canTogglePlay: boolean;
  canSkipPrevious: boolean;
  canSkipNext: boolean;
  play: (trackId: number) => void;
  pause: () => void;
  playOrToggle: (trackId: number) => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setVolume: (volume: number) => void;
  mediaTime: () => number;
  mediaDuration: () => number;
  formatTime: (seconds: number) => string;
  seekStep: number;
  seekStepLarge: number;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * Supply one player snapshot to a React tree.
 *
 * @param value Current snapshot and the engine actions.
 * @param children Tree that may call `usePlayer`.
 */
export function PlayerProvider({
  value,
  children,
}: {
  value: PlayerContextValue;
  children: ReactNode;
}) {
  return <PlayerContext value={value}>{children}</PlayerContext>;
}

/**
 * Read the shared player.
 *
 * Throws when no `PlayerProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext);
  if (value === null) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return value;
}
