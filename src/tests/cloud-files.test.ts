import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CloudFilesReport, CloudLocation } from "../lib/api-types";
import { loadCloud, repaintCloud, unmountCloud, wireCloud } from "../lib/gig/cloud";
import { cloudLocationText, cloudTrackLine } from "../lib/gig/cloud-files-view";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const report: CloudFilesReport = {
  counts: { local: 4, cloud: 1, missing: 1, unknown: 1, offline: 2 },
  cloud_files: [
    {
      path: "/Music/cloud.mp3",
      title: "Clouded",
      artist: "A",
      crate: "Friday",
      provider: "icloud",
      status: "cloud",
      reason: "dataless",
    },
  ],
  unknown_files: [
    {
      path: "/Music/maybe.mp3",
      title: "Maybe",
      artist: "B",
      crate: "Friday",
      provider: "other",
      status: "unknown",
      reason: "unsupported_provider",
    },
  ],
  cloud_locations: [
    { role: "library", provider: "icloud", path: "/Users/a/iCloud", optimize_storage: null },
    { role: "music", provider: "dropbox", path: "/Users/a/Dropbox", optimize_storage: null },
  ],
  scope: { space: "Serato Library", crate_id: 5, crate_name: "Friday" },
};

const clear: CloudFilesReport = {
  counts: { local: 3, cloud: 0, missing: 0, unknown: 0, offline: 0 },
  cloud_files: [],
  unknown_files: [],
  cloud_locations: [],
  scope: { space: "Serato Library", crate_id: null, crate_name: null },
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("cloud-report")!.textContent || "";
}

describe("cloud location copy", () => {
  afterEach(() => {
    setLocale("en");
  });

  it("names Optimize Mac Storage only when the report says it is on", () => {
    const quiet: CloudLocation = {
      role: "library",
      provider: "icloud",
      path: "/iCloud",
      optimize_storage: null,
    };
    const claimed: CloudLocation = { ...quiet, optimize_storage: true };
    expect(cloudLocationText(quiet)).not.toContain("Optimize Mac Storage");
    expect(cloudLocationText(claimed)).toContain("Optimize Mac Storage is on");
    const drop: CloudLocation = {
      role: "music",
      provider: "dropbox",
      path: "/Dropbox",
      optimize_storage: null,
    };
    expect(cloudLocationText(drop)).toContain("Dropbox");
    expect(cloudLocationText(drop)).not.toContain("Optimize Mac Storage");
    expect(cloudTrackLine(report.cloud_files![0]!)).toContain("/Music/cloud.mp3");
    expect(cloudTrackLine(report.unknown_files![0]!)).toContain("does not fully know");
  });
});

describe("cloud", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.crates = [{ id: 5, name: "Friday" }];
    state.cloudToken = 0;
    wireCloud();
    document.getElementById("cloud-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountCloud();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the selected crate and separates cloud, missing, and unknown", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadCloud();
    expect(fetchMock).toHaveBeenCalledWith("/api/cloud-files?space=Serato%20Library&crate=5");
    expect(document.getElementById("cloud-scope")!.textContent).toBe("Friday");
    const text = reportText();
    expect(text).toContain("On this computer (4)");
    expect(text).toContain("Cloud-only (1)");
    expect(text).toContain("Missing (1)");
    expect(text).toContain("not a cloud placeholder");
    expect(text).toContain("Not checked (1)");
    expect(text).toContain("not counted as on this computer");
    expect(text).toContain("Unplugged drive (2)");
    expect(text).toContain("/Music/cloud.mp3");
    expect(text).toContain("/Music/maybe.mp3");
    expect(text).toContain("iCloud Drive");
    expect(text).not.toContain("Optimize Mac Storage");
    expect(text).toContain("does not download them");
  });

  it("says when nothing is cloud-only and can check the whole space", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn(async () => reply(clear));
    vi.stubGlobal("fetch", fetchMock);
    await loadCloud();
    expect(fetchMock).toHaveBeenCalledWith("/api/cloud-files?space=Serato%20Library&crate=all");
    expect(reportText()).toContain("No tracks in this scope are cloud-only.");
    expect(reportText()).toContain("On this computer (3)");
  });

  it("does not download when the check fails, and keeps the last report", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadCloud();
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    await loadCloud();
    expect(document.getElementById("cloud-status")!.textContent).toContain("Couldn't reach the library server");
    expect(reportText()).toContain("/Music/cloud.mp3");
  });

  it("repaints in Spanish without asking again", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadCloud();
    setLocale("es");
    repaintCloud();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("Solo en la nube (1)");
    expect(reportText()).toContain("En este equipo (4)");
    expect(reportText()).not.toContain("On this computer");
  });

  it("gives the view and Check again distinct tooltips", () => {
    applyStaticTooltips();
    const refresh = document.getElementById("cloud-refresh")!;
    const tab = document.querySelector<HTMLElement>('[data-view="cloud"]')!;
    expect(refresh.dataset.tooltipKey).toBe("tooltip.cloudRefresh");
    expect(tab.dataset.tooltipKey).toBe("tooltip.viewCloud");
    expect(refresh.dataset.tooltip).not.toBe(refresh.textContent);
    expect(tab.dataset.tooltip).not.toBe(tab.textContent);
  });
});
