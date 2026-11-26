import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GigReport } from "../lib/api-types";
import { loadGigCheck, repaintGig, wireGigCheck } from "../lib/gig/gig";
import { tagDiffText, tagEditLines } from "../lib/gig/gig-view";
import { setLocale, t } from "../lib/i18n";
import * as restore from "../lib/snapshots/restore";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { installPage } from "./test-page";

const report: GigReport = {
  ready: false,
  score: 72,
  hard_red: true,
  holding_it_back: [{ code: "missing_files", points: 8, hard_red: true, summary: "1 missing file." }],
  missing_files: [{ path: "/Music/gone.mp3", title: "Gone", artist: "A", crate: "Friday" }],
  unavailable_drives: [{ name: "GIGDRIVE", track_count: 2, crates: ["Friday"] }],
  streaming_tracks: [{ service: "Apple Music", path: "stream", title: "Cloud", artist: "A", crate: "Friday" }],
  empty_crates: [{ name: "Late", warning: "Serato may delete this crate when it closes." }],
  snapshot_note: "Latest snapshot: Before Friday on 2026-10-27.",
  snapshot_id: "snap-9",
  changes: {
    crates_added: ["Saturday"],
    crates_removed: [],
    crates_edited: [],
    tracks_added: [],
    tracks_removed: [],
    cues_edited: ["/Music/opener.mp3"],
    grids_edited: [],
    tags_edited: ["/Music/a.mp3"],
    tag_diffs: [{
      path: "/Music/a.mp3",
      fields: [
        { field: "title", before: "Mix", after: "Song" },
        { field: "bpm", before: "120", after: "240" },
      ],
    }],
  },
  scope: { space: "Serato Library", crate_id: 5, crate_name: "Friday" },
};

const clear: GigReport = {
  ready: true,
  score: 100,
  hard_red: false,
  holding_it_back: [],
  missing_files: [],
  unavailable_drives: [],
  streaming_tracks: [],
  empty_crates: [],
  snapshot_note: "",
  changes: {
    crates_added: [],
    crates_removed: [],
    crates_edited: [],
    tracks_added: [],
    tracks_removed: [],
    cues_edited: [],
    grids_edited: [],
    tags_edited: [],
  },
  scope: { space: "Serato Library", crate_id: null, crate_name: null },
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("gig-report")!.textContent || "";
}

