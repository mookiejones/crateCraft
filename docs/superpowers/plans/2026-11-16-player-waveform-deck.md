# Player + waveform deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wide AppBar is a 160px zoomed wave, whole-track overview, 22px pads 4-over-4, and Play · title · time in the blank; click a pad jumps the playhead; at 980px keep today’s compact player.

**Architecture:** One `PlayerBar` island still lives in `#player-bar`. `WaveformPanel` stays the SWF1 view; `mountPlayer` remounts it when width crosses `DRAWER_MINI_CUTOFF`. New `PlayerCuePads` buttons call existing `seek`. Detail `CuePads` stay a read-only list. No Markers2 write.

**Tech Stack:** React 19, MUI AppBar/Toolbar, existing Vitest jsdom, SWF1 `WaveformEngine`.

**Spec:** `docs/superpowers/specs/2026-11-16-player-waveform-deck-design.md`

## Global Constraints

- Strict TypeScript in `src/`. New UI strings in `locales/en.json` and `locales/es.json`.
- `PlayerContext` owns audio. Pad click uses `seek(seconds)`. Do not add a second `<audio>`.
- `GET /api/track` already returns cue `index`, `start_ms`, `color`, `name`. No new API.
- Mini / compact cutoff is `DRAWER_MINI_CUTOFF` (980). `playerDeckIsCompact(innerWidth)` is `innerWidth <= 980`.
- Zoomed detail height is 160px when the deck is full. Overview stays ~32px.
- Pads are 22×22px, grid 4 columns, slots 1–4 over 5–8. Do not stretch full width.
- Empty pads dim and do not seek. Lit pad shows slot number plus Serato colour.
- Track-detail `CuePads` stay `div.marker` rows, not buttons.
- Cue file writes stay off. Pad keys 1–8 wait for #403.
- Do not write inside the Serato folder. Synthetic fixtures only. No `src/` files at repo root.
- DJ-visible copy: `docs/wiki/Playback.md`, `docs/guide/playback.md`, `docs/quick-start.md`, `docs/architecture.md`, `AGENTS.md` and `CLAUDE.md` together. Use `updating-user-docs`. Do not push wiki.git.

## Review Focus

- Window crosses 980px while a track is playing: one `<audio>`, `currentTime` unchanged, deck ↔ compact. Test in Task 4.
- Empty pad click: no `seek`, pad stays unlit. Test in Task 2.
- Compact AppBar (width 980): no pad grid, no zoom buttons, 32px overview still seeks by x. Test in Task 4.
- Detail pane still has eight `.marker` rows that are not buttons. Test in Task 2.
- Pause keeps the deck visible (`trackId` still set). Test in Task 4.

## File map

- `src/lib/ui/layout.ts` — `playerDeckIsCompact`
- `src/lib/ui/cue-view.ts` — `ACTIVE_PAD_EPSILON_SECONDS`, `activePadIndex`
- `src/lib/player/player.ts` — `CueMarker.index`, `setPlayerWaveformCompact`
- `src/components/PlayerCuePads.tsx` — AppBar jump pads
- `src/components/PlayerBar.tsx` — deck vs compact layout
- `src/components/WaveformPanel.tsx` / `src/lib/player/waveform-view.ts` — 160px detail, zoom overlay, compact remount
- `src/pages/AppShell.tsx` — taller Toolbar when full deck
- `static/app.css` — deck grid, 22px pads, 160px detail
- `src/tests/cue-view.test.ts`, `src/tests/player.test.ts`, `src/tests/components/PlayerCuePads.test.tsx`, `src/tests/pages/AppShell.test.tsx`, `src/tests/waveform-view.test.ts`
- `src/stories/components/PlayerCuePads.stories.tsx`, `src/stories/components/PlayerBar.stories.tsx`, `src/stories/components/WaveformPanel.stories.tsx`
- `docs/wiki/Playback.md`, `docs/guide/playback.md`, `docs/quick-start.md`, `docs/architecture.md`, `AGENTS.md`, `CLAUDE.md`

---

### Task 1: Pad index on cues and `activePadIndex`

