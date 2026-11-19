/**
 * Progress and toast copy for write jobs.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { Job } from "../../../lib/api-types";
import { setLocale } from "../../../lib/i18n";
import {
  isActive,
  isJob,
  isTerminal,
  progressText,
  toastSeverity,
  toastText,
} from "../../../lib/jobs/job-view";

const running: Job = {
  id: "job-1",
  kind: "tag_spelling",
  label: "Fixing spellings",
  state: "running",
  done: 120,
  total: 450,
  current: "Hip-Hop",
  errors: [],
  snapshot_id: null,
  cancelable: true,
  created_at: 0,
  finished_at: null,
};

describe("job-view", () => {
  beforeEach(() => {
    setLocale("en");
  });

  it("names determinate progress with the job label", () => {
    expect(progressText(running)).toBe("Fixing spellings: 120 / 450");
    expect(isActive(running)).toBe(true);
    expect(isTerminal(running.state)).toBe(false);
  });

  it("uses the unknown-total line when total is 0", () => {
    expect(progressText({ ...running, total: 0 })).toBe("Fixing spellings…");
  });

  it("picks toast copy and severity from the terminal state", () => {
    expect(toastText({ ...running, state: "success" })).toBe("Fixing spellings finished.");
    expect(toastSeverity("success")).toBe("success");
    expect(toastSeverity("partial")).toBe("warning");
    expect(toastSeverity("failed")).toBe("error");
    expect(toastSeverity("cancelled")).toBe("info");
  });

  it("narrows a job object and rejects a queued body", () => {
    expect(isJob(running)).toBe(true);
    expect(isJob({ queued: true })).toBe(false);
  });
});
