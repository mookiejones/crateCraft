/**
 * Mount a React island into an existing DOM host.
 *
 * The page is still mostly hand-written DOM. Each island wraps
 * `AppProviders` so list Play, detail Play, the player bar, and the
 * waveform share one player context, and the Snapshots view shares one
 * snapshots context. `flushSync` keeps the paint in the same turn as the
 * engine update.
 */

import { type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { AppProviders } from "./providers";

export type IslandRoot = Root;

/**
 * Render `node` into `host`, replacing any previous island on that host.
 *
 * @param host Element that already sits in the page.
 * @param node Tree to show. Providers wrap it.
 * @param existing Root from a previous paint of this host, when the host is reused.
 * @returns The React root. Call `unmount` before dropping the host.
 */
export function mountIsland(host: HTMLElement, node: ReactNode, existing?: Root): Root {
  const root = existing ?? createRoot(host);
  flushSync(() => {
    root.render(<AppProviders>{node}</AppProviders>);
  });
  return root;
}
