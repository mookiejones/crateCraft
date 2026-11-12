import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryHealthReport } from "../lib/api-types";
import { loadHealth, repaintHealth, wireHealth } from "../lib/health/health";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { drainReactScheduler, installPage } from "./test-page";

const report: LibraryHealthReport = {
  space: "Serato Library",
  crate: 5,
  checked: 12,
  missing: {
    count: 1,
    tracks: [{ id: 10, name: "Gone", artist: "A", file: "gone.mp3" }],
  },
  no_bpm: {
    count: 1,
    tracks: [{ id: 11, name: "NoBpm", artist: "B", file: "nobpm.mp3" }],
  },
  no_key: { count: 0, tracks: [] },
  no_beatgrid: {
    count: 1,
    tracks: [{ id: 12, name: "NoGrid", artist: "C", file: "nogrid.mp3" }],
  },
  no_artwork: {
    count: 1,
    tracks: [{ id: 13, name: "NoArt", artist: "D", file: "noart.mp3" }],
  },
  empty_genre: { count: 0, tracks: [] },
  no_crate: { count: 0, tracks: [] },
  unused: {
    count: 1,
    files: [{ file: "orphan.mp3", path: "/tmp/orphan.mp3" }],
  },
  duplicates: {
    count: 1,
    groups: [{ name: "Same", artist: "Artist", seconds: 180, ids: [1, 2] }],
  },
};

const clear: LibraryHealthReport = {
  space: "Serato Library",
  crate: null,
  checked: 8,
  missing: { count: 0, tracks: [] },
  no_bpm: { count: 0, tracks: [] },
  no_key: { count: 0, tracks: [] },
  no_beatgrid: { count: 0, tracks: [] },
  no_artwork: { count: 0, tracks: [] },
  empty_genre: { count: 0, tracks: [] },
  no_crate: { count: 0, tracks: [] },
  unused: { count: 0, files: [] },
  duplicates: { count: 0, groups: [] },
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("health-report")!.textContent || "";
}

describe("health", () => {
  const navigate = vi.fn();

  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.healthToken = 0;
    state.crates = [{ id: 5, name: "Friday" }];
    navigate.mockReset();
    wireHealth(navigate);
    document.getElementById("health-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the selected crate and paints sections", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadHealth();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/library-health?space=Serato%20Library&crate=5",
    );
    expect(document.getElementById("health-scope")!.textContent).toBe("Friday");
    expect(reportText()).toContain("12 tracks checked.");
    expect(reportText()).toContain("Missing files (1)");
    expect(reportText()).toContain("A — Gone");
    expect(document.querySelector("#health-report details")).toBeNull();
    expect(document.querySelector("#health-report .MuiAccordion-root")).not.toBeNull();
    expect(reportText()).toContain("No BPM (1)");
    expect(reportText()).toContain("No beatgrid (1)");
    expect(reportText()).toContain("No artwork (1)");
    expect(reportText()).toContain("Find art");
    expect(reportText()).toContain("Unused files (1)");
    expect(reportText()).toContain("orphan.mp3");
    expect(reportText()).toContain("Duplicate groups (1)");
    expect(reportText()).toContain("Artist — Same");
    expect(document.getElementById("health-refresh")!.getAttribute("aria-busy")).toBe("false");
  });

  it("shows a clean report when every count is zero", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    state.activeCrate = "all";
    await loadHealth();
    expect(document.getElementById("health-scope")!.textContent).toBe("Whole space");
    expect(reportText()).toContain("8 tracks checked.");
    expect(reportText()).toContain("Nothing to fix in this check.");
  });

  it("opens Missing files, Duplicates, Files, Suspect quality, and a track from the report", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadHealth();
    document.querySelector<HTMLButtonElement>("[data-health-action='missing']")!.click();
    document.querySelector<HTMLButtonElement>("[data-health-action='duplicates']")!.click();
    document.querySelector<HTMLButtonElement>("[data-health-action='files']")!.click();
    document.querySelector<HTMLButtonElement>("[data-health-action='bitrate']")!.click();
    document.querySelector<HTMLButtonElement>("[data-health-action='track']")!.click();
    expect(navigate.mock.calls).toEqual([["missing"], ["duplicates"], ["files"], ["bitrate"], ["track", 10]]);
  });

  it("always offers Open Suspect quality, including a clean report", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    state.activeCrate = "all";
    await loadHealth();
    const open = document.querySelector<HTMLButtonElement>("[data-health-action='bitrate']");
    expect(open).not.toBeNull();
    expect(open!.textContent).toBe("Open Suspect quality");
    expect(reportText()).toContain("Fake 320s and lossless files");
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadHealth();
    const firstFinish = finish;
    const second = loadHealth();
    finish(reply(clear));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).toContain("Nothing to fix");
    expect(reportText()).not.toContain("gone.mp3");
  });

  it("shows the server error sentence when the check cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "That crate is not in this space." }, 404)));
    await loadHealth();
    expect(document.getElementById("health-status")!.textContent).toBe("That crate is not in this space.");
    expect(document.activeElement).toBe(document.getElementById("health-refresh"));
  });

  it("shows the unreachable sentence when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadHealth();
    expect(document.getElementById("health-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadHealth();
    setLocale("es");
    repaintHealth();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("12 pistas comprobadas");
    expect(reportText()).toContain("Archivos no encontrados");
    expect(reportText()).not.toContain("Missing files");
    expect(document.getElementById("health-scope")!.textContent).toBe("Friday");
  });

  it("gives every health control a tooltip", () => {
    applyStaticTooltips();
    expect(document.getElementById("health-refresh")!.dataset.tooltipKey).toBe("tooltip.healthRefresh");
    expect(document.querySelector<HTMLElement>('[data-view="health"]')!.dataset.tooltipKey).toBe("tooltip.viewHealth");
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#health-panel button")].filter(
      (button) => !button.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });

  it("offers Find art on a no-artwork row with a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadHealth();
    const find = document.querySelector<HTMLButtonElement>("[data-health-action='artwork']");
    expect(find).not.toBeNull();
    expect(find!.textContent).toBe("Find art");
    expect(find!.dataset.healthId).toBe("13");
    expect(find!.dataset.tooltipKey).toBe("tooltip.healthFindArt");
  });
});
