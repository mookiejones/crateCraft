"""The desktop menu mirrors the page and does not invent shortcuts.

These cases build the menu in process. They do not open a window.
"""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import desktop_menu
import server
from webview.menu import Menu, MenuAction, MenuSeparator


ROOT = Path(__file__).resolve().parents[1]

# Rail primaries and children, same keys as src/lib/ui/nav.ts and index.html.
RAIL_KEYS = (
    "view.group.library",
    "view.crates",
    "view.history",
    "view.stats",
    "view.files",
    "view.group.health",
    "view.health",
    "view.missing",
    "view.duplicates",
    "view.stems",
    "view.scan",
    "view.bitrate",
    "view.tags",
    "view.snapshots",
    "view.group.gig",
    "view.gig",
    "view.portable",
    "view.drift",
)


def _catalog(code: str) -> dict[str, str]:
    payload = json.loads((ROOT / "locales" / f"{code}.json").read_text(encoding="utf-8"))
    return {key: value for key, value in payload.items() if isinstance(value, str)}


def _menu_named(menu: list[object], title: str) -> Menu:
    return next(item for item in menu if isinstance(item, Menu) and item.title == title)


def _action_titles(menu: Menu) -> list[str]:
    return [item.title for item in menu.items if isinstance(item, MenuAction)]


def _child_menu(menu: Menu, title: str) -> Menu:
    return next(item for item in menu.items if isinstance(item, Menu) and item.title == title)


def _titles(menu: list[object]) -> list[str]:
    found: list[str] = []

    def walk(items: list[object]) -> None:
        for item in items:
            if isinstance(item, Menu):
                if item.title != "__app__":
                    found.append(item.title)
                walk(item.items)
            elif isinstance(item, MenuAction):
                found.append(item.title)

    walk(menu)
    return found


