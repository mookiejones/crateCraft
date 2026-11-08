/**
 * Pure helpers for the folder-sync dialog (#210).
 */

import { el } from "./dom";
import { t } from "./i18n";
import { state } from "./state";

export interface FolderSyncForm {
  folder: string;
  subcrates: boolean;
  full: boolean;
}

export interface FolderSyncReply {
  added?: number;
  removed?: number;
  created?: number;
  skipped_count?: number;
  written?: boolean;
  crate?: { id?: number; name?: string };
  warning?: string | null;
}

/**
 * Enable Sync folder and Rename from tags on a writable normal crate.
 *
 * @returns {void}
 */
export function syncFolderSyncButton(): void {
  const id = state.activeCrate;
  const crate = typeof id === "number" ? state.crates.find((row) => row.id === id) : undefined;
  const blocked = !state.writable || id === "all" || Boolean(crate?.smart);
  el("crate-folder-sync").disabled = blocked;
  el("crate-rename-from-tags").disabled = blocked;
}

/**
 * Read the dialog fields. A blank folder is null.
 *
 * @returns {FolderSyncForm | null} The form, or null when the path is blank.
 */
export function readFolderSyncForm(): FolderSyncForm | null {
  const folder = el("folder-sync-path").value.trim();
  if (!folder) return null;
  return {
    folder,
    subcrates: el("folder-sync-subcrates").checked,
    full: el("folder-sync-full").checked,
  };
}

/**
 * Describe a preview in the active language.
 *
 * @param {FolderSyncReply} reply The server plan.
 * @returns {string} The preview sentence.
 */
export function folderSyncPreviewText(reply: FolderSyncReply): string {
  const added = Number(reply.added) || 0;
  const removed = Number(reply.removed) || 0;
  const created = Number(reply.created) || 0;
  const skipped = Number(reply.skipped_count) || 0;
  if (added === 0 && removed === 0 && created === 0) {
    return t("folderSync.summaryNone", { skipped });
  }
  return t("folderSync.summary", { added, removed, skipped });
}

/**
 * Describe a finished sync.
 *
 * @param {FolderSyncReply} reply The server result.
 * @returns {string} The status sentence.
 */
export function folderSyncDoneText(reply: FolderSyncReply): string {
  const name = reply.crate?.name?.trim() || "";
  const added = Number(reply.added) || 0;
  const removed = Number(reply.removed) || 0;
  if (!reply.written) return t("folderSync.unchanged", { name });
  return t("folderSync.done", { name, added, removed });
}

/**
 * Return whether the plan would write.
 *
 * @param {FolderSyncReply} reply The server plan.
 * @returns {boolean} True when a crate or member would change.
 */
export function folderSyncHasWork(reply: FolderSyncReply): boolean {
  return (Number(reply.added) || 0) + (Number(reply.removed) || 0) + (Number(reply.created) || 0) > 0;
}
