/**
 * Local-mirror sentences. A reason blocks Create. A mixed crate names both counts.
 */

import { describe, expect, it } from "vitest";
import {
  localMirrorBlocked,
  localMirrorDone,
  localMirrorSummary,
} from "../../../lib/crates/local-mirror";

describe("local mirror copy", () => {
  it("blocks a missing reply and a crate that should not be copied", () => {
    expect(localMirrorBlocked(null)).toBe(true);
    expect(localMirrorBlocked({ reason: "already_local", crate_name: "Friday" })).toBe(true);
    expect(localMirrorBlocked({ reason: "all_streaming" })).toBe(true);
    expect(localMirrorBlocked({ reason: "generated" })).toBe(true);
    expect(localMirrorBlocked({ reason: null, local_count: 2, streaming_count: 1 })).toBe(false);
  });

  it("names the local crate and the streaming tracks that stay", () => {
    expect(localMirrorSummary({
      reason: null,
      local_count: 2,
      streaming_count: 1,
      name: "Friday local",
      crate_name: "Friday",
    })).toBe("2 local tracks go in Friday local. 1 streaming tracks stay in Friday.");
    expect(localMirrorSummary({ reason: "already_local", crate_name: "Friday" })).toBe(
      "Friday is already local. Nothing to copy.",
    );
    expect(localMirrorSummary({ reason: "all_streaming", crate_name: "Friday" })).toBe(
      "Friday has no local tracks. Nothing to copy.",
    );
    expect(localMirrorSummary({ reason: "generated" })).toBe(
      "This crate is already a generated copy.",
    );
  });

  it("uses the written count in the done notice", () => {
    expect(localMirrorDone({ name: "Friday local", count: 4, local_count: 9 })).toBe(
      "Friday local has 4 local tracks. The original crate is unchanged.",
    );
    expect(localMirrorDone({ name: "Friday local", local_count: 2 })).toBe(
      "Friday local has 2 local tracks. The original crate is unchanged.",
    );
  });
});
