"""Wiki draft and agent-guide checks.

The cases read files in the repository. They do not build the site,
open a wiki, or start the app.
"""

from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

CAPTIONS = (
    "1 Download",
    "2 Install (Mac and Windows)",
    "3 Open",
    "4 First backup",
    "5 Find your music",
)

STEP_HEADINGS = tuple(f"## {caption}" for caption in CAPTIONS)

QUICK_START_GIFS = (
    "quickstart-five-moves.gif",
    "quickstart-library.gif",
)

HOME_EMOJI_STEPS = (
    "📥 Download",
    "💿 Install (Mac and Windows)",
    "▶️ Open",
    "🛡️ First backup",
    "🎧 Find your music",
)

RELEASE_NAMES = (
    "crateCraft-macos-arm64.dmg",
    "crateCraft-macos-x64.dmg",
    "crateCraft-windows-setup.exe",
    "crateCraft-windows.zip",
    "SHA256SUMS",
)

LEGACY_NAMES = (
    "Serato-Library-macos.zip",
    "Serato-Library-windows.zip",
)


class AgentGuideTests(unittest.TestCase):
    """Keep the two agent guides on the same text."""

    def test_agents_md_mirrors_claude_md(self) -> None:
        """Require ``AGENTS.md`` to match ``CLAUDE.md`` byte for byte.

        Returns:
            None. The test fails when either copy drifts.
        """
        agents = (ROOT / "AGENTS.md").read_bytes()
        claude = (ROOT / "CLAUDE.md").read_bytes()
        self.assertEqual(agents, claude)


class QuickStartTests(unittest.TestCase):
    """Check the wiki page and the guide page describe the same five steps."""

    def test_wiki_page_uses_the_light_png_and_the_captions(self) -> None:
        """Show the light banner and the five captions on the wiki page.

        The logo note stays next to the banner. The wiki page does not
        use a picture element.

        Returns:
            None. The test fails when a caption or the light banner is missing.
        """
        text = (ROOT / "docs" / "wiki" / "Quick-Start.md").read_text(encoding="utf-8")
        self.assertIn("The logo on the banner is not approved yet. It may change.", text)
        self.assertIn("images/quickstart-banner-light.png", text)
        self.assertNotIn("<picture>", text)
        self.assertIn(
            "Restore can rewrite the Serato tags (cue points, beatgrid, autotags) "
            "inside each audio file, and removes Serato tags the snapshot didn't have. "
            "The audio stream is hash-checked before and after; if it would change, "
            "the file is left as it was.",
            text,
        )
        self.assertNotIn("never changes audio", text)
        self.assertNotIn("never touched", text)
        for caption in CAPTIONS:
            self.assertIn(caption, text)
        for heading in STEP_HEADINGS:
            self.assertIn(heading, text)
        self.assertEqual(
            [line for line in text.splitlines() if line.startswith("## ")],
            list(STEP_HEADINGS),
        )
        for name in RELEASE_NAMES + LEGACY_NAMES:
            self.assertIn(name, text)
        for name in QUICK_START_GIFS:
            self.assertIn(f"images/{name}", text)
            path = ROOT / "docs" / "wiki" / "images" / name
            self.assertTrue(path.is_file(), name)
            self.assertEqual(path.read_bytes()[:6], b"GIF89a", name)
        self.assertIn("images/quickstart-crates.png", text)
        self.assertIn("images/quickstart-backup.png", text)
        self.assertTrue((ROOT / "docs" / "wiki" / "images" / "quickstart-crates.png").is_file())
        self.assertTrue((ROOT / "docs" / "wiki" / "images" / "quickstart-backup.png").is_file())

    def test_guide_page_uses_picture_for_light_and_dark(self) -> None:
        """Switch the guide banner and the step art with a picture element.

        Returns:
            None. The test fails when dark art or a caption is missing.
        """
        text = (ROOT / "docs" / "quick-start.md").read_text(encoding="utf-8")
        self.assertIn("The logo on the banner is not approved yet. It may change.", text)
        self.assertIn("<picture>", text)
        self.assertIn("wiki/images/quickstart-banner-light.png", text)
        self.assertIn("wiki/images/quickstart-banner-dark.png", text)
        self.assertIn("wiki/images/quickstart-banner-dark.svg", text)
        self.assertIn("wiki/images/step-1-light.png", text)
        self.assertIn("wiki/images/step-1-dark.png", text)
        self.assertIn("wiki/images/step-4-dark.png", text)
        self.assertIn("wiki/images/step-4-dark.svg", text)
        self.assertIn("wiki/images/step-4-light.svg", text)
        self.assertIn("wiki/images/step-5-dark.png", text)
        self.assertIn("wiki/images/step-5-dark.svg", text)
        self.assertIn("wiki/images/step-5-light.svg", text)
        for name in (
            "step-4-light.svg",
            "step-4-dark.svg",
            "step-5-light.svg",
            "step-5-dark.svg",
        ):
            self.assertTrue((ROOT / "docs" / "wiki" / "images" / name).is_file())
        self.assertIn(
            "Restore can rewrite the Serato tags (cue points, beatgrid, autotags) "
            "inside each audio file, and removes Serato tags the snapshot didn't have. "
            "The audio stream is hash-checked before and after; if it would change, "
            "the file is left as it was.",
            text,
        )
        self.assertNotIn("never changes audio", text)
        self.assertNotIn("never touched", text)
        for caption in CAPTIONS:
            self.assertIn(caption, text)
        for heading in STEP_HEADINGS:
            self.assertIn(heading, text)
        self.assertEqual(
            [line for line in text.splitlines() if line.startswith("## ")],
            list(STEP_HEADINGS),
        )
        for name in QUICK_START_GIFS:
            self.assertIn(f"wiki/images/{name}", text)
        self.assertIn("images/screenshot-home.png", text)
        self.assertIn("images/screenshot-backups.png", text)

    def test_readme_leads_with_the_quick_start(self) -> None:
        """Put the Quick Start link at the top of the README, before Install.

        Returns:
            None. The test fails when the link moves below the first heading
            or the five step names change.
        """
        text = (ROOT / "README.md").read_text(encoding="utf-8")
        link = "[Quick Start](docs/wiki/Quick-Start.md)"
        self.assertIn(link, text)
        self.assertLess(text.index(link), text.index("## Install"))
        self.assertLess(
            text.index(link),
            text.index("a local window for the Serato DJ Pro library"),
        )
        self.assertIn(
            "Five steps: Download, Install (Mac and Windows), Open, First backup, Find your music.",
            text,
        )
        self.assertIn("docs/wiki/images/quickstart-five-moves.gif", text)

    def test_wiki_home_leads_with_the_banner_and_the_five_steps(self) -> None:
        """Show the Quick Start banner and the five emoji steps on wiki Home.

        Returns:
            None. The test fails when Home drops the banner, the GIF, or
            the Quick Start link.
        """
        text = (ROOT / "docs" / "wiki" / "Home.md").read_text(encoding="utf-8")
        self.assertIn("The logo on the banner is not approved yet. It may change.", text)
        self.assertIn("images/quickstart-banner-light.png", text)
        self.assertIn("images/quickstart-five-moves.gif", text)
        self.assertIn("](Quick-Start)", text)
        self.assertLess(
            text.index("images/quickstart-banner-light.png"),
            text.index("](Quick-Start)"),
        )
        for step in HOME_EMOJI_STEPS:
            self.assertIn(step, text)
        self.assertNotIn("```mermaid", text)