class DesktopMenuTests(unittest.TestCase):
    def test_menu_catalog_reads_locales_from_the_frozen_root(self) -> None:
        """A frozen app reads the catalog from ``sys._MEIPASS``, not the checkout.

        Writes a one-key ``en.json`` in a temporary extract directory and
        patches ``sys.frozen``. No window is opened.

        Returns:
            None. The test fails if the catalog still comes from the
            source tree beside ``desktop_menu.py``.
        """
        with tempfile.TemporaryDirectory() as tmp:
            locales = Path(tmp) / "locales"
            locales.mkdir()
            (locales / "en.json").write_text(
                '{"menu.file": "FROM-BUNDLE"}', encoding="utf-8"
            )
            with mock.patch.object(server.sys, "frozen", True, create=True), mock.patch.object(
                server.sys, "_MEIPASS", tmp, create=True
            ):
                catalog = desktop_menu.menu_catalog("en")
        self.assertEqual(catalog["menu.file"], "FROM-BUNDLE")

    def test_menu_catalog_refuses_a_frozen_bundle_without_locales(self) -> None:
        """A frozen extract directory without catalogs must not fall back to the checkout.

        Patches ``sys.frozen`` and ``sys._MEIPASS`` to an empty temporary
        directory. No window is opened.

        Returns:
            None. The test fails if the catalog is read from the source tree.
        """
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(server.sys, "frozen", True, create=True), mock.patch.object(
                server.sys, "_MEIPASS", tmp, create=True
            ):
                with self.assertRaises(FileNotFoundError):
                    desktop_menu.menu_catalog("en")

    def test_english_menu_names_the_page_actions(self) -> None:
        """Use the English catalog, including Settings under File and the app menu.

        Returns:
            None. The test fails if a group or a page action is missing.
        """
        seen: list[str] = []
        menu = desktop_menu.build_menu(seen.append, "en")
        titles = _titles(menu)
        self.assertEqual(titles[:5], ["Settings", "Run setup again", "File", "Find a view, crate, track, or file", "Focus search"])
        for name in (
            "Music",
            "Library",
            "Crates",
            "History",
            "Play stats",
            "Tools",
            "Organize files",
            "Health",
            "Overview",
            "Missing files",
            "Duplicates",
            "Merge copies",
            "Stems",
            "Damaged files",
            "Suspect quality",
            "Tag spellings",
            "Gig",
            "Ready",
            "Check drive",
            "Tempo drift",
            "Take a backup",
            "Backups",
            "Review undo",
            "Mixes well with",
            "Window",
            "Minimize",
            "Reset list width",
            "Help",
            "Report a bug",
            "Request a feature",
            "View on GitHub",
            "Release notes",
            "Keyboard shortcuts",
        ):
            self.assertIn(name, titles)
        self.assertNotIn("All tracks", titles)
        self.assertEqual(titles.count("Settings"), 2)
        self.assertEqual(titles.count("Help"), 2)
        file_menu = next(item for item in menu if isinstance(item, Menu) and item.title == "File")
        file_menu.items[0].function()
        self.assertEqual(seen, ["find"])

    def test_spanish_menu_uses_the_spanish_catalog(self) -> None:
        """A saved Spanish language builds the bar from es.json.

        Returns:
            None. The test fails if the File menu stays in English.
        """
        menu = desktop_menu.build_menu(lambda _action: None, "es")
        titles = _titles(menu)
        self.assertIn("Archivo", titles)
        self.assertIn("Música", titles)
        self.assertIn("Herramientas", titles)
        self.assertIn("Organizar archivos", titles)
        self.assertIn("Salud", titles)
        self.assertIn("Bolo", titles)
        self.assertIn("Ayuda", titles)
        self.assertIn("Informar de un error", titles)
        self.assertIn("Pedir una función", titles)
        self.assertNotIn("File", titles)

    def test_titles_do_not_name_a_shortcut(self) -> None:
        """pywebview 6.2.1 cannot attach a shortcut, so the title must not fake one.

        Returns:
            None. The test fails if Ctrl or Cmd is written into a title.
        """
        for language in ("en", "es", None):
            for title in _titles(desktop_menu.build_menu(lambda _action: None, language)):
                self.assertNotIn("Ctrl", title)
                self.assertNotIn("Cmd", title)

    def test_the_shell_keeps_the_mac_edit_and_view_menus(self) -> None:
        """Leave SHOW_DEFAULT_MENUS on, and pass the menu to the window and to start.

        GTK ignores a window menu and uses the menu given to start.

        Returns:
            None. The test fails if the desktop window hides the default
            menus or only sets one of the two menu arguments.
        """
        text = (ROOT / "desktop.py").read_text(encoding="utf-8")
        self.assertNotIn("SHOW_DEFAULT_MENUS", text)
        self.assertIn('options["menu"] = menu', text)
        self.assertIn("menu=menu", text)
        self.assertIn("_point_mac_about_at_settings", text)
        self.assertIn("_on_window_shown(window, dispatch)", text)
        for title in _titles(desktop_menu.build_menu(lambda _action: None, "en")):
            self.assertNotIn(title, {"Edit", "View"})

    def test_separators_stay_between_groups(self) -> None:
        """File keeps a separator between search, crates, playlists, and Close.

        Returns:
            None. The test fails if the File menu is one flat list.
        """
        menu = desktop_menu.build_menu(lambda _action: None, "en")
        file_menu = next(item for item in menu if isinstance(item, Menu) and item.title == "File")
        separators = [item for item in file_menu.items if isinstance(item, MenuSeparator)]
        self.assertGreaterEqual(len(separators), 4)

    def test_help_menu_calls_the_page_help_actions(self) -> None:
        """Help items dispatch the same ids the page Help dialog uses.

        Returns:
            None. The test fails if a Help item is missing or opens a
            second About.
        """
        seen: list[str] = []
        menu = desktop_menu.build_menu(seen.append, "en")
        help_menu = next(item for item in menu if isinstance(item, Menu) and item.title == "Help")
        actions = [item for item in help_menu.items if isinstance(item, MenuAction)]
        self.assertEqual(
            [item.title for item in actions],
            [
                "Help",
                "Report a bug",
                "Request a feature",
                "View on GitHub",
                "Release notes",
                "Keyboard shortcuts",
                "Open logs folder",
                "Copy version",
            ],
        )
        for item in actions[1:5]:
            item.function()
        self.assertEqual(seen, ["help-bug", "help-feature", "help-github", "help-releases"])
        app_menu = next(item for item in menu if isinstance(item, Menu) and item.title == "__app__")
        app_titles = [item.title for item in app_menu.items if isinstance(item, MenuAction)]
        self.assertEqual(app_titles, ["Settings", "Run setup again"])
        self.assertNotIn("About", app_titles)

    def test_menu_lists_every_rail_primary_and_child(self) -> None:
        """Music and Tools use the same visible names as the drawer.

        Returns:
            None. The test fails if a rail label is missing or Music
            still lists Organize files or All tracks.
        """
        for language in ("en", "es"):
            catalog = _catalog(language)
            menu = desktop_menu.build_menu(lambda _action: None, language)
            titles = _titles(menu)
            for key in RAIL_KEYS:
                self.assertIn(catalog[key], titles, key)
            music = _menu_named(menu, catalog["menu.library"])
            self.assertEqual(
                _action_titles(music),
                [catalog["view.crates"], catalog["view.history"], catalog["view.stats"]],
            )
            tools = _menu_named(menu, catalog["menu.tools"])
            self.assertEqual(_action_titles(tools)[0], catalog["view.files"])
            health = _child_menu(tools, catalog["view.group.health"])
            self.assertEqual(
                _action_titles(health),
                [
                    catalog["view.health"],
                    catalog["view.missing"],
                    catalog["view.duplicates"],
                    catalog["view.stems"],
                    catalog["view.scan"],
                    catalog["view.bitrate"],
                    catalog["view.tags"],
                ],
            )
            gig = _child_menu(tools, catalog["view.group.gig"])
            self.assertEqual(
                _action_titles(gig),
                [catalog["view.gig"], catalog["view.portable"], catalog["view.drift"]],
            )
            space = _child_menu(music, catalog["space.label"])
            self.assertEqual(
                _action_titles(space),
                [
                    catalog["space.library"],
                    catalog["space.video"],
                    catalog["space.appleMusic"],
                    catalog["space.prepare"],
                ],
            )
