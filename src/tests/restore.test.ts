import { beforeEach, describe, expect, it, vi } from "vitest";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return { ...actual, postJSON };
});

import { applyStatic, setLocale, t } from "../lib/i18n";
import { el } from "../lib/dom";
import { backupDriveCrates, confirmSnapshotRestore, openSnapshotPlan, renderOperations, renderSnapshots, repaintSnapshotPlan } from "../lib/snapshots/restore";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import type { RestorePlan } from "../lib/api-types";
import { state } from "../lib/state";
import { installPage } from "./test-page";

const plan: RestorePlan = {
  crates: {
    added: [{ name: "House" }],
    removed: [],
    changed: [],
    unavailable: [],
  },
  tracks: {
    added: [{ path: "Music/a.mp3" }],
    removed: [],
    unavailable: [],
  },
  cues: [{
    path: "Music/a.mp3",
    before: { cues: [{ index: 0, start_ms: 1500, color: "#CC0000", name: "Drop" }] },
    after: { cues: [{ index: 0, start_ms: 8000, color: "#CC0000", name: "Break" }] },
  }],
  grids: [{ path: "Music/b.mp3" }],
  deleted: {
    crates: [{ name: "Old" }],
    tracks: [],
    cues: [],
    grids: [],
  },
  dry_run: true,
  restore_blocked: null,
};

