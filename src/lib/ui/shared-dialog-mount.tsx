/**
 * Mount SharedDialogs into `#shared-dialogs`.
 *
 * Safe to call more than once. Tests that replace the body get a new
 * root. The store calls this before a prompt opens.
 */

import { createElement } from "react";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { SharedDialogs } from "../../pages/SharedDialogs";
import { bindSharedDialogMount } from "./shared-dialog";

let islandRoot: IslandRoot | null = null;
let islandHost: HTMLElement | null = null;

function safeUnmount(root: IslandRoot | null): void {
  if (!root) return;
  try {
    root.unmount();
  } catch {
    // installPage replaces the body; the host is already gone.
  }
}

/**
 * Paint the shared MUI dialogs.
 *
 * A missing host does nothing, so a test page without the markup can
 * still call the other wires.
 *
 * @returns {void}
 */
export function mountSharedDialogs(): void {
  const host = document.getElementById("shared-dialogs");
  if (!(host instanceof HTMLElement)) return;
  const nativeLeft = Boolean(document.querySelector("dialog#rekordbox-dialog"));
  if (islandRoot && islandHost === host && host.isConnected && !nativeLeft) return;
  safeUnmount(islandRoot);
  islandRoot = mountIsland(host, createElement(SharedDialogs));
  islandHost = host;
}

bindSharedDialogMount(mountSharedDialogs);
