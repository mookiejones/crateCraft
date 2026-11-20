import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EnergyPlan } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import { loadEnergy, repaintEnergy, unmountEnergy, wireEnergy } from "../lib/health/energy";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: EnergyPlan = {
  checked: 4,
  unreadable: 1,
  fixes: [
    {
      asset_id: 1,
      path: "/music/quiet.wav",
      grouping: "",
      energy: 7,
      source: "tag",
      proposed: "Energy 7",
    },
    {
      asset_id: 2,
      path: "/music/loud.wav",
      grouping: " ",
      energy: 4,
      source: "audio",
      proposed: "Energy 4",
    },
  ],
};

const clear: EnergyPlan = {
  checked: 4,
  unreadable: 0,
  fixes: [],
};

const written: EnergyPlan = {
  ...report,
  written: true,
  preview: false,
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("energy-report")!.textContent || "";
}

describe("energy", () => {
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
    wireEnergy();
    document.getElementById("energy-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountEnergy();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the selected crate and paints blank Grouping rows", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadEnergy();
    expect(fetchMock).toHaveBeenCalledWith("/api/energy?space=Serato%20Library&crate=5");
    expect(document.getElementById("energy-scope")!.textContent).toBe("Friday");
    expect(reportText()).toContain("4 tracks checked. 2 can take an energy level.");
    expect(reportText()).toContain("1 file could not be read.");
    expect(reportText()).toContain("/music/quiet.wav");
    expect(reportText()).toContain("From the file");
    expect(reportText()).toContain("From the audio");
    expect(reportText()).toContain("Energy 7");
    expect(document.querySelector('#energy-report .MuiDataGrid-columnHeader[data-field="energy"]')).not.toBeNull();
    expect(document.getElementById("energy-refresh")!.getAttribute("aria-busy")).toBe("false");
    expect((document.getElementById("energy-apply") as HTMLButtonElement).disabled).toBe(false);
  });

  it("refuses a check of All tracks before asking the server", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadEnergy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("energy-status")!.textContent).toBe(
      "Choose a crate for an energy check.",
    );
    expect((document.getElementById("energy-refresh") as HTMLButtonElement).disabled).toBe(true);
    expect((document.getElementById("energy-apply") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a clean report when nothing can be written", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadEnergy();
    expect(reportText()).toContain("4 tracks checked. None can take an energy level.");
    expect(reportText()).toContain("No blank Grouping field can take an energy level.");
    expect((document.getElementById("energy-apply") as HTMLButtonElement).disabled).toBe(true);
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadEnergy();
    const firstFinish = finish;
    const second = loadEnergy();
    finish(reply(clear));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).toContain("None can take an energy level");
    expect(reportText()).not.toContain("quiet.wav");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadEnergy();
    setLocale("es");
    repaintEnergy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("Del archivo");
    expect(reportText()).not.toContain("From the file");
    expect(document.getElementById("energy-scope")!.textContent).toBe("Friday");
  });

  it("applies the open crate and reloads the library", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply(report))
      .mockResolvedValueOnce(reply(clear));
    vi.stubGlobal("fetch", fetchMock);
    postJSON.mockResolvedValueOnce(written);
    await loadEnergy();
    document.getElementById("energy-apply")!.click();
    await vi.waitFor(() => expect(bridge.reloadLibrary).toHaveBeenCalled());
    expect(postJSON).toHaveBeenCalledTimes(1);
    expect(postJSON).toHaveBeenCalledWith("/api/energy", {
      action: "apply",
      space: "Serato Library",
      crate: 5,
    });
    expect(document.getElementById("energy-status")!.textContent).toContain("Wrote energy on 2 tracks.");
    expect(reportText()).toContain("None can take an energy level");
    expect((document.getElementById("energy-apply") as HTMLButtonElement).disabled).toBe(true);
  });

  it("locks the page on a 409 from apply", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    const locked = Object.assign(new Error("Quit Serato DJ before writing."), {
      status: 409,
      payload: { error: "Quit Serato DJ before writing.", serato: { writable: false } },
    });
    postJSON.mockRejectedValueOnce(locked);
    await loadEnergy();
    document.getElementById("energy-apply")!.click();
    await vi.waitFor(() => expect(bridge.lockDown).toHaveBeenCalled());
    expect(document.getElementById("energy-status")!.textContent).toContain("Quit Serato DJ before writing.");
  });

  it("keeps Apply off while the library is locked", async () => {
    state.writable = false;
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadEnergy();
    expect((document.getElementById("energy-apply") as HTMLButtonElement).disabled).toBe(true);
  });

  it("gives every energy control a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    applyStaticTooltips();
    expect(document.getElementById("energy-refresh")!.dataset.tooltipKey).toBe("tooltip.energyRefresh");
    expect(document.getElementById("energy-apply")!.dataset.tooltipKey).toBe("tooltip.energyApply");
    expect(document.querySelector<HTMLElement>('[data-view="energy"]')!.dataset.tooltipKey).toBe("tooltip.viewEnergy");
  });
});
