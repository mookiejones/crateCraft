/**
 * Split, Save view, and Export painted by React.
 *
 * The host is `#crate-browser-actions` in the track-sheet bar. Import,
 * Rekordbox, and Reload stay in the markup. Outlined MUI Buttons match
 * HealthListChrome. Split stays a Button with `aria-pressed`.
 */

import Button from "@mui/material/Button";
import { useCrates } from "../containers/CrateContext";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * Split, Save view, and M3U Export.
 */
export function CrateBrowserActions() {
  const crates = useCrates();
  return (
    <>
      <Button
        id="crate-split"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateSplit)}
        hidden={crates.splitHidden}
        aria-pressed={crates.splitPressed}
        onClick={() => crates.split()}
      >
        {t("crates.split")}
      </Button>
      <Button
        id="crate-save-view"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateSaveView)}
        hidden={crates.saveViewHidden}
        disabled={!crates.canSaveView}
        onClick={() => crates.saveView()}
      >
        {t("crates.saveView")}
      </Button>
      <Button
        id="export-m3u"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.exportM3u)}
        hidden={crates.exportHidden}
        onClick={() => crates.exportM3u()}
      >
        {t("export.m3u")}
      </Button>
    </>
  );
}
