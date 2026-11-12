/**
 * Dense read-only Data Grid for Gig Check drive and Tempo drift.
 *
 * Row height matches Crates (`ROW` / 36px). Community pagination caps
 * at 100. Headers and cells share one horizontal scroll.
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import { enUS, esES } from "@mui/x-data-grid/locales";
import { getLocale } from "../lib/i18n";
import { ROW } from "../lib/state";
import { ensureGridDom } from "../lib/ui/grid-dom-stubs";
import { GRID_PAGE_SIZE, attachGridTooltips } from "./TrackListWindow";

function gridLocaleText(locale: string) {
  const pack = locale.startsWith("es") ? esES : enUS;
  return pack.components.MuiDataGrid.defaultProps.localeText;
}

/**
 * One read-only report table.
 *
 * @param props Rows, column defs, and a row id getter.
 */
export function ReportGrid<T extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
}: {
  rows: readonly T[];
  columns: GridColDef<T>[];
  getRowId: (row: T) => string | number;
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
  const height = Math.max(ROW * 5, Math.min(ROW * (rows.length + 2) + (hideFooter ? 0 : 52), 400));

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
  }, [columns, rows, locale, height]);

  return (
    <div ref={hostRef} className="report-grid" style={{ height, width: "100%" }}>
      <DataGrid
        key={locale}
        rows={[...rows]}
        columns={columns}
        getRowId={getRowId}
        rowHeight={ROW}
        columnHeaderHeight={ROW}
        hideFooter={hideFooter}
        hideFooterSelectedRowCount
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => setPage(model.page)}
        pageSizeOptions={[GRID_PAGE_SIZE]}
        rowBufferPx={ROW * 4}
        disableColumnFilter
        disableDensitySelector
        disableEval
        disableRowSelectionOnClick
        getRowClassName={() => "row"}
        localeText={localeText}
        sx={{
          height: "100%",
          border: 0,
          bgcolor: "transparent",
          color: "inherit",
          font: "inherit",
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
            outline: "2px solid currentColor",
            outlineOffset: "-2px",
          },
        }}
      />
    </div>
  );
}
