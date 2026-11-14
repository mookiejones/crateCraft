/**
 * Reduced-motion preference for hash and overlay motion.
 *
 * Hash writes never use smooth scroll. Overlay CSS kills animation when
 * this is true.
 */

/** Hash and skip targets never use smooth scroll. */
export const HASH_SCROLL: ScrollBehavior = "auto";

/**
 * Return whether the person asked for less motion.
 *
 * @returns True when `(prefers-reduced-motion: reduce)` matches.
 */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function"
    && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
