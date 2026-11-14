/**
 * Field-editor labels, show gate, and Apply-ready fingerprint.
 */

import { describe, expect, it } from "vitest";
import type { TagClusterPlan } from "../../../lib/api-types";
import { setLocale } from "../../../lib/i18n";
import {
  EDIT_FIELDS,
  fieldEditApplyReady,
  fieldEditLabel,
  fieldEditPreviewText,
  fieldEditSelectedText,
  fieldEditShows,
  fieldEditWrittenText,
  type FieldEditRequest,
} from "../../../lib/crates/field-edit-view";

const plan: TagClusterPlan = {
  field: "genre",
  value: "House",
  key: "edit",
  written: false,
  changes: [
    { id: 1, from: "Deep House", to: "House" },
    { id: 2, from: "house", to: "House" },
  ],
};

const current: FieldEditRequest = { ids: [1, 2], field: "genre", value: "House" };

describe("field-edit-view", () => {
  it("lists the same text fields as a single-track save, without bpm", () => {
    expect([...EDIT_FIELDS]).toEqual([
      "name",
      "artist",
      "album",
      "genre",
      "year",
      "composer",
      "remixer",
      "label",
      "grouping",
      "comments",
      "key",
    ]);
    expect(EDIT_FIELDS).not.toContain("bpm");
    expect(EDIT_FIELDS).not.toContain("emoji");
  });

  it("shows the bar only when two or more rows are selected", () => {
    expect(fieldEditShows(0)).toBe(false);
    expect(fieldEditShows(1)).toBe(false);
    expect(fieldEditShows(2)).toBe(true);
    expect(fieldEditShows(3)).toBe(true);
  });

  it("labels name as Title and key as Key", () => {
    setLocale("en");
    expect(fieldEditLabel("name")).toBe("Title");
    expect(fieldEditLabel("artist")).toBe("Artist");
    expect(fieldEditLabel("genre")).toBe("Genre");
    expect(fieldEditLabel("key")).toBe("Key");
    setLocale("es");
    expect(fieldEditLabel("name")).toBe("Título");
    expect(fieldEditLabel("genre")).toBe("Género");
    setLocale("en");
  });

  it("keeps Apply off until the preview matches the current field, value, and ids", () => {
    expect(fieldEditApplyReady(plan, current, current, true, false)).toBe(true);
    expect(fieldEditApplyReady(plan, current, current, false, false)).toBe(false);
    expect(fieldEditApplyReady(plan, current, current, true, true)).toBe(false);
    expect(fieldEditApplyReady(null, current, current, true, false)).toBe(false);
    expect(
      fieldEditApplyReady(plan, current, { ...current, value: "Techno" }, true, false),
    ).toBe(false);
    expect(
      fieldEditApplyReady(plan, current, { ...current, ids: [1, 2, 3] }, true, false),
    ).toBe(false);
    expect(
      fieldEditApplyReady({ ...plan, changes: [] }, current, current, true, false),
    ).toBe(false);
  });

  it("describes a preview and a write in the active language", () => {
    setLocale("en");
    expect(fieldEditSelectedText(2)).toBe("2 tracks selected.");
    expect(fieldEditPreviewText(plan)).toBe("2 tracks would become House.");
    expect(fieldEditPreviewText({ ...plan, changes: [] })).toBe(
      "Those tracks already have that value.",
    );
    expect(fieldEditWrittenText({ ...plan, written: true })).toBe("Wrote House on 2 tracks.");
    setLocale("es");
    expect(fieldEditSelectedText(2)).toBe("2 pistas seleccionadas.");
    expect(fieldEditPreviewText({ ...plan, changes: [] })).toBe(
      "Esas pistas ya tienen ese valor.",
    );
    setLocale("en");
  });
});
