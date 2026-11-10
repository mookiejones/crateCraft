/**
 * Pure snapshot list and restore-plan copy.
 *
 * React paints from these strings. Nothing here fetches or writes.
 */

import type { DriveBackup, DriveCopy, OperationEntry, PlanName, SnapshotInfo } from "../api-types";
import { formatDate, formatList, t, type MessageKey } from "../i18n";

export const OPERATION_ACTIONS: Record<string, MessageKey> = {
  crate_create: "operations.action.crateCreate",
  crate_rename: "operations.action.crateRename",
  crate_delete: "operations.action.crateDelete",
  crate_color: "operations.action.crateColor",
  crate_expanded: "operations.action.crateExpanded",
  crate_rules: "operations.action.crateRules",
  crate_add: "operations.action.crateAdd",
  crate_remove: "operations.action.crateRemove",
  crate_prepare: "operations.action.cratePrepare",
  crate_remove_library: "operations.action.crateRemoveLibrary",
  save_track: "operations.action.saveTrack",
  import_m3u: "operations.action.importM3u",
  merge_duplicates: "operations.action.mergeDuplicates",
  rename: "operations.action.rename",
  rename_from_tags: "operations.action.renameFromTags",
  move: "operations.action.move",
  move_folder: "operations.action.moveFolder",
  replace: "operations.action.replace",
  replace_in_crates: "operations.action.replaceInCrates",
  relink: "operations.action.relink",
  delete: "operations.action.delete",
  restore: "operations.action.restore",
  restore_recover: "operations.action.restoreRecover",
};

export const OPERATION_OUTCOMES: Record<string, MessageKey> = {
  verified: "operations.outcome.verified",
  rolled_back: "operations.outcome.rolledBack",
  refused: "operations.outcome.refused",
  rollback_failed: "operations.outcome.rollbackFailed",
};

/**
 * Title and detail for one snapshot card.
 *
 * @param item Row from GET /api/snapshots.
 * @returns Two lines the list paints with textContent.
 */
export function snapshotCardText(item: SnapshotInfo): { title: string; detail: string } {
  const title = `${item.created || t("snapshots.unknownTime")} · ${item.trigger || t("snapshots.trigger")}`;
  const version = item.serato_version && item.serato_version !== "unknown"
    ? t("snapshots.seratoVersion", { version: item.serato_version, build: String(item.serato_build ?? "") })
    : t("snapshots.seratoUnknown");
  const drives = (item.unavailable_drives || []).length
    ? ` ${t("snapshots.unavailableDrives", { drives: formatList(item.unavailable_drives || []) })}`
    : "";
  return { title, detail: `${version}. ${item.reason || ""}${drives}` };
}

function driveName(drive: DriveCopy, status: string): string {
  const name = drive.label || drive.drive_id || t("snapshots.unknownDrive");
  if (status === "read-only") return t("snapshots.driveReadOnly", { name });
  if (status === "permission") return t("snapshots.drivePermission", { name });
  return name;
}

/**
 * Drive-backup line under Take a backup.
 *
 * @param report Hash-checked drive copy, or null.
 * @returns One sentence, already translated.
 */
export function driveCopyText(report: DriveBackup | null): string {
  const drives = report?.drives ?? [];
  if (!report?.verified || !drives.length) {
    return report?.verified ? t("snapshots.drivesNone") : t("snapshots.drivesIntro");
  }
  const parts: string[] = [];
  const copied = drives.filter((drive) => drive.status === "copied").map((drive) => driveName(drive, "copied"));
  const absent = drives.filter((drive) => drive.status === "absent").map((drive) => driveName(drive, "absent"));
  const skipped = drives
    .filter((drive) => drive.status === "read-only" || drive.status === "permission")
    .map((drive) => driveName(drive, drive.status ?? ""));
  if (copied.length) parts.push(t("snapshots.drivesCopied", { drives: formatList(copied) }));
  if (absent.length) parts.push(t("snapshots.drivesAbsent", { drives: formatList(absent) }));
  if (skipped.length) parts.push(t("snapshots.drivesSkipped", { drives: formatList(skipped) }));
  return parts.join(" ") || t("snapshots.drivesIntro");
}

/**
 * Last path segment for a restore line.
 *
 * @param path File path.
 * @returns The file name, or the whole path when it has no slash.
 */
export function fileName(path: string): string {
  const parts = String(path).split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/**
 * One labelled count or name list for the restore plan.
 *
 * @param label Section name, already translated.
 * @param rows Diff rows.
 * @returns One sentence.
 */
export function planLineText(
  label: string,
  rows: ReadonlyArray<PlanName | { name?: string; path?: string; drive_label?: string }> | undefined,
): string {
  const items = rows || [];
  if (!items.length) return t("plan.none", { label });
  const names = items.slice(0, 8).map((item) => item.name || item.path || item.drive_label || t("plan.item"));
  const extra = items.length > names.length ? t("plan.andMore", { count: items.length - names.length }) : "";
  const listed = `${names.join(", ")}${extra}`;
  return t("plan.listed", { label, count: items.length, names: listed });
}

/**
 * Format an operation log timestamp.
 *
 * @param value ISO time from the log.
 * @returns A locale date, or the raw value when it is not a date.
 */
export function operationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || t("snapshots.unknownTime");
  return formatDate(date, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Title and optional snapshot ids for one operation row.
 *
 * @param item Line from GET /api/operations.
 * @returns Copy the card paints. Detail is omitted when there is no snapshot id.
 */
export function operationCardText(item: OperationEntry): { title: string; detail: string } {
  const actionName = item.action || item.operation || "";
  const actionKey = OPERATION_ACTIONS[actionName];
  const outcomeKey = OPERATION_OUTCOMES[item.result || ""] ?? "operations.outcome.refused";
  const title = t("operations.entry", {
    time: operationTime(item.time || ""),
    action: actionKey ? t(actionKey) : t("operations.actionOther"),
    target: item.target || t("operations.noTarget"),
    outcome: t(outcomeKey),
  });
  if (item.snapshot_before && item.snapshot_after) {
    return {
      title,
      detail: t("operations.snapshots", {
        before: item.snapshot_before,
        after: item.snapshot_after,
      }),
    };
  }
  if (item.snapshot_before) {
    return { title, detail: t("operations.beforeOnly", { before: item.snapshot_before }) };
  }
  return { title, detail: "" };
}
