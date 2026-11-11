/**
 * Snapshot list, drive-backup note, undo, and the operation log.
 *
 * Buttons keep the ids desktop actions and shortcuts already use.
 */

import { failureOf } from "../lib/api";
import { codedText, t } from "../lib/i18n";
import { useSnapshots } from "../containers/SnapshotsContext";
import { driveCopyText, operationCardText, snapshotCardText } from "../lib/snapshots/restore-view";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
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

/**
 * Backups panel bound to `useSnapshots`.
 */
export function SnapshotsPanel() {
  const snapshots = useSnapshots();
  const writeBlock = snapshots.writeBlock
    ? codedText(snapshots.writeBlock, snapshots.writeBlockCode, snapshots.writeBlockParams)
    : "";
  const undoId = snapshots.snapshotUndo?.restore_id;
  const latest = snapshots.operations[snapshots.operations.length - 1];
  const failed = latest?.result === "rollback_failed";

  return (
    <>
      <div className="browser-bar">
        <p id="snapshots-heading" className="files-path">{t("view.snapshots")}</p>
        <button
          id="snapshots-refresh"
          type="button"
          ref={tooltipRef(tips.snapshotsRefresh)}
          onClick={() => {
            snapshots.loadSnapshots().catch((error) => snapshots.failSnapshots(error));
          }}
        >
          {t("common.refresh")}
        </button>
        <button
          id="snapshots-take"
          type="button"
          ref={tooltipRef(tips.snapshotsTake)}
          disabled={snapshots.taking}
          onClick={() => {
            snapshots.takeSnapshot().catch((error) => snapshots.failSnapshots(error));
          }}
        >
          {snapshots.taking ? t("snapshots.saving") : t("snapshots.take")}
        </button>
        <button
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
        </button>
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
        <button
          id="snapshots-undo-button"
          type="button"
          ref={tooltipRef(tips.snapshotsUndo)}
          onClick={() => {
            if (!undoId) return;
            snapshots.openSnapshotPlan(undoId).catch((error) => snapshots.failSnapshots(error));
          }}
        >
          {t("snapshots.reviewUndo")}
        </button>
      </div>
      <p id="snapshots-status" className="notice" role="status" aria-live="polite">
        {listStatus(snapshots)}
      </p>
      <div
        id="snapshots-list"
        className="files-list"
        role="list"
        aria-label={t("view.snapshots")}
        aria-busy={snapshots.snapshotLoading}
        tabIndex={0}
        ref={tooltipRef(tips.snapshotsList)}
      >
        {snapshots.snapshotLoading ? null : snapshots.snapshotError ? (
          <button
            type="button"
            ref={tooltipRef(tips.snapshotsRetry)}
            onClick={() => {
              snapshots.loadSnapshots().catch((error) => snapshots.failSnapshots(error));
            }}
          >
            {t("common.tryAgain")}
          </button>
        ) : snapshots.snapshots.length === 0 ? (
          <p>{t("snapshots.empty")}</p>
        ) : (
          snapshots.snapshots.map((item) => {
            const copy = snapshotCardText(item);
            return (
              <article key={item.id} className="snapshot-card" role="listitem">
                <p>{copy.title}</p>
                <p>{copy.detail}</p>
                <button
                  type="button"
                  ref={tooltipRef(tips.reviewRestore)}
                  onClick={() => {
                    snapshots.openSnapshotPlan(item.id).catch((error) => snapshots.setSnapshotDialogStatus(failureOf(error).message));
                  }}
                >
                  {t("snapshots.reviewRestore")}
                </button>
              </article>
            );
          })
        )}
      </div>
      <section id="operations" className="operations" aria-labelledby="operations-heading">
        <div className="browser-bar">
          <h2 id="operations-heading" className="operations-heading">{t("operations.heading")}</h2>
          <button
            id="operations-refresh"
            type="button"
            ref={tooltipRef(tips.operationsRefresh)}
            onClick={() => {
              snapshots.loadOperations().catch(() => undefined);
            }}
          >
            {t("common.refresh")}
          </button>
        </div>
        <p id="operations-alert" className="operations-alert" role="alert" hidden={!failed}>
          {failed ? t("operations.rollbackFailed") : ""}
        </p>
        <p id="operations-status" className="notice" role="status" aria-live="polite">
          {snapshots.operationsLoading && snapshots.operations.length === 0
            ? t("operations.reading")
            : snapshots.operationsError}
        </p>
        <div
          id="operations-list"
          className="files-list"
          role="list"
          aria-label={t("operations.heading")}
          aria-busy={snapshots.operationsLoading}
          tabIndex={0}
          ref={tooltipRef(tips.operationsList)}
        >
          {snapshots.operationsError ? (
            <button
              type="button"
              ref={tooltipRef(tips.operationsRetry)}
              onClick={() => {
                snapshots.loadOperations().catch(() => undefined);
              }}
            >
              {t("common.tryAgain")}
            </button>
          ) : snapshots.operationsLoading && snapshots.operations.length === 0 ? null : snapshots.operations.length === 0 ? (
            <p>{t("operations.empty")}</p>
          ) : (
            [...snapshots.operations].reverse().map((item, index) => {
              const copy = operationCardText(item);
              return (
                <article
                  key={`${item.time ?? ""}:${item.action ?? ""}:${item.target ?? ""}:${index}`}
                  className="operation-card snapshot-card"
                  role="listitem"
                >
                  <p>{copy.title}</p>
                  {copy.detail ? <p>{copy.detail}</p> : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
