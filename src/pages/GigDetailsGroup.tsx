/**
 * Open details list with a Show all cap.
 *
 * Gig check and Tempo drift share this control. A list longer than the
 * cap starts truncated. Show all expands it in place.
 */

import { useState } from "react";
import { flushSync } from "react-dom";
import { t } from "../lib/i18n";
import { setTooltip } from "../lib/ui/tooltip";
import { tips } from "../lib/ui/tooltip-strings";

export const LIST_CAP = 100;

/**
 * One labelled list of report rows.
 *
 * @param label Group heading.
 * @param lines Rows to show.
 */
export function GigDetailsGroup({ label, lines }: { label: string; lines: readonly string[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded || lines.length <= LIST_CAP ? lines : lines.slice(0, LIST_CAP);
  return (
    <details className="gig-group" open>
      <summary>{t("gig.groupCount", { label, count: lines.length })}</summary>
      <ul>
        {shown.map((line, index) => (
          <li key={`${index}:${line}`}>{line}</li>
        ))}
      </ul>
      {lines.length > LIST_CAP && !expanded
        ? (
          <button
            type="button"
            ref={(element) => {
              if (element) setTooltip(element, tips.gigShowAll);
            }}
            className="gig-show-all"
            onClick={() => {
              flushSync(() => setExpanded(true));
            }}
          >
            {t("gig.showAll", { count: lines.length })}
          </button>
        )
        : null}
    </details>
  );
}
