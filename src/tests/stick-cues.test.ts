/**
 * Check drive lists stick-only cues and posts confirm on import.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setLocale } from "../lib/i18n";
import { runPortableCheck, unmountPortable, wirePortable } from "../lib/gig/portable";
import { drainReactScheduler, installPage } from "./test-page";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const driveReport = {
  drive: "/Volumes/GIGDRIVE",
  name: "GIGDRIVE",
  ready: true,
  missing_drive: false,
  summary: "ok",
  findings: [],
  errors: [],
};

describe("stick cues on Check drive", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    wirePortable();
  });

  afterEach(async () => {
    unmountPortable();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("reviews without a write and imports only after confirm", async () => {
    const posts: unknown[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/api/stick-cues")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as { action?: string };
        posts.push(body);
        return json({
          preview: body.action === "preview",
          written: body.action === "apply",
          status: "ready",
          library_status: "ours",
          drive: "/Volumes/GIGDRIVE",
          count: 1,
          cues: [{
            file: "Deck.mp3",
            index: 1,
            start_ms: 5000,
            name: "Deck",
            color: "#cc0000",
            skip: null,
          }],
          skipped: [],
        });
      }
      return json(driveReport);
    }));
    await runPortableCheck("/Volumes/GIGDRIVE/Music");
    const review = document.getElementById("stick-review");
    const copy = document.getElementById("stick-import");
    expect(review?.dataset.tooltipKey).toBe("tooltip.stickReview");
    expect(copy?.dataset.tooltipKey).toBe("tooltip.stickImport");
    expect((review as HTMLButtonElement).disabled).toBe(false);
    expect((copy as HTMLButtonElement).disabled).toBe(false);
    review?.click();
    await vi.waitFor(() => {
      expect(document.getElementById("stick-list")?.textContent).toContain("Deck.mp3");
    });
    expect(document.getElementById("stick-list")?.textContent).toContain("pad 2");
    expect(document.getElementById("stick-list")?.textContent).toContain("0:05");
    expect(document.getElementById("stick-list")?.textContent).toContain("Deck");
    expect(posts[0]).toEqual({ action: "preview", drive: "/Volumes/GIGDRIVE" });
    copy?.click();
    await vi.waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1]).toEqual({ action: "apply", drive: "/Volumes/GIGDRIVE", confirm: true });
  });

  it("names an unmounted drive and does not call it a missing file", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("/api/stick-cues")) {
        return json({
          preview: true,
          written: false,
          status: "not_connected",
          library_status: "not_connected",
          drive: "/Volumes/GONE",
          count: 0,
          cues: [],
          skipped: [],
        });
      }
      return json(driveReport);
    }));
    await runPortableCheck("/Volumes/GONE");
    document.getElementById("stick-review")?.click();
    await vi.waitFor(() => {
      expect(document.getElementById("stick-status")?.textContent).toContain("GONE");
    });
    expect(document.getElementById("stick-status")?.textContent).toBe(
      "GONE is not connected. That is not a missing file.",
    );
  });
});
