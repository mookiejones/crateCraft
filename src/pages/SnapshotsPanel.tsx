/**
 * Snapshot Data Grid, drive-backup note, undo, and the operation log.
 *
 * Buttons keep the ids desktop actions and shortcuts already use.
 * Restore is a row action. Take stays above. The log stays below.
 */

import { useLayoutEffect, useMemo, useRef } from "react";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { DataGrid } from "@mui/x-data-grid";
import { enUS, esES } from "@mui/x-data-grid/locales";
import { failureOf } from "../lib/api";
import { codedText, getLocale, t } from "../lib/i18n";
import { ROW } from "../lib/state";
import { useSnapshots } from "../containers/SnapshotsContext";
import { GRID_PAGE_SIZE, attachGridTooltips } from "../components/TrackListWindow";
import { tooltipRef } from "../components/tooltip-ref";
import { driveCopyText, operationCardText } from "../lib/snapshots/restore-view";
import { snapshotColumns } from "../lib/snapshots/snapshot-columns";
import { ensureGridDom } from "../lib/ui/grid-dom-stubs";
import { tips } from "../lib/ui/tooltip-strings";

function gridLocaleText(locale: string) {
  const pack = locale.startsWith("es") ? esES : enUS;
  return pack.components.MuiDataGrid.defaultProps.localeText;
}

function driveNote(backing: boolean, error: string, report: ReturnType<typeof useSnapshots>["driveBackup"]): string {
  if (backing) return t("snapshots.backupDrivesBusy");
  if (error) return error;
  return driveCopyText(report);
}

function listStatus(snapshots: ReturnType<typeof useSnapshots>): string {
  if (snapshots.snapshotLoading) return t("snapshots.reading");
  if (snapshots.snapshotError) return snapshots.snapshotError;
  if (snapshots.statusOverride) return snapshots.statusOverride;
  return snapshots.snapshotMessage ? t(snapshots.snapshotMessage) : "";
}

function EmptySnapshots() {
  return <p className="empty-list">{t("snapshots.empty")}</p>;
}

/**
 * Backups panel bound to `useSnapshots`.
 */
