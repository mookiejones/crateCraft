/**
 * Waveform zoom and overview render from WaveformContext.
 */

import { afterEach, describe, expect, it } from "vitest";
import { playerStrings } from "../player-strings";
import { mountWaveform, type WaveformHooks } from "../waveform-view";
import { ZOOM_DEFAULT_PPS, type ParsedWaveform } from "../waveform";

function hooks(): WaveformHooks {
  return {
    seek() {},
    seekBy() {},
    getTime: () => 0,
    getDuration: () => 20,
    getPlaying: () => false,
    formatTime: (seconds) => `${seconds}`,
    seekStep: 5,
    seekStepLarge: 30,
  };
}

function parsedWave(): ParsedWaveform {
  return {
    version: 1,
    flags: 3,
    analyzerVersion: 1,
    sampleRate: 44100,
    pointsPerSecond: 150,
    durationMs: 20_000,
    detail: new Uint8Array(6),
    overview: new Uint8Array([180, 180, 0, 0, 0, 0]),
    serato: new Uint8Array(),
    detailCount: 1,
    overviewCount: 1,
    seratoColumns: 0,
    seratoBands: 0,
    lowHz: 250,
    highHz: 4000,
  };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("WaveformPanel context", () => {
  it("renders overview and zoom from WaveformContext", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const view = mountWaveform(host, hooks());
    view.showComputed(parsedWave());
    const zoom = host.querySelector(".waveform-zoom");
    const overview = host.querySelector(".waveform-overview");
    expect(zoom?.getAttribute("data-pps")).toBe(String(ZOOM_DEFAULT_PPS));
    expect(overview?.getAttribute("data-pps")).toBe(String(ZOOM_DEFAULT_PPS));
    expect(overview?.getAttribute("data-waveform-overview")).toBe("computed");
    expect(host.querySelector("[aria-label='Zoom in']")).not.toBeNull();
    expect(host.querySelector("[aria-label='Zoom out']")).not.toBeNull();
    host.querySelector<HTMLButtonElement>("[aria-label='Zoom in']")?.click();
    expect(view.pixelsPerSecond()).toBe(100);
    expect(zoom?.getAttribute("data-pps")).toBe("100");
    expect(overview?.getAttribute("data-pps")).toBe("100");
  });

  it("shows the unavailable note from the player string", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const view = mountWaveform(host, hooks());
    view.showUnavailable();
    expect(host.querySelector(".waveform-note")?.textContent).toBe(playerStrings.waveformUnavailable);
    expect(host.querySelector(".waveform-detail-wrap")?.hasAttribute("hidden")).toBe(true);
  });
});
