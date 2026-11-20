/**
 * Audio-changed report: Data Grid of files replaced under the same name.
 *
 * Check again, Save crate, and Re-analyze stay in the HTML bar. Confirm
 * crate sits above the grid after a preview. Engine stays in
 * audio-changed.ts.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type {
  AudioChangedPlan,
  AudioChangedReport,
  AudioChangedTrack,
  AudioReanalyzePlan,
} from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { tooltipRef } from "../components/tooltip-ref";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

type ChangedRow = HealthGridRow & AudioChangedTrack;

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

function reasonLabel(reason: string): string {
  if (reason === "size") return t("audio.field.size");
  if (reason === "duration") return t("audio.field.duration");
  if (reason === "hash") return t("audio.field.hash");
  return reason;
}

function trackLabel(row: AudioChangedTrack): string {
  const title = row.name.trim();
  const who = row.artist.trim();
  if (title && who) return `${who} — ${title}`;
  return title || who || row.file;
}

/**
 * Counts, the cues warning, Confirm crate, and the replaced-file grid.
 */
export function AudioChangedPanel({
  payload,
  cratePlan,
  reanalyzePlan,
  writable,
}: {
  payload: AudioChangedReport;
  cratePlan: AudioChangedPlan | null;
  reanalyzePlan: AudioReanalyzePlan | null;
  writable: boolean;
}) {
  const changed = payload.changed || [];
  const rows = useMemo<ChangedRow[]>(
    () => changed.map((item) => ({ ...item, id: item.id })),
    [changed],
  );
  const columns = useMemo<GridColDef<ChangedRow>[]>(() => [
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
      field: "reasons",
      headerName: t("audio.column.changed"),
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => row.reasons.map(reasonLabel).join(", "),
    },
  ], []);

  return (
    <>
      <p className="gig-note">
        {changed.length
          ? t("audio.summary", { checked: payload.checked, count: changed.length })
          : t("audio.summaryClear", { checked: payload.checked })}
      </p>
      {payload.offline
        ? <p className="gig-note">{t("audio.offline", { count: payload.offline })}</p>
        : null}
      {payload.unreadable
        ? <p className="gig-note">{t("audio.unreadableFiles", { count: payload.unreadable })}</p>
        : null}
      {changed.length ? <p className="gig-note">{t("audio.warning")}</p> : null}
      {reanalyzePlan
        ? (
          <p className="gig-note">
            {t("audio.reanalyzePreview", { count: reanalyzePlan.count })}
            {" "}
            {t("audio.reanalyzeNote")}
          </p>
        )
        : null}
      <PlanNote cratePlan={cratePlan} writable={writable} />
      {changed.length
        ? <HealthDataGrid rows={rows} columns={columns} />
        : <p className="gig-note">{t("audio.empty")}</p>}
    </>
  );
}

function PlanNote({
  cratePlan,
  writable,
}: {
  cratePlan: AudioChangedPlan | null;
  writable: boolean;
}) {
  if (!cratePlan) return null;
  if (cratePlan.written && cratePlan.saved) {
    return <p className="gig-note">{t("audio.written", { count: cratePlan.added ?? 0, name: cratePlan.name ?? "" })}</p>;
  }
  if (!cratePlan.added) {
    return <p className="gig-note">{t("audio.previewEmpty")}</p>;
  }
  return (
    <>
      <p className="gig-note">{t("audio.preview", { count: cratePlan.added, name: cratePlan.name ?? "" })}</p>
      <Button
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        data-audio-action="confirm"
        disabled={!writable}
        ref={tooltipRef(tips.audioConfirm)}
      >
        {t("audio.confirmCrate")}
      </Button>
    </>
  );
}
