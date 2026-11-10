/**
 * Crate tree and crate actions render from CrateContext.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../app/providers";
import { bindCrateActions, emitCrates } from "../crate-store";
import { el } from "../dom";
import { setLocale } from "../i18n";
import { state } from "../state";
import { installPage } from "../test-page";
import { CrateActions } from "./CrateActions";
import { CrateBrowserActions } from "./CrateBrowserActions";
import { CrateTree } from "./CrateTree";

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
    bindCrateActions({ select, create, split });
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: [
            createElement(CrateTree, { key: "tree" }),
            createElement(CrateActions, { key: "actions" }),
            createElement(CrateBrowserActions, { key: "browser" }),
          ],
        }),
      );
    });
    const names = [...host.querySelectorAll<HTMLElement>(".name")].map((node) => node.textContent ?? "");
    expect(names).toEqual(["All tracks", "House", "Deep"]);
    expect(host.querySelector(".swatch")).not.toBeNull();
    expect(host.querySelector(".smart")?.textContent).toBe("smart");
    expect(host.querySelector<HTMLButtonElement>("#crate-new")?.textContent).toBe("New");
    expect(host.querySelector<HTMLButtonElement>("#crate-new")?.disabled).toBe(false);
    expect(host.querySelector<HTMLButtonElement>("#crate-rename")?.disabled).toBe(true);
    expect(host.querySelector<HTMLButtonElement>("#crate-split")?.getAttribute("aria-pressed")).toBe("false");

    host.querySelector<HTMLButtonElement>('.crate[data-id="2"]')?.click();
    expect(select).toHaveBeenCalledWith(2, expect.any(MouseEvent));
    host.querySelector<HTMLButtonElement>("#crate-new")?.click();
    expect(create).toHaveBeenCalledTimes(1);
    host.querySelector<HTMLButtonElement>("#crate-split")?.click();
    expect(split).toHaveBeenCalledTimes(1);

    state.activeCrate = 2;
    emitCrates();
    expect(host.querySelector<HTMLButtonElement>("#crate-rename")?.disabled).toBe(false);
    expect(host.querySelector<HTMLButtonElement>('.crate[data-id="2"]')?.getAttribute("aria-selected")).toBe("true");
    root.unmount();
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
});
