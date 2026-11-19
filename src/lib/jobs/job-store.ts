/**
 * One global write-job list for progress, toast, and the activity tray.
 *
 * POST /api/jobs starts a tag spelling or snapshot restore. The page
 * polls GET /api/jobs?id= until the job is terminal. Gig Lock still
 * returns `{ queued: true }` and does not enter this store.
 */

import { postJSON, readJSON, type ApiFailure } from "../api";
import type { ErrorBody, Job, JobList } from "../api-types";
import { isQueuedWrite } from "../crates/queue-notice";
import { serverMessage, t } from "../i18n";
import { isJob, isTerminal } from "./job-view";

const POLL_MS = 200;
const KEEP = 20;

type QueuedWrite = { queued: true };

let jobs: Job[] = [];
let toast: Job | null = null;
let details: Job | null = null;
const listeners = new Set<() => void>();
const polls = new Map<string, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) listener();
}

function upsert(job: Job): void {
  const next = jobs.filter((row) => row.id !== job.id);
  next.unshift(job);
  jobs = next.slice(0, KEEP);
}

/**
 * Jobs newest first.
 *
 * @returns Current list.
 */
export function getJobs(): Job[] {
  return jobs;
}

/**
 * The in-flight job, or null when idle.
 *
 * @returns Queued or running job.
 */
export function getRunning(): Job | null {
  return jobs.find((job) => !isTerminal(job.state)) ?? null;
}

/**
 * Last finished job shown in the completion toast.
 *
 * @returns Terminal job, or null.
 */
export function getToast(): Job | null {
  return toast;
}

/**
 * Job whose details dialog is open.
 *
 * @returns Job, or null.
 */
export function getDetails(): Job | null {
  return details;
}

/**
 * Subscribe to job-list changes.
 *
 * @param listener Called after a write.
 * @returns Unsubscribe.
 */
export function subscribeJobs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Hide the completion toast.
 */
export function dismissToast(): void {
  if (toast === null) return;
  toast = null;
  emit();
}

/**
 * Open the details dialog for one job.
 *
 * @param job Job to inspect.
 */
export function openDetails(job: Job): void {
  details = job;
  emit();
}

/**
 * Close the details dialog.
 */
export function closeDetails(): void {
  if (details === null) return;
  details = null;
  emit();
}

/**
 * POST a new job and poll until it finishes.
 *
 * @param payload `kind` plus the fields that kind needs.
 * @returns The finished job, or a Gig Lock queued body.
 */
export async function startJob(
  payload: Record<string, unknown>,
): Promise<Job | QueuedWrite> {
  const reply = await postJSON<Job & { queued?: boolean }>("/api/jobs", payload);
  if (isQueuedWrite(reply)) return reply as QueuedWrite;
  if (!isJob(reply)) {
    throw new Error(t("error.invalid_request"));
  }
  upsert(reply);
  emit();
  if (isTerminal(reply.state)) {
    toast = reply;
    emit();
    return reply;
  }
  return await waitForJob(reply.id);
}

/**
 * Request cancel. After commit this is a no-op.
 *
 * @param jobId Job id.
 */
export async function cancelJob(jobId: string): Promise<void> {
  const reply = await postJSON<Job>("/api/jobs", { action: "cancel", id: jobId });
  if (isJob(reply)) {
    upsert(reply);
    emit();
  }
}

/**
 * Restore the snapshot taken before this job's write.
 *
 * @param jobId Job id.
 * @returns The restore result.
 */
export async function undoJob(jobId: string): Promise<unknown> {
  return await postJSON("/api/jobs", { action: "undo", id: jobId });
}

/**
 * Drop in-memory jobs. Tests call this between cases.
 */
export function resetJobs(): void {
  for (const timer of polls.values()) clearTimeout(timer);
  polls.clear();
  jobs = [];
  toast = null;
  details = null;
  listeners.clear();
}

async function waitForJob(jobId: string): Promise<Job> {
  for (;;) {
    const job = await fetchJob(jobId);
    upsert(job);
    if (isTerminal(job.state)) {
      toast = job;
      emit();
      return job;
    }
    emit();
    await delay(POLL_MS);
  }
}

async function fetchJob(jobId: string): Promise<Job> {
  const response = await fetch(`/api/jobs?id=${encodeURIComponent(jobId)}`);
  const payload = await readJSON<Job & ErrorBody>(response);
  if (!response.ok || !isJob(payload)) {
    const error = new Error(
      serverMessage(payload, t("error.job_unknown")),
    ) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * Read recent jobs. Unused by the page poll; kept for tests.
 *
 * @returns Listing.
 */
export async function fetchJobs(): Promise<JobList> {
  const response = await fetch("/api/jobs");
  const payload = await readJSON<JobList & ErrorBody>(response);
  if (!response.ok) {
    const error = new Error(
      serverMessage(payload, t("error.job_unknown")),
    ) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    polls.set(String(timer), timer);
  });
}
