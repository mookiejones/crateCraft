import { describe, expect, it } from "vitest";
import { setLocale } from "../lib/i18n";
import { hasMirrorDest, mirrorStatusText } from "../lib/snapshots/music-mirror-view";

describe("music-mirror-view", () => {
  it("hasMirrorDest is true when dest is not blank", () => {
    expect(hasMirrorDest("")).toBe(false);
    expect(hasMirrorDest("  ")).toBe(false);
    expect(hasMirrorDest("/Volumes/Backup")).toBe(true);
  });

  it("mirrorStatusText is empty before a report", () => {
    setLocale("en");
    expect(mirrorStatusText(null)).toBe("");
  });

  it("mirrorStatusText fills the counts", () => {
    setLocale("en");
    expect(
      mirrorStatusText({
        copy_count: 2,
        only_laptop_count: 1,
        restore_count: 3,
        skip_newer_count: 4,
        mismatch_count: 5,
      }),
    ).toBe("2 to copy, 1 only on this computer, 3 to restore, 4 newer here, 5 do not match.");
  });
});
