import { describe, expect, it } from "vitest";
import { formatHash, parseHash, sameRoute } from "../lib/ui/hash-route";

describe("formatHash", () => {
  it("omits the crate for All tracks", () => {
    expect(formatHash("Serato Library", "crates", "all")).toBe("#library/crates");
  });

  it("writes the crate id after the view", () => {
    expect(formatHash("Serato Library", "crates", 12)).toBe("#library/crates/12");
  });

  it("uses a slug for each space", () => {
    expect(formatHash("Serato Video", "history", "all")).toBe("#video/history");
    expect(formatHash("Apple Music", "files", "all")).toBe("#apple-music/files");
    expect(formatHash("Prepare", "snapshots", "all")).toBe("#prepare/snapshots");
  });

  it("falls back to library crates for an unknown space or view", () => {
    expect(formatHash("Other", "nope", "all")).toBe("#library/crates");
    expect(formatHash("Serato Library", "nope", 4)).toBe("#library/crates/4");
  });
});

describe("parseHash", () => {
  it("opens Crates with All tracks for an empty hash", () => {
    expect(parseHash("")).toEqual({ space: null, mode: "crates", crate: "all" });
    expect(parseHash("#")).toEqual({ space: null, mode: "crates", crate: "all" });
  });

  it("opens Crates with All tracks for junk", () => {
    expect(parseHash("#nope")).toEqual({ space: null, mode: "crates", crate: "all" });
    expect(parseHash("#foo/bar/baz/qux")).toEqual({ space: null, mode: "crates", crate: "all" });
  });

  it("reads space, view, and crate", () => {
    expect(parseHash("#library/crates/12")).toEqual({
      space: "Serato Library",
      mode: "crates",
      crate: 12,
    });
    expect(parseHash("#video/history")).toEqual({
      space: "Serato Video",
      mode: "history",
      crate: "all",
    });
  });

  it("keeps the current space when the slug is missing", () => {
    expect(parseHash("#crates")).toEqual({ space: null, mode: "crates", crate: "all" });
    expect(parseHash("#crates/12")).toEqual({ space: null, mode: "crates", crate: 12 });
  });

  it("keeps the current space for an unknown slug with a known view", () => {
    expect(parseHash("#other/history")).toEqual({ space: null, mode: "history", crate: "all" });
  });

  it("opens Crates in a known space when the view is unknown", () => {
    expect(parseHash("#library/nope")).toEqual({
      space: "Serato Library",
      mode: "crates",
      crate: "all",
    });
  });

  it("keeps the view and opens All tracks when the crate is not a number", () => {
    expect(parseHash("#library/health/nope")).toEqual({
      space: "Serato Library",
      mode: "health",
      crate: "all",
    });
  });

  it("round-trips every rail view", () => {
    const modes = [
      "crates",
      "history",
      "stats",
      "files",
      "health",
      "missing",
      "duplicates",
      "stems",
      "scan",
      "bitrate",
      "tags",
      "snapshots",
      "gig",
      "portable",
      "drift",
    ] as const;
    for (const mode of modes) {
      const hash = formatHash("Serato Library", mode, "all");
      expect(parseHash(hash)).toEqual({
        space: "Serato Library",
        mode,
        crate: "all",
      });
    }
  });
});

describe("sameRoute", () => {
  it("compares space, view, and crate", () => {
    const a = parseHash("#library/crates/12");
    expect(sameRoute(a, parseHash("#library/crates/12"))).toBe(true);
    expect(sameRoute(a, parseHash("#library/crates"))).toBe(false);
    expect(sameRoute(a, parseHash("#library/history/12"))).toBe(false);
  });
});
