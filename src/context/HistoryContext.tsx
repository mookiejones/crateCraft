/**
 * Shared history state for the session list and the history detail pane.
 *
 * Sessions and entries stay on `state`. This context is the one React
 * read path. Providers subscribe so every mounted island sees the same
 * snapshot. Fetch and paint live in `views.ts` and bind through
 * `historyActions`.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { HistorySession, Track } from "../api-types";

export type HistoryContextValue = {
  sessions: readonly HistorySession[];
  historyId: number | null;
  entries: readonly Track[];
  selectedId: number | null;
  loadHistory: () => Promise<void>;
  openSession: (id: number) => Promise<void>;
  selectEntry: (id: number) => void;
  openInLibrary: (assetId: number) => Promise<void>;
};

/**
 * Late bindings so the provider can call `views.ts` without a cycle.
 *
 * `views.ts` fills these after it loads. Empty defaults keep a test
 * island from throwing when it only paints.
 */
export const historyActions: {
  loadHistory: () => Promise<void>;
  openSession: (id: number) => Promise<void>;
  selectEntry: (id: number) => void;
  openInLibrary: (assetId: number) => Promise<void>;
} = {
  loadHistory: async () => {},
  openSession: async (_id: number) => {},
  selectEntry: (_id: number) => {},
  openInLibrary: async (_assetId: number) => {},
};

const listeners = new Set<() => void>();

/**
 * Run `listener` after history state on the page changes.
 *
 * @param listener Snapshot reader.
 * @returns Unsubscribe.
 */
export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Tell every history island to read `state` again.
 *
 * @returns {void}
 */
export function notifyHistory(): void {
  for (const listener of listeners) listener();
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

/**
 * Supply one history snapshot to a React tree.
 *
 * @param value Current sessions, entries, and the history actions.
 * @param children Tree that may call `useHistory`.
 */
export function HistoryProvider({
  value,
  children,
}: {
  value: HistoryContextValue;
  children: ReactNode;
}) {
  return <HistoryContext value={value}>{children}</HistoryContext>;
}

/**
 * Read the shared history.
 *
 * Throws when no `HistoryProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useHistory(): HistoryContextValue {
  const value = useContext(HistoryContext);
  if (value === null) {
    throw new Error("useHistory must be used within HistoryProvider");
  }
  return value;
}
