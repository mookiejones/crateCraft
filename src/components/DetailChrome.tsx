/**
 * Sticky title, section chips, and cards for the track detail pane.
 *
 * The scroll parent is `.detail`. Chips are buttons, not tabs.
 * Collapse is remembered for every track.
 */

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import QueueMusicIcon from "@mui/icons-material/QueueMusic";
import SellIcon from "@mui/icons-material/Sell";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { queueTrack } from "../lib/batch/batch-store";
import { bridge } from "../lib/bridge";
import { colorHex } from "../lib/format";
import { t } from "../lib/i18n";
import {
  DETAIL_SECTION_IDS,
  scrollDetailSection,
  setDetailSectionOpen,
  useDetailSectionOpen,
  type DetailSectionId,
} from "../lib/ui/detail-sections";
import { tooltipRef } from "../lib/ui/tooltip";
import {
  detailSectionTip,
  revealTip,
  tips,
} from "../lib/ui/tooltip-strings";
import { useTrackList } from "../containers/TrackListContext";
import type { Track } from "../lib/api-types";
import { PlayButton } from "./PlayButton";

const BUTTON_SX = { textTransform: "none" as const, minWidth: 0 };

const SECTION_ICON = {
  related: QueueMusicIcon,
  markers: GraphicEqIcon,
  crates: LibraryMusicIcon,
  copies: ContentCopyIcon,
  fields: SellIcon,
} as const;

/**
 * CSS color for the header swatch.
 *
 * A `#hex` string is used as written. An integer goes through `colorHex`.
 * White and a missing color return an empty string so the placeholder shows.
 *
 * @param color Track color from the library row.
 * @returns A CSS color, or `""`.
 */
export function detailSwatch(color: number | string | null | undefined): string {
  if (typeof color === "string" && color.startsWith("#")) {
    if (color.toLowerCase() === "#ffffff") return "";
    return color;
  }
  return colorHex(color);
}

export type DetailChip = {
  id: DetailSectionId;
  label: string;
  count: number | null;
};

/**
 * Title row that stays put while the pane scrolls.
 */
export function DetailHead({
  title,
  artist,
  album,
  bpm,
  musicalKey,
  length,
  color,
  trackId,
  playName,
}: {
  title: string;
  artist: string;
  album: string;
  bpm: string;
  musicalKey: string;
  length: string;
  color: string;
  trackId: number;
  playName: string;
}) {
  const facts = [
    ["column.bpm", bpm],
    ["column.key", musicalKey],
    ["column.time", length],
  ] as const;
  return (
    <header className="detail-head">
      <span
        className={color ? "detail-swatch" : "detail-swatch detail-swatch-empty"}
        style={color ? { background: color } : undefined}
        aria-hidden="true"
      />
      <div className="detail-head-copy">
        <h2>{title}</h2>
        {artist ? <p className="artist">{artist}</p> : null}
        {album ? <p className="detail-album">{album}</p> : null}
        <p className="detail-meta">
          {facts.map(([key, value], index) => (
            <span key={key} className="detail-meta-fact">
              {index > 0 ? <span aria-hidden="true">{" · "}</span> : null}
              <span className="visually-hidden">{`${t(key)} `}</span>
              <span>{value}</span>
            </span>
          ))}
        </p>
      </div>
      <div className="detail-head-actions">
        <PlayButton variant="detail" trackId={trackId} name={playName} />
        <DetailActionsMenu />
      </div>
    </header>
  );
}

/**
 * Chip row. The active chip is the section at the top of the pane.
 */
