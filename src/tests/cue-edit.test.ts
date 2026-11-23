/**
 * Pending cue pad helpers and time parsing (#464).
 */

import { describe, expect, it } from "vitest";
import {
  nudgePad,
  padAtPlayhead,
  padsDirty,
  padsFromCues,
  padSummary,
  pendingDiffs,
  swapPads,
} from "../lib/cues/cue-edit";
import { parseCueTime } from "../components/CueEditor";

describe("cue-edit helpers", () => {
  it("maps cues onto eight pads and reports dirty diffs", () => {
    const pads = padsFromCues([
      { index: 0, start_ms: 1000, name: "Drop", color: "#C02626" },
      { index: 3, start_ms: 8000, name: "Break", color: "#FAC313" },
    ]);
    expect(pads).toHaveLength(8);
    expect(pads[0]?.name).toBe("Drop");
    expect(pads[3]?.name).toBe("Break");
    expect(pads[1]).toBeNull();
    const next = [...pads];
    next[0] = { index: 0, start_ms: 1500, name: "Intro", color: "#C02626" };
    next[1] = padAtPlayhead(1, 2.5, "#F8821A", "Set");
    expect(padsDirty(pads, next)).toBe(true);
    const diffs = pendingDiffs(pads, next);
    expect(diffs.map((row) => row.slot)).toEqual([0, 1]);
    expect(padSummary(diffs[0]?.after ?? null, "Empty")).toContain("Intro");
  });

  it("nudges, swaps, and parses cue times", () => {
    const pad = { index: 2, start_ms: 1000, name: "A", color: "#173BA2" };
    expect(nudgePad(pad, -10).start_ms).toBe(990);
    expect(nudgePad(pad, -2000).start_ms).toBe(0);
    const slots = Array.from({ length: 8 }, () => null as typeof pad | null);
    slots[0] = pad;
    slots[4] = { index: 4, start_ms: 4000, name: "B", color: "#1FAD26" };
    const swapped = swapPads(slots, 0, 4);
    expect(swapped[0]?.name).toBe("B");
    expect(swapped[0]?.index).toBe(0);
    expect(swapped[4]?.name).toBe("A");
    expect(swapped[4]?.index).toBe(4);
    expect(parseCueTime("1:02.500")).toBe(62_500);
    expect(parseCueTime("1500")).toBe(1500);
    expect(parseCueTime("1:70")).toBeNull();
  });
});
