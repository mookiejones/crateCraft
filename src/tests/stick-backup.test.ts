import { describe, expect, it } from "vitest";
import { hasStickBackupDest, stickBackupStatusText } from "../lib/gig/stick-backup-view";
import { t } from "../lib/i18n";

describe("stick-backup-view", () => {
  it("requires a dest folder", () => {
    expect(hasStickBackupDest("")).toBe(false);
    expect(hasStickBackupDest(" /Volumes/Backup ")).toBe(true);
  });

  it("formats preview and verified status", () => {
    expect(
      stickBackupStatusText({
        copy_count: 2,
        skip_count: 1,
        mismatch_count: 0,
        last_backup: { dest: "/Volumes/Backup", at: "2026-11-20T14:30:00Z" },
      }),
    ).toContain("2");
    expect(stickBackupStatusText({ written: true, verified: true })).toBe(t("stickBackup.verified"));
    expect(stickBackupStatusText({ written: true, verified: false })).toBe(t("stickBackup.failed"));
  });
});
