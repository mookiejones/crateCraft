/**
 * Notify Library health islands after a report or chrome change.
 *
 * health.ts, scan.ts, tags.ts, and the missing/duplicates chrome call
 * `emitHealth`. `HealthProvider` is the subscriber.
 */

type HealthListener = () => void;

const listeners = new Set<HealthListener>();

/**
 * Run `listener` after each health-group update.
 *
 * @param listener Called from `emitHealth`.
 * @returns Unsubscribe.
 */
export function subscribeHealth(listener: HealthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Tell every health island to read the latest snapshot.
 *
 * @returns {void}
 */
export function emitHealth(): void {
  for (const listener of [...listeners]) listener();
}
