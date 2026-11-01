"""Tell the page when a newer release is on GitHub (issue #97).

The check is off until the person turns it on. ``state()["enabled"]`` is
None when nobody has answered yet, so setup can ask. While it is off, no
request leaves the machine. While it is on, ``status`` asks GitHub's public
releases API at most once every 24 hours and caches the answer. GitHub sees
the request's IP address and the app version in the User-Agent. No library
data, path, or install id is sent.

Choices and the cache live in ``updates.json`` beside ``settings.json``.
Pre-releases are shown only after opting in. A skipped version is not
offered again, but a newer one is. Only a release page of this repository
is ever opened.
"""

from __future__ import annotations

import json
import logging
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import cast

import app_config

logger = logging.getLogger("serato.update")

REPO = "mookiejones/serato-library-manager"
API_URL = f"https://api.github.com/repos/{REPO}/releases?per_page=20"
RELEASES_PAGE = f"https://github.com/{REPO}/releases"
STATE_NAME = "updates.json"
CACHE_SECONDS = 24 * 60 * 60
TIMEOUT_SECONDS = 5.0
RESPONSE_LIMIT = 2 * 1024 * 1024
_VERSION = re.compile(r"^v?(\d+)\.(\d+)\.(\d+)(?:-(rc|beta)(\d+))?$")

Fetch = Callable[[], list[dict[str, object]]]


@dataclass(frozen=True, order=True, slots=True)
class Version:
    """A release version that sorts in release order.

    ``-betaN`` sorts before ``-rcN``, and both sort before the final
    release of the same number.

    Attributes:
        major: Major number.
        minor: Minor number.
        patch: Patch number.
        stage: 0 for beta, 1 for rc, 2 for a final release.
        pre: The beta or rc number, 0 for a final release.
    """

    major: int
    minor: int
    patch: int
    stage: int
    pre: int

    @property
    def prerelease(self) -> bool:
        """Return whether this is a beta or rc."""
        return self.stage < 2


def parse_version(text: str) -> Version | None:
    """Parse ``v1.2.3``, ``v1.2.3-rc1``, or ``v1.2.3-beta1``.

    Args:
        text: Tag or version text.

    Returns:
        The version, or None for anything else, including ``0.0.0+dev`` and
        a ``git describe`` string such as ``1.2.3-4-gabc123``. Those builds
        are not compared, so they never show a banner.
    """
    match = _VERSION.match(text.strip())
    if match is None:
        return None
    major, minor, patch, kind, number = match.groups()
    if kind is None:
        return Version(int(major), int(minor), int(patch), 2, 0)
    return Version(int(major), int(minor), int(patch), 0 if kind == "beta" else 1, int(number))


def _mapping(value: object) -> dict[str, object] | None:
    """Return a JSON object as a typed dict, or None.

    Args:
        value: Parsed JSON value.

    Returns:
        The same dict when every key is text, otherwise None.
    """
    if not isinstance(value, dict):
        return None
    items = cast(dict[object, object], value)
    if not all(isinstance(key, str) for key in items):
        return None
    return cast(dict[str, object], items)


def _items(value: object) -> list[dict[str, object]]:
    """Return the JSON objects in a JSON list, skipping anything else.

    Args:
        value: Parsed JSON value.

    Returns:
        The objects, in order. Not a list gives an empty list.
    """
    if not isinstance(value, list):
        return []
    found: list[dict[str, object]] = []
    for item in cast(list[object], value):
        mapped = _mapping(item)
        if mapped is not None:
            found.append(mapped)
    return found


def _current_version() -> str:
    """Return the running app version, the same string as ``GET /api/version``."""
    return str(app_config.APP_VERSION)


def _state_path() -> Path:
    """Return ``updates.json`` beside ``settings.json``."""
    return app_config.config_dir() / STATE_NAME


def state() -> dict[str, object]:
    """Return the saved choices and cache.

    Returns:
        ``enabled`` (True, False, or None when never answered),
        ``include_prereleases``, ``skipped``, ``fetched_at``, and
        ``releases``. A missing or damaged file gives the defaults.
    """
    raw: object = {}
    path = _state_path()
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raw = {}
    except (OSError, UnicodeError, json.JSONDecodeError):
        logger.warning("updates.json could not be read; using defaults")
        raw = {}
    saved = _mapping(raw) or {}
    enabled = saved.get("enabled")
    releases = saved.get("releases")
    fetched = saved.get("fetched_at")
    skipped = saved.get("skipped")
    return {
        "enabled": enabled if isinstance(enabled, bool) else None,
        "include_prereleases": saved.get("include_prereleases") is True,
        "skipped": skipped if isinstance(skipped, str) and parse_version(skipped) else None,
        "fetched_at": float(fetched) if isinstance(fetched, (int, float)) else None,
        "releases": _items(releases),
    }


def _save(values: dict[str, object]) -> None:
    """Write ``updates.json`` through a temporary file.

    Args:
        values: The full state to store.
    """
    path = _state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(values, indent=2, sort_keys=True), encoding="utf-8")
    temporary.replace(path)