export function SnapshotsPanel() {
  ensureGridDom();
  const snapshots = useSnapshots();
  const locale = getLocale();
  const writeBlock = snapshots.writeBlock
    ? codedText(snapshots.writeBlock, snapshots.writeBlockCode, snapshots.writeBlockParams)
    : "";
  const undoId = snapshots.snapshotUndo?.restore_id;
  const latest = snapshots.operations[snapshots.operations.length - 1];
  const failed = latest?.result === "rollback_failed";
  const openSnapshotPlan = snapshots.openSnapshotPlan;
  const setSnapshotDialogStatus = snapshots.setSnapshotDialogStatus;
  const columns = useMemo(
    () => snapshotColumns({
      onRestore: (snapshotId) => {
        openSnapshotPlan(snapshotId).catch((error) => setSnapshotDialogStatus(failureOf(error).message));
      },
    }),
    [locale, openSnapshotPlan, setSnapshotDialogStatus],
  );
  const localeText = useMemo(() => gridLocaleText(locale), [locale]);
  const operations = useMemo(
    () => [...snapshots.operations].reverse(),
    [snapshots.operations],
  );
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) return undefined;
    attachGridTooltips(node);
    const observer = new MutationObserver(() => attachGridTooltips(node));
    observer.observe(node, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [columns, snapshots.snapshots, locale]);

  return (
    <>
      <div className="browser-bar">
        <p id="snapshots-heading" className="files-path">{t("view.snapshots")}</p>
        <Button
          id="snapshots-refresh"
          type="button"
          ref={tooltipRef(tips.snapshotsRefresh)}
          onClick={() => {
            snapshots.loadSnapshots().catch((error) => snapshots.failSnapshots(error));
          }}
        >
          {t("common.refresh")}
        </Button>
        <Button
          id="snapshots-take"
          type="button"
          variant="contained"
          ref={tooltipRef(tips.snapshotsTake)}
          disabled={snapshots.taking}
          onClick={() => {
            snapshots.takeSnapshot().catch((error) => snapshots.failSnapshots(error));
          }}
        >
          {snapshots.taking ? t("snapshots.saving") : t("snapshots.take")}
        </Button>
        <Button
          id="snapshots-drives"
          type="button"
          ref={tooltipRef(tips.backupDrives)}
          disabled={snapshots.backingDrives}
          aria-label={t("snapshots.backupDrives")}
          onClick={() => {
            snapshots.backupDriveCrates().catch((error) => snapshots.failSnapshots(error));
          }}
        >
          {t("snapshots.backupDrives")}
        </Button>
      </div>
      <p id="snapshots-drives-note" className="notice" role="status">
        {driveNote(snapshots.backingDrives, snapshots.driveNoteError, snapshots.driveBackup)}
      </p>
      <p id="snapshots-block" className="notice" role="status" hidden={!writeBlock}>{writeBlock}</p>
      <div id="snapshots-undo" className="snapshot-undo" hidden={!undoId}>
        <p id="snapshots-undo-text">
          {snapshots.snapshotUndo?.source === "Lexicon"
            ? t("snapshots.outsideChangeLexicon")
            : t("snapshots.outsideChange")}
        </p>
        <Button
          id="snapshots-undo-button"
          type="button"
          ref={tooltipRef(tips.snapshotsUndo)}
          onClick={() => {
            if (!undoId) return;
            snapshots.openSnapshotPlan(undoId).catch((error) => snapshots.failSnapshots(error));
          }}
        >
          {t("snapshots.reviewUndo")}
        </Button>
      </div>
      <p id="snapshots-status" className="notice" role="status" aria-live="polite">
        {listStatus(snapshots)}
      </p>
      <div
        id="snapshots-list"
        className="files-list snapshot-grid"
        aria-label={t("view.snapshots")}
        aria-busy={snapshots.snapshotLoading}
        tabIndex={0}
        ref={(element) => {
          listRef.current = element;
          tooltipRef(tips.snapshotsList)(element);
        }}
        style={{ height: 320, width: "100%", minWidth: 640 }}
      >
        {snapshots.snapshotError ? (
          <Button
            type="button"
            ref={tooltipRef(tips.snapshotsRetry)}
            onClick={() => {
              snapshots.loadSnapshots().catch((error) => snapshots.failSnapshots(error));
            }}
          >
            {t("common.tryAgain")}
          </Button>
        ) : (
          <DataGrid
            rows={[...snapshots.snapshots]}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeight={ROW}
            columnHeaderHeight={ROW}
            loading={snapshots.snapshotLoading}
            hideFooter={snapshots.snapshots.length <= GRID_PAGE_SIZE}
            hideFooterSelectedRowCount
            pageSizeOptions={[GRID_PAGE_SIZE]}
            rowBufferPx={ROW * 4}
            disableColumnFilter
            disableDensitySelector
            disableEval
            disableMultipleRowSelection
            getRowClassName={() => "snapshot-card"}
            localeText={localeText}
            slots={{ noRowsOverlay: EmptySnapshots }}
            sx={{
              height: "100%",
              border: 0,
              bgcolor: "transparent",
              color: "inherit",
              font: "inherit",
            }}
          />
        )}
      </div>
      <section id="operations" className="operations" aria-labelledby="operations-heading">
        <div className="browser-bar">
          <h2 id="operations-heading" className="operations-heading">{t("operations.heading")}</h2>
          <Button
            id="operations-refresh"
            type="button"
            ref={tooltipRef(tips.operationsRefresh)}
            onClick={() => {
              snapshots.loadOperations().catch(() => undefined);
            }}
          >
            {t("common.refresh")}
          </Button>
        </div>
        <p id="operations-alert" className="operations-alert" role="alert" hidden={!failed}>
          {failed ? t("operations.rollbackFailed") : ""}
        </p>
        <p id="operations-status" className="notice" role="status" aria-live="polite">
          {snapshots.operationsLoading && snapshots.operations.length === 0
            ? t("operations.reading")
            : snapshots.operationsError}
        </p>
        <List
          id="operations-list"
          className="files-list"
          aria-label={t("operations.heading")}
          aria-busy={snapshots.operationsLoading}
          tabIndex={0}
          ref={tooltipRef(tips.operationsList)}
          dense
        >
          {snapshots.operationsError ? (
            <ListItem>
              <Button
                type="button"
                ref={tooltipRef(tips.operationsRetry)}
                onClick={() => {
                  snapshots.loadOperations().catch(() => undefined);
                }}
              >
                {t("common.tryAgain")}
              </Button>
            </ListItem>
          ) : snapshots.operationsLoading && snapshots.operations.length === 0 ? null : snapshots.operations.length === 0 ? (
            <ListItem>
              <ListItemText primary={t("operations.empty")} />
            </ListItem>
          ) : (
            operations.map((item, index) => {
              const copy = operationCardText(item);
              return (
                <ListItem
                  key={`${item.time ?? ""}:${item.action ?? ""}:${item.target ?? ""}:${index}`}
                  className="operation-card snapshot-card"
                >
                  <ListItemText primary={copy.title} secondary={copy.detail || undefined} />
                </ListItem>
              );
            })
          )}
        </List>
      </section>
    </>
  );
}
