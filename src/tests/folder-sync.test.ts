import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import {
  folderSyncDoneText,
  folderSyncHasWork,
  folderSyncPreviewText,
  readFolderSyncForm,
  syncFolderSyncButton,
} from "../lib/crates/folder-sync-view";
import { openFolderSyncDialog, previewFolderSync, runFolderSync, wireFolderSync } from "../lib/crates/folder-sync";
import { state } from "../lib/state";
import { unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { drainReactScheduler, installPage } from "./test-page";
import * as views from "../lib/ui/views";

vi.mock("../lib/ui/views", () => ({
  loadLibrary: vi.fn(async () => undefined),
  lockDown: vi.fn(),
  setNotice: vi.fn(),
}));

interface Call {
  url: string;
  body: Record<string, unknown>;
}

let calls: Call[] = [];

/** Answer each POST with the next reply, recording the URL and body. */
function answer(...replies: Array<{ status?: number; body: unknown }>) {
  const queue = [...replies];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
      const next = queue.shift();
      if (!next) throw new Error(`unexpected request to ${url}`);
      return new Response(JSON.stringify(next.body), {
        status: next.status ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

beforeEach(() => {
  installPage();
  setLocale("en");
  calls = [];
  state.space = "Serato Library";
  state.writable = true;
  state.mode = "crates";
  state.activeCrate = 5;
  state.crates = [
    { id: 5, name: "Bar set" },
    { id: 6, name: "Peak", smart: true },
  ];
  vi.mocked(views.loadLibrary).mockClear();
  vi.mocked(views.lockDown).mockClear();
  vi.mocked(views.setNotice).mockClear();
});

afterEach(async () => {
  unmountSharedDialogs();
  await drainReactScheduler();
  vi.unstubAllGlobals();
  setLocale("en");
});

describe("readFolderSyncForm", () => {
  it("needs a folder path", () => {
    expect(readFolderSyncForm()).toBeNull();
    el("folder-sync-path").value = "  /Music/Mix  ";
    el("folder-sync-subcrates").checked = true;
    el("folder-sync-full").checked = true;
    expect(readFolderSyncForm()).toEqual({ folder: "/Music/Mix", subcrates: true, full: true });
  });
});

describe("folderSyncPreviewText", () => {
  it("names add, remove, and skip counts", () => {
    expect(folderSyncHasWork({ added: 2, removed: 1, created: 0 })).toBe(true);
    expect(folderSyncHasWork({ added: 0, removed: 0, created: 1 })).toBe(true);
    expect(folderSyncHasWork({ added: 0, removed: 0, created: 0 })).toBe(false);
    expect(folderSyncPreviewText({ added: 2, removed: 1, skipped_count: 3 })).toBe(
      "2 to add, 1 to remove. 3 files not in the library.",
    );
    expect(folderSyncPreviewText({ added: 0, removed: 0, created: 0, skipped_count: 1 })).toBe(
      "Already in sync. 1 files not in the library.",
    );
    expect(folderSyncDoneText({ written: true, crate: { name: "Mix" }, added: 2, removed: 0 })).toBe(
      "Mix updated: 2 added, 0 removed.",
    );
    expect(folderSyncDoneText({ written: false, crate: { name: "Mix" } })).toBe("Mix already matches that folder.");
  });
});

describe("syncFolderSyncButton", () => {
  it("disables All tracks, smart crates, and a read-only library", () => {
    syncFolderSyncButton();
    expect(el("crate-folder-sync").disabled).toBe(false);
    expect(el("crate-rename-from-tags").disabled).toBe(false);
    state.activeCrate = "all";
    syncFolderSyncButton();
    expect(el("crate-folder-sync").disabled).toBe(true);
    expect(el("crate-rename-from-tags").disabled).toBe(true);
    state.activeCrate = 6;
    syncFolderSyncButton();
    expect(el("crate-folder-sync").disabled).toBe(true);
    expect(el("crate-rename-from-tags").disabled).toBe(true);
    state.activeCrate = 5;
    state.writable = false;
    syncFolderSyncButton();
    expect(el("crate-folder-sync").disabled).toBe(true);
    expect(el("crate-rename-from-tags").disabled).toBe(true);
  });
});

describe("previewFolderSync", () => {
  it("posts the form and disables Sync when nothing would change", async () => {
    el("folder-sync-path").value = "/Music/Mix";
    answer({ body: { added: 0, removed: 0, created: 0, skipped_count: 2 } });
    await previewFolderSync();
    expect(calls[0]).toEqual({
      url: "/api/folder-sync",
      body: { action: "preview", space: "Serato Library", crate: 5, folder: "/Music/Mix", subcrates: false, full: false },
    });
    expect(el("folder-sync-run").disabled).toBe(true);
    expect(el("folder-sync-preview").textContent).toContain("Already in sync");
  });

  it("enables Sync when the plan would write", async () => {
    el("folder-sync-path").value = "/Music/Mix";
    el("folder-sync-subcrates").checked = true;
    answer({ body: { added: 4, removed: 0, created: 1, skipped_count: 0 } });
    await previewFolderSync();
    expect(calls[0]?.body.subcrates).toBe(true);
    expect(el("folder-sync-run").disabled).toBe(false);
  });
});

describe("runFolderSync", () => {
  it("writes, closes, and reloads", async () => {
    wireFolderSync();
    el("folder-sync-path").value = "/Music/Mix";
    el("folder-sync-dialog").showModal();
    answer({ body: { written: true, added: 2, removed: 0, crate: { name: "Bar set" } } });
    await runFolderSync();
    expect(calls[0]?.body).toMatchObject({ action: "sync", crate: 5, folder: "/Music/Mix" });
    expect(el("folder-sync-dialog").open).toBe(false);
    expect(views.setNotice).toHaveBeenCalledWith("Bar set updated: 2 added, 0 removed.");
    expect(views.loadLibrary).toHaveBeenCalled();
  });
});

describe("openFolderSyncDialog", () => {
  it("stays closed when no crate is selected", async () => {
    state.activeCrate = "all";
    await openFolderSyncDialog();
    expect(el("folder-sync-dialog").open).toBe(false);
    expect(views.setNotice).toHaveBeenCalled();
  });
});
