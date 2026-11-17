# Serato-default hotkeys (configurable)

> **For agentic workers:** Use superpowers:executing-plans (native) unless Charles picks subagent-driven. Steps use checkbox (`- [ ]`) syntax.

**Goal:** crateCraft uses the official Serato DJ Pro keyboard map as defaults, lets the DJ remap live actions, and shows the full Serato catalog on a Keyboard shortcuts page.

**Architecture:** One typed catalog in `src/lib/ui/shortcuts.ts` (defaults + handlers + cheat-sheet). Saved remaps are a `shortcuts` object in `settings.json` via existing `POST /api/settings`. The matcher gains `alt`. Serato actions crateCraft cannot perform stay on the page as read-only rows. Single player uses **left-deck** keys.

**Tech stack:** existing TypeScript shortcut table, React `SettingsPanel`, `app_config.py` `SETTINGS_KEYS`, Vitest + Python unittest. No new dependency.

**Source of defaults:** [Serato DJ Pro Keyboard Shortcuts](https://support.serato.com/hc/en-us/articles/233087008-Keyboard-Shortcuts) (US keyboard; Control = Command on Mac; Alt = Option on Mac). Ignore Serato Play expansion and “Playback Keys Use Shift”.

## Conflicts (current crateCraft vs Serato)

Charles asked to be told about collisions. Locked resolutions:

| Chord today | crateCraft today | Serato DJ | Resolution |
| --- | --- | --- | --- |
| Space | Play/pause | unused (Alt+Space = beatgrid edit) | Play default is **W**. Space stays an extra play chord so current muscle memory still works. |
| Left / Right | Seek ±5s | Shift+Left/Right = load to deck; unmodified arrows are not seek | Seek default is **Alt+E / Alt+R** (Serato rewind/FF). Left/Right stay extra seek chords when the crate tree does not have focus (today’s crate-tree Left/Right already skip seek). |
| 1–5 (no modifier) | unused | Jump/set left-deck cues | **Jump only** to pads 1–5. Empty pad is a no-op. Never write cue bytes. |
| 6–0 | unused | Right-deck cues 1–5 | crateCraft has one player and eight pads. **6–8 jump pads 6–8.** 9 and 0 stay “Not in crateCraft”. |
| Cmd/Ctrl+1–5 | Switch views | cues are unmodded 1–5; Ctrl+1–5 is “add cue” in some docs | Keep view switching. Do not steal digits for views. |
| Esc | Close dialog / clear search | Exit Serato DJ Pro | **Keep dismiss. Never quit the app.** |
| Cmd/Ctrl+F | Focus search | Move cursor to search | Same. Keep. `/` stays extra. |
| Cmd/Ctrl+K, `?` | Quick Open / cheat sheet | none | Keep as crateCraft extras. |
| Cmd/Ctrl+A, Z, N, O | unused / browser | Select all / undo load / new recording / open in player | Wire only where crateCraft already has the action (select all, reveal). Do not steal Ctrl+Z. Ctrl+N and Ctrl+O stay listed, not wired. |
| Tab | browser focus | Shift highlight focus | Cycle crate tree → track list → detail. |
| W / S / Q / A / … | unused (gated while typing) | left/right deck mixer | Wire left-deck keys that crateCraft can do. Right-deck mixer keys stay listed, not wired. |

## What ships vs what stays listed

**Live (wired, remappable).** Left-deck / library actions crateCraft can do:

- Play/pause: **W** (+ extra Space)
- Load selected: **Shift+Left** → play the selected row (Serato “load left deck”)
- Load next / previous: **Alt+W / Alt+Q** → existing `next()` / `previous()`
- Rewind / FF: **Alt+E / Alt+R** (+ extra Left/Right seek ±5s)
- Cue jump pads 1–8: **1–8** (seek to that pad if it has a time)
- Move tracks: Up / Down
- Move crates: **Ctrl/Cmd+Shift+Up/Down**
- Focus search: Ctrl/Cmd+F and `/`
- Reveal in Finder/Explorer: **Ctrl/Cmd+R** (existing reveal)
- Locate playing track: **Ctrl/Cmd+L**
- Prepare space: **Ctrl/Cmd+P**
- Waveform zoom: **+ / -**
- Select all rows: **Ctrl/Cmd+A**
- Delete crate / remove from library / trash: **Ctrl+Delete / Alt+Delete / Ctrl+Shift+Delete** only through the existing confirm dialogs
- Open row: Enter
- Dismiss: Esc
- crateCraft extras: Cmd/Ctrl+K, `?`, Cmd/Ctrl+1–5 views

**Listed, not wired** (page shows the Serato chord and “Not in crateCraft”):

- Right deck load/eject/play/pitch/censor/keylock
- Reverse play, pitch bend/up/down, censor, keylock, Flip
- Set / delete / temporary cue (file writes)
- All loop, autoloop, loop-roll, sample-player keys
- Double loaded track, eject virtual deck
- Undo track load (Ctrl+Z)
- Zoom library text size
- Start recording (Ctrl+N)
- Open in default media player (Ctrl+O)
- BPM double/halve, beatgrid edit (Alt+Space)
- Exit app (Esc)

Cue **edit** stays parked. Jump-only is in scope.

## Hotkeys page (picked, skip)

Settings is already a Main page. Expand **Keyboard shortcuts** into the catalog:

- Filter field at the top (100+ rows).
- Groups in Serato order: Playback, Loop, Sample, Library, then crateCraft extras.
- Live row: action, current chord(s), **Change**, **Reset**.
- Unavailable row: Serato chord, muted “Not in crateCraft”.
- **Reset all to Serato defaults** (clears saved overrides; crateCraft extras return to their extra chords).
- `?` and Help → Keyboard shortcuts still scroll to `#shortcuts-title`.
- No new rail item.

Change capture: click Change, listen for the next `keydown`, refuse a chord another live action already owns, persist overrides.

## Persistence

`settings.json` key `shortcuts`: map of shortcut id → array of `{ key, mod?, shift?, alt? }`.

- Missing key or missing id → Serato/crateCraft default.
- Unknown id, bad type, or empty chord list → warn `shortcuts.<id>`, ignore that id, keep default.
- Store **overrides only** (diff from defaults) so new catalog rows ship without rewriting the file.
- `GET /api/settings` returns `shortcuts`.
- `POST /api/settings` `{ "shortcuts": { ... } }` merges like `layout` (re-read, validate, write full settings).
- Add `"shortcuts"` to `SETTINGS_KEYS`. Validate at the load boundary (app-config skill).

## Matcher change

`ShortcutChord` gains `alt?: boolean`.

Today `chordMatches` returns false whenever `event.altKey`. That blocks Serato rewind/FF, load next, crates, deletes. Alt must match `Boolean(chord.alt)`.

## Cue jump (unpark jump-only)

- `PlayerControls` gains `jumpCue(slot: number): void` (0–7). Seeks if that pad has `start_ms`; no-op if empty or no track.
- CuePads become buttons; click seeks the same way.
- Tests: jump seeks; empty pad does not call seek; no `POST /api/track`; no tag write.

## Global constraints

- US-keyboard Serato table is the default catalog; Mac uses Command for Control and Option for Alt.
- Esc never quits.
- Cue keys never write audio or `master.sqlite`.
- Delete/trash keys only open existing confirm dialogs.
- Shortcuts stay quiet while typing except Esc.
- Open dialogs still swallow keys except Esc (today’s `topDialog` rule).
- No Serato Play map. No “Playback Keys Use Shift”.
- Locales: every new string in `locales/en.json` and `locales/es.json`.
- Docs in the same change: `docs/architecture.md`, `docs/guide/shortcuts.md`, `docs/wiki/`, `CLAUDE.md` + `AGENTS.md` if the layout summary of shortcuts changes.
- Tests in the same PR. Python unittest for the settings key; Vitest for the table, matcher, remap, and cue jump.

## Review focus

- Alt chords must fire (today the matcher drops every Alt).
- Digit 1–8 while the track list is focused jumps cues, not grid type-ahead.
- A saved override for an unknown id does not crash load.
- Two live actions cannot keep the same chord after Change.
- Cue jump never POSTs.

---

### Task 1: Catalog + matcher (alt, defaults, merge)

**Files:**
- Modify: `src/lib/ui/shortcuts.ts`
- Create: `src/lib/ui/shortcut-catalog.ts` (Serato defaults + status live/unavailable + extra chords)
- Test: `src/tests/shortcuts.test.ts`, new `src/tests/shortcut-catalog.test.ts`

**Interfaces:**
- Produces: `ShortcutChord { key: string; mod?: boolean; shift?: boolean; alt?: boolean }`
- Produces: `CatalogEntry { id: string; group: "playback" | "loop" | "sample" | "library" | "cratecraft"; seratoKeys: ShortcutChord[]; live: boolean; extras?: ShortcutChord[] }`
- Produces: `effectiveShortcuts(overrides: Record<string, ShortcutChord[]>): Shortcut[]`
- Produces: `chordMatches` treats `alt` like `mod`/`shift`

- [ ] **Step 1:** Failing tests: `chordMatches` true for `{ key: "e", alt: true }` with `altKey: true`; false when alt missing. Catalog contains every Serato row from the support article (assert ids + default chords). `effectiveShortcuts({})` play-pause keys include `w` and extra Space.

- [ ] **Step 2:** Implement catalog + matcher. Unavailable rows have `live: false` and no handler.

- [ ] **Step 3:** Tests pass.

### Task 2: Persist overrides in settings.json

**Files:**
- Modify: `app_config.py` (`SETTINGS_KEYS`, parse/save `shortcuts`)
- Modify: `server.py` GET/POST `/api/settings`
- Modify: `src/lib/api-types.ts` `SettingsPayload.shortcuts`
- Test: `tests/test_app_config.py` (or existing settings tests)

**Shape:** `{ "play-pause": [{ "key": " ", "mod": false, "shift": false, "alt": false }] }`

- [ ] **Step 1:** Failing tests: unknown key `shortcuts.nope` warns and is dropped; `shortcuts.play-pause: "W"` (string) warns; valid override round-trips; missing `shortcuts` loads as `{}`.

- [ ] **Step 2:** Parse like `layout`. Deep-copy. Page merges with defaults. POST writes overrides only.

- [ ] **Step 3:** Tests pass. `docs/architecture.md` mentions the key.

### Task 3: Wire live Serato actions

**Files:**
- Modify: `src/lib/ui/shortcuts.ts` handlers
- Modify: `src/lib/player/player.ts` (`jumpCue`, next/previous already exist)
- Modify: `src/components/CuePads.tsx` (clickable pads)
- Modify: `src/lib/player/waveform-view.ts` or WaveformContext for +/- zoom
- Test: `src/tests/shortcuts.test.ts`, `src/tests/player.test.ts`, CuePads tests

Handlers (names locked):

- `play-pause` → `togglePlayPause`
- `load-selected` → play `state.selectedId`
- `play-next` / `play-previous` → `next()` / `previous()`
- `seek-back` / `seek-forward` → `seekBy(±SEEK_SECONDS)`
- `cue-jump-1` … `cue-jump-8` → `jumpCue(0..7)`
- `crate-previous` / `crate-next` → existing crate-tree move
- `focus-next-pane` → tree / list / detail
- `reveal-track` → existing reveal
- `locate-playing` → select the loaded track in the list
- `view-prepare` → Prepare space
- `waveform-zoom-in` / `waveform-zoom-out` → waveform `zoom(1 | -1)`
- `select-all` → Data Grid select all
- delete trio → existing confirm dialogs only

- [ ] **Step 1:** Failing tests for W play, Shift+Left load, 1 jumps cue 1, empty pad no-op, Alt+E seeks, Ctrl+Shift+Down moves crates, Esc still dismisses.

- [ ] **Step 2:** Implement handlers. CuePads click calls `jumpCue`.

- [ ] **Step 3:** Tests pass. No Python write path in this task.

### Task 4: Keyboard shortcuts page + remap UI

**Files:**
- Modify: `src/pages/SettingsPanel.tsx` (replace cheat-sheet-only `CheatSheet`)
- Create: `src/components/ShortcutTable.tsx`
- Modify: `src/lib/ui/settings.ts` (save overrides)
- Modify: `src/containers/SettingsContext.tsx` if the snapshot needs `shortcuts`
- Test: `src/tests/pages/SettingsPanel.test.tsx`, `src/tests/shortcuts.test.ts`
- Story: `src/stories/components/ShortcutTable.stories.tsx`

- [ ] **Step 1:** Failing tests: page lists a live row and an unavailable Serato row; Change then key `q` updates play-pause and POSTs `{ shortcuts: { "play-pause": [{ key: "q" }] } }`; duplicate chord refused; Reset all POSTs `{ shortcuts: {} }`; `?` still focuses `#shortcuts-title`.

- [ ] **Step 2:** Filter, groups, Change capture, Reset. Use MUI Table + Button. Keep `#shortcuts-section`, `#shortcuts-title`, `#shortcuts-body`.

- [ ] **Step 3:** Tests pass. `npm run build`. Locales en/es.

### Task 5: Docs + user guide

**Files:**
- Modify: `docs/guide/shortcuts.md`, `docs/wiki/` matching page, `docs/index.md` if the one-liner changes, `docs/architecture.md`
- Use `updating-user-docs` skill

- [ ] Document Serato defaults, extras (Space, arrows, Cmd+K, `?`, Cmd+1–5), Esc never quits, cue jump is jump-only, remap lives in Settings.

## Out of scope

- Cue set/delete (Markers2 write)
- Two virtual decks
- Pitch, loops, samples, recording, beatgrid edit
- Serato Play hotkey pack
- New navigation rail item
- 
## Execution

Native in this session after plan approval.
