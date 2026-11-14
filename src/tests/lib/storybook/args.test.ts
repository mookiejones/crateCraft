/**
 * Storybook Controls args map onto fixture context values.
 *
 * Context islands have no props. These helpers are the only path from
 * the Controls panel into CrateProvider and the other domain providers.
 */

import { describe, expect, it } from "vitest";
import {
  crateValueFromArgs,
  filesValueFromArgs,
  gigValueFromArgs,
  healthValueFromArgs,
  historyValueFromArgs,
  noticeValueFromArgs,
  playerValueFromArgs,
  settingsValueFromArgs,
  snapshotsValueFromArgs,
  statsValueFromArgs,
  trackListValueFromArgs,
  wizardValueFromArgs,
} from "../../../lib/storybook/args";

describe("crateValueFromArgs", () => {
  it("selects All tracks and disables crate edits by default", () => {
    const value = crateValueFromArgs({
      empty: false,
      writable: true,
      crateChosen: false,
      splitPressed: false,
    });
    expect(value.rows.map((row) => [row.id, row.selected])).toEqual([
      ["all", true],
      [2, false],
      [3, false],
    ]);
    expect(value.crateChosen).toBe(false);
    expect(value.canCreate).toBe(true);
    expect(value.canRename).toBe(false);
    expect(value.canColor).toBe(false);
    expect(value.canDelete).toBe(false);
  });

  it("selects House and enables crate edits when a crate is chosen", () => {
    const value = crateValueFromArgs({
      empty: false,
      writable: true,
      crateChosen: true,
      splitPressed: false,
    });
    expect(value.rows.find((row) => row.id === 2)?.selected).toBe(true);
    expect(value.rows.find((row) => row.id === "all")?.selected).toBe(false);
    expect(value.crateChosen).toBe(true);
    expect(value.canRename).toBe(true);
    expect(value.canFolderSync).toBe(true);
    expect(value.canRenameFromTags).toBe(true);
  });

  it("clears the rail when empty is on", () => {
    const value = crateValueFromArgs({
      empty: true,
      writable: true,
      crateChosen: false,
      splitPressed: false,
    });
    expect(value.rows).toEqual([]);
  });

  it("blocks writes when the library is read-only", () => {
    const value = crateValueFromArgs({
      empty: false,
      writable: false,
      crateChosen: true,
      splitPressed: true,
    });
    expect(value.writable).toBe(false);
    expect(value.canCreate).toBe(false);
    expect(value.canRename).toBe(false);
    expect(value.splitPressed).toBe(true);
  });
});

describe("settingsValueFromArgs", () => {
  it("copies colorway, language, and sharing onto the fixture", () => {
    const value = settingsValueFromArgs({
      colorway: "dark-club",
      language: "es",
      telemetryOn: true,
      iconFollowsTheme: false,
    });
    expect(value.colorway).toBe("dark-club");
    expect(value.language).toBe("es");
    expect(value.telemetryOn).toBe(true);
    expect(value.telemetryConfigured).toBe(true);
    expect(value.iconFollowsTheme).toBe(false);
  });
});

describe("filesValueFromArgs", () => {
  it("shows music roots until a folder is opened", () => {
    const roots = filesValueFromArgs({
      loading: false,
      atRoots: true,
      writable: true,
      dialogAction: "",
    });
    expect(roots.atRoots).toBe(true);
    expect(roots.rows[0]?.name).toBe("Music (dj)");

    const folder = filesValueFromArgs({
      loading: false,
      atRoots: false,
      writable: true,
      dialogAction: "",
    });
    expect(folder.path).toBe("/Users/dj/Music");
    expect(folder.rows.map((row) => row.name)).toEqual(["Night.mp3", "House"]);
  });

  it("opens the review dialog for rename or delete", () => {
    const rename = filesValueFromArgs({
      loading: false,
      atRoots: true,
      writable: true,
      dialogAction: "rename",
    });
    expect(rename.dialogOpen).toBe(true);
    expect(rename.dialogAction).toBe("rename");
    expect(rename.dialogName).toBe("Night.mp3");
  });
});

