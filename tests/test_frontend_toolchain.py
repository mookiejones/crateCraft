"""Checks the Node toolchain pins stay inside typescript-eslint's peer range.

``npm ci`` fails when Dependabot groups TypeScript 7 with the rest of the
npm set. typescript-eslint 8.x asks for TypeScript below 6.1. These cases
read ``package.json`` and ``package-lock.json``. They do not run npm.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "package.json"
LOCK = ROOT / "package-lock.json"


def _triple(version: str) -> tuple[int, int, int]:
    """Return the numeric major.minor.patch of a pinned version.

    Args:
        version: A ``x.y.z`` string, optionally with a pre-release suffix.

    Returns:
        The three version numbers.
    """
    core = version.split("-", 1)[0]
    parts = core.split(".")
    major = int(parts[0])
    minor = int(parts[1]) if len(parts) > 1 else 0
    patch = int(parts[2]) if len(parts) > 2 else 0
    return major, minor, patch


class FrontendToolchainTests(unittest.TestCase):
    """TypeScript stays inside the typescript-eslint peer window."""

    def test_pinned_typescript_satisfies_typescript_eslint_peer(self) -> None:
        pkg = json.loads(PACKAGE.read_text(encoding="utf-8"))
        lock = json.loads(LOCK.read_text(encoding="utf-8"))
        pinned = pkg["devDependencies"]["typescript"]
        peer = lock["packages"]["node_modules/typescript-eslint"][
            "peerDependencies"
        ]["typescript"]
        self.assertRegex(peer, r"^>=\d+\.\d+\.\d+ <\d+\.\d+\.\d+$")
        lower_s, upper_s = peer.replace(">=", "").split(" <")
        ver = _triple(pinned)
        self.assertGreaterEqual(ver, _triple(lower_s), pinned)
        self.assertLess(ver, _triple(upper_s), f"{pinned} outside {peer}")
        resolved = lock["packages"]["node_modules/typescript"]["version"]
        self.assertEqual(resolved, pinned)
