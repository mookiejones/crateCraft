/**
 * Genre-family map helpers for Tag spellings (#365).
 *
 * The server owns the map. These functions only group what GET returned
 * and name the parents a move is allowed to use.
 */

export interface GenreFamilyChild {
  name: string;
  tracks: number;
}

export interface GenreFamily {
  name: string;
  tracks: number;
  children: GenreFamilyChild[];
}

export interface GenreFamilyReport {
  parents: Record<string, string | null>;
  families: GenreFamily[];
  saved: boolean;
}

export interface GenreNoteChange {
  id: number;
  from: string;
  to: string;
}

export interface GenreNotePlan {
  field: "grouping" | "comments";
  changes: GenreNoteChange[];
  blocked: GenreNoteChange[];
  written: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Genres that cannot become the parent of `genre`, including itself.
 *
 * @param parents Genre spelling to parent spelling, or null for a root.
 * @param genre The genre that would move.
 * @returns That genre and every genre that rolls up through it.
 */
export function descendantSet(
  parents: Readonly<Record<string, string | null>>,
  genre: string,
): Set<string> {
  const children = new Map<string, string[]>();
  for (const [name, parent] of Object.entries(parents)) {
    if (parent == null) continue;
    const list = children.get(parent);
    if (list) list.push(name);
    else children.set(parent, [name]);
  }
  const blocked = new Set<string>();
  const stack = [genre];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current == null || blocked.has(current)) continue;
    blocked.add(current);
    const next = children.get(current);
    if (next) stack.push(...next);
  }
  return blocked;
}

/**
 * Parents a genre may move under.
 *
 * The genre itself and its descendants are left out, so a family cannot
 * sit under itself. Unknown genres have nowhere to move.
 *
 * @param parents Genre spelling to parent spelling, or null for a root.
 * @param genre The genre that would move.
 * @returns Other genres, sorted for a select list.
 */
export function moveTargets(
  parents: Readonly<Record<string, string | null>>,
  genre: string,
): string[] {
  if (!(genre in parents)) return [];
  const blocked = descendantSet(parents, genre);
  return Object.keys(parents)
    .filter((name) => !blocked.has(name))
    .sort((left, right) => left.localeCompare(right));
}

function parseParents(value: unknown): Record<string, string | null> | null {
  if (!isRecord(value)) return null;
  const parents: Record<string, string | null> = {};
  for (const [genre, parent] of Object.entries(value)) {
    if (!genre.trim()) return null;
    if (parent === null) parents[genre] = null;
    else if (typeof parent === "string" && parent.trim()) parents[genre] = parent;
    else return null;
  }
  return parents;
}

function parseChild(value: unknown): GenreFamilyChild | null {
  if (!isRecord(value) || typeof value.name !== "string") return null;
  const tracks = value.tracks;
  if (typeof tracks !== "number" || !Number.isFinite(tracks)) return null;
  return { name: value.name, tracks };
}

/**
 * Read a GET /api/genre-families body.
 *
 * @param value The decoded JSON.
 * @returns The report, or null when the shape is not the one this page paints.
 */
export function parseReport(value: unknown): GenreFamilyReport | null {
  if (!isRecord(value)) return null;
  const parents = parseParents(value.parents);
  if (!parents || !Array.isArray(value.families)) return null;
  const families: GenreFamily[] = [];
  for (const item of value.families) {
    if (!isRecord(item) || typeof item.name !== "string") return null;
    const tracks = item.tracks;
    if (typeof tracks !== "number" || !Number.isFinite(tracks) || !Array.isArray(item.children)) {
      return null;
    }
    const children: GenreFamilyChild[] = [];
    for (const child of item.children) {
      const parsed = parseChild(child);
      if (!parsed) return null;
      children.push(parsed);
    }
    families.push({ name: item.name, tracks, children });
  }
  return { parents, families, saved: value.saved === true };
}

function parseChanges(value: unknown): GenreNoteChange[] | null {
  if (!Array.isArray(value)) return null;
  const changes: GenreNoteChange[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "number" || typeof item.from !== "string" || typeof item.to !== "string") {
      return null;
    }
    changes.push({ id: item.id, from: item.from, to: item.to });
  }
  return changes;
}

/**
 * Read a write-preview or write-apply body.
 *
 * @param value The decoded JSON.
 * @returns The plan, or null when the shape is not a note plan.
 */
export function parsePlan(value: unknown): GenreNotePlan | null {
  if (!isRecord(value)) return null;
  const field = value.field;
  if (field !== "grouping" && field !== "comments") return null;
  const changes = parseChanges(value.changes);
  const blocked = parseChanges(value.blocked);
  if (!changes || !blocked) return null;
  return { field, changes, blocked, written: value.written === true };
}

/**
 * Load the families for one space.
 *
 * @param space Serato space name.
 * @param signal Aborts the request when the section unmounts.
 * @returns The report.
 */
export async function fetchFamilies(space: string, signal?: AbortSignal): Promise<GenreFamilyReport> {
  const init: RequestInit = signal ? { signal } : {};
  const response = await fetch(`/api/genre-families?space=${encodeURIComponent(space)}`, init);
  const payload: unknown = await response.json();
  const report = parseReport(payload);
  if (!response.ok || !report) {
    const message = isRecord(payload) && typeof payload.error === "string" ? payload.error : "";
    throw new Error(message);
  }
  return report;
}
