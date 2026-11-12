/**
 * Play stats report paints from StatsContext.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HistoryStatsReport } from "../../lib/api-types";
import { StatsProvider, type StatsContextValue } from "../../containers/StatsContext";
import { setLocale } from "../../lib/i18n";
import { installPage } from "../test-page";
import { StatsPanel } from "../../pages/StatsPanel";

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

function fakeStats(overrides: Partial<StatsContextValue> = {}): StatsContextValue {
  return {
    report: null,
    crateBusy: false,
    writable: true,
    makeIdleCrate: async () => {},
    ...overrides,
  };
}

describe("StatsPanel context", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
  });

  it("renders nothing until a report is loaded", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(StatsProvider, {
          value: fakeStats(),
          children: createElement(StatsPanel),
        }),
      );
    });
    expect(host.textContent).toBe("");
    expect(host.querySelector(".MuiAccordion-root")).toBeNull();
    root.unmount();
  });

  it("renders the Play stats report from context", () => {
    const makeIdleCrate = vi.fn(async () => {});
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(StatsProvider, {
          value: fakeStats({ report, makeIdleCrate }),
          children: createElement(StatsPanel),
        }),
      );
    });
    expect(host.textContent).toContain("8 plays across 3 sessions.");
    expect(host.textContent).toContain("Most played tracks (1)");
    expect(host.textContent).toContain("Anthem");
    expect(host.textContent).toContain("Most played artists (1)");
    expect(host.textContent).toContain("Beta");
    expect(host.textContent).toContain("Not played (2)");
    expect(host.textContent).toContain("Gamma — Dusty");
    expect(host.querySelector("details")).toBeNull();
    expect(host.querySelector(".MuiDataGrid-root")).toBeNull();
    const crate = host.querySelector<HTMLButtonElement>("[data-stats-action='crate']");
    expect(crate?.className).toContain("MuiButton");
    expect(crate?.disabled).toBe(false);
    crate?.click();
    expect(makeIdleCrate).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it("uses Accordion sections that toggle from the keyboard", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(StatsProvider, {
          value: fakeStats({ report }),
          children: createElement(StatsPanel),
        }),
      );
    });
    const summary = [...host.querySelectorAll<HTMLButtonElement>(".MuiAccordionSummary-root")]
      .find((node) => node.textContent?.includes("Most played tracks (1)"));
    expect(summary).toBeTruthy();
    expect(summary!.tagName).toBe("BUTTON");
    expect(summary!.getAttribute("aria-expanded")).toBe("true");
    summary!.focus();
    expect(document.activeElement).toBe(summary);
    flushSync(() => {
      summary!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      summary!.click();
    });
    expect(summary!.getAttribute("aria-expanded")).toBe("false");
    flushSync(() => {
      summary!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      summary!.click();
    });
    expect(summary!.getAttribute("aria-expanded")).toBe("true");
    expect(host.textContent).toContain("Anthem");
    root.unmount();
  });

  it("disables Make crate when the library is locked or idle is empty", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(StatsProvider, {
          value: fakeStats({
            report: { ...report, not_played: [], not_played_count: 0 },
            writable: false,
          }),
          children: createElement(StatsPanel),
        }),
      );
    });
    const crate = host.querySelector<HTMLButtonElement>("[data-stats-action='crate']");
    expect(crate?.disabled).toBe(true);
    expect(host.textContent).toContain("No idle tracks");
    root.unmount();
  });
});
