/**
 * Late bindings for calls between the screen modules.
 *
 * views.ts fills selectTrack and selectEntry. dialogs.ts fills
 * openMergeDialog and openReplaceInCratesDialog. A click runs after
 * those modules have loaded, so the real function is in place. The
 * empty defaults keep a render from throwing when a test paints a row
 * and does not open a dialog.
 */

export const bridge: {
  selectTrack: (id: number) => void | Promise<void>;
  selectEntry: (id: number) => void;
  openMergeDialog: () => Promise<void>;
  openReplaceInCratesDialog: (fromId: number, toId?: number) => Promise<void>;
  openSetup: () => void;
  reloadLibrary: () => void | Promise<void>;
  lockDown: (error: unknown) => void;
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
};
