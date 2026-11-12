/**
 * Files-island bind for the portable drive check.
 *
 * Kept off `portable.ts` so Files can register the mounter without
 * importing the Gig Check-drive page.
 */

let mountIslands: () => void = () => {};

/**
 * Point portable paint at the Files React islands.
 *
 * @param fn Mounts the Files panel and dialogs.
 * @returns {void}
 */
export function bindPortableMount(fn: () => void): void {
  mountIslands = fn;
}

/**
 * Mount the Files islands if a binder was registered.
 *
 * @returns {void}
 */
export function runPortableMount(): void {
  mountIslands();
}