export function DetailSectionNav({
  chips,
  active,
  onJump,
}: {
  chips: readonly DetailChip[];
  active: DetailSectionId;
  onJump: (id: DetailSectionId) => void;
}) {
  return (
    <nav className="detail-nav" aria-label={t("detail.sections")}>
      {chips.map((chip) => {
        const name = chip.count == null
          ? chip.label
          : t("detail.counted", { label: chip.label, count: chip.count });
        return (
          <button
            key={chip.id}
            type="button"
            className="detail-chip"
            aria-current={active === chip.id ? "true" : undefined}
            ref={tooltipRef(detailSectionTip(chip.label))}
            onClick={() => onJump(chip.id)}
          >
            {name}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * One card. An empty section is a single line and has no Hide button.
 * Hiding keeps the children mounted so a search inside stays put.
 */
export function DetailSection({
  id,
  title,
  count,
  empty,
  children,
}: {
  id: DetailSectionId;
  title: string;
  count: number | null;
  empty?: string | undefined;
  children: ReactNode;
}) {
  const open = useDetailSectionOpen(id);
  const Icon = SECTION_ICON[id];
  const headingId = `detail-section-heading-${id}`;
  const bodyId = `detail-section-body-${id}`;
  const label = count == null ? title : t("detail.counted", { label: title, count });
  if (empty) {
    return (
      <section
        className="detail-card detail-card-empty"
        data-detail-section={id}
        id={`detail-section-${id}`}
        aria-labelledby={headingId}
      >
        <h3 id={headingId} className="detail-empty-line">{empty}</h3>
      </section>
    );
  }
  return (
    <section
      className="detail-card"
      data-detail-section={id}
      id={`detail-section-${id}`}
      aria-labelledby={headingId}
    >
      <div className="detail-card-head">
        <Icon className="detail-card-icon" aria-hidden="true" />
        <h3 id={headingId}>{label}</h3>
        <button
          type="button"
          className="detail-card-toggle text-button"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={t(open ? "detail.collapse" : "detail.expand", { section: title })}
          ref={tooltipRef(open ? tips.detailCollapse : tips.detailExpand)}
          onClick={() => setDetailSectionOpen(id, !open)}
        >
          {open ? t("detail.hide") : t("detail.show")}
        </button>
      </div>
      <div id={bodyId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

type ActionItem = {
  id: string;
  label: string;
  tip: ReturnType<typeof revealTip>;
  disabled?: boolean;
  dialog?: boolean;
  onClick: () => void;
};

function itemButton(event: MouseEvent<HTMLElement>): void {
  event.preventDefault();
}

/**
 * Reveal, Prepare, and the other track actions, in one menu.
 */
export function DetailActionsMenu() {
  const list = useTrackList();
  const detail = list.detail.kind === "track" ? list.detail.track : null;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const skipRestore = useRef(false);
  const open = Boolean(anchor);
  const bindTooltip = tooltipRef(tips.detailActions);
  if (!detail) return null;
  const writable = Boolean(detail.serato?.writable && list.writable);
  const manager = detail.serato?.file_manager || list.serato?.file_manager || "Finder";
  const items: ActionItem[] = [
    {
      id: "detail-reveal",
      label: t("detail.reveal", { manager }),
      tip: revealTip(manager),
      disabled: !detail.file_on_disk,
      onClick: () => void list.revealTrack(detail.id),
    },
    {
      id: "detail-prepare",
      label: detail.in_prepare ? t("detail.removePrepare") : t("detail.sendPrepare"),
      tip: detail.in_prepare ? tips.prepareRemove : tips.prepareAdd,
      disabled: !writable,
      onClick: () => void list.prepareTrack(detail.id, !detail.in_prepare),
    },
    {
      id: "detail-relocate",
      label: t("detail.relocate"),
      tip: tips.relocate,
      disabled: !writable,
      dialog: true,
      onClick: () => void list.relocateTrack(detail),
    },
    {
      id: "detail-remove",
      label: t("detail.removeFromLibrary"),
      tip: tips.removeTrack,
      disabled: !writable,
      dialog: true,
      onClick: () => void list.removeTrack(detail.id),
    },
    {
      id: "detail-queue",
      label: t("batch.queueTrack"),
      tip: tips.batchQueueTrack,
      onClick: () => void queueTrack(detail.id),
    },
    {
      id: "detail-use-in-crates",
      label: t("detail.useInCrates"),
      tip: tips.useInCrates,
      disabled: !writable,
      dialog: true,
      onClick: () => {
        void bridge.openReplaceInCratesDialog(detail.id).catch((error: unknown) => {
          list.setNotice(String(error), "error");
        });
      },
    },
  ];
  if (list.mode === "duplicates" && list.duplicateGroupSelected) {
    items.push({
      id: "detail-merge",
      label: t("merge.title"),
      tip: tips.mergeDuplicates,
      disabled: !writable,
      dialog: true,
      onClick: () => {
        void bridge.openMergeDialog().catch((error: unknown) => {
          list.setNotice(String(error), "error");
        });
      },
    });
  }

  function restoreButton(): void {
    const node = buttonRef.current;
    if (node && node.isConnected) node.focus();
  }

  return (
    <span className="detail-actions">
      <Button
        id="detail-actions"
        type="button"
        size="small"
        variant="outlined"
        color="inherit"
        sx={BUTTON_SX}
        ref={(node) => {
          buttonRef.current = node;
          bindTooltip(node);
        }}
        aria-label={t("detail.actionsMenu")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "detail-actions-menu" : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t("detail.actions")}
      </Button>
      <Menu
        id="detail-actions-menu"
        anchorEl={anchor}
        open={open}
        disableRestoreFocus
        onClose={() => {
          const skip = skipRestore.current;
          skipRestore.current = false;
          setAnchor(null);
          if (!skip) restoreButton();
        }}
        keepMounted
        slotProps={{
          root: { inert: !open },
          list: {
            component: "div",
            "aria-labelledby": "detail-actions",
            "aria-label": t("detail.actionsMenu"),
            dense: true,
          },
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            id={item.id}
            component="button"
            type="button"
            disabled={item.disabled}
            aria-haspopup={item.dialog ? "dialog" : undefined}
            ref={tooltipRef(item.tip)}
            onClick={(event) => {
              itemButton(event);
              skipRestore.current = item.dialog === true;
              if (item.dialog) restoreButton();
              item.onClick();
              setAnchor(null);
              if (!item.dialog) restoreButton();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </span>
  );
}

export function detailChipOrder(): readonly DetailSectionId[] {
  return DETAIL_SECTION_IDS;
}

/** Title shown when the row has no name. */
export function detailTitle(track: Track): string {
  const title = track.title || track.name || "";
  return title || t("track.untitled");
}
