/**
 * The setup screen asks about the update check only when unanswered (#97).
 *
 * The answer is posted to /api/update and nothing else turns the check on.
 * The fake server answers GET /api/update with the ``enabled`` each test
 * sets, so a test can show the step being asked or skipped.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { installPage } from "./test-page";
import { UPDATE_CHOICE_EVENT as PAGE_EVENT } from "./update";
import { UPDATE_CHOICE_EVENT, open } from "./wizard-view";

interface Call {
  url: string;
  method: string;
  body: string | null;
}

const calls: Call[] = [];
let enabled: boolean | null = null;
let failUpdatePost = false;

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? "GET").toUpperCase();
  const body = typeof init?.body === "string" ? init.body : null;
  calls.push({ url, method, body });
  if (url.startsWith("/api/settings")) {
    return json({
      telemetry_consent: false,
      needs_consent_prompt: false,
      wizard_complete: false,
      telemetry_configured: false,
      app_version: "1.1.0",
    });
  }
  if (url.startsWith("/api/setup")) {
    return json({ found: true, summary: "Found it.", next: "", serato_running: false });
  }
  if (url.startsWith("/api/snapshots")) return json({ ok: true });
  if (url.startsWith("/api/update") && method === "GET") {
    return json({ enabled, include_prereleases: false, current: "v1.2.0", update: false, latest: null });
  }
  if (url.startsWith("/api/update") && method === "POST") {
    if (failUpdatePost) return json({ error: "Could not save." }, 500);
    return json({ enabled: true, include_prereleases: false, skipped: null });
  }
  return json({ error: "Not found." }, 404);
}

function button(id: string): HTMLButtonElement {
  const node = document.getElementById(id);
  if (!(node instanceof HTMLButtonElement)) throw new Error(`Missing ${id}`);
  return node;
}

function title(): string {
  return document.getElementById("wizard-title")?.textContent ?? "";
}

function updatePosts(): unknown[] {
  return calls
    .filter((call) => call.url.startsWith("/api/update") && call.method === "POST")
    .map((call) => JSON.parse(call.body ?? "null") as unknown);
}

async function pastSnapshot(): Promise<void> {
  open({ force: true });
  await vi.waitFor(() => expect(title()).toBe("See your Serato library"));
  button("wizard-primary").click();
  await vi.waitFor(() => expect(title()).toBe("Find your library"));
  button("wizard-primary").click();
  await vi.waitFor(() => expect(button("wizard-primary").textContent).toBe("Take a safety snapshot"));
  button("wizard-primary").click();
  await vi.waitFor(() => expect(button("wizard-primary").textContent).toBe("Continue"));
  button("wizard-primary").click();
}

describe("setup asks about the update check (#97)", () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    vi.stubGlobal("fetch", fakeFetch);
    // The wizard wires its buttons once per module, so the page is built once.
    installPage();
  });

  beforeEach(() => {
    calls.length = 0;
    enabled = null;
    failUpdatePost = false;
  });

  afterEach(() => {
    button("wizard-cancel").click();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("asks when unanswered, with No first, and Yes saves enabled true", async () => {
    const heard: unknown[] = [];
    window.addEventListener(UPDATE_CHOICE_EVENT, (event) => heard.push((event as CustomEvent).detail));
    await pastSnapshot();
    await vi.waitFor(() => expect(title()).toBe("Check for new versions?"));
    const group = document.getElementById("wizard-updates");
    expect(group?.hidden).toBe(false);
    const order = [...(group?.querySelectorAll("button") ?? [])].map((node) => node.id);
    expect(order).toEqual(["wizard-updates-no", "wizard-updates-yes"]);
    expect(button("wizard-primary").hidden).toBe(true);
    expect(updatePosts()).toEqual([]);
    button("wizard-updates-yes").click();
    await vi.waitFor(() => expect(button("wizard-primary").textContent).toBe("Open my library"));
    expect(updatePosts()).toEqual([{ enabled: true }]);
    expect(heard).toEqual([{ enabled: true }]);
    expect(document.getElementById("wizard-updates")?.hidden).toBe(true);
  });

  it("No saves enabled false", async () => {
    await pastSnapshot();
    await vi.waitFor(() => expect(title()).toBe("Check for new versions?"));
    button("wizard-updates-no").click();
    await vi.waitFor(() => expect(button("wizard-primary").textContent).toBe("Open my library"));
    expect(updatePosts()).toEqual([{ enabled: false }]);
  });

  it("skips the step when a choice is already saved", async () => {
    enabled = false;
    await pastSnapshot();
    await vi.waitFor(() => expect(button("wizard-primary").textContent).toBe("Open my library"));
    expect(updatePosts()).toEqual([]);
  });

  it("stays on the step and says so when saving fails", async () => {
    failUpdatePost = true;
    await pastSnapshot();
    await vi.waitFor(() => expect(title()).toBe("Check for new versions?"));
    button("wizard-updates-yes").click();
    await vi.waitFor(() =>
      expect(document.getElementById("wizard-status")?.textContent).toBe("The choice could not be saved. Try again."),
    );
    expect(title()).toBe("Check for new versions?");
    expect(button("wizard-updates-yes").disabled).toBe(false);
  });

  it("uses the same event name the main page listens for", () => {
    expect(UPDATE_CHOICE_EVENT).toBe(PAGE_EVENT);
  });
});
