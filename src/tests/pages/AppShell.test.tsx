/**
 * AppShell portals existing ids into AppBar, Drawer, and Main.
 */

import { flushSync } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyStatic, setLocale, t } from "../../lib/i18n";
import { applyLayout } from "../../lib/ui/layout";
import { mountAppShell, unmountAppShell } from "../../lib/ui/app-shell";
import { paintNav, resetNav } from "../../lib/ui/nav";
import { resetNotice, setNotice } from "../../lib/ui/notice-store";
import { applyStaticTooltips } from "../../lib/ui/tooltip";
import { installPage } from "../test-page";

const DRAWER_MINI_CUTOFF = 560;

function remountShell(): void {
  unmountAppShell();
  installPage();
  mountAppShell();
}

function setInnerWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}

function drawerPaper(): HTMLElement {
  const paper = document.querySelector(".MuiDrawer-paper");
  if (!(paper instanceof HTMLElement)) {
    throw new Error("drawer paper missing");
  }
  return paper;
}

function layoutBodies(fetchMock: ReturnType<typeof vi.fn>): unknown[] {
  return fetchMock.mock.calls
    .filter((call) => call[0] === "/api/settings")
    .map((call) => {
      const init = call[1] as RequestInit | undefined;
      return JSON.parse(String(init?.body ?? "{}")) as unknown;
    });
}

