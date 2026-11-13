# crateCraft AppShell chrome

**Status:** Approved. Charles said yes in chat on 13 Nov 2026. Plan: `docs/superpowers/plans/2026-11-13-appshell-chrome.md`.

**Parent issue:** https://github.com/mookiejones/crateCraft/issues/334

**This file is the handoff.** It overrides three #300 shell locks: Help/Settings in the Drawer footer, space in the AppBar, player strip under the AppBar. Nav destinations, colorways, crate tree in Main, and the native desktop menu stay.

---

## Resume prompt (paste this)

```
Work #334 AppShell chrome. Read docs/superpowers/specs/2026-11-13-appshell-chrome-design.md and docs/superpowers/plans/2026-11-13-appshell-chrome.md.
Charles approved the spec in chat on 13 Nov 2026.
```

---

## How this session got here

Charles did not like the overall look. The crateCraft heading sat in the crate rail (`.brand` h1 inside `#app-body`), so the app name felt like a sidebar title. He wanted it next to the menu in the AppBar. We walked MUI dashboard layouts in the visual companion against issue #334.

---

## Intent

The top of the window is the product: menu, crateCraft wordmark, library generation, and (once a track is loaded) the preview player. The left rail is navigation only. The crate tree is a crate picker, not a brand column.

Success: Charles opens the app and reads **crateCraft** next to the menu. Help and Settings stay on the right of that bar. Play, title, waveform, and time fill the gap once a track is loaded.

---

## Goals

- Move crateCraft into the AppBar next to the drawer toggle.
- Mini-variant Drawer: labels when open, icons when collapsed, never fully gone.
- Help and Settings in the AppBar (right). Keep `#open-help` and `#open-settings`.
- One generation chip: **Checking Serato**, then **Serato 4** / **Serato 5**. Click still opens the note.
- Nested children under Music, Health, Gig. Sheet child-tab strip goes away.
- Remember last rail width. First launch is open with labels.
- Preview player in the AppBar, spanning generation chip → Help/Settings: Play · title · SWF1 waveform · time. Hidden until a track is loaded.
- Space menu leaves the AppBar and sits in the crate rail header.
- One waveform: the AppBar strip. No second waveform under the list or in detail.
- When Serato is open, “Serato is open. Changes are paused.” sits in a notice under the AppBar. The generation chip stays Serato *n*.

## Non-goals

- Hash routes, Cmd+K, findability leftovers.
- Recoloring the four colorways or new tokens.
- Dual-file playback.
- Waveform zoom controls (they lived on the old strip).
- Moving the crate tree into the Drawer.
- Changing the native pywebview menu.
- Cell editing / library writes from this chrome pass.

## Anti-goals

- A fake equalizer that is not the SWF1 waveform.
- Two waveforms (AppBar plus Main).
- Help/Settings vanishing when the rail is mini.
- crateCraft remaining a heading in the crate rail.

---

## Constraints

- Page is strict TypeScript / React 19. `AppShell` in `src/pages/AppShell.tsx`.
- Keep adopted DOM ids: `#drawer-toggle`, `#open-help`, `#open-settings`, `#space-field`, `#library-generation`, `#player-bar`, `#views`, `#app-body`. `#view-children` and `#rail-foot` leave the Drawer.
- `PlayerContext` still owns audio. AppBar player is chrome around that snapshot.
- Waveform stays `WaveformPanel` / `WaveformContext` / SWF1. Compact height in the AppBar. Overview-scale; zoom UI out of this pass.
- Drawer width today is 200px (`DRAWER_WIDTH`). Mini width is MUI’s 56px (`theme.spacing(7)`).
- Persist open/mini in `settings.json` under `layout` (same file as track list width). Key is a builder call: `layout.drawer_open`.
- Colorways unchanged. ThemeProvider already maps them.
- English / Spanish, tooltips, keyboard stay.
- Do not write inside the Serato folder.

---

## Decisions (theirs vs guess)

**theirs** = Charles said it. **guess** = agent call, he can reject.

