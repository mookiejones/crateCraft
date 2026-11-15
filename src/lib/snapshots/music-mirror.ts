/**
 * Music-file backup mirror (#394).
 *
 * GET /api/music-mirror is read-only. POST copy writes dest audio and
 * may run while Serato is open. POST restore, crate, and relink with
 * confirm write; crate and relink need Serato quit. Relink reuses
 * POST /api/files action relink.
 */

import { postJSON, readJSON, type ApiFailure } from "../api";
import type { ErrorBody, MusicMirrorReport } from "../api-types";
import { serverMessage, t } from "../i18n";
import { state } from "../state";
import type { MusicMirrorAction } from "./music-mirror-view";

export type { MusicMirrorAction } from "./music-mirror-view";

/**
 * Read-only classification of laptop files against dest.
 *
 * @param dest Backup folder.
 * @returns The preview report.
 */
export async function fetchMirrorPreview(dest: string): Promise<MusicMirrorReport> {
  const folder = dest.trim();
  const response = await fetch(
    `/api/music-mirror?dest=${encodeURIComponent(folder)}&space=${encodeURIComponent(state.space)}`,
  );
  const payload = await readJSON<MusicMirrorReport & ErrorBody>(response).catch((): MusicMirrorReport & ErrorBody => ({}));
  if (!response.ok) {
    const error = new Error(serverMessage(payload, t("musicMirror.unreadable"))) as ApiFailure;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

/**
 * POST one mirror action. Writes other than preview need confirm true.
 *
 * @param action preview, copy, restore, crate, or relink.
 * @param dest Backup folder.
 * @param confirm True performs the write.
 * @returns The report after that action.
 */
export async function postMirror(
  action: MusicMirrorAction,
  dest: string,
  confirm: boolean,
): Promise<MusicMirrorReport> {
  return await postJSON<MusicMirrorReport>("/api/music-mirror", {
    action,
    dest: dest.trim(),
    space: state.space,
    confirm,
  });
}
