/**
 * Portable drive check: the volume root, and a read-only report.
 *
 * The button is only on a removable Serato root. The request is GET.
 * Fix text is painted as text, including a name that looks like markup.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { libraryRootsFixture } from "./library-roots.fixture";
import {
  FINDING_CAP,
  openPortableCheck,
  parseDriveReport,
  portableDriveRoot,
  renderPortableReport,
  repaintPortable,
  type DriveReport,
} from "./portable";
import { state } from "./state";
import { installPage } from "./test-page";
import { renderFiles } from "./views";
import { setLocale } from "./i18n";

const fetchMock = vi.fn();

function report(extra: Partial<DriveReport> = {}): DriveReport {
  return {
    drive: "/Volumes/GIGDRIVE",
    name: "GIGDRIVE",
    ready: false,
    missing_drive: false,
    summary: "1 of 2 tracks are not on this drive.",
    findings: [
      {
        kind: "off_drive",
        crate: "House",
        track: "night.mp3",
        path: "Users/ada/Music/night.mp3",
        found: "/Users/ada/Music/night.mp3",
        fix: "Copy <b>night.mp3</b> onto this drive.",
      },
    ],
    errors: [],
    ...extra,
  };
}

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: async () => body,
  } as Response;
}

describe("portableDriveRoot", () => {
  it("uses the volume, not the Music folder inside it", () => {
    expect(portableDriveRoot("/Volumes/GIGDRIVE/Music")).toBe("/Volumes/GIGDRIVE");
    expect(portableDriveRoot("/Volumes/GIGDRIVE")).toBe("/Volumes/GIGDRIVE");
    expect(portableDriveRoot("/Volumes/GIGDRIVE/_Serato_")).toBe("/Volumes/GIGDRIVE");
    expect(portableDriveRoot("/media/ada/stick/Music")).toBe("/media/ada/stick");
    expect(portableDriveRoot("/run/media/ada/stick")).toBe("/run/media/ada/stick");
    expect(portableDriveRoot("/mnt/stick/House")).toBe("/mnt/stick");
    expect(portableDriveRoot("E:\\Music\\House")).toBe("E:\\");
    expect(portableDriveRoot("E:/Music")).toBe("E:/");
    expect(portableDriveRoot("\\\\server\\share\\Music")).toBe("\\\\server\\share");
    expect(portableDriveRoot("")).toBe("");
    expect(portableDriveRoot("/Users/dj/Music")).toBe("/Users/dj/Music");
  });
});

describe("parseDriveReport", () => {
  it("rejects a payload that is not the contract", () => {
    expect(parseDriveReport(null)).toBeNull();
    expect(parseDriveReport({ ready: true })).toBeNull();
    expect(parseDriveReport({ ...report(), findings: [{ kind: 1 }] })).toBeNull();
  });
});

describe("portable drive check", () => {
  beforeEach(() => {
    installPage();
    setLocale("en");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    state.mode = "files";
    state.filesPath = "";
    state.filesEntries = [];
    state.filesSelected = new Set();
    state.filesAtRoots = true;
    state.filesRoots = libraryRootsFixture.roots;
    state.filesElsewhere = false;
    state.filesActive = 0;
    state.filesLoading = false;
    state.filesError = "";
  });

  it("offers the check only on a removable Serato drive and does not write", async () => {
    renderFiles();
    const buttons = [...document.querySelectorAll<HTMLButtonElement>(".files-portable")];
    const rows = [...document.querySelectorAll("#files-list .files-row")];
    expect(rows[0]?.querySelector(".files-portable")).toBeNull();
    expect(rows[1]?.querySelector(".files-portable")?.textContent).toBe("Check drive");
    expect(rows[2]?.querySelector(".files-portable")).not.toBeNull();
    expect(buttons).toHaveLength(2);

    const body = report();
    fetchMock.mockResolvedValue(jsonResponse(body));
    buttons[0]?.click();
    await vi.waitFor(() => {
      expect(document.querySelector("#portable-verdict")?.textContent).toBe(
        "Not ready. Fix these on the laptop first.",
      );
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]).toEqual(["/api/drive-check?drive=%2FVolumes%2FGIGDRIVE"]);
    expect((document.querySelector("#portable-dialog") as HTMLDialogElement).open).toBe(true);
    expect(document.querySelector("#portable-verdict")?.textContent).toBe("Not ready. Fix these on the laptop first.");
    expect(document.querySelector("#portable-summary")?.textContent).toBe(body.summary);
    expect(document.querySelector(".portable-kind")?.textContent).toBe("Not on this drive");
    expect(document.querySelector(".portable-fix")?.textContent).toBe("Copy <b>night.mp3</b> onto this drive.");
    expect(document.querySelector("#portable-findings b")).toBeNull();
    expect(document.querySelector("#portable-note")?.textContent).toBe("This only reads the drive. Nothing is copied or deleted.");
  });

  it("reports a missing drive without deleting it", () => {
    renderPortableReport(report({
      ready: false,
      missing_drive: true,
      summary: "GIGDRIVE is not connected.",
      findings: [],
    }));
    expect(document.querySelector("#portable-verdict")?.textContent).toBe(
      "This drive is not connected. Nothing was deleted.",
    );
    expect(document.querySelectorAll("#portable-findings li")).toHaveLength(0);
  });

  it("shows a server refusal and ignores a late reply", async () => {
    let release: ((value: Response) => void) | undefined;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("OLDDRIVE")) {
        return new Promise<Response>((resolve) => {
          release = resolve;
        });
      }
      return Promise.resolve(jsonResponse({ error: "This folder has no _Serato_ folder." }, false));
    });
    const pending = openPortableCheck("/Volumes/OLDDRIVE/Music");
    const refused = openPortableCheck("/Volumes/PLAIN");
    await refused;
    expect(document.querySelector("#portable-status")?.textContent).toBe("This folder has no _Serato_ folder.");
    expect(document.querySelector("#portable-verdict")?.textContent).toBe("");
    release?.(jsonResponse(report({ name: "OLDDRIVE", summary: "late" })));
    await pending;
    expect(document.querySelector("#portable-summary")?.textContent).toBe("");
  });

  it("counts findings past the cap and translates the verdict", () => {
    const findings = Array.from({ length: FINDING_CAP + 2 }, (_, index) => ({
      kind: "missing",
      crate: "House",
      track: `t${index}.mp3`,
      path: `t${index}.mp3`,
      found: "",
      fix: `Missing t${index}.mp3`,
    }));
    renderPortableReport(report({ findings, errors: [{ crate: "Peak", message: "Could not read that crate." }] }));
    const rows = [...document.querySelectorAll("#portable-findings li")];
    expect(rows).toHaveLength(FINDING_CAP + 2);
    expect(rows.at(-2)?.textContent).toBe("Peak: Could not read that crate.");
    expect(rows.at(-1)?.textContent).toBe("And 2 more.");
    setLocale("es");
    repaintPortable();
    expect(document.querySelector("#portable-verdict")?.textContent).toBe(
      "No está lista. Corrígelo en el portátil primero.",
    );
    expect(document.querySelector(".portable-kind")?.textContent).toBe("No está");
    expect(document.querySelector(".portable-fix")?.textContent).toBe("Missing t0.mp3");
  });
});
