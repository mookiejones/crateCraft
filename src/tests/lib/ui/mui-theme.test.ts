/**
 * MUI palette matches the four colorways in tokens.css.
 */

import { describe, expect, it } from "vitest";
import { COLORWAY_PALETTES, createAppTheme } from "../../../lib/ui/mui-theme";

describe("createAppTheme", () => {
  it("shares the page typography across all colorways", () => {
    for (const colorway of Object.keys(COLORWAY_PALETTES)) {
      const theme = createAppTheme(colorway);
      expect(theme.typography.fontFamily).toContain("Familjen Grotesk");
      expect(theme.typography.button.textTransform).toBe("none");
      expect(theme.typography.fontSize).toBe(13);
    }
  });

  it("maps Serato-like to a dark orange palette", () => {
    const theme = createAppTheme("serato-like");
    const colors = COLORWAY_PALETTES["serato-like"];
    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.primary.main).toBe(colors.primary);
    expect(theme.palette.primary.contrastText).toBe(colors.onPrimary);
    expect(theme.palette.error.main).toBe(colors.danger);
    expect(theme.palette.background.default).toBe(colors.bg);
    expect(theme.palette.background.paper).toBe(colors.paper);
    expect(theme.palette.text.primary).toBe(colors.text);
    expect(theme.palette.text.secondary).toBe(colors.muted);
    expect(theme.palette.divider).toBe(colors.border);
  });

  it("maps dark-club, light, and classic", () => {
    const club = createAppTheme("dark-club");
    expect(club.palette.mode).toBe("dark");
    expect(club.palette.primary.main).toBe("#3df0c8");
    expect(club.palette.background.default).toBe("#050508");

    const light = createAppTheme("light");
    expect(light.palette.mode).toBe("light");
    expect(light.palette.primary.main).toBe("#c42f10");
    expect(light.palette.background.paper).toBe("#fffaf2");

    const classic = createAppTheme("classic");
    expect(classic.palette.mode).toBe("light");
    expect(classic.palette.primary.main).toBe("#e23b16");
    expect(classic.palette.background.paper).toBe("#f3ecdf");
    expect(classic.palette.background.default).toBe("#231910");
  });

  it("falls back to Serato-like for an unknown id", () => {
    const theme = createAppTheme("house");
    expect(theme.palette.primary.main).toBe(COLORWAY_PALETTES["serato-like"].primary);
    expect(theme.palette.mode).toBe("dark");
  });
});
