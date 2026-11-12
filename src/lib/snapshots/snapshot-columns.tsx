/**
 * Data Grid columns for the Backups snapshot list.
 *
 * When, size, and status are the visible fields. Restore is a row action.
 * Size is unknown until the API sends a byte count.
 */

import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { SnapshotInfo } from "../api-types";
import { t } from "../i18n";
import { tooltipRef } from "../../components/tooltip-ref";
import { tips } from "../ui/tooltip-strings";
import { snapshotSizeText, snapshotStatusText, snapshotWhenText } from "./restore-view";

export type SnapshotColumnHandlers = {
  onRestore: (snapshotId: string) => void;
};

function restoreCell(
  params: GridRenderCellParams<SnapshotInfo>,
  handlers: SnapshotColumnHandlers,
) {
  return (
    <Button
      type="button"
      size="small"
      ref={tooltipRef(tips.reviewRestore)}
      onClick={(event) => {
        event.stopPropagation();
        handlers.onRestore(params.row.id);
      }}
    >
      {t("snapshots.reviewRestore")}
    </Button>
  );
}

/**
 * Column defs for the snapshot Data Grid.
 *
 * @param handlers Restore click. The engine still dry-runs before confirm.
 * @returns Community Data Grid columns.
 */
export function snapshotColumns(handlers: SnapshotColumnHandlers): GridColDef<SnapshotInfo>[] {
  return [
    {
      field: "created",
      headerName: t("snapshots.columnWhen"),
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => snapshotWhenText(row),
    },
    {
      field: "size",
      headerName: t("snapshots.columnSize"),
      width: 120,
      sortable: false,
      valueGetter: (_value, row) => snapshotSizeText(row),
    },
    {
      field: "status",
      headerName: t("snapshots.columnStatus"),
      flex: 2,
      minWidth: 180,
      sortable: false,
      valueGetter: (_value, row) => snapshotStatusText(row),
    },
    {
      field: "restore",
      headerName: t("snapshots.columnRestore"),
      width: 168,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => restoreCell(params, handlers),
    },
  ];
}