function snapshotResponse(): Response {
  return new Response(JSON.stringify({
    snapshots: [],
    pending_undo: null,
    write_block: "",
    serato_running: false,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("restore", () => {
  beforeEach(() => {
    installPage();
    state.snapshotPlanId = "snap-9";
    state.snapshotUndo = null;
    state.snapshotMessage = "";
    state.driveBackup = null;
    state.operations = [];
    state.operationsLoading = false;
    state.operationsError = "";
    postJSON.mockReset();
    postJSON.mockResolvedValue({});
    vi.stubGlobal("fetch", vi.fn(async () => snapshotResponse()));
  });

  it("reports skipped crates after restore in the active language", async () => {
    postJSON.mockResolvedValue({
      crates_skipped: [{ name: "House", path: "Subcrates/House.crate" }],
    });
    await confirmSnapshotRestore();
    expect(document.getElementById("snapshots-status")?.textContent).toBe(
      "Restore finished. 1 crate file was skipped because its snapshot copy could not be read: House.",
    );
    setLocale("es");
    el("snapshots-status").textContent = t("snapshots.skippedCrates", { count: 1, names: "House" });
    expect(document.getElementById("snapshots-status")?.textContent).toContain("Se omitió");
    expect(document.getElementById("snapshots-status")?.textContent).toContain("House");
    setLocale("en");
  });

  it("posts undo or restore with confirm true", async () => {
    await confirmSnapshotRestore();
    expect(postJSON).toHaveBeenCalledWith("/api/snapshots", {
      action: "restore",
      id: "snap-9",
      confirm: true,
    });

    state.snapshotUndo = { restore_id: "snap-9" };
    state.snapshotPlanId = "snap-9";
    await confirmSnapshotRestore();
    expect(postJSON).toHaveBeenLastCalledWith("/api/snapshots", {
      action: "undo",
      confirm: true,
    });
  });

  it("paints the dry-run plan fields and blocks confirm when restore is refused", async () => {
    postJSON.mockResolvedValue(plan);
    await openSnapshotPlan("snap-9");
    const text = document.getElementById("snapshot-plan")?.textContent ?? "";
    expect(text).toContain("Crates added: 1. House");
    expect(text).toContain("Crates registered so Serato keeps them: none");
    expect(text).toContain("Crates skipped: none");
    expect(text).toContain("Tracks added: 1. Music/a.mp3");
    expect(text).toContain("Cue changes: 1 file");
    expect(text).toContain("a.mp3");
    expect(text).toContain("0:01.500 Drop");
    expect(text).toContain("0:08.000 Break");
    expect(document.querySelector(".cue-diff")?.getAttribute("aria-label")).toBe(
      "Cue point 1: 0:01.500 Drop → 0:08.000 Break",
    );

    postJSON.mockResolvedValue({
      ...plan,
      crates_registered: [{ name: "Café", path: "Subcrates/House%%Café.crate" }],
    });
    await openSnapshotPlan("snap-9");
    expect(document.getElementById("snapshot-plan")?.textContent).toContain(
      "Crates registered so Serato keeps them: 1. Café",
    );

    const skipped = "Crates were not registered. This library has no Serato Library space, so Serato may remove those crate files the next time it opens.";
    postJSON.mockResolvedValue({
      ...plan,
      registration_warning: skipped,
      registration_warning_code: "registration_no_space",
    });
    await openSnapshotPlan("snap-9");
    expect(document.getElementById("snapshot-plan")?.textContent).toContain(skipped);
    setLocale("es");
    repaintSnapshotPlan();
    expect(document.getElementById("snapshot-plan")?.textContent).toContain(
      "Las cajas no se registraron. Esta biblioteca no tiene el espacio Serato Library",
    );
    setLocale("en");
    repaintSnapshotPlan();
    expect(text).toContain("Cue changes: 1 file");
    expect(text).toContain("Grid changes: 1 file");
    expect(text).toContain("Deleted crates: 1. Old");
    expect(text).toContain("Deleted tracks: none");
    expect(document.getElementById("snapshot-block")?.textContent).toBe("Nothing has been changed.");
    expect((document.getElementById("snapshot-confirm") as HTMLButtonElement).disabled).toBe(false);

    postJSON.mockResolvedValue({ ...plan, restore_blocked: "Quit Serato before restoring." });
    await openSnapshotPlan("snap-9");
    expect(document.getElementById("snapshot-block")?.textContent).toBe("Quit Serato before restoring.");
    expect((document.getElementById("snapshot-confirm") as HTMLButtonElement).disabled).toBe(true);
  });

  it("translates an unknown Serato version on the snapshot note and the plan", async () => {
    state.snapshotLoading = false;
    state.snapshotError = "";
    state.snapshots = [];
    state.writeBlock = "Serato version is unknown (build 9.9).";
    state.writeBlockCode = "serato_version_unknown";
    state.writeBlockParams = { build: "9.9" };
    renderSnapshots();
    expect(document.getElementById("snapshots-block")?.textContent).toContain("build 9.9");
    setLocale("es");
    renderSnapshots();
    expect(document.getElementById("snapshots-block")?.textContent).toContain("compilación 9.9");

    postJSON.mockResolvedValue({
      ...plan,
      restore_blocked: "Serato version is unknown (build 9.9).",
      restore_blocked_code: "serato_version_unknown",
      restore_blocked_params: { build: "9.9" },
    });
    await openSnapshotPlan("snap-9");
    expect(document.getElementById("snapshot-block")?.textContent).toContain("compilación 9.9");
    expect((document.getElementById("snapshot-confirm") as HTMLButtonElement).disabled).toBe(true);
    setLocale("en");
    repaintSnapshotPlan();
    expect(document.getElementById("snapshot-block")?.textContent).toContain("build 9.9");
  });

  it("repaints the open plan and the list message in Spanish", async () => {
    const many = { ...plan, crates: { ...plan.crates, added: Array.from({ length: 10 }, (_, index) => ({ name: `C${index}` })) } };
    postJSON.mockResolvedValue(many);
    await openSnapshotPlan("snap-9");
    let text = document.getElementById("snapshot-plan")?.textContent ?? "";
    expect(text).toContain("Crates added: 10. C0, C1, C2, C3, C4, C5, C6, C7, and 2 more");
    setLocale("es");
    try {
      repaintSnapshotPlan();
      text = document.getElementById("snapshot-plan")?.textContent ?? "";
      expect(text).toContain("Cajas añadidas: 10. C0, C1, C2, C3, C4, C5, C6, C7 y 2 más");
    expect(text).toContain("Cajas registradas para que Serato las conserve: ninguno");
      expect(text).toContain("Cambios de cues: 1 archivo");
      expect(text).toContain("a.mp3");
      expect(text).toContain("Pistas eliminadas: ninguno");
      expect(document.getElementById("snapshot-block")?.textContent).toBe("No se ha cambiado nada.");
      state.snapshotMessage = "snapshots.saved";
      state.snapshotLoading = false;
      state.snapshotError = "";
      state.snapshots = [];
      renderSnapshots();
      expect(document.getElementById("snapshots-status")?.textContent).toBe("Copia guardada.");
    } finally {
      setLocale("en");
    }
  });

  it("lists the file only when cue slots did not change", async () => {
    postJSON.mockResolvedValue({
      ...plan,
      cues: [{
        path: "Music/same.mp3",
        before: { cues: [{ index: 0, start_ms: 1500, name: "Drop" }] },
        after: { cues: [{ index: 0, start_ms: 1500, name: "Drop" }] },
      }],
    });
    await openSnapshotPlan("snap-9");
    const text = document.getElementById("snapshot-plan")?.textContent ?? "";
    expect(text).toContain("Cue changes: 1 file");
    expect(text).toContain("same.mp3");
    expect(document.querySelector(".cue-diff")).toBeNull();
  });

  it("copies drive crates and keeps the tooltip different from the button name", async () => {
    applyStatic(document);
    applyStaticTooltips();
    const button = document.getElementById("snapshots-drives");
    expect(button?.getAttribute("aria-label")).toBe("Back up drive crates");
    expect(button?.getAttribute("data-tooltip")).toBe(t("tooltip.backupDrives"));
    expect(button?.getAttribute("data-tooltip")).not.toBe(button?.getAttribute("aria-label"));
    expect(button?.getAttribute("data-tooltip")).not.toBe(t("snapshots.backupDrives"));

    postJSON.mockResolvedValue({
      ok: true,
      created: true,
      drive_backup: {
        verified: true,
        folder: "serato-web-1",
        drives: [
          { label: "Music", status: "copied", present: true },
          { label: "OLD", status: "absent", present: false },
          { label: "LOCK", status: "read-only", present: true },
        ],
      },
    });
    await backupDriveCrates();
    expect(postJSON).toHaveBeenCalledWith("/api/snapshots", { action: "backup-drives" });
    const note = document.getElementById("snapshots-drives-note")?.textContent ?? "";
    expect(note).toContain("Copied: Music.");
    expect(note).toContain("Unplugged, not copied: OLD.");
    expect(note).toContain("Skipped: LOCK (read-only).");
    expect(document.getElementById("snapshots-status")?.textContent).toBe(t("snapshots.drivesSaved"));

    setLocale("es");
    try {
      renderSnapshots();
      const spanish = document.getElementById("snapshots-drives-note")?.textContent ?? "";
      expect(spanish).toContain("Copiadas: Music.");
      expect(spanish).toContain("Desconectadas, sin copiar: OLD.");
      expect(spanish).toContain("LOCK (solo lectura)");
      expect(spanish).not.toContain("Unplugged");
    } finally {
      setLocale("en");
    }
  });

  it("shows a failed rollback and does not call the restore a success", async () => {
    postJSON.mockRejectedValue(new Error("Restore failed and snapshot abc could not be put back either."));
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("/api/operations")) {
        return new Response(JSON.stringify({
          operations: [{
            time: "2026-11-01T12:00:00Z",
            action: "restore",
            target: "snap-9",
            result: "rollback_failed",
            verified: false,
            rolled_back: false,
            snapshot_before: "before-1",
            snapshot_after: null,
          }],
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return snapshotResponse();
    }));
    applyStaticTooltips();
    await confirmSnapshotRestore();
    expect(state.snapshotMessage).toBe("");
    expect(document.getElementById("snapshot-status")?.textContent).toContain("could not be put back");
    expect(document.getElementById("snapshot-status")?.textContent).not.toContain("Restore finished");
    const alert = document.getElementById("operations-alert");
    expect(alert?.hidden).toBe(false);
    expect(alert?.textContent).toContain("could not be put back");
    expect(document.getElementById("operations-list")?.textContent).toContain("Could not put back");
    expect(document.getElementById("operations-list")?.textContent).toContain("Before before-1");
    expect(document.getElementById("operations-list")?.textContent).not.toContain("Unknown time");
    expect(document.getElementById("operations-refresh")?.getAttribute("data-tooltip")).toContain("operation log");
    expect(document.getElementById("operations-list")?.getAttribute("data-tooltip")).toContain("Operation log");
  });

  it("lists one checked restore in Spanish", () => {
    state.operations = [{
      time: "2026-11-01T12:00:00Z",
      action: "restore",
      target: "snap-9",
      result: "verified",
      verified: true,
      rolled_back: false,
      snapshot_before: "before-1",
      snapshot_after: "snap-9",
    }];
    state.operationsLoading = false;
    state.operationsError = "";
    setLocale("es");
    try {
      renderOperations();
      const text = document.getElementById("operations-list")?.textContent ?? "";
      expect(text).toContain("Restaurar");
      expect(text).toContain("snap-9");
      expect(text).toContain("Comprobado");
      expect(text).toContain("Antes before-1");
      expect(text).not.toContain("Hora desconocida");
      expect(document.getElementById("operations-alert")?.hidden).toBe(true);
    } finally {
      setLocale("en");
    }
  });

  it("names a drive with no label from its own string", async () => {
    state.snapshotLoading = false;
    state.snapshotError = "";
    state.snapshots = [];
    postJSON.mockResolvedValue({
      ok: true,
      created: true,
      drive_backup: {
        verified: true,
        folder: "serato-web-1",
        drives: [
          { status: "copied", drive_id: "dev-gig", present: true },
          { status: "permission", present: true },
        ],
      },
    });
    await backupDriveCrates();
    const note = document.getElementById("snapshots-drives-note")?.textContent ?? "";
    expect(note).toContain("Copied: dev-gig.");
    expect(note).toContain(`${t("snapshots.unknownDrive")} (no permission)`);
    expect(note).not.toContain(t("snapshots.unknownTime"));
    setLocale("es");
    try {
      renderSnapshots();
      const spanish = document.getElementById("snapshots-drives-note")?.textContent ?? "";
      expect(spanish).toContain(`${t("snapshots.unknownDrive")} (sin permiso)`);
      expect(spanish).not.toContain("Unknown time");
      expect(spanish).not.toContain("Hora desconocida");
    } finally {
      setLocale("en");
    }
  });

  it("shows a disk-space refusal on the drive line", async () => {
    state.snapshotLoading = false;
    state.snapshotError = "";
    state.snapshots = [];
    postJSON.mockRejectedValue(new Error(t("error.backup_no_space")));
    await backupDriveCrates();
    expect(document.getElementById("snapshots-drives-note")?.textContent).toBe(t("error.backup_no_space"));
    expect(document.getElementById("snapshots-list")?.textContent).toContain("No backups yet");
  });

  it("does not repaint a closed plan dialog", async () => {
    postJSON.mockResolvedValue(plan);
    await openSnapshotPlan("snap-9");
    (document.getElementById("snapshot-dialog") as HTMLDialogElement).close();
    document.getElementById("snapshot-plan")!.replaceChildren();
    repaintSnapshotPlan();
    expect(document.getElementById("snapshot-plan")?.textContent).toBe("");
  });
});
