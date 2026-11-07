"""Running app icon for the selected theme colorway.

The page has four themes. Serato-like is the default: orange on near-black,
with a heartbeat pulse. Dark Club is magenta and mint on black, with a
pulse. Light is ink on cream, with a pulse. Classic is oxblood and cream
on dusty pink, with no pulse. Each icon is a placeholder built from the
circle in ``packaging/menu-icon.png``: that circle is the vinyl disc, and
the equalizer halo, straight tonearm, and crossfader are drawn on it. The
word PLACEHOLDER is part of the picture. These are not final brand art.

On macOS the running Dock icon changes. The Finder icon, which is the
bundle's ``.icns``, is not written. On Windows the window and taskbar icon
change. The executable file is not written. Any other platform, or a Mac
without the AppKit frameworks, keeps the choice and leaves the icon alone.

iOS is not a target. A later iOS build would list the four images under
``CFBundleAlternateIcons`` and call ``UIApplication.shared.setAlternateIconName(_:)``.
The system shows its own confirmation alert before the home-screen icon
changes. ``setAlternateIconName`` only accepts names that were in the app
bundle when it was signed, so the images cannot be swapped in later. Passing
``nil`` restores the primary icon. That call is not made here.

Nothing in this module writes the Serato library, a bundle icon, or an
executable. ``write_assets`` regenerates the committed PNG and ICO files
and refuses to write anywhere but the source ``static/img/icons`` directory.
"""

from __future__ import annotations

import logging
import math
import struct
import sys
import threading
import zlib
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger("serato.library.icons")

COLORWAYS = ("serato-like", "dark-club", "light", "classic")
DEFAULT_COLORWAY = "serato-like"
# Saved ids from the accent-only picker. Load and save map them to Classic.
LEGACY_COLORWAYS = {
    "motown": "classic",
    "deep-house": "classic",
    "daisy-age": "classic",
}
ICON_SIZE = 256
# The pulse bar is drawn through this pixel for every theme except Classic.
HEARTBEAT_PIXEL = (128, 148)
WINDOW_TITLE = "Serato Library"
# Stable id so Windows uses this window's icon on the taskbar instead of
# grouping the process under the host executable. This does not edit the exe.
APP_USER_MODEL_ID = "Serato.Library"
WM_SETICON = 0x0080
ICON_SMALL = 0
ICON_BIG = 1
IMAGE_ICON = 1
LR_LOADFROMFILE = 0x0010
_SUFFIXES = frozenset({"png", "ico", "svg"})
_lock = threading.Lock()
_bound_window: object | None = None

Color = tuple[int, int, int, int]


def _rgba(hex_color: str) -> Color:
    """Return one opaque color from ``#rrggbb``.

    Args:
        hex_color: Six hex digits with a leading hash.

    Returns:
        Red, green, blue, and alpha 255.
    """
    return (
        int(hex_color[1:3], 16),
        int(hex_color[3:5], 16),
        int(hex_color[5:7], 16),
        255,
    )


@dataclass(frozen=True)
class Palette:
    """Colors for one placeholder icon.

    Attributes:
        ground: Field behind the record.
        disc: Vinyl fill. This is the recolored circle from the existing logo.
        groove: Ring lines on the vinyl.
        label: Center label.
        arm: Straight tonearm.
        bar: Equalizer halo, first color.
        bar_alt: Equalizer halo, second color.
        fader: Crossfader track.
        knob: Crossfader cap.
        mark: PLACEHOLDER lettering.
        heartbeat: Pulse line, or None for Classic.
    """

    ground: Color
    disc: Color
    groove: Color
    label: Color
    arm: Color
    bar: Color
    bar_alt: Color
    fader: Color
    knob: Color
    mark: Color
    heartbeat: Color | None


