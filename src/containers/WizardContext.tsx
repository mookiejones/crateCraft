/**
 * Shared first-run wizard state for the setup screen.
 *
 * The step machine stays in `wizard.ts`. This context is the React read
 * path. The wizard bundle supplies a live value; AppProviders mounts an
 * idle value so the domain is present on every island.
 */

import { createContext, useContext, type ReactNode } from "react";
import { createWizard, type WizardModel } from "../lib/wizard/wizard";

export interface FolderRow {
  name: string;
  path: string;
}

export type WizardContextValue = {
  model: WizardModel;
  busy: boolean;
  folderOpen: boolean;
  folderName: string;
  folderParent: string | null;
  folders: readonly FolderRow[];
  summary: string;
  nextHint: string;
  statusNote: string;
  focusToken: number;
  onPrimary: () => void;
  onBack: () => void;
  onCancel: () => void;
  onChooseFolder: () => void;
  onConsent: (value: boolean) => void;
  onUpdates: (value: boolean) => void;
  onFolderUp: () => void;
  onFolderUse: () => void;
  onFolderClose: () => void;
  onBrowse: (path: string) => void;
};

function noop(): void {}
function noopFlag(_value: boolean): void {}
function noopPath(_path: string): void {}

/**
 * Closed wizard snapshot for islands that do not run setup.
 *
 * @returns Idle value with no-op actions.
 */
export function idleWizardValue(): WizardContextValue {
  return {
    model: createWizard({
      needsConsent: true,
      library: "pending",
      seratoRunning: false,
    }),
    busy: false,
    folderOpen: false,
    folderName: "",
    folderParent: null,
    folders: [],
    summary: "",
    nextHint: "",
    statusNote: "",
    focusToken: 0,
    onPrimary: noop,
    onBack: noop,
    onCancel: noop,
    onChooseFolder: noop,
    onConsent: noopFlag,
    onUpdates: noopFlag,
    onFolderUp: noop,
    onFolderUse: noop,
    onFolderClose: noop,
    onBrowse: noopPath,
  };
}

const WizardContext = createContext<WizardContextValue | null>(null);

/**
 * Supply one wizard snapshot to a React tree.
 *
 * @param value Current step and the setup actions.
 * @param children Tree that may call `useWizard`.
 */
export function WizardProvider({
  value,
  children,
}: {
  value: WizardContextValue;
  children: ReactNode;
}) {
  return <WizardContext value={value}>{children}</WizardContext>;
}

/**
 * Read the shared wizard.
 *
 * Throws when no `WizardProvider` is above this component.
 *
 * @returns The snapshot and actions for this screen.
 */
export function useWizard(): WizardContextValue {
  const value = useContext(WizardContext);
  if (value === null) {
    throw new Error("useWizard must be used within WizardProvider");
  }
  return value;
}
