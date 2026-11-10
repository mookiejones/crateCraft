/**
 * Library health screens paint from HealthContext.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LibraryHealthReport } from "../api-types";
import { HealthProvider, type HealthContextValue } from "../context/HealthContext";
import { setLocale } from "../i18n";
import { installPage } from "../test-page";
import { HealthListChrome } from "./HealthListChrome";
import { HealthPanel } from "./HealthPanel";

const report: LibraryHealthReport = {
  space: "Serato Library",
  crate: 5,
  checked: 12,
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

function fakeHealth(overrides: Partial<HealthContextValue> = {}): HealthContextValue {
  return {
    healthReport: null,
    healthStatus: "",
    healthBusy: false,
    healthScope: "Friday",
    scanReport: null,
    scanStatus: "",
    scanBusy: false,
    scanScope: "Friday",
    scanFullDisabled: false,
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
    ...overrides,
  };
}

describe("HealthPanel context", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
  });

  it("renders the health report from context and opens Missing files", () => {
    const navigate = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(HealthProvider, {
          value: fakeHealth({ healthReport: report, navigate }),
          children: createElement(HealthPanel),
        }),
      );
    });
    expect(host.textContent).toContain("12 tracks checked.");
    expect(host.textContent).toContain("Missing files (1)");
    expect(host.textContent).toContain("A — Gone");
    expect(host.querySelector("#health-scope")?.textContent).toBe("Friday");
    host.querySelector<HTMLButtonElement>("[data-health-action='missing']")?.click();
    expect(navigate).toHaveBeenCalledWith("missing");
    root.unmount();
  });

  it("renders Merge copies from context on the duplicates chrome", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(HealthProvider, {
          value: fakeHealth({
            mode: "duplicates",
            mergeVisible: true,
            mergeDisabled: false,
          }),
          children: createElement(HealthListChrome),
        }),
      );
    });
    const merge = host.querySelector<HTMLButtonElement>("#merge-duplicates");
    expect(merge?.disabled).toBe(false);
    expect((host.querySelector("#duplicate-actions") as HTMLElement).hidden).toBe(false);
    expect((host.querySelector("#relink-actions") as HTMLElement).hidden).toBe(true);
    root.unmount();
  });
});
