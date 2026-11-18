/**
 * Copy-count chip text for the crate actions row.
 *
 * Destinations come from GET /api/library `copies`. Laptop and snapshot
 * names use locale keys. Other names stay as the server sent them.
 */

import type { LibraryCopyDestination, LibraryCopies } from "../api-types";
import { t } from "../i18n";

function destinationLabel(destination: LibraryCopyDestination): string {
  if (destination.kind === "live" || destination.name === "laptop") {
    return t("copies.laptop");
  }
  if (destination.kind === "snapshot" || destination.name === "snapshot") {
    return t("copies.snapshot");
  }
  return destination.name;
}

/**
 * Chip label for verified library copies.
 *
 * @param copies GET /api/library `copies`, or missing.
 * @returns Localized count and destination names, or empty.
 */
export function copiesChipText(copies: LibraryCopies | null | undefined): string {
  if (!copies || copies.verified < 1) return "";
  const names = copies.destinations.map(destinationLabel).join(", ");
  return t("copies.count", { count: copies.verified, names });
}
