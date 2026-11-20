/**
 * Genre-family display helpers (#365).
 */

import { describe, expect, it } from "vitest";
import {
  descendantSet,
  moveTargets,
  parsePlan,
  parseReport,
} from "../lib/health/genre-families";

const parents = {
  House: null,
  "Tech House": "House",
  Deep: "Tech House",
  "Hip Hop": null,
};

describe("moveTargets", () => {
  it("leaves out a genre and the genres under it", () => {
    expect(descendantSet(parents, "Tech House")).toEqual(new Set(["Tech House", "Deep"]));
    expect(moveTargets(parents, "Tech House")).toEqual(["Hip Hop", "House"]);
    expect(moveTargets(parents, "Missing")).toEqual([]);
  });
});

describe("parseReport", () => {
  it("keeps a saved map and rejects a blank genre", () => {
    expect(parseReport({
      parents: { House: null, "Tech House": "House" },
      families: [{ name: "House", tracks: 2, children: [{ name: "Tech House", tracks: 1 }] }],
      saved: true,
    })).toEqual({
      parents: { House: null, "Tech House": "House" },
      families: [{ name: "House", tracks: 2, children: [{ name: "Tech House", tracks: 1 }] }],
      saved: true,
    });
    expect(parseReport({ parents: { " ": null }, families: [], saved: false })).toBeNull();
    expect(parseReport({ parents: { House: "" }, families: [], saved: false })).toBeNull();
  });
});

describe("parsePlan", () => {
  it("keeps grouping changes and rejects another field", () => {
    expect(parsePlan({
      field: "grouping",
      changes: [{ id: 1, from: "", to: "House" }],
      blocked: [{ id: 2, from: "keep", to: "House" }],
      written: false,
    })).toEqual({
      field: "grouping",
      changes: [{ id: 1, from: "", to: "House" }],
      blocked: [{ id: 2, from: "keep", to: "House" }],
      written: false,
    });
    expect(parsePlan({ field: "comment", changes: [], blocked: [], written: false })).toBeNull();
  });
});
