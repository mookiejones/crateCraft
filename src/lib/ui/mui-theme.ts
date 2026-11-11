/**
 * MUI palette mapped from crateCraft colorways.
 *
 * Hex values copy `static/tokens.css`. That file stays the source of
 * truth for the page. This map exists so tests can assert the theme
 * without loading CSS. Classic uses light mode so manila paper keeps
 * dark text.
 */

import { createTheme, type Theme } from "@mui/material/styles";

export const COLORWAY_PALETTES = {
  "serato-like": {
    mode: "dark",
    bg: "#111111",
    paper: "#242424",
    text: "#f0f0f0",
    muted: "#b8b8b8",
    border: "#3d3d3d",
    primary: "#ff6a00",
    danger: "#ff6b6b",
    onPrimary: "#111111",
  },
  "dark-club": {
    mode: "dark",
    bg: "#050508",
    paper: "#14141e",
    text: "#f5f7ff",
    muted: "#b8c0d4",
    border: "#2a2a3a",
    primary: "#3df0c8",
    danger: "#ff6b8a",
    onPrimary: "#050508",
  },
  light: {
    mode: "light",
    bg: "#ebe4d6",
    paper: "#fffaf2",
    text: "#1b140e",
    muted: "#5c5348",
    border: "#d9cfbf",
    primary: "#c42f10",
    danger: "#a33a32",
    onPrimary: "#fffaf2",
  },
  classic: {
    mode: "light",
    bg: "#231910",
    paper: "#f3ecdf",
    text: "#1b140e",
    muted: "#6a6057",
    border: "#d9cfbf",
    primary: "#e23b16",
    danger: "#a33a32",
    onPrimary: "#f3ecdf",
  },
} as const;

export type ThemedColorway = keyof typeof COLORWAY_PALETTES;

function isThemedColorway(value: string): value is ThemedColorway {
  return Object.hasOwn(COLORWAY_PALETTES, value);
}

/**
 * Build an MUI theme for a saved colorway.
 *
 * An unknown id uses Serato-like, the same fallback as the picker.
 *
 * @param colorway Saved colorway id, or anything else.
 * @returns A theme whose palette matches `tokens.css`.
 */
export function createAppTheme(colorway: string): Theme {
  const id = isThemedColorway(colorway) ? colorway : "serato-like";
  const colors = COLORWAY_PALETTES[id];
  return createTheme({
    palette: {
      mode: colors.mode,
      primary: {
        main: colors.primary,
        contrastText: colors.onPrimary,
      },
      error: {
        main: colors.danger,
      },
      background: {
        default: colors.bg,
        paper: colors.paper,
      },
      text: {
        primary: colors.text,
        secondary: colors.muted,
      },
      divider: colors.border,
    },
  });
}
