/**
 * Flattened crate-rail rows. Pure against `state`.
 *
 * views.ts used to walk this tree while building DOM nodes. The React
 * crate rail reads the same rows. Does not fetch or write.
 */

import type { Crate, Track } from "./api-types";
import { paneCrates, railMark, type CrateId } from "./dual-crate-view";
import { t } from "./i18n";
import { isTextSearchField, matchesQuery, parseQuery } from "./search-filters";
import { state } from "./state";

export type CrateRailRow = {
  id: CrateId;
  name: string;
  depth: number;
  childCount: number;
  smart: boolean;
  parent: number | null;
  color: number | string | null;
  count: number;
  holds: boolean;
  expanded: boolean;
  selected: boolean;
  pane: "a" | "b" | "both" | null;
};

/**
 * Group crates by parent and sort each group.
 *
 * The sort follows the crate-sort control: library order, name, or date
 * added. A missing parent is grouped under 0 so those crates still appear.
 * Does not write the database or the DOM.
 *
 * @returns Parent id to ordered child crates.
 */
function childLists() {
  const children = new Map<number | null, Crate[]>();
  for (const crate of state.crates) {
    const key = crate.parent ?? 0;
    if (!children.has(key)) children.set(key, []);
    const bucket = children.get(key);
    bucket!.push(crate);
  }
  for (const list of children.values()) {
    list.sort((a: Crate, b: Crate) => {
      if (state.crateSort === "name") {
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id - b.id;
      }
      if (state.crateSort === "added") return (b.added || 0) - (a.added || 0) || a.id - b.id;
      return (a.order as number) - (b.order as number) || a.id - b.id;
    });
  }
  return children;
}

/**
 * Return the crates that match the crate search, plus their parents.
 *
 * Parents stay so a matching child is not stranded without a path from
 * the root. A cycle in parent ids is stopped by the guard set. Null means
 * the search box is empty and every crate may show. Does not write.
 *
 * @returns Crate ids to keep, or null when there is no query.
 */
function crateKeep() {
  const terms = state.crateQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return null;
  const byId = new Map(state.crates.map((crate) => [crate.id, crate]));
  const keep = new Set<number>();
  for (const crate of state.crates) {
    if (!terms.every((term) => crate.name.toLocaleLowerCase().includes(term))) continue;
    let current: Crate | undefined = crate;
    const guard = new Set<number>();
    // guard stops a parent cycle from walking the same crate forever.
    while (current && !guard.has(current.id)) {
      guard.add(current.id);
      keep.add(current.id);
      current = byId.get(current.parent as number);
    }
  }
  return keep;
}

/**
 * Flatten the crate tree in the order the rail should show.
 *
 * A crate search expands every matching branch. Otherwise only crates
 * whose parent is in state.expanded are walked. Crates whose parent is
 * missing from the payload are listed at the root so they are not hidden.
 *
 * @returns Crates with depth and childCount set for the rail.
 */
export function visibleCrates() {
  const children = childLists();
  const keep = crateKeep();
  const ordered: Crate[] = [];
  const seen = new Set<number>();
  /**
   * Append one parent's visible children, then their open descendants.
   *
   * Nested inside visibleCrates. Skips an id already seen so a cycle cannot
   * recurse forever. Does not touch the database.
   *
   * @param parent Parent crate id, or the space root id.
   * @param depth Indent level, starting at 0 under the space root.
   */
  function walk(parent: number | null, depth: number) {
    for (const crate of children.get(parent) || []) {
      if (seen.has(crate.id)) continue;
      if (keep && !keep.has(crate.id)) continue;
      seen.add(crate.id);
      crate.depth = depth;
      crate.childCount = (children.get(crate.id) || []).filter((child) => !keep || keep.has(child.id)).length;
      ordered.push(crate);
      if (keep || state.expanded.has(crate.id)) walk(crate.id, depth + 1);
    }
  }
  walk(state.rootId ?? null, 0);
  for (const crate of state.crates) {
    if (seen.has(crate.id)) continue;
    if (keep && !keep.has(crate.id)) continue;
    const parentListed = state.crates.some((item) => item.id === crate.parent);
    if (parentListed) continue;
    seen.add(crate.id);
    crate.depth = 0;
    crate.childCount = (children.get(crate.id) || []).filter((child) => !keep || keep.has(child.id)).length;
    ordered.push(crate);
    if (keep || state.expanded.has(crate.id)) walk(crate.id, 1);
  }
  return ordered;
}

