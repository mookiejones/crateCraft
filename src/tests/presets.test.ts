import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import { isPresetCrate, presetFoot, presetName, readPresetForm, syncPresetButtons, syncPresetFields } from "../lib/crates/preset-view";
import { createPreset, openPresetDialog, previewPreset, refreshActivePreset, refreshPresetsOnOpen } from "../lib/crates/presets";
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
  el("preset-kind").value = kind;
  syncPresetFields();
}

describe("readPresetForm", () => {
  it("builds each kind and refuses blank or out-of-range fields", () => {
    choose("harmonic");
    el("preset-key").value = " 8A ";
    expect(readPresetForm()).toEqual({ kind: "harmonic", key: "8A" });
    el("preset-key").value = "  ";
    expect(readPresetForm()).toBeNull();

    choose("bpm");
    el("preset-bpm").value = "124";
    el("preset-range").value = "2.5";
    expect(readPresetForm()).toEqual({ kind: "bpm", bpm: 124, range: 2.5 });
    el("preset-range").value = "";
    expect(readPresetForm()).toEqual({ kind: "bpm", bpm: 124, range: 3 });
    const bad: Array<[string, string]> = [["0", "3"], ["", "3"], ["124", "51"], ["124", "-1"], ["abc", "3"]];
    for (const [bpm, range] of bad) {
      el("preset-bpm").value = bpm;
      el("preset-range").value = range;
      expect(readPresetForm()).toBeNull();
    }

    choose("unplayed");
    el("preset-months").value = "6";
    expect(readPresetForm()).toEqual({ kind: "unplayed", months: 6 });
    for (const months of ["0", "241", "1.5"]) {
      el("preset-months").value = months;
      expect(readPresetForm()).toBeNull();
    }
  });

  it("limits to the selected normal crate only while the box is checked", () => {
    choose("harmonic");
    el("preset-key").value = "8A";
    el("preset-scope").checked = true;
    expect(readPresetForm()).toEqual({ kind: "harmonic", key: "8A" });
    state.activeCrate = 5;
    expect(readPresetForm()).toEqual({ kind: "harmonic", key: "8A", crate: 5 });
    el("preset-scope").checked = false;
    expect(readPresetForm()).toEqual({ kind: "harmonic", key: "8A" });
    state.activeCrate = 6;
    el("preset-scope").checked = true;
    expect(readPresetForm()).toEqual({ kind: "harmonic", key: "8A" });
  });

  it("shows only the fields of the chosen kind", () => {
    choose("bpm");
    expect(el("preset-bpm").closest("label")?.hidden).toBe(false);
    expect(el("preset-key").closest("label")?.hidden).toBe(true);
    expect(el("preset-months").closest("label")?.hidden).toBe(true);
  });
});

describe("presetName", () => {
  it("names each kind in the page language", () => {
    expect(presetName({ kind: "harmonic", key: "8A" })).toBe("Mixes with 8A");
    expect(presetName({ kind: "bpm", bpm: 124.5, range: 3 })).toBe("BPM 124.5 ±3");
    expect(presetName({ kind: "unplayed", months: 1 })).toBe("Not played in 1 month");
    expect(presetName({ kind: "unplayed", months: 12 })).toBe("Not played in 12 months");
    setLocale("es");
    expect(presetName({ kind: "harmonic", key: "8A" })).toBe("Mezcla con 8A");
    expect(presetName({ kind: "bpm", bpm: 124.5, range: 3 })).toBe("BPM 124,5 ±3");
    expect(presetName({ kind: "unplayed", months: 12 })).toBe("Sin tocar en 12 meses");
  });
});

