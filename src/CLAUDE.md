# Page source (`src/`)

TypeScript and TSX for the crateCraft page. Bundles: `npm run build` writes `static/app.js` and `static/wizard.js`. Tests: `npm test` (Vitest under `src/tests/`). Types: `npx tsc --noEmit`.

## Root

Four files plus six folders. Do not add another file here (`src/tests/layout.test.ts` fails).

```
src/
  app.ts              # esbuild entry: wires the screen
  wizard-view.ts      # esbuild entry: first-run IIFE
  html-raw.d.ts
  CLAUDE.md
  app/                # mountIsland, AppProviders, MUI ThemeProvider
  containers/         # one Context + hook per domain
  pages/              # rail screens and dialog hosts
  components/         # pieces a page or island mounts
  lib/                # engines and pure helpers
  tests/              # all Vitest files
```

## Where a new file goes

- Screen or dialog host → `pages/`
- Presentational piece → `components/`
- Domain bind (`*Context.tsx`, `useX`) → `containers/`, plus one wrapper in `app/providers.tsx`
- Engine or helper → `lib/` or `lib/<domain>/`
- Vitest → `tests/` (mirror `pages/`, `components/`, `containers/` for those tests)
- Storybook story → `*.stories.tsx` next to the component in `components/` or `pages/` (`npm run storybook`)

Repo-root `tests/` is Python. `e2e/` is Playwright. No `@/` import alias.

See `.grok/rules/src-layout.md`.
