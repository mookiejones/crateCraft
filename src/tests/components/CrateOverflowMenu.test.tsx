/**
 * Overflow ids stay in the DOM. A click still runs the crate action.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../app/providers";
import { CrateOverflowMenu } from "../../components/CrateOverflowMenu";
import { setLocale, t } from "../../lib/i18n";
import { tips } from "../../lib/ui/tooltip-strings";
import { installPage } from "../test-page";

describe("CrateOverflowMenu", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    installPage();
    setLocale("en");
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    root.unmount();
    host.remove();
  });

  it("names More for a screen reader in English and Spanish", () => {
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: createElement(CrateOverflowMenu, {
            buttonId: "crate-actions-more",
            menuId: "crate-actions-menu",
            moreLabel: t("crates.moreActions"),
            items: [
              {
                id: "crate-color",
                label: t("field.color"),
                tip: tips.crateColor,
                onClick: () => undefined,
              },
            ],
          }),
        }),
      );
    });
    const more = host.querySelector<HTMLButtonElement>("#crate-actions-more");
    expect(more?.textContent).toBe("More");
    expect(more?.getAttribute("aria-label")).toBe("More crate actions");
    setLocale("es");
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: createElement(CrateOverflowMenu, {
            buttonId: "crate-actions-more",
            menuId: "crate-actions-menu",
            moreLabel: t("crates.moreActions"),
            items: [
              {
                id: "crate-color",
                label: t("field.color"),
                tip: tips.crateColor,
                onClick: () => undefined,
              },
            ],
          }),
        }),
      );
    });
    expect(host.querySelector("#crate-actions-more")?.getAttribute("aria-label")).toBe(
      "Más acciones de caja",
    );
  });

  it("keeps closed items inert and restores focus to More", () => {
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: createElement(CrateOverflowMenu, {
            buttonId: "crate-actions-more",
            menuId: "crate-actions-menu",
            moreLabel: t("crates.moreActions"),
            items: [
              {
                id: "crate-color",
                label: t("field.color"),
                tip: tips.crateColor,
                onClick: () => undefined,
              },
              {
                id: "crate-preset",
                label: t("presets.button"),
                tip: tips.cratePreset,
                ariaHasPopup: "dialog",
                onClick: () => undefined,
              },
            ],
          }),
        }),
      );
    });
    const more = host.querySelector<HTMLButtonElement>("#crate-actions-more");
    const menu = document.getElementById("crate-actions-menu");
    expect(more).not.toBeNull();
    expect(menu?.closest("[inert]")).not.toBeNull();
    more?.focus();
    flushSync(() => {
      more?.click();
    });
    expect(more?.getAttribute("aria-expanded")).toBe("true");
    expect(menu?.closest("[inert]")).toBeNull();
    flushSync(() => {
      document.querySelector<HTMLButtonElement>("#crate-actions-menu #crate-color")?.click();
    });
    expect(more?.getAttribute("aria-expanded")).not.toBe("true");
    expect(document.activeElement).toBe(more);
    flushSync(() => {
      more?.click();
    });
    flushSync(() => {
      document.querySelector<HTMLButtonElement>("#crate-actions-menu #crate-preset")?.click();
    });
    expect(document.activeElement).toBe(more);
  });

  it("keeps overflow ids mounted and runs the action from More", () => {
    const color = vi.fn();
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: createElement(CrateOverflowMenu, {
            buttonId: "crate-actions-more",
            menuId: "crate-actions-menu",
            items: [
              {
                id: "crate-color",
                label: t("field.color"),
                tip: tips.crateColor,
                onClick: color,
              },
            ],
          }),
        }),
      );
    });
    const more = host.querySelector<HTMLButtonElement>("#crate-actions-more");
    const item = document.querySelector<HTMLButtonElement>("#crate-actions-menu #crate-color");
    expect(more?.textContent).toBe("More");
    expect(more?.getAttribute("aria-haspopup")).toBe("menu");
    expect(item).not.toBeNull();
    expect(item?.id).toBe("crate-color");
    expect(item?.className).toContain("MuiMenuItem");
    expect(item?.closest("#crate-actions-menu")).not.toBeNull();

    item?.click();
    expect(color).toHaveBeenCalledTimes(1);
    more?.click();
    item?.click();
    expect(color).toHaveBeenCalledTimes(2);
    expect(more?.getAttribute("aria-expanded")).not.toBe("true");
  });

  it("hides a flagged item without dropping its id", () => {
    flushSync(() => {
      root.render(
        createElement(AppProviders, {
          children: createElement(CrateOverflowMenu, {
            buttonId: "crate-actions-more",
            menuId: "crate-actions-menu",
            items: [
              {
                id: "crate-refresh",
                label: t("presets.refresh"),
                tip: tips.crateRefresh,
                hidden: true,
                onClick: () => undefined,
              },
            ],
          }),
        }),
      );
    });
    const item = document.querySelector<HTMLButtonElement>("#crate-actions-menu #crate-refresh");
    expect(item).not.toBeNull();
    expect(item?.hidden).toBe(true);
  });
});