/**
 * Find the visible ancestor of a crate the search has hidden.
 *
 * The rail marks that ancestor so the selection is not lost while the
 * child is filtered out. Returns null when the selection is All tracks
 * or the selected crate is already visible.
 *
 * @param visible Crates currently listed.
 * @returns Visible ancestor id, or null.
 */
function hiddenSelectionHolder(visible: Crate[]) {
  if (state.activeCrate === "all") return null;
  if (visible.some((crate) => crate.id === state.activeCrate)) return null;
  const byId = new Map(state.crates.map((crate) => [crate.id, crate]));
  const visibleIds = new Set(visible.map((crate) => crate.id));
  let crate = byId.get(state.activeCrate);
  const guard = new Set<number>();
  while (crate && !guard.has(crate.id)) {
    guard.add(crate.id);
    crate = byId.get(crate.parent as number);
    if (crate && visibleIds.has(crate.id)) return crate.id;
  }
  return null;
}

function trackMatchesSearch(track: Track): boolean {
  const query = parseQuery(state.query);
  const field = isTextSearchField(state.searchField) ? state.searchField : undefined;
  return matchesQuery(track, query, field);
}

function railRow(
  crate: {
    id: CrateId;
    name: string;
    depth: number;
    childCount: number;
    smart: boolean;
    parent: number | null;
    color: number | string | null;
    count: number;
    holds: boolean;
  },
  panes: { a: CrateId; b: CrateId | null },
): CrateRailRow {
  const expanded = crate.childCount > 0 && (state.crateQuery ? true : state.expanded.has(crate.id));
  return {
    ...crate,
    expanded,
    selected: crate.id === panes.a || crate.id === panes.b,
    pane: railMark(crate.id, panes.a, panes.b),
  };
}

/**
 * Rows the crate rail paints, including All tracks.
 *
 * Counts follow the track search. A crate search still uses visibleCrates.
 * Does not write.
 *
 * @returns Rail rows in display order.
 */
export function crateRailRows(): CrateRailRow[] {
  const query = parseQuery(state.query);
  const matched = query.terms.length || query.filters.length
    ? new Set(state.tracks.filter(trackMatchesSearch).map((track) => track.id))
    : null;
  const crates = visibleCrates();
  const holder = hiddenSelectionHolder(crates);
  const split = state.splitCrates && state.mode === "crates";
  const panes = paneCrates(state.activeCrate, state.secondCrate, split);
  const rows: CrateRailRow[] = [
    railRow({
      id: "all",
      name: t("crates.allTracks"),
      depth: 0,
      childCount: 0,
      smart: false,
      parent: null,
      color: null,
      count: matched ? matched.size : state.tracks.length,
      holds: false,
    }, panes),
  ];
  for (const crate of crates) {
    const members = state.crateTracks.get(crate.id) || new Set();
    let shown = members.size;
    if (matched) {
      shown = 0;
      for (const id of members) if (matched.has(id)) shown += 1;
    }
    rows.push(railRow({
      id: crate.id,
      name: crate.name,
      depth: crate.depth || 0,
      childCount: crate.childCount || 0,
      smart: Boolean(crate.smart),
      parent: crate.parent ?? null,
      color: crate.color ?? null,
      count: shown,
      holds: holder === crate.id,
    }, panes));
  }
  return rows;
}
