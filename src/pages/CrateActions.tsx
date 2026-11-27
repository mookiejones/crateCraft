/**
 * Crate action buttons painted by React.
 *
 * New, Rename, and Delete stay on the row. Color, Preset, Tree, Sync folder,
 * Local copy, Rename from tags, Refresh, and Queue crate sit under More. Ids stay the ones the
 * desktop menu and tests click. Tooltips use `tooltip.*` through
 * `setTooltip`. Outlined MUI Buttons, size small.
 */

import { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { CrateOverflowMenu } from "../components/CrateOverflowMenu";
import { tooltipRef } from "../components/tooltip-ref";
import { useCrates } from "../containers/CrateContext";
import { failureOf, postJSON } from "../lib/api";
import { queueCrate } from "../lib/batch/batch-store";
import { activeCrateId, canQueueActiveCrate } from "../lib/crates/crate-store";
import {
  localMirrorBlocked,
  localMirrorDone,
  localMirrorSummary,
  type LocalMirrorReply,
} from "../lib/crates/local-mirror";
import { isQueuedWrite } from "../lib/crates/queue-notice";
import { t } from "../lib/i18n";
import { copiesChipText } from "../lib/snapshots/copies-view";
import { state } from "../lib/state";
import { setNotice } from "../lib/ui/notice-store";
import { tips } from "../lib/ui/tooltip-strings";

const BUTTON_SX = { textTransform: "none" as const, minWidth: 0 };

/**
 * Preview and write a local-only copy of the open crate.
 *
 * Preview posts when the dialog opens. Create posts only after that plan
 * can be written. Streaming tracks stay in the original crate.
 */
function LocalMirrorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [reply, setReply] = useState<LocalMirrorReply | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const crate = state.activeCrate;
    if (typeof crate !== "number") {
      setReply(null);
      setError("");
      setLoading(false);
      return;
    }
    let cancel = false;
    setLoading(true);
    setError("");
    setReply(null);
    void postJSON<LocalMirrorReply>("/api/local-mirror", {
      action: "preview",
      space: state.space,
      crate,
    }).then((body) => {
      if (cancel) return;
      setReply(body);
      setLoading(false);
    }).catch((err: unknown) => {
      if (cancel) return;
      const failure = failureOf(err);
      setError(failure.message);
      setLoading(false);
      if (failure.status === 409) {
        void import("../lib/ui/views").then((views) => {
          views.lockDown(failure);
          onClose();
        });
      }
    });
    return () => {
      cancel = true;
    };
  }, [open, onClose]);

  async function createCopy(): Promise<void> {
    const crate = state.activeCrate;
    if (typeof crate !== "number") return;
    setBusy(true);
    setError("");
    try {
      const body = await postJSON<LocalMirrorReply>("/api/local-mirror", {
        action: "create",
        confirm: true,
        space: state.space,
        crate,
      });
      onClose();
      if (isQueuedWrite(body)) {
        setNotice(t("gigLock.queued"));
        return;
      }
      setNotice(localMirrorDone(body));
      const views = await import("../lib/ui/views");
      await views.loadLibrary();
    } catch (err: unknown) {
      const failure = failureOf(err);
      setError(failure.message);
      if (failure.status === 409) {
        const views = await import("../lib/ui/views");
        views.lockDown(failure);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  const blocked = localMirrorBlocked(reply);
  const summary = loading
    ? t("localMirror.counting")
    : error || (reply ? localMirrorSummary(reply) : "");

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      aria-labelledby="local-mirror-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="local-mirror-title">{t("localMirror.title")}</DialogTitle>
      <DialogContent>
        <DialogContentText id="local-mirror-summary" aria-live="polite">
          {summary}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          id="local-mirror-cancel"
          type="button"
          ref={tooltipRef(tips.localMirrorCancel)}
          onClick={onClose}
        >
          {t("common.cancel")}
        </Button>
        <Button
          id="local-mirror-create"
          type="button"
          variant="contained"
          ref={tooltipRef(tips.localMirrorCreate)}
          disabled={loading || busy || error !== "" || blocked || reply === null}
          onClick={() => {
            void createCopy();
          }}
        >
          {t("localMirror.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * New, rename, delete, and a More menu for the rest.
 */
export function CrateActions() {
  const crates = useCrates();
  const [mirrorOpen, setMirrorOpen] = useState(false);
  const closeMirror = useCallback(() => setMirrorOpen(false), []);
  const copiesLabel = copiesChipText(crates.copies);
  return (
    <>
      {copiesLabel ? (
        <Chip
          id="library-copies"
          size="small"
          label={copiesLabel}
          ref={tooltipRef(tips.libraryCopies)}
        />
      ) : (
        <span id="library-copies" hidden />
      )}
      <Button
        id="crate-new"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateNew)}
        disabled={!crates.canCreate}
        onClick={() => crates.create()}
      >
        {t("crates.new")}
      </Button>
      <Button
        id="crate-rename"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateRename)}
        disabled={!crates.canRename}
        onClick={() => crates.rename()}
      >
        {t("crates.rename")}
      </Button>
      <Button
        id="crate-delete"
        type="button"
        size="small"
        variant="outlined"
        sx={BUTTON_SX}
        ref={tooltipRef(tips.crateDelete)}
        disabled={!crates.canDelete}
        onClick={() => crates.remove()}
      >
        {t("common.delete")}
      </Button>
      <CrateOverflowMenu
        buttonId="crate-actions-more"
        menuId="crate-actions-menu"
        moreLabel={t("crates.moreActions")}
        items={[
          {
            id: "crate-color",
            label: t("field.color"),
            tip: tips.crateColor,
            disabled: !crates.canColor,
            onClick: () => crates.color(),
          },
          {
            id: "crate-preset",
            label: t("presets.button"),
            tip: tips.cratePreset,
            ariaHasPopup: "dialog",
            disabled: !crates.canPreset,
            onClick: () => crates.preset(),
          },
          {
            id: "crate-tree",
            label: t("crateTree.button"),
            tip: tips.crateTree,
            ariaHasPopup: "dialog",
            disabled: !crates.canTree,
            onClick: () => crates.tree(),
          },
          {
            id: "crate-folder-sync",
            label: t("folderSync.button"),
            tip: tips.crateFolderSync,
            ariaHasPopup: "dialog",
            disabled: !crates.canFolderSync,
            onClick: () => crates.folderSync(),
          },
          {
            id: "crate-local-mirror",
            label: t("localMirror.button"),
            tip: tips.crateLocalMirror,
            ariaHasPopup: "dialog",
            disabled: !crates.writable || !crates.crateChosen,
            onClick: () => setMirrorOpen(true),
          },
          {
            id: "crate-rename-from-tags",
            label: t("files.renameFromTags"),
            tip: tips.crateRenameFromTags,
            ariaHasPopup: "dialog",
            disabled: !crates.canRenameFromTags,
            onClick: (button) => crates.renameFromTags(button),
          },
          {
            id: "crate-refresh",
            label: t("presets.refresh"),
            tip: tips.crateRefresh,
            hidden: crates.refreshHidden,
            disabled: !crates.canRefresh,
            onClick: () => crates.refresh(),
          },
          {
            id: "crate-queue-batch",
            label: t("batch.queueCrate"),
            tip: tips.batchQueueCrate,
            disabled: !canQueueActiveCrate(),
            onClick: () => {
              const id = activeCrateId();
              if (id !== null) void queueCrate(id);
            },
          },
        ]}
      />
      <LocalMirrorDialog open={mirrorOpen} onClose={closeMirror} />
    </>
  );
}
