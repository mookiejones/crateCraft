/**
 * MUI X Data Grid column defs for crate and history lists.
 *
 * Play is its own first column. Title is the name plus swatch, emoji,
 * and missing/offline/stems badges. Cells are read-only. Sort keys match
 * the keys `buildView` already uses.
 */

import type { MouseEvent } from "react";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import type { Track } from "../api-types";
import { clockLabel, colorHex, dateLabel, energyLabel, lengthLabel } from "../format";
import { formatNumber, t, type MessageKey } from "../i18n";
import { playerStrings } from "../player/player-strings";
import { PlayButton } from "../../components/PlayButton";
import { sortTip, tips, type TipSpec } from "./tooltip-strings";

export type TrackColumnField =
  | "play"
  | "name"
  | "artist"
  | "bpm"
  | "key"
  | "energy"
  | "genre"
  | "time_added"
  | "last_played"
  | "play_count"
  | "length_ms"
  | "deck"
  | "played"
  | "start";

export type DataColumnField = Exclude<TrackColumnField, "play">;

/** 8.5rem at 16px. Spanish “Reproducida” fits without clipping. */
export const HISTORY_PLAYED_WIDTH = 136;

export const TRACK_COLUMN_FIELDS: DataColumnField[] = [
  "name",
  "artist",
  "bpm",
  "key",
  "energy",
  "genre",
  "time_added",
  "last_played",
  "play_count",
  "length_ms",
];

export const HISTORY_COLUMN_FIELDS: DataColumnField[] = [
  "name",
  "artist",
  "deck",
  "played",
  "start",
];

const COLUMN_LABEL: Record<DataColumnField, MessageKey> = {
  name: "column.title",
  artist: "column.artist",
  bpm: "column.bpm",
  key: "column.key",
  energy: "column.energy",
  genre: "column.genre",
  time_added: "column.added",
  last_played: "column.lastPlayed",
  play_count: "column.plays",
  length_ms: "column.time",
  deck: "column.deck",
  played: "column.played",
  start: "column.time",
};

const NUMERIC = new Set<TrackColumnField>([
  "bpm",
  "energy",
  "time_added",
  "last_played",
  "play_count",
  "length_ms",
  "start",
]);

export type TrackListColumnHandlers = {
  selectTrack: (id: number) => void;
  onFocusList: () => void;
};

function Cell({ text, numeric = false }: { text: string; numeric?: boolean }) {
  return <span className={numeric ? "cell num" : "cell"}>{text}</span>;
}

/**
 * Title cell: name, color swatch, emoji, and status badges.
 *
 * Play lives in its own column. This cell is the name only plus the
 * badges that sit beside it.
 *
 * @param track Row.
 * @returns Title contents.
 */
export function TrackTitleCell({ track }: { track: Track }) {
  const hex = colorHex(track.color);
  return (
    <span className="cell">
      <span className="title-line">
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
  );
}

function playCell(params: GridRenderCellParams<Track>, handlers: TrackListColumnHandlers) {
  if (params.row.entry) return null;
  const name = params.row.name || playerStrings.untitled;
  function onPlayClick(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    void handlers.selectTrack(params.row.id);
    handlers.onFocusList();
  }
  return (
    <PlayButton
      variant="row"
      trackId={params.row.id}
      name={name}
      onClickExtra={onPlayClick}
    />
  );
}

function textOf(track: Track, field: TrackColumnField): string {
  switch (field) {
    case "artist":
      return track.artist ?? "";
    case "bpm":
      return track.bpm == null
        ? ""
        : formatNumber(Math.round(Number(track.bpm) * 100) / 100, { maximumFractionDigits: 2 });
    case "key":
      return track.key ?? "";
    case "energy":
      return energyLabel(track.rating);
    case "genre":
      return track.genre ?? "";
    case "time_added":
      return dateLabel(track.time_added);
    case "last_played":
      return dateLabel(track.last_played);
    case "play_count":
      return track.play_count == null ? "" : formatNumber(Number(track.play_count));
    case "length_ms":
      return lengthLabel(track.length_ms);
    case "deck":
      return track.deck || "";
    case "played":
      return track.played || "";
    case "start":
      return clockLabel(track.start);
    default:
      return "";
  }
}

function headerTip(field: TrackColumnField, label: string): TipSpec {
  if (field === "play") return tips.playColumn;
  return sortTip(field, label);
}

function dataColumn(field: DataColumnField): GridColDef<Track> {
  const label = t(COLUMN_LABEL[field]);
  const numeric = NUMERIC.has(field);
  const grow = field === "name" || field === "artist" || field === "genre";
  const minWidth =
    field === "name" ? 140 : field === "artist" ? 100 : field === "played" ? HISTORY_PLAYED_WIDTH : 56;
  const column: GridColDef<Track> = {
    field,
    headerName: label,
    description: t(headerTip(field, label).key, headerTip(field, label).params),
    minWidth,
    align: numeric ? "right" : "left",
    headerAlign: "left",
    sortable: true,
    filterable: false,
    renderCell: (params) =>
      field === "name" ? (
        <TrackTitleCell track={params.row} />
      ) : (
        <Cell text={textOf(params.row, field)} numeric={numeric} />
      ),
  };
  if (grow) {
    column.flex = 1;
    return column;
  }
  column.width = field === "played" ? HISTORY_PLAYED_WIDTH : 88;
  return column;
}

/**
 * Column set for one list pane.
 *
 * History hides Play and swaps the crate fields for deck, played, and
 * start. Callers pass the current locale through `t()` by calling this
 * on each render.
 *
 * @param history True when the History view is open.
 * @param handlers Play click and list focus.
 * @returns Community Data Grid column defs.
 */
export function trackListColumns(
  history: boolean,
  handlers: TrackListColumnHandlers,
): GridColDef<Track>[] {
  const playLabel = t("column.play");
  const play: GridColDef<Track> = {
    field: "play",
    headerName: "",
    description: t("tooltip.playColumn"),
    width: 44,
    minWidth: 44,
    maxWidth: 44,
    sortable: false,
    filterable: false,
    hideable: false,
    resizable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderHeader: () => <span className="visually-hidden">{playLabel}</span>,
    renderCell: (params) => playCell(params, handlers),
  };
  const fields = history ? HISTORY_COLUMN_FIELDS : TRACK_COLUMN_FIELDS;
  return [play, ...fields.map(dataColumn)];
}

/**
 * Visible header labels, Play omitted, for tests and locale checks.
 *
 * @param history True when the History view is open.
 * @returns Translated header names in paint order.
 */
export function trackListHeaderLabels(history: boolean): string[] {
  const fields = history ? HISTORY_COLUMN_FIELDS : TRACK_COLUMN_FIELDS;
  return fields.map((field) => t(COLUMN_LABEL[field]));
}
