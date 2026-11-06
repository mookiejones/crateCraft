"""The running app icon follows the selected theme.

The cases use temporary settings and synthetic icon files. They do not
open a Serato library, and they do not change a Dock, a bundle icon, or
an executable.
"""

from __future__ import annotations

import json
import os
import struct
import tempfile
import threading
import unittest
import zlib
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import app_config
import app_icons
import desktop
from tests.fixture import TempLibrary
from tests.test_setup import _request
from tests.test_tokens import contrast

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "static" / "img" / "icons"
CORAL = (255, 111, 97, 255)
ORANGE = (240, 120, 24, 255)
MOTOWN_MARK = (74, 21, 34, 255)
DEEP_MARK = (244, 228, 196, 255)
DAISY_MARK = (245, 197, 24, 255)
MOTOWN_LABEL = (244, 228, 196, 255)
DEEP_LABEL = (43, 187, 173, 255)
DAISY_LABEL = (245, 197, 24, 255)
MOTOWN_GROUND = (228, 179, 188, 255)
DEEP_GROUND = (20, 35, 63, 255)
DAISY_GROUND = (31, 107, 69, 255)


def _pixels(blob: bytes) -> list[tuple[int, int, int, int]]:
    """Decode a filter-0 RGBA PNG into a row-major pixel list.

    Args:
        blob: PNG bytes.

    Returns:
        One tuple per pixel.

    Raises:
        AssertionError: If the PNG is not the icon size or uses a row filter.
    """
    if not blob.startswith(b"\x89PNG\r\n\x1a\n"):
        raise AssertionError("not a png")
    pos = 8
    idat = bytearray()
    while pos < len(blob):
        length = struct.unpack(">I", blob[pos : pos + 4])[0]
        tag = blob[pos + 4 : pos + 8]
        data = blob[pos + 8 : pos + 8 + length]
        if tag == b"IDAT":
            idat.extend(data)
        pos += 12 + length
    raw = zlib.decompress(bytes(idat))
    stride = app_icons.ICON_SIZE * 4
    pixels: list[tuple[int, int, int, int]] = []
    for y in range(app_icons.ICON_SIZE):
        row = raw[y * (stride + 1) : (y + 1) * (stride + 1)]
        if row[0] != 0:
            raise AssertionError("png row filter is not 0")
        for x in range(app_icons.ICON_SIZE):
            start = 1 + x * 4
            pixels.append((row[start], row[start + 1], row[start + 2], row[start + 3]))
    return pixels


def _at(pixels: list[tuple[int, int, int, int]], x: int, y: int) -> tuple[int, int, int, int]:
    """Return one decoded pixel.

    Args:
        pixels: Output of :func:`_pixels`.
        x: Column.
        y: Row.

    Returns:
        Red, green, blue, and alpha.
    """
    return pixels[y * app_icons.ICON_SIZE + x]


