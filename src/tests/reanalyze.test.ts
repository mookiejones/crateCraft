/**
 * Re-analyze Health panel: needs a crate, paints a preview grid.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadReanalyze, unmountReanalyze, wireReanalyze } from "../lib/health/reanalyze";
import { state } from "../lib/state";
import { installPage } from "./test-page";

vi.mock("../lib/bridge", () => ({
  bridge: {
    reloadLibrary: vi.fn(async () => undefined),
    lockDown: vi.fn(),
  },
}));

describe("reanalyze", () => {
  beforeEach(() => {
    installPage();
    unmountReanalyze();
    state.mode = "reanalyze";
    state.space = "Serato Library";
    state.activeCrate = 5;
    state.writable = true;
    state.crates = [{ id: 5, name: "Gig" }];
    wireReanalyze();
  });

  it("refuses the whole space before fetching", async () => {
    state.activeCrate = "all";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadReanalyze();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("reanalyze-status")!.textContent).toContain("crate");
  });

  it("paints tracks from GET /api/reanalyze", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          preview: true,
          written: false,
          space: "Serato Library",
          crate: 5,
          count: 1,
          tracks: [
            {
              id: 10,
              name: "Drop",
              artist: "A",
              file: "ready.mp3",
              analysis_flags: 4,
              locked: false,
              has_beatgrid: true,
              has_autotags: true,
              has_markers2: true,
              cleared: ["BeatGrid", "Autotags"],
            },
          ],
          locked: [],
          clear_frames: true,
          include_locked: false,
          markers2: "unchanged",
          message: "Markers2 cues stay.",
        }),
      })),
    );
    await loadReanalyze();
    expect(document.querySelector("#reanalyze-report .MuiDataGrid-root")).not.toBeNull();
    expect(document.getElementById("reanalyze-scope")!.textContent).toBe("Gig");
    expect(document.querySelector("[data-reanalyze-action='confirm']")).not.toBeNull();
    const box = document.getElementById("reanalyze-clear-frames") as HTMLInputElement;
    box.checked = false;
    box.dispatchEvent(new Event("change"));
    expect(document.querySelector("[data-reanalyze-action='confirm']")).toBeNull();
    expect(document.getElementById("reanalyze-status")!.textContent).toContain("Preview again");
  });
});
