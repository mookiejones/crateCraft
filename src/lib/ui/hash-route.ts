/**
 * Compact URL hash for the open space, view, and crate.
 *
 * `#library/crates` is All tracks. `#library/crates/12` is crate 12.
 * `#video/history` is History in Serato Video. The page writes this with
 * history.pushState so a click does not reload. Back and Forward restore
 * the same screen. Nothing here fetches or writes the library.
 */

import { NAV_GROUPS, type ViewMode } from "./nav";

export interface HashRoute {
  /** Null keeps the space already on the page. */
  space: string | null;
  mode: ViewMode;
  crate: number | "all";
}

const SPACE_SLUGS: Readonly<Record<string, string>> = {
  library: "Serato Library",
  video: "Serato Video",
  "apple-music": "Apple Music",
  prepare: "Prepare",
};

const SPACE_TO_SLUG: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SPACE_SLUGS).map(([slug, space]) => [space, slug]),
);

const VIEW_MODES = new Set<string>(NAV_GROUPS.flatMap((group) => [...group.modes]));

/**
 * Return true when the id is a rail view.
 *
 * @param mode Candidate view id.
 * @returns {boolean} True for crates, history, and the other rail views.
 */
export function isViewMode(mode: string): mode is ViewMode {
  return VIEW_MODES.has(mode);
}

/**
 * Build `#space/view` or `#space/view/crateId`.
 *
 * All tracks omits the crate. An unknown space slug becomes library.
 * An unknown view becomes crates.
 *
 * @param space Library space name.
 * @param mode View id.
 * @param crate Crate id, or all.
 * @returns {string} Hash including the leading #.
 */
export function formatHash(space: string, mode: string, crate: number | "all"): string {
  const slug = SPACE_TO_SLUG[space] ?? "library";
  const view = isViewMode(mode) ? mode : "crates";
  if (crate === "all" || typeof crate !== "number" || !Number.isInteger(crate) || crate < 0) {
    return `#${slug}/${view}`;
  }
  return `#${slug}/${view}/${crate}`;
}

/**
 * Read a hash into space, view, and crate.
 *
 * Empty or junk opens Crates with All tracks. A missing space slug leaves
 * space null so the caller keeps the current space. An unknown view in a
 * known space still opens Crates. A non-numeric crate id keeps the view
 * and opens All tracks.
 *
 * @param hash location.hash, with or without #.
 * @returns {HashRoute} Parsed route.
 */
export function parseHash(hash: string): HashRoute {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return { space: null, mode: "crates", crate: "all" };
  const parts = raw.split("/").filter((part) => part.length > 0);
  if (parts.length === 0 || parts.length > 3) {
    return { space: null, mode: "crates", crate: "all" };
  }

  let space: string | null = null;
  let rest = parts;
  const first = parts[0] ?? "";
  if (first in SPACE_SLUGS) {
    space = SPACE_SLUGS[first] ?? null;
    rest = parts.slice(1);
  } else if (!isViewMode(first)) {
    if (parts.length >= 2 && isViewMode(parts[1] ?? "")) {
      rest = parts.slice(1);
    } else {
      return { space: null, mode: "crates", crate: "all" };
    }
  }

  if (rest.length === 0) return { space, mode: "crates", crate: "all" };
  const modePart = rest[0] ?? "";
  if (!isViewMode(modePart)) return { space, mode: "crates", crate: "all" };
  const cratePart = rest[1];
  if (cratePart == null || cratePart === "") return { space, mode: modePart, crate: "all" };
  if (!/^\d+$/.test(cratePart)) return { space, mode: modePart, crate: "all" };
  return { space, mode: modePart, crate: Number(cratePart) };
}

/**
 * True when two routes name the same screen.
 *
 * Null space matches null space only.
 *
 * @param a First route.
 * @param b Second route.
 * @returns {boolean} True when space, view, and crate agree.
 */
export function sameRoute(a: HashRoute, b: HashRoute): boolean {
  return a.space === b.space && a.mode === b.mode && a.crate === b.crate;
}

/**
 * Write the hash without reloading.
 *
 * replace true uses replaceState (first load, canonicalize). False uses
 * pushState so Back walks the click. A hash already on the location is
 * left alone.
 *
 * @param hash Hash including #.
 * @param replace Use replaceState when true.
 * @returns {void}
 */
export function writeHash(hash: string, replace: boolean): void {
  const next = hash.startsWith("#") ? hash : `#${hash}`;
  if (location.hash === next) return;
  const url = new URL(location.href);
  url.hash = next;
  const target = `${url.pathname}${url.search}${url.hash}`;
  if (replace) history.replaceState(history.state, "", target);
  else history.pushState(history.state, "", target);
}
