"""Windows Controlled Folder Access: read-only state, and the allow page.

The cases inject the platform and the registry reader. They do not open
the live registry, and they do not change a Windows setting.
"""

from __future__ import annotations

import os
import sys
import tempfile
import threading
import types
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import app_config
import folder_access
import library
import server
import setup_flow
from tests.fixture import TempLibrary
from tests.test_setup import _request


class ClassifyTests(unittest.TestCase):
    """The state names come from the platform and the DWORD."""

    def test_other_platforms_are_unsupported_and_do_not_read(self) -> None:
        """macOS and Linux stay unsupported even when a reader is supplied.

        Returns:
            None. The test fails if a non-Windows host reports on, or if
            the reader is called.
        """
        reader = mock.Mock(return_value=(1, True))
        for name in ("darwin", "linux"):
            with self.subTest(platform=name):
                self.assertEqual(
                    folder_access.controlled_folder_access(platform=name, read_value=reader),
                    "unsupported",
                )
                self.assertEqual(folder_access.classify(name, 1, readable=True), "unsupported")
        reader.assert_not_called()

    def test_dword_values(self) -> None:
        """0 is off, 1 is on, 2 is audit, and any other integer is unknown.

        A bool is not a DWORD. True must not count as on.

        Returns:
            None. The test fails if audit is silent or True is treated as on.
        """
        cases = [
            (0, "off"),
            (1, "on"),
            (2, "audit"),
            (3, "unknown"),
            (True, "unknown"),
            (False, "unknown"),
            ("1", "unknown"),
            (None, "off"),
        ]
        for value, expected in cases:
            with self.subTest(value=value):
                self.assertEqual(
                    folder_access.classify("win32", value, readable=True),
                    expected,
                )
        self.assertEqual(folder_access.classify("win32", 1, readable=False), "unknown")

    def test_reader_errors_are_unknown_and_absent_is_off(self) -> None:
        """A denied registry read is unknown. A missing key is off.

        Returns:
            None. The test fails if a missing key warns, or if access
            denied is reported as off.
        """
        denied = mock.Mock(side_effect=PermissionError("denied"))
        self.assertEqual(
            folder_access.controlled_folder_access(platform="win32", read_value=denied),
            "unknown",
        )
        missing = mock.Mock(side_effect=ModuleNotFoundError("No module named 'winreg'"))
        self.assertEqual(
            folder_access.controlled_folder_access(platform="win32", read_value=missing),
            "unknown",
        )
        absent = mock.Mock(return_value=(None, True))
        self.assertEqual(
            folder_access.controlled_folder_access(platform="win32", read_value=absent),
            "off",
        )
        on = mock.Mock(return_value=(1, True))
        self.assertEqual(
            folder_access.controlled_folder_access(platform="win32", read_value=on),
            "on",
        )

    def test_registry_absent_key_and_value_are_off(self) -> None:
        """FileNotFoundError from the key or the value is off, and the key is closed.

        Returns:
            None. The test fails if a missing key is unknown.
        """
        missing = types.SimpleNamespace(
            HKEY_LOCAL_MACHINE=1,
            OpenKey=mock.Mock(side_effect=FileNotFoundError),
            QueryValueEx=mock.Mock(),
            CloseKey=mock.Mock(),
        )
        with mock.patch.dict(sys.modules, {"winreg": missing}):
            self.assertEqual(folder_access._read_registry(), (None, True))
        missing.QueryValueEx.assert_not_called()

        key = object()
        opened = types.SimpleNamespace(
            HKEY_LOCAL_MACHINE=1,
            OpenKey=mock.Mock(return_value=key),
            QueryValueEx=mock.Mock(side_effect=FileNotFoundError),
            CloseKey=mock.Mock(),
        )
        with mock.patch.dict(sys.modules, {"winreg": opened}):
            self.assertEqual(folder_access._read_registry(), (None, True))
        opened.CloseKey.assert_called_once_with(key)

        opened.QueryValueEx.side_effect = None
        opened.QueryValueEx.return_value = (True, 4)
        with mock.patch.dict(sys.modules, {"winreg": opened}):
            self.assertEqual(folder_access._read_registry(), (None, False))

        opened.QueryValueEx.return_value = (1, 4)
        with mock.patch.dict(sys.modules, {"winreg": opened}):
            self.assertEqual(folder_access._read_registry(), (1, True))

        opened.OpenKey.side_effect = PermissionError("denied")
        with mock.patch.dict(sys.modules, {"winreg": opened}):
            with self.assertRaises(PermissionError):
                folder_access._read_registry()


