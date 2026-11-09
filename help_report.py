"""Build a prefilled GitHub issue link. Nothing here posts to GitHub.

The page shows the diagnostics, then the system browser opens the new-issue
form. The user reviews it and submits it. A link longer than
``URL_LIMIT`` characters is not opened. The same text is copied instead.
Home directories become ``~``. Track and crate names stay out unless the
user asks for them. This module does not read or write a Serato library.
"""

from __future__ import annotations

import platform
import re
import urllib.parse
import webbrowser
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

import version_info

REPO = "mookiejones/crateCraft"
NEW_ISSUE = f"https://github.com/{REPO}/issues/new"
BUG_TEMPLATE = "bug_report.yml"
FEATURE_TEMPLATE = "feature_request.yml"
URL_LIMIT = 6000
FIELD_LIMIT = 8000
KINDS = frozenset({"bug", "feature"})
_AUDIO = re.compile(
    r"(?i)(?<![A-Za-z0-9_])([^\s\"'<>|/\\]{1,240}\.(?:mp3|flac|aiff|aif|aifc|wav|m4a|mp4|aac|alac|ogg|opus))"
)
_CRATE = re.compile(r"(?i)(?<![A-Za-z0-9_])([^\s\"'<>|/\\]{1,160}\.(?:crate|scrate))")
_DIAGNOSTIC_ORDER = (
    ("app_version", "App version"),
    ("commit", "Commit"),
    ("os", "Operating system"),
    ("python", "Python"),
    ("serato_version", "Serato version"),
    ("serato_build", "Serato build"),
    ("protect_library", "Protect Library"),
)


@dataclass(frozen=True, slots=True)
class IssueLink:
    """A link the page may open, or text the page must copy instead.

    Attributes:
        mode: ``open`` when the URL is short enough. ``clipboard`` when it
            is not, or when the browser could not be opened.
        url: New-issue URL. In ``clipboard`` mode this is only the template,
            without the long report.
        text: The report the user can read and paste.
        opened: True when the system browser was asked to open ``url``.
        diagnostics: The lines that were shown before anything left the app.
    """

    mode: str
    url: str
    text: str
    opened: bool
    diagnostics: str

    def to_dict(self) -> dict[str, object]:
        """Return the JSON object for ``POST /api/help``.

        Returns:
            ``mode``, ``url``, ``text``, ``opened``, and ``diagnostics``.
        """
        return {
            "mode": self.mode,
            "url": self.url,
            "text": self.text,
            "opened": self.opened,
            "diagnostics": self.diagnostics,
        }


def collect_diagnostics(install: object) -> dict[str, str]:
    """Read the version lines the issue form is allowed to carry.

    Args:
        install: Object with ``version``, ``build``, and ``protect`` text
            attributes, as ``snapshots.SeratoInstall`` provides. The values
            are copied as text. A missing attribute becomes ``unknown``.

    Returns:
        App version, commit, operating system, Python, Serato version,
        Serato build, and Protect Library. No path, track, or crate name.
    """
    identity = version_info.resolve()
    commit = identity.commit or "unknown"
    return {
        "app_version": identity.version,
        "commit": commit,
        "os": _operating_system(),
        "python": platform.python_version(),
        "serato_version": _attr(install, "version"),
        "serato_build": _attr(install, "build"),
        "protect_library": _attr(install, "protect"),
    }


def format_diagnostics(fields: Mapping[str, str]) -> str:
    """Render diagnostics in a stable order.

    Args:
        fields: Mapping from :func:`collect_diagnostics`.

    Returns:
        One ``Label: value`` line per field. A missing field is ``unknown``.
    """
    lines = []
    for key, label in _DIAGNOSTIC_ORDER:
        value = fields.get(key, "unknown")
        if not isinstance(value, str) or not value.strip():
            value = "unknown"
        lines.append(f"{label}: {value.strip()}")
    return "\n".join(lines)


def redact(text: str, home: Path | None = None, *, include_names: bool = False) -> str:
    """Hide the home directory, and track and crate names unless asked.

    Args:
        text: Log or report text. Not a path to open.
        home: Directory to replace with ``~``. None uses the current home.
            A home of ``/`` or a single character is left unchanged.
        include_names: When False, audio file names and ``.crate`` /
            ``.scrate`` names become ``[track]`` and ``[crate]``.

    Returns:
        The redacted text. An empty string stays empty.
    """
    if not text:
        return ""
    rewritten = _replace_home(text, Path.home() if home is None else home)
    if include_names:
        return rewritten
    rewritten = _CRATE.sub("[crate]", rewritten)
    return _AUDIO.sub("[track]", rewritten)


