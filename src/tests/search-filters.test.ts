import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Track } from "../lib/api-types";
import { el } from "../lib/dom";
import { applyStatic } from "../lib/i18n";
import {
  cueFlag,
  keyNumber,
  matchesFilters,
  matchesQuery,
  mixingKeys,
  parseQuery,
  TEXT_SEARCH_FIELDS,
  type TextSearchField,
} from "../lib/ui/search-filters";
import { state } from "../lib/state";
import { installPage } from "./test-page";
import { buildView, renderCrates } from "../lib/ui/views";

vi.hoisted(() => {
  vi.stubGlobal("fetch", () => {
    throw new Error("filter tests do not fetch");
  });
});

function track(id: number, bpm: number | string | null, key: string, name = `Track ${id}`): Track {
  return { id, name, artist: "Artist", album: "Album", file: `${id}.mp3`, bpm, key };
}

function ids(text: string, tracks: Track[]): number[] {
  const query = parseQuery(text);
  return tracks.filter((item) => matchesFilters(item, query.filters)).map((item) => item.id);
}

function matching(text: string, tracks: Track[], field?: TextSearchField): number[] {
  const query = parseQuery(text);
  return tracks.filter((item) => matchesQuery(item, query, field)).map((item) => item.id);
}

describe("keys", () => {
  it("reads Camelot and key names the way Serato numbers them", () => {
    expect(keyNumber("1A")).toBe(0);
    expect(keyNumber("8a")).toBe(7);
    expect(keyNumber(" Am ")).toBe(7);
    expect(keyNumber("12B")).toBe(23);
    expect(keyNumber("C")).toBe(19);
    expect(keyNumber("")).toBe(-1);
    expect(keyNumber(null)).toBe(-1);
    expect(keyNumber("13A")).toBe(-1);
  });

  it("mixes with one step either way, wrapping 12 to 1, and the relative key", () => {
    expect([...mixingKeys(keyNumber("1A"))].sort((a, b) => a - b)).toEqual([0, 1, 11, 12]);
    expect([...mixingKeys(keyNumber("12B"))].sort((a, b) => a - b)).toEqual([11, 12, 22, 23]);
    expect([...mixingKeys(keyNumber("8A"))].sort((a, b) => a - b)).toEqual([6, 7, 8, 19]);
  });
});

describe("parseQuery", () => {
  it("separates filters from words and keeps unreadable filters as words", () => {
    const query = parseQuery("  House bpm:120-128 KEY:8a bpm:fast mix:zz deep ");
    expect(query.terms).toEqual(["house", "bpm:fast", "mix:zz", "deep"]);
    expect(query.filters).toHaveLength(2);
    expect(parseQuery("").filters).toEqual([]);
    expect(parseQuery(":8a").terms).toEqual([":8a"]);
  });

  it("reads comments, grouping, and composer prefixes and keeps an empty prefix as a word", () => {
    const query = parseQuery("comments:peak grouping:warm composer:ada title:alpha");
    expect(query.terms).toEqual([]);
    expect(query.filters).toEqual([
      { kind: "field", field: "comments", value: "peak" },
      { kind: "field", field: "grouping", value: "warm" },
      { kind: "field", field: "composer", value: "ada" },
      { kind: "field", field: "title", value: "alpha" },
    ]);
    expect(parseQuery("comments:").terms).toEqual(["comments:"]);
    expect(parseQuery("comments:").filters).toEqual([]);
  });
});

