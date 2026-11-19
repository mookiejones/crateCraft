/**
 * JobToast Undo and View details on a finished job.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "../../lib/api-types";
import { JobToast } from "../../components/JobToast";
import { JobProvider, idleJobValue } from "../../containers/JobContext";
import { t, setLocale } from "../../lib/i18n";
import { installPage } from "../test-page";

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

describe("JobToast", () => {
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

  it("renders nothing when there is no toast", () => {
    flushSync(() => {
      root.render(
        createElement(JobProvider, {
          value: idleJobValue(),
          children: createElement(JobToast),
        }),
      );
    });
    expect(document.getElementById("job-toast")).toBeNull();
  });

  it("shows Undo and View details on success", () => {
    const undoJob = vi.fn(async () => ({}));
    const openDetails = vi.fn();
    flushSync(() => {
      root.render(
        createElement(JobProvider, {
          value: { ...idleJobValue(), toast: success, undoJob, openDetails },
          children: createElement(JobToast),
        }),
      );
    });
    const banner = document.getElementById("job-toast");
    expect(banner?.textContent).toContain("Fixing spellings finished.");
    expect(banner?.getAttribute("role")).toBe("status");
    expect(document.getElementById("job-undo")?.textContent).toBe(t("jobs.undo"));
    document.getElementById("job-details")?.click();
    expect(openDetails).toHaveBeenCalledWith(success);
  });

  it("uses role alert for a failed job and hides Undo without a snapshot", () => {
    flushSync(() => {
      root.render(
        createElement(JobProvider, {
          value: {
            ...idleJobValue(),
            toast: { ...success, state: "failed", snapshot_id: null, errors: ["Could not write."] },
          },
          children: createElement(JobToast),
        }),
      );
    });
    expect(document.getElementById("job-toast")?.getAttribute("role")).toBe("alert");
    expect(document.getElementById("job-undo")).toBeNull();
  });
});