**Files:**
- Modify: `src/lib/player/player.ts` (`CueMarker`, `markersFromCues`)
- Modify: `src/lib/ui/cue-view.ts`
- Test: `src/tests/player.test.ts`, `src/tests/cue-view.test.ts`

**Interfaces:**
- Consumes: existing `Marker.index` / `start_ms`
- Produces: `CueMarker { seconds: number; color: string; label: string; index: number }` where `index` is the stored 0–7 pad, or `-1` when missing/out of range. `ACTIVE_PAD_EPSILON_SECONDS = 0.25`. `activePadIndex(currentTime: number, slots: ReadonlyArray<{ seconds: number } | null>, lastClicked: number | null, epsilon?: number): number | null`

- [ ] **Step 1: Write the failing tests**

`markersFromCues` keeps `index: 0` and `index: 3` on the two Night cues; a row with no index or `index: 8` stores `index: -1`.

`activePadIndex(1.5, slots, null)` returns `0` when slot 0 is 1.5s. `activePadIndex(1.5, slots, 3)` still returns `0` when slot 3 is 8s (last click is outside epsilon). `activePadIndex(8.1, slots, 3)` returns `3`. Empty slots and a time far from every cue return `null`. Empty lastClicked on an empty pad is ignored.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/player.test.ts src/tests/cue-view.test.ts`

Expected: FAIL on missing `index` / `activePadIndex` is not a function.

- [ ] **Step 3: Implement `CueMarker.index` and `activePadIndex`**

`markersFromCues` pushes `index: Number.isInteger(index) && index >= 0 && index < 8 ? index : -1`. `activePadIndex`: if `lastClicked` is 0–7 and that slot exists and `Math.abs(currentTime - slot.seconds) <= epsilon`, return it; else among filled slots pick the smallest abs delta if `<= epsilon` (lower index on a tie); else `null`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/player.test.ts src/tests/cue-view.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/player/player.ts src/lib/ui/cue-view.ts src/tests/player.test.ts src/tests/cue-view.test.ts
git commit -m "feat: keep cue pad index for player jump"
```

---

### Task 2: AppBar jump pads

**Files:**
- Create: `src/components/PlayerCuePads.tsx`
- Create: `src/tests/components/PlayerCuePads.test.tsx`
- Create: `src/stories/components/PlayerCuePads.stories.tsx`
- Modify: `src/components/CuePads.tsx` only if a comment is needed that AppBar pads jump; do not turn `CueSlot` into a button
- Test: `src/tests/containers/TrackListContext.test.tsx` (existing eight `.marker` rows still not `<button>`)

**Interfaces:**
- Consumes: `usePlayer().cues`, `usePlayer().currentTime`, `usePlayer().seek`, `cueSlots` via mapping `CueMarker` → eight slots by `index`, `activePadIndex`, `slotColor`
- Produces: `PlayerCuePads(): JSX.Element` — eight controls, class `player-cue-pads`, each `player-cue-pad` with `data-slot="1"`…`"8"`. Filled pads are `<button type="button">`. Empty pads are `<span class="player-cue-pad player-cue-pad-empty">` (not a button). Click filled → `seek(cue.seconds)` and light that slot. Lit class `player-cue-pad-lit`. Size 22px via CSS class, not inline stretch.

- [ ] **Step 1: Write the failing tests**

Mount `PlayerCuePads` under a PlayerProvider with cues `{ index: 0, seconds: 1.5 }` and `{ index: 3, seconds: 8 }`. Eight pads. Pad 1 is a button; pad 2 is not. Click pad 1: `seek` called with `1.5`, pad 1 has `player-cue-pad-lit`. Click pad 2: `seek` not called. Track-detail `CuePads` fixture still has eight `.marker` and zero `button.player-cue-pad`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/components/PlayerCuePads.test.tsx`

Expected: FAIL module not found.

- [ ] **Step 3: Implement `PlayerCuePads`**

Map `cues` with `index` 0–7 onto eight slots (first wins). Local `lastClicked` state. `aria-label` from `t("markers.cue")` / `t("markers.cueEmpty")`. Slot number as text. Background `slotColor`. Do not POST. Story: eight pads, pad 3 lit.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/components/PlayerCuePads.test.tsx src/tests/containers/TrackListContext.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerCuePads.tsx src/tests/components/PlayerCuePads.test.tsx src/stories/components/PlayerCuePads.stories.tsx
git commit -m "feat: AppBar cue pads jump the playhead"
```

