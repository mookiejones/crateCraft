/**
 * Shared Play stats state for the report island.
 *
 * Fetch and the idle-crate POST stay in `history-stats.ts`. This
 * context is the one React read path. HistoryContext stays for the
 * session list and history detail.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { HistoryStatsReport } from "../lib/api-types";

export type StatsContextValue = {
  report: HistoryStatsReport | null;
  crateBusy: boolean;
  writable: boolean;
  makeIdleCrate: () => Promise<void>;
};

const StatsContext = createContext<StatsContextValue | null>(null);

/**
 * Supply one Play stats snapshot to a React tree.
 *
 * @param value Current report and the idle-crate action.
 * @param children Tree that may call `useStats`.
 */
export function StatsProvider({
  value,
  children,
}: {
  value: StatsContextValue;
  children: ReactNode;
}) {
  return <StatsContext value={value}>{children}</StatsContext>;
}

/**
 * Read the shared Play stats report.
 *
 * Throws when no `StatsProvider` is above this component.
 *
 * @returns The snapshot and idle-crate action for this island.
 */
export function useStats(): StatsContextValue {
  const value = useContext(StatsContext);
  if (value === null) {
    throw new Error("useStats must be used within StatsProvider");
  }
  return value;
}
