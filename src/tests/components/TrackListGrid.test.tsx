/**
 * Crates Data Grid: Play is the first column, Title is the name, headers
 * live in the grid, and a 10k library stays virtualized.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Track } from "../../lib/api-types";
import { setLocale } from "../../lib/i18n";
import { state } from "../../lib/state";
import { drainReactScheduler, installPage } from "../test-page";
import { mountTrackList, paintRows, unmountTrackList } from "../../lib/ui/virtual-scroll";
import { renderList } from "../../lib/ui/views";

function track(id: number, name: string, extra: Partial<Track> = {}): Track {
  return { id, name, artist: "Ada", bpm: 124, key: "8A", ...extra };
}

function headerFields(): string[] {
  return [...document.querySelectorAll<HTMLElement>("#list .MuiDataGrid-columnHeader")]
    .map((node) => node.getAttribute("data-field") ?? "");
}

describe("Track list Data Grid", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.mode = "crates";
    state.space = "Serato Library";
    state.writable = false;
    state.query = "";
    state.sort = "name";
    state.sortDir = 1;
    state.selectedId = 1;
    state.tracks = [track(1, "Night"), track(2, "Dawn")];
    state.view = [...state.tracks];
    state.viewB = [];
    state.crates = [];
    state.duplicateIds = null;
    mountTrackList();
  });

  afterEach(async () => {
    unmountTrackList();
    await drainReactScheduler();
  });

  it("puts Play in its own first column and Title holds only the name", () => {
    renderList();
    expect(headerFields()[0]).toBe("play");
    expect(headerFields()[1]).toBe("name");
    const title = document.querySelector("#list .title");
    expect(title?.textContent).toBe("Night");
    expect(title?.closest(".MuiDataGrid-cell")?.querySelector(".row-play")).toBeNull();
    expect(document.querySelector("#list .row-play")).not.toBeNull();
    expect(document.querySelector("#list .MuiDataGrid-menuIconButton")).not.toBeNull();
  });

  it("keeps History on the same grid with deck, played, and time", () => {
    state.mode = "history";
    state.view = [{ id: 9, name: "Alpha", artist: "Ada", entry: true, deck: "1", played: "Yes" }];
    paintRows();
    expect(headerFields()).toEqual(["play", "name", "artist", "deck", "played", "start"]);
    expect(document.querySelector("#list .row-play")).toBeNull();
    expect(document.querySelector("#list .row")?.textContent).toContain("Yes");
  });

  it("paints rows after the first empty commit", () => {
    installPage();
    setLocale("en");
    state.mode = "missing";
    state.view = [];
    mountTrackList();
    state.tracks = [track(1, "Gone", { missing: true })];
    state.view = [...state.tracks];
    paintRows();
    expect(document.querySelector("#list .title")?.textContent).toBe("Gone");
    expect(document.querySelector("#list .missing-word")?.textContent).toBe("missing");
  });

  it("pages a library larger than the Community page size", () => {
    paintRows();
    expect(document.querySelector("#list .MuiDataGrid-footerContainer")).toBeNull();
    const many = Array.from({ length: 101 }, (_, index) => track(index + 1, `Track ${index + 1}`));
    state.view = many;
    state.selectedId = 1;
    paintRows();
    expect(document.querySelector("#list .title")?.textContent).toBe("Track 1");
    const footer = document.querySelector("#list .MuiDataGrid-footerContainer");
    expect(footer).not.toBeNull();
    expect(footer?.textContent).toMatch(/101/);
    const next = document.querySelector<HTMLButtonElement>("#list [aria-label='Go to next page']");
    expect(next).not.toBeNull();
    expect(next?.disabled).toBe(false);
    next?.click();
    expect(footer?.textContent).toMatch(/101/);
  });
});