---

### Task 3: 160px wave, zoom on the wave, compact helper

**Files:**
- Modify: `src/lib/ui/layout.ts` — add `playerDeckIsCompact`
- Modify: `src/lib/player/waveform-view.ts` — `WaveformEngine.isCompact(): boolean` (read the constructor flag)
- Modify: `src/lib/player/player.ts` — `setPlayerWaveformCompact(compact: boolean): void`
- Modify: `static/app.css` — `.waveform-detail-wrap` / `.waveform-detail` 160px; `.player-wave:not(.player-wave-compact)` overlay `.waveform-zoom` on the right of the detail; `.player-cue-pads` 4×22px grid
- Modify: `src/tests/splitter.test.ts` or `src/tests/pages/AppShell.test.tsx` for the helper
- Test: `src/tests/waveform-view.test.ts`, `src/tests/player.test.ts`

**Interfaces:**
- Consumes: `DRAWER_MINI_CUTOFF`, existing `mountWaveform(host, hooks?, compact?)`
- Produces: `playerDeckIsCompact(innerWidth: number): boolean` → `innerWidth <= DRAWER_MINI_CUTOFF`. `setPlayerWaveformCompact(compact: boolean): void` remounts the AppBar wave host only when the compact flag differs; does not reset `currentTime` or `<audio>`. Full-deck CSS height 160px.

- [ ] **Step 1: Write the failing tests**

`playerDeckIsCompact(980) === true`, `playerDeckIsCompact(981) === false`. `mountWaveform(host, hooks, false)` shows zoom buttons and a `.waveform-detail-wrap` that is not `hidden`; computed height of `.waveform-detail` is 160px (jsdom: assert the CSS rule in `app.css` if computed style is empty — grep `160px` on `.waveform-detail`). Compact `true` still hides detail, has no zoom, overview 32px, ignores wheel. `setPlayerWaveformCompact(false)` after `mountPlayer` removes `player-wave-compact` and shows zoom; `currentTime` unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/waveform-view.test.ts src/tests/player.test.ts src/tests/splitter.test.ts`

Expected: FAIL on 160px / `playerDeckIsCompact` / remount.

- [ ] **Step 3: Implement helper, remount, and CSS**

Keep compact engine behavior (no wheel zoom, 32px overview). Non-compact: detail 160px, zoom buttons overlay the detail’s right edge (do not keep the 44px side column). `setPlayerWaveformCompact` destroys only the waveform island and calls `mountWaveform` again on the same host; `attachMedia` / `trackId` stay.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/waveform-view.test.ts src/tests/player.test.ts src/tests/splitter.test.ts src/tests/components/WaveformPanel.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui/layout.ts src/lib/player/waveform-view.ts src/lib/player/player.ts static/app.css src/tests
git commit -m "feat: 160px AppBar wave with zoom, compact under 980px"
```

---

### Task 4: PlayerBar deck layout and AppShell height

**Files:**
- Modify: `src/components/PlayerBar.tsx`
- Modify: `src/pages/AppShell.tsx`
- Modify: `static/app.css` (`.player-controls.player-deck` column: wave full width, then pads | Play title time)
- Modify: `src/stories/components/PlayerBar.stories.tsx`
- Test: `src/tests/pages/AppShell.test.tsx`

**Interfaces:**
- Consumes: `playerDeckIsCompact`, `setPlayerWaveformCompact`, `PlayerCuePads`, existing `PlayButton` / title / time / `.player-wave-slot`
- Produces: Full deck (`innerWidth > 980`): class `player-deck`; wave slot then a `player-deck-row` with `PlayerCuePads` and Play · title · time. Compact (`<= 980`): class `player-deck-compact`; today’s row Play · title · wave · time; no `PlayerCuePads`. AppShell Toolbar `alignItems: stretch` and `minHeight` auto when `hasTrack && !playerDeckIsCompact(innerWidth)`; Help/Settings stay `ml: auto`.