PALETTES: dict[str, Palette] = {
    "serato-like": Palette(
        ground=_rgba("#111111"),
        disc=_rgba("#1A1A1A"),
        groove=_rgba("#2A2A2A"),
        label=_rgba("#FF6A00"),
        arm=_rgba("#FF6A00"),
        bar=_rgba("#FF6A00"),
        bar_alt=_rgba("#F0F0F0"),
        fader=_rgba("#2A2A2A"),
        knob=_rgba("#FF6A00"),
        mark=_rgba("#F0F0F0"),
        heartbeat=_rgba("#FF6A00"),
    ),
    "dark-club": Palette(
        ground=_rgba("#050508"),
        disc=_rgba("#14141E"),
        groove=_rgba("#2A2A3A"),
        label=_rgba("#3DF0C8"),
        arm=_rgba("#3DF0C8"),
        bar=_rgba("#3DF0C8"),
        bar_alt=_rgba("#FF3DBE"),
        fader=_rgba("#2A2A3A"),
        knob=_rgba("#FF3DBE"),
        mark=_rgba("#F5F7FF"),
        heartbeat=_rgba("#FF3DBE"),
    ),
    "light": Palette(
        ground=_rgba("#EBE4D6"),
        disc=_rgba("#1B140E"),
        groove=_rgba("#5C5348"),
        label=_rgba("#C42F10"),
        arm=_rgba("#C42F10"),
        bar=_rgba("#C42F10"),
        bar_alt=_rgba("#1B140E"),
        fader=_rgba("#D9CFBF"),
        knob=_rgba("#C42F10"),
        mark=_rgba("#1B140E"),
        heartbeat=_rgba("#C42F10"),
    ),
    "classic": Palette(
        ground=_rgba("#E4B3BC"),
        disc=_rgba("#6E2436"),
        groove=_rgba("#4A1522"),
        label=_rgba("#F4E4C4"),
        arm=_rgba("#F4E4C4"),
        bar=_rgba("#F4E4C4"),
        bar_alt=_rgba("#6E2436"),
        fader=_rgba("#F4E4C4"),
        knob=_rgba("#6E2436"),
        mark=_rgba("#4A1522"),
        heartbeat=None,
    ),
}


def normalize_colorway(value: str) -> str | None:
    """Return a current theme id, mapping a legacy accent id to Classic.

    Args:
        value: A theme id from settings or a request.

    Returns:
        A member of :data:`COLORWAYS`, or None when ``value`` is unknown.
    """
    if value in COLORWAYS:
        return value
    mapped = LEGACY_COLORWAYS.get(value)
    return mapped if mapped in COLORWAYS else None

# 5x7 glyphs for the PLACEHOLDER mark. 1 is ink.
_GLYPHS: dict[str, tuple[str, ...]] = {
    "P": ("11110", "10001", "10001", "11110", "10000", "10000", "10000"),
    "L": ("10000", "10000", "10000", "10000", "10000", "10000", "11111"),
    "A": ("01110", "10001", "10001", "11111", "10001", "10001", "10001"),
    "C": ("01111", "10000", "10000", "10000", "10000", "10000", "01111"),
    "E": ("11111", "10000", "10000", "11110", "10000", "10000", "11111"),
    "H": ("10001", "10001", "10001", "11111", "10001", "10001", "10001"),
    "O": ("01110", "10001", "10001", "10001", "10001", "10001", "01110"),
    "D": ("11110", "10001", "10001", "10001", "10001", "10001", "11110"),
    "R": ("11110", "10001", "10001", "11110", "10100", "10010", "10001"),
}
_TEXT_SCALE = 2
_TEXT = "PLACEHOLDER"


@dataclass(frozen=True)
class IconResult:
    """What a request to change the running icon did.

    Attributes:
        applied: True when the Dock or the window icon was set.
        platform: ``sys.platform`` value used for the decision.
        target: ``dock``, ``window``, or ``unsupported``.
        reason: ``ok``, ``unsupported``, ``no-window``, ``missing-icon``,
            or ``error``.
        colorway: Theme id the request was for.
        follows_theme: The saved checkbox. False restores the usual icon.
        href: Page icon URL for this choice.
    """

    applied: bool
    platform: str
    target: str
    reason: str
    colorway: str
    follows_theme: bool
    href: str

    def as_json(self) -> dict[str, object]:
        """Return the result the settings response includes.

        Returns:
            The fields the page reads. ``applied`` is a boolean.
        """
        return {
            "applied": self.applied,
            "platform": self.platform,
            "target": self.target,
            "reason": self.reason,
            "colorway": self.colorway,
            "follows_theme": self.follows_theme,
            "href": self.href,
        }


