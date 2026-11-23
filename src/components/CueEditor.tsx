/**
 * Hot cue editor for pads 1–8 in the track detail pane (#464).
 *
 * Edits stay pending until Apply. Loops and the beatgrid stay view-only.
 */

import {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { Track } from "../lib/api-types";
import {
  applyCueEdit,
  nudgePad,
  padAtPlayhead,
  padsDirty,
  padsFromCues,
  padSummary,
  pendingDiffs,
  previewCueEdit,
  swapPads,
  undoCueEdit,
  type CueFingerprint,
  type CuePad,
} from "../lib/cues/cue-edit";
import { usePlayer } from "../containers/PlayerContext";
import { useTrackList } from "../containers/TrackListContext";
import { failureOf } from "../lib/api";
import { t } from "../lib/i18n";
import { jumpCue } from "../lib/player/player";
import { extraCues, formatCueTime, slotColor } from "../lib/ui/cue-view";
import {
  tips,
  cueEditApplyTip,
  cueEditColorTip,
  cueEditDeleteTip,
  cueEditDiscardTip,
  cueEditNameTip,
  cueEditNudgeTip,
  cueEditSetTip,
  cueEditSwapTip,
  cueEditTimeTip,
} from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";
import { CueSlot } from "./CuePads";

const DEFAULT_PALETTE = [
  "#C02626",
  "#F8821A",
  "#173BA2",
  "#FAC313",
  "#1FAD26",
  "#CE359E",
  "#1DBEBD",
  "#6823B6",
];

let lastUndoSnapshot: string | null = null;

export type CueEditorProps = {
  track: Track;
  writable: boolean;
};

/**
 * Editable cue pads with a pending Apply bar.
 *
 * @param props Track and whether library writes are allowed.
 */
export function CueEditor({ track, writable }: CueEditorProps) {
  const list = useTrackList();
  const player = usePlayer();
  const liveRegionId = useId();
  const space = list.space || "Serato Library";
  const [baseline, setBaseline] = useState(() => padsFromCues(track.cues));
  const [pending, setPending] = useState(() => padsFromCues(track.cues));
  const [fingerprint, setFingerprint] = useState<CueFingerprint | null>(null);
  const [palette, setPalette] = useState<string[]>(DEFAULT_PALETTE);
  const [beatMs, setBeatMs] = useState<number | null>(null);
  const [editable, setEditable] = useState(false);
  const [reasonText, setReasonText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [undoId, setUndoId] = useState<string | null>(lastUndoSnapshot);
  const dirty = padsDirty(baseline, pending);
  const diffs = pendingDiffs(baseline, pending);
  const canEdit = writable && editable && !busy;

  useEffect(() => {
    let cancelled = false;
    setBaseline(padsFromCues(track.cues));
    setPending(padsFromCues(track.cues));
    setSwapFrom(null);
    setStatus("");
    void previewCueEdit(track.id, space)
      .then((plan) => {
        if (cancelled) return;
        setEditable(plan.editable);
        setReasonText(plan.reason_text);
        setFingerprint(plan.fingerprint);
        setPalette(plan.palette.length ? plan.palette : DEFAULT_PALETTE);
        setBeatMs(typeof plan.beat_ms === "number" ? plan.beat_ms : null);
        const loaded = plan.before.map((pad) => pad);
        setBaseline(loaded);
        setPending(loaded);
      })
      .catch((error) => {
        if (cancelled) return;
        setEditable(false);
        setReasonText(failureOf(error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [track.id, space]);

  function updateSlot(slot: number, pad: CuePad | null): void {
    setPending((prev) => {
      const next = [...prev];
      next[slot] = pad;
      return next;
    });
  }

  function onSwap(slot: number): void {
    if (swapFrom === null) {
      setSwapFrom(slot);
      setStatus(t("markers.cueEdit.swapPick", { number: slot + 1 }));
      return;
    }
    setPending((prev) => swapPads(prev, swapFrom, slot));
    setSwapFrom(null);
    setStatus(t("markers.cueEdit.swapped", { a: swapFrom + 1, b: slot + 1 }));
  }

  async function onApply(): Promise<void> {
    if (!canEdit || !dirty) return;
    setBusy(true);
    setStatus(t("markers.cueEdit.applying"));
    try {
      const result = await applyCueEdit(track.id, space, pending, fingerprint);
      if (!result.written) {
        setEditable(result.editable);
        setReasonText(result.reason_text);
        setStatus(result.reason_text || t("markers.cueEdit.noChange"));
        return;
      }
      const next = padsFromCues(result.cues);
      setBaseline(next);
      setPending(next);
      setFingerprint(result.fingerprint);
      lastUndoSnapshot = result.snapshot_id;
      setUndoId(result.snapshot_id);
      setStatus(t("markers.cueEdit.savedUndo"));
      list.setNotice(t("markers.cueEdit.savedUndo"), "success");
      list.selectTrack(track.id);
    } catch (error) {
      const message = failureOf(error).message;
      setStatus(message);
      list.setNotice(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function onUndoLast(): Promise<void> {
    if (!undoId || busy) return;
    setBusy(true);
    try {
      await undoCueEdit(undoId);
      lastUndoSnapshot = null;
      setUndoId(null);
      const plan = await previewCueEdit(track.id, space);
      const next = plan.before.map((pad) => pad);
      setBaseline(next);
      setPending(next);
      setFingerprint(plan.fingerprint);
      setEditable(plan.editable);
      setReasonText(plan.reason_text);
      setStatus(t("markers.cueEdit.undone"));
      list.setNotice(t("markers.cueEdit.undone"), "success");
      list.selectTrack(track.id);
    } catch (error) {
      const message = failureOf(error).message;
      setStatus(message);
      list.setNotice(message, "error");
    } finally {
      setBusy(false);
    }
  }

  function onDiscard(): void {
    setPending([...baseline]);
    setSwapFrom(null);
    setStatus(t("markers.cueEdit.discarded"));
  }

  let note = t("markers.cueEdit.help");
  if (track.markers_unavailable) note = t("markers.unavailable");
  else if (!editable && reasonText) note = reasonText;
  else if (!track.markers_found && !editable) note = t("markers.none");
  else if (!editable) note = t("markers.readOnly");

  const cues = track.cues || [];
  const showPads = !track.markers_unavailable;

  return (
    <>
      <p className="detail-kicker">{note}</p>
      {showPads ? (
        <div className="cue-editor" data-editable={canEdit ? "true" : "false"}>
          {pending.map((pad, slot) => (
            <CueEditRow
              key={slot}
              slot={slot}
              pad={pad}
              palette={palette}
              beatMs={beatMs}
              disabled={!canEdit}
              swapArmed={swapFrom === slot}
              playheadSeconds={player.mediaTime()}
              onChange={(next) => updateSlot(slot, next)}
              onSwap={() => onSwap(slot)}
              onJump={() => {
                if (pad) jumpCue(slot);
              }}
            />
          ))}
          {extraCues(cues).map((cue, index) => {
            const cueIndex = Number(cue.index);
            const slot = Number.isInteger(cueIndex) ? cueIndex : -1;
            return <CueSlot key={`extra-${index}`} slot={slot} cue={cue} />;
          })}
          {dirty ? (
            <div className="cue-editor-pending" role="region" aria-label={t("markers.cueEdit.pending")}>
              <p className="detail-kicker">{t("markers.cueEdit.pending")}</p>
              {diffs.map((diff) => (
                <p key={diff.slot} className="cue-diff">
                  <span className="marker-slot">{diff.slot + 1}</span>
                  <span>{padSummary(diff.before, t("markers.cueEmpty"))}</span>
                  <span className="cue-diff-arrow" aria-hidden="true">→</span>
                  <span>{padSummary(diff.after, t("markers.cueEmpty"))}</span>
                </p>
              ))}
              <div className="cue-editor-actions">
                <button
                  type="button"
                  className="text-button"
                  ref={tooltipRef(cueEditApplyTip)}
                  disabled={!canEdit}
                  onClick={() => {
                    void onApply();
                  }}
                >
                  {t("markers.cueEdit.apply")}
                </button>
                <button
                  type="button"
                  className="text-button"
                  ref={tooltipRef(cueEditDiscardTip)}
                  disabled={busy}
                  onClick={onDiscard}
                >
                  {t("markers.cueEdit.discard")}
                </button>
              </div>
            </div>
          ) : null}
          {undoId ? (
            <div className="cue-editor-actions">
              <button
                type="button"
                className="text-button"
                ref={tooltipRef(tips.cueEditUndo)}
                disabled={busy}
                onClick={() => {
                  void onUndoLast();
                }}
              >
                {t("markers.cueEdit.undo")}
              </button>
            </div>
          ) : null}
          <p id={liveRegionId} className="visually-hidden" role="status" aria-live="polite">
            {status}
          </p>
        </div>
      ) : null}
    </>
  );
}

type CueEditRowProps = {
  slot: number;
  pad: CuePad | null;
  palette: string[];
  beatMs: number | null;
  disabled: boolean;
  swapArmed: boolean;
  playheadSeconds: number;
  onChange: (pad: CuePad | null) => void;
  onSwap: () => void;
  onJump: () => void;
};

function CueEditRow({
  slot,
  pad,
  palette,
  beatMs,
  disabled,
  swapArmed,
  playheadSeconds,
  onChange,
  onSwap,
  onJump,
}: CueEditRowProps) {
  const color = slotColor(slot, pad?.color);
  const swatchStyle = color ? ({ background: color } satisfies CSSProperties) : undefined;
  const number = slot + 1;
  const locked = tips.cueEditDisabled;

  function onKeyDown(event: ReactKeyboardEvent<HTMLSpanElement>): void {
    if (!pad) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onJump();
  }

  return (
    <div
      className={pad ? "marker cue-edit-row" : "marker marker-empty cue-edit-row"}
      data-slot={String(number)}
      data-swap={swapArmed ? "true" : undefined}
    >
      <span
        className="marker-slot"
        role={pad ? "button" : undefined}
        tabIndex={pad ? 0 : undefined}
        onClick={pad ? onJump : undefined}
        onKeyDown={pad ? onKeyDown : undefined}
      >
        {number}
      </span>
      <span className="swatch" style={swatchStyle} />
      {pad ? (
        <>
          <label className="cue-edit-time">
            <span className="visually-hidden">{t("markers.cueEdit.time")}</span>
            <input
              ref={tooltipRef(disabled ? locked : cueEditTimeTip)}
              type="text"
              inputMode="decimal"
              defaultValue={formatCueTime(pad.start_ms)}
              key={`time-${slot}-${pad.start_ms}`}
              disabled={disabled}
              onBlur={(event) => {
                const ms = parseCueTime(event.currentTarget.value);
                if (ms === null) {
                  event.currentTarget.value = formatCueTime(pad.start_ms);
                  return;
                }
                onChange({ ...pad, start_ms: ms });
              }}
            />
          </label>
          <label className="cue-edit-name">
            <span className="visually-hidden">{t("markers.cueEdit.name")}</span>
            <input
              ref={tooltipRef(disabled ? locked : cueEditNameTip)}
              type="text"
              value={pad.name}
              disabled={disabled}
              onChange={(event) => onChange({ ...pad, name: event.currentTarget.value })}
            />
          </label>
          <label className="cue-edit-color">
            <span className="visually-hidden">{t("markers.cueEdit.color")}</span>
            <select
              ref={tooltipRef(disabled ? locked : cueEditColorTip)}
              value={pad.color || palette[slot] || DEFAULT_PALETTE[slot]}
              disabled={disabled}
              onChange={(event) => onChange({ ...pad, color: event.currentTarget.value })}
            >
              {palette.map((hex) => (
                <option key={hex} value={hex}>{hex}</option>
              ))}
            </select>
          </label>
          <div className="cue-edit-nudge">
            {([-1, -10, 1, 10] as const).map((delta) => (
              <button
                key={delta}
                type="button"
                className="text-button"
                ref={tooltipRef(disabled ? locked : cueEditNudgeTip(delta))}
                disabled={disabled}
                onClick={() => onChange(nudgePad(pad, delta))}
              >
                {delta > 0 ? `+${delta}ms` : `${delta}ms`}
              </button>
            ))}
            {beatMs ? (
              <>
                <button
                  type="button"
                  className="text-button"
                  ref={tooltipRef(disabled ? locked : cueEditNudgeTip(-beatMs, true))}
                  disabled={disabled}
                  onClick={() => onChange(nudgePad(pad, -beatMs))}
                >
                  {t("markers.cueEdit.beatBack")}
                </button>
                <button
                  type="button"
                  className="text-button"
                  ref={tooltipRef(disabled ? locked : cueEditNudgeTip(beatMs, true))}
                  disabled={disabled}
                  onClick={() => onChange(nudgePad(pad, beatMs))}
                >
                  {t("markers.cueEdit.beatForward")}
                </button>
              </>
            ) : null}
          </div>
          <button
            type="button"
            className="text-button"
            ref={tooltipRef(disabled ? locked : cueEditDeleteTip)}
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            {t("markers.cueEdit.delete")}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="text-button"
          ref={tooltipRef(disabled ? locked : cueEditSetTip)}
          disabled={disabled}
          onClick={() =>
            onChange(padAtPlayhead(slot, playheadSeconds, palette[slot] || DEFAULT_PALETTE[slot] || null))
          }
        >
          {t("markers.cueEdit.setAtPlayhead")}
        </button>
      )}
      <button
        type="button"
        className="text-button"
        ref={tooltipRef(disabled ? locked : cueEditSwapTip)}
        disabled={disabled}
        aria-pressed={swapArmed}
        onClick={onSwap}
      >
        {t("markers.cueEdit.swap")}
      </button>
    </div>
  );
}

/**
 * Parse `m:ss.sss` or a millisecond number into ms.
 *
 * @param value Typed time text.
 * @returns Milliseconds, or null when invalid.
 */
export function parseCueTime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Math.max(0, Number(trimmed));
  const match = /^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(trimmed);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const frac = match[3] ? Number(match[3].padEnd(3, "0")) : 0;
  if (seconds >= 60) return null;
  return minutes * 60_000 + seconds * 1000 + frac;
}

/** Clear the last undo snapshot. Tests call this between cases. */
export function resetCueEditUndo(): void {
  lastUndoSnapshot = null;
}
