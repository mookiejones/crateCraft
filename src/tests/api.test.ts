import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const openConfirm = vi.hoisted(() => vi.fn());

vi.mock("../lib/ui/shared-dialog", async () => {
  const actual = await vi.importActual<typeof import("../lib/ui/shared-dialog")>(
    "../lib/ui/shared-dialog",
  );
  return { ...actual, openConfirm };
});

import { postJSON } from "../lib/api";
import { t } from "../lib/i18n";

function jsonResponse(body: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("postJSON library_changed", () => {
  beforeEach(() => {
    openConfirm.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks to write anyway then retries with force", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({
        error: "The library files changed on disk since they were loaded. Confirm to write anyway.",
        code: "library_changed",
      }, 409))
      .mockResolvedValueOnce(jsonResponse({ name: "Warmup" }, 200));
    openConfirm.mockResolvedValue(true);
    const result = await postJSON("/api/crate", { action: "create", name: "Warmup" });
    expect(openConfirm).toHaveBeenCalledWith({
      title: t("write.forceTitle"),
      message: t("write.forceConfirm"),
      confirmLabel: t("write.forceWrite"),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      action: "create",
      name: "Warmup",
      force: true,
    });
    expect(result).toEqual({ name: "Warmup" });
  });

  it("does not retry when confirm is cancelled", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({
      error: "The library files changed on disk since they were loaded. Confirm to write anyway.",
      code: "library_changed",
    }, 409));
    openConfirm.mockResolvedValue(false);
    await expect(postJSON("/api/crate", { action: "create", name: "Warmup" })).rejects.toThrow();
    expect(openConfirm).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not prompt when force is already set", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({
      error: "The library files changed on disk since they were loaded. Confirm to write anyway.",
      code: "library_changed",
    }, 409));
    await expect(
      postJSON("/api/crate", { action: "create", name: "Warmup", force: true }),
    ).rejects.toThrow();
    expect(openConfirm).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
