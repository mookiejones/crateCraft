# AppShell chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put crateCraft, the Serato generation chip, the preview player, and Help/Settings in the AppBar, with a mini-variant Drawer and the write-lock notice under that bar.

**Architecture:** Keep adopted DOM ids. `AppShell` restyles the Toolbar and a clipped mini Drawer; `nav.ts` still owns parent/child selection; `PlayerContext` still owns audio; `applyStatus` still writes `#status` and `#library-generation`. Persist `layout.drawer_open` next to `track_list_width` in `settings.json`.

**Tech Stack:** React 19, MUI AppBar/Drawer/Toolbar, existing Vitest jsdom page fixture, Python `unittest` for settings.

**Spec:** `docs/superpowers/specs/2026-11-13-appshell-chrome-design.md`

## Global Constraints

- Strict TypeScript in `src/`. New UI strings in `locales/en.json` and `locales/es.json`.
- Keep `#drawer-toggle`, `#open-help`, `#open-settings`, `#space-field`, `#library-generation`, `#player-bar`, `#views`, `#app-body`.
- `#view-children` and `#rail-foot` leave the Drawer as a footer/strip. Crate tree stays in Main.
- Drawer open width 200px. Mini width 56px (`theme.spacing(7)`). Never unmount nav.
- Mini cutoff: `innerWidth < 200 + 360` (`TRACK_LIST_MIN_WIDTH`). Resize does not write `drawer_open`.
- Wordmark 34px from `rail.heading`. Taller Toolbar than 56px.
- Player hidden while `PlayerSnapshot.trackId` is null. Pause keeps it. No current track hides it.
- One SWF1 waveform, overview-scale, in the AppBar. Zoom UI out of this pass.
- Colorways, native pywebview menu, crate tree in Main, Settings as a Main page stay.
- Do not write inside the Serato folder.
- Synthetic fixtures only. No `src/` files at repo root.

## Review Focus

- Window narrower than 560px on first launch: Drawer is mini; `settings.json` has no `drawer_open` until the person toggles. Test in Task 3.
- Person resizes below 560px after saving open: Drawer goes mini without POSTing `drawer_open: false`. Test in Task 3.
- Track loaded then paused: AppBar player stays. `trackId` still set. Test in Task 5.
- Serato open: lock banner under AppBar; chip still `Serato 4`; Help and Settings still clickable. Test in Task 6.
- Settings page open: space control hides with `#app-body`; Help/Settings stay in the AppBar. Test in Task 2.

## File map

- `app_config.py`, `telemetry.py`, `server.py` — `layout.drawer_open`
- `tests/test_app_config.py`, `tests/test_setup.py` — persist and POST
- `src/lib/api-types.ts`, `src/lib/ui/layout.ts` — payload and cutoff constant
- `src/pages/AppShell.tsx`, `src/lib/ui/app-shell.ts`, `src/stories/pages/AppShell.stories.tsx`
- `src/lib/ui/nav.ts` — nest `#view-children` under the open primary
- `src/lib/ui/views.ts` — hide `#status` when writable
- `src/components/PlayerBar.tsx`, `src/components/WaveformPanel.tsx`, `src/lib/player/player.ts`
- `static/index.html`, `static/app.css`
- `src/tests/pages/AppShell.test.tsx`, `src/tests/player.test.ts`
- `docs/architecture.md`, `AGENTS.md`, `CLAUDE.md`, `docs/quick-start.md`, `docs/wiki/Home.md`, `docs/wiki/Quick-Start.md`

---

### Task 1: Persist `layout.drawer_open`

**Files:**
- Modify: `app_config.py` (`LAYOUT_FIELDS`, `Settings`, `_parse_layout`, `as_json`, add `set_drawer_open`)
- Modify: `telemetry.py` (`public_settings` layout object)
- Modify: `server.py` (`_post_settings` layout branch)
- Test: `tests/test_app_config.py`, `tests/test_setup.py`

**Interfaces:**
- Consumes: existing `layout.track_list_width` merge
- Produces: `Settings.drawer_open: bool | None` (`None` = never chosen). `set_drawer_open(value: bool) -> Settings` keeps `track_list_width`. `set_track_list_width` keeps `drawer_open`. GET/POST `layout` is `{ track_list_width: number | null, drawer_open?: boolean | null }`. POST may send one key or both. Unknown layout keys stay 400.

- [ ] **Step 1: Write the failing tests**

`test_app_config.py`: `set_drawer_open(True)` writes `layout.drawer_open`; `set_track_list_width(520)` then `set_drawer_open(False)` keeps width 520; missing key loads `drawer_open is None`; `"drawer_open": 1` is ignored.

