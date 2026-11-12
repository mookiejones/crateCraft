/**
 * Sync a crate with a music folder (#210).
 *
 * POST /api/folder-sync previews or writes. Preview only reads. Sync
 * adds library tracks whose files sit in the folder, through safe_write.
 * Files that are not in the library are skipped and are not imported.
 */

import { failureOf, postJSON } from "../api";
import { el } from "../dom";
import { t } from "../i18n";
import {
  folderSyncDoneText,
  folderSyncHasWork,
  folderSyncPreviewText,
  readFolderSyncForm,
  type FolderSyncReply,
} from "./folder-sync-view";
import { state } from "../state";
import { bindCrateActions } from "./crate-store";
import { mountSharedDialogs } from "../ui/shared-dialog-mount";
import { loadLibrary, lockDown, setNotice } from "../ui/views";

const PREVIEW_DELAY_MS = 250;

let previewTimer = 0;
let previewToken = 0;
let syncing = false;

/**
 * Count the membership changes without writing.
 *
 * @returns {Promise<void>}
 */
export async function previewFolderSync(): Promise<void> {
  const token = ++previewToken;
  const form = readFolderSyncForm();
  const crate = state.activeCrate;
  if (!form || typeof crate !== "number") {
    el("folder-sync-preview").textContent = "";
    el("folder-sync-run").disabled = true;
    return;
  }
  el("folder-sync-preview").textContent = t("folderSync.counting");
  el("folder-sync-run").disabled = true;
  try {
    const reply = await postJSON<FolderSyncReply>("/api/folder-sync", {
      action: "preview",
      space: state.space,
      crate,
      folder: form.folder,
      subcrates: form.subcrates,
      full: form.full,
    });
    if (token !== previewToken) return;
    el("folder-sync-preview").textContent = folderSyncPreviewText(reply);
    el("folder-sync-run").disabled = syncing || !folderSyncHasWork(reply);
  } catch (error) {
    if (token !== previewToken) return;
    el("folder-sync-preview").textContent = failureOf(error).message;
    el("folder-sync-run").disabled = true;
  }
}

/**
 * Preview again after the person stops typing.
 *
 * @returns {void}
 */
function schedulePreview(): void {
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    void previewFolderSync();
  }, PREVIEW_DELAY_MS);
}

/**
 * Open the dialog for the selected crate.
 *
 * @returns {Promise<void>}
 */
export async function openFolderSyncDialog(): Promise<void> {
  mountSharedDialogs();
  if (!state.writable || typeof state.activeCrate !== "number") {
    setNotice(el("status").textContent || "");
    return;
  }
  el("folder-sync-status").textContent = "";
  if (!el("folder-sync-dialog").open) el("folder-sync-dialog").showModal();
  el("folder-sync-path").focus();
  await previewFolderSync();
}

/**
 * Write the plan for the selected crate.
 *
 * @returns {Promise<void>}
 */
export async function runFolderSync(): Promise<void> {
  mountSharedDialogs();
  const form = readFolderSyncForm();
  const crate = state.activeCrate;
  if (!form || typeof crate !== "number" || syncing) return;
  syncing = true;
  el("folder-sync-run").disabled = true;
  el("folder-sync-status").textContent = "";
  try {
    const reply = await postJSON<FolderSyncReply>("/api/folder-sync", {
      action: "sync",
      space: state.space,
      crate,
      folder: form.folder,
      subcrates: form.subcrates,
      full: form.full,
    });
    el("folder-sync-dialog").close();
    setNotice(folderSyncDoneText(reply));
    await loadLibrary();
  } catch (error) {
    el("folder-sync-status").textContent = failureOf(error).message;
    if (failureOf(error).status === 409) {
      lockDown(error);
      el("folder-sync-dialog").close();
    }
  } finally {
    syncing = false;
  }
}

/**
 * Wire the Sync folder button and dialog.
 *
 * Called once at startup. Does not fetch.
 *
 * @returns {void}
 */
export function wireFolderSync(): void {
  mountSharedDialogs();
  el("crate-folder-sync").addEventListener("click", () => {
    openFolderSyncDialog().catch((error) => setNotice(failureOf(error).message));
  });
  el("folder-sync-path").addEventListener("input", schedulePreview);
  el("folder-sync-subcrates").addEventListener("change", () => {
    void previewFolderSync();
  });
  el("folder-sync-full").addEventListener("change", () => {
    void previewFolderSync();
  });
  el("folder-sync-cancel").addEventListener("click", () => el("folder-sync-dialog").close());
  el("folder-sync-run").addEventListener("click", () => {
    runFolderSync().catch((error) => setNotice(failureOf(error).message));
  });
}

bindCrateActions({
  folderSync: () => {
    openFolderSyncDialog().catch((error) => setNotice(failureOf(error).message));
  },
});
