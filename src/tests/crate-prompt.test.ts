/**
 * Crate new/rename/color and Save view use a MUI dialog, not window.prompt.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";
import { cancelCratePrompt, setCratePromptValue } from "../lib/ui/shared-dialog";
import { mountSharedDialogs, unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { createCrate, renameCrate } from "../lib/ui/views";
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
        return new Response(JSON.stringify({ ok: true, id: 9, name: "Warmup" }), {
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

describe("crate prompt dialog", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    calls = [];
    state.space = "Serato Library";
    state.writable = true;
    state.rootId = 1;
    state.activeCrate = "all";
    state.crates = [{ id: 2, name: "House", parent: 1 }];
    vi.stubGlobal("prompt", () => {
      throw new Error("window.prompt should not run");
    });
    mountSharedDialogs();
  });

  afterEach(async () => {
    if (el("crate-prompt-dialog").open) cancelCratePrompt();
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("opens a labelled MUI dialog for New and posts on confirm", async () => {
    answer();
    const pending = createCrate();
    await vi.waitFor(() => expect(el("crate-prompt-dialog").open).toBe(true));
    const dialog = el("crate-prompt-dialog").querySelector("[role='dialog']");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("crate-prompt-title");
    expect(el("crate-prompt-title").textContent).toBe("New crate name");
    setCratePromptValue("Warmup");
    el("crate-prompt-confirm").click();
    await pending;
    expect(calls).toEqual([
      {
        url: "/api/crate",
        body: { action: "create", name: "Warmup", parent: 1, space: "Serato Library" },
      },
    ]);
    expect(el("crate-prompt-dialog").open).toBe(false);
  });

  it("posts nothing on cancel", async () => {
    answer();
    const pending = createCrate();
    await vi.waitFor(() => expect(el("crate-prompt-dialog").open).toBe(true));
    el("crate-prompt-cancel").click();
    await pending;
    expect(calls).toEqual([]);
    expect(el("crate-prompt-dialog").open).toBe(false);
  });

  it("posts nothing on Esc", async () => {
    answer();
    const pending = createCrate();
    await vi.waitFor(() => expect(el("crate-prompt-dialog").open).toBe(true));
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    }));
    await pending;
    expect(calls).toEqual([]);
    expect(el("crate-prompt-dialog").open).toBe(false);
  });

  it("opens rename with the current name and skips an unchanged confirm", async () => {
    answer();
    state.activeCrate = 2;
    const pending = renameCrate();
    await vi.waitFor(() => expect(el("crate-prompt-dialog").open).toBe(true));
    expect(el("crate-prompt-title").textContent).toBe("Rename crate");
    expect(el("crate-prompt-input").value).toBe("House");
    el("crate-prompt-confirm").click();
    await pending;
    expect(calls).toEqual([]);
  });
});