`test_setup.py`: POST `{"layout": {"drawer_open": True}}` returns 200 and GET echoes it; POST width-only keeps a saved `drawer_open`; POST `{"layout": {"drawer_open": "yes"}}` is 400 and writes nothing.

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_app_config tests.test_setup -v`

Expected: FAIL on the new assertions (`drawer_open` unknown / 400).

- [ ] **Step 3: Implement `set_drawer_open` and parse/POST merge**

`LAYOUT_FIELDS = ("track_list_width", "drawer_open")`. `_parse_layout` returns width and optional bool. `as_json` omits `layout` when both are unset; includes only the keys that are set. Server layout branch: allowed keys subset of `LAYOUT_FIELDS`, at least one key, bool for `drawer_open`, int|None for width.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python3 -m unittest tests.test_app_config tests.test_setup -v`

Expected: PASS, including `test_layout_width_is_saved_and_reset`.

- [ ] **Step 5: Commit**

```bash
git add app_config.py telemetry.py server.py tests/test_app_config.py tests/test_setup.py src/lib/api-types.ts
git commit -m "feat: persist layout.drawer_open next to track list width"
```

---

### Task 2: AppBar chrome (wordmark, chip, Help, Settings, space)

**Files:**
- Modify: `src/pages/AppShell.tsx`
- Modify: `static/index.html` (`.brand` keeps space; h1/generation/status/help move by portal)
- Modify: `src/tests/pages/AppShell.test.tsx`
- Modify: `src/stories/pages/AppShell.stories.tsx`
- Modify: `src/lib/api-types.ts` if Task 1 did not (`layout.drawer_open`)

**Interfaces:**
- Consumes: existing ids `#library-generation`, `#library-generation-note`, `.brand h1`, `#open-help`, `#open-settings`, `#space-field`
- Produces: Toolbar order toggle → wordmark → generation → flex spacer → Help → Settings. Space stays in `.brand`. `#rail-foot` not adopted.

- [ ] **Step 1: Write the failing tests** in `src/tests/pages/AppShell.test.tsx`

Replace the old “Help in drawer / collapse hides Help / space in AppBar” cases:

- `document.querySelector(".MuiAppBar-root")` contains `#open-help`, `#open-settings`, the crateCraft `h1`, `#library-generation`
- AppBar does not contain `#space`
- `.brand` contains `#space` and does not contain the `h1`
- `#app-drawer` does not contain Help/Settings
- collapse: Help `closest("[inert]")` is null; crate list still in `.rail`
- Settings view: `#app-body` hidden or filled, Help still in AppBar

- [ ] **Step 2: Run the AppShell tests to verify they fail**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx`

Expected: FAIL (Help still in drawer, space still in AppBar).

- [ ] **Step 3: Implement portals and Toolbar slots in `AppShell.tsx`**

Adopt: `h1` (from `.brand`) after toggle, `#library-generation` + note after wordmark, `#open-help` and `#open-settings` at Toolbar end, `#space-field` not adopted (leave in `.brand`). Style wordmark `fontSize: 34`. Toolbar `minHeight` taller than 56. Stop adopting `#rail-foot`. Hide empty footer.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AppShell.tsx src/tests/pages/AppShell.test.tsx src/stories/pages/AppShell.stories.tsx static/index.html static/app.css
git commit -m "feat: put crateCraft, generation, Help, and Settings in the AppBar"
```

---

### Task 3: Mini-variant Drawer and remembered width

**Files:**
- Modify: `src/pages/AppShell.tsx`
- Modify: `src/lib/ui/layout.ts` (`DRAWER_MINI_CUTOFF = TRACK_LIST_MIN_WIDTH + 200`)
- Modify: `src/tests/pages/AppShell.test.tsx`
- Modify: `src/lib/ui/nav.ts` only if collapsed children must hide

**Interfaces:**
- Consumes: `SettingsPayload.layout.drawer_open`, `DRAWER_MINI_CUTOFF` (560)
- Produces: `open` true → width 200 with labels; `open` false → width 56, icons visible, labels visually hidden, nav not `inert`. Toggle POSTs `{ layout: { drawer_open: boolean } }`. First mount: `drawer_open === true` → open; `false` → mini; `null`/missing → open iff `innerWidth >= DRAWER_MINI_CUTOFF`. `resize` below cutoff forces mini display without POST.

- [ ] **Step 1: Write the failing tests**

- Default wide window, no settings: `aria-expanded="true"`, drawer paper width 200
- `innerWidth = 390`, no settings: `aria-expanded="false"`, drawer still in the tree, `#views` not inside `[inert]`, Help still in AppBar
- After POST mock of `drawer_open: false` on a wide window: starts mini
- Resize 1200 → 500: goes mini; fetch mock not called with `drawer_open: false`
- Toggle click POSTs `{ layout: { drawer_open: false } }` then `true`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx`

Expected: FAIL (today width 0 and `inert` when collapsed; 980px cutoff).

- [ ] **Step 3: Implement mini-variant in `AppShell.tsx`**

Persistent Drawer always visible. `width` 200 ↔ 56. `overflow-x: hidden` on paper. Do not set `inert` when mini. Read `applyLayout` / settings payload for initial `drawer_open`. Export `DRAWER_MINI_CUTOFF` from `layout.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx src/tests/splitter.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AppShell.tsx src/lib/ui/layout.ts src/tests/pages/AppShell.test.tsx
git commit -m "feat: mini-variant Drawer remembers layout.drawer_open"
```

---

### Task 4: Nested children and mini icons

**Files:**
- Modify: `src/lib/ui/nav.ts` (`paintNav`)
- Modify: `static/index.html` (`#views` buttons get a leading icon span; `#view-children` no longer a sheet sibling)
- Modify: `static/app.css`
- Modify: `src/pages/AppShell.tsx` (stop adopting `#view-children` as a drawer sibling strip; `paintNav` places it)
- Modify: `src/tests/pages/AppShell.test.tsx`
- Icons: `MusicNote`, `Folder`, `Favorite`, `Backup`, `GraphicEq` from `@mui/icons-material` as children of the five `[data-nav]` buttons (SVG prepend in `paintNav` or static markup)

