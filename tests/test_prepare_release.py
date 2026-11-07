"""Checks for release preparation. They do not create a tag or a release."""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import prepare_release  # noqa: E402

WORKFLOW = ROOT / ".github" / "workflows" / "prepare-release.yml"
SCRIPT = ROOT / "scripts" / "prepare_release.py"


def _git(cwd: Path, *args: str) -> None:
    """Run git in ``cwd`` and require a zero exit.

    Args:
        cwd: Repository directory.
        *args: Git arguments after ``git``.

    Returns:
        None.

    Raises:
        AssertionError: If git exits non-zero. The test process does not
            create tags through this helper except when a test asks for
            ``tag`` with a name that already exists in the fixture.
    """
    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if completed.returncode != 0:
        raise AssertionError(completed.stderr or completed.stdout or "git failed")


def _repo() -> tempfile.TemporaryDirectory[str]:
    """Create an empty git repository with a user identity.

    Returns:
        A temporary directory the caller must close. The first commit and
        any tags are the test's to add.
    """
    tmp = tempfile.TemporaryDirectory()
    root = Path(tmp.name)
    _git(root, "init", "-b", "main")
    _git(root, "config", "user.email", "test@example.com")
    _git(root, "config", "user.name", "Test")
    _git(root, "config", "commit.gpgsign", "false")
    return tmp


def _commit(cwd: Path, name: str, message: str) -> None:
    """Write ``name`` and commit it with ``message``.

    Args:
        cwd: Repository directory.
        name: File name relative to ``cwd``.
        message: Commit subject.

    Returns:
        None.

    Writes ``name`` inside ``cwd``. Does not tag.
    """
    (cwd / name).write_text(name + "\n", encoding="utf-8")
    _git(cwd, "add", name)
    _git(cwd, "commit", "-m", message)


class TagChoiceTests(unittest.TestCase):
    """Pick the next patch from final tags only.

    The cases pass tag lists in memory. They do not run git.
    """

    def test_latest_final_tag_uses_numeric_order(self) -> None:
        """Prefer v1.10.0 over v1.9.0 and ignore a prerelease.

        Returns:
            None. The test fails if string sort or a -rc tag wins.
        """
        self.assertEqual(
            prepare_release.latest_final_tag(
                ["v1.9.0", "v1.10.0", "v1.10.0-rc1", "v2.0.0-beta1"]
            ),
            "v1.10.0",
        )

    def test_latest_final_tag_skips_prereleases_only(self) -> None:
        """Return None when every tag is a prerelease or junk.

        Returns:
            None. The test fails if a -rc tag is treated as final.
        """
        self.assertIsNone(
            prepare_release.latest_final_tag(["v1.2.0-rc2", "v1.2.0-beta1", "nightly"])
        )
        self.assertIsNone(prepare_release.latest_final_tag([]))
        self.assertIsNone(prepare_release.latest_final_tag(["1.2.3", "refs/tags/v1.2.3"]))

    def test_next_patch_tag(self) -> None:
        """Bump the patch number of a final tag.

        Returns:
            None. The test fails if the minor or major changes.
        """
        self.assertEqual(prepare_release.next_patch_tag("v1.2.0"), "v1.2.1")
        with self.assertRaises(ValueError):
            prepare_release.next_patch_tag("v1.2.0-rc1")


