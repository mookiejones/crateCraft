"""Read-only Serato location survey. No database is opened."""

from __future__ import annotations

import json
import os
import unittest
from pathlib import Path
from unittest import mock

import library
import serato_probe


class SurveyTests(unittest.TestCase):
    """Shape detection from a caller-supplied exists check."""

    def test_serato3_is_database_v2_without_master(self) -> None:
        """A Music database and no master.sqlite is the Serato 3 shape.

        Returns:
            None.
        """
        home = Path("/Users/ada")
        database = home / "Music" / "_Serato_" / "database V2"
        report = serato_probe.survey(home, system="Darwin", exists=lambda path: path == database)
        self.assertEqual(report["shape"], "serato3")
        self.assertEqual(report["protect_library_plist"], "missing")
        self.assertEqual(report["lucid_beatgrid"], "unconfirmed")
        roles = {row["role"]: row for row in report["places"]}  # type: ignore[union-attr]
        self.assertTrue(roles["database-v2"]["exists"])
        self.assertFalse(roles["master"]["exists"])
        master = Path(str(roles["master"]["path"]))
        self.assertEqual(
            master.parts[-5:],
            ("Library", "Application Support", "Serato", "Library", "master.sqlite"),
        )

    def test_master_sqlite_is_serato_4_or_5_and_a_drive_is_separate(self) -> None:
        """master.sqlite marks Serato 4 or 5. An external drive is its own tree.

        Returns:
            None.
        """
        home = Path("/Users/ada")
        volume = Path("/Volumes/MUSIC")
        present = {
            home / "Music" / "_Serato_" / "database V2",
            home / "Music" / "_Serato_" / "Subcrates",
            home / "Library" / "Application Support" / "Serato" / "Library" / "master.sqlite",
            home / "Library" / "Application Support" / "Serato" / "Library" / "root.sqlite",
            home / "Library" / "Preferences" / "com.serato.seratodj.plist",
            volume / "_Serato_" / "Subcrates",
        }
        report = serato_probe.survey(
            home,
            system="Darwin",
            volumes=[volume],
            exists=lambda path: path in present,
        )
        self.assertEqual(report["shape"], "serato4-or-5")
        self.assertEqual(report["protect_library_plist"], "present")
        roles = {row["role"]: row for row in report["places"]}  # type: ignore[union-attr]
        self.assertTrue(roles["drive-crates"]["exists"])
        self.assertFalse(roles["drive-database"]["exists"])
        self.assertEqual(roles["drive-crates"]["since"], "3")
        self.assertEqual(roles["protect-library"]["since"], "5")

    def test_windows_uses_localappdata_and_has_no_plist(self) -> None:
        """Windows master.sqlite lives under Local AppData.

        Returns:
            None.
        """
        home = Path(r"C:\Users\Ada")
        local = Path(r"C:\Users\Ada\AppData\Local")
        master = local / "Serato" / "Library" / "master.sqlite"
        report = serato_probe.survey(
            home,
            system="Windows",
            local_app_data=local,
            exists=lambda path: path == master,
        )
        self.assertEqual(report["shape"], "serato4-or-5")
        self.assertEqual(report["protect_library_plist"], "not-on-this-os")
        self.assertTrue(any(row["path"].endswith("master.sqlite") and row["exists"] for row in report["places"]))  # type: ignore[union-attr]

    def test_survey_does_not_create_a_missing_home(self) -> None:
        """A missing home stays missing. The command only prints JSON.

        Returns:
            None.
        """
        home = Path("/tmp") / "serato-probe-missing-home"
        self.assertFalse(home.exists())
        import io
        from contextlib import redirect_stdout

        buffer = io.StringIO()
        with redirect_stdout(buffer):
            code = serato_probe.main(["--home", str(home), "--system", "Darwin", "--volume", "/Volumes/NONE"])
        self.assertEqual(code, 0)
        payload = json.loads(buffer.getvalue())
        self.assertEqual(payload["shape"], "absent")
        self.assertFalse(home.exists())
        self.assertIn("unconfirmed", buffer.getvalue())



class SamePathsAsTheAppTests(unittest.TestCase):
    """The probe must name the files the app itself opens.

    The probe keeps its own list of paths so it can run on its own. These
    tests tie that list to ``library.default_library_path`` so the two
    cannot drift apart without a failing test.
    """

    def test_macos_master_matches_the_app(self) -> None:
        """The probe's macOS master.sqlite is the file the app opens."""
        home = Path("/Users/ada")
        with mock.patch.object(library.sys, "platform", "darwin"), mock.patch.object(
            library.Path, "home", return_value=home
        ):
            expected = library.default_library_path()
        roles = {place.role: place.path for place in serato_probe.mac_places(home)}
        self.assertEqual(roles["master"], expected)
        self.assertEqual(roles["root"], expected.with_name("root.sqlite"))

    def test_windows_master_matches_the_app(self) -> None:
        """The probe's Windows master.sqlite is under the same LOCALAPPDATA."""
        home = Path(r"C:\Users\Ada")
        local = Path(r"C:\Users\Ada\AppData\Local")
        with mock.patch.object(library.sys, "platform", "win32"), mock.patch.dict(
            os.environ, {"LOCALAPPDATA": str(local)}
        ):
            expected = library.default_library_path()
        roles = {place.role: place.path for place in serato_probe.windows_places(home, local)}
        self.assertEqual(roles["master"], expected)

if __name__ == "__main__":
    unittest.main()
