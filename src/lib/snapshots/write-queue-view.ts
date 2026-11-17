/**
 * Pure helpers for the Gig Lock panel on Backups (#393).
 */

import { t } from "../i18n";
import type { WriteQueueListing } from "../api-types";

/**
 * Count line for pending queued writes.
 *
 * @param count Pending items.
 * @returns Localized empty or count sentence.
 */
export function pendingCountText(count: number): string {
  if (count <= 0) return t("gigLock.empty");
  return t("gigLock.count", { count });
}

/**
 * Status line from a listing or apply reply.
 *
 * @param listing Latest GET or POST payload, or null before load.
 * @returns Localized status, or an empty string before the first load.
 */
export function queueStatusText(listing: WriteQueueListing | null): string {
  if (!listing) return "";
  if (listing.error) return listing.error;
  if (listing.undone) return t("gigLock.undo");
  const layer = listing.layers?.[0];
  if (layer) return t("gigLock.conflict", { layer });
  if ((listing.skipped ?? []).length > 0) return t("gigLock.skipped");
  return pendingCountText((listing.pending ?? []).length);
}
