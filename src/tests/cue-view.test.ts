import { beforeEach, describe, expect, it } from "vitest";
import type { Marker } from "../lib/api-types";
import {
  CUE_SLOT_COUNT,
  appendCueSlots,
  cueDiffRows,
  cueSlotVar,
  cueSlots,
  cueSummary,
  cuesFromFrame,
  extraCues,
  formatCueTime,
  isCueColor,
  paintCueDiffRow,
  paintCueSlot,
  slotColor,
} from "../lib/ui/cue-view";
import { setLocale } from "../lib/i18n";

function cue(fields: Partial<Marker>): Marker {
  return { index: 0, start_ms: 1500, color: "#CC0000", name: "Drop", ...fields };
}

describe("slot colors", () => {
  it("uses CSS pad variables for empty or invalid stored colors", () => {
    expect(CUE_SLOT_COUNT).toBe(8);
    expect(cueSlotVar(0)).toBe("var(--cue-slot-1)");
    expect(slotColor(0)).toBe("var(--cue-slot-1)");
    expect(slotColor(3)).toBe("var(--cue-slot-4)");
    expect(slotColor(7)).toBe("var(--cue-slot-8)");
  });

  it("keeps a stored hex color and falls back when it is missing or invalid", () => {
    expect(isCueColor("#CC0000")).toBe(true);
    expect(isCueColor("red")).toBe(false);
    expect(slotColor(0, "#ABCDEF")).toBe("#ABCDEF");
    expect(slotColor(3, "red")).toBe("var(--cue-slot-4)");
    expect(slotColor(3, "")).toBe("var(--cue-slot-4)");
    expect(slotColor(-1, "red")).toBe("");
    expect(slotColor(8)).toBe("");
  });
});

describe("cueSlots", () => {
  it("always returns eight pads and maps index 0–7", () => {
    const slots = cueSlots([
      cue({ index: 0, name: "Drop" }),
      cue({ index: 3, start_ms: 8000, color: "#FAC313", name: "Break" }),
    ]);
    expect(slots).toHaveLength(8);
    expect(slots[0]?.name).toBe("Drop");
    expect(slots[1]).toBeNull();
    expect(slots[3]?.start_ms).toBe(8000);
    expect(slots[7]).toBeNull();
  });

  it("keeps the first cue on a pad and lists later duplicates as extras", () => {
    const first = cue({ index: 1, name: "First" });
    const second = cue({ index: 1, name: "Second" });
    const outside = cue({ index: 8, name: "Pad 9" });
    const missing: Marker = { start_ms: 1500, color: "#CC0000", name: "Loose" };
    expect(cueSlots([first, second, outside, missing])[1]).toBe(first);
    expect(extraCues([first, second, outside, missing])).toEqual([second, outside, missing]);
    expect(cueSlots(undefined).every((slot) => slot === null)).toBe(true);
    expect(extraCues(undefined)).toEqual([]);
  });
});

describe("cuesFromFrame", () => {
  it("reads cues from a frame set and skips arrays and null", () => {
    const rows = [cue({ index: 0 })];
    expect(cuesFromFrame({ cues: rows, loops: [], flips: [] })).toEqual(rows);
    expect(cuesFromFrame(null)).toEqual([]);
    expect(cuesFromFrame(undefined)).toEqual([]);
    expect(cuesFromFrame([])).toEqual([]);
    expect(cuesFromFrame({})).toEqual([]);
  });
});

describe("formatCueTime and cueSummary", () => {
  it("formats milliseconds and names an empty pad", () => {
    expect(formatCueTime(1500)).toBe("0:01.500");
    expect(formatCueTime(61001)).toBe("1:01.001");
    expect(cueSummary(cue({ name: "Drop" }), "Empty")).toBe("0:01.500 Drop");
    expect(cueSummary(cue({ name: "  " }), "Empty")).toBe("0:01.500");
    expect(cueSummary(null, "Empty")).toBe("Empty");
  });
});

describe("cueDiffRows", () => {
  it("lists only pads that changed, including empty to filled", () => {
    const before = {
      cues: [cue({ index: 0, name: "Drop" }), cue({ index: 2, name: "Keep" })],
    };
    const after = {
      cues: [cue({ index: 2, name: "Keep" }), cue({ index: 3, start_ms: 8000, name: "Break" })],
    };
    expect(cueDiffRows(before, after)).toEqual([
      { slot: 0, before: before.cues[0], after: null },
      { slot: 3, before: null, after: after.cues[1] },
    ]);
  });

  it("returns no rows when cues match, including a grid array payload", () => {
    const same = { cues: [cue({ index: 0 })] };
    expect(cueDiffRows(same, same)).toEqual([]);
    expect(cueDiffRows(null, null)).toEqual([]);
    expect(cueDiffRows([{ position: 1 }], [{ position: 2 }])).toEqual([]);
  });

  it("treats a color or time change as a diff and compares extra indexes", () => {
    const before = { cues: [cue({ index: 0, color: "#CC0000" }), cue({ index: 9, name: "Out" })] };
    const after = { cues: [cue({ index: 0, color: "#00CC00" }), cue({ index: 9, name: "Moved" })] };
    const diffs = cueDiffRows(before, after);
    expect(diffs.map((row) => row.slot)).toEqual([0, 9]);
    expect(diffs[0]?.after?.color).toBe("#00CC00");
    expect(diffs[1]?.after?.name).toBe("Moved");
  });
});

describe("paintCueSlot", () => {
  beforeEach(() => {
    setLocale("en");
    document.body.replaceChildren();
  });

  it("paints eight pads with Empty text and the slot color when there are no cues", () => {
    const section = document.createElement("section");
    appendCueSlots(section, []);
    const rows = [...section.querySelectorAll(".marker")];
    expect(rows).toHaveLength(8);
    expect(rows.every((row) => row.classList.contains("marker-empty"))).toBe(true);
    expect(rows[0]?.textContent).toContain("Empty");
    expect(rows[0]?.querySelector(".marker-slot")?.textContent).toBe("1");
    expect((rows[0]?.querySelector(".swatch") as HTMLElement).style.background).toBe("var(--cue-slot-1)");
    expect(rows[3]?.querySelector(".marker-slot")?.textContent).toBe("4");
  });

  it("keeps a stored color on a filled pad and still names Empty on the rest", () => {
    const row = paintCueSlot(0, cue({ color: "#ABCDEF", name: "Drop" }));
    expect(row.classList.contains("marker-empty")).toBe(false);
    expect((row.querySelector(".swatch") as HTMLElement).style.background).toBe("rgb(171, 205, 239)");
    expect(row.textContent).toContain("Drop");
    expect(row.textContent).not.toContain("Empty");
  });
});

describe("paintCueDiffRow", () => {
  beforeEach(() => {
    setLocale("en");
  });

  it("names the pad and both sides so color is not the only signal", () => {
    const row = paintCueDiffRow({
      slot: 0,
      before: cue({ name: "Drop" }),
      after: null,
    });
    expect(row.getAttribute("aria-label")).toBe("Cue point 1: 0:01.500 Drop → Empty");
    expect(row.textContent).toContain("Drop");
    expect(row.textContent).toContain("Empty");
    expect(row.querySelector(".marker-slot")?.textContent).toBe("1");
  });
});
