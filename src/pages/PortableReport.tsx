/**
 * Gig Check-drive findings painted as a Data Grid.
 *
 * The drive picker stays in the page chrome. Problem names the fault.
 * GET /api/drive-check stays read-only. The Files dialog is a
 * different surface.
 */

import type { GridColDef } from "@mui/x-data-grid";
import { useGig } from "../containers/GigContext";
import { ReportGrid } from "../components/ReportGrid";
import { t } from "../lib/i18n";
import { portableViewRows, type PortableViewRow } from "../lib/gig/portable-view";

function portableColumns(): GridColDef<PortableViewRow>[] {
  return [
    {
      field: "problem",
      headerName: t("portable.column.problem"),
      flex: 1,
      minWidth: 140,
      renderCell: (params) => <span className="portable-kind">{params.value}</span>,
    },
    {
      field: "crate",
      headerName: t("portable.column.crate"),
      flex: 0.7,
      minWidth: 100,
    },
    {
      field: "track",
      headerName: t("portable.column.track"),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "fix",
      headerName: t("portable.column.fix"),
      flex: 1.4,
      minWidth: 160,
      renderCell: (params) => (
        params.value ? <span className="portable-fix">{String(params.value)}</span> : null
      ),
    },
  ];
}

/**
 * Drive-problem table for the Gig Check drive screen.
 */
export function PortableReport() {
  const { portable } = useGig();
  const report = portable.report;
  const rows = report ? portableViewRows(report) : [];
  const columns = portableColumns();
  if (!rows.length) return null;
  return <ReportGrid rows={rows} columns={columns} getRowId={(row) => row.id} />;
}
