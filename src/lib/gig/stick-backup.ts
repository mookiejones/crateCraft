/**
 * Stick backup API (#481).
 *
 * GET /api/stick-backup is read-only. POST copy with confirm writes dest
 * only. The source stick is never written.
 */

import { postJSON, readJSON, type ApiFailure } from "../api";
import type { ErrorBody, StickBackupReport } from "../api-types";
import { serverMessage, t } from "../i18n";
import type { StickBackupAction } from "./stick-backup-view";

export type { StickBackupAction } from "./stick-backup-view";

async function getStickBackup(
  source: string,
  dest?: string,
): Promise<StickBackupReport> {
  const params = new URLSearchParams({ source: source.trim() });
  if (dest && dest.trim()) params.set("dest", dest.trim());
  const response = await fetch(`/api/stick-backup?${params.toString()}`);
  const payload = await readJSON<StickBackupReport & ErrorBody>(response).catch(
    (): StickBackupReport & ErrorBody => ({}),
  );
  if (!response.ok) {
    const error = new Error(serverMessage(payload, t("musicMirror.unreadable"))) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * Remembered last backup and stale-database warning for a stick.
 */
export async function fetchStickBackupStatus(source: string): Promise<StickBackupReport> {
  return await getStickBackup(source);
}

/**
 * Read-only classification of stick files against dest.
 */
export async function fetchStickBackupPreview(
  source: string,
  dest: string,
): Promise<StickBackupReport> {
  return await getStickBackup(source, dest);
}

/**
 * POST one stick-backup action.
 */
export async function postStickBackup(
  action: StickBackupAction,
  source: string,
  dest: string,
  confirm: boolean,
): Promise<StickBackupReport> {
  return await postJSON<StickBackupReport>("/api/stick-backup", {
    action,
    source: source.trim(),
    dest: dest.trim(),
    confirm,
  });
}
