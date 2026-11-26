/**
 * English reason labels are the server codes. Spanish uses other words.
 */

import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../lib/i18n";
import { UNPLAYABLE_REASONS, unplayableLabel } from "../lib/tracks/unplayable-reason";

describe("unplayable reasons", () => {
  afterEach(() => {
    setLocale("en");
  });

  it("uses the five English codes as the visible labels", () => {
    setLocale("en");
    expect(UNPLAYABLE_REASONS.map((reason) => unplayableLabel(reason))).toEqual([
      "streaming",
      "drive offline",
      "file missing",
      "no path",
      "unknown",
    ]);
  });

  it("uses different Spanish words", () => {
    setLocale("es");
    for (const reason of UNPLAYABLE_REASONS) {
      expect(unplayableLabel(reason)).not.toBe(reason);
    }
    expect(unplayableLabel("drive offline")).toBe("unidad desconectada");
    expect(unplayableLabel("file missing")).toBe("archivo ausente");
    expect(unplayableLabel("no path")).toBe("sin ruta");
    expect(unplayableLabel("streaming")).toBe("en streaming");
    expect(unplayableLabel("unknown")).toBe("desconocido");
  });
});
