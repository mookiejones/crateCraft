/**
 * Help opens a report the app does not post.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../lib/dom";
import { openReport, wireHelp } from "../lib/ui/help";
import { installPage } from "./test-page";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("help", () => {
  beforeEach(() => {
    installPage();
    wireHelp();
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows diagnostics before anything is opened", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      diagnostics: "Serato version: 5.0.0\nProtect Library: off",
      log: "",
    }));
    await openReport("bug");
    expect(el("help-report-dialog").open).toBe(true);
    expect(el("help-diagnostics").textContent).toContain("Protect Library: off");
    expect(el("help-expected-label").hidden).toBe(false);
    expect(fetch).toHaveBeenCalledWith("/api/help");
  });

  it("asks the server to open GitHub and does not navigate the page", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      diagnostics: "App version: 0.0.0+dev",
      log: "line",
    }));
    await openReport("feature");
    expect(el("help-expected-label").hidden).toBe(true);
    el("help-happened").value = "Show the drive";
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      mode: "open",
      url: "https://github.com/mookiejones/crateCraft/issues/new?template=feature_request.yml",
      text: "What should change\nShow the drive",
      opened: true,
    }));
    el("help-open-github").click();
    await vi.waitFor(() => {
      expect(el("help-report-status").textContent).toBe("Opened in your browser. Review it, then submit it on GitHub.");
    });
    const call = vi.mocked(fetch).mock.calls.at(-1);
    expect(call?.[0]).toBe("/api/help");
    const body = JSON.parse(String((call?.[1] as RequestInit).body));
    expect(body.kind).toBe("feature");
    expect(body.open).toBe(true);
    expect(body.change).toBe("Show the drive");
  });

  it("copies a report that is too long for a link", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      mode: "clipboard",
      url: "https://github.com/mookiejones/crateCraft/issues/new?template=bug_report.yml",
      text: "What happened\n" + "x".repeat(20),
      opened: false,
    }));
    await openReport("bug");
    el("help-open-github").click();
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    expect(el("help-report-status").textContent).toContain("too long");
  });

  it("opens GitHub pages in the system browser, not the app window", () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ opened: true }));
    const cases: Array<[string, string]> = [
      ["help-github", "repo"],
      ["help-releases", "releases"],
      ["about-github", "repo"],
    ];
    for (const [id, page] of cases) {
      vi.mocked(fetch).mockClear();
      const link = document.getElementById(id);
      if (!link) throw new Error(`missing ${id}`);
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      link.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(fetch).toHaveBeenCalledWith("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page }),
      });
    }
  });
});