class IconArtTests(unittest.TestCase):
    """Placeholder icons built from the existing circle logo."""

    def test_colorways_and_files(self) -> None:
        """Each colorway has a marked SVG, PNG, and ICO, and the circle logo exists.

        Returns:
            None.
        """
        logo = ROOT / "packaging" / "menu-icon.png"
        self.assertTrue(logo.is_file())
        self.assertEqual(app_icons.placeholder_origin(), (63, 8))
        for colorway in app_icons.COLORWAYS:
            svg = (ICONS / f"placeholder-{colorway}.svg").read_text(encoding="utf-8")
            self.assertIn("PLACEHOLDER", svg)
            self.assertIn("packaging/menu-icon.png", svg)
            self.assertIn('id="vinyl"', svg)
            self.assertIn('id="equalizer-halo"', svg)
            self.assertIn('id="tonearm"', svg)
            self.assertIn('id="crossfader"', svg)
            self.assertIn('data-placeholder="true"', svg)
            png = (ICONS / f"placeholder-{colorway}.png").read_bytes()
            self.assertEqual(png, app_icons.png_bytes(colorway))
            ico = (ICONS / f"placeholder-{colorway}.ico").read_bytes()
            self.assertEqual(ico, app_icons.ico_bytes(png))
            self.assertEqual(struct.unpack_from("<H", ico, 2)[0], 1)
            size = struct.unpack_from("<I", ico, 14)[0]
            offset = struct.unpack_from("<I", ico, 18)[0]
            self.assertEqual(ico[offset : offset + size], png)
        motown = (ICONS / "placeholder-motown.svg").read_text(encoding="utf-8").casefold()
        self.assertNotIn("heartbeat", motown)
        for colorway in ("deep-house", "daisy-age"):
            text = (ICONS / f"placeholder-{colorway}.svg").read_text(encoding="utf-8")
            self.assertIn('id="heartbeat"', text)
        default = (ICONS / "default.svg").read_text(encoding="utf-8")
        self.assertIn("packaging/menu-icon.png", default)
        self.assertNotIn("PLACEHOLDER", default)

    def test_pixels_match_the_colorway(self) -> None:
        """Motown has no pulse. The other two paint one, and the mark is present.

        Returns:
            None.
        """
        motown = _pixels(app_icons.png_bytes("motown"))
        deep = _pixels(app_icons.png_bytes("deep-house"))
        daisy = _pixels(app_icons.png_bytes("daisy-age"))
        self.assertEqual(_at(motown, 63, 8), MOTOWN_MARK)
        self.assertEqual(_at(deep, 63, 8), DEEP_MARK)
        self.assertEqual(_at(daisy, 63, 8), DAISY_MARK)
        self.assertEqual(_at(motown, 140, 116), MOTOWN_LABEL)
        self.assertEqual(_at(deep, 140, 116), DEEP_LABEL)
        self.assertEqual(_at(daisy, 140, 116), DAISY_LABEL)
        self.assertEqual(_at(motown, 16, 140), MOTOWN_GROUND)
        self.assertEqual(_at(deep, 16, 140), DEEP_GROUND)
        self.assertEqual(_at(daisy, 16, 140), DAISY_GROUND)
        self.assertEqual(_at(motown, 0, 0)[3], 0)
        self.assertNotIn(CORAL, motown)
        self.assertNotIn(ORANGE, motown)
        self.assertEqual(_at(motown, 128, 148)[:3], (110, 36, 54))
        self.assertEqual(_at(deep, 128, 148), CORAL)
        self.assertEqual(_at(daisy, 128, 148), ORANGE)
        self.assertNotIn(CORAL, daisy)
        self.assertNotIn(ORANGE, deep)

    def test_accents_clear_the_rail(self) -> None:
        """Each theme stripe is at least 3:1 against the walnut background.

        Returns:
            None.
        """
        sheet = (ROOT / "static" / "tokens.css").read_text(encoding="utf-8")
        for name, color in (
            ("--colorway-motown-accent", "#f4e4c4"),
            ("--colorway-deep-house-accent", "#ff6f61"),
            ("--colorway-daisy-age-accent", "#f5c518"),
        ):
            self.assertIn(f"{name}: {color}", sheet)
            self.assertGreaterEqual(contrast(color, "#231910"), 3, name)

    def test_bad_colorway_and_ico(self) -> None:
        """An unknown theme is refused. An ICO needs a PNG.

        Returns:
            None.
        """
        with self.assertRaises(ValueError):
            app_icons.png_bytes("house")
        with self.assertRaises(ValueError):
            app_icons.ico_bytes(b"not-a-png")
        self.assertEqual(app_icons.icon_href("nope", True), "/img/icons/placeholder-motown.svg")
        self.assertEqual(app_icons.icon_href("daisy-age", False), "/img/icons/default.svg")


