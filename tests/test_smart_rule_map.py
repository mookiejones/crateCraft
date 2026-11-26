"""Classify smart-crate rules for a Rekordbox export.

The cases use rule objects this repo already stores. They do not open a
library and they do not write XML.
"""

from __future__ import annotations

import unittest

import smart_rule_map


def _leaf(attribute: str, operation: str) -> dict[str, object]:
    """Build one stored leaf.

    Args:
        attribute: Field name already used by smart-crate rules.
        operation: Operation name already used by smart-crate rules.

    Returns:
        A leaf dict. No library is opened.
    """
    return {
        "type": "STRING",
        "attribute": attribute,
        "operation": operation,
        "version": 1,
        "value": "House",
    }


class SmartRuleMapTests(unittest.TestCase):
    """Exact, approximate, and impossible leaves, including a bad field."""

    def test_genre_is_and_bpm_bounds_are_exact(self) -> None:
        """Call equality and a BPM bound exact, and a title alias the same.

        Returns:
            None. The test fails if either leaf is not exact.
        """
        genre = smart_rule_map.classify_rule(_leaf("genre", "IS"))
        bpm = smart_rule_map.classify_rule(_leaf("bpm", "GREATER_THAN_OR_EQUAL_TO"))
        title = smart_rule_map.classify_rule(_leaf("title", "IS"))
        low = smart_rule_map.classify_rule(_leaf("bpm", "LESS_THAN_OR_EQUAL_TO"))
        self.assertEqual(genre, smart_rule_map.ClassifiedRule("genre is", "exact"))
        self.assertEqual(bpm.label, "bpm is at least")
        self.assertEqual(bpm.classification, "exact")
        self.assertEqual(title.label, "title is")
        self.assertEqual(title.classification, "exact")
        self.assertEqual(low.classification, "exact")

    def test_contains_key_date_and_type_are_approximate(self) -> None:
        """Keep a related field approximate when Rekordbox would not match it.

        Returns:
            None. The test fails if one of those leaves is exact or impossible.
        """
        contains = smart_rule_map.classify_rule(_leaf("genre", "CONTAINS"))
        key = smart_rule_map.classify_rule(_leaf("key", "IS"))
        added = smart_rule_map.classify_rule(_leaf("time_added", "AFTER"))
        kind = smart_rule_map.classify_rule(_leaf("type", "IS"))
        self.assertEqual(contains.classification, "approximate")
        self.assertEqual(key.classification, "approximate")
        self.assertEqual(added.label, "date added is after")
        self.assertEqual(added.classification, "approximate")
        self.assertEqual(kind.classification, "approximate")
        line = smart_rule_map.report_lines(
            "House",
            "rules",
            [contains],
            frozen=True,
            stored=1,
            written=1,
        )[0]
        self.assertIn("is approximate, not fully compatible", line)
        self.assertNotIn("is exact", line)
        self.assertIn("not a rekordbox smart-list rule", line)

    def test_location_contains_is_impossible_and_not_filename(self) -> None:
        """Refuse location contains instead of rewriting it as filename contains.

        Returns:
            None. The test fails if the label or the class changes.
        """
        rule = smart_rule_map.classify_rule(_leaf("location", "CONTAINS"))
        self.assertEqual(rule.label, "location contains")
        self.assertEqual(rule.classification, "impossible")
        filename = smart_rule_map.classify_rule(_leaf("filename", "CONTAINS"))
        self.assertEqual(filename.label, "filename contains")
        self.assertEqual(filename.classification, "impossible")
        line = smart_rule_map.report_lines(
            "Chinese Pop",
            "rules",
            [rule],
            frozen=True,
            stored=1,
            written=1,
        )[0]
        self.assertEqual(
            line,
            "Smart crate 'Chinese Pop': rule 'location contains' has no rekordbox equivalent.",
        )
        self.assertNotIn("filename", line)
        self.assertNotIn("compatible", line)
        self.assertNotIn("is exact", line)
        self.assertNotIn("is approximate", line)

    def test_unknown_field_operation_and_unreadable_leaf_are_impossible(self) -> None:
        """Treat an unknown field, an unknown operation, and a bad leaf as impossible.

        Returns:
            None. The test fails if any of those is exact.
        """
        energy = smart_rule_map.classify_rule(_leaf("energy", "IS"))
        stems = smart_rule_map.classify_rule(_leaf("stems_analyze_state", "IS"))
        odd = smart_rule_map.classify_rule(_leaf("genre", "MATCHES"))
        broken = smart_rule_map.classify_rule("location")
        self.assertEqual(energy.classification, "impossible")
        self.assertEqual(stems.label, "stems is")
        self.assertEqual(stems.classification, "impossible")
        self.assertEqual(odd.classification, "impossible")
        self.assertEqual(broken, smart_rule_map.ClassifiedRule("unreadable rule", "impossible"))

    def test_nested_group_is_walked_and_a_bad_blob_is_unreadable(self) -> None:
        """Walk a nested group and refuse a value that has no rules list.

        Returns:
            None. The test fails if the inner location rule is dropped or called exact.
        """
        status, leaves = smart_rule_map.classify_blob(
            {
                "rules": [
                    {
                        "conjunction": "AND",
                        "rules": [
                            _leaf("genre", "IS"),
                            _leaf("location", "CONTAINS"),
                        ],
                    }
                ]
            }
        )
        self.assertEqual(status, "rules")
        self.assertEqual([rule.classification for rule in leaves], ["exact", "impossible"])
        self.assertEqual(smart_rule_map.classify_blob({"rules": []}), ("empty", []))
        self.assertEqual(smart_rule_map.classify_blob("not-json"), ("unreadable", []))
        shown = smart_rule_map.visible_rules("unreadable", [])
        self.assertEqual(shown[0].classification, "impossible")

    def test_count_mismatch_is_named_only_when_the_counts_differ(self) -> None:
        """Name stored tracks against playlist tracks, and say Rekordbox did not run.

        Returns:
            None. The test fails if equal counts still add the mismatch line.
        """
        mismatch = smart_rule_map.report_lines(
            "Chinese Pop",
            "rules",
            [smart_rule_map.classify_rule(_leaf("genre", "IS"))],
            frozen=True,
            stored=2,
            written=1,
        )
        self.assertIn(
            "Smart crate 'Chinese Pop': Serato had stored 2 tracks. This playlist lists 1. "
            "This comparison did not run Rekordbox.",
            mismatch,
        )
        matched = smart_rule_map.report_lines(
            "Chinese Pop",
            "empty",
            [],
            frozen=False,
            stored=0,
            written=0,
        )
        self.assertTrue(any("no rules are stored" in line for line in matched))
        self.assertTrue(any("was not frozen" in line for line in matched))
        self.assertFalse(any("did not run Rekordbox" in line for line in matched))
        self.assertFalse(any("is exact" in line for line in matched))


if __name__ == "__main__":
    unittest.main()
