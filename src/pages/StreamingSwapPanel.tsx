/**
 * Streaming repair: greyed-out Beatport and Beatsource tracks.
 *
 * Check again and Repair stay in the HTML bar. Confirm sits above the
 * grid. The engine is streaming-swap.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { StreamingSwapPlan, StreamingTrack } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { tooltipRef } from "../components/tooltip-ref";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

type StreamRow = HealthGridRow & StreamingTrack;

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

export function highSwaps(payload: StreamingSwapPlan): Array<{ asset_id: number; path: string }> {
  const swaps: Array<{ asset_id: number; path: string }> = [];
  for (const track of payload.tracks || []) {
    const match = track.match;
    if (match && match.usable && match.confidence === "high") {
      swaps.push({ asset_id: track.asset_id, path: match.path });
    }
  }
  return swaps;
}

function trackLabel(row: StreamingTrack): string {
  const title = row.title.trim();
  const who = row.artist.trim();
  if (title && who) return `${who} — ${title}`;
  return title || who || row.stored || "—";
}

function crateLabel(row: StreamingTrack): string {
  const crates = row.crates || [];
  if (!crates.length) return "—";
  return crates
    .map((crate) => (crate.list_order === null ? crate.name : `${crate.name} #${crate.list_order}`))
    .join(", ");
}

function matchLabel(row: StreamingTrack): string {
  return row.match?.path || t("streams.noMatch");
}

function confidenceLabel(row: StreamingTrack): string {
  const confidence = row.match?.confidence;
  if (confidence === "high") return t("streams.confidence.high");
  if (confidence === "medium") return t("streams.confidence.medium");
  if (confidence === "low") return t("streams.confidence.low");
  return t("streams.noMatch");
}

/**
 * Counts, the cue note, confirm, and the grid.
 */
export function StreamingSwapPanel({
  payload,
  confirmRepair,
  writable,
}: {
  payload: StreamingSwapPlan;
  confirmRepair: boolean;
  writable: boolean;
}) {
  const tracks = payload.tracks || [];
  const repairs = highSwaps(payload).length;
  const rows = useMemo<StreamRow[]>(
    () => tracks.map((item) => ({ ...item, id: item.asset_id })),
    [tracks],
  );
  const columns = useMemo<GridColDef<StreamRow>[]>(() => [
    {
      field: "track",
      headerName: t("streams.column.track"),
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => trackLabel(row),
    },
    {
      field: "service",
      headerName: t("streams.column.service"),
      flex: 0.6,
      minWidth: 110,
    },
    {
      field: "crates",
      headerName: t("streams.column.crates"),
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => crateLabel(row),
    },
    {
      field: "match",
      headerName: t("streams.column.match"),
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => matchLabel(row),
    },
    {
      field: "confidence",
      headerName: t("streams.column.confidence"),
      flex: 0.7,
      minWidth: 120,
      valueGetter: (_value, row) => confidenceLabel(row),
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {tracks.length
          ? t("streams.summary", { checked: tracks.length, count: repairs })
          : t("streams.summaryClear", { checked: tracks.length })}
      </p>
      {payload.truncated ? <p className="gig-note">{t("streams.truncated")}</p> : null}
      {tracks.length ? <p className="gig-note">{t("streams.cuesKept")}</p> : null}
      {confirmRepair
        ? (
          <>
            <p className="gig-note">{t("streams.preview", { count: repairs })}</p>
            <Button
              type="button"
              size="small"
              variant="outlined"
              sx={BUTTON_SX}
              data-streams-action="confirm-repair"
              disabled={!writable || repairs === 0}
              ref={tooltipRef(tips.streamsConfirm)}
            >
              {t("streams.confirm")}
            </Button>
          </>
        )
        : null}
      {tracks.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("streams.empty")}</p>}
    </>
  );
}
