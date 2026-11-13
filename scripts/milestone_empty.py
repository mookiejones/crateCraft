#!/usr/bin/env python3
"""Decide whether an empty GitHub milestone needs a Next release comment.

Does not create a git tag, close a milestone, or publish a GitHub
Release. Publish stays the human step that pushes
``vMAJOR.MINOR.PATCH``.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER_PREFIX = "<!-- milestone-empty:"
MARKER_SUFFIX = " -->"


@dataclass(frozen=True)
class NotifyPlan:
    """Comment to post on the Next release issue."""

    milestone_number: int
    body: str


def marker_for(milestone_number: int) -> str:
    """Return the HTML comment that marks a notify for one milestone.

    Args:
        milestone_number: GitHub milestone number (the id in the URL).

    Returns:
        A hidden HTML comment unique to that number.
    """
    return f"{MARKER_PREFIX}{milestone_number}{MARKER_SUFFIX}"


def already_notified(comments: list[str], milestone_number: int) -> bool:
    """Return whether the Next release issue already has this notify.

    Args:
        comments: Comment bodies already on the Next release issue.
        milestone_number: GitHub milestone number.

    Returns:
        ``True`` when any body contains the exact marker for
        ``milestone_number``. A marker for another number does not match.
    """
    needle = marker_for(milestone_number)
    return any(needle in body for body in comments)


def render_comment(
    milestone_number: int,
    milestone_title: str,
    milestone_url: str,
) -> str:
    """Return the Next release comment for an empty milestone.

    Args:
        milestone_number: GitHub milestone number.
        milestone_title: Milestone title, such as ``v1.4 Look and layout``.
        milestone_url: HTML URL of the milestone.

    Returns:
        Markdown that names the milestone, says it is ready to tag, and
        says this comment does not tag, close the milestone, or publish.
    """
    title = milestone_title.strip() or f"#{milestone_number}"
    link = milestone_url.strip()
    heading = f"[{title}]({link})" if link else f"**{title}**"
    return (
        f"{marker_for(milestone_number)}\n"
        f"Milestone {heading} has no open issues or pull requests.\n"
        "\n"
        "It is ready to tag. Publish is still a local annotated tag on "
        "`main` pushed by @mookiejones. This comment does not create a "
        "tag, close the milestone, or publish a GitHub Release.\n"
    )


def plan_notify(
    *,
    milestone_number: int | None,
    milestone_title: str,
    milestone_url: str,
    open_count: int,
    comments: list[str],
) -> NotifyPlan | None:
    """Build a notify plan, or skip when the milestone is not empty.

    Args:
        milestone_number: GitHub milestone number, or ``None`` when the
            closed item had no milestone.
        milestone_title: Milestone title from the API.
        milestone_url: HTML URL from the API.
        open_count: Remaining open issues and pull requests on that
            milestone. ``0`` is empty. A positive count is not empty.
        comments: Existing Next release comment bodies.

    Returns:
        A plan when the milestone number is set, ``open_count`` is
        ``0``, and no matching marker is already on the issue.
        ``None`` otherwise.
    """
    if milestone_number is None:
        return None
    if milestone_number < 1:
        return None
    if open_count != 0:
        return None
    if already_notified(comments, milestone_number):
        return None
    return NotifyPlan(
        milestone_number=milestone_number,
        body=render_comment(milestone_number, milestone_title, milestone_url),
    )


def load_comments(path: Path | None) -> list[str]:
    """Read comment bodies from a JSON array of strings.

    Args:
        path: File written by the workflow, or ``None``.

    Returns:
        Comment bodies. A missing path is an empty list.

    Raises:
        ValueError: If the file is not a JSON array of strings.
    """
    if path is None:
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list) or any(not isinstance(item, str) for item in raw):
        raise ValueError("comments file must be a JSON array of strings")
    return raw


def write_comment(path: Path, text: str) -> None:
    """Write the comment body to ``path``.

    Args:
        path: Destination file.
        text: Comment markdown.

    Returns:
        None.

    Raises:
        OSError: If the file cannot be written.
    """
    path.write_text(text, encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    """Write a Next release comment when a milestone is empty.

    Args:
        argv: Command arguments without the program name. ``None`` reads
            ``sys.argv[1:]``.

    Returns:
        ``0``. A skip prints a reason and does not write a file.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Write a Next release comment when a milestone has no open "
            "items. Does not tag, close the milestone, or publish."
        ),
    )
    parser.add_argument(
        "--milestone-number",
        type=int,
        default=None,
        help="GitHub milestone number. Omit or 0 to skip.",
    )
    parser.add_argument(
        "--milestone-title",
        default="",
        help="Milestone title from the GitHub API.",
    )
    parser.add_argument(
        "--milestone-url",
        default="",
        help="Milestone HTML URL from the GitHub API.",
    )
    parser.add_argument(
        "--open-count",
        type=int,
        required=True,
        help="Remaining open issues and pull requests on the milestone.",
    )
    parser.add_argument(
        "--comments-file",
        type=Path,
        default=None,
        help="JSON array of existing Next release comment bodies.",
    )
    parser.add_argument(
        "--write",
        type=Path,
        default=None,
        help="Write the comment to this path. Skip leaves the path unwritten.",
    )
    args = parser.parse_args(argv)
    comments = load_comments(args.comments_file)
    plan = plan_notify(
        milestone_number=args.milestone_number,
        milestone_title=args.milestone_title,
        milestone_url=args.milestone_url,
        open_count=args.open_count,
        comments=comments,
    )
    if plan is None:
        print("Milestone is not empty, already notified, or missing; not commenting.")
        return 0
    if args.write is not None:
        write_comment(args.write, plan.body)
    print(plan.body, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
