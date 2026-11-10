/**
 * Five rail primaries, with children only for the open parent.
 *
 * Music, Organize files, Health, Backups, and Gig live
 * in #views. Children of a parent with more than one view sit in
 * #view-children at the top of the sheet. A parent with one child hides
 * that strip. The last child per parent is remembered for the session.
 */

import { t, type MessageKey } from "./i18n";

export type NavGroupId = "library" | "files" | "health" | "backups" | "gig";

export type ViewMode =
  | "crates"
  | "history"
  | "stats"
  | "files"
  | "health"
  | "missing"
  | "duplicates"
  | "stems"
  | "scan"
  | "bitrate"
  | "tags"
  | "snapshots"
  | "gig"
  | "portable"
  | "drift";

export interface NavGroup {
  id: NavGroupId;
  labelKey: MessageKey;
  modes: readonly ViewMode[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  { id: "library", labelKey: "view.group.library", modes: ["crates", "history", "stats"] },
  { id: "files", labelKey: "view.files", modes: ["files"] },
  { id: "health", labelKey: "view.group.health", modes: ["health", "missing", "duplicates", "stems", "scan", "bitrate", "tags"] },
  { id: "backups", labelKey: "view.snapshots", modes: ["snapshots"] },
  { id: "gig", labelKey: "view.group.gig", modes: ["gig", "portable", "drift"] },
];

const lastMode: Partial<Record<NavGroupId, ViewMode>> = {};

function groupOf(id: string): NavGroup {
  return NAV_GROUPS.find((group) => group.id === id) ?? NAV_GROUPS[0]!;
}

/**
 * Return the rail parent that owns this view.
 *
 * An unknown view maps to Library so a stale mode still paints a primary.
 *
 * @param mode View id from a tab or setMode.
 * @returns {NavGroupId} Parent id.
 */
export function groupForMode(mode: string): NavGroupId {
  const group = NAV_GROUPS.find((item) => item.modes.includes(mode as ViewMode));
  return group?.id ?? "library";
}

/**
 * Remember the open child of its parent for this session.
 *
 * An unknown view is ignored. Does not paint.
 *
 * @param mode View id.
 * @returns {void}
 */
export function rememberMode(mode: string): void {
  const group = NAV_GROUPS.find((item) => item.modes.includes(mode as ViewMode));
  if (!group) return;
  lastMode[group.id] = mode as ViewMode;
}

/**
 * Return the view a primary should open.
 *
 * Uses the last child of that parent in this session, or the first child.
 *
 * @param id Parent id from data-nav.
 * @returns {ViewMode} View to pass to setMode.
 */
export function modeForGroup(id: string): ViewMode {
  const group = groupOf(id);
  const remembered = lastMode[group.id];
  if (remembered && group.modes.includes(remembered)) return remembered;
  return group.modes[0]!;
}

/**
 * Forget remembered children. Tests call this in beforeEach.
 *
 * @returns {void}
 */
export function resetNav(): void {
  for (const key of Object.keys(lastMode) as NavGroupId[]) delete lastMode[key];
}

/**
 * Mark the open primary and show only that parent's children.
 *
 * A parent with one child hides #view-children. Missing nodes are skipped
 * so a test document without the sheet still runs.
 *
 * @param mode Open view id.
 * @returns {void}
 */
export function paintNav(mode: string): void {
  const groupId = groupForMode(mode);
  const group = groupOf(groupId);
  const views = document.getElementById("views");
  if (views) {
    for (const button of views.querySelectorAll<HTMLButtonElement>("[data-nav]")) {
      button.setAttribute("aria-selected", String(button.dataset.nav === groupId));
    }
  }
  const strip = document.getElementById("view-children");
  if (!(strip instanceof HTMLElement)) return;
  const showStrip = group.modes.length > 1;
  strip.hidden = !showStrip;
  strip.setAttribute("aria-label", t(group.labelKey));
  for (const button of strip.querySelectorAll<HTMLButtonElement>("[data-view]")) {
    const view = button.dataset.view ?? "";
    const inGroup = group.modes.includes(view as ViewMode);
    button.hidden = !inGroup;
    button.setAttribute("aria-selected", String(view === mode));
  }
}
