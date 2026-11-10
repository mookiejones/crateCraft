/**
 * Cue pads 1–8 in Serato colours, plus extra cues.
 *
 * Helpers stay in `cue-view.ts`. Restore diffs still paint there.
 */

import type { CSSProperties } from "react";
import type { Marker } from "../api-types";
import { cueSlots, extraCues, formatCueTime, slotColor } from "../cue-view";
import { t } from "../i18n";

export type CueSlotProps = {
  slot: number;
  cue: Marker | null;
};

/**
 * One pad row: number, swatch, time, name or Empty.
 *
 * @param props Zero-based pad index and the cue, or null for empty.
 */
export function CueSlot({ slot, cue }: CueSlotProps) {
  const color = slotColor(slot, cue?.color);
  const named = cue && typeof cue.name === "string" ? cue.name.trim() : "";
  const swatchStyle = color ? { background: color } satisfies CSSProperties : undefined;
  return (
    <div className={cue ? "marker" : "marker marker-empty"}>
      <span className="marker-slot">{slot >= 0 ? String(slot + 1) : ""}</span>
      <span className="swatch" style={swatchStyle} />
      <span>{cue ? formatCueTime(cue.start_ms) : "—"}</span>
      <span>
        {cue
          ? named || t("markers.cue", { number: slot >= 0 ? slot + 1 : 0 })
          : t("markers.cueEmpty")}
      </span>
    </div>
  );
}

/**
 * Pads 1–8, then any extra cues.
 *
 * @param props Cue rows from the track.
 */
export function CuePads({ cues }: { cues: readonly Marker[] | undefined }) {
  const slots = cueSlots(cues);
  const extra = extraCues(cues);
  return (
    <>
      {slots.map((cue, slot) => (
        <CueSlot key={slot} slot={slot} cue={cue} />
      ))}
      {extra.map((cue, index) => {
        const cueIndex = Number(cue.index);
        const slot = Number.isInteger(cueIndex) ? cueIndex : -1;
        return <CueSlot key={`extra-${index}`} slot={slot} cue={cue} />;
      })}
    </>
  );
}
