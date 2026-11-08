import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TagClusterPlan, TagClusters } from "./api-types";
import { bridge } from "./bridge";
import { setLocale } from "./i18n";
import { state } from "./state";
import { loadTags, repaintTags, wireTags } from "./tags";
import { groupChanges, previewLines, tagsSummary } from "./tags-view";
import { installPage } from "./test-page";
import { applyStaticTooltips } from "./tooltip";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return { ...actual, postJSON };
});

const groups: TagClusters = {
  field: "genre",
  values: 4,
  groups: [
    {
      key: "hiphop",
      suggested: "Hip Hop",
      tracks: 5,
      spellings: [
        { value: "Hip Hop", count: 3 },
        { value: "Hip-Hop", count: 2 },
      ],
    },
    {
      key: "rnb",
      suggested: "R&B",
      tracks: 2,
      spellings: [
        { value: "R&B", count: 1 },
        { value: "rnb", count: 1 },
      ],
    },
  ],
};

const clear: TagClusters = { field: "genre", values: 3, groups: [] };

const preview: TagClusterPlan = {
  field: "genre",
  value: "Hip Hop",
  key: "hiphop",
  written: false,
  changes: [
    { id: 1, from: "Hip-Hop", to: "Hip Hop" },
    { id: 2, from: "Hip-Hop", to: "Hip Hop" },
  ],
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("tags-report")!.textContent || "";
}

function applyFor(key: string): HTMLButtonElement {
  return document.querySelector(`[data-tags-action="apply"][data-key="${key}"]`) as HTMLButtonElement;
}

function previewFor(key: string): HTMLButtonElement {
  return document.querySelector(`[data-tags-action="preview"][data-key="${key}"]`) as HTMLButtonElement;
}

describe("tag spelling helpers", () => {
  it("collapses the same from→to pair and keeps different pairs", () => {
    expect(groupChanges([
      { id: 1, from: "Hip-Hop", to: "Hip Hop" },
      { id: 2, from: "Hip-Hop", to: "Hip Hop" },
      { id: 3, from: "hiphop", to: "Hip Hop" },
    ])).toEqual([
      { from: "Hip-Hop", to: "Hip Hop", count: 2 },
      { from: "hiphop", to: "Hip Hop", count: 1 },
    ]);
  });

  it("names an empty genre space", () => {
    setLocale("en");
    expect(tagsSummary("genre", 8, 0)).toBe("Every genre in this space uses one spelling.");
    expect(previewLines(preview.changes)).toEqual(["Hip-Hop → Hip Hop (2 tracks)"]);
  });
});

