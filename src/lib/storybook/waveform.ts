/**
 * Storybook waveform seed. Isolated from fixtures.ts so other stories
 * do not load WaveformEngine.
 */

import {
  fixtureMarkers,
  fixtureWaveform,
  type WaveformEngine,
} from "../player/waveform-view";

export type StoryWaveformEngine = Pick<
  WaveformEngine,
  "showComputed" | "setMarkers" | "sync" | "showUnavailable"
>;

/**
 * Paint the screenshot waveform on a live engine, or the unavailable note.
 *
 * Stories call this after `WaveformPanel` attaches. Duration matches the
 * 20 second fixture markers unless the caller passes another length.
 *
 * @param engine Real `WaveformEngine` or a test double.
 * @param options Duration in seconds, or `unavailable` for the format note.
 */
export function seedStoryWaveform(
  engine: StoryWaveformEngine,
  options: { duration?: number; unavailable?: boolean } = {},
): void {
  if (options.unavailable) {
    engine.showUnavailable();
    return;
  }
  const duration = options.duration ?? 20;
  engine.showComputed(fixtureWaveform(duration));
  engine.setMarkers(1, fixtureMarkers());
  engine.sync();
}
