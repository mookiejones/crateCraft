/**
 * Native menu actions call the same controls as the page.
 *
 * Fetch is stubbed. No library file is opened.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { runDesktopAction } from "./desktop-actions";
import { el } from "./dom";
import { state } from "./state";
import { installPage } from "./test-page";

beforeEach(() => {
  installPage();
  state.mode = "crates";
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }))));
});

describe("desktop menu actions", () => {
  it("opens find, focuses search, and opens the shortcut list", () => {
    runDesktopAction("find");
    expect(el("quick-open").open).toBe(true);
    el("quick-open").close();
    runDesktopAction("focus-search");
    expect(document.activeElement).toBe(el("search"));
    runDesktopAction("shortcuts");
    expect(el("settings-dialog").open).toBe(true);
    expect(el("settings-dialog").contains(el("shortcuts-section"))).toBe(true);
  });

  it("clicks the page button for a crate and a playlist action", () => {
    const seen: string[] = [];
    el("crate-new").addEventListener("click", () => seen.push("new"));
    el("export-m3u").addEventListener("click", () => seen.push("export"));
    el("open-help").addEventListener("click", () => seen.push("help"));
    runDesktopAction("new-crate");
    runDesktopAction("export-playlist");
    runDesktopAction("help");
    runDesktopAction("not-a-command");
    expect(seen).toEqual(["new", "export", "help"]);
  });

  it("switches view and space without a second code path", () => {
    const spaces: string[] = [];
    el("space").addEventListener("change", () => spaces.push(el("space").value));
    runDesktopAction("view-history");
    expect(state.mode).toBe("history");
    runDesktopAction("view-all");
    expect(state.mode).toBe("crates");
    runDesktopAction("space:Prepare");
    expect(el("space").value).toBe("Prepare");
    expect(spaces).toEqual(["Prepare"]);
  });
});
