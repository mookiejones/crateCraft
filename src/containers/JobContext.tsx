/**
 * Shared write-job list for progress, toast, and the activity tray.
 *
 * Writes stay in job-store. This context is the one React read path.
 * Providers subscribe so every mounted island sees the same snapshot.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Job } from "../lib/api-types";
import {
  cancelJob,
  closeDetails,
  dismissToast,
  openDetails,
  startJob,
  undoJob,
} from "../lib/jobs/job-store";

export type JobContextValue = {
  jobs: Job[];
  running: Job | null;
  toast: Job | null;
  details: Job | null;
  startJob: typeof startJob;
  cancelJob: typeof cancelJob;
  undoJob: typeof undoJob;
  dismissToast: typeof dismissToast;
  openDetails: typeof openDetails;
  closeDetails: typeof closeDetails;
};

const JobContext = createContext<JobContextValue | null>(null);

/**
 * Idle snapshot for stories and tests that do not drive the store.
 *
 * @returns Empty list, no toast, stubbed actions.
 */
export function idleJobValue(): JobContextValue {
  return {
    jobs: [],
    running: null,
    toast: null,
    details: null,
    startJob: async () => ({ queued: true as const }),
    cancelJob: async () => {},
    undoJob: async () => ({}),
    dismissToast: () => {},
    openDetails: () => {},
    closeDetails: () => {},
  };
}

/**
 * Supply one job snapshot to a React tree.
 *
 * @param value Current jobs and actions.
 * @param children Tree that may call `useJobs`.
 */
export function JobProvider({
  value,
  children,
}: {
  value: JobContextValue;
  children: ReactNode;
}) {
  return <JobContext value={value}>{children}</JobContext>;
}

/**
 * Read the shared write-job list.
 *
 * Throws when no `JobProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useJobs(): JobContextValue {
  const value = useContext(JobContext);
  if (value === null) {
    throw new Error("useJobs must be used within JobProvider");
  }
  return value;
}
