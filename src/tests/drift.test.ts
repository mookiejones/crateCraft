import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TempoDriftReport } from "../lib/api-types";
import { loadDrift, repaintDrift, wireDrift } from "../lib/gig/drift";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { installPage } from "./test-page";

const report: TempoDriftReport = {
  crate: 5,
  checked: 12,
  not_found: 2,
  unreadable: 1,
  too_quiet: 1,
  unchecked: 1,
  mapped: 3,
  flags: [
    {
      id: 1,
      name: "Old Tape",
      artist: "A",
      file: "tape.wav",
      reasons: ["drifting"],
      bpm_min: 90,
      bpm_max: 120,
    },
    {
      id: 2,
      name: "Song (Live)",
      artist: "B",
      file: "live.wav",
      reasons: ["live"],
      bpm_min: 118,
      bpm_max: 119,
    },
  ],
};

const clear: TempoDriftReport = {
  crate: 5,
  checked: 8,
  not_found: 0,
  unreadable: 0,
  too_quiet: 0,
  unchecked: 0,
  mapped: 0,
  flags: [],
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("drift-report")!.textContent || "";
}

describe("drift", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.driftToken = 0;
    state.crates = [{ id: 5, name: "Friday" }];
    wireDrift();
    document.getElementById("drift-panel")!.hidden = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the selected crate and paints flagged tracks by reason", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadDrift();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tempo-drift?space=Serato%20Library&crate=5",
    );
    expect(document.getElementById("drift-scope")!.textContent).toBe("Friday");
    expect(reportText()).toContain("12 files checked. 2 tracks may need a flexible beatgrid.");
    expect(reportText()).toContain("2 missing tracks were skipped");
    expect(reportText()).toContain("1 file could not be read.");
    expect(reportText()).toContain("Tempo wanders");
    expect(reportText()).toContain("A — Old Tape (tape.wav) — Tempo wanders (90–120 BPM)");
    expect(reportText()).toContain("Looks like a live recording");
    expect(document.getElementById("drift-refresh")!.getAttribute("aria-busy")).toBe("false");
  });

  it("refuses a check of the whole space before asking the server", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadDrift();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("drift-status")!.textContent).toBe(
      "Choose a crate for a tempo check.",
    );
    expect((document.getElementById("drift-refresh") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a clean report when nothing is flagged", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadDrift();
    expect(reportText()).toContain("8 files checked. None need a flexible beatgrid.");
    expect(reportText()).toContain("No drifting or live-looking tracks in this crate.");
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadDrift();
    const firstFinish = finish;
    const second = loadDrift();
    finish(reply(clear));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).toContain("None need a flexible beatgrid.");
    expect(reportText()).not.toContain("tape.wav");
  });

  it("shows the server error sentence when the check cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "Choose a crate for a tempo check.", code: "tempo_needs_crate" }, 400)));
    await loadDrift();
    expect(document.getElementById("drift-status")!.textContent).toBe("Choose a crate for a tempo check.");
    expect(document.activeElement).toBe(document.getElementById("drift-refresh"));
  });

  it("shows the unreachable sentence when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadDrift();
    expect(document.getElementById("drift-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadDrift();
    setLocale("es");
    repaintDrift();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("parrilla flexible");
    expect(reportText()).toContain("El tempo se mueve");
    expect(reportText()).not.toContain("Tempo wanders");
    expect(document.getElementById("drift-scope")!.textContent).toBe("Friday");
  });

  it("gives every drift control a tooltip", () => {
    applyStaticTooltips();
    expect(document.getElementById("drift-refresh")!.dataset.tooltipKey).toBe("tooltip.driftRefresh");
    expect(document.querySelector<HTMLElement>('[data-view="drift"]')!.dataset.tooltipKey).toBe("tooltip.viewDrift");
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#drift-panel button")].filter(
      (button) => !button.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });
});
