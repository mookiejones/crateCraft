/**
 * Play stats report painted from StatsContext.
 *
 * Accordion groups list top tracks, top artists, and idle tracks.
 * Not a Data Grid. Period, CSV, and idle days stay in the HTML bar.
 */

import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { HistoryStatsArtist, HistoryStatsTrack } from "../lib/api-types";
import { useStats } from "../containers/StatsContext";
import { clockLabel } from "../lib/format";
import { t, type MessageKey } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const LIST_CAP = 100;
const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

const ACCORDION_SX = {
  disableGutters: true,
  square: true,
  elevation: 0,
  slotProps: { transition: { timeout: 0 } },
} as const;

function useSectionOpen(start: boolean) {
  const [open, setOpen] = useState(start);
  return {
    expanded: open,
    onChange: (_event: unknown, next: boolean) => {
      setOpen(next);
    },
  };
}

function noteLine(text: string) {
  return <p className="gig-note">{text}</p>;
}

function StatsTable({
  headers,
  rows,
}: {
  headers: MessageKey[];
  rows: string[][];
}) {
  return (
    <table className="stats-table">
      <thead>
        <tr>
          {headers.map((key) => (
            <th key={key} scope="col">{t(key)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, index) => (
          <tr key={cells.join("\0") + String(index)}>
            {cells.map((cell, cellIndex) => (
              <td key={`${index}:${cellIndex}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TrackGroup({ rows }: { rows: HistoryStatsTrack[] }) {
  const accordion = useSectionOpen(rows.length > 0);
  const shown = rows.slice(0, LIST_CAP);
  return (
    <Accordion
      className="gig-group"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.gigGroup)}>
        {t("gig.groupCount", { label: t("stats.tracks"), count: rows.length })}
      </AccordionSummary>
      <AccordionDetails>
        {rows.length
          ? (
            <>
              <StatsTable
                headers={["column.title", "column.artist", "column.plays", "column.lastPlayed"]}
                rows={shown.map((row) => [
                  row.name || "—",
                  row.artist || "—",
                  String(row.plays ?? 0),
                  clockLabel(row.last_played) || "—",
                ])}
              />
              {rows.length > LIST_CAP ? noteLine(t("stats.more", { count: rows.length - LIST_CAP })) : null}
            </>
          )
          : noteLine(t("stats.emptyTracks"))}
      </AccordionDetails>
    </Accordion>
  );
}

function ArtistGroup({ rows }: { rows: HistoryStatsArtist[] }) {
  const accordion = useSectionOpen(rows.length > 0);
  const shown = rows.slice(0, LIST_CAP);
  return (
    <Accordion
      className="gig-group"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.gigGroup)}>
        {t("gig.groupCount", { label: t("stats.artists"), count: rows.length })}
      </AccordionSummary>
      <AccordionDetails>
        {rows.length
          ? (
            <>
              <StatsTable
                headers={["column.artist", "column.plays", "stats.artistTracks", "column.lastPlayed"]}
                rows={shown.map((row) => [
                  row.artist || "—",
                  String(row.plays ?? 0),
                  String(row.tracks ?? 0),
                  clockLabel(row.last_played) || "—",
                ])}
              />
              {rows.length > LIST_CAP ? noteLine(t("stats.more", { count: rows.length - LIST_CAP })) : null}
            </>
          )
          : noteLine(t("stats.emptyArtists"))}
      </AccordionDetails>
    </Accordion>
  );
}

function IdleGroup({
  rows,
  count,
  idleDays,
}: {
  rows: HistoryStatsTrack[];
  count: number;
  idleDays: number;
}) {
  const stats = useStats();
  const accordion = useSectionOpen(count > 0);
  const shown = rows.slice(0, LIST_CAP);
  const extra = count > rows.length ? count - rows.length : rows.length > LIST_CAP ? rows.length - LIST_CAP : 0;
  return (
    <Accordion
      className="gig-group"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.gigGroup)}>
        {t("gig.groupCount", { label: t("stats.idle"), count })}
      </AccordionSummary>
      <AccordionDetails>
        {noteLine(t("stats.idleHint", { days: idleDays }))}
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.statsIdleCrate)}
          data-stats-action="crate"
          disabled={stats.crateBusy || !stats.writable || count === 0}
          onClick={() => {
            void stats.makeIdleCrate();
          }}
        >
          {t("stats.idleCrate")}
        </Button>
        {count
          ? (
            <>
              <ul>
                {shown.map((row, index) => {
                  const last = row.last_played == null ? t("stats.never") : clockLabel(row.last_played) || "—";
                  return (
                    <li key={`${row.id ?? row.asset_id ?? index}:${row.name ?? ""}`}>
                      {t("stats.idleRow", {
                        title: [row.artist, row.name].filter(Boolean).join(" — ") || row.name || "—",
                        last,
                      })}
                    </li>
                  );
                })}
              </ul>
              {extra ? noteLine(t("stats.more", { count: extra })) : null}
            </>
          )
          : noteLine(t("stats.emptyIdle"))}
      </AccordionDetails>
    </Accordion>
  );
}

/**
 * Top lists and idle tracks for `#stats-report`.
 *
 * Renders nothing until a report has loaded.
 */
export function StatsPanel() {
  const { report } = useStats();
  if (!report) return null;
  const plays = report.plays ?? 0;
  const sessions = report.sessions ?? 0;
  const idleDays = report.idle_days ?? 365;
  const idleCount = report.not_played_count ?? 0;
  return (
    <>
      {noteLine(plays ? t("stats.summary", { plays, sessions }) : t("stats.empty"))}
      <TrackGroup rows={report.top_tracks ?? []} />
      <ArtistGroup rows={report.top_artists ?? []} />
      <IdleGroup rows={report.not_played ?? []} count={idleCount} idleDays={idleDays} />
    </>
  );
}
