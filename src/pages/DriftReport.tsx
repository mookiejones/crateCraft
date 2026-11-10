/**
 * Tempo-drift report painted by React.
 *
 * Counts and flagged tracks read `useGig`. Color is not the only signal:
 * each row names the reasons in words.
 */

import { t } from "../lib/i18n";
import { useGig } from "../containers/GigContext";
import {
  driftFlagLine,
  driftReasonHeading,
  driftReasonKinds,
} from "../lib/gig/drift-view";
import { GigDetailsGroup } from "./GigDetailsGroup";

/**
 * Counts and the flagged-track list.
 */
export function DriftReport() {
  const { drift } = useGig();
  const payload = drift.report;
  if (!payload) return null;
  const flags = payload.flags || [];
  return (
    <>
      <p className="gig-note">
        {flags.length
          ? t("drift.summary", { checked: payload.checked, count: flags.length })
          : t("drift.summaryClear", { checked: payload.checked })}
      </p>
      {payload.not_found
        ? <p className="gig-note">{t("drift.notFound", { count: payload.not_found })}</p>
        : null}
      {payload.unreadable
        ? <p className="gig-note">{t("drift.unreadableFiles", { count: payload.unreadable })}</p>
        : null}
      {payload.unchecked
        ? <p className="gig-note">{t("drift.unchecked", { count: payload.unchecked })}</p>
        : null}
      {payload.too_quiet
        ? <p className="gig-note">{t("drift.tooQuiet", { count: payload.too_quiet })}</p>
        : null}
      {payload.mapped
        ? <p className="gig-note">{t("drift.mapped", { count: payload.mapped })}</p>
        : null}
      {flags.length
        ? driftReasonKinds(flags).map((kind) => (
          <GigDetailsGroup
            key={kind}
            label={driftReasonHeading(kind)}
            lines={flags.filter((item) => item.reasons.includes(kind)).map(driftFlagLine)}
          />
        ))
        : <p className="gig-note">{t("drift.empty")}</p>}
    </>
  );
}
