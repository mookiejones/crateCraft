# src/ layout

Page source lives in layer folders. Do not add files to the `src/` root.

- Screen or dialog host → `src/pages/`
- Presentational piece → `src/components/`
- Domain Context + hook → `src/containers/`
- Engine or pure helper → `src/lib/` (or `src/lib/<domain>/` when a cluster already exists)
- Vitest file → `src/tests/` (mirror `pages/`, `components/`, `containers/` for those tests)
- Storybook story → next to the component as `*.stories.tsx` in `src/components/` or `src/pages/`
- New wrapper in `src/app/providers.tsx` when adding a container

Entries that stay at root: `app.ts`, `wizard-view.ts`, `html-raw.d.ts`, `CLAUDE.md`.

`src/tests/layout.test.ts` fails if the root grows, if a test sits outside `src/tests/`, or if a `*Context.tsx` sits outside `src/containers/`. Tree map: `src/CLAUDE.md`.
