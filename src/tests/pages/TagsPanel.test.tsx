/**
 * TagsPanel Apply posts once. Parent report handlers must not re-fire.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TagClusterGroup, TagClusterPlan, TagClusters } from "../../lib/api-types";
import { HealthProvider, type HealthContextValue } from "../../containers/HealthContext";
import { setLocale } from "../../lib/i18n";
import { installPage } from "../test-page";
import { TagsPanel } from "../../pages/TagsPanel";

const group: TagClusterGroup = {
  key: "hiphop",
  suggested: "Hip Hop",
  tracks: 5,
  spellings: [
    { value: "Hip Hop", count: 3 },
    { value: "Hip-Hop", count: 2 },
  ],
};

const clusters: TagClusters = {
  field: "genre",
  values: 2,
  groups: [group],
};

const groupPlan: TagClusterPlan = {
  field: "genre",
  value: "Hip Hop",
  key: "hiphop",
  written: false,
  changes: [{ id: 1, from: "Hip-Hop", to: "Hip Hop" }],
};

const titlePlan: TagClusterPlan = {
  field: "name",
  value: "titles",
  key: "clean",
  written: false,
  changes: [{ id: 2, from: "01 TRACK", to: "Track" }],
};

const mappingPlan: TagClusterPlan = {
  field: "mappings",
  value: "saved",
  key: "saved",
  written: false,
  changes: [{ id: 10, from: "Hip-Hop", to: "Hip Hop", field: "genre" }],
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
    tagsWritable: true,
    mode: "tags",
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

function mountTags(value: HealthContextValue): { host: HTMLDivElement; root: ReturnType<typeof createRoot> } {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  flushSync(() => {
    root.render(
      createElement(HealthProvider, {
        value,
        children: createElement(TagsPanel),
      }),
    );
  });
  return { host, root };
}

describe("TagsPanel apply clicks", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
  });

  it("calls applyGroup once for one Apply click", () => {
    const applyGroup = vi.fn(async () => {});
    const { host, root } = mountTags(fakeHealth({
      tagsClusters: clusters,
      tagsPlans: new Map([["hiphop", groupPlan]]),
      applyGroup,
    }));
    host.querySelector<HTMLButtonElement>('[data-tags-action="apply"]')!.click();
    expect(applyGroup).toHaveBeenCalledTimes(1);
    expect(applyGroup).toHaveBeenCalledWith("hiphop");
    root.unmount();
  });

  it("calls previewGroup once for one Review click", () => {
    const previewGroup = vi.fn(async () => {});
    const { host, root } = mountTags(fakeHealth({
      tagsClusters: clusters,
      previewGroup,
    }));
    host.querySelector<HTMLButtonElement>('[data-tags-action="preview"]')!.click();
    expect(previewGroup).toHaveBeenCalledTimes(1);
    expect(previewGroup).toHaveBeenCalledWith("hiphop");
    root.unmount();
  });

  it("calls applyTitles once for one titles Apply click", () => {
    const applyTitles = vi.fn(async () => {});
    const { host, root } = mountTags(fakeHealth({
      tagsField: "titles",
      titlePlan,
      applyTitles,
    }));
    host.querySelector<HTMLButtonElement>('[data-tags-action="clean-apply"]')!.click();
    expect(applyTitles).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it("calls applyMappings once for one Apply saved mappings click", () => {
    const applyMappings = vi.fn(async () => {});
    const { host, root } = mountTags(fakeHealth({
      tagsClusters: clusters,
      mappingPlan,
      applyMappings,
    }));
    host.querySelector<HTMLButtonElement>('[data-tags-action="refresh-apply"]')!.click();
    expect(applyMappings).toHaveBeenCalledTimes(1);
    root.unmount();
  });

  it("calls selectSpelling once when a radio changes", () => {
    const selectSpelling = vi.fn();
    const { host, root } = mountTags(fakeHealth({
      tagsClusters: clusters,
      selectSpelling,
    }));
    const other = host.querySelector<HTMLInputElement>("input[name='tags-hiphop'][value='Hip-Hop']")!;
    other.click();
    expect(selectSpelling).toHaveBeenCalledTimes(1);
    expect(selectSpelling).toHaveBeenCalledWith("hiphop", "Hip-Hop");
    root.unmount();
  });
});
