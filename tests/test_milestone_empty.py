"""Empty-milestone notify: comment on Next release, never tag."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import milestone_empty  # noqa: E402

WORKFLOW = ROOT / ".github" / "workflows" / "milestone-empty.yml"
SCRIPT = ROOT / "scripts" / "milestone_empty.py"


class PlanTests(unittest.TestCase):
    """Decide when to comment. These cases do not call GitHub."""

    def test_skips_when_items_remain_open(self) -> None:
        """A milestone with one open item must not notify.

        Returns:
            None. The test fails if ``open_count`` 1 still returns a plan.
        """
        plan = milestone_empty.plan_notify(
            milestone_number=8,
            milestone_title="v1.4 Look and layout",
            milestone_url="https://github.com/example/m/8",
            open_count=1,
            comments=[],
        )
        self.assertIsNone(plan)

    def test_skips_when_there_is_no_milestone(self) -> None:
        """An unmilestoned close must not notify.

        Returns:
            None. The test fails if a missing number still returns a plan.
        """
        plan = milestone_empty.plan_notify(
            milestone_number=None,
            milestone_title="",
            milestone_url="",
            open_count=0,
            comments=[],
        )
        self.assertIsNone(plan)

    def test_skips_a_zero_or_negative_milestone_number(self) -> None:
        """GitHub milestone numbers start at 1.

        Returns:
            None. The test fails if 0 or -1 still returns a plan.
        """
        for number in (0, -1):
            with self.subTest(number=number):
                plan = milestone_empty.plan_notify(
                    milestone_number=number,
                    milestone_title="v1.4",
                    milestone_url="",
                    open_count=0,
                    comments=[],
                )
                self.assertIsNone(plan)

    def test_notifies_when_the_last_item_closed(self) -> None:
        """Zero open items and no prior comment is the notify path.

        Returns:
            None. The test fails if an empty milestone does not plan a
            comment, or if the body omits the marker or the ready line.
        """
        plan = milestone_empty.plan_notify(
            milestone_number=8,
            milestone_title="v1.4 Look and layout",
            milestone_url="https://github.com/mookiejones/crateCraft/milestone/8",
            open_count=0,
            comments=[],
        )
        self.assertIsNotNone(plan)
        assert plan is not None
        self.assertEqual(plan.milestone_number, 8)
        self.assertIn("<!-- milestone-empty:8 -->", plan.body)
        self.assertIn("v1.4 Look and layout", plan.body)
        self.assertIn("https://github.com/mookiejones/crateCraft/milestone/8", plan.body)
        self.assertIn("ready to tag", plan.body)
        self.assertIn("does not create a tag", plan.body)
        self.assertIn("close the milestone", plan.body)

    def test_skips_when_the_marker_is_already_present(self) -> None:
        """A second close on an already-empty milestone must not spam.

        Returns:
            None. The test fails if a matching marker still returns a plan.
        """
        prior = milestone_empty.render_comment(8, "v1.4 Look and layout", "")
        plan = milestone_empty.plan_notify(
            milestone_number=8,
            milestone_title="v1.4 Look and layout",
            milestone_url="",
            open_count=0,
            comments=[prior],
        )
        self.assertIsNone(plan)

    def test_other_milestone_marker_does_not_block(self) -> None:
        """A notify for milestone 80 must not count as a notify for 8.

        Returns:
            None. The test fails if a substring of another marker skips 8.
        """
        prior = milestone_empty.render_comment(80, "v1.5", "")
        plan = milestone_empty.plan_notify(
            milestone_number=8,
            milestone_title="v1.4 Look and layout",
            milestone_url="",
            open_count=0,
            comments=[prior],
        )
        self.assertIsNotNone(plan)
        assert plan is not None
        self.assertIn("<!-- milestone-empty:8 -->", plan.body)
        self.assertNotIn("<!-- milestone-empty:80 -->", plan.body)

    def test_open_count_zero_is_the_only_empty_value(self) -> None:
        """``open_count`` 2 and ``open_count`` 0 must differ.

        Returns:
            None. The test fails if both counts plan, or neither does.
        """
        kwargs = {
            "milestone_number": 8,
            "milestone_title": "v1.4",
            "milestone_url": "",
            "comments": [],
        }
        self.assertIsNone(milestone_empty.plan_notify(open_count=2, **kwargs))
        self.assertIsNotNone(milestone_empty.plan_notify(open_count=0, **kwargs))


class MainTests(unittest.TestCase):
    """CLI write and skip. Temporary files only."""

    def test_skip_leaves_the_write_path_unwritten(self) -> None:
        """A remaining open item must not create ``--write``.

        Returns:
            None. The test fails if the skip path writes a comment file.
        """
        with tempfile.TemporaryDirectory() as raw:
            dest = Path(raw) / "comment.md"
            code = milestone_empty.main(
                [
                    "--milestone-number",
                    "8",
                    "--open-count",
                    "1",
                    "--write",
                    str(dest),
                ]
            )
            self.assertEqual(code, 0)
            self.assertFalse(dest.exists())

    def test_write_creates_the_comment_file(self) -> None:
        """An empty milestone writes the comment body.

        Returns:
            None. The test fails if ``--write`` is skipped when
            ``open_count`` is 0.
        """
        with tempfile.TemporaryDirectory() as raw:
            dest = Path(raw) / "comment.md"
            comments = Path(raw) / "comments.json"
            comments.write_text("[]", encoding="utf-8")
            code = milestone_empty.main(
                [
                    "--milestone-number",
                    "8",
                    "--milestone-title",
                    "v1.4 Look and layout",
                    "--open-count",
                    "0",
                    "--comments-file",
                    str(comments),
                    "--write",
                    str(dest),
                ]
            )
            self.assertEqual(code, 0)
            text = dest.read_text(encoding="utf-8")
            self.assertIn("<!-- milestone-empty:8 -->", text)
            self.assertIn("v1.4 Look and layout", text)

    def test_comments_file_must_be_an_array_of_strings(self) -> None:
        """A malformed comments file must fail loudly.

        Returns:
            None. The test fails if a JSON object is treated as no comments.
        """
        with tempfile.TemporaryDirectory() as raw:
            comments = Path(raw) / "comments.json"
            comments.write_text(json.dumps({"body": "x"}), encoding="utf-8")
            with self.assertRaises(ValueError):
                milestone_empty.load_comments(comments)


class SourceGuardTests(unittest.TestCase):
    """Keep the notify job from publishing.

    The cases read files in this repository. They do not run workflows.
    """

    def test_script_has_no_publish_subcommand(self) -> None:
        """Argparse must not accept a publish, tag, or close flag.

        Returns:
            None. The test fails if ``--publish`` is a defined option.
        """
        with mock.patch.object(sys, "stderr", new=mock.Mock()):
            with self.assertRaises(SystemExit):
                milestone_empty.main(["--publish"])
            with self.assertRaises(SystemExit):
                milestone_empty.main(["--tag", "v1.2.3"])
            with self.assertRaises(SystemExit):
                milestone_empty.main(["--close-milestone"])

    def test_script_does_not_shell_out(self) -> None:
        """The script must not call git, gh, or close a milestone.

        Reads ``scripts/milestone_empty.py``.

        Returns:
            None. The test fails if the file mentions those commands.
        """
        text = SCRIPT.read_text(encoding="utf-8")
        self.assertNotIn("subprocess", text)
        self.assertNotIn("gh release", text)
        self.assertNotIn("git tag -a", text)
        self.assertNotIn("git push", text)
        self.assertNotIn("state=closed", text)

    def test_workflow_cannot_create_a_tag_or_release(self) -> None:
        """The workflow stays contents:read and never tags or publishes.

        Reads ``.github/workflows/milestone-empty.yml``.

        Returns:
            None. The test fails if the job can write contents, create a
            tag, close a milestone, run gh release, or check out a
            pull-request head.
        """
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("permissions:\n  contents: read\n", text)
        self.assertIn("issues: write", text)
        self.assertNotIn("contents: write", text)
        self.assertNotIn("git tag", text)
        self.assertNotIn("gh release", text)
        self.assertNotIn("pull_request_target", text)
        self.assertNotIn("gh api --method PATCH", text)
        self.assertNotIn("state=closed", text)
        self.assertNotIn("gh milestone", text)
        self.assertIn("github.event.repository.default_branch", text)
        self.assertIn("runs-on: ubuntu-latest", text)
        self.assertIn("cancel-in-progress: false", text)
        self.assertIn("timeout-minutes: 5", text)
        self.assertIn("python scripts/milestone_empty.py", text)
        self.assertIn('select(.title=="Next release")', text)
        self.assertIn("gh issue comment", text)
        self.assertIn("head.repo.full_name == github.repository", text)
        self.assertIn("types: [closed]", text)

    def test_notify_script_is_not_a_release_yml_path(self) -> None:
        """A notify-script change must not start the macOS release builds.

        Reads ``.github/workflows/release.yml``.

        Returns:
            None. The test fails if milestone_empty is in the release
            pull_request path list.
        """
        text = (ROOT / ".github" / "workflows" / "release.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("scripts/release_*", text)
        self.assertNotIn("milestone_empty", text)
        self.assertNotIn("milestone-empty.yml", text)


if __name__ == "__main__":
    unittest.main()
