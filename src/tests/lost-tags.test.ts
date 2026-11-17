import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LostTagsPlan } from "../lib/api-types";
import { bridge } from "../lib/bridge";
import { loadLostTags, repaintLostTags, unmountLostTags, wireLostTags } from "../lib/health/lost-tags";
import { setLocale } from "../lib/i18n";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, postJSON };
});

const report: LostTagsPlan = {
  checked: 3,
  unreadable: 1,
  fixes: [
    {
      asset_id: 1,
      path: "/music/blank.mp3",
      current: { name: "", artist: "" },
      proposed: { name: "File Title", artist: "File Artist" },
    },
    {
      asset_id: 2,
      path: "/music/title.mp3",
      current: { name: "", artist: "Kept Artist" },
      proposed: { name: "File Title" },
    },
  ],
};

const clear: LostTagsPlan = {
  checked: 3,
  unreadable: 0,
  fixes: [],
};

const written: LostTagsPlan = {
  ...report,
  written: true,
  preview: false,
};

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function reportText(): string {
  return document.getElementById("lost-report")!.textContent || "";
}

describe("lost tags", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.writable = true;
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    wireLostTags();
    document.getElementById("lost-panel")!.hidden = false;
  });

  afterEach(async () => {
    unmountLostTags();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("asks for the open space and paints blank fields the file can fill", async () => {
    const fetchMock = vi.fn(async () => reply(report));
    vi.stubGlobal("fetch", fetchMock);
    await loadLostTags();
    expect(fetchMock).toHaveBeenCalledWith("/api/lost-tags?space=Serato%20Library");
    expect(document.getElementById("lost-scope")!.textContent).toBe("Whole space");
    expect(reportText()).toContain("3 tracks with a blank field. 2 can be filled from the file.");
    expect(reportText()).toContain("1 file could not be read.");
    expect(reportText()).toContain("/music/blank.mp3");
    expect(reportText()).toContain("File Artist — File Title");
    expect(reportText()).toContain("Kept Artist");
    expect(document.querySelector('#lost-report .MuiDataGrid-columnHeader[data-field="path"]')).not.toBeNull();
    expect(document.getElementById("lost-refresh")!.getAttribute("aria-busy")).toBe("false");
    expect((document.getElementById("lost-apply") as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows a clean report when nothing can be filled", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(clear)));
    await loadLostTags();
    expect(reportText()).toContain("3 tracks with a blank field. None can be filled from the file.");
    expect(reportText()).toContain("No blank title or artist the file can fill.");
    expect((document.getElementById("lost-apply") as HTMLButtonElement).disabled).toBe(true);
  });

  it("ignores a late reply after a newer check started", async () => {
    let finish: (value: Response) => void = () => {};
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const first = loadLostTags();
    const firstFinish = finish;
    const second = loadLostTags();
    finish(reply(clear));
    await second;
    firstFinish(reply(report));
    await first;
    expect(reportText()).toContain("None can be filled");
    expect(reportText()).not.toContain("blank.mp3");
  });

  it("shows the server error sentence when the plan cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply({ error: "That space is not available here.", code: "space_unavailable" }, 400)));
    await loadLostTags();
    expect(document.getElementById("lost-status")!.textContent).toBe("That space is not available here.");
    expect(document.activeElement).toBe(document.getElementById("lost-refresh"));
  });

  it("shows the unreachable sentence when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await loadLostTags();
    expect(document.getElementById("lost-status")!.textContent).toContain("Couldn't reach the library server");
  });

  it("repaints the last report on a language change without asking the server again", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(reply(report)));
    vi.stubGlobal("fetch", fetchMock);
    await loadLostTags();
    setLocale("es");
    repaintLostTags();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(reportText()).toContain("se pueden rellenar");
    expect(reportText()).not.toContain("can be filled from the file");
    expect(document.getElementById("lost-scope")!.textContent).toBe("Todo el espacio");
  });

  it("applies every visible fix and omits ids", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply(report))
      .mockResolvedValueOnce(reply(clear));
    vi.stubGlobal("fetch", fetchMock);
    postJSON.mockResolvedValueOnce(written);
    await loadLostTags();
    document.getElementById("lost-apply")!.click();
    await vi.waitFor(() => expect(bridge.reloadLibrary).toHaveBeenCalled());
    expect(postJSON).toHaveBeenCalledTimes(1);
    expect(postJSON).toHaveBeenCalledWith("/api/lost-tags", {
      action: "apply",
      space: "Serato Library",
    });
    expect(document.getElementById("lost-status")!.textContent).toContain("Filled 2 tracks.");
    expect(reportText()).toContain("None can be filled");
    expect((document.getElementById("lost-apply") as HTMLButtonElement).disabled).toBe(true);
  });

  it("locks the page on a 409 from apply", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    const locked = Object.assign(new Error("Quit Serato DJ before writing."), {
      status: 409,
      payload: { error: "Quit Serato DJ before writing.", serato: { writable: false } },
    });
    postJSON.mockRejectedValueOnce(locked);
    await loadLostTags();
    document.getElementById("lost-apply")!.click();
    await vi.waitFor(() => expect(bridge.lockDown).toHaveBeenCalled());
    expect(document.getElementById("lost-status")!.textContent).toContain("Quit Serato DJ before writing.");
  });

  it("keeps Apply off while the library is locked", async () => {
    state.writable = false;
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    await loadLostTags();
    expect((document.getElementById("lost-apply") as HTMLButtonElement).disabled).toBe(true);
  });

  it("gives every lost-tags control a tooltip", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(report)));
    applyStaticTooltips();
    expect(document.getElementById("lost-refresh")!.dataset.tooltipKey).toBe("tooltip.lostRefresh");
    expect(document.getElementById("lost-apply")!.dataset.tooltipKey).toBe("tooltip.lostApply");
    expect(document.querySelector<HTMLElement>('[data-view="lost"]')!.dataset.tooltipKey).toBe("tooltip.viewLost");
  });
});