describe("AppShell", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    applyStatic(document);
    resetNav();
    mountAppShell();
    applyStaticTooltips();
  });

  afterEach(() => {
    unmountAppShell();
    resetNav();
    resetNotice();
    setLocale("en");
    vi.unstubAllGlobals();
  });

  it("portals primaries and children into the drawer, crates stay in Main", () => {
    const drawer = document.getElementById("app-drawer");
    const views = document.getElementById("views");
    const children = document.getElementById("view-children");
    const help = document.getElementById("open-help");
    const settings = document.getElementById("open-settings");
    const crates = document.getElementById("crate-list");
    const space = document.getElementById("space");
    const heading = document.querySelector("h1");
    const generation = document.getElementById("library-generation");
    const appBar = document.querySelector(".MuiAppBar-root");
    expect(drawer).not.toBeNull();
    expect(drawer?.contains(views)).toBe(true);
    expect(drawer?.contains(children)).toBe(true);
    expect(drawer?.contains(help)).toBe(false);
    expect(drawer?.contains(settings)).toBe(false);
    expect(drawer?.contains(crates)).toBe(false);
    expect(document.querySelector(".rail")?.contains(crates)).toBe(true);
    expect(document.getElementById("sheet-title")).not.toBeNull();
    expect(space?.tagName).toBe("SELECT");
    expect(appBar?.contains(space)).toBe(false);
    expect(document.querySelector(".brand")?.contains(space)).toBe(true);
    expect(document.querySelector(".brand")?.contains(heading)).toBe(false);
    expect(appBar?.contains(help)).toBe(true);
    expect(appBar?.contains(settings)).toBe(true);
    expect(appBar?.contains(heading)).toBe(true);
    expect(heading?.textContent).toBe("crateCraft");
    expect(appBar?.contains(generation)).toBe(true);
    expect(document.getElementById("track-splitter")?.getAttribute("role")).toBe("separator");
  });

  it("collapse keeps Help in the AppBar and crate names in the rail", () => {
    const toggle = document.getElementById("drawer-toggle");
    const help = document.getElementById("open-help");
    const crates = document.getElementById("crate-list");
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(toggle?.getAttribute("aria-label")).toBe(t("shell.drawerHide"));
    expect(help?.closest("[inert]")).toBeNull();
    flushSync(() => {
      toggle?.click();
    });
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle?.getAttribute("aria-label")).toBe(t("shell.drawerShow"));
    expect(help?.closest("[inert]")).toBeNull();
    expect(document.querySelector(".MuiAppBar-root")?.contains(help)).toBe(true);
    expect(crates?.isConnected).toBe(true);
    expect(document.querySelector(".rail")?.contains(crates)).toBe(true);
    expect(document.getElementById("app-drawer")?.contains(crates)).toBe(false);
  });

  it("gives the drawer toggle a tooltip", () => {
    const toggle = document.getElementById("drawer-toggle");
    expect(toggle?.dataset.tooltip?.trim().length).toBeGreaterThan(10);
  });

  it("starts collapsed on a narrow screen and can open navigation", () => {
    const originalWidth = window.innerWidth;
    try {
      unmountAppShell();
      installPage();
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
      mountAppShell();
      const toggle = document.getElementById("drawer-toggle");
      expect(toggle?.getAttribute("aria-expanded")).toBe("false");
      expect(document.getElementById("open-help")?.closest("[inert]")).toBeNull();
      flushSync(() => { toggle?.click(); });
      expect(toggle?.getAttribute("aria-expanded")).toBe("false");
      expect(document.getElementById("views")?.closest("[inert]")).toBeNull();
      expect(document.getElementById("open-help")?.closest("[inert]")).toBeNull();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("places the player strip under the AppBar, outside Main", () => {
    const bar = document.getElementById("player-bar");
    const appBar = document.querySelector(".MuiAppBar-root");
    const strip = appBar?.nextElementSibling;
    expect(bar).not.toBeNull();
    expect(strip?.contains(bar)).toBe(true);
    expect(strip?.querySelector("#app-drawer")).toBeNull();
    expect(document.getElementById("app-body")?.contains(bar)).toBe(false);
    expect(document.querySelector("main.sheet")?.contains(bar)).toBe(false);
  });

  it("places a dismissible Alert under the player for setNotice", () => {
    expect(document.getElementById("app-notice")).toBeNull();
    flushSync(() => {
      setNotice("That file is not on disk.", "error");
    });
    const banner = document.getElementById("app-notice");
    const strip = document.querySelector(".MuiAppBar-root")?.nextElementSibling;
    expect(banner?.textContent).toContain("That file is not on disk.");
    expect(strip?.nextElementSibling?.contains(banner)).toBe(true);
    expect(document.getElementById("app-body")?.contains(banner)).toBe(false);
    document.querySelector<HTMLButtonElement>("#app-notice button")?.click();
    expect(document.getElementById("app-notice")).toBeNull();
  });

  it("keeps Help in the AppBar while Settings fills Main", () => {
    const help = document.getElementById("open-help");
    const dialog = document.getElementById("settings-dialog");
    expect(dialog).not.toBeNull();
    if (dialog instanceof HTMLDialogElement && typeof dialog.show === "function") {
      dialog.show();
    }
    expect(document.querySelector(".MuiAppBar-root")?.contains(help)).toBe(true);
    expect(help?.closest("[inert]")).toBeNull();
    expect(document.getElementById("app-body")?.contains(dialog)).toBe(true);
  });

  it("opens the 200px drawer on a wide first launch", () => {
    setInnerWidth(1200);
    remountShell();
    expect(document.getElementById("drawer-toggle")?.getAttribute("aria-expanded")).toBe("true");
    expect(drawerPaper().style.width || getComputedStyle(drawerPaper()).width).toBe("200px");
  });

  it("uses a 56px mini drawer on a narrow first launch without inert", () => {
    setInnerWidth(390);
    remountShell();
    const views = document.getElementById("views");
    expect(document.getElementById("drawer-toggle")?.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("app-drawer")?.contains(views)).toBe(true);
    expect(views?.closest("[inert]")).toBeNull();
    expect(document.querySelector(".MuiAppBar-root")?.contains(document.getElementById("open-help"))).toBe(true);
    expect(drawerPaper().style.width || getComputedStyle(drawerPaper()).width).toBe("56px");
  });

  it("starts mini when settings saved the drawer closed on a wide window", () => {
    setInnerWidth(1200);
    remountShell();
    flushSync(() => {
      applyLayout({ layout: { track_list_width: null, drawer_open: false } });
    });
    expect(document.getElementById("drawer-toggle")?.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("views")?.closest("[inert]")).toBeNull();
    expect(drawerPaper().style.width || getComputedStyle(drawerPaper()).width).toBe("56px");
  });

  it("goes mini on a narrow resize without posting drawer_open false", () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    setInnerWidth(1200);
    remountShell();
    expect(document.getElementById("drawer-toggle")?.getAttribute("aria-expanded")).toBe("true");
    setInnerWidth(500);
    flushSync(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(document.getElementById("drawer-toggle")?.getAttribute("aria-expanded")).toBe("false");
    expect(500).toBeLessThan(DRAWER_MINI_CUTOFF);
    expect(layoutBodies(fetchMock).some((body) => {
      const layout = (body as { layout?: { drawer_open?: boolean } }).layout;
      return layout?.drawer_open === false;
    })).toBe(false);
  });

  it("posts drawer_open when the toggle is clicked", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    setInnerWidth(1200);
    remountShell();
    const toggle = document.getElementById("drawer-toggle");
    flushSync(() => {
      toggle?.click();
    });
    await vi.waitFor(() => {
      expect(layoutBodies(fetchMock)).toContainEqual({ layout: { drawer_open: false } });
    });
    flushSync(() => {
      toggle?.click();
    });
    await vi.waitFor(() => {
      expect(layoutBodies(fetchMock)).toContainEqual({ layout: { drawer_open: true } });
    });
  });

  it("still paints only the open parent's children after the portal", () => {
    paintNav("crates");
    const visible = [...document.querySelectorAll<HTMLButtonElement>("#view-children [data-view]")]
      .filter((button) => !button.hidden)
      .map((button) => button.dataset.view);
    expect(document.getElementById("view-children")?.hidden).toBe(false);
    expect(visible).toEqual(["crates", "history", "stats"]);
    paintNav("files");
    expect(document.getElementById("view-children")?.hidden).toBe(true);
  });
});