describe("matchesFilters", () => {
  const tracks = [
    track(1, 120, "1A"),
    track(2, 124.4, "2A"),
    track(3, 128, "1B"),
    track(4, 0, "12A"),
    track(5, null, "Am"),
    track(6, "", "6A"),
    track(7, 123.6, "C"),
  ];

  it("reads every BPM form with inclusive bounds", () => {
    expect(ids("bpm:120-128", tracks)).toEqual([1, 2, 3, 7]);
    expect(ids("bpm:128-120", tracks)).toEqual([1, 2, 3, 7]);
    expect(ids("bpm:124", tracks)).toEqual([2, 7]);
    expect(ids("bpm:124.4", tracks)).toEqual([2]);
    expect(ids("bpm:124~4", tracks)).toEqual([1, 2, 3, 7]);
    expect(ids("bpm:124~0.4", tracks)).toEqual([2, 7]);
    expect(ids("bpm:>124", tracks)).toEqual([2, 3]);
    expect(ids("bpm:<120", tracks)).toEqual([1]);
  });

  it("reads a whole BPM as that BPM rounded: 124.5 counts as 125, not 124", () => {
    const edge = [track(8, 123.5, "1A"), track(9, 124.5, "1A")];
    expect(ids("bpm:124", edge)).toEqual([8]);
    expect(ids("bpm:125", edge)).toEqual([9]);
  });

  it("never matches a blank or zero BPM", () => {
    expect(ids("bpm:<130", tracks)).toEqual([1, 2, 3, 7]);
  });

  it("matches exact keys and mixing keys, across Camelot and key names", () => {
    expect(ids("key:8A", tracks)).toEqual([5]);
    expect(ids("key:am", tracks)).toEqual([5]);
    expect(ids("mix:1A", tracks)).toEqual([1, 2, 3, 4]);
    expect(ids("mix:8B", tracks)).toEqual([5, 7]);
  });

  it("needs every filter to pass", () => {
    expect(ids("mix:1A bpm:120-125", tracks)).toEqual([1, 2]);
    expect(ids("key:1A key:2A", tracks)).toEqual([]);
  });

  it("matches missing files and skips offline rows", () => {
    const rows = [
      track(1, 120, "1A"),
      { ...track(2, 120, "1A"), missing: true },
      { ...track(3, 120, "1A"), missing: false, offline: true },
    ];
    expect(ids("missing:yes", rows)).toEqual([2]);
    expect(parseQuery("missing:nope").terms).toEqual(["missing:nope"]);
  });

  it("matches a blank key, no BPM, and either", () => {
    expect(ids("key:none", tracks)).toEqual([]);
    expect(ids("bpm:none", tracks)).toEqual([4, 5, 6]);
    expect(ids("bpm:no", tracks)).toEqual([4, 5, 6]);
    const blankKey = [
      track(1, 120, "1A"),
      track(8, 120, ""),
      track(9, 120, "  "),
      track(10, null, "8A"),
      track(11, 0, ""),
    ];
    expect(ids("key:none", blankKey)).toEqual([8, 9, 11]);
    expect(ids("key:no", blankKey)).toEqual([8, 9, 11]);
    expect(ids("nokeybpm:yes", blankKey)).toEqual([8, 9, 10, 11]);
    expect(ids("key:none bpm:none", blankKey)).toEqual([11]);
  });

  it("matches cues:none only when the list already knows there are none", () => {
    const rows = [
      track(1, 120, "1A"),
      { ...track(2, 120, "1A"), has_cues: false },
      { ...track(3, 120, "1A"), has_cues: true },
      { ...track(4, 120, "1A"), markers_found: false },
      { ...track(5, 120, "1A"), cues: [] },
      { ...track(6, 120, "1A"), cues: [], loops: [{ start_ms: 0 }] },
      { ...track(7, 120, "1A"), cues: [{ start_ms: 1000 }] },
    ];
    expect(ids("cues:none", rows)).toEqual([2, 4, 5]);
    expect(ids("cues:no", rows)).toEqual([2, 4, 5]);
    expect(cueFlag(rows[0]!)).toBeNull();
    expect(cueFlag(rows[5]!)).toBe(true);
    expect(parseQuery("cues:yes").terms).toEqual(["cues:yes"]);
  });

  it("matches comments, grouping, and composer prefixes on that field only", () => {
    const rows = [
      { ...track(1, 120, "1A", "Alpha"), comments: "peak time", grouping: "warmup", composer: "Ada" },
      { ...track(2, 124, "2A", "peak"), comments: "", grouping: "peak", composer: "" },
    ];
    expect(ids("comments:peak", rows)).toEqual([1]);
    expect(ids("grouping:peak", rows)).toEqual([2]);
    expect(ids("composer:ada", rows)).toEqual([1]);
    expect(ids("title:peak", rows)).toEqual([2]);
    expect(ids("comments:peak grouping:warm", rows)).toEqual([1]);
  });
});

describe("matchesQuery", () => {
  const rows = [
    { ...track(1, 120, "1A", "Alpha"), comments: "peak time", grouping: "warmup", composer: "Ada" },
    { ...track(2, 124, "2A", "peak"), comments: "", grouping: "", composer: "" },
  ];

  it("does not match comments in All fields", () => {
    expect(matching("peak", rows)).toEqual([2]);
    expect(matching("peak", rows, "comments")).toEqual([1]);
    expect(matching("alpha", rows, "title")).toEqual([1]);
    expect(matching("comments:peak", rows)).toEqual([1]);
  });
});

describe("track list", () => {
  beforeEach(() => {
    installPage();
    state.mode = "crates";
    state.sort = "name";
    state.sortDir = 1;
    state.query = "";
    state.searchField = "";
    state.crateQuery = "";
    state.expanded = new Set();
    state.tracks = [
      track(1, 120, "1A", "Alpha"),
      track(2, 124, "2A", "Beta"),
      track(3, 128, "1B", "Gamma"),
      track(4, 126, "2A", "Delta"),
    ];
    state.byId = new Map(state.tracks.map((item) => [item.id, item]));
    state.crates = [{ id: 2, name: "Bar set", parent: 1, order: 0 }];
    state.crateTracks = new Map([[2, new Set([1, 2, 3])]]);
    state.rootId = 1;
    state.activeCrate = "all";
  });

  it("filters inside the selected crate and still searches words", () => {
    state.query = "bpm:120-125";
    expect(buildView().map((item) => item.id)).toEqual([1, 2]);
    state.activeCrate = 2;
    state.query = "mix:2a bpm:>121";
    expect(buildView().map((item) => item.id)).toEqual([2]);
    state.query = "mix:2a beta";
    expect(buildView().map((item) => item.id)).toEqual([2]);
    state.activeCrate = "all";
    state.query = "mix:2a";
    expect(buildView().map((item) => item.id)).toEqual([1, 2, 4]);
  });

  it("counts filter matches in the crate rail", () => {
    state.query = "bpm:>125";
    renderCrates();
    const counts = [...document.querySelectorAll<HTMLElement>("#crate-list .meta")].map((node) => node.textContent ?? "");
    expect(counts).toEqual(["2", "1"]);
  });

  it("searches comments through the field picker and not through All fields", () => {
    applyStatic(document);
    const picker = el("search-field");
    expect(picker).toBeInstanceOf(HTMLSelectElement);
    expect([...picker.options].map((option) => option.value)).toEqual(["", ...TEXT_SEARCH_FIELDS]);
    expect(picker.options[0]?.textContent).toBe("All fields");
    state.tracks = [
      { ...track(1, 120, "1A", "Alpha"), comments: "peak time" },
      { ...track(2, 124, "2A", "peak"), comments: "" },
    ];
    state.byId = new Map(state.tracks.map((item) => [item.id, item]));
    state.query = "peak";
    expect(buildView().map((item) => item.id)).toEqual([2]);
    state.searchField = "comments";
    expect(buildView().map((item) => item.id)).toEqual([1]);
    state.searchField = "";
    state.query = "comments:peak";
    expect(buildView().map((item) => item.id)).toEqual([1]);
  });
});
