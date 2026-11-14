/** Findability chrome for keyboard, names, and axe. No live library. */
import { mountAppShell } from "../src/lib/ui/app-shell";
import { mountPlayer } from "../src/lib/player/player";
import { state } from "../src/lib/state";
import { paintNav } from "../src/lib/ui/nav";
import { paintSheetChrome } from "../src/lib/ui/sheet-chrome";
import { mountSharedDialogs } from "../src/lib/ui/shared-dialog-mount";
import { wireShortcuts } from "../src/lib/ui/shortcuts";
import { mountTrackList, paintRows } from "../src/lib/ui/virtual-scroll";
import { applyIncomingHash, renderCrates, wireHashRoutes } from "../src/lib/ui/views";
import { applyStaticTooltips, installTooltips } from "../src/lib/ui/tooltip";
import { isColorway, patchSettings, type Colorway } from "../src/lib/ui/settings";
import { applyStatic, setLocale } from "../src/lib/i18n";

function setA11yColorway(next: Colorway): void {
  if (!isColorway(next)) return;
  document.documentElement.dataset.colorway = next;
  patchSettings({ colorway: next });
}

declare global {
  interface Window {
    a11yFixture: {
      setColorway: (next: Colorway) => void;
      applyIncomingHash: typeof applyIncomingHash;
    };
  }
}

window.fetch = () => Promise.resolve(new Response("{}", { headers: { "Content-Type": "application/json" } }));
window.a11yFixture = { setColorway: setA11yColorway, applyIncomingHash };
setLocale(document.documentElement.lang === "es" ? "es" : "en");
applyStatic(document);

state.rootId = 1;
state.mode = "crates";
state.writable = true;
state.activeCrate = 2;
state.crates = [
  { id: 2, name: "Saturday night", parent: 1, order: 0 },
  { id: 3, name: "Warm up", parent: 2, order: 0 },
];
state.expanded = new Set([2]);
state.tracks = [
  { id: 1, name: "Night drive", artist: "Ada", genre: "House", bpm: 122, key: "8A", length_ms: 240000 },
];
state.byId = new Map(state.tracks.map((track) => [track.id, track]));
state.view = state.tracks;
state.crateTracks = new Map([[2, new Set([1])]]);
mountAppShell();
mountPlayer();
mountTrackList();
mountSharedDialogs();
renderCrates();
paintRows();
paintNav("crates");
paintSheetChrome({ mode: "crates", space: state.space, activeCrate: 2, crates: state.crates });
wireShortcuts();
wireHashRoutes();
applyStaticTooltips();
installTooltips();
document.body.dataset.a11y = "ready";
