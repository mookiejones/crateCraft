/**
 * More menu for crate actions that do not fit on the primary row.
 *
 * Items keep the ids native menu and tests click. keepMounted leaves
 * those nodes in the document when the menu is closed. The closed menu
 * is inert so those ids are not in the tab order. The menu portals so
 * `.rail { overflow: hidden }` does not clip it. Esc and a non-dialog
 * item restore focus to More. A dialog item focuses More first so the
 * dialog restores there on close.
 */

import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { tooltipRef } from "./tooltip-ref";
import { t } from "../lib/i18n";
import { getSettingsState, subscribeSettings } from "../lib/ui/settings";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minWidth: 0 };

function moreInk(ink: "rail" | "sheet"): string {
  return ink === "sheet" ? "var(--color-text)" : "var(--color-text-muted-on-dark)";
}

function paintMoreInk(node: HTMLButtonElement, ink: "rail" | "sheet"): void {
  // MUI outlined Button drops `color: var(...)` at used-value time.
  const token = ink === "sheet" ? "--color-text" : "--color-text-muted-on-dark";
  const value = getComputedStyle(node).getPropertyValue(token).trim() || moreInk(ink);
  node.style.setProperty("color", value, "important");
  node.style.setProperty("-webkit-text-fill-color", value, "important");
  node.style.setProperty("border-color", "currentColor", "important");
}

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
  moreLabel?: string;
  ink?: "rail" | "sheet";
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
  moreLabel,
  ink = "rail",
  items,
}: CrateOverflowMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [colorway, setColorway] = useState(() => getSettingsState().colorway);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const skipRestore = useRef(false);
  const open = Boolean(anchor);
  const label = moreLabel ?? t("crates.moreActions");
  const bindTooltip = tooltipRef(moreTip);

  useLayoutEffect(() => subscribeSettings(() => {
    setColorway(getSettingsState().colorway);
  }), []);

  useLayoutEffect(() => {
    const node = moreRef.current;
    if (node) paintMoreInk(node, ink);
  }, [colorway, ink]);

  function close(): void {
    setAnchor(null);
  }

  function restoreMore(): void {
    const node = moreRef.current;
    if (node && node.isConnected) node.focus();
  }

  return (
    <span className="crate-overflow">
      <Button
        id={buttonId}
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={(node) => {
          moreRef.current = node;
          bindTooltip(node);
          if (node) paintMoreInk(node, ink);
        }}
        aria-label={label}
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
        disableRestoreFocus
        onClose={() => {
          const skip = skipRestore.current;
          skipRestore.current = false;
          close();
          if (!skip) restoreMore();
        }}
        keepMounted
        slotProps={{
          root: { inert: !open },
          list: {
            component: "div",
            "aria-labelledby": buttonId,
            "aria-label": label,
            dense: true,
          },
        }}
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
              const opensDialog = item.ariaHasPopup === "dialog";
              skipRestore.current = opensDialog;
              if (opensDialog) restoreMore();
              item.onClick(itemButton(event));
              close();
              if (!opensDialog) restoreMore();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </span>
  );
}
