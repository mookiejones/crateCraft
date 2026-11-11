# crateCraft look and layout (MUI walk)

**Status:** DRAFT. Charles has not approved this document. No product UI, no `package.json` MUI add, no `src/` restyle until he says this spec is approved.

**Parent issue:** https://github.com/mookiejones/crateCraft/issues/300

**This file is the handoff.** Paste its path into another Grok session. The bot should read this file, then #300, then claim the child issue it is walking. Do not start from memory of a chat.

---

## Resume prompt (paste this)

```
Work #300 MUI walk. Read docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md first.
Kit is MUI + MUI X Data Grid. Theme maps to existing colorways.
No product code until Charles approves that spec.
Walk one screen per turn. Current screen: Crates (child issue listed in the spec).
Hard gates and theirs-vs-guesses are in the spec. Do not reopen nav tickets #291 #295 #297.
```

---

## How this session got here

Charles opened crateCraft on Crates. Column titles and cells do not sit in one grid. He compared it to a datagrid whose header drifted off the body. He does not like the Crates layout. He expected a package such as [react-data-grid](https://github.com/Comcast/react-data-grid) or MUI. He then asked to redesign the React portion with **MUI**, walk every page, and keep a document another Grok bot can share.

A 10 Nov navigation audit scored the app **5/10** (findability). Rail collapse / rename / sheet title already shipped (#291 / #295 / PR #298). Leftover nav items 4–10 (hash routes, Cmd+K views, crate overflow, dialogs instead of `prompt()`, desktop width, native menu, a11y) stay on their own tickets. This spec is look/layout + the Crates table, not those leftovers.

Issue #300 originally preferred headless primitives (Base UI / Radix) and said skip MUI. **Charles overrode that:** kit is MUI.

---

## Intent

Crates is the room a DJ lives in. It must feel like a track list they can trust: column titles sit over the same fields as the cells. The rest of the React chrome should speak the same language as that list, so the app does not look like a homemade list taped to Material dialogs.

Success: Charles can open Crates and read Title / Artist / BPM without the header lying. Other screens follow the same kit, walked one at a time.

---

## Goals

- One UI kit for React: **MUI** (core) + **MUI X Data Grid** (track lists).
- Map that theme onto the four saved colorways: `serato-like`, `dark-club`, `light`, `classic`.
- Walk every React surface in the inventory. Nothing skipped by accident.
- Child GitHub issues, one screen (or tight group) each. No mega-PR.
- Keep Python, `server.py`, library writes, and the native pywebview window.

## Non-goals

- Shipping the redesign in the consult session that wrote this file.
- Replacing leftover nav work (#291 / #295 / #297 leftovers 4–10).
- Writing tags into audio. Cell editing of the Serato library.
- MUI Pro/Premium features that need a paid license (use Community Data Grid).
- Persisting `design-system/` from ui-ux-pro-max into the repo.
- Bootstrap, Ant Design, Carbon, or a second full kit beside MUI.

## Anti-goals

- Half MUI: dialogs look Material, Crates still two CSS grids.
- A Data Grid that writes BPM/key into `master.sqlite` on cell edit.
- Dropping English/Spanish, tooltips, or keyboard on a converted screen.
- Restyle as a side effect of hash routes or other nav PRs.

---

## Constraints

- Page is strict TypeScript/React 19.3. Desktop is pywebview (WKWebView / WebView2), not bundled Chromium.
- Runtime UI deps today: **React and react-dom only**. First kit add is this project.
- `static/app.js` / `static/wizard.js` are committed IIFEs. `npm run build` after `src/` changes.
- Tokens live in `static/tokens.css`. Colorways already exist in settings.
- Every new control: tooltip + `locales/en.json` and `locales/es.json`.
- Islands: many screens mount through `mountIsland` onto `index.html` nodes. MUI needs `ThemeProvider` at `AppProviders` (and any island outside that tree).
- Track list virtualizes ~10k rows; tests fail if the window paints the whole library (`TrackListContext.test.tsx`).
- Play stays on `PlayerContext`. List cells may render a Play button; they must not own audio.
- Do not write inside the Serato folder. Do not commit `master.sqlite`.

---

## Decisions (theirs vs guess)

Mark: **theirs** = Charles said it. **guess** = agent call, he can reject.

| Item | Whose | Decision |
|---|---|---|
| Kit | theirs | MUI + MUI X Data Grid for the React app |
| Theme | theirs | Map onto existing colorways; do not throw them out |
| Walk order | theirs | Crates first, then the inventory |
| Document | theirs | This file, shareable with another Grok bot |
| Child issues | theirs | Several GitHub children under #300 |
| Package pin | theirs (earlier) | Do not pin Comcast react-data-grid; MUI X Data Grid is now the list |
| No product code until spec approved | theirs (#300) | Hard gate |
| Nav leftovers stay on their tickets | theirs | #291 / #295 / #297 |
| Feel | theirs (older) | Attractive, simple, professional, fun, modern |
| Crates three-pane layout (tree \| tracks \| detail) | guess | Keep unless Charles says otherwise |
| Detail as right pane, not a drawer | guess | Serato-like; confirm on Crates walk |
| Data Grid cells read-only | guess | Play / select / sort / resize only |
| First impl child after approve | guess | ThemeProvider + colorways, then Crates Data Grid |
| History list same Data Grid as Crates | guess | Same component, different columns |
| MUI X Community only (no paid Pro) | guess | Confirm if Charles wants Pro |

---

## Why the Crates list is not a table today

There is **no React table parent**.

`TrackListWindow` (`src/components/TrackListWindow.tsx`) is the React parent of visible `TrackRow`s. It returns a fragment. `virtual-scroll.ts` creates `div.spacer` > `div.rows`, appends that under `#list`, and `mountIsland`s `TrackListWindow` onto `div.rows`. Headers are a sibling `div.columns` filled by `renderColumns()` in `src/lib/ui/views.ts` (not React). Play sits inside the Title cell. `#list` and `.browser` scroll separately. That is why titles and cells drift.

```
#list                          static HTML, role=listbox
  div.spacer                   virtual-scroll.ts
    div.rows                   DOM parent of the rows
      TrackListWindow          React island root (fragment)
        TrackRow               div.row + span.cell
```

`TrackListProvider` is context only. It is not list chrome.

This file exists so a later bot does not “fix alignment” by tweaking CSS grid on that split.

---

## Crates (screen 1) — current map

Layout in `static/index.html`: crate tree (`#crate-list`) | browser (`.columns` + `#crate-panes` `#list` / `#list-b`) | splitter | `#detail`. Player and waveform sit below.

| Piece | Path | React or DOM |
|---|---|---|
| Crate tree | `src/pages/CrateTree.tsx` | React, `CrateContext` |
| New/rename/color/delete/preset/sync | `src/pages/CrateActions.tsx` | React |
| Split / save view / export | `src/pages/CrateBrowserActions.tsx` | React |
| Column titles | `views.ts` `renderColumns` | DOM `.columns` |
| Virtual window | `src/lib/ui/virtual-scroll.ts` | DOM + island |
| Visible rows | `TrackListWindow` + `TrackRow` | React |
| Detail (fields, cues, beatgrid, related) | `TrackDetail` | React, `TrackListContext` |
| Play | `PlayButton` / `PlayerContext` | React |
| Waveform | `WaveformPanel` / `WaveformContext` | React |
| Preset dialog | `src/lib/crates/presets.ts` | DOM dialog |
| Folder-sync dialog | `src/lib/crates/folder-sync.ts` | DOM dialog |
| Split / save view | `src/lib/crates/dual-crate.ts` | DOM + state |
| Rekordbox / import / merge | `src/lib/ui/dialogs.ts` | DOM dialog |

DJ jobs on this screen: pick a crate; scan tracks; sort; play; open detail; split two crates; export/import; preset; sync a folder; create/rename/delete a crate.

Create / rename / color / save view still use `window.prompt`. Delete uses `confirm`. Desktop menu clicks the same button ids (`#crate-new`, `#list`, `#export-rekordbox`, …). Keep those ids. Row height is 36px (`ROW` / `--row`). Tests cap the painted window under 80 DOM rows for a 10k library.

### Crates — proposed MUI mapping (guess until Charles confirms)

- **Crate tree:** MUI Rich Tree View or a dense `List` of tree items. Keep `data-id`, keyboard, tooltips.
- **Track list:** MUI X Data Grid Community. One grid owns header + rows + horizontal scroll + virtualization. Custom `renderCell` for Play, color swatch, energy, missing/offline badges.
- **Split:** two Data Grids in `#list` / `#list-b`, each with its own header.
- **Detail:** keep the right pane (Grid item), not a modal.
- **Crate actions:** `Button` + `Menu` (overflow for Preset, Sync folder, …). Replace `prompt()` on rename/create in this child or a tiny follow-up — do not leave `window.prompt`.
- **Dialogs:** MUI `Dialog` wrapping existing preview/confirm flows. API posts stay.
- **Ids:** keep `#crate-new`, `#list`, sort keys, so desktop menu and tests still find nodes where possible.

Open on Crates (theirs to answer):

1. Keep tree \| tracks \| detail as three columns?
2. How dense (compact Data Grid vs current 36px `--row`)?
3. May columns resize and hide, or only match today’s ten fields?

---

## Full inventory (walk order after Crates)

| # | Surface | Today | Child |
|---:|---|---|---|
| 0 | ThemeProvider + colorways | `tokens.css`, settings `colorway` | first impl after approve |
| 1 | Crates | table above | this walk |
| 2 | Shell: rail, sheet tabs, heading, splitter | `nav.ts`, `index.html` | shell child |
| 3 | Player + waveform | `PlayerContext`, `WaveformPanel` | player child |
| 4 | History | `HistorySessions`, `HistoryDetail` | history child |
| 5 | Play stats | `history-stats` + views | with history or own |
| 6 | Organize files | `FilesPanel`, `FilesDialog` | files child |
| 7 | Health Overview | `HealthPanel` | health child |
| 8 | Missing / Duplicates / Stems | `HealthListChrome` | health child |
| 9 | Damaged files / Suspect quality / Tags | `ScanPanel`, bitrate, `TagsPanel` | health child |
| 10 | Backups / restore | `SnapshotsPanel`, `RestoreDialog` | backups child |
| 11 | Gig Ready / Check drive / Tempo drift | `GigReport`, `DriftReport`, portable | gig child |
| 12 | Settings | `SettingsPanel` | settings child |
| 13 | Setup wizard | `WizardScreen` | wizard child |
| 14 | Shared dialogs | Rekordbox, merge, relink, sharing | dialogs child |

Each walk turn: what the screen is for, MUI pieces, what stays (API, Play, i18n), Charles yes or change.

---

## Implementation order (after this spec is approved)

1. Add `@mui/material` `@mui/icons-material` `@emotion/react` `@emotion/styled` `@mui/x-data-grid`. ThemeProvider in `AppProviders`. Map palette to colorways. No screen restyle yet except proof in Settings appearance or a hidden host.
2. Crates Data Grid + tree + detail chrome.
3. Shell (rail / tabs) so later pages share AppBar/Drawer.
4. History + Play stats (same grid).
5. Files, Health group, Backups, Gig, Settings, Wizard, leftover dialogs.

One PR per child. Tests on that screen. Rebuild `static/app.js`.

---

## Agent rules for child issues

1. `gh issue edit <n> --add-assignee @me` before other writes.
2. Read this spec. If status is still DRAFT, **consult and update the spec** or stop. Do not install MUI.
3. After Charles approves (comment on #300 or in chat: “spec approved”), implement only that child’s screen.
4. Branch `issue-<n>-short-name`. PR `Closes #<n>`. Do not close #300 until every child that Charles wants in this pass is done (or he closes #300 as keep-current-look).
5. Tooltips, en+es, Vitest, Playwright as AGENTS.md. No `master.sqlite` in the diff.
6. Do not mix hash routes or rail work into an MUI PR.

### Subagents

A parent session may spawn **read-only** explorers to map a screen into this spec. It may spawn a **builder-check** on this document. It must not spawn builders that edit `src/` until the spec is approved and the child is claimed.

---

## Child issues

Part of #300. Implementation blocked until this spec is approved.

| Order | Issue | Screen |
|---:|---|---|
| 0 | [#303](https://github.com/mookiejones/crateCraft/issues/303) | ThemeProvider + colorways (first impl) |
| 1 | [#304](https://github.com/mookiejones/crateCraft/issues/304) | Crates Data Grid, tree, detail **(current walk)** |
| 2 | [#305](https://github.com/mookiejones/crateCraft/issues/305) | Shell: rail, tabs, heading, splitter |
| 3 | [#306](https://github.com/mookiejones/crateCraft/issues/306) | Player + waveform chrome |
| 4 | [#307](https://github.com/mookiejones/crateCraft/issues/307) | History + Play stats |
| 5 | [#308](https://github.com/mookiejones/crateCraft/issues/308) | Organize files |
| 6 | [#309](https://github.com/mookiejones/crateCraft/issues/309) | Health group |
| 7 | [#310](https://github.com/mookiejones/crateCraft/issues/310) | Backups / restore |
| 8 | [#311](https://github.com/mookiejones/crateCraft/issues/311) | Gig Ready / Check drive / Tempo drift |
| 9 | [#312](https://github.com/mookiejones/crateCraft/issues/312) | Settings + wizard |
| 10 | [#313](https://github.com/mookiejones/crateCraft/issues/313) | Shared dialogs |

---

## What a later bot must not do

- “Quick CSS fix” on `.columns` / `.row` as the MUI outcome.
- Install MUI in the consult PR that only lands this markdown.
- Persist ui-ux-pro-max `--design-system` files.
- Treat Base UI / Radix as the kit unless Charles reverses MUI.
- Redesign the wizard, native menus, or Python in the Crates child.

---

## Approval

Charles approves **this file** in chat or on #300. Until that sentence exists, status stays DRAFT.

Calls he should check while reading: three-pane Crates, read-only cells, Community Data Grid (no Pro), ThemeProvider-first impl order, History sharing the Crates grid.
