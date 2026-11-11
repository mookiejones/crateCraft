/**
 * Mount the MUI AppBar + Drawer + Main chrome.
 *
 * Called once from app.ts after locale wiring, before tooltips, so the
 * drawer toggle exists for applyStaticTooltips. A missing host does
 * nothing, so a test page that has not installed the markup can still
 * call the other wires.
 */

import { createElement } from "react";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { AppShell } from "../../pages/AppShell";

let islandRoot: IslandRoot | null = null;

/**
 * Paint the shell into `#app-shell`.
 *
 * @param host Element to fill. Defaults to `#app-shell`.
 * @returns {void}
 */
export function mountAppShell(host?: HTMLElement | null): void {
  islandRoot?.unmount();
  islandRoot = null;
  const root = host === undefined ? document.getElementById("app-shell") : host;
  if (!root) return;
  islandRoot = mountIsland(root, createElement(AppShell));
}

/**
 * Remove the shell island.
 *
 * Tests call this after a render into a temporary host.
 *
 * @returns {void}
 */
export function unmountAppShell(): void {
  islandRoot?.unmount();
  islandRoot = null;
}
