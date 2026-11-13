/**
 * Shared action-flash notice for the AppShell banner.
 *
 * Writes stay in notice-store and views.setNotice. This context is the
 * one React read path. Providers subscribe so every mounted island
 * sees the same snapshot.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Notice } from "../lib/ui/notice-store";

export type NoticeContextValue = {
  notice: Notice | null;
  dismiss: () => void;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);

/**
 * Supply one notice snapshot to a React tree.
 *
 * @param value Current notice and dismiss.
 * @param children Tree that may call `useNotice`.
 */
export function NoticeProvider({
  value,
  children,
}: {
  value: NoticeContextValue;
  children: ReactNode;
}) {
  return <NoticeContext value={value}>{children}</NoticeContext>;
}

/**
 * Read the shared action-flash notice.
 *
 * Throws when no `NoticeProvider` is above this component.
 *
 * @returns The snapshot and dismiss for this island.
 */
export function useNotice(): NoticeContextValue {
  const value = useContext(NoticeContext);
  if (value === null) {
    throw new Error("useNotice must be used within NoticeProvider");
  }
  return value;
}