@dataclass(frozen=True)
class IconAdapters:
    """Platform calls a test can replace.

    Attributes:
        set_dock: Sets the Dock image. None restores the default Dock icon.
            Returns True when the call was made.
        find_hwnd: Window handle, or 0 when there is no window.
        send_icon: Sends both taskbar icon sizes. Returns True on success.
        load_icon: Loads an ``.ico`` file. Returns 0 when it fails.
        default_icon: Icon handle from the executable, or 0. Must not write it.
    """

    set_dock: Callable[[Path | None], bool] | None = None
    find_hwnd: Callable[[], int] | None = None
    send_icon: Callable[[int, int], bool] | None = None
    load_icon: Callable[[Path], int] | None = None
    default_icon: Callable[[], int] | None = None


def placeholder_origin() -> tuple[int, int]:
    """Return the top-left pixel of the PLACEHOLDER mark.

    Returns:
        X and y of the first ink pixel, at the size ``png_bytes`` draws.
    """
    width = (5 + 1) * len(_TEXT) - 1
    return ((ICON_SIZE - width * _TEXT_SCALE) // 2, 8)


def icon_href(colorway: str, follow: bool) -> str:
    """Return the page icon for this choice.

    Args:
        colorway: A theme id. An unknown id uses the default colorway.
        follow: False selects the plain circle. True selects the colorway.

    Returns:
        A path under ``/img/icons/``.
    """
    if follow is not True:
        return "/img/icons/default.svg"
    resolved = normalize_colorway(colorway)
    if resolved is None:
        resolved = DEFAULT_COLORWAY
    return f"/img/icons/placeholder-{resolved}.svg"


def icons_dir() -> Path:
    """Return the directory of the committed icon files.

    Returns:
        ``static/img/icons`` beside the page, including a frozen build.
    """
    import server

    return server.STATIC / "img" / "icons"


def icon_file(colorway: str, suffix: str, *, root: Path | None = None) -> Path | None:
    """Return one icon file inside the icon directory, or None.

    Args:
        colorway: A theme id. Anything else is refused, including a path.
        suffix: ``png``, ``ico``, or ``svg``.
        root: Directory to read. None uses :func:`icons_dir`.

    Returns:
        The file, when it is a real file inside ``root``. None for a
        missing file, a symlink, or a path that resolves outside ``root``.

    The file is not opened. A symlink is refused before it is followed.
    """
    if colorway not in COLORWAYS or suffix not in _SUFFIXES:
        return None
    directory = icons_dir() if root is None else root
    try:
        base = directory.resolve()
        path = directory / f"placeholder-{colorway}.{suffix}"
        if path.is_symlink() or not path.is_file():
            return None
        resolved = path.resolve()
        if not resolved.is_relative_to(base):
            return None
    except OSError:
        return None
    return path


def png_bytes(colorway: str) -> bytes:
    """Draw one placeholder icon.

    Args:
        colorway: A theme id.

    Returns:
        A 256 by 256 RGBA PNG.

    Raises:
        ValueError: If ``colorway`` is not one of :data:`COLORWAYS`.
    """
    if colorway not in COLORWAYS:
        raise ValueError("colorway is not a known theme.")
    buffer = bytearray(ICON_SIZE * ICON_SIZE * 4)
    _draw(buffer, PALETTES[colorway])
    return _png(buffer)


def ico_bytes(png: bytes) -> bytes:
    """Wrap a 256 by 256 PNG in an ICO.

    Args:
        png: PNG bytes from :func:`png_bytes`.

    Returns:
        An ICO whose only image is that PNG. Windows Vista and later
        load this with ``LoadImage``. The executable is not involved.

    Raises:
        ValueError: If ``png`` is not a PNG.
    """
    if not png.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("ico needs a png")
    header = struct.pack("<HHH", 0, 1, 1)
    entry = struct.pack("<BBBBHHII", 0, 0, 0, 0, 1, 32, len(png), 22)
    return header + entry + png


def write_assets() -> None:
    """Regenerate the committed PNG and ICO files from :func:`png_bytes`.

    Raises:
        ValueError: If the icon directory is not the source tree's
            ``static/img/icons``. A frozen build and any other path are
            refused before a file is opened for writing.

    SVG files are hand-written and are not replaced.
    """
    directory = icons_dir()
    source = Path(__file__).resolve().parent / "static" / "img" / "icons"
    if directory.resolve() != source.resolve():
        raise ValueError("Refusing to write icons outside the source tree.")
    if directory.is_symlink():
        raise ValueError("Refusing to write icons through a symlink.")
    directory.mkdir(parents=True, exist_ok=True)
    for colorway in COLORWAYS:
        png = png_bytes(colorway)
        png_path = directory / f"placeholder-{colorway}.png"
        ico_path = directory / f"placeholder-{colorway}.ico"
        if png_path.is_symlink() or ico_path.is_symlink():
            raise ValueError("Refusing to replace a symlinked icon.")
        png_path.write_bytes(png)
        ico_path.write_bytes(ico_bytes(png))


def apply(
    colorway: str,
    follow: bool,
    *,
    platform: str | None = None,
    adapters: IconAdapters | None = None,
    icons_root: Path | None = None,
) -> IconResult:
    """Change the running icon, or report that this platform cannot.

    Args:
        colorway: Theme id.
        follow: True uses the colorway icon. False restores the usual one.
        platform: ``darwin``, ``win32``, or another ``sys.platform`` value.
            None uses this process.
        adapters: Replacement platform calls. None uses the real ones.
        icons_root: Icon directory. None uses :func:`icons_dir`.

    Returns:
        Whether the Dock or the window icon changed. A platform that
        cannot change it returns ``applied`` false and reason
        ``unsupported``. This function does not raise for that case.

    Raises:
        ValueError: If ``colorway`` is unknown or ``follow`` is not a boolean.
    """
    if colorway not in COLORWAYS:
        raise ValueError("colorway is not a known theme.")
    if not isinstance(follow, bool):
        raise ValueError("icon_follows_theme must be a boolean.")
    host = sys.platform if platform is None else platform
    href = icon_href(colorway, follow)
    tools = adapters if adapters is not None else IconAdapters()
    try:
        if host == "darwin":
            return _apply_dock(colorway, follow, href, tools, icons_root)
        if host == "win32":
            return _apply_window(colorway, follow, href, tools, icons_root)
    except Exception:
        logger.exception("The app icon could not be changed")
        return IconResult(False, host, "unsupported", "error", colorway, follow, href)
    return IconResult(False, host, "unsupported", "unsupported", colorway, follow, href)


def apply_saved(
    *,
    platform: str | None = None,
    adapters: IconAdapters | None = None,
) -> IconResult:
    """Apply the icon stored in settings.

    Args:
        platform: Passed to :func:`apply`.
        adapters: Passed to :func:`apply`.

    Returns:
        The same result as :func:`apply`. A settings read failure becomes
        ``reason`` ``error`` and does not raise.
    """
    import app_config

    try:
        settings = app_config.load_settings()
    except Exception:
        logger.exception("The saved theme could not be read")
        return IconResult(
            False,
            sys.platform if platform is None else platform,
            "unsupported",
            "error",
            DEFAULT_COLORWAY,
            True,
            icon_href(DEFAULT_COLORWAY, True),
        )
    return apply(
        settings.colorway,
        settings.icon_follows_theme is True,
        platform=platform,
        adapters=adapters,
    )


def prepare_taskbar() -> None:
    """Let Windows show this window's icon on the taskbar.

    Does nothing on other platforms. Does not rewrite the executable.
    A failure is logged and ignored.
    """
    if sys.platform != "win32":
        return
    try:
        ctypes = __import__("ctypes")
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_USER_MODEL_ID)
    except Exception:
        logger.exception("The taskbar icon id could not be set")


