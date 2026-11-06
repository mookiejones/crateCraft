/**
 * Rail groups: Library, Library health, Backups, and Before a gig.
 *
 * The markup is index.html. Group labels are headings. Each tab still
 * has a tooltip. The view ids stay crates, history, files, missing,
 * duplicates, stems, snapshots, and gig.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { applyStatic, setLocale } from "./i18n";
import { installPage } from "./test-page";
import { applyStaticTooltips } from "./tooltip";

describe("rail groups", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    applyStatic(document);
    applyStaticTooltips(document);
  });

  it("puts everyday views, health, backups, and the gig check in that order", () => {
    const labels = [...document.querySelectorAll(".view-group-label")].map((node) => node.textContent);
    expect(labels).toEqual(["Library", "Library health"]);
    const groups = [...document.querySelectorAll<HTMLElement>("#views [role='tablist']")].map((list) =>
      [...list.querySelectorAll<HTMLElement>("[data-view]")].map((button) => button.dataset.view),
    );
    expect(groups).toEqual([
      ["crates", "history", "files"],
      ["missing", "duplicates", "stems"],
      ["snapshots"],
      ["gig"],
    ]);
    expect(document.querySelector("[data-view='missing']")?.textContent).toBe("Missing files");
    expect(document.querySelector("[data-view='snapshots']")?.textContent).toBe("Backups");
    expect(document.querySelector("[data-view='gig']")?.textContent).toBe("Before a gig");
  });

  it("gives every view tab a tooltip, and says stems does not separate audio", () => {
    for (const button of document.querySelectorAll<HTMLButtonElement>("#views button")) {
      expect(button.dataset.tooltip?.trim().length, button.dataset.view).toBeGreaterThan(10);
    }
    const stems = document.querySelector<HTMLElement>("[data-view='stems']");
    const backups = document.querySelector<HTMLElement>("[data-view='snapshots']");
    expect(stems?.dataset.tooltip).toContain("does not separate");
    expect(backups?.dataset.tooltip).toContain("Ctrl/Cmd+5");
  });

  it("translates the group labels and the renamed tabs", () => {
    setLocale("es");
    applyStatic(document);
    const labels = [...document.querySelectorAll(".view-group-label")].map((node) => node.textContent);
    expect(labels).toEqual(["Biblioteca", "Salud de la biblioteca"]);
    expect(document.querySelector("[data-view='missing']")?.textContent).toBe("Archivos no encontrados");
    expect(document.querySelector("[data-view='snapshots']")?.textContent).toBe("Copias de seguridad");
    expect(document.querySelector("[data-view='gig']")?.textContent).toBe("Antes del bolo");
  });
});
