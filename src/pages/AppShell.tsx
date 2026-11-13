/**
 * MUI AppBar, collapsible Drawer, and Main slot.
 *
 * Existing page nodes keep their ids. This shell portals the crateCraft
 * heading and `#library-generation` into the AppBar after the menu
 * toggle, `#open-help` and `#open-settings` to the AppBar end, `#player-bar`
 * under the AppBar as a full strip, then a MUI Alert for the last action
 * notice, `#views` and `#view-children` into the Drawer, and `#app-body`
 * into Main. Space stays in `.brand`. Crate names stay in the Main rail
 * so collapse does not hide them. Collapse is not saved.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { NoticeBanner } from "../components/NoticeBanner";
import { onLocaleChange, t } from "../lib/i18n";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

const DRAWER_WIDTH = 200;

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

function adoptNode(slot: HTMLElement | null, node: Element | null): void {
  if (!slot || !node) return;
  if (node.parentElement !== slot) slot.append(node);
}

/**
 * Page chrome: AppBar, Drawer, and the existing body in Main.
 */
export function AppShell() {
  const [open, setOpen] = useState(() => window.innerWidth > 980);
  const [, setLocaleTick] = useState(0);
  const headingSlot = useRef<HTMLDivElement>(null);
  const generationSlot = useRef<HTMLDivElement>(null);
  const actionsSlot = useRef<HTMLDivElement>(null);
  const playerSlot = useRef<HTMLDivElement>(null);
  const navSlot = useRef<HTMLDivElement>(null);
  const bodySlot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onLocaleChange(() => {
      setLocaleTick((n) => n + 1);
    });
  }, []);

  useLayoutEffect(() => {
    adoptNode(headingSlot.current, document.querySelector(".brand h1"));
    adopt(generationSlot.current, "library-generation");
    adopt(generationSlot.current, "library-generation-note");
    adopt(actionsSlot.current, "open-help");
    adopt(actionsSlot.current, "open-settings");
    adopt(playerSlot.current, "player-bar");
    adopt(navSlot.current, "views");
    adopt(navSlot.current, "view-children");
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
        <Toolbar sx={{ gap: 2, minHeight: 64, py: 1 }}>
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
          <Box
            ref={headingSlot}
            className="app-bar-heading"
            sx={{
              "& h1": {
                margin: 0,
                fontFamily: "var(--display)",
                fontWeight: 500,
                fontSize: 34,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              },
            }}
          />
          <Box ref={generationSlot} className="app-bar-generation" />
          <Box sx={{ flex: 1, minWidth: 0 }} />
          <Box
            ref={actionsSlot}
            className="app-bar-actions"
            sx={{ display: "flex", gap: 1, flexShrink: 0 }}
          />
        </Toolbar>
      </AppBar>
      <Box ref={playerSlot} className="player-strip" sx={{ flexShrink: 0 }} />
      <NoticeBanner />
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
