# crateCraft player + waveform deck

**Status:** Approved. Charles said yes in chat on 16 Nov 2026. Plan: `docs/superpowers/plans/2026-11-16-player-waveform-deck.md`.

**Parent:** none filed. Do not open a GitHub issue until Charles says file.

**This file is the handoff.** It overrides the #334 chrome lock that the AppBar player is a compact Play · title · 32px SWF1 overview · time with no zoom and no second waveform. Wide windows get a real deck in that same AppBar. Mini width (980px) keeps today’s compact player.

---

## Resume prompt (paste this)

```
Work the player + waveform deck. Read docs/superpowers/specs/2026-11-16-player-waveform-deck-design.md.
Charles approved this spec in chat on 16 Nov 2026. Plan: docs/superpowers/plans/2026-11-16-player-waveform-deck.md.
```

---

## How this session got here

The AppBar overview is 32px and unused. Zoom already exists on `WaveformPanel` when compact is false, and stays hidden. Cue pads in track detail are display-only even though the wiki says click a pad to jump. Charles asked for drafts first, Lexicon as job inspiration, pads that light and jump, and zoom on the wave. Visual companion walked A–Q. Cue *writes* stay parked.

---

## Intent

Once a track is loaded on a wide window, the AppBar is the deck: a 160px zoomed wave, a whole-track overview with cue ticks, eight Serato-coloured pads under the wave, and Play · title · time in the blank next to those pads. Click a pad that has a cue: the playhead jumps there and the pad lights. Zoom lives on the wave. Track detail still lists cue times and names. Below 980px the AppBar falls back to today’s compact player so crates keep height.

Success: Charles loads a track, sees a usable wave, jumps cue 3 from a pad, zooms around the playhead, and still reads Title / Artist / BPM in Crates.

---

## Goals

- Taller AppBar deck on viewports wider than 980px (choice **G**).
- Zoomed SWF1 detail at **160px** (choice **M**). `+/−` and wheel zoom sit on that wave.
- Whole-track overview under the zoomed wave, about 32px, with coloured cue ticks (choice **J**).
- Pads 1–8, 22px, two rows (1–4 over 5–8) under the overview, left of the player cluster. Same pad size as the earlier one-row drafts. Not stretched full width.
- Play, title, and elapsed time sit in the blank to the right of the pads (choice **H**). One Play. No skip buttons in this slice.
- Click a pad that has a stored cue: `seek` to `start_ms`, pad lights. Empty pads stay dim and do nothing.
- Track-detail `CuePads` stay a read-only list of slot, time, and name (choice **N**). They do not become a second pad grid.
- At 980px and below, AppBar is today’s compact player: Play · title · 32px overview · time (choice **Q**). Full deck returns when the window is wider.
- Hide the deck (wide or compact) until a track is loaded. Stay visible while paused.
- Cue file writes stay off.

## Non-goals

- Set, move, delete, or rename cues (Markers2 / GEOB write). Needs Charles to say `file cue editor`.
- Pad keyboard 1–8, player queue, beat jump (#403).
- Skip / previous-next / volume in the AppBar.
- Hover tint on the overview from cue to next cue.
- User-resizable wave height.
- Changing the native pywebview menu.
- Dual-file playback or a second `<audio>`.
- Filing a GitHub issue until Charles says file.

## Anti-goals

- Copying Lexicon skin, trademarks, or unique copy.
- A fake EQ or spectrum that is not SWF1.
- Two independent players.
- Stretched full-width pads (Charles called that hideous).
- Writing inside the Serato folder.
- Shipping cue jump that rewrites the file.

---

## Constraints

- Page is strict TypeScript / React 19. AppBar chrome is `AppShell` / `PlayerBar` / `WaveformPanel`.
- `PlayerContext` owns audio. `seek` / `togglePlayPause` already exist. Pad click uses that seek.
- `GET /api/track` already returns cue `index`, `start_ms`, `color`, `name`.
- Waveform stays SWF1 via `WaveformPanel` / `WaveformContext`. Compact mode is today’s AppBar overview. Wide deck uses the existing non-compact detail + overview + zoom.
- Mini breakpoint is already 980px (drawer mini). Q uses that same cut.
- Keep Help and Settings on the right of the AppBar. Keep ☰, crateCraft, generation chip on the left.
- English / Spanish, tooltips, existing Space / ±5s / Shift ±30s stay.
- Split crates still share one player.
- Do not write inside the Serato folder.
- Tests in the same PR: Vitest for pad seek / empty pad / compact-at-980 / zoom on the dock. No Python library write path.

---

## Decisions (theirs vs builder call)

### Theirs (Charles, 16 Nov 2026)

| Letter | Decision |
| --- | --- |
| **G** | Deck lives in the main AppBar. Pads under the wave, two rows, 22px. |
| **H** | Play · title · time move into the blank next to the pads. |
| **J** | Keep the whole-track overview under the zoomed wave. |
| **M** | Zoomed wave is 160px. |
| **N** | Detail pane keeps cue times and names as a list. |
| **Q** | At 980px, compact player. Full deck when wider. |
| Jump | Click pad = seek playhead to stored cue and light the pad. Not a file write. |
| Zoom | On the waveform, where they look. |

### Builder calls (say if wrong)

- Hide the player until a track is loaded; keep it while paused. Same as today.
- Empty pads: dim, not a button, no seek.
- Lit pad: last clicked pad, or the pad whose cue is nearest the playhead within a small epsilon while playing. Slot number stays visible. Serato slot colour stays.
- Zoom `+/−` overlay the right edge of the 160px detail. Wheel zoom on that canvas (already implemented).
- Compact 980px player has no pad grid. Cue jump at that width is click-seek on the 32px overview (existing x-position seek). Detail list stays read-only.
- Click / drag on the zoomed wave seeks the same way `WaveformPanel` already does. Do not add a new gesture.
- Overview cue ticks stay visual marks this slice unless they already seek; do not invent a new tick-click handler unless one exists.
- Pad keys (1–8) wait for the hotkey / #403 pass.
- Hover-highlight from cue to next cue is out of this slice.
- `#334` “one compact waveform, no zoom” applies only at 980px and below. Wide windows use this deck.
- No GitHub issue until Charles says file.

---

## Layout (wide)

```
[☰ crateCraft] [Serato n]  [ 160px zoomed wave          +/− ]  [Help Settings]
               [          32px overview, cue ticks           ]
               [ 1 2 3 4 ]  [ ▶  title                  1:12 ]
               [ 5 6 7 8 ]
```

Drawer and Main (tree | list | detail) start below that AppBar. Detail still has the cue list.

## Layout (≤980px)

Today’s compact AppBar: Play · title · 32px overview · time. Help and Settings stay. Pads and 160px wave are gone until the window is wider.

## Behavior

1. Load a track → wide deck appears (or compact player if ≤980px).
2. Click pad 3 with a cue → `currentTime` becomes that `start_ms / 1000`. Pad 3 lights.
3. Click an empty pad → nothing.
4. `+/−` or wheel on the 160px wave zooms around the playhead.
5. Overview shows the whole track. Clicking it seeks by x, same as today’s compact overview.
6. Resize through 980px: deck ↔ compact player. One `<audio>`, position preserved.
7. Unload / no track: player chrome hidden.

---

## Out of this slice

- Cue editor (file write).
- #403 queue / beat jump / pad hotkeys.
- Skip buttons (choice I, not taken).
- Dropping the overview (choice K, not taken).
- Dropping detail cues (choice O, not taken).
- Full deck at every width (choice P, not taken).
