/**
 * AppBar cue pads jump the playhead. Empty pads stay quiet.
 */

import { createElement, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CuePads } from "../../components/CuePads";
import { PlayerCuePads } from "../../components/PlayerCuePads";
import { PlayerProvider } from "../../containers/PlayerContext";
import { setLocale, t } from "../../lib/i18n";
import type { CueMarker } from "../../lib/player/player";
import { playerValue } from "../../lib/storybook/fixtures";
import {
  installTooltips,
  refreshTooltips,
  resetTooltipState,
  TOOLTIP_ID,
} from "../../lib/ui/tooltip";
import { cueTip, tipText } from "../../lib/ui/tooltip-strings";
import { drainReactScheduler } from "../test-page";

const NIGHT_CUES: CueMarker[] = [
  { index: 0, seconds: 1.5, color: "#CC0000", label: "Drop" },
  { index: 3, seconds: 8, color: "#FAC313", label: "Break" },
];

function PadsHarness({
  cues,
  onSeek,
  initialTime = 0,
}: {
  cues: readonly CueMarker[];
  onSeek: (seconds: number) => void;
  initialTime?: number;
}) {
  const [currentTime, setCurrentTime] = useState(initialTime);
  return createElement(PlayerProvider, {
    value: playerValue({
      cues,
      currentTime,
      seek: (seconds: number) => {
        onSeek(seconds);
        setCurrentTime(seconds);
      },
    }),
    children: createElement(PlayerCuePads),
  });
}

