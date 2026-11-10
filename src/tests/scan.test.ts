import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FileScanReport } from "../lib/api-types";
import { loadScan, repaintScan, wireScan } from "../lib/health/scan";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { installPage } from "./test-page";

const report: FileScanReport = {
  depth: "quick",
  crate: 5,
  checked: 12,
  not_found: 2,
  unchecked: 1,
  counts: { empty: 1, wrong_format: 1 },
  problems: [
    { id: 1, name: "Gone", artist: "A", file: "gone.mp3", problem: "empty", detail: "" },
    { id: 2, name: "Page", artist: "B", file: "page.mp3", problem: "wrong_format", detail: "html" },
  ],
};

const clear: FileScanReport = {
  depth: "quick",
  crate: null,
  checked: 8,
  not_found: 0,
  unchecked: 0,
  counts: {},
  problems: [],
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("scan-report")!.textContent || "";
}

describe("scan", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.scanToken = 0;
    state.crates = [{ id: 5, name: "Friday" }];
    wireScan();
    document.getElementById("scan-panel")!.hidden = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the selected crate and paints damaged files by problem", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadScan("quick");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/file-scan?space=Serato%20Library&crate=5&depth=quick",
    );
    expect(document.getElementById("scan-scope")!.textContent).toBe("Friday");
    expect(reportText()).toContain("12 files checked. 2 damaged files.");
    expect(reportText()).toContain("2 missing tracks were skipped");
    expect(reportText()).toContain("1 file has an extension");
    expect(reportText()).toContain("Empty file");
    expect(reportText()).toContain("A — Gone (gone.mp3) — Empty file");
    expect(reportText()).toContain("Looks like html");
    expect(document.getElementById("scan-quick")!.getAttribute("aria-busy")).toBe("false");
    expect(document.getElementById("scan-full")!.hasAttribute("disabled")).toBe(false);
  });

  it("runs a full decode when a crate is selected", async () => {
    const fetchMock = vi.fn(async () => reply({ ...report, depth: "full" }));
    vi.stubGlobal("fetch", fetchMock);
    await loadScan("full");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/file-scan?space=Serato%20Library&crate=5&depth=full",
    );
  });

  it("refuses a full decode of the whole space before asking the server", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadScan("full");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("scan-status")!.textContent).toBe(
      "Choose a crate for a full decode check.",
    );
    expect((document.getElementById("scan-full") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a clean report when nothing is damaged", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    state.activeCrate = "all";
    await loadScan("quick");
    expect(document.getElementById("scan-scope")!.textContent).toBe("Whole space");
    expect(reportText()).toContain("8 files checked. None damaged.");
    expect(reportText()).toContain("No damaged files in this check.");
    expect((document.getElementById("scan-full") as HTMLButtonElement).disabled).toBe(true);
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadScan("quick");
    const firstFinish = finish;
    const second = loadScan("quick");
    finish(reply(clear));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).toContain("None damaged.");
    expect(reportText()).not.toContain("gone.mp3");
  });

  it("shows the server error sentence when the check cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "Choose a quick or full check.", code: "scan_depth" }, 400)));
    await loadScan("quick");
    expect(document.getElementById("scan-status")!.textContent).toBe("Choose a quick or full check.");
    expect(document.activeElement).toBe(document.getElementById("scan-quick"));
  });

  it("shows the unreachable sentence when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadScan("quick");
    expect(document.getElementById("scan-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadScan("quick");
    setLocale("es");
    repaintScan();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("2 archivos dañados");
    expect(reportText()).toContain("Archivo vacío");
    expect(reportText()).not.toContain("Empty file");
    expect(document.getElementById("scan-scope")!.textContent).toBe("Friday");
  });

  it("gives every scan control a tooltip", () => {
    applyStaticTooltips();
    expect(document.getElementById("scan-quick")!.dataset.tooltipKey).toBe("tooltip.scanQuick");
    expect(document.getElementById("scan-full")!.dataset.tooltipKey).toBe("tooltip.scanFull");
    expect(document.querySelector<HTMLElement>('[data-view="scan"]')!.dataset.tooltipKey).toBe("tooltip.viewScan");
    const untipped = [...document.querySelectorAll<HTMLButtonElement>("#scan-panel button")].filter(
      (button) => !button.dataset.tooltipKey,
    );
    expect(untipped).toEqual([]);
  });
});
