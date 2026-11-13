/**
 * MUI AppBar, collapsible Drawer, and Main slot.
 *
 * Existing page nodes keep their ids. This shell portals the crateCraft
 * heading and `#library-generation` into the AppBar after the menu
 * toggle, `#player-bar` into the Toolbar flex slot between the chip and
 * Help, `#open-help` and `#open-settings` to the AppBar end, `#status`
 * into a persistent lock bar under the AppBar, then a MUI Alert for the
 * last action notice, `#views` into the Drawer, and `#app-body` into
 * Main. The player slot stays hidden while `trackId` is null. `paintNav`
 * inserts `#view-children` after the open primary.
 * Space stays in `.brand`. Crate names stay in the Main rail so collapse
 * does not hide them. Mini width is remembered in settings.
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
import { getPlayerState, subscribe } from "../lib/player/player";
import { state } from "../lib/state";
import {
  DRAWER_MINI_CUTOFF,
  DRAWER_MINI_WIDTH,
  DRAWER_WIDTH,
  saveDrawerOpen,
  subscribeDrawerOpen,
} from "../lib/ui/layout";
import { paintNav } from "../lib/ui/nav";
import { setTooltip } from "../lib/ui/tooltip";
import { tips, type TipSpec } from "../lib/ui/tooltip-strings";

function drawerExpanded(saved: boolean | null, innerWidth: number): boolean {
  return innerWidth >= DRAWER_MINI_CUTOFF && (saved ?? true);
}

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
  const [savedOpen, setSavedOpen] = useState<boolean | null>(null);
  const [innerWidth, setInnerWidth] = useState(() => window.innerWidth);
  const [hasTrack, setHasTrack] = useState(() => getPlayerState().trackId !== null);
  const open = drawerExpanded(savedOpen, innerWidth);
  const postedOpen = useRef(false);
  const [, setLocaleTick] = useState(0);
  const headingSlot = useRef<HTMLDivElement>(null);
  const generationSlot = useRef<HTMLDivElement>(null);
  const actionsSlot = useRef<HTMLDivElement>(null);
  const playerSlot = useRef<HTMLDivElement>(null);
  const lockSlot = useRef<HTMLDivElement>(null);
  const navSlot = useRef<HTMLDivElement>(null);
  const bodySlot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onLocaleChange(() => {
      setLocaleTick((n) => n + 1);
    });
  }, []);

  useEffect(() => {
    return subscribeDrawerOpen((saved) => {
      if (postedOpen.current) return;
      setSavedOpen(saved);
    });
  }, []);

  useEffect(() => {
    return subscribe((snapshot) => {
      setHasTrack(snapshot.trackId !== null);
    });
  }, []);

  useEffect(() => {
    const onResize = (): void => {
      setInnerWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function toggleDrawer(): void {
    const next = !open;
    postedOpen.current = true;
    setSavedOpen(next);
    saveDrawerOpen(next);
  }

  useLayoutEffect(() => {
    adoptNode(headingSlot.current, document.querySelector(".brand h1"));
    adopt(generationSlot.current, "library-generation");
    adopt(generationSlot.current, "library-generation-note");
    adopt(actionsSlot.current, "open-help");
    adopt(actionsSlot.current, "open-settings");
    adopt(playerSlot.current, "player-bar");
    adopt(lockSlot.current, "status");
    adopt(navSlot.current, "views");
    adopt(bodySlot.current, "app-body");
    paintNav(state.mode);
  }, [open]);

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
            onClick={toggleDrawer}
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
          <Box
            ref={playerSlot}
            className="app-bar-player"
            hidden={!hasTrack}
            sx={{
              flex: 1,
              minWidth: 0,
              display: hasTrack ? "flex" : "none",
              alignItems: "center",
            }}
          />
          <Box
            ref={actionsSlot}
            className="app-bar-actions"
            sx={{ display: "flex", gap: 1, flexShrink: 0 }}
          />
        </Toolbar>
      </AppBar>
      <Box ref={lockSlot} className="app-bar-lock" sx={{ flexShrink: 0 }} />
      <NoticeBanner />
      <Box sx={{ display: "flex", flex: 1, minHeight: 0, minWidth: 0 }}>
        <Drawer
          id="app-drawer"
          variant="persistent"
          open
          anchor="left"
          data-mini={!open || undefined}
          slotProps={{
            paper: {
              "aria-hidden": false,
              style: { width: open ? DRAWER_WIDTH : DRAWER_MINI_WIDTH },
            },
          }}
          sx={{
            width: open ? DRAWER_WIDTH : DRAWER_MINI_WIDTH,
            flexShrink: 0,
            overflow: "hidden",
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
              width: open ? DRAWER_WIDTH : DRAWER_MINI_WIDTH,
              boxSizing: "border-box",
              overflowX: "hidden",
              overflowY: "auto",
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
