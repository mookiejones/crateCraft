/**
 * Rail collapse: five primaries, children only for the open parent.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { applyStatic, setLocale } from "./i18n";
import { groupForMode, modeForGroup, paintNav, rememberMode, resetNav } from "./nav";
import { installPage } from "./test-page";

function visibleChildren(): string[] {
  return [...document.querySelectorAll<HTMLButtonElement>("#view-children [data-view]")]
    .filter((button) => !button.hidden)
    .map((button) => button.dataset.view ?? "");
}

describe("nav collapse", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    applyStatic(document);
    resetNav();
  });

  afterEach(() => {
    resetNav();
  });

  it("maps each view to its parent", () => {
    expect(groupForMode("crates")).toBe("library");
    expect(groupForMode("history")).toBe("library");
    expect(groupForMode("stats")).toBe("library");
    expect(groupForMode("files")).toBe("files");
    expect(groupForMode("missing")).toBe("health");
    expect(groupForMode("snapshots")).toBe("backups");
    expect(groupForMode("portable")).toBe("gig");
    expect(groupForMode("unknown")).toBe("library");
  });

  it("opens the first child of a parent until a later child is remembered", () => {
    expect(modeForGroup("library")).toBe("crates");
    expect(modeForGroup("health")).toBe("health");
    expect(modeForGroup("gig")).toBe("gig");
    rememberMode("history");
    rememberMode("tags");
    rememberMode("drift");
    expect(modeForGroup("library")).toBe("history");
    expect(modeForGroup("health")).toBe("tags");
    expect(modeForGroup("gig")).toBe("drift");
    rememberMode("files");
    expect(modeForGroup("library")).toBe("history");
    expect(modeForGroup("files")).toBe("files");
  });

  it("shows only the open parent's children in the sheet strip", () => {
    paintNav("crates");
    expect(document.querySelector<HTMLButtonElement>("[data-nav='library']")?.getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector<HTMLButtonElement>("[data-nav='health']")?.getAttribute("aria-selected")).toBe("false");
    expect(document.getElementById("view-children")?.hidden).toBe(false);
    expect(visibleChildren()).toEqual(["crates", "history", "stats"]);
    expect(document.querySelector("[data-view='crates']")?.getAttribute("aria-selected")).toBe("true");

    paintNav("missing");
    expect(document.querySelector<HTMLButtonElement>("[data-nav='health']")?.getAttribute("aria-selected")).toBe("true");
    expect(visibleChildren()).toEqual(["health", "missing", "duplicates", "stems", "scan", "bitrate", "tags"]);
    expect(document.querySelector("[data-view='missing']")?.getAttribute("aria-selected")).toBe("true");
    expect(document.querySelector<HTMLButtonElement>("[data-view='crates']")?.hidden).toBe(true);
  });

  it("hides the child strip for Organize files and Backups", () => {
    paintNav("files");
    expect(document.getElementById("view-children")?.hidden).toBe(true);
    expect(document.querySelector<HTMLButtonElement>("[data-nav='files']")?.getAttribute("aria-selected")).toBe("true");

    paintNav("snapshots");
    expect(document.getElementById("view-children")?.hidden).toBe(true);
    expect(document.querySelector<HTMLButtonElement>("[data-nav='backups']")?.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps the last child when returning to a parent", () => {
    rememberMode("stats");
    rememberMode("scan");
    expect(modeForGroup("library")).toBe("stats");
    expect(modeForGroup("health")).toBe("scan");
    rememberMode("files");
    expect(modeForGroup("library")).toBe("stats");
  });
});
