/**
 * Pure labels for the Won't play report.
 *
 * Strings come from the locale catalogs. A verdict is a word plus a shape.
 * Unknown is a check that did not run, or a file that could not be read.
 */

import type { PlayerCompatLimit, PlayerCompatReport, PlayerCompatTrack } from "../api-types";
import { t, type MessageKey } from "../i18n";
import { state } from "../state";

const REASON_KEYS: Record<string, MessageKey> = {
  wav_extensible: "players.reason.wav_extensible",
  wav_float: "players.reason.wav_float",
  wav_not_pcm: "players.reason.wav_not_pcm",
  aiff_c: "players.reason.aiff_c",
  aiff_float: "players.reason.aiff_float",
  sample_rate: "players.reason.sample_rate",
  bit_depth: "players.reason.bit_depth",
  bitrate: "players.reason.bitrate",
  mp3_version: "players.reason.mp3_version",
  format_not_listed: "players.reason.format_not_listed",
  he_aac: "players.reason.he_aac",
  aac_not_lc: "players.reason.aac_not_lc",
  drm: "players.reason.drm",
  extension_mismatch: "players.reason.extension_mismatch",
  vbr_no_xing: "players.reason.vbr_no_xing",
  bitrate_unreadable: "players.reason.bitrate_unreadable",
  aac_unreadable: "players.reason.aac_unreadable",
  offline: "players.reason.offline",
  missing: "players.reason.missing",
  unreadable: "players.reason.unreadable",
  empty: "players.reason.empty",
  unrecognized: "players.reason.unrecognized",
};

const FIX_KEYS: Record<string, MessageKey> = {
  export_pcm: "players.fix.export_pcm",
  export_rate: "players.fix.export_rate",
  export_aac_lc: "players.fix.export_aac_lc",
  export_mp3: "players.fix.export_mp3",
  export_bitrate: "players.fix.export_bitrate",
  rename: "players.fix.rename",
  replace_file: "players.fix.replace_file",
  add_xing: "players.fix.add_xing",
  check_deck: "players.fix.check_deck",
  connect_drive: "players.fix.connect_drive",
  find_file: "players.fix.find_file",
  none: "players.fix.none",
};

const CODEC_KEYS: Record<string, MessageKey> = {
  wav: "players.codec.wav",
  "wav-extensible": "players.codec.wav_extensible",
  "wav-float": "players.codec.wav_float",
  "wav-not-pcm": "players.codec.wav_not_pcm",
  aiff: "players.codec.aiff",
  "aiff-c": "players.codec.aiff_c",
  "aiff-float": "players.codec.aiff_float",
  flac: "players.codec.flac",
  alac: "players.codec.alac",
  "aac-lc": "players.codec.aac_lc",
  "he-aac": "players.codec.he_aac",
  aac: "players.codec.aac",
  mp3: "players.codec.mp3",
  drm: "players.codec.drm",
  ogg: "players.codec.ogg",
  mpeg1: "players.codec.mpeg1",
  mpeg2: "players.codec.mpeg2",
  mpeg25: "players.codec.mpeg25",
  unknown: "players.codec.unknown",
};

const NOTE_KEYS: Record<string, MessageKey> = {
  club_flac: "players.note.club_flac",
  club_alac: "players.note.club_alac",
  club_mp3_rate: "players.note.club_mp3_rate",
  club_mp3_mpeg2: "players.note.club_mp3_mpeg2",
  club_wav_rate: "players.note.club_wav_rate",
  club_aac_rate: "players.note.club_aac_rate",
  club_exfat: "players.note.club_exfat",
};

const VERDICT_KEYS: Record<string, MessageKey> = {
  will_play: "players.verdict.will_play",
  check_first: "players.verdict.check_first",
  wont_play: "players.verdict.wont_play",
  unknown: "players.verdict.unknown",
};

/**
 * Crate name for the scope line, or the whole-space sentence.
 *
 * @returns Scope label for the open crate.
 */
export function playersScopeLabel(): string {
  if (state.activeCrate === "all") return t("gig.wholeSpace");
  const crate = state.crates.find((row) => row.id === state.activeCrate);
  return crate?.name || t("gig.wholeSpace");
}

