/**
 * Shared list selection and detail fields.
 *
 * The library still lives in `state`. This context is the one React read
 * path for the virtualized rows and the detail pane. Play stays on
 * PlayerContext.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { TrackListActions, TrackListSnapshot } from "../track-list-store";

export type TrackListContextValue = TrackListSnapshot & TrackListActions;

const TrackListContext = createContext<TrackListContextValue | null>(null);

/**
 * Supply one list and detail snapshot to a React tree.
 *
 * @param value Current snapshot and the list actions.
 * @param children Tree that may call `useTrackList`.
 */
export function TrackListProvider({
  value,
  children,
}: {
  value: TrackListContextValue;
  children: ReactNode;
}) {
  return <TrackListContext value={value}>{children}</TrackListContext>;
}

/**
 * Read the shared list and detail.
 *
 * Throws when no `TrackListProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useTrackList(): TrackListContextValue {
  const value = useContext(TrackListContext);
  if (value === null) {
    throw new Error("useTrackList must be used within TrackListProvider");
  }
  return value;
}
