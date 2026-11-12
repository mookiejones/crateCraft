/**
 * Track list pane: one MUI X Data Grid Community.
 *
 * The grid owns headers, rows, horizontal scroll, and virtualization.
 * Play is the first column and reads PlayerContext. Selection and sort
 * stay on TrackListContext / `state`. History uses the same grid with
 * different columns.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DataGrid,
  type GridPaginationModel,
  type GridRowParams,
  type GridRowSelectionModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { enUS, esES } from "@mui/x-data-grid/locales";
import type { Track } from "../lib/api-types";
import { t } from "../lib/i18n";
import { ROW } from "../lib/state";
import { ensureGridDom } from "../lib/ui/grid-dom-stubs";
import { trackListColumns } from "../lib/ui/track-list-columns";
import { INTERACTIVE_SELECTOR, setTooltip } from "../lib/ui/tooltip";
import { sortTip, tips } from "../lib/ui/tooltip-strings";
import { useTrackList } from "../containers/TrackListContext";

/** Community Data Grid throws when pageSize is above this. */
export const GRID_PAGE_SIZE = 100;

export type TrackListWindowProps = {
  pane: "a" | "b";
  onFocusList: () => void;
};

function EmptyList() {
  const list = useTrackList();
  const empty = list.duplicatesPending ? t("list.readingDuplicates") : t("list.noMatches");
  return <p className="empty-list">{empty}</p>;
}

function gridLocaleText(locale: string) {
  const pack = locale.startsWith("es") ? esES : enUS;
  return pack.components.MuiDataGrid.defaultProps.localeText;
}

function paneHeight(host: HTMLElement | null): number {
  const height = host?.clientHeight ?? 0;
  return height > 0 ? height : 600;
}

/**
 * Stamp data-tooltip on Data Grid chrome the audit would otherwise miss.
 *
 * Called from the island after each paint so jsdom tests see the labels
 * in the same turn as `paintRows`.
 *
 * @param root Grid host or `#list`.
 * @returns {void}
 */
export function attachGridTooltips(root: HTMLElement): void {
  for (const element of root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)) {
    if (element.getAttribute("data-tooltip")?.trim()) continue;
    if (element.classList.contains("row-play") || element.closest(".row-play")) continue;
    if (element.closest(".MuiDataGrid-footerContainer")) {
      setTooltip(element, tips.gridPagination);
      continue;
    }
    const header = element.closest(".MuiDataGrid-columnHeader");
    if (header instanceof HTMLElement) {
      const field = header.getAttribute("data-field") ?? "";
      if (field === "play") {
        setTooltip(element, tips.playColumn);
        continue;
      }
      if (element.closest(".MuiDataGrid-menuIcon") || element.classList.contains("MuiDataGrid-menuIconButton")) {
        setTooltip(element, tips.columnMenu);
        continue;
      }
      if (element.closest(".MuiDataGrid-columnSeparator")) {
        setTooltip(element, tips.columnResize);
        continue;
      }
      const label = header.querySelector(".MuiDataGrid-columnHeaderTitle")?.textContent?.trim()
        || header.textContent?.trim()
        || field;
      setTooltip(element, sortTip(field, label));
      continue;
    }
    if (element.closest(".MuiDataGrid-columnSeparator")) {
      setTooltip(element, tips.columnResize);
      continue;
    }
    if (element.closest(".MuiDataGrid-cell")) {
      setTooltip(element, tips.gridCell);
      continue;
    }
    setTooltip(element, tips.columnMenu);
  }
}

/**
 * One crate or history list pane.
 *
 * @param props Pane id and a focus callback for the host `#list`.
 */
export function TrackListWindow({ pane, onFocusList }: TrackListWindowProps) {
  ensureGridDom();
  const list = useTrackList();
  const hostRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(() => 600);
  const view = pane === "b" ? list.viewB : list.view;
  const history = list.mode === "history";
  const columns = useMemo(
    () => trackListColumns(history, {
      selectTrack: list.selectTrack,
      onFocusList,
    }),
    [history, list.selectTrack, list.locale, onFocusList],
  );
  const sortModel = useMemo<GridSortModel>(() => {
    if (!list.sort) return [];
    return [{ field: list.sort, sort: list.sortDir < 0 ? "desc" : "asc" }];
  }, [list.sort, list.sortDir]);
  const rowSelectionModel = useMemo<GridRowSelectionModel>(() => ({
    type: "include",
    ids: list.selectedId == null ? new Set() : new Set([list.selectedId]),
  }), [list.selectedId]);
  const localeText = useMemo(() => gridLocaleText(list.locale), [list.locale]);
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.ceil(view.length / GRID_PAGE_SIZE) - 1);
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page: Math.min(page, maxPage), pageSize: GRID_PAGE_SIZE }),
    [page, maxPage],
  );
  const hideFooter = view.length <= GRID_PAGE_SIZE;

  useLayoutEffect(() => {
    setPage(0);
  }, [history, list.mode, list.sort, list.sortDir, view.length]);

  useLayoutEffect(() => {
    const node = hostRef.current;
    const parent = node?.parentElement ?? null;
    const measure = (): void => {
      setHeight(paneHeight(parent));
    };
    measure();
    if (typeof ResizeObserver !== "function" || !parent) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    attachGridTooltips(node);
    const observer = new MutationObserver(() => attachGridTooltips(node));
    observer.observe(node, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [columns, view, list.locale, height]);

  useEffect(() => {
    const node = hostRef.current;
    if (node) attachGridTooltips(node);
  }, [columns, view, list.locale, height]);

  function onSortModelChange(model: GridSortModel): void {
    const next = model[0]?.field;
    if (!next || next === "play") return;
    list.setSort(next);
  }

  function onRowSelectionModelChange(next: GridRowSelectionModel): void {
    const id = [...next.ids][0];
    if (typeof id !== "number" || id === list.selectedId) return;
    const track = view.find((row) => row.id === id);
    if (!track) return;
    if (track.entry) list.selectEntry(track.id);
    else void list.selectTrack(track.id);
    onFocusList();
  }

  function onRowDoubleClick(params: GridRowParams<Track>): void {
    if (!params.row.entry) list.play(params.row.id);
  }

  function onPaginationModelChange(model: GridPaginationModel): void {
    setPage(model.page);
  }

  return (
    <div ref={hostRef} className="track-grid" style={{ height, width: "100%" }}>
      <DataGrid
        key={`${history ? "history" : "tracks"}-${view.length === 0 ? "empty" : "data"}`}
        rows={[...view]}
        columns={columns}
        getRowId={(row) => row.id}
        rowHeight={ROW}
        columnHeaderHeight={ROW}
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
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={onRowSelectionModelChange}
        onRowDoubleClick={onRowDoubleClick}
        getRowClassName={() => "row"}
        localeText={localeText}
        slots={{ noRowsOverlay: EmptyList }}
        sx={{
          height: "100%",
          border: 0,
          bgcolor: "transparent",
          color: "inherit",
          font: "inherit",
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
            outline: "2px solid var(--cadmium)",
            outlineOffset: "-2px",
          },
        }}
      />
    </div>
  );
}
