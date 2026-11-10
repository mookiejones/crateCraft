/**
 * Shared Settings state for the dialog island.
 *
 * Language, appearance, sharing, About, and the cheat sheet read this
 * context. The snapshot lives in `settings.ts`. Providers subscribe so
 * every mounted island sees the same values.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Colorway, SettingsSnapshot } from "../settings";

export type SettingsContextValue = SettingsSnapshot & {
  saveLanguage: (value: string) => Promise<void>;
  saveColorway: (value: Colorway | string) => Promise<void>;
  saveIconFollow: (follow: boolean) => Promise<void>;
  saveSharing: (on: boolean) => Promise<void>;
  saveUpdateEnabled: (on: boolean) => Promise<void>;
  saveUpdatePrereleases: (on: boolean) => Promise<void>;
  openLogs: () => Promise<void>;
  copyLogs: () => Promise<void>;
  copyVersion: () => Promise<void>;
  rerunSetup: () => void;
  close: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Supply one Settings snapshot to a React tree.
 *
 * @param value Current snapshot and the save actions.
 * @param children Tree that may call `useSettings`.
 */
export function SettingsProvider({
  value,
  children,
}: {
  value: SettingsContextValue;
  children: ReactNode;
}) {
  return <SettingsContext value={value}>{children}</SettingsContext>;
}

/**
 * Read the shared Settings.
 *
 * Throws when no `SettingsProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (value === null) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return value;
}
