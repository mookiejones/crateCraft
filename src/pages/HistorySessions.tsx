/**
 * History session list painted by React.
 *
 * Each row opens that session. The meta text is the played count.
 * Tooltips stay on the same keys the DOM painter used.
 */

import { useHistory } from "../containers/HistoryContext";
import { t } from "../lib/i18n";
import { setTooltip } from "../lib/ui/tooltip";
import { sessionTip, type TipSpec } from "../lib/ui/tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLButtonElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

/**
 * Session buttons for `#session-list`.
 *
 * The host keeps `role="listbox"`. These rows are the options.
 */
export function HistorySessions() {
  const history = useHistory();
  return (
    <>
      {history.sessions.map((session) => {
        const name = session.name || t("history.session");
        return (
          <button
            key={session.id}
            type="button"
            ref={tooltipRef(sessionTip(session.name || "Session"))}
            className="crate"
            role="option"
            aria-selected={session.id === history.historyId}
            onClick={() => {
              void history.openSession(session.id);
            }}
          >
            <span className="name">{name}</span>
            <span className="meta">{String(session.played || 0)}</span>
          </button>
        );
      })}
    </>
  );
}
