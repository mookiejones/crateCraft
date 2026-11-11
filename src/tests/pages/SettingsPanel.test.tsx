/**
 * Settings paints from one React context.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../app/providers";
import { el } from "../../lib/dom";
import { setLocale, t } from "../../lib/i18n";
import {
  applyLanguage,
  mountSettings,
  patchSettings,
  resetSettingsForTests,
  saveLanguage,
} from "../../lib/ui/settings";
import { SHORTCUTS } from "../../lib/ui/shortcuts";
import { installPage } from "../test-page";
import { SettingsPanel } from "../../pages/SettingsPanel";

describe("SettingsPanel context", () => {
  beforeEach(() => {
    resetSettingsForTests();
    installPage();
    setLocale("en");
  });

  afterEach(() => {
    resetSettingsForTests();
    setLocale("en");
    vi.unstubAllGlobals();
  });

  it("renders Settings from context, including the cheat sheet", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(SettingsPanel) }));
    });
    expect(host.querySelector("[data-settings-react]")).not.toBeNull();
    expect(host.querySelector("#settings-title")?.textContent).toBe(t("settings.title"));
    expect(host.querySelector("#language-select")).not.toBeNull();
    expect(host.querySelector("#colorway-select")).not.toBeNull();
    expect(host.querySelector("#telemetry-toggle")).not.toBeNull();
    expect(host.querySelector("#about-title")?.textContent).toBe(t("settings.about"));
    const sheet = host.querySelector("#shortcuts-body")?.textContent ?? "";
    for (const shortcut of SHORTCUTS) {
      expect(sheet).toContain(shortcut.label);
    }
    expect(host.querySelector("#language-select")?.getAttribute("data-tooltip-key")).toBe("tooltip.language");
    expect(host.querySelector("#colorway-select")?.getAttribute("data-tooltip-key")).toBe("tooltip.colorway");
    expect(host.querySelector("#telemetry-toggle")?.getAttribute("data-tooltip-key")).toBe("tooltip.telemetry");
    root.unmount();
  });

  it("applies a saved language through the shared snapshot", () => {
    mountSettings();
    applyLanguage({ language: "es" });
    expect(document.documentElement.lang).toBe("es");
    expect(el("language-select").value).toBe("es");
    expect(el("settings-title").textContent).toBe("Ajustes");
    expect(el("shortcuts-title").textContent).toBe("Atajos de teclado");
  });

  it("saves the picker choice from the island", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ language: "es" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mountSettings();
    el("language-select").value = "es";
    el("language-select").dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      body: JSON.stringify({ language: "es" }),
    }));
    expect(document.documentElement.lang).toBe("es");
  });

  it("keeps the new language when saveLanguage fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "x" }), { status: 500 })));
    mountSettings();
    await saveLanguage("es");
    expect(document.documentElement.lang).toBe("es");
    expect(el("language-status").textContent).toBe(t("settings.languageNotSaved"));
  });

  it("paints About from the snapshot", () => {
    mountSettings();
    patchSettings({ aboutVersion: "v1.4.2" });
    expect(el("about-version").textContent).toBe("v1.4.2");
  });
});
