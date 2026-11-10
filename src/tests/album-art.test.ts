import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openAlbumArt, wireAlbumArt } from "../lib/health/album-art";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";
import { installPage } from "./test-page";
import { applyStaticTooltips } from "../lib/ui/tooltip";

const RELEASE = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const preview = {
  preview: true,
  written: false,
  id: 13,
  name: "NoArt",
  artist: "D",
  album: "LP",
  file: "noart.mp3",
  candidates: [
    {
      release_id: RELEASE,
      title: "LP",
      artist: "D",
      mime: "image/jpeg",
      thumb: "data:image/jpeg;base64,abcd",
    },
    {
      release_id: "11111111-2222-3333-4444-555555555555",
      title: "Other",
      artist: "D",
      mime: "image/png",
      thumb: "data:image/png;base64,efgh",
    },
  ],
};

interface Call {
  url: string;
  body: Record<string, unknown>;
}

let calls: Call[] = [];

function answer(...replies: Array<{ status?: number; body: unknown }>): void {
  const queue = [...replies];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown> });
      const next = queue.shift();
      if (!next) throw new Error(`unexpected request to ${url}`);
      return new Response(JSON.stringify(next.body), {
        status: next.status ?? 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

describe("album-art", () => {
  const wrote = vi.fn();

  beforeEach(() => {
    installPage();
    setLocale("en");
    calls = [];
    wrote.mockReset();
    state.space = "Serato Library";
    state.writable = true;
    wireAlbumArt(wrote);
    applyStaticTooltips();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("posts a preview and checks only the first cover", async () => {
    answer({ body: preview });
    await openAlbumArt(13);
    expect(calls[0]).toEqual({
      url: "/api/album-art",
      body: { action: "preview", space: "Serato Library", id: 13 },
    });
    expect(el("album-art-dialog").open).toBe(true);
    const radios = [...el("album-art-choices").querySelectorAll<HTMLInputElement>("input[type='radio']")];
    expect(radios.map((input) => input.value)).toEqual([
      RELEASE,
      "11111111-2222-3333-4444-555555555555",
    ]);
    expect(radios.map((input) => input.checked)).toEqual([true, false]);
    expect(el("album-art-embed").disabled).toBe(false);
    expect(radios[0]?.dataset.tooltipKey).toBe("tooltip.healthArtPick");
  });

  it("embeds the selected cover with confirm true", async () => {
    answer({ body: preview }, { body: { ...preview, preview: false, written: true } });
    await openAlbumArt(13);
    el("album-art-embed").click();
    await vi.waitFor(() => expect(wrote).toHaveBeenCalled());
    expect(calls[1]?.body).toEqual({
      action: "embed",
      space: "Serato Library",
      id: 13,
      release_id: RELEASE,
      confirm: true,
    });
    expect(el("album-art-dialog").open).toBe(false);
  });

  it("says when no cover was found", async () => {
    answer({ body: { ...preview, candidates: [] } });
    await openAlbumArt(13);
    expect(el("album-art-status").textContent).toBe("No cover was found for this track.");
    expect(el("album-art-embed").disabled).toBe(true);
  });

  it("shows the server error sentence and keeps the file unwritten", async () => {
    answer({ status: 400, body: { error: "This file already has artwork.", code: "artwork_already" } });
    await openAlbumArt(13);
    expect(el("album-art-status").textContent).toBe("This file already has artwork.");
    expect(el("album-art-dialog").open).toBe(true);
    expect(wrote).not.toHaveBeenCalled();
  });

  it("disables embed when the library is not writable", async () => {
    state.writable = false;
    answer({ body: preview });
    await openAlbumArt(13);
    expect(el("album-art-embed").disabled).toBe(true);
  });

  it("gives Cancel and Embed tooltips", () => {
    expect(el("album-art-cancel").dataset.tooltipKey).toBe("tooltip.healthArtCancel");
    expect(el("album-art-embed").dataset.tooltipKey).toBe("tooltip.healthArtEmbed");
  });
});
