import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPrivacy, rankReplaceCandidates, rekordboxExportUrl, renderCratesReplacePreview, renderMergePreview, saveRekordboxExport, wireDialogs } from "../lib/ui/dialogs";
import { el } from "../lib/dom";
import { state } from "../lib/state";
import { mountSharedDialogs, unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { parkSharedDialogBucket } from "../pages/SharedDialogs";
import { drainReactScheduler, installPage } from "./test-page";
import { playlistCrate, renderShell } from "../lib/ui/views";

describe("rekordboxExportUrl", () => {
  beforeEach(() => {
    installPage();
    state.mode = "crates";
    state.space = "Serato Library";
    state.activeCrate = "all";
  });

  it("builds the report and download URLs from the current space and crate", () => {
    const memory = document.getElementById("rekordbox-memory") as HTMLInputElement;
    const hotLoops = document.getElementById("rekordbox-hot-loops") as HTMLInputElement;
    const key = document.getElementById("rekordbox-key") as HTMLSelectElement;
    memory.checked = true;
    hotLoops.checked = false;
    key.value = "camelot";
    expect(rekordboxExportUrl(false)).toBe(
      "/api/export.rekordbox.xml?space=Serato%20Library&crate=all&memory=1&hot_loops=0&key=camelot",
    );
    expect(rekordboxExportUrl(true)).toBe(
      "/api/export.rekordbox.xml?space=Serato%20Library&crate=all&memory=1&hot_loops=0&key=camelot&report=1",
    );
    hotLoops.checked = true;
    expect(rekordboxExportUrl(false)).toContain("hot_loops=1");
    state.mode = "history";
    state.activeCrate = 4;
    memory.checked = false;
    hotLoops.checked = false;
    expect(playlistCrate()).toBeNull();
    expect(rekordboxExportUrl(false)).toContain("crate=all");
    expect(rekordboxExportUrl(false)).toContain("memory=0");
    expect(rekordboxExportUrl(false)).toContain("hot_loops=0");
  });
});

describe("playlist export chrome", () => {
  beforeEach(() => {
    installPage();
    state.mode = "crates";
    state.space = "Serato Library";
    state.activeCrate = "all";
  });

  afterEach(async () => {
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
  });

  it("paints Rekordbox, merge, relink, sharing, Find art, preset, and folder-sync as labelled MUI dialogs", () => {
    mountSharedDialogs();
    const labelled = [
      ["rekordbox-dialog", "rekordbox-title"],
      ["merge-dialog", "merge-title"],
      ["relink-dialog", "relink-title"],
      ["consent-dialog", "consent-title"],
      ["album-art-dialog", "album-art-title"],
      ["preset-dialog", "preset-title"],
      ["folder-sync-dialog", "folder-sync-title"],
      ["crates-replace-dialog", "crates-replace-title"],
    ] as const;
    for (const [id, title] of labelled) {
      const root = document.getElementById(id);
      expect(root?.getAttribute("data-shared-dialog")).toBe(id);
      const dialog = root?.querySelector("[role='dialog']");
      expect(dialog?.getAttribute("aria-labelledby")).toBe(title);
      el(id).showModal();
      expect(el(id).open).toBe(true);
      expect(root?.getAttribute("data-open")).toBe("true");
      el(id).close();
      expect(el(id).open).toBe(false);
    }
    expect(el("rekordbox-dialog").contains(el("rekordbox-memory"))).toBe(true);
  });

  it("hides adopted bodies that remain in #shared-dialogs", () => {
    mountSharedDialogs();
    const host = document.getElementById("shared-dialogs");
    expect(host).toBeInstanceOf(HTMLElement);
    const parked = [...host!.querySelectorAll("[data-shared-bucket]")];
    for (const bucket of parked) {
      expect(bucket).toBeInstanceOf(HTMLElement);
      expect((bucket as HTMLElement).hidden).toBe(true);
    }
    expect(el("rekordbox-dialog").contains(el("rekordbox-memory"))).toBe(true);
    expect(el("rekordbox-dialog").open).toBe(false);
  });

  it("keeps Memory cues, Hot loops, and the key in the Rekordbox dialog", () => {
    const dialog = el("rekordbox-dialog");
    expect(dialog.contains(el("rekordbox-memory"))).toBe(true);
    expect(dialog.contains(el("rekordbox-hot-loops"))).toBe(true);
    expect(dialog.contains(el("rekordbox-key"))).toBe(true);
    const bar = document.querySelector(".browser-bar");
    expect(bar?.contains(el("rekordbox-memory"))).toBe(false);
    expect(bar?.contains(el("rekordbox-hot-loops"))).toBe(false);
    expect(bar?.contains(el("rekordbox-key"))).toBe(false);
  });

  it("shows Export, Import, and Rekordbox only on Crates", () => {
    renderShell();
    expect(el("export-m3u").hidden).toBe(false);
    expect(el("export-rekordbox").hidden).toBe(false);
    expect(el("import-m3u").hidden).toBe(false);
    expect(playlistCrate()).toBe("all");
    for (const mode of ["history", "missing", "duplicates", "stems"] as const) {
      state.mode = mode;
      renderShell();
      expect(el("export-m3u").hidden).toBe(true);
      expect(el("export-rekordbox").hidden).toBe(true);
      expect(el("import-m3u").hidden).toBe(true);
      expect(playlistCrate()).toBeNull();
    }
    state.mode = "crates";
    state.activeCrate = 4;
    renderShell();
    expect(el("export-m3u").hidden).toBe(false);
    expect(playlistCrate()).toBe(4);
  });

  it("does not fetch Rekordbox XML from History", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ xml: "<?xml version=\"1.0\"?><DJ_PLAYLISTS/>", report: [] }),
    } as Response);
    state.mode = "history";
    wireDialogs();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();
    el("export-rekordbox").click();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(el("rekordbox-dialog").open).toBe(false);
  });
});

