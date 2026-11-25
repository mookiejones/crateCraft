import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlayerCompatReport } from "../lib/api-types";
import { loadPlayers, repaintPlayers, unmountPlayers, wirePlayers } from "../lib/gig/players";
import { reasonText, visibleTracks } from "../lib/gig/players-view";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { drainReactScheduler, installPage } from "./test-page";

const limits = [{
  kind: "wav",
  rates: [44100, 48000],
  depths: [16, 24],
  versions: [],
  min_kbps: null,
  max_kbps: null,
}];

const report: PlayerCompatReport = {
  player: "club",
  documents: [{ code: "DRI1052", url: "https://example.test/dri1052" }],
  filesystems: ["FAT16", "FAT32", "HFS+"],
  filesystems_not_supported: ["NTFS", "exFAT"],
  notes: ["club_flac"],
  limits,
  read_only: true,
  scope: "crate",
  crate: 5,
  checked: 1,
  counts: { will_play: 1, check_first: 0, wont_play: 1, unknown: 1 },
  tracks: [
    {
      id: 9,
      name: "Wide",
      artist: "A",
      file: "wide.wav",
      extension: ".wav",
      codec: "wav-extensible",
      rate_hz: 44100,
      depth: 16,
      bitrate_kbps: null,
      version: "",
      verdict: "wont_play",
      reasons: ["wav_extensible"],
      fix: "export_pcm",
    },
    {
      id: 10,
      name: "Clean",
      artist: "A",
      file: "ok.wav",
      extension: ".wav",
      codec: "wav",
      rate_hz: 44100,
      depth: 16,
      bitrate_kbps: null,
      version: "",
      verdict: "will_play",
      reasons: [],
      fix: "none",
    },
    {
      id: 11,
      name: "Gone",
      artist: "A",
      file: "gone.wav",
      extension: ".wav",
      codec: "unknown",
      rate_hz: null,
      depth: null,
      bitrate_kbps: null,
      version: "",
      verdict: "unknown",
      reasons: ["missing"],
      fix: "find_file",
    },
  ],
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("players-report")!.textContent || "";
}

describe("players view helpers", () => {
  it("hides a passing file until Every result, and never calls unknown a pass", () => {
    expect(visibleTracks(report.tracks, "problems").map((row) => row.verdict)).toEqual(["wont_play"]);
    expect(visibleTracks(report.tracks, "unknown").map((row) => row.id)).toEqual([11]);
    expect(visibleTracks(report.tracks, "will_play").every((row) => row.verdict === "will_play")).toBe(true);
    const missing = report.tracks[2]!;
    expect(reasonText(missing, limits)).toContain("not on disk");
    expect(reasonText(missing, limits)).not.toContain("Matches the manual");
  });
});

describe("players", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.crates = [{ id: 5, name: "Friday" }];
    wirePlayers();
  });

  afterEach(async () => {
    unmountPlayers();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    setLocale("en");
  });

  it("shows unknown before the check runs", () => {
    expect(reportText()).toContain("Not checked yet.");
    expect(reportText()).toContain("This is not a failure.");
    expect(document.querySelector("[data-verdict='unknown']")).not.toBeNull();
    expect(document.querySelector("[data-verdict='wont_play']")).toBeNull();
  });

  it("asks for the crate and paints a hatched refusal", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadPlayers();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/player-compat?space=Serato+Library&player=club&scope=crate&crate=5",
    );
    expect(document.getElementById("players-scope")!.textContent).toBe("Friday");
    expect(reportText()).toContain("Wide");
    expect(reportText()).toContain("WAVE_FORMAT_EXTENSIBLE");
    expect(reportText()).toContain("Export a 16-bit 44.1 kHz PCM");
    expect(reportText()).toContain("DRI1052");
    expect(reportText()).toContain("exFAT");
    expect(reportText()).not.toContain("Clean");
    expect(reportText()).not.toContain("Not checked yet.");
    const mark = document.querySelector("[data-verdict='wont_play']");
    expect(mark?.querySelector("svg")).not.toBeNull();
    expect(mark?.textContent).toContain("Won't play");
  });

  it("checks the whole space when All tracks is selected", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn(async () => reply({ ...report, scope: "library", crate: null, tracks: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await loadPlayers();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/player-compat?space=Serato+Library&player=club&scope=library",
    );
    expect(document.getElementById("players-scope")!.textContent).toBe("Whole space");
  });

  it("filters on the page and refetches when the player changes", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadPlayers();
    const show = document.getElementById("players-show") as HTMLSelectElement;
    show.value = "all";
    show.dispatchEvent(new Event("change"));
    await drainReactScheduler();
    expect(reportText()).toContain("Clean");
    expect(reportText()).toContain("Will play");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const target = document.getElementById("players-target") as HTMLSelectElement;
    target.value = "cdj-3000";
    target.dispatchEvent(new Event("change"));
    await drainReactScheduler();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("player=cdj-3000");
  });

  it("paints the refusal in Spanish without fetching again", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadPlayers();
    setLocale("es");
    repaintPlayers();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("formato de archivo no admitido");
    expect(reportText()).not.toContain("unsupported file format");
  });

  it("gives every new control a tooltip distinct from its label", () => {
    applyStaticTooltips();
    expect(document.getElementById("players-refresh")!.dataset.tooltipKey).toBe("tooltip.playersRefresh");
    expect(document.getElementById("players-target")!.dataset.tooltipKey).toBe("tooltip.playersTarget");
    expect(document.getElementById("players-show")!.dataset.tooltipKey).toBe("tooltip.playersShow");
    expect(document.querySelector<HTMLElement>('[data-view="players"]')!.dataset.tooltipKey).toBe("tooltip.viewPlayers");
    const target = document.getElementById("players-target")!;
    expect(target.getAttribute("aria-label")).toBe("Player to check");
    expect(target.dataset.tooltip).not.toBe(target.getAttribute("aria-label"));
    const show = document.getElementById("players-show")!;
    expect(show.getAttribute("aria-label")).toBe("Which results to list");
    expect(show.dataset.tooltip).not.toBe(show.getAttribute("aria-label"));
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#players-panel button, #players-panel select")].filter(
      (control) => !control.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });
});
