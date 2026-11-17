/**
 * Serato DJ Pro default catalog and override merge.
 *
 * Official table: support.serato.com Keyboard Shortcuts article.
 * Live rows are the crateCraft actions; the rest stay listed.
 */

import { describe, expect, it } from "vitest";
import { CATALOG, effectiveShortcuts, type CatalogEntry, type ShortcutChord } from "../lib/ui/shortcut-catalog";
import { unlabeledCatalogIds } from "../lib/ui/shortcut-labels";
import { chordMatches } from "../lib/ui/shortcuts";

function chord(key: string, flags: { mod?: boolean; shift?: boolean; alt?: boolean } = {}): ShortcutChord {
  return { key, ...flags };
}

function entry(id: string): CatalogEntry {
  const row = CATALOG.find((item) => item.id === id);
  if (!row) throw new Error(`missing catalog id ${id}`);
  return row;
}

function keysOf(id: string): ShortcutChord[] {
  return [...entry(id).seratoKeys];
}

describe("chordMatches alt", () => {
  it("matches Alt+E when the chord asks for alt", () => {
    const event = new KeyboardEvent("keydown", { key: "e", altKey: true });
    expect(chordMatches({ key: "e", alt: true }, event)).toBe(true);
  });

  it("rejects E without Alt when the chord asks for alt", () => {
    const event = new KeyboardEvent("keydown", { key: "e" });
    expect(chordMatches({ key: "e", alt: true }, event)).toBe(false);
  });

  it("rejects Alt+Ctrl+K for a Command+K chord", () => {
    const event = new KeyboardEvent("keydown", { key: "k", altKey: true, ctrlKey: true });
    expect(chordMatches({ key: "k", mod: true }, event)).toBe(false);
  });
});

