/**
 * Gain-changed report: tracks whose stored manual gain is not 0 dB.
 *
 * Check again, Save crate, Reset to 0 dB, and Undo stay in the HTML bar.
 * Confirm sits above the grid after a preview. The engine is gain-changed.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { GainChangedReport, GainChangedTrack } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { tooltipRef } from "../components/tooltip-ref";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

type GainRow = HealthGridRow & GainChangedTrack;

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

function trackLabel(row: GainChangedTrack): string {
  const title = row.name.trim();
  const who = row.artist.trim();
  if (title && who) return `${who} — ${title}`;
  return title || who || row.file;
}

/**
 * Counts, the leave-the-other-tags note, confirm buttons, and the grid.
 */
export function GainChangedPanel({
  payload,
  confirmCrate,
  confirmReset,
  writable,
}: {
  payload: GainChangedReport;
  confirmCrate: boolean;
  confirmReset: boolean;
  writable: boolean;
}) {
  const tracks = payload.tracks || [];
  const rows = useMemo<GainRow[]>(
    () => tracks.map((item) => ({ ...item, id: item.id })),
    [tracks],
  );
  const columns = useMemo<GridColDef<GainRow>[]>(() => [
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
      field: "gain_text",
      headerName: t("gain.column.gain"),
      flex: 0.6,
      minWidth: 120,
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {tracks.length
          ? t("gain.summary", { checked: payload.checked, count: tracks.length })
          : t("gain.summaryClear", { checked: payload.checked })}
      </p>
      {payload.offline
        ? <p className="gig-note">{t("gain.offline", { count: payload.offline })}</p>
        : null}
      {payload.unreadable
        ? <p className="gig-note">{t("gain.unreadable", { count: payload.unreadable })}</p>
        : null}
      {tracks.length ? <p className="gig-note">{t("gain.note")}</p> : null}
      {confirmCrate
        ? (
          <>
            <p className="gig-note">
              {t("gain.previewCrate", {
                count: tracks.length,
                folder: payload.folder,
                name: payload.name,
              })}
            </p>
            <Button
              type="button"
              size="small"
              variant="outlined"
              sx={BUTTON_SX}
              data-gain-action="confirm-crate"
              disabled={!writable || tracks.length === 0}
              ref={tooltipRef(tips.gainConfirmCrate)}
            >
              {t("gain.confirmCrate")}
            </Button>
          </>
        )
        : null}
      {confirmReset
        ? (
          <>
            <p className="gig-note">{t("gain.previewReset", { count: tracks.length })}</p>
            <Button
              type="button"
              size="small"
              variant="outlined"
              sx={BUTTON_SX}
              data-gain-action="confirm-reset"
              disabled={!writable || tracks.length === 0}
              ref={tooltipRef(tips.gainConfirmReset)}
            >
              {t("gain.confirmReset")}
            </Button>
          </>
        )
        : null}
      {tracks.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("gain.empty")}</p>}
    </>
  );
}
