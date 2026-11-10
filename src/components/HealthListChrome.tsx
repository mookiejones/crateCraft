/**
 * Merge copies and Relink for Missing / Duplicates, from HealthContext.
 *
 * Stems uses the same chrome host and shows neither button. The track
 * list stays in views.ts.
 */

import { t } from "../i18n";
import { useHealth } from "../context/HealthContext";
import { tips } from "../tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

/**
 * Duplicate merge and missing-file relink on the crate rail.
 */
export function HealthListChrome() {
  const health = useHealth();
  return (
    <>
      <div id="duplicate-actions" className="crate-actions" hidden={!health.mergeVisible}>
        <button
          id="merge-duplicates"
          type="button"
          ref={tooltipRef(tips.mergeDuplicates)}
          disabled={health.mergeDisabled}
        >
          {t("merge.title")}
        </button>
      </div>
      <div id="relink-actions" className="crate-actions" hidden={!health.relinkVisible}>
        <button
          id="open-relink"
          type="button"
          ref={tooltipRef(tips.relink)}
          disabled={health.relinkDisabled}
        >
          {t("relink.title")}
        </button>
      </div>
    </>
  );
}
