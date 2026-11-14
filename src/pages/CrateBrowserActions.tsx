/**
 * Split, Save view, and Export under More in the track-sheet bar.
 *
 * The host is `#crate-browser-actions`. Import, Rekordbox, and Reload
 * stay in the markup. Overflow items keep the desktop-menu ids.
 * `.browser-actions .MuiButton-root` unsets min-height so the native
 * 36px rule does not pin them. Split stays a MenuItem with
 * `aria-pressed`.
 */

import { CrateOverflowMenu } from "../components/CrateOverflowMenu";
import { useCrates } from "../containers/CrateContext";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";

/**
 * Split, Save view, and M3U Export under More.
 */
export function CrateBrowserActions() {
  const crates = useCrates();
  return (
    <CrateOverflowMenu
      buttonId="crate-browser-more"
      menuId="crate-browser-menu"
      moreTip={tips.crateBrowserMore}
      moreLabel={t("crates.moreList")}
      ink="sheet"
      items={[
        {
          id: "crate-split",
          label: t("crates.split"),
          tip: tips.crateSplit,
          hidden: crates.splitHidden,
          ariaPressed: crates.splitPressed,
          onClick: () => crates.split(),
        },
        {
          id: "crate-save-view",
          label: t("crates.saveView"),
          tip: tips.crateSaveView,
          hidden: crates.saveViewHidden,
          disabled: !crates.canSaveView,
          onClick: () => crates.saveView(),
        },
        {
          id: "export-m3u",
          label: t("export.m3u"),
          tip: tips.exportM3u,
          hidden: crates.exportHidden,
          onClick: () => crates.exportM3u(),
        },
      ]}
    />
  );
}
