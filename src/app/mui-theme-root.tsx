/**
 * MUI ThemeProvider for every page island.
 *
 * Colorway comes from the Settings store, not from `html` dataset
 * alone, so a picker change rebuilds the palette in the same turn.
 * CssBaseline stays off so existing page CSS still wins on the DOM.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "../lib/ui/mui-theme";
import { getSettingsState, subscribeSettings } from "../lib/ui/settings";

/**
 * Wrap an island in the colorway-mapped MUI theme.
 *
 * @param children Page island.
 */
export function MuiThemeRoot({ children }: { children: ReactNode }) {
  const [colorway, setColorway] = useState(() => getSettingsState().colorway);
  useEffect(() => {
    return subscribeSettings(() => {
      flushSync(() => {
        setColorway(getSettingsState().colorway);
      });
    });
  }, []);
  const theme = useMemo(() => createAppTheme(colorway), [colorway]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
