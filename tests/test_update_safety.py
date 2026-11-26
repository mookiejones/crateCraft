"""Matrix for the read-only safe-to-update verdict.

The cases call ``evaluate`` with a fixed day. They do not open the
network, the live library, or a hardware reader.
"""

from __future__ import annotations

import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path

import gig_check
import update_safety
from tests.test_gig_check import _write_db
from update_safety import (
    CLEARED,
    DEFAULT_FACTS,
    OsRule,
    VendorFacts,
    evaluate,
)


DAY = date(2026, 11, 26)
PUBLISHED = date(2026, 11, 10)
ROOT = Path(__file__).resolve().parents[1]


def _codes(result: update_safety.UpdateSafety) -> set[str]:
    """Return the reason codes on one verdict.

    Args:
        result: Check result.

    Returns:
        The code set. Order does not matter.
    """
    return {item.code for item in result.reasons}


def _check(**overrides: object) -> update_safety.UpdateSafety:
    """Judge the macOS 27 cleared combo, with overrides.

    Args:
        overrides: Fields passed to ``evaluate``.

    Returns:
        The verdict. The default day is after the baked 5.1.0 release.
    """
    fields: dict[str, object] = {
        "serato_version": "5.1.0",
        "os_name": "macos",
        "os_version": "27.0",
        "hardware": ["Rane ONE"],
        "today": DAY,
    }
    fields.update(overrides)
    return evaluate(**fields)  # type: ignore[arg-type]