**Interfaces:**
- Consumes: `NAV_GROUPS`, `paintNav(mode)`
- Produces: When Drawer is open, `#view-children` is inserted after the selected `[data-nav]` button and lists that parent’s children. Organize files and Backups keep `hidden` on the strip. Mini: hide `#view-children`; a primary still calls `modeForGroup`. Sheet has no `#view-children` tab strip. `#sheet-title` stays.

- [ ] **Step 1: Write the failing tests**

- `paintNav("crates")`: `#view-children` is inside `#views` (or immediately after the Music button); visible views `["crates","history","stats"]`
- `paintNav("files")`: strip hidden; Organize files has no nested list
- Mini (`aria-expanded="false"`): `#view-children` not displayed; five `[data-nav]` buttons still visible
- `document.querySelector("main.sheet")` does not contain `#view-children`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx`

Expected: FAIL (`#view-children` still a sibling strip).

- [ ] **Step 3: Implement `paintNav` insert and icon children**

Move the node in `paintNav`. CSS indent nested tabs. Mini CSS: hide the nested list, clip labels, keep 24px icons.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui/nav.ts src/pages/AppShell.tsx static/index.html static/app.css src/tests/pages/AppShell.test.tsx
git commit -m "feat: nest drawer children under the open primary"
```

---

### Task 5: AppBar player (Play · title · SWF1 · time)

**Files:**
- Modify: `src/pages/AppShell.tsx` (player slot in Toolbar `flex: 1`, between chip and Help)
- Modify: `src/components/PlayerBar.tsx` (compact row)
- Modify: `src/components/WaveformPanel.tsx` (`compact?: boolean` hides zoom and overview)
- Modify: `src/lib/player/player.ts` (`mountPlayer` builds Play/title/wave/time in one row)
- Modify: `static/app.css` (drop full-width `.player-strip` under AppBar)
- Test: `src/tests/pages/AppShell.test.tsx`, `src/tests/player.test.ts`

**Interfaces:**
- Consumes: `subscribe` / `getPlayerState().trackId`
- Produces: `#player-bar` adopted into the Toolbar flex slot. Hidden when `trackId === null`. Visible when a track is loaded, including `playing === false`. Compact `WaveformPanel` with no zoom controls. Previous/next/volume/seek slider are not in the AppBar; Space / Left / Right shortcuts still toggle and seek.

- [ ] **Step 1: Write the failing tests**

- After `mountAppShell` + `mountPlayer`, `#player-bar` is inside `.MuiAppBar-root`, not `appBar.nextElementSibling`
- `hidden` or `display:none` / zero height while `trackId` is null
- After `play(id)` (or setting snapshot with a track): player visible; contains Play, title, a waveform canvas, time
- `pause()`: player still visible
- `resetPlayback` / no track: hidden again
- Compact: no zoom plus/minus in `#player-bar`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx src/tests/player.test.ts`

Expected: FAIL (player still a strip under the AppBar, always shown).

- [ ] **Step 3: Implement compact bar and AppShell subscribe**

`AppShell` `useEffect(() => subscribe(...), [])` sets `hasTrack`. Slot `sx` `display: hasTrack ? "flex" : "none"`. `WaveformPanel` `compact` skips zoom/overview. Rebuild `mountPlayer` stack as one row.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx src/tests/player.test.ts src/tests/components/PlayButton.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AppShell.tsx src/components/PlayerBar.tsx src/components/WaveformPanel.tsx src/lib/player/player.ts static/app.css src/tests/pages/AppShell.test.tsx src/tests/player.test.ts
git commit -m "feat: dock compact SWF1 player in the AppBar until the track clears"
```

