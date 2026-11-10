/**
 * Snapshots view renders from one React snapshots context.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, postJSON };
});

import { AppProviders } from "../app/providers";
import { t } from "../i18n";
import { state } from "../state";
import { installPage } from "../test-page";
import { SnapshotsPanel } from "./SnapshotsPanel";

describe("SnapshotsPanel context", () => {
  beforeEach(() => {
    installPage();
    postJSON.mockReset();
    state.snapshotLoading = false;
    state.snapshotError = "";
    state.snapshotMessage = "";
    state.snapshotUndo = null;
    state.writeBlock = "";
    state.writeBlockCode = "";
    state.writeBlockParams = null;
    state.driveBackup = null;
    state.operations = [];
    state.operationsLoading = false;
    state.operationsError = "";
    state.snapshots = [
      {
        id: "snap-1",
        created: "2026-01-01 12:00",
        trigger: "manual",
        serato_version: "4.0.10",
        serato_build: "4010213",
        reason: "Safety copy",
      },
    ];
  });

  it("renders the list from SnapshotsContext", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(SnapshotsPanel) }));
    });
    expect(host.querySelector("#snapshots-list")?.textContent).toContain("2026-01-01 12:00");
    expect(host.querySelector("#snapshots-list")?.textContent).toContain("manual");
    expect(host.querySelector("#snapshots-list button")?.textContent).toBe(t("snapshots.reviewRestore"));
    expect(host.querySelector("#snapshots-take")?.getAttribute("data-tooltip")).toBe(t("tooltip.snapshotsTake"));
    expect(host.querySelector("#snapshots-drives")?.getAttribute("data-tooltip")).not.toBe(
      host.querySelector("#snapshots-drives")?.getAttribute("aria-label"),
    );
    root.unmount();
  });

  it("keeps restore confirm off when the plan is blocked", async () => {
    postJSON.mockResolvedValue({ restore_blocked: "Quit Serato before restoring." });
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(SnapshotsPanel) }));
    });
    host.querySelector<HTMLButtonElement>("#snapshots-list button")?.click();
    await vi.waitFor(() => {
      expect(document.getElementById("snapshot-block")?.textContent).toBe("Quit Serato before restoring.");
      expect((document.getElementById("snapshot-confirm") as HTMLButtonElement).disabled).toBe(true);
    });
    root.unmount();
  });
});
