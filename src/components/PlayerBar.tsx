/**
 * AppBar player: compact strip or full deck from window width.
 *
 * Compact (≤980): Play, title, waveform slot, and time. Full deck:
 * wave then pads beside Play, title, and time. One Play. No skip.
 * Decode errors still use `.player-status`. The wave slot keeps a
 * stable key so the SWF1 host and one `<audio>` survive a 1200↔980
 * resize.
 */

import { useEffect, useLayoutEffect, useState, type JSX } from "react";
import Typography from "@mui/material/Typography";
import { usePlayer } from "../containers/PlayerContext";
import { formatPlayerTime, setPlayerWaveformCompact } from "../lib/player/player";
import { playerStrings } from "../lib/player/player-strings";
import { PlayButton } from "./PlayButton";
import { PlayerCuePads } from "./PlayerCuePads";

/** Same cut as `playerDeckIsCompact` / `DRAWER_MINI_CUTOFF`. */
const PLAYER_DECK_COMPACT_MAX = 980;

const WAVE_SLOT_KEY = "player-wave-slot";

/**
 * Keep the SWF1 host inside `.player-wave-slot` when the keyed slot moves.
 *
 * The wave node is not a React child. Park it on `#player-bar` while
 * the old slot unmounts.
 */
function attachWaveSlot(slot: HTMLDivElement | null): void {
  const bar = document.getElementById("player-bar");
  if (!slot) {
    if (!bar) return;
    const parked = bar.querySelector(".player-wave");
    if (parked instanceof HTMLElement) bar.append(parked);
    return;
  }
  const wave = slot.querySelector(".player-wave") ?? bar?.querySelector(".player-wave");
  if (wave instanceof HTMLElement && wave.parentElement !== slot) slot.append(wave);
}

/**
 * Play, title, a host for the SWF1 canvas, elapsed time, and pads on the
 * wide deck.
 */
export function PlayerBar(): JSX.Element {
  const player = usePlayer();
  const [innerWidth, setInnerWidth] = useState(() => window.innerWidth);
  const compact = innerWidth <= PLAYER_DECK_COMPACT_MAX;
  const loaded = player.trackId !== null;
  const shownTitle = loaded ? (player.title || playerStrings.untitled) : playerStrings.nothingPlaying;
  const named = loaded ? (player.title || playerStrings.untitled) : "";

  useEffect(() => {
    const onResize = (): void => {
      setInnerWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    setPlayerWaveformCompact(compact);
  }, [compact]);

  const playControl = <PlayButton variant="bar" name={named} />;
  const title = (
    <Typography className="player-title" component="p" noWrap title={shownTitle}>{shownTitle}</Typography>
  );
  const time = (
    <span className="player-time">
      <span className="visually-hidden">{playerStrings.elapsed}</span>
      <span>{formatPlayerTime(player.currentTime)}</span>
    </span>
  );
  const status = (
    <Typography className="player-status" component="p" role="status" hidden={player.error === ""} title={player.error}>{player.error}</Typography>
  );
  const waveSlot = (
    <div key={WAVE_SLOT_KEY} ref={attachWaveSlot} className="player-wave-slot" />
  );

  if (compact) {
    return (
      <div className="player-controls player-deck-compact">
        {playControl}
        {title}
        {waveSlot}
        {time}
        {status}
      </div>
    );
  }

  return (
    <div className="player-controls player-deck">
      {waveSlot}
      <div className="player-deck-row">
        <PlayerCuePads key={player.trackId ?? "none"} />
        {playControl}
        {title}
        {time}
      </div>
      {status}
    </div>
  );
}
