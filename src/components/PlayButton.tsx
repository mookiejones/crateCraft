/**
 * Play or Pause for one track, or for the loaded player.
 *
 * List rows, the detail pane, and the player bar all use this control
 * and the same `usePlayer` snapshot, so the labels stay in step.
 */

import { type MouseEvent } from "react";
import { usePlayer } from "../containers/PlayerContext";
import { playerStrings } from "../lib/player/player-strings";
import { setTooltip } from "../lib/ui/tooltip";
import { playRow, playTip, type TipSpec } from "../lib/ui/tooltip-strings";

export type PlayButtonVariant = "bar" | "row" | "detail";

export type PlayButtonProps = {
  variant: PlayButtonVariant;
  trackId?: number;
  name: string;
  onClickExtra?: (event: MouseEvent<HTMLButtonElement>) => void;
};

function tooltipRef(spec: TipSpec) {
  return (element: HTMLButtonElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

/**
 * One Play/Pause control bound to the player context.
 *
 * `bar` toggles the loaded track. `row` and `detail` call `playOrToggle`
 * for `trackId`. A row click does not select the row; the caller does that.
 *
 * @param props Variant, track, and an optional extra click handler.
 */
export function PlayButton({ variant, trackId, name, onClickExtra }: PlayButtonProps) {
  const player = usePlayer();
  const playingThis = variant === "bar"
    ? player.playing
    : player.trackId === trackId && player.playing;
  const action = playingThis ? playerStrings.pause : playerStrings.play;
  const labelled = name ? `${action} ${name}` : action;
  const spec = variant === "bar" ? playTip(action, name) : playRow(name);
  const className = variant === "row"
    ? "row-play"
    : variant === "detail"
      ? "detail-play"
      : "player-toggle player-play";
  const disabled = variant === "bar" && !player.canTogglePlay;

  function onClick(event: MouseEvent<HTMLButtonElement>): void {
    if (variant === "row") {
      event.stopPropagation();
    }
    onClickExtra?.(event);
    if (variant === "bar") {
      player.togglePlayPause();
      return;
    }
    if (trackId !== undefined) player.playOrToggle(trackId);
  }

  function onDoubleClick(event: MouseEvent<HTMLButtonElement>): void {
    if (variant === "row") event.stopPropagation();
  }

  return (
    <button
      type="button"
      ref={tooltipRef(spec)}
      className={className}
      disabled={disabled}
      aria-label={labelled}
      aria-pressed={playingThis}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {variant === "row"
        ? <span className="row-play-icon" aria-hidden="true" />
        : action}
    </button>
  );
}
