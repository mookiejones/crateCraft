/**
 * Format the server prepped mark for one track row.
 *
 * The server decides the tri-state. This module only builds the sentence.
 * A true mark with a missing or unknown piece is shown as not checked.
 */

import type { Track } from "../api-types";
import { t, type MessageKey } from "../i18n";
import type { TipSpec } from "./tooltip-strings";

export const PREPPED_PIECES = ["cues", "analysed", "file"] as const;

export type PreppedPiece = (typeof PREPPED_PIECES)[number];

const PIECE_KEY: Record<PreppedPiece, MessageKey> = {
  cues: "track.preppedPiece.cues",
  analysed: "track.preppedPiece.analysed",
  file: "track.preppedPiece.file",
};

export type PreppedView = {
  state: "prepped" | "missing" | "unknown";
  visible: string;
  sentence: string;
  tip: TipSpec;
};

function named(value: unknown): PreppedPiece[] {
  if (!Array.isArray(value)) return [];
  const found = new Set(value);
  return PREPPED_PIECES.filter((piece) => found.has(piece));
}

function joinPieces(list: PreppedPiece[]): string {
  return list.map((piece) => t(PIECE_KEY[piece])).join(", ");
}

function view(state: PreppedView["state"], visible: string, tip: TipSpec): PreppedView {
  const sentence = tip.params ? t(tip.key, tip.params) : t(tip.key);
  return { state, visible, sentence, tip };
}

/**
 * Build the mark for a library row.
 *
 * History rows omit `prepped` and get no mark. Unknown is never the
 * prepped sentence.
 *
 * @param track Row from the library payload.
 * @returns The mark, or null when the row has no prepped field.
 */
export function preppedView(track: Track): PreppedView | null {
  if (!Object.prototype.hasOwnProperty.call(track, "prepped")) return null;
  const missing = named(track.prepped_missing);
  const unknown = named(track.prepped_unknown);
  const missingText = joinPieces(missing);
  const unknownText = joinPieces(unknown);
  if (track.prepped === true && missing.length === 0 && unknown.length === 0) {
    return view("prepped", t("track.prepped"), { key: "tooltip.prepped" });
  }
  if (missing.length > 0 && unknown.length > 0) {
    return view("unknown", t("track.preppedMixedDetail", { missing: missingText, unknown: unknownText }), {
      key: "tooltip.preppedMixed",
      params: { missing: missingText, unknown: unknownText },
    });
  }
  if (unknown.length > 0 || track.prepped !== false) {
    const pieces = unknownText || missingText || t("track.preppedUnchecked");
    return view("unknown", t("track.preppedUncheckedDetail", { pieces }), {
      key: "tooltip.preppedUnknown",
      params: { pieces },
    });
  }
  if (missing.length === 0) {
    return view("missing", t("track.notPrepped"), {
      key: "tooltip.preppedMissing",
      params: { pieces: t("track.notPrepped") },
    });
  }
  return view("missing", t("track.notPreppedDetail", { pieces: missingText }), {
    key: "tooltip.preppedMissing",
    params: { pieces: missingText },
  });
}
