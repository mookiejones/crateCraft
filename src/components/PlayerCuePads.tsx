/**
 * AppBar cue pads 1–8. A filled pad seeks; an empty pad does not.
 *
 * Track-detail CuePads stay marker rows. Helpers stay in cue-view.ts.
 */

import { useState, type CSSProperties, type JSX } from "react";
import { usePlayer } from "../containers/PlayerContext";
import { t } from "../lib/i18n";
import type { CueMarker } from "../lib/player/player";
import { CUE_SLOT_COUNT, activePadIndex, slotColor } from "../lib/ui/cue-view";
import { cueTip } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

/**
 * Map player cues onto pads 1–8.
 *
 * The first cue with each index 0–7 fills that pad. Index -1 and later
 * duplicates do not occupy a slot.
 *
 * @param cues Markers from `usePlayer().cues`.
 * @returns Always eight entries. Missing pads are `null`.
 */
function slotsFromPlayerCues(cues: readonly CueMarker[]): Array<CueMarker | null> {
  const slots: Array<CueMarker | null> = Array.from({ length: CUE_SLOT_COUNT }, () => null);
  for (const cue of cues) {
    const index = cue.index;
    if (!Number.isInteger(index) || index < 0 || index >= CUE_SLOT_COUNT) continue;
    if (slots[index] == null) slots[index] = cue;
  }
  return slots;
}

/**
 * Name used in the jump tooltip.
 *
 * A stored cue name wins. A blank name uses the pad's screen-reader
 * label so the sentence still names a place.
 *
 * @param cue Filled pad marker.
 * @param number Pad number, 1–8.
 * @returns The cue label, or `Cue point N` when the name is blank.
 */
function cueJumpName(cue: CueMarker, number: number): string {
  const named = cue.label.trim();
  return named || t("markers.cue", { number });
}

/**
 * Eight jump pads bound to the shared player.
 *
 * Filled pads are buttons. Empty pads are spans. Clicking a filled pad
 * seeks to that cue. A filled pad's tooltip is `tooltip.cue`: hover and
 * keyboard focus name the jump and the cue label. Nothing is written.
 */
export function PlayerCuePads(): JSX.Element {
  const { cues, currentTime, seek } = usePlayer();
  const [lastClicked, setLastClicked] = useState<number | null>(null);
  const slots = slotsFromPlayerCues(cues);
  const lit = activePadIndex(currentTime, slots, lastClicked);

  return (
    <div className="player-cue-pads">
      {slots.map((cue, slot) => {
        const number = slot + 1;
        const color = slotColor(slot, cue?.color);
        const style = color ? ({ background: color } satisfies CSSProperties) : undefined;
        const className = [
          "player-cue-pad",
          cue ? null : "player-cue-pad-empty",
          lit === slot ? "player-cue-pad-lit" : null,
        ]
          .filter(Boolean)
          .join(" ");
        if (!cue) {
          return (
            <span
              key={slot}
              className={className}
              data-slot={String(number)}
              aria-label={t("markers.cueEmpty")}
              style={style}
            >
              {number}
            </span>
          );
        }
        return (
          <button
            key={slot}
            type="button"
            className={className}
            data-slot={String(number)}
            aria-label={t("markers.cue", { number })}
            ref={tooltipRef(cueTip(cueJumpName(cue, number)))}
            style={style}
            onClick={() => {
              setLastClicked(slot);
              seek(cue.seconds);
            }}
          >
            {number}
          </button>
        );
      })}
    </div>
  );
}
