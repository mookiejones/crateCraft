/**
 * One-button tonight crates on Gig Ready (#429).
 *
 * POST /api/tonight preview, then create with confirm true, builds Newest
 * adds, Most played, and by-decade crates under `_crateCraft generated` /
 * `Tonight`. Re-run replaces only that Tonight folder. Serato must be quit.
 */

import { failureOf, postJSON } from "../api";
import type { TonightPlan } from "../api-types";
import { bridge } from "../bridge";
import { isQueuedWrite } from "../crates/queue-notice";
import { el } from "../dom";
import { t } from "../i18n";
import { state } from "../state";
import { openConfirm } from "../ui/shared-dialog";

let busy = false;

/**
 * Preview then create tonight crates under the generated folder.
 *
 * Confirm uses the shared MUI dialog. Serato must be quit.
 *
 * @returns {Promise<void>}
 */
export async function buildTonightCrates(): Promise<void> {
  if (busy) return;
  busy = true;
  const button = el("tonight-build");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  el("gig-status").textContent = t("gig.tonightBusy");
  try {
    const preview = await postJSON<TonightPlan>("/api/tonight", {
      action: "preview",
      space: state.space,
    });
    if (isQueuedWrite(preview)) {
      el("gig-status").textContent = t("gigLock.queued");
      return;
    }
    const children = preview.children ?? [];
    const crateCount = children.length;
    if (!crateCount) {
      el("gig-status").textContent = t("gig.tonightEmpty");
      return;
    }
    const folder = String(preview.folder || "_crateCraft generated");
    const tonight = String(preview.tonight || "Tonight");
    if (!(await openConfirm({
      title: t("gig.tonight"),
      message: t("gig.tonightConfirm", { count: crateCount, folder, tonight }),
      confirmLabel: t("gig.tonight"),
    }))) {
      el("gig-status").textContent = "";
      return;
    }
    const created = await postJSON<TonightPlan>("/api/tonight", {
      action: "create",
      confirm: true,
      space: state.space,
    });
    if (isQueuedWrite(created)) {
      el("gig-status").textContent = t("gigLock.queued");
      return;
    }
    if (!created.written) {
      el("gig-status").textContent = t("gig.tonightEmpty");
      return;
    }
    await bridge.reloadLibrary();
    el("gig-status").textContent = created.warning || t("gig.tonightWritten", {
      folder: String(created.folder || folder),
      tonight: String(created.tonight || tonight),
      count: created.children?.length ?? crateCount,
    });
  } catch (error) {
    if (failureOf(error).status === 409) {
      bridge.lockDown(error);
      return;
    }
    el("gig-status").textContent = failureOf(error).message;
  } finally {
    busy = false;
    button.disabled = false;
    button.setAttribute("aria-busy", "false");
  }
}
