import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyAppearance,
  loadPrivacy,
  saveColorway,
  saveIconFollow,
  wireDialogs,
} from "./dialogs";
import { el } from "./dom";
import { setLocale, t } from "./i18n";
import { state } from "./state";
import { installPage } from "./test-page";
import { applyStaticTooltips, refreshTooltips } from "./tooltip";

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

  it("starts with the icon following Motown Soul", () => {
    expect(el("icon-follows-theme").checked).toBe(true);
    expect(el("colorway-select").value).toBe("motown");
    expect(el("colorway-preview").getAttribute("src")).toBe("/img/icons/placeholder-motown.svg");
    expect(el("icon-follows-theme").dataset.tooltip).toBe(t("tooltip.iconFollowsTheme"));
    expect(el("colorway-select").dataset.tooltip).toBe(t("tooltip.colorway"));
    expect(el("icon-follows-theme").dataset.tooltip).not.toBe(el("icon-follows-theme").getAttribute("aria-label"));
  });

  it("paints a saved colorway and keeps the preview when the running icon stays put", () => {
    applyAppearance({
      colorway: "daisy-age",
      icon_follows_theme: false,
      icon_href: "/img/icons/default.svg",
    });
    expect(el("colorway-select").value).toBe("daisy-age");
    expect(el("icon-follows-theme").checked).toBe(false);
    expect(document.documentElement.dataset.colorway).toBe("daisy-age");
    expect(el("colorway-preview").getAttribute("src")).toBe("/img/icons/placeholder-daisy-age.svg");
    expect(iconLink().getAttribute("href")).toBe("/img/icons/default.svg");
  });

  it("ignores a payload that is not about the theme", () => {
    el("colorway-select").value = "deep-house";
    applyAppearance({ telemetry_consent: false });
    expect(el("colorway-select").value).toBe("deep-house");
  });

  it("replaces an unknown colorway with Motown Soul", () => {
    applyAppearance({ colorway: "house" });
    expect(el("colorway-select").value).toBe("motown");
    expect(document.documentElement.dataset.colorway).toBe("motown");
  });

  it("posts the theme and says when this computer cannot change the icon", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => settingsResponse({
      colorway: "deep-house",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-deep-house.svg",
      icon: {
        applied: false,
        platform: "linux",
        target: "unsupported",
        reason: "unsupported",
        colorway: "deep-house",
        follows_theme: true,
        href: "/img/icons/placeholder-deep-house.svg",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);
    el("colorway-select").value = "deep-house";
    await saveColorway();
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      body: JSON.stringify({ colorway: "deep-house" }),
    }));
    expect(document.documentElement.dataset.colorway).toBe("deep-house");
    expect(el("icon-status").textContent).toBe(t("settings.iconUnsupported"));
    expect(iconLink().getAttribute("href")).toBe("/img/icons/placeholder-deep-house.svg");
  });

  it("names the Dock and the taskbar when the running icon changes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => settingsResponse({
      colorway: "motown",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-motown.svg",
      icon: {
        applied: true,
        platform: "darwin",
        target: "dock",
        reason: "ok",
        colorway: "motown",
        follows_theme: true,
        href: "/img/icons/placeholder-motown.svg",
      },
    })));
    await saveColorway();
    expect(el("icon-status").textContent).toBe(t("settings.iconAppliedDock"));

    vi.stubGlobal("fetch", vi.fn(async () => settingsResponse({
      colorway: "motown",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-motown.svg",
      icon: {
        applied: true,
        platform: "win32",
        target: "window",
        reason: "ok",
        colorway: "motown",
        follows_theme: true,
        href: "/img/icons/placeholder-motown.svg",
      },
    })));
    await saveColorway();
    expect(el("icon-status").textContent).toBe(t("settings.iconAppliedWindow"));
  });

  it("posts false and keeps the usual icon", async () => {
    const fetchMock = vi.fn(async () => settingsResponse({
      colorway: "motown",
      icon_follows_theme: false,
      icon_href: "/img/icons/default.svg",
      icon: {
        applied: true,
        platform: "darwin",
        target: "dock",
        reason: "ok",
        colorway: "motown",
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
    expect(el("colorway-preview").getAttribute("src")).toContain("placeholder-motown.svg");
  });

  it("keeps the new theme for this session when the save fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    el("colorway-select").value = "daisy-age";
    await saveColorway();
    expect(el("colorway-select").value).toBe("daisy-age");
    expect(document.documentElement.dataset.colorway).toBe("daisy-age");
    expect(el("icon-status").textContent).toBe(t("settings.iconNotSaved"));
  });

  it("loads the saved choice with the rest of settings", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => settingsResponse({
      telemetry_consent: false,
      needs_consent_prompt: false,
      wizard_complete: true,
      colorway: "deep-house",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-deep-house.svg",
    })));
    await loadPrivacy();
    expect(el("colorway-select").value).toBe("deep-house");
    expect(el("icon-follows-theme").checked).toBe(true);
    expect(document.documentElement.dataset.colorway).toBe("deep-house");
  });

  it("posts from the controls", async () => {
    const fetchMock = vi.fn(async () => settingsResponse({
      colorway: "daisy-age",
      icon_follows_theme: true,
      icon_href: "/img/icons/placeholder-daisy-age.svg",
      icon: {
        applied: false,
        platform: "linux",
        target: "unsupported",
        reason: "no-window",
        colorway: "daisy-age",
        follows_theme: true,
        href: "/img/icons/placeholder-daisy-age.svg",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);
    wireDialogs();
    el("colorway-select").value = "daisy-age";
    el("colorway-select").dispatchEvent(new Event("change"));
    await vi.waitFor(() => {
      expect(el("icon-status").textContent).toBe(t("settings.iconUnsupported"));
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      body: JSON.stringify({ colorway: "daisy-age" }),
    }));
  });

  it("translates the tooltips", () => {
    setLocale("es");
    refreshTooltips();
    expect(el("colorway-select").dataset.tooltip).toBe(t("tooltip.colorway"));
    expect(el("icon-follows-theme").dataset.tooltip).toBe(t("tooltip.iconFollowsTheme"));
    expect(el("icon-follows-theme").dataset.tooltip).not.toContain("Dock icon on Mac");
    expect(el("colorway-select").querySelector('[value="motown"]')?.textContent).toBeTruthy();
  });
});
