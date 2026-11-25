import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StreamingSwapPlan } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import {
  loadStreamingSwap,
  repaintStreamingSwap,
  unmountStreamingSwap,
  wireStreamingSwap,
} from "../lib/health/streaming-swap";
import { t, setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: StreamingSwapPlan = {
  tracks: [
    {
      asset_id: 10,
      service: "Beatport",
      title: "Night Drive",
      artist: "Ada",
      color: 255,
      stored: "beatport:10",
      cues: "kept-on-row",
      crates: [{ id: 4, name: "Friday", list_order: 4 }],
      match: {
        path: "/music/Ada - Night Drive.mp3",
        confidence: "high",
        reason: "artist and title",
        usable: true,
      },
      candidates: [
        {
          path: "/music/Ada - Night Drive.mp3",
          confidence: "high",
          reason: "artist and title",
          usable: true,
        },
      ],
    },
    {
      asset_id: 11,
      service: "Beatsource",
      title: "Only Title",
      artist: "Bea",
      color: 7,
      stored: "beatsource:11",
      cues: "kept-on-row",
      crates: [],
      match: {
        path: "/music/Only Title.mp3",
        confidence: "medium",
        reason: "title",
        usable: true,
      },
      candidates: [
        {
          path: "/music/Only Title.mp3",
          confidence: "medium",
          reason: "title",
          usable: true,
        },
      ],
    },
  ],
  truncated: false,
  cues: "kept-on-row",
  note: "kept",
  roots: ["/music"],
  preview: true,
  written: false,
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("streaming repair", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.writable = true;
    state.streamsToken = 0;
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireStreamingSwap();
    document.getElementById("streams-panel")!.hidden = false;
    applyStaticTooltips(document);
  });

  afterEach(() => {
    unmountStreamingSwap();
  });

  it("lists a greyed-out track and does not write on check", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadStreamingSwap();
    await drainReactScheduler();
    expect(fetch).toHaveBeenCalledWith("/api/streaming-swap?space=Serato%20Library");
    const text = document.getElementById("streams-report")!.textContent || "";
    expect(text).toContain("Night Drive");
    expect(text).toContain("Friday #4");
    expect(text).toContain("Beatport");
    expect(postJSON).not.toHaveBeenCalled();
  });

  it("confirms before pointing the high match at the local file", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadStreamingSwap();
    await drainReactScheduler();
    document.getElementById("streams-repair")!.click();
    await drainReactScheduler();
    expect(postJSON).not.toHaveBeenCalled();
    expect(document.getElementById("streams-report")!.textContent).toContain("Nothing is written until you confirm");
    postJSON.mockResolvedValueOnce({
      ...report,
      written: true,
      preview: false,
      swaps: [{ asset_id: 10, path: "/music/Ada - Night Drive.mp3" }],
    });
    document.querySelector<HTMLButtonElement>("[data-streams-action='confirm-repair']")!.click();
    await drainReactScheduler();
    expect(postJSON).toHaveBeenCalledWith("/api/streaming-swap", {
      action: "apply",
      confirm: true,
      space: "Serato Library",
      roots: ["/music"],
      swaps: [{ asset_id: 10, path: "/music/Ada - Night Drive.mp3" }],
    });
    expect(bridge.reloadLibrary).toHaveBeenCalled();
  });

  it("gives the new controls tooltips that are not their names", async () => {
    const repair = document.getElementById("streams-repair")!;
    const refresh = document.getElementById("streams-refresh")!;
    const tab = document.querySelector<HTMLElement>("[data-view='streams']")!;
    expect(repair.getAttribute("aria-label")).toBe("Repair");
    expect(repair.dataset.tooltipKey).toBe("tooltip.streamsRepair");
    expect(repair.dataset.tooltip).not.toBe(repair.getAttribute("aria-label"));
    expect(refresh.getAttribute("aria-label")).toBe("Check again");
    expect(refresh.dataset.tooltipKey).toBe("tooltip.streamsRefresh");
    expect(refresh.dataset.tooltip).not.toBe(refresh.getAttribute("aria-label"));
    expect(tab.dataset.tooltipKey).toBe("tooltip.viewStreams");
    expect(tab.dataset.tooltip).not.toBe(tab.textContent);
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadStreamingSwap();
    document.getElementById("streams-repair")!.click();
    await drainReactScheduler();
    const confirm = document.querySelector<HTMLButtonElement>("[data-streams-action='confirm-repair']")!;
    expect(confirm.dataset.tooltipKey).toBe("tooltip.streamsConfirm");
    expect(confirm.dataset.tooltip).not.toBe(confirm.textContent);
    expect(confirm.dataset.tooltip).toBe(t("tooltip.streamsConfirm"));
  });

  it("shows the server sentence and the unreachable sentence", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "That space is not available here.", code: "space_unavailable" }, 400)));
    await loadStreamingSwap();
    expect(document.getElementById("streams-status")!.textContent).toBe("That space is not available here.");
    expect(document.activeElement).toBe(document.getElementById("streams-refresh"));
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadStreamingSwap();
    expect(document.getElementById("streams-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("repaints the cue note in Spanish", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadStreamingSwap();
    await drainReactScheduler();
    setLocale("es");
    repaintStreamingSwap();
    await drainReactScheduler();
    expect(document.getElementById("streams-report")!.textContent).toContain("Los cues guardados");
  });
});
