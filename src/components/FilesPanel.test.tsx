/**
 * Files panel renders from FilesContext.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { AppProviders } from "../app/providers";
import { libraryRootsFixture } from "../library-roots.fixture";
import { state } from "../state";
import { installPage } from "../test-page";
import { FilesPanel } from "./FilesPanel";

function renderPanel(host: HTMLElement) {
  const root = createRoot(host);
  flushSync(() => {
    root.render(createElement(AppProviders, { children: createElement(FilesPanel) }));
  });
  return root;
}

describe("FilesPanel context", () => {
  beforeEach(() => {
    installPage();
    state.mode = "files";
    state.writable = true;
    state.filesAtRoots = true;
    state.filesPath = "";
    state.filesParent = null;
    state.filesEntries = [];
    state.filesSelected = new Set();
    state.filesLoading = false;
    state.filesError = "";
    state.filesMessage = "";
    state.filesRoots = libraryRootsFixture.roots.filter((root) => !root.missing);
    state.filesActive = 0;
    state.filesQuery = "";
    state.filesSearching = false;
    state.filesElsewhere = false;
  });

  it("renders music roots from FilesContext", () => {
    const host = document.getElementById("files-panel");
    expect(host).toBeTruthy();
    const root = renderPanel(host as HTMLElement);
    expect(host?.textContent).toContain("Music (dj)");
    expect(host?.textContent).toContain("/Users/dj/Music");
    expect(host?.textContent).toContain("Music (GIGDRIVE)");
    expect(host?.querySelectorAll(".files-root-detail")).toHaveLength(2);
    expect((host?.querySelector("#files-up") as HTMLButtonElement).disabled).toBe(true);
    expect(host?.querySelector("#files-path [aria-current='page']")?.textContent).toBe("Music folders");
    root.unmount();
  });
});
