import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Track } from "../lib/api-types";
import { state } from "../lib/state";
import { installPage } from "./test-page";
import { mountTrackList } from "../lib/ui/virtual-scroll";
import { renderCrates, renderFiles, renderList, renderSessions, selectCrate, toggleCrate } from "../lib/ui/views";

vi.hoisted(() => {
  vi.stubGlobal("fetch", () => {
    throw new Error("view tests do not fetch");
  });
});

function track(id: number, fields: Partial<Track> = {}): Track {
  return { id, name: `Track ${id}`, artist: "Artist", album: "Album", file: `${id}.mp3`, ...fields };
}

function titles(): string[] {
  return [...document.querySelectorAll<HTMLElement>("#list .title")].map((node) => node.textContent ?? "");
}

function columnLabels(): string[] {
  return [...document.querySelectorAll<HTMLElement>("#list .MuiDataGrid-columnHeader")]
    .filter((node) => node.getAttribute("data-field") !== "play")
    .map((node) => (node.querySelector(".MuiDataGrid-columnHeaderTitle")?.textContent ?? "").trim());
}

function resetState(): void {
  state.tracks = [];
  state.byId = new Map();
  state.crates = [];
  state.crateTracks = new Map();
  state.rootId = null;
  state.activeCrate = "all";
  state.secondCrate = "all";
  state.splitCrates = false;
  state.focusedPane = "a";
  state.query = "";
  state.crateQuery = "";
  state.crateSort = "order";
  state.sort = "name";
  state.sortDir = 1;
  state.selectedId = null;
  state.request = 0;
  state.expanded = new Set();
  state.space = "Serato Library";
  state.mode = "crates";
  state.writable = false;
  state.serato = null;
  state.historySessions = [];
  state.historyId = null;
  state.entries = [];
  state.duplicateIds = null;
  state.duplicateGroups = [];
  state.duplicateSpace = "";
  state.filesPath = "";
  state.filesParent = null;
  state.filesEntries = [];
  state.filesSelected = new Set();
  state.filesPick = null;
  state.filesPickPaths = [];
  state.filesPickSource = "";
  state.filesLoading = false;
  state.filesError = "";
  state.filesMessage = "";
  state.filesTruncated = false;
  state.filesAtRoots = false;
  state.filesRoots = [];
  state.filesRoot = null;
  state.filesBreadcrumb = [];
  state.filesElsewhere = false;
  state.filesActive = 0;
  state.filesQuery = "";
  state.filesSearching = false;
  state.view = [];
  state.viewB = [];
}

