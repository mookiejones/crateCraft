/**
 * JobProgress shows a count, Cancel, and hides when idle.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "../../lib/api-types";
import { JobProgress } from "../../components/JobProgress";
import { setLocale, t } from "../../lib/i18n";
import { installPage } from "../test-page";

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

describe("JobProgress", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

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
  });

  it("renders nothing when idle", () => {
    flushSync(() => {
      root.render(createElement(JobProgress, { job: null }));
    });
    expect(host.querySelector("#job-progress")).toBeNull();
  });

  it("shows determinate progress and Cancel", () => {
    const onCancel = vi.fn();
    flushSync(() => {
      root.render(createElement(JobProgress, { job: running, onCancel }));
    });
    expect(host.querySelector("#job-progress")?.getAttribute("aria-live")).toBe("polite");
    expect(host.querySelector("#job-progress-text")?.textContent).toBe(
      "Fixing spellings: 120 / 450",
    );
    const cancel = host.querySelector<HTMLButtonElement>("#job-cancel");
    expect(cancel?.textContent).toBe(t("jobs.cancel"));
    cancel?.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("hides Cancel after the write is no longer cancelable", () => {
    flushSync(() => {
      root.render(createElement(JobProgress, {
        job: { ...running, cancelable: false },
        onCancel: vi.fn(),
      }));
    });
    expect(host.querySelector("#job-cancel")).toBeNull();
  });
});
