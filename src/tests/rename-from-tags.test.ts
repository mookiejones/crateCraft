/**
 * Rename from tags: crate and Files bodies, skipped rows, crate confirm.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bridge } from "../lib/bridge";
import { wireDialogs } from "../lib/ui/dialogs";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";
import { unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { drainReactScheduler, installPage } from "./test-page";
import * as views from "../lib/ui/views";

const fetchMock = vi.fn();
const posts: Record<string, unknown>[] = [];

function filesReply(body: Record<string, unknown>) {
  return {
    ok: true,
    json: async () => body,
  };
}

beforeEach(() => {
  installPage();
  setLocale("en");
  posts.length = 0;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === "POST" && String(url) === "/api/files") {
      posts.push(JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>);
      return filesReply({
        ok: true,
        needs_confirm: true,
        summary: "Rename 1 file to Artist - Title. 1 library track keeps its crates.",
        warning: "Skip other.mp3: already named Artist - Same.mp3.",
        skipped: ["Skip other.mp3: already named Artist - Same.mp3."],
        changes: [{ from: "/music/same-a.mp3", to: "/music/Artist - Same.mp3", effect: "move", crates: ["Warmup"] }],
      });
    }
    return filesReply({ telemetry_consent: false, wizard_complete: true });
  });
  vi.stubGlobal("fetch", fetchMock);
  state.writable = true;
  state.space = "Serato Library";
  state.mode = "crates";
  state.activeCrate = 5;
  state.crates = [{ id: 5, name: "Warmup" }];
  state.filesSelected = new Set(["/music/same-a.mp3"]);
  state.filesEntries = [{ name: "same-a.mp3", kind: "file", path: "/music/same-a.mp3", in_library: true }];
  vi.spyOn(views, "loadLibrary").mockResolvedValue(undefined);
  vi.spyOn(views, "loadFolder").mockResolvedValue(undefined);
  vi.spyOn(views, "setNotice").mockImplementation(() => undefined);
  vi.spyOn(bridge, "reloadLibrary").mockResolvedValue(undefined);
  vi.spyOn(bridge, "setNotice").mockImplementation(() => undefined);
  wireDialogs();
});

afterEach(async () => {
  unmountSharedDialogs();
  await drainReactScheduler();
  vi.unstubAllGlobals();
  setLocale("en");
});

describe("rename from tags", () => {
  it("posts crate members from the crate button", async () => {
    document.querySelector<HTMLButtonElement>("#crate-rename-from-tags")?.click();
    await vi.waitFor(() => {
      expect(document.querySelector("#files-changes")?.textContent).toContain("Skip other.mp3");
    });
    expect(posts[0]).toEqual({
      action: "rename_from_tags",
      crate: 5,
      space: "Serato Library",
    });
    const review = document.getElementById("files-dialog-title")?.closest('[role="dialog"]');
    expect(review).toBeTruthy();
    expect(review?.className).toContain("MuiDialog-paper");
    expect((document.querySelector("#files-review") as HTMLElement).hidden).toBe(true);
    expect(document.querySelector("#files-changes")?.textContent).toContain("Artist - Same.mp3");
    expect(document.querySelector("#files-confirm")?.className).toContain("MuiButton-root");
  });

  it("posts selected files from the Files button", async () => {
    state.mode = "files";
    document.querySelector<HTMLButtonElement>("#files-rename-from-tags")?.click();
    await vi.waitFor(() => expect(posts.length).toBe(1));
    expect(posts[0]).toEqual({
      action: "rename_from_tags",
      paths: ["/music/same-a.mp3"],
    });
  });

  it("stays on crates after a crate confirm", async () => {
    document.querySelector<HTMLButtonElement>("#crate-rename-from-tags")?.click();
    const confirm = document.querySelector<HTMLButtonElement>("#files-confirm");
    await vi.waitFor(() => expect(confirm?.disabled).toBe(false));
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST" && String(url) === "/api/files") {
        posts.push(JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>);
        return filesReply({
          ok: true,
          summary: "Rename 1 file to Artist - Title. 1 library track keeps its crates.",
        });
      }
      return filesReply({});
    });
    confirm?.click();
    await vi.waitFor(() => expect(posts.length).toBe(2));
    expect(posts[1]).toMatchObject({
      action: "rename_from_tags",
      crate: 5,
      space: "Serato Library",
      confirm: true,
    });
    await vi.waitFor(() => {
      expect(bridge.setNotice).toHaveBeenCalledWith(
        "Rename 1 file to Artist - Title. 1 library track keeps its crates.",
      );
    });
    expect(bridge.reloadLibrary).toHaveBeenCalled();
    expect(views.loadFolder).not.toHaveBeenCalled();
    expect(state.mode).toBe("crates");
  });
});
