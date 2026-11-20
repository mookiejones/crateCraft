import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AudioChangedPlan, AudioChangedReport, AudioReanalyzePlan } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import {
  loadAudioChanged,
  repaintAudioChanged,
  unmountAudioChanged,
  wireAudioChanged,
} from "../lib/health/audio-changed";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: AudioChangedReport = {
  checked: 3,
  offline: 1,
  not_found: 0,
  unreadable: 1,
  warning: "Cues and the beatgrid may not fit this audio.",
  changed: [
    {
      id: 7,
      name: "Night Drive",
      artist: "Ada",
      file: "night.mp3",
      path: "/music/night.mp3",
      reasons: ["size", "hash"],
      size: 12,
      duration_ms: null,
      hash: "abc",
    },
  ],
};

const clear: AudioChangedReport = {
  checked: 2,
  offline: 0,
  not_found: 0,
  unreadable: 0,
  warning: report.warning,
  changed: [],
};

const preview: AudioChangedPlan = {
  ...report,
  preview: true,
  written: false,
  name: "Audio changed",
  added: 1,
  saved: null,
};

const written: AudioChangedPlan = {
  ...clear,
  preview: false,
  written: true,
  name: "Audio changed",
  added: 1,
  saved: { id: 9, name: "Audio changed" },
};

const reanalyze: AudioReanalyzePlan = {
  ...report,
  preview: true,
  written: false,
  rewrites_cues: false,
  rewrites_grid: false,
  note: "Cues stay put. crateCraft does not rewrite cues or the beatgrid to fit the new audio.",
  count: 1,
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("audio-report")!.textContent || "";
}

describe("audio changed", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.writable = true;
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireAudioChanged();
    document.getElementById("audio-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountAudioChanged();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("lists a same-name swap and the cues warning", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadAudioChanged();
    expect(fetchMock).toHaveBeenCalledWith("/api/audio-changed?space=Serato%20Library");
    expect(document.getElementById("audio-scope")!.textContent).toBe("Whole space");
    expect(reportText()).toContain("3 files checked. 1 file changed under the same name.");
    expect(reportText()).toContain("Cues and the beatgrid may not fit this audio.");
    expect(reportText()).toContain("Ada — Night Drive");
    expect(reportText()).toContain("night.mp3");
    expect(reportText()).toContain("size, quick hash");
    expect(reportText()).toContain("unplugged");
    expect(reportText()).toContain("1 file could not be read.");
    expect(document.getElementById("audio-refresh")!.getAttribute("aria-busy")).toBe("false");
    expect((document.getElementById("audio-save") as HTMLButtonElement).disabled).toBe(false);
    expect((document.getElementById("audio-reanalyze") as HTMLButtonElement).disabled).toBe(false);
  });

  it("says nothing changed and keeps Save off", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadAudioChanged();
    expect(reportText()).toContain("None changed under the same name.");
    expect(reportText()).toContain("No file changed under the same name.");
    expect((document.getElementById("audio-save") as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById("audio-reanalyze") as HTMLButtonElement).disabled).toBe(true);
  });

  it("previews a crate then writes it only after confirm", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    postJSON.mockResolvedValueOnce(preview).mockResolvedValueOnce(written);
    await loadAudioChanged();
    document.getElementById("audio-save")!.click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalledTimes(1));
    expect(postJSON).toHaveBeenCalledWith("/api/audio-changed", {
      action: "preview",
      space: "Serato Library",
    });
    expect(reportText()).toContain("Nothing is written until you confirm.");
    const confirm = document.querySelector<HTMLButtonElement>("[data-audio-action='confirm']");
    expect(confirm).not.toBeNull();
    expect(confirm!.dataset.tooltipKey).toBe("tooltip.audioConfirm");
    confirm!.click();
    await vi.waitFor(() => expect(bridge.reloadLibrary).toHaveBeenCalled());
    expect(postJSON).toHaveBeenLastCalledWith("/api/audio-changed", {
      action: "create",
      confirm: true,
      space: "Serato Library",
    });
    expect(document.getElementById("audio-status")!.textContent).toContain("Saved 1 track in Audio changed.");
  });

  it("explains that re-analyze leaves cues put", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    postJSON.mockResolvedValueOnce(reanalyze);
    await loadAudioChanged();
    document.getElementById("audio-reanalyze")!.click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalledTimes(1));
    expect(postJSON).toHaveBeenCalledWith("/api/audio-changed", {
      action: "reanalyze",
      space: "Serato Library",
    });
    expect(reportText()).toContain("Cues stay put.");
    expect(reportText()).toContain("does not rewrite cues or the beatgrid");
    expect(document.querySelector("[data-audio-action='confirm']")).toBeNull();
  });

  it("locks the page on a 409 from create", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    const locked = Object.assign(new Error("Quit Serato DJ before writing."), {
      status: 409,
      payload: { error: "Quit Serato DJ before writing.", serato: { writable: false } },
    });
    postJSON.mockResolvedValueOnce(preview).mockRejectedValueOnce(locked);
    await loadAudioChanged();
    document.getElementById("audio-save")!.click();
    await vi.waitFor(() => expect(document.querySelector("[data-audio-action='confirm']")).not.toBeNull());
    document.querySelector<HTMLButtonElement>("[data-audio-action='confirm']")!.click();
    await vi.waitFor(() => expect(bridge.lockDown).toHaveBeenCalled());
    expect(document.getElementById("audio-status")!.textContent).toContain("Quit Serato DJ before writing.");
  });

  it("keeps Save off while the library is locked and still allows the explanation", async () => {
    state.writable = false;
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    postJSON.mockResolvedValueOnce(reanalyze);
    await loadAudioChanged();
    expect((document.getElementById("audio-save") as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById("audio-reanalyze") as HTMLButtonElement).disabled).toBe(false);
  });

  it("repaints in Spanish without fetching again", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadAudioChanged();
    setLocale("es");
    repaintAudioChanged();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("archivo cambió");
    expect(reportText()).not.toContain("file changed under the same name");
  });

  it("gives every audio-changed control a tooltip", () => {
    applyStaticTooltips();
    expect(document.getElementById("audio-refresh")!.dataset.tooltipKey).toBe("tooltip.audioRefresh");
    expect(document.getElementById("audio-save")!.dataset.tooltipKey).toBe("tooltip.audioSave");
    expect(document.getElementById("audio-reanalyze")!.dataset.tooltipKey).toBe("tooltip.audioReanalyze");
    expect(document.querySelector<HTMLElement>('[data-view="audio"]')!.dataset.tooltipKey).toBe("tooltip.viewAudio");
    for (const button of document.querySelectorAll<HTMLButtonElement>("#audio-panel button")) {
      expect(button.dataset.tooltip?.trim().length, button.id).toBeGreaterThan(10);
    }
  });
});