describe("Serato catalog", () => {
  it("lists every official playback, loop, sample, and library row", () => {
    const ids = CATALOG.map((row) => row.id);
    const required = [
      "load-selected",
      "load-selected-right",
      "double-loaded-left",
      "double-loaded-right",
      "eject-left",
      "eject-right",
      "play-pause",
      "play-pause-right",
      "reverse-left",
      "reverse-right",
      "set-next-cue-left",
      "set-next-cue-right",
      "cue-jump-1",
      "cue-jump-2",
      "cue-jump-3",
      "cue-jump-4",
      "cue-jump-5",
      "cue-jump-6",
      "cue-jump-7",
      "cue-jump-8",
      "cue-jump-9",
      "cue-jump-0",
      "delete-cue-1",
      "delete-cue-2",
      "delete-cue-3",
      "delete-cue-4",
      "delete-cue-5",
      "delete-cue-6",
      "delete-cue-7",
      "delete-cue-8",
      "delete-cue-9",
      "delete-cue-0",
      "temp-cue-left",
      "temp-cue-right",
      "play-next",
      "load-next-right",
      "play-previous",
      "load-prev-right",
      "seek-back",
      "rewind-right",
      "seek-forward",
      "ff-right",
      "pitch-bend-down-left",
      "pitch-bend-down-right",
      "pitch-bend-up-left",
      "pitch-bend-up-right",
      "pitch-down-left",
      "pitch-down-right",
      "pitch-up-left",
      "pitch-up-right",
      "censor-left",
      "censor-right",
      "keylock-left",
      "keylock-right",
      "flip",
      "loop-on-left",
      "loop-on-right",
      "autoloop-1",
      "autoloop-2",
      "autoloop-3",
      "autoloop-4",
      "autoloop-5",
      "autoloop-6",
      "autoloop-7",
      "autoloop-8",
      "autoloop-9",
      "autoloop-0",
      "loop-roll-1",
      "loop-roll-2",
      "loop-roll-3",
      "loop-roll-4",
      "loop-roll-5",
      "loop-roll-6",
      "loop-roll-7",
      "loop-roll-8",
      "loop-roll-9",
      "loop-roll-0",
      "slot-reloop-left",
      "slot-reloop-right",
      "loop-in-left",
      "loop-in-right",
      "loop-out-left",
      "loop-out-right",
      "loop-slot-up-left",
      "loop-slot-up-right",
      "loop-slot-down-left",
      "loop-slot-down-right",
      "sample-load-1",
      "sample-load-2",
      "sample-load-3",
      "sample-load-4",
      "sample-load-5",
      "sample-load-6",
      "sample-load-7",
      "sample-load-8",
      "sample-play-1",
      "sample-play-2",
      "sample-play-3",
      "sample-play-4",
      "sample-play-5",
      "sample-play-6",
      "sample-play-7",
      "sample-play-8",
      "sample-stop-1",
      "sample-stop-2",
      "sample-stop-3",
      "sample-stop-4",
      "sample-stop-5",
      "sample-stop-6",
      "sample-stop-7",
      "sample-stop-8",
      "list-previous",
      "list-next",
      "crate-previous",
      "crate-next",
      "focus-next-pane",
      "focus-search",
      "reveal-track",
      "locate-playing",
      "select-all",
      "undo-load",
      "delete-row",
      "remove-from-library",
      "trash-track",
      "view-prepare",
      "waveform-zoom-in",
      "waveform-zoom-out",
      "zoom-library-in",
      "zoom-library-out",
      "start-recording",
      "open-external",
      "bpm-double",
      "bpm-halve",
      "beatgrid-edit",
      "exit-app",
      "quick-open",
      "cheat-sheet",
      "list-open",
      "dismiss",
      "view-library",
      "view-crates",
      "view-files",
      "view-history",
      "view-snapshots",
    ];
    for (const id of required) expect(ids, id).toContain(id);
  });

  it("uses the official Serato chords for live left-deck and library rows", () => {
    expect(keysOf("play-pause")).toEqual([chord("w")]);
    expect(keysOf("load-selected")).toEqual([chord("ArrowLeft", { shift: true })]);
    expect(keysOf("play-next")).toEqual([chord("w", { alt: true })]);
    expect(keysOf("play-previous")).toEqual([chord("q", { alt: true })]);
    expect(keysOf("seek-back")).toEqual([chord("e", { alt: true })]);
    expect(keysOf("seek-forward")).toEqual([chord("r", { alt: true })]);
    expect(keysOf("cue-jump-1")).toEqual([chord("1")]);
    expect(keysOf("cue-jump-8")).toEqual([chord("8")]);
    expect(keysOf("cue-jump-9")).toEqual([chord("9")]);
    expect(keysOf("list-previous")).toEqual([chord("ArrowUp")]);
    expect(keysOf("crate-next")).toEqual([chord("ArrowDown", { mod: true, shift: true })]);
    expect(keysOf("focus-search")).toEqual([chord("f", { mod: true })]);
    expect(keysOf("reveal-track")).toEqual([chord("r", { mod: true })]);
    expect(keysOf("waveform-zoom-in")).toEqual([chord("+")]);
    expect(keysOf("delete-row")).toEqual([chord("Delete", { mod: true })]);
    expect(keysOf("remove-from-library")).toEqual([chord("Delete", { alt: true })]);
    expect(keysOf("trash-track")).toEqual([chord("Delete", { mod: true, shift: true })]);
    expect(keysOf("exit-app")).toEqual([chord("Escape")]);
    expect(keysOf("loop-on-left")).toEqual([chord("[")]);
    expect(keysOf("sample-play-1")).toEqual([chord("z")]);
  });

  it("marks mixer, loop, sample, cue-write, and exit rows as not live", () => {
    expect(entry("play-pause").live).toBe(true);
    expect(entry("cue-jump-8").live).toBe(true);
    expect(entry("cue-jump-9").live).toBe(false);
    expect(entry("play-pause-right").live).toBe(false);
    expect(entry("reverse-left").live).toBe(false);
    expect(entry("delete-cue-1").live).toBe(false);
    expect(entry("loop-on-left").live).toBe(false);
    expect(entry("sample-play-1").live).toBe(false);
    expect(entry("exit-app").live).toBe(false);
    expect(entry("undo-load").live).toBe(false);
    expect(entry("beatgrid-edit").live).toBe(false);
  });

  it("labels every catalog id", () => {
    expect(unlabeledCatalogIds(CATALOG.map((row) => row.id))).toEqual([]);
  });
});

describe("effectiveShortcuts", () => {
  it("binds play-pause to W and extra Space with no overrides", () => {
    const play = effectiveShortcuts({}).find((row) => row.id === "play-pause");
    expect(play?.keys).toEqual([chord("w"), chord(" ")]);
  });

  it("replaces a live row with a saved override", () => {
    const play = effectiveShortcuts({ "play-pause": [chord("q")] }).find((row) => row.id === "play-pause");
    expect(play?.keys).toEqual([chord("q")]);
  });

  it("omits unavailable Serato rows from the live table", () => {
    const ids = effectiveShortcuts({}).map((row) => row.id);
    expect(ids).not.toContain("exit-app");
    expect(ids).not.toContain("loop-on-left");
    expect(ids).toContain("play-pause");
    expect(ids).toContain("quick-open");
  });
});