describe("parkSharedDialogBucket", () => {
  beforeEach(() => {
    installPage();
  });

  it("hides a bucket parked on the host when the paper is missing", () => {
    const host = document.getElementById("shared-dialogs") as HTMLDivElement;
    const bucket = document.createElement("div");
    bucket.setAttribute("data-shared-bucket", "rekordbox-dialog");
    parkSharedDialogBucket(bucket, null, host);
    expect(bucket.parentElement).toBe(host);
    expect(bucket.hidden).toBe(true);
  });

  it("moves a bucket into the paper before the MUI root is bound", () => {
    const host = document.getElementById("shared-dialogs") as HTMLDivElement;
    const paper = document.createElement("div");
    document.body.appendChild(paper);
    const bucket = document.createElement("div");
    bucket.setAttribute("data-shared-bucket", "rekordbox-dialog");
    host.appendChild(bucket);
    parkSharedDialogBucket(bucket, paper, host);
    expect(bucket.parentElement).toBe(paper);
    expect(bucket.hidden).toBe(false);
  });
});

function settingsResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("Rekordbox export settings", () => {
  beforeEach(() => {
    installPage();
    state.mode = "crates";
    state.space = "Serato Library";
    state.activeCrate = "all";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(async () => {
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
  });

  function hotLoops(): HTMLInputElement {
    return el("rekordbox-hot-loops");
  }

  function memoryCues(): HTMLInputElement {
    return el("rekordbox-memory");
  }

  function keyNotation(): HTMLSelectElement {
    return el("rekordbox-key");
  }

  it("loads the saved bar and leaves the HTML defaults when nothing is stored", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(settingsResponse({
      telemetry_consent: null,
      needs_consent_prompt: false,
      rekordbox: { hot_loops: false, memory_cues: true, key_notation: "asis" },
    }));
    await loadPrivacy();
    expect(hotLoops().checked).toBe(false);
    expect(memoryCues().checked).toBe(true);
    expect(keyNotation().value).toBe("asis");
    expect(rekordboxExportUrl(false)).toContain("hot_loops=0");
    expect(rekordboxExportUrl(false)).toContain("memory=1");
    expect(rekordboxExportUrl(false)).toContain("key=asis");
  });

  it("restores hot loops, memory cues, and the key notation", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(settingsResponse({
      telemetry_consent: false,
      needs_consent_prompt: false,
      rekordbox: { hot_loops: true, memory_cues: false, key_notation: "classical" },
    }));
    await loadPrivacy();
    expect(hotLoops().checked).toBe(true);
    expect(memoryCues().checked).toBe(false);
    expect(keyNotation().value).toBe("classical");
    expect(rekordboxExportUrl(false)).toContain("hot_loops=1");
    expect(rekordboxExportUrl(false)).toContain("memory=0");
    expect(rekordboxExportUrl(false)).toContain("key=classical");
  });

  it("posts the three controls when one of them changes", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(settingsResponse({
      needs_consent_prompt: false,
      rekordbox: { hot_loops: false, memory_cues: true, key_notation: "asis" },
    }));
    wireDialogs();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();
    fetchMock.mockResolvedValue(settingsResponse({
      rekordbox: { hot_loops: true, memory_cues: false, key_notation: "camelot" },
    }));
    hotLoops().checked = true;
    memoryCues().checked = false;
    keyNotation().value = "camelot";
    hotLoops().dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("/api/settings");
    const init = call?.[1];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      rekordbox: { hot_loops: true, memory_cues: false, key_notation: "camelot" },
    });
  });

  it("keeps the export working when settings cannot be loaded", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(loadPrivacy()).rejects.toThrow(/offline|fetch/i);
    expect(hotLoops().checked).toBe(false);
    expect(memoryCues().checked).toBe(true);
    expect(keyNotation().value).toBe("camelot");
    expect(rekordboxExportUrl(false)).toContain("hot_loops=0");
    expect(rekordboxExportUrl(false)).toContain("memory=1");
    expect(rekordboxExportUrl(false)).toContain("key=camelot");
    fetchMock.mockResolvedValue(settingsResponse({ error: "nope" }, false));
    await expect(loadPrivacy()).rejects.toThrow(/nope/);
    expect(rekordboxExportUrl(true)).toContain("report=1");
  });

  it("keeps a changed box when the save fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(settingsResponse({ error: "nope" }, false));
    hotLoops().checked = true;
    await saveRekordboxExport();
    expect(hotLoops().checked).toBe(true);
    expect(rekordboxExportUrl(false)).toContain("hot_loops=1");
    fetchMock.mockRejectedValue(new Error("offline"));
    memoryCues().checked = false;
    await saveRekordboxExport();
    expect(memoryCues().checked).toBe(false);
    expect(rekordboxExportUrl(false)).toContain("memory=0");
  });
});

