import { describe, expect, it } from "vitest";
import { isQueuedWrite } from "../lib/crates/queue-notice";
import { setLocale } from "../lib/i18n";
import { pendingCountText, queueStatusText } from "../lib/snapshots/write-queue-view";

describe("queue-notice", () => {
  it("isQueuedWrite is true only when queued is true", () => {
    expect(isQueuedWrite(null)).toBe(false);
    expect(isQueuedWrite({})).toBe(false);
    expect(isQueuedWrite({ queued: false })).toBe(false);
    expect(isQueuedWrite({ queued: true })).toBe(true);
  });
});

describe("write-queue-view", () => {
  it("pendingCountText is empty when nothing is queued", () => {
    setLocale("en");
    expect(pendingCountText(0)).toBe("No queued writes.");
  });

  it("pendingCountText fills the count", () => {
    setLocale("en");
    expect(pendingCountText(2)).toBe("2 queued");
  });

  it("queueStatusText is empty before a listing", () => {
    setLocale("en");
    expect(queueStatusText(null)).toBe("");
  });

  it("queueStatusText names a conflict layer", () => {
    setLocale("en");
    expect(
      queueStatusText({
        gig_lock: false,
        locked: false,
        pending: [],
        undo: [],
        layers: ["from crateCraft, 15 Nov 14:02"],
      }),
    ).toBe("Kept both: from crateCraft, 15 Nov 14:02");
  });

  it("queueStatusText names a skip", () => {
    setLocale("en");
    expect(
      queueStatusText({
        gig_lock: false,
        locked: false,
        pending: [],
        undo: [],
        skipped: [{ id: "a", skipped: "Serato changed it since" }],
      }),
    ).toBe("Serato changed it since");
  });
});
