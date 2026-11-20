/**
 * Stick-only cue preview and import.
 *
 * Review posts preview and writes nothing. Import posts apply with
 * confirm true. The server copies empty pads only.
 */

import { postJSON } from "../api";
import { t } from "../i18n";

export interface StickCue {
  file: string;
  index: number;
  startMs: number | null;
  name: string;
  color: string | null;
  skip: string | null;
}

export interface StickSkip {
  file: string;
  skip: string;
}

export interface StickCueReport {
  preview: boolean;
  written: boolean;
  status: string;
  libraryStatus: string;
  drive: string;
  count: number;
  cues: StickCue[];
  skipped: StickSkip[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Last path segment of a volume root, for the not-connected line.
 *
 * @param drive Volume root from the report.
 * @returns The folder or drive name.
 */
export function stickDriveLabel(drive: string): string {
  const parts = drive.replace(/[\\/]+$/, "").split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? drive;
}

/**
 * Read the public stick-cue JSON.
 *
 * @param body Decoded POST /api/stick-cues body.
 * @returns The report, or null when status is missing.
 */
export function parseStickCueReport(body: unknown): StickCueReport | null {
  if (!isRecord(body) || typeof body.status !== "string") return null;
  const cues: StickCue[] = [];
  if (Array.isArray(body.cues)) {
    for (const row of body.cues) {
      if (!isRecord(row) || typeof row.file !== "string" || typeof row.index !== "number") continue;
      cues.push({
        file: row.file,
        index: row.index,
        startMs: typeof row.start_ms === "number" ? row.start_ms : null,
        name: typeof row.name === "string" ? row.name : "",
        color: typeof row.color === "string" ? row.color : null,
        skip: typeof row.skip === "string" ? row.skip : null,
      });
    }
  }
  const skipped: StickSkip[] = [];
  if (Array.isArray(body.skipped)) {
    for (const row of body.skipped) {
      if (!isRecord(row) || typeof row.file !== "string" || typeof row.skip !== "string") continue;
      skipped.push({ file: row.file, skip: row.skip });
    }
  }
  const count = typeof body.count === "number"
    ? body.count
    : cues.filter((cue) => cue.skip === null).length;
  return {
    preview: body.preview === true,
    written: body.written === true,
    status: body.status,
    libraryStatus: typeof body.library_status === "string" ? body.library_status : "",
    drive: typeof body.drive === "string" ? body.drive : "",
    count,
    cues,
    skipped,
  };
}

async function postStick(body: { action: string; drive: string; confirm?: boolean }): Promise<StickCueReport> {
  const payload = await postJSON<unknown>("/api/stick-cues", body);
  const report = parseStickCueReport(payload);
  if (!report) throw new Error(t("error.requestFailed"));
  return report;
}

/**
 * List stick-only cues. Nothing is written.
 *
 * @param drive Volume root remembered by the Check drive picker.
 * @returns The preview report.
 */
export function reviewStickCues(drive: string): Promise<StickCueReport> {
  return postStick({ action: "preview", drive });
}

/**
 * Copy stick-only cues into empty library pads.
 *
 * @param drive Volume root remembered by the Check drive picker.
 * @returns The apply report. written is false when nothing changed.
 */
export function importStickCues(drive: string): Promise<StickCueReport> {
  return postStick({ action: "apply", drive, confirm: true });
}
