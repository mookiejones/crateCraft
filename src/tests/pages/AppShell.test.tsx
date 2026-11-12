/**
 * AppShell portals existing ids into AppBar, Drawer, and Main.
 */

import { flushSync } from "react-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyStatic, setLocale, t } from "../../lib/i18n";
import { mountAppShell, unmountAppShell } from "../../lib/ui/app-shell";
import { paintNav, resetNav } from "../../lib/ui/nav";
import { applyStaticTooltips } from "../../lib/ui/tooltip";
import { installPage } from "../test-page";

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
    setLocale("en");
  });

  it("portals primaries and children into the drawer, crates stay in Main", () => {
    const drawer = document.getElementById("app-drawer");
    const views = document.getElementById("views");
    const children = document.getElementById("view-children");
    const help = document.getElementById("open-help");
    const settings = document.getElementById("open-settings");
    const crates = document.getElementById("crate-list");
    const space = document.getElementById("space");
    expect(drawer).not.toBeNull();
    expect(drawer?.contains(views)).toBe(true);
    expect(drawer?.contains(children)).toBe(true);
    expect(drawer?.contains(help)).toBe(true);
    expect(drawer?.contains(settings)).toBe(true);
    expect(drawer?.contains(crates)).toBe(false);
    expect(document.querySelector(".rail")?.contains(crates)).toBe(true);
    expect(document.getElementById("sheet-title")).not.toBeNull();
    expect(space?.tagName).toBe("SELECT");
    expect(document.querySelector(".MuiAppBar-root")?.contains(space)).toBe(true);
    expect(document.getElementById("track-splitter")?.getAttribute("role")).toBe("separator");
  });

  it("collapse hides Help and Settings and keeps crate names", () => {
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
    expect(help?.closest("[inert]")).not.toBeNull();
    expect(crates?.isConnected).toBe(true);
    expect(document.querySelector(".rail")?.contains(crates)).toBe(true);
    expect(document.getElementById("app-drawer")?.contains(crates)).toBe(false);
  });

  it("gives the drawer toggle a tooltip", () => {
    const toggle = document.getElementById("drawer-toggle");
    expect(toggle?.dataset.tooltip?.trim().length).toBeGreaterThan(10);
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
