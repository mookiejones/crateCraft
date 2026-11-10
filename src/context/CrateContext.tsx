/**
 * Shared crate-rail state for the tree and crate actions.
 *
 * Crate writes stay in views.ts and the crate dialogs. This context is
 * the one React read path. Providers subscribe so every mounted island
 * sees the same snapshot.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { CrateContextValue } from "../crate-store";

export type { CrateContextValue };

const CrateContext = createContext<CrateContextValue | null>(null);

/**
 * Supply one crate snapshot to a React tree.
 *
 * @param value Current snapshot and the crate actions.
 * @param children Tree that may call `useCrates`.
 */
export function CrateProvider({
  value,
  children,
}: {
  value: CrateContextValue;
  children: ReactNode;
}) {
  return <CrateContext value={value}>{children}</CrateContext>;
}

/**
 * Read the shared crate rail.
 *
 * Throws when no `CrateProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useCrates(): CrateContextValue {
  const value = useContext(CrateContext);
  if (value === null) {
    throw new Error("useCrates must be used within CrateProvider");
  }
  return value;
}
