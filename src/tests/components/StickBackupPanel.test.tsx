/**
 * Check drive loads the remembered stick backup without a preview.
 */

import { createElement, act } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "../../app/providers";
import { StickBackupPanel } from "../../components/StickBackupPanel";
import { setStickDrive } from "../../lib/gig/portable";
import { t } from "../../lib/i18n";
import { drainReactScheduler, installPage } from "../test-page";

const remembered = {
  warning: "Stale database warning.",
  last_backup: { dest: "/Volumes/Backup", at: "2026-11-20T14:30:00Z", verified: true },
  written: false,
};

describe("StickBackupPanel", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    installPage();
    setStickDrive("");
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    root.unmount();
    host.remove();
    setStickDrive("");
    vi.unstubAllGlobals();
  });

  it("shows Not backed up yet until a stick is chosen", () => {
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(StickBackupPanel) }));
    });
    expect(host.querySelector("#stick-backup-status")?.textContent).toContain(t("stickBackup.never"));
  });

  it("loads the remembered backup and stale warning when the stick is chosen", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url.startsWith("/api/stick-backup?")).toBe(true);
      expect(url).toContain("source=" + encodeURIComponent("/Volumes/STICK"));
      expect(url).not.toContain("dest=");
      return new Response(JSON.stringify(remembered), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    flushSync(() => {
      root.render(createElement(AppProviders, { children: createElement(StickBackupPanel) }));
    });
    await act(async () => {
      setStickDrive("/Volumes/STICK");
    });
    await act(async () => {
      await drainReactScheduler();
    });
    expect(fetchMock).toHaveBeenCalled();
    const status = host.querySelector("#stick-backup-status")?.textContent ?? "";
    expect(status).toContain("/Volumes/Backup");
    expect(status).toContain("Stale database warning.");
    expect(status).not.toContain(t("stickBackup.never"));
    expect(host.querySelector<HTMLInputElement>("#stick-backup-dest")?.value).toBe("/Volumes/Backup");
  });
});
