/**
 * Mount the gig check and Tempo drift React screens.
 *
 * The spec loads index.html first. Fetch returns one synthetic report
 * for each endpoint. Nothing is written.
 */

import { loadDrift, wireDrift } from "../src/lib/gig/drift";
import { loadGigCheck, wireGigCheck } from "../src/lib/gig/gig";
import { state } from "../src/lib/state";

window.fetch = (input: RequestInfo | URL) => {
  const url = String(input);
  const body = url.includes("/api/tempo-drift")
    ? {
      crate: 5,
      checked: 4,
      not_found: 0,
      unreadable: 0,
      too_quiet: 0,
      unchecked: 0,
      mapped: 0,
      flags: [
        {
          id: 1,
          name: "Old Tape",
          artist: "A",
          file: "tape.wav",
          reasons: ["drifting"],
          bpm_min: 90,
          bpm_max: 120,
        },
      ],
    }
    : {
      ready: false,
      score: 72,
      hard_red: true,
      holding_it_back: [{ code: "missing_files", points: 8, hard_red: true, summary: "1 missing file." }],
      missing_files: [{ path: "/Music/gone.mp3", title: "Gone", artist: "A", crate: "Friday" }],
      unavailable_drives: [{ name: "GIGDRIVE", track_count: 2, crates: ["Friday"] }],
      streaming_tracks: [],
      empty_crates: [],
      snapshot_note: "",
      changes: {
        crates_added: [],
        crates_removed: [],
        crates_edited: [],
        tracks_added: [],
        tracks_removed: [],
        cues_edited: [],
        grids_edited: [],
        tags_edited: [],
      },
      scope: { space: "Serato Library", crate_id: 5, crate_name: "Friday" },
    };
  return Promise.resolve(new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
};

state.space = "Serato Library";
state.activeCrate = 5;
state.crates = [{ id: 5, name: "Friday" }];
wireGigCheck(() => {});
wireDrift();
const gigPanel = document.getElementById("gig-panel");
const driftPanel = document.getElementById("drift-panel");
if (gigPanel) gigPanel.hidden = false;
if (driftPanel) driftPanel.hidden = false;

void Promise.all([loadGigCheck(), loadDrift()]).then(() => {
  document.body.dataset.gig = "ready";
}).catch(() => {
  document.body.dataset.gig = "failed";
});
