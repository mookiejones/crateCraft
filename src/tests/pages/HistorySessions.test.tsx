/**
 * History session list and detail render from HistoryContext.
 */

import { createElement, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import type { HistorySession, Track } from "../../lib/api-types";
import {
  HistoryProvider,
  type HistoryContextValue,
} from "../../containers/HistoryContext";
import { HistoryDetail } from "../../pages/HistoryDetail";
import { HistorySessions } from "../../pages/HistorySessions";

function value(partial: Partial<HistoryContextValue>): HistoryContextValue {
  return {
    sessions: [],
    historyId: null,
    entries: [],
    selectedId: null,
    loadHistory: async () => {},
    openSession: async () => {},
    selectEntry: () => {},
    openInLibrary: async () => {},
    ...partial,
  };
}

function mount(node: ReactNode): { host: HTMLDivElement; unmount: () => void } {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => {
    root.render(node);
  });
  return {
    host,
    unmount() {
      root.unmount();
      host.remove();
    },
  };
}

describe("History from context", () => {
  it("paints sessions from HistoryContext and opens the clicked session", () => {
    const openSession = vi.fn(async (_id: number) => {});
    const sessions: HistorySession[] = [
      { id: 4, name: "Friday", played: 3 },
      { id: 5, name: "Saturday", played: 0 },
    ];
    const { host, unmount } = mount(
      createElement(HistoryProvider, {
        value: value({ sessions, historyId: 4, openSession }),
        children: createElement(HistorySessions),
      }),
    );
    const buttons = [...host.querySelectorAll<HTMLButtonElement>(".crate")];
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.textContent).toContain("Friday");
    expect(buttons[0]?.textContent).toContain("3");
    expect(buttons[0]?.getAttribute("aria-selected")).toBe("true");
    expect(buttons[1]?.getAttribute("aria-selected")).toBe("false");
    expect(buttons[0]?.getAttribute("data-tooltip")).toContain("Friday");
    buttons[1]?.click();
    expect(openSession).toHaveBeenCalledWith(5);
    unmount();
  });

  it("paints history detail from HistoryContext and opens the library track", () => {
    const openInLibrary = vi.fn(async (_assetId: number) => {});
    const entry = {
      id: 9,
      name: "Alpha",
      artist: "Artist",
      file: "a.mp3",
      deck: "1",
      played: "Yes",
      start_time: 100,
      asset_id: 1,
    } as Track;
    const { host, unmount } = mount(
      createElement(HistoryProvider, {
        value: value({ entries: [entry], selectedId: 9, openInLibrary }),
        children: createElement(HistoryDetail),
      }),
    );
    expect(host.querySelector("h2")?.textContent).toBe("Alpha");
    expect(host.querySelector(".artist")?.textContent).toBe("Artist");
    const labels = [...host.querySelectorAll<HTMLElement>(".label")].map((node) => node.textContent);
    expect(labels).toEqual(["Played", "Deck", "Started", "File"]);
    const open = host.querySelector<HTMLButtonElement>(".text-button");
    expect(open?.textContent).toBe("Open in library");
    expect(open?.getAttribute("data-tooltip")).toContain("library");
    open?.click();
    expect(openInLibrary).toHaveBeenCalledWith(1);
    unmount();
  });

  it("renders no session rows when HistoryContext has an empty list", () => {
    const { host, unmount } = mount(
      createElement(HistoryProvider, {
        value: value({ sessions: [] }),
        children: createElement(HistorySessions),
      }),
    );
    expect(host.querySelectorAll(".crate")).toHaveLength(0);
    unmount();
  });
});
