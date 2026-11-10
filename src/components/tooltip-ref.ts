/**
 * Attach a locale tooltip to a React control.
 */

import { setTooltip } from "../tooltip";
import type { TipSpec } from "../tooltip-strings";

/**
 * Ref callback that writes `spec` onto the node.
 *
 * @param spec Locale key and placeholders.
 * @returns Ref for a button, input, or summary.
 */
export function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}
