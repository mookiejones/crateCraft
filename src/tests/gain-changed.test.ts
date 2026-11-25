import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GainChangedReport } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import {
  loadGainChanged,
  repaintGainChanged,
  unmountGainChanged,
  wireGainChanged,
} from "../lib/health/gain-changed";
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
  checked: 4,
  offline: 1,
  not_found: 0,
  unreadable: 1,
  folder: "_crateCraft generated",
  name: "Gain changed",
  note: "Only the stored gain changes. Auto gain, cues, the beatgrid, overview, and analysis stay.",
  tracks: [
    {
      id: 7,
      name: "Night Drive",
      artist: "Ada",
      file: "night.mp3",
      path: "/music/night.mp3",
      gain_db: -1.5,
      gain_text: "-1.500",
      auto_gain: -3.257,
      bpm: "128.00",
    },
  ],
};

const clear: GainChangedReport = {
  ...report,
  offline: 0,
  unreadable: 0,
  tracks: [],
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
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
    applyStaticTooltips(document);
  });

  afterEach(() => {
    unmountGainChanged();
  });

  it("lists a non-zero gain and does not write on check", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadGainChanged();
    await drainReactScheduler();
    expect(fetch).toHaveBeenCalledWith("/api/gain-changed?space=Serato%20Library");
    expect(document.getElementById("gain-report")!.textContent).toContain("-1.500");
    expect(document.getElementById("gain-report")!.textContent).toContain("Night Drive");
    expect(postJSON).not.toHaveBeenCalled();
  });

  it("confirms the crate before writing and confirms the reset", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadGainChanged();
    await drainReactScheduler();
    document.getElementById("gain-save")!.click();
    await drainReactScheduler();
    expect(postJSON).not.toHaveBeenCalled();
    expect(document.getElementById("gain-report")!.textContent).toContain("Nothing is written until you confirm");
    postJSON.mockResolvedValueOnce({
      ...report,
      written: true,
      added: 1,
      preview: false,
    });
    document.querySelector<HTMLButtonElement>("[data-gain-action='confirm-crate']")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenCalledWith("/api/gain-changed", {
      action: "create",
      confirm: true,
      space: "Serato Library",
    });
    expect(document.getElementById("gain-status")!.textContent).toContain("Saved 1 track");

    document.getElementById("gain-reset")!.click();
    await drainReactScheduler();
    postJSON.mockResolvedValueOnce({
      ...clear,
      written: true,
      reset: 1,
      snapshot_id: "snap-1",
      preview: false,
    });
    document.querySelector<HTMLButtonElement>("[data-gain-action='confirm-reset']")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenLastCalledWith("/api/gain-changed", {
      action: "reset",
      confirm: true,
      space: "Serato Library",
    });
    expect(document.getElementById("gain-status")!.textContent).toContain("Reset stored gain to 0 dB on 1 track");
    expect((document.getElementById("gain-undo") as HTMLButtonElement).disabled).toBe(false);
  });

  it("undo posts the snapshot and a locked library disables reset", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    postJSON.mockResolvedValueOnce({
      ...clear,
      written: true,
      reset: 1,
      snapshot_id: "snap-9",
    });
    await loadGainChanged();
    await drainReactScheduler();
    document.getElementById("gain-reset")!.click();
    document.querySelector<HTMLButtonElement>("[data-gain-action='confirm-reset']")!.click();
    await drainReactScheduler();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(clear))));
    postJSON.mockResolvedValueOnce({ ok: true, written: true, undone: true });
    document.getElementById("gain-undo")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenLastCalledWith("/api/gain-changed", {
      action: "undo",
      confirm: true,
      snapshot_id: "snap-9",
      space: "Serato Library",
    });

    state.writable = false;
    await loadGainChanged();
    await drainReactScheduler();
    expect((document.getElementById("gain-reset") as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById("gain-save") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a failed read-back and gives every control a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadGainChanged();
    await drainReactScheduler();
    postJSON.mockRejectedValueOnce(Object.assign(new Error("The gain did not read back as 0 dB, so the files were put back."), { status: 409 }));
    document.getElementById("gain-reset")!.click();
    document.querySelector<HTMLButtonElement>("[data-gain-action='confirm-reset']")!.click();
    await drainReactScheduler();
    expect(document.getElementById("gain-status")!.textContent).toContain("put back");
    expect(bridge.lockDown).toHaveBeenCalled();

    repaintGainChanged();
    expect(document.getElementById("gain-refresh")!.dataset.tooltipKey).toBe("tooltip.gainRefresh");
    expect(document.getElementById("gain-save")!.dataset.tooltipKey).toBe("tooltip.gainSave");
    expect(document.getElementById("gain-reset")!.dataset.tooltipKey).toBe("tooltip.gainReset");
    expect(document.getElementById("gain-undo")!.dataset.tooltipKey).toBe("tooltip.gainUndo");
    expect(document.querySelector<HTMLElement>('[data-view="gain"]')!.dataset.tooltipKey).toBe("tooltip.viewGain");
    document.getElementById("gain-reset")!.click();
    await drainReactScheduler();
    expect(document.querySelector<HTMLElement>("[data-gain-action='confirm-reset']")!.dataset.tooltipKey).toBe("tooltip.gainConfirmReset");
  });
});
