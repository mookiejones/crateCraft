/**
 * Track list rows and the detail pane render from TrackListContext.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import type { Track } from "../api-types";
import { PlayerProvider } from "../app/providers";
import { TrackListProvider, type TrackListContextValue } from "../context/TrackListContext";
import { setLocale } from "../i18n";
import { attachMedia, mountPlayer, type PlayableMedia } from "../player";
import { ROW, state } from "../state";
import { installPage } from "../test-page";
import { getTrackListActions, readTrackList, setTrackDetail } from "../track-list-store";
import { mountTrackList, paintRows } from "../virtual-scroll";
import { BeatgridBlock } from "./BeatgridBlock";
import { CuePads } from "./CuePads";
import { TrackDetailPane } from "./TrackDetail";
import { TrackListWindow } from "./TrackListWindow";

class FakeAudio extends EventTarget implements PlayableMedia {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  paused = true;
  play(): Promise<void> {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
}

function track(id: number, name: string, extra: Partial<Track> = {}): Track {
  return { id, name, artist: "Ada", bpm: 124, key: "8A", ...extra };
}

function value(partial: Partial<TrackListContextValue> = {}): TrackListContextValue {
  return {
    ...readTrackList(),
    ...getTrackListActions(),
    ...partial,
  };
}

describe("TrackListContext", () => {
  beforeEach(() => {
    installPage();
    attachMedia(new FakeAudio());
    mountPlayer();
    setLocale("en");
    state.space = "Serato Library";
    state.mode = "crates";
    state.selectedId = 4;
    state.writable = false;
    state.view = [track(4, "Night"), track(5, "Dawn")];
    state.viewB = [];
    state.tracks = [...state.view];
    state.crates = [];
    state.duplicateIds = null;
    state.duplicateGroups = [];
    setTrackDetail({ kind: "none" });
  });

  it("paints virtualized rows from TrackListContext without 10k DOM nodes", () => {
    const many = Array.from({ length: 10_000 }, (_, index) => track(index + 1, `Track ${index + 1}`));
    state.view = many;
    state.selectedId = 1;
    mountTrackList();
    paintRows();
    const painted = document.querySelectorAll("#list .row");
    expect(painted.length).toBeGreaterThan(0);
    expect(painted.length).toBeLessThan(80);
    expect((document.querySelector("#list .spacer") as HTMLElement).style.height).toBe(`${10_000 * ROW}px`);
    expect(document.querySelector("#list .title")?.textContent).toBe("Track 1");
    expect(document.querySelector("#list .row-play")).not.toBeNull();
  });

  it("renders list rows from TrackListContext", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(PlayerProvider, {
          children: createElement(TrackListProvider, {
            value: value({
              view: [track(4, "Night"), track(5, "Dawn")],
              selectedId: 4,
            }),
            children: createElement(TrackListWindow, {
              pane: "a",
              start: 0,
              end: 2,
              onFocusList: () => {},
            }),
          }),
        }),
      );
    });
    const rows = host.querySelectorAll(".row");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute("aria-selected")).toBe("true");
    expect(rows[0]?.textContent).toContain("Night");
    expect(rows[0]?.querySelector(".row-play")).not.toBeNull();
    expect(rows[1]?.getAttribute("aria-selected")).toBe("false");
    root.unmount();
  });

  it("renders detail fields, cue pads, and a view-only beatgrid from context", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const open = track(4, "Night", {
      title: "Night",
      album: "Live",
      cues: [{ index: 0, start_ms: 1500, color: "#ABCDEF", name: "Drop" }],
      beatgrid: [{ position: "0.500", beats: 4 }, { position: "2.000", bpm: 128 }],
      edit: { name: "Night", artist: "Ada" },
    });
    flushSync(() => {
      root.render(
        createElement(PlayerProvider, {
          children: createElement(TrackListProvider, {
            value: value({
              detail: { kind: "track", track: open },
              selectedId: 4,
            }),
            children: createElement(TrackDetailPane),
          }),
        }),
      );
    });
    expect(host.querySelector("h2")?.textContent).toBe("Night");
    expect(host.querySelector(".detail-play")?.textContent).toBe("Play");
    expect(host.querySelector("[name=name]")).not.toBeNull();
    const pads = host.querySelectorAll(".marker");
    expect(pads.length).toBeGreaterThanOrEqual(8);
    expect(host.textContent).toContain("Drop");
    expect(host.textContent).toContain("Empty");
    expect(host.textContent).toContain("View only. This app does not rewrite the beatgrid.");
    expect(host.textContent).toContain("128 BPM");
    expect(host.querySelector(".warn")).toBeNull();
    root.unmount();
  });

  it("skips Play on a history row and paints eight Serato pads", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(PlayerProvider, {
          children: createElement(TrackListProvider, {
            value: value({
              view: [{ id: 3, name: "Old", entry: true }],
              selectedId: 3,
              mode: "history",
            }),
            children: [
              createElement(TrackListWindow, {
                key: "list",
                pane: "a",
                start: 0,
                end: 1,
                onFocusList: () => {},
              }),
              createElement(CuePads, { key: "cues", cues: [] }),
              createElement(BeatgridBlock, {
                key: "grid",
                track: { id: 1, beatgrid: [], markers_unavailable: true },
              }),
            ],
          }),
        }),
      );
    });
    expect(host.querySelector(".row-play")).toBeNull();
    expect(host.querySelectorAll(".marker")).toHaveLength(8);
    expect(host.querySelector(".marker-slot")?.textContent).toBe("1");
    expect((host.querySelector(".swatch") as HTMLElement).style.background).toBe("var(--cue-slot-1)");
    expect(host.textContent).not.toContain("Beatgrid");
    root.unmount();
  });
});
