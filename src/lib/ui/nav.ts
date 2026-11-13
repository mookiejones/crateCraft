/**
 * Five primaries, with children only for the open parent.
 *
 * Music, Organize files, Health, Backups, and Gig live
 * in #views. Children of a parent with more than one view sit in
 * #view-children, inserted after that parent button. Mini hides the
 * nested list. A parent with one child hides that strip. The last child
 * per parent is remembered for the session.
 */

import { t, type MessageKey } from "../i18n";

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

const NAV_ICON_PATHS: Record<NavGroupId, string> = {
  library: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  files: "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
  health: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  backups: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z",
  gig: "M7 18h2V6H7v12zm4 4h2V2h-2v20zm-8-8h2v-4H3v4zm12 4h2V8h-2v10zm4-8v4h2v-4h-2z",
};

function drawerIsMini(): boolean {
  return document.getElementById("drawer-toggle")?.getAttribute("aria-expanded") === "false";
}

function ensureNavIcon(button: HTMLElement, groupId: NavGroupId): void {
  if (button.querySelector("svg")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("nav-icon");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", NAV_ICON_PATHS[groupId]);
  path.setAttribute("fill", "currentColor");
  svg.append(path);
  button.prepend(svg);
}

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
 * so a test document without the shell still runs.
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
      const id = button.dataset.nav;
      button.setAttribute("aria-selected", String(id === groupId));
      if (id === "library" || id === "files" || id === "health" || id === "backups" || id === "gig") {
        ensureNavIcon(button, id);
      }
    }
  }
  const strip = document.getElementById("view-children");
  if (!(strip instanceof HTMLElement)) return;
  const selected = views?.querySelector(`[data-nav="${groupId}"]`);
  if (selected instanceof HTMLElement) selected.after(strip);
  const showStrip = group.modes.length > 1 && !drawerIsMini();
  strip.hidden = !showStrip;
  strip.setAttribute("aria-label", t(group.labelKey));
  for (const button of strip.querySelectorAll<HTMLButtonElement>("[data-view]")) {
    const view = button.dataset.view ?? "";
    const inGroup = group.modes.includes(view as ViewMode);
    button.hidden = !inGroup;
    button.setAttribute("aria-selected", String(view === mode));
  }
}
