import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Track } from "./api-types";
import { el } from "./dom";
import { wireDualCrates } from "./dual-crate";
import { paintDualChrome } from "./dual-crate-view";
import { setLocale } from "./i18n";
import { state } from "./state";
import { installPage } from "./test-page";
import { mountTrackList, mountTrackListB } from "./virtual-scroll";
import { renderList, selectCrate } from "./views";

vi.hoisted(() => {
  vi.stubGlobal("fetch", () => {
    throw new Error("dual crate tests do not fetch");
  });
});

function track(id: number, fields: Partial<Track> = {}): Track {
  return { id, name: `Track ${id}`, artist: "Artist", album: "Album", file: `${id}.mp3`, ...fields };
}

function resetState(): void {
  state.tracks = [track(1, { name: "Alpha" }), track(2, { name: "Beta" })];
  state.byId = new Map(state.tracks.map((item) => [item.id, item]));
  state.crates = [{ id: 2, name: "House", parent: 1, order: 0 }];
  state.crateTracks = new Map([[2, new Set([1])]]);
  state.rootId = 1;
  state.activeCrate = "all";
  state.secondCrate = "all";
  state.splitCrates = false;
  state.focusedPane = "a";
  state.viewB = [];
  state.query = "";
  state.crateQuery = "";
  state.crateSort = "order";
  state.sort = "name";
  state.sortDir = 1;
  state.selectedId = 1;
  state.expanded = new Set([2]);
  state.space = "Serato Library";
  state.mode = "crates";
  state.writable = true;
  state.view = [];
}

describe("dual crate panes", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    mountTrackList();
    mountTrackListB();
    resetState();
    wireDualCrates();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("keeps the second list hidden until Split is pressed", () => {
    renderList();
    expect(el("crate-pane-b").hidden).toBe(true);
    expect(el("crate-split").getAttribute("aria-pressed")).toBe("false");
    el("crate-split").click();
    expect(state.splitCrates).toBe(true);
    expect(state.secondCrate).toBe("all");
    expect(el("crate-pane-b").hidden).toBe(false);
    expect(el("crate-split").getAttribute("aria-pressed")).toBe("true");
    expect(el("crate-panes").classList.contains("split")).toBe(true);
    expect(document.querySelector("#list-b .title")?.textContent).toBe("Alpha");
  });

  it("puts an Alt-click crate in the other pane", () => {
    state.splitCrates = true;
    renderList();
    const house = [...document.querySelectorAll<HTMLButtonElement>("#crate-list .crate")]
      .find((button) => button.dataset.id === "2");
    house?.dispatchEvent(new MouseEvent("click", { bubbles: true, altKey: true }));
    expect(state.secondCrate).toBe(2);
    expect(state.activeCrate).toBe("all");
    expect(state.focusedPane).toBe("a");
    expect(document.querySelector<HTMLButtonElement>('#crate-list .crate[data-id="2"]')?.dataset.pane).toBe("b");
  });

  it("saves the focused list as one crate with those tracks", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/api/crate") && (init?.method || "GET").toUpperCase() === "POST") {
        bodies.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
        return new Response(JSON.stringify({ ok: true, id: 9, name: "Warmup", added: 2 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ tracks: [], crates: [], root: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    vi.stubGlobal("prompt", () => "Warmup");
    state.view = [track(2), track(1)];
    state.writable = true;
    paintDualChrome();
    el("crate-save-view").click();
    await vi.waitFor(() => expect(bodies.length).toBe(1));
    expect(bodies[0]).toMatchObject({
      action: "create",
      name: "Warmup",
      assets: [2, 1],
      space: "Serato Library",
    });
  });
});

describe("selectCrate while split", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    mountTrackList();
    mountTrackListB();
    resetState();
  });

  it("fills the focused pane on a plain click", () => {
    state.splitCrates = true;
    state.focusedPane = "b";
    selectCrate(2);
    expect(state.secondCrate).toBe(2);
    expect(state.activeCrate).toBe("all");
  });
});
