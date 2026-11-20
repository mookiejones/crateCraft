import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import {
  crateTreeHasChildren,
  crateTreePreviewText,
  defaultTreeName,
  readTreeForm,
  syncTreeFields,
} from "../lib/crates/crate-trees-view";
import { createCrateTree, openCrateTreeDialog, previewCrateTree } from "../lib/crates/crate-trees";
import { state } from "../lib/state";
import { unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { drainReactScheduler, installPage } from "./test-page";
import * as views from "../lib/ui/views";

vi.mock("../lib/ui/views", () => ({
  loadLibrary: vi.fn(async () => undefined),
  lockDown: vi.fn(),
  selectCrate: vi.fn(),
  setNotice: vi.fn(),
}));

interface Call {
  url: string;
  body: Record<string, unknown>;
}

let calls: Call[] = [];

/** Answer each POST with the next reply, recording the URL and body. */
function answer(...replies: Array<{ status?: number; body: unknown } | (() => Promise<Response>)>) {
  const queue = [...replies];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
    const next = queue.shift();
    if (typeof next === "function") return next();
    if (!next) throw new Error(`unexpected request to ${url}`);
    return new Response(JSON.stringify(next.body), {
      status: next.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }));
}

beforeEach(() => {
  installPage();
  setLocale("en");
  calls = [];
  state.space = "Serato Library";
  state.writable = true;
  state.mode = "crates";
  state.activeCrate = "all";
  state.selectedId = null;
  state.byId = new Map();
  state.crates = [
    { id: 5, name: "Bar set" },
    { id: 6, name: "Peak", smart: true },
  ];
  state.presets = {};
  vi.mocked(views.loadLibrary).mockClear();
  vi.mocked(views.lockDown).mockClear();
  vi.mocked(views.selectCrate).mockClear();
  vi.mocked(views.setNotice).mockClear();
});

afterEach(async () => {
  unmountSharedDialogs();
  await drainReactScheduler();
  vi.unstubAllGlobals();
  setLocale("en");
});

function choose(kind: string): void {
  el("crate-tree-kind").value = kind;
  syncTreeFields();
}

describe("readTreeForm", () => {
  it("builds each kind, fills blanks from defaults, and refuses out-of-range fields", () => {
    choose("key");
    expect(readTreeForm()).toEqual({ kind: "key" });

    choose("bpm");
    el("crate-tree-low").value = "";
    el("crate-tree-high").value = "";
    el("crate-tree-width").value = "";
    el("crate-tree-step").value = "";
    expect(readTreeForm()).toEqual({ kind: "bpm", low: 80, high: 140, width: 10, step: 10 });
    el("crate-tree-low").value = "90";
    el("crate-tree-high").value = "130";
    el("crate-tree-width").value = "8";
    el("crate-tree-step").value = "";
    expect(readTreeForm()).toEqual({ kind: "bpm", low: 90, high: 130, width: 8, step: 8 });
    const bad: Array<[string, string, string, string]> = [
      ["0", "140", "10", "10"],
      ["80", "401", "10", "10"],
      ["140", "80", "10", "10"],
      ["80", "140", "0", "10"],
      ["80", "140", "51", "10"],
      ["80", "140", "10", "0"],
      ["80", "140", "10", "11"],
      ["1", "400", "1", "1"],
    ];
    for (const [low, high, width, step] of bad) {
      el("crate-tree-low").value = low;
      el("crate-tree-high").value = high;
      el("crate-tree-width").value = width;
      el("crate-tree-step").value = step;
      expect(readTreeForm()).toBeNull();
    }

    choose("genre");
    el("crate-tree-min-tracks").value = "";
    el("crate-tree-limit").value = "";
    expect(readTreeForm()).toEqual({ kind: "genre", min_tracks: 2, limit: 40 });
    el("crate-tree-min-tracks").value = "3";
    el("crate-tree-limit").value = "12";
    expect(readTreeForm()).toEqual({ kind: "genre", min_tracks: 3, limit: 12 });
    const badGenre: Array<[string, string]> = [
      ["0", "40"],
      ["1.5", "40"],
      ["2", "0"],
      ["2", "101"],
      ["2", "1.5"],
    ];
    for (const [minTracks, limit] of badGenre) {
      el("crate-tree-min-tracks").value = minTracks;
      el("crate-tree-limit").value = limit;
      expect(readTreeForm()).toBeNull();
    }

    choose("family");
    el("crate-tree-min-tracks").value = "";
    el("crate-tree-limit").value = "";
    expect(readTreeForm()).toEqual({ kind: "family", min_tracks: 2, limit: 40 });
    el("crate-tree-min-tracks").value = "4";
    el("crate-tree-limit").value = "8";
    expect(readTreeForm()).toEqual({ kind: "family", min_tracks: 4, limit: 8 });
    el("crate-tree-min-tracks").value = "0";
    expect(readTreeForm()).toBeNull();
  });

  it("limits to the selected normal crate only while the box is checked", () => {
    choose("key");
    el("crate-tree-scope").checked = true;
    expect(readTreeForm()).toEqual({ kind: "key" });
    state.activeCrate = 5;
    expect(readTreeForm()).toEqual({ kind: "key", crate: 5 });
    el("crate-tree-scope").checked = false;
    expect(readTreeForm()).toEqual({ kind: "key" });
    state.activeCrate = 6;
    el("crate-tree-scope").checked = true;
    expect(readTreeForm()).toEqual({ kind: "key" });
  });

  it("shows only the fields of the chosen kind", () => {
    choose("bpm");
    expect(el("crate-tree-low").closest("label")?.hidden).toBe(false);
    expect(el("crate-tree-min-tracks").closest("label")?.hidden).toBe(true);
    choose("genre");
    expect(el("crate-tree-low").closest("label")?.hidden).toBe(true);
    expect(el("crate-tree-min-tracks").closest("label")?.hidden).toBe(false);
    choose("key");
    expect(el("crate-tree-low").closest("label")?.hidden).toBe(true);
    expect(el("crate-tree-min-tracks").closest("label")?.hidden).toBe(true);
    choose("family");
    expect(el("crate-tree-low").closest("label")?.hidden).toBe(true);
    expect(el("crate-tree-min-tracks").closest("label")?.hidden).toBe(false);
  });
});

