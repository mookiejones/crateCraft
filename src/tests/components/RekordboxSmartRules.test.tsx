import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { RekordboxSmartRules } from "../../components/RekordboxSmartRules";
import { setLocale } from "../../lib/i18n";
import type { SmartCrateRow } from "../../lib/ui/rekordbox-smart";
import { frozenParam, nextFrozenChoice, readSmartCrates } from "../../lib/ui/rekordbox-smart";

const crates: SmartCrateRow[] = [
  {
    id: 7,
    name: "Chinese Pop",
    frozen: true,
    storedCount: 2,
    writtenCount: 1,
    mismatch: true,
    status: "rules",
    rules: [
      { label: "genre is", classification: "exact" },
      { label: "location contains", classification: "impossible" },
    ],
  },
];

describe("RekordboxSmartRules", () => {
  let root: Root | null = null;

  afterEach(() => {
    root?.unmount();
    root = null;
    setLocale("en");
  });

  it("names the crate on the freeze box and shows Exact and Impossible in Spanish", () => {
    setLocale("es");
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    flushSync(() => {
      root?.render(createElement(RekordboxSmartRules, { crates, onFreeze: () => undefined }));
    });
    const box = host.querySelector("#rekordbox-freeze-7");
    expect(box).toBeInstanceOf(HTMLInputElement);
    expect(box?.getAttribute("data-tooltip-key")).toBe("tooltip.rekordboxSmartFreeze");
    expect(host.textContent).toContain("Congelar las pistas de hoy de Chinese Pop");
    expect(host.textContent).toContain("genre is — Exacta");
    expect(host.textContent).toContain("location contains — Imposible");
    expect(host.textContent).toContain("Esta comparación no ejecutó Rekordbox.");
  });
});

describe("rekordbox smart query", () => {
  it("omits frozen until a box changes, then sends none or ids", () => {
    expect(frozenParam(null)).toBe("");
    expect(frozenParam(new Set())).toBe("&frozen=none");
    expect(frozenParam(new Set([4, 2]))).toBe("&frozen=2,4");
    const cleared = nextFrozenChoice(null, crates, 7, false);
    expect([...cleared]).toEqual([]);
    const kept = nextFrozenChoice(new Set([7, 8]), crates, 7, false);
    expect([...kept]).toEqual([8]);
  });

  it("drops a row whose class is not exact, approximate, or impossible", () => {
    const rows = readSmartCrates({
      smart_crates: [
        {
          id: 3,
          name: "House",
          frozen: false,
          stored_count: 1,
          written_count: 1,
          mismatch: false,
          status: "rules",
          rules: [
            { label: "genre is", classification: "exact" },
            { label: "genre is", classification: "compatible" },
          ],
        },
        { id: "nope", name: "Bad" },
      ],
    });
    expect(rows).toEqual([
      {
        id: 3,
        name: "House",
        frozen: false,
        storedCount: 1,
        writtenCount: 1,
        mismatch: false,
        status: "rules",
        rules: [{ label: "genre is", classification: "exact" }],
      },
    ]);
  });
});
