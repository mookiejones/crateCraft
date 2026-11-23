/**
 * Gain-changed report: Data Grid of non-zero Autotags Gain dB.
 *
 * Check again, Save crate, and Reset stay in the HTML bar. Confirm
 * buttons sit above the grid after a preview. Engine stays in gain.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { GainChangedPlan, GainChangedReport, GainChangedTrack } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { tooltipRef } from "../components/tooltip-ref";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

type GainRow = HealthGridRow & GainChangedTrack;

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

function trackLabel(row: GainChangedTrack): string {
  const title = row.name.trim();
  const who = row.artist.trim();
  if (title && who) return `${who} — ${title}`;
  return title || who || row.file;
}

/**
 * Counts, Confirm crate / Confirm reset, and the non-zero-gain grid.
 */
export function GainChangedPanel({
  payload,
  cratePlan,
  resetPlan,
  writable,
}: {
  payload: GainChangedReport;
  cratePlan: GainChangedPlan | null;
  resetPlan: GainChangedPlan | null;
  writable: boolean;
}) {
  const changed = payload.changed || [];
  const rows = useMemo<GainRow[]>(
    () => changed.map((item) => ({ ...item, id: item.id })),
    [changed],
  );
  const columns = useMemo<GridColDef<GainRow>[]>(() => [
    {
      field: "track",
      headerName: t("health.column.track"),
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => trackLabel(row),
    },
    {
      field: "file",
      headerName: t("health.column.file"),
      flex: 1,
      minWidth: 140,
    },
    {
      field: "gain_db",
      headerName: t("gain.column.gain"),
      flex: 0.6,
      minWidth: 100,
      valueGetter: (_value, row) => row.gain_db,
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {changed.length
          ? t("gain.summary", { checked: payload.checked, count: changed.length })
          : t("gain.summaryClear", { checked: payload.checked })}
      </p>
      {payload.offline
        ? <p className="gig-note">{t("gain.offline", { count: payload.offline })}</p>
        : null}
      {payload.unreadable
        ? <p className="gig-note">{t("gain.unreadableFiles", { count: payload.unreadable })}</p>
        : null}
      <CrateNote cratePlan={cratePlan} writable={writable} folder={payload.folder} />
      <ResetNote resetPlan={resetPlan} writable={writable} />
      {changed.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("gain.empty")}</p>}
    </>
  );
}

function CrateNote({
  cratePlan,
  writable,
  folder,
}: {
  cratePlan: GainChangedPlan | null;
  writable: boolean;
  folder: string;
}) {
  if (!cratePlan) return null;
  if (cratePlan.written && cratePlan.saved) {
    return (
      <p className="gig-note">
        {t("gain.written", {
          count: cratePlan.added ?? 0,
          name: cratePlan.name ?? "",
          folder: cratePlan.folder || folder,
        })}
      </p>
    );
  }
  if (!cratePlan.added) {
    return <p className="gig-note">{t("gain.previewEmpty")}</p>;
  }
  return (
    <>
      <p className="gig-note">
        {t("gain.preview", {
          count: cratePlan.added,
          name: cratePlan.name ?? "",
          folder: cratePlan.folder || folder,
        })}
      </p>
      <Button
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        data-gain-action="confirm-crate"
        disabled={!writable}
        ref={tooltipRef(tips.gainConfirm)}
      >
        {t("gain.confirmCrate")}
      </Button>
    </>
  );
}

function ResetNote({
  resetPlan,
  writable,
}: {
  resetPlan: GainChangedPlan | null;
  writable: boolean;
}) {
  if (!resetPlan) return null;
  if (resetPlan.written) {
    return <p className="gig-note">{t("gain.resetDone", { count: resetPlan.added ?? 0 })}</p>;
  }
  if (!resetPlan.added) {
    return <p className="gig-note">{t("gain.resetEmpty")}</p>;
  }
  return (
    <>
      <p className="gig-note">{t("gain.resetPreview", { count: resetPlan.added })}</p>
      <Button
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        data-gain-action="confirm-reset"
        disabled={!writable}
        ref={tooltipRef(tips.gainConfirmReset)}
      >
        {t("gain.confirmReset")}
      </Button>
    </>
  );
}
