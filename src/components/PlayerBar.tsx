/**
 * Compact AppBar player: Play, title, waveform slot, and time.
 *
 * Previous, next, volume, and the seek slider are not in this row.
 * Space and the seek keys stay on the shortcut table. Cue times stay
 * on `getPlayerCues`. Decode errors still use `.player-status`.
 */

import Typography from "@mui/material/Typography";
import { usePlayer } from "../containers/PlayerContext";
import { formatPlayerTime } from "../lib/player/player";
import { playerStrings } from "../lib/player/player-strings";
import { PlayButton } from "./PlayButton";

/**
 * Play, title, a host for the SWF1 canvas, and elapsed time.
 */
export function PlayerBar() {
  const player = usePlayer();
  const loaded = player.trackId !== null;
  const shownTitle = loaded ? (player.title || playerStrings.untitled) : playerStrings.nothingPlaying;
  const named = loaded ? (player.title || playerStrings.untitled) : "";

  return (
    <div className="player-controls">
      <PlayButton variant="bar" name={named} />
      <Typography className="player-title" component="p" noWrap title={shownTitle}>{shownTitle}</Typography>
      <div className="player-wave-slot" />
      <span className="player-time">
        <span className="visually-hidden">{playerStrings.elapsed}</span>
        <span>{formatPlayerTime(player.currentTime)}</span>
      </span>
      <Typography className="player-status" component="p" role="status" hidden={player.error === ""} title={player.error}>{player.error}</Typography>
    </div>
  );
}
