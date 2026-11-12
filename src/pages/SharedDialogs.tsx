/**
 * Centered MUI dialogs for Rekordbox, merge, relink, sharing, Find art,
 * preset, folder-sync, crate replace, the crate name prompt, and confirm.
 *
 * Existing markup in index.html is adopted on first paint so field ids
 * and POST contracts stay. Restore, Files, Settings, and Wizard stay
 * native dialogs.
 */

import { useEffect, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { CenteredDialog } from "../components/CenteredDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CratePromptDialog } from "../components/CratePromptDialog";
import {
  bindDialogApi,
  setSharedDialogOpen,
  subscribeSharedDialogs,
  type SharedDialogId,
} from "../lib/ui/shared-dialog";

const ADOPTED: ReadonlyArray<{
  id: Exclude<SharedDialogId, "crate-prompt-dialog" | "confirm-dialog">;
  labelledBy: string;
  describedBy?: string;
}> = [
  { id: "consent-dialog", labelledBy: "consent-title", describedBy: "consent-body" },
  { id: "merge-dialog", labelledBy: "merge-title", describedBy: "merge-intro" },
  { id: "album-art-dialog", labelledBy: "album-art-title", describedBy: "album-art-intro" },
  { id: "crates-replace-dialog", labelledBy: "crates-replace-title", describedBy: "crates-replace-intro" },
  { id: "relink-dialog", labelledBy: "relink-title", describedBy: "relink-intro" },
  { id: "preset-dialog", labelledBy: "preset-title", describedBy: "preset-intro" },
  { id: "folder-sync-dialog", labelledBy: "folder-sync-title", describedBy: "folder-sync-intro" },
  { id: "rekordbox-dialog", labelledBy: "rekordbox-title", describedBy: "rekordbox-intro" },
];

const buckets = new Map<string, HTMLDivElement>();

function bucketFor(id: string): HTMLDivElement {
  let bucket = buckets.get(id);
  if (!bucket) {
    bucket = document.createElement("div");
    bucket.setAttribute("data-shared-bucket", id);
    buckets.set(id, bucket);
  }
  return bucket;
}

function sourceDialog(id: string): HTMLElement | null {
  const source = document.querySelector(`dialog#${CSS.escape(id)}`);
  if (!(source instanceof HTMLElement) || source.hasAttribute("data-shared-dialog")) return null;
  return source;
}

function muiRoot(id: string): HTMLElement | null {
  const root = document.querySelector(`[data-shared-dialog="${CSS.escape(id)}"]`);
  return root instanceof HTMLElement ? root : null;
}

function adoptNative(id: Exclude<SharedDialogId, "crate-prompt-dialog" | "confirm-dialog">): HTMLDivElement {
  const bucket = bucketFor(id);
  const source = sourceDialog(id);
  if (source) {
    if (source instanceof HTMLDialogElement && source.open) {
      setSharedDialogOpen(id, true);
    }
    bucket.replaceChildren();
    while (source.firstChild) bucket.appendChild(source.firstChild);
    source.remove();
  }
  return bucket;
}

function placeBucket(
  id: Exclude<SharedDialogId, "crate-prompt-dialog" | "confirm-dialog">,
  paper: HTMLElement | null,
): void {
  const bucket = bucketFor(id);
  const root = paper?.closest("[data-shared-dialog]") ?? muiRoot(id);
  if (root instanceof HTMLElement) {
    root.id = id;
    bindDialogApi(root, id);
    const dest = paper ?? root.querySelector(".MuiDialogContent-root") ?? root;
    if (bucket.parentElement !== dest) dest.appendChild(bucket);
    return;
  }
  const host = document.getElementById("shared-dialogs");
  if (host instanceof HTMLElement && bucket.parentElement !== host) host.appendChild(bucket);
}

function AdoptedDialog({
  id,
  labelledBy,
  describedBy,
}: (typeof ADOPTED)[number]) {
  useLayoutEffect(() => {
    adoptNative(id);
    placeBucket(id, null);
  }, [id]);

  return (
    <CenteredDialog
      id={id}
      labelledBy={labelledBy}
      describedBy={describedBy}
      contentRef={(paper) => {
        if (paper) {
          adoptNative(id);
          placeBucket(id, paper);
        }
      }}
    />
  );
}

/**
 * Host for every shared MUI dialog.
 */
export function SharedDialogs() {
  const [, setEpoch] = useState(0);
  useEffect(() => {
    return subscribeSharedDialogs(() => {
      flushSync(() => {
        setEpoch((value) => value + 1);
      });
    });
  }, []);
  return (
    <>
      {ADOPTED.map((dialog) => (
        <AdoptedDialog key={dialog.id} {...dialog} />
      ))}
      <CratePromptDialog />
      <ConfirmDialog />
    </>
  );
}
