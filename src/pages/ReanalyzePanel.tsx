/**
 * Re-analyze report: Data Grid of tracks Serato should rebuild.
 *
 * Check again and Preview stay in the HTML bar. Confirm sits above the
 * grid after a preview. Engine stays in reanalyze.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { ReanalyzePlan, ReanalyzeTrack } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { tooltipRef } from "../components/tooltip-ref";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

type Row = HealthGridRow & ReanalyzeTrack;

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

function trackLabel(row: ReanalyzeTrack): string {
  const title = row.name.trim();
  const who = row.artist.trim();
  if (title && who) return `${who} — ${title}`;
  return title || who || row.file;
}

/**
 * Counts, Confirm, locked note, and the track grid.
 */
export function ReanalyzePanel({
  payload,
  writable,
  confirmReady,
}: {
  payload: ReanalyzePlan;
  writable: boolean;
  confirmReady: boolean;
}) {
  const tracks = payload.tracks || [];
  const rows = useMemo<Row[]>(
    () => tracks.map((item) => ({ ...item, id: item.id })),
    [tracks],
  );
  const columns = useMemo<GridColDef<Row>[]>(() => [
    {
      field: "track",
      headerName: t("health.column.track"),
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => trackLabel(row),
    },
    {
      field: "file",
      headerName: t("health.column.file"),
      flex: 1,
      minWidth: 140,
    },
    {
      field: "cleared",
      headerName: t("reanalyze.column.cleared"),
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => (row.cleared.length ? row.cleared.join(", ") : "—"),
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {tracks.length
          ? t("reanalyze.summary", { count: tracks.length })
          : t("reanalyze.summaryClear")}
      </p>
      <p className="gig-note">{t("reanalyze.markersNote")}</p>
      {payload.locked?.length
        ? <p className="gig-note">{t("reanalyze.lockedNote", { count: payload.locked.length })}</p>
        : null}
      {confirmReady
        ? (
          <p className="gig-note">
            <Button
              type="button"
              variant="contained"
              size="small"
              sx={BUTTON_SX}
              data-reanalyze-action="confirm"
              disabled={!writable}
              ref={tooltipRef(tips.reanalyzeConfirm)}
            >
              {t("reanalyze.confirm")}
            </Button>
            {" "}
            {t("reanalyze.confirmHint")}
          </p>
        )
        : null}
      {tracks.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("reanalyze.empty")}</p>}
    </>
  );
}
