/**
 * Restore preview dialog bound to `useSnapshots`.
 *
 * Confirm stays off when the dry-run plan sets restore_blocked. Nothing
 * is written until confirm posts through the engine.
 */

import { useEffect } from "react";
import { failureOf } from "../api";
import type { FrameDiff, Marker, PlanName } from "../api-types";
import { cueDiffRows, cueSummary, slotColor, type CueDiff } from "../cue-view";
import { codedText, messageParams, t } from "../i18n";
import { useSnapshots } from "../context/SnapshotsContext";
import { fileName, planLineText } from "../restore-view";
import { setTooltip } from "../tooltip";
import { tips, type TipSpec } from "../tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function CueSide({ cue, slot }: { cue: Marker | null; slot: number }) {
  const color = slotColor(slot, cue?.color);
  return (
    <span className={cue ? "cue-diff-side" : "cue-diff-side marker-empty"}>
      <span className="swatch" style={color ? { background: color } : undefined} />
      <span>{cueSummary(cue, t("markers.cueEmpty"))}</span>
    </span>
  );
}

function CueDiffRow({ diff }: { diff: CueDiff }) {
  const empty = t("markers.cueEmpty");
  const beforeText = cueSummary(diff.before, empty);
  const afterText = cueSummary(diff.after, empty);
  return (
    <p
      className="cue-diff"
      aria-label={`${t("markers.cue", { number: diff.slot + 1 })}: ${t("plan.cueDiff", { before: beforeText, after: afterText })}`}
    >
      <span className="marker-slot">{String(diff.slot + 1)}</span>
      <CueSide cue={diff.before} slot={diff.slot} />
      <span className="cue-diff-arrow" aria-hidden="true">→</span>
      <CueSide cue={diff.after} slot={diff.slot} />
    </p>
  );
}

function PlanLine({ label, rows }: { label: string; rows: PlanName[] | undefined }) {
  return <p>{planLineText(label, rows)}</p>;
}

function CueDiffs({ label, rows }: { label: string; rows: FrameDiff[] | undefined }) {
  const items = rows || [];
  if (!items.length) return <p>{t("plan.none", { label })}</p>;
  return (
    <>
      <p>{t("plan.files", { label, count: items.length })}</p>
      {items.slice(0, 12).map((item, index) => (
        <div key={`${item.path ?? ""}:${index}`}>
          <p>{fileName(item.path || "")}</p>
          {cueDiffRows(item.before, item.after).map((diff) => (
            <CueDiffRow key={`${diff.slot}:${diff.before?.start_ms ?? ""}:${diff.after?.start_ms ?? ""}`} diff={diff} />
          ))}
        </div>
      ))}
    </>
  );
}

function FrameDiffs({ label, rows }: { label: string; rows: FrameDiff[] | undefined }) {
  const items = rows || [];
  if (!items.length) return <p>{t("plan.none", { label })}</p>;
  return (
    <>
      <p>{t("plan.files", { label, count: items.length })}</p>
      {items.slice(0, 12).map((item, index) => (
        <p key={`${item.path ?? ""}:${index}`}>{fileName(item.path || "")}</p>
      ))}
    </>
  );
}

/**
 * Inner restore dialog. The host is the existing `#snapshot-dialog`.
 */
export function RestoreDialog() {
  const snapshots = useSnapshots();
  const closePlan = snapshots.closePlan;
  useEffect(() => {
    const dialog = document.getElementById("snapshot-dialog");
    if (!(dialog instanceof HTMLDialogElement)) return undefined;
    const onClose = () => closePlan();
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [closePlan]);
  const plan = snapshots.plan;
  const blocked = plan?.restore_blocked
    ? codedText(
        plan.restore_blocked,
        plan.restore_blocked_code,
        messageParams(plan.restore_blocked_params),
      )
    : "";
  const reading = snapshots.planOpen && !plan;
  const confirmDisabled = snapshots.confirming || reading || Boolean(plan?.restore_blocked);
  const blockText = reading
    ? t("snapshots.readingPlan")
    : blocked || (plan != null && plan.dry_run ? t("plan.nothingChanged") : "");

  return (
    <>
      <h2 id="snapshot-title">{t("snapshots.restoreTitle")}</h2>
      <p id="snapshot-intro">{t("snapshots.restoreIntro")}</p>
      <div id="snapshot-plan" aria-live="polite">
        {plan ? (
          <>
            <PlanLine label={t("plan.cratesAdded")} rows={plan.crates?.added} />
            <PlanLine label={t("plan.cratesRemoved")} rows={plan.crates?.removed} />
            <PlanLine label={t("plan.cratesChanged")} rows={plan.crates?.changed} />
            <PlanLine label={t("plan.cratesUnavailable")} rows={plan.crates?.unavailable} />
            <PlanLine label={t("plan.cratesRegistered")} rows={plan.crates_registered} />
            <PlanLine label={t("plan.cratesSkipped")} rows={plan.crates_skipped} />
            {plan.registration_warning ? (
              <p>{codedText(plan.registration_warning, plan.registration_warning_code)}</p>
            ) : null}
            <PlanLine label={t("plan.tracksAdded")} rows={plan.tracks?.added} />
            <PlanLine label={t("plan.tracksRemoved")} rows={plan.tracks?.removed} />
            <PlanLine label={t("plan.tracksUnavailable")} rows={plan.tracks?.unavailable} />
            <CueDiffs label={t("plan.cueChanges")} rows={plan.cues} />
            <FrameDiffs label={t("plan.gridChanges")} rows={plan.grids} />
            <PlanLine label={t("plan.deletedCrates")} rows={plan.deleted?.crates} />
            <PlanLine label={t("plan.deletedTracks")} rows={plan.deleted?.tracks} />
            <PlanLine label={t("plan.deletedCues")} rows={plan.deleted?.cues} />
            <PlanLine label={t("plan.deletedGrids")} rows={plan.deleted?.grids} />
          </>
        ) : null}
      </div>
      <p id="snapshot-block" className="dialog-note" role="status">{blockText}</p>
      <div className="dialog-actions">
        <button
          id="snapshot-cancel"
          type="button"
          ref={tooltipRef(tips.snapshotCancel)}
          onClick={() => snapshots.closePlan()}
        >
          {t("common.cancel")}
        </button>
        <button
          id="snapshot-confirm"
          type="button"
          ref={tooltipRef(tips.snapshotConfirm)}
          disabled={confirmDisabled}
          onClick={() => {
            snapshots.confirmSnapshotRestore().catch((error) => snapshots.setSnapshotDialogStatus(failureOf(error).message));
          }}
        >
          {snapshots.confirming ? t("snapshots.restoring") : t("snapshots.restore")}
        </button>
      </div>
      <p id="snapshot-status" className="dialog-status" role="status" aria-live="polite">
        {snapshots.planStatus}
      </p>
    </>
  );
}
