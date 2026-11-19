"""Compile crate presets into Serato smart-crate JSON when they fit (#26)."""

from __future__ import annotations

import json
import unittest
from contextlib import closing

import library
import related
import smart_presets
import smart_rules
from tests.fixture import TempLibrary
from tests.test_smart_presets import NOW, _seed


def _bpm(preset: dict[str, object] | None) -> dict[str, object]:
    """Normalize a BPM preset, or the default 120 ±3.

    Args:
        preset: Raw preset JSON, or None for the default.

    Returns:
        A preset from ``smart_presets.normalize``.
    """
    return smart_presets.normalize(preset or {"kind": "bpm", "bpm": 120})


class FitsNativeTests(unittest.TestCase):
    """Unscoped harmonic and BPM fit. Crate scope and unplayed do not."""

    def test_unscoped_harmonic_and_bpm_fit(self) -> None:
        """Harmonic and BPM without a crate compile. Unplayed never does.

        Returns:
            None.
        """
        self.assertTrue(smart_rules.fits_native(smart_presets.normalize({"kind": "harmonic", "key": "8A"})))
        self.assertTrue(smart_rules.fits_native(_bpm(None)))
        self.assertFalse(smart_rules.fits_native(smart_presets.normalize({"kind": "unplayed"})))
        self.assertFalse(
            smart_rules.fits_native(smart_presets.normalize({"kind": "harmonic", "key": "8A", "crate": 3}))
        )
        self.assertFalse(smart_rules.fits_native(_bpm({"kind": "bpm", "bpm": 120, "crate": 3})))

    def test_flat_rules_fit_and_mixed_groups_do_not(self) -> None:
        """One conjunction of native leaves fits. Mixed AND/OR does not.

        Returns:
            None.
        """
        flat = smart_presets.normalize(
            {
                "kind": "rules",
                "conjunction": "AND",
                "rules": [
                    {"attribute": "genre", "operation": "CONTAINS", "value": "Break"},
                    {"attribute": "bpm", "operation": "GREATER_THAN_OR_EQUAL_TO", "value": 120},
                ],
            }
        )
        same = smart_presets.normalize(
            {
                "kind": "rules",
                "conjunction": "AND",
                "rules": [
                    {"attribute": "genre", "operation": "CONTAINS", "value": "Break"},
                    {
                        "conjunction": "AND",
                        "rules": [{"attribute": "artist", "operation": "IS", "value": "Ada"}],
                    },
                ],
            }
        )
        mixed = smart_presets.normalize(
            {
                "kind": "rules",
                "conjunction": "AND",
                "rules": [
                    {"attribute": "genre", "operation": "CONTAINS", "value": "Break"},
                    {
                        "conjunction": "OR",
                        "rules": [
                            {"attribute": "artist", "operation": "IS", "value": "Ada"},
                            {"attribute": "artist", "operation": "IS", "value": "Bo"},
                        ],
                    },
                ],
            }
        )
        self.assertTrue(smart_rules.fits_native(flat))
        self.assertTrue(smart_rules.fits_native(same))
        self.assertFalse(smart_rules.fits_native(mixed))
        self.assertFalse(
            smart_rules.fits_native(
                smart_presets.normalize(
                    {
                        "kind": "rules",
                        "conjunction": "AND",
                        "crate": 3,
                        "rules": [{"attribute": "genre", "operation": "CONTAINS", "value": "Break"}],
                    }
                )
            )
        )


