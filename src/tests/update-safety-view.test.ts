/**
 * Safe-to-update lines on the gig report.
 *
 * Unknown does not add the not-ready class to the score. A missing
 * field hides the section so older reports still render.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../app/providers";
import type { GigReport as GigPayload, GigUpdateSafety } from "../lib/api-types";
import { loadGigCheck, wireGigCheck } from "../lib/gig/gig";
import {
  LEXICON_UPDATES,
  MACOS_27_ARTICLE,
  SERATO_DOWNLOADS,
  updateSafetyView,
} from "../lib/gig/update-safety-view";
import { state } from "../lib/state";
import { GigReport } from "../pages/GigReport";
import { drainReactScheduler, installPage } from "./test-page";

const blocked: GigUpdateSafety = {
  verdict: "not_cleared",
  reasons: [{
    code: "serato_below_os",
    summary: "Server English must not win.",
    params: { os: "27", need: "5.1.0", installed: "5.0.0" },
  }],
  new_release_within_7_days: true,
  releases: [{ product: "serato", label: "Serato DJ Pro", version: "5.1.0", published: "2026-11-26" }],
  serato_version: "5.0.0",
  os_label: "macOS 27",
  hardware: ["Rane ONE"],
};

const unknownSafety: GigUpdateSafety = {
  verdict: "unknown",
  reasons: [{ code: "hardware_missing", summary: "Server English must not win." }],
  new_release_within_7_days: false,
  serato_version: "5.1.0",
  os_label: "macOS 27",
  hardware: [],
};

function report(safety: GigUpdateSafety | null, ready: boolean): GigPayload {
  return {
    ready,
    score: ready ? 100 : 72,
    hard_red: !ready,
    holding_it_back: [],
    missing_files: [],
    unavailable_drives: [],
    streaming_tracks: [],
    empty_crates: [],
    snapshot_note: "",
    changes: null,
    scope: { space: "Serato Library", crate_id: null, crate_name: null },
    update_safety: safety,
  };
}

function reply(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("update safety view", () => {
  let panelRoot: Root | null = null;

  beforeEach(() => {
    installPage();
    document.documentElement.lang = "en";
    state.space = "Serato Library";
    state.activeCrate = "all";
    state.gigToken = 0;
    wireGigCheck(() => {});
  });

  afterEach(async () => {
    document.documentElement.lang = "en";
    try {
      panelRoot?.unmount();
    } catch {
      // installPage already dropped the host.
    }
    panelRoot = null;
    vi.unstubAllGlobals();
    await drainReactScheduler();
  });

  async function paint(payload: GigPayload): Promise<HTMLElement> {
    vi.stubGlobal("fetch", vi.fn(async () => reply(payload)));
    await loadGigCheck();
    const host = document.createElement("div");
    document.body.append(host);
    panelRoot = createRoot(host);
    flushSync(() => {
      panelRoot!.render(createElement(AppProviders, { children: createElement(GigReport) }));
    });
    return host;
  }

  it("shows Not cleared and a fresh release without turning a ready score red", async () => {
    const host = await paint(report(blocked, true));
    const score = host.querySelector(".gig-score");
    expect(score?.textContent).toContain("Ready");
    expect(score?.querySelector(".not-ready")).toBeNull();
    expect(host.querySelector(".gig-update-line")?.textContent).toContain("Not cleared");
    expect(host.querySelector(".gig-update-fresh")?.textContent).toContain("Serato DJ Pro 5.1.0");
    const links = [...host.querySelectorAll<HTMLAnchorElement>(".gig-update-links a")];
    expect(links.map((link) => link.href)).toEqual([
      SERATO_DOWNLOADS,
      MACOS_27_ARTICLE,
      LEXICON_UPDATES,
    ]);
    expect(links.map((link) => link.dataset.tooltipKey)).toEqual([
      "tooltip.gigUpdateDownloads",
      "tooltip.gigUpdateSupport",
      "tooltip.gigUpdateLexicon",
    ]);
    expect(links.every((link) => link.getAttribute("aria-describedby") || link.dataset.tooltip)).toBe(true);
  });

  it("shows Unknown in Spanish and does not claim Yes", async () => {
    document.documentElement.lang = "es";
    const host = await paint(report(unknownSafety, true));
    const text = host.querySelector(".gig-update")?.textContent ?? "";
    expect(text).toContain("Desconocido");
    expect(text).not.toContain("Sí. Esta versión");
    expect(text).toContain("No hay hardware conectado");
    expect(host.querySelector(".gig-score .not-ready")).toBeNull();
  });

  it("hides the line when the report has no update_safety field", async () => {
    const host = await paint(report(null, false));
    expect(host.querySelector(".gig-update")).toBeNull();
    expect(host.querySelector(".gig-score .not-ready")).not.toBeNull();
  });

  it("never marks the view helper as a hard red", () => {
    expect(updateSafetyView(blocked)?.hardRed).toBe(false);
    expect(updateSafetyView(unknownSafety)?.hardRed).toBe(false);
    expect(updateSafetyView(null)).toBeNull();
  });
});