describe("healthValueFromArgs", () => {
  it("toggles the health report, scan, tags, and chrome mode", () => {
    const idle = healthValueFromArgs({
      hasReport: false,
      busy: false,
      hasScan: false,
      hasTags: false,
      mode: "health",
    });
    expect(idle.healthReport).toBeNull();
    expect(idle.mergeVisible).toBe(false);

    const loaded = healthValueFromArgs({
      hasReport: true,
      busy: true,
      hasScan: true,
      hasTags: true,
      mode: "duplicates",
    });
    expect(loaded.healthReport?.checked).toBe(12);
    expect(loaded.healthBusy).toBe(true);
    expect(loaded.scanReport?.depth).toBe("quick");
    expect(loaded.tagsClusters?.field).toBe("genre");
    expect(loaded.mergeVisible).toBe(true);
    expect(loaded.mergeDisabled).toBe(false);
  });
});

describe("playerValueFromArgs", () => {
  it("pauses on an empty deck", () => {
    const value = playerValueFromArgs({
      playing: true,
      empty: true,
      currentTime: 45,
      volume: 0.5,
    });
    expect(value.trackId).toBeNull();
    expect(value.playing).toBe(false);
    expect(value.canTogglePlay).toBe(false);
    expect(value.volume).toBe(0.5);
  });

  it("keeps the Night fixture when a track is loaded", () => {
    const value = playerValueFromArgs({
      playing: true,
      empty: false,
      currentTime: 45,
      volume: 0.2,
    });
    expect(value.title).toBe("Night");
    expect(value.playing).toBe(true);
    expect(value.currentTime).toBe(45);
  });
});

describe("wizardValueFromArgs", () => {
  it("builds the fixture model for the chosen step", () => {
    expect(wizardValueFromArgs({ step: "consent" }).model.step).toBe("consent");
  });
});

describe("historyValueFromArgs", () => {
  it("drops sessions and the open entry when empty", () => {
    const value = historyValueFromArgs({ empty: true });
    expect(value.sessions).toEqual([]);
    expect(value.historyId).toBeNull();
    expect(value.entries).toEqual([]);
    expect(value.selectedId).toBeNull();
  });
});

describe("snapshotsValueFromArgs", () => {
  it("opens a blocked restore plan", () => {
    const value = snapshotsValueFromArgs({
      empty: false,
      loading: false,
      planOpen: true,
      blocked: true,
    });
    expect(value.planOpen).toBe(true);
    expect(value.plan?.restore_blocked).toBe("Quit Serato before restoring.");
  });
});

describe("gigValueFromArgs", () => {
  it("marks the gig ready and can hide drive or drift reports", () => {
    const value = gigValueFromArgs({
      ready: true,
      empty: false,
      emptyPortable: true,
      emptyDrift: true,
    });
    expect(value.gig.report?.ready).toBe(true);
    expect(value.gig.report?.score).toBe(100);
    expect(value.portable.report).toBeNull();
    expect(value.drift.report).toBeNull();
  });
});

describe("statsValueFromArgs", () => {
  it("clears the play-stats report", () => {
    expect(statsValueFromArgs({ empty: true, writable: false }).report).toBeNull();
  });
});

describe("trackListValueFromArgs", () => {
  it("clears the grid when empty", () => {
    const value = trackListValueFromArgs({ empty: true, writable: false });
    expect(value.view).toEqual([]);
    expect(value.selectedId).toBeNull();
    expect(value.writable).toBe(false);
  });
});

describe("noticeValueFromArgs", () => {
  it("hides the banner for the hidden severity", () => {
    expect(noticeValueFromArgs({ severity: "hidden", text: "Saved." }).notice).toBeNull();
  });

  it("shows the given severity and text", () => {
    expect(noticeValueFromArgs({ severity: "error", text: "That file is not on disk." }).notice).toEqual({
      text: "That file is not on disk.",
      severity: "error",
    });
  });
});