class InstallPageTests(unittest.TestCase):
    """Check the Mac and Windows wiki pages name the real downloads."""

    def test_install_pages_name_the_release_files_and_the_warnings(self) -> None:
        """Document disk images, SmartScreen, Open Anyway, and Removable Volumes.

        Returns:
            None. The test fails when a download name or a warning step is missing.
        """
        mac = (ROOT / "docs" / "wiki" / "Install-macOS.md").read_text(encoding="utf-8")
        windows = (ROOT / "docs" / "wiki" / "Install-Windows.md").read_text(encoding="utf-8")
        home = (ROOT / "docs" / "wiki" / "Home.md").read_text(encoding="utf-8")
        for name in RELEASE_NAMES:
            self.assertIn(name, mac + windows)
        self.assertIn("Serato-Library-macos.zip", mac)
        self.assertIn("Serato-Library-windows.zip", windows)
        self.assertIn("Open Anyway", mac)
        self.assertIn("right-click", mac.lower())
        self.assertIn("Current releases may be unsigned.", mac)
        self.assertNotIn("These builds are unsigned", mac)
        self.assertNotIn("The builds are unsigned", mac)
        self.assertIn(
            'xattr -dr com.apple.quarantine "/Applications/crateCraft.app"',
            mac,
        )
        self.assertIn("Removable Volumes", mac)
        self.assertIn("Files and Folders", mac)
        self.assertIn("Full Disk Access", mac)
        self.assertIn("More info", windows)
        self.assertIn("Run anyway", windows)
        self.assertIn("WebView2", windows)
        self.assertIn("GitHub Releases is the only download.", home)
        self.assertIn("Crates", home)
        self.assertIn("Backups", home)
        self.assertIn("PREVIEW", home)
        self.assertIn(
            "Restore can rewrite the Serato tags (cue points, beatgrid, autotags) "
            "inside each audio file, and removes Serato tags the snapshot didn't have. "
            "The audio stream is hash-checked before and after; if it would change, "
            "the file is left as it was.",
            home,
        )
        self.assertNotIn("never changes audio", home)
        self.assertNotIn("never touched", home + mac + windows)
        quick = (ROOT / "docs" / "wiki" / "Quick-Start.md").read_text(encoding="utf-8")
        for page in (home, mac, windows, quick):
            self.assertNotRegex(page, r"\]\([^)]+\.md\)")
        self.assertIn("](Quick-Start)", home)
        self.assertIn("](Install-macOS)", home)
        self.assertIn("](Install-Windows)", home)
        self.assertIn("](Install-macOS)", quick)
        self.assertIn("](Install-Windows)", quick)
        self.assertIn("](Quick-Start)", mac)
        self.assertIn("](Quick-Start)", windows)


