/**
 * Genre families on Tag spellings (#365).
 *
 * Move saves the map. Preview and Apply are the note write.
 */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postJSON } from "../../lib/api";
import { GenreFamilies } from "../../components/GenreFamilies";
import { setLocale } from "../../lib/i18n";
import { state } from "../../lib/state";

vi.mock("../../lib/api", () => ({
  postJSON: vi.fn(),
}));

const report = {
  ok: true,
  parents: { House: null, "Tech House": "House" },
  families: [{ name: "House", tracks: 3, children: [{ name: "Tech House", tracks: 1 }] }],
  saved: false,
};

const moved = {
  ...report,
  parents: { House: null, "Tech House": null },
  families: [
    { name: "House", tracks: 2, children: [] },
    { name: "Tech House", tracks: 1, children: [] },
  ],
  saved: true,
};

const plan = {
  field: "grouping",
  changes: [{ id: 1, from: "", to: "House" }],
  blocked: [{ id: 2, from: "keep me", to: "House" }],
  written: false,
};

describe("GenreFamilies", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    setLocale("en");
    state.space = "Serato Library";
    vi.mocked(postJSON).mockReset();
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => report,
    })));
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    vi.unstubAllGlobals();
  });

  async function mount(): Promise<void> {
    await act(async () => {
      root.render(createElement(GenreFamilies, { writable: true, paused: false, revision: 1 }));
    });
  }

  it("posts reparent when Move is clicked", async () => {
    vi.mocked(postJSON).mockResolvedValue(moved);
    await mount();
    const genre = host.querySelector<HTMLSelectElement>("#genre-family-genre");
    expect(genre?.value).toBe("House");
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    await act(async () => {
      setter?.call(genre, "Tech House");
      genre?.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const parent = host.querySelector<HTMLSelectElement>("#genre-family-parent");
    expect(parent?.querySelectorAll("option").length).toBe(2);
    await act(async () => {
      host.querySelector<HTMLButtonElement>('[data-family-action="move"]')?.click();
    });
    expect(postJSON).toHaveBeenCalledWith("/api/genre-families", {
      action: "reparent",
      space: "Serato Library",
      genre: "Tech House",
      parent: null,
    });
    expect(host.querySelector("#genre-families-status")?.textContent).toContain("Tech House");
    expect(host.querySelector("details")).toBeNull();
  });

  it("posts a preview and then a confirmed apply", async () => {
    vi.mocked(postJSON).mockResolvedValueOnce(plan).mockResolvedValueOnce({ ...plan, written: true });
    await mount();
    expect(host.querySelector<HTMLButtonElement>('[data-family-action="apply"]')?.disabled).toBe(true);
    await act(async () => {
      host.querySelector<HTMLButtonElement>('[data-family-action="preview"]')?.click();
    });
    expect(postJSON).toHaveBeenCalledWith("/api/genre-families", {
      action: "write-preview",
      space: "Serato Library",
      field: "grouping",
      overwrite: false,
    });
    expect(host.querySelector("#genre-families-plan")?.textContent).toContain("Track 2");
    const apply = host.querySelector<HTMLButtonElement>('[data-family-action="apply"]');
    expect(apply?.disabled).toBe(false);
    await act(async () => {
      apply?.click();
    });
    expect(postJSON).toHaveBeenLastCalledWith("/api/genre-families", {
      action: "write-apply",
      space: "Serato Library",
      field: "grouping",
      overwrite: false,
      confirm: true,
    });
  });
});
