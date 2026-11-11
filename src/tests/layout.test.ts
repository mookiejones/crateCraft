/**
 * Fail when a new file lands outside the src layer folders.
 *
 * A new engine goes in lib/. A new screen goes in pages/. A colocated
 * test or a file at src root turns this red.
 */

import { describe, expect, it } from "vitest";

const SRC_FILES = import.meta.glob("../../src/**/*.{ts,tsx,md}", {
  query: "?raw",
  import: "default",
  eager: true,
});

const ROOT_ALLOW = [
  "CLAUDE.md",
  "app",
  "app.ts",
  "components",
  "containers",
  "html-raw.d.ts",
  "lib",
  "pages",
  "tests",
  "wizard-view.ts",
];

function rel(key: string): string {
  const norm = key.replaceAll("\\", "/");
  const marker = "/src/";
  const at = norm.lastIndexOf(marker);
  if (at !== -1) return norm.slice(at + marker.length);
  if (norm.startsWith("./")) return `tests/${norm.slice(2)}`;
  if (norm.startsWith("../")) return norm.replace(/^(?:\.\.\/)+/, "");
  return norm;
}

describe("src layout", () => {
  it("keeps only entries and layer folders at src root", () => {
    const names = [
      ...new Set(Object.keys(SRC_FILES).map((key) => rel(key).split("/")[0] ?? key)),
    ].sort();
    expect(names).toEqual(ROOT_ALLOW);
  });

  it("keeps Vitest files under src/tests", () => {
    const stray = Object.keys(SRC_FILES)
      .map(rel)
      .filter(
        (path) =>
          (path.endsWith(".test.ts") || path.endsWith(".test.tsx")) &&
          !path.startsWith("tests/"),
      );
    expect(stray).toEqual([]);
  });

  it("keeps Context modules under src/containers", () => {
    const stray = Object.keys(SRC_FILES)
      .map(rel)
      .filter((path) => path.endsWith("Context.tsx") && !path.startsWith("containers/"));
    expect(stray).toEqual([]);
  });

  it("colocates Storybook stories next to components, containers, or pages", () => {
    const stray = Object.keys(SRC_FILES)
      .map(rel)
      .filter((path) => /\.stories\.(ts|tsx)$/.test(path) || path.endsWith(".mdx"))
      .filter(
        (path) =>
          !path.startsWith("components/") &&
          !path.startsWith("pages/") &&
          !path.startsWith("containers/"),
      );
    expect(stray).toEqual([]);
  });

  it("gives every component, container, and page a sibling story", () => {
    const paths = Object.keys(SRC_FILES).map(rel);
    const layers = ["components/", "containers/", "pages/"];
    const missing = paths.filter((path) => {
      if (!path.endsWith(".tsx") || path.endsWith(".stories.tsx")) return false;
      if (!layers.some((layer) => path.startsWith(layer))) return false;
      return !paths.includes(path.replace(/\.tsx$/, ".stories.tsx"));
    });
    expect(missing).toEqual([]);
  });
});
