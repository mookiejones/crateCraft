/**
 * Cloud-only report painted by React.
 *
 * Counts explain local, cloud, missing, unknown, and unplugged. The
 * lists name the tracks. Nothing here downloads a file.
 */

import { useGig } from "../containers/GigContext";
import { cloudLocationText, cloudTrackLine } from "../lib/gig/cloud-files-view";
import { t } from "../lib/i18n";
import { GigDetailsGroup } from "./GigDetailsGroup";

/**
 * Legend, folder warnings, and the cloud-only and not-checked lists.
 */
export function CloudFilesReport() {
  const { cloud } = useGig();
  const payload = cloud.report;
  if (!payload) return null;
  const counts = payload.counts;
  const cloudLines = (payload.cloud_files || []).map(cloudTrackLine);
  const unknownLines = (payload.unknown_files || []).map(cloudTrackLine);
  const locations = payload.cloud_locations || [];
  return (
    <>
      <p className="gig-note">{t("cloud.download")}</p>
      <ul className="cloud-legend">
        <li>{t("cloud.legend.local", { count: counts?.local ?? 0 })}</li>
        <li>{t("cloud.legend.cloud", { count: counts?.cloud ?? 0 })}</li>
        <li>{t("cloud.legend.missing", { count: counts?.missing ?? 0 })}</li>
        <li>{t("cloud.legend.unknown", { count: counts?.unknown ?? 0 })}</li>
        <li>{t("cloud.legend.offline", { count: counts?.offline ?? 0 })}</li>
      </ul>
      {locations.map((item) => (
        <p key={`${item.role}:${item.path}`} className="gig-note" data-cloud-location={item.role}>
          {cloudLocationText(item)}
        </p>
      ))}
      {cloudLines.length
        ? <GigDetailsGroup label={t("cloud.group.cloud")} lines={cloudLines} />
        : <p className="gig-note">{t("cloud.empty")}</p>}
      {unknownLines.length
        ? <GigDetailsGroup label={t("cloud.group.unknown")} lines={unknownLines} />
        : null}
    </>
  );
}
