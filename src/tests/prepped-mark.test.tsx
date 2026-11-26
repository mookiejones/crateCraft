/**
 * Prepped mark on a crate title cell.
 */

import { createElement, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Track } from "../lib/api-types";
import { setLocale } from "../lib/i18n";
import { TrackTitleCell } from "../lib/ui/track-list-columns";
import { installPage } from "./test-page";

function row(extra: Partial<Track>): Track {
  return { id: 1, name: "Night", ...extra };
}

describe("prepped mark", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    installPage();
    setLocale("en");
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    flushSync(() => {
      root.unmount();
    });
    host.remove();
    setLocale("en");
  });

  function paint(track: Track): void {
    const node: ReactElement = createElement(TrackTitleCell, { track });
    flushSync(() => {
      root.render(node);
    });
  }

  function mark(): HTMLElement | null {
    const node = host.querySelector(".prepped-mark");
    return node instanceof HTMLElement ? node : null;
  }

  it("names a prepped track and matches the tooltip", () => {
    paint(row({
      prepped: true,
      prepped_missing: [],
      prepped_unknown: [],
      has_cues: true,
      analysed: true,
      file_present: true,
    }));
    const node = mark();
    expect(node?.className).toContain("prepped-mark-prepped");
    expect(node?.getAttribute("aria-label")).toBe(
      "Prepped. This track has cues, is analysed, and the file is here. Nothing is written.",
    );
    expect(node?.getAttribute("data-tooltip")).toBe(node?.getAttribute("aria-label"));
    expect(node?.querySelector(".prepped-word")?.textContent).toBe("Prepped");
    expect(node?.querySelector(".prepped-word")?.getAttribute("aria-hidden")).toBe("true");
    expect(node?.tabIndex).toBe(0);
  });

  it("names each missing piece and does not say the track is prepped", () => {
    paint(row({
      prepped: false,
      prepped_missing: ["cues", "file"],
      prepped_unknown: [],
      has_cues: false,
      analysed: true,
      file_present: false,
    }));
    const node = mark();
    const label = node?.getAttribute("aria-label") ?? "";
    expect(node?.className).toContain("prepped-mark-missing");
    expect(node?.querySelector(".prepped-word")?.textContent).toBe("Not prepped: cues, file");
    expect(label).toContain("cues, file");
    expect(label).toContain("Nothing is written.");
    expect(label.startsWith("Prepped.")).toBe(false);
    expect(node?.getAttribute("data-tooltip")).toBe(label);
  });

  it("shows an unknown check as not checked", () => {
    paint(row({
      prepped: null,
      prepped_missing: [],
      prepped_unknown: ["file"],
      has_cues: true,
      analysed: true,
      file_present: null,
    }));
    const node = mark();
    const label = node?.getAttribute("aria-label") ?? "";
    expect(node?.querySelector(".prepped-word")?.textContent).toBe("Not checked: file");
    expect(label.startsWith("Not checked.")).toBe(true);
    expect(label).toContain("file");
    expect(label.includes("Prepped.")).toBe(false);
    expect(node?.getAttribute("data-tooltip")).toBe(label);
  });

  it("does not show prepped when the server mark is true but a piece is unknown", () => {
    paint(row({
      prepped: true,
      prepped_missing: ["cues"],
      prepped_unknown: ["analysed"],
    }));
    const node = mark();
    const label = node?.getAttribute("aria-label") ?? "";
    expect(node?.className).toContain("prepped-mark-unknown");
    expect(node?.querySelector(".prepped-word")?.textContent).toContain("cues");
    expect(node?.querySelector(".prepped-word")?.textContent).toContain("analysed");
    expect(label.includes("Prepped.")).toBe(false);
    expect(label).toContain("Not checked");
  });

  it("omits the mark on a history row", () => {
    paint(row({ entry: true, name: "Played" }));
    expect(mark()).toBeNull();
    expect(host.textContent).toContain("Played");
  });

  it("uses the Spanish sentences", () => {
    setLocale("es");
    paint(row({
      prepped: false,
      prepped_missing: ["analysed"],
      prepped_unknown: [],
    }));
    const node = mark();
    const label = node?.getAttribute("aria-label") ?? "";
    expect(node?.querySelector(".prepped-word")?.textContent).toBe("No preparada: análisis");
    expect(label).toContain("No preparada.");
    expect(label).toContain("análisis");
    expect(label).toContain("No se escribe nada.");
    expect(label.includes("Preparada.")).toBe(false);
    expect(node?.getAttribute("data-tooltip")).toBe(label);
  });
});
