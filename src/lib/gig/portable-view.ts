/**
 * Pure Check-drive labels and Data Grid rows.
 *
 * The React screen and the engine share these helpers. Kind labels come
 * from the locale catalogs. Server fix sentences stay as returned.
 */

import { t, type MessageKey } from "../i18n";
import type { DriveReport } from "./portable";

const KIND_KEY: Readonly<Record<string, MessageKey>> = {
  off_drive: "portable.kindOffDrive",
  missing: "portable.kindMissing",
  smart_crate: "portable.kindSmartCrate",
  unsafe_name: "portable.kindUnsafeName",
  path_length: "portable.kindPathLength",
  file_size: "portable.kindFileSize",
};

export type PortableViewRow = {
  id: string;
  problem: string;
  crate: string;
  track: string;
  fix: string;
};

/**
 * Kind label in the active language.
 *
 * @param kind Finding kind from the report.
 * @returns Translated label, or the raw kind.
 */
export function portableKindLabel(kind: string): string {
  const key = KIND_KEY[kind];
  return key ? t(key) : kind;
}

/**
 * Data Grid rows for Gig Check drive. Problem names the fault.
 *
 * Findings are not capped. The Files dialog still uses FINDING_CAP.
 *
 * @param report Parsed drive-check body.
 * @returns One row per finding or crate error.
 */
export function portableViewRows(report: DriveReport): PortableViewRow[] {
  const rows: PortableViewRow[] = [];
  report.findings.forEach((finding, index) => {
    rows.push({
      id: `finding-${index}`,
      problem: portableKindLabel(finding.kind),
      crate: finding.crate,
      track: finding.track,
      fix: finding.fix,
    });
  });
  report.errors.forEach((error, index) => {
    rows.push({
      id: `error-${index}`,
      problem: error.crate ? `${error.crate}: ${error.message}` : error.message,
      crate: error.crate,
      track: "",
      fix: "",
    });
  });
  return rows;
}
