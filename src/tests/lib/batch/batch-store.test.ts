/**
 * Batch listing normalizer. A snapshot GET must not throw.
 */

import { describe, expect, it } from "vitest";
import { normalizeBatch } from "../../../lib/batch/batch-store";

describe("normalizeBatch", () => {
  it("treats a snapshot body as an empty queue", () => {
    const listing = normalizeBatch({
      snapshots: [],
      pending_undo: null,
      write_block: "",
      serato_running: false,
    });
    expect(listing.queue).toEqual([]);
    expect(listing.destination).toBeNull();
    expect(listing.preview).toBeNull();
    expect(listing.can_undo).toBe(false);
    expect(listing.added).toBeUndefined();
  });

  it("keeps a real listing and drops a bad queue row", () => {
    const listing = normalizeBatch({
      queue: [
        { kind: "track", id: 2, name: "Same" },
        { kind: "folder", id: 9, name: "nope" },
      ],
      destination: { id: 3, name: "Openers" },
      preview: { first: { kind: "track", id: 2, name: "Same" }, would_add: 1 },
      can_undo: true,
      added: 1,
    });
    expect(listing.queue).toEqual([{ kind: "track", id: 2, name: "Same" }]);
    expect(listing.destination).toEqual({ id: 3, name: "Openers" });
    expect(listing.preview?.would_add).toBe(1);
    expect(listing.can_undo).toBe(true);
    expect(listing.added).toBe(1);
  });
});