COMPLETION_FIELDS = (
    "- **Issue:** link",
    "- **PR and commit:** link and SHA",
    "- **What changed:** up to 3 bullets",
    "- **Proof:** the exact test commands with their pass counts, CI status, and a screenshot for UI changes",
    "- **Not done / risks:**",
    "- **Next:** what is needed from Charles (@mookiejones) or QA (`mookiejones-qa`)",
)

COMPLETION_RULES = (
    "Every agent (Claude, Cursor, and others)",
    "When the work has an issue, the same report is the final comment on that issue.",
    'Saying "done", without the issue link, the pull request link, the commit SHA, and the test output, does not count.',
    "Never claim work you did not push.",
)

PRE_PR_COMMANDS = """\
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -t . -v
npm ci
npx tsc --noEmit
npx tsc --noEmit -p e2e
npx eslint src e2e .storybook
npm test
npx playwright install chromium
npx playwright test -c e2e/playwright.config.ts
npm run build
"""

REQUIRED_CHECKS = (
    "`tests (ubuntu-latest, Python 3.12)`",
    "`tests (ubuntu-latest, Python 3.14)`",
    "`tests (windows-latest, Python 3.12)`",
    "`tests (macos-latest, Python 3.12)`",
    "`frontend (ubuntu-latest)`",
    "`frontend (windows-latest)`",
    "`frontend (macos-latest)`",
    "`analyze Python` (CodeQL)",
)

MERGE_RULES = (
    "`main` is protected. Changes go in only through a pull request.",
    "If a new push dismisses the `mookiejones-qa` approval, re-request review.",
    "These checks must pass",
    "Do not force-push to `main`.",
    "Admins can bypass these rules, but should not.",
    "The team, including agents, may merge once `mookiejones-qa` approved the latest commit and all required checks are green.",
    "The workflow also runs `tests (macos-latest, Python 3.12)` and `frontend (macos-latest)` on every pull request. Add those names to branch protection so they block a merge. Until an admin does that, they still run on every pull request, and the previous required set still gates `main`.",
    "Only releases and tags (including pre-releases) need Charles's (@mookiejones) explicit OK.",
    "`dependency audit` and `review dependency changes` also run. They are not required checks.",
    "Tests must fail if the logic is broken. QA may mutation-test; weak tests that pass anyway get blocked.",
    "Cover the edge cases that apply to the change: Windows and macOS paths, symlinks and unmounted drives, Serato 4 vs Serato 5 data, and an empty or missing library.",
    "Never write extra files inside the Serato folder.",
)

GITHUB_MERGE_RULES = tuple(
    rule for rule in MERGE_RULES
    if not rule.startswith("Tests must fail")
    and not rule.startswith("Cover the edge cases")
    and not rule.startswith("Never write extra files")
)


class CompletionReportTests(unittest.TestCase):
    """Keep the agent finish report and the merge rules on one text."""

    def test_completion_report_template_is_on_every_surface(self) -> None:
        """Require the same report fields, rules, and pre-PR commands.

        Returns:
            None. The test fails when a surface drops a field or a command.
        """
        agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
        claude = (ROOT / "CLAUDE.md").read_text(encoding="utf-8")
        contributing = (ROOT / "CONTRIBUTING.md").read_text(encoding="utf-8")
        template_path = ROOT / ".github" / "pull_request_template.md"
        self.assertTrue(template_path.is_file())
        # List the folder: exists() ignores case on macOS and Windows.
        names = [path.name for path in (ROOT / ".github").iterdir()]
        self.assertIn("pull_request_template.md", names)
        self.assertNotIn("PULL_REQUEST_TEMPLATE.md", names)
        template = template_path.read_text(encoding="utf-8")
        github = (ROOT / "docs" / "github.md").read_text(encoding="utf-8")
        self.assertEqual(agents, claude)
        surfaces = (agents, contributing, template, github)
        for surface in surfaces:
            self.assertIn("## Completion report", surface)
            self.assertNotIn(".github/PULL_REQUEST_TEMPLATE.md", surface)
            for field in COMPLETION_FIELDS:
                self.assertIn(field, surface)
            for rule in COMPLETION_RULES:
                self.assertIn(rule, surface)
        for guide in (agents, contributing, github):
            self.assertIn(".github/pull_request_template.md", guide)
        indented = "\n".join(f"   {line}" for line in PRE_PR_COMMANDS.splitlines())
        self.assertIn(indented, agents)
        self.assertIn(PRE_PR_COMMANDS, contributing)
        for guide in (agents, contributing):
            for check in REQUIRED_CHECKS:
                self.assertIn(check, guide)
            for rule in MERGE_RULES:
                self.assertIn(rule, guide)
        for check in REQUIRED_CHECKS:
            self.assertIn(check, github)
        for rule in GITHUB_MERGE_RULES:
            self.assertIn(rule, github)
        self.assertNotIn("- `dependency audit`", github)
        self.assertNotIn("Require `review dependency changes`", github)
        for command in PRE_PR_COMMANDS.splitlines():
            self.assertIn(f"`{command}`", template)
        for check in REQUIRED_CHECKS:
            self.assertIn(check, template)
