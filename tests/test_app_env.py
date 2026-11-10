"""CRATECRAFT_* variables, with the pre-rename SERATO_LIBRARY_* fallback.

The cases patch the environment only. No file outside a temporary
folder is read or written.
"""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import app_env
import desktop
import files
import legacy_library
import serato_logs


def _without(*suffixes: str) -> dict[str, str]:
    """Return the environment without the new or old names for ``suffixes``.

    Args:
        suffixes: Variable suffixes to drop under both prefixes.

    Returns:
        A copy of ``os.environ`` for ``mock.patch.dict(..., clear=True)``.
    """
    dropped = {app_env.name(s) for s in suffixes} | {app_env.legacy_name(s) for s in suffixes}
    return {key: value for key, value in os.environ.items() if key not in dropped}


class LookupTests(unittest.TestCase):
    """Check the lookup order of :func:`app_env.get`."""

    def test_names(self) -> None:
        """Build both names from one suffix.

        Returns:
            None. The test fails if a prefix changes.
        """
        self.assertEqual(app_env.name("SMOKE"), "CRATECRAFT_SMOKE")
        self.assertEqual(app_env.legacy_name("SMOKE"), "SERATO_LIBRARY_SMOKE")

    def test_new_name_first(self) -> None:
        """Prefer CRATECRAFT_ when both names are set.

        Returns:
            None. The test fails if the old name wins.
        """
        env = _without("TRASH")
        env.update({"CRATECRAFT_TRASH": "/new", "SERATO_LIBRARY_TRASH": "/old"})
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertEqual(app_env.get("TRASH"), "/new")
            self.assertEqual(app_env.source("TRASH"), "CRATECRAFT_TRASH")

    def test_old_name_fallback(self) -> None:
        """Read SERATO_LIBRARY_ when the new name is missing or blank.

        Returns:
            None. The test fails if an older script loses its setting.
        """
        env = _without("TRASH")
        env["SERATO_LIBRARY_TRASH"] = "/old"
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertEqual(app_env.get("TRASH"), "/old")
        env["CRATECRAFT_TRASH"] = " "
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertEqual(app_env.get("TRASH"), "/old")

    def test_default_when_unset(self) -> None:
        """Return the default when neither name is set.

        Returns:
            None. The test fails if a value appears from nowhere.
        """
        with mock.patch.dict(os.environ, _without("TRASH"), clear=True):
            self.assertIsNone(app_env.get("TRASH"))
            self.assertEqual(app_env.get("TRASH", ""), "")
            self.assertIsNone(app_env.source("TRASH"))


class ConsumerTests(unittest.TestCase):
    """Each module that reads a variable honors the old name."""

    def test_no_window_old_name(self) -> None:
        """SERATO_LIBRARY_NO_WINDOW=1 still skips the window.

        Returns:
            None. The test fails if the old flag is ignored.
        """
        env = _without("NO_WINDOW")
        env["SERATO_LIBRARY_NO_WINDOW"] = "1"
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertTrue(desktop.window_skipped([]))
        env = _without("NO_WINDOW")
        env["CRATECRAFT_NO_WINDOW"] = "1"
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertTrue(desktop.window_skipped([]))
        with mock.patch.dict(os.environ, _without("NO_WINDOW"), clear=True):
            self.assertFalse(desktop.window_skipped([]))

    def test_logs_and_home_serato_old_names(self) -> None:
        """The Serato log folder and home _Serato_ overrides keep the old names.

        Returns:
            None. The test fails if either override is ignored.
        """
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw).resolve()
            env = _without("LOGS", "HOME_SERATO")
            env["SERATO_LIBRARY_LOGS"] = str(folder / "Logs")
            env["SERATO_LIBRARY_HOME_SERATO"] = str(folder / "_Serato_")
            with mock.patch.dict(os.environ, env, clear=True):
                self.assertEqual(serato_logs.session_directory(), folder / "Logs")
                self.assertEqual(legacy_library.home_serato_folder(), folder / "_Serato_")

    def test_trash_old_name(self) -> None:
        """SERATO_LIBRARY_TRASH still redirects the trash.

        Returns:
            None. The test fails if the old trash override is ignored.
        """
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw).resolve() / "trash"
            env = _without("TRASH")
            env["SERATO_LIBRARY_TRASH"] = str(folder)
            with mock.patch.dict(os.environ, env, clear=True):
                self.assertEqual(files._trash_override(), folder)


if __name__ == "__main__":
    unittest.main()
