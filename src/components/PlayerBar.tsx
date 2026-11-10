/**
 * Player transport painted by React.
 *
 * The waveform island sits beside this bar. Cue marks, Play, Previous,
 * Next, seek, and volume read `usePlayer`.
 */

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { usePlayer } from "../context/PlayerContext";
import {
  SEEK_STEP_LARGE_SECONDS,
  SEEK_STEP_SECONDS,
  formatPlayerTime,
  type CueMarker,
} from "../player";
import { playerStrings } from "../player-strings";
import { setTooltip } from "../tooltip";
import { cueTip, tips, type TipSpec } from "../tooltip-strings";
import { PlayButton } from "./PlayButton";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

/**
 * Cue marks on the seek bar.
 *
 * @param cues Markers for the loaded track.
 * @param limit Duration used to place them. Zero hides them.
 * @param seek Move the playhead.
 */
function CueMarks({
  cues,
  limit,
  seek,
}: {
  cues: readonly CueMarker[];
  limit: number;
  seek: (seconds: number) => void;
}) {
  if (!(limit > 0) || cues.length === 0) return null;
  return (
    <>
      {cues.map((cue) => {
        const label = `${cue.label}, ${formatPlayerTime(cue.seconds)}`;
        const ratio = Math.min(1, Math.max(0, cue.seconds / limit));
        const percent = Math.round(ratio * 1000) / 10;
        return (
          <button
            key={`${cue.seconds}:${cue.label}:${cue.color}`}
            type="button"
            ref={(element) => {
              if (!element) return;
              setTooltip(element, cueTip(label));
              if (cue.color) element.style.setProperty("--cue", cue.color);
            }}
            className="player-cue"
            style={{ left: `${percent}%` }}
            aria-label={label}
            onClick={() => seek(cue.seconds)}
          />
        );
      })}
    </>
  );
}

/**
 * Previous, Play, Next, seek, times, and volume.
 */
export function PlayerBar() {
  const player = usePlayer();
  const [hold, setHold] = useState<number | null>(null);
  const loaded = player.trackId !== null;
  const shownTitle = loaded ? (player.title || playerStrings.untitled) : playerStrings.nothingPlaying;
  const named = loaded ? (player.title || playerStrings.untitled) : "";
  const limit = Number.isFinite(player.duration) && player.duration > 0 ? player.duration : 0;
  const shownTime = hold ?? Math.min(player.currentTime, limit || player.currentTime);

  function onSeekKey(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const forward = event.key === "ArrowRight" || event.key === "ArrowUp";
    const back = event.key === "ArrowLeft" || event.key === "ArrowDown";
    if (!forward && !back) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? SEEK_STEP_LARGE_SECONDS : SEEK_STEP_SECONDS;
    player.seekBy((forward ? 1 : -1) * step);
  }

  function onSeekInput(event: { currentTarget: HTMLInputElement }): void {
    const next = Number(event.currentTarget.value);
    setHold(next);
    player.seek(next);
  }

  function onSeekPointerDown(): void {
    setHold(player.currentTime);
  }

  function onSeekPointerUp(_event: PointerEvent<HTMLInputElement>): void {
    setHold(null);
  }

  return (
    <div className="player-controls">
      <div className="player-meta">
        <p className="player-title" title={shownTitle}>{shownTitle}</p>
        <p className="player-artist" hidden={player.artist === ""} title={player.artist}>{player.artist}</p>
        <p className="player-status" role="status" hidden={player.error === ""} title={player.error}>{player.error}</p>
      </div>
      <div className="player-transport">
        <button
          type="button"
          ref={tooltipRef(tips.previous)}
          className="player-toggle"
          disabled={!player.canSkipPrevious}
          aria-label={playerStrings.previous}
          onClick={() => player.previous()}
        >
          {playerStrings.previous}
        </button>
        <PlayButton variant="bar" name={named} />
        <button
          type="button"
          ref={tooltipRef(tips.next)}
          className="player-toggle"
          disabled={!player.canSkipNext}
          aria-label={playerStrings.next}
          onClick={() => player.next()}
        >
          {playerStrings.next}
        </button>
      </div>
      <div className="player-seek">
        <span className="player-time">
          <span className="visually-hidden">{playerStrings.elapsed}</span>
          <span>{formatPlayerTime(player.currentTime)}</span>
        </span>
        <div className="player-seek-track">
          <input
            ref={tooltipRef(tips.seek)}
            type="range"
            className="player-range"
            min={0}
            max={limit}
            step={0.1}
            value={shownTime}
            disabled={!loaded || limit === 0}
            aria-label={playerStrings.seek}
            onPointerDown={onSeekPointerDown}
            onPointerUp={onSeekPointerUp}
            onPointerCancel={onSeekPointerUp}
            onInput={onSeekInput}
            onKeyDown={onSeekKey}
          />
          <div className="player-cues">
            <CueMarks cues={player.cues} limit={limit} seek={player.seek} />
          </div>
        </div>
        <span className="player-time">
          <span className="visually-hidden">{playerStrings.duration}</span>
          <span>{formatPlayerTime(player.duration)}</span>
        </span>
      </div>
      <label className="player-volume">
        <span>{playerStrings.volume}</span>
        <input
          ref={tooltipRef(tips.volume)}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          onInput={(event) => player.setVolume(Number(event.currentTarget.value))}
        />
      </label>
    </div>
  );
}
