/**
 * Snapshots view renders from one React snapshots context.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../../lib/api")>("../../lib/api");
  return { ...actual, postJSON };
});

import { AppProviders } from "../../app/providers";
import { t } from "../../lib/i18n";
import { state } from "../../lib/state";
import { installPage } from "../test-page";
import { SnapshotsPanel } from "../../pages/SnapshotsPanel";
import { RestoreDialog } from "../../pages/RestoreDialog";

function headerFields(root: ParentNode): string[] {
  return [...root.querySelectorAll<HTMLElement>("#snapshots-list .MuiDataGrid-columnHeader")]
    .map((node) => node.getAttribute("data-field") ?? "");
}

function snapshotResponse(): Response {
  return new Response(JSON.stringify({
    snapshots: state.snapshots,
    pending_undo: null,
    write_block: "",
    serato_running: false,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("SnapshotsPanel context", () => {
  beforeEach(() => {
    installPage();
    postJSON.mockReset();
    vi.stubGlobal("fetch", vi.fn(async () => snapshotResponse()));
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
        integrity: "ok",
      },
    ];
  });

  it("renders a Data Grid of when, size, and status with Restore as a row action", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(SnapshotsPanel) }));
    });
    expect(host.querySelector("#snapshots-list .MuiDataGrid-root")).not.toBeNull();
    expect(headerFields(host)).toEqual(["created", "size", "status", "restore"]);
    expect(host.querySelector("#snapshots-list")?.textContent).toContain("2026-01-01 12:00");
    expect(host.querySelector("#snapshots-list")?.textContent).toContain("manual");
    expect(host.querySelector("#snapshots-list")?.textContent).toContain(t("snapshots.sizeUnknown"));
    expect(host.querySelector("#snapshots-list")?.textContent).toContain(t("snapshots.statusOk"));
    expect(
      host.querySelector<HTMLButtonElement>('#snapshots-list .MuiDataGrid-cell[data-field="restore"] button')?.textContent,
    ).toBe(t("snapshots.reviewRestore"));
    expect(host.querySelector("#snapshots-take")?.getAttribute("data-tooltip")).toBe(t("tooltip.snapshotsTake"));
    expect(host.querySelector("#snapshots-drives")?.getAttribute("data-tooltip")).not.toBe(
      host.querySelector("#snapshots-drives")?.getAttribute("aria-label"),
    );
    expect(host.querySelector("#operations-list")?.textContent).toContain(t("operations.empty"));
    root.unmount();
  });

  it("posts create when Take a backup is pressed", async () => {
    postJSON.mockResolvedValue({ ok: true });
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(SnapshotsPanel) }));
    });
    host.querySelector<HTMLButtonElement>("#snapshots-take")?.click();
    await vi.waitFor(() => {
      expect(postJSON).toHaveBeenCalledWith("/api/snapshots", { action: "create" });
    });
    root.unmount();
  });

  it("keeps restore confirm off when the plan is blocked and uses an MUI Dialog", async () => {
    postJSON.mockResolvedValue({ restore_blocked: "Quit Serato before restoring." });
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, {
        children: createElement("div", null, createElement(SnapshotsPanel), createElement(RestoreDialog)),
      }));
    });
    host.querySelector<HTMLButtonElement>('#snapshots-list .MuiDataGrid-cell[data-field="restore"] button')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector(".MuiDialog-root")).not.toBeNull();
      expect(document.getElementById("snapshot-dialog")?.getAttribute("role")).toBe("dialog");
      expect(document.getElementById("snapshot-block")?.textContent).toBe("Quit Serato before restoring.");
      expect((document.getElementById("snapshot-confirm") as HTMLButtonElement).disabled).toBe(true);
    });
    root.unmount();
  });

  it("shows the write-block reason on the panel", () => {
    state.writeBlock = "Quit Serato before restoring.";
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(SnapshotsPanel) }));
    });
    const block = host.querySelector("#snapshots-block");
    expect(block?.textContent).toBe("Quit Serato before restoring.");
    expect(block instanceof HTMLElement && block.hidden).toBe(false);
    root.unmount();
  });
});
