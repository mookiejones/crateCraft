"""Native menu for the desktop window.

Titles come from ``locales/en.json`` and ``locales/es.json``, so the menu
uses the same words as the page. pywebview 6.2.1 ``MenuAction`` has no
shortcut field, so a title never includes a key chord. The Mac Edit and
View menus stay the ones pywebview draws when ``SHOW_DEFAULT_MENUS`` is
left on.

``__app__`` is inserted into the macOS application menu and ignored on
Windows and Linux. Settings is also under File for those platforms.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from pathlib import Path

ROOT = Path(__file__).resolve().parent
Dispatch = Callable[[str], None]


def menu_catalog(language: str | None) -> dict[str, str]:
    """Return the string messages for ``language``.

    Args:
        language: ``en``, ``es``, or None. None and any other value use
            English. The page follows the OS when the setting is missing;
            the menu is built once, before the page has chosen.

    Returns:
        Message key to the string in that catalog. Plural messages are
        left out. The menu does not use them.

    Raises:
        KeyError: The catalog file is missing a string the menu needs.
            That is reported by :func:`build_menu`, not here.
    """
    code = language if language in {"en", "es"} else "en"
    payload = json.loads((ROOT / "locales" / f"{code}.json").read_text(encoding="utf-8"))
    return {key: value for key, value in payload.items() if isinstance(value, str)}


def build_menu(dispatch: Dispatch, language: str | None) -> list[object]:
    """Return the pywebview menu for one window.

    Args:
        dispatch: Called with an action id when an item is chosen.
            The desktop window turns that id into a page call.
        language: Saved page language, or None for English.

    Returns:
        Menus for ``create_window`` and ``webview.start``. The same list
        is passed to both so GTK, which ignores a window menu, still
        shows the bar.

    Raises:
        KeyError: A menu title is missing from the catalog.
    """
    from webview.menu import Menu, MenuAction, MenuSeparator

    text = menu_catalog(language)

    def say(key: str) -> str:
        value = text[key]
        if not value.strip():
            raise KeyError(key)
        return value

    def item(key: str, action: str) -> MenuAction:
        title = say(key)
        if "Ctrl" in title or "Cmd" in title:
            raise ValueError(f"Menu title {key!r} must not name a shortcut.")
        return MenuAction(title, lambda action=action: dispatch(action))

    def custom(title: str, action: str) -> MenuAction:
        if "Ctrl" in title or "Cmd" in title:
            raise ValueError(f"Menu title {title!r} must not name a shortcut.")
        return MenuAction(title, lambda action=action: dispatch(action))

    space = Menu(
        say("space.label"),
        [
            custom(say("space.library"), "space:Serato Library"),
            custom(say("space.video"), "space:Serato Video"),
            custom(say("space.appleMusic"), "space:Apple Music"),
            custom(say("space.prepare"), "space:Prepare"),
        ],
    )
    return [
        Menu(
            "__app__",
            [
                item("settings.title", "settings"),
                item("settings.rerunSetup", "rerun-setup"),
            ],
        ),
        Menu(
            say("menu.file"),
            [
                item("quickOpen.title", "find"),
                item("menu.focusSearch", "focus-search"),
                MenuSeparator(),
                item("crates.new", "new-crate"),
                item("crates.rename", "rename-crate"),
                item("common.delete", "delete-crate"),
                MenuSeparator(),
                item("import.button", "import-playlist"),
                item("export.m3u", "export-playlist"),
                item("menu.exportRekordbox", "export-rekordbox"),
                MenuSeparator(),
                item("common.reload", "reload"),
                MenuSeparator(),
                item("settings.title", "settings"),
                item("menu.close", "close"),
            ],
        ),
        Menu(
            say("menu.library"),
            [
                item("view.crates", "view-crates"),
                item("crates.allTracks", "view-all"),
                item("view.history", "view-history"),
                item("view.files", "view-files"),
                MenuSeparator(),
                space,
            ],
        ),
        Menu(
            say("menu.tools"),
            [
                item("view.missing", "view-missing"),
                item("view.duplicates", "view-duplicates"),
                item("merge.title", "merge"),
                item("view.stems", "view-stems"),
                item("view.scan", "view-scan"),
                item("view.tags", "view-tags"),
                MenuSeparator(),
                item("view.gig", "view-gig"),
                MenuSeparator(),
                item("snapshots.take", "take-snapshot"),
                item("view.snapshots", "view-snapshots"),
                item("snapshots.reviewUndo", "review-undo"),
                MenuSeparator(),
                item("related.heading", "related"),
            ],
        ),
        Menu(
            say("menu.window"),
            [
                item("menu.minimize", "minimize"),
                item("menu.resetWidth", "reset-width"),
            ],
        ),
        Menu(
            say("menu.help"),
            [
                item("help.title", "help"),
                MenuSeparator(),
                item("help.bug", "help-bug"),
                item("help.feature", "help-feature"),
                item("help.github", "help-github"),
                item("help.releases", "help-releases"),
                MenuSeparator(),
                item("shortcuts.title", "shortcuts"),
                item("settings.openLogs", "open-logs"),
                item("settings.copyVersion", "copy-version"),
            ],
        ),
    ]