describe("tags", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.tagsToken = 0;
    state.writable = true;
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(async () => {});
    bridge.lockDown = vi.fn();
    wireTags();
    document.getElementById("tags-panel")!.hidden = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the space field and paints groups", async () => {
    const fetchMock = vi.fn(async () => reply(groups));
    vi.stubGlobal("fetch", fetchMock);
    await loadTags();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tag-clusters?space=Serato%20Library&field=genre",
    );
    expect(document.getElementById("tags-scope")!.textContent).toBe("Whole space");
    expect(reportText()).toContain("4 genre spellings in this space. 2 groups");
    expect(reportText()).toContain("Hip Hop");
    expect(reportText()).toContain("Hip-Hop");
    expect(reportText()).toContain("Suggested");
    expect(applyFor("hiphop").disabled).toBe(true);
    expect(document.getElementById("tags-refresh")!.getAttribute("aria-busy")).toBe("false");
  });

  it("asks for artist when that field is pressed", async () => {
    const fetchMock = vi.fn(async () => reply({ ...groups, field: "artist" }));
    vi.stubGlobal("fetch", fetchMock);
    document.getElementById("tags-artist")!.click();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tag-clusters?space=Serato%20Library&field=artist",
    );
  });

  it("shows a clean report when every spelling is unique", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadTags();
    expect(reportText()).toContain("Every genre in this space uses one spelling.");
    expect(reportText()).not.toContain("Hip-Hop");
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadTags();
    const firstFinish = finish;
    const second = loadTags();
    finish(reply(clear));
    await second;
    firstFinish(reply(groups));
    await first;
    expect(reportText()).toContain("Every genre in this space uses one spelling.");
    expect(reportText()).not.toContain("Hip-Hop");
  });

  it("shows the server error sentence when the groups cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "Choose genre or artist.", code: "choose_genre_or_artist" }, 400)));
    await loadTags();
    expect(document.getElementById("tags-status")!.textContent).toBe("Choose genre or artist.");
    expect(document.activeElement).toBe(document.getElementById("tags-refresh"));
  });

  it("shows the unreachable sentence when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadTags();
    expect(document.getElementById("tags-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("reviews a spelling then enables Apply when the radio still matches", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(groups)));
    postJSON.mockResolvedValue(preview);
    await loadTags();
    previewFor("hiphop").click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalled());
    expect(postJSON).toHaveBeenCalledWith("/api/tag-clusters", {
      action: "preview",
      space: "Serato Library",
      field: "genre",
      value: "Hip Hop",
    });
    expect(document.getElementById("tags-status")!.textContent).toContain("2 tracks would become Hip Hop");
    expect(reportText()).toContain("Hip-Hop → Hip Hop (2 tracks)");
    expect(applyFor("hiphop").disabled).toBe(false);
  });

  it("disables Apply when the radio no longer matches the preview", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(groups)));
    postJSON.mockResolvedValue(preview);
    await loadTags();
    previewFor("hiphop").click();
    await vi.waitFor(() => expect(applyFor("hiphop").disabled).toBe(false));
    const other = document.querySelector<HTMLInputElement>("input[name='tags-hiphop'][value='Hip-Hop']")!;
    other.checked = true;
    other.dispatchEvent(new Event("change", { bubbles: true }));
    expect(applyFor("hiphop").disabled).toBe(true);
  });

  it("disables Apply while the library is locked", async () => {
    state.writable = false;
    vi.stubGlobal("fetch", vi.fn(async () => reply(groups)));
    postJSON.mockResolvedValue(preview);
    await loadTags();
    previewFor("hiphop").click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalled());
    expect(applyFor("hiphop").disabled).toBe(true);
  });

  it("applies the preview, reloads the library, and shows the written sentence", async () => {
    const fetchMock = vi.fn(async () => reply(groups));
    vi.stubGlobal("fetch", fetchMock);
    postJSON.mockResolvedValueOnce(preview);
    postJSON.mockResolvedValueOnce({ ...preview, written: true });
    await loadTags();
    previewFor("hiphop").click();
    await vi.waitFor(() => expect(applyFor("hiphop").disabled).toBe(false));
    applyFor("hiphop").click();
    await vi.waitFor(() => expect(bridge.reloadLibrary).toHaveBeenCalled());
    expect(postJSON).toHaveBeenLastCalledWith("/api/tag-clusters", {
      action: "apply",
      space: "Serato Library",
      field: "genre",
      value: "Hip Hop",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(document.getElementById("tags-status")!.textContent).toContain("Wrote Hip Hop on 2 tracks");
  });

  it("locks the page on a 409 and disables Apply", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(groups)));
    postJSON.mockResolvedValueOnce(preview);
    const locked = Object.assign(new Error("Quit Serato DJ before writing."), {
      status: 409,
      payload: { error: "Quit Serato DJ before writing.", serato: { writable: false } },
    });
    postJSON.mockRejectedValueOnce(locked);
    await loadTags();
    previewFor("hiphop").click();
    await vi.waitFor(() => expect(applyFor("hiphop").disabled).toBe(false));
    bridge.lockDown = vi.fn(() => {
      state.writable = false;
    });
    applyFor("hiphop").click();
    await vi.waitFor(() => expect(bridge.lockDown).toHaveBeenCalled());
    expect(document.getElementById("tags-status")!.textContent).toContain("Quit Serato DJ before writing.");
    expect(applyFor("hiphop").disabled).toBe(true);
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(groups)));
    vi.stubGlobal("fetch", fetchMock);
    await loadTags();
    setLocale("es");
    repaintTags();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("grafías de género");
    expect(reportText()).not.toContain("genre spellings");
    expect(document.getElementById("tags-scope")!.textContent).toBe("Todo el espacio");
  });

  it("gives every tags control a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(groups)));
    await loadTags();
    applyStaticTooltips();
    expect(document.getElementById("tags-genre")!.dataset.tooltipKey).toBe("tooltip.tagsGenre");
    expect(document.getElementById("tags-artist")!.dataset.tooltipKey).toBe("tooltip.tagsArtist");
    expect(document.getElementById("tags-refresh")!.dataset.tooltipKey).toBe("tooltip.tagsRefresh");
    expect(document.querySelector<HTMLElement>('[data-view="tags"]')!.dataset.tooltipKey).toBe("tooltip.viewTags");
    const untipped = [...document.querySelectorAll<HTMLElement>("#tags-panel button, #tags-panel input, #tags-panel summary")].filter(
      (node) => !node.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });
});
