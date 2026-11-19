/**
 * Quality line text and the banned product phrase.
 */

import { describe, expect, it } from "vitest";
import en from "../../locales/en.json";
import es from "../../locales/es.json";
import { setLocale } from "../lib/i18n";
import { qualityLine } from "../lib/health/quality-view";

describe("qualityLine", () => {
  it("joins measured format, bitrate, and peak", () => {
    setLocale("en");
    expect(qualityLine({ format: "wav", bitrate_kbps: 128, peak_db: -12.4 })).toBe(
      "wav · 128 kbps · peak -12.4 dB",
    );
  });

  it("stays empty when the file was not measured", () => {
    setLocale("en");
    expect(qualityLine({ format: null, bitrate_kbps: null, peak_db: null })).toBe("");
    expect(qualityLine(null)).toBe("");
  });

  it("does not invent a bitrate from a format alone", () => {
    setLocale("en");
    expect(qualityLine({ format: "mp3", bitrate_kbps: null, peak_db: null })).toBe("mp3");
    expect(qualityLine({ format: "mp3", bitrate_kbps: null, peak_db: null })).not.toContain("320");
  });
});

describe("quality wording", () => {
  it("keeps the banned readiness phrases out of both catalogs", () => {
    const blob = JSON.stringify(en) + JSON.stringify(es);
    expect(blob).not.toContain("DJ Performance Readiness");
    expect(blob).not.toContain("Performance Readiness");
    expect(en["health.notAProblem"]).toBe("Not a problem");
    expect(es["health.notAProblem"].length).toBeGreaterThan(0);
    expect(en["tooltip.notAProblem"].length).toBeGreaterThan(0);
    expect(es["tooltip.notAProblem"].length).toBeGreaterThan(0);
  });
});