def bind_window(window: object | None) -> None:
    """Remember the desktop window so a later icon change can find it.

    Args:
        window: pywebview window, or None when the window is gone.
    """
    global _bound_window
    with _lock:
        _bound_window = window


def dock_available() -> bool:
    """Return whether this Mac can set the Dock icon.

    Returns:
        True when AppKit imports. False on Linux, Windows, and a Mac
        without the PyObjC frameworks.
    """
    try:
        from AppKit import NSApplication  # noqa: F401
    except Exception:
        return False
    return True


def hwnd_of(window: object | None) -> int:
    """Read a window handle from a pywebview window.

    Args:
        window: Object with ``native.hwnd`` or ``native.Handle``.

    Returns:
        The handle, or 0 when it is missing or unreadable.
    """
    if window is None:
        return 0
    native = getattr(window, "native", None)
    if native is None:
        return 0
    handle = getattr(native, "hwnd", None)
    if handle is None:
        handle = getattr(native, "Handle", None)
    if isinstance(handle, int) and not isinstance(handle, bool):
        return handle
    to_int = getattr(handle, "ToInt64", None) or getattr(handle, "ToInt32", None)
    if not callable(to_int):
        return 0
    try:
        return int(to_int())
    except Exception:
        return 0


def icon_messages(hwnd: int, hicon: int) -> tuple[tuple[int, int, int, int], tuple[int, int, int, int]]:
    """Return the two window-icon messages.

    Args:
        hwnd: Window handle.
        hicon: Icon handle.

    Returns:
        ``WM_SETICON`` for the big icon, then the small icon. Both are
        required. The big one is what the taskbar shows.
    """
    return (
        (hwnd, WM_SETICON, ICON_BIG, hicon),
        (hwnd, WM_SETICON, ICON_SMALL, hicon),
    )


