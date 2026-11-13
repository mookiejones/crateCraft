/**
 * Community Data Grid for Health reports that are not the Crates list.
 *
 * Row height matches Crates. Locale packs follow the page language.
 * Tooltips stamp the same grid chrome as TrackListWindow.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowId,
  type GridRowSelectionModel,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import { enUS, esES } from "@mui/x-data-grid/locales";
import { getLocale } from "../lib/i18n";
import { ROW } from "../lib/state";
import { ensureGridDom } from "../lib/ui/grid-dom-stubs";
import { attachGridTooltips, GRID_PAGE_SIZE } from "./TrackListWindow";

export type HealthGridRow = GridValidRowModel & { id: GridRowId };

function gridLocaleText(locale: string) {
  const pack = locale.startsWith("es") ? esES : enUS;
  return pack.components.MuiDataGrid.defaultProps.localeText;
}

/**
 * One Health report grid: damaged files, suspect quality, or tag clusters.
 */
export function HealthDataGrid<T extends HealthGridRow>({
  rows,
  columns,
  selectedId,
  onSelectId,
}: {
  rows: T[];
  columns: GridColDef<T>[];
  selectedId?: GridRowId;
  onSelectId?: (id: GridRowId) => void;
}) {
  ensureGridDom();
  const hostRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  const localeText = useMemo(() => gridLocaleText(locale), [locale]);
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(rows.length / GRID_PAGE_SIZE) - 1);
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page: Math.min(page, maxPage), pageSize: GRID_PAGE_SIZE }),
    [page, maxPage],
  );
  const hideFooter = rows.length <= GRID_PAGE_SIZE;
  const rowSelectionModel = useMemo<GridRowSelectionModel>(() => ({
    type: "include",
    ids: selectedId == null ? new Set() : new Set([selectedId]),
  }), [selectedId]);

  useLayoutEffect(() => {
    setPage(0);
  }, [rows.length]);

  useLayoutEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    attachGridTooltips(node);
    const observer = new MutationObserver(() => attachGridTooltips(node));
    observer.observe(node, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [columns, rows, locale, paginationModel]);

  useEffect(() => {
    const node = hostRef.current;
    if (node) attachGridTooltips(node);
  }, [columns, rows, locale, paginationModel]);

  function onPaginationModelChange(model: GridPaginationModel): void {
    setPage(model.page);
  }

  function onRowSelectionModelChange(next: GridRowSelectionModel): void {
    if (!onSelectId) return;
    const id = [...next.ids][0];
    if (id == null || id === selectedId) return;
    onSelectId(id);
  }

  return (
    <div ref={hostRef} className="health-grid" style={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        rowHeight={ROW}
        columnHeaderHeight={ROW}
        autoHeight
        hideFooter={hideFooter}
        hideFooterSelectedRowCount
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={[GRID_PAGE_SIZE]}
        rowBufferPx={ROW * 4}
        disableColumnFilter
        disableDensitySelector
        disableEval
        disableMultipleRowSelection
        disableRowSelectionOnClick={!onSelectId}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={onRowSelectionModelChange}
        getRowClassName={() => "row"}
        localeText={localeText}
        sx={{
          border: 0,
          bgcolor: "transparent",
          color: "inherit",
          font: "inherit",
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
            outline: "none",
          },
        }}
      />
    </div>
  );
}