class PlanTests(unittest.TestCase):
    """Skip when there is nothing to ship. Draft notes otherwise.

    The cases pass tags and subjects. They do not run git.
    """

    def test_skips_when_there_is_no_final_tag(self) -> None:
        """Do not invent a first version from an empty tag list.

        Returns:
            None. The test fails if a plan is built without a base tag.
        """
        self.assertIsNone(prepare_release.plan_release([], ["Fix a bug"]))
        self.assertIsNone(prepare_release.plan_release(["v1.0.0-rc1"], ["Fix a bug"]))

    def test_skips_when_there_are_no_commits(self) -> None:
        """Do not draft a release for a tag with no following commits.

        Returns:
            None. The test fails if an empty subject list still plans.
        """
        self.assertIsNone(prepare_release.plan_release(["v1.2.0"], []))

    def test_plans_the_next_patch_and_lists_subjects(self) -> None:
        """Use the latest final tag and keep commit order.

        Returns:
            None. The test fails if the next tag skips a patch or drops
            a subject.
        """
        plan = prepare_release.plan_release(
            ["v1.2.0", "v1.1.9"],
            ["Fix the log parse", "Add a tooltip"],
        )
        self.assertIsNotNone(plan)
        assert plan is not None
        self.assertEqual(plan.base_tag, "v1.2.0")
        self.assertEqual(plan.next_tag, "v1.2.1")
        self.assertEqual(plan.subjects, ("Fix the log parse", "Add a tooltip"))

    def test_notes_name_the_tag_and_say_not_to_publish(self) -> None:
        """Render notes that list changes and keep publish as a human step.

        Returns:
            None. The test fails if the notes omit a subject or claim a
            release was created.
        """
        plan = prepare_release.PreparePlan(
            base_tag="v1.2.0",
            next_tag="v1.2.1",
            subjects=("Fix the log parse",),
        )
        notes = prepare_release.render_notes(plan)
        self.assertIn("# Next release: v1.2.1", notes)
        self.assertIn("Prepared from `v1.2.0`", notes)
        self.assertIn("- Fix the log parse", notes)
        self.assertIn("create and push tag `v1.2.1` from `main`", notes)
        self.assertIn("does not create a tag or a GitHub Release", notes)
        self.assertIn("workflow_dispatch", notes)
        self.assertNotIn("gh release create", notes)


class GitReadTests(unittest.TestCase):
    """Read tags and subjects from a temporary repository.

    Each case builds its own git tree. Nothing is tagged on this
    repository, and no GitHub Release is created.
    """

    def test_prepare_reads_commits_after_the_latest_final_tag(self) -> None:
        """Draft v1.0.1 from a v1.0.0 tag plus one later commit.

        Writes a temporary git repository. Does not create a tag in this
        project or call GitHub.

        Returns:
            None. The test fails if the rc tag wins or the later commit
            is missing.
        """
        with _repo() as tmp:
            root = Path(tmp)
            _commit(root, "a.txt", "Initial")
            _git(root, "tag", "v1.0.0")
            _git(root, "tag", "v1.0.1-rc1")
            _commit(root, "b.txt", "Fix the waveform")
            plan = prepare_release.prepare(root)
            self.assertIsNotNone(plan)
            assert plan is not None
            self.assertEqual(plan.base_tag, "v1.0.0")
            self.assertEqual(plan.next_tag, "v1.0.1")
            self.assertEqual(plan.subjects, ("Fix the waveform",))

    def test_main_write_skips_without_a_file_when_head_is_the_tag(self) -> None:
        """Leave --write unwritten when HEAD is the latest final tag.

        Writes a temporary git repository tagged at HEAD. Does not
        create a GitHub Release.

        Returns:
            None. The test fails if a notes file is written for an
            empty range.
        """
        with _repo() as tmp:
            root = Path(tmp)
            _commit(root, "a.txt", "Initial")
            _git(root, "tag", "v0.1.0")
            dest = root / "next-release.md"
            code = prepare_release.main(["--root", str(root), "--write", str(dest)])
            self.assertEqual(code, 0)
            self.assertFalse(dest.exists())

    def test_main_write_skips_without_a_file_when_there_is_no_final_tag(self) -> None:
        """Leave --write unwritten when the repo has no final tag.

        Writes a temporary git repository with only a prerelease tag.
        That is the no-backfill path.

        Returns:
            None. The test fails if a first version is invented.
        """
        with _repo() as tmp:
            root = Path(tmp)
            _commit(root, "a.txt", "Initial")
            _git(root, "tag", "v0.1.0-rc1")
            dest = root / "next-release.md"
            code = prepare_release.main(["--root", str(root), "--write", str(dest)])
            self.assertEqual(code, 0)
            self.assertFalse(dest.exists())

    def test_main_writes_notes_after_a_commit(self) -> None:
        """Write the draft when a commit landed after the tag.

        Writes a temporary git repository and a notes file inside it.
        Does not push a tag.

        Returns:
            None. The test fails if the file is missing or names the
            wrong next tag.
        """
        with _repo() as tmp:
            root = Path(tmp)
            _commit(root, "a.txt", "Initial")
            _git(root, "tag", "v0.1.0")
            _commit(root, "b.txt", "Fix a crash")
            dest = root / "next-release.md"
            code = prepare_release.main(["--root", str(root), "--write", str(dest)])
            self.assertEqual(code, 0)
            text = dest.read_text(encoding="utf-8")
            self.assertIn("# Next release: v0.1.1", text)
            self.assertIn("- Fix a crash", text)

    def test_git_helper_refuses_a_tag_create(self) -> None:
        """Reject argv that would create a tag.

        Returns:
            None. The test fails if ``git tag -a`` is forwarded.
        """
        with self.assertRaises(SystemExit):
            prepare_release._run_git(["tag", "-a", "v9.9.9", "-m", "nope"], Path("."))
        with self.assertRaises(SystemExit):
            prepare_release._run_git(["push", "origin", "v9.9.9"], Path("."))


