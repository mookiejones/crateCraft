/**
 * Shared Before a gig state for the gig check and Tempo drift.
 *
 * Fetch stays in `gig.ts` and `drift.ts`. This context is the one React
 * read path. Providers subscribe to those engines so both screens see
 * the same snapshots.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { GigReport, TempoDriftReport } from "../lib/api-types";
import type { PortableSnapshot } from "../lib/gig/portable";

export type GigSnapshot = {
  report: GigReport | null;
  stepIndex: number;
  checkedAt: Date | null;
};

export type DriftSnapshot = {
  report: TempoDriftReport | null;
  scope: string;
};

export type { PortableSnapshot };

export type GigContextValue = {
  gig: GigSnapshot;
  drift: DriftSnapshot;
  portable: PortableSnapshot;
  nextStep: () => void;
  backStep: () => void;
  exit: () => void;
};

const GigContext = createContext<GigContextValue | null>(null);

/**
 * Supply one Before a gig snapshot to a React tree.
 *
 * @param value Current snapshots and the step actions.
 * @param children Tree that may call `useGig`.
 */
export function GigStateProvider({
  value,
  children,
}: {
  value: GigContextValue;
  children: ReactNode;
}) {
  return <GigContext value={value}>{children}</GigContext>;
}

/**
 * Read the shared gig check and Tempo drift snapshots.
 *
 * Throws when no `GigStateProvider` is above this component.
 *
 * @returns The snapshots and step actions for this island.
 */
export function useGig(): GigContextValue {
  const value = useContext(GigContext);
  if (value === null) {
    throw new Error("useGig must be used within GigStateProvider");
  }
  return value;
}
