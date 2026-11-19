/**
 * startJob posts /api/jobs and skips polling a terminal reply.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postJSON = vi.hoisted(() => vi.fn());

vi.mock("../../../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../../../lib/api")>("../../../lib/api");
  return { ...actual, postJSON };
});

import type { Job } from "../../../lib/api-types";
import { resetJobs, startJob } from "../../../lib/jobs/job-store";

const success: Job = {
  id: "job-1",
  kind: "tag_spelling",
  label: "Fixing spellings",
  state: "success",
  done: 2,
  total: 2,
  current: "",
  errors: [],
  snapshot_id: "snap-1",
  cancelable: false,
  created_at: 0,
  finished_at: 1,
};

describe("job-store", () => {
  beforeEach(() => {
    resetJobs();
    postJSON.mockReset();
  });

  afterEach(() => {
    resetJobs();
  });

  it("returns a terminal job without polling", async () => {
    postJSON.mockResolvedValue(success);
    const result = await startJob({
      kind: "tag_spelling",
      space: "Serato Library",
      field: "genre",
      value: "Hip Hop",
    });
    expect(result).toEqual(success);
    expect(postJSON).toHaveBeenCalledWith("/api/jobs", {
      kind: "tag_spelling",
      space: "Serato Library",
      field: "genre",
      value: "Hip Hop",
    });
  });

  it("returns a Gig Lock queued body without treating it as a job", async () => {
    postJSON.mockResolvedValue({ queued: true, id: "q1", label: "Fix genre" });
    const result = await startJob({
      kind: "tag_spelling",
      space: "Serato Library",
      field: "genre",
      value: "Hip Hop",
    });
    expect(result).toEqual({ queued: true, id: "q1", label: "Fix genre" });
  });
});
