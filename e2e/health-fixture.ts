/**
 * Mount the Library health panel from HealthContext for Playwright.
 *
 * Does not open a window and does not read a Serato library.
 */

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import type { LibraryHealthReport } from "../src/lib/api-types";
import { HealthProvider, type HealthContextValue } from "../src/containers/HealthContext";
import { HealthPanel } from "../src/pages/HealthPanel";
import { setLocale } from "../src/lib/i18n";
import { applyStaticTooltips, installTooltips } from "../src/lib/ui/tooltip";

const report: LibraryHealthReport = {
  space: "Serato Library",
  crate: null,
  checked: 4,
  missing: {
    count: 1,
    tracks: [{ id: 10, name: "Gone", artist: "A", file: "gone.mp3" }],
  },
  no_bpm: { count: 0, tracks: [] },
  no_key: { count: 0, tracks: [] },
  no_beatgrid: { count: 0, tracks: [] },
  no_artwork: { count: 0, tracks: [] },
  empty_genre: { count: 0, tracks: [] },
  no_crate: { count: 0, tracks: [] },
  unused: { count: 0, files: [] },
  duplicates: { count: 0, groups: [] },
};

const value: HealthContextValue = {
  healthReport: report,
  healthStatus: "",
  healthBusy: false,
  healthScope: "Whole space",
  scanReport: null,
  scanStatus: "",
  scanBusy: false,
  scanScope: "Whole space",
  scanFullDisabled: true,
  scanExpanded: new Set(),
  tagsField: "genre",
  tagsClusters: null,
  titlePlan: null,
  mappingPlan: null,
  tagsPlans: new Map(),
  tagsSelected: new Map(),
  tagsOpen: new Set(),
  tagsStatus: "",
  tagsBusy: false,
  tagsActionKey: "",
  tagsWritable: false,
  mode: "health",
  modeNote: "",
  mergeVisible: false,
  mergeDisabled: true,
  relinkVisible: false,
  relinkDisabled: true,
  loadHealth: async () => {},
  loadScan: async () => {},
  expandScan: () => {},
  loadTags: async () => {},
  setTagsField: () => {},
  selectSpelling: () => {},
  previewGroup: async () => {},
  applyGroup: async () => {},
  applyTitles: async () => {},
  applyMappings: async () => {},
  navigate: () => {},
};

setLocale("en");
installTooltips();
applyStaticTooltips();
const host = document.getElementById("health-root");
if (host) {
  createRoot(host).render(
    createElement(HealthProvider, { value, children: createElement(HealthPanel) }),
  );
  host.dataset.healthFixture = "ready";
}