class UpdateSafetyMatrixTests(unittest.TestCase):
    """Fail when the vendor matrix says yes for a combo that is not cleared."""

    def test_macos_27_below_5_1_0_is_not_cleared(self) -> None:
        """macOS 27 with Serato 5.0.0 is not cleared.

        Returns:
            None. The test fails if that combo is yes or unknown.
        """
        result = _check(serato_version="5.0.0")
        self.assertEqual(result.verdict, "not_cleared")
        self.assertIn("serato_below_os", _codes(result))
        self.assertFalse(result.new_release_within_7_days)

    def test_macos_27_with_cleared_hardware_is_yes(self) -> None:
        """macOS 27, Serato 5.1.0, and a cleared device is yes.

        Returns:
            None. The test fails if the cleared combo is not yes.
        """
        result = _check()
        self.assertEqual(result.verdict, "yes")
        self.assertEqual(result.reasons, ())
        self.assertFalse(result.new_release_within_7_days)

    def test_in_testing_hardware_is_not_cleared(self) -> None:
        """In-testing hardware is not cleared even when the versions match.

        Returns:
            None. The test fails if a testing device is yes.
        """
        result = _check(hardware=["Pioneer DJ DDJ-FLX10"])
        self.assertEqual(result.verdict, "not_cleared")
        self.assertIn("hardware_in_testing", _codes(result))
        self.assertNotIn("yes", result.verdict)

    def test_unsupported_hardware_is_not_cleared(self) -> None:
        """Unsupported hardware is not cleared.

        Returns:
            None. The test fails if an unsupported device is yes.
        """
        result = _check(hardware=["Numark NS6"])
        self.assertEqual(result.verdict, "not_cleared")
        self.assertIn("hardware_unsupported", _codes(result))

    def test_unknown_hardware_is_unknown(self) -> None:
        """A device that is not on the list is unknown, never yes.

        Returns:
            None. The test fails if an unlisted device is yes or not cleared.
        """
        result = _check(hardware=["Not A Real Deck"])
        self.assertEqual(result.verdict, "unknown")
        self.assertIn("hardware_unknown", _codes(result))

    def test_empty_hardware_is_unknown(self) -> None:
        """An empty hardware list is unknown, never yes.

        Returns:
            None. The test fails if no hardware is called safe.
        """
        for names in ([], None):
            result = _check(hardware=names)
            self.assertEqual(result.verdict, "unknown", names)
            self.assertIn("hardware_missing", _codes(result))

    def test_missing_serato_version_is_unknown(self) -> None:
        """A missing Serato version is unknown, never yes.

        Returns:
            None. The test fails if a blank version is cleared.
        """
        for version in ("", "unknown", None):
            result = _check(serato_version=version)
            self.assertEqual(result.verdict, "unknown", version)
            self.assertIn("serato_unknown", _codes(result))

    def test_release_inside_seven_days_is_flagged_when_yes(self) -> None:
        """A release dated today is flagged even when the combo is yes.

        Serato 5.1.0 is dated 2026-11-10. Installed 5.1.0 on that day is
        still yes, and installed 5.0.0 is not cleared, and both are flagged.

        Returns:
            None. The test fails if the flag stays off inside the window.
        """
        cleared = _check(today=PUBLISHED)
        self.assertEqual(cleared.verdict, "yes")
        self.assertTrue(cleared.new_release_within_7_days)
        self.assertEqual(cleared.releases[0].version, "5.1.0")
        behind = _check(today=PUBLISHED, serato_version="5.0.0")
        self.assertEqual(behind.verdict, "not_cleared")
        self.assertTrue(behind.new_release_within_7_days)
        self.assertTrue(_check(today=date(2026, 11, 17)).new_release_within_7_days)
        self.assertFalse(_check(today=date(2026, 11, 18)).new_release_within_7_days)

    def test_windows_does_not_use_the_macos_27_rule(self) -> None:
        """Windows is not failed by the macOS minimum and is not cleared by it.

        Returns:
            None. The test fails if Windows 11 with Serato 5.0.0 is not cleared
            or yes from the macOS table.
        """
        result = _check(os_name="Windows", os_version="11", serato_version="5.0.0")
        self.assertEqual(result.verdict, "unknown")
        self.assertNotIn("serato_below_os", _codes(result))
        self.assertIn("no_os_rule", _codes(result))

    def test_windows_with_a_cleared_row_can_be_yes(self) -> None:
        """A Windows row that names the hardware is yes at Serato 5.0.0.

        Returns:
            None. The test fails if the macOS 5.1.0 minimum is applied.
        """
        facts = VendorFacts(
            rules=(OsRule("windows", 11, None, (("Rane ONE", CLEARED),)),),
            releases=(),
            sources=(),
        )
        result = _check(
            os_name="Windows",
            os_version="11",
            serato_version="5.0.0",
            facts=facts,
        )
        self.assertEqual(result.verdict, "yes")
        self.assertFalse(result.new_release_within_7_days)

    def test_os_release_inside_seven_days_is_flagged(self) -> None:
        """An OS release inside 7 days is flagged on an otherwise yes combo.

        Returns:
            None. The test fails if only Serato releases set the flag.
        """
        facts = VendorFacts(
            rules=DEFAULT_FACTS.rules,
            releases=(update_safety.ReleaseFact("macos", "27", DAY),),
            sources=DEFAULT_FACTS.sources,
        )
        result = _check(facts=facts)
        self.assertEqual(result.verdict, "yes")
        self.assertTrue(result.new_release_within_7_days)
        self.assertEqual(result.releases[0].product, "macos")

    def test_fetch_failure_is_unknown(self) -> None:
        """A fetch that raises is unknown and does not keep a yes table.

        Returns:
            None. The test fails if a failed fetch still says yes.
        """
        def fetch() -> VendorFacts:
            raise OSError("offline")

        result = _check(fetch=fetch)
        self.assertEqual(result.verdict, "unknown")
        self.assertEqual(_codes(result), {"fetch_failed"})
        self.assertFalse(result.new_release_within_7_days)

    def test_fetch_that_returns_the_wrong_type_is_unknown(self) -> None:
        """A fetch that returns nothing usable is unknown.

        Returns:
            None. The test fails if a bad payload is treated as yes.
        """
        result = _check(fetch=lambda: None)  # type: ignore[arg-type, return-value]
        self.assertEqual(result.verdict, "unknown")
        self.assertIn("fetch_failed", _codes(result))

    def test_module_does_not_open_the_network(self) -> None:
        """The module has no HTTP client. Tests must not need one.

        Returns:
            None. The test fails if a fetch helper is added to the module.
        """
        text = Path(update_safety.__file__).read_text(encoding="utf-8")
        self.assertNotIn("urlopen", text)
        self.assertNotIn("import requests", text)
        self.assertNotIn("lexicondj.com", " ".join(DEFAULT_FACTS.sources))

    def test_names_match_without_case_and_darwin_is_macos(self) -> None:
        """``rane one`` on Darwin 27 is the cleared macOS row.

        Returns:
            None. The test fails if case or the Darwin name misses the row.
        """
        result = _check(os_name="Darwin", os_version="27", hardware=["rane one"])
        self.assertEqual(result.verdict, "yes")

    def test_one_testing_device_blocks_a_cleared_one(self) -> None:
        """One in-testing device keeps the combo not cleared.

        Returns:
            None. The test fails if a cleared sibling hides the testing device.
        """
        result = _check(hardware=["Rane ONE", "Pioneer DJ DDJ-FLX10"])
        self.assertEqual(result.verdict, "not_cleared")

    def test_macos_26_is_not_cleared_by_the_27_list(self) -> None:
        """The macOS 27 list does not call macOS 26 safe.

        Returns:
            None. The test fails if an older macOS is yes.
        """
        result = _check(os_version="26.1")
        self.assertEqual(result.verdict, "unknown")
        self.assertNotEqual(result.verdict, "yes")


