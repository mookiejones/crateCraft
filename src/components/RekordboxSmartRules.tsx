/**
 * Smart-crate classes and the per-crate freeze box in the Rekordbox dialog.
 *
 * The report is already loaded. Checking a box asks the dialog to fetch
 * again. This component does not download the file and does not write
 * the library.
 */

import { useEffect, useState } from "react";
import { getLocale, onLocaleChange, t } from "../lib/i18n";
import { tooltipRef } from "./tooltip-ref";
import { rekordboxSmartFreeze } from "../lib/ui/tooltip-strings";
import type { SmartClass, SmartCrateRow } from "../lib/ui/rekordbox-smart";

export type RekordboxSmartRulesProps = {
  crates: readonly SmartCrateRow[];
  onFreeze: (id: number, frozen: boolean) => void;
};

function useLocaleTick(): void {
  const [, setLocale] = useState(getLocale);
  useEffect(() => onLocaleChange(setLocale), []);
}

function kindLabel(kind: SmartClass): string {
  if (kind === "exact") return t("rekordbox.smartExact");
  if (kind === "approximate") return t("rekordbox.smartApproximate");
  return t("rekordbox.smartImpossible");
}

/**
 * One fieldset of freeze boxes, rule classes, and count mismatches.
 *
 * An empty list renders nothing. The checkbox label includes the crate
 * name. The class is a word, not a color.
 *
 * @param props Crates from the report and the freeze handler.
 */
export function RekordboxSmartRules({ crates, onFreeze }: RekordboxSmartRulesProps) {
  useLocaleTick();
  if (crates.length === 0) return null;
  return (
    <fieldset className="rekordbox-smart">
      <legend>{t("rekordbox.smartHeading")}</legend>
      {crates.map((crate) => (
        <div key={crate.id} className="rekordbox-smart-crate">
          <label className="rekordbox-smart-freeze">
            <input
              id={`rekordbox-freeze-${crate.id}`}
              type="checkbox"
              checked={crate.frozen}
              ref={tooltipRef(rekordboxSmartFreeze(crate.name))}
              onChange={(event) => onFreeze(crate.id, event.target.checked)}
            />
            <span>{t("rekordbox.smartFreeze", { name: crate.name })}</span>
          </label>
          {crate.status === "empty" ? (
            <p>{t("rekordbox.smartNoRules")}</p>
          ) : (
            <ul>
              {crate.rules.map((rule, index) => (
                <li key={`${rule.label}-${index}`}>
                  {t("rekordbox.smartRule", { label: rule.label, kind: kindLabel(rule.classification) })}
                </li>
              ))}
            </ul>
          )}
          {crate.mismatch ? (
            <p>
              {t("rekordbox.smartMismatch", {
                name: crate.name,
                stored: crate.storedCount,
                written: crate.writtenCount,
              })}
            </p>
          ) : null}
        </div>
      ))}
    </fieldset>
  );
}