class SourceGuardTests(unittest.TestCase):
    """Keep preparation from publishing.

    The cases read files in this repository. They do not run workflows.
    """

    def test_script_has_no_publish_subcommand(self) -> None:
        """Argparse must not accept a publish or tag-create flag.

        Returns:
            None. The test fails if ``--publish`` is a defined option.
        """
        with mock.patch.object(sys, "stderr", new=mock.Mock()):
            with self.assertRaises(SystemExit):
                prepare_release.main(["--publish"])
            with self.assertRaises(SystemExit):
                prepare_release.main(["--tag", "v1.2.3"])

    def test_script_subprocess_only_lists_tags_or_logs(self) -> None:
        """The only git subprocess in the script is tag --list or log.

        Reads ``scripts/prepare_release.py``.

        Returns:
            None. The test fails if the file calls ``gh`` or ``git tag -a``.
        """
        text = SCRIPT.read_text(encoding="utf-8")
        self.assertNotIn("gh release", text)
        self.assertNotIn("git tag -a", text)
        self.assertNotIn("git push", text)
        self.assertIn('["tag", "--list", "v*"]', text)
        self.assertIn('"log"', text)

    def test_workflow_cannot_create_a_tag_or_release(self) -> None:
        """The workflow stays contents:read and never tags or publishes.

        Reads ``.github/workflows/prepare-release.yml``.

        Returns:
            None. The test fails if the job can write contents, create a
            tag, or run gh release.
        """
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("permissions:\n  contents: read\n", text)
        self.assertIn("issues: write", text)
        self.assertNotIn("contents: write", text)
        self.assertNotIn("git tag", text)
        self.assertNotIn("gh release", text)
        self.assertNotIn("pull_request_target", text)
        self.assertIn("branches: [main]", text)
        self.assertNotIn("pull_request:", text)
        self.assertIn("runs-on: ubuntu-latest", text)
        self.assertIn("cancel-in-progress: true", text)
        self.assertIn("timeout-minutes: 10", text)
        self.assertIn("python scripts/prepare_release.py --write next-release.md", text)
        self.assertIn('select(.title=="Next release")', text)
        self.assertIn("gh issue create", text)
        self.assertIn("gh issue edit", text)
        self.assertIn("hashFiles('next-release.md') != ''", text)
        self.assertIn("github.ref == 'refs/heads/main'", text)

    def test_prepare_script_is_not_a_release_yml_path(self) -> None:
        """A notes-script change must not start the macOS release builds.

        Reads ``.github/workflows/release.yml``. ``scripts/release_*``
        is the pack path. ``scripts/prepare_release.py`` is outside it.

        Returns:
            None. The test fails if prepare_release is in the release
            pull_request path list.
        """
        text = (ROOT / ".github" / "workflows" / "release.yml").read_text(encoding="utf-8")
        self.assertIn("scripts/release_*", text)
        self.assertNotIn("prepare_release", text)
        self.assertNotIn("prepare-release.yml", text)


if __name__ == "__main__":
    unittest.main()
