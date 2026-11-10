/**
 * Zoom, overview source, and load phase for the waveform island.
 *
 * Playhead and the loaded track come from `PlayerContext`. This file is
 * only the waveform UI. `AppProviders` mounts the provider.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ZOOM_DEFAULT_PPS, ZOOM_MAX_PPS, ZOOM_MIN_PPS } from "../waveform";

/** What the overview canvas is showing. */
export type OverviewSource = "serato" | "computed" | "";

/** Load phase written on the host as `data-waveform-state`. */
export type WaveformPhase = "idle" | "reading" | "ready" | "unavailable";

/** Zoom, phase, and overview source published by the waveform engine. */
export type WaveformUi = {
  pps: number;
  phase: WaveformPhase;
  overviewSource: OverviewSource;
};

/**
 * Seek and clock used while painting.
 *
 * Tests and the screenshot fixture pass an override. The live island
 * reads the player instead.
 */
export type WaveformClock = {
  seek(seconds: number): void;
  seekBy(deltaSeconds: number): void;
  getTime(): number;
  getDuration(): number;
  getPlaying(): boolean;
  formatTime(seconds: number): string;
  seekStep: number;
  seekStepLarge: number;
};

export type WaveformContextValue = WaveformUi & {
  canZoomIn: boolean;
  canZoomOut: boolean;
  publish: (next: WaveformUi) => void;
};

const defaultUi: WaveformUi = {
  pps: ZOOM_DEFAULT_PPS,
  phase: "idle",
  overviewSource: "",
};

const WaveformContext = createContext<WaveformContextValue | null>(null);
const WaveformClockContext = createContext<WaveformClock | null>(null);

/**
 * Hold zoom and overview UI state for one island.
 *
 * @param children Tree that may call `useWaveform`.
 */
export function WaveformProvider({ children }: { children: ReactNode }) {
  const [ui, setUi] = useState<WaveformUi>(defaultUi);
  const value = useMemo((): WaveformContextValue => {
    const blocked = ui.phase === "reading" || ui.phase === "unavailable";
    return {
      ...ui,
      canZoomIn: !blocked && ui.pps < ZOOM_MAX_PPS - 1e-9,
      canZoomOut: !blocked && ui.pps > ZOOM_MIN_PPS + 1e-9,
      publish: (next) => {
        flushSync(() => {
          setUi(next);
        });
      },
    };
  }, [ui]);
  return <WaveformContext value={value}>{children}</WaveformContext>;
}

/**
 * Override the playback clock for tests and the screenshot fixture.
 *
 * @param clock Seek and time callbacks. The live island omits this.
 * @param children Waveform tree.
 */
export function WaveformClockProvider({
  clock,
  children,
}: {
  clock: WaveformClock;
  children: ReactNode;
}) {
  return <WaveformClockContext value={clock}>{children}</WaveformClockContext>;
}

/**
 * Read zoom and overview UI state.
 *
 * Throws when no `WaveformProvider` is above this component.
 *
 * @returns The published UI snapshot.
 */
export function useWaveform(): WaveformContextValue {
  const value = useContext(WaveformContext);
  if (value === null) {
    throw new Error("useWaveform must be used within WaveformProvider");
  }
  return value;
}

/**
 * Optional clock override. Null means use the player.
 *
 * @returns The fixture or test clock, or null.
 */
export function useWaveformClockOverride(): WaveformClock | null {
  return useContext(WaveformClockContext);
}
