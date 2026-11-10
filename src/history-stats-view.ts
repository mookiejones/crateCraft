/**
 * Pure helpers for the play-stats period and CSV URL.
 *
 * Unix seconds match GET /api/history-stats. Custom dates are local
 * midnight. The exclusive end is the next local midnight.
 */

export const IDLE_DAYS_DEFAULT = 365;
export const IDLE_DAYS_MAX = 3650;

export type StatsPeriod = "all" | "7" | "30" | "90" | "365" | "custom";

export interface StatsRange {
  start: number | null;
  end: number | null;
}

const DAY = 86_400;
const PERIODS = new Set<string>(["all", "7", "30", "90", "365", "custom"]);

/**
 * Return whether a select value is a known period.
 *
 * @param value Option value from #stats-period.
 * @returns True for a shipped period.
 */
export function isStatsPeriod(value: string): value is StatsPeriod {
  return PERIODS.has(value);
}

/**
 * Parse a YYYY-MM-DD date as local midnight, Unix seconds.
 *
 * @param iso Date field value.
 * @returns Seconds, or null when the text is not a date.
 */
export function dayStartUnix(iso: string): number | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!parts) return null;
  const stamp = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])).getTime();
  if (Number.isNaN(stamp)) return null;
  return Math.floor(stamp / 1000);
}

/**
 * Parse a YYYY-MM-DD date as the next local midnight, Unix seconds.
 *
 * @param iso Date field value.
 * @returns Exclusive end, or null when the text is not a date.
 */
export function dayAfterUnix(iso: string): number | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!parts) return null;
  const stamp = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]) + 1).getTime();
  if (Number.isNaN(stamp)) return null;
  return Math.floor(stamp / 1000);
}

/**
 * Return the [from, to) range for a period control.
 *
 * @param period Selected period.
 * @param from Custom start date, YYYY-MM-DD.
 * @param to Custom last date, YYYY-MM-DD.
 * @param nowMs Clock in milliseconds.
 * @returns Unix seconds, or null for an open end.
 */
export function periodRange(period: StatsPeriod, from: string, to: string, nowMs: number): StatsRange {
  if (period === "all") return { start: null, end: null };
  if (period !== "custom") {
    const end = Math.floor(nowMs / 1000);
    return { start: end - Number(period) * DAY, end };
  }
  return { start: dayStartUnix(from), end: dayAfterUnix(to) };
}

/**
 * Return idle_days from the number field, or the default.
 *
 * @param raw Input value.
 * @returns 1 to 3650, otherwise 365.
 */
export function idleDaysFromInput(raw: string): number {
  if (!/^\d{1,4}$/.test(raw.trim())) return IDLE_DAYS_DEFAULT;
  const value = Number(raw.trim());
  if (value < 1 || value > IDLE_DAYS_MAX) return IDLE_DAYS_DEFAULT;
  return value;
}

/**
 * Build the query string for GET /api/history-stats.
 *
 * @param space Open space.
 * @param range Period bounds.
 * @param idleDays Idle cutoff.
 * @returns Query without a leading ?.
 */
export function statsQuery(space: string, range: StatsRange, idleDays: number): string {
  const query = new URLSearchParams({ space });
  if (range.start != null) query.set("from", String(range.start));
  if (range.end != null) query.set("to", String(range.end));
  if (idleDays !== IDLE_DAYS_DEFAULT) query.set("idle_days", String(idleDays));
  return query.toString();
}

/**
 * Return the CSV download path for the same query.
 *
 * @param query Result of statsQuery.
 * @returns /api/history-stats.csv?...
 */
export function csvHref(query: string): string {
  return query ? `/api/history-stats.csv?${query}` : "/api/history-stats.csv";
}
