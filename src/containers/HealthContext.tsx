/**
 * Shared Library health group state.
 *
 * Library health, Damaged files, Tag spellings, and the Missing /
 * Duplicates / Stems chrome read this context. Fetch logic stays in
 * health.ts, scan.ts, and tags.ts.
 */

import { createContext, useContext, type ReactNode } from "react";
import type {
  FileScanReport,
  LibraryHealthReport,
  TagClusterPlan,
  TagClusters,
} from "../lib/api-types";
import type { TagField } from "../lib/health/tags-view";

export type HealthAction = "missing" | "duplicates" | "files" | "track" | "bitrate";

export type ScanDepth = "quick" | "full";

export type HealthContextValue = {
  healthReport: LibraryHealthReport | null;
  healthStatus: string;
  healthBusy: boolean;
  healthScope: string;
  scanReport: FileScanReport | null;
  scanStatus: string;
  scanBusy: boolean;
  scanScope: string;
  scanFullDisabled: boolean;
  scanExpanded: ReadonlySet<string>;
  tagsField: TagField;
  tagsClusters: TagClusters | null;
  titlePlan: TagClusterPlan | null;
  mappingPlan: TagClusterPlan | null;
  tagsPlans: ReadonlyMap<string, TagClusterPlan>;
  tagsSelected: ReadonlyMap<string, string>;
  tagsOpen: ReadonlySet<string>;
  tagsStatus: string;
  tagsBusy: boolean;
  tagsActionKey: string;
  tagsWritable: boolean;
  mode: string;
  modeNote: string;
  mergeVisible: boolean;
  mergeDisabled: boolean;
  relinkVisible: boolean;
  relinkDisabled: boolean;
  loadHealth: () => Promise<void>;
  loadScan: (depth?: ScanDepth) => Promise<void>;
  expandScan: (kind: string) => void;
  loadTags: () => Promise<void>;
  setTagsField: (field: TagField) => void;
  selectSpelling: (key: string, value: string) => void;
  previewGroup: (key: string) => Promise<void>;
  applyGroup: (key: string) => Promise<void>;
  applyTitles: () => Promise<void>;
  applyMappings: () => Promise<void>;
  navigate: (action: HealthAction, id?: number) => void;
};

const HealthContext = createContext<HealthContextValue | null>(null);

/**
 * Supply one health-group snapshot to a React tree.
 *
 * @param value Current reports, chrome, and actions.
 * @param children Tree that may call `useHealth`.
 */
export function HealthProvider({
  value,
  children,
}: {
  value: HealthContextValue;
  children: ReactNode;
}) {
  return <HealthContext value={value}>{children}</HealthContext>;
}

/**
 * Read the shared Library health group.
 *
 * Throws when no `HealthProvider` is above this component.
 *
 * @returns The snapshot and actions for this island.
 */
export function useHealth(): HealthContextValue {
  const value = useContext(HealthContext);
  if (value === null) {
    throw new Error("useHealth must be used within HealthProvider");
  }
  return value;
}
