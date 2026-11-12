/**
 * Mount the Files React islands into the page hosts.
 *
 * Kept off `files.ts` so the store can load without the provider tree.
 */

import { createElement } from "react";
import { mountIsland, type IslandRoot } from "../../app/mount";
import { FilesDialog } from "../../pages/FilesDialog";
import { FilesPanel } from "../../pages/FilesPanel";
import { PortableDialog } from "../../components/PortableDialog";
import { el } from "../dom";
import { bindFilesMount } from "./files";
import { bindPortableMount } from "../gig/portable-bind";

let panelRoot: IslandRoot | null = null;
let dialogRoot: IslandRoot | null = null;
let portableRoot: IslandRoot | null = null;
let panelHost: HTMLElement | null = null;
let dialogHost: HTMLElement | null = null;
let portableHost: HTMLElement | null = null;

function safeUnmount(root: IslandRoot | null): void {
  if (!root) return;
  try {
    root.unmount();
  } catch {
    // installPage replaces the body; the host is already gone.
  }
}

function rootFor(host: HTMLElement, current: IslandRoot | null, lastHost: HTMLElement | null): IslandRoot | undefined {
  if (current && lastHost === host && host.isConnected) return current;
  safeUnmount(current);
  return undefined;
}

/**
 * Mount the Files panel, the review dialog, and the portable dialog.
 *
 * Safe to call more than once. Reuses each React root while the host
 * node stays in the document. A new document (tests) gets a new root.
 *
 * @returns {void}
 */
export function mountFilesIslands(): void {
  const panel = el("files-panel");
  const dialog = el("files-dialog");
  const portable = el("portable-dialog");
  panelRoot = mountIsland(panel, createElement(FilesPanel), rootFor(panel, panelRoot, panelHost));
  dialogRoot = mountIsland(dialog, createElement(FilesDialog), rootFor(dialog, dialogRoot, dialogHost));
  portableRoot = mountIsland(portable, createElement(PortableDialog), rootFor(portable, portableRoot, portableHost));
  panelHost = panel;
  dialogHost = dialog;
  portableHost = portable;
}

bindFilesMount(mountFilesIslands);
bindPortableMount(mountFilesIslands);