describe("renderMergePreview", () => {
  beforeEach(() => {
    installPage();
  });

  it("names a planned cue and beatgrid copy", () => {
    renderMergePreview({
      crates_added: [],
      crates_kept: [],
      spaces_added: [],
      fields: [],
      history_repointed: true,
      history_entries: 0,
      removed: [{ id: 2 }],
      files: [],
      cue_copy: {
        file: "dup.mp3",
        markers: true,
        beatgrid: true,
        status: "planned",
      },
    });
    expect(el("merge-preview").textContent).toContain(
      "dup.mp3 has the better cues and beatgrid. They will be copied onto the file you keep.",
    );
    expect(el("merge-preview").querySelector(".merge-warning")).toBeNull();
  });

  it("shows the cue warning when frames cannot be copied", () => {
    renderMergePreview({
      crates_added: [],
      crates_kept: [],
      spaces_added: [],
      fields: [],
      history_repointed: true,
      history_entries: 0,
      removed: [{ id: 2 }],
      files: [],
      cue_warning: "dup.mp3 has Serato cues, loops, flips, or a beatgrid.",
    });
    expect(el("merge-preview").querySelector(".merge-warning")?.textContent).toContain(
      "dup.mp3 has Serato cues",
    );
    expect(el("merge-preview").textContent).not.toContain("will be copied");
  });
});

