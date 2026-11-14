/**
 * Field-edit engine posts edit-preview and edit-apply.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TagClusterPlan } from "../../../lib/api-types";
import { bridge } from "../../../lib/bridge";
import { applyFieldEdit, previewFieldEdit } from "../../../lib/crates/field-edit";
import { setLocale } from "../../../lib/i18n";
import { state } from "../../../lib/state";
import { getNotice, resetNotice } from "../../../lib/ui/notice-store";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/api")>();
  return { ...actual, postJSON };
});

const preview: TagClusterPlan = {
  field: "genre",
  value: "House",
  key: "edit",
  written: false,
  changes: [{ id: 1, from: "Deep House", to: "House" }],
};

const written: TagClusterPlan = {
  ...preview,
  written: true,
};

describe("field-edit engine", () => {
  beforeEach(() => {
    setLocale("en");
    state.space = "Serato Library";
    postJSON.mockReset();
    bridge.reloadLibrary = vi.fn(async () => undefined);
    bridge.lockDown = vi.fn();
    resetNotice();
  });

  afterEach(() => {
    resetNotice();
    setLocale("en");
  });

  it("posts edit-preview with the selected ids and does not reload", async () => {
    postJSON.mockResolvedValueOnce(preview);
    await expect(previewFieldEdit([1, 2], "genre", "House")).resolves.toEqual(preview);
    expect(postJSON).toHaveBeenCalledWith("/api/tag-clusters", {
      action: "edit-preview",
      space: "Serato Library",
      ids: [1, 2],
      field: "genre",
      value: "House",
    });
    expect(bridge.reloadLibrary).not.toHaveBeenCalled();
    expect(getNotice()).toBeNull();
  });

  it("posts edit-apply, reloads when written, and names the write", async () => {
    postJSON.mockResolvedValueOnce(written);
    await expect(applyFieldEdit([1, 2], "genre", "House")).resolves.toEqual(written);
    expect(postJSON).toHaveBeenCalledWith("/api/tag-clusters", {
      action: "edit-apply",
      space: "Serato Library",
      ids: [1, 2],
      field: "genre",
      value: "House",
    });
    expect(bridge.reloadLibrary).toHaveBeenCalled();
    expect(getNotice()?.text).toBe("Wrote House on 1 track.");
  });

  it("does not reload when the plan did not write", async () => {
    postJSON.mockResolvedValueOnce(preview);
    await applyFieldEdit([1, 2], "genre", "House");
    expect(bridge.reloadLibrary).not.toHaveBeenCalled();
  });

  it("locks the library on a 409 apply", async () => {
    const locked = Object.assign(new Error("Serato is open."), { status: 409 });
    postJSON.mockRejectedValueOnce(locked);
    await expect(applyFieldEdit([1, 2], "genre", "House")).rejects.toThrow("Serato is open.");
    expect(bridge.lockDown).toHaveBeenCalledWith(locked);
    expect(bridge.reloadLibrary).not.toHaveBeenCalled();
    expect(getNotice()?.text).toBe("Serato is open.");
    expect(getNotice()?.severity).toBe("error");
  });
});
