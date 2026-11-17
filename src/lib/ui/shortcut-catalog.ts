/**
 * Serato DJ Pro default shortcut catalog and override merge.
 *
 * Official table: support.serato.com Keyboard Shortcuts article (US
 * keyboard). Live rows are crateCraft actions. The rest stay listed.
 * This module does not import shortcuts.ts.
 */

export interface ShortcutChord {
  /** KeyboardEvent.key value. */
  key: string;
  /** Ctrl on Windows and Linux, Command on macOS. */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export type CatalogGroup = "playback" | "loop" | "sample" | "library" | "cratecraft";

export interface CatalogEntry {
  id: string;
  group: CatalogGroup;
  seratoKeys: ShortcutChord[];
  live: boolean;
  extras?: ShortcutChord[];
}

export interface EffectiveShortcut {
  id: string;
  keys: ShortcutChord[];
}

function chord(key: string, flags: { mod?: boolean; shift?: boolean; alt?: boolean } = {}): ShortcutChord {
  return { key, ...flags };
}

function entry(
  id: string,
  group: CatalogGroup,
  seratoKeys: ShortcutChord[],
  live: boolean,
  extras?: ShortcutChord[],
): CatalogEntry {
  return extras ? { id, group, seratoKeys, live, extras } : { id, group, seratoKeys, live };
}

const CUE_DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;
const SAMPLE_KEYS = ["z", "x", "c", "v", "b", "n", "m", ","] as const;

function cueJumpRows(): CatalogEntry[] {
  return CUE_DIGITS.map((digit, index) =>
    entry(`cue-jump-${digit}`, "playback", [chord(digit)], index < 8),
  );
}

function deleteCueRows(): CatalogEntry[] {
  return CUE_DIGITS.map((digit) =>
    entry(`delete-cue-${digit}`, "playback", [chord(digit, { mod: true, shift: true })], false),
  );
}

function autoloopRows(): CatalogEntry[] {
  return CUE_DIGITS.map((digit) => entry(`autoloop-${digit}`, "loop", [chord(digit, { alt: true })], false));
}

function loopRollRows(): CatalogEntry[] {
  return CUE_DIGITS.map((digit) =>
    entry(`loop-roll-${digit}`, "loop", [chord(digit, { mod: true, alt: true })], false),
  );
}

function sampleRows(kind: "load" | "play" | "stop"): CatalogEntry[] {
  return SAMPLE_KEYS.map((key, index) => {
    const flags = kind === "load" ? { mod: true, alt: true } : kind === "stop" ? { alt: true } : {};
    return entry(`sample-${kind}-${index + 1}`, "sample", [chord(key, flags)], false);
  });
}

export const CATALOG: readonly CatalogEntry[] = [
  entry("load-selected", "playback", [chord("ArrowLeft", { shift: true })], true),
  entry("load-selected-right", "playback", [chord("ArrowRight", { shift: true })], false),
  entry("double-loaded-left", "playback", [chord("ArrowLeft", { mod: true, shift: true })], false),
  entry("double-loaded-right", "playback", [chord("ArrowRight", { mod: true, shift: true })], false),
  entry("eject-left", "playback", [chord("ArrowLeft", { shift: true, alt: true })], false),
  entry("eject-right", "playback", [chord("ArrowRight", { shift: true, alt: true })], false),
  entry("play-pause", "playback", [chord("w")], true, [chord(" ")]),
  entry("play-pause-right", "playback", [chord("s")], false),
  entry("reverse-left", "playback", [chord("q")], false),
  entry("reverse-right", "playback", [chord("a")], false),
  entry("set-next-cue-left", "playback", [chord("`", { alt: true })], false),
  entry("set-next-cue-right", "playback", [chord("-", { alt: true })], false),
  ...cueJumpRows(),
  ...deleteCueRows(),
  entry("temp-cue-left", "playback", [chord("i")], false),
  entry("temp-cue-right", "playback", [chord("k")], false),
  entry("play-next", "playback", [chord("w", { alt: true })], true),
  entry("load-next-right", "playback", [chord("s", { alt: true })], false),
  entry("play-previous", "playback", [chord("q", { alt: true })], true),
  entry("load-prev-right", "playback", [chord("a", { alt: true })], false),
  entry("seek-back", "playback", [chord("e", { alt: true })], true, [chord("ArrowLeft")]),
  entry("rewind-right", "playback", [chord("d", { alt: true })], false),
  entry("seek-forward", "playback", [chord("r", { alt: true })], true, [chord("ArrowRight")]),
  entry("ff-right", "playback", [chord("f", { alt: true })], false),
  entry("pitch-bend-down-left", "playback", [chord("t")], false),
  entry("pitch-bend-down-right", "playback", [chord("g")], false),
  entry("pitch-bend-up-left", "playback", [chord("y")], false),
  entry("pitch-bend-up-right", "playback", [chord("h")], false),
  entry("pitch-down-left", "playback", [chord("e")], false),
  entry("pitch-down-right", "playback", [chord("d")], false),
  entry("pitch-up-left", "playback", [chord("r")], false),
  entry("pitch-up-right", "playback", [chord("f")], false),
  entry("censor-left", "playback", [chord("u")], false),
  entry("censor-right", "playback", [chord("j")], false),
  entry("keylock-left", "playback", [chord("F5")], false),
  entry("keylock-right", "playback", [chord("F10")], false),
  entry("flip", "playback", [chord("\\")], false),
  entry("loop-on-left", "loop", [chord("[")], false),
  entry("loop-on-right", "loop", [chord("'")], false),
  ...autoloopRows(),
  ...loopRollRows(),
  entry("slot-reloop-left", "loop", [chord("[", { alt: true })], false),
  entry("slot-reloop-right", "loop", [chord("'", { alt: true })], false),
  entry("loop-in-left", "loop", [chord("o")], false),
  entry("loop-in-right", "loop", [chord("k")], false),
  entry("loop-out-left", "loop", [chord("p")], false),
  entry("loop-out-right", "loop", [chord("l")], false),
  entry("loop-slot-up-left", "loop", [chord("o", { alt: true })], false),
  entry("loop-slot-up-right", "loop", [chord("l", { alt: true })], false),
  entry("loop-slot-down-left", "loop", [chord("p", { alt: true })], false),
  entry("loop-slot-down-right", "loop", [chord(";", { alt: true })], false),
  ...sampleRows("load"),
  ...sampleRows("play"),
  ...sampleRows("stop"),
  entry("list-previous", "library", [chord("ArrowUp")], true),
  entry("list-next", "library", [chord("ArrowDown")], true),
  entry("crate-previous", "library", [chord("ArrowUp", { mod: true, shift: true })], true),
  entry("crate-next", "library", [chord("ArrowDown", { mod: true, shift: true })], true),
  entry("focus-next-pane", "library", [chord("Tab")], true),
  entry("focus-search", "library", [chord("f", { mod: true })], true, [chord("/")]),
  entry("reveal-track", "library", [chord("r", { mod: true })], true),
  entry("locate-playing", "library", [chord("l", { mod: true })], true),
  entry("select-all", "library", [chord("a", { mod: true })], true),
  entry("undo-load", "library", [chord("z", { mod: true })], false),
  entry("delete-row", "library", [chord("Delete", { mod: true })], true),
  entry("remove-from-library", "library", [chord("Delete", { alt: true })], true),
  entry("trash-track", "library", [chord("Delete", { mod: true, shift: true })], true),
  entry("view-prepare", "library", [chord("p", { mod: true })], true),
  entry("waveform-zoom-in", "library", [chord("+")], true),
  entry("waveform-zoom-out", "library", [chord("-")], true),
  entry("zoom-library-in", "library", [chord("+", { mod: true })], false),
  entry("zoom-library-out", "library", [chord("-", { mod: true })], false),
  entry("start-recording", "library", [chord("n", { mod: true })], false),
  entry("open-external", "library", [chord("o", { mod: true })], false),
  entry("bpm-double", "library", [chord("ArrowUp", { alt: true })], false),
  entry("bpm-halve", "library", [chord("ArrowDown", { alt: true })], false),
  entry("beatgrid-edit", "library", [chord(" ", { alt: true })], false),
  entry("exit-app", "library", [chord("Escape")], false),
  entry("quick-open", "cratecraft", [chord("k", { mod: true })], true),
  entry("cheat-sheet", "cratecraft", [chord("?")], true),
  entry("list-open", "cratecraft", [chord("Enter")], true),
  entry("dismiss", "cratecraft", [chord("Escape")], true),
  entry("view-library", "cratecraft", [chord("1", { mod: true })], true),
  entry("view-crates", "cratecraft", [chord("2", { mod: true })], true),
  entry("view-files", "cratecraft", [chord("3", { mod: true })], true),
  entry("view-history", "cratecraft", [chord("4", { mod: true })], true),
  entry("view-snapshots", "cratecraft", [chord("5", { mod: true })], true),
];

/**
 * Return live shortcut chords after applying saved overrides.
 *
 * A missing id keeps Serato keys plus extras. A saved list replaces both.
 * Unavailable rows stay out of the live table.
 *
 * @param overrides Saved id → chords map. Unknown ids are ignored.
 * @returns Live rows with the chords the matcher should bind.
 */
export function effectiveShortcuts(overrides: Record<string, ShortcutChord[]>): EffectiveShortcut[] {
  return CATALOG.filter((row) => row.live).map((row) => ({
    id: row.id,
    keys: overrides[row.id] ?? [...row.seratoKeys, ...(row.extras ?? [])],
  }));
}
