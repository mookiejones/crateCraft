/**
 * Hot cue edit API and pending pad helpers (#464).
 *
 * Preview and apply post `/api/cue-edit`. Pending pads live in the detail
 * pane until Apply. Undo uses the snapshot id from a successful write.
 */

import { postJSON } from "../api";
import type { Marker } from "../api-types";
import { hasKey, t } from "../i18n";
import { CUE_SLOT_COUNT, cueSlots, formatCueTime, isCueColor } from "../ui/cue-view";

export type CuePad = {
  index: number;
  start_ms: number;
  name: string;
  color: string | null;
};

export type CueFingerprint = {
  size: number;
  mtime_ns: number;
};

export type CueDiff = {
  slot: number;
  before: CuePad | null;
  after: CuePad | null;
};

export type CueEditPlan = {
  preview: boolean;
  written: boolean;
  id: number;
  space: string;
  file: string;
  editable: boolean;
  reason: string | null;
  fingerprint: CueFingerprint | null;
  beat_ms: number | null;
  palette: string[];
  before: Array<CuePad | null>;
  after: Array<CuePad | null>;
  diffs: CueDiff[];
  cues: Marker[];
  snapshot_id: string | null;
  undone?: string;
};

/**
 * Map track cues onto eight editable pads.
 *
 * @param cues Cue rows from the track.
 * @returns Always eight entries. Empty pads are `null`.
 */
export function padsFromCues(cues: readonly Marker[] | undefined): Array<CuePad | null> {
  return cueSlots(cues).map((cue, index) => {
    if (!cue) return null;
    const start = Number(cue.start_ms);
    if (!Number.isFinite(start) || start < 0) return null;
    const color = typeof cue.color === "string" && isCueColor(cue.color) ? cue.color : null;
    return {
      index,
      start_ms: Math.round(start),
      name: typeof cue.name === "string" ? cue.name : "",
      color,
    };
  });
}

/**
 * True when two pad lists differ.
 *
 * @param left Current or before pads.
 * @param right Pending pads.
 * @returns True when any slot changed.
 */
export function padsDirty(
  left: ReadonlyArray<CuePad | null>,
  right: ReadonlyArray<CuePad | null>,
): boolean {
  if (left.length !== right.length) return true;
  for (let slot = 0; slot < left.length; slot += 1) {
    if (padSignature(left[slot] ?? null) !== padSignature(right[slot] ?? null)) return true;
  }
  return false;
}

/**
 * Diff rows for the pending apply bar.
 *
 * @param before Pads loaded from the file.
 * @param after Pending pads.
 * @returns Changed slots only, lowest index first.
 */
export function pendingDiffs(
  before: ReadonlyArray<CuePad | null>,
  after: ReadonlyArray<CuePad | null>,
): CueDiff[] {
  const diffs: CueDiff[] = [];
  for (let slot = 0; slot < CUE_SLOT_COUNT; slot += 1) {
    const left = before[slot] ?? null;
    const right = after[slot] ?? null;
    if (padSignature(left) === padSignature(right)) continue;
    diffs.push({ slot, before: left, after: right });
  }
  return diffs;
}

/**
 * One-line label for a pad in a before/after row.
 *
 * @param pad The pad, or null for empty.
 * @param empty Translated empty word.
 * @returns Time and name, or `empty`.
 */
export function padSummary(pad: CuePad | null, empty: string): string {
  if (!pad) return empty;
  const named = pad.name.trim();
  const time = formatCueTime(pad.start_ms);
  return named ? `${time} ${named}` : time;
}

/**
 * Translate a cue-edit reason code for the detail pane.
 *
 * @param reason Machine code from `/api/cue-edit`, or null.
 * @returns Localized sentence, or null when there is no known code.
 */
export function cueEditReasonMessage(reason: string | null | undefined): string | null {
  if (!reason) return null;
  const key = `error.cue_edit_${reason}`;
  if (!hasKey(key)) return null;
  return t(key);
}

/**
 * Nudge a pad's start time.
 *
 * @param pad Filled pad.
 * @param deltaMs Milliseconds to add (may be negative).
 * @returns A new pad clamped to 0.
 */
export function nudgePad(pad: CuePad, deltaMs: number): CuePad {
  return { ...pad, start_ms: Math.max(0, Math.round(pad.start_ms + deltaMs)) };
}

/**
 * Set a pad at the playhead.
 *
 * @param index Zero-based pad index.
 * @param playheadSeconds Player time.
 * @param color Palette color for the pad.
 * @param name Optional cue name.
 * @returns A filled pad.
 */
export function padAtPlayhead(
  index: number,
  playheadSeconds: number,
  color: string | null,
  name = "",
): CuePad {
  const start_ms = Math.max(0, Math.round(playheadSeconds * 1000));
  return { index, start_ms, name, color };
}

/**
 * Swap two pad slots.
 *
 * @param pads Pending pads.
 * @param left Zero-based index.
 * @param right Zero-based index.
 * @returns A new eight-slot list.
 */
export function swapPads(
  pads: ReadonlyArray<CuePad | null>,
  left: number,
  right: number,
): Array<CuePad | null> {
  if (
    left === right
    || left < 0
    || right < 0
    || left >= CUE_SLOT_COUNT
    || right >= CUE_SLOT_COUNT
  ) {
    return [...pads];
  }
  const next = [...pads];
  const a = next[left] ?? null;
  const b = next[right] ?? null;
  next[left] = b ? { ...b, index: left } : null;
  next[right] = a ? { ...a, index: right } : null;
  return next;
}

/**
 * Preview cue edits for one track.
 *
 * @param trackId Asset id.
 * @param space Space name.
 * @param pads Desired pads, or omit for status only.
 * @param fingerprint Size/mtime from when editing started.
 * @returns The plan. Nothing is written.
 */
export async function previewCueEdit(
  trackId: number,
  space: string,
  pads?: Array<CuePad | null>,
  fingerprint?: CueFingerprint | null,
): Promise<CueEditPlan> {
  return await postJSON<CueEditPlan>("/api/cue-edit", {
    action: "preview",
    id: trackId,
    space,
    ...(pads ? { pads } : {}),
    ...(fingerprint ? { fingerprint } : {}),
  });
}

/**
 * Apply pending cue edits.
 *
 * @param trackId Asset id.
 * @param space Space name.
 * @param pads Desired pads.
 * @param fingerprint Size/mtime from when editing started.
 * @returns The write result with `snapshot_id` for undo.
 */
export async function applyCueEdit(
  trackId: number,
  space: string,
  pads: Array<CuePad | null>,
  fingerprint?: CueFingerprint | null,
): Promise<CueEditPlan> {
  return await postJSON<CueEditPlan>("/api/cue-edit", {
    action: "apply",
    id: trackId,
    space,
    confirm: true,
    pads,
    ...(fingerprint ? { fingerprint } : {}),
  });
}

/**
 * Undo a cue edit from its pre-write snapshot.
 *
 * @param snapshotId Id returned from apply.
 * @returns The undo result.
 */
export async function undoCueEdit(snapshotId: string): Promise<CueEditPlan> {
  return await postJSON<CueEditPlan>("/api/cue-edit", {
    action: "undo",
    confirm: true,
    snapshot_id: snapshotId,
  });
}

function padSignature(pad: CuePad | null): string {
  if (!pad) return "";
  return `${pad.start_ms}\0${pad.color ?? ""}\0${pad.name}`;
}
