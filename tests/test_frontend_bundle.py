"""Committed page bundles keep sourcemap sources inside the repo.

A worktree that shares ``node_modules`` through a symlink makes esbuild
write ``../../../node_modules/...`` into the map. CI installs
``node_modules`` at the clone root, so that map fails ``--check``.
"""

from __future__ import annotations

import json
import posixpath
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class FrontendBundleTests(unittest.TestCase):
    """Sourcemap sources stay under the repository root."""

    def test_sourcemap_sources_stay_in_repo(self) -> None:
        """Each map source, joined from ``static/``, stays in-tree."""
        for name in ("app.js.map", "wizard.js.map"):
            with self.subTest(name=name):
                path = ROOT / "static" / name
                data = json.loads(path.read_text(encoding="utf-8"))
                sources = data.get("sources") or []
                self.assertTrue(sources, name)
                for source in sources:
                    self.assertIsInstance(source, str, source)
                    self.assertNotIn("\\", source, source)
                    self.assertFalse(source.startswith("/"), source)
                    resolved = posixpath.normpath(posixpath.join("static", source))
                    self.assertFalse(
                        posixpath.isabs(resolved),
                        f"{name}: {source}",
                    )
                    self.assertFalse(
                        resolved == ".." or resolved.startswith("../"),
                        f"{name}: {source}",
                    )
