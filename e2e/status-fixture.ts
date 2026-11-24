/**
 * Fake /api/status that flips from Serato open to a coded write block.
 *
 * The poll (and Check again) must refresh the banner without a reload.
 */

import { applyStatus, setNotice } from "../src/lib/ui/views";
import { wireStatusPoll } from "../src/lib/ui/status-poll";
import { mountAppShell } from "../src/lib/ui/app-shell";
import { applyStaticTooltips, installTooltips } from "../src/lib/ui/tooltip";
import { setLocale } from "../src/lib/i18n";

const openStatus = {
  writable: false,
  open: true,
  serato_running: true,
  message: "Serato DJ Pro is open. Edits stay off until it quits.",
};

const quitBlocked = {
  writable: false,
  open: false,
  serato_running: false,
  code: "serato_version_unknown",
  params: { build: "unknown" },
  message: "Serato version is unknown (build unknown).",
};

/** After the first paint (open), every /api/status read is Serato quit + coded block. */
window.fetch = (input: RequestInfo | URL) => {
  const url = String(input);
  if (!url.includes("/api/status")) {
    return Promise.resolve(
      new Response("{}", { status: 404, headers: { "Content-Type": "application/json" } }),
    );
  }
  return Promise.resolve(
    new Response(JSON.stringify(quitBlocked), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
};

try {
  setLocale("en");
  installTooltips();
  applyStaticTooltips();
  mountAppShell();
  applyStatus(openStatus);
  wireStatusPoll({ applyStatus, setNotice });
  document.body.dataset.status = "ready";
} catch (error: unknown) {
  document.body.dataset.status = "failed";
  document.body.dataset.statusError = error instanceof Error ? error.message : String(error);
}
