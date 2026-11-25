/**
 * Broken smart crates: crates that lost their rules, and a confirm step.
 *
 * Check again, Repair, and Undo stay in the HTML bar. The engine is
 * broken-smart.ts.
 */

import Button from "@mui/material/Button";
import type { BrokenSmartCrate, BrokenSmartPlan } from "../lib/api-types";
import { tooltipRef } from "../components/tooltip-ref";
import { t, type MessageKey } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

const SOURCES: Record<NonNullable<BrokenSmartCrate["source"]>, MessageKey> = {
  snapshot: "broken.source.snapshot",
  backup: "broken.source.backup",
  sandbox: "broken.source.sandbox",
  mirror: "broken.source.mirror",
  rules: "broken.source.rules",
};

function sourceLabel(crate: BrokenSmartCrate): string {
  if (!crate.source) return t("broken.unrestorable");
  const name = t(SOURCES[crate.source]);
  return crate.source_at ? `${name} · ${crate.source_at}` : name;
}

function reasonLabel(crate: BrokenSmartCrate): string {
  return crate.reason === "missing_table"
    ? t("broken.reason.missing_table")
    : t("broken.reason.missing_rules");
}

/**
 * Counts, the crate list, and Confirm repair after a preview.
 */
export function BrokenSmartPanel({
  payload,
  selected,
  confirm,
  writable,
  onToggle,
}: {
  payload: BrokenSmartPlan;
  selected: ReadonlySet<number>;
  confirm: boolean;
  writable: boolean;
  onToggle: (id: number) => void;
}) {
  const crates = payload.crates || [];
  const chosen = crates.filter((crate) => crate.restorable && selected.has(crate.id));

  return (
    <>
      <p className="gig-note">
        {crates.length
          ? t("broken.summary", { checked: payload.checked, count: crates.length })
          : t("broken.summaryClear")}
      </p>
      {crates.length
        ? crates.map((crate) => (
          <label key={crate.id} className="gig-note" style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
            {crate.restorable
              ? (
                <input
                  type="checkbox"
                  data-broken-id={crate.id}
                  checked={selected.has(crate.id)}
                  aria-label={crate.name}
                  ref={tooltipRef(tips.brokenPick)}
                  onChange={() => onToggle(crate.id)}
                />
              )
              : null}
            <span>
              <strong>{crate.path}</strong>
              {" — "}
              {reasonLabel(crate)}
              {" — "}
              {sourceLabel(crate)}
            </span>
          </label>
        ))
        : <p className="gig-note">{t("broken.empty")}</p>}
      {confirm && chosen.length
        ? (
          <>
            <p className="gig-note">{t("broken.preview", { count: chosen.length })}</p>
            <Button
              type="button"
              size="small"
              variant="outlined"
              sx={BUTTON_SX}
              data-broken-action="confirm"
              disabled={!writable}
              ref={tooltipRef(tips.brokenConfirm)}
            >
              {t("broken.confirm")}
            </Button>
          </>
        )
        : null}
    </>
  );
}
