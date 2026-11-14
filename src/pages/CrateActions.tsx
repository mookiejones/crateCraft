/**
 * Crate action buttons painted by React.
 *
 * New, Rename, and Delete stay on the row. Color, Preset, Sync folder,
 * Rename from tags, and Refresh sit under More. Ids stay the ones the
 * desktop menu and tests click. Tooltips use `tooltip.*` through
 * `setTooltip`. Outlined MUI Buttons, size small.
 */

import Button from "@mui/material/Button";
import { CrateOverflowMenu } from "../components/CrateOverflowMenu";
import { useCrates } from "../containers/CrateContext";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minWidth: 0 };

/**
 * New, rename, delete, and a More menu for the rest.
 */
export function CrateActions() {
  const crates = useCrates();
  return (
    <>
      <Button
        id="crate-new"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateNew)}
        disabled={!crates.canCreate}
        onClick={() => crates.create()}
      >
        {t("crates.new")}
      </Button>
      <Button
        id="crate-rename"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateRename)}
        disabled={!crates.canRename}
        onClick={() => crates.rename()}
      >
        {t("crates.rename")}
      </Button>
      <Button
        id="crate-delete"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateDelete)}
        disabled={!crates.canDelete}
        onClick={() => crates.remove()}
      >
        {t("common.delete")}
      </Button>
      <CrateOverflowMenu
        buttonId="crate-actions-more"
        menuId="crate-actions-menu"
        moreLabel={t("crates.moreActions")}
        items={[
          {
            id: "crate-color",
            label: t("field.color"),
            tip: tips.crateColor,
            disabled: !crates.canColor,
            onClick: () => crates.color(),
          },
          {
            id: "crate-preset",
            label: t("presets.button"),
            tip: tips.cratePreset,
            ariaHasPopup: "dialog",
            disabled: !crates.canPreset,
            onClick: () => crates.preset(),
          },
          {
            id: "crate-folder-sync",
            label: t("folderSync.button"),
            tip: tips.crateFolderSync,
            ariaHasPopup: "dialog",
            disabled: !crates.canFolderSync,
            onClick: () => crates.folderSync(),
          },
          {
            id: "crate-rename-from-tags",
            label: t("files.renameFromTags"),
            tip: tips.crateRenameFromTags,
            ariaHasPopup: "dialog",
            disabled: !crates.canRenameFromTags,
            onClick: (button) => crates.renameFromTags(button),
          },
          {
            id: "crate-refresh",
            label: t("presets.refresh"),
            tip: tips.crateRefresh,
            hidden: crates.refreshHidden,
            disabled: !crates.canRefresh,
            onClick: () => crates.refresh(),
          },
        ]}
      />
    </>
  );
}
