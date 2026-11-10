import { describe, expect, it } from "vitest";

import {
  csvHref,
  dayAfterUnix,
  dayStartUnix,
  idleDaysFromInput,
  isStatsPeriod,
  periodRange,
  statsQuery,
} from "./history-stats-view";

describe("history stats query", () => {
  it("keeps all-time as an open range", () => {
    expect(periodRange("all", "2026-01-01", "2026-01-31", 1_800_000_000_000)).toEqual({
      start: null,
      end: null,
    });
    expect(statsQuery("Serato Library", { start: null, end: null }, 365)).toBe("space=Serato+Library");
  });

  it("uses a rolling window of whole days ending at now", () => {
    const now = 1_800_000_000_000;
    const range = periodRange("7", "", "", now);
    expect(range.end).toBe(1_800_000_000);
    expect(range.start).toBe(1_800_000_000 - 7 * 86_400);
    expect(statsQuery("Serato Library", range, 365)).toContain("from=");
    expect(statsQuery("Serato Library", range, 365)).toContain("to=");
  });

  it("reads custom dates as local midnight, exclusive end", () => {
    const start = dayStartUnix("2026-03-01");
    const end = dayAfterUnix("2026-03-01");
    expect(start).not.toBeNull();
    expect(end).toBe(start! + 86_400);
    const range = periodRange("custom", "2026-03-01", "2026-03-01", 0);
    expect(range).toEqual({ start, end });
    expect(dayStartUnix("nope")).toBeNull();
    expect(dayAfterUnix("")).toBeNull();
  });

  it("only sends idle_days when it is not 365", () => {
    expect(idleDaysFromInput("40")).toBe(40);
    expect(idleDaysFromInput("0")).toBe(365);
    expect(idleDaysFromInput("3651")).toBe(365);
    expect(idleDaysFromInput("x")).toBe(365);
    expect(statsQuery("Serato Library", { start: 1, end: 2 }, 40)).toBe(
      "space=Serato+Library&from=1&to=2&idle_days=40",
    );
    expect(csvHref("space=Serato+Library")).toBe("/api/history-stats.csv?space=Serato+Library");
    expect(isStatsPeriod("custom")).toBe(true);
    expect(isStatsPeriod("week")).toBe(false);
  });
});