describe("PlayerCuePads", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    setLocale("en");
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    flushSync(() => root.unmount());
    host.remove();
    resetTooltipState();
    setLocale("en");
    vi.unstubAllGlobals();
    await drainReactScheduler();
  });

  function stubReducedMotion(): void {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
  }

  it("renders eight pads, seeks a filled pad, and ignores an empty pad", () => {
    const seek = vi.fn();
    flushSync(() => {
      root.render(createElement(PadsHarness, { cues: NIGHT_CUES, onSeek: seek }));
    });
    const pads = host.querySelectorAll(".player-cue-pads .player-cue-pad");
    expect(pads).toHaveLength(8);
    expect(host.querySelector(".player-cue-pads")).not.toBeNull();
    expect(pads[0]?.tagName).toBe("BUTTON");
    expect(pads[0]?.getAttribute("type")).toBe("button");
    expect(pads[0]?.getAttribute("data-slot")).toBe("1");
    expect(pads[1]?.tagName).toBe("SPAN");
    expect(pads[1]?.classList.contains("player-cue-pad-empty")).toBe(true);
    expect(pads[1]?.getAttribute("data-slot")).toBe("2");
    expect(pads[3]?.tagName).toBe("BUTTON");
    expect(pads[3]?.getAttribute("data-slot")).toBe("4");

    flushSync(() => {
      (pads[0] as HTMLButtonElement).click();
    });
    expect(seek).toHaveBeenCalledWith(1.5);
    expect(host.querySelector('[data-slot="1"]')?.classList.contains("player-cue-pad-lit")).toBe(
      true,
    );

    seek.mockClear();
    flushSync(() => {
      (host.querySelector('[data-slot="2"]') as HTMLElement).click();
    });
    expect(seek).not.toHaveBeenCalled();
  });

  it("gives a filled pad a cue-jump tooltip that is not a copy of the aria-label", () => {
    stubReducedMotion();
    resetTooltipState();
    installTooltips();
    flushSync(() => {
      root.render(createElement(PadsHarness, { cues: NIGHT_CUES, onSeek: vi.fn() }));
    });
    const pad = host.querySelector('[data-slot="1"]');
    if (!(pad instanceof HTMLButtonElement)) throw new Error("missing filled pad");
    const aria = pad.getAttribute("aria-label") ?? "";
    const sentence = tipText(cueTip("Drop"));
    expect(sentence).toBe(t("tooltip.cue", { label: "Drop" }));
    expect(sentence).toContain("Drop");
    expect(pad.getAttribute("data-tooltip")).toBe(sentence);
    expect(pad.getAttribute("data-tooltip")).not.toBe(aria);
    expect(pad.getAttribute("data-tooltip-key")).toBe("tooltip.cue");
    expect(aria).toBe(t("markers.cue", { number: 1 }));

    pad.focus();
    const tip = document.getElementById(TOOLTIP_ID);
    if (!(tip instanceof HTMLElement)) throw new Error("missing tooltip");
    expect(tip.hidden).toBe(false);
    expect(tip.textContent).toBe(sentence);
    expect(pad.getAttribute("aria-describedby")).toContain(TOOLTIP_ID);

    pad.blur();
    expect(tip.hidden).toBe(true);
    pad.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }));
    expect(tip.hidden).toBe(false);
    expect(tip.textContent).toBe(sentence);
    pad.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, pointerType: "mouse" }));
    expect(tip.hidden).toBe(true);

    const empty = host.querySelector('[data-slot="2"]');
    expect(empty?.tagName).toBe("SPAN");
    expect(empty?.getAttribute("data-tooltip")).toBeNull();
    expect(empty?.getAttribute("tabindex")).toBeNull();

    pad.focus();
    setLocale("es");
    refreshTooltips();
    const spanish = t("tooltip.cue", { label: "Drop" });
    expect(spanish).toContain("Drop");
    expect(spanish).not.toBe(sentence);
    expect(pad.getAttribute("data-tooltip")).toBe(spanish);
    expect(pad.getAttribute("data-tooltip")).not.toBe(pad.getAttribute("aria-label"));
    expect(tip.textContent).toBe(spanish);
  });

  it("uses the pad name in the tooltip when the cue label is blank", () => {
    flushSync(() => {
      root.render(
        createElement(PadsHarness, {
          cues: [{ index: 0, seconds: 2, color: "#CC0000", label: "   " }],
          onSeek: vi.fn(),
        }),
      );
    });
    const pad = host.querySelector('[data-slot="1"]');
    if (!(pad instanceof HTMLButtonElement)) throw new Error("missing filled pad");
    const fallback = t("markers.cue", { number: 1 });
    expect(pad.getAttribute("data-tooltip")).toBe(tipText(cueTip(fallback)));
    expect(pad.getAttribute("data-tooltip")).not.toBe(pad.getAttribute("aria-label"));
    expect(pad.getAttribute("data-tooltip")).toContain(fallback);
  });

  it("lights the pad whose cue is nearest the playhead", () => {
    flushSync(() => {
      root.render(
        createElement(PlayerProvider, {
          value: playerValue({ cues: NIGHT_CUES, currentTime: 8 }),
          children: createElement(PlayerCuePads),
        }),
      );
    });
    expect(host.querySelector('[data-slot="4"]')?.classList.contains("player-cue-pad-lit")).toBe(
      true,
    );
    expect(host.querySelector('[data-slot="1"]')?.classList.contains("player-cue-pad-lit")).toBe(
      false,
    );
  });

  it("keeps track-detail CuePads as eight marker rows, not AppBar pad buttons", () => {
    flushSync(() => {
      root.render(createElement(CuePads, { cues: [] }));
    });
    expect(host.querySelectorAll(".marker")).toHaveLength(8);
    expect(host.querySelectorAll("button.player-cue-pad")).toHaveLength(0);
    expect(host.querySelector(".marker")?.tagName).toBe("DIV");
  });

  it("does not put index -1 or a duplicate pad index onto a later slot", () => {
    const seek = vi.fn();
    flushSync(() => {
      root.render(
        createElement(PadsHarness, {
          cues: [
            { index: 0, seconds: 1.5, color: "#CC0000", label: "Drop" },
            { index: 0, seconds: 9, color: "#FFFFFF", label: "Second" },
            { index: -1, seconds: 4, color: "#ABCDEF", label: "Loose" },
          ],
          onSeek: seek,
        }),
      );
    });
    const pad1 = host.querySelector('[data-slot="1"]') as HTMLButtonElement;
    const pad5 = host.querySelector('[data-slot="5"]');
    expect(pad1?.tagName).toBe("BUTTON");
    expect(pad5?.tagName).toBe("SPAN");
    flushSync(() => {
      pad1.click();
    });
    expect(seek).toHaveBeenCalledWith(1.5);
    expect(seek).not.toHaveBeenCalledWith(9);
    expect(seek).not.toHaveBeenCalledWith(4);
  });
});
