/**
 * Late bindings for calls between the screen modules.
 *
 * views.ts fills selectTrack and selectEntry. dialogs.ts fills
 * openMergeDialog and openReplaceInCratesDialog. A click runs after
 * those modules have loaded, so the real function is in place. The
 * empty defaults keep a render from throwing when a test paints a row
 * and does not open a dialog.
 */

import type { SeratoStatus } from "./api-types";
import type { NoticeSeverity } from "./ui/notice-store";

export const bridge: {
  selectTrack: (id: number) => void | Promise<void>;
  selectEntry: (id: number) => void;
  openMergeDialog: () => Promise<void>;
  openReplaceInCratesDialog: (fromId: number, toId?: number) => Promise<void>;
  openSetup: () => void;
  reloadLibrary: () => void | Promise<void>;
  lockDown: (error: unknown) => void;
  applyStatus: (info: SeratoStatus | null | undefined) => void;
  renderShell: () => void;
  setNotice: (text: string, severity?: NoticeSeverity) => void;
} = {
  selectTrack(_id: number) {},
  selectEntry(_id: number) {},
  openMergeDialog() {
    return Promise.resolve();
  },
  openReplaceInCratesDialog(_fromId: number, _toId?: number) {
    return Promise.resolve();
  },
  openSetup() {},
  reloadLibrary() {
    return Promise.resolve();
  },
  lockDown(_error: unknown) {},
  applyStatus(_info: SeratoStatus | null | undefined) {},
  renderShell() {},
  setNotice(_text: string) {},
};
