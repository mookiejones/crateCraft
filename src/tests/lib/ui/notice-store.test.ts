/**
 * Global action-flash notice: one banner, last write wins.
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  dismissNotice,
  getNotice,
  resetNotice,
  setNotice,
  subscribeNotice,
} from "../../../lib/ui/notice-store";

describe("notice-store", () => {
  afterEach(() => {
    resetNotice();
  });

  it("starts empty", () => {
    expect(getNotice()).toBeNull();
  });

  it("stores text with a default info severity", () => {
    setNotice("Saved.");
    expect(getNotice()).toEqual({ text: "Saved.", severity: "info" });
  });

  it("stores an explicit error severity", () => {
    setNotice("That file is not on disk.", "error");
    expect(getNotice()).toEqual({
      text: "That file is not on disk.",
      severity: "error",
    });
  });

  it("replaces the previous notice", () => {
    setNotice("Saved.", "success");
    setNotice("That file is not on disk.", "error");
    expect(getNotice()).toEqual({
      text: "That file is not on disk.",
      severity: "error",
    });
  });

  it("clears on empty text", () => {
    setNotice("Saved.");
    setNotice("");
    expect(getNotice()).toBeNull();
  });

  it("clears on dismiss", () => {
    setNotice("Saved.");
    dismissNotice();
    expect(getNotice()).toBeNull();
  });

  it("notifies subscribers and unsubscribes", () => {
    const seen: Array<string | null> = [];
    const stop = subscribeNotice(() => {
      seen.push(getNotice()?.text ?? null);
    });
    setNotice("Saved.");
    stop();
    setNotice("Next.");
    expect(seen).toEqual(["Saved."]);
  });
});
