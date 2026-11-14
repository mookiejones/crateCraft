/**
 * Field editor Review posts a preview. Apply stays off until that preview matches.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TagClusterPlan } from "../../lib/api-types";
import { MuiThemeRoot } from "../../app/mui-theme-root";
import { FieldEditorBar } from "../../components/FieldEditorBar";
import { TrackListProvider, type TrackListContextValue } from "../../containers/TrackListContext";
import { setLocale } from "../../lib/i18n";
import { getTrackListActions, readTrackList } from "../../lib/ui/track-list-store";
import { drainReactScheduler, installPage } from "../test-page";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return { ...actual, postJSON };
});

const preview: TagClusterPlan = {
  field: "genre",
  value: "House",
  key: "edit",
  written: false,
  changes: [{ id: 1, from: "Deep House", to: "House" }],
};

function value(partial: Partial<TrackListContextValue> = {}): TrackListContextValue {
  return {
    ...readTrackList(),
    ...getTrackListActions(),
    writable: true,
    space: "Serato Library",
    mode: "crates",
    ...partial,
  };
}

describe("FieldEditorBar", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    installPage();
    setLocale("en");
    postJSON.mockReset();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    flushSync(() => root.unmount());
    host.remove();
    await drainReactScheduler();
    setLocale("en");
  });

  function paint(ids: number[], extra: Partial<TrackListContextValue> = {}): void {
    flushSync(() => {
      root.render(
        createElement(MuiThemeRoot, {
          children: createElement(TrackListProvider, {
            value: value(extra),
            children: createElement(FieldEditorBar, { selectedIds: ids }),
          }),
        }),
      );
    });
  }

  it("stays hidden for one selected row", () => {
    paint([1]);
    expect(host.querySelector("#field-edit")).toBeNull();
  });

  it("keeps Apply off until Review matches the current field and value", async () => {
    postJSON.mockResolvedValue(preview);
    paint([1, 2]);
    const apply = host.querySelector<HTMLButtonElement>("#field-edit-apply");
    const review = host.querySelector<HTMLButtonElement>("#field-edit-preview");
    const field = host.querySelector<HTMLSelectElement>("#field-edit-field");
    const input = host.querySelector<HTMLInputElement>("#field-edit-value");
    expect(host.querySelector("#field-edit")).not.toBeNull();
    expect(apply?.disabled).toBe(true);
    expect(field?.value).toBe("genre");
    expect(review?.disabled).toBe(false);
    if (input) input.value = "House";
    input?.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync(() => {
      review?.click();
    });
    await vi.waitFor(() => {
      expect(postJSON).toHaveBeenCalledWith("/api/tag-clusters", {
        action: "edit-preview",
        space: "Serato Library",
        ids: [1, 2],
        field: "genre",
        value: "House",
      });
    });
    await vi.waitFor(() => {
      expect(host.querySelector("#field-edit-apply")?.hasAttribute("disabled")).toBe(false);
    });
    expect(host.querySelector("#field-edit-status")?.textContent).toBe(
      "1 track would become House.",
    );
    flushSync(() => {
      host.querySelector<HTMLButtonElement>("#field-edit-apply")?.click();
    });
    await vi.waitFor(() => {
      expect(postJSON).toHaveBeenCalledWith("/api/tag-clusters", {
        action: "edit-apply",
        space: "Serato Library",
        ids: [1, 2],
        field: "genre",
        value: "House",
      });
    });
  });

  it("disables Apply while the library is locked", () => {
    paint([1, 2], { writable: false });
    expect(host.querySelector<HTMLButtonElement>("#field-edit-apply")?.disabled).toBe(true);
  });
});
