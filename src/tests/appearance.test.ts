import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyAppearance,
  loadPrivacy,
  saveColorway,
  saveIconFollow,
  wireDialogs,
} from "../lib/ui/dialogs";
import { el } from "../lib/dom";
import { setLocale, t } from "../lib/i18n";
import { state } from "../lib/state";
import { installPage } from "./test-page";
import { applyStaticTooltips, refreshTooltips } from "../lib/ui/tooltip";

function settingsResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    json: async () => body,
  } as Response;
}

function iconLink(): HTMLLinkElement {
  const existing = document.getElementById("app-icon");
  if (existing instanceof HTMLLinkElement) return existing;
  const link = document.createElement("link");
  link.id = "app-icon";
  link.rel = "icon";
  document.head.append(link);
  return link;
}

describe("theme icon", () => {
  beforeEach(() => {
    installPage();
    iconLink();
    state.wizardComplete = true;
    document.documentElement.lang = "en";
    setLocale("en");
    applyStaticTooltips(document);
  });

  afterEach(() => {
    setLocale("en");
    vi.unstubAllGlobals();
  });

  it("starts with the icon following Serato-like", () => {
    expect(el("icon-follows-theme").checked).toBe(true);
    expect(el("colorway-select").value).toBe("serato-like");
    expect(el("colorway-preview").getAttribute("src")).toBe("/img/icons/placeholder-serato-like.svg");
    expect(el("icon-follows-theme").dataset.tooltip).toBe(t("tooltip.iconFollowsTheme"));
    expect(el("colorway-select").dataset.tooltip).toBe(t("tooltip.colorway"));
    expect(el("icon-follows-theme").dataset.tooltip).not.toBe(el("icon-follows-theme").getAttribute("aria-label"));
  });

  it("paints a saved colorway and keeps the preview when the running icon stays put", () => {
    applyAppearance({
      colorway: "dark-club",
      icon_follows_theme: false,
      icon_href: "/img/icons/default.svg",
    });
    expect(el("colorway-select").value).toBe("dark-club");
    expect(el("icon-follows-theme").checked).toBe(false);
    expect(document.documentElement.dataset.colorway).toBe("dark-club");
    expect(el("colorway-preview").getAttribute("src")).toBe("/img/icons/placeholder-dark-club.svg");
    expect(iconLink().getAttribute("href")).toBe("/img/icons/default.svg");
  });

  it("ignores a payload that is not about the theme", () => {
    el("colorway-select").value = "light";
    applyAppearance({ telemetry_consent: false });
    expect(el("colorway-select").value).toBe("light");
  });

  it("replaces an unknown colorway with Serato-like", () => {
    applyAppearance({ colorway: "house" });
    expect(el("colorway-select").value).toBe("serato-like");
    expect(document.documentElement.dataset.colorway).toBe("serato-like");
  });

  it("maps a saved Motown, Deep House, or Daisy Age id to Classic", () => {
    applyAppearance({ colorway: "motown" });
    expect(el("colorway-select").value).toBe("classic");
    expect(document.documentElement.dataset.colorway).toBe("classic");
    applyAppearance({ colorway: "deep-house" });
    expect(el("colorway-select").value).toBe("classic");
    applyAppearance({ colorway: "daisy-age" });
    expect(el("colorway-select").value).toBe("classic");
  });

  it("posts the theme and says when this computer cannot change the icon", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => settingsResponse({
      colorway: "light",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-light.svg",
      icon: {
        applied: false,
        platform: "linux",
        target: "unsupported",
        reason: "unsupported",
        colorway: "light",
        follows_theme: true,
        href: "/img/icons/placeholder-light.svg",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);
    el("colorway-select").value = "light";
    await saveColorway();
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      body: JSON.stringify({ colorway: "light" }),
    }));
    expect(document.documentElement.dataset.colorway).toBe("light");
    expect(el("icon-status").textContent).toBe(t("settings.iconUnsupported"));
    expect(iconLink().getAttribute("href")).toBe("/img/icons/placeholder-light.svg");
  });

  it("names the Dock and the taskbar when the running icon changes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => settingsResponse({
      colorway: "serato-like",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-serato-like.svg",
      icon: {
        applied: true,
        platform: "darwin",
        target: "dock",
        reason: "ok",
        colorway: "serato-like",
        follows_theme: true,
        href: "/img/icons/placeholder-serato-like.svg",
      },
    })));
    await saveColorway();
    expect(el("icon-status").textContent).toBe(t("settings.iconAppliedDock"));

    vi.stubGlobal("fetch", vi.fn(async () => settingsResponse({
      colorway: "serato-like",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-serato-like.svg",
      icon: {
        applied: true,
        platform: "win32",
        target: "window",
        reason: "ok",
        colorway: "serato-like",
        follows_theme: true,
        href: "/img/icons/placeholder-serato-like.svg",
      },
    })));
    await saveColorway();
    expect(el("icon-status").textContent).toBe(t("settings.iconAppliedWindow"));
  });

  it("posts false and keeps the usual icon", async () => {
    const fetchMock = vi.fn(async () => settingsResponse({
      colorway: "serato-like",
      icon_follows_theme: false,
      icon_href: "/img/icons/default.svg",
      icon: {
        applied: true,
        platform: "darwin",
        target: "dock",
        reason: "ok",
        colorway: "serato-like",
        follows_theme: false,
        href: "/img/icons/default.svg",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);
    el("icon-follows-theme").checked = false;
    await saveIconFollow();
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      body: JSON.stringify({ icon_follows_theme: false }),
    }));
    expect(el("icon-status").textContent).toBe(t("settings.iconDefault"));
    expect(iconLink().getAttribute("href")).toBe("/img/icons/default.svg");
    expect(el("colorway-preview").getAttribute("src")).toContain("placeholder-serato-like.svg");
  });

  it("keeps the new theme for this session when the save fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    el("colorway-select").value = "dark-club";
    await saveColorway();
    expect(el("colorway-select").value).toBe("dark-club");
    expect(document.documentElement.dataset.colorway).toBe("dark-club");
    expect(el("icon-status").textContent).toBe(t("settings.iconNotSaved"));
  });

  it("loads the saved choice with the rest of settings", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => settingsResponse({
      telemetry_consent: false,
      needs_consent_prompt: false,
      wizard_complete: true,
      colorway: "light",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-light.svg",
    })));
    await loadPrivacy();
    expect(el("colorway-select").value).toBe("light");
    expect(el("icon-follows-theme").checked).toBe(true);
    expect(document.documentElement.dataset.colorway).toBe("light");
  });

  it("posts from the controls", async () => {
    const fetchMock = vi.fn(async () => settingsResponse({
      colorway: "dark-club",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-dark-club.svg",
      icon: {
        applied: false,
        platform: "linux",
        target: "unsupported",
        reason: "no-window",
        colorway: "dark-club",
        follows_theme: true,
        href: "/img/icons/placeholder-dark-club.svg",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);
    wireDialogs();
    el("colorway-select").value = "dark-club";
    el("colorway-select").dispatchEvent(new Event("change"));
    await vi.waitFor(() => {
      expect(el("icon-status").textContent).toBe(t("settings.iconUnsupported"));
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      body: JSON.stringify({ colorway: "dark-club" }),
    }));
  });

  it("translates the tooltips", () => {
    setLocale("es");
    refreshTooltips();
    expect(el("colorway-select").dataset.tooltip).toBe(t("tooltip.colorway"));
    expect(el("icon-follows-theme").dataset.tooltip).toBe(t("tooltip.iconFollowsTheme"));
    expect(el("icon-follows-theme").dataset.tooltip).not.toContain("Dock icon on Mac");
    expect(el("colorway-select").querySelector('[value="serato-like"]')?.textContent).toBeTruthy();
  });
});
