/**
 * Crate action buttons painted by React.
 *
 * Ids stay the ones the desktop menu and tests click. Tooltips use
 * `tooltip.*` through `setTooltip`.
 */

import { useCrates } from "../context/CrateContext";
import { t } from "../i18n";
import { setTooltip } from "../tooltip";
import { tips, type TipSpec } from "../tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

/**
 * New, rename, color, delete, preset, folder-sync, rename from tags, refresh.
 */
export function CrateActions() {
  const crates = useCrates();
  return (
    <>
      <button
        id="crate-new"
        type="button"
        ref={tooltipRef(tips.crateNew)}
        disabled={!crates.canCreate}
        onClick={() => crates.create()}
      >
        {t("crates.new")}
      </button>
      <button
        id="crate-rename"
        type="button"
        ref={tooltipRef(tips.crateRename)}
        disabled={!crates.canRename}
        onClick={() => crates.rename()}
      >
        {t("crates.rename")}
      </button>
      <button
        id="crate-color"
        type="button"
        ref={tooltipRef(tips.crateColor)}
        disabled={!crates.canColor}
        onClick={() => crates.color()}
      >
        {t("field.color")}
      </button>
      <button
        id="crate-delete"
        type="button"
        ref={tooltipRef(tips.crateDelete)}
        disabled={!crates.canDelete}
        onClick={() => crates.remove()}
      >
        {t("common.delete")}
      </button>
      <button
        id="crate-preset"
        type="button"
        ref={tooltipRef(tips.cratePreset)}
        aria-haspopup="dialog"
        disabled={!crates.canPreset}
        onClick={() => crates.preset()}
      >
        {t("presets.button")}
      </button>
      <button
        id="crate-folder-sync"
        type="button"
        ref={tooltipRef(tips.crateFolderSync)}
        aria-haspopup="dialog"
        disabled={!crates.canFolderSync}
        onClick={() => crates.folderSync()}
      >
        {t("folderSync.button")}
      </button>
      <button
        id="crate-rename-from-tags"
        type="button"
        ref={tooltipRef(tips.crateRenameFromTags)}
        aria-haspopup="dialog"
        disabled={!crates.canRenameFromTags}
        onClick={(event) => crates.renameFromTags(event.currentTarget)}
      >
        {t("files.renameFromTags")}
      </button>
      <button
        id="crate-refresh"
        type="button"
        ref={tooltipRef(tips.crateRefresh)}
        hidden={crates.refreshHidden}
        disabled={!crates.canRefresh}
        onClick={() => crates.refresh()}
      >
        {t("presets.refresh")}
      </button>
    </>
  );
}
