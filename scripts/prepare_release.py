#!/usr/bin/env python3
"""Draft the next release version and notes. Do not publish.

Reads git tags and commit subjects. Writes a markdown draft, or prints
it. Does not create a git tag or a GitHub Release. Publish stays the
human step that pushes ``vMAJOR.MINOR.PATCH`` and runs release.yml.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ISSUE_TITLE = "Next release"
FINAL_TAG_RE = re.compile(r"^v([0-9]+)\.([0-9]+)\.([0-9]+)$")


@dataclass(frozen=True)
class PreparePlan:
    """The next final tag and the commit subjects since the last one."""

    base_tag: str
    next_tag: str
    subjects: tuple[str, ...]


def parse_final_tag(tag: str) -> tuple[int, int, int] | None:
    """Return the version triple of a final ``vMAJOR.MINOR.PATCH`` tag.

    Args:
        tag: Git tag text, possibly with a trailing newline.

    Returns:
        ``(major, minor, patch)`` for a final tag. ``None`` for a
        prerelease, an empty string, or any other shape.
    """
    match = FINAL_TAG_RE.fullmatch(tag.strip())
    if match is None:
        return None
    return int(match.group(1)), int(match.group(2)), int(match.group(3))


def latest_final_tag(tags: list[str]) -> str | None:
    """Return the highest final tag from ``tags``.

    Compares numeric triples so ``v1.10.0`` sorts after ``v1.9.0``.
    Prerelease tags such as ``v1.2.3-rc1`` are ignored.

    Args:
        tags: Tag names from ``git tag --list``.

    Returns:
        The latest final tag, or ``None`` when none of the names is a
        final version.
    """
    ranked: list[tuple[tuple[int, int, int], str]] = []
    for tag in tags:
        parsed = parse_final_tag(tag)
        if parsed is not None:
            ranked.append((parsed, f"v{parsed[0]}.{parsed[1]}.{parsed[2]}"))
    if not ranked:
        return None
    ranked.sort()
    return ranked[-1][1]


def next_patch_tag(tag: str) -> str:
    """Return the next patch tag after a final version.

    Args:
        tag: A final ``vMAJOR.MINOR.PATCH`` tag.

    Returns:
        ``vMAJOR.MINOR.(PATCH+1)``.

    Raises:
        ValueError: If ``tag`` is not a final version tag.
    """
    parsed = parse_final_tag(tag)
    if parsed is None:
        raise ValueError(f"not a final vMAJOR.MINOR.PATCH tag: {tag!r}")
    major, minor, patch = parsed
    return f"v{major}.{minor}.{patch + 1}"


def _run_git(args: list[str], cwd: Path) -> str:
    """Run a read-only git command and return stdout.

    Args:
        args: Git arguments after ``git``. Must start with ``tag`` or
            ``log``.
        cwd: Repository directory.

    Returns:
        Standard output with trailing whitespace stripped.

    Raises:
        SystemExit: If ``args`` is not a read of tags or log, or git
            exits non-zero.
    """
    if not args or args[0] not in ("tag", "log"):
        raise SystemExit(f"prepare_release only reads git tag or git log, got {args!r}")
    if args[0] == "tag" and args[1:] != ["--list", "v*"]:
        raise SystemExit(f"prepare_release only lists tags, got {args!r}")
    if args[0] == "log" and (len(args) < 2 or args[1].startswith("-")):
        raise SystemExit(f"prepare_release git log needs a revision range, got {args!r}")
    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if completed.returncode != 0:
        err = completed.stderr.strip() or completed.stdout.strip() or "git failed"
        raise SystemExit(err)
    return completed.stdout.strip()


def git_tags(cwd: Path) -> list[str]:
    """List ``v*`` tags in ``cwd``.

    Args:
        cwd: Git repository root.

    Returns:
        Tag names, one per line. An empty repository yields ``[]``.

    Raises:
        SystemExit: If git cannot list tags.
    """
    output = _run_git(["tag", "--list", "v*"], cwd)
    if not output:
        return []
    return [line.strip() for line in output.splitlines() if line.strip()]


def git_subjects(cwd: Path, since_tag: str) -> list[str]:
    """Return non-merge commit subjects after ``since_tag``.

    Args:
        cwd: Git repository root.
        since_tag: Exclusive starting tag.

    Returns:
        Subject lines in git log order, empty lines dropped.

    Raises:
        SystemExit: If git cannot read the log.
    """
    output = _run_git(
        ["log", f"{since_tag}..HEAD", "--no-merges", "--format=%s"],
        cwd,
    )
    if not output:
        return []
    return [line.strip() for line in output.splitlines() if line.strip()]


def plan_release(tags: list[str], subjects: list[str]) -> PreparePlan | None:
    """Build a prepare plan, or skip when there is nothing to ship.

    Args:
        tags: Tag names from the repository.
        subjects: Commit subjects after the latest final tag.

    Returns:
        A plan with the next patch tag when a final tag exists and
        ``subjects`` is not empty. ``None`` when there is no final tag
        (no historical backfill) or nothing has landed since that tag.
    """
    base = latest_final_tag(tags)
    if base is None:
        return None
    if not subjects:
        return None
    return PreparePlan(
        base_tag=base,
        next_tag=next_patch_tag(base),
        subjects=tuple(subjects),
    )


def render_notes(plan: PreparePlan) -> str:
    """Return markdown notes for ``plan``.

    Args:
        plan: Next tag and the subjects to list.

    Returns:
        A draft that names the next tag, lists the subjects, and says
        publish is a human tag push. The text is not a git command.
    """
    changes = "\n".join(f"- {subject}" for subject in plan.subjects)
    return (
        f"# {ISSUE_TITLE}: {plan.next_tag}\n"
        "\n"
        f"Prepared from `{plan.base_tag}`. This draft does not create a "
        "tag or a GitHub Release.\n"
        "\n"
        "## Changes\n"
        "\n"
        f"{changes}\n"
        "\n"
        "## Publish\n"
        "\n"
        f"When Charles (@mookiejones) is ready, create and push tag "
        f"`{plan.next_tag}` from `main`. That is the only publish step. "
        "It runs `.github/workflows/release.yml` (macOS arm64, macOS x64, "
        "Windows zip and installer). `workflow_dispatch` on Release still "
        "builds artifacts only. A push to `main` does not publish.\n"
        "\n"
        "GitHub does not run workflows from tags created by `GITHUB_TOKEN` "
        "in another workflow. Preparation never creates that tag.\n"
    )


def prepare(cwd: Path) -> PreparePlan | None:
    """Read git in ``cwd`` and return a plan when a release can be drafted.

    Args:
        cwd: Git repository root.

    Returns:
        A :class:`PreparePlan`, or ``None`` to skip.

    Raises:
        SystemExit: If a git read fails.
    """
    tags = git_tags(cwd)
    base = latest_final_tag(tags)
    if base is None:
        return None
    return plan_release(tags, git_subjects(cwd, base))


def write_notes(path: Path, text: str) -> None:
    """Write ``text`` to ``path``.

    Args:
        path: Destination file. Parent directories must already exist.
        text: Markdown notes.

    Returns:
        None.

    Raises:
        OSError: If the file cannot be written.
    """
    path.write_text(text, encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    """Draft notes to stdout or ``--write``.

    Args:
        argv: Command arguments without the program name. ``None`` reads
            ``sys.argv[1:]``.

    Returns:
        ``0``. A skip prints a reason and does not write a file.

    Raises:
        SystemExit: If git fails or ``--write`` cannot be created.
    """
    parser = argparse.ArgumentParser(
        description="Draft the next release notes. Does not publish.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=ROOT,
        help="Git repository root (default: this repository).",
    )
    parser.add_argument(
        "--write",
        type=Path,
        default=None,
        help="Write the draft to this path. Skip leaves the path unwritten.",
    )
    args = parser.parse_args(argv)
    tags = git_tags(args.root)
    base = latest_final_tag(tags)
    plan = prepare(args.root)
    if plan is None:
        if base is None:
            print("No final release tag; not preparing (no historical backfill).")
        else:
            print(f"No commits since {base}; not preparing.")
        return 0
    notes = render_notes(plan)
    if args.write is not None:
        write_notes(args.write, notes)
    print(notes, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
