/**
 * Detail pane chips, empty cards, collapse memory, and the actions menu.
 *
 * Counts come from the track already on the page. A closed card stays
 * closed when the next track opens. Nothing here writes the library.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MuiThemeRoot } from "../../app/mui-theme-root";
import { PlayerProvider } from "../../app/providers";
import { TrackDetailPane } from "../../components/TrackDetail";
import { TrackListProvider, type TrackListContextValue } from "../../containers/TrackListContext";
import type { Crate, Track } from "../../lib/api-types";
import { setLocale } from "../../lib/i18n";
import { attachMedia, mountPlayer, type PlayableMedia } from "../../lib/player/player";
import { state } from "../../lib/state";
import {
  DETAIL_JUMP_LOCK_MS,
  applyDetailSections,
  resetDetailSectionsForTests,
} from "../../lib/ui/detail-sections";
import { getTrackListActions, readTrackList } from "../../lib/ui/track-list-store";
import { unmountTrackList } from "../../lib/ui/virtual-scroll";
import { drainReactScheduler, installPage } from "../test-page";

class FakeAudio extends EventTarget implements PlayableMedia {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  paused = true;
  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
}

type ObserverEntry = { target: Element; isIntersecting: boolean };

class FakeObserver {
  static all: FakeObserver[] = [];
  readonly observed: Element[] = [];
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];

  constructor(
    private readonly callback: (entries: ObserverEntry[]) => void,
    options: IntersectionObserverInit = {},
  ) {
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? "";
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
    FakeObserver.all.push(this);
  }

  observe(node: Element): void {
    this.observed.push(node);
  }

  unobserve(): void {}

  disconnect(): void {}

  takeRecords(): ObserverEntry[] {
    return [];
  }

  fire(target: Element, isIntersecting: boolean): void {
    this.callback([{ target, isIntersecting }]);
  }
}

const fetchMock = vi.fn();
const scrolled: Array<{ node: HTMLElement; options: ScrollIntoViewOptions }> = [];
let reduceMotion = false;
let originalScroll: typeof HTMLElement.prototype.scrollIntoView;

function track(id: number, name: string, extra: Partial<Track> = {}): Track {
  return {
    id,
    name,
    title: name,
    artist: "Ada",
    bpm: 128,
    key: "8A",
    album: "Live",
    length: "3:10",
    edit: { name, artist: "Ada" },
    serato: { writable: true, file_manager: "Finder" },
    file_on_disk: true,
    ...extra,
  };
}

const house: Crate = { id: 2, name: "House", smart: false };
const warmup: Crate = { id: 9, name: "Warmup", smart: true };
const otherSmart: Crate = { id: 10, name: "Other smart", smart: true };

function value(partial: Partial<TrackListContextValue> = {}): TrackListContextValue {
  return {
    ...readTrackList(),
    ...getTrackListActions(),
    space: "Serato Library",
    mode: "crates",
    writable: true,
    crates: [house, warmup, otherSmart],
    duplicateGroupSelected: false,
    ...partial,
  };
}

function chipTexts(host: ParentNode): string[] {
  return [...host.querySelectorAll(".detail-chip")].map((node) => node.textContent ?? "");
}

function sectionIds(host: ParentNode): string[] {
  return [...host.querySelectorAll("[data-detail-section]")].map(
    (node) => node.getAttribute("data-detail-section") ?? "",
  );
}

function settingsBodies(): unknown[] {
  return fetchMock.mock.calls
    .filter((call) => String(call[0]) === "/api/settings")
    .map((call) => JSON.parse(String((call[1] as RequestInit).body)) as unknown);
}

function detailObserver(): FakeObserver {
  const found = FakeObserver.all.find((item) => item.rootMargin === "-8% 0px -75% 0px");
  if (!found) throw new Error("detail observer missing");
  return found;
}

describe("TrackDetail sections", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    installPage();
    attachMedia(new FakeAudio());
    mountPlayer();
    setLocale("en");
    reduceMotion = false;
    scrolled.length = 0;
    FakeObserver.all = [];
    resetDetailSectionsForTests();
    state.space = "Serato Library";
    state.writable = true;
    originalScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function scrollIntoView(
      this: HTMLElement,
      arg?: boolean | ScrollIntoViewOptions,
    ) {
      const options = typeof arg === "object" && arg ? arg : {};
      scrolled.push({ node: this, options });
    };
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: reduceMotion && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      const href = String(url);
      if (href.includes("/api/related")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ saved: [{ id: 1 }, { id: 2 }], suggested: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    flushSync(() => root.unmount());
    host.remove();
    HTMLElement.prototype.scrollIntoView = originalScroll;
    resetDetailSectionsForTests();
    unmountTrackList();
    vi.unstubAllGlobals();
    await drainReactScheduler();
    setLocale("en");
  });

  function paint(open: Track, extra: Partial<TrackListContextValue> = {}): void {
    flushSync(() => {
      root.render(
        createElement(MuiThemeRoot, {
          children: createElement(PlayerProvider, {
            children: createElement(TrackListProvider, {
              value: value({
                detail: { kind: "track", track: open },
                selectedId: open.id,
                ...extra,
              }),
              children: createElement(TrackDetailPane),
            }),
          }),
        }),
      );
    });
  }

  it("counts chips in page order and keeps eight pads when a cue exists", async () => {
    const open = track(4, "Night", {
      resolved_path: "/Music/Night.mp3",
      color: 0xcc0000,
      cues: [{ index: 0, start_ms: 1500, color: "#CC0000", name: "Drop" }],
      loops: [{ index: 0, start_ms: 1000, end_ms: 2000, name: "Loop" }],
      flips: [{ index: 0, name: "Flip", enabled: true }],
      beatgrid: [{ position: "0.500", beats: 4 }, { position: "2.000", bpm: 128 }],
      crate_ids: [2, 9],
      copies: [{ id: 9, file: "night-copy.mp3" }],
      groups: [{ name: "Genre", fields: [{ label: "Genre", column: "genre", display: "House" }] }],
    });
    paint(open);
    expect(chipTexts(host)[0]).toBe("Mixes well");
    expect(sectionIds(host)).toEqual(["related", "markers", "crates", "copies", "fields"]);
    expect(chipTexts(host).slice(1)).toEqual([
      "Cues · 3",
      "Crates · 2",
      "Copies · 1",
      "Tags · 1",
    ]);
    expect(host.querySelector("#detail-section-markers h3")?.textContent).toBe("Cue points · 3");
    expect(host.querySelectorAll("#detail-section-markers .marker").length).toBeGreaterThanOrEqual(8);
    expect(host.textContent).toContain("Drop");
    expect(host.textContent).toContain("Empty");
    expect(host.textContent).toContain("View only. This app does not rewrite the beatgrid.");
    expect(host.textContent).toContain("128 BPM");
    expect(host.querySelector(".detail-swatch-empty")).toBeNull();
    const swatch = host.querySelector(".detail-swatch") as HTMLElement;
    expect(swatch.style.background).not.toBe("");
    await vi.waitFor(() => {
      expect(chipTexts(host)[0]).toBe("Mixes well · 2");
    });
    expect(host.querySelector("#detail-section-related .related-search")).not.toBeNull();
    expect(host.querySelector("#detail-section-related.detail-card-empty")).toBeNull();
    expect(host.querySelectorAll(".detail-chip[aria-current='true']")).toHaveLength(1);
  });

  it("uses one line for an empty cue card and still shows a beatgrid with no cues", () => {
    paint(track(4, "Bare", {
      cues: [],
      loops: [],
      flips: [],
      beatgrid: [],
      markers_found: false,
    }));
    const empty = host.querySelector("#detail-section-markers");
    expect(empty?.textContent).toBe("No cue points");
    expect(empty?.querySelector(".detail-card-toggle")).toBeNull();
    expect(empty?.querySelector(".marker")).toBeNull();
    expect(host.textContent).not.toContain("No Serato cue points in this file.");
    expect(chipTexts(host)).toContain("Cues · 0");

    paint(track(5, "Grid", {
      cues: [],
      loops: [],
      flips: [],
      beatgrid: [{ position: "2.000", bpm: 128 }],
      markers_found: false,
    }));
    expect(host.querySelector("#detail-section-markers h3")?.textContent).toBe("Cue points · 0");
    expect(host.textContent).toContain("No Serato cue points in this file.");
    expect(host.textContent).toContain("128 BPM");
    expect(host.querySelector("#detail-section-markers .marker-slot")).toBeNull();
    expect(host.querySelector("#detail-section-markers .marker")).not.toBeNull();
    expect(host.querySelector("#detail-section-markers .detail-card-toggle")).not.toBeNull();
  });

  it("keeps the missing-file note and does not invent pads", () => {
    paint(track(4, "Gone", {
      markers_unavailable: true,
      cues: [{ index: 0, start_ms: 1500, name: "Drop" }],
      beatgrid: [{ position: "2.000", bpm: 128 }],
      file_on_disk: false,
    }));
    expect(host.textContent).toContain("The file is not on disk, so cues cannot be read.");
    expect(host.textContent).not.toContain("No cue points");
    expect(host.querySelector("#detail-section-markers .marker")).toBeNull();
    expect(chipTexts(host)).toContain("Cues · 1");
    expect(host.textContent).not.toContain("View only. This app does not rewrite the beatgrid.");
  });

  it("keeps crate checkboxes when membership is empty and the library has crates", () => {
    paint(track(4, "Night", { crate_ids: [] }));
    const card = host.querySelector("#detail-section-crates");
    expect(card?.classList.contains("detail-card-empty")).toBe(false);
    expect(card?.textContent).toContain("House");
    expect(card?.textContent).not.toContain("No crates");
    expect(card?.textContent).not.toContain("Warmup");
    const boxes = card?.querySelectorAll("input[type=checkbox]") ?? [];
    expect(boxes).toHaveLength(1);
    expect((boxes[0] as HTMLInputElement).checked).toBe(false);
    expect(chipTexts(host)).toContain("Crates · 0");

    paint(track(4, "Night", { crate_ids: [9] }));
    const member = host.querySelector("#detail-section-crates");
    expect(member?.textContent).toContain("House");
    expect(member?.textContent).toContain("Smart crates: Warmup");
    expect(member?.textContent).not.toContain("Other smart");
    expect(member?.querySelectorAll("input[type=checkbox]")).toHaveLength(1);
    expect(chipTexts(host)).toContain("Crates · 1");

    paint(track(4, "Night", { crate_ids: [9] }), { crates: [] });
    const empty = host.querySelector("#detail-section-crates");
    expect(empty?.textContent).toBe("No crates");
    expect(empty?.querySelector("input")).toBeNull();
    expect(chipTexts(host)).toContain("Crates · 1");
  });

  it("always shows Copies and Tags, including the zero line", () => {
    paint(track(4, "Night", { copies: [], groups: [] }));
    expect(host.querySelector("#detail-section-copies")?.textContent).toBe("No other copies");
    expect(host.querySelector("#detail-section-fields")?.textContent).toBe("No tags");
    expect(chipTexts(host)).toContain("Copies · 0");
    expect(chipTexts(host)).toContain("Tags · 0");
    expect(host.querySelector("#detail-section-related.detail-card-empty")).toBeNull();
    expect(host.querySelector("#detail-section-related .detail-card-toggle")).not.toBeNull();
    expect(host.textContent).toContain("This track has no file path, so it cannot be linked.");
    expect(chipTexts(host)[0]).toBe("Mixes well · 0");
  });

  it("shows an em dash for a zero BPM and a quiet swatch for white", () => {
    paint(track(4, "Night", { bpm: 0, key: "", length: "", color: "#ffffff" }));
    const meta = host.querySelector(".detail-meta")?.textContent ?? "";
    expect(meta).toContain("—");
    expect(meta).not.toContain("0");
    expect(host.querySelector(".detail-swatch-empty")).not.toBeNull();
    expect(host.querySelector("h2")?.textContent).toBe("Night");
  });

  it("remembers a closed card across tracks and posts the whole map", () => {
    const first = track(4, "Night", {
      cues: [{ index: 0, start_ms: 1500, name: "Drop" }],
      beatgrid: [{ position: "2.000", bpm: 128 }],
    });
    paint(first);
    const toggle = host.querySelector<HTMLButtonElement>("#detail-section-markers .detail-card-toggle");
    expect(toggle?.textContent).toBe("Hide");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    flushSync(() => toggle?.click());
    expect(host.querySelector("#detail-section-body-markers")?.hasAttribute("hidden")).toBe(true);
    expect(host.textContent).toContain("Drop");
    expect(settingsBodies()).toEqual([
      { layout: { detail_sections: { markers: false } } },
    ]);

    paint(track(8, "Dawn", {
      cues: [{ index: 0, start_ms: 800, name: "Intro" }],
      beatgrid: [{ position: "1.000", bpm: 120 }],
    }));
    expect(host.querySelector("#detail-section-body-markers")?.hasAttribute("hidden")).toBe(true);
    expect(host.querySelector("#detail-section-markers .detail-card-toggle")?.textContent).toBe("Show");
    expect(host.textContent).toContain("Intro");

    flushSync(() => {
      host.querySelector<HTMLButtonElement>("#detail-section-markers .detail-card-toggle")?.click();
    });
    expect(host.querySelector("#detail-section-body-markers")?.hasAttribute("hidden")).toBe(false);
    expect(settingsBodies()[1]).toEqual({ layout: { detail_sections: {} } });
  });

  it("keeps the search-copies control mounted when Tags is closed", () => {
    paint(track(4, "Night", {
      groups: [{
        name: "Search copies",
        fields: [{ label: "Title", column: "title", display: "Night" }],
      }],
    }));
    const finder = () => host.querySelector("#detail-section-body-fields button");
    expect(finder()?.textContent).toBe("Search copies, 1 field");
    flushSync(() => {
      host.querySelector<HTMLButtonElement>("#detail-section-fields .detail-card-toggle")?.click();
    });
    expect(host.querySelector("#detail-section-body-fields")?.hasAttribute("hidden")).toBe(true);
    expect(finder()?.textContent).toBe("Search copies, 1 field");
  });

  it("applies a saved map and drops unknown ids", () => {
    applyDetailSections({ markers: false, nope: true, copies: 1, fields: true });
    paint(track(4, "Night", {
      cues: [{ index: 0, start_ms: 1500, name: "Drop" }],
      beatgrid: [{ position: "2.000", bpm: 128 }],
      copies: [{ id: 9, file: "night-copy.mp3" }],
      groups: [{ name: "Genre", fields: [{ label: "Genre", column: "genre", display: "House" }] }],
    }));
    expect(host.querySelector("#detail-section-body-markers")?.hasAttribute("hidden")).toBe(true);
    expect(host.querySelector("#detail-section-body-copies")?.hasAttribute("hidden")).toBe(false);
    expect(host.querySelector("#detail-section-body-fields")?.hasAttribute("hidden")).toBe(false);
    expect(settingsBodies()).toEqual([]);
  });

  it("jumps with smooth scroll, or auto when motion is reduced", () => {
    host.className = "detail";
    paint(track(4, "Night", {
      cues: [{ index: 0, start_ms: 1500, name: "Drop" }],
      beatgrid: [{ position: "2.000", bpm: 128 }],
    }));
    const observer = detailObserver();
    expect(observer.root).toBe(host);
    expect(observer.thresholds).toEqual([0, 0.1]);
    const cues = [...host.querySelectorAll<HTMLButtonElement>(".detail-chip")]
      .find((node) => node.textContent === "Cues · 1");
    flushSync(() => cues?.click());
    expect(scrolled.at(-1)?.options).toEqual({ block: "start", behavior: "smooth" });
    expect(scrolled.at(-1)?.node.getAttribute("data-detail-section")).toBe("markers");
    expect(cues?.getAttribute("aria-current")).toBe("true");

    reduceMotion = true;
    flushSync(() => {
      [...host.querySelectorAll<HTMLButtonElement>(".detail-chip")]
        .find((node) => (node.textContent ?? "").startsWith("Crates"))
        ?.click();
    });
    expect(scrolled.at(-1)?.options).toEqual({ block: "start", behavior: "auto" });
    expect(scrolled.at(-1)?.node.getAttribute("data-detail-section")).toBe("crates");
  });

  it("keeps the clicked chip while the spy still sees the top card", () => {
    vi.useFakeTimers();
    try {
      paint(track(4, "Night", {
        cues: [{ index: 0, start_ms: 1500, name: "Drop" }],
      }));
      const related = host.querySelector("#detail-section-related");
      if (!(related instanceof HTMLElement)) throw new Error("related missing");
      const cues = [...host.querySelectorAll<HTMLButtonElement>(".detail-chip")]
        .find((node) => node.textContent === "Cues · 1");
      flushSync(() => cues?.click());
      flushSync(() => detailObserver().fire(related, true));
      expect(cues?.getAttribute("aria-current")).toBe("true");
      vi.advanceTimersByTime(DETAIL_JUMP_LOCK_MS);
      flushSync(() => detailObserver().fire(related, true));
      expect(host.querySelector(".detail-chip[aria-current='true']")?.textContent).toBe("Mixes well · 0");
    } finally {
      vi.useRealTimers();
    }
  });

  it("follows the first intersecting section and resets when the track changes", () => {
    paint(track(4, "Night", {
      cues: [{ index: 0, start_ms: 1500, name: "Drop" }],
    }));
    expect(detailObserver().root).toBeNull();
    const markers = host.querySelector("#detail-section-markers");
    const related = host.querySelector("#detail-section-related");
    if (!(markers instanceof HTMLElement) || !(related instanceof HTMLElement)) {
      throw new Error("sections missing");
    }
    flushSync(() => detailObserver().fire(markers, true));
    expect(host.querySelector(".detail-chip[aria-current='true']")?.textContent).toBe("Cues · 1");
    flushSync(() => detailObserver().fire(related, true));
    expect(host.querySelector(".detail-chip[aria-current='true']")?.textContent).toBe("Mixes well · 0");
    expect(host.querySelectorAll(".detail-chip[aria-current='true']")).toHaveLength(1);

    paint(track(8, "Dawn", {
      cues: [{ index: 0, start_ms: 800, name: "Intro" }],
    }));
    expect(host.querySelector(".detail-chip[aria-current='true']")?.textContent).toBe("Mixes well · 0");
  });

  it("puts track actions in one menu and adds Merge only for a duplicate group", () => {
    paint(track(4, "Night", { file_on_disk: false }));
    flushSync(() => host.querySelector<HTMLButtonElement>("#detail-actions")?.click());
    expect(document.querySelector("#detail-actions")?.getAttribute("aria-haspopup")).toBe("menu");
    expect(document.querySelector("#detail-reveal")).not.toBeNull();
    expect(document.querySelector("#detail-prepare")).not.toBeNull();
    expect(document.querySelector("#detail-relocate")?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(document.querySelector("#detail-remove")).not.toBeNull();
    expect(document.querySelector("#detail-queue")).not.toBeNull();
    expect(document.querySelector("#detail-use-in-crates")).not.toBeNull();
    expect((document.querySelector("#detail-reveal") as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector("#detail-merge")).toBeNull();

    paint(track(4, "Night"), { mode: "duplicates", duplicateGroupSelected: false });
    flushSync(() => host.querySelector<HTMLButtonElement>("#detail-actions")?.click());
    expect(document.querySelector("#detail-merge")).toBeNull();

    paint(track(4, "Night"), { mode: "duplicates", duplicateGroupSelected: true });
    flushSync(() => host.querySelector<HTMLButtonElement>("#detail-actions")?.click());
    expect(document.querySelector("#detail-merge")?.textContent).toBe("Merge copies");
    expect((document.querySelector("#detail-reveal") as HTMLButtonElement).disabled).toBe(false);
  });

  it("leaves a history row as a plain field list", () => {
    flushSync(() => {
      root.render(
        createElement(MuiThemeRoot, {
          children: createElement(PlayerProvider, {
            children: createElement(TrackListProvider, {
              value: value({
                detail: {
                  kind: "entry",
                  entry: { id: 3, name: "Old set", artist: "Ada", entry: true },
                },
              }),
              children: createElement(TrackDetailPane),
            }),
          }),
        }),
      );
    });
    expect(host.querySelector(".detail-chip")).toBeNull();
    expect(host.querySelector("#detail-actions")).toBeNull();
    expect(host.querySelector("h2")?.textContent).toBe("Old set");
  });
});
