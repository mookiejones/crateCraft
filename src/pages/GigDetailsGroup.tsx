/**
 * Open Accordion list with a Show all cap.
 *
 * Gig check groups share this control. A list longer than the cap
 * starts truncated. Show all expands it in place. The heading is a
 * button, so Tab then Enter or Space toggles the group.
 */

import { useState } from "react";
import { flushSync } from "react-dom";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

export const LIST_CAP = 100;

/**
 * One labelled list of report rows.
 *
 * @param label Group heading.
 * @param lines Rows to show.
 */
export function GigDetailsGroup({ label, lines }: { label: string; lines: readonly string[] }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(true);
  const shown = expanded || lines.length <= LIST_CAP ? lines : lines.slice(0, LIST_CAP);
  return (
    <Accordion
      className="gig-group"
      expanded={open}
      onChange={(_, next) => setOpen(next)}
      disableGutters
      square
      slotProps={{ transition: { timeout: 0 } }}
      sx={{
        bgcolor: "transparent",
        color: "inherit",
        boxShadow: "none",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon fontSize="small" />}
        ref={tooltipRef(tips.gigGroup)}
      >
        {t("gig.groupCount", { label, count: lines.length })}
      </AccordionSummary>
      <AccordionDetails>
        <ul>
          {shown.map((line, index) => (
            <li key={`${index}:${line}`}>{line}</li>
          ))}
        </ul>
        {lines.length > LIST_CAP && !expanded
          ? (
            <button
              type="button"
              ref={tooltipRef(tips.gigShowAll)}
              className="gig-show-all"
              onClick={() => {
                flushSync(() => setExpanded(true));
              }}
            >
              {t("gig.showAll", { count: lines.length })}
            </button>
          )
          : null}
      </AccordionDetails>
    </Accordion>
  );
}
