import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HistoryStatsReport } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import { loadHistoryStats, repaintHistoryStats, wireHistoryStats } from "../lib/history/history-stats";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { installPage } from "./test-page";

const report: HistoryStatsReport = {
  from: null,
  to: null,
  plays: 8,
  sessions: 3,
  idle_days: 365,
  not_played_count: 2,
  top_tracks: [
    { asset_id: 11, name: "Anthem", artist: "Beta", plays: 3, last_played: 1_800_000_000 },
  ],
  top_artists: [{ artist: "Beta", plays: 4, tracks: 2, last_played: 1_800_000_000 }],
  not_played: [
    { id: 13, name: "Dusty", artist: "Gamma", last_played: null, play_count: 4 },
  ],
};

const empty: HistoryStatsReport = {
  from: null,
  to: null,
  plays: 0,
  sessions: 0,
  idle_days: 365,
  not_played_count: 0,
  top_tracks: [],
  top_artists: [],
  not_played: [],
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("stats-report")!.textContent || "";
}

describe("history stats", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.statsToken = 0;
    state.writable = true;
    state.tracks = [];
    state.crates = [];
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireHistoryStats();
    document.getElementById("stats-panel")!.hidden = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the space and paints top lists and idle tracks", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadHistoryStats();
    expect(fetchMock).toHaveBeenCalledWith("/api/history-stats?space=Serato+Library");
    expect(reportText()).toContain("8 plays across 3 sessions.");
    expect(reportText()).toContain("Most played tracks (1)");
    expect(reportText()).toContain("Anthem");
    expect(reportText()).toContain("Most played artists (1)");
    expect(reportText()).toContain("Beta");
    expect(reportText()).toContain("Not played (2)");
    expect(reportText()).toContain("Gamma — Dusty");
    expect(document.querySelector("#stats-report details")).toBeNull();
    expect(document.querySelector("#stats-report .MuiAccordion-root")).not.toBeNull();
    expect(document.querySelector("#stats-report .MuiDataGrid-root")).toBeNull();
    expect(document.getElementById("stats-refresh")!.getAttribute("aria-busy")).toBe("false");
  });

  it("sends a rolling window and idle_days", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => reply(empty));
    vi.stubGlobal("fetch", fetchMock);
    const period = document.getElementById("stats-period") as HTMLSelectElement;
    period.value = "7";
    (document.getElementById("stats-idle-days") as HTMLInputElement).value = "40";
    await loadHistoryStats();
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("from=");
    expect(url).toContain("to=");
    expect(url).toContain("idle_days=40");
    expect(reportText()).toContain("No plays in this period.");
    expect(reportText()).toContain("No idle tracks");
  });

  it("previews then confirms an idle crate", async () => {
    const confirmMock = vi.fn(() => true);
    vi.stubGlobal("confirm", confirmMock);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("/api/history-stats?") || url === "/api/history-stats") {
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body)) as { action?: string };
          if (body.action === "preview") {
            return reply({ preview: true, written: false, name: "Idle", count: 2, idle_days: 365 });
          }
          return reply({ preview: false, written: true, name: "Idle", count: 2, id: 9 });
        }
        return reply(report);
      }
      return reply({ crates: [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    await loadHistoryStats();
    document.querySelector<HTMLButtonElement>("[data-stats-action='crate']")!.click();
    await vi.waitFor(() => {
      expect(document.getElementById("stats-status")!.textContent).toContain("Idle");
    });
    expect(confirmMock).toHaveBeenCalled();
    const posts = fetchMock.mock.calls.filter((call) => (call[1] as RequestInit | undefined)?.method === "POST");
    expect(posts.length).toBeGreaterThanOrEqual(2);
  });

  it("does not write when the crate confirm is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if ((init as RequestInit | undefined)?.method === "POST") {
        return reply({ preview: true, written: false, name: "Idle", count: 2, idle_days: 365 });
      }
      return reply(report);
    });
    vi.stubGlobal("fetch", fetchMock);
    await loadHistoryStats();
    document.querySelector<HTMLButtonElement>("[data-stats-action='crate']")!.click();
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => (call[1] as RequestInit | undefined)?.method === "POST")).toBe(true);
    });
    const bodies = fetchMock.mock.calls
      .filter((call) => (call[1] as RequestInit | undefined)?.method === "POST")
      .map((call) => JSON.parse(String((call[1] as RequestInit).body)) as { action?: string });
    expect(bodies.map((body) => body.action)).toEqual(["preview"]);
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadHistoryStats();
    const firstFinish = finish;
    const second = loadHistoryStats();
    finish(reply(empty));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).toContain("No plays");
    expect(reportText()).not.toContain("Anthem");
  });

  it("shows the server error sentence when the check cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "That request is not valid." }, 400)));
    await loadHistoryStats();
    expect(document.getElementById("stats-status")!.textContent).toBe("That request is not valid.");
    expect(document.activeElement).toBe(document.getElementById("stats-refresh"));
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadHistoryStats();
    setLocale("es");
    repaintHistoryStats();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("reproducciones");
    expect(reportText()).toContain("Pistas más reproducidas");
    expect(reportText()).not.toContain("Most played tracks");
  });

  it("gives every stats control a tooltip", async () => {
    applyStaticTooltips();
    expect(document.getElementById("stats-refresh")!.dataset.tooltipKey).toBe("tooltip.statsRefresh");
    expect(document.getElementById("stats-csv")!.dataset.tooltipKey).toBe("tooltip.statsCsv");
    expect(document.getElementById("stats-period")!.dataset.tooltipKey).toBe("tooltip.statsPeriod");
    expect(document.querySelector<HTMLElement>('[data-view="stats"]')!.dataset.tooltipKey).toBe("tooltip.viewStats");
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadHistoryStats();
    expect(document.querySelector<HTMLButtonElement>("[data-stats-action='crate']")?.dataset.tooltipKey)
      .toBe("tooltip.statsIdleCrate");
    const summaries = [...document.querySelectorAll<HTMLElement>("#stats-report .MuiAccordionSummary-root")];
    expect(summaries.length).toBe(3);
    expect(summaries.every((node) => node.dataset.tooltipKey === "tooltip.gigGroup")).toBe(true);
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#stats-panel button")].filter(
      (button) => !button.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });
});
