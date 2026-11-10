/**
 * List Play and detail Play share one React player context.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import type { Track } from "../api-types";
import { AppProviders } from "../app/providers";
import {
  attachMedia,
  getPlayerState,
  isPlaying,
  mountPlayer,
  type PlayableMedia,
} from "../player";
import { playerStrings } from "../player-strings";
import { state } from "../state";
import { installPage } from "../test-page";
import { PlayButton } from "./PlayButton";

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

function track(id: number, name: string): Track {
  return { id, name, artist: "Ada" };
}

describe("PlayButton context", () => {
  beforeEach(() => {
    installPage();
    attachMedia(new FakeAudio());
    mountPlayer();
    state.space = "Serato Library";
    state.mode = "crates";
    state.selectedId = null;
    const night = track(4, "Night");
    state.byId = new Map([[4, night]]);
    state.view = [night];
  });

  it("keeps list Play and detail Play in step from one context", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: [
            createElement(PlayButton, { key: "row", variant: "row", trackId: 4, name: "Night" }),
            createElement(PlayButton, { key: "detail", variant: "detail", trackId: 4, name: "Night" }),
          ],
        }),
      );
    });
    const row = host.querySelector<HTMLButtonElement>(".row-play");
    const detail = host.querySelector<HTMLButtonElement>(".detail-play");
    expect(row?.getAttribute("aria-pressed")).toBe("false");
    expect(detail?.textContent).toBe(playerStrings.play);
    expect(detail?.getAttribute("aria-label")).toBe("Play Night");

    detail?.click();
    expect(isPlaying()).toBe(true);
    expect(getPlayerState().trackId).toBe(4);
    expect(row?.getAttribute("aria-pressed")).toBe("true");
    expect(row?.getAttribute("aria-label")).toBe("Pause Night");
    expect(detail?.textContent).toBe(playerStrings.pause);
    expect(detail?.getAttribute("aria-pressed")).toBe("true");

    row?.click();
    expect(isPlaying()).toBe(false);
    expect(row?.getAttribute("aria-pressed")).toBe("false");
    expect(detail?.textContent).toBe(playerStrings.play);
    expect(detail?.getAttribute("aria-pressed")).toBe("false");
    root.unmount();
  });
});