def build_issue(
    kind: str,
    happened: str = "",
    expected: str = "",
    change: str = "",
    *,
    diagnostics: str,
    include_names: bool = False,
    home: Path | None = None,
    open_browser: bool = False,
) -> IssueLink:
    """Build the new-issue URL, or the clipboard text when the URL is too long.

    Args:
        kind: ``bug`` or ``feature``.
        happened: What happened. Bug reports only.
        expected: What the user expected. Bug reports only.
        change: What should change. Feature requests only.
        diagnostics: Already formatted diagnostic lines.
        include_names: When False, track and crate names in the user's
            words are removed. Diagnostics are not scanned for those names.
        home: Home directory passed to :func:`redact`.
        open_browser: When True and the URL is short enough, ask the system
            browser to open it. A refused URL is not opened.

    Returns:
        The link. ``opened`` is True only after ``webbrowser.open`` accepts
        a URL this module built.

    Raises:
        ValueError: ``kind`` is not ``bug`` or ``feature``, a field is not
            text, or a field is longer than ``FIELD_LIMIT``.
    """
    if kind not in KINDS:
        raise ValueError("Choose a bug report or a feature request.")
    happened = _field(happened)
    expected = _field(expected)
    change = _field(change)
    diagnostics = _field(diagnostics)
    happened = redact(happened, home, include_names=include_names)
    expected = redact(expected, home, include_names=include_names)
    change = redact(change, home, include_names=include_names)
    diagnostics = redact(diagnostics, home, include_names=False)
    report = _report(kind, happened, expected, change, diagnostics)
    template = BUG_TEMPLATE if kind == "bug" else FEATURE_TEMPLATE
    params = {"template": template, "title": _title(kind, happened, change), "diagnostics": diagnostics}
    if kind == "bug":
        params["happened"] = happened
        params["expected"] = expected
    else:
        params["change"] = change
    url = NEW_ISSUE + "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    if len(url) > URL_LIMIT:
        return IssueLink("clipboard", _template_url(template), report, False, diagnostics)
    if not open_browser:
        return IssueLink("open", url, report, False, diagnostics)
    if not open_in_browser(url):
        return IssueLink("clipboard", url, report, False, diagnostics)
    return IssueLink("open", url, report, True, diagnostics)


PAGES: dict[str, str] = {
    "repo": f"https://github.com/{REPO}",
    "releases": f"https://github.com/{REPO}/releases",
}


def open_page(name: str) -> bool:
    """Open the repository page or its release notes in the system browser.

    The desktop app shows the page in its own window, which has no address
    bar or Back button. A plain link would replace the app with GitHub, so
    these two pages open in the person's browser instead. Only the names in
    ``PAGES`` are accepted; the URL never comes from the request.

    Args:
        name: ``repo`` or ``releases``.

    Returns:
        True when the browser accepted the URL.

    Raises:
        ValueError: ``name`` is not one of ``PAGES``.
    """
    url = PAGES.get(name)
    if url is None:
        raise ValueError("That page is not available.")
    return bool(webbrowser.open(url))


def open_in_browser(url: str) -> bool:
    """Open a new-issue URL in the system browser.

    Args:
        url: URL returned by :func:`build_issue`.

    Returns:
        True when the browser accepted it. False for any other URL,
        including a different host, path, or template. Those are not opened.
    """
    if not _allowed(url):
        return False
    return bool(webbrowser.open(url))


def _report(kind: str, happened: str, expected: str, change: str, diagnostics: str) -> str:
    """Return the paste text for one report.

    Args:
        kind: ``bug`` or ``feature``.
        happened: Redacted bug text.
        expected: Redacted expected text.
        change: Redacted feature text.
        diagnostics: Diagnostic lines.

    Returns:
        The sections separated by blank lines.
    """
    if kind == "bug":
        body = f"What happened\n{happened}\n\nWhat you expected\n{expected}"
    else:
        body = f"What should change\n{change}"
    return f"{body}\n\nDiagnostics\n{diagnostics}"


