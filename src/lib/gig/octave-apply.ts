/**
 * Confirm and save one half or double BPM.
 *
 * The page engine registers reload and busy. This file does not import
 * that engine, so the mount cycle stays one way.
 */

import { failureOf, postJSON } from "../api";
import type { BpmSanityWrite } from "../api-types";
import { bridge } from "../bridge";
import { el } from "../dom";
import { t } from "../i18n";
import { state } from "../state";
import { setNotice } from "../ui/notice-store";
import { openConfirm } from "../ui/shared-dialog";
import { formatStoredBpm, type OctaveViewRow } from "./octave-view";

let applying = false;
let reloadOctave: () => Promise<void> = async () => {};
let markBusy: (busy: boolean) => void = () => {};

/**
 * Register the check that runs after a BPM is saved.
 *
 * `wireOctave` sets this. A missing registration still finishes the POST.
 *
 * @param reload Loads the open crate again.
 * @returns {void}
 */
export function onOctaveReload(reload: () => Promise<void>): void {
  reloadOctave = reload;
}

/**
 * Register the busy flag the row buttons read.
 *
 * `wireOctave` sets this. The flag is true from the confirm through the
 * write, including a cancel.
 *
 * @param mark Sets whether a fix is in progress.
 * @returns {void}
 */
export function onOctaveBusy(mark: (busy: boolean) => void): void {
  markBusy = mark;
}

/**
 * Ask, then POST one ×2 or ÷2 fix.
 *
 * The client does not send a BPM. A 409 locks writes. The saved sentence
 * is set after the report reloads, because a successful load clears the
 * status line.
 *
 * @param row Flag row the person clicked.
 * @returns {Promise<void>}
 */
export async function applyOctaveFix(row: OctaveViewRow): Promise<void> {
  if (applying) return;
  if (typeof state.activeCrate !== "number") return;
  applying = true;
  markBusy(true);
  try {
    const ok = await openConfirm({
      title: t("octave.confirmTitle"),
      message: t("octave.confirm", {
        name: row.name,
        bpm: row.bpm,
        suggested: row.suggested,
        fix: row.fix === "x2" ? t("octave.fix.x2") : t("octave.fix.div2"),
      }),
      confirmLabel: row.fix === "x2" ? t("octave.fix.x2") : t("octave.fix.div2"),
    });
    if (!ok) return;
    const written = await postJSON<BpmSanityWrite>("/api/bpm-sanity", {
      id: row.id,
      fix: row.fix,
      crate: state.activeCrate,
      space: state.space,
      confirm: true,
    });
    await reloadOctave();
    const message = t("octave.written", {
      name: row.name,
      suggested: formatStoredBpm(written.bpm),
    });
    el("octave-status").textContent = message;
    setNotice(message);
  } catch (error) {
    if (failureOf(error).status === 409) {
      bridge.lockDown(error);
      return;
    }
    el("octave-status").textContent = failureOf(error).message;
  } finally {
    applying = false;
    markBusy(false);
  }
}
