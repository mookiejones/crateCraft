/**
 * Hidden host that proves ThemeProvider loaded the mapped colorway.
 *
 * Not a visible restyle. Tests and Settings appearance read the
 * data attributes. The wizard IIFE does not mount this.
 */

import { useTheme } from "@mui/material/styles";
import { useSettings } from "../containers/SettingsContext";

/**
 * Paint a hidden span with the live MUI palette.
 */
export function MuiThemeProof() {
  const theme = useTheme();
  const { colorway } = useSettings();
  return (
    <span
      id="mui-theme-proof"
      hidden
      data-colorway={colorway}
      data-primary={theme.palette.primary.main}
      data-mode={theme.palette.mode}
    />
  );
}
