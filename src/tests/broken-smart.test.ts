import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BrokenSmartPlan } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import {
  loadBrokenSmart,
  repaintBrokenSmart,
  unmountBrokenSmart,
  wireBrokenSmart,
} from "../lib/health/broken-smart";
import { setLocale } from "../lib/i18n";
import { state } from "../lib/state";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: BrokenSmartPlan = {
  checked: 2,
  crates: [
    {
      id: 8,
      name: "Warmup",
      path: "Warmup",
      reason: "missing_rules",
      restorable: true,
      source: "backup",
      source_at: "2026-11-01T12:00:00Z",
    },
    {
      id: 10,
      name: "Late",
      path: "Friday / Late",
      reason: "missing_rules",
      restorable: false,
      source: null,
      source_at: null,
    },
  ],
  written: false,
  preview: false,
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("broken-report")!.textContent || "";
}

describe("broken smart crates", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.writable = true;
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireBrokenSmart();
    document.getElementById("broken-panel")!.hidden = false;
    applyStaticTooltips(document);
  });

  afterEach(async () => {
    unmountBrokenSmart();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("lists a missing crate and leaves an unrestorable one unchecked", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadBrokenSmart();
    expect(fetchMock).toHaveBeenCalledWith("/api/broken-smart?space=Serato%20Library");
    expect(reportText()).toContain("2 smart crates checked. 2 lost their rules.");
    expect(reportText()).toContain("Warmup");
    expect(reportText()).toContain("Library backup");
    expect(reportText()).toContain("No saved rules were found");
    const boxes = [...document.querySelectorAll<HTMLInputElement>("[data-broken-id]")];
    expect(boxes.map((box) => box.dataset.brokenId)).toEqual(["8"]);
    expect(boxes[0]?.checked).toBe(true);
    expect((document.getElementById("broken-repair") as HTMLButtonElement).disabled).toBe(false);
  });

  it("previews the checked crates and confirms only those ids", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadBrokenSmart();
    postJSON.mockResolvedValueOnce({ ...report, preview: true, written: false, crates: [report.crates[0]] });
    document.getElementById("broken-repair")!.click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalled());
    await drainReactScheduler();
    expect(postJSON).toHaveBeenCalledWith("/api/broken-smart", {
      action: "preview",
      space: "Serato Library",
      ids: [8],
    });
    expect(reportText()).toContain("Nothing is written until you confirm");
    const confirm = document.querySelector<HTMLButtonElement>("[data-broken-action='confirm']");
    expect(confirm).not.toBeNull();
    postJSON.mockResolvedValueOnce({
      ...report,
      preview: false,
      written: true,
      snapshot_id: "snap-1",
      crates: [report.crates[0]],
    });
    vi.stubGlobal("fetch", vi.fn(async () => reply({ ...report, crates: [], checked: 0 })));
    confirm!.click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalledTimes(2));
    await drainReactScheduler();
    expect(postJSON).toHaveBeenLastCalledWith("/api/broken-smart", {
      action: "apply",
      space: "Serato Library",
      ids: [8],
      confirm: true,
    });
    expect(document.getElementById("broken-status")!.textContent).toContain("Restored rules for 1 smart crate.");
    expect((document.getElementById("broken-undo") as HTMLButtonElement).disabled).toBe(false);
  });

  it("does not repair a crate the DJ unchecked", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({
      ...report,
      crates: [
        report.crates[0],
        { ...report.crates[0], id: 11, name: "Other", path: "Other" },
      ],
    })));
    await loadBrokenSmart();
    document.querySelector<HTMLInputElement>("[data-broken-id='11']")!.click();
    await drainReactScheduler();
    postJSON.mockResolvedValueOnce({ ...report, preview: true, crates: [report.crates[0]] });
    document.getElementById("broken-repair")!.click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalled());
    await drainReactScheduler();
    expect(postJSON).toHaveBeenCalledWith("/api/broken-smart", {
      action: "preview",
      space: "Serato Library",
      ids: [8],
    });
  });

  it("gives every broken-smart control a tooltip distinct from its name", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadBrokenSmart();
    postJSON.mockResolvedValueOnce({ ...report, preview: true, written: false });
    document.getElementById("broken-repair")!.click();
    await vi.waitFor(() => expect(postJSON).toHaveBeenCalled());
    await drainReactScheduler();
    expect(document.getElementById("broken-refresh")!.dataset.tooltipKey).toBe("tooltip.brokenRefresh");
    expect(document.getElementById("broken-repair")!.dataset.tooltipKey).toBe("tooltip.brokenRepair");
    expect(document.getElementById("broken-undo")!.dataset.tooltipKey).toBe("tooltip.brokenUndo");
    expect(document.querySelector<HTMLElement>('[data-view="broken"]')!.dataset.tooltipKey).toBe("tooltip.viewBroken");
    const box = document.querySelector<HTMLInputElement>("[data-broken-id='8']");
    expect(box!.dataset.tooltipKey).toBe("tooltip.brokenPick");
    expect(box!.dataset.tooltipKey).not.toBe(box!.getAttribute("aria-label"));
    const confirm = document.querySelector<HTMLButtonElement>("[data-broken-action='confirm']");
    expect(confirm!.dataset.tooltipKey).toBe("tooltip.brokenConfirm");
    expect(confirm!.dataset.tooltipKey).not.toBe(confirm!.textContent?.trim());
    expect(document.getElementById("broken-refresh")!.dataset.tooltip).not.toBe(
      document.getElementById("broken-refresh")!.textContent?.trim(),
    );
  });

  it("repaints in Spanish without fetching again", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadBrokenSmart();
    setLocale("es");
    repaintBrokenSmart();
    await drainReactScheduler();
    expect(reportText()).toContain("Copia de la biblioteca");
    expect(reportText()).toContain("No se encontraron reglas guardadas");
  });
});
