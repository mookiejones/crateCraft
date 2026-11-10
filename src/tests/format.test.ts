import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Track } from "../lib/api-types";
import { clockLabel, compare, dateLabel, durationLabel, energyLabel, energyValue, isNumericSort, lengthLabel, sizeLabel } from "../lib/format";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";

describe("lengthLabel", () => {
  it("formats milliseconds and leaves empty input blank", () => {
    expect(lengthLabel(125000)).toBe("2:05");
    expect(lengthLabel(0)).toBe("0:00");
    expect(lengthLabel(null)).toBe("");
    expect(lengthLabel("")).toBe("");
  });
});

describe("compare", () => {
  beforeEach(() => {
    state.sort = "name";
    state.sortDir = 1;
  });

  it("sorts titles with numbers in numeric order and puts an empty BPM last", () => {
    state.sort = "name";
    state.sortDir = 1;
    const early = { id: 2, name: "Track 2" } as Track;
    const later = { id: 10, name: "Track 10" } as Track;
    expect(compare(early, later)).toBeLessThan(0);
    expect(compare(later, early)).toBeGreaterThan(0);

    state.sort = "bpm";
    state.sortDir = 1;
    const empty = { id: 1, bpm: null } as Track;
    const timed = { id: 3, bpm: 120 } as Track;
    expect(compare(empty, timed)).toBe(1);
    expect(compare({ id: 4, bpm: 128 } as Track, { id: 5, bpm: 100 } as Track)).toBeGreaterThan(0);
  });

  it("sorts energy from the rating and keeps an unrated row last", () => {
    state.sort = "energy";
    state.sortDir = 1;
    const empty = { id: 1, rating: 0 } as Track;
    const mid = { id: 2, rating: 0.4 } as Track;
    const high = { id: 3, rating: 1 } as Track;
    expect(compare(empty, mid)).toBe(1);
    expect(compare(mid, high)).toBeLessThan(0);
    expect(compare(high, mid)).toBeGreaterThan(0);
  });
});

describe("energy and dates", () => {
  it("maps a 0–1 rating to 1–5 and leaves unrated blank", () => {
    expect(energyValue(1)).toBe(5);
    expect(energyValue(0.8)).toBe(4);
    expect(energyValue(0.2)).toBe(1);
    expect(energyValue(0)).toBeNull();
    expect(energyValue(null)).toBeNull();
    expect(energyLabel(0.8)).toBe("4");
    expect(energyLabel(0)).toBe("");
  });

  it("names numeric sort keys so those columns open high-to-low", () => {
    expect(isNumericSort("energy")).toBe(true);
    expect(isNumericSort("time_added")).toBe(true);
    expect(isNumericSort("last_played")).toBe(true);
    expect(isNumericSort("play_count")).toBe(true);
    expect(isNumericSort("genre")).toBe(false);
    expect(isNumericSort("name")).toBe(false);
  });

  it("formats a date without the clock", () => {
    expect(dateLabel(null)).toBe("");
    expect(dateLabel("")).toBe("");
    expect(dateLabel(Date.UTC(2026, 0, 2, 12) / 1000)).toMatch(/2026/);
  });
});

describe("labels in the active language", () => {
  afterEach(() => {
    setLocale("en");
  });

  it("formats durations, sizes, and dates for English", () => {
    expect(durationLabel(62 * 60 * 1000)).toBe("1h 2m");
    expect(durationLabel(12 * 60 * 1000)).toBe("12m");
    expect(sizeLabel(1)).toBe("1 byte");
    expect(sizeLabel(512)).toBe("512 bytes");
    expect(sizeLabel(1536)).toBe("1.5 KB");
    expect(sizeLabel(5 * 1024 * 1024 * 1024 * 1024)).toBe("5,120.0 GB");
    expect(clockLabel(Date.UTC(2026, 0, 2, 12) / 1000)).toMatch(/^Jan 2,/);
  });

  it("formats durations, sizes, and dates for Spanish", () => {
    setLocale("es");
    expect(durationLabel(62 * 60 * 1000)).toBe("1 h 2 min");
    expect(durationLabel(12 * 60 * 1000)).toBe("12 min");
    expect(sizeLabel(1)).toBe("1 byte");
    expect(sizeLabel(512)).toBe("512 bytes");
    expect(sizeLabel(1536)).toBe("1,5 KB");
    expect(sizeLabel(5 * 1024 * 1024 * 1024 * 1024)).toBe("5120,0 GB");
    expect(clockLabel(Date.UTC(2026, 0, 2, 12) / 1000)).toMatch(/^2 ene/);
  });

  it("sorts titles with the active locale", () => {
    state.sort = "name";
    state.sortDir = 1;
    setLocale("es");
    const n = { id: 1, name: "nube" } as Track;
    const enye = { id: 2, name: "ñu" } as Track;
    const o = { id: 3, name: "oso" } as Track;
    expect([o, enye, n].sort(compare).map((item) => item.name)).toEqual(["nube", "ñu", "oso"]);
  });
});
