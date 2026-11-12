/**
 * Centered MUI Dialog for shared preview/confirm flows.
 *
 * Esc closes. Backdrop click does not, matching the old native dialog.
 * keepMounted keeps field ids in the document while the dialog is shut.
 */

import { type ReactNode, type Ref, useLayoutEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import {
  bindDialogApi,
  isSharedDialogOpen,
  setSharedDialogOpen,
  sharedDialogMaxWidth,
  type SharedDialogId,
} from "../lib/ui/shared-dialog";

export type CenteredDialogProps = {
  id: SharedDialogId;
  labelledBy: string;
  describedBy?: string | undefined;
  children?: ReactNode;
  contentRef?: Ref<HTMLDivElement>;
};

/**
 * Bind showModal/close on the MUI root after it lands in the document.
 *
 * @param node Dialog root, or null on unmount.
 * @param id Dialog element id.
 * @returns {void}
 */
export function bindSharedRoot(node: HTMLElement | null, id: SharedDialogId): void {
  if (node) {
    if (!node.id) node.id = id;
    node.setAttribute("data-shared-dialog", id);
    node.setAttribute("data-open", isSharedDialogOpen(id) ? "true" : "false");
    bindDialogApi(node, id);
  }
}

/**
 * Centered modal wrapping existing dialog bodies.
 *
 * @param props Dialog id, labels, and body.
 */
export function CenteredDialog({
  id,
  labelledBy,
  describedBy,
  children,
  contentRef,
}: CenteredDialogProps) {
  const open = isSharedDialogOpen(id);
  const rootRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    rootRef.current?.setAttribute("data-open", open ? "true" : "false");
  }, [open]);
  return (
    <Dialog
      open={open}
      keepMounted
      fullWidth
      maxWidth={sharedDialogMaxWidth(id)}
      scroll="paper"
      transitionDuration={0}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      ref={(node) => {
        rootRef.current = node;
        bindSharedRoot(node, id);
      }}
      onClose={(_event, reason) => {
        if (reason === "backdropClick") return;
        setSharedDialogOpen(id, false);
      }}
    >
      <DialogContent ref={contentRef} sx={{ p: 0 }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
