/**
 * Mix suggestions can stay in the open crate.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MuiThemeRoot } from "../../app/mui-theme-root";
import { RelatedTracks } from "../../components/RelatedTracks";
import { TrackListProvider, type TrackListContextValue } from "../../containers/TrackListContext";
import { setLocale } from "../../lib/i18n";
import { nightTrack } from "../../lib/storybook/fixtures";
import { getTrackListActions, readTrackList } from "../../lib/ui/track-list-store";
import { drainReactScheduler, installPage } from "../test-page";

const fetchMock = vi.fn();

function value(partial: Partial<TrackListContextValue> = {}): TrackListContextValue {
  return {
    ...readTrackList(),
    ...getTrackListActions(),
    writable: true,
    space: "Serato Library",
    mode: "crates",
    ...partial,
  };
}

describe("RelatedTracks", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    installPage();
    setLocale("en");
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ saved: [], suggested: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    flushSync(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
    await drainReactScheduler();
    setLocale("en");
  });

  function paint(extra: Partial<TrackListContextValue> = {}): void {
    flushSync(() => {
      root.render(
        createElement(MuiThemeRoot, {
          children: createElement(TrackListProvider, {
            value: value(extra),
            children: createElement(RelatedTracks, { track: nightTrack, writable: true }),
          }),
        }),
      );
    });
  }

  it("hides This crate only on All tracks", async () => {
    paint({ activeCrate: "all" });
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(host.querySelector("[data-related-crate-only]")).toBeNull();
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain("crate=");
  });

  it("passes crate= when This crate only is checked", async () => {
    paint({ activeCrate: 2 });
    await vi.waitFor(() => {
      expect(host.querySelector("[data-related-crate-only]")).not.toBeNull();
    });
    const box = host.querySelector<HTMLInputElement>("[data-related-crate-only]");
    expect(box?.checked).toBe(false);
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain("crate=");
    flushSync(() => {
      box?.click();
    });
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("crate=2"))).toBe(true);
    });
  });
});