def _apply_dock(
    colorway: str,
    follow: bool,
    href: str,
    adapters: IconAdapters,
    icons_root: Path | None,
) -> IconResult:
    """Set or clear the Dock icon.

    Args:
        colorway: Theme id.
        follow: False clears a custom Dock icon.
        href: Page icon URL.
        adapters: Optional replacement for the AppKit call.
        icons_root: Icon directory.

    Returns:
        A dock result. Missing AppKit is ``unsupported``.
    """
    setter = adapters.set_dock
    if setter is None:
        if not dock_available():
            return IconResult(False, "darwin", "dock", "unsupported", colorway, follow, href)
        setter = _set_dock_image
    if not follow:
        ok = bool(setter(None))
        return IconResult(ok, "darwin", "dock", "ok" if ok else "unsupported", colorway, follow, href)
    path = icon_file(colorway, "png", root=icons_root)
    if path is None:
        return IconResult(False, "darwin", "dock", "missing-icon", colorway, follow, href)
    ok = bool(setter(path))
    return IconResult(ok, "darwin", "dock", "ok" if ok else "unsupported", colorway, follow, href)


def _apply_window(
    colorway: str,
    follow: bool,
    href: str,
    adapters: IconAdapters,
    icons_root: Path | None,
) -> IconResult:
    """Set the window and taskbar icon, or restore the executable's icon.

    Args:
        colorway: Theme id.
        follow: False loads the executable's existing icon into the window.
        href: Page icon URL.
        adapters: Optional replacement calls.
        icons_root: Icon directory.

    Returns:
        A window result. No window is ``no-window``. The executable file
        is not opened for writing.
    """
    find = adapters.find_hwnd or _find_window
    send = adapters.send_icon or _send_window_icon
    hwnd = int(find() or 0)
    if hwnd == 0:
        return IconResult(False, "win32", "window", "no-window", colorway, follow, href)
    if not follow:
        default = adapters.default_icon or _executable_icon
        handle = int(default() or 0)
    else:
        path = icon_file(colorway, "ico", root=icons_root)
        if path is None:
            return IconResult(False, "win32", "window", "missing-icon", colorway, follow, href)
        load = adapters.load_icon or _load_icon_file
        handle = int(load(path) or 0)
    if handle == 0:
        return IconResult(False, "win32", "window", "missing-icon", colorway, follow, href)
    ok = bool(send(hwnd, handle))
    reason = "ok" if ok else "error"
    return IconResult(ok, "win32", "window", reason, colorway, follow, href)


