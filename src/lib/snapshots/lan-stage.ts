/**
 * Backup Mac (#467).
 *
 * GET /api/lan-stage is read-only and does not start listening.
 * POST send with confirm true copies files to the other computer's
 * staged folder and does not write a Serato library. POST accept and
 * undo with confirm true write this library. There is no mirror action.
 */

import { postJSON, readJSON, type ApiFailure } from "../api";
import type { ErrorBody, LanStageReport } from "../api-types";
import { serverMessage, t } from "../i18n";
import { state } from "../state";

/**
 * Read whether this Mac is listening. Does not start the listener.
 *
 * @returns Status and the inbox.
 */
export async function fetchLanStage(): Promise<LanStageReport> {
  const response = await fetch("/api/lan-stage");
  const payload = await readJSON<LanStageReport & ErrorBody>(response).catch((): LanStageReport & ErrorBody => ({}));
  if (!response.ok) {
    const error = new Error(serverMessage(payload, t("lanStage.unreadable"))) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * POST one Backup Mac action.
 *
 * @param body Action fields. `confirm` true is what sends or writes.
 * @returns The report.
 */
export async function postLanStage(body: Record<string, unknown>): Promise<LanStageReport> {
  return await postJSON<LanStageReport>("/api/lan-stage", {
    space: state.space,
    ...body,
  });
}
