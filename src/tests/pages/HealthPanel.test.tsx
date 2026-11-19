/**
 * Library health screens paint from HealthContext.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LibraryHealthReport } from "../../lib/api-types";
import { HealthProvider, type HealthContextValue } from "../../containers/HealthContext";
import { setLocale } from "../../lib/i18n";
import { installPage } from "../test-page";
import { HealthListChrome } from "../../pages/HealthListChrome";
import { HealthPanel } from "../../pages/HealthPanel";

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
  suspicious_cues: {
    count: 1,
    tracks: [{ id: 14, name: "Stacked", artist: "E", file: "stacked.mp3" }],
  },
  empty_genre: { count: 0, tracks: [] },
  no_crate: { count: 0, tracks: [] },
  unused: { count: 0, files: [] },
  duplicates: { count: 0, groups: [] },
  quality: {
    count: 1,
    dismissed: 1,
    tracks: [
      {
        id: 14,
        name: "Quiet",
        artist: "Q",
        file: "quiet.wav",
        quality: { format: "wav", bitrate_kbps: 128, peak_db: -12 },
      },
    ],
  },
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
    expect(host.textContent).toContain("wav · 128 kbps · peak -12 dB");
    expect(host.textContent).toContain("Not a problem");
    expect(host.textContent).toContain("Show dismissed");
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
    expect(merge?.className).toContain("MuiButton");
    expect((host.querySelector("#duplicate-actions") as HTMLElement).hidden).toBe(false);
    expect((host.querySelector("#relink-actions") as HTMLElement).hidden).toBe(true);
    root.unmount();
  });

  it("uses Accordion sections that toggle from the keyboard", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(HealthProvider, {
          value: fakeHealth({ healthReport: report }),
          children: createElement(HealthPanel),
        }),
      );
    });
    expect(host.querySelector("details")).toBeNull();
    const summary = [...host.querySelectorAll<HTMLButtonElement>(".MuiAccordionSummary-root")]
      .find((node) => node.textContent?.includes("Missing files (1)"));
    expect(summary).toBeTruthy();
    expect(summary!.tagName).toBe("BUTTON");
    expect(summary!.getAttribute("aria-expanded")).toBe("true");
    summary!.focus();
    expect(document.activeElement).toBe(summary);
    flushSync(() => {
      summary!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      summary!.click();
    });
    expect(summary!.getAttribute("aria-expanded")).toBe("false");
    flushSync(() => {
      summary!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      summary!.click();
    });
    expect(summary!.getAttribute("aria-expanded")).toBe("true");
    expect(host.textContent).toContain("A — Gone");
    root.unmount();
  });

  it("renders Relink as an MUI button on the missing chrome", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(HealthProvider, {
          value: fakeHealth({
            mode: "missing",
            relinkVisible: true,
            relinkDisabled: false,
          }),
          children: createElement(HealthListChrome),
        }),
      );
    });
    const relink = host.querySelector<HTMLButtonElement>("#open-relink");
    expect(relink?.disabled).toBe(false);
    expect(relink?.className).toContain("MuiButton");
    expect((host.querySelector("#relink-actions") as HTMLElement).hidden).toBe(false);
    expect((host.querySelector("#duplicate-actions") as HTMLElement).hidden).toBe(true);
    root.unmount();
  });

  it("renders suspicious cues and the review button", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(
        createElement(HealthProvider, {
          value: fakeHealth({ healthReport: report }),
          children: createElement(HealthPanel),
        }),
      );
    });
    expect(host.textContent).toContain("Suspicious cues (1)");
    expect(host.textContent).toContain("E — Stacked");
    const review = host.querySelector<HTMLButtonElement>("[data-health-action='cues-preview']");
    expect(review?.textContent).toBe("Review duplicate cues");
    expect(review?.dataset.tooltipKey).toBe("tooltip.suspiciousCues");
    const apply = host.querySelector<HTMLButtonElement>("[data-health-action='cues-apply']");
    expect(apply?.textContent).toBe("Remove duplicate cues");
    expect(apply?.disabled).toBe(true);
    root.unmount();
  });
});
