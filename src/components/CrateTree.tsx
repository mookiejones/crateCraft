/**
 * Crate rail painted by React.
 *
 * Rows stay the same treeitems the keyboard and tests already look for.
 * Clicks call `useCrates`.
 */

import { useCrates, type CrateContextValue } from "../context/CrateContext";
import type { CrateRailRow } from "../crate-tree";
import { colorHex } from "../format";
import { formatNumber, t } from "../i18n";
import { setTooltip } from "../tooltip";
import { collapseCrate, expandCrate, openCrate, tips, type TipSpec } from "../tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function focusedCrateId(): string | null {
  const list = document.getElementById("crate-list");
  const active = document.activeElement;
  if (!(list instanceof HTMLElement) || !(active instanceof HTMLElement) || !list.contains(active)) {
    return null;
  }
  return active.closest(".crate")?.getAttribute("data-id") ?? null;
}

/**
 * One disclosure button or the spacer that lines names up.
 */
function Twist({ row, toggle }: { row: CrateRailRow; toggle: CrateContextValue["toggle"] }) {
  if (!row.childCount) {
    return <span className="twist-gap" aria-hidden="true" />;
  }
  const spec = row.expanded ? collapseCrate(row.name) : expandCrate(row.name);
  return (
    <button
      type="button"
      ref={tooltipRef(spec)}
      className="twist"
      tabIndex={-1}
      aria-expanded={row.expanded}
      aria-label={t(row.expanded ? "crates.collapse" : "crates.expand", { name: row.name })}
      onClick={() => toggle(row.id)}
    />
  );
}

/**
 * One crate in the rail, including All tracks.
 */
function CrateRow({
  row,
  tabIndex,
  select,
  toggle,
}: {
  row: CrateRailRow;
  tabIndex: number;
  select: CrateContextValue["select"];
  toggle: CrateContextValue["toggle"];
}) {
  const hex = colorHex(row.color);
  const tip = row.id === "all" ? tips.allTracks : openCrate(row.name);
  return (
    <div
      className={row.holds ? "crate-row holds-selection" : "crate-row"}
      style={{ paddingLeft: `${row.depth * 14}px` }}
    >
      <Twist row={row} toggle={toggle} />
      <button
        type="button"
        ref={tooltipRef(tip)}
        className="crate"
        data-id={String(row.id)}
        data-parent={row.parent != null ? String(row.parent) : undefined}
        data-pane={row.pane ?? undefined}
        role="treeitem"
        tabIndex={tabIndex}
        aria-level={row.depth + 1}
        aria-selected={row.selected}
        aria-expanded={row.childCount ? row.expanded : undefined}
        onClick={(event) => select(row.id, event.nativeEvent)}
      >
        <span className="name">
          {hex ? <span className="swatch" style={{ background: hex }} /> : null}
          {row.name}
        </span>
        {row.smart ? <span className="smart">{t("crates.smartBadge")}</span> : null}
        <span className="meta">{formatNumber(row.count)}</span>
      </button>
    </div>
  );
}

/**
 * Crate tree bound to the crate context.
 */
export function CrateTree() {
  const crates = useCrates();
  const focusId = focusedCrateId();
  const tabbable = crates.rows.find((row) => String(row.id) === focusId) ?? crates.rows[0];
  return (
    <>
      {crates.rows.map((row) => (
        <CrateRow
          key={String(row.id)}
          row={row}
          tabIndex={row === tabbable ? 0 : -1}
          select={crates.select}
          toggle={crates.toggle}
        />
      ))}
    </>
  );
}
