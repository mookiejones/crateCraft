/**
 * MUI AppBar, collapsible Drawer, and Main slot.
 *
 * Existing page nodes keep their ids. This shell portals `#space-field`
 * into the AppBar, `#player-bar` under the AppBar as a full strip,
 * `#views` and `#view-children` into the Drawer, `#rail-foot` into the
 * drawer footer, and `#app-body` into Main. Crate names stay in the Main
 * rail so collapse does not hide them. The space control stays a native
 * select. Collapse is not saved.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { onLocaleChange, t } from "../lib/i18n";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

const DRAWER_WIDTH = 240;

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function adopt(slot: HTMLElement | null, id: string): void {
  if (!slot) return;
  const node = document.getElementById(id);
  if (node && node.parentElement !== slot) slot.append(node);
}

/**
 * Page chrome: AppBar, Drawer, and the existing body in Main.
 */
export function AppShell() {
  const [open, setOpen] = useState(true);
  const [, setLocaleTick] = useState(0);
  const spaceSlot = useRef<HTMLDivElement>(null);
  const playerSlot = useRef<HTMLDivElement>(null);
  const navSlot = useRef<HTMLDivElement>(null);
  const footSlot = useRef<HTMLDivElement>(null);
  const bodySlot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onLocaleChange(() => {
      setLocaleTick((n) => n + 1);
    });
  }, []);

  useLayoutEffect(() => {
    adopt(spaceSlot.current, "space-field");
    adopt(playerSlot.current, "player-bar");
    adopt(navSlot.current, "views");
    adopt(navSlot.current, "view-children");
    adopt(footSlot.current, "rail-foot");
    adopt(bodySlot.current, "app-body");
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ gap: 2, minHeight: 56 }}>
          <IconButton
            id="drawer-toggle"
            type="button"
            size="large"
            color="inherit"
            aria-expanded={open}
            aria-controls="app-drawer"
            aria-label={open ? t("shell.drawerHide") : t("shell.drawerShow")}
            onClick={() => setOpen((value) => !value)}
            ref={tooltipRef(tips.drawerToggle)}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Box ref={spaceSlot} className="app-bar-space" />
        </Toolbar>
      </AppBar>
      <Box ref={playerSlot} className="player-strip" sx={{ flexShrink: 0 }} />
      <Box sx={{ display: "flex", flex: 1, minHeight: 0, minWidth: 0 }}>
        <Drawer
          id="app-drawer"
          variant="persistent"
          open={open}
          anchor="left"
          slotProps={{
            paper: { "aria-hidden": !open },
          }}
          sx={{
            width: open ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            overflow: "hidden",
            visibility: open ? "visible" : "hidden",
            whiteSpace: "nowrap",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: open
                  ? theme.transitions.duration.enteringScreen
                  : theme.transitions.duration.leavingScreen,
              }),
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
            "& .MuiDrawer-paper": {
              position: "relative",
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              overflow: "hidden",
              border: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: 0,
            }}
            {...(!open ? { inert: true } : {})}
          >
            <Box
              ref={navSlot}
              className="drawer-nav"
              component="nav"
              aria-label={t("view.label")}
              sx={{ flex: 1, minHeight: 0, overflow: "auto" }}
            />
            <Box ref={footSlot} className="drawer-foot" />
          </Box>
        </Drawer>
        <Box
          ref={bodySlot}
          sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}
        />
      </Box>
    </Box>
  );
}
