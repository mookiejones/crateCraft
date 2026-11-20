/**
 * Queue crate stays available when writes are off.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activeCrateId, canQueueActiveCrate } from "../../../lib/crates/crate-store";
import { state } from "../../../lib/state";

describe("canQueueActiveCrate", () => {
  let savedActive: typeof state.activeCrate;
  let savedCrates: typeof state.crates;
  let savedWritable: boolean;

  beforeEach(() => {
    savedActive = state.activeCrate;
    savedCrates = state.crates;
    savedWritable = state.writable;
  });

  afterEach(() => {
    state.activeCrate = savedActive;
    state.crates = savedCrates;
    state.writable = savedWritable;
  });

  it("allows a normal crate while writes are off", () => {
    state.writable = false;
    state.crates = [{ id: 4, name: "Openers" }];
    state.activeCrate = 4;
    expect(canQueueActiveCrate()).toBe(true);
    expect(activeCrateId()).toBe(4);
  });

  it("refuses All tracks and a smart crate", () => {
    state.writable = true;
    state.crates = [{ id: 4, name: "Smart", smart: true }];
    state.activeCrate = "all";
    expect(canQueueActiveCrate()).toBe(false);
    expect(activeCrateId()).toBeNull();
    state.activeCrate = 4;
    expect(canQueueActiveCrate()).toBe(false);
  });
});
