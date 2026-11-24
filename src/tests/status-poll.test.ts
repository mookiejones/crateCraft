/**
 * Status poll: banner refreshes when Serato quits and coded blocks show.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyStatus, statusLine } from "../lib/ui/views";
import {
  paintStatusRefresh,
  refreshStatus,
  stopStatusPoll,
  wireStatusPoll,
} from "../lib/ui/status-poll";
import { t } from "../lib/i18n";
import { state } from "../lib/state";
import { installPage } from "./test-page";

describe("status poll", () => {
  beforeEach(() => {
    installPage();
    state.serato = null;
    state.writable = true;
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopStatusPoll();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("updates the banner when open goes false without a reload", async () => {
    applyStatus({
      writable: false,
      open: true,
      message: "Serato DJ Pro is open. Edits stay off until it quits.",
    });
    expect(document.getElementById("status")?.hidden).toBe(false);
    expect(document.getElementById("status")?.textContent).toContain("is open");
    expect(state.writable).toBe(false);

    applyStatus({
      writable: true,
      open: false,
      message: "Serato is quit. Edits save to the library.",
    });
    expect(document.getElementById("status")?.hidden).toBe(true);
    expect(state.writable).toBe(true);
  });

  it("shows a coded write_block instead of the open sentence", () => {
    applyStatus({
      writable: false,
      open: false,
      code: "serato_version_unknown",
      params: { build: "unknown" },
      message: "Serato version is unknown (build unknown).",
    });
    expect(document.getElementById("status")?.hidden).toBe(false);
    expect(statusLine(state.serato)).toBe(t("error.serato_version_unknown", { build: "unknown" }));
    expect(document.getElementById("status")?.textContent).toBe(
      t("error.serato_version_unknown", { build: "unknown" }),
    );
    expect(document.getElementById("status")?.textContent).not.toContain("is open");
  });

  it("paints Check again only while locked, with a distinct tooltip", () => {
    paintStatusRefresh({ writable: true, message: "quit" });
    const button = document.getElementById("status-refresh") as HTMLButtonElement;
    expect(button.hidden).toBe(true);
    paintStatusRefresh({ writable: false, message: "open" });
    expect(button.hidden).toBe(false);
    expect(button.textContent).toBe(t("status.checkAgain"));
    expect(button.getAttribute("aria-label")).toBe(t("status.checkAgain"));
    expect(button.dataset.tooltip).toBe(t("tooltip.statusRefresh"));
    expect(button.dataset.tooltip).not.toBe(button.getAttribute("aria-label"));
  });

  it("polls /api/status while visible and applies the payload", async () => {
    const payloads: SeratoLike[] = [
      {
        writable: false,
        open: true,
        message: "Serato DJ Pro is open. Edits stay off until it quits.",
      },
      {
        writable: false,
        open: false,
        code: "serato_version_unknown",
        params: { build: "unknown" },
        message: "Serato version is unknown (build unknown).",
      },
    ];
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const body = payloads[Math.min(calls, payloads.length - 1)];
        calls += 1;
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    wireStatusPoll({ applyStatus, setNotice: () => {} });
    await refreshStatus();
    expect(document.getElementById("status")?.textContent).toContain("is open");
    await vi.advanceTimersByTimeAsync(5000);
    await Promise.resolve();
    expect(calls).toBeGreaterThanOrEqual(2);
    expect(document.getElementById("status")?.textContent).toBe(
      t("error.serato_version_unknown", { build: "unknown" }),
    );
    expect(state.writable).toBe(false);
  });
});

type SeratoLike = {
  writable: boolean;
  open?: boolean;
  code?: string;
  params?: Record<string, string>;
  message: string;
};
