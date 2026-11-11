import { beforeEach, describe, expect, it } from "vitest";
import type { Marker, Track } from "../lib/api-types";
import {
  appendBeatgrid,
  beatSeconds,
  beatgridIsSuspect,
  beatgridViewOnly,
  beatgridWarningKey,
  paintBeatMarker,
} from "../lib/ui/beatgrid-view";
import { setLocale } from "../lib/i18n";

function track(fields: Partial<Track>): Track {
  return { id: 1, ...fields };
}

function mark(fields: Partial<Marker>): Marker {
  return { position: "0.000", position_seconds: 0, ...fields };
}

describe("beatgrid status", () => {
  it("is view-only when the file could be read", () => {
    expect(beatgridViewOnly(undefined)).toBe(true);
    expect(beatgridViewOnly(false)).toBe(true);
    expect(beatgridViewOnly(true)).toBe(false);
  });

  it("flags a non-empty warning code as suspect and leaves a healthy grid quiet", () => {
    expect(beatgridIsSuspect("beatgrid_version")).toBe(true);
    expect(beatgridIsSuspect("")).toBe(false);
    expect(beatgridIsSuspect(null)).toBe(false);
    expect(beatgridIsSuspect(undefined)).toBe(false);
    expect(beatgridWarningKey("beatgrid_version")).toBe("markers.gridVersion");
    expect(beatgridWarningKey("beatgrid_too_short")).toBe("markers.gridTooShort");
    expect(beatgridWarningKey("beatgrid_empty")).toBe("markers.gridEmpty");
    expect(beatgridWarningKey("beatgrid_too_many")).toBe("markers.gridTooMany");
    expect(beatgridWarningKey("beatgrid_truncated")).toBe("markers.gridTruncated");
    expect(beatgridWarningKey("new_code")).toBe("markers.gridUnknown");
    expect(beatgridWarningKey(null)).toBeNull();
  });
});

describe("beatSeconds", () => {
  it("shows three decimal places and blanks a non-finite value", () => {
    expect(beatSeconds(1.2300000190734863)).toBe("1.230s");
    expect(beatSeconds("2.5")).toBe("2.500s");
    expect(beatSeconds(null)).toBe("");
    expect(beatSeconds(Number.NaN)).toBe("");
  });
});

describe("appendBeatgrid", () => {
  beforeEach(() => {
    setLocale("en");
  });

  it("skips the block when the file is missing", () => {
    const section = document.createElement("section");
    appendBeatgrid(section, track({ markers_unavailable: true, beatgrid: [mark({ bpm: 128 })] }));
    expect(section.textContent).toBe("");
  });

  it("says view-only and lists a healthy grid without a suspect flag", () => {
    const section = document.createElement("section");
    appendBeatgrid(
      section,
      track({
        beatgrid: [mark({ position: "0.500", beats: 4 }), mark({ position: "2.000", bpm: 128 })],
      }),
    );
    expect(section.querySelector("h4")?.textContent).toBe("Beatgrid");
    expect(section.textContent).toContain("View only. This app does not rewrite the beatgrid.");
    expect(section.textContent).toContain("128 BPM");
    expect(section.textContent).not.toContain("Suspect beatgrid");
    expect(section.querySelector(".warn")).toBeNull();
  });

  it("flags an unreadable grid as suspect", () => {
    const section = document.createElement("section");
    appendBeatgrid(
      section,
      track({
        beatgrid: [],
        beatgrid_warning: "That beatgrid version is not supported.",
        beatgrid_warning_code: "beatgrid_version",
      }),
    );
    const warn = section.querySelector(".warn");
    expect(warn?.getAttribute("role")).toBe("status");
    expect(warn?.textContent).toBe("Suspect beatgrid. That beatgrid version is not supported.");
    expect(section.textContent).toContain("View only. This app does not rewrite the beatgrid.");
  });

  it("says when the file has no beatgrid", () => {
    const section = document.createElement("section");
    appendBeatgrid(section, track({ beatgrid: [] }));
    expect(section.textContent).toContain("No beatgrid in this file.");
    expect(section.querySelector(".warn")).toBeNull();
  });
});

describe("paintBeatMarker", () => {
  beforeEach(() => {
    setLocale("en");
  });

  it("names BPM on the last marker and a beat count on earlier ones", () => {
    expect(paintBeatMarker(mark({ bpm: 128 })).textContent).toContain("128 BPM");
    expect(paintBeatMarker(mark({ beats: 4 })).textContent).toContain("4 beats");
  });
});
