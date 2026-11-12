/**
 * Suspect-quality report: Data Grid of flagged tracks.
 *
 * Check again and Save crate stay in the HTML bar. Confirm crate sits
 * above the grid after a preview. Engine stays in bitrate.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { BitrateCheckReport, BitrateCratePlan, BitrateSuspect } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { tooltipRef } from "../components/tooltip-ref";
import {
  bitrateDetail,
  bitrateReasonHeading,
  bitrateTrackTitle,
} from "../lib/health/bitrate-view";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

type SuspectRow = HealthGridRow & BitrateSuspect;

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

function PlanNote({
  cratePlan,
  writable,
}: {
  cratePlan: BitrateCratePlan | null;
  writable: boolean;
}) {
  if (!cratePlan) return null;
  if (cratePlan.written && cratePlan.saved) {
    return <p className="gig-note">{t("bitrate.written", { count: cratePlan.added, name: cratePlan.name })}</p>;
  }
  if (!cratePlan.added) {
    return <p className="gig-note">{t("bitrate.previewEmpty")}</p>;
  }
  return (
    <>
      <p className="gig-note">{t("bitrate.preview", { count: cratePlan.added, name: cratePlan.name })}</p>
      <Button
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        data-bitrate-action="confirm"
        disabled={!writable}
        ref={tooltipRef(tips.bitrateConfirm)}
      >
        {t("bitrate.confirmCrate")}
      </Button>
    </>
  );
}

/**
 * Counts, Confirm crate, and the flagged-track Data Grid.
 */
export function BitrateReport({
  payload,
  cratePlan,
  writable,
}: {
  payload: BitrateCheckReport;
  cratePlan: BitrateCratePlan | null;
  writable: boolean;
}) {
  const suspects = payload.suspects || [];
  const rows = useMemo<SuspectRow[]>(
    () => suspects.map((item) => ({ ...item, id: item.id })),
    [suspects],
  );
  const columns = useMemo<GridColDef<SuspectRow>[]>(() => [
    {
      field: "track",
      headerName: t("health.column.track"),
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => bitrateTrackTitle(row),
    },
    {
      field: "file",
      headerName: t("health.column.file"),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "reason",
      headerName: t("bitrate.column.reason"),
      flex: 1.4,
      minWidth: 180,
      valueGetter: (_value, row) => bitrateReasonHeading(row.reason),
    },
    {
      field: "detail",
      headerName: t("bitrate.column.kbps"),
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => bitrateDetail(row),
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {suspects.length
          ? t("bitrate.summary", { checked: payload.checked, count: suspects.length })
          : t("bitrate.summaryClear", { checked: payload.checked })}
      </p>
      {payload.not_found ? <p className="gig-note">{t("bitrate.notFound", { count: payload.not_found })}</p> : null}
      {payload.unreadable ? <p className="gig-note">{t("bitrate.unreadableFiles", { count: payload.unreadable })}</p> : null}
      {payload.unchecked ? <p className="gig-note">{t("bitrate.unchecked", { count: payload.unchecked })}</p> : null}
      {payload.too_quiet ? <p className="gig-note">{t("bitrate.tooQuiet", { count: payload.too_quiet })}</p> : null}
      <PlanNote cratePlan={cratePlan} writable={writable} />
      {suspects.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("bitrate.empty")}</p>}
    </>
  );
}
