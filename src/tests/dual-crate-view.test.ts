import { describe, expect, it } from "vitest";
import type { Track } from "../lib/api-types";
import { clickPane, paneCrates, railMark, saveViewIds } from "../lib/crates/dual-crate-view";

function track(id: number, fields: Partial<Track> = {}): Track {
  return { id, name: `Track ${id}`, artist: "Artist", album: "Album", file: `${id}.mp3`, ...fields };
}

describe("clickPane", () => {
  it("keeps pane A when the list is not split", () => {
    expect(clickPane(false, "a", false)).toBe("a");
    expect(clickPane(false, "b", true)).toBe("a");
  });

  it("assigns the other pane when Alt or Shift is held while split", () => {
    expect(clickPane(true, "a", false)).toBe("a");
    expect(clickPane(true, "a", true)).toBe("b");
    expect(clickPane(true, "b", true)).toBe("a");
    expect(clickPane(true, "b", false)).toBe("b");
  });
});

describe("paneCrates", () => {
  it("hides pane B until split is on", () => {
    expect(paneCrates(4, "all", false)).toEqual({ a: 4, b: null });
    expect(paneCrates("all", 7, true)).toEqual({ a: "all", b: 7 });
  });
});

describe("railMark", () => {
  it("marks a crate that sits in A, B, or both", () => {
    expect(railMark(4, 4, 5)).toBe("a");
    expect(railMark(5, 4, 5)).toBe("b");
    expect(railMark(4, 4, 4)).toBe("both");
    expect(railMark("all", "all", 5)).toBe("a");
    expect(railMark(9, 4, 5)).toBeNull();
    expect(railMark(5, 4, null)).toBeNull();
  });
});

describe("saveViewIds", () => {
  it("keeps unique playable ids in list order and skips history rows", () => {
    expect(saveViewIds([
      track(3),
      { id: 8, name: "Play", entry: true } as Track,
      track(1),
      track(3),
    ])).toEqual([3, 1]);
    expect(saveViewIds([])).toEqual([]);
  });
});
