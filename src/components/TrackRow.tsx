/**
 * One virtualized track row, except Play which reads PlayerContext.
 */

import type { MouseEvent } from "react";
import type { Track } from "../lib/api-types";
import { useTrackList } from "../containers/TrackListContext";
import { clockLabel, colorHex, dateLabel, energyLabel, lengthLabel } from "../lib/format";
import { formatNumber, t } from "../lib/i18n";
import { playerStrings } from "../lib/player/player-strings";
import { tooltipRef } from "../lib/ui/tooltip";
import { selectRow } from "../lib/ui/tooltip-strings";
import { PlayButton } from "./PlayButton";

export type TrackRowProps = {
  track: Track;
  selected: boolean;
  onFocusList: () => void;
};

function Cell({ text, numeric = false }: { text: string; numeric?: boolean }) {
  return <span className={numeric ? "cell num" : "cell"}>{text}</span>;
}

/**
 * One list row: title line, artist, and the mode's columns.
 *
 * Play is `PlayButton`. A history row has no Play. Click selects. Double
 * click plays a library track.
 *
 * @param props Track, selection, and a focus callback for the list pane.
 */
export function TrackRow({ track, selected, onFocusList }: TrackRowProps) {
  const list = useTrackList();
  const labelName = track.name || playerStrings.untitled;

  function select(): void {
    if (track.entry) list.selectEntry(track.id);
    else void list.selectTrack(track.id);
    onFocusList();
  }

  function onClick(): void {
    select();
  }

  function onDoubleClick(): void {
    if (!track.entry) list.play(track.id);
  }

  function onPlayClick(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    void list.selectTrack(track.id);
    onFocusList();
  }

  const history = Boolean(track.entry);
  const bpmText = track.bpm == null
    ? ""
    : formatNumber(Math.round(Number(track.bpm) * 100) / 100, { maximumFractionDigits: 2 });
  const hex = colorHex(track.color);

  return (
    <div
      className="row"
      role="option"
      aria-selected={selected}
      data-id={String(track.id)}
      ref={tooltipRef(selectRow(track.name || "Untitled"))}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span className="cell">
        <span className="title-line">
          {!history && (
            <span>
              <PlayButton
                variant="row"
                trackId={track.id}
                name={labelName}
                onClickExtra={onPlayClick}
              />
            </span>
          )}
          {hex ? <span className="swatch" style={{ background: hex }} /> : null}
          {track.emoji ? <span>{track.emoji}</span> : null}
          <span className="title">{track.name || t("track.untitled")}</span>
          {track.offline ? (
            <span className="offline-word">{t("track.offlineBadge")}</span>
          ) : track.missing ? (
            <span className="missing-word">{t("track.missingBadge")}</span>
          ) : null}
          {track.stems ? <span className="missing-word">{t("track.stemsBadge")}</span> : null}
        </span>
      </span>
      <span className="cell">{track.artist ?? ""}</span>
      {history ? (
        <>
          <Cell text={track.deck || ""} />
          <Cell text={track.played || ""} />
          <Cell text={clockLabel(track.start)} numeric />
        </>
      ) : (
        <>
          <Cell text={bpmText} numeric />
          <Cell text={track.key ?? ""} />
          <Cell text={energyLabel(track.rating)} numeric />
          <Cell text={track.genre ?? ""} />
          <Cell text={dateLabel(track.time_added)} numeric />
          <Cell text={dateLabel(track.last_played)} numeric />
          <Cell text={track.play_count == null ? "" : formatNumber(Number(track.play_count))} numeric />
          <Cell text={lengthLabel(track.length_ms)} numeric />
        </>
      )}
    </div>
  );
}
