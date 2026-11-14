/**
 * Primary crate actions stay on the row. The rest sit under More.
 */

import { describe, expect, it } from "vitest";
import {
  CRATE_OVERFLOW_ACTION_IDS,
  CRATE_PRIMARY_ACTION_IDS,
  CRATE_RAIL_OVERFLOW_IDS,
  CRATE_SHEET_OVERFLOW_IDS,
  isCrateOverflowAction,
  isCratePrimaryAction,
} from "../../../lib/crates/crate-overflow";

describe("crate overflow membership", () => {
  it("keeps New, Rename, and Delete on the row", () => {
    expect([...CRATE_PRIMARY_ACTION_IDS]).toEqual(["crate-new", "crate-rename", "crate-delete"]);
    expect(isCratePrimaryAction("crate-new")).toBe(true);
    expect(isCratePrimaryAction("crate-color")).toBe(false);
  });

  it("puts Color, Preset, Sync folder, and the rest under More", () => {
    expect([...CRATE_RAIL_OVERFLOW_IDS]).toEqual([
      "crate-color",
      "crate-preset",
      "crate-folder-sync",
      "crate-rename-from-tags",
      "crate-refresh",
    ]);
    expect([...CRATE_SHEET_OVERFLOW_IDS]).toEqual(["crate-split", "crate-save-view", "export-m3u"]);
    expect([...CRATE_OVERFLOW_ACTION_IDS]).toEqual([
      ...CRATE_RAIL_OVERFLOW_IDS,
      ...CRATE_SHEET_OVERFLOW_IDS,
    ]);
    expect(isCrateOverflowAction("crate-color")).toBe(true);
    expect(isCrateOverflowAction("crate-split")).toBe(true);
    expect(isCrateOverflowAction("crate-new")).toBe(false);
  });

  it("keeps those ids in the React hosts", () => {
    const sources = import.meta.glob("../../../pages/Crate*Actions.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
    });
    const joined = Object.values(sources).join("\n");
    for (const id of CRATE_PRIMARY_ACTION_IDS) {
      expect(joined).toContain(`id="${id}"`);
    }
    for (const id of CRATE_OVERFLOW_ACTION_IDS) {
      expect(joined).toContain(`id: "${id}"`);
    }
  });
});
