/**
 * BPM-check report painted by React.
 *
 * Counts stay a report. Flagged tracks are a Data Grid with one ×2 or ÷2
 * button per row. The beatgrid sentence shows whenever a report is loaded.
 */

import Button from "@mui/material/Button";
import type { GridColDef } from "@mui/x-data-grid";
import { useGig } from "../containers/GigContext";
import { ReportGrid } from "../components/ReportGrid";
import { applyOctaveFix } from "../lib/gig/octave-apply";
import {
  formatStoredBpm,
  octaveViewRows,
  type OctaveViewRow,
} from "../lib/gig/octave-view";
import { t } from "../lib/i18n";
import { tooltipRef } from "../components/tooltip-ref";
import { tips } from "../lib/ui/tooltip-strings";

function OctaveFixButton({ row }: { row: OctaveViewRow }) {
  const { octave } = useGig();
  const label = row.fix === "x2" ? t("octave.fix.x2") : t("octave.fix.div2");
  const aria = row.fix === "x2"
    ? t("octave.fixLabel.x2", { name: row.name })
    : t("octave.fixLabel.div2", { name: row.name });
  return (
    <Button
      size="small"
      type="button"
      disabled={octave.busy}
      data-octave-fix={row.fix}
      data-octave-id={String(row.id)}
      aria-label={aria}
      ref={tooltipRef(tips.octaveFix)}
      onClick={(event) => {
        event.stopPropagation();
        void applyOctaveFix(row);
      }}
    >
      {label}
    </Button>
  );
}

function octaveColumns(): GridColDef<OctaveViewRow>[] {
  return [
    {
      field: "title",
      headerName: t("octave.column.track"),
      flex: 1.2,
      minWidth: 160,
    },
    {
      field: "file",
      headerName: t("octave.column.file"),
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: "bpm",
      headerName: t("octave.column.stored"),
      flex: 0.5,
      minWidth: 90,
    },
    {
      field: "suggested",
      headerName: t("octave.column.suggested"),
      flex: 0.5,
      minWidth: 100,
    },
    {
      field: "fix",
      headerName: t("octave.column.fix"),
      width: 96,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => <OctaveFixButton row={params.row} />,
    },
  ];
}

/**
 * Counts, the beatgrid note, and the flagged-track table.
 */
export function OctaveReport() {
  const { octave } = useGig();
  const payload = octave.report;
  if (!payload) return null;
  const flags = payload.flags || [];
  const rows = octaveViewRows(flags);
  return (
    <>
      <p className="gig-note">{t("octave.beatgrid")}</p>
      {typeof payload.anchor === "number" ? (
        <p className="gig-note">{t("octave.anchor", { bpm: formatStoredBpm(payload.anchor) })}</p>
      ) : null}
      {payload.skipped > 0 ? (
        <p className="gig-note">{t("octave.skipped", { count: payload.skipped })}</p>
      ) : null}
      {!payload.ready ? (
        <p className="gig-note">{t("octave.notReady")}</p>
      ) : flags.length ? (
        <>
          <p className="gig-note">{t("octave.summary", { count: flags.length })}</p>
          <ReportGrid rows={rows} columns={octaveColumns()} getRowId={(row) => row.id} />
        </>
      ) : (
        <>
          <p className="gig-note">{t("octave.summaryClear")}</p>
          <p className="gig-note">{t("octave.empty")}</p>
        </>
      )}
    </>
  );
}
