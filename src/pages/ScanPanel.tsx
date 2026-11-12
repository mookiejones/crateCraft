/**
 * Damaged-files report painted from HealthContext.
 *
 * Quick check and Full decode stay above a Community Data Grid. The
 * Problem column names the fault.
 */

import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import Button from "@mui/material/Button";
import type { FileScanProblem } from "../lib/api-types";
import { HealthDataGrid, type HealthGridRow } from "../components/HealthDataGrid";
import { useHealth } from "../containers/HealthContext";
import { scanProblemDetail, scanTrackTitle } from "../lib/health/scan-view";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

type ProblemRow = HealthGridRow & FileScanProblem;

/**
 * Quick check, Full decode, and the damaged-file Data Grid.
 */
export function ScanPanel() {
  const health = useHealth();
  const payload = health.scanReport;
  const problems = payload?.problems ?? [];
  const rows = useMemo<ProblemRow[]>(
    () => problems.map((item) => ({ ...item, id: item.id })),
    [problems],
  );
  const columns = useMemo<GridColDef<ProblemRow>[]>(() => [
    {
      field: "track",
      headerName: t("health.column.track"),
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_value, row) => scanTrackTitle(row),
    },
    {
      field: "file",
      headerName: t("health.column.file"),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "problem",
      headerName: t("scan.column.problem"),
      flex: 1.4,
      minWidth: 180,
      valueGetter: (_value, row) => scanProblemDetail(row),
    },
  ], []);

  return (
    <>
      <h2 id="scan-heading" className="visually-hidden">{t("scan.heading")}</h2>
      <div className="browser-bar">
        <p id="scan-scope" className="files-path">{health.scanScope}</p>
        <Button
          id="scan-quick"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.scanQuick)}
          disabled={health.scanBusy}
          aria-busy={health.scanBusy ? "true" : "false"}
          onClick={() => {
            void health.loadScan("quick");
          }}
        >
          {t("scan.checkQuick")}
        </Button>
        <Button
          id="scan-full"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.scanFull)}
          disabled={health.scanBusy || health.scanFullDisabled}
          aria-busy={health.scanBusy ? "true" : "false"}
          onClick={() => {
            void health.loadScan("full");
          }}
        >
          {t("scan.checkFull")}
        </Button>
      </div>
      <p id="scan-hint" className="gig-note">{t("scan.intro")}</p>
      <p id="scan-status" className="gig-status" role="status" aria-live="polite">{health.scanStatus}</p>
      <div id="scan-report" className="gig-report" tabIndex={-1}>
        {payload ? (
          <>
            <p className="gig-note">
              {problems.length
                ? t("scan.summary", { checked: payload.checked, count: problems.length })
                : t("scan.summaryClear", { checked: payload.checked })}
            </p>
            {payload.not_found ? <p className="gig-note">{t("scan.notFound", { count: payload.not_found })}</p> : null}
            {payload.unchecked ? <p className="gig-note">{t("scan.unchecked", { count: payload.unchecked })}</p> : null}
            {problems.length
              ? <HealthDataGrid rows={rows} columns={columns} />
              : <p className="gig-note">{t("scan.empty")}</p>}
          </>
        ) : null}
      </div>
    </>
  );
}
