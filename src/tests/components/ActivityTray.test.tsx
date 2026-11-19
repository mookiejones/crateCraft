/**
 * Activity tray accessible name is not the tooltip sentence.
 */

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Job } from "../../lib/api-types";
import { ActivityTray } from "../../components/ActivityTray";
import { JobProvider, idleJobValue } from "../../containers/JobContext";
import { t, setLocale } from "../../lib/i18n";
import { installPage } from "../test-page";

const running: Job = {
  id: "job-1",
  kind: "tag_spelling",
  label: "Fixing spellings",
  state: "running",
  done: 1,
  total: 2,
  current: "Hip-Hop",
  errors: [],
  snapshot_id: null,
  cancelable: true,
  created_at: 0,
  finished_at: null,
};

describe("ActivityTray", () => {
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

  it("keeps the tray aria-label different from the tooltip key", () => {
    flushSync(() => {
      root.render(
        createElement(JobProvider, {
          value: { ...idleJobValue(), jobs: [running], running },
          children: createElement(ActivityTray),
        }),
      );
    });
    const button = host.querySelector<HTMLButtonElement>("#jobs-tray");
    expect(button?.getAttribute("aria-label")).toBe(t("jobs.tray"));
    expect(button?.getAttribute("aria-label")).not.toBe(t("tooltip.jobsTray"));
  });
});
