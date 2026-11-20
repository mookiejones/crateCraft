/**
 * Copy and restore portable smart crates.
 *
 * Check drive stays a GET. These actions POST /api/portable-smart.
 * Preview does not write. Copy and restore write only while Serato is quit.
 */

import { postJSON } from "../api";
import { state } from "../state";

export interface PortableSmartCrate {
  name: string;
  status: string;
  mode?: string;
  detail?: string;
}

export interface PortableSmartResult {
  ok?: boolean;
  action?: string;
  written?: boolean;
  preview?: boolean;
  status?: string;
  detail?: string;
  needs_overwrite?: boolean;
  needs_confirm?: boolean;
  snapshot_id?: string | null;
  crates?: PortableSmartCrate[];
}

/**
 * POST one portable-smart action for the open space.
 *
 * @param drive Volume root.
 * @param action preview, copy, or restore.
 * @param extra overwrite or confirm, when the person asked for that.
 * @returns The server result. A drive problem is ok false, not a throw.
 */
export function postPortableSmart(
  drive: string,
  action: "preview" | "copy" | "restore",
  extra: { overwrite?: boolean; confirm?: boolean } = {},
): Promise<PortableSmartResult> {
  const body: {
    action: "preview" | "copy" | "restore";
    drive: string;
    space: string;
    overwrite?: boolean;
    confirm?: boolean;
  } = { action, drive, space: state.space };
  if (extra.overwrite === true) body.overwrite = true;
  if (extra.confirm === true) body.confirm = true;
  return postJSON<PortableSmartResult>("/api/portable-smart", body);
}