def _title(kind: str, happened: str, change: str) -> str:
    """Return a short issue title.

    Args:
        kind: ``bug`` or ``feature``.
        happened: Redacted bug text.
        change: Redacted feature text.

    Returns:
        At most 72 characters, from the first line of the user's words.
    """
    source = happened if kind == "bug" else change
    line = source.splitlines()[0].strip() if source.strip() else ""
    prefix = "Bug: " if kind == "bug" else "Feature: "
    if not line:
        return "Bug report" if kind == "bug" else "Feature request"
    title = prefix + line
    return title if len(title) <= 72 else title[:71].rstrip() + "…"


def _template_url(template: str) -> str:
    """Return the new-issue URL with only the template selected.

    Args:
        template: ``bug_report.yml`` or ``feature_request.yml``.

    Returns:
        A short URL the clipboard fallback can still open.
    """
    return NEW_ISSUE + "?" + urllib.parse.urlencode({"template": template}, quote_via=urllib.parse.quote)


def _allowed(url: str) -> bool:
    """Return whether ``url`` is a new-issue form for this repository.

    Args:
        url: Candidate browser target.

    Returns:
        True only for https://github.com/mookiejones/crateCraft/issues/new
        with a known template and no userinfo.
    """
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.netloc != "github.com" or parsed.username or parsed.password:
        return False
    if parsed.path != f"/{REPO}/issues/new":
        return False
    query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
    template = query.get("template", [""])[0]
    return template in {BUG_TEMPLATE, FEATURE_TEMPLATE}


def _field(value: object) -> str:
    """Return a report field as text.

    Args:
        value: Caller-supplied field.

    Returns:
        The text.

    Raises:
        ValueError: The value is not a string, or it is longer than
            ``FIELD_LIMIT``.
    """
    if not isinstance(value, str):
        raise ValueError("That report field must be text.")
    if len(value) > FIELD_LIMIT:
        raise ValueError("That report is too long.")
    return value


def _attr(install: object, name: str) -> str:
    """Return one text attribute, or ``unknown``.

    Args:
        install: Install object.
        name: Attribute name.

    Returns:
        The stripped text, or ``unknown`` when it is missing or blank.
    """
    value = getattr(install, name, "unknown")
    if not isinstance(value, str) or not value.strip():
        return "unknown"
    return value.strip()


def _operating_system() -> str:
    """Return the operating system name and version.

    Returns:
        ``macOS`` plus the Mac version, ``Windows`` plus the release, or
        ``Linux`` plus the kernel release. A missing version is the name only.
    """
    system = platform.system()
    if system == "Darwin":
        version = platform.mac_ver()[0].strip()
        return f"macOS {version}".strip()
    if system == "Windows":
        version = platform.release().strip()
        return f"Windows {version}".strip()
    name = system or "unknown"
    version = platform.release().strip()
    return f"{name} {version}".strip()


def _replace_home(text: str, home: Path) -> str:
    """Replace a home directory prefix with ``~``.

    Args:
        text: Text that may contain the home path.
        home: Home directory. Only this directory is replaced.

    Returns:
        The text with each spelling of ``home`` replaced when it is the
        whole path or ends at a slash. Windows spellings ignore case.
        ``/`` is not treated as a home.
    """
    spellings = _home_spellings(home)
    pieces = text
    for spelling in sorted(spellings, key=len, reverse=True):
        flags = re.IGNORECASE if _windows_spelling(spelling) else 0
        pieces = re.sub(re.escape(spelling) + r"(?=/|\\|$)", "~", pieces, flags=flags)
    return pieces


def _windows_spelling(path: str) -> bool:
    """Return whether ``path`` is a Windows home spelling.

    Args:
        path: Absolute path text.

    Returns:
        True for a drive letter or a backslash. Those match without case
        even when the test is running on macOS or Linux.
    """
    return bool(re.match(r"^[A-Za-z]:", path)) or "\\" in path


def _home_spellings(home: Path) -> list[str]:
    """Return the path spellings that should become ``~``.

    Args:
        home: Home directory.

    Returns:
        Absolute spellings, including the other slash style. A home of
        ``/`` or a one-character path produces an empty list.
    """
    text = str(home)
    if len(text) < 2 or text in {"/", "\\"}:
        return []
    values = [text]
    swapped = text.replace("\\", "/") if "\\" in text else text.replace("/", "\\")
    if swapped != text:
        values.append(swapped)
    return values
