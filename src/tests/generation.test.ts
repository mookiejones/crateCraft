/**
 * The library-generation button: Serato 4, Serato 5, or unknown.
 *
 * The sentences come from t(). The tooltip is not the accessible name.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { applyStatus, paintGeneration } from "../lib/ui/views";
import { t, setLocale } from "../lib/i18n";
import { installPage } from "./test-page";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { tipText, tips } from "../lib/ui/tooltip-strings";
import type { LibraryGeneration } from "../lib/api-types";

function generation(over: Partial<LibraryGeneration>): LibraryGeneration {
  return {
    kind: "serato4",
    source: "log",
    version: "4.1.0",
    build: "4.1.0.1",
    newest_version: "4.1.0",
    database: "master.sqlite",
    log_name: "20261001_101530.log",
    mounted: null,
    downgrade: false,
    confirmed: true,
    reason: "log",
    install_version: "4.1.0",
    ...over,
  };
}

function button(): HTMLButtonElement {
  const node = document.getElementById("library-generation");
  if (!(node instanceof HTMLButtonElement)) throw new Error("missing generation button");
  return node;
}

describe("library generation", () => {
  beforeEach(() => {
    installPage();
    applyStaticTooltips();
    setLocale("en");
  });

  it("names Serato 4 from the log and does not repeat the tooltip", () => {
    applyStatus({
      writable: true,
      message: "Serato is quit. Edits save to the library.",
      generation: generation({}),
    });
    const control = button();
    expect(control.textContent).toBe(t("generation.serato4"));
    expect(control.getAttribute("aria-label")).toBe(t("generation.named", { kind: t("generation.serato4") }));
    expect(control.dataset.tooltip).toBe(tipText(tips.libraryGeneration));
    expect(control.dataset.tooltip).not.toBe(control.getAttribute("aria-label"));
    expect(control.dataset.tooltip).not.toBe(control.textContent);
    expect(document.getElementById("library-generation-note")?.hidden).toBe(true);

    control.click();
    const note = document.getElementById("library-generation-note");
    expect(note?.hidden).toBe(false);
    expect(note?.textContent).toBe(t("generation.reason.log", {
      log: "20261001_101530.log",
      version: "4.1.0",
      newest: "4.1.0",
      database: "master.sqlite",
    }));
  });

  it("translates an unknown log and a Serato 5 downgrade", () => {
    applyStatus({
      writable: false,
      message: "Serato version is unknown (build unknown).",
      code: "serato_version_unknown",
      params: { build: "unknown" },
      generation: generation({
        kind: "unknown",
        source: "log",
        version: "unknown",
        build: "unknown",
        newest_version: "",
        database: "",
        reason: "unknown",
        confirmed: null,
      }),
    });
    expect(button().textContent).toBe(t("generation.unknown"));
    expect(document.getElementById("status")?.textContent).toContain("build unknown");

    setLocale("es");
    paintGeneration({
      generation: generation({
        kind: "serato5",
        version: "5.0.0",
        newest_version: "4.1.0",
        reason: "downgrade",
        downgrade: true,
      }),
    });
    expect(button().textContent).toBe(t("generation.serato5"));
    expect(button().getAttribute("aria-label")).toBe(t("generation.named", { kind: "Serato 5" }));
    expect(button().dataset.tooltip).toBe(t("tooltip.libraryGeneration"));
    expect(button().dataset.tooltip).not.toBe(button().getAttribute("aria-label"));
    button().click();
    expect(document.getElementById("library-generation-note")?.textContent).toContain("5.0.0");
    expect(document.getElementById("library-generation-note")?.textContent).toContain("4.1.0");
    expect(document.getElementById("library-generation-note")?.textContent).not.toContain("Writes and restores");
  });

  it("keeps an unknown install read-only in the active language", () => {
    applyStatus({
      writable: false,
      code: "serato_version_unknown",
      params: { build: "unknown" },
      message: "Serato version is unknown (build unknown).",
      generation: generation({
        kind: "unknown",
        version: "unknown",
        build: "unknown",
        newest_version: "4.0.1",
        reason: "installUnknown",
        confirmed: true,
      }),
    });
    expect(button().textContent).toBe(t("generation.unknown"));
    button().click();
    expect(document.getElementById("library-generation-note")?.textContent).toBe(
      t("generation.reason.installUnknown"),
    );
    expect(button().dataset.tooltip).not.toBe(button().getAttribute("aria-label"));
  });

  it("hides #status while checking or writable and shows the lock sentence when Serato is open", () => {
    expect(document.getElementById("status")?.hidden).toBe(true);
    applyStatus({
      writable: true,
      message: "Serato is quit. Edits save to the library.",
      generation: generation({}),
    });
    expect(document.getElementById("status")?.hidden).toBe(true);
    expect(button().textContent).toBe(t("generation.serato4"));
    applyStatus({
      writable: false,
      message: "Serato is open. Changes are paused.",
      generation: generation({}),
    });
    expect(document.getElementById("status")?.hidden).toBe(false);
    expect(document.getElementById("status")?.textContent).toBe("Serato is open. Changes are paused.");
    expect(button().textContent).toBe(t("generation.serato4"));
  });
});