def _set_dock_image(path: Path | None) -> bool:
    """Set the Dock icon on the main thread.

    Args:
        path: PNG file, or None to restore the default Dock icon.

    Returns:
        True when AppKit accepted the call. False when AppKit is missing
        or the file did not load. The bundle icon is not written.
    """
    try:
        from AppKit import NSApplication, NSImage
        from Foundation import NSThread
    except Exception:
        logger.info("Dock icon changes need the macOS AppKit frameworks.")
        return False
    image = None
    if path is not None:
        image = NSImage.alloc().initWithContentsOfFile_(str(path))
        if image is None:
            return False
    app = NSApplication.sharedApplication()

    def assign() -> None:
        app.setApplicationIconImage_(image)

    if NSThread.isMainThread():
        assign()
    else:
        app.performSelectorOnMainThread_withObject_waitUntilDone_(
            "setApplicationIconImage:",
            image,
            True,
        )
    return True


def _find_window() -> int:
    """Return the Serato Library window handle.

    Returns:
        The bound window's handle, or the handle ``FindWindowW`` returns
        for :data:`WINDOW_TITLE`. 0 when neither is available.
    """
    with _lock:
        bound = _bound_window
    found = hwnd_of(bound)
    if found:
        return found
    try:
        ctypes = __import__("ctypes")
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        user32.FindWindowW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR]
        user32.FindWindowW.restype = wintypes.HWND
        return int(user32.FindWindowW(None, WINDOW_TITLE) or 0)
    except Exception:
        logger.info("The window handle could not be read")
        return 0


def _load_icon_file(path: Path) -> int:
    """Load an ICO for ``WM_SETICON``.

    Args:
        path: ICO file. It is not opened for writing.

    Returns:
        The icon handle, or 0.
    """
    try:
        ctypes = __import__("ctypes")
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        user32.LoadImageW.argtypes = [
            wintypes.HINSTANCE,
            wintypes.LPCWSTR,
            wintypes.UINT,
            ctypes.c_int,
            ctypes.c_int,
            wintypes.UINT,
        ]
        user32.LoadImageW.restype = wintypes.HANDLE
        return int(user32.LoadImageW(None, str(path), IMAGE_ICON, 0, 0, LR_LOADFROMFILE) or 0)
    except Exception:
        logger.info("The window icon file could not be loaded")
        return 0


def _executable_icon(path: Path | None = None) -> int:
    """Read the executable's current icon.

    Args:
        path: Executable to read. None uses ``sys.executable``.

    Returns:
        The icon handle, or 0. The file is not opened for writing.
    """
    target = Path(sys.executable) if path is None else path
    try:
        ctypes = __import__("ctypes")
        from ctypes import wintypes

        shell32 = ctypes.windll.shell32
        shell32.ExtractIconW.argtypes = [wintypes.HINSTANCE, wintypes.LPCWSTR, wintypes.UINT]
        shell32.ExtractIconW.restype = wintypes.HICON
        return int(shell32.ExtractIconW(None, str(target), 0) or 0)
    except Exception:
        logger.info("The program icon could not be read")
        return 0


def _send_window_icon(hwnd: int, hicon: int) -> bool:
    """Send the big and small window icons.

    Args:
        hwnd: Window handle.
        hicon: Icon handle.

    Returns:
        True when both messages were sent.
    """
    try:
        ctypes = __import__("ctypes")
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        user32.SendMessageW.argtypes = [
            wintypes.HWND,
            wintypes.UINT,
            wintypes.WPARAM,
            wintypes.LPARAM,
        ]
        user32.SendMessageW.restype = wintypes.LPARAM
        for hwnd_i, message, size, icon in icon_messages(hwnd, hicon):
            user32.SendMessageW(hwnd_i, message, size, icon)
    except Exception:
        logger.info("The window icon could not be set")
        return False
    return True


