/**
 * Copy for the local-mirror dialog (#116).
 *
 * The dialog posts. These helpers only pick the sentence.
 */

import { t } from "../i18n";

export type LocalMirrorReason = "already_local" | "all_streaming" | "generated";

/** Preview or create body from `/api/local-mirror`. */
export interface LocalMirrorReply {
  crate?: number;
  crate_name?: string;
  folder?: string;
  parent?: string;
  name?: string;
  local_count?: number;
  streaming_count?: number;
  sample?: Array<{ id: number; name: string; artist: string }>;
  streaming?: Array<{ id: number; name: string; artist: string; service: string }>;
  written?: boolean;
  existing?: { id: number; name: string } | null;
  reason?: LocalMirrorReason | null;
  preview?: boolean;
  count?: number;
  id?: number;
  replaced?: { id: number; name: string } | null;
  queued?: boolean;
  warning?: string;
}

const BLOCKED: ReadonlySet<string> = new Set(["already_local", "all_streaming", "generated"]);

/**
 * Return whether Create must stay off.
 *
 * A missing reply, and a crate that is already local, all streaming, or
 * already generated, cannot be written.
 *
 * @param reply Preview body, or null before it arrives.
 */
export function localMirrorBlocked(reply: LocalMirrorReply | null): boolean {
  if (reply === null) return true;
  return reply.reason != null && BLOCKED.has(reply.reason);
}

/**
 * Return the preview sentence for one plan.
 *
 * @param reply Preview body.
 */
export function localMirrorSummary(reply: LocalMirrorReply): string {
  const crate = reply.crate_name ?? "";
  if (reply.reason === "already_local") return t("localMirror.already", { crate });
  if (reply.reason === "all_streaming") return t("localMirror.allStreaming", { crate });
  if (reply.reason === "generated") return t("localMirror.generated");
  return t("localMirror.summary", {
    local: reply.local_count ?? 0,
    name: reply.name ?? "",
    streaming: reply.streaming_count ?? 0,
    crate,
  });
}

/**
 * Return the notice after a mirror is written.
 *
 * @param reply Create body.
 */
export function localMirrorDone(reply: LocalMirrorReply): string {
  const count = reply.count ?? reply.local_count ?? 0;
  return t("localMirror.done", { name: reply.name ?? "", count });
}
