import { describe, expect, it } from "vitest";
import { setLocale, t } from "../lib/i18n";
import { copiesChipText } from "../lib/snapshots/copies-view";

describe("copiesChipText", () => {
  it("joins laptop and snapshot destinations", () => {
    setLocale("en");
    expect(
      copiesChipText({
        verified: 2,
        min_copies: 2,
        destinations: [
          { kind: "live", name: "laptop" },
          { kind: "snapshot", name: "snapshot" },
        ],
      }),
    ).toBe(t("copies.count", { count: 2, names: `${t("copies.laptop")}, ${t("copies.snapshot")}` }));
  });

  it("returns empty when copies is missing", () => {
    expect(copiesChipText(null)).toBe("");
    expect(copiesChipText(undefined)).toBe("");
  });
});
