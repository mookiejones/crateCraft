import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CrateComparePlan, CrateCompareReport } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import {
  loadCrateCompare,
  repaintCrateCompare,
  unmountCrateCompare,
  wireCrateCompare,
} from "../lib/crates/crate-compare";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: CrateCompareReport = {
  a: { id: 5, name: "Warmup", smart: false, tracks: 3 },
  b: { id: 6, name: "Peak", smart: true, tracks: 2 },
  subcrates: false,
  both: [{ id: 10, name: "Shared", artist: "DJ A" }],
  only_a: [{ id: 12, name: "Warm only", artist: "DJ B" }],
  only_b: [],
};

const written: CrateComparePlan = {
  ...report,
  set: "both",
  name: "Both · Warmup · Peak",
  count: 1,
  preview: false,
  written: true,
  id: 20,
  added: 1,
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("compare-report")!.textContent || "";
}

function saveButton(setKey: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`#compare-report [data-compare-set="${setKey}"]`)!;
}

describe("compare crates", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.writable = true;
    state.activeCrate = 5;
    state.crates = [
      { id: 5, name: "Warmup" },
      { id: 6, name: "Peak" },
    ];
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireCrateCompare();
    document.getElementById("compare-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountCrateCompare();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the two selected crates and paints both, only A, and only B", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadCrateCompare();
    expect(fetchMock).toHaveBeenCalledWith("/api/crate-compare?space=Serato%20Library&a=5&b=6");
    expect(document.getElementById("compare-scope")!.textContent).toBe("Whole space");
    expect((document.getElementById("compare-a") as HTMLSelectElement).value).toBe("5");
    expect((document.getElementById("compare-b") as HTMLSelectElement).value).toBe("6");
    expect(reportText()).toContain("In both");
    expect(reportText()).toContain("Shared");
    expect(reportText()).toContain("DJ A");
    expect(reportText()).toContain("Only in Warmup");
    expect(reportText()).toContain("Warm only");
    expect(reportText()).toContain("This smart crate's stored tracks may be out of date.");
    expect(document.querySelector('#compare-report .MuiDataGrid-columnHeader[data-field="name"]')).not.toBeNull();
    expect(document.getElementById("compare-refresh")!.getAttribute("aria-busy")).toBe("false");
    expect(saveButton("both").disabled).toBe(false);
    expect(saveButton("only_a").disabled).toBe(false);
    expect(saveButton("only_b").disabled).toBe(true);
  });

  it("sends subcrates=1 when the checkbox is on", async () => {
    const fetchMock = vi.fn(async () => reply({ ...report, subcrates: true }));
    vi.stubGlobal("fetch", fetchMock);
    (document.getElementById("compare-subcrates") as HTMLInputElement).checked = true;
    await loadCrateCompare();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/crate-compare?space=Serato%20Library&a=5&b=6&subcrates=1",
    );
  });

  it("asks for two crates and skips the server when fewer than two exist", async () => {
    state.crates = [{ id: 5, name: "Warmup" }];
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadCrateCompare();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("compare-status")!.textContent).toBe("Pick two crates.");
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadCrateCompare();
    const firstFinish = finish;
    const emptyOnly = { ...report, both: [] as typeof report.both, only_a: [] as typeof report.only_a };
    const second = loadCrateCompare();
    finish(reply(emptyOnly));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).not.toContain("Shared");
    expect(reportText()).toContain("Nothing in this set.");
  });

  it("shows the server error sentence when the report cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "That request is not valid.", code: "invalid_request" }, 400)));
    await loadCrateCompare();
    expect(document.getElementById("compare-status")!.textContent).toBe("That request is not valid.");
    expect(document.activeElement).toBe(document.getElementById("compare-refresh"));
  });

  it("shows the unreachable sentence when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadCrateCompare();
    expect(document.getElementById("compare-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadCrateCompare();
    setLocale("es");
    repaintCrateCompare();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("En ambas");
    expect(reportText()).not.toContain("In both");
    expect(document.getElementById("compare-scope")!.textContent).toBe("Todo el espacio");
  });

  it("saves one set as a crate and omits a custom name", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    postJSON.mockResolvedValueOnce(written);
    await loadCrateCompare();
    saveButton("both").click();
    await vi.waitFor(() => expect(bridge.reloadLibrary).toHaveBeenCalled());
    expect(postJSON).toHaveBeenCalledTimes(1);
    expect(postJSON).toHaveBeenCalledWith("/api/crate-compare", {
      action: "create",
      space: "Serato Library",
      a: 5,
      b: 6,
      set: "both",
      subcrates: false,
    });
    expect(document.getElementById("compare-status")!.textContent).toContain("Saved 1 track as Both · Warmup · Peak.");
    expect(reportText()).toContain("Shared");
  });

  it("locks the page on a 409 from create", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    const locked = Object.assign(new Error("Quit Serato DJ before writing."), {
      status: 409,
      payload: { error: "Quit Serato DJ before writing.", serato: { writable: false } },
    });
    postJSON.mockRejectedValueOnce(locked);
    await loadCrateCompare();
    saveButton("both").click();
    await vi.waitFor(() => expect(bridge.lockDown).toHaveBeenCalled());
    expect(document.getElementById("compare-status")!.textContent).toContain("Quit Serato DJ before writing.");
  });

  it("shows the queued sentence and skips reload when the write is queued", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    postJSON.mockResolvedValueOnce({ queued: true });
    await loadCrateCompare();
    saveButton("both").click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalled());
    expect(bridge.reloadLibrary).not.toHaveBeenCalled();
    expect(document.getElementById("compare-status")!.textContent).toBe(
      "Queued. Apply from Backups after Gig Lock is off.",
    );
  });

  it("keeps Save off while the library is locked", async () => {
    state.writable = false;
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadCrateCompare();
    expect(saveButton("both").disabled).toBe(true);
  });

  it("gives every compare control a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    applyStaticTooltips();
    expect(document.getElementById("compare-refresh")!.dataset.tooltipKey).toBe("tooltip.compareShow");
    expect(document.getElementById("compare-a")!.dataset.tooltipKey).toBe("tooltip.compareA");
    expect(document.getElementById("compare-b")!.dataset.tooltipKey).toBe("tooltip.compareB");
    expect(document.getElementById("compare-subcrates")!.dataset.tooltipKey).toBe("tooltip.compareSubcrates");
    expect(document.querySelector<HTMLElement>('[data-view="compare"]')!.dataset.tooltipKey).toBe("tooltip.viewCompare");
  });
});
