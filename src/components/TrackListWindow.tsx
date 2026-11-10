/**
 * Visible window of the virtualized track list.
 *
 * The spacer still lives in the DOM. This island paints only the rows
 * inside the scroll window, plus six extra rows each side.
 */

import { t } from "../lib/i18n";
import { useTrackList } from "../containers/TrackListContext";
import { TrackRow } from "./TrackRow";

export type TrackListWindowProps = {
  pane: "a" | "b";
  start: number;
  end: number;
  onFocusList: () => void;
};

/**
 * Rows for one list pane.
 *
 * @param props Pane, the visible index range, and a focus callback.
 */
export function TrackListWindow({ pane, start, end, onFocusList }: TrackListWindowProps) {
  const list = useTrackList();
  const view = pane === "b" ? list.viewB : list.view;
  if (!view.length) {
    const empty = list.duplicatesPending ? t("list.readingDuplicates") : t("list.noMatches");
    return <p className="empty-list">{empty}</p>;
  }
  return (
    <>
      {view.slice(start, end).map((track) => (
        <TrackRow
          key={track.id}
          track={track}
          selected={track.id === list.selectedId}
          onFocusList={onFocusList}
        />
      ))}
    </>
  );
}
