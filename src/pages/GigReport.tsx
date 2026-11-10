/**
 * Gig check report painted by React.
 *
 * Five steps lead to a done screen. Back, the step verb, and Exit read
 * `useGig`. Color is not the only signal: the verdict is ✓ Ready or
 * ✕ Not ready.
 */

import type { GigReport as GigPayload } from "../lib/api-types";
import { formatDate, t } from "../lib/i18n";
import { useGig } from "../containers/GigContext";
import {
  GIG_CHANGE_GROUPS,
  GIG_STEP_COUNT,
  GIG_STEPS,
  gigLinesFor,
} from "../lib/gig/gig-view";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";
import { GigDetailsGroup } from "./GigDetailsGroup";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLButtonElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function GigActions({ primary, stepIndex }: { primary: string | null; stepIndex: number }) {
  const gig = useGig();
  return (
    <div className="gig-actions">
      <button
        type="button"
        ref={tooltipRef(tips.gigBack)}
        data-gig-action="back"
        disabled={stepIndex === 0}
        onClick={() => gig.backStep()}
      >
        {t("common.back")}
      </button>
      {primary
        ? (
          <button
            type="button"
            ref={tooltipRef(tips.gigNext)}
            className="gig-primary"
            data-gig-action="next"
            onClick={() => gig.nextStep()}
          >
            {primary}
          </button>
        )
        : null}
      <button
        type="button"
        ref={tooltipRef(tips.gigExit)}
        data-gig-action="exit"
        onClick={() => gig.exit()}
      >
        {t("gig.exit")}
      </button>
    </div>
  );
}

function GigSince({ payload }: { payload: GigPayload }) {
  const note = payload.snapshot_note?.trim() ?? "";
  const changes = payload.changes;
  const groups = GIG_CHANGE_GROUPS
    .map(([label, key]) => [label, changes?.[key] || []] as const)
    .filter(([, lines]) => lines.length > 0);
  return (
    <>
      {note ? <p className="gig-note">{note}</p> : null}
      {!changes && !note ? <p className="gig-note">{t("gig.noSnapshot")}</p> : null}
      {groups.map(([label, lines]) => (
        <GigDetailsGroup key={label} label={t(label)} lines={lines} />
      ))}
      {changes && groups.length === 0
        ? <p className="gig-note">{t(GIG_STEPS[GIG_STEP_COUNT - 1]!.empty)}</p>
        : null}
    </>
  );
}

/**
 * Ready score, the current step, and the done screen.
 */
export function GigReport() {
  const { gig } = useGig();
  const payload = gig.report;
  if (!payload) return null;
  const done = gig.stepIndex >= GIG_STEP_COUNT;
  const step = done ? null : GIG_STEPS[gig.stepIndex];
  const verdictWord = t(payload.ready ? "gig.wordReady" : "gig.wordNotReady");
  const crate = payload.scope?.crate_name || t("gig.wholeSpaceInline");
  const time = gig.checkedAt
    ? formatDate(gig.checkedAt, { hour: "numeric", minute: "2-digit" })
    : "";
  const holding = (payload.holding_it_back || []).map((item) => item.summary);
  const lines = step && gig.stepIndex < GIG_STEP_COUNT - 1
    ? gigLinesFor(payload, gig.stepIndex)
    : [];
  return (
    <>
      <p
        className="gig-score"
        aria-label={t("gig.scoreLabel", { score: payload.score, verdict: verdictWord })}
      >
        <span className="gig-score-value">{t("gig.score", { score: payload.score })}</span>
        <span className={payload.ready ? "gig-verdict" : "gig-verdict not-ready"}>
          {t(payload.ready ? "gig.verdictReady" : "gig.verdictNotReady")}
        </span>
      </p>
      {done
        ? (
          <>
            <h3 id="gig-step-heading" tabIndex={-1}>{t("gig.done")}</h3>
            <div id="gig-ready-art" className="gig-art-slot" data-slot="gig-ready" aria-hidden="true" />
            <p className="gig-done">
              {t(payload.ready ? "gig.doneReady" : "gig.doneNotReady", {
                score: payload.score,
                crate,
                time,
              })}
            </p>
            {holding.length
              ? <GigDetailsGroup label={t("gig.holding")} lines={holding} />
              : null}
            <GigActions primary={null} stepIndex={gig.stepIndex} />
          </>
        )
        : (
          <>
            <p className="gig-kicker">{t("gig.stepOf", { index: gig.stepIndex + 1, total: GIG_STEP_COUNT })}</p>
            <h3 id="gig-step-heading" tabIndex={-1}>{t(step!.title)}</h3>
            {gig.stepIndex === GIG_STEP_COUNT - 1
              ? <GigSince payload={payload} />
              : lines.length
                ? <GigDetailsGroup label={t(step!.title)} lines={lines} />
                : <p className="gig-note">{t(step!.empty)}</p>}
            <GigActions primary={t(step!.action)} stepIndex={gig.stepIndex} />
          </>
        )}
    </>
  );
}
