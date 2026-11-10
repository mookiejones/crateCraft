/**
 * Files view painted by React: roots, folder list, and file actions.
 *
 * Check drive on a removable Serato root is in this tree. The review
 * dialog is FilesDialog. Folder load stays in files.ts.
 */

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type UIEvent } from "react";
import { flushSync } from "react-dom";
import type { FileEntry } from "../api-types";
import { bridge } from "../bridge";
import { useFiles } from "../context/FilesContext";
import { t } from "../i18n";
import { openPortableCheck } from "../portable";
import { setTooltip } from "../tooltip";
import {
  fileShortcut,
  missingDrive,
  openCrumb,
  openFile,
  portableCheck,
  selectFile,
  tips,
  type TipSpec,
} from "../tooltip-strings";

function tooltipRef(spec: TipSpec) {
  return (element: HTMLElement | null) => {
    if (element) setTooltip(element, spec);
  };
}

function FileIcon({ kind }: { kind: "folder" | "drive" }) {
  const d = kind === "drive"
    ? "M5 8.5h14v8H5z M8 14.5h.01 M12 14.5h4"
    : "M4 8.5h6l2 2h8v7.5H4z";
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      className={`files-icon ${kind === "drive" ? "files-icon-drive" : "files-icon-folder"}`}
    >
      <path fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function FilesToolbar() {
  const files = useFiles();
  const crumbs = files.breadcrumb.length
    ? files.breadcrumb
    : files.atRoots || !files.path
      ? [{ name: t("files.roots"), path: "" }]
      : [{ name: files.path, path: files.path }];
  return (
    <div className="browser-bar">
      <button
        id="files-up"
        type="button"
        ref={tooltipRef(tips.filesUp)}
        disabled={!files.parent || files.loading}
        onClick={() => files.goUp()}
      >
        {t("common.up")}
      </button>
      <nav id="files-path" className="files-path" aria-label={t("files.path")}>
        <ol className="files-crumbs">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={`${crumb.path}:${crumb.name}:${index}`}>
                {!last && crumb.path
                  ? (
                    <button
                      type="button"
                      ref={tooltipRef(openCrumb(crumb.name))}
                      className="files-crumb"
                      onClick={() => files.openCrumb(crumb.path)}
                    >
                      {crumb.name}
                    </button>
                  )
                  : (
                    <span className="files-crumb" aria-current="page">{crumb.name}</span>
                  )}
                {!last ? <span className="files-sep" aria-hidden="true">/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>
      <label className="search files-search" htmlFor="files-search">
        <span className="visually-hidden">{t("files.searchLabel")}</span>
        <input
          id="files-search"
          ref={tooltipRef(tips.filesSearch)}
          type="search"
          placeholder={t("files.searchPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          defaultValue={files.query}
          onInput={(event) => files.onSearchInput(event.currentTarget.value)}
        />
      </label>
      <button id="files-refresh" type="button" ref={tooltipRef(tips.filesRefresh)} onClick={() => files.refresh()}>
        {t("common.refresh")}
      </button>
      <button
        id="files-elsewhere"
        className="files-elsewhere"
        type="button"
        ref={tooltipRef(files.elsewhere ? tips.filesMusicFolders : tips.filesElsewhere)}
        onClick={() => files.toggleElsewhere()}
      >
        {files.elsewhere ? t("files.roots") : t("files.browseElsewhere")}
      </button>
    </div>
  );
}

function FilesActions() {
  const files = useFiles();
  const selected = files.selectedEntries;
  const locked = files.locked;
  return (
    <div className="files-actions">
      <button
        id="files-rename"
        type="button"
        ref={tooltipRef(tips.filesRename)}
        disabled={locked || selected.length !== 1}
        onClick={(event) => files.startRename(event.currentTarget)}
      >
        {t("crates.rename")}
      </button>
      <button
        id="files-rename-from-tags"
        type="button"
        ref={tooltipRef(tips.filesRenameFromTags)}
        aria-haspopup="dialog"
        disabled={locked || !selected.length}
        onClick={(event) => files.startRenameFromTags(event.currentTarget)}
      >
        {t("files.renameFromTags")}
      </button>
      <button
        id="files-move"
        type="button"
        ref={tooltipRef(tips.filesMove)}
        disabled={locked || !selected.length || Boolean(files.pick)}
        onClick={() => files.startMove()}
      >
        {t("files.moveToFolder")}
      </button>
      <button
        id="files-move-folder"
        type="button"
        ref={tooltipRef(tips.filesMoveFolder)}
        disabled={locked || !files.path || Boolean(files.pick)}
        onClick={() => files.startMoveFolder()}
      >
        {t("files.moveFolder")}
      </button>
      <button
        id="files-replace"
        type="button"
        ref={tooltipRef(tips.filesReplace)}
        disabled={locked || selected.length !== 1}
        onClick={(event) => files.startReplace(event.currentTarget)}
      >
        {t("files.replaceFile")}
      </button>
      <button
        id="files-delete"
        type="button"
        ref={tooltipRef(tips.filesDelete)}
        disabled={locked || !selected.length}
        onClick={(event) => files.startDelete(event.currentTarget)}
      >
        {t("common.delete")}
      </button>
      <button
        id="files-move-here"
        type="button"
        ref={tooltipRef(tips.filesMoveHere)}
        hidden={!files.pick}
        disabled={locked}
        onClick={(event) => files.confirmMoveHere(event.currentTarget)}
      >
        {t("files.moveHere")}
      </button>
      <button
        id="files-pick-cancel"
        type="button"
        ref={tooltipRef(tips.filesPickCancel)}
        hidden={!files.pick}
        onClick={() => files.cancelPick()}
      >
        {t("common.cancel")}
      </button>
    </div>
  );
}

function FileRow({ entry, index }: { entry: FileEntry; index: number }) {
  const files = useFiles();
  const active = index === files.active;
  const openKind = entry.kind === "dir" || entry.kind === "folder" || entry.kind === "drive";
  const className = [
    "files-row",
    entry.detail && (entry.kind === "folder" || entry.kind === "drive") ? "is-root" : "",
    entry.missing ? "is-missing" : "",
    active ? "is-active" : "",
  ].filter(Boolean).join(" ");

  if (openKind) {
    return (
      <div className={className} role="listitem">
        <button
          type="button"
          ref={tooltipRef(entry.missing ? missingDrive(entry.name) : openFile(entry.name))}
          className="files-open"
          data-files-index={String(index)}
          id={`files-item-${index}`}
          tabIndex={active ? 0 : -1}
          aria-disabled={entry.missing ? "true" : undefined}
          aria-label={entry.missing ? t("files.driveMissingLabel", { name: entry.name }) : t("files.open", { name: entry.name })}
          onClick={() => {
            if (entry.missing) files.markActive(index);
            else files.openRow(entry, index);
          }}
        >
          {entry.kind === "drive" || entry.kind === "folder"
            ? <FileIcon kind={entry.kind === "drive" ? "drive" : "folder"} />
            : null}
          {entry.detail && (entry.kind === "folder" || entry.kind === "drive")
            ? (
              <span className="files-root-copy">
                <span className="files-root-label">{entry.name}</span>
                <span className="files-root-detail">{entry.detail}</span>
              </span>
            )
            : (
              <>
                <span>{entry.name}</span>
                {entry.detail ? <span className="files-match-detail">{entry.detail}</span> : null}
              </>
            )}
          {entry.missing ? <span className="files-badge">{t("files.driveMissing")}</span> : null}
        </button>
        {entry.removable && entry.serato
          ? (
            <button
              type="button"
              ref={tooltipRef(portableCheck(entry.name))}
              className="files-portable"
              data-portable-name={entry.name}
              aria-label={t("portable.checkLabel", { name: entry.name })}
              onClick={(event) => {
                event.stopPropagation();
                void openPortableCheck(entry.path, event.currentTarget);
              }}
            >
              {t("portable.check")}
            </button>
          )
          : null}
      </div>
    );
  }

  if (entry.kind !== "file") {
    return (
      <div className={className} role="listitem">
        <button
          type="button"
          ref={tooltipRef(fileShortcut(entry.name))}
          className="files-kind"
          data-files-index={String(index)}
          id={`files-item-${index}`}
          tabIndex={active ? 0 : -1}
          aria-label={t("files.shortcut", { name: entry.name })}
        >
          {t("files.shortcut", { name: entry.name })}
        </button>
      </div>
    );
  }

  return (
    <div className={className} role="listitem">
      <label className="files-file">
        <input
          ref={tooltipRef(selectFile(entry.name, entry.path))}
          type="checkbox"
          data-files-index={String(index)}
          id={`files-item-${index}`}
          tabIndex={active ? 0 : -1}
          checked={files.selected.has(entry.path)}
          aria-label={entry.name}
          onChange={(event) => files.toggleFile(entry, index, event.currentTarget.checked)}
        />
        <span className="files-name">{entry.name}</span>
        {entry.detail ? <span className="files-match-detail">{entry.detail}</span> : null}
        {entry.in_library ? <span className="files-badge">{t("files.inLibrary")}</span> : null}
      </label>
    </div>
  );
}

const FILE_OVERSCAN = 8;

function visibleWindow(rowCount: number, scrollTop: number, viewHeight: number, rowHeight: number): { start: number; end: number } {
  const view = viewHeight || 600;
  const maxScroll = Math.max(0, rowCount * rowHeight - view);
  const top = Math.min(Math.max(0, scrollTop), maxScroll);
  const start = Math.max(0, Math.floor(top / rowHeight) - FILE_OVERSCAN);
  const end = Math.min(rowCount, Math.ceil((top + view) / rowHeight) + FILE_OVERSCAN);
  return { start, end };
}

function FilesList() {
  const files = useFiles();
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewHeight, setViewHeight] = useState(600);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    setViewHeight(list.clientHeight || 600);
    setScrollTop(list.scrollTop);
    const onNativeScroll = () => {
      flushSync(() => {
        setScrollTop(list.scrollTop);
        setViewHeight(list.clientHeight || 600);
      });
    };
    list.addEventListener("scroll", onNativeScroll);
    return () => list.removeEventListener("scroll", onNativeScroll);
  }, [files.rows, files.loading, files.error, files.atRoots, files.searching, files.active]);

  const rows = files.rows;
  const { start, end } = visibleWindow(rows.length, scrollTop, viewHeight, files.rowHeight);
  const rowHeight = files.rowHeight;
  const notes: string[] = [];
  if (files.loading) notes.push(files.atRoots ? t("files.readingRootsNote") : t("files.readingFolderNote"));
  if (files.error) notes.push(files.error);
  if (files.message) notes.push(files.message);
  if (files.truncated) notes.push(files.searching ? t("files.searchTruncated") : t("files.truncated"));

  const ariaLabel = files.searching ? t("files.searchResults") : files.atRoots ? t("files.roots") : t("files.contents");
  const emptyLoading = files.loading && !rows.length;
  const emptyError = Boolean(files.error) && !rows.length;
  const emptyRoots = files.atRoots && !files.roots.length;
  const emptyFolder = !rows.length;

  let body: ReactNode;
  let tabIndex = 0;
  if (emptyLoading) {
    const reading = files.searching
      ? t("files.searching")
      : files.atRoots
        ? t("files.readingRootsNote")
        : t("files.readingFolderNote");
    body = <p className="files-empty">{reading}</p>;
  } else if (emptyError) {
    body = <p className="files-empty">{files.error}</p>;
  } else if (emptyRoots) {
    tabIndex = -1;
    body = (
      <div className="files-empty-state">
        <h2>{t("files.noRoots")}</h2>
        <p>{t("files.noRootsBody")}</p>
        <button
          id="files-run-setup"
          type="button"
          ref={tooltipRef(tips.runSetup)}
          className="files-primary"
          onClick={() => bridge.openSetup()}
        >
          {t("files.runSetup")}
        </button>
      </div>
    );
  } else if (emptyFolder) {
    const empty = files.searching ? t("files.noMatches", { query: files.query }) : t("files.empty");
    body = <p className="files-empty">{empty}</p>;
  } else {
    tabIndex = -1;
    const windowRows = [];
    for (let index = start; index < end; index += 1) {
      const entry = rows[index];
      if (entry) windowRows.push(<FileRow key={`${entry.path}:${index}`} entry={entry} index={index} />);
    }
    body = (
      <div className="files-spacer" style={{ height: `${rows.length * rowHeight}px` }}>
        <div className="files-window" style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {windowRows}
        </div>
      </div>
    );
  }

  function onScroll(event: UIEvent<HTMLDivElement>): void {
    const node = event.currentTarget;
    flushSync(() => {
      setScrollTop(node.scrollTop);
      setViewHeight(node.clientHeight || 600);
    });
  }

  function onKey(event: KeyboardEvent<HTMLDivElement>): void {
    files.onListKey(event.nativeEvent);
  }

  return (
    <>
      <p id="files-pick" className="files-pick" hidden={!files.pick}>
        {t("files.chooseDestination")}
      </p>
      <p id="files-status" className="notice" role="status" aria-live="polite">{notes.join(" ")}</p>
      <div
        id="files-list"
        ref={listRef}
        className="files-list"
        role="group"
        aria-label={ariaLabel}
        aria-busy={files.loading}
        aria-activedescendant={
          !emptyLoading && !emptyError && !emptyRoots && !emptyFolder && files.active >= start && files.active < end
            ? `files-item-${files.active}`
            : undefined
        }
        tabIndex={tabIndex}
        onScroll={onScroll}
        onKeyDown={onKey}
      >
        {body}
      </div>
    </>
  );
}

/**
 * Files panel: toolbar, virtual list, and write actions.
 */
export function FilesPanel() {
  return (
    <>
      <FilesToolbar />
      <FilesList />
      <FilesActions />
    </>
  );
}
