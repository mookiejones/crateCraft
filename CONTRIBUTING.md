# Contributing

This is a local browser for a Serato DJ Pro library. The server binds `127.0.0.1` and has no login. Changes stay in this repository. They do not add a hosted copy of the server.

<picture>
  <source media="(prefers-color-scheme: dark)" type="image/svg+xml" srcset="docs/images/contribution-flow-dark.svg">
  <source media="(prefers-color-scheme: dark)" type="image/png" srcset="docs/images/contribution-flow-dark.png">
  <source type="image/svg+xml" srcset="docs/images/contribution-flow-light.svg">
  <img alt="Branch or fork, pull request, CI green on Ubuntu, Windows, and macOS, Gatekeeper QA (mookiejones-qa) approval, then merge by the team, including agents. Docs are updated in the same PR; unmerged work is labelled PREVIEW." src="docs/images/contribution-flow-light.png" width="100%">
</picture>

## Merge flow

1. Branch or fork.
2. Open a pull request. Code and the docs that describe it go in that same pull request.
3. Add tests and run every check locally. Paste the results in the [completion report](#completion-report). See [Tests](#tests) and [Checks](#checks).
4. Wait until CI is green. These checks must pass ([`ci.yml`](.github/workflows/ci.yml), [`codeql.yml`](.github/workflows/codeql.yml)):
   - `tests (ubuntu-latest, Python 3.12)`
   - `tests (ubuntu-latest, Python 3.14)`
   - `tests (windows-latest, Python 3.12)`
   - `tests (macos-latest, Python 3.12)`
   - `frontend (ubuntu-latest)`
   - `frontend (windows-latest)`
   - `frontend (macos-latest)`
   - `analyze Python` (CodeQL)

   The workflow also runs `tests (macos-latest, Python 3.12)` and `frontend (macos-latest)` on every pull request. Add those names to branch protection so they block a merge. Until an admin does that, they still run on every pull request, and the previous required set still gates `main`.

   `dependency audit` and `review dependency changes` also run. They are not required checks. The jobs are [`dependency audit`](.github/workflows/ci.yml) and [`review dependency changes`](.github/workflows/dependency-review.yml).
5. If a new push dismisses the `mookiejones-qa` approval, re-request review.
6. QA (Gatekeeper, account `mookiejones-qa`) reviews every pull request and blocks any pull request lacking tests for its changes. See [Tests](#tests).
7. The team, including agents, may merge once `mookiejones-qa` approved the latest commit and all required checks are green. Only releases and tags (including pre-releases) need Charles's (@mookiejones) explicit OK.

`main` is protected. Changes go in only through a pull request. Never push to `main`. Do not force-push to `main`. Admins can bypass these rules, but should not.

Label work that is not merged **PREVIEW**. Do not describe it as shipped.

## Completion report

Every agent (Claude, Cursor, and others) finishes each issue with a completion report. The report goes in the pull request body. When the work has an issue, the same report is the final comment on that issue. `AGENTS.md` and `CLAUDE.md` require this report. `.github/pull_request_template.md` starts with the same fields.

Saying "done", without the issue link, the pull request link, the commit SHA, and the test output, does not count. Never claim work you did not push. The SHA is a commit on the remote branch, and each test line is a command you ran on that commit.

**What changed** is at most three bullets. **Proof** uses the exact commands in [Checks](#checks). Each command that prints a pass count includes that count. Each other command includes pass or fail. Proof names the CI status of every check in [Merge flow](#merge-flow) and includes a screenshot when the change is visible in the page. A change with no page UI says there is no screenshot. **Next** says what is needed from Charles (@mookiejones) or QA (`mookiejones-qa`). Merge only when [Merge flow](#merge-flow) allows it.

- **Issue:** link
- **PR and commit:** link and SHA
- **What changed:** up to 3 bullets
- **Proof:** the exact test commands with their pass counts, CI status, and a screenshot for UI changes
- **Not done / risks:**
- **Next:** what is needed from Charles (@mookiejones) or QA (`mookiejones-qa`)

## Before you start

Quit Serato DJ Pro before a write against a live library. The tests never open that library. Do not commit `master.sqlite`, `root.sqlite`, a backup of either file, or an audio file. Do not attach those files to an issue or a pull request. Cue points live in the audio file.

## Dev setup

Python 3.12 or 3.14. The frozen app embeds 3.12.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python desktop.py
```

`desktop.py` starts the local server and opens a native window titled crateCraft. The window uses the system web view (WebView2, WKWebView, or WebKitGTK / Qt WebKit) and does not bundle Chromium. On Windows, use `.venv\Scripts\python`. On macOS, also install `requirements-macos.txt`. On Linux, install WebKitGTK or Qt WebKit.

`python3 server.py` serves `http://127.0.0.1:8765`. Press F5 in VS Code to run that launch. **Python: Run desktop.py** debugs the native window with `.venv`.

Page color and type tokens are in `static/tokens.css`. The page source is strict TypeScript in `src/`. Edit that, then run `npm run build` so the committed `static/app.js` stays current. `npm run storybook` serves isolated components at `http://127.0.0.1:6006`. Node 22 or newer matches `engines` in `package.json`. Do not hand-edit `static/app.js`.

## Tests

Every behavior change or bug fix ships with tests in the same pull request: Python `unittest` under `tests/`, page code as Vitest `*.test.ts` in `src/tests/`. A bug fix needs a test that fails before the fix. Use only synthetic fixtures (`tests/fixtures/`), never a real `master.sqlite`, `root.sqlite`, or audio file.

QA (Gatekeeper, account `mookiejones-qa`) blocks a pull request whose tests do not meet this bar:

- Tests must fail if the logic is broken. QA may mutation-test; weak tests that pass anyway get blocked.
- Cover the edge cases that apply to the change: Windows and macOS paths, symlinks and unmounted drives, Serato 4 vs Serato 5 data, and an empty or missing library.
- Never write extra files inside the Serato folder.

## Checks

Before opening a pull request, run all of these and paste the results in the [completion report](#completion-report). Commit the rebuilt `static/app.js` and `static/wizard.js`.

From the repository root:

```bash
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -t . -v
npm ci
npx tsc --noEmit
npx tsc --noEmit -p e2e
npx eslint src e2e
npm test
npx playwright install chromium
npx playwright test -c e2e/playwright.config.ts
npm run build
```

The install step is required because the suite imports `sentry-sdk` and `posthog`. Sharing stays off without a key and without consent. Do not commit a DSN, a PostHog project key, or a filled-in `_build_config.py`.

The page checks use Node 22 or newer. `npm run typecheck` is the two `tsc` commands above.

GitHub Actions runs the same discovery with `python` on Ubuntu (3.12 and 3.14) and Windows (3.12). The Windows job also runs `python scripts/release_bundle.py check-tag` with `shell: bash` and `RELEASE_TAG` set to `v0.0.0`. [docs/github.md](docs/github.md) lists the workflows.

A desktop build uses `requirements-build.txt` and `python -m PyInstaller crateCraft.spec`. On macOS, `requirements-macos.txt` supplies the WKWebView frameworks. Release builds are unsigned. GitHub Releases is the only download. Signing runs only when the Apple or Windows secrets in `scripts/release_sign.py` are all set.

Merges to `main` refresh the **Next release** issue (`python3 scripts/prepare_release.py`). That draft does not publish. Publish is pushing tag `vMAJOR.MINOR.PATCH`, which runs [`.github/workflows/release.yml`](.github/workflows/release.yml). Generated notes read [`.github/release.yml`](.github/release.yml). Every pull request needs one of those labels (shown or hidden) so the `require a release-notes label` check can pass. [docs/github.md](docs/github.md) is the prepare-versus-publish note.

Python has no separate linter. The page uses ESLint, which rejects `any`. The suites are `unittest` and Vitest.

## What to update in the same pull request

- `docs/architecture.md` when behavior, the API, the layout, or the run path changes.
- `CLAUDE.md` and `AGENTS.md` (identical copies) when the run command or the layout summary changes.
- `docs/github.md` when a workflow, a release check, or a GitHub setting changes.
- `docs/wiki/`, `docs/index.md`, and `docs/guide/` when a DJ can see the change. Use the `updating-user-docs` skill.
- `SECURITY.md` when the threat notes or the attestation commands change.
- `PRIVACY.md` and the README when sharing, local logs, or telemetry keys change.
- `locales/en.json` and every other file in `locales/` when the page shows new text. Use `t("key")` in `src/` and `data-i18n` in `index.html`, never a bare English string. A new fixed server error sentence goes in `error_codes.py` with an `error.<code>` entry in each locale. Open the page with `?locale=qps-ploc` to spot text that skipped translation and labels that cannot take longer strings.

The pull request template asks for the same list and starts with the [completion report](#completion-report).

## Reports

Use the bug or feature template. For a vulnerability, open a [private advisory](https://github.com/mookiejones/crateCraft/security/advisories/new) instead of a public issue. Private vulnerability reporting is enabled for this repository.
