import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bridge } from "../lib/bridge";
import { el } from "../lib/dom";
import { wireGigCheck } from "../lib/gig/gig";
import { buildTonightCrates } from "../lib/gig/tonight";
import { setLocale } from "../lib/i18n";
import { cancelConfirm } from "../lib/ui/shared-dialog";
import { mountSharedDialogs, unmountSharedDialogs } from "../lib/ui/shared-dialog-mount";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { state } from "../lib/state";
import { drainReactScheduler, installPage } from "./test-page";

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stubTonightFetch(opts: { childCount?: number; written?: boolean } = {}) {
  const childCount = opts.childCount ?? 3;
  const written = opts.written ?? true;
  const children = Array.from({ length: childCount }, (_, index) => ({
    kind: index === 0 ? "newest" : index === 1 ? "played" : "decade",
    name: index === 0 ? "Newest adds" : index === 1 ? "Most played" : "2020s",
    count: 2,
  }));
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/tonight" && init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { action?: string; confirm?: boolean };
      if (body.action === "preview" || (body.action === "create" && body.confirm !== true)) {
        return reply({
          preview: true,
          written: false,
          folder: "_crateCraft generated",
          tonight: "Tonight",
          children,
          count: childCount * 2,
        });
      }
      return reply({
        preview: false,
        written,
        folder: "_crateCraft generated",
        tonight: "Tonight",
        children,
        count: childCount * 2,
        id: 42,
        name: "Tonight",
      });
    }
    if (url.startsWith("/api/gig-check")) {
      return reply({
        ready: true,
        score: 100,
        hard_red: false,
        holding_it_back: [],
        scope: { space: "Serato Library", crate_id: null, crate_name: null },
      });
    }
    return reply({ crates: [] });
  });
}

function postBodies(fetchMock: ReturnType<typeof vi.fn>): Array<{ action?: string; confirm?: boolean }> {
  return fetchMock.mock.calls
    .filter((call) => (call[1] as RequestInit | undefined)?.method === "POST")
    .map((call) => JSON.parse(String((call[1] as RequestInit).body)) as { action?: string; confirm?: boolean });
}

describe("tonight crates", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    state.space = "Serato Library";
    state.writable = true;
    state.gigToken = 0;
    bridge.reloadLibrary = vi.fn(() => Promise.resolve());
    bridge.lockDown = vi.fn();
    vi.stubGlobal("confirm", () => {
      throw new Error("window.confirm should not run");
    });
    wireGigCheck(() => {});
    mountSharedDialogs();
    applyStaticTooltips(document.body);
    document.getElementById("gig-panel")!.hidden = false;
  });

  afterEach(async () => {
    const confirm = document.getElementById("confirm-dialog") as HTMLDialogElement | null;
    if (confirm?.open) cancelConfirm();
    unmountSharedDialogs();
    await drainReactScheduler();
    vi.unstubAllGlobals();
    setLocale("en");
  });

  it("wires a tooltip distinct from the button label", () => {
    const button = document.getElementById("tonight-build") as HTMLButtonElement;
    expect(button.textContent).toContain("Tonight crates");
    expect(button.dataset.tooltipKey).toBe("tooltip.gigTonight");
    expect(button.dataset.tooltipKey).not.toBe(button.textContent?.trim());
  });

  it("opens a labeled confirm then posts create with confirm", async () => {
    const fetchMock = stubTonightFetch();
    vi.stubGlobal("fetch", fetchMock);
    const run = buildTonightCrates();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    expect(el("confirm-title").textContent).toBe("Tonight crates");
    expect(el("confirm-message").textContent).toContain("_crateCraft generated");
    expect(el("confirm-message").textContent).toContain("Tonight");
    el("confirm-confirm").click();
    await run;
    await vi.waitFor(() => {
      expect(document.getElementById("gig-status")!.textContent).toContain("Tonight crates ready");
    });
    expect(postBodies(fetchMock)).toEqual([
      { action: "preview", space: "Serato Library" },
      { action: "create", confirm: true, space: "Serato Library" },
    ]);
    expect(bridge.reloadLibrary).toHaveBeenCalled();
    expect(el("confirm-dialog").open).toBe(false);
  });

  it("does not write when the confirm is cancelled", async () => {
    const fetchMock = stubTonightFetch();
    vi.stubGlobal("fetch", fetchMock);
    const run = buildTonightCrates();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    el("confirm-cancel").click();
    await run;
    expect(postBodies(fetchMock)).toEqual([{ action: "preview", space: "Serato Library" }]);
    expect(bridge.reloadLibrary).not.toHaveBeenCalled();
  });

  it("shows empty when no children would be made", async () => {
    const fetchMock = stubTonightFetch({ childCount: 0 });
    vi.stubGlobal("fetch", fetchMock);
    await buildTonightCrates();
    expect(document.getElementById("gig-status")!.textContent).toBe("No tracks fit tonight crates.");
    expect(postBodies(fetchMock)).toEqual([{ action: "preview", space: "Serato Library" }]);
  });

  it("shows the confirm in Spanish", async () => {
    setLocale("es");
    applyStaticTooltips(document.body);
    const fetchMock = stubTonightFetch();
    vi.stubGlobal("fetch", fetchMock);
    const run = buildTonightCrates();
    await vi.waitFor(() => expect(el("confirm-dialog").open).toBe(true));
    expect(el("confirm-title").textContent).toBe("Cajas de esta noche");
    expect(el("confirm-confirm").textContent).toBe("Cajas de esta noche");
    el("confirm-cancel").click();
    await run;
  });
});
