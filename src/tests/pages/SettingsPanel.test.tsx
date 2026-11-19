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
  closeSettings,
  mountSettings,
  openSettings,
  patchSettings,
  resetSettingsForTests,
  saveLanguage,
} from "../../lib/ui/settings";
import { SHORTCUTS, wireShortcuts } from "../../lib/ui/shortcuts";
import { installPage } from "../test-page";
import { SettingsPanel } from "../../pages/SettingsPanel";

function shortcutRow(id: string): HTMLElement {
  const row = document.querySelector(`[data-shortcut-id="${id}"]`);
  expect(row, id).not.toBeNull();
  return row as HTMLElement;
}

function settingsBody(call: unknown): Record<string, unknown> | null {
  const init = (call as [unknown, RequestInit | undefined])[1];
  if (typeof init?.body !== "string") return null;
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

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
    expect(host.querySelector("[data-settings-page]")).not.toBeNull();
    expect(host.querySelector("#settings-title")?.textContent).toBe(t("settings.title"));
    expect(host.querySelector("#language-select")).not.toBeNull();
    expect(host.querySelector("#colorway-select")).not.toBeNull();
    expect(host.querySelector("#telemetry-toggle")).not.toBeNull();
    expect(host.querySelector("#gig-lock")).not.toBeNull();
    expect((host.querySelector("#gig-lock") as HTMLInputElement).checked).toBe(false);
    expect(host.querySelector("#min-copies")).not.toBeNull();
    expect((host.querySelector("#min-copies") as HTMLSelectElement).value).toBe("2");
    expect(host.querySelector("#min-copies")?.getAttribute("data-tooltip-key")).toBe("tooltip.minCopies");
    expect(host.querySelector("#untrusted-volumes")).not.toBeNull();
    expect(host.querySelector("#untrusted-volumes")?.getAttribute("data-tooltip-key")).toBe(
      "tooltip.untrustedVolumes",
    );
    expect(host.querySelector("#about-title")?.textContent).toBe(t("settings.about"));
    expect(host.querySelector("#library-stays")?.textContent).toBe(t("settings.libraryStays"));
    expect(host.querySelector("#library-stays")?.getAttribute("data-tooltip-key")).toBe(
      "tooltip.libraryStays",
    );
    expect(host.querySelector("#library-stays")?.getAttribute("tabindex")).toBe("0");
    const sheet = host.querySelector("#shortcuts-body")?.textContent ?? "";
    for (const shortcut of SHORTCUTS) {
      expect(sheet).toContain(shortcut.label);
    }
    expect(host.querySelector("#language-select")?.getAttribute("data-tooltip-key")).toBe("tooltip.language");
    expect(host.querySelector("#colorway-select")?.getAttribute("data-tooltip-key")).toBe("tooltip.colorway");
    expect(host.querySelector("#telemetry-toggle")?.getAttribute("data-tooltip-key")).toBe("tooltip.telemetry");
    const proof = host.querySelector("#mui-theme-proof");
    expect(proof).not.toBeNull();
    expect(proof?.getAttribute("data-colorway")).toBe("serato-like");
    expect(proof?.getAttribute("data-primary")).toBe("#ff6a00");
    expect(proof?.getAttribute("data-mode")).toBe("dark");
    root.unmount();
  });

  it("updates the MUI proof when the colorway changes", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(SettingsPanel) }));
    });
    flushSync(() => {
      patchSettings({ colorway: "dark-club" });
    });
    const proof = host.querySelector("#mui-theme-proof");
    expect(proof?.getAttribute("data-colorway")).toBe("dark-club");
    expect(proof?.getAttribute("data-primary")).toBe("#3df0c8");
    expect(proof?.getAttribute("data-mode")).toBe("dark");
    root.unmount();
  });

  it("applies a saved language through the shared snapshot", () => {
    mountSettings();
    applyLanguage({ language: "es" });
    expect(document.documentElement.lang).toBe("es");
    expect(el("language-select").value).toBe("es");
    expect(el("settings-title").textContent).toBe("Ajustes");
    expect(el("library-stays").textContent).toBe(t("settings.libraryStays"));
    expect(el("library-stays").getAttribute("data-tooltip-key")).toBe("tooltip.libraryStays");
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

  it("opens Settings as a Main page, not a modal overlay", () => {
    mountSettings();
    const dialog = el("settings-dialog");
    const showModal = vi.spyOn(dialog, "showModal");
    openSettings();
    expect(dialog.open).toBe(true);
    expect(showModal).not.toHaveBeenCalled();
    expect(el("open-settings").getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("app-body")?.contains(dialog)).toBe(true);
    closeSettings();
    expect(dialog.open).toBe(false);
    expect(el("open-settings").getAttribute("aria-expanded")).toBe("false");
    showModal.mockRestore();
  });

  it("saves sharing, colorway, and update switches from the island", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : String(input);
      const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : {};
      if (url === "/api/settings") {
        return new Response(JSON.stringify({
          telemetry_consent: body.telemetry_consent === true,
          telemetry_configured: true,
          colorway: body.colorway ?? "serato-like",
          icon_follows_theme: true,
        }), { status: 200 });
      }
      if (url === "/api/update") {
        return new Response(JSON.stringify({ enabled: body.enabled === true, prereleases: false }), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    mountSettings();
    el("telemetry-toggle").click();
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(fetchMock.mock.calls.some((call) => {
      const init = call[1] as RequestInit | undefined;
      return typeof init?.body === "string" && init.body.includes("telemetry_consent");
    })).toBe(true);
    el("colorway-select").value = "light";
    el("colorway-select").dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.some((call) => {
        const init = call[1] as RequestInit | undefined;
        return typeof init?.body === "string" && init.body.includes("colorway");
      })).toBe(true);
    });
  });

  it("lists a live Serato row and an unavailable row", () => {
    mountSettings();
    const live = shortcutRow("play-pause");
    expect(live.querySelector("[data-shortcut-change]")).not.toBeNull();
    expect(live.textContent).toMatch(/W/);
    const dead = shortcutRow("play-pause-right");
    expect(dead.querySelector("[data-shortcut-change]")).toBeNull();
    expect(dead.textContent).toContain("Not in crateCraft");
  });

  it("gives the shortcut catalog controls tooltips", () => {
    mountSettings();
    expect(el("shortcuts-filter").getAttribute("data-tooltip-key")).toBe("tooltip.shortcutsFilter");
    expect(el("shortcuts-reset-all").getAttribute("data-tooltip-key")).toBe("tooltip.shortcutsResetAll");
    const change = shortcutRow("play-pause").querySelector("[data-shortcut-change]");
    expect(change?.getAttribute("data-tooltip-key")).toBe("tooltip.shortcutsChange");
  });

  it("remaps play-pause from Change then q", async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({ shortcuts: { "play-pause": [{ key: "q" }] } }),
      { status: 200 },
    ));
    vi.stubGlobal("fetch", fetchMock);
    mountSettings();
    const change = shortcutRow("play-pause").querySelector("[data-shortcut-change]");
    expect(change).not.toBeNull();
    (change as HTMLElement).click();
    await vi.waitFor(() => {
      expect(shortcutRow("play-pause").textContent).toContain("Press a key");
    });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "q", bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      body: JSON.stringify({ shortcuts: { "play-pause": [{ key: "q" }] } }),
    }));
    expect(shortcutRow("play-pause").textContent).toMatch(/Q/);
  });

  it("refuses a chord another live action already owns", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mountSettings();
    const change = shortcutRow("play-pause").querySelector("[data-shortcut-change]");
    expect(change).not.toBeNull();
    (change as HTMLElement).click();
    await vi.waitFor(() => {
      expect(shortcutRow("play-pause").textContent).toContain("Press a key");
    });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(el("shortcuts-status").textContent).not.toBe("");
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(shortcutRow("play-pause").textContent).toMatch(/W/);
  });

  it("resets all shortcuts to Serato defaults", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ shortcuts: {} }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    mountSettings();
    el("shortcuts-reset-all").click();
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const bodies = fetchMock.mock.calls.map(settingsBody);
    expect(bodies.some((body) => body && JSON.stringify(body.shortcuts) === "{}")).toBe(true);
  });

  it("still focuses the shortcuts heading from ?", () => {
    mountSettings();
    wireShortcuts();
    if (el("settings-dialog").open) el("settings-dialog").close();
    document.body.focus();
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true, cancelable: true }));
    expect(el("settings-dialog").open).toBe(true);
    expect(document.activeElement).toBe(el("shortcuts-title"));
  });
});
