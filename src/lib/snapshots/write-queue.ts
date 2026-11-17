/**
 * Gig Lock write queue (#393).
 *
 * GET /api/write-queue lists pending and undo. POST preview, apply,
 * drop, or undo. Apply and undo need the lock off. Apply without
 * confirm is a preview.
 */

import { postJSON, readJSON, type ApiFailure } from "../api";
import type { ErrorBody, WriteQueueListing } from "../api-types";
import { serverMessage, t } from "../i18n";

/**
 * Read-only listing of queued and undoable writes.
 *
 * @returns The current queue.
 */
export async function fetchWriteQueue(): Promise<WriteQueueListing> {
  const response = await fetch("/api/write-queue");
  const payload = await readJSON<WriteQueueListing & ErrorBody>(response).catch(
    (): WriteQueueListing & ErrorBody => ({
      gig_lock: false,
      locked: false,
      pending: [],
      undo: [],
    }),
  );
  if (!response.ok) {
    const error = new Error(serverMessage(payload, t("gigLock.empty"))) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * POST one queue action.
 *
 * @param action preview, apply, drop, or undo.
 * @param confirm True performs apply or undo.
 * @param id Pending or undo item id. Drop without id clears pending.
 * @returns The listing after that action.
 */
export async function postWriteQueue(
  action: "preview" | "apply" | "drop" | "undo",
  confirm = false,
  id?: string,
): Promise<WriteQueueListing> {
  const body: { action: string; confirm?: boolean; id?: string } = { action };
  if (confirm) body.confirm = true;
  if (id) body.id = id;
  return await postJSON<WriteQueueListing>("/api/write-queue", body);
}
