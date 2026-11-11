## Summary

<!-- Short note. The completion report is required. Saying "done", without the issue link, the pull request link, the commit SHA, and the test output, does not count. Never claim work you did not push. -->

## Completion report

Every agent (Claude, Cursor, and others) fills this in. The report stays in this pull request body. When the work has an issue, the same report is the final comment on that issue.

Saying "done", without the issue link, the pull request link, the commit SHA, and the test output, does not count. Never claim work you did not push. The SHA is a commit on the remote branch, and each test line is a command you ran on that commit.

- **Issue:** link
- **PR and commit:** link and SHA
- **What changed:** up to 3 bullets
  -
- **Proof:** the exact test commands with their pass counts, CI status, and a screenshot for UI changes
  - `python3 -m pip install -r requirements.txt`
  - `python3 -m unittest discover -s tests -t . -v`
  - `npm ci`
  - `npx tsc --noEmit`
  - `npx tsc --noEmit -p e2e`
  - `npx eslint src e2e .storybook`
  - `npm test`
  - `npx playwright install chromium`
  - `npx playwright test -c e2e/playwright.config.ts`
  - `npm run build`
  - CI: `tests (ubuntu-latest, Python 3.12)`, `tests (ubuntu-latest, Python 3.14)`, `tests (windows-latest, Python 3.12)`, `tests (macos-latest, Python 3.12)`, `frontend (ubuntu-latest)`, `frontend (windows-latest)`, `frontend (macos-latest)`, and `analyze Python` (CodeQL)
  - Screenshot:
- **Not done / risks:**
- **Next:** what is needed from Charles (@mookiejones) or QA (`mookiejones-qa`)

## Tests

<!-- Command output belongs in Proof above. -->

## Checklist

- [ ] Tests for this change are in this pull request; a bug fix has a test that fails before the fix
- [ ] Tests use only synthetic fixtures and cover relevant edge cases (Windows/macOS paths, symlinks/unmounted drives, Serato 4 vs 5, empty/missing library)
- [ ] Ran locally and pasted the output in Proof: `python3 -m pip install -r requirements.txt`, `python3 -m unittest discover -s tests -t . -v`, `npm ci`, `npx tsc --noEmit`, `npx tsc --noEmit -p e2e`, `npx eslint src e2e .storybook`, `npm test`, `npx playwright install chromium`, `npx playwright test -c e2e/playwright.config.ts`, and `npm run build` (rebuilt `static/app.js` and `static/wizard.js` committed)
- [ ] CI is green: `tests (ubuntu-latest, Python 3.12)`, `tests (ubuntu-latest, Python 3.14)`, `tests (windows-latest, Python 3.12)`, `tests (macos-latest, Python 3.12)`, `frontend (ubuntu-latest)`, `frontend (windows-latest)`, `frontend (macos-latest)`, and `analyze Python` (CodeQL). `dependency audit` and `review dependency changes` also run. They are not required checks.
- [ ] Completion report is filled in above and, when an issue exists, posted as a final comment on that issue
- [ ] Docs for this change are in this pull request
- [ ] Anything not merged is marked PREVIEW
- [ ] `docs/architecture.md` is updated when behavior, the API, the layout, or the run path changes
- [ ] `CLAUDE.md` and `AGENTS.md` are updated together when the run command or the layout summary changes
- [ ] `docs/github.md` is updated when a workflow, a release check, or a GitHub setting changes
- [ ] `PRIVACY.md` and the README are updated when sharing, local logs, or telemetry keys change
- [ ] `docs/wiki/` and the user guide (`docs/index.md`, `docs/guide/`) are updated when a DJ can see the change
- [ ] `_build_config.py` stays empty, and no DSN or PostHog project key is in the diff
- [ ] No `master.sqlite`, `root.sqlite`, or other Serato library file is in the diff