class OpenPageTests(unittest.TestCase):
    """Allow opens one fixed URI, and only on Windows."""

    def test_non_windows_does_not_launch(self) -> None:
        """macOS and Linux report opened false and do not call launch.

        Returns:
            None. The test fails if startfile runs off Windows.
        """
        launch = mock.Mock()
        self.assertFalse(folder_access.open_allow_page(platform="darwin", launch=launch))
        self.assertFalse(folder_access.open_allow_page(platform="linux", launch=launch))
        launch.assert_not_called()

    def test_windows_launches_only_the_allow_uri(self) -> None:
        """The only argument is the ransomware-protection URI.

        Returns:
            None. The test fails if another path or URI is opened.
        """
        launch = mock.Mock()
        self.assertTrue(folder_access.open_allow_page(platform="win32", launch=launch))
        launch.assert_called_once_with(folder_access.ALLOW_URI)
        self.assertEqual(launch.call_args.args, ("windowsdefender://RansomwareProtection",))


class StatusFieldTests(unittest.TestCase):
    """The status field is additive and does not change writable."""

    def test_on_stays_writable_and_an_error_is_unknown(self) -> None:
        """A warning does not refuse the library. A reader error is unknown.

        Returns:
            None. The test fails if on forces writable false, or if an
            OSError or a missing ``winreg`` escapes status.
        """
        with TempLibrary():
            with mock.patch("folder_access.controlled_folder_access", return_value="on"):
                warned = library.status()
            with mock.patch("folder_access.controlled_folder_access", return_value="off"):
                quiet = library.status()
            with mock.patch(
                "folder_access.controlled_folder_access",
                side_effect=OSError("denied"),
            ):
                failed = library.status()
            with mock.patch(
                "folder_access.controlled_folder_access",
                side_effect=ModuleNotFoundError("No module named 'winreg'"),
            ):
                missing = library.status()
        self.assertEqual(warned["controlled_folder_access"], "on")
        self.assertTrue(warned["writable"])
        self.assertEqual(quiet["controlled_folder_access"], "off")
        self.assertTrue(quiet["writable"])
        self.assertEqual(failed["controlled_folder_access"], "unknown")
        self.assertTrue(failed["writable"])
        self.assertEqual(missing["controlled_folder_access"], "unknown")
        self.assertTrue(missing["writable"])


class FolderAccessApiTests(unittest.TestCase):
    """POST /api/folder-access is answered before the legacy-library gate."""

    def setUp(self) -> None:
        """Start a fixture library and a local server.

        Returns:
            None.
        """
        self.library = TempLibrary()
        self.library.__enter__()
        self._tmp = tempfile.TemporaryDirectory()
        config = Path(self._tmp.name) / "config"
        logs = Path(self._tmp.name) / "logs"
        config.mkdir()
        logs.mkdir()
        self._env = mock.patch.dict(
            os.environ,
            {app_config.CONFIG_ENV: str(config), app_config.LOG_ENV: str(logs)},
        )
        self._env.start()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
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

    def test_open_unknown_and_failure(self) -> None:
        """Open returns opened, a bad action is invalid, and a launch error is 500.

        Returns:
            None. The test fails if a failed open is reported as success.
        """
        with mock.patch("folder_access.open_allow_page", return_value=True):
            status, body = _request(self.base, "/api/folder-access", {"action": "open"})
        self.assertEqual(status, 200)
        self.assertEqual(body, {"opened": True})

        status, body = _request(self.base, "/api/folder-access", {"action": "disable"})
        self.assertEqual(status, 400)
        assert isinstance(body, dict)
        self.assertEqual(body["error"], "That request is not valid.")
        self.assertEqual(body["code"], "invalid_request")

        with mock.patch("folder_access.open_allow_page", side_effect=OSError("no")):
            status, body = _request(self.base, "/api/folder-access", {"action": "open"})
        self.assertEqual(status, 500)
        assert isinstance(body, dict)
        self.assertEqual(body["error"], "The Windows Security page could not be opened.")
        self.assertEqual(body["code"], "folder_access_not_opened")

    def test_legacy_library_still_opens_the_page(self) -> None:
        """A database V2 library does not turn this POST into 409.

        Returns:
            None. The test fails if the route sits behind the legacy gate.
        """
        with mock.patch.object(setup_flow, "legacy_folder", return_value=Path("/tmp/legacy-serato")):
            with mock.patch("folder_access.open_allow_page", return_value=False):
                with mock.patch(
                    "folder_access.controlled_folder_access",
                    return_value="unsupported",
                ):
                    status, body = _request(self.base, "/api/folder-access", {"action": "open"})
        self.assertEqual(status, 200)
        self.assertEqual(
            body,
            {"opened": False, "controlled_folder_access": "unsupported"},
        )

    def test_status_route_keeps_writable(self) -> None:
        """GET /api/status repeats the field and stays writable when it is on.

        Returns:
            None. The test fails if on refuses library writes.
        """
        with mock.patch("folder_access.controlled_folder_access", return_value="audit"):
            status, body = _request(self.base, "/api/status")
        self.assertEqual(status, 200)
        assert isinstance(body, dict)
        self.assertEqual(body["controlled_folder_access"], "audit")
        self.assertTrue(body["writable"])