class UpdateSafetyReportTests(unittest.TestCase):
    """The gig report carries the verdict and does not change the score."""

    def test_not_cleared_does_not_change_ready(self) -> None:
        """A not-cleared combo leaves ready, score, and hard_red alone.

        The same library with no hardware list stays unknown. Unknown does
        not set hard_red either.

        Returns:
            None. The test fails if the update line changes the ready score.
        """
        moment = datetime(2026, 10, 28, 12, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as name:
            database = _write_db(Path(name), lambda conn: None)
            before = database.read_bytes()
            plain = gig_check.run_gig_check(
                database,
                now=moment,
                safety_serato="5.1.0",
                safety_os_name="macos",
                safety_os_version="27",
            )
            blocked = gig_check.run_gig_check(
                database,
                now=moment,
                safety_serato="5.0.0",
                safety_os_name="macos",
                safety_os_version="27",
                safety_hardware=["Rane ONE"],
            )
            self.assertEqual(database.read_bytes(), before)
            self.assertIsNotNone(plain.update_safety)
            self.assertIsNotNone(blocked.update_safety)
            assert plain.update_safety is not None
            assert blocked.update_safety is not None
            self.assertEqual(plain.update_safety.verdict, "unknown")
            self.assertEqual(blocked.update_safety.verdict, "not_cleared")
            self.assertEqual(blocked.ready, plain.ready)
            self.assertEqual(blocked.score, plain.score)
            self.assertEqual(blocked.hard_red, plain.hard_red)
            self.assertEqual(plain.hard_red, blocked.hard_red)
            payload = gig_check.report_to_dict(plain)
            unknown = payload["update_safety"]
            assert isinstance(unknown, dict)
            self.assertEqual(unknown["verdict"], "unknown")
            self.assertEqual(payload["hard_red"], plain.hard_red)
            body = gig_check.report_to_dict(blocked)
            safety = body["update_safety"]
            assert isinstance(safety, dict)
            self.assertEqual(safety["verdict"], "not_cleared")
            self.assertIn("new_release_within_7_days", safety)
            text = gig_check.format_report(blocked)
            self.assertIn("Safe to update?", text)
            self.assertIn("Not cleared", text)
