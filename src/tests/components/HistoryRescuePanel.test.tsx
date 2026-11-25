/**
 * Rescue sessions lists each session so the DJ can choose rows.
 */

import { createElement, act } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../app/providers";
import { HistoryRescuePanel } from "../../components/HistoryRescuePanel";
import { t } from "../../lib/i18n";
import { drainReactScheduler, installPage } from "../test-page";

const catalog = {
  sources: [
    { id: "live", label: "Live library", status: "ok" },
    { id: "backup:night", label: "night", status: "ok" },
  ],
};

const compared = {
  only_source: [{ id: 9, name: "Lost night" }],
  only_live: [{ id: 3, name: "Friday" }],
  disagree: [{ source: { id: 5, name: "Changed" }, live: { id: 4, name: "Live" } }],
  only_source_count: 1,
  only_live_count: 1,
  disagree_count: 1,
};

describe("HistoryRescuePanel", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    installPage();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    root.unmount();
    host.remove();
    vi.unstubAllGlobals();
  });

  it("lists id, name, and side and lets the DJ select a source session", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("source=")) {
        return new Response(JSON.stringify(compared), { status: 200 });
      }
      return new Response(JSON.stringify(catalog), { status: 200 });
    }));
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(HistoryRescuePanel) }));
    });
    expect(host.querySelector("#history-rescue-sessions")?.textContent).toContain(
      t("historyRescue.sessionsEmpty"),
    );
    expect(host.querySelector("input[type='text']")).toBeNull();

    await act(async () => {
      host.querySelector<HTMLButtonElement>("#history-rescue-scan")?.click();
      await drainReactScheduler();
    });
    const select = host.querySelector<HTMLSelectElement>("#history-rescue-source");
    expect(select?.querySelector("option[value='backup:night']")).not.toBeNull();
    await act(async () => {
      if (!select) return;
      select.value = "backup:night";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => {
      host.querySelector<HTMLButtonElement>("#history-rescue-compare")?.click();
      await drainReactScheduler();
    });

    const boxes = [...host.querySelectorAll<HTMLInputElement>("#history-rescue-sessions input")];
    expect(boxes).toHaveLength(3);
    const labels = boxes.map((box) => box.getAttribute("aria-label") ?? "");
    expect(labels.some((label) => label.includes("9") && label.includes("Lost night") && label.includes(t("historyRescue.sideOnlySource")))).toBe(true);
    expect(labels.some((label) => label.includes("5") && label.includes("Changed") && label.includes(t("historyRescue.sideDisagree")))).toBe(true);
    expect(labels.some((label) => label.includes("3") && label.includes("Friday") && label.includes(t("historyRescue.sideOnlyLive")))).toBe(true);
    const live = boxes.find((box) => (box.getAttribute("aria-label") ?? "").includes("Friday"));
    expect(live?.disabled).toBe(true);
    const source = boxes.find((box) => (box.getAttribute("aria-label") ?? "").includes("Lost night"));
    expect(source?.disabled).toBe(false);
    expect(source?.getAttribute("data-tooltip")).toBe(t("tooltip.historyRescueSession"));
    expect(source?.getAttribute("data-tooltip")).not.toBe(source?.getAttribute("aria-label"));
    await act(async () => {
      source?.click();
    });
    expect(source?.checked).toBe(true);
    expect(host.querySelector<HTMLButtonElement>("#history-rescue-restore")?.disabled).toBe(false);
  });
});
