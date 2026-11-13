/** Synthetic library for Crates layout checks. No live files or API writes. */
import { mountAppShell } from "../src/lib/ui/app-shell";
import { mountPlayer } from "../src/lib/player/player";
import { state } from "../src/lib/state";
import { paintNav } from "../src/lib/ui/nav";
import { paintSheetChrome } from "../src/lib/ui/sheet-chrome";
import { mountTrackList, paintRows } from "../src/lib/ui/virtual-scroll";
import { renderCrates } from "../src/lib/ui/views";
import { applyStaticTooltips, installTooltips } from "../src/lib/ui/tooltip";
import { saveColorway } from "../src/lib/ui/settings";
import { applyStatic, setLocale } from "../src/lib/i18n";

declare global {
  interface Window { cratesFixture: { setColorway: typeof saveColorway }; }
}
window.fetch = () => Promise.resolve(new Response("{}", { headers: { "Content-Type": "application/json" } }));
window.cratesFixture = { setColorway: saveColorway };
setLocale(document.documentElement.lang === "es" ? "es" : "en");
applyStatic(document);

state.rootId = 1;
state.mode = "crates";
state.writable = false;
state.activeCrate = 2;
state.crates = [
  { id: 2, name: "Saturday night", parent: 1, order: 0 },
  { id: 3, name: "Warm up", parent: 2, order: 0 },
  { id: 4, name: "Peak time", parent: 2, order: 1 },
  { id: 5, name: "After hours", parent: 1, order: 1 },
];
state.expanded = new Set([2]);
state.tracks = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  name: ["Night drive", "Daybreak", "In the groove", "Slow motion"][index % 4]!,
  artist: ["Ada", "The Signals", "Mira", "Sol Collective"][index % 4]!,
  genre: "House", bpm: 120 + index % 8, key: `${index % 12 + 1}A`,
  length_ms: 240000 + index * 1000, play_count: index + 2,
}));
state.byId = new Map(state.tracks.map((track) => [track.id, track]));
state.view = state.tracks;
state.crateTracks = new Map([[2, new Set(state.tracks.map((track) => track.id))]]);
mountAppShell();
mountPlayer();
mountTrackList();
renderCrates();
paintRows();
paintNav("crates");
paintSheetChrome({ mode: "crates", space: state.space, activeCrate: 2, crates: state.crates });
document.getElementById("count")!.textContent = "24 tracks";
document.getElementById("status")!.textContent = "Example library";
document.getElementById("crate-pane-b")!.hidden = true;
applyStaticTooltips();
installTooltips();
document.body.dataset.crates = "ready";
