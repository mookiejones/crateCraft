/**
 * One history entry in the detail pane.
 *
 * Entries are already loaded with the session, so this does not fetch.
 * An entry that still has an asset id can be opened in the library.
 */

import { useHistory } from "../context/HistoryContext";
import { clockLabel } from "../format";
import { t } from "../i18n";
import { setTooltip } from "../tooltip";
import { tips, type TipSpec } from "../tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLButtonElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

/**
 * History detail bound to `useHistory`.
 *
 * Renders nothing when the selected id is not in `entries`.
 */
export function HistoryDetail() {
  const history = useHistory();
  const entry = history.entries.find((item) => item.id === history.selectedId);
  if (!entry) return null;
  const lines: Array<[string, string]> = [
    [t("column.played"), entry.played ? t("common.yes") : t("common.no")],
    [t("column.deck"), entry.deck || "—"],
    [t("history.started"), clockLabel(entry.start_time) || "—"],
    [t("history.file"), entry.file || "—"],
  ];
  if (entry.notes) lines.push([t("history.notes"), entry.notes]);
  return (
    <div className="detail-body">
      <h2>{entry.name || t("track.untitled")}</h2>
      {entry.artist ? <p className="artist">{entry.artist}</p> : null}
      {lines.map(([label, value]) => (
        <Field key={label} label={label} value={value} />
      ))}
      {entry.asset_id ? (
        <button
          type="button"
          ref={tooltipRef(tips.openInLibrary)}
          className="text-button"
          onClick={() => {
            void history.openInLibrary(entry.asset_id as number);
          }}
        >
          {t("history.openInLibrary")}
        </button>
      ) : null}
    </div>
  );
}
