/**
 * Split, Save view, and Export painted by React.
 *
 * The host is `#crate-browser-actions` in the track-sheet bar. Import,
 * Rekordbox, and Reload stay in the markup.
 */

import { useCrates } from "../containers/CrateContext";
import { t } from "../lib/i18n";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

/**
 * Split, Save view, and M3U Export.
 */
export function CrateBrowserActions() {
  const crates = useCrates();
  return (
    <>
      <button
        id="crate-split"
        type="button"
        ref={tooltipRef(tips.crateSplit)}
        hidden={crates.splitHidden}
        aria-pressed={crates.splitPressed}
        onClick={() => crates.split()}
      >
        {t("crates.split")}
      </button>
      <button
        id="crate-save-view"
        type="button"
        ref={tooltipRef(tips.crateSaveView)}
        hidden={crates.saveViewHidden}
        disabled={!crates.canSaveView}
        onClick={() => crates.saveView()}
      >
        {t("crates.saveView")}
      </button>
      <button
        id="export-m3u"
        type="button"
        ref={tooltipRef(tips.exportM3u)}
        hidden={crates.exportHidden}
        onClick={() => crates.exportM3u()}
      >
        {t("export.m3u")}
      </button>
    </>
  );
}
