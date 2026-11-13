# crateCraft handoff (look / layout, issue #300)

Prepared 11 Nov 2026 for the developer taking over the MUI look-and-layout walk.

**This file is a snapshot.** It is not an approved spec. It does not authorize product code, a MUI install, or new GitHub issues.

**Do not change `src/`, `static/`, locales, wiki, or `package.json` until Charles approves** `docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md`.

**Do not reopen leftover nav tickets** [#291](https://github.com/mookiejones/crateCraft/issues/291), [#295](https://github.com/mookiejones/crateCraft/issues/295), [#297](https://github.com/mookiejones/crateCraft/issues/297).

**Do not file new GitHub issues** unless Charles says to file. **Do not push** unless he asks. Never push to `main`.

Companion design spec (DRAFT): [`docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md`](docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md)

Attachments (screenshots, metrics, uncommitted patch): [`docs/handoff/attachments/`](docs/handoff/attachments/)

---

## 1. Charles’s concerns and intended app experience

Quoted in his own words, or from text he filed. Nothing in this section is inferred.

### From GitHub issue #300 (filed by Charles)

> A **choice walk**, not a build. When Charles says work on this issue (or `/serato-issue` on this number), the agent **walks Charles through look and layout options** until he picks. It does **not** open a product PR in that session.

> Charles can skip the questions and say “just pick / just start.” Then the agent states its defaults in one line and writes the spec from those defaults. Still no product code until he approves the spec.

> **Hard gate:** nothing ships until Charles approves that document in chat. After approval, file or update **child implementation issues** (do not dump the whole redesign into one PR). Then stop unless he says ship a child.

> Feel: attractive, simple, professional, still fun and modern. No palette was locked as of 2026-10-23.

> Colorways already in the app: `serato-like` (default), `dark-club`, `light`, `classic`. Saved `motown` / `deep-house` / `daisy-age` load as Classic. `icon_follows_theme` defaults on.

> Nav implementation already has tickets. This issue does **not** replace them: #291, #295, #297.

> Shipping the redesign. Library writes. New DJ features. Changing Serato. [listed as out of scope]

### From Charles’s comment on #300 (“MUI walk started (Crates first)”)

> Status is **DRAFT**. No product UI until Charles approves that file.

> Kit (Charles): MUI + MUI X Data Grid. Theme maps to existing colorways.

> Nav leftovers stay on #291 / #295 / #297. This consult does not install MUI.

### From this session (verbatim user messages)

> Work #300 MUI walk. Read `docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md` first. Kit is MUI + MUI X Data Grid. Theme maps to existing colorways. No product code until Charles approves that spec. Walk one screen per turn. Current screen: parent shell, then Crates. Space switch is AppBar (A). Open: Help/Settings AppBar vs Drawer footer. Hard gates and theirs-vs-guesses are in the spec. Do not reopen nav tickets #291 #295 #297.

> Create crateCraft-handoff.md for the developer taking over. […] Don’t infer missing requirements. […] Don’t change code while preparing this handoff.

### Recorded from earlier sessions (Charles, not this chat)

These are stored as his stated preferences. They are not new requirements invented for this handoff.

- He strongly dislikes the Crates layout and wants that area fixed before the rest of the app.
- Crates is the primary room. Header/cell mismatch makes the page feel broken rather than merely ugly.
- He expected a datagrid package. He overrode #300’s original Base UI / Radix preference: whole-app React redesign with **MUI + MUI X Data Grid**, walked screen by screen, with a document another Grok bot can resume.
- Preferred shell: MainContainer with a top Main AppBar, a collapsible sidebar, and MainApp content.
- Sidebar nested: Library shows only relevant children (Crates, History, Play stats); each child shows only its tools. The current flat rail is hard to parse. Sheet child tabs should go away.
- Named crates sit in Main next to the track list, not in the Drawer.
- Space switch is AppBar (he picked **A**).
- One preview player this pass. Dual-file playback is later, not chrome for #303–#306.
- Keep findability/nav and look/layout as separate tracks. Do not restyle while shipping nav leftovers.
- Do not persist `ui-ux-pro-max` `design-system/` into the repo.
- Do not write or file GitHub issues until he explicitly says to file.
- Do not push unless asked. Never push to `main`.

### Open questions he has not answered

Do not fill these in.

- Help and Settings: AppBar vs Drawer footer (asked this session; no letter yet).
- Data Grid density vs current 36px `--row`.
- Column resize / hide vs today’s ten fields.
- Player dock (spec marks “full strip under the AppBar” as a **guess**).
- MUI X Community vs paid Pro (spec marks Community as a **guess**).

The #300 comment’s resume prompt still says “Current screen: Crates (#304)”. Later in this session he said **parent shell, then Crates**. Treat the later instruction as current.

---

## 2. The issue: link and full description

Parent (the work this walk is on):

**https://github.com/mookiejones/crateCraft/issues/300**

- Title: Walk through crateCraft look and layout choices before any redesign
- State: OPEN
- Labels: `enhancement`, `research`, `area:ui`
- Assignee: mookiejones (Charles Berman)

### Full body of #300

```
- [x] I did not attach a Serato database or an audio file.

## What this issue is

A **choice walk**, not a build. When Charles says work on this issue (or `/serato-issue` on this number), the agent **walks Charles through look and layout options** until he picks. It does **not** open a product PR in that session.

Charles can skip the questions and say “just pick / just start.” Then the agent states its defaults in one line and writes the spec from those defaults. Still no product code until he approves the spec.

## Agent protocol (read first)

1. **Stop.** Do not edit `src/`, `static/`, locales, wiki, or architecture for a redesign in this session.
2. **Claim** the issue (`gh issue edit <n> --add-assignee @me`) so it is owned, then consult.
3. **Skills:** brainstorming (questions, playback, visual companion), `ui-ux-pro-max` (style, palette, density, nav), `designing-interfaces`, `building-accessible-interfaces`. Native window + existing colorways stay in play.
4. **One question at a time.** Offer a short menu only when Charles is stuck. Show mockups or side-by-side comps when seeing beats reading.
5. **Play back** each decision in his words. Mark guesses as guesses.
6. **Write the spec** to `docs/superpowers/specs/YYYY-MM-DD-cratecraft-look-layout-design.md` (or the path Charles names). Cover intent, goals / non-goals, look, layout, colorway, density, motion, what stays, what is left to a later builder.
7. **Hard gate:** nothing ships until Charles approves that document in chat. After approval, file or update **child implementation issues** (do not dump the whole redesign into one PR). Then stop unless he says ship a child.

## Ground already known (do not re-ask unless he wants to change it)

- Feel: attractive, simple, professional, still fun and modern. No palette was locked as of 2026-10-23.
- Colorways already in the app: `serato-like` (default), `dark-club`, `light`, `classic`. Saved `motown` / `deep-house` / `daisy-age` load as Classic. `icon_follows_theme` defaults on.
- Rail today: Library, Library health, Backups, Before a gig. Library children include Crates, History, Play stats, Organize files. Tempo drift sits under Before a gig.
- Nav implementation already has tickets. This issue does **not** replace them:
  - #291 collapse rail to five primaries + sheet tab strip
  - #295 rename colliding Library / Library health / Before a gig labels
  - #297 view name and crate scope on the sheet
- Tokens live in `static/tokens.css`. Page is strict TypeScript/React. Desktop is pywebview (WKWebView / WebView2), not Chromium.

## Choices to walk (order unless Charles redirects)

1. **Job of the screen** in a real session: crate picking before a gig, library health, backups, or something else first.
2. **Layout:** keep the left rail; five primaries + sheet tabs (#291); something else. Density of the track list vs the detail pane.
3. **Look:** stay on existing colorways vs a new palette / type / spacing system. How close to Serato DJ vs a crateCraft identity.
4. **Motion and chrome:** quiet vs a bit of club energy; what the Dock / window icon should do.
5. **What this pass will not touch:** wizard, native menus, hash routes, crate-tree width, library writes.

## Acceptance (this issue)

- Charles has a written, approved look-and-layout spec, or he closed this as “keep current look.”
- Child issues exist for any build work (or #291 / #295 / #297 were updated with the chosen names and layout).
- No product UI merged from the consult session.

## Out of scope

Shipping the redesign. Library writes. New DJ features. Changing Serato.
```

Note: the “Rail today” paragraph in that body is **stale relative to shipped nav**. After [#291](https://github.com/mookiejones/crateCraft/issues/291) / [PR #293](https://github.com/mookiejones/crateCraft/pull/293) the five primaries are Music, Organize files, Health, Backups, Gig. Do not treat the old names in the issue body as current UI.

### Child issues (blocked by #300 until the spec is approved)

| # | Title | URL | State |
|---|---|---|---|
| 303 | MUI theme: ThemeProvider and colorways | https://github.com/mookiejones/crateCraft/issues/303 | OPEN |
| 304 | MUI Crates: Data Grid, tree, and detail | https://github.com/mookiejones/crateCraft/issues/304 | OPEN |
| 305 | MUI shell: rail, sheet tabs, heading, splitter | https://github.com/mookiejones/crateCraft/issues/305 | OPEN |
| 306 | MUI player and waveform chrome | https://github.com/mookiejones/crateCraft/issues/306 | OPEN |
| 307 | MUI History and Play stats | https://github.com/mookiejones/crateCraft/issues/307 | OPEN |
| 308 | MUI Organize files | https://github.com/mookiejones/crateCraft/issues/308 | OPEN |
| 309 | MUI Health group | https://github.com/mookiejones/crateCraft/issues/309 | OPEN |
| 310 | MUI Backups and restore | https://github.com/mookiejones/crateCraft/issues/310 | OPEN |
| 311 | MUI Gig: Ready, Check drive, Tempo drift | https://github.com/mookiejones/crateCraft/issues/311 | OPEN |
| 312 | MUI Settings and setup wizard | https://github.com/mookiejones/crateCraft/issues/312 | OPEN |
| 313 | MUI shared dialogs | https://github.com/mookiejones/crateCraft/issues/313 | OPEN |

Each child body starts with the same gate: **Do not implement until Charles approves** `docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md`. Kickoff: claim the child, one screen, kit MUI + MUI X Data Grid, theme maps to colorways, en+es, tooltips, tests, branch `issue-<n>-short-name`, PR closes the child **not** #300.

#### #303 body (first impl child after approve)

> First implementation child after the #300 spec is approved. Add MUI + Emotion + MUI X Data Grid deps. ThemeProvider on AppProviders. Map palette to serato-like, dark-club, light, and classic. No full screen restyle in this ticket except a proof the theme loads.

#### #304 body (Crates)

> Replace the homemade track list (div.columns + virtual-scroll island + TrackRow) with MUI X Data Grid so headers and cells are one component. Crate tree, actions, split panes, Play via PlayerContext, detail pane. Screen 1 of the MUI walk.

#### #305 body (shell; lock this before drawing the Crates Data Grid)

> Rail primaries, sheet child tabs, sheet heading, list/detail splitter in MUI. Do not reopen leftover nav tickets 4–10 (hash routes, Cmd+K). Use the names already shipped in #291 / #295 / #298.

Charles later said lock the parent app shell first, then Crates. #303 remains the first *implementation* child after approval.

### Docs-only PR (must not close #300)

**https://github.com/mookiejones/crateCraft/pull/314** — MUI walk brief for look and layout (#300). OPEN. Head on GitHub: `a132639`. Does not close #300.

---

## 3. Current branch, commit, app version, uncommitted changes

Captured 11 Nov 2026 from `/Users/charlesberman/serato-library-manager`.

| Fact | Value |
|---|---|
| Branch | `issue-300-mui-walk` (tracks `origin/issue-300-mui-walk`, **ahead 1**) |
| Local HEAD | `f753e986a6bd338dd9067bc7b85626140b53446d` |
| HEAD subject | `docs: show look choices as A/B companion wireframes` |
| App version | `v1.3.3-4-gf753e98-dirty` (`git describe --tags --always --dirty`; also shown in the rail footer in the screenshots) |
| GitHub PR head | `a132639f50b3fbce31b8c8d6919290ebd639e6d3` (PR #314, 2 commits) |
| vs `origin/main` | 3 unique commits: `a333a0a`, `a132639`, `f753e98` |
| Remote | `git@github.com:mookiejones/serato-library-manager.git` (GitHub repo display name is crateCraft) |
| Dirty files | `.gitignore`, `docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md` |
| Stash | `stash@{0}: On main: vscode dirty` (unrelated; do not apply without inspecting) |

### Commits on this branch vs `origin/main`

1. `a333a0a` — docs: add MUI look-and-layout walk brief for #300 (on PR #314)
2. `a132639` — docs: add MUI MCP and lock one player on the #300 walk (on PR #314)
3. `f753e98` — docs: show look choices as A/B companion wireframes (**local only, not on the PR**)

### Work that exists only locally

1. **Commit `f753e98`.** Not pushed. PR #314 GitHub head is still `a132639`.
2. **Uncommitted spec + `.gitignore`.** Patch: [`docs/handoff/attachments/uncommitted-local.patch`](docs/handoff/attachments/uncommitted-local.patch). Adds `.superpowers/` to `.gitignore`. Updates the spec so Drawer nested children, named crates in Main, space switch in AppBar, Crates tree next to the Data Grid, and detail as the right pane are **theirs**. Leaves Help/Settings open. Player dock stays a guess.
3. **Gitignored companion mockups** under `.superpowers/brainstorm/16786-1794418194/content/`: `space-switch.html` (Charles picked A), `help-settings.html`, `help-settings-v2.html` (asked this session, no letter), `waiting.html`. Companion URL at capture time: `http://localhost:57983/?key=798e7e1e7708c48a8424ede72faacf94009860aae945e64da7c29fa365429335` (may be dead later).
4. **This handoff** (`crateCraft-handoff.md` and `docs/handoff/attachments/`). Untracked. Created for takeover. Not committed.

No product `src/` or `package.json` MUI change exists on this branch. Runtime UI deps remain React + react-dom only.

### Uncommitted patch (secrets-free)

The patch is only `.gitignore` and the look/layout spec. It does not contain settings, API keys, or any `master.sqlite`.

---

## 4. What works, what is broken, what has drifted

Confirmed vs guess is labeled. Reproduction uses a **synthetic** `TempLibrary` fixture, not the live Serato library. Screenshots: [`docs/handoff/attachments/`](docs/handoff/attachments/). Pixel metrics: [`docs/handoff/attachments/crates-column-metrics.json`](docs/handoff/attachments/crates-column-metrics.json).

### What works (confirmed this capture)

- Fixture server answered `GET /api/health` with `{"ok": true}`.
- `GET /api/library?space=Serato%20Library` returned 2 tracks and crate `Saturday gig`.
- First-run wizard did not show when `CRATECRAFT_CONFIG_DIR` had `wizard_complete` true and a sharing choice.
- Crates, History, and Play stats sheet tabs render. Detail pane, Play, Previous/Next, and the bottom player strip render.
- Five rail primaries (Music, Organize files, Health, Backups, Gig) match the shipped #291 names.
- Sheet heading shows `Crates · Serato Library` (shipped with PR #298).
- Colorway in the capture is serato-like. Footer shows `v1.3.3-4-gf753e98-dirty`.

### Confirmed problems (Charles named them, and this capture reproduced them)

#### A. Crates column titles and cells are not one grid

Charles: header/cell mismatch makes Crates feel **broken**, not merely ugly. He expected a datagrid package.

**Repro (fixture, 1280×800):**

1. Start the app on a library with at least two tracks and ten columns (Title … Time).
2. Open Music → Crates, All tracks.
3. Look at Title / Artist / BPM vs the first row. Play, a color dot, and the title share the Title cell. At rest, Artist header is already ~40px to the right of the Artist cell (header left 466 vs cell left 426). BPM header 590 vs cell 526.
4. Set `#list.scrollLeft = 220` without scrolling `.browser`. Headers stay. Cells move. First header left stays 296; first cell left becomes 76; delta **−220px**. BPM `128` and key `9A` sit under the Title header.

**Why (code, not a guess):** there is no React table parent. Headers are a sibling `div.columns` filled by `renderColumns()` in `src/lib/ui/views.ts`. Rows are a React island (`TrackListWindow` fragment + `TrackRow`) mounted under `#list` by `src/lib/ui/virtual-scroll.ts`. `.browser { overflow-x: auto }` and `.list { overflow: auto }` scroll separately. `.columns, .row` share a 10-column CSS grid, but Title cells also contain Play + color + emoji (`.title-line` in `src/components/TrackRow.tsx`). `.browser:not(.for-history) .columns` and `.crate-panes` have `min-width: 58rem`.

**Screenshots:**

- [`01-crates-shell-at-rest.png`](docs/handoff/attachments/01-crates-shell-at-rest.png) — whole Crates room
- [`03-crates-header-and-rows-at-rest.png`](docs/handoff/attachments/03-crates-header-and-rows-at-rest.png) — at rest, Play inside Title, BPM under Artist
- [`04-crates-list-scrolled-headers-stay.png`](docs/handoff/attachments/04-crates-list-scrolled-headers-stay.png) — after `#list` horizontal scroll
- [`05-crates-list-scrolled-closeup.png`](docs/handoff/attachments/05-crates-list-scrolled-closeup.png) — close-up of that drift

#### B. AppBar + Drawer mashed into one left rail

Charles wants MainContainer → top Main AppBar → collapsible Drawer + Main content. Nested Library children. Named crates in Main. Space switch in the AppBar (pick **A**).

**Repro:**

1. Open Crates (browser or `python3 server.py`).
2. The left `aside.rail` holds brand, generation, **space `<select>`**, five primaries, crate search/sort, crate tree, crate actions, version, **Help**, **Settings**.
3. There is no top AppBar. Sheet child tabs `#view-children` (Crates / History / Play stats) sit in Main. Player is a fourth strip under the sheet.

**Screenshot:** [`02-rail-mashed-jobs.png`](docs/handoff/attachments/02-rail-mashed-jobs.png)

### Confirmed in the screenshot, not named by Charles

- A **Right crate** label overlaps the track rows in the single-pane Crates view (visible in 01, 03, 04). Charles did not mention this string. It is split-crate chrome leaking into the default layout. Do not treat it as a #300 acceptance item unless he says so.
- Fixture `time_added` of 10 renders as **Dec 31, 1969**. That is test data, not a product bug.

### Drift from Charles’s expectations (theirs vs today’s UI)

| Expectation (theirs) | Today | Status |
|---|---|---|
| MUI + MUI X Data Grid | Homemade CSS grid + virtual list | Not started (gated) |
| ThemeProvider mapped to four colorways | `tokens.css` + `data-colorway` | Not started (gated) |
| AppBar + collapsible Drawer + Main | One left rail, no AppBar | Confirmed mash |
| Nested Drawer: Library → Crates / History / Play stats; sheet tabs go away | Flat five primaries + `#view-children` tabs | Confirmed mash |
| Named crates in Main next to the grid | Crate tree in the rail | Confirmed mash |
| Space switch in the AppBar | `#space` select in the rail | Confirmed mash; he picked A |
| One preview player | One `<audio>` / PlayerContext (matches) | Works |
| Dual-file playback later | Not built | Matches “later” |
| Help/Settings AppBar vs Drawer footer | Rail footer `#open-help` / `#open-settings` | **Open** (no pick) |
| Spec approved | Status DRAFT | Not approved |
| Do not reopen #291 / #295 / #297 | Those issues exist; #291 closed, #295 and #297 still OPEN after PRs merged | Process drift; not a look bug |

### Guesses (do not treat as requirements)

- Player default dock: full strip under the AppBar.
- Data Grid cells read-only (Play / select / sort / resize only).
- First impl child after approve: #303 then Crates Data Grid (Charles also said lock shell #305 before drawing Crates).
- History uses the same Data Grid component.
- MUI X Community only (no paid Pro).
- Detail as right pane is **theirs** for Crates; “not a drawer” is still marked guess in one spec row (the tab-next-to-crate idea is dropped, theirs).

---

## 5. Recent changes likely related, with PR links and paths

Look/layout consult (this branch, docs only):

| Change | Link | Paths |
|---|---|---|
| Draft MUI walk spec + child issues | [PR #314](https://github.com/mookiejones/crateCraft/pull/314) | `docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md`, `.grok/config.toml` (MUI MCP) |
| Local A/B wireframe docs | commit `f753e98` (not on PR) | spec, `.grok/rules/visual-choices.md`, AGENTS.md, CLAUDE.md |
| Uncommitted theirs updates | patch in attachments | spec Drawer / crates / space; `.gitignore` `.superpowers/` |

Nav already shipped (separate track; do not reopen leftovers 4–10):

| Change | Issue | PR | Paths that still define today’s mash |
|---|---|---|---|
| Collapse rail to five primaries | [#291](https://github.com/mookiejones/crateCraft/issues/291) (CLOSED) | [#293](https://github.com/mookiejones/crateCraft/pull/293) | `static/index.html` `#views`, `src/lib/ui/nav.ts` |
| Rename colliding Library labels | [#295](https://github.com/mookiejones/crateCraft/issues/295) (still OPEN) | [#296](https://github.com/mookiejones/crateCraft/pull/296) | locales, rail copy (Music / Health / Gig) |
| Sheet title + crate scope | [#297](https://github.com/mookiejones/crateCraft/issues/297) (still OPEN) | [#298](https://github.com/mookiejones/crateCraft/pull/298) | sheet chrome, `#view-children` |

Crates list architecture (the broken table; not a recent PR, current code):

- `src/lib/ui/views.ts` — `renderColumns()` (~449)
- `src/lib/ui/virtual-scroll.ts` — island under `#list`
- `src/components/TrackListWindow.tsx` — fragment parent
- `src/components/TrackRow.tsx` — Play inside Title
- `static/app.css` — `.columns, .row` grid; `.browser { overflow-x: auto }`; `.list { overflow: auto }` (~611–711)
- `static/index.html` — `aside.rail`, `.columns` sibling of `#crate-panes`, `#open-help`, `#open-settings`

Related later children (blocked): #303 ThemeProvider, #304 Data Grid, #305 shell, #306 player.

Overlay kit is **#301**, separate from this table choice.

---

## 6. Tests run, known failures, how to start the app

### How to start (normal)

Browser, no native Help menu:

```bash
python3 server.py
```

Serves `http://127.0.0.1:8765`. A missing library still serves the page.

Desktop window (crateCraft):

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
# macOS also: .venv/bin/pip install -r requirements-macos.txt
.venv/bin/python desktop.py
```

Binds `127.0.0.1` on a free port. Close the window to quit. `CRATECRAFT_NO_WINDOW=1` or `--no-window` skips the window.

**Do not point takeover screenshots at the live Serato library.** Use `tests.fixture.TempLibrary` and `CRATECRAFT_CONFIG_DIR` with `app_config.set_telemetry_consent(False)` then `app_config.set_wizard_complete(True)`, plus `CRATECRAFT_DISABLE_WATCH=1`.

### Tests actually run for this handoff

Full After-a-change suite from AGENTS.md was **not** run on `f753e98-dirty` in this consult.

| Command / check | Result |
|---|---|
| Fixture `GET /api/health` on `http://127.0.0.1:50861/api/health` | `{"ok": true}` |
| Fixture `GET /api/library?space=Serato%20Library` | 2 tracks, crate `Saturday gig` |
| Playwright capture (`/tmp/handoff_screenshots.mjs`, Chromium 1280×800) | Wrote 7 PNGs; measured header/cell delta −220px after `#list` scroll |
| `python3 -m unittest discover -s tests -t . -v` | **Not run** this consult |
| `npm ci` / `npx tsc` / `npx eslint` / `npm test` / Playwright e2e suite / `npm run build` | **Not run** this consult |

### CI on PR #314 (commit `a132639` only — not `f753e98`, not the dirty spec)

All required-style checks **pass** at `a132639`:

- CodeQL pass
- analyze Python pass
- frontend (macos-latest, ubuntu-latest, windows-latest) pass
- tests (macos-latest Python 3.12, ubuntu-latest 3.12, ubuntu-latest 3.14, windows-latest 3.12) pass
- dependency audit pass
- review dependency changes pass
- require a release-notes label pass
- build user guide pass
- publish user guide skipped (expected on a PR)

`f753e98` and the uncommitted spec have **no CI**.

### Known failures

None observed in the fixture smoke or in PR #314 CI. No local red suite to report because the local suite was not run.

The Crates header/cell mismatch is a **product defect Charles already named**, not a failing test. There is no current test that fails when `#list` and `.browser` scroll independently.

---

## 7. Proposed recovery order (proposal only — not approved work)

**Proposal.** Charles has not approved this order. Do not treat it as a spec or a ship list.

1. **Read, do not paint.** Read this handoff, then the DRAFT spec, then #300. Do not install MUI. Do not edit `src/` or `package.json` for look.
2. **Inventory local-only work.** Decide with Charles whether to push `f753e98` onto PR #314 and whether to commit the uncommitted spec hunk (Drawer / named crates / space AppBar as theirs). Do not push until he asks.
3. **Finish the parent-shell walk.** Current screen is parent shell, then Crates. Open pick: Help/Settings in the AppBar vs Drawer footer. One visual A/B at a time in the Superpowers companion. Do not reuse an HTML filename.
4. **Play back and update the spec.** Mark theirs vs guesses. Leave density, column resize, and player dock as open or guess until he speaks.
5. **Wait for Charles to approve the spec** in chat or on #300. That is the hard gate.
6. **After approval only:** implement **#303** (ThemeProvider + colorways, proof the theme loads). Then **#305** (lock the shell: AppBar, nested Drawer, Main; drop sheet child tabs). Then **#304** (MUI X Data Grid so headers and cells are one component). One child, one PR. Close the child, not #300.
7. **Walk remaining inventory** (#306–#313) one screen per turn as the spec already lists.
8. **Leave nav leftovers** (hash routes, Cmd+K, crate overflow, `prompt()` → dialogs, desktop width, native menu, a11y) on #291 / #295 / #297. Do not fuse restyle with routes.
9. **Tests with the change.** Any later product PR needs unittest and/or Vitest that fail if headers and cells drift again, plus the AGENTS.md After-a-change commands pasted in the completion report.
10. **Stop** if he has not approved the spec. Consult is done when the spec is approved or he closes #300 as keep-current-look.

---

## Attachments

All under [`docs/handoff/attachments/`](docs/handoff/attachments/). Screenshots used a synthetic fixture library (titles like “Second Long Title For Independent Scroll Proof”). They do not contain the live Serato library.

| File | What it shows |
|---|---|
| [`01-crates-shell-at-rest.png`](docs/handoff/attachments/01-crates-shell-at-rest.png) | Full Crates room: mashed rail, sheet tabs, homemade list, detail, bottom player |
| [`02-rail-mashed-jobs.png`](docs/handoff/attachments/02-rail-mashed-jobs.png) | Rail only: brand, space, five primaries, crate tree, Help/Settings |
| [`03-crates-header-and-rows-at-rest.png`](docs/handoff/attachments/03-crates-header-and-rows-at-rest.png) | At rest: Play inside Title; BPM under Artist |
| [`04-crates-list-scrolled-headers-stay.png`](docs/handoff/attachments/04-crates-list-scrolled-headers-stay.png) | `#list` scrolled; headers stay; 128 / 9A under Title |
| [`05-crates-list-scrolled-closeup.png`](docs/handoff/attachments/05-crates-list-scrolled-closeup.png) | Close-up of that independent scroll |
| [`06-crates-browser-scrolled.png`](docs/handoff/attachments/06-crates-browser-scrolled.png) | `.browser` scrolled independently of `#list` |
| [`07-crates-narrow-1100.png`](docs/handoff/attachments/07-crates-narrow-1100.png) | 1100px viewport, same mash |
| [`crates-column-metrics.json`](docs/handoff/attachments/crates-column-metrics.json) | Header vs cell `left`/`width` and scrollLeft |
| [`uncommitted-local.patch`](docs/handoff/attachments/uncommitted-local.patch) | Secrets-free diff of `.gitignore` + spec |

---

## Resume prompt (paste this)

```
Work #300 MUI walk. Read docs/superpowers/specs/2026-11-11-cratecraft-look-layout-design.md first.
Also read crateCraft-handoff.md.
Kit is MUI + MUI X Data Grid. Theme maps to existing colorways.
No product code until Charles approves that spec.
Walk one screen per turn. Current screen: parent shell, then Crates.
Space switch is AppBar (A). Open: Help/Settings AppBar vs Drawer footer.
Hard gates and theirs-vs-guesses are in the spec. Do not reopen nav tickets #291 #295 #297.
```