def _draw(buffer: bytearray, palette: Palette) -> None:
    """Paint one icon into ``buffer``.

    Args:
        buffer: 256 by 256 RGBA pixels, row-major.
        palette: Colorway colors. A missing heartbeat is left unpainted.
    """
    _fill_round_rect(buffer, 0, 0, ICON_SIZE, ICON_SIZE, 56, palette.ground)
    _bars(buffer, palette)
    cx, cy, radius = 128, 116, 70
    _fill_circle(buffer, cx, cy, radius, palette.disc)
    for groove in (58, 46, 34):
        _stroke_circle(buffer, cx, cy, groove, 2, palette.groove)
    _fill_circle(buffer, cx, cy, 20, palette.label)
    _fill_circle(buffer, cx, cy, 4, palette.disc)
    _stroke_segment(buffer, 196, 44, 152, 100, 6, palette.arm)
    _fill_circle(buffer, 196, 44, 7, palette.arm)
    if palette.heartbeat is not None:
        hx, hy = HEARTBEAT_PIXEL
        _fill_rect(buffer, hx - 50, hy - 2, hx + 50, hy + 3, palette.heartbeat)
        _fill_rect(buffer, hx - 22, hy - 16, hx - 16, hy - 2, palette.heartbeat)
    _fill_round_rect(buffer, 48, 214, 160, 16, 8, palette.fader)
    _fill_round_rect(buffer, 116, 206, 24, 32, 5, palette.knob)
    origin_x, origin_y = placeholder_origin()
    _draw_text(buffer, _TEXT, origin_x, origin_y, _TEXT_SCALE, palette.mark)


def _bars(buffer: bytearray, palette: Palette) -> None:
    """Draw the equalizer halo above the record.

    Args:
        buffer: Icon pixels.
        palette: Bar colors. They alternate.
    """
    cx, cy = 128, 116
    heights = (16, 26, 34, 22, 36, 24, 18, 28)
    for index, height in enumerate(heights):
        angle = math.radians(-75 + index * 21)
        color = palette.bar if index % 2 == 0 else palette.bar_alt
        for step in range(height):
            dist = 84 + step
            x = cx + math.sin(angle) * dist
            y = cy - math.cos(angle) * dist
            _fill_circle(buffer, int(round(x)), int(round(y)), 3, color)


def _draw_text(
    buffer: bytearray,
    text: str,
    x: int,
    y: int,
    scale: int,
    color: Color,
) -> None:
    """Draw PLACEHOLDER with the built-in glyphs.

    Args:
        buffer: Icon pixels.
        text: Uppercase letters present in ``_GLYPHS``.
        x: Left edge.
        y: Top edge.
        scale: Pixel size of one glyph cell.
        color: Letter color.
    """
    cursor = x
    for char in text:
        rows = _GLYPHS[char]
        for row, bits in enumerate(rows):
            for col, bit in enumerate(bits):
                if bit != "1":
                    continue
                for sy in range(scale):
                    for sx in range(scale):
                        _put(buffer, cursor + col * scale + sx, y + row * scale + sy, color)
        cursor += (len(rows[0]) + 1) * scale


def _put(buffer: bytearray, x: int, y: int, color: Color) -> None:
    """Write one pixel when it is inside the icon.

    Args:
        buffer: Icon pixels.
        x: Column.
        y: Row.
        color: RGBA.
    """
    if x < 0 or y < 0 or x >= ICON_SIZE or y >= ICON_SIZE:
        return
    start = (y * ICON_SIZE + x) * 4
    buffer[start : start + 4] = bytes(color)


