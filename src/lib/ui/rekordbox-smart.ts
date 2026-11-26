/**
 * Rekordbox smart-crate rows for the export dialog.
 *
 * The report fetch is read-only. This module only shapes that JSON
 * and the `frozen` query. It does not download the file.
 */

export type SmartClass = "exact" | "approximate" | "impossible";

export type SmartRuleRow = {
  label: string;
  classification: SmartClass;
};

export type SmartCrateStatus = "rules" | "empty" | "unreadable";

export type SmartCrateRow = {
  id: number;
  name: string;
  frozen: boolean;
  storedCount: number;
  writtenCount: number;
  mismatch: boolean;
  status: SmartCrateStatus;
  rules: SmartRuleRow[];
};

/**
 * Build the `frozen` query suffix for the current choice.
 *
 * Null omits the parameter, which freezes every smart crate. An empty
 * set sends `frozen=none`. Otherwise the ids are sorted and joined.
 *
 * @param choice Null until the person changes a box.
 * @returns Empty, `&frozen=none`, or `&frozen=` plus ids.
 */
export function frozenParam(choice: ReadonlySet<number> | null): string {
  if (choice === null) return "";
  if (choice.size === 0) return "&frozen=none";
  const ids = [...choice].sort((left, right) => left - right);
  return `&frozen=${ids.join(",")}`;
}

/**
 * Apply one checkbox to the set of crates that stay frozen.
 *
 * A null choice means every crate the server marked frozen. The result
 * is always an explicit set, including an empty set.
 *
 * @param choice Current choice, or null when the query omits `frozen`.
 * @param crates Rows from the last report.
 * @param id Crate whose box changed.
 * @param frozen True when that box is checked.
 * @returns The ids that should stay frozen.
 */
export function nextFrozenChoice(
  choice: ReadonlySet<number> | null,
  crates: readonly Pick<SmartCrateRow, "id" | "frozen">[],
  id: number,
  frozen: boolean,
): Set<number> {
  const next = new Set(
    choice ?? crates.filter((crate) => crate.frozen).map((crate) => crate.id),
  );
  if (frozen) next.add(id);
  else next.delete(id);
  return next;
}

function smartClass(value: unknown): SmartClass | null {
  if (value === "exact" || value === "approximate" || value === "impossible") return value;
  return null;
}

function smartStatus(value: unknown): SmartCrateStatus {
  if (value === "rules" || value === "empty" || value === "unreadable") return value;
  return "unreadable";
}

/**
 * Read `smart_crates` from a report JSON body.
 *
 * A missing or malformed list is empty. One bad row is skipped.
 * Counts stay numbers. The dialog does not invent a class.
 *
 * @param body Parsed JSON, or anything else.
 * @returns Rows the dialog can render.
 */
export function readSmartCrates(body: unknown): SmartCrateRow[] {
  if (!body || typeof body !== "object") return [];
  const raw = (body as { smart_crates?: unknown }).smart_crates;
  if (!Array.isArray(raw)) return [];
  const rows: SmartCrateRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "number" || !Number.isInteger(row.id)) continue;
    if (typeof row.name !== "string" || !row.name) continue;
    const rules: SmartRuleRow[] = [];
    if (Array.isArray(row.rules)) {
      for (const rule of row.rules) {
        if (!rule || typeof rule !== "object") continue;
        const leaf = rule as Record<string, unknown>;
        const classification = smartClass(leaf.classification);
        if (typeof leaf.label !== "string" || !leaf.label || classification === null) continue;
        rules.push({ label: leaf.label, classification });
      }
    }
    rows.push({
      id: row.id,
      name: row.name,
      frozen: row.frozen === true,
      storedCount: typeof row.stored_count === "number" ? row.stored_count : 0,
      writtenCount: typeof row.written_count === "number" ? row.written_count : 0,
      mismatch: row.mismatch === true,
      status: smartStatus(row.status),
      rules,
    });
  }
  return rows;
}