function clickAction(action: string): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-gig-action="${action}"]`);
  if (!button) throw new Error(`missing ${action}`);
  button.click();
}

describe("gig", () => {
  beforeEach(() => {
    installPage();
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.gigToken = 0;
    state.crates = [{ id: 5, name: "Friday" }];
    wireGigCheck(() => {
      state.mode = "crates";
    });
    document.getElementById("gig-panel")!.hidden = false;
  });

  it("asks for the selected crate and paints the verdict, missing files, and changes", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadGigCheck();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/gig-check?space=Serato%20Library&crate=5&target=unknown",
    );
    const score = document.querySelector(".gig-score")!;
    expect(score.getAttribute("aria-label")).toBe("Ready score 72 out of 100, not ready");
    expect(score.textContent).toContain("72/100");
    expect(score.textContent).toContain("✕ Not ready");
    expect(reportText()).toContain("Step 1 of 6");
    expect(reportText()).toContain("GIGDRIVE");
    expect(reportText()).toContain("drive offline");
    clickAction("next");
    expect(reportText()).toContain("Step 2 of 6");
    expect(reportText()).toContain("/Music/gone.mp3");
    expect(reportText()).toContain("file missing");
    expect(reportText()).toContain("Locate missing files");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    expect(reportText()).toContain("Step 6 of 6");
    expect(reportText()).toContain("Crates added");
    expect(reportText()).toContain("Saturday");
    expect(reportText()).toContain("Cues edited");
    expect(reportText()).toContain("Tags edited");
    expect(reportText()).toContain("a.mp3: Title Mix → Song; BPM 120 → 240");
    expect(reportText()).toContain("Revert");
    expect(document.getElementById("gig-scope")!.textContent).toContain("Friday");
    expect(document.getElementById("gig-scope")!.textContent).not.toContain("Nothing is written");
    expect(document.getElementById("gig-refresh")!.getAttribute("aria-busy")).toBe("false");
    expect(document.getElementById("gig-refresh")!.hasAttribute("disabled")).toBe(false);
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadGigCheck();
    const firstFinish = finish;
    const second = loadGigCheck();
    finish(reply({ ...report, ready: true, score: 100, holding_it_back: [], unavailable_drives: [] }));
    await second;
    firstFinish(reply(report));
    await first;
    expect(document.querySelector(".gig-score")!.getAttribute("aria-label")).toBe("Ready score 100 out of 100, ready");
    expect(document.querySelector(".gig-score")!.textContent).toContain("✓ Ready");
    expect(document.querySelector(".gig-score")!.textContent).not.toContain("Not ready");
  });

  it("shows a server error in the status line and leaves the report", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "That crate is not in this space." }, 404)));
    await loadGigCheck();
    expect(document.getElementById("gig-status")!.textContent).toBe("That crate is not in this space.");
    expect(document.activeElement?.id).toBe("gig-refresh");
  });

  it("checks again without clearing the report, and focuses retry when the server is unreachable", async () => {
    const second = new Promise<Response>((_resolve, reject) => {
      reject(new TypeError("Failed to fetch"));
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply(report))
      .mockImplementationOnce(() => second);
    vi.stubGlobal("fetch", fetchMock);
    await loadGigCheck();
    expect(reportText()).toContain("GIGDRIVE");
    const refresh = document.getElementById("gig-refresh") as HTMLButtonElement;
    refresh.click();
    expect(refresh.disabled).toBe(true);
    expect(document.getElementById("gig-refresh")!.getAttribute("aria-busy")).toBe("true");
    expect(reportText()).toContain("GIGDRIVE");
    await vi.waitFor(() => {
      expect(document.getElementById("gig-status")!.textContent).toBe(
        "Couldn't reach the library server. Check it's running, then press Check again",
      );
    });
    expect(reportText()).toContain("GIGDRIVE");
    expect(document.activeElement?.id).toBe("gig-refresh");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("puts a long list in an Accordion group and can show every row", async () => {
    const missing = Array.from({ length: 101 }, (_, index) => ({
      path: `/Music/${index}.mp3`,
      title: "T",
      artist: "A",
      crate: "Friday",
    }));
    vi.stubGlobal("fetch", vi.fn(async () => reply({ ...report, missing_files: missing, unavailable_drives: [] })));
    await loadGigCheck();
    clickAction("next");
    const group = document.querySelector(".gig-group")!;
    const summary = group.querySelector<HTMLElement>(".MuiAccordionSummary-root")!;
    expect(summary.textContent).toContain("Missing files (101)");
    expect(summary.getAttribute("aria-expanded")).toBe("true");
    expect(group.querySelectorAll("li")).toHaveLength(100);
    const show = group.querySelector<HTMLButtonElement>("button.gig-show-all")!;
    expect(show.textContent).toBe("Show all 101");
    show.click();
    expect(group.querySelectorAll("li")).toHaveLength(101);
    expect(group.querySelector("button.gig-show-all")).toBeNull();
    expect(summary.tagName === "BUTTON" || summary.getAttribute("role") === "button").toBe(true);
    expect(summary.tabIndex).toBeGreaterThanOrEqual(0);
    expect(summary.getAttribute("aria-expanded")).toBe("true");
  });

  it("says when a step has nothing to fix", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadGigCheck();
    expect(reportText()).toContain("No drives are unplugged.");
    expect(document.querySelector(".gig-score")!.textContent).toContain("✓ Ready");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    expect(reportText()).toContain("Nothing changed since the last snapshot.");
    expect(reportText()).not.toContain("Latest snapshot");
    const notes = [...document.querySelectorAll(".gig-note")].map((node) => node.textContent);
    expect(notes.every((text) => text && text.trim().length > 0)).toBe(true);
  });

  it("walks the six steps, focuses each heading, and ends on the done screen", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    let left = false;
    wireGigCheck(() => {
      left = true;
    });
    await loadGigCheck();
    const panel = document.getElementById("gig-panel")!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    expect(document.getElementById("gig-tab")!.getAttribute("aria-controls")).toBe("gig-panel");
    expect(document.getElementById("gig-report")!.getAttribute("aria-live")).toBeNull();
    expect(document.getElementById("gig-status")!.getAttribute("aria-live")).toBe("polite");
    expect(document.activeElement?.id).toBe("gig-step-heading");
    const titles = ["Drives", "Missing files", "Cloud-only", "Streaming", "Empty crates", "Since last gig"];
    for (let index = 0; index < titles.length; index += 1) {
      expect(reportText()).toContain(`Step ${index + 1} of 6`);
      expect(document.getElementById("gig-step-heading")!.textContent).toBe(titles[index]);
      expect(document.activeElement?.id).toBe("gig-step-heading");
      clickAction("next");
    }
    expect(reportText()).not.toContain("Step 7 of 6");
    expect(document.getElementById("gig-step-heading")!.textContent).toBe("Done");
    expect(reportText()).toMatch(/Ready for the gig: 100\/100, checked the whole space at \d{1,2}:\d{2} [AP]M/);
    const art = document.getElementById("gig-ready-art")!;
    expect(art.dataset.slot).toBe("gig-ready");
    expect(art.childElementCount).toBe(0);
    clickAction("back");
    expect(reportText()).toContain("Step 6 of 6");
    clickAction("exit");
    expect(left).toBe(true);
  });
});

describe("gig in the active language", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.gigToken = 0;
    state.crates = [{ id: 5, name: "Friday" }];
    wireGigCheck(() => {
      state.mode = "crates";
    });
    document.getElementById("gig-panel")!.hidden = false;
  });

  afterEach(() => {
    setLocale("en");
    vi.unstubAllGlobals();
  });

  it("paints the score, step, and verdict in Spanish", async () => {
    setLocale("es");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    await loadGigCheck();
    const text = reportText();
    expect(text).toContain("72/100");
    expect(text).toContain("✕ No listo");
    expect(text).toContain("Paso 1 de 6");
    expect(text).toContain("Unidades");
    expect(text).toContain("GIGDRIVE: 2 pistas no disponibles");
    expect(text).not.toContain("Not ready");
    expect(document.querySelector(".gig-score")!.getAttribute("aria-label")).toBe(
      "Puntuación 72 de 100, no listo",
    );
    expect(document.querySelector('[data-gig-action="exit"]')!.textContent).toBe("Salir de la comprobación");
  });

  it("paints the XDJ-1000MK2 warning in Spanish", async () => {
    setLocale("es");
    const categories = ["TIME", "HOT CUE BANK", "FILE NAME", "BITRATE"];
    vi.stubGlobal("fetch", vi.fn(async () => reply({
      ...clear,
      deck_freeze: {
        player: "xdj-1000mk2",
        track_count: 14100,
        categories,
        summary: "This library has 14,100 tracks.",
      },
    })));
    await loadGigCheck();
    const warning = document.getElementById("gig-deck-freeze");
    expect(warning).not.toBeNull();
    expect(warning!.textContent).toBe(t("gig.deckFreeze", {
      count: 14100,
      categories: categories.join(", "),
    }));
    expect(warning!.textContent).toContain("congelarse");
    expect(warning!.textContent).toContain("Inactivo");
    for (const name of categories) expect(warning!.textContent).toContain(name);
    expect(warning!.textContent).not.toContain("may freeze");
    expect(warning!.textContent).not.toContain("CDJ-900");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadGigCheck();
    clickAction("next");
    expect(reportText()).toContain("Missing files");
    setLocale("es");
    repaintGig();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("Paso 2 de 6");
    expect(reportText()).toContain("Archivos que faltan");
    expect(reportText()).toContain("/Music/gone.mp3");
  });

  it("gives every gig control a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(report))));
    applyStaticTooltips();
    expect(document.getElementById("gig-refresh")!.dataset.tooltipKey).toBe("tooltip.gigRefresh");
    expect(document.getElementById("gig-target")!.dataset.tooltipKey).toBe("tooltip.gigTarget");
    expect(document.querySelector<HTMLElement>('[data-view="gig"]')!.dataset.tooltipKey).toBe("tooltip.viewGig");
    await loadGigCheck();
    const keys = (action: string): string | undefined =>
      document.querySelector<HTMLElement>(`[data-gig-action="${action}"]`)?.dataset.tooltipKey;
    expect(keys("back")).toBe("tooltip.gigBack");
    expect(keys("next")).toBe("tooltip.gigNext");
    expect(keys("exit")).toBe("tooltip.gigExit");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    expect(keys("revert")).toBe("tooltip.gigRevert");
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#gig-panel button")].filter(
      (button) => !button.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });

  it("warns only for a large library on an XDJ-1000MK2", async () => {
    const categories = ["TIME", "HOT CUE BANK", "FILE NAME", "BITRATE"];
    const freeze = {
      player: "xdj-1000mk2",
      track_count: 14100,
      categories,
      summary: "server summary stays off the page",
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const target = new URL(String(input), "http://127.0.0.1").searchParams.get("target");
      return reply(target === "xdj-1000mk2" ? { ...clear, deck_freeze: freeze } : clear);
    });
    vi.stubGlobal("fetch", fetchMock);
    await loadGigCheck();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("target=unknown");
    expect(document.getElementById("gig-deck-freeze")).toBeNull();
    expect(reportText()).not.toContain("may freeze");
    expect(reportText()).not.toContain("server summary");

    const select = document.getElementById("gig-target") as HTMLSelectElement;
    expect(select.value).toBe("unknown");
    select.value = "cdj-3000";
    select.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await Promise.all(fetchMock.mock.results.map((result) => result.value));
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("target=cdj-3000");
    expect(document.getElementById("gig-deck-freeze")).toBeNull();

    select.value = "xdj-1000mk2";
    select.dispatchEvent(new Event("change"));
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(document.getElementById("gig-deck-freeze")).not.toBeNull();
    });
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("target=xdj-1000mk2");
    const warning = document.getElementById("gig-deck-freeze");
    expect(warning).not.toBeNull();
    expect(warning!.textContent).toBe(t("gig.deckFreeze", {
      count: 14100,
      categories: categories.join(", "),
    }));
    for (const name of categories) expect(warning!.textContent).toContain(name);
    expect(warning!.textContent).toContain("14,100");
    expect(warning!.textContent).toContain("Inactive");
    expect(warning!.textContent).not.toContain("CDJ-900");
    expect(warning!.textContent).not.toContain("CDJ-2000NXS2");
    expect(warning!.textContent).not.toMatch(/other models/i);
    expect(warning!.getAttribute("role")).toBe("status");
  });

  it("uses the singular for one unavailable track", async () => {
    const one: GigReport = { ...report, unavailable_drives: [{ name: "USB", track_count: 1, crates: [] }] };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(reply(one))));
    await loadGigCheck();
    expect(reportText()).toContain("USB: 1 track unavailable");
    expect(reportText()).not.toContain("1 tracks");
  });

  it("formats title and BPM diffs and opens the restore plan", async () => {
    expect(tagDiffText({
      path: "C:\\Music\\a.mp3",
      fields: [
        { field: "title", before: "Mix", after: "Song" },
        { field: "bpm", before: "120", after: "240" },
      ],
    })).toBe("a.mp3: Title Mix → Song; BPM 120 → 240");
    expect(tagEditLines({
      crates_added: [],
      crates_removed: [],
      crates_edited: [],
      tracks_added: [],
      tracks_removed: [],
      cues_edited: [],
      grids_edited: [],
      tags_edited: ["C:\\Music\\b.mp3"],
    })).toEqual(["C:\\Music\\b.mp3"]);
    setLocale("es");
    try {
      expect(tagDiffText({
        path: "/Music/a.mp3",
        fields: [{ field: "title", before: "Mix", after: "Song" }],
      })).toBe("a.mp3: Título Mix → Song");
    } finally {
      setLocale("en");
    }

    const openPlan = vi.spyOn(restore, "openSnapshotPlan").mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadGigCheck();
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("revert");
    expect(openPlan).toHaveBeenCalledWith("snap-9");
  });

  it("hides Revert when there is no snapshot id and disables it while Serato is running", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ ...report, snapshot_id: "" })));
    await loadGigCheck();
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    expect(document.querySelector('[data-gig-action="revert"]')).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    state.seratoRunning = true;
    await loadGigCheck();
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    clickAction("next");
    const revert = document.querySelector<HTMLButtonElement>('[data-gig-action="revert"]');
    expect(revert).not.toBeNull();
    expect(revert!.disabled).toBe(true);
    state.seratoRunning = false;
  });
});
