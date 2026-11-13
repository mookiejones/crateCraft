/**
 * Quick-open finds views, crates, and loaded tracks immediately, then files.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import { matchCrateHits, matchViewHits, parentDirectory, QUICK_OPEN_MS } from "../lib/ui/quick-open";
import { resetNav } from "../lib/ui/nav";
import { wireShortcuts } from "../lib/ui/shortcuts";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";
import { mountTrackList, unmountTrackList } from "../lib/ui/virtual-scroll";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("parent folders", () => {
  it("keeps Windows and POSIX roots", () => {
    expect(parentDirectory("/Volumes/GIG/House/track.mp3")).toBe("/Volumes/GIG/House");
    expect(parentDirectory("/track.mp3")).toBe("/");
    expect(parentDirectory("C:\\Music\\House\\track.mp3")).toBe("C:\\Music\\House");
    expect(parentDirectory("C:\\track.mp3")).toBe("C:\\");
    expect(parentDirectory("\\\\server\\share\\track.mp3")).toBe("\\\\server\\share");
  });
});

describe("view and crate hits", () => {
  beforeEach(() => {
    resetNav();
    setLocale("en");
    state.crates = [
      { id: 2, name: "House", parent: 1 },
      { id: 4, name: "Deep", parent: 2 },
    ];
  });

  afterEach(() => {
    setLocale("en");
  });

  it("lists a view when the query matches its name", () => {
    const names = (query: string) => matchViewHits(query).map((hit) => hit.title);
    expect(names("history")).toContain("History");
    expect(names("play stats")).toContain("Play stats");
    expect(names("organize files")).toContain("Organize files");
    expect(names("overview")).toContain("Overview");
    expect(names("missing files")).toContain("Missing files");
    expect(names("backups")).toContain("Backups");
    expect(names("ready")).toContain("Ready");
    expect(matchViewHits("history")[0]?.mode).toBe("history");
    expect(matchViewHits("overview")[0]?.mode).toBe("health");
    expect(matchViewHits("backups")[0]?.mode).toBe("snapshots");
    expect(matchViewHits("ready")[0]?.mode).toBe("gig");
  });

  it("opens the same view the rail primary does for a group name", () => {
    expect(matchViewHits("health").some((hit) => hit.title === "Health" && hit.mode === "health")).toBe(true);
    expect(matchViewHits("music").some((hit) => hit.title === "Music" && hit.mode === "crates")).toBe(true);
    expect(matchViewHits("gig").some((hit) => hit.title === "Gig" && hit.mode === "gig")).toBe(true);
  });

  it("lists a crate when the query matches its name", () => {
    const hits = matchCrateHits("house");
    expect(hits.some((hit) => hit.title === "House" && hit.crateId === 2)).toBe(true);
    expect(matchCrateHits("all tracks").some((hit) => hit.crateId === "all")).toBe(true);
    expect(matchCrateHits("")).toEqual([]);
  });

  it("matches Spanish view names", () => {
    setLocale("es");
    expect(matchViewHits("historial")[0]?.mode).toBe("history");
    expect(matchViewHits("estadísticas")[0]?.mode).toBe("stats");
    expect(matchViewHits("resumen")[0]?.mode).toBe("health");
  });
});

describe("quick-open", () => {
  beforeEach(() => {
    installPage();
    mountTrackList();
    resetNav();
    setLocale("en");
    state.tracks = [
      { id: 7, name: "House Mix", artist: "Ada", album: "Night", file: "/music/house.mp3" },
      { id: 8, name: "Other", artist: "Bea", album: "Day", file: "/music/other.mp3" },
    ];
    state.byId = new Map(state.tracks.map((track) => [track.id, track]));
    state.crates = [
      { id: 2, name: "House", parent: 1 },
      { id: 4, name: "Deep", parent: 2 },
    ];
    state.mode = "crates";
    state.activeCrate = "all";
    state.selectedId = null;
    state.view = [];
    state.space = "Serato Library";
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    vi.useFakeTimers();
    wireShortcuts();
  });

  afterEach(async () => {
    unmountTrackList();
    vi.useRealTimers();
    setLocale("en");
    await drainReactScheduler();
  });

  it("lists a track immediately, then a file from the server, and opens the track", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/files")) {
        return Promise.resolve(json({
          search: true,
          query: "house",
          entries: [{ name: "House Mix.mp3", kind: "file", path: "/music/Deep/House Mix.mp3", detail: "/music/Deep", score: 10 }],
          truncated: false,
        }));
      }
      if (url.includes("/api/track")) return Promise.resolve(json({ id: 7, name: "House Mix", artist: "Ada" }));
      return Promise.resolve(json({ entries: [], roots: [], path: "/music/Deep", parent: "/music" }));
    });
    vi.stubGlobal("fetch", fetchMock);
    document.body.focus();
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
    const field = el("quick-open-query");
    expect(el("quick-open").open).toBe(true);
    expect(document.activeElement).toBe(field);
    expect(el("quick-open-status").textContent).toContain("Type a view");
    field.value = "house";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el("quick-open-list").textContent).toContain("House Mix");
    expect(el("quick-open-list").textContent).toContain("Track");
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(QUICK_OPEN_MS);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/files?q=house");
    expect(el("quick-open-list").textContent).toContain("File");
    expect(el("quick-open-list").textContent).toContain("House Mix.mp3");
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    expect(document.getElementById("quick-open-option-1")?.getAttribute("aria-selected")).toBe("true");
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
    const trackButton = [...el("quick-open-list").querySelectorAll("button")].find((button) => (
      (button.textContent ?? "").includes("House Mix") && (button.textContent ?? "").includes("Track")
    ));
    expect(trackButton).toBeTruthy();
    trackButton?.click();
    expect(el("quick-open").open).toBe(false);
    expect(state.selectedId).toBe(7);
    expect(state.mode).toBe("crates");
  });

  it("keeps track matches when the file search fails, then says when nothing matches", async () => {
    let fail = true;
    const fetchMock = vi.fn(() => Promise.resolve(fail ? json({ error: "nope" }, 500) : json({ search: true, entries: [], truncated: false })));
    vi.stubGlobal("fetch", fetchMock);
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true, cancelable: true }));
    const field = el("quick-open-query");
    field.value = "house";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(QUICK_OPEN_MS);
    expect(el("quick-open-status").textContent).toContain("could not be searched");
    expect(el("quick-open-list").textContent).toContain("House Mix");
    expect(el("quick-open-retry").hidden).toBe(false);
    fail = false;
    field.value = "zzzz";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(QUICK_OPEN_MS);
    expect(el("quick-open-status").textContent).toContain("No views, crates, tracks, or files match");
  });

  it("lists a view immediately and opens it with Enter, then updates the hash", () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json({ sessions: [] }))));
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
    const field = el("quick-open-query");
    field.value = "history";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el("quick-open-list").textContent).toContain("History");
    expect(el("quick-open-list").textContent).toContain("View");
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(el("quick-open").open).toBe(false);
    expect(state.mode).toBe("history");
    expect(location.hash).toBe("#library/history");
    expect(document.activeElement).toBe(document.querySelector("#view-children [data-view='history']"));
  });

  it("opens a clicked view and closes the box", () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json({}))));
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true, cancelable: true }));
    const field = el("quick-open-query");
    field.value = "play stats";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    const option = document.getElementById("quick-open-option-0");
    expect(option?.textContent).toContain("Play stats");
    option?.click();
    expect(el("quick-open").open).toBe(false);
    expect(state.mode).toBe("stats");
    expect(location.hash).toBe("#library/stats");
  });

  it("opens a crate in Crates and writes the crate into the hash", () => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
    const field = el("quick-open-query");
    field.value = "deep";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    expect(el("quick-open-list").textContent).toContain("Deep");
    expect(el("quick-open-list").textContent).toContain("Crate");
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    expect(el("quick-open").open).toBe(false);
    expect(state.mode).toBe("crates");
    expect(state.activeCrate).toBe(4);
    expect(location.hash).toBe("#library/crates/4");
  });

  it("keeps track hits when a view also matches", () => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
    const field = el("quick-open-query");
    field.value = "house";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    const text = el("quick-open-list").textContent ?? "";
    expect(text).toContain("House Mix");
    expect(text).toContain("Track");
    expect(text).toContain("House");
    expect(text).toContain("Crate");
  });

  it("closes on Esc without changing the view", () => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true }));
    const field = el("quick-open-query");
    field.value = "history";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.focus();
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    expect(el("quick-open").open).toBe(false);
    expect(state.mode).toBe("crates");
  });
});
