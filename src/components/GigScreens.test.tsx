/**
 * Gig check and Tempo drift share one React context.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GigReport as GigPayload, TempoDriftReport } from "../api-types";
import { AppProviders } from "../app/providers";
import { loadDrift, wireDrift } from "../drift";
import { loadGigCheck, wireGigCheck } from "../gig";
import { state } from "../state";
import { installPage } from "../test-page";
import { DriftReport } from "./DriftReport";
import { GigReport } from "./GigReport";

const gigReport: GigPayload = {
  ready: false,
  score: 72,
  hard_red: true,
  holding_it_back: [{ code: "missing_files", points: 8, hard_red: true, summary: "1 missing file." }],
  missing_files: [{ path: "/Music/gone.mp3", title: "Gone", artist: "A", crate: "Friday" }],
  unavailable_drives: [{ name: "GIGDRIVE", track_count: 2, crates: ["Friday"] }],
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
  scope: { space: "Serato Library", crate_id: 5, crate_name: "Friday" },
};

const driftReport: TempoDriftReport = {
  crate: 5,
  checked: 12,
  not_found: 0,
  unreadable: 0,
  too_quiet: 0,
  unchecked: 0,
  mapped: 0,
  flags: [
    {
      id: 1,
      name: "Old Tape",
      artist: "A",
      file: "tape.wav",
      reasons: ["drifting"],
      bpm_min: 90,
      bpm_max: 120,
    },
  ],
};

function reply(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("Before a gig context", () => {
  beforeEach(() => {
    installPage();
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.gigToken = 0;
    state.driftToken = 0;
    state.crates = [{ id: 5, name: "Friday" }];
    wireGigCheck(() => {});
    wireDrift();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders gig check and Tempo drift from one context", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/tempo-drift")) return reply(driftReport);
      return reply(gigReport);
    }));
    await loadGigCheck();
    await loadDrift();

    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: [
            createElement(GigReport, { key: "gig" }),
            createElement(DriftReport, { key: "drift" }),
          ],
        }),
      );
    });
    expect(host.querySelector(".gig-score")?.textContent).toContain("72/100");
    expect(host.querySelector(".gig-score")?.textContent).toContain("✕ Not ready");
    expect(host.textContent).toContain("GIGDRIVE");
    expect(host.textContent).toContain("A — Old Tape (tape.wav) — Tempo wanders (90–120 BPM)");
    root.unmount();
  });
});
