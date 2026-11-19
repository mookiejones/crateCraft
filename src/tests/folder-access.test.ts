/**
 * Windows Controlled folder access note in the lock slot.
 *
 * On, audit, and unknown show a sentence and Allow. Off and unsupported hide both.
 * The tooltip is not the button label.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SeratoStatus } from "../lib/api-types";
import { setLocale, t } from "../lib/i18n";
import { mountAppShell, unmountAppShell } from "../lib/ui/app-shell";
import { getNotice } from "../lib/ui/notice-store";
import { applyStaticTooltips } from "../lib/ui/tooltip";
import { tipText, tips } from "../lib/ui/tooltip-strings";
import { applyStatus, paintFolderAccess, repaintViews } from "../lib/ui/views";
import { installPage } from "./test-page";

const appCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../static/app.css"),
  "utf8",
);

function note(): HTMLElement {
  const node = document.getElementById("folder-access");
  if (!(node instanceof HTMLElement)) throw new Error("missing folder-access");
  return node;
}

function allow(): HTMLButtonElement {
  const node = document.getElementById("folder-access-allow");
  if (!(node instanceof HTMLButtonElement)) throw new Error("missing folder-access-allow");
  return node;
}

function status(stateName: NonNullable<SeratoStatus["controlled_folder_access"]>): SeratoStatus {
  return {
    writable: true,
    message: "Serato is quit. Edits save to the library.",
    controlled_folder_access: stateName,
  };
}

describe("folder access", () => {
  beforeEach(() => {
    installPage();
    applyStaticTooltips();
    setLocale("en");
  });

  afterEach(() => {
    unmountAppShell();
    vi.unstubAllGlobals();
  });

  it("shows a warning for on, audit, and unknown, and hides the rest", () => {
    applyStatus(status("on"));
    expect(note().hidden).toBe(false);
    expect(allow().hidden).toBe(false);
    expect(note().textContent).toBe(t("folderAccess.on"));
    expect(allow().textContent).toBe(t("folderAccess.allow"));
    expect(allow().dataset.tooltip).toBe(tipText(tips.folderAccessAllow));
    expect(allow().dataset.tooltip).not.toBe(allow().textContent);

    applyStatus(status("audit"));
    expect(note().textContent).toBe(t("folderAccess.audit"));
    applyStatus(status("unknown"));
    expect(note().textContent).toBe(t("folderAccess.unknown"));

    for (const stateName of ["off", "unsupported"] as const) {
      applyStatus(status(stateName));
      expect(note().hidden).toBe(true);
      expect(allow().hidden).toBe(true);
    }
    applyStatus({ writable: true, message: "Serato is quit. Edits save to the library." });
    expect(note().hidden).toBe(true);
    expect(allow().hidden).toBe(true);
  });

  it("repaints the sentence when the language changes", () => {
    applyStatus(status("on"));
    setLocale("es");
    repaintViews();
    expect(note().textContent).toBe(t("folderAccess.on"));
    expect(allow().textContent).toBe(t("folderAccess.allow"));
    expect(note().textContent).not.toBe("Windows Controlled folder access can block writes into Music. Allow crateCraft, then try the write again.");
  });

  it("posts open and does not treat a failed open as saved", async () => {
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), body: String(init?.body ?? "") });
      return Promise.resolve(new Response(JSON.stringify({
        error: "The Windows Security page could not be opened.",
        code: "folder_access_not_opened",
      }), { status: 500, headers: { "Content-Type": "application/json" } }));
    });
    applyStatus(status("on"));
    allow().click();
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.url).toBe("/api/folder-access");
    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ action: "open" });
    await vi.waitFor(() => expect(getNotice()?.severity).toBe("error"));
    expect(getNotice()?.text).toBe(t("error.folder_access_not_opened"));
  });

  it("adopts the note into the lock slot and the bar can show without the status line", () => {
    mountAppShell();
    expect(note().parentElement?.classList.contains("app-bar-lock")).toBe(true);
    expect(allow().parentElement?.classList.contains("app-bar-lock")).toBe(true);
    expect(appCss).toContain(":has(#status:not([hidden]), #folder-access:not([hidden]))");
    paintFolderAccess(status("on"));
    expect(note().hidden).toBe(false);
  });
});