class IconPathTests(unittest.TestCase):
    """Icon files stay inside their directory."""

    def test_names_cannot_escape(self) -> None:
        """A colorway or suffix that is not in the allowlist is refused.

        Returns:
            None.
        """
        self.assertIsNone(app_icons.icon_file("../motown", "png"))
        self.assertIsNone(app_icons.icon_file("motown", "../png"))
        self.assertIsNone(app_icons.icon_file("motown/../../etc", "png"))
        self.assertIsNone(app_icons.icon_file("motown", "svg/../../secrets"))

    def test_missing_directory_is_not_created(self) -> None:
        """An absent path, including one that looks like an unmounted drive, stays absent.

        Returns:
            None.
        """
        missing = Path(tempfile.mkdtemp()) / "Volumes" / "Not Mounted" / "icons"
        self.assertFalse(missing.exists())
        self.assertIsNone(app_icons.icon_file("motown", "png", root=missing))
        result = app_icons.apply(
            "motown",
            True,
            platform="darwin",
            adapters=app_icons.IconAdapters(set_dock=lambda path: True),
            icons_root=missing,
        )
        self.assertEqual(result.reason, "missing-icon")
        self.assertFalse(result.applied)
        self.assertFalse(missing.exists())

    def test_space_in_the_directory_is_readable(self) -> None:
        """A path with a space still resolves to the icon file.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "Serato Library Icons"
            root.mkdir()
            target = root / "placeholder-motown.png"
            target.write_bytes((ICONS / "placeholder-motown.png").read_bytes())
            found = app_icons.icon_file("motown", "png", root=root)
            self.assertIsNotNone(found)
            assert found is not None
            self.assertEqual(found.read_bytes(), target.read_bytes())
            self.assertIn("Serato Library Icons", str(found))

    def test_reported_symlink_is_refused(self) -> None:
        """A file reported as a symlink is not used, and its bytes stay put.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "icons"
            root.mkdir()
            icon = root / "placeholder-motown.png"
            icon.write_bytes(b"png-bytes")
            with mock.patch.object(Path, "is_symlink", lambda self: self.name == icon.name):
                self.assertIsNone(app_icons.icon_file("motown", "png", root=root))
            self.assertEqual(icon.read_bytes(), b"png-bytes")

    def test_real_symlink_is_not_followed(self) -> None:
        """A symlink to a file outside the icon directory is refused.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "icons"
            root.mkdir()
            outside = Path(tmp) / "secret.png"
            outside.write_bytes(b"secret")
            link = root / "placeholder-motown.png"
            try:
                link.symlink_to(outside)
            except OSError as exc:
                self.skipTest(f"symlink creation is not permitted on this computer ({exc})")
            self.assertIsNone(app_icons.icon_file("motown", "png", root=root))
            self.assertEqual(outside.read_bytes(), b"secret")

    def test_resolved_path_outside_the_directory_is_refused(self) -> None:
        """A file whose resolved path leaves the icon directory is refused.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "icons"
            root.mkdir()
            icon = root / "placeholder-motown.png"
            icon.write_bytes(b"png")
            outside = Path(tmp) / "outside.png"
            outside.write_bytes(b"out")
            real_resolve = Path.resolve

            def resolve(self: Path, *args: object, **kwargs: object) -> Path:
                if self == icon:
                    return outside
                return real_resolve(self, *args, **kwargs)

            with mock.patch.object(Path, "resolve", resolve):
                self.assertIsNone(app_icons.icon_file("motown", "png", root=root))
            self.assertEqual(outside.read_bytes(), b"out")


