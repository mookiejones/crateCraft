/**
 * Tempo-drift report painted by React.
 *
 * Counts stay a report. Flagged tracks are a Data Grid. The Reason
 * column names drift or live in words. Color is not the only signal.
 */

import type { GridColDef } from "@mui/x-data-grid";
import { t } from "../lib/i18n";
import { useGig } from "../containers/GigContext";
import { ReportGrid } from "../components/ReportGrid";
import { driftViewRows, type DriftViewRow } from "../lib/gig/drift-view";

function driftColumns(): GridColDef<DriftViewRow>[] {
  return [
    {
      field: "title",
      headerName: t("drift.column.track"),
      flex: 1.2,
      minWidth: 160,
    },
    {
      field: "file",
      headerName: t("drift.column.file"),
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: "reason",
      headerName: t("drift.column.reason"),
      flex: 1.2,
      minWidth: 160,
    },
    {
      field: "bpm",
      headerName: t("drift.column.bpm"),
      flex: 0.6,
      minWidth: 100,
    },
  ];
}

/**
 * Counts and the flagged-track table.
 */
export function DriftReport() {
  const { drift } = useGig();
  const payload = drift.report;
  const rows = payload ? driftViewRows(payload.flags || []) : [];
  const columns = driftColumns();
  if (!payload) return null;
  const flags = payload.flags || [];
  return (
    <>
      <p className="gig-note">
        {flags.length
          ? t("drift.summary", { checked: payload.checked, count: flags.length })
          : t("drift.summaryClear", { checked: payload.checked })}
      </p>
      {payload.not_found
        ? <p className="gig-note">{t("drift.notFound", { count: payload.not_found })}</p>
        : null}
      {payload.unreadable
        ? <p className="gig-note">{t("drift.unreadableFiles", { count: payload.unreadable })}</p>
        : null}
      {payload.unchecked
        ? <p className="gig-note">{t("drift.unchecked", { count: payload.unchecked })}</p>
        : null}
      {payload.too_quiet
        ? <p className="gig-note">{t("drift.tooQuiet", { count: payload.too_quiet })}</p>
        : null}
      {payload.mapped
        ? <p className="gig-note">{t("drift.mapped", { count: payload.mapped })}</p>
        : null}
      {flags.length
        ? <ReportGrid rows={rows} columns={columns} getRowId={(row) => row.id} />
        : <p className="gig-note">{t("drift.empty")}</p>}
    </>
  );
}
