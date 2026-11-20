/**
 * Shared batch listing for the Backups panel and the queue buttons.
 *
 * The JSON stays in batch-store. This context is the React read path.
 * Each island mounts its own provider and subscribes to that store.
 */

import { createContext, useContext, type ReactNode } from "react";
import {
  EMPTY_BATCH,
  postBatch,
  queueCrate,
  queueTrack,
  type BatchPost,
} from "../lib/batch/batch-store";
import type { BatchListing } from "../lib/api-types";

export type BatchContextValue = {
  listing: BatchListing;
  queueCrate: typeof queueCrate;
  queueTrack: typeof queueTrack;
  postBatch: (body: BatchPost) => Promise<BatchListing>;
};

const BatchContext = createContext<BatchContextValue | null>(null);

/**
 * Idle snapshot for stories and tests that do not drive the store.
 *
 * @returns An empty queue and the real post helpers.
 */
export function idleBatchValue(): BatchContextValue {
  return {
    listing: { ...EMPTY_BATCH, queue: [] },
    queueCrate,
    queueTrack,
    postBatch,
  };
}

/**
 * Supply one batch snapshot to a React tree.
 *
 * @param value Current listing and actions.
 * @param children Tree that may call `useBatch`.
 */
export function BatchProvider({
  value,
  children,
}: {
  value: BatchContextValue;
  children: ReactNode;
}) {
  return <BatchContext value={value}>{children}</BatchContext>;
}

/**
 * Read the shared batch listing.
 *
 * Throws when no `BatchProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useBatch(): BatchContextValue {
  const value = useContext(BatchContext);
  if (value === null) {
    throw new Error("useBatch must be used within BatchProvider");
  }
  return value;
}
