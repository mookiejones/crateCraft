/**
 * Lost-tags report: Data Grid of blank title or artist the file can fill.
 *
 * Check again and Apply stay in the HTML bar. Engine stays in lost-tags.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import type { LostTagFix, LostTagsPlan } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { t } from "../lib/i18n";

type FixRow = HealthGridRow & LostTagFix;

function pairLabel(name: string, artist: string): string {
  const title = name.trim();
  const who = artist.trim();
  if (title && who) return `${who} — ${title}`;
  return title || who || "—";
}

function proposedLabel(proposed: LostTagFix["proposed"]): string {
  return pairLabel(proposed.name ?? "", proposed.artist ?? "");
}

/**
 * Counts and the blank-field Data Grid.
 */
export function LostTagsPanel({ payload }: { payload: LostTagsPlan }) {
  const fixes = payload.fixes || [];
  const rows = useMemo<FixRow[]>(
    () => fixes.map((item) => ({ ...item, id: item.asset_id })),
    [fixes],
  );
  const columns = useMemo<GridColDef<FixRow>[]>(() => [
    {
      field: "path",
      headerName: t("lost.column.path"),
      flex: 1.4,
      minWidth: 160,
    },
    {
      field: "current",
      headerName: t("lost.column.current"),
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => pairLabel(row.current.name, row.current.artist),
    },
    {
      field: "proposed",
      headerName: t("lost.column.proposed"),
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => proposedLabel(row.proposed),
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {fixes.length
          ? t("lost.summary", { checked: payload.checked, count: fixes.length })
          : t("lost.summaryClear", { checked: payload.checked })}
      </p>
      {payload.unreadable
        ? <p className="gig-note">{t("lost.unreadableFiles", { count: payload.unreadable })}</p>
        : null}
      {fixes.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("lost.empty")}</p>}
    </>
  );
}
