/**
 * Energy report: Data Grid of blank Grouping fields that can take Energy N.
 *
 * Check again and Apply stay in the HTML bar. Engine stays in energy.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import type { EnergyFix, EnergyPlan } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { t } from "../lib/i18n";

type FixRow = HealthGridRow & EnergyFix;

function sourceLabel(source: EnergyFix["source"]): string {
  return source === "tag" ? t("energy.source.tag") : t("energy.source.audio");
}

/**
 * Counts and the blank-Grouping Data Grid.
 */
export function EnergyPanel({ payload }: { payload: EnergyPlan }) {
  const fixes = payload.fixes || [];
  const rows = useMemo<FixRow[]>(
    () => fixes.map((item) => ({ ...item, id: item.asset_id })),
    [fixes],
  );
  const columns = useMemo<GridColDef<FixRow>[]>(() => [
    {
      field: "path",
      headerName: t("energy.column.path"),
      flex: 1.4,
      minWidth: 160,
    },
    {
      field: "energy",
      headerName: t("energy.column.energy"),
      width: 110,
      valueGetter: (_value, row) => row.energy,
    },
    {
      field: "source",
      headerName: t("energy.column.source"),
      flex: 0.8,
      minWidth: 120,
      valueGetter: (_value, row) => sourceLabel(row.source),
    },
    {
      field: "proposed",
      headerName: t("energy.column.grouping"),
      flex: 0.8,
      minWidth: 120,
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {fixes.length
          ? t("energy.summary", { checked: payload.checked, count: fixes.length })
          : t("energy.summaryClear", { checked: payload.checked })}
      </p>
      {payload.unreadable
        ? <p className="gig-note">{t("energy.unreadableFiles", { count: payload.unreadable })}</p>
        : null}
      {fixes.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("energy.empty")}</p>}
    </>
  );
}
