---
name: updating-user-docs
description: Use when a DJ-visible feature or copy changes, or when editing README, docs/wiki, the GitHub wiki, Quick Start, the MkDocs guide, or _Sidebar.md. Use when the user says update the wiki, keep the README current, or runs /updating-user-docs.
---

# Updating user docs

DJ-facing copy ships in the same PR as the behavior. **REQUIRED SIBLING:** `shipping-across-surfaces`.

Skip this skill for agent-only `AGENTS.md` / `CLAUDE.md` run-path edits and for architecture-only API notes.

## Inventory

| Surface | Role |
|---|---|
| `docs/wiki/*.md`, `_Sidebar.md`, `docs/wiki/images/` | GitHub wiki draft |
| `docs/quick-start.md`, `docs/first-install.md`, `docs/guide/`, `docs/index.md` | Pages guide |
| `README.md` | Thin pointer: Quick Start link first, GIF, install, existing Features bullets |
| `PRIVACY.md` | Sharing, local logs, telemetry keys |
| wiki.git | Published copy. This repo never pushes it |

Do not list wiki pages here. `_Sidebar.md` and `tests/test_wiki_features.py` own the page set.

## Walk

1. Grep the old user-facing string in `docs/wiki/`, `docs/guide/`, `docs/quick-start.md`, `docs/first-install.md`, `README.md`, and `PRIVACY.md`. Edit every hit in this PR.
2. New DJ-facing feature: wiki page, `_Sidebar.md` link, and a Pages guide page when that section exists. Feature pages follow `tests/test_wiki_features.py` (picture, `Example data.`, mermaid).
3. README: keep `[Quick Start](docs/wiki/Quick-Start.md)` above Install. Change a Features bullet only when that class of thing is already on the landing page. Do not paste a wiki page into README.

## Markup

- Wiki links have no `.md`: `](Quick-Start)`. README and guide links keep the repo path with `.md`.
- Wiki Home and Quick Start: light PNG plus five-move GIF. No `<picture>`. Guide Quick Start: `<picture>` for light and dark.
- Restore wording is the sentence pinned in `tests/test_wiki_docs.py`.

## Prove

```bash
python3 -m unittest tests.test_wiki_docs tests.test_wiki_features tests.test_guide_pages -v
```

Guide nav or mkdocs pages changed: `mkdocs build --strict -f docs/mkdocs.yml`.

## Live wiki

Stop. Do not clone or push `github.com/mookiejones/serato-library-manager.wiki.git` unless the user said publish or update the live wiki.

When they did, ask, then as `mookiejones` copy `docs/wiki/` markdown, `images/`, and `_Sidebar.md` onto wiki `master`, overwrite stub Home, and push.
