"""Checks the VS Code debug launches.

The cases read ``.vscode/launch.json``. They do not start the debugger or
open a window.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LAUNCH = ROOT / ".vscode" / "launch.json"


def _configs() -> list[dict[str, object]]:
    """Return the launch configurations.

    Returns:
        The ``configurations`` array from ``launch.json``.
    """
    data = json.loads(LAUNCH.read_text(encoding="utf-8"))
    configs = data["configurations"]
    if not isinstance(configs, list):
        raise TypeError("launch.json configurations must be a list")
    return configs


class LaunchJsonTests(unittest.TestCase):
    """The documented debug entries stay in launch.json."""

    def test_f5_runs_server_with_system_python(self) -> None:
        first = _configs()[0]
        self.assertEqual(first["name"], "Python: Run server.py")
        self.assertEqual(first["program"], "${workspaceFolder}/server.py")
        self.assertEqual(first["type"], "debugpy")
        self.assertEqual(first["request"], "launch")
        self.assertNotIn("python", first)

    def test_desktop_launch_uses_venv(self) -> None:
        configs = {str(item["name"]): item for item in _configs()}
        desktop = configs["Python: Run desktop.py"]
        self.assertEqual(desktop["program"], "${workspaceFolder}/desktop.py")
        self.assertEqual(desktop["python"], "${workspaceFolder}/.venv/bin/python")
        windows = desktop["windows"]
        self.assertEqual(
            windows["python"],
            "${workspaceFolder}/.venv/Scripts/python.exe",
        )
        self.assertEqual(desktop["type"], "debugpy")
        self.assertEqual(desktop["request"], "launch")
        self.assertEqual(desktop["console"], "integratedTerminal")