describe("library views", () => {
  beforeEach(() => {
    installPage();
    mountTrackList();
    resetState();
  });

  it("paints the crate tree, keeps a matching child's parent, and counts the track search", () => {
    state.rootId = 1;
    state.tracks = [track(1, { name: "Alpha" }), track(2, { name: "Beta" })];
    state.crates = [
      { id: 2, name: "House", parent: 1, order: 0, color: 0xcc0000 },
      { id: 3, name: "Deep", parent: 2, order: 0, smart: true },
    ];
    state.crateTracks = new Map([[2, new Set([1])], [3, new Set([1, 2])]]);
    state.expanded = new Set([2]);
    state.selectedId = 1;
    renderList();

    const names = [...document.querySelectorAll<HTMLElement>("#crate-list .name")].map((node) => node.textContent ?? "");
    expect(names).toEqual(["All tracks", "House", "Deep"]);
    expect(document.querySelector("#crate-list .swatch")).not.toBeNull();
    expect(document.querySelector("#crate-list .smart")?.textContent).toBe("smart");
    const deep = [...document.querySelectorAll<HTMLElement>("#crate-list .crate-row")]
      .find((row) => row.textContent?.includes("Deep"));
    expect(deep?.style.paddingLeft).toBe("14px");

    state.expanded = new Set();
    state.crateQuery = "deep";
    renderCrates();
    const filtered = [...document.querySelectorAll<HTMLElement>("#crate-list .name")].map((node) => node.textContent ?? "");
    expect(filtered).toEqual(["All tracks", "House", "Deep"]);

    state.crateQuery = "";
    state.query = "alpha";
    state.expanded = new Set([2]);
    renderCrates();
    const counts = [...document.querySelectorAll<HTMLElement>("#crate-list .meta")].map((node) => node.textContent ?? "");
    expect(counts).toEqual(["1", "1", "1"]);
  });

  it("lists history sessions and paints deck, played, and the history columns", () => {
    state.mode = "history";
    state.sort = "start";
    state.sortDir = -1;
    state.historyId = 4;
    state.historySessions = [{ id: 4, name: "Friday", played: 3 }];
    state.entries = [{
      id: 9,
      name: "Alpha",
      artist: "Artist",
      file: "a.mp3",
      deck: "1",
      played: "Yes",
      start_time: 100,
      length_ms: 180000,
      asset_id: 1,
    } as Track];
    state.selectedId = 9;
    renderSessions();
    renderList();

    const session = document.querySelector("#session-list .crate");
    expect(session?.textContent).toContain("Friday");
    expect(session?.textContent).toContain("3");
    expect(session?.getAttribute("aria-selected")).toBe("true");
    expect(columnLabels()).toEqual(["Title", "Artist", "Deck", "Played", "Time"]);
    expect(document.querySelector(".browser")?.classList.contains("for-history")).toBe(true);
    expect(document.getElementById("list")?.classList.contains("for-history")).toBe(true);
    expect(titles()).toEqual(["Alpha"]);
    expect(document.querySelector("#list .row")?.textContent).toContain("Yes");
    expect(document.querySelector("#count")?.textContent).toBe("1 play");
    state.mode = "crates";
    renderList();
    expect(document.querySelector(".browser")?.classList.contains("for-history")).toBe(false);
    expect(columnLabels()).toEqual(["Title", "Artist", "BPM", "Key", "Energy", "Genre", "Added", "Last", "Plays", "Time"]);
  });

  it("paints energy, genre, dates, and plays on a crate row", () => {
    state.tracks = [track(1, {
      name: "Alpha",
      bpm: 124,
      key: "8A",
      rating: 0.8,
      genre: "House",
      time_added: 1_700_000_000,
      last_played: 1_700_000_100,
      play_count: 4,
      length_ms: 180000,
    })];
    renderList();
    const cells = [...document.querySelectorAll("#list .row .cell")].map((node) => node.textContent ?? "");
    expect(cells[2]).toBe("124");
    expect(cells[3]).toBe("8A");
    expect(cells[4]).toBe("4");
    expect(cells[5]).toBe("House");
    expect(cells[8]).toBe("4");
    expect(cells[9]).toBe("3:00");
    expect(cells).toHaveLength(10);
  });

  it("shows missing tracks and the missing note", () => {
    state.mode = "missing";
    state.tracks = [track(1, { name: "Gone", missing: true }), track(2, { name: "Here" })];
    state.selectedId = 1;
    renderList();
    expect(titles()).toEqual(["Gone"]);
    expect(document.querySelector("#list .missing-word")?.textContent).toBe("missing");
    expect(document.querySelector("#mode-note")?.textContent).toBe("Tracks whose files are missing on a connected drive.");
    expect((document.querySelector("#mode-note") as HTMLElement).hidden).toBe(false);
    expect((document.querySelector("#relink-actions") as HTMLElement).hidden).toBe(false);
    expect((document.querySelector("#open-relink") as HTMLButtonElement).disabled).toBe(true);
    state.writable = true;
    renderList();
    expect((document.querySelector("#open-relink") as HTMLButtonElement).disabled).toBe(false);
    state.mode = "crates";
    renderList();
    expect((document.querySelector("#relink-actions") as HTMLElement).hidden).toBe(true);
    expect((document.querySelector("#open-relink") as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps unplugged-drive tracks out of Missing files and badges them offline in crates", () => {
    state.tracks = [
      track(1, { name: "Gone", missing: true }),
      track(2, { name: "USB cut", offline: true, offline_drive: "USB" }),
      track(3, { name: "Here" }),
    ];
    state.selectedId = 1;
    state.mode = "missing";
    renderList();
    expect(titles()).toEqual(["Gone"]);
    expect(document.querySelector("#list .offline-word")).toBeNull();
    expect(document.querySelector("#mode-note")?.textContent).toBe(
      "Tracks whose files are missing on a connected drive. 1 track on an unplugged drive is marked offline in crates.",
    );
    state.mode = "crates";
    renderList();
    expect(titles()).toEqual(["Gone", "Here", "USB cut"]);
    const row = [...document.querySelectorAll("#list .row")].find((node) => node.textContent?.includes("USB cut"));
    expect(row?.querySelector(".offline-word")?.textContent).toBe("offline");
    expect(row?.querySelector(".missing-word")).toBeNull();
  });

  it("waits for duplicate ids, then lists the group and enables merge when Serato is quit", () => {
    state.mode = "duplicates";
    state.tracks = [track(1, { name: "Only" }), track(2, { name: "Copy" })];
    state.duplicateIds = null;
    renderList();
    expect(document.querySelector("#list .empty-list")?.textContent).toBe("Reading duplicates");
    expect((document.querySelector("#duplicate-actions") as HTMLElement).hidden).toBe(false);
    expect((document.querySelector("#merge-duplicates") as HTMLButtonElement).disabled).toBe(true);

    state.duplicateIds = new Set([2]);
    state.duplicateGroups = [{ ids: [2, 8] }];
    state.selectedId = 2;
    state.writable = true;
    renderList();
    expect(titles()).toEqual(["Copy"]);
    expect((document.querySelector("#merge-duplicates") as HTMLButtonElement).disabled).toBe(false);
    expect(document.querySelector("#mode-note")?.textContent).toContain("merge the others into it");
  });

  it("shows tracks that have a stems analysis", () => {
    state.mode = "stems";
    state.tracks = [track(1, { name: "Stemmed", stems: true }), track(2, { name: "Plain" })];
    state.selectedId = 1;
    renderList();
    expect(titles()).toEqual(["Stemmed"]);
    expect(document.querySelector("#list .missing-word")?.textContent).toBe("stems");
    expect(document.querySelector("#mode-note")?.textContent).toBe("Tracks with a stems analysis state.");
  });

  it("paints a folder, an empty folder, and a folder that is still loading", () => {
    state.mode = "files";
    state.writable = true;
    state.filesPath = "/music";
    state.filesParent = null;
    state.filesRoot = { name: "Music", path: "/music", kind: "folder" };
    state.filesBreadcrumb = [{ name: "Music", path: "/music" }];
    state.filesEntries = [
      { name: "a.mp3", kind: "file", path: "/music/a.mp3", in_library: true },
      { name: "alias", kind: "link", path: "/music/alias" },
      { name: "Crates", kind: "dir", path: "/music/Crates" },
    ];
    renderFiles();
    const names = [...document.querySelectorAll<HTMLElement>("#files-list .files-row")].map((row) => row.textContent ?? "");
    expect(names[0]).toContain("Crates");
    expect(names[1]).toContain("a.mp3");
    expect(names[2]).toContain("alias (shortcut)");
    expect(names[1]).toContain("In library");
    expect(document.querySelector("#files-path")?.textContent).toContain("Music");
    expect((document.querySelector("#files-up") as HTMLButtonElement).disabled).toBe(true);
    expect((document.querySelector("#files-rename") as HTMLButtonElement).disabled).toBe(true);
    expect((document.querySelector("#files-rename-from-tags") as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector("#mode-note")?.textContent).toContain("Files on disk");

    state.filesSelected = new Set(["/music/a.mp3"]);
    renderFiles();
    expect((document.querySelector("#files-rename") as HTMLButtonElement).disabled).toBe(false);
    expect((document.querySelector("#files-rename-from-tags") as HTMLButtonElement).disabled).toBe(false);

    state.filesSelected = new Set(["/music/a.mp3", "/music/b.mp3"]);
    state.filesEntries = [
      { name: "a.mp3", kind: "file", path: "/music/a.mp3", in_library: true },
      { name: "b.mp3", kind: "file", path: "/music/b.mp3", in_library: true },
      { name: "alias", kind: "link", path: "/music/alias" },
      { name: "Crates", kind: "dir", path: "/music/Crates" },
    ];
    renderFiles();
    expect((document.querySelector("#files-rename") as HTMLButtonElement).disabled).toBe(true);
    expect((document.querySelector("#files-rename-from-tags") as HTMLButtonElement).disabled).toBe(false);

    state.filesEntries = [];
    state.filesSelected = new Set();
    state.filesLoading = false;
    renderFiles();
    expect(document.querySelector("#files-list .files-empty")?.textContent).toBe("This folder is empty.");

    state.filesLoading = true;
    renderFiles();
    expect(document.querySelector("#files-list .files-empty")?.textContent).toBe("Reading this folder.");
    expect(document.querySelector("#files-status")?.textContent).toContain("Reading this folder.");
  });
});

describe("crate search (#38)", () => {
  beforeEach(() => {
    installPage();
    mountTrackList();
    resetState();
    state.rootId = 1;
    state.crates = [
      { id: 2, name: "Weddings", parent: 1, order: 0 },
      { id: 3, name: "First Dance", parent: 2, order: 0 },
      { id: 4, name: "Deep House", parent: 3, order: 0 },
      { id: 5, name: "Corporate", parent: 1, order: 1 },
      { id: 6, name: "House Classics", parent: 5, order: 0 },
      { id: 7, name: "Hip Hop", parent: 1, order: 2 },
    ];
    state.crateTracks = new Map();
  });

  function shown(): string[] {
    return [...document.querySelectorAll<HTMLElement>("#crate-list .name")].map((node) => node.textContent ?? "");
  }

  it("finds a deep subcrate with its whole path and hides the rest", () => {
    state.crateQuery = "deep";
    renderCrates();
    expect(shown()).toEqual(["All tracks", "Weddings", "First Dance", "Deep House"]);
  });

  it("ignores case and needs every word, in any order", () => {
    state.crateQuery = "HOUSE classics";
    renderCrates();
    expect(shown()).toEqual(["All tracks", "Corporate", "House Classics"]);
    state.crateQuery = "house";
    renderCrates();
    expect(shown()).toEqual(["All tracks", "Weddings", "First Dance", "Deep House", "Corporate", "House Classics"]);
    state.crateQuery = "house hip";
    renderCrates();
    expect(shown()).toEqual(["All tracks"]);
  });

  it("does not change the saved expanded state while searching", () => {
    state.crateQuery = "deep";
    renderCrates();
    toggleCrate(2);
    expect(state.expanded.has(2)).toBe(false);
    expect(shown()).toContain("Deep House");
  });

  it("keeps a crate picked from the search visible after the search is cleared", () => {
    state.crateQuery = "deep";
    renderCrates();
    selectCrate(4);
    state.crateQuery = "";
    renderCrates();
    expect(shown()).toEqual(["All tracks", "Weddings", "First Dance", "Deep House", "Corporate", "Hip Hop"]);
    const picked = document.querySelector<HTMLElement>('#crate-list .crate[data-id="4"]');
    expect(picked?.getAttribute("aria-selected")).toBe("true");
  });

  it("marks the visible parent when the search hides the selected crate", () => {
    selectCrate(4);
    state.crateQuery = "first";
    renderCrates();
    expect(shown()).toEqual(["All tracks", "Weddings", "First Dance"]);
    const holder = document.querySelector<HTMLElement>("#crate-list .crate-row.holds-selection");
    expect(holder?.textContent).toContain("First Dance");
  });

  it("stops at a parent loop instead of hanging", () => {
    state.crates = [
      { id: 2, name: "Loop A", parent: 3, order: 0 },
      { id: 3, name: "Loop B", parent: 2, order: 0 },
    ];
    state.crateQuery = "loop a";
    renderCrates();
    selectCrate(2);
    expect(state.activeCrate).toBe(2);
  });
});

