/**
 * WCAG relative luminance and contrast.
 *
 * Hex values match `COLORWAY_PALETTES` / `tokens.css`. New chrome must
 * meet AA: 4.5:1 for text, 3:1 for UI and focus. Does not rewrite tokens.
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Relative luminance of a 6-digit hex color.
 *
 * @param hex `#rrggbb`.
 * @returns 0 to 1.
 */
export function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Need a 6-digit hex color, got ${hex}`);
  }
  const n = Number.parseInt(value, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Contrast ratio of two hex colors.
 *
 * @param a First `#rrggbb`.
 * @param b Second `#rrggbb`.
 * @returns Ratio at least 1.
 */
export function contrastRatio(a: string, b: string): number {
  const left = relativeLuminance(a);
  const right = relativeLuminance(b);
  const hi = Math.max(left, right);
  const lo = Math.min(left, right);
  return (hi + 0.05) / (lo + 0.05);
}
