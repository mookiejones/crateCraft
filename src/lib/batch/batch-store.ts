/**
 * Shared batch queue for tracks and crates (#373).
 *
 * The JSON lives beside settings. Preview reads. Apply and undo write.
 * Islands do not share React context, so this module is the one store.
 */

import { postJSON, readJSON, failureOf, type ApiFailure } from "../api";
import type { BatchListing, ErrorBody } from "../api-types";
import { serverMessage, t } from "../i18n";
import { setNotice } from "../ui/notice-store";

export const EMPTY_BATCH: BatchListing = {
  queue: [],
  destination: null,
  preview: null,
  can_undo: false,
};

let current: BatchListing = EMPTY_BATCH;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asDestination(value: unknown): BatchListing["destination"] {
  if (!isRecord(value)) return null;
  const id = typeof value.id === "number" && Number.isInteger(value.id) ? value.id : null;
  if (id === null || (value.kind !== undefined && value.kind !== "crate")) return null;
  const name = typeof value.name === "string" ? value.name : "";
  return { id, name };
}

function asItem(value: unknown): BatchListing["queue"][number] | null {
  if (!isRecord(value)) return null;
  const kind = value.kind === "track" || value.kind === "crate" ? value.kind : null;
  const id = typeof value.id === "number" && Number.isInteger(value.id) ? value.id : null;
  if (kind === null || id === null) return null;
  const name = typeof value.name === "string" ? value.name : "";
  return { kind, id, name };
}

/**
 * Accept a listing, or an unrelated 200 body, as an empty queue.
 *
 * @param payload Decoded JSON. A snapshot list has no `queue`.
 * @returns A listing the panel can render.
 */
export function normalizeBatch(payload: unknown): BatchListing {
  if (!isRecord(payload)) return { ...EMPTY_BATCH, queue: [] };
  const queue = Array.isArray(payload.queue)
    ? payload.queue.flatMap((row) => {
      const item = asItem(row);
      return item ? [item] : [];
    })
    : [];
  const dest = asDestination(payload.destination);
  const previewRaw = isRecord(payload.preview) ? payload.preview : null;
  const first = previewRaw ? asItem(previewRaw.first) : null;
  const wouldAdd = previewRaw && typeof previewRaw.would_add === "number"
    ? previewRaw.would_add
    : 0;
  const preview = first ? { first, would_add: wouldAdd } : null;
  const added = typeof payload.added === "number" ? payload.added : undefined;
  return {
    queue,
    destination: dest,
    preview,
    can_undo: payload.can_undo === true,
    ...(added === undefined ? {} : { added }),
  };
}

/**
 * Current listing. Empty until a fetch lands.
 *
 * @returns The last listing this page loaded.
 */
export function getBatch(): BatchListing {
  return current;
}

/**
 * Subscribe to listing changes.
 *
 * @param listener Called after a fetch or a post.
 * @returns Unsubscribe.
 */
export function subscribeBatch(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Drop the listing and the listeners. Tests call this between cases.
 */
export function resetBatch(): void {
  current = { ...EMPTY_BATCH, queue: [] };
  listeners.clear();
}

/**
 * GET /api/batch. A body without `queue` becomes an empty listing.
 *
 * @returns The listing now.
 */
export async function refreshBatch(): Promise<BatchListing> {
  const response = await fetch("/api/batch");
  const payload = await readJSON<BatchListing & ErrorBody>(response).catch(
    (): BatchListing & ErrorBody => ({ ...EMPTY_BATCH }),
  );
  if (!response.ok) {
    const error = new Error(serverMessage(payload, t("batch.empty"))) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  current = normalizeBatch(payload);
  emit();
  return current;
}

export type BatchPost = {
  action: "add" | "remove" | "destination" | "cancel" | "preview" | "apply" | "undo";
  kind?: "track" | "crate";
  id?: number;
  confirm?: boolean;
};

/**
 * POST one batch action and store the listing it returns.
 *
 * @param body Action plus the fields that action needs.
 * @returns The listing after that action.
 */
export async function postBatch(body: BatchPost): Promise<BatchListing> {
  const payload = await postJSON<BatchListing>("/api/batch", body);
  current = normalizeBatch(payload);
  emit();
  return current;
}

/**
 * Queue one crate. A failure stays on the banner.
 *
 * @param id Crate id.
 */
export async function queueCrate(id: number): Promise<void> {
  try {
    await postBatch({ action: "add", kind: "crate", id });
    setNotice(t("batch.queued"));
  } catch (caught) {
    setNotice(failureOf(caught).message, "error");
  }
}

/**
 * Queue one track. A failure stays on the banner.
 *
 * @param id Asset id.
 */
export async function queueTrack(id: number): Promise<void> {
  try {
    await postBatch({ action: "add", kind: "track", id });
    setNotice(t("batch.queued"));
  } catch (caught) {
    setNotice(failureOf(caught).message, "error");
  }
}
