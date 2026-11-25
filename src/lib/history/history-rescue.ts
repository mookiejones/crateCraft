/**
 * History rescue API (#482).
 */

import { postJSON, readJSON, type ApiFailure } from "../api";
import type { ErrorBody, HistoryRescueReport } from "../api-types";
import { serverMessage, t } from "../i18n";
import { state } from "../state";
import type { HistoryRescueAction } from "./history-rescue-view";

export type { HistoryRescueAction } from "./history-rescue-view";

/**
 * List history sources.
 */
export async function fetchHistoryRescueCatalog(): Promise<HistoryRescueReport> {
  const response = await fetch("/api/history-rescue");
  const payload = await readJSON<HistoryRescueReport & ErrorBody>(response).catch(
    (): HistoryRescueReport & ErrorBody => ({}),
  );
  if (!response.ok) {
    const error = new Error(serverMessage(payload, t("history.sessionFailed"))) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * Compare live history with one source.
 */
export async function fetchHistoryRescueCompare(source: string): Promise<HistoryRescueReport> {
  const response = await fetch(
    `/api/history-rescue?source=${encodeURIComponent(source.trim())}`,
  );
  const payload = await readJSON<HistoryRescueReport & ErrorBody>(response).catch(
    (): HistoryRescueReport & ErrorBody => ({}),
  );
  if (!response.ok) {
    const error = new Error(serverMessage(payload, t("history.sessionFailed"))) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * POST one history-rescue action.
 */
export async function postHistoryRescue(
  action: HistoryRescueAction,
  source: string,
  sessions: number[],
  confirm: boolean,
): Promise<HistoryRescueReport> {
  return await postJSON<HistoryRescueReport>("/api/history-rescue", {
    action,
    source: source.trim() || "live",
    sessions,
    space: state.space,
    confirm,
  });
}