/**
 * Translated name of a codec id. An unknown id stays the id.
 *
 * @param codec Codec id from the report.
 * @returns Label in the active language.
 */
export function codecLabel(codec: string): string {
  const key = CODEC_KEYS[codec];
  return key ? t(key) : codec;
}

/**
 * Translated verdict word.
 *
 * @param verdict `will_play`, `check_first`, `wont_play`, or `unknown`.
 * @returns Label in the active language.
 */
export function verdictLabel(verdict: string): string {
  const key = VERDICT_KEYS[verdict];
  return key ? t(key) : verdict;
}

function limitFor(codec: string, limits: readonly PlayerCompatLimit[]): PlayerCompatLimit | undefined {
  const kind = codec.startsWith("wav")
    ? "wav"
    : codec.startsWith("aiff")
      ? "aiff"
      : codec === "flac"
        ? "flac"
        : codec === "alac"
          ? "alac"
          : codec === "mp3"
            ? "mp3"
            : codec === "aac" || codec === "aac-lc" || codec === "he-aac"
              ? "aac"
              : "";
  return limits.find((row) => row.kind === kind);
}

function reasonLine(code: string, track: PlayerCompatTrack, limits: readonly PlayerCompatLimit[]): string {
  const key = REASON_KEYS[code];
  if (!key) return code;
  const limit = limitFor(track.codec, limits);
  const rates = (limit?.rates ?? []).join(", ");
  const depths = (limit?.depths ?? []).join(", ");
  const versions = (limit?.versions ?? []).map((item) => codecLabel(item)).join(", ");
  return t(key, {
    rate: track.rate_hz ?? "",
    depth: track.depth ?? "",
    bitrate: track.bitrate_kbps ?? "",
    rates,
    depths,
    versions,
    min: limit?.min_kbps ?? "",
    max: limit?.max_kbps ?? "",
    extension: track.extension,
    codec: codecLabel(track.codec),
    version: codecLabel(track.version || "unknown"),
  });
}

/**
 * Reasons for one track, in the active language.
 *
 * @param track One report row.
 * @param limits Format rows for the chosen player.
 * @returns Sentences separated by a space.
 */
export function reasonText(track: PlayerCompatTrack, limits: readonly PlayerCompatLimit[]): string {
  return track.reasons.map((code) => reasonLine(code, track, limits)).join(" ");
}

/**
 * The fix sentence for one track.
 *
 * @param fix Fix code from the report.
 * @returns Label in the active language.
 */
export function fixText(fix: string): string {
  const key = FIX_KEYS[fix];
  return key ? t(key) : fix;
}

/**
 * One stricter-reading note, or the code when it has no sentence.
 *
 * @param code Note id from the club profile.
 * @returns Label in the active language.
 */
export function noteText(code: string): string {
  const key = NOTE_KEYS[code];
  return key ? t(key) : code;
}

/**
 * Keep the rows the Show menu asked for.
 *
 * `problems` is won't-play and check-first. `all` keeps every row,
 * including will-play and unknown.
 *
 * @param tracks Report rows.
 * @param show Show-menu value.
 * @returns The rows to paint.
 */
export function visibleTracks(tracks: readonly PlayerCompatTrack[], show: string): PlayerCompatTrack[] {
  if (show === "all") return [...tracks];
  if (show === "problems") {
    return tracks.filter((row) => row.verdict === "wont_play" || row.verdict === "check_first");
  }
  return tracks.filter((row) => row.verdict === show);
}

export type PlayersViewRow = {
  id: number;
  title: string;
  file: string;
  verdict: string;
  result: string;
  reason: string;
  fix: string;
};

/**
 * Grid rows for the tracks the Show menu keeps.
 *
 * @param report Loaded report.
 * @param show Show-menu value.
 * @returns Rows in report order.
 */
export function playersViewRows(report: PlayerCompatReport, show: string): PlayersViewRow[] {
  return visibleTracks(report.tracks, show).map((track) => ({
    id: track.id,
    title: track.artist ? `${track.name} — ${track.artist}` : track.name,
    file: track.file,
    verdict: track.verdict,
    result: verdictLabel(track.verdict),
    reason: reasonText(track, report.limits),
    fix: fixText(track.fix),
  }));
}