describe("preset crate buttons and footer", () => {
  it("shows Refresh and the updated stamp only on a preset crate", () => {
    state.presets = { "5": { preset: { kind: "bpm", bpm: 120, range: 3 }, updated: 1_800_000_000 } };
    state.activeCrate = 6;
    syncPresetButtons();
    expect(el("crate-refresh").hidden).toBe(true);
    expect(presetFoot(6)).toBe("");
    expect(isPresetCrate("all")).toBe(false);
    state.activeCrate = 5;
    syncPresetButtons();
    expect(el("crate-refresh").hidden).toBe(false);
    expect(el("crate-refresh").disabled).toBe(false);
    expect(presetFoot(5)).toMatch(/^ · ⟳ updated /);
    state.writable = false;
    syncPresetButtons();
    expect(el("crate-refresh").disabled).toBe(true);
    expect(el("crate-preset").disabled).toBe(true);
  });

  it("leaves the stamp out when the record has no time", () => {
    state.presets = { "5": { preset: { kind: "bpm", bpm: 120, range: 3 }, updated: null } };
    expect(presetFoot(5)).toBe("");
  });
});

describe("preset dialog", () => {
  it("fills the key, BPM, and scope from the selection and previews", async () => {
    state.byId = new Map([[1, { id: 1, key: "8A", bpm: 123.96 }]]);
    state.selectedId = 1;
    state.activeCrate = 5;
    answer({ body: { count: 7 } });
    await openPresetDialog();
    expect(el("preset-dialog").open).toBe(true);
    expect(el("preset-key").value).toBe("8A");
    expect(el("preset-bpm").value).toBe("124");
    expect(el("preset-scope-label").hidden).toBe(false);
    expect(el("preset-scope").checked).toBe(true);
    expect(el("preset-scope-text").textContent).toBe("Only tracks in Bar set and its subcrates");
    expect(el("preset-name").placeholder).toBe("Mixes with 8A");
    expect(calls).toEqual([{
      url: "/api/smart-preset",
      body: { action: "preview", space: "Serato Library", preset: { kind: "harmonic", key: "8A", crate: 5 } },
    }]);
    expect(el("preset-preview").textContent).toBe("7 tracks match.");
    expect(el("preset-create").disabled).toBe(false);
  });

  it("hides the scope for All tracks and refuses to open while read-only", async () => {
    answer({ body: { count: 1 } });
    el("preset-key").value = "1A";
    await openPresetDialog();
    expect(el("preset-scope-label").hidden).toBe(true);
    expect(el("preset-preview").textContent).toBe("1 track matches.");
    el("preset-dialog").close();
    state.writable = false;
    calls = [];
    await openPresetDialog();
    expect(el("preset-dialog").open).toBe(false);
    expect(calls).toEqual([]);
  });

  it("ignores a preview answer that arrives after a newer one", async () => {
    choose("harmonic");
    el("preset-key").value = "1A";
    let release: (value: Response) => void = () => undefined;
    const slow = new Promise<Response>((resolve) => { release = resolve; });
    answer(() => slow, { body: { count: 2 } });
    const first = previewPreset();
    el("preset-key").value = "2A";
    await previewPreset();
    release(new Response(JSON.stringify({ count: 99 }), { status: 200 }));
    await first;
    expect(el("preset-preview").textContent).toBe("2 tracks match.");
  });

  it("disables Create and clears the count while the form is incomplete", async () => {
    choose("bpm");
    el("preset-bpm").value = "";
    answer();
    await previewPreset();
    expect(el("preset-create").disabled).toBe(true);
    expect(el("preset-preview").textContent).toBe("");
    expect(calls).toEqual([]);
  });

  it("shows a refused preview and keeps Create off", async () => {
    choose("harmonic");
    el("preset-key").value = "Z";
    answer({ status: 400, body: { error: "Choose a musical key for the harmonic preset.", code: "preset_bad_key" } });
    await previewPreset();
    expect(el("preset-preview").textContent).toBe("Choose a musical key for the harmonic preset.");
    expect(el("preset-create").disabled).toBe(true);
  });

  it("creates the crate with the page-language name and selects it", async () => {
    setLocale("es");
    choose("unplayed");
    el("preset-months").value = "6";
    el("preset-name").value = "";
    el("preset-dialog").showModal();
    answer({ body: { id: 42, name: "Sin tocar en 6 meses ⟳", added: 3, warning: null } });
    await createPreset();
    expect(calls[0]?.body).toEqual({
      action: "create",
      space: "Serato Library",
      preset: { kind: "unplayed", months: 6 },
      name: "Sin tocar en 6 meses",
    });
    expect(el("preset-dialog").open).toBe(false);
    expect(views.setNotice).toHaveBeenCalledWith("Sin tocar en 6 meses ⟳ guardada con 3 pistas.");
    expect(views.loadLibrary).toHaveBeenCalledOnce();
    expect(views.selectCrate).toHaveBeenCalledWith(42);
  });

  it("sends a typed name as is", async () => {
    choose("harmonic");
    el("preset-key").value = "8A";
    el("preset-name").value = "  Warmup ";
    answer({ body: { id: 9, name: "Warmup ⟳", added: 1 } });
    await createPreset();
    expect(calls[0]?.body.name).toBe("Warmup");
  });

  it("locks the page and closes when Serato holds the library", async () => {
    choose("harmonic");
    el("preset-key").value = "8A";
    el("preset-dialog").showModal();
    answer({ status: 409, body: { error: "Quit Serato DJ Pro first." } });
    await createPreset();
    expect(views.lockDown).toHaveBeenCalledOnce();
    expect(el("preset-dialog").open).toBe(false);
    expect(views.loadLibrary).not.toHaveBeenCalled();
  });

  it("keeps the dialog open with the reason on another failure", async () => {
    choose("harmonic");
    el("preset-key").value = "8A";
    el("preset-dialog").showModal();
    answer({ status: 400, body: { error: "That crate is not in this space." } });
    await createPreset();
    expect(el("preset-dialog").open).toBe(true);
    expect(el("preset-status").textContent).toBe("That crate is not in this space.");
    expect(views.lockDown).not.toHaveBeenCalled();
  });
});

