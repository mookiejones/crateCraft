/**
 * Update banner and Settings switches (#97).
 *
 * The fake server answers GET /api/update with ``status`` and records each
 * POST, so the tests can check that the page never builds a release URL
 * and only sends the choices the server accepts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../lib/dom";
import { setLocale } from "../lib/i18n";
import { installPage } from "./test-page";
import {
  UPDATE_CHOICE_EVENT,
  loadUpdate,
  parseUpdateStatus,
  repaintUpdate,
  resetUpdateForTests,
  wireUpdate,
  type UpdateStatus,
} from "../lib/ui/update";

const OFFER: UpdateStatus = {
  enabled: true,
  include_prereleases: false,
  current: "v1.2.0",
  update: true,
  latest: { version: "v1.3.0", url: "https://github.com/mookiejones/crateCraft/releases/tag/v1.3.0", prerelease: false },
};

let status: unknown = OFFER;
let failPosts = false;
let opened = true;
const posts: unknown[] = [];

function json(payload: unknown, code = 200): Response {
  return new Response(JSON.stringify(payload), { status: code, headers: { "Content-Type": "application/json" } });
}

async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith("/api/update")) return json({ error: "Not found." }, 404);
  if ((init?.method ?? "GET").toUpperCase() === "GET") return json(status);
  const body = JSON.parse(typeof init?.body === "string" ? init.body : "null") as Record<string, unknown>;
  posts.push(body);
  if (failPosts) return json({ error: "Could not save." }, 500);
  if (body.open === true) return json({ opened });
  return json({ enabled: true, include_prereleases: false, skipped: null });
}

function banner(): HTMLElement {
  return el("update-banner");
}

describe("update banner and switches (#97)", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    resetUpdateForTests();
    status = OFFER;
    failPosts = false;
    opened = true;
    posts.length = 0;
    vi.stubGlobal("fetch", vi.fn(fakeFetch));
    wireUpdate();
  });

  afterEach(() => {
    setLocale("en");
    vi.unstubAllGlobals();
  });

  it("shows a newer release with both versions", async () => {
    await loadUpdate();
    expect(banner().hidden).toBe(false);
    expect(el("update-text").textContent).toBe("Version v1.3.0 is out. You have v1.2.0.");
    expect(el("update-toggle").checked).toBe(true);
    expect(el("update-prereleases").disabled).toBe(false);
  });

  it("names a test version as one", async () => {
    status = { ...OFFER, include_prereleases: true, latest: { ...OFFER.latest, version: "v1.3.0-rc1", prerelease: true } };
    await loadUpdate();
    expect(el("update-text").textContent).toBe("Test version v1.3.0-rc1 is out. You have v1.2.0.");
  });

  it("stays hidden when off, unanswered, up to date, skipped, or unreachable", async () => {
    const quiet: unknown[] = [
      { ...OFFER, enabled: false },
      { ...OFFER, enabled: null },
      { ...OFFER, update: false, latest: null },
      { ...OFFER, update: false },
      { error: "broken" },
    ];
    for (const body of quiet) {
      status = body;
      await loadUpdate();
      expect(banner().hidden).toBe(true);
    }
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    await loadUpdate();
    expect(banner().hidden).toBe(true);
  });

  it("Download asks the server to open the release and sends no URL", async () => {
    await loadUpdate();
    el("update-download").click();
    await vi.waitFor(() => expect(posts).toEqual([{ open: true }]));
    expect(el("update-text").textContent).toBe("Version v1.3.0 is out. You have v1.2.0.");
  });

  it("says where the release is when the browser does not open", async () => {
    opened = false;
    await loadUpdate();
    el("update-download").click();
    await vi.waitFor(() =>
      expect(el("update-text").textContent).toBe("The release page could not be opened. It is on GitHub under Releases."),
    );
  });

  it("Skip this version saves the offered version and hides the banner", async () => {
    await loadUpdate();
    status = { ...OFFER, update: false };
    el("update-skip").click();
    await vi.waitFor(() => expect(banner().hidden).toBe(true));
    expect(posts).toEqual([{ skip: "v1.3.0" }]);
  });

  it("Not now hides the banner without saving anything", async () => {
    await loadUpdate();
    el("update-dismiss").click();
    expect(banner().hidden).toBe(true);
    expect(posts).toEqual([]);
    await loadUpdate();
    expect(banner().hidden).toBe(true);
  });

  it("the Settings switches post their choice", async () => {
    status = { ...OFFER, enabled: false, update: false, latest: null };
    await loadUpdate();
    expect(el("update-toggle").checked).toBe(false);
    expect(el("update-prereleases").disabled).toBe(true);
    status = OFFER;
    el("update-toggle").checked = true;
    el("update-toggle").dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(banner().hidden).toBe(false));
    el("update-prereleases").checked = true;
    el("update-prereleases").dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(posts).toHaveLength(2));
    expect(posts).toEqual([{ enabled: true }, { include_prereleases: true }]);
  });

  it("a failed save puts the switch back and says so", async () => {
    status = { ...OFFER, enabled: false, update: false, latest: null };
    await loadUpdate();
    failPosts = true;
    el("update-toggle").checked = true;
    el("update-toggle").dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(el("update-status").textContent).toBe("The update choice could not be saved."));
    expect(el("update-toggle").checked).toBe(false);
    expect(el("update-toggle").disabled).toBe(false);
  });

  it("refreshes when setup saves the choice", async () => {
    status = { ...OFFER, enabled: null, update: false, latest: null };
    await loadUpdate();
    expect(banner().hidden).toBe(true);
    status = OFFER;
    window.dispatchEvent(new CustomEvent(UPDATE_CHOICE_EVENT, { detail: { enabled: true } }));
    await vi.waitFor(() => expect(banner().hidden).toBe(false));
  });

  it("repaints in the active language without asking again", async () => {
    await loadUpdate();
    const fetches = vi.mocked(fetch).mock.calls.length;
    setLocale("es");
    repaintUpdate();
    expect(el("update-text").textContent).toBe("Ya está la versión v1.3.0. Tienes la v1.2.0.");
    expect(vi.mocked(fetch).mock.calls.length).toBe(fetches);
  });

  it("rejects a malformed status", () => {
    expect(parseUpdateStatus(null)).toBeNull();
    expect(parseUpdateStatus([])).toBeNull();
    expect(parseUpdateStatus({ ...OFFER, enabled: "yes" })).toBeNull();
    expect(parseUpdateStatus({ ...OFFER, update: "yes" })).toBeNull();
    expect(parseUpdateStatus({ ...OFFER, latest: { version: 3 } })?.update).toBe(false);
  });

  it("every control has a tooltip", async () => {
    const { applyStaticTooltips } = await import("../lib/ui/tooltip");
    applyStaticTooltips();
    for (const id of ["update-toggle", "update-prereleases", "update-download", "update-skip", "update-dismiss"]) {
      expect(document.getElementById(id)?.dataset.tooltipKey, id).toMatch(/^tooltip\.update/);
    }
  });
});
