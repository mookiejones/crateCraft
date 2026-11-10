"""Environment variables that tune or test the app.

The app was called Serato Library before it became crateCraft. Its
variables used the ``SERATO_LIBRARY_`` prefix. The new prefix is
``CRATECRAFT_``. Each lookup reads the new name first and falls back to
the old one, so a script or shortcut written for an earlier build keeps
working.
"""

from __future__ import annotations

import os

PREFIX = "CRATECRAFT_"
LEGACY_PREFIX = "SERATO_LIBRARY_"


def name(suffix: str) -> str:
    """Return the current variable name for ``suffix``.

    Args:
        suffix: Part after the prefix, such as ``CONFIG_DIR``.

    Returns:
        ``CRATECRAFT_`` plus ``suffix``.
    """
    return PREFIX + suffix


def legacy_name(suffix: str) -> str:
    """Return the name an earlier build read for ``suffix``.

    Args:
        suffix: Part after the prefix, such as ``CONFIG_DIR``.

    Returns:
        ``SERATO_LIBRARY_`` plus ``suffix``.
    """
    return LEGACY_PREFIX + suffix


def source(suffix: str) -> str | None:
    """Return which variable :func:`get` reads for ``suffix``.

    Args:
        suffix: Part after the prefix.

    Returns:
        The new name when it holds a non-blank value, else the old name
        when that is set, else None.
    """
    current = os.environ.get(name(suffix))
    if current is not None and current.strip():
        return name(suffix)
    if legacy_name(suffix) in os.environ:
        return legacy_name(suffix)
    return None


def get(suffix: str, default: str | None = None) -> str | None:
    """Read a variable by its new name, then by its old name.

    A blank new value does not hide an old value, so clearing the new
    name falls back to the old one rather than switching an option off.

    Args:
        suffix: Part after the prefix, such as ``CONFIG_DIR``.
        default: Value when neither name is set.

    Returns:
        The raw value, not stripped, or ``default``.
    """
    chosen = source(suffix)
    if chosen is None:
        return default
    return os.environ.get(chosen, default)
