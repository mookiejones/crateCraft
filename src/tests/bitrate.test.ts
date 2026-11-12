import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BitrateCheckReport, BitrateCratePlan } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import { loadBitrate, repaintBitrate, unmountBitrate, wireBitrate } from "../lib/health/bitrate";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: BitrateCheckReport = {
  crate: 5,
  checked: 12,
  not_found: 2,
  unreadable: 1,
  too_quiet: 1,
  unchecked: 1,
  suspects: [
    {
      id: 1,
      name: "Fake",
      artist: "A",
      file: "fake.mp3",
      reason: "upsampled",
      stated_kbps: 320,
      estimated_kbps: 128,
      cutoff_hz: 16000,
    },
    {
      id: 2,
      name: "Tape",
      artist: "B",
      file: "tape.flac",
      reason: "lossy_source",
      stated_kbps: null,
      estimated_kbps: 192,
      cutoff_hz: 19000,
    },
  ],
};

const clear: BitrateCheckReport = {
  crate: 5,
  checked: 8,
  not_found: 0,
  unreadable: 0,
  too_quiet: 0,
  unchecked: 0,
  suspects: [],
};

const preview: BitrateCratePlan = {
  ...report,
  preview: true,
  written: false,
  name: "Suspect quality",
  added: 2,
  saved: null,
};

const written: BitrateCratePlan = {
  ...report,
  preview: false,
  written: true,
  name: "Suspect quality",
  added: 2,
  saved: { id: 9, name: "Suspect quality" },
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("bitrate-report")!.textContent || "";
}

describe("bitrate", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.writable = true;
    state.crates = [{ id: 5, name: "Friday" }];
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireBitrate();
    document.getElementById("bitrate-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountBitrate();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the selected crate and paints flagged tracks by reason", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadBitrate();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bitrate-check?space=Serato%20Library&crate=5",
    );
    expect(document.getElementById("bitrate-scope")!.textContent).toBe("Friday");
    expect(reportText()).toContain("12 files checked. 2 suspect files.");
    expect(reportText()).toContain("2 missing tracks were skipped");
    expect(reportText()).toContain("1 file could not be read.");
    expect(reportText()).toContain("Stated bitrate is much higher than the spectrum");
    expect(reportText()).toContain("A — Fake");
    expect(reportText()).toContain("fake.mp3");
    expect(reportText()).toContain("320 kbps on the file, about 128 kbps from the spectrum");
    expect(reportText()).toContain("Lossless file looks like it came from a lossy encode");
    expect(document.querySelector('#bitrate-report .MuiDataGrid-columnHeader[data-field="reason"]')).not.toBeNull();
    expect(document.querySelector('#bitrate-report .MuiDataGrid-cell[data-field="reason"]')?.textContent).toContain("Stated bitrate is much higher");
    expect(document.getElementById("bitrate-refresh")!.getAttribute("aria-busy")).toBe("false");
    expect((document.getElementById("bitrate-save") as HTMLButtonElement).disabled).toBe(false);
  });

  it("refuses a check of the whole space before asking the server", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadBitrate();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("bitrate-status")!.textContent).toBe(
      "Choose a crate for a bitrate check.",
    );
    expect((document.getElementById("bitrate-refresh") as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById("bitrate-save") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a clean report when nothing is flagged", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadBitrate();
    expect(reportText()).toContain("8 files checked. None look like fake 320s or lossy-sourced lossless.");
    expect(reportText()).toContain("No fake-320 or lossy-sourced files in this crate.");
    expect((document.getElementById("bitrate-save") as HTMLButtonElement).disabled).toBe(true);
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadBitrate();
    const firstFinish = finish;
    const second = loadBitrate();
    finish(reply(clear));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).toContain("None look like fake 320s");
    expect(reportText()).not.toContain("fake.mp3");
  });

  it("shows the server error sentence when the check cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "Choose a crate for a bitrate check.", code: "bitrate_needs_crate" }, 400)));
    await loadBitrate();
    expect(document.getElementById("bitrate-status")!.textContent).toBe("Choose a crate for a bitrate check.");
    expect(document.activeElement).toBe(document.getElementById("bitrate-refresh"));
  });

  it("shows the unreachable sentence when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadBitrate();
    expect(document.getElementById("bitrate-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadBitrate();
    setLocale("es");
    repaintBitrate();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("archivos sospechosos");
    expect(reportText()).toContain("tasa de bits declarada");
    expect(reportText()).not.toContain("Stated bitrate is much higher");
    expect(document.getElementById("bitrate-scope")!.textContent).toBe("Friday");
  });

  it("previews a crate then writes it after confirm", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    postJSON.mockResolvedValueOnce(preview).mockResolvedValueOnce(written);
    await loadBitrate();
    document.getElementById("bitrate-save")!.click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalledTimes(1));
    expect(postJSON).toHaveBeenCalledWith("/api/bitrate-check", {
      action: "preview",
      space: "Serato Library",
      crate: 5,
    });
    expect(document.getElementById("bitrate-status")!.textContent).toContain("2 tracks would go into Suspect quality");
    const confirm = document.querySelector<HTMLButtonElement>("[data-bitrate-action='confirm']");
    expect(confirm).not.toBeNull();
    expect(confirm!.disabled).toBe(false);
    confirm!.click();
    await vi.waitFor(() => expect(bridge.reloadLibrary).toHaveBeenCalled());
    expect(postJSON).toHaveBeenLastCalledWith("/api/bitrate-check", {
      action: "create",
      space: "Serato Library",
      crate: 5,
    });
    expect(document.getElementById("bitrate-status")!.textContent).toContain("Saved crate Suspect quality with 2 tracks");
  });

  it("locks the page on a 409 from create", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    const locked = Object.assign(new Error("Quit Serato DJ before writing."), {
      status: 409,
      payload: { error: "Quit Serato DJ before writing.", serato: { writable: false } },
    });
    postJSON.mockResolvedValueOnce(preview).mockRejectedValueOnce(locked);
    await loadBitrate();
    document.getElementById("bitrate-save")!.click();
    await vi.waitFor(() => expect(document.querySelector("[data-bitrate-action='confirm']")).not.toBeNull());
    document.querySelector<HTMLButtonElement>("[data-bitrate-action='confirm']")!.click();
    await vi.waitFor(() => expect(bridge.lockDown).toHaveBeenCalled());
    expect(document.getElementById("bitrate-status")!.textContent).toContain("Quit Serato DJ before writing.");
  });

  it("gives every bitrate control a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    postJSON.mockResolvedValue(preview);
    applyStaticTooltips();
    expect(document.getElementById("bitrate-refresh")!.dataset.tooltipKey).toBe("tooltip.bitrateRefresh");
    expect(document.getElementById("bitrate-save")!.dataset.tooltipKey).toBe("tooltip.bitrateSave");
    expect(document.querySelector<HTMLElement>('[data-view="bitrate"]')!.dataset.tooltipKey).toBe("tooltip.viewBitrate");
    await loadBitrate();
    document.getElementById("bitrate-save")!.click();
    await vi.waitFor(() => expect(document.querySelector("[data-bitrate-action='confirm']")).not.toBeNull());
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#bitrate-panel button")].filter(
      (button) => !button.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });
});