describe("renderCratesReplacePreview", () => {
  beforeEach(() => {
    installPage();
  });

  it("names crates the replacement will join", () => {
    renderCratesReplacePreview({
      crates_added: [{ name: "Warmup", space: "Serato Library", list_order: 3 }],
      crates_kept: [{ name: "Closing", space: "Serato Library" }],
      crates_removed: [],
      retire: false,
    });
    expect(el("crates-replace-preview").textContent).toContain("Add the replacement to Warmup.");
    expect(el("crates-replace-preview").textContent).not.toContain("Remove the original");
  });

  it("says the replacement is already in those crates", () => {
    renderCratesReplacePreview({
      crates_added: [],
      crates_kept: [{ name: "Closing", space: "Serato Library" }],
      crates_removed: [{ name: "Closing", space: "Serato Library" }],
      retire: true,
    });
    expect(el("crates-replace-preview").textContent).toContain("already in those crates");
    expect(el("crates-replace-preview").textContent).toContain("Remove the original from Closing.");
  });

  it("says there are no normal crates", () => {
    renderCratesReplacePreview({
      crates_added: [],
      crates_kept: [],
      crates_removed: [],
      retire: false,
    });
    expect(el("crates-replace-preview").textContent).toContain("not in any normal crate");
  });
});

describe("rankReplaceCandidates", () => {
  beforeEach(() => {
    state.tracks = [
      { id: 1, file: "old.mp3", name: "Old", artist: "A" },
      { id: 2, file: "intro.mp3", name: "Intro Edit", artist: "A" },
      { id: 3, file: "other.wav", name: "Other", artist: "B" },
    ];
  });

  afterEach(() => {
    state.tracks = [];
  });

  it("excludes the original and pins a chosen replacement", () => {
    const ranked = rankReplaceCandidates(1, "", 3);
    expect(ranked.map((track) => track.id)).toEqual([3, 2]);
  });

  it("scores file, title, and artist and still pins the chosen id", () => {
    const ranked = rankReplaceCandidates(1, "intro", 3);
    expect(ranked.map((track) => track.id)).toEqual([3, 2]);
  });
});

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("relink missing files", () => {
  beforeEach(() => {
    installPage();
    state.mode = "missing";
    state.space = "Serato Library";
    state.writable = true;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(async () => {
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
  });

  function mockFetch(handler: (url: string, init?: RequestInit) => Response): void {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("/api/settings")) {
        return jsonResponse({
          telemetry_consent: null,
          needs_consent_prompt: false,
          rekordbox: { hot_loops: false, memory_cues: true, key_notation: "asis" },
        });
      }
      if (url.startsWith("/api/library")) {
        return jsonResponse({ tracks: [], crates: [] });
      }
      return handler(url, init);
    });
  }

  it("scans, ticks high matches, lets you pick, and posts preview then confirm", async () => {
    mockFetch((url, init) => {
      if (url.startsWith("/api/relink")) {
        expect(url).toContain("space=Serato+Library");
        expect(url).toContain("root=%2FVolumes%2FNEW%2FDJ");
        return jsonResponse({
          missing: 2,
          scanned: 4,
          truncated: false,
          unavailable_drives: [],
          remaps: [],
          matches: [
            {
              asset_id: 1,
              title: "Gone <script>",
              artist: "Ada",
              stored: "/OLD/gone.mp3",
              candidates: [
                { path: "/NEW/gone.mp3", confidence: "high", reason: "same name and size" },
              ],
            },
            {
              asset_id: 2,
              title: "Twin",
              artist: "Bea",
              stored: "/OLD/twin.mp3",
              candidates: [
                { path: "/NEW/twin-a.mp3", confidence: "medium", reason: "same name" },
                { path: "/NEW/twin-b.mp3", confidence: "medium", reason: "same size" },
              ],
            },
          ],
        });
      }
      if (url === "/api/files") {
        const body = JSON.parse(String(init?.body)) as {
          action: string;
          confirm?: boolean;
          matches: { id: number; path: string }[];
        };
        expect(body.action).toBe("relink");
        expect(body.matches).toEqual([
          { id: 1, path: "/NEW/gone.mp3" },
          { id: 2, path: "/NEW/twin-b.mp3" },
        ]);
        if (!body.confirm) {
          return jsonResponse({
            ok: true,
            needs_confirm: true,
            summary: "Point 2 missing tracks at the matched files.",
            warning: "Cue tags were not found on 1 of the new files. That may be a different edit.",
          });
        }
        return jsonResponse({
          ok: true,
          summary: "Point 2 missing tracks at the matched files.",
          warning: "Cue tags were not found on 1 of the new files. That may be a different edit.",
        });
      }
      throw new Error(`unexpected ${url}`);
    });
    wireDialogs();
    (document.getElementById("relink-root") as HTMLInputElement).value = "/Volumes/NEW/DJ";
    (document.getElementById("open-relink") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(document.getElementById("relink-rows")?.querySelectorAll("tr")).toHaveLength(2);
    });
    const dialog = document.getElementById("relink-dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(document.getElementById("relink-rows")?.textContent).toContain("Gone <script>");
    expect(document.getElementById("relink-rows")?.querySelector("script")).toBeNull();
    const boxes = [...document.querySelectorAll<HTMLInputElement>("#relink-rows input[type=checkbox]")];
    expect(boxes[0]?.checked).toBe(true);
    expect(boxes[1]?.checked).toBe(false);
    (document.getElementById("relink-accept-high") as HTMLButtonElement).click();
    expect(document.querySelectorAll<HTMLInputElement>("#relink-rows input[type=checkbox]")[0]?.checked).toBe(true);
    const pick = document.querySelector("#relink-rows select") as HTMLSelectElement;
    expect(pick).toBeTruthy();
    pick.value = "/NEW/twin-b.mp3";
    pick.dispatchEvent(new Event("change"));
    const afterPick = document.querySelector("#relink-rows select") as HTMLSelectElement;
    expect(afterPick.value).toBe("/NEW/twin-b.mp3");
    document.querySelectorAll<HTMLInputElement>("#relink-rows input[type=checkbox]")[1]!.checked = true;
    document.querySelectorAll<HTMLInputElement>("#relink-rows input[type=checkbox]")[1]!.dispatchEvent(new Event("change"));
    (document.getElementById("relink-confirm") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(dialog.open).toBe(false));
    const posts = vi.mocked(fetch).mock.calls.filter((call) => call[0] === "/api/files");
    expect(posts).toHaveLength(2);
    expect(JSON.parse(String(posts[0]?.[1]?.body)).confirm).toBeUndefined();
    expect(JSON.parse(String(posts[1]?.[1]?.body)).confirm).toBe(true);
    expect(document.getElementById("notice")?.textContent).toContain("Cue tags were not found");
  });

  it("stops on a preview that is not ok and does not write", async () => {
    mockFetch((url, init) => {
      if (url.startsWith("/api/relink")) {
        return jsonResponse({
          matches: [
            {
              asset_id: 1,
              title: "Gone",
              candidates: [{ path: "/NEW/gone.mp3", confidence: "high", reason: "same name and size" }],
            },
          ],
        });
      }
      if (url === "/api/files") {
        const body = JSON.parse(String(init?.body)) as { confirm?: boolean };
        expect(body.confirm).toBeUndefined();
        return jsonResponse({ ok: false, error: "Quit Serato DJ first." });
      }
      throw new Error(`unexpected ${url}`);
    });
    wireDialogs();
    (document.getElementById("open-relink") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(document.getElementById("relink-rows")?.querySelectorAll("tr")).toHaveLength(1);
    });
    (document.getElementById("relink-confirm") as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(document.getElementById("relink-status")?.textContent).toBe("Quit Serato DJ first.");
    });
    const posts = vi.mocked(fetch).mock.calls.filter((call) => call[0] === "/api/files");
    expect(posts).toHaveLength(1);
    expect((document.getElementById("relink-dialog") as HTMLDialogElement).open).toBe(true);
  });
});
