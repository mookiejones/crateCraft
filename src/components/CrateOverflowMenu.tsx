/**
 * More menu for crate actions that do not fit on the primary row.
 *
 * Items keep the ids native menu and tests click. keepMounted leaves
 * those nodes in the document when the menu is closed. The menu portals
 * so `.rail { overflow: hidden }` does not clip it. Esc and an item
 * click restore focus to More.
 */

import { useState, type MouseEvent } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { tooltipRef } from "./tooltip-ref";
import { t } from "../lib/i18n";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minWidth: 0 };

export type CrateOverflowItem = {
  id: string;
  label: string;
  tip: TipSpec;
  disabled?: boolean;
  hidden?: boolean;
  ariaHasPopup?: "dialog";
  ariaPressed?: boolean;
  onClick: (button: HTMLButtonElement) => void;
};

export type CrateOverflowMenuProps = {
  buttonId: string;
  menuId: string;
  moreTip?: TipSpec;
  items: readonly CrateOverflowItem[];
};

function itemButton(event: MouseEvent<HTMLElement>): HTMLButtonElement {
  const node = event.currentTarget;
  if (!(node instanceof HTMLButtonElement)) {
    throw new Error("crate overflow item is not a button");
  }
  return node;
}

/**
 * Outlined More button and a keepMounted MUI Menu of crate actions.
 */
export function CrateOverflowMenu({
  buttonId,
  menuId,
  moreTip = tips.crateMore,
  items,
}: CrateOverflowMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  function close(): void {
    setAnchor(null);
  }

  return (
    <span className="crate-overflow">
      <Button
        id={buttonId}
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(moreTip)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t("crates.more")}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={open}
        onClose={close}
        keepMounted
        slotProps={{ list: { component: "div", "aria-labelledby": buttonId, dense: true } }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            id={item.id}
            component="button"
            type="button"
            disabled={item.disabled}
            hidden={item.hidden}
            aria-haspopup={item.ariaHasPopup}
            aria-pressed={item.ariaPressed}
            ref={tooltipRef(item.tip)}
            sx={item.hidden ? { display: "none" } : undefined}
            onClick={(event) => {
              item.onClick(itemButton(event));
              close();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </span>
  );
}