- [ ] **Step 1: Write the failing tests**

`setInnerWidth(1200)`, load a track: AppBar contains zoom in/out, `.player-cue-pads`, Play, title, time. Pads are not between chip and wave (wave is above the pad row). `setInnerWidth(980)`: zoom buttons gone or compact class, `.player-cue-pads` absent, `.player-wave-compact` present, overview canvas present, `getPlayerState().currentTime` unchanged if you `seek(2)` before resize. Pause still shows the player slot. Help still in `.app-bar-actions`.

Update the existing “docks the compact player… no zoom” test: at default jsdom width, if that width is 1024, it now expects the full deck (zoom present). Set that test’s width to 980 for compact, and add a 1200 case for the deck.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx`

Expected: FAIL on pads / zoom at 1200 or compact at 980.

- [ ] **Step 3: Implement PlayerBar + Toolbar**

`PlayerBar` holds `innerWidth` the same way `AppShell` does (resize listener). On compact change call `setPlayerWaveformCompact`. One Play. Do not add skip buttons. Hide player while `trackId === null` stays AppShell’s job.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx src/tests/player.test.ts src/tests/components/PlayButton.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerBar.tsx src/pages/AppShell.tsx static/app.css src/stories/components/PlayerBar.stories.tsx src/tests/pages/AppShell.test.tsx
git commit -m "feat: AppBar player deck with pads beside Play"
```

---

### Task 5: User docs, architecture, layout summary, bundle

**Files:**
- Modify: `docs/wiki/Playback.md`, `docs/guide/playback.md`, `docs/quick-start.md`, `docs/architecture.md`, `AGENTS.md`, `CLAUDE.md`
- Modify: `src/stories/components/WaveformPanel.stories.tsx` compact description (full deck 160px + zoom)
- `npm run build` → commit `static/app.js` / map if the page bundle changed

**Interfaces:**
- Consumes: shipped behavior from Tasks 1–4
- Produces: DJ copy that matches G+H+J+M+N+Q. Architecture and AGENTS/CLAUDE layout paragraph: wide AppBar deck, 160px wave, pads jump, compact at 980px. Wiki still says click a pad to jump; say those pads sit in the top bar, and the detail list still shows times and names.

- [ ] **Step 1: Write / update the wiki and guide sentences**

Playback: wide window — zoomed wave, overview, pads 1–8, Play · title · time in the blank; click a pad with a cue to jump; empty pads do nothing; zoom on the wave; narrower than 980px keeps Play · title · 32px wave · time. Detail still lists cue times and names. Playback does not write the file.

Grep the old “Zoom stays off that bar” and “Play, the title, the waveform, and the time sit in the top bar” in `docs/wiki/`, `docs/guide/`, `docs/quick-start.md`. Edit every hit.

- [ ] **Step 2: Run wiki/guide tests**

Run: `python3 -m unittest tests.test_wiki_docs tests.test_wiki_features tests.test_guide_pages -v`

Expected: PASS

- [ ] **Step 3: Update architecture + AGENTS.md + CLAUDE.md together**

Layout summary: AppBar player is a deck when the window is wider than 980px (160px SWF1 detail, overview, 22px pads, Play · title · time). Mini width keeps the compact strip. Cue pads in the AppBar jump; detail pads stay a list.

- [ ] **Step 4: Typecheck, lint, tests, bundle**

Run:

```bash
npx tsc --noEmit
npx eslint src
npm test
npm run build
```

Expected: PASS. Commit rebuilt `static/app.js` and `static/app.js.map`.

- [ ] **Step 5: Commit**

```bash
git add docs AGENTS.md CLAUDE.md static/app.js static/app.js.map src/stories
git commit -m "docs: AppBar player deck and cue jump"
```

Do not open a GitHub issue unless Charles says file. Do not push to `main`.
