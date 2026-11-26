/**
 * Live unplayable reasons shared by the crate list and the gig check.
 *
 * The codes are the English words the server sends. Display strings come
 * from the locale catalogs. A file that opens has no reason.
 */

import { t, type MessageKey } from "../i18n";
import { tips, type TipSpec } from "../ui/tooltip-strings";

export const UNPLAYABLE_REASONS = [
  "streaming",
  "drive offline",
  "file missing",
  "no path",
  "unknown",
] as const;

export type UnplayableReason = (typeof UNPLAYABLE_REASONS)[number];

const LABEL: Record<UnplayableReason, MessageKey> = {
  streaming: "track.reason.streaming",
  "drive offline": "track.reason.driveOffline",
  "file missing": "track.reason.fileMissing",
  "no path": "track.reason.noPath",
  unknown: "track.reason.unknown",
};

const TIP: Record<UnplayableReason, TipSpec> = {
  streaming: tips.trackReasonStreaming,
  "drive offline": tips.trackReasonDriveOffline,
  "file missing": tips.trackReasonFileMissing,
  "no path": tips.trackReasonNoPath,
  unknown: tips.trackReasonUnknown,
};

/**
 * Return whether a server value is one of the five reason codes.
 *
 * @param value Track or gig field.
 * @returns True for the five English codes.
 */
export function isUnplayableReason(value: unknown): value is UnplayableReason {
  return typeof value === "string" && (UNPLAYABLE_REASONS as readonly string[]).includes(value);
}

/**
 * Visible name for a reason in the active language.
 *
 * @param reason One of the five codes.
 * @returns English code, or the Spanish sentence.
 */
export function unplayableLabel(reason: UnplayableReason): string {
  return t(LABEL[reason]);
}

/**
 * Tooltip for the reason control.
 *
 * @param reason One of the five codes.
 * @returns Locale key. The sentence is not the color.
 */
export function unplayableTip(reason: UnplayableReason): TipSpec {
  return TIP[reason];
}
