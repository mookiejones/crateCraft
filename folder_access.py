"""Read Windows Controlled Folder Access without changing it.

The check is read-only. It never writes the registry and never turns the
setting off. macOS and Linux report ``unsupported`` and do not read a
registry. A missing key means the feature is off. A read that fails is
``unknown``.
"""

from __future__ import annotations

import sys
from collections.abc import Callable

ALLOW_URI = "windowsdefender://RansomwareProtection"
_KEY = (
    r"SOFTWARE\Microsoft\Windows Defender\Windows Defender Exploit Guard"
    r"\Controlled Folder Access"
)
_VALUE = "EnableControlledFolderAccess"
_STATES = {0: "off", 1: "on", 2: "audit"}


def classify(platform: str, value: object, *, readable: bool) -> str:
    """Map a platform and a registry value to a folder-access state.

    Args:
        platform: ``sys.platform`` value. Only ``win32`` is classified.
        value: Registry DWORD, or None when the value is absent.
        readable: False when the value could not be read as an integer.

    Returns:
        ``off``, ``on``, ``audit``, ``unknown``, or ``unsupported``.
        A bool is ``unknown``. ``True`` is not ``on``.
    """
    if platform != "win32":
        return "unsupported"
    if not readable:
        return "unknown"
    if value is None:
        return "off"
    if isinstance(value, bool) or not isinstance(value, int):
        return "unknown"
    return _STATES.get(value, "unknown")


def controlled_folder_access(
    *,
    platform: str | None = None,
    read_value: Callable[[], tuple[object, bool]] | None = None,
) -> str:
    """Report Controlled Folder Access without writing anything.

    Args:
        platform: Platform name. None uses ``sys.platform``.
        read_value: Reader that returns ``(value, readable)``. None on
            Windows uses the registry. Other platforms do not call it.

    Returns:
        ``off``, ``on``, ``audit``, ``unknown``, or ``unsupported``.
        ``OSError`` from the reader, including access denied, is
        ``unknown``. ``ImportError`` is the same result. That is how a
        Windows-shaped check behaves when ``winreg`` is not installed.
    """
    name = sys.platform if platform is None else platform
    if name != "win32":
        return "unsupported"
    reader = _read_registry if read_value is None else read_value
    try:
        value, readable = reader()
    except (OSError, ImportError):
        return "unknown"
    return classify(name, value, readable=readable)


def open_allow_page(
    *,
    platform: str | None = None,
    launch: Callable[[str], None] | None = None,
) -> bool:
    """Open the Windows Security ransomware-protection page.

    Args:
        platform: Platform name. None uses ``sys.platform``.
        launch: Opens the allow URI. None uses ``os.startfile``.

    Returns:
        True when the page was opened. False on macOS and Linux. Those
        platforms do not call ``launch``.

    Raises:
        OSError: If Windows cannot open the page.
    """
    name = sys.platform if platform is None else platform
    if name != "win32":
        return False
    opener = _startfile if launch is None else launch
    opener(ALLOW_URI)
    return True


def _read_registry() -> tuple[object, bool]:
    """Read ``EnableControlledFolderAccess``.

    Returns:
        ``(None, True)`` when the key or the value is absent.
        ``(dword, True)`` for an integer that is not a bool.
        ``(None, False)`` for any other stored type, including a bool.

    Raises:
        OSError: If the key cannot be opened for a reason other than
            absence. ``FileNotFoundError`` is absence, not this error.
    """
    import winreg

    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, _KEY)
    except FileNotFoundError:
        return (None, True)
    try:
        try:
            raw, _kind = winreg.QueryValueEx(key, _VALUE)
        except FileNotFoundError:
            return (None, True)
    finally:
        winreg.CloseKey(key)
    if isinstance(raw, bool) or not isinstance(raw, int):
        return (None, False)
    return (raw, True)


def _startfile(uri: str) -> None:
    """Open one URI with the Windows shell.

    Args:
        uri: Fixed Windows Security URI.

    Raises:
        OSError: If the shell cannot open it.
    """
    import os

    os.startfile(uri)  # type: ignore[attr-defined]
