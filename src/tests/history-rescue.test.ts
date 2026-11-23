import { describe, expect, it } from "vitest";
import {
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
  });
});
