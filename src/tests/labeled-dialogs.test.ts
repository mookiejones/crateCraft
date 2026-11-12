/**
 * Relocate, crate delete, remove from library, and related-link remove
 * use labeled MUI dialogs, not window.prompt or window.confirm.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Track } from "../lib/api-types";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";
import {
  cancelConfirm,
  cancelCratePrompt,
  setCratePromptValue,
} from "../lib/ui/shared-dialog";
import { mountSharedDialogs, unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import {
  deleteCrate,
  relocateTrack,
  removeTrack,
  selectTrack,
  unmountDetailIslands,
} from "../lib/ui/views";
import { drainReactScheduler, installPage } from "./test-page";

interface Call {
  url: string;
  body: Record<string, unknown>;
}

let calls: Call[] = [];

function answer(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      if (method === "POST") {
        calls.push({ url, body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
        return new Response(JSON.stringify({ ok: true, id: 9, name: "House" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (String(url).includes("/api/related")) {
        return new Response(JSON.stringify({
          saved: [{
            id: 12,
            mutual: true,
            track: { title: "Alpha", artist: "Bea", asset_id: 2, in_library: true },
          }],
          suggested: [],
          crate_name: "Related - Night",
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (String(url).includes("/api/track")) {
        return new Response(JSON.stringify(sampleTrack()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ tracks: [], crates: [], root: 1, spaces: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

function sampleTrack(): Track {
  return {
    id: 4,
    name: "Night",
    title: "Night",
    artist: "Ada",
    file_on_disk: true,
    resolved_path: "/music/night.mp3",
    in_prepare: false,
    crate_ids: [2],
    serato: { writable: true, file_manager: "Finder", message: "Serato is quit." },
    edit: { name: "Night", artist: "Ada", portable_id: "/music/night.mp3" },
  };
}

function pressEscape(): void {
  document.dispatchEvent(new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  }));
}

describe("labeled dialogs", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    calls = [];
    state.space = "Serato Library";
    state.writable = true;
    state.rootId = 1;
    state.activeCrate = 2;
    state.selectedId = 4;
    state.crates = [{ id: 2, name: "House", parent: 1 }];
    vi.stubGlobal("prompt", () => {
      throw new Error("window.prompt should not run");
    });
    vi.stubGlobal("confirm", () => {
      throw new Error("window.confirm should not run");
    });
    mountSharedDialogs();
  });

  afterEach(async () => {
    const prompt = document.getElementById("crate-prompt-dialog") as HTMLDialogElement | null;
    if (prompt?.open) cancelCratePrompt();
    const confirm = document.getElementById("confirm-dialog") as HTMLDialogElement | null;
    if (confirm?.open) cancelConfirm();
    unmountDetailIslands();
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("opens a labeled path dialog for Relocate and posts on confirm", async () => {
    answer();
    const pending = relocateTrack(sampleTrack());
    await vi.waitFor(() => expect(el("crate-prompt-dialog").open).toBe(true));
    const dialog = el("crate-prompt-dialog").querySelector("[role='dialog']");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("crate-prompt-title");
    expect(el("crate-prompt-title").textContent).toBe("Relocate");
    expect(document.querySelector("#crate-prompt-dialog label")?.textContent).toContain("Path to the audio file");
    expect(el("crate-prompt-input").value).toBe("/music/night.mp3");
    setCratePromptValue("/Volumes/USB/night.mp3");
    el("crate-prompt-confirm").click();
    await pending;
    expect(calls).toEqual([
      {
        url: "/api/track",
        body: { id: 4, space: "Serato Library", fields: { portable_id: "/Volumes/USB/night.mp3" } },
      },
    ]);
    expect(el("crate-prompt-dialog").open).toBe(false);
  });

  it("posts nothing when Relocate is cancelled", async () => {
    answer();
    const pending = relocateTrack(sampleTrack());
    await vi.waitFor(() => expect(el("crate-prompt-dialog").open).toBe(true));
    el("crate-prompt-cancel").click();
    await pending;
    expect(calls).toEqual([]);
    expect(el("crate-prompt-dialog").open).toBe(false);
  });

  it("posts nothing when Relocate is dismissed with Esc", async () => {
    answer();
    const pending = relocateTrack(sampleTrack());
    await vi.waitFor(() => expect(el("crate-prompt-dialog").open).toBe(true));
    pressEscape();
    await pending;
    expect(calls).toEqual([]);
    expect(el("crate-prompt-dialog").open).toBe(false);
  });

  it("opens a labeled confirm for Delete and posts on confirm", async () => {
    answer();
    const pending = deleteCrate();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    const dialog = el("confirm-dialog").querySelector("[role='dialog']");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("confirm-title");
    expect(dialog?.getAttribute("aria-describedby")).toBe("confirm-message");
    expect(el("confirm-title").textContent).toBe("Delete");
    expect(el("confirm-message").textContent).toContain("House");
    expect(el("confirm-confirm").textContent).toBe("Delete");
    el("confirm-confirm").click();
    await pending;
    expect(calls).toEqual([
      {
        url: "/api/crate",
        body: { action: "delete", id: 2, space: "Serato Library" },
      },
    ]);
    expect(el("confirm-dialog").open).toBe(false);
  });

  it("posts nothing when Delete is cancelled", async () => {
    answer();
    const pending = deleteCrate();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    el("confirm-cancel").click();
    await pending;
    expect(calls).toEqual([]);
    expect(el("confirm-dialog").open).toBe(false);
  });

  it("posts nothing when Delete is dismissed with Esc", async () => {
    answer();
    const pending = deleteCrate();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    pressEscape();
    await pending;
    expect(calls).toEqual([]);
    expect(el("confirm-dialog").open).toBe(false);
  });

  it("opens a labeled confirm for Remove from library and posts on confirm", async () => {
    answer();
    const pending = removeTrack(4);
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    expect(el("confirm-title").textContent).toBe("Remove from library");
    expect(el("confirm-message").textContent).toContain("audio file stays on disk");
    el("confirm-confirm").click();
    await pending;
    expect(calls).toEqual([
      {
        url: "/api/crate",
        body: { action: "remove_library", asset: 4, space: "Serato Library" },
      },
    ]);
    expect(el("confirm-dialog").open).toBe(false);
  });

  it("opens a labeled confirm for a related-link remove and posts on confirm", async () => {
    answer();
    const pending = selectTrack(4);
    await vi.waitUntil(() => document.querySelector("[data-related-crate]") !== null);
    await pending;
    const remove = document.querySelector<HTMLButtonElement>("[aria-label='Remove link to Alpha']");
    if (!remove) throw new Error("missing related remove");
    remove.click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    expect(el("confirm-title").textContent).toBe("Remove");
    expect(el("confirm-message").textContent).toContain("Alpha");
    el("confirm-confirm").click();
    await vi.waitFor(() => expect(calls).toEqual([
      { url: "/api/related", body: { action: "remove", id: 12 } },
    ]));
    expect(el("confirm-dialog").open).toBe(false);
  });

  it("unmounts shared dialogs so the MUI scheduler does not outlive the document", async () => {
    expect(document.querySelector("#confirm-dialog [role='dialog']")).not.toBeNull();
    unmountSharedDialogs();
    expect(document.querySelector("#confirm-dialog [role='dialog']")).toBeNull();
    await drainReactScheduler();
  });

  it("posts nothing when a related-link remove is cancelled", async () => {
    answer();
    const pending = selectTrack(4);
    await vi.waitUntil(() => document.querySelector("[data-related-crate]") !== null);
    await pending;
    const remove = document.querySelector<HTMLButtonElement>("[aria-label='Remove link to Alpha']");
    if (!remove) throw new Error("missing related remove");
    remove.click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    el("confirm-cancel").click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(false));
    expect(calls).toEqual([]);
  });
});