def set_choice(
    *,
    enabled: bool | None = None,
    include_prereleases: bool | None = None,
    skipped: str | None = None,
) -> dict[str, object]:
    """Save the person's choices. Only the fields passed change.

    Turning the check off or changing the pre-release choice drops the
    cache, so a later check starts from GitHub's current list.

    Args:
        enabled: Turn the check on or off.
        include_prereleases: Offer betas and release candidates.
        skipped: A version tag not to offer again.

    Returns:
        The saved state.

    Raises:
        ValueError: ``skipped`` is not a release version.
    """
    values = state()
    if enabled is not None:
        values["enabled"] = enabled
        if not enabled:
            values["fetched_at"] = None
            values["releases"] = []
    if include_prereleases is not None:
        values["include_prereleases"] = include_prereleases
    if skipped is not None:
        if parse_version(skipped) is None:
            raise ValueError("That is not a release version.")
        values["skipped"] = skipped
    _save(values)
    return values


def fetch_releases() -> list[dict[str, object]]:
    """Ask GitHub's public API for this repository's recent releases.

    Only the tag, the pre-release and draft flags, and the page URL are
    kept. The request carries the app version in the User-Agent and no
    other identifier.

    Returns:
        Release summaries, newest first as GitHub lists them.

    Raises:
        OSError: The request failed or timed out.
        ValueError: The answer is not the expected JSON list.
    """
    request = urllib.request.Request(
        API_URL,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": f"serato-library-manager/{_current_version()}",
        },
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        body = response.read(RESPONSE_LIMIT + 1)
    if len(body) > RESPONSE_LIMIT:
        raise ValueError("The release list is too large.")
    payload: object = json.loads(body.decode("utf-8"))
    if not isinstance(payload, list):
        raise ValueError("The release list is not a list.")
    found: list[dict[str, object]] = []
    for item in _items(cast(object, payload)):
        tag = item.get("tag_name")
        url = item.get("html_url")
        if not isinstance(tag, str) or not isinstance(url, str):
            continue
        found.append(
            {
                "tag": tag,
                "prerelease": item.get("prerelease") is True,
                "draft": item.get("draft") is True,
                "url": url,
            }
        )
    return found


def _release_url(url: object, tag: str) -> str:
    """Return a release page of this repository, or the releases list.

    Args:
        url: ``html_url`` from GitHub.
        tag: The release tag.

    Returns:
        ``url`` when it is ``https://github.com/<repo>/releases/tag/<tag>``,
        otherwise the repository's releases page.
    """
    expected = f"{RELEASES_PAGE}/tag/{urllib.parse.quote(tag, safe='')}"
    if isinstance(url, str) and url == expected:
        return url
    return RELEASES_PAGE


def status(*, now: float | None = None, fetch: Fetch | None = None) -> dict[str, object]:
    """Report whether a newer release should be offered.

    Nothing is fetched while the check is off or unanswered. A cached list
    younger than 24 hours is reused. A failed request is not an error for
    the page: it reports no update and tries again on the next launch.

    Args:
        now: Clock for tests. None uses ``time.time()``.
        fetch: Release source for tests. None asks GitHub.

    Returns:
        ``enabled``, ``include_prereleases``, ``current``, ``update`` (True
        when a newer, not skipped release exists), and ``latest`` with
        ``version``, ``url``, and ``prerelease``, or None.
    """
    values = state()
    current = _current_version()
    report: dict[str, object] = {
        "enabled": values["enabled"],
        "include_prereleases": values["include_prereleases"],
        "current": current,
        "update": False,
        "latest": None,
    }
    if values["enabled"] is not True:
        return report
    clock = time.time() if now is None else now
    fetched = values["fetched_at"]
    releases = values["releases"]
    fresh = isinstance(fetched, float) and 0 <= clock - fetched < CACHE_SECONDS
    if not fresh:
        try:
            releases = (fetch or fetch_releases)()
        except (OSError, ValueError, urllib.error.URLError) as exc:
            logger.info("Update check did not reach GitHub: %s", type(exc).__name__)
            return report
        values["releases"] = releases
        values["fetched_at"] = clock
        _save(values)
    running = parse_version(current)
    if running is None:
        return report
    best: tuple[Version, str, str] | None = None
    for item in _items(releases):
        tag = item.get("tag")
        if not isinstance(tag, str) or item.get("draft") is True:
            continue
        version = parse_version(tag)
        if version is None:
            continue
        if (version.prerelease or item.get("prerelease") is True) and not values["include_prereleases"]:
            continue
        if best is None or version > best[0]:
            best = (version, tag, _release_url(item.get("url"), tag))
    if best is None or best[0] <= running:
        return report
    report["latest"] = {"version": best[1], "url": best[2], "prerelease": best[0].prerelease}
    report["update"] = best[1] != values["skipped"]
    return report


def open_release(*, now: float | None = None, fetch: Fetch | None = None) -> bool:
    """Open the offered release page in the system browser.

    The URL comes from ``status``, which only returns a release page of this
    repository, never from the request.

    Args:
        now: Clock for tests.
        fetch: Release source for tests.

    Returns:
        True when the browser accepted the page. False when there is no
        update to open.
    """
    latest = _mapping(status(now=now, fetch=fetch).get("latest"))
    if latest is None:
        return False
    url = latest.get("url")
    if not isinstance(url, str) or not url.startswith(RELEASES_PAGE):
        return False
    return bool(webbrowser.open(url))
