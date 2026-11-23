import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BpmSanityReport } from "../lib/api-types";
import { loadOctave, repaintOctave, unmountOctave, wireOctave } from "../lib/gig/octave";
import { bridge } from "../lib/bridge";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { mountSharedDialogs, unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { drainReactScheduler, installPage } from "./test-page";

const report: BpmSanityReport = {
  crate: 5,
  checked: 8,
  anchor: 128,
  skipped: 1,
  ready: true,
  beatgrid: "unchanged",
  flags: [
    {
      id: 4,
      name: "Half Time",
      artist: "A",
      file: "half.wav",
      bpm: 64,
      suggested: 128,
      fix: "x2",
      kind: "half",
    },
  ],
};

const clear: BpmSanityReport = {
  crate: 5,
  checked: 6,
  anchor: 126,
  skipped: 0,
  ready: true,
  beatgrid: "unchanged",
  flags: [],
};

const notReady: BpmSanityReport = {
  crate: 5,
  checked: 2,
  anchor: null,
  skipped: 0,
  ready: false,
  beatgrid: "unchanged",
  flags: [],
};

const written = { ok: true, written: true, id: 4, bpm: 128, beatgrid: "unchanged" };

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("octave-report")!.textContent || "";
}

function postBodies(fetchMock: ReturnType<typeof vi.fn>): unknown[] {
  return fetchMock.mock.calls
    .filter((call) => (call[1] as RequestInit | undefined)?.method === "POST")
    .map((call) => JSON.parse(String((call[1] as RequestInit).body)));
}

describe("octave", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.crates = [{ id: 5, name: "Friday" }];
    wireOctave();
    mountSharedDialogs();
    document.getElementById("octave-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountOctave();
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    setLocale("en");
  });

  it("asks for the selected crate and paints a half-tempo row", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadOctave();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bpm-sanity?space=Serato%20Library&crate=5",
    );
    expect(document.getElementById("octave-scope")!.textContent).toBe("Friday");
    expect(reportText()).toContain("Most tracks sit near 128 BPM.");
    expect(reportText()).toContain("1 track had no usable BPM and was skipped.");
    expect(reportText()).toContain("1 track is about half or double the rest of this crate.");
    expect(reportText()).toContain("Only the stored BPM changes. The beatgrid is left alone.");
    expect(reportText()).toContain("Half Time");
    expect(reportText()).toContain("half.wav");
    const button = document.querySelector<HTMLButtonElement>("[data-octave-fix='x2']");
    expect(button?.textContent).toBe("×2");
    expect(button?.getAttribute("aria-label")).toContain("beatgrid is left alone");
    expect(button?.dataset.tooltipKey).toBe("tooltip.octaveFix");
    expect(document.getElementById("octave-refresh")!.getAttribute("aria-busy")).toBe("false");
  });

  it("refuses a check of the whole space before asking the server", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadOctave();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("octave-status")!.textContent).toBe(
      "Choose a crate for a BPM check.",
    );
    expect((document.getElementById("octave-refresh") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a clean report when nothing is flagged", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadOctave();
    expect(reportText()).toContain("Stored BPMs in this crate sit near one tempo.");
    expect(reportText()).toContain("No half or double BPMs in this crate.");
    expect(document.querySelector("[data-octave-fix]")).toBeNull();
  });

  it("says the crate is not ready when fewer than 3 tracks have a BPM", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(notReady)));
    await loadOctave();
    expect(reportText()).toContain("This crate needs at least 3 tracks with a BPM.");
    expect(reportText()).not.toContain("Most tracks sit near");
    expect(document.querySelector("[data-octave-fix]")).toBeNull();
  });

  it("confirms, posts the fix without a client BPM, and says it saved after reload", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return reply(written);
      return reply(report);
    });
    vi.stubGlobal("fetch", fetchMock);
    await loadOctave();
    document.querySelector<HTMLButtonElement>("[data-octave-fix='x2']")!.click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    expect(el("confirm-title").textContent).toBe("Save the BPM");
    expect(el("confirm-message").textContent).toContain("Half Time");
    expect(el("confirm-message").textContent).toContain("64");
    expect(el("confirm-message").textContent).toContain("128");
    expect(el("confirm-message").textContent).toContain("The beatgrid is left alone.");
    expect(el("confirm-confirm").textContent).toBe("×2");
    expect(document.querySelector<HTMLButtonElement>("[data-octave-fix='x2']")!.disabled).toBe(true);
    el("confirm-confirm").click();
    await vi.waitFor(() => {
      expect(document.getElementById("octave-status")!.textContent).toContain("Saved 128 BPM for Half Time");
    });
    expect(postBodies(fetchMock)).toEqual([
      { id: 4, fix: "x2", crate: 5, space: "Serato Library", confirm: true },
    ]);
    expect(el("confirm-dialog").open).toBe(false);
  });

  it("does not write when the BPM confirm is cancelled", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadOctave();
    document.querySelector<HTMLButtonElement>("[data-octave-fix='x2']")!.click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    el("confirm-cancel").click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(false));
    expect(postBodies(fetchMock)).toEqual([]);
    expect(document.getElementById("octave-status")!.textContent).toBe("");
  });

  it("locks writes when Serato answers 409", async () => {
    const lock = vi.spyOn(bridge, "lockDown").mockImplementation(() => {});
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return reply({ error: "Serato DJ is open. Edits stay off until it quits." }, 409);
      }
      return reply(report);
    });
    vi.stubGlobal("fetch", fetchMock);
    await loadOctave();
    document.querySelector<HTMLButtonElement>("[data-octave-fix='x2']")!.click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    el("confirm-confirm").click();
    await vi.waitFor(() => expect(lock).toHaveBeenCalled());
    expect(document.getElementById("octave-status")!.textContent).not.toContain("Saved");
  });

  it("shows the confirm in Spanish", async () => {
    setLocale("es");
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadOctave();
    document.querySelector<HTMLButtonElement>("[data-octave-fix='x2']")!.click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    expect(el("confirm-title").textContent).toBe("Guardar el BPM");
    expect(el("confirm-message").textContent).toContain("rejilla de beats se queda igual");
    el("confirm-cancel").click();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(false));
    expect(postBodies(fetchMock)).toEqual([]);
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadOctave();
    setLocale("es");
    repaintOctave();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("rejilla de beats se queda igual");
    expect(reportText()).not.toContain("The beatgrid is left alone.");
  });

  it("gives every BPM check control a tooltip", () => {
    applyStaticTooltips();
    expect(document.getElementById("octave-refresh")!.dataset.tooltipKey).toBe("tooltip.octaveRefresh");
    expect(document.querySelector<HTMLElement>('[data-view="octave"]')!.dataset.tooltipKey).toBe("tooltip.viewOctave");
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#octave-panel button")].filter(
      (button) => !button.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });
});