class IconApplyTests(unittest.TestCase):
    """Platform decisions. The real Dock and window APIs are not called."""

    def test_other_platforms_fall_back(self) -> None:
        """Linux leaves the icon alone and does not write a file.

        Returns:
            None.
        """
        written: list[Path] = []
        real_write = Path.write_bytes

        def trap(self: Path, data: bytes) -> int:
            written.append(self)
            return real_write(self, data)

        with mock.patch.object(Path, "write_bytes", trap):
            result = app_icons.apply("daisy-age", True, platform="linux")
        self.assertFalse(result.applied)
        self.assertEqual(result.reason, "unsupported")
        self.assertEqual(result.target, "unsupported")
        self.assertEqual(result.href, "/img/icons/placeholder-daisy-age.svg")
        self.assertEqual(written, [])

    def test_darwin_sets_the_dock_icon_and_leaves_the_bundle_alone(self) -> None:
        """A colorway sets the Dock image. False clears it. The .icns is untouched.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            bundle = Path(tmp) / "Serato Library.app" / "Contents" / "Resources"
            bundle.mkdir(parents=True)
            icns = bundle / "icon.icns"
            icns.write_bytes(b"finder-default")
            seen: list[Path | None] = []
            result = app_icons.apply(
                "deep-house",
                True,
                platform="darwin",
                adapters=app_icons.IconAdapters(set_dock=lambda path: seen.append(path) or True),
            )
            self.assertTrue(result.applied)
            self.assertEqual(result.target, "dock")
            self.assertEqual(result.reason, "ok")
            self.assertEqual(len(seen), 1)
            assert seen[0] is not None
            self.assertEqual(seen[0].name, "placeholder-deep-house.png")
            self.assertEqual(icns.read_bytes(), b"finder-default")
            cleared: list[Path | None] = []
            restored = app_icons.apply(
                "deep-house",
                False,
                platform="darwin",
                adapters=app_icons.IconAdapters(set_dock=lambda path: cleared.append(path) or True),
            )
            self.assertEqual(cleared, [None])
            self.assertTrue(restored.applied)
            self.assertEqual(restored.href, "/img/icons/default.svg")
            self.assertEqual(icns.read_bytes(), b"finder-default")

    def test_missing_appkit_is_unsupported(self) -> None:
        """Without AppKit the Dock is left alone and the call does not raise.

        Returns:
            None.
        """
        with mock.patch.object(app_icons, "dock_available", return_value=False):
            result = app_icons.apply("motown", True, platform="darwin")
        self.assertFalse(result.applied)
        self.assertEqual(result.target, "dock")
        self.assertEqual(result.reason, "unsupported")

    def test_windows_sets_both_icon_sizes_and_does_not_rewrite_the_exe(self) -> None:
        """The window gets the big and small icons. The executable bytes stay put.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            exe = Path(tmp) / "Serato Library.exe"
            exe.write_bytes(b"MZ-original")
            calls: list[tuple[int, int, int, int]] = []

            def send(hwnd: int, message: int, size: int, icon: int) -> int:
                calls.append((int(hwnd), int(message), int(size), int(icon)))
                return 0

            user32 = mock.Mock()
            user32.SendMessageW = send
            with mock.patch("ctypes.windll", mock.Mock(user32=user32), create=True):
                self.assertTrue(app_icons._send_window_icon(42, 7))
            self.assertEqual(calls, list(app_icons.icon_messages(42, 7)))
            self.assertEqual(calls[0][2], app_icons.ICON_BIG)
            self.assertEqual(calls[1][2], app_icons.ICON_SMALL)
            self.assertEqual(exe.read_bytes(), b"MZ-original")

            loaded: list[Path] = []
            result = app_icons.apply(
                "motown",
                True,
                platform="win32",
                adapters=app_icons.IconAdapters(
                    find_hwnd=lambda: 42,
                    load_icon=lambda path: loaded.append(path) or 9,
                    send_icon=lambda hwnd, hicon: hicon == 9 and hwnd == 42,
                ),
            )
            self.assertTrue(result.applied)
            self.assertEqual(result.target, "window")
            self.assertEqual(loaded[0].name, "placeholder-motown.ico")
            self.assertEqual(exe.read_bytes(), b"MZ-original")

    def test_restore_reads_the_program_icon(self) -> None:
        """Turning the option off reads the executable icon and does not write it.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            exe = Path(tmp) / "app.exe"
            exe.write_bytes(b"MZ-original")
            seen: list[str] = []

            def extract(instance: object, path: str, index: int) -> int:
                seen.append(f"{path}:{index}")
                return 4

            shell32 = mock.Mock()
            shell32.ExtractIconW = extract
            with mock.patch("ctypes.windll", mock.Mock(shell32=shell32), create=True):
                handle = app_icons._executable_icon(exe)
            self.assertEqual(handle, 4)
            self.assertEqual(seen, [f"{exe}:0"])
            self.assertEqual(exe.read_bytes(), b"MZ-original")
            result = app_icons.apply(
                "daisy-age",
                False,
                platform="win32",
                adapters=app_icons.IconAdapters(
                    find_hwnd=lambda: 9,
                    default_icon=lambda: 4,
                    send_icon=lambda hwnd, hicon: hwnd == 9 and hicon == 4,
                ),
            )
            self.assertTrue(result.applied)
            self.assertEqual(result.href, "/img/icons/default.svg")
            self.assertFalse(result.follows_theme)

    def test_no_window_does_not_send_an_icon(self) -> None:
        """Without a window the taskbar is left alone.

        Returns:
            None.
        """
        sent: list[int] = []
        result = app_icons.apply(
            "motown",
            True,
            platform="win32",
            adapters=app_icons.IconAdapters(
                find_hwnd=lambda: 0,
                send_icon=lambda hwnd, hicon: sent.append(hwnd) or True,
            ),
        )
        self.assertEqual(result.reason, "no-window")
        self.assertFalse(result.applied)
        self.assertEqual(sent, [])

    def test_prepare_taskbar_sets_an_id_only_on_windows(self) -> None:
        """The model id is set on Windows and skipped elsewhere. No exe is written.

        Returns:
            None.
        """
        with tempfile.TemporaryDirectory() as tmp:
            exe = Path(tmp) / "app.exe"
            exe.write_bytes(b"MZ")
            with mock.patch.object(app_icons.sys, "platform", "linux"):
                app_icons.prepare_taskbar()
            calls: list[str] = []
            shell32 = mock.Mock()
            shell32.SetCurrentProcessExplicitAppUserModelID = calls.append
            with (
                mock.patch.object(app_icons.sys, "platform", "win32"),
                mock.patch("ctypes.windll", mock.Mock(shell32=shell32), create=True),
            ):
                app_icons.prepare_taskbar()
            self.assertEqual(calls, [app_icons.APP_USER_MODEL_ID])
            self.assertEqual(exe.read_bytes(), b"MZ")

    def test_hwnd_comes_from_the_bound_window(self) -> None:
        """The desktop window's handle is preferred, including a .NET Handle.

        Returns:
            None.
        """

        class Native:
            hwnd = 15

        class Window:
            native = Native()

        self.assertEqual(app_icons.hwnd_of(Window()), 15)

        class IconHandle:
            def ToInt32(self) -> int:
                return 9

        class DotNet:
            Handle = IconHandle()

        class Form:
            native = DotNet()

        self.assertEqual(app_icons.hwnd_of(Form()), 9)

        class Broken:
            def ToInt32(self) -> int:
                raise OSError("gone")

        class Bad:
            native = type("N", (), {"Handle": Broken()})()

        self.assertEqual(app_icons.hwnd_of(Bad()), 0)
        self.assertEqual(app_icons.hwnd_of(None), 0)
        app_icons.bind_window(Window())
        try:
            self.assertEqual(app_icons._find_window(), 15)
        finally:
            app_icons.bind_window(None)

    def test_packaged_icon_stays_the_default(self) -> None:
        """The PyInstaller spec does not bake a colorway into the executable.

        Returns:
            None.
        """
        spec = (ROOT / "serato-library.spec").read_text(encoding="utf-8")
        self.assertIn("icon=None", spec)
        self.assertEqual(app_icons.WINDOW_TITLE, desktop.WINDOW_TITLE)

    def test_launch_applies_the_saved_icon_and_keeps_going(self) -> None:
        """Startup asks for the saved icon. A failure does not stop the window.

        Returns:
            None.
        """
        with mock.patch("app_icons.apply_saved", side_effect=RuntimeError("no display")):
            desktop._apply_launch_icon()
        with mock.patch("app_icons.apply_saved") as apply:
            desktop._apply_launch_icon()
        apply.assert_called_once_with()

    def test_fixtures_and_a_missing_library_are_untouched(self) -> None:
        """Applying an icon does not read or write Serato 4 or 5 fixtures.

        Returns:
            None.
        """
        roots = (ROOT / "tests" / "fixtures" / "serato4", ROOT / "tests" / "fixtures" / "serato5")
        before = {path: path.read_bytes() for root in roots for path in root.rglob("*") if path.is_file()}
        with tempfile.TemporaryDirectory() as tmp:
            library = Path(tmp) / "Library" / "master.sqlite"
            result = app_icons.apply("deep-house", True, platform="linux")
            self.assertFalse(result.applied)
            self.assertFalse(library.exists())
        after = {path: path.read_bytes() for root in roots for path in root.rglob("*") if path.is_file()}
        self.assertEqual(before, after)

    def test_follow_must_be_a_boolean(self) -> None:
        """An integer is not a choice to follow the theme.

        Returns:
            None.
        """
        with self.assertRaises(ValueError):
            app_icons.apply("motown", 1, platform="linux")  # type: ignore[arg-type]


class AppearanceSettingsTests(unittest.TestCase):
    """The theme and the icon flag live in settings.json."""

    def setUp(self) -> None:
        """Create an empty config directory for one test.

        Returns:
            None.
        """
        self._tmp = tempfile.TemporaryDirectory()
        self.config = Path(self._tmp.name) / "config"
        self.config.mkdir()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: str(self.config)})
        self._env.start()

    def tearDown(self) -> None:
        """Remove the temporary config directory.

        Returns:
            None.
        """
        self._env.stop()
        self._tmp.cleanup()

    def _stored(self) -> dict[str, object]:
        return json.loads((self.config / "settings.json").read_text(encoding="utf-8"))

    def test_defaults_when_the_keys_are_missing(self) -> None:
        """A file from before this choice follows the theme and uses Motown Soul.

        Returns:
            None.
        """
        self.assertEqual(app_config.load_settings().colorway, "motown")
        self.assertIs(app_config.load_settings().icon_follows_theme, True)
        (self.config / "settings.json").write_text("{}\n", encoding="utf-8")
        loaded = app_config.load_settings()
        self.assertEqual(loaded.colorway, "motown")
        self.assertIs(loaded.icon_follows_theme, True)
        import telemetry

        public = telemetry.public_settings()
        self.assertEqual(public["colorway"], "motown")
        self.assertIs(public["icon_follows_theme"], True)
        self.assertEqual(public["icon_href"], "/img/icons/placeholder-motown.svg")

    def test_false_is_stored_and_survives_other_saves(self) -> None:
        """False stays false, and a non-default theme stays put.

        Returns:
            None.
        """
        saved = app_config.set_appearance(colorway="daisy-age", icon_follows_theme=False)
        self.assertEqual(saved.colorway, "daisy-age")
        self.assertIs(saved.icon_follows_theme, False)
        self.assertIs(self._stored()["icon_follows_theme"], False)
        self.assertEqual(self._stored()["colorway"], "daisy-age")
        writers = (
            lambda: app_config.set_telemetry_consent(True),
            lambda: app_config.save_window_geometry(app_config.WindowGeometry(1, 2, 800, 600)),
            lambda: app_config.set_wizard_complete(True),
            lambda: app_config.update_rekordbox(hot_loops=True),
            lambda: app_config.set_track_list_width(480),
            lambda: app_config.set_language("es"),
            lambda: app_config.set_wizard_complete(False),
            lambda: app_config.set_telemetry_consent(False),
            lambda: app_config.set_appearance(colorway="deep-house"),
        )
        for index, write in enumerate(writers):
            with self.subTest(writer=index):
                write()
                loaded = app_config.load_settings()
                self.assertIs(loaded.icon_follows_theme, False)
                if index < len(writers) - 1:
                    self.assertEqual(loaded.colorway, "daisy-age")
        self.assertEqual(app_config.load_settings().colorway, "deep-house")
        self.assertEqual(app_config.load_settings().language, "es")
        turned_on = app_config.set_appearance(icon_follows_theme=True)
        self.assertIs(turned_on.icon_follows_theme, True)
        self.assertEqual(turned_on.colorway, "deep-house")

    def test_bad_values_are_rejected_or_ignored(self) -> None:
        """Unknown themes and integers are not stored. A bad file falls back.

        Returns:
            None.
        """
        app_config.set_appearance(colorway="motown", icon_follows_theme=False)
        for bad in ("house", "", 1, True):
            with self.subTest(colorway=bad), self.assertRaises(ValueError):
                app_config.set_appearance(colorway=bad)  # type: ignore[arg-type]
        for bad in (1, 0, "true"):
            with self.subTest(flag=bad), self.assertRaises(ValueError):
                app_config.set_appearance(icon_follows_theme=bad)  # type: ignore[arg-type]
        self.assertEqual(app_config.load_settings().colorway, "motown")
        self.assertIs(app_config.load_settings().icon_follows_theme, False)
        with self.assertRaises(ValueError):
            app_config.Settings(install_id=None, telemetry_consent=None, icon_follows_theme=1)  # type: ignore[arg-type]
        for raw in ("nope", 3, ["motown"]):
            (self.config / "settings.json").write_text(json.dumps({"colorway": raw}), encoding="utf-8")
            with self.assertLogs("serato.library.config", level="WARNING"):
                self.assertEqual(app_config.load_settings().colorway, "motown")
        (self.config / "settings.json").write_text(
            json.dumps({"icon_follows_theme": 0}),
            encoding="utf-8",
        )
        with self.assertLogs("serato.library.config", level="WARNING"):
            self.assertIs(app_config.load_settings().icon_follows_theme, True)

    def test_apply_saved_uses_the_file(self) -> None:
        """Startup reads the stored theme instead of always using the default.

        Returns:
            None.
        """
        app_config.set_appearance(colorway="deep-house", icon_follows_theme=True)
        seen: list[Path | None] = []
        result = app_icons.apply_saved(
            platform="darwin",
            adapters=app_icons.IconAdapters(set_dock=lambda path: seen.append(path) or True),
        )
        self.assertEqual(result.colorway, "deep-house")
        self.assertTrue(result.follows_theme)
        self.assertTrue(result.applied)
        assert seen[0] is not None
        self.assertEqual(seen[0].name, "placeholder-deep-house.png")
        app_config.set_appearance(icon_follows_theme=False)
        cleared: list[Path | None] = []
        again = app_icons.apply_saved(
            platform="darwin",
            adapters=app_icons.IconAdapters(set_dock=lambda path: cleared.append(path) or True),
        )
        self.assertEqual(cleared, [None])
        self.assertFalse(again.follows_theme)


class AppearanceApiTests(unittest.TestCase):
    """POST and GET /api/settings carry the theme."""

    def setUp(self) -> None:
        """Start a fixture library and isolate settings.

        Returns:
            None.
        """
        self.library = TempLibrary()
        self.library.__enter__()
        self._tmp = tempfile.TemporaryDirectory()
        self.config = Path(self._tmp.name) / "config"
        self.config.mkdir()
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: str(self.config)})
        self._env.start()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server_handler())
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.httpd.server_address
        self.base = f"http://{host}:{port}"

    def tearDown(self) -> None:
        """Stop the server and remove the temporary files.

        Returns:
            None.
        """
        self.httpd.shutdown()
        self.httpd.server_close()
        self.thread.join(timeout=3)
        self._env.stop()
        self._tmp.cleanup()
        self.library.__exit__(None, None, None)

    def test_post_saves_and_reports_the_icon(self) -> None:
        """A theme save is remembered and the icon result is in the response.

        Returns:
            None.
        """
        result = app_icons.IconResult(
            True,
            "darwin",
            "dock",
            "ok",
            "deep-house",
            True,
            "/img/icons/placeholder-deep-house.svg",
        )
        with mock.patch("app_icons.apply_saved", return_value=result) as apply:
            status, body = _request(self.base, "/api/settings", {"colorway": "deep-house"})
        self.assertEqual(status, 200)
        assert isinstance(body, dict)
        self.assertEqual(body["colorway"], "deep-house")
        self.assertIs(body["icon_follows_theme"], True)
        self.assertEqual(body["icon_href"], "/img/icons/placeholder-deep-house.svg")
        self.assertEqual(body["icon"]["target"], "dock")
        apply.assert_called_once_with()
        status, fetched = _request(self.base, "/api/settings")
        self.assertEqual(status, 200)
        assert isinstance(fetched, dict)
        self.assertEqual(fetched["colorway"], "deep-house")
        self.assertNotIn("icon", fetched)
        with mock.patch("app_icons.apply_saved", return_value=result) as apply:
            status, cleared = _request(self.base, "/api/settings", {"icon_follows_theme": False})
        self.assertEqual(status, 200)
        assert isinstance(cleared, dict)
        self.assertIs(cleared["icon_follows_theme"], False)
        self.assertEqual(cleared["icon_href"], "/img/icons/default.svg")
        self.assertEqual(cleared["colorway"], "deep-house")
        apply.assert_called_once_with()

    def test_bad_appearance_is_refused(self) -> None:
        """Unknown themes, integers, and extra keys leave the file unchanged.

        Returns:
            None.
        """
        app_config.set_appearance(colorway="daisy-age", icon_follows_theme=False)
        before = (self.config / "settings.json").read_text(encoding="utf-8")
        payloads = (
            {"colorway": "house"},
            {"colorway": 1},
            {"icon_follows_theme": 1},
            {"icon_follows_theme": "false"},
            {"colorway": "motown", "language": "es"},
            {},
        )
        for payload in payloads:
            with self.subTest(payload=payload):
                status, body = _request(self.base, "/api/settings", payload)
                self.assertEqual(status, 400)
                self.assertEqual(body, {"error": "That request is not valid.", "code": "invalid_request"})
        self.assertEqual((self.config / "settings.json").read_text(encoding="utf-8"), before)

    def test_failed_write_names_the_theme(self) -> None:
        """A disk error is a 500 with its own code, and the icon is not applied.

        Returns:
            None.
        """
        with (
            mock.patch.object(app_config, "save_settings", side_effect=OSError("disk full")),
            mock.patch("app_icons.apply_saved") as apply,
        ):
            status, body = _request(self.base, "/api/settings", {"colorway": "motown"})
        self.assertEqual(status, 500)
        self.assertEqual(body, {"error": "The theme could not be saved.", "code": "theme_not_saved"})
        apply.assert_not_called()


def server_handler() -> type:
    """Return the request handler class.

    Returns:
        ``server.Handler``. Imported here so the icon module can load
        without the audio decoder.
    """
    import server

    return server.Handler