---

### Task 6: Write-lock notice under the AppBar

**Files:**
- Modify: `src/pages/AppShell.tsx` (slot above `NoticeBanner`)
- Modify: `src/lib/ui/views.ts` (`applyStatus` sets `#status`.hidden when `writable !== false`)
- Modify: `static/index.html` (`#status` starts `hidden`)
- Test: `src/tests/pages/AppShell.test.tsx`, `src/tests/generation.test.ts`

**Interfaces:**
- Consumes: `applyStatus` / `statusLine`
- Produces: Persistent `#status` under the AppBar, sibling above `#app-notice`. Not dismissable. Hidden while checking or writable. Visible when `writable === false`. Chip text stays generation (`Serato 4`), not the lock sentence.

- [ ] **Step 1: Write the failing tests**

- Checking: `#status` hidden; `#library-generation` is Checking Serato / Serato n
- `applyStatus({ writable: false, message: "Serato is open. Changes are paused." })`: `#status` visible under AppBar, text matches, chip still generation
- `applyStatus({ writable: true, generation: { kind: "serato4" } })`: `#status` hidden; `#app-notice` still works for `setNotice`
- Help remains in AppBar while locked

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx src/tests/generation.test.ts`

Expected: FAIL (`#status` still in `.brand`).

- [ ] **Step 3: Implement portal + hidden flag**

Adopt `#status` into the lock slot. `applyStatus` toggles `hidden`. Style as a warning bar, not `NoticeBanner`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/tests/pages/AppShell.test.tsx src/tests/generation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AppShell.tsx src/lib/ui/views.ts static/index.html src/tests/pages/AppShell.test.tsx src/tests/generation.test.ts
git commit -m "feat: show Serato lock copy under the AppBar"
```

---

### Task 7: Docs, locales, bundles

**Files:**
- Modify: `docs/architecture.md` (AppBar contents, mini Drawer, space in crate rail, player, lock banner, `layout.drawer_open`, cutoff 560 not 980)
- Modify: `AGENTS.md` and `CLAUDE.md` together (layout summary)
- Modify: `docs/quick-start.md`, `docs/wiki/Home.md`, `docs/wiki/Quick-Start.md` (space in crate rail; Help/Settings stay in the top bar when the rail is mini; player in the top bar after a track)
- `locales/en.json` / `es.json` only if a new key is required (prefer existing `rail.heading`, `help.title`, `settings.title`, `generation.*`, `status.*`)
- Rebuild: `static/app.js` via `npm run build`

**Interfaces:**
- Consumes: behavior from Tasks 1–6
- Produces: docs that match the shipped chrome

- [ ] **Step 1: Update the named docs** (no failing-test-first; wiki/guide strings are the check)

Grep `space menu sits in the top bar` and `Collapse hides Help and Settings` and replace with the new sentences on every hit.

- [ ] **Step 2: Run wiki/guide tests**

Run: `python3 -m unittest tests.test_wiki_docs tests.test_wiki_features tests.test_guide_pages -v`

Expected: PASS.

- [ ] **Step 3: Rebuild the page bundle**

Run: `npm run build`

Expected: `static/app.js` matches `src/`.

- [ ] **Step 4: Run the After-a-change subset that this PR touches**

```bash
python3 -m unittest tests.test_app_config tests.test_setup tests.test_wiki_docs tests.test_wiki_features tests.test_guide_pages -v
npx tsc --noEmit
npx eslint src
npx vitest run src/tests/pages/AppShell.test.tsx src/tests/player.test.ts src/tests/generation.test.ts src/tests/splitter.test.ts src/tests/layout.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs AGENTS.md CLAUDE.md locales static/app.js static/app.js.map
git commit -m "docs: AppShell chrome — AppBar player, mini rail, lock banner"
```

---

## Self-review

- Spec goals each have a task: brand/chip/Help (2), mini+remember (1+3), nested children (4), player+one waveform (5), space in rail (2), lock banner (6), docs (7).
- `#view-children` leaving the sheet is Task 4. `#rail-foot` leaving the Drawer is Task 2.
- `layout.drawer_open` types match GET/POST across Python and `SettingsPayload`.
- Review Focus lines have owning tests in Tasks 2, 3, 5, 6.
