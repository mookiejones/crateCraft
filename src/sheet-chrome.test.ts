/**
 * Sheet heading names the view. Crate-scoped reports show a scope chip.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { applyStatic, setLocale } from "./i18n";
import {
  isCrateScopedMode,
  paintSheetChrome,
  sheetScopeCrate,
  sheetScopeText,
  sheetTitle,
} from "./sheet-chrome";
import { installPage } from "./test-page";

const crates = [
  { id: 1, name: "Friday" },
  { id: 2, name: "Warmup" },
];

describe("sheet chrome", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    applyStatic(document);
  });

  it("names the view and the space", () => {
    expect(sheetTitle("missing", "Serato Library")).toBe("Missing files · Serato Library");
    expect(sheetTitle("health", "Serato Library")).toBe("Overview · Serato Library");
    expect(sheetTitle("gig", "Serato Library")).toBe("Ready · Serato Library");
    expect(sheetTitle("files", "")).toBe("Organize files");
  });

  it("scopes Overview, Ready, Tempo drift, Damaged files, and Suspect quality", () => {
    expect(isCrateScopedMode("health")).toBe(true);
    expect(isCrateScopedMode("gig")).toBe(true);
    expect(isCrateScopedMode("drift")).toBe(true);
    expect(isCrateScopedMode("scan")).toBe(true);
    expect(isCrateScopedMode("bitrate")).toBe(true);
    expect(isCrateScopedMode("crates")).toBe(false);
    expect(isCrateScopedMode("missing")).toBe(false);
    expect(isCrateScopedMode("tags")).toBe(false);
    expect(isCrateScopedMode("files")).toBe(false);
  });

  it("labels the chip All tracks or the crate name", () => {
    expect(sheetScopeCrate("all", crates)).toBe("All tracks");
    expect(sheetScopeCrate(1, crates)).toBe("Friday");
    expect(sheetScopeCrate(99, crates)).toBe("All tracks");
    expect(sheetScopeText("All tracks")).toBe("Scope: All tracks");
    expect(sheetScopeText("Friday")).toBe("Scope: Friday");
  });

  it("paints the heading on Crates and hides the chip", () => {
    paintSheetChrome({ mode: "crates", space: "Serato Library", activeCrate: "all", crates });
    expect(document.getElementById("sheet-title")?.textContent).toBe("Crates · Serato Library");
    expect(document.getElementById("sheet-scope")?.hidden).toBe(true);
  });

  it("shows Scope: All tracks on Overview with no All tracks button", () => {
    paintSheetChrome({ mode: "health", space: "Serato Library", activeCrate: "all", crates });
    expect(document.getElementById("sheet-title")?.textContent).toBe("Overview · Serato Library");
    expect(document.getElementById("sheet-scope")?.hidden).toBe(false);
    expect(document.getElementById("sheet-scope-text")?.textContent).toBe("Scope: All tracks");
    expect(document.getElementById("sheet-scope-all")?.hidden).toBe(true);
  });

  it("shows the crate and All tracks when a crate filters Ready", () => {
    paintSheetChrome({ mode: "gig", space: "Serato Library", activeCrate: 1, crates });
    expect(document.getElementById("sheet-title")?.textContent).toBe("Ready · Serato Library");
    expect(document.getElementById("sheet-scope-text")?.textContent).toBe("Scope: Friday");
    expect(document.getElementById("sheet-scope-all")?.hidden).toBe(false);
    expect(document.getElementById("sheet-scope-all")?.textContent).toBe("All tracks");
  });

  it("translates the heading and chip", () => {
    setLocale("es");
    applyStatic(document);
    paintSheetChrome({ mode: "missing", space: "Serato Library", activeCrate: 1, crates });
    expect(document.getElementById("sheet-title")?.textContent).toBe("Archivos no encontrados · Serato Library");
    paintSheetChrome({ mode: "health", space: "Serato Library", activeCrate: 1, crates });
    expect(document.getElementById("sheet-scope-text")?.textContent).toBe("Alcance: Friday");
    expect(document.getElementById("sheet-scope-all")?.textContent).toBe("Todas las pistas");
  });
});
