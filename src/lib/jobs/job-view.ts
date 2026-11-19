/**
 * Pure helpers for write-job progress and toast copy.
 */

import type { Job, JobState } from "../api-types";
import type { NoticeSeverity } from "../ui/notice-store";
import { t } from "../i18n";

const TERMINAL: ReadonlySet<JobState> = new Set([
  "success",
  "partial",
  "failed",
  "cancelled",
]);

/**
 * Return whether the job has finished.
 *
 * @param state Job state.
 * @returns True for success, partial, failed, or cancelled.
 */
export function isTerminal(state: JobState | undefined): boolean {
  return state !== undefined && TERMINAL.has(state);
}

/**
 * Return whether the job is still in flight.
 *
 * @param job Job or null.
 * @returns True for queued or running.
 */
export function isActive(job: Job | null | undefined): boolean {
  return job != null && !isTerminal(job.state);
}

/**
 * Progress line under Apply or Restore.
 *
 * @param job In-flight job.
 * @returns Determinate count, or the label when total is unknown.
 */
export function progressText(job: Job): string {
  if (job.total > 0) {
    return t("jobs.progress", { label: job.label, done: job.done, total: job.total });
  }
  return t("jobs.progressUnknown", { label: job.label });
}

/**
 * Completion sentence for the toast.
 *
 * @param job Finished job.
 * @returns Localized result line.
 */
export function toastText(job: Job): string {
  if (job.state === "success") return t("jobs.success", { label: job.label });
  if (job.state === "partial") return t("jobs.partial", { label: job.label });
  if (job.state === "failed") return t("jobs.failed", { label: job.label });
  if (job.state === "cancelled") return t("jobs.cancelled", { label: job.label });
  return job.label;
}

/**
 * Alert color for a finished job.
 *
 * @param state Terminal state.
 * @returns Notice severity.
 */
export function toastSeverity(state: JobState): NoticeSeverity {
  if (state === "success") return "success";
  if (state === "partial") return "warning";
  if (state === "failed") return "error";
  return "info";
}

/**
 * Narrow a JSON body to a job.
 *
 * @param value POST or GET payload.
 * @returns True when required job fields are present.
 */
export function isJob(value: unknown): value is Job {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<Job>;
  return typeof row.id === "string"
    && typeof row.kind === "string"
    && typeof row.label === "string"
    && typeof row.state === "string"
    && typeof row.done === "number"
    && typeof row.total === "number"
    && Array.isArray(row.errors);
}
