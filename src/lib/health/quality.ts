/**
 * Sticky Not a problem dismiss for a quality line.
 *
 * POST /api/library-health writes quality-dismissals.json beside settings.
 * It does not change audio, cues, or the Serato library. The overview
 * reloads after a successful post.
 */

import { postJSON } from "../api";
import { state } from "../state";
import { loadHealth, showHealthFailure } from "./health";

/**
 * Hide one track's quality line until the file facts change.
 *
 * @param id Track id from the quality section.
 * @returns {Promise<void>}
 */
export async function dismissQuality(id: number): Promise<void> {
  try {
    await postJSON("/api/library-health", {
      action: "dismiss",
      id,
      space: state.space,
    });
    await loadHealth();
  } catch (error) {
    showHealthFailure(error);
  }
}

/**
 * Show quality lines the DJ had marked Not a problem.
 *
 * @returns {Promise<void>}
 */
export async function clearQualityDismissals(): Promise<void> {
  try {
    await postJSON("/api/library-health", { action: "clear-all", space: state.space });
    await loadHealth();
  } catch (error) {
    showHealthFailure(error);
  }
}
