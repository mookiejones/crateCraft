/**
 * Safe-to-update lines for the gig report.
 *
 * Strings come from the locale catalogs. Unknown does not hard-red the
 * ready score. This helper does not fetch and does not update anything.
 */

import type { GigUpdateSafety } from "../api-types";
import { t, type MessageKey } from "../i18n";

export const SERATO_DOWNLOADS = "https://serato.com/dj/pro/downloads";
export const MACOS_27_ARTICLE = "https://support.serato.com/hc/en-us/articles/18264025096975-macOS-27-Golden-Gate-supported-from-Serato-DJ-Pro-Lite-5-1-0-primary-hardware-compatibility";
export const LEXICON_UPDATES = "https://www.lexicondj.com/dj-software-updates";

const VERDICT_LINE: Record<string, MessageKey> = {
  yes: "gig.updateYes",
  not_cleared: "gig.updateNotCleared",
  unknown: "gig.updateUnknown",
};

const REASON_KEY: Record<string, MessageKey> = {
  serato_below_os: "gig.updateReason.seratoBelowOs",
  hardware_in_testing: "gig.updateReason.hardwareInTesting",
  hardware_unsupported: "gig.updateReason.hardwareUnsupported",
  hardware_unknown: "gig.updateReason.hardwareUnknown",
  hardware_missing: "gig.updateReason.hardwareMissing",
  serato_unknown: "gig.updateReason.seratoUnknown",
  os_unknown: "gig.updateReason.osUnknown",
  no_os_rule: "gig.updateReason.noOsRule",
  fetch_failed: "gig.updateReason.fetchFailed",
};

export interface UpdateSafetyView {
  verdict: "yes" | "not_cleared" | "unknown";
  line: string;
  combo: string;
  reasons: string[];
  warnings: string[];
  /** False for every verdict. Unknown must not hard-red the ready score. */
  hardRed: false;
}

/**
 * Map one API verdict to the sentences the report shows.
 *
 * A verdict other than yes or not_cleared is unknown. A known reason
 * code uses the catalog, not the English summary.
 *
 * @param safety Field from GET /api/gig-check. Null hides the line.
 * @returns Lines, or null when the report has no field.
 */
export function updateSafetyView(safety: GigUpdateSafety | null | undefined): UpdateSafetyView | null {
  if (!safety) return null;
  const verdict = safety.verdict === "yes" || safety.verdict === "not_cleared"
    ? safety.verdict
    : "unknown";
  const reasons = (safety.reasons || []).map((item) => {
    const key = REASON_KEY[item.code];
    return key ? t(key, item.params) : item.summary;
  });
  const releases = safety.releases || [];
  const warnings = safety.new_release_within_7_days
    ? (releases.length
      ? releases.map((release) => t("gig.updateFresh", {
        product: release.label || release.product,
        version: release.version,
      }))
      : [t("gig.updateFreshGeneric")])
    : [];
  const hardware = (safety.hardware || []).map((name) => name.trim()).filter(Boolean).join(", ");
  return {
    verdict,
    line: t(VERDICT_LINE[verdict] ?? "gig.updateUnknown"),
    combo: t("gig.updateCombo", {
      serato: safety.serato_version?.trim() || t("gig.updateValueUnknown"),
      os: safety.os_label?.trim() || t("gig.updateValueUnknown"),
      hardware: hardware || t("gig.updateNoHardware"),
    }),
    reasons,
    warnings,
    hardRed: false,
  };
}
