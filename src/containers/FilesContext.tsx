/**
 * Shared Files view state for the folder list and file dialogs.
 *
 * Folder load stays in `files.ts`. This context is the one React read
 * path. Providers subscribe to that store so the panel, the review
 * dialog, and Check drive see the same snapshot.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { FileCrumb, FileEntry, FileRoot, FilesPayload, LibraryRoot } from "../lib/api-types";
import type { DriveReport } from "../lib/gig/portable";

export type FilesContextValue = {
  writable: boolean;
  path: string;
  parent: string | null;
  entries: readonly FileEntry[];
  selected: ReadonlySet<string>;
  pick: "move" | "move_folder" | null;
  pickPaths: readonly string[];
  pickSource: string;
  loading: boolean;
  error: string;
  message: string;
  truncated: boolean;
  atRoots: boolean;
  roots: readonly LibraryRoot[];
  root: FileRoot | null;
  breadcrumb: readonly FileCrumb[];
  elsewhere: boolean;
  active: number;
  query: string;
  searching: boolean;
  rows: readonly FileEntry[];
  selectedEntries: readonly FileEntry[];
  locked: boolean;
  rowHeight: number;
  dialogAction: string;
  dialogOpen: boolean;
  dialogName: string;
  dialogReplacement: string;
  dialogStatus: string;
  dialogPreview: FilesPayload | null;
  dialogScope: "paths" | "crate";
  portableReport: DriveReport | null;
  portableStatus: string;
  goUp: () => void;
  refresh: () => void;
  toggleElsewhere: () => void;
  openCrumb: (path: string) => void;
  openRow: (entry: FileEntry, index: number) => void;
  toggleFile: (entry: FileEntry, index: number, checked: boolean) => void;
  markActive: (index: number) => void;
  onListKey: (event: KeyboardEvent) => void;
  onSearchInput: (value: string) => void;
  startRename: (trigger: EventTarget | null) => void;
  startRenameFromTags: (trigger: EventTarget | null) => void;
  startMove: () => void;
  startMoveFolder: () => void;
  startReplace: (trigger: EventTarget | null) => void;
  startDelete: (trigger: EventTarget | null) => void;
  confirmMoveHere: (trigger: EventTarget | null) => void;
  cancelPick: () => void;
  setDialogName: (value: string) => void;
  setDialogReplacement: (value: string) => void;
  review: () => Promise<void>;
  confirm: () => Promise<void>;
  closeDialog: () => void;
};

const FilesContext = createContext<FilesContextValue | null>(null);

/**
 * Supply one Files snapshot to a React tree.
 *
 * @param value Current snapshot and the folder actions.
 * @param children Tree that may call `useFiles`.
 */
export function FilesProvider({
  value,
  children,
}: {
  value: FilesContextValue;
  children: ReactNode;
}) {
  return <FilesContext value={value}>{children}</FilesContext>;
}

/**
 * Read the shared Files view.
 *
 * Throws when no `FilesProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useFiles(): FilesContextValue {
  const value = useContext(FilesContext);
  if (value === null) {
    throw new Error("useFiles must be used within FilesProvider");
  }
  return value;
}
