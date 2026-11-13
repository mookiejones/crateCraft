/**
 * Crate action buttons painted by React.
 *
 * Ids stay the ones the desktop menu and tests click. Tooltips use
 * `tooltip.*` through `setTooltip`. Outlined MUI Buttons match
 * HealthListChrome.
 */

import Button from "@mui/material/Button";
import { useCrates } from "../containers/CrateContext";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "../components/tooltip-ref";

const BUTTON_SX = { textTransform: "none" as const, minHeight: 44 };

/**
 * New, rename, color, delete, preset, folder-sync, rename from tags, refresh.
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
        id="crate-color"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateColor)}
        disabled={!crates.canColor}
        onClick={() => crates.color()}
      >
        {t("field.color")}
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
      <Button
        id="crate-preset"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.cratePreset)}
        aria-haspopup="dialog"
        disabled={!crates.canPreset}
        onClick={() => crates.preset()}
      >
        {t("presets.button")}
      </Button>
      <Button
        id="crate-folder-sync"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateFolderSync)}
        aria-haspopup="dialog"
        disabled={!crates.canFolderSync}
        onClick={() => crates.folderSync()}
      >
        {t("folderSync.button")}
      </Button>
      <Button
        id="crate-rename-from-tags"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateRenameFromTags)}
        aria-haspopup="dialog"
        disabled={!crates.canRenameFromTags}
        onClick={(event) => crates.renameFromTags(event.currentTarget)}
      >
        {t("files.renameFromTags")}
      </Button>
      <Button
        id="crate-refresh"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateRefresh)}
        hidden={crates.refreshHidden}
        disabled={!crates.canRefresh}
        onClick={() => crates.refresh()}
      >
        {t("presets.refresh")}
      </Button>
    </>
  );
}
