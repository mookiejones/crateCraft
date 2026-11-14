/**
 * Hash writes do not animate, and reduced-motion CSS kills transitions.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { writeHash } from "../../../lib/ui/hash-route";
import { HASH_SCROLL, prefersReducedMotion } from "../../../lib/ui/motion";

const appCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../../static/app.css"),
  "utf8",
);

describe("hash motion", () => {
  it("never uses smooth scroll", () => {
    expect(HASH_SCROLL).toBe("auto");
  });

  it("does not call scrollIntoView when the hash changes", () => {
    if (typeof Element.prototype.scrollIntoView !== "function") {
      Element.prototype.scrollIntoView = function scrollIntoView() {};
    }
    const spy = vi.spyOn(Element.prototype, "scrollIntoView");
    writeHash("#library/stems", false);
    expect(location.hash).toBe("#library/stems");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("reads prefers-reduced-motion from matchMedia", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion") && query.includes("reduce"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    expect(prefersReducedMotion()).toBe(true);
    vi.unstubAllGlobals();
  });

  it("kills animation and hash scroll when reduced motion is on", () => {
    expect(appCss).toMatch(/scroll-behavior:\s*auto/);
    expect(appCss).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(appCss).toMatch(/animation-duration:\s*0\.01ms/);
    expect(appCss).toMatch(/transition-duration:\s*0\.01ms/);
  });
});
