/**
 * Rail primaries: Music, Organize files, Health, Backups, and Gig.
 * Children live in #view-children.
 *
 * The markup is index.html. Each tab still has a tooltip. The view ids
 * stay crates, history, stats, files, health, missing, duplicates, stems,
 * scan, bitrate, tags, snapshots, gig, portable, and drift.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { applyStatic, setLocale } from "../lib/i18n";
import { installPage } from "./test-page";
import { applyStaticTooltips } from "../lib/ui/tooltip";

describe("rail groups", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    applyStatic(document);
    applyStaticTooltips(document);
  });

  it("puts five primaries in the rail, with children in the sheet strip", () => {
    const primaries = [...document.querySelectorAll<HTMLElement>("#views [data-nav]")].map((button) => button.dataset.nav);
    expect(primaries).toEqual(["library", "files", "health", "backups", "gig"]);
    expect(document.querySelector("h1")?.textContent).toBe("crateCraft");
    expect(document.querySelector('#space option[value="Serato Library"]')?.textContent).toBe("Library");
    expect([...document.querySelectorAll("#views [data-nav]")].map((node) => node.textContent)).toEqual([
      "Music",
      "Organize files",
      "Health",
      "Backups",
      "Gig",
    ]);
    const children = [...document.querySelectorAll<HTMLElement>("#view-children [data-view]")].map(
      (button) => button.dataset.view,
    );
    expect(children).toEqual([
      "crates",
      "history",
      "stats",
      "files",
      "health",
      "missing",
      "duplicates",
      "stems",
      "scan",
      "bitrate",
      "tags",
      "snapshots",
      "gig",
      "portable",
      "drift",
    ]);
    expect(document.querySelector("[data-view='stats']")?.textContent).toBe("Play stats");
    expect(document.querySelector("[data-view='health']")?.textContent).toBe("Overview");
    expect(document.querySelector("[data-view='missing']")?.textContent).toBe("Missing files");
    expect(document.querySelector("[data-view='scan']")?.textContent).toBe("Damaged files");
    expect(document.querySelector("[data-view='bitrate']")?.textContent).toBe("Suspect quality");
    expect(document.querySelector("[data-view='tags']")?.textContent).toBe("Tag spellings");
    expect(document.querySelector("[data-view='snapshots']")?.textContent).toBe("Backups");
    expect(document.querySelector("[data-view='gig']")?.textContent).toBe("Ready");
    expect(document.querySelector("[data-view='portable']")?.textContent).toBe("Check drive");
    expect(document.querySelector("[data-view='drift']")?.textContent).toBe("Tempo drift");
  });

  it("gives every primary and view tab a tooltip, and says stems does not separate audio", () => {
    for (const button of document.querySelectorAll<HTMLButtonElement>("#views [data-nav], #view-children [data-view]")) {
      expect(button.dataset.tooltip?.trim().length, button.dataset.nav ?? button.dataset.view).toBeGreaterThan(10);
    }
    const stems = document.querySelector<HTMLElement>("[data-view='stems']");
    const backups = document.querySelector<HTMLElement>("[data-view='snapshots']");
    expect(stems?.dataset.tooltip).toContain("does not separate");
    expect(backups?.dataset.tooltip).toContain("Ctrl/Cmd+5");
  });

  it("translates the primaries and the renamed tabs", () => {
    setLocale("es");
    applyStatic(document);
    expect([...document.querySelectorAll("#views [data-nav]")].map((node) => node.textContent)).toEqual([
      "Música",
      "Organizar archivos",
      "Salud",
      "Copias de seguridad",
      "Bolo",
    ]);
    expect(document.querySelector("[data-view='stats']")?.textContent).toBe("Estadísticas");
    expect(document.querySelector("[data-view='health']")?.textContent).toBe("Resumen");
    expect(document.querySelector("[data-view='missing']")?.textContent).toBe("Archivos no encontrados");
    expect(document.querySelector("[data-view='scan']")?.textContent).toBe("Archivos dañados");
    expect(document.querySelector("[data-view='bitrate']")?.textContent).toBe("Calidad dudosa");
    expect(document.querySelector("[data-view='tags']")?.textContent).toBe("Grafías de etiquetas");
    expect(document.querySelector("[data-view='snapshots']")?.textContent).toBe("Copias de seguridad");
    expect(document.querySelector("[data-view='gig']")?.textContent).toBe("Listo");
    expect(document.querySelector("[data-view='portable']")?.textContent).toBe("Comprobar unidad");
    expect(document.querySelector("[data-view='drift']")?.textContent).toBe("Tempo inestable");
  });
});