| Item | Whose | Decision |
|---|---|---|
| Brand in AppBar | theirs | crateCraft next to the menu |
| Dashboard chrome | theirs | MUI mini-variant Drawer (C) |
| Help / Settings | theirs | AppBar right (C). Keep `#open-help` / `#open-settings` |
| Generation + status | theirs | One AppBar chip: Checking Serato → Serato *n* |
| Children | theirs | Nested under the open parent in the rail (A). Sheet tabs go away |
| Rail start | theirs | Remember last (C). First launch open with labels |
| Player home | theirs | AppBar, spanning chip → Help/Settings |
| Player contents | theirs | Play · title · waveform · time (B). The span **is** the SWF1 waveform |
| Wordmark | theirs | 34px display heading. Taller AppBar (A). Not the 56px compact bar from the other #334 pass |
| Idle player | theirs | Hidden until a track is loaded (B) |
| Second waveform | theirs | None (A). AppBar only |
| Space menu | theirs | Crate rail header (B). Leaves the AppBar |
| Write-lock copy | theirs | Notice under the AppBar (C). Chip stays Serato *n*. No crate-rail `#status` line |
| Pause after load | guess | Pause keeps the player. No current track hides it |
| Unknown generation | guess | Chip still says Version unknown |
| Narrow window | guess | Mini when `innerWidth < 200 + 360` (rail + `TRACK_LIST_MIN_WIDTH`). Do not write `drawer_open: false` on resize; only the menu toggle writes it |
| First launch width | guess | Open with labels when the window is wide enough for the 200px rail; otherwise mini. Do **not** reuse today’s 980px cutoff |
| Mini icons | guess | MUI icons: Music, Folder, Favorite, Backup, GraphicEq (or Gig). Labels via `aria-label` + tooltip |
| Nested list | guess | Only the open parent’s children, same as `nav.ts` today |
| Drawer vs AppBar | guess | AppBar spans the window. Mini Drawer sits under it (clipped) |
| Player portal | guess | `#player-bar` adopts into the AppBar flex slot, not a strip under the Toolbar |
| Space portal | guess | `#space-field` adopts into the crate rail header, not the AppBar |
| Generation portal | guess | `#library-generation` adopts into the AppBar after the wordmark |
| `#status` | guess | Keep the node. `applyStatus` still writes it. Adopt it into a persistent Alert under the AppBar, sibling of `NoticeBanner`. Hide when `writable` is true. Do not reuse dismissable `#app-notice` for the lock |
| Checking | guess | Chip says Checking Serato. No lock banner until a payload says `writable: false` |
| `#library-generation-note` | guess | Still opens from the chip click, as today |
| Zoom | guess | Out of this pass. Strip is overview-scale |
| `layout.drawer_open` | guess | Boolean next to `track_list_width` in settings.json |
| Settings page | guess | Still a Main page from `#open-settings`. Space sits in `#app-body`, so it hides while Settings fills Main (same as the crate tree) |

---

## Picture (locked)

**No track, library writable**

```
[☰] crateCraft    [Serato 4]                          Help  Settings
---------------------------------------------------------------
| ♪ Music        | Serato Library ▾
|   Crates       | Find a crate
|   History      | All
|   Play stats   | House
| Folder         |                    Data Grid        | detail
| Health         |
| Backup         |
| Gig            |
```

**Serato open (same AppBar; lock banner under it)**

```
[☰] crateCraft    [Serato 4]                          Help  Settings
---------------------------------------------------------------
| Serato is open. Changes are paused.
---------------------------------------------------------------
| ♪ Music        | Serato Library ▾
| …              |                    Data Grid        | detail
```

**Track loaded**

```
[☰] crateCraft    [Serato 4]  [▶  Title  ~~~~waveform~~~~  1:12]  Help  Settings
---------------------------------------------------------------
| ♪ Music        | Serato Library ▾
|   Crates       | Find a crate
| …              |                    Data Grid        | detail
```

Collapsed rail is a 56px icon column. Same AppBar. Crate tree stays in Main.

---

## Overrides of #300

| #300 lock | #334 |
|---|---|
| Help/Settings in Drawer footer; collapse hides them | AppBar right; mini rail does not hide them |
| Space in the AppBar | Space in the crate rail header |
| Player + waveform full strip under the AppBar | Player + waveform in the AppBar span; hidden until a track |

Keep from #300: nested Music/Health/Gig, crate tree in Main, one preview player, colorways, Settings as a Main page, wizard dialog, native menu out of this pass.

---

## Implementation sketch (builder)

1. `AppShell.tsx`: Toolbar = toggle, wordmark (`Typography` 34px from `rail.heading`), generation slot, player slot (`flex: 1`, hidden until `PlayerContext` has a track), Help, Settings. Drawer `variant="persistent"` with mini width when `open` is false (MUI mini-variant pattern: `width` transition 56 ↔ 200). Do not unmount nav.
2. Adopt `#library-generation` into the chip slot. Button text is already Checking / Serato 4 / Version unknown.
3. Adopt `#player-bar` into the player slot. Rebuild player chrome so Play, title, compact `WaveformPanel`, and time sit in one row. Remove the full-width strip under the AppBar.
4. Adopt `#space-field` into `.brand` (crate rail). Remove crateCraft `h1` from that header.
5. Drawer list: primaries with icons; nest `#view-children` under the open parent (or paint children as `ListItem`s from `nav.ts`). Stop adopting `#view-children` as a sibling strip. Stop adopting `#rail-foot`.
6. Persist `open` through `POST /api/settings` `layout.drawer_open`. Read on mount.
7. Adopt `#status` into a persistent write-lock Alert under the AppBar (above `NoticeBanner`). Hide when writable. Action flashes stay on `#app-notice`.
8. Tests: AppShell portals, player hidden with no track, player visible with a track, Help/Settings in the AppBar, space in the rail, drawer mini width, nested children, lock banner when Serato is open, chip still Serato *n* while locked, locale strings.

---

## Out of this pass

- Waveform zoom / overview strip as a second surface
- Dual decks
- Changing Help diagnostics or Settings sections
- Native Dock/taskbar icon
- Findability (#291 leftovers)

---

## Approval

Charles says **yes** in chat on this document. Then write the implementation plan and a product PR against #334.
