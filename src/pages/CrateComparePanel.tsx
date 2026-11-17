/**
 * Compare-crates report: three sets with a Data Grid and Save crate.
 *
 * Crate A, Crate B, Include subcrates, and Compare stay in the HTML bar.
 * Engine stays in crate-compare.ts.
 */

import { useMemo, useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { GridColDef } from "@mui/x-data-grid";
import type { CrateCompareReport, CrateCompareTrack } from "../lib/api-types";
import { HealthDataGrid } from "../components/HealthDataGrid";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

const ACCORDION_SX = {
  disableGutters: true,
  square: true,
  elevation: 0,
  slotProps: { transition: { timeout: 0 } },
} as const;

function useSectionOpen(start: boolean) {
  const [open, setOpen] = useState(start);
  return {
    expanded: open,
    onChange: (_event: unknown, next: boolean) => {
      setOpen(next);
    },
  };
}

function SetGroup({
  setKey,
  label,
  tracks,
  writable,
  busy,
}: {
  setKey: "both" | "only_a" | "only_b";
  label: string;
  tracks: CrateCompareTrack[];
  writable: boolean;
  busy: boolean;
}) {
  const accordion = useSectionOpen(tracks.length > 0);
  const columns = useMemo<GridColDef<CrateCompareTrack>[]>(() => [
    {
      field: "name",
      headerName: t("column.title"),
      flex: 1,
      minWidth: 140,
    },
    {
      field: "artist",
      headerName: t("column.artist"),
      flex: 1,
      minWidth: 140,
    },
  ], []);
  return (
    <Accordion
      className="gig-group"
      expanded={accordion.expanded}
      onChange={accordion.onChange}
      {...ACCORDION_SX}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} ref={tooltipRef(tips.gigGroup)}>
        {t("gig.groupCount", { label, count: tracks.length })}
      </AccordionSummary>
      <AccordionDetails>
        <Button
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.compareSave)}
          data-compare-set={setKey}
          disabled={busy || !writable || tracks.length === 0}
        >
          {t("compare.save")}
        </Button>
        {tracks.length
          ? <HealthDataGrid rows={tracks} columns={columns} />
          : <p className="gig-note">{t("compare.empty")}</p>}
      </AccordionDetails>
    </Accordion>
  );
}

/**
 * Three Accordion sets and a Save crate button on each.
 */
export function CrateComparePanel({
  payload,
  writable,
  busy,
}: {
  payload: CrateCompareReport;
  writable: boolean;
  busy: boolean;
}) {
  const both = payload.both || [];
  const onlyA = payload.only_a || [];
  const onlyB = payload.only_b || [];
  const smart = payload.a.smart || payload.b.smart;
  return (
    <>
      {smart ? <p className="gig-note">{t("compare.smart")}</p> : null}
      <SetGroup
        setKey="both"
        label={t("compare.both")}
        tracks={both}
        writable={writable}
        busy={busy}
      />
      <SetGroup
        setKey="only_a"
        label={t("compare.onlyA", { name: payload.a.name })}
        tracks={onlyA}
        writable={writable}
        busy={busy}
      />
      <SetGroup
        setKey="only_b"
        label={t("compare.onlyB", { name: payload.b.name })}
        tracks={onlyB}
        writable={writable}
        busy={busy}
      />
    </>
  );
}
