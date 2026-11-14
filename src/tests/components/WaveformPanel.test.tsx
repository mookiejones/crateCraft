/**
 * Waveform zoom and overview render from WaveformContext.
 */

import { afterEach, describe, expect, it } from "vitest";
import { playerStrings } from "../../lib/player/player-strings";
import { seedStoryWaveform } from "../../lib/storybook/waveform";
import { fixtureWaveform, mountWaveform, type WaveformHooks } from "../../lib/player/waveform-view";
import { ZOOM_DEFAULT_PPS, type ParsedWaveform } from "../../lib/player/waveform";

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
    const zoomIn = host.querySelector("[aria-label='Zoom in']");
    const zoomOut = host.querySelector("[aria-label='Zoom out']");
    expect(zoomIn?.className).toContain("MuiIconButton-root");
    expect(zoomOut?.className).toContain("MuiIconButton-root");
    expect(zoomIn?.getAttribute("data-tooltip")?.trim().length).toBeGreaterThan(10);
    expect(zoomOut?.getAttribute("data-tooltip")?.trim().length).toBeGreaterThan(10);
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

  it("story seed paints the screenshot fixture without fetching", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const view = mountWaveform(host, hooks());
    seedStoryWaveform(view, { duration: 20 });
    expect(host.querySelector(".waveform-overview")?.getAttribute("data-waveform-overview")).toBe(
      "computed",
    );
    expect(host.dataset.waveformState).toBe("ready");
    expect(view.pixelsPerSecond()).toBe(ZOOM_DEFAULT_PPS);
  });

  it("story seed can show the unavailable note", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const view = mountWaveform(host, hooks());
    seedStoryWaveform(view, { unavailable: true });
    expect(host.querySelector(".waveform-note")?.textContent).toBe(playerStrings.waveformUnavailable);
    expect(host.querySelector(".waveform-detail-wrap")?.hasAttribute("hidden")).toBe(true);
    expect(host.dataset.waveformState).toBe("unavailable");
  });

  it("unavailable seed does not paint computed points", () => {
    const calls: string[] = [];
    seedStoryWaveform(
      {
        showComputed: () => {
          calls.push("computed");
        },
        setMarkers: () => {
          calls.push("markers");
        },
        sync: () => {
          calls.push("sync");
        },
        showUnavailable: () => {
          calls.push("unavailable");
        },
      },
      { unavailable: true },
    );
    expect(calls).toEqual(["unavailable"]);
  });
});

describe("fixtureWaveform", () => {
  it("builds 150 detail points per second and 200 overview columns", () => {
    const wave = fixtureWaveform(20);
    expect(wave.durationMs).toBe(20_000);
    expect(wave.pointsPerSecond).toBe(150);
    expect(wave.detailCount).toBe(150 * 20);
    expect(wave.overviewCount).toBe(200);
    expect(wave.detail.length).toBe(wave.detailCount * 6);
    expect(wave.overview.length).toBe(wave.overviewCount * 6);
  });
});
