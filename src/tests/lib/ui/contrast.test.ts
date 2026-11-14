/**
 * New chrome contrast meets WCAG AA on paper for every colorway.
 */

import { describe, expect, it } from "vitest";
import { contrastRatio } from "../../../lib/ui/contrast";
import { COLORWAY_PALETTES } from "../../../lib/ui/mui-theme";

describe("colorway contrast", () => {
  it("keeps body and muted text at AA on paper", () => {
    for (const [id, colors] of Object.entries(COLORWAY_PALETTES)) {
      expect(contrastRatio(colors.text, colors.paper), `${id} text/paper`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.muted, colors.paper), `${id} muted/paper`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the focus color at 3:1 on paper", () => {
    for (const [id, colors] of Object.entries(COLORWAY_PALETTES)) {
      expect(contrastRatio(colors.primary, colors.paper), `${id} primary/paper`).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps More ink at AA on the rail and the sheet", () => {
    const rail: Record<string, { ink: string; bg: string }> = {
      "serato-like": { ink: "#cfcfcf", bg: "#111111" },
      "dark-club": { ink: "#b8c0d4", bg: "#050508" },
      light: { ink: "#4a4238", bg: "#ebe4d6" },
      classic: { ink: "#cbbba6", bg: "#231910" },
    };
    for (const [id, pair] of Object.entries(rail)) {
      const colors = COLORWAY_PALETTES[id as keyof typeof COLORWAY_PALETTES];
      expect(contrastRatio(pair.ink, pair.bg), `${id} more/rail`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(colors.text, colors.paper), `${id} more/sheet`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
