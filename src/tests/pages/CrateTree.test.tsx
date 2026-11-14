/**
 * Crate tree and crate actions render from CrateContext.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../app/providers";
import { bindCrateActions, emitCrates } from "../../lib/crates/crate-store";
import { el } from "../../lib/dom";
import { setLocale } from "../../lib/i18n";
import { state } from "../../lib/state";
import { installPage } from "../test-page";
import { CrateActions } from "../../pages/CrateActions";
import { CrateBrowserActions } from "../../pages/CrateBrowserActions";
import { CrateTree } from "../../pages/CrateTree";

const appCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../static/app.css"),
  "utf8",
);

describe("CrateTree context", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.mode = "crates";
    state.writable = true;
    state.activeCrate = "all";
    state.secondCrate = "all";
    state.splitCrates = false;
    state.crateQuery = "";
    state.crateSort = "order";
    state.query = "";
    state.searchField = "";
    state.rootId = 1;
    state.tracks = [
      { id: 1, name: "Alpha" },
      { id: 2, name: "Beta" },
    ];
    state.crates = [
      { id: 2, name: "House", parent: 1, order: 0, color: 0xcc0000 },
      { id: 3, name: "Deep", parent: 2, order: 0, smart: true },
    ];
    state.crateTracks = new Map([[2, new Set([1])], [3, new Set([1, 2])]]);
    state.expanded = new Set([2]);
    state.presets = {};
  });

  it("paints the rail and actions from one crate context", () => {
    const select = vi.fn();
    const create = vi.fn();
    const split = vi.fn();
    const color = vi.fn();
    bindCrateActions({ select, create, split, color });
    const treeRoot = createRoot(el("crate-list"));
    const actionsRoot = createRoot(el("crate-actions"));
    const browserRoot = createRoot(el("crate-browser-actions"));
    flushSync(() => {
      treeRoot.render(createElement(AppProviders, { children: createElement(CrateTree) }));
      actionsRoot.render(createElement(AppProviders, { children: createElement(CrateActions) }));
      browserRoot.render(
        createElement(AppProviders, { children: createElement(CrateBrowserActions) }),
      );
    });
    const names = [...el("crate-list").querySelectorAll<HTMLElement>(".name")].map(
      (node) => node.textContent ?? "",
    );
    expect(names).toEqual(["All tracks", "House", "Deep"]);
    expect(el("crate-list").querySelector(".swatch")).not.toBeNull();
    expect(el("crate-list").querySelector(".smart")?.textContent).toBe("smart");
    expect(el("crate-new").textContent).toBe("New");
    expect(el("crate-new").disabled).toBe(false);
    expect(el("crate-new").className).toContain("MuiButton");
    expect(el("crate-rename").className).toContain("MuiButton");
    expect(el("crate-delete").className).toContain("MuiButton");
    expect(el("crate-actions-more").textContent).toBe("More");
    expect(el("crate-browser-more").textContent).toBe("More");
    const colorItem = document.querySelector("#crate-actions-menu #crate-color");
    const splitItem = document.querySelector("#crate-browser-menu #crate-split");
    expect(colorItem?.className).toContain("MuiMenuItem");
    expect(document.querySelector("#crate-actions-menu #crate-preset")?.className).toContain(
      "MuiMenuItem",
    );
    expect(document.querySelector("#crate-actions-menu #crate-folder-sync")?.className).toContain(
      "MuiMenuItem",
    );
    expect(splitItem?.className).toContain("MuiMenuItem");
    expect(document.querySelector("#crate-browser-menu #crate-save-view")?.className).toContain(
      "MuiMenuItem",
    );
    expect(document.querySelector("#crate-browser-menu #export-m3u")?.className).toContain(
      "MuiMenuItem",
    );
    expect(el("crate-rename").disabled).toBe(true);
    expect(splitItem?.getAttribute("aria-pressed")).toBe("false");

    el("crate-list").querySelector<HTMLButtonElement>('.crate[data-id="2"]')?.click();
    expect(select).toHaveBeenCalledWith(2, expect.any(MouseEvent));
    el("crate-new").click();
    expect(create).toHaveBeenCalledTimes(1);

    state.activeCrate = 2;
    emitCrates();
    expect(el("crate-rename").disabled).toBe(false);
    expect(colorItem).toBeInstanceOf(HTMLButtonElement);
    expect((colorItem as HTMLButtonElement).disabled).toBe(false);
    (colorItem as HTMLButtonElement).click();
    expect(color).toHaveBeenCalledTimes(1);
    (splitItem as HTMLButtonElement).click();
    expect(split).toHaveBeenCalledTimes(1);
    expect(
      el("crate-list").querySelector<HTMLButtonElement>('.crate[data-id="2"]')?.getAttribute(
        "aria-selected",
      ),
    ).toBe("true");
    treeRoot.unmount();
    actionsRoot.unmount();
    browserRoot.unmount();
  });

  it("keeps crate-list ids the page already uses", () => {
    bindCrateActions({});
    const root = createRoot(el("crate-list"));
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(CrateTree) }));
    });
    expect(el("crate-list").querySelector<HTMLButtonElement>(".crate")?.dataset.id).toBe("all");
    root.unmount();
  });

  it("does not force a 44px minHeight on crate action buttons", () => {
    const sources = import.meta.glob("../../pages/Crate*Actions.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
    });
    expect(Object.keys(sources)).toHaveLength(2);
    for (const [path, src] of Object.entries(sources)) {
      expect(src, path).not.toMatch(/minHeight:\s*44/);
    }
  });

  it("keeps the crate tree scrollable and primary actions on one row", () => {
    expect(appCss).toMatch(/#crate-actions\s*\{[^}]*flex-wrap:\s*nowrap/);
    expect(appCss).toMatch(/#crate-actions\s+\.MuiButton-root\s*\{[^}]*min-width:\s*0/);
    expect(appCss).toMatch(/\.crates\s*\{[^}]*overflow:\s*auto/);
  });
});
