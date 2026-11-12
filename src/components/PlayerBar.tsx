/**
 * Player transport painted by React.
 *
 * The waveform island sits beside this bar. Cue marks, Play, Previous,
 * Next, seek, and volume read `usePlayer`.
 */

import { useState, type KeyboardEvent, type SyntheticEvent } from "react";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { usePlayer } from "../containers/PlayerContext";
import {
  SEEK_STEP_LARGE_SECONDS,
  SEEK_STEP_SECONDS,
  formatPlayerTime,
  type CueMarker,
} from "../lib/player/player";
import { playerStrings } from "../lib/player/player-strings";
import { setTooltip } from "../lib/ui/tooltip";
import { cueTip, tips, type TipSpec } from "../lib/ui/tooltip-strings";
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

  function onSeekChange(event: Event | SyntheticEvent, value: number | number[]): void {
    if ("key" in event) {
      const key = String(event.key);
      if (key === "ArrowRight" || key === "ArrowLeft" || key === "ArrowUp" || key === "ArrowDown") {
        return;
      }
    }
    const next = typeof value === "number" ? value : value[0];
    if (next === undefined) return;
    setHold(next);
    player.seek(next);
  }

  return (
    <div className="player-controls">
      <div className="player-meta">
        <Typography className="player-title" component="p" noWrap title={shownTitle}>{shownTitle}</Typography>
        <Typography className="player-artist" component="p" noWrap hidden={player.artist === ""} title={player.artist}>{player.artist}</Typography>
        <Typography className="player-status" component="p" role="status" hidden={player.error === ""} title={player.error}>{player.error}</Typography>
      </div>
      <div className="player-transport">
        <IconButton
          type="button"
          ref={tooltipRef(tips.previous)}
          className="player-toggle"
          size="large"
          color="inherit"
          disabled={!player.canSkipPrevious}
          aria-label={playerStrings.previous}
          onClick={() => player.previous()}
        >
          <SkipPreviousIcon />
        </IconButton>
        <PlayButton variant="bar" name={named} />
        <IconButton
          type="button"
          ref={tooltipRef(tips.next)}
          className="player-toggle"
          size="large"
          color="inherit"
          disabled={!player.canSkipNext}
          aria-label={playerStrings.next}
          onClick={() => player.next()}
        >
          <SkipNextIcon />
        </IconButton>
      </div>
      <div className="player-seek">
        <span className="player-time">
          <span className="visually-hidden">{playerStrings.elapsed}</span>
          <span>{formatPlayerTime(player.currentTime)}</span>
        </span>
        <div className="player-seek-track">
          <Slider
            min={0}
            max={limit}
            step={0.1}
            value={shownTime}
            disabled={!loaded || limit === 0}
            aria-label={playerStrings.seek}
            onChange={onSeekChange}
            onChangeCommitted={() => setHold(null)}
            slotProps={{
              input: {
                className: "player-range",
                ref: tooltipRef(tips.seek),
                onKeyDown: onSeekKey,
              },
            }}
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
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          aria-label={playerStrings.volume}
          onChange={(_event, value) => {
            const next = typeof value === "number" ? value : value[0];
            if (next === undefined) return;
            player.setVolume(next);
          }}
          slotProps={{
            input: {
              ref: tooltipRef(tips.volume),
              onInput: (event) => {
                const next = Number(event.currentTarget.value);
                if (!Number.isFinite(next)) return;
                player.setVolume(next);
              },
            },
          }}
        />
      </label>
    </div>
  );
}
