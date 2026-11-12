/**
 * Merge copies and Relink for Missing / Duplicates, from HealthContext.
 *
 * Stems uses the same chrome host and shows neither button. The track
 * list stays in views.ts. Relink and Merge sit above that grid.
 */

import Button from "@mui/material/Button";
import { t } from "../lib/i18n";
import { useHealth } from "../containers/HealthContext";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Duplicate merge and missing-file relink on the crate rail.
 */
export function HealthListChrome() {
  const health = useHealth();
  return (
    <>
      <div id="duplicate-actions" className="crate-actions" hidden={!health.mergeVisible}>
        <Button
          id="merge-duplicates"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.mergeDuplicates)}
          disabled={health.mergeDisabled}
        >
          {t("merge.title")}
        </Button>
      </div>
      <div id="relink-actions" className="crate-actions" hidden={!health.relinkVisible}>
        <Button
          id="open-relink"
          type="button"
          size="small"
          variant="outlined"
          sx={BUTTON_SX}
          ref={tooltipRef(tips.relink)}
          disabled={health.relinkDisabled}
        >
          {t("relink.title")}
        </Button>
      </div>
    </>
  );
}
