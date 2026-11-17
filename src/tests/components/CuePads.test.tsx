/**
 * Filled cue pads jump the player. Empty pads stay quiet.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CuePads } from "../../components/CuePads";
import { jumpCue } from "../../lib/player/player";
import { drainReactScheduler } from "../test-page";

vi.mock("../../lib/player/player", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/player/player")>();
  return { ...actual, jumpCue: vi.fn() };
});

describe("CuePads", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.mocked(jumpCue).mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    flushSync(() => root.unmount());
    host.remove();
    await drainReactScheduler();
  });

  it("jumps the player when a filled pad is clicked", () => {
    flushSync(() => {
      root.render(
        createElement(CuePads, {
          cues: [
            { index: 0, start_ms: 1500, color: "#CC0000", name: "Drop" },
            { index: 3, start_ms: 8000, color: "#FAC313", name: "Break" },
          ],
        }),
      );
    });
    const pads = host.querySelectorAll(".marker:not(.marker-empty)");
    expect(pads.length).toBeGreaterThan(0);
    (pads[0] as HTMLElement).click();
    expect(jumpCue).toHaveBeenCalledWith(0);
    (pads[1] as HTMLElement).click();
    expect(jumpCue).toHaveBeenCalledWith(3);
  });

  it("does nothing when an empty pad is clicked", () => {
    flushSync(() => {
      root.render(createElement(CuePads, { cues: [] }));
    });
    const empty = host.querySelector(".marker-empty");
    expect(empty).toBeTruthy();
    (empty as HTMLElement).click();
    expect(jumpCue).not.toHaveBeenCalled();
  });
});