def _fill_circle(buffer: bytearray, cx: int, cy: int, radius: float, color: Color) -> None:
    """Fill a circle.

    Args:
        buffer: Icon pixels.
        cx: Center column.
        cy: Center row.
        radius: Radius in pixels.
        color: Fill.
    """
    limit = radius * radius
    reach = int(radius) + 1
    for y in range(cy - reach, cy + reach + 1):
        for x in range(cx - reach, cx + reach + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= limit:
                _put(buffer, x, y, color)


def _stroke_circle(
    buffer: bytearray,
    cx: int,
    cy: int,
    radius: float,
    width: float,
    color: Color,
) -> None:
    """Stroke a circle.

    Args:
        buffer: Icon pixels.
        cx: Center column.
        cy: Center row.
        radius: Radius of the middle of the stroke.
        width: Stroke width in pixels.
        color: Stroke.
    """
    outer = (radius + width / 2) ** 2
    inner = (radius - width / 2) ** 2
    reach = int(radius + width) + 1
    for y in range(cy - reach, cy + reach + 1):
        for x in range(cx - reach, cx + reach + 1):
            dist = (x - cx) ** 2 + (y - cy) ** 2
            if inner <= dist <= outer:
                _put(buffer, x, y, color)


def _fill_rect(
    buffer: bytearray,
    x0: int,
    y0: int,
    x1: int,
    y1: int,
    color: Color,
) -> None:
    """Fill a half-open rectangle.

    Args:
        buffer: Icon pixels.
        x0: Left.
        y0: Top.
        x1: Right, excluded.
        y1: Bottom, excluded.
        color: Fill.
    """
    for y in range(y0, y1):
        for x in range(x0, x1):
            _put(buffer, x, y, color)


def _fill_round_rect(
    buffer: bytearray,
    x: int,
    y: int,
    width: int,
    height: int,
    radius: int,
    color: Color,
) -> None:
    """Fill a rounded rectangle.

    Args:
        buffer: Icon pixels.
        x: Left.
        y: Top.
        width: Width in pixels.
        height: Height in pixels.
        radius: Corner radius.
        color: Fill.
    """
    for py in range(y, y + height):
        for px in range(x, x + width):
            if _inside_round_rect(px, py, x, y, width, height, radius):
                _put(buffer, px, py, color)


def _inside_round_rect(
    px: int,
    py: int,
    left: int,
    top: int,
    width: int,
    height: int,
    radius: int,
) -> bool:
    """Return whether one pixel is inside a rounded rectangle.

    Args:
        px: Column.
        py: Row.
        left: Rectangle left.
        top: Rectangle top.
        width: Width.
        height: Height.
        radius: Corner radius.

    Returns:
        True when the pixel should be painted.
    """
    right = left + width - 1
    bottom = top + height - 1
    if px < left or py < top or px > right or py > bottom:
        return False
    in_x = px < left + radius or px > right - radius
    in_y = py < top + radius or py > bottom - radius
    if not (in_x and in_y):
        return True
    corner_x = left + radius if px < left + radius else right - radius
    corner_y = top + radius if py < top + radius else bottom - radius
    return (px - corner_x) ** 2 + (py - corner_y) ** 2 <= radius * radius


def _stroke_segment(
    buffer: bytearray,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    width: float,
    color: Color,
) -> None:
    """Stroke a straight line.

    Args:
        buffer: Icon pixels.
        x0: Start column.
        y0: Start row.
        x1: End column.
        y1: End row.
        width: Stroke width.
        color: Stroke.
    """
    radius = width / 2
    left = int(min(x0, x1) - radius - 1)
    right = int(max(x0, x1) + radius + 2)
    top = int(min(y0, y1) - radius - 1)
    bottom = int(max(y0, y1) + radius + 2)
    dx = x1 - x0
    dy = y1 - y0
    length2 = dx * dx + dy * dy
    limit = radius * radius
    for y in range(top, bottom):
        for x in range(left, right):
            if length2 == 0:
                dist = (x - x0) ** 2 + (y - y0) ** 2
            else:
                t = ((x - x0) * dx + (y - y0) * dy) / length2
                t = 0.0 if t < 0 else 1.0 if t > 1 else t
                px = x0 + t * dx
                py = y0 + t * dy
                dist = (x - px) ** 2 + (y - py) ** 2
            if dist <= limit:
                _put(buffer, x, y, color)


def _png(buffer: bytearray) -> bytes:
    """Encode an RGBA buffer as a PNG.

    Args:
        buffer: Row-major pixels from :func:`_draw`.

    Returns:
        PNG bytes. Each row uses filter 0.
    """
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = bytearray()
    stride = ICON_SIZE * 4
    for y in range(ICON_SIZE):
        raw.append(0)
        raw.extend(buffer[y * stride : (y + 1) * stride])
    ihdr = struct.pack(">IIBBBBB", ICON_SIZE, ICON_SIZE, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