describe("defaultTreeName", () => {
  it("names each kind in the page language", () => {
    expect(defaultTreeName("bpm")).toBe("BPM bands");
    expect(defaultTreeName("key")).toBe("Keys");
    expect(defaultTreeName("genre")).toBe("Genres");
    expect(defaultTreeName("family")).toBe("Genre families");
    setLocale("es");
    expect(defaultTreeName("bpm")).toBe("Bandas de BPM");
    expect(defaultTreeName("key")).toBe("Tonalidades");
    expect(defaultTreeName("genre")).toBe("Géneros");
    expect(defaultTreeName("family")).toBe("Familias de género");
  });
});

describe("crateTreePreviewText", () => {
  it("lists children and flags an empty tree", () => {
    expect(crateTreeHasChildren([])).toBe(false);
    expect(crateTreePreviewText([])).toBe("No tracks fit that crate tree.");
    expect(crateTreeHasChildren([{ name: "80–90 ⟳", count: 4 }])).toBe(true);
    expect(crateTreePreviewText([
      { name: "80–90 ⟳", count: 4 },
      { name: "90–100 ⟳", count: 2 },
    ])).toBe("2 crates: 80–90 ⟳ (4), 90–100 ⟳ (2)");
  });
});

describe("crate tree dialog", () => {
  it("fills the scope from the selection and previews", async () => {
    state.activeCrate = 5;
    answer({ body: { children: [{ name: "80–90 ⟳", count: 4 }] } });
    await openCrateTreeDialog();
    expect(el("crate-tree-dialog").open).toBe(true);
    expect(el("crate-tree-scope-label").hidden).toBe(false);
    expect(el("crate-tree-scope").checked).toBe(true);
    expect(el("crate-tree-scope-text").textContent).toBe("Only tracks in Bar set and its subcrates");
    expect(el("crate-tree-name").placeholder).toBe("BPM bands");
    expect(calls).toEqual([{
      url: "/api/crate-tree",
      body: {
        action: "preview",
        space: "Serato Library",
        tree: { kind: "bpm", low: 80, high: 140, width: 10, step: 10, crate: 5 },
      },
    }]);
    expect(el("crate-tree-preview").textContent).toBe("1 crate: 80–90 ⟳ (4)");
    expect(el("crate-tree-create").disabled).toBe(false);
  });

  it("hides the scope for All tracks and refuses to open while read-only", async () => {
    answer({ body: { children: [{ name: "8A ⟳", count: 1 }] } });
    choose("key");
    await openCrateTreeDialog();
    expect(el("crate-tree-scope-label").hidden).toBe(true);
    expect(el("crate-tree-preview").textContent).toBe("1 crate: 8A ⟳ (1)");
    el("crate-tree-dialog").close();
    state.writable = false;
    calls = [];
    await openCrateTreeDialog();
    expect(el("crate-tree-dialog").open).toBe(false);
    expect(calls).toEqual([]);
  });

  it("ignores a preview answer that arrives after a newer one", async () => {
    choose("key");
    let release: (value: Response) => void = () => undefined;
    const slow = new Promise<Response>((resolve) => { release = resolve; });
    answer(() => slow, { body: { children: [{ name: "2A ⟳", count: 2 }] } });
    const first = previewCrateTree();
    choose("genre");
    await previewCrateTree();
    release(new Response(JSON.stringify({ children: [{ name: "stale ⟳", count: 99 }] }), { status: 200 }));
    await first;
    expect(el("crate-tree-preview").textContent).toBe("1 crate: 2A ⟳ (2)");
  });

  it("disables Create and clears the count while the form is incomplete", async () => {
    choose("bpm");
    el("crate-tree-low").value = "0";
    answer();
    await previewCrateTree();
    expect(el("crate-tree-create").disabled).toBe(true);
    expect(el("crate-tree-preview").textContent).toBe("");
    expect(calls).toEqual([]);
  });

  it("shows a refused preview and keeps Create off", async () => {
    choose("bpm");
    answer({ status: 400, body: { error: "Choose BPM bands between 1 and 400, 1 to 50 wide, starting no further apart than their width, and at most 60 bands.", code: "tree_bad_bands" } });
    await previewCrateTree();
    expect(el("crate-tree-preview").textContent).toBe("Choose BPM bands between 1 and 400, 1 to 50 wide, starting no further apart than their width, and at most 60 bands.");
    expect(el("crate-tree-create").disabled).toBe(true);
  });

  it("keeps Create off when no subcrate would be made", async () => {
    choose("key");
    answer({ body: { children: [] } });
    await previewCrateTree();
    expect(el("crate-tree-preview").textContent).toBe("No tracks fit that crate tree.");
    expect(el("crate-tree-create").disabled).toBe(true);
  });

  it("creates the tree with the page-language name and selects it", async () => {
    setLocale("es");
    choose("key");
    el("crate-tree-name").value = "";
    el("crate-tree-dialog").showModal();
    answer({ body: { id: 42, name: "Tonalidades", children: [{ id: 43, name: "8A ⟳", count: 3 }], warning: null } });
    await createCrateTree();
    expect(calls[0]?.body).toEqual({
      action: "create",
      space: "Serato Library",
      tree: { kind: "key" },
      name: "Tonalidades",
    });
    expect(calls[0]?.body).not.toHaveProperty("parent");
    expect(el("crate-tree-dialog").open).toBe(false);
    expect(views.setNotice).toHaveBeenCalledWith("Tonalidades guardada con 1 caja.");
    expect(views.loadLibrary).toHaveBeenCalledOnce();
    expect(views.selectCrate).toHaveBeenCalledWith(42);
  });

  it("sends a typed name as is and omits parent when a crate is scoped", async () => {
    state.activeCrate = 5;
    el("crate-tree-scope").checked = true;
    choose("bpm");
    el("crate-tree-name").value = "  Warmup ";
    answer({ body: { id: 9, name: "Warmup", children: [{ id: 10, name: "80–90 ⟳", count: 1 }] } });
    await createCrateTree();
    expect(calls[0]?.body).toEqual({
      action: "create",
      space: "Serato Library",
      tree: { kind: "bpm", low: 80, high: 140, width: 10, step: 10, crate: 5 },
      name: "Warmup",
    });
    expect(calls[0]?.body).not.toHaveProperty("parent");
  });

  it("locks the page and closes when Serato holds the library", async () => {
    choose("key");
    el("crate-tree-dialog").showModal();
    answer({ status: 409, body: { error: "Quit Serato DJ Pro first." } });
    await createCrateTree();
    expect(views.lockDown).toHaveBeenCalledOnce();
    expect(el("crate-tree-dialog").open).toBe(false);
    expect(views.loadLibrary).not.toHaveBeenCalled();
  });

  it("keeps the dialog open with the reason on another failure", async () => {
    choose("key");
    el("crate-tree-dialog").showModal();
    answer({ status: 400, body: { error: "That crate is not in this space." } });
    await createCrateTree();
    expect(el("crate-tree-dialog").open).toBe(true);
    expect(el("crate-tree-status").textContent).toBe("That crate is not in this space.");
    expect(views.lockDown).not.toHaveBeenCalled();
  });

  it("shows the queued sentence and skips reload when the write is queued", async () => {
    choose("key");
    el("crate-tree-dialog").showModal();
    answer({ body: { queued: true } });
    await createCrateTree();
    expect(el("crate-tree-dialog").open).toBe(false);
    expect(views.setNotice).toHaveBeenCalledWith("Queued. Apply from Backups after Gig Lock is off.");
    expect(views.loadLibrary).not.toHaveBeenCalled();
  });
});