describe("refresh", () => {
  it("refreshes the selected preset crate and reports the change", async () => {
    state.activeCrate = 5;
    answer({ body: { added: 2, removed: 1, count: 9 } });
    await refreshActivePreset();
    expect(calls[0]?.body).toEqual({ action: "refresh", id: 5 });
    expect(views.setNotice).toHaveBeenCalledWith("Bar set refreshed: 2 added, 1 removed.");
    expect(views.loadLibrary).toHaveBeenCalledOnce();
  });

  it("reloads after a 404 so a crate that is gone loses its Refresh button", async () => {
    state.activeCrate = 5;
    answer({ status: 404, body: { error: "That preset crate is no longer in the library." } });
    await refreshActivePreset();
    expect(views.setNotice).toHaveBeenCalledWith(
      "That preset crate is no longer in the library.",
      "error",
    );
    expect(views.loadLibrary).toHaveBeenCalledOnce();
  });

  it("does nothing on open without preset crates or while read-only", async () => {
    answer();
    await refreshPresetsOnOpen();
    state.presets = { "5": { preset: { kind: "bpm", bpm: 120, range: 3 } } };
    state.writable = false;
    await refreshPresetsOnOpen();
    expect(calls).toEqual([]);
  });

  it("reports and reloads only when a crate changed on open", async () => {
    state.presets = { "5": { preset: { kind: "bpm", bpm: 120, range: 3 } } };
    answer({ body: { changed: [] } }, { body: { changed: [5, 7] } });
    await refreshPresetsOnOpen();
    expect(views.setNotice).not.toHaveBeenCalled();
    expect(views.loadLibrary).not.toHaveBeenCalled();
    await refreshPresetsOnOpen();
    expect(calls.map((call) => call.body)).toEqual([{ action: "refresh_all" }, { action: "refresh_all" }]);
    expect(views.setNotice).toHaveBeenCalledWith("2 preset crates refreshed.");
    expect(views.loadLibrary).toHaveBeenCalledOnce();
  });

  it("stays quiet on open when Serato is running", async () => {
    state.presets = { "5": { preset: { kind: "bpm", bpm: 120, range: 3 } } };
    answer({ status: 409, body: { error: "Quit Serato DJ Pro first." } });
    await refreshPresetsOnOpen();
    expect(views.setNotice).not.toHaveBeenCalled();
  });
});