class ToNativeTests(unittest.TestCase):
    """The compiled JSON matches the live Serato 4.0.10 rule shape."""

    def test_bpm_is_uint32_inclusive_bounds(self) -> None:
        """120 ±3 is AND of BPM ≥117 and ≤123, live_updates on, no members.

        Returns:
            None.
        """
        blob = smart_rules.to_native(_bpm(None), "Serato Library")
        assert blob is not None
        self.assertEqual(blob["conjunction"], "AND")
        self.assertTrue(blob["live_updates"])
        self.assertEqual(blob["spaces"], ["Serato Library"])
        self.assertEqual(
            blob["rules"],
            [
                {
                    "type": "UINT32",
                    "attribute": "bpm",
                    "operation": "GREATER_THAN_OR_EQUAL_TO",
                    "version": 1,
                    "value": 117,
                },
                {
                    "type": "UINT32",
                    "attribute": "bpm",
                    "operation": "LESS_THAN_OR_EQUAL_TO",
                    "version": 1,
                    "value": 123,
                },
            ],
        )

    def test_harmonic_is_or_of_key_aliases(self) -> None:
        """8A emits STRING key IS for same, relative, and adjacent spellings.

        Returns:
            None.
        """
        blob = smart_rules.to_native(
            smart_presets.normalize({"kind": "harmonic", "key": "8A"}), "Serato Library"
        )
        assert blob is not None
        self.assertEqual(blob["conjunction"], "OR")
        self.assertTrue(blob["live_updates"])
        values = [rule["value"] for rule in blob["rules"]]
        self.assertTrue(all(rule["type"] == "STRING" and rule["attribute"] == "key" and rule["operation"] == "IS" for rule in blob["rules"]))
        self.assertIn("Am", values)
        self.assertIn("8A", values)
        self.assertIn("C", values)
        self.assertIn("8B", values)
        self.assertIn("Em", values)
        self.assertIn("9A", values)
        self.assertIn("Dm", values)
        self.assertIn("7A", values)
        for value in values:
            self.assertIsNotNone(related.key_relation("8A", str(value)))

    def test_same_conjunction_group_flattens(self) -> None:
        """AND of a leaf and an AND group becomes one flat AND list.

        Returns:
            None.
        """
        blob = smart_rules.to_native(
            smart_presets.normalize(
                {
                    "kind": "rules",
                    "conjunction": "AND",
                    "rules": [
                        {"attribute": "genre", "operation": "CONTAINS", "value": "Break"},
                        {
                            "conjunction": "AND",
                            "rules": [{"attribute": "artist", "operation": "IS", "value": "Ada"}],
                        },
                    ],
                }
            ),
            "Serato Library",
        )
        assert blob is not None
        self.assertEqual(blob["conjunction"], "AND")
        self.assertEqual([rule["attribute"] for rule in blob["rules"]], ["genre", "artist"])
        self.assertEqual(blob["rules"][0]["operation"], "CONTAINS")
        self.assertEqual(blob["rules"][0]["value"], "Break")
        self.assertEqual(blob["rules"][1]["operation"], "IS")
        self.assertEqual(blob["rules"][1]["value"], "Ada")

    def test_title_alias_is_name(self) -> None:
        """The page field title is Serato's name attribute.

        Returns:
            None.
        """
        blob = smart_rules.to_native(
            smart_presets.normalize(
                {
                    "kind": "rules",
                    "conjunction": "AND",
                    "rules": [{"attribute": "title", "operation": "CONTAINS", "value": "Intro"}],
                }
            ),
            "Serato Library",
        )
        assert blob is not None
        self.assertEqual(blob["rules"][0]["attribute"], "name")
        self.assertEqual(blob["rules"][0]["type"], "STRING")


class AssetIdTests(unittest.TestCase):
    """Evaluating compiled rules against the seeded library."""

    def test_bpm_bounds_match_the_preset(self) -> None:
        """Native 120 ±3 picks the same tracks matching_ids does.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed(temp)
            preset = _bpm(None)
            blob = smart_rules.to_native(preset, "Serato Library")
            assert blob is not None
            with closing(library.read_conn()) as conn:
                native = smart_rules.asset_ids(conn, "Serato Library", blob)
                wanted = smart_presets.matching_ids(conn, "Serato Library", preset, NOW)
        self.assertEqual(native, wanted)
        self.assertEqual(native, [3, 4, 1, 2])

    def test_harmonic_aliases_match_key_relation(self) -> None:
        """Native 1A picks the same Camelot neighbours matching_ids does.

        Returns:
            None.
        """
        with TempLibrary() as temp:
            _seed(temp)
            preset = smart_presets.normalize({"kind": "harmonic", "key": "1A"})
            blob = smart_rules.to_native(preset, "Serato Library")
            assert blob is not None
            with closing(library.read_conn()) as conn:
                native = smart_rules.asset_ids(conn, "Serato Library", blob)
                wanted = smart_presets.matching_ids(conn, "Serato Library", preset, NOW)
        self.assertEqual(native, wanted)

    def test_mixed_tree_still_evaluates(self) -> None:
        """A mixed AND/OR tree is not native, and matching_ids still filters.

        Returns:
            None.
        """
        preset = smart_presets.normalize(
            {
                "kind": "rules",
                "conjunction": "AND",
                "rules": [
                    {"attribute": "bpm", "operation": "GREATER_THAN_OR_EQUAL_TO", "value": 120},
                    {
                        "conjunction": "OR",
                        "rules": [
                            {"attribute": "key", "operation": "IS", "value": "1A"},
                            {"attribute": "key", "operation": "IS", "value": "2A"},
                        ],
                    },
                ],
            }
        )
        self.assertIsNone(smart_rules.to_native(preset, "Serato Library"))
        with TempLibrary() as temp:
            _seed(temp)
            with closing(library.read_conn()) as conn:
                ids = smart_presets.matching_ids(conn, "Serato Library", preset, NOW)
        self.assertEqual(ids, [3, 1, 2])


class BlobRoundTripTests(unittest.TestCase):
    """A live captured rule blob still evaluates."""

    def test_string_contains_genre(self) -> None:
        """The captured Serato JSON shape matches genre CONTAINS.

        Returns:
            None.
        """
        blob = {
            "spaces": ["Serato Library"],
            "conjunction": "AND",
            "live_updates": True,
            "rules": [
                {
                    "type": "STRING",
                    "attribute": "genre",
                    "operation": "CONTAINS",
                    "version": 1,
                    "value": "Break",
                }
            ],
        }
        self.assertEqual(json.loads(library._rules_blob(blob))["rules"][0]["attribute"], "genre")
        with TempLibrary() as temp:
            _seed(temp)
            with closing(library.read_conn()) as conn:
                self.assertEqual(smart_rules.asset_ids(conn, "Serato Library", blob), [])


if __name__ == "__main__":
    unittest.main()
