/**
 * Held backups and duplicate audio under Backups.
 *
 * Restore and cancel stay available. Remove permanently waits until the
 * restore window ends. A cancelled item stays until a later remove.
 */

import Button from "@mui/material/Button";
import { useSnapshots } from "../containers/SnapshotsContext";
import type { TrashItem } from "../lib/api-types";
import { t } from "../lib/i18n";
import { tips } from "../lib/ui/tooltip-strings";
import { tooltipRef } from "./tooltip-ref";

function heldNote(item: TrashItem): string {
  if (item.label === "cancelled") return t("snapshots.trashCancelled");
  if (item.label === "due") return t("snapshots.trashDue");
  return t("snapshots.trashHeld", { days: item.days_left });
}

function TrashActions({ item }: { item: TrashItem }) {
  const snapshots = useSnapshots();
  const cancelOff = item.label === "cancelled";
  const purgeOff = item.label !== "due";
  return (
    <div className="trash-actions">
      <span ref={tooltipRef(tips.trashRestore)}>
        <Button
          id={`trash-restore-${item.id}`}
          type="button"
          size="small"
          onClick={() => {
            snapshots.restoreTrash(item.id).catch((error: unknown) => snapshots.failSnapshots(error));
          }}
        >
          {t("snapshots.trashRestore")}
        </Button>
      </span>
      <span ref={tooltipRef(tips.trashCancel)}>
        <Button
          id={`trash-cancel-${item.id}`}
          type="button"
          size="small"
          disabled={cancelOff}
          onClick={() => {
            snapshots.cancelTrash(item.id).catch((error: unknown) => snapshots.failSnapshots(error));
          }}
        >
          {t("snapshots.trashCancel")}
        </Button>
      </span>
      <span ref={tooltipRef(tips.trashPurge)}>
        <Button
          id={`trash-purge-${item.id}`}
          type="button"
          size="small"
          disabled={purgeOff}
          onClick={() => {
            snapshots.purgeTrash(item.id).catch((error: unknown) => snapshots.failSnapshots(error));
          }}
        >
          {t("snapshots.trashPurge")}
        </Button>
      </span>
    </div>
  );
}

/**
 * Removed items on the Backups page.
 *
 * An empty list still names the section.
 */
export function TrashHeldList() {
  const snapshots = useSnapshots();
  return (
    <section id="trash-held" aria-labelledby="trash-held-heading">
      <h2 id="trash-held-heading">{t("snapshots.trashHeading")}</h2>
      {snapshots.trash.length === 0 ? (
        <p className="empty-list">{t("snapshots.trashEmpty")}</p>
      ) : (
        <ul>
          {snapshots.trash.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <span>{heldNote(item)}</span>
              <TrashActions item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
