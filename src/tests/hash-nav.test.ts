import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";
import { mountTrackList, unmountTrackList } from "../lib/ui/virtual-scroll";
import { el } from "../lib/dom";
import { applyIncomingHash, selectCrate, setMode, wireLibrary } from "../lib/ui/views";

vi.hoisted(() => {
  vi.stubGlobal("fetch", () => {
    throw new Error("hash nav tests do not fetch");
  });
});

function resetState(): void {
  state.tracks = [];
  state.byId = new Map();
  state.crates = [
    { id: 2, name: "House", parent: 1, order: 0 },
    { id: 4, name: "Deep", parent: 2, order: 0 },
  ];
  state.crateTracks = new Map([
    [2, new Set([1])],
    [4, new Set([1])],
  ]);
  state.rootId = 1;
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
  state.view = [];
  state.viewB = [];
}

describe("hash navigation", () => {
  beforeEach(() => {
    installPage();
    mountTrackList();
    resetState();
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  });

  afterEach(async () => {
    unmountTrackList();
    await drainReactScheduler();
  });

  it("writes the view into the hash without a reload", () => {
    setMode("stems");
    expect(location.hash).toBe("#library/stems");
    expect(state.mode).toBe("stems");
  });

  it("writes the selected crate into the hash", () => {
    selectCrate(4);
    expect(location.hash).toBe("#library/crates/4");
    expect(state.activeCrate).toBe(4);
  });

  it("omits the crate for All tracks", () => {
    selectCrate(4);
    selectCrate("all");
    expect(location.hash).toBe("#library/crates");
  });

  it("writes the space slug when the space menu changes", () => {
    wireLibrary();
    el("space").value = "Prepare";
    el("space").dispatchEvent(new Event("change", { bubbles: true }));
    expect(location.hash).toBe("#prepare/crates");
    expect(state.space).toBe("Prepare");
    expect(state.activeCrate).toBe("all");
  });

  it("leaves the hash alone when the other split pane is filled", () => {
    state.splitCrates = true;
    state.focusedPane = "b";
    selectCrate(2);
    expect(location.hash).toBe("");
    expect(state.activeCrate).toBe("all");
    expect(state.secondCrate).toBe(2);
  });

  it("restores the view from the hash", async () => {
    history.replaceState(null, "", "#library/stems");
    await applyIncomingHash();
    expect(state.mode).toBe("stems");
    expect(location.hash).toBe("#library/stems");
  });

  it("restores the crate from the hash", async () => {
    history.replaceState(null, "", "#library/crates/4");
    await applyIncomingHash();
    expect(state.activeCrate).toBe(4);
    expect(state.mode).toBe("crates");
  });

  it("opens Crates with All tracks for an unknown hash", async () => {
    state.mode = "stems";
    state.activeCrate = 4;
    history.replaceState(null, "", "#not-a-view");
    await applyIncomingHash();
    expect(state.mode).toBe("crates");
    expect(state.activeCrate).toBe("all");
    expect(location.hash).toBe("#library/crates");
  });

  it("keeps the view and opens All tracks when the crate is missing", async () => {
    history.replaceState(null, "", "#library/stems/99");
    await applyIncomingHash();
    expect(state.mode).toBe("stems");
    expect(state.activeCrate).toBe("all");
    expect(location.hash).toBe("#library/stems");
  });

  it("pushes each crate click so Back can restore the previous hash", async () => {
    const push = vi.spyOn(history, "pushState");
    selectCrate(2);
    selectCrate(4);
    expect(push.mock.calls.map((call) => String(call[2]))).toEqual([
      expect.stringContaining("#library/crates/2"),
      expect.stringContaining("#library/crates/4"),
    ]);
    push.mockRestore();
    history.replaceState(null, "", "#library/crates/2");
    await applyIncomingHash();
    expect(state.activeCrate).toBe(2);
    expect(location.hash).toBe("#library/crates/2");
  });
});
