import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GainChangedPlan, GainChangedReport } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import {
  loadGainChanged,
  unmountGainChanged,
  wireGainChanged,
} from "../lib/health/gain";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: GainChangedReport = {
  checked: 3,
  offline: 1,
  not_found: 0,
  unreadable: 1,
  folder: "crateCraft",
  name: "Gain changed",
  changed: [
    {
      id: 7,
      name: "Night Drive",
      artist: "Ada",
      file: "night.mp3",
      path: "/music/night.mp3",
      gain_db: -3.257,
    },
  ],
};

const clear: GainChangedReport = {
  checked: 2,
  offline: 0,
  not_found: 0,
  unreadable: 0,
  folder: "crateCraft",
  name: "Gain changed",
  changed: [],
};

const preview: GainChangedPlan = {
  ...report,
  preview: true,
  written: false,
  added: 1,
  saved: null,
};

const written: GainChangedPlan = {
  ...clear,
  preview: false,
  written: true,
  added: 1,
  saved: { id: 9, name: "Gain changed" },
};

const resetPreview: GainChangedPlan = {
  ...report,
  preview: true,
  written: false,
  added: 1,
  saved: null,
};

const resetDone: GainChangedPlan = {
  ...clear,
  preview: false,
  written: true,
  added: 1,
  saved: null,
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("gain-report")!.textContent || "";
}

describe("gain changed", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.writable = true;
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireGainChanged();
    document.getElementById("gain-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountGainChanged();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("lists a non-zero Autotags Gain dB", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadGainChanged();
    expect(fetchMock).toHaveBeenCalledWith("/api/gain?space=Serato%20Library");
    expect(document.getElementById("gain-scope")!.textContent).toBe("Whole space");
    expect(reportText()).toContain("Ada — Night Drive");
    expect(reportText()).toContain("night.mp3");
    expect(reportText()).toContain("-3.257");
  });

  it("previews and confirms a Gain changed crate", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadGainChanged();
    postJSON.mockResolvedValueOnce(preview);
    document.getElementById("gain-save")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenCalledWith("/api/gain", {
      action: "create",
      space: "Serato Library",
    });
    expect(reportText()).toMatch(/Gain changed/);
    postJSON.mockResolvedValueOnce(written);
    document.querySelector<HTMLButtonElement>("[data-gain-action='confirm-crate']")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenLastCalledWith("/api/gain", {
      action: "create",
      space: "Serato Library",
      confirm: true,
    });
    expect(bridge.reloadLibrary).toHaveBeenCalled();
  });

  it("previews and confirms a Gain dB reset", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadGainChanged();
    postJSON.mockResolvedValueOnce(resetPreview);
    document.getElementById("gain-reset")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenCalledWith("/api/gain", {
      action: "preview",
      space: "Serato Library",
    });
    postJSON.mockResolvedValueOnce(resetDone);
    document.querySelector<HTMLButtonElement>("[data-gain-action='confirm-reset']")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenLastCalledWith("/api/gain", {
      action: "reset",
      space: "Serato Library",
      confirm: true,
    });
  });

  it("gives every gain-changed control a tooltip", () => {
    applyStaticTooltips(document);
    expect(document.querySelector<HTMLElement>('[data-view="gain"]')!.dataset.tooltipKey).toBe("tooltip.viewGain");
    expect(document.getElementById("gain-refresh")!.dataset.tooltipKey).toBe("tooltip.gainRefresh");
    expect(document.getElementById("gain-save")!.dataset.tooltipKey).toBe("tooltip.gainSave");
    expect(document.getElementById("gain-reset")!.dataset.tooltipKey).toBe("tooltip.gainReset");
  });
});
