/**
 * Shared snapshot list and restore-plan state.
 *
 * The engine stays in `restore.ts`. This context is the one React read
 * path. Providers subscribe so the list and the restore dialog see the
 * same snapshot.
 */

import { createContext, useContext, type ReactNode } from "react";
import type {
  DriveBackup,
  OperationEntry,
  PendingUndo,
  RestorePlan,
  SnapshotInfo,
} from "../api-types";
import type { MessageKey } from "../i18n";

export type SnapshotsSnapshot = {
  snapshots: readonly SnapshotInfo[];
  driveBackup: DriveBackup | null;
  operations: readonly OperationEntry[];
  operationsLoading: boolean;
  operationsError: string;
  snapshotLoading: boolean;
  snapshotError: string;
  snapshotMessage: MessageKey | "";
  snapshotUndo: PendingUndo | null;
  writeBlock: string;
  writeBlockCode: string;
  writeBlockParams: Record<string, string | number> | null;
  seratoRunning: boolean;
  snapshotPlanId: string;
  plan: RestorePlan | null;
  planOpen: boolean;
  planStatus: string;
  taking: boolean;
  backingDrives: boolean;
  confirming: boolean;
  driveNoteError: string;
  statusOverride: string;
};

export type SnapshotsContextValue = SnapshotsSnapshot & {
  loadSnapshots: () => Promise<void>;
  loadOperations: () => Promise<void>;
  takeSnapshot: () => Promise<void>;
  backupDriveCrates: () => Promise<void>;
  openSnapshotPlan: (snapshotId: string) => Promise<void>;
  confirmSnapshotRestore: () => Promise<void>;
  closePlan: () => void;
  failSnapshots: (error: unknown) => void;
  setSnapshotDialogStatus: (message: string) => void;
};

const SnapshotsContext = createContext<SnapshotsContextValue | null>(null);

/**
 * Supply one snapshot list to a React tree.
 *
 * @param value Current list, plan, and the engine actions.
 * @param children Tree that may call `useSnapshots`.
 */
export function SnapshotsProvider({
  value,
  children,
}: {
  value: SnapshotsContextValue;
  children: ReactNode;
}) {
  return <SnapshotsContext value={value}>{children}</SnapshotsContext>;
}

/**
 * Read the shared snapshots view.
 *
 * Throws when no `SnapshotsProvider` is above this component.
 *
 * @returns The list, plan, and actions for this island.
 */
export function useSnapshots(): SnapshotsContextValue {
  const value = useContext(SnapshotsContext);
  if (value === null) {
    throw new Error("useSnapshots must be used within SnapshotsProvider");
  }
  return value;
}
