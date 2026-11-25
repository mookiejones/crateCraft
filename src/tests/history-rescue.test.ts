import { describe, expect, it } from "vitest";
import {
  historyRescueSessionRows,
  historyRescueSideLabel,
  historyRescueStatusText,
  parseSessionIds,
} from "../lib/history/history-rescue-view";
import { t } from "../lib/i18n";

describe("history-rescue-view", () => {
  it("parses session ids", () => {
    expect(parseSessionIds("1, 2 3")).toEqual([1, 2, 3]);
    expect(parseSessionIds("")).toEqual([]);
    expect(parseSessionIds("a,1")).toEqual([1]);
  });

  it("formats compare and write status", () => {
    expect(
      historyRescueStatusText({
        only_source_count: 1,
        only_live_count: 2,
        disagree_count: 3,
      }),
    ).toBe(t("historyRescue.status", { only_source: 1, only_live: 2, disagree: 3 }));
    expect(
      historyRescueStatusText({ written: true, action: "crates", crate_count: 2 }),
    ).toBe(t("historyRescue.cratesDone", { count: 2 }));
    expect(
      historyRescueStatusText({
        action: "restore",
        written: false,
        restored_count: 0,
        skipped_count: 2,
      }),
    ).toBe(t("historyRescue.skippedLive", { count: 2 }));
  });

  it("lists sessions with side and selectability", () => {
    const rows = historyRescueSessionRows({
      only_source: [{ id: 9, name: "Only source" }],
      only_live: [{ id: 3, name: "Only live" }],
      disagree: [{ source: { id: 5, name: "Disagree" }, live: { id: 4, name: "Live" } }],
    });
    expect(rows).toEqual([
      { id: 9, name: "Only source", side: "only_source", selectable: true },
      { id: 5, name: "Disagree", side: "disagree", selectable: true },
      { id: 3, name: "Only live", side: "only_live", selectable: false },
    ]);
    expect(historyRescueSideLabel("only_source")).toBe(t("historyRescue.sideOnlySource"));
  });
});
