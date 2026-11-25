/**
 * Backup Mac copy and the Backups panel controls.
 */

import { createElement, act } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return { ...actual, postJSON };
});

import { AppProviders } from "../app/providers";
import { LanStagePanel } from "../components/LanStagePanel";
import { t } from "../lib/i18n";
import { state } from "../lib/state";
import { byteText, canPreview, canSend, reasonText, stageStatusText } from "../lib/snapshots/lan-stage-view";
import { drainReactScheduler, installPage } from "./test-page";

describe("lan-stage-view", () => {
  it("counts bytes and refuses a send that was not previewed", () => {
    expect(byteText(12)).toBe(t("lanStage.sizeB", { count: 12 }));
    expect(byteText(2048)).toBe(t("lanStage.sizeK", { count: 2 }));
    expect(canPreview([])).toBe(false);
    expect(canPreview([4])).toBe(true);
    expect(canSend([4], [4], "")).toBe(false);
    expect(canSend([4], [4], "abc")).toBe(true);
    expect(canSend([4, 5], [4], "abc")).toBe(false);
    expect(canSend([5, 4], [4, 5], "abc")).toBe(true);
    expect(reasonText("offline")).toBe(t("lanStage.reason.offline"));
    expect(reasonText("nope")).toBe(t("lanStage.reason.unknown"));
    expect(stageStatusText({ file_count: 2, byte_count: 2048, skipped_count: 1, failed_count: 0 })).toContain("2");
  });
});

describe("LanStagePanel", () => {
  let root: Root | undefined;
  const crates = state.crates;

  beforeEach(() => {
    installPage();
    postJSON.mockReset();
    state.crates = [{ id: 7, name: "Peak time" }];
  });

  afterEach(() => {
    state.crates = crates;
    if (root) {
      root.unmount();
      root = undefined;
    }
    drainReactScheduler();
  });

  function render(): HTMLElement {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    flushSync(() => {
      root!.render(createElement(AppProviders, { children: createElement(LanStagePanel) }));
    });
    return host;
  }

  it("gives every new control a tooltip that is not its label", () => {
    const host = render();
    expect(host.querySelector("#lan-stage-heading")?.textContent).toBe(t("lanStage.heading"));
    expect(host.textContent).toContain(t("lanStage.never"));
    const buttons = ["lan-stage-listen", "lan-stage-stop", "lan-stage-refresh", "lan-stage-preview", "lan-stage-send", "lan-stage-accept", "lan-stage-accept-confirm", "lan-stage-undo", "lan-stage-discard", "lan-stage-discard-confirm"];
    for (const id of buttons) {
      const button = host.querySelector<HTMLButtonElement>(`#${id}`);
      expect(button, id).not.toBeNull();
      const tip = button?.getAttribute("data-tooltip") ?? "";
      expect(tip.length, id).toBeGreaterThan(0);
      expect(tip, id).not.toBe(button?.textContent);
      expect(tip, id).not.toBe(button?.getAttribute("aria-label"));
    }
    const crate = host.querySelector<HTMLInputElement>("#lan-stage-crate-7");
    expect(crate?.getAttribute("aria-label")).toBe("Peak time");
    expect(crate?.getAttribute("data-tooltip")).toBe(t("tooltip.lanStageCrate"));
    expect(crate?.getAttribute("data-tooltip")).not.toBe("Peak time");
    expect(host.querySelector<HTMLButtonElement>("#lan-stage-preview")?.disabled).toBe(true);
    expect(host.querySelector<HTMLButtonElement>("#lan-stage-send")?.disabled).toBe(true);
  });

  it("previews before send and only the send confirms", async () => {
    postJSON.mockImplementation(async (_url: string, body: { action?: string; confirm?: boolean }) => {
      if (body.action === "preview") {
        return { preview: true, written: false, library_written: false, auto_mirror: false, fingerprint: "abc", file_count: 2, byte_count: 40, skipped_count: 1, failed_count: 0, crates: [{ id: 7, name: "Peak time" }] };
      }
      return { preview: false, staged: true, library_written: false, auto_mirror: false, sent: 2, file_count: 2, byte_count: 40, skipped_count: 1, failed_count: 0 };
    });
    const host = render();
    await act(async () => {
      host.querySelector<HTMLInputElement>("#lan-stage-crate-7")?.click();
    });
    const preview = host.querySelector<HTMLButtonElement>("#lan-stage-preview");
    expect(preview?.disabled).toBe(false);
    await act(async () => {
      preview?.click();
      await drainReactScheduler();
    });
    expect(postJSON).toHaveBeenCalledWith("/api/lan-stage", expect.objectContaining({ action: "preview", crates: [7] }));
    expect(host.querySelector<HTMLButtonElement>("#lan-stage-send")?.disabled).toBe(true);
    await act(async () => {
      const hostField = host.querySelector<HTMLInputElement>("#lan-stage-host");
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(hostField, "127.0.0.1");
      hostField?.dispatchEvent(new Event("input", { bubbles: true }));
      hostField?.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(host.querySelector<HTMLButtonElement>("#lan-stage-send")?.disabled).toBe(false);
    await act(async () => {
      host.querySelector<HTMLButtonElement>("#lan-stage-send")?.click();
      await drainReactScheduler();
    });
    expect(postJSON).toHaveBeenCalledWith("/api/lan-stage", expect.objectContaining({
      action: "send",
      confirm: true,
      fingerprint: "abc",
      host: "127.0.0.1",
    }));
  });
});
