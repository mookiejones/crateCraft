"""Update check (issue #97): off until chosen, cached for a day, and safe.

No test reaches GitHub. Releases come from a stand-in ``fetch``, and the
one test of ``fetch_releases`` replaces ``urlopen``. Choices are written
to a temporary config folder.
"""

from __future__ import annotations

import io
import json
import os
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import app_config
import server
import update_check
from update_check import parse_version

REPO_PAGE = "https://github.com/mookiejones/serato-library-manager/releases"
DAY = update_check.CACHE_SECONDS


def _release(tag: str, *, prerelease: bool = False, draft: bool = False, url: str | None = None) -> dict[str, object]:
    """Return one release summary in the shape ``fetch_releases`` keeps.

    Args:
        tag: Release tag.
        prerelease: GitHub's pre-release flag.
        draft: GitHub's draft flag.
        url: Page URL. None uses this repository's tag page.

    Returns:
        The summary.
    """
    return {"tag": tag, "prerelease": prerelease, "draft": draft, "url": url or f"{REPO_PAGE}/tag/{tag}"}


class _Fetch:
    """A release source that counts calls, or fails when told to."""

    def __init__(self, releases: list[dict[str, object]] | None = None, error: Exception | None = None) -> None:
        """Remember what to return.

        Args:
            releases: Releases to return.
            error: Raise this instead.
        """
        self.releases = releases or []
        self.error = error
        self.calls = 0

    def __call__(self) -> list[dict[str, object]]:
        """Return the releases or raise."""
        self.calls += 1
        if self.error is not None:
            raise self.error
        return list(self.releases)


class _ConfigTest(unittest.TestCase):
    """Run each test in its own config folder at a fixed app version."""

    version = "v1.2.0"

    def setUp(self) -> None:
        """Point the config folder at a temporary directory."""
        self._dir = tempfile.TemporaryDirectory()
        self.folder = Path(self._dir.name)
        self._env = mock.patch.dict(os.environ, {app_config.CONFIG_ENV: str(self.folder)})
        self._env.start()
        self._version = mock.patch.object(update_check, "_current_version", lambda: self.version)
        self._version.start()

    def tearDown(self) -> None:
        """Remove the folder and the patches."""
        self._version.stop()
        self._env.stop()
        self._dir.cleanup()


class VersionTests(unittest.TestCase):
    """``parse_version`` orders releases and ignores dev builds."""

    def test_order(self) -> None:
        """beta < rc < final, and numbers compare as numbers."""
        ordered = ["v1.2.0-beta1", "v1.2.0-beta2", "v1.2.0-rc1", "v1.2.0-rc10", "v1.2.0", "v1.2.1", "v1.10.0"]
        parsed = [parse_version(tag) for tag in ordered]
        self.assertNotIn(None, parsed)
        self.assertEqual(parsed, sorted(parsed))  # type: ignore[type-var]
        self.assertTrue(parse_version("v1.2.0-rc1").prerelease)  # type: ignore[union-attr]
        self.assertFalse(parse_version("1.2.0").prerelease)  # type: ignore[union-attr]

    def test_dev_and_describe_builds_are_not_versions(self) -> None:
        """A dev build and a ``git describe`` string are not compared."""
        for text in ("0.0.0+dev", "1.2.3-4-gabc123", "v1.2", "latest", "v1.2.3-rc.1", ""):
            with self.subTest(text=text):
                self.assertIsNone(parse_version(text))


class OffUntilChosenTests(_ConfigTest):
    """Nothing leaves the machine until the check is turned on."""

    def test_unanswered_and_off_never_fetch(self) -> None:
        """No answer and an explicit No both skip the request."""
        fetch = _Fetch([_release("v9.0.0")])
        report = update_check.status(now=1000.0, fetch=fetch)
        self.assertIsNone(report["enabled"])
        self.assertFalse(report["update"])
        update_check.set_choice(enabled=False)
        report = update_check.status(now=1000.0, fetch=fetch)
        self.assertIs(report["enabled"], False)
        self.assertFalse(report["update"])
        self.assertEqual(fetch.calls, 0)

    def test_defaults_without_a_file_and_with_a_damaged_one(self) -> None:
        """A missing or damaged updates.json is the off-and-unanswered default."""
        self.assertEqual(update_check.state()["enabled"], None)
        (self.folder / update_check.STATE_NAME).write_text("{not json", encoding="utf-8")
        values = update_check.state()
        self.assertIsNone(values["enabled"])
        self.assertFalse(values["include_prereleases"])
        self.assertIsNone(values["skipped"])

    def test_choices_are_stored_beside_settings(self) -> None:
        """The choice lands in updates.json in the config folder."""
        update_check.set_choice(enabled=True)
        saved = json.loads((self.folder / "updates.json").read_text(encoding="utf-8"))
        self.assertIs(saved["enabled"], True)


class OfferTests(_ConfigTest):
    """Which release, if any, is offered."""

    def setUp(self) -> None:
        """Turn the check on."""
        super().setUp()
        update_check.set_choice(enabled=True)

    def test_newer_final_release_is_offered_with_its_page(self) -> None:
        """A newer final release is the offer."""
        fetch = _Fetch([_release("v1.3.0"), _release("v1.2.1"), _release("v1.2.0")])
        report = update_check.status(now=1000.0, fetch=fetch)
        self.assertTrue(report["update"])
        self.assertEqual(report["latest"], {"version": "v1.3.0", "url": f"{REPO_PAGE}/tag/v1.3.0", "prerelease": False})

    def test_same_or_older_is_not_offered(self) -> None:
        """The running version and older ones are not an update."""
        report = update_check.status(now=1000.0, fetch=_Fetch([_release("v1.2.0"), _release("v1.1.9")]))
        self.assertFalse(report["update"])
        self.assertIsNone(report["latest"])

    def test_drafts_are_ignored(self) -> None:
        """A draft is never offered."""
        report = update_check.status(now=1000.0, fetch=_Fetch([_release("v2.0.0", draft=True)]))
        self.assertFalse(report["update"])

    def test_prereleases_need_the_opt_in(self) -> None:
        """A beta or rc is offered only after opting in, by tag or by GitHub's flag."""
        fetch = _Fetch([_release("v1.3.0-rc1"), _release("v1.3.0", prerelease=True)])
        self.assertFalse(update_check.status(now=1000.0, fetch=fetch)["update"])
        update_check.set_choice(include_prereleases=True)
        report = update_check.status(now=1000.0, fetch=fetch)
        self.assertTrue(report["update"])
        self.assertEqual(report["latest"]["version"], "v1.3.0")  # type: ignore[index]

    def test_final_release_is_offered_to_a_release_candidate(self) -> None:
        """Someone on v1.2.0-rc1 is offered v1.2.0 without opting in."""
        self.version = "v1.2.0-rc1"
        report = update_check.status(now=1000.0, fetch=_Fetch([_release("v1.2.0")]))
        self.assertTrue(report["update"])

    def test_a_dev_build_is_never_offered_anything(self) -> None:
        """``0.0.0+dev`` cannot be compared, so there is no banner."""
        self.version = "0.0.0+dev"
        self.assertFalse(update_check.status(now=1000.0, fetch=_Fetch([_release("v9.0.0")]))["update"])

    def test_a_skipped_version_is_not_offered_but_a_newer_one_is(self) -> None:
        """Skip hides that version only."""
        update_check.set_choice(skipped="v1.3.0")
        report = update_check.status(now=1000.0, fetch=_Fetch([_release("v1.3.0")]))
        self.assertFalse(report["update"])
        self.assertEqual(report["latest"]["version"], "v1.3.0")  # type: ignore[index]
        report = update_check.status(now=1000.0 + DAY, fetch=_Fetch([_release("v1.4.0"), _release("v1.3.0")]))
        self.assertTrue(report["update"])
        with self.assertRaises(ValueError):
            update_check.set_choice(skipped="not a version")

    def test_a_foreign_page_url_is_replaced_by_the_releases_list(self) -> None:
        """Only this repository's tag page is passed on."""
        report = update_check.status(now=1000.0, fetch=_Fetch([_release("v1.3.0", url="https://evil.example/v1.3.0")]))
        self.assertEqual(report["latest"]["url"], REPO_PAGE)  # type: ignore[index]


class CacheTests(_ConfigTest):
    """GitHub is asked at most once a day."""

    def setUp(self) -> None:
        """Turn the check on."""
        super().setUp()
        update_check.set_choice(enabled=True)

    def test_a_day_old_answer_is_reused_then_refreshed(self) -> None:
        """Within 24 hours the cache answers; after that GitHub is asked again."""
        fetch = _Fetch([_release("v1.3.0")])
        update_check.status(now=1000.0, fetch=fetch)
        update_check.status(now=1000.0 + DAY - 1, fetch=fetch)
        self.assertEqual(fetch.calls, 1)
        update_check.status(now=1000.0 + DAY, fetch=fetch)
        self.assertEqual(fetch.calls, 2)

    def test_a_clock_moved_backwards_refreshes(self) -> None:
        """A fetch time in the future is not trusted."""
        fetch = _Fetch([_release("v1.3.0")])
        update_check.status(now=5000.0, fetch=fetch)
        update_check.status(now=1000.0, fetch=fetch)
        self.assertEqual(fetch.calls, 2)

    def test_a_failed_request_is_quiet_and_not_cached(self) -> None:
        """No network means no banner, and the next launch tries again."""
        down = _Fetch(error=urllib.error.URLError("offline"))
        report = update_check.status(now=1000.0, fetch=down)
        self.assertFalse(report["update"])
        self.assertIsNone(update_check.state()["fetched_at"])
        up = _Fetch([_release("v1.3.0")])
        self.assertTrue(update_check.status(now=1001.0, fetch=up)["update"])

    def test_turning_off_or_changing_prereleases_drops_the_cache(self) -> None:
        """Off clears the cached list."""
        update_check.status(now=1000.0, fetch=_Fetch([_release("v1.3.0")]))
        update_check.set_choice(enabled=False)
        self.assertEqual(update_check.state()["releases"], [])
        self.assertIsNone(update_check.state()["fetched_at"])


class FetchTests(_ConfigTest):
    """``fetch_releases`` keeps four fields and sends only the version."""

    def _answer(self, body: bytes) -> mock.MagicMock:
        """Return an ``urlopen`` stand-in that answers ``body``.

        Args:
            body: Response bytes.

        Returns:
            The patched callable.
        """
        response = mock.MagicMock()
        response.__enter__.return_value = io.BytesIO(body)
        return mock.MagicMock(return_value=response)

    def test_only_tag_flags_and_url_are_kept(self) -> None:
        """Release notes, authors, and assets are dropped."""
        body = json.dumps(
            [
                {"tag_name": "v1.3.0", "prerelease": False, "draft": False, "html_url": f"{REPO_PAGE}/tag/v1.3.0",
                 "body": "notes", "author": {"login": "x"}},
                {"name": "no tag"},
                "not a release",
            ]
        ).encode("utf-8")
        opener = self._answer(body)
        with mock.patch.object(update_check.urllib.request, "urlopen", opener):
            found = update_check.fetch_releases()
        self.assertEqual(found, [_release("v1.3.0")])
        request = opener.call_args.args[0]
        self.assertEqual(request.full_url, update_check.API_URL)
        self.assertEqual(request.get_header("User-agent"), "serato-library-manager/v1.2.0")
        self.assertEqual(opener.call_args.kwargs["timeout"], update_check.TIMEOUT_SECONDS)

    def test_a_wrong_or_huge_answer_is_rejected(self) -> None:
        """A non-list or an oversized body raises ValueError, each for its own reason."""
        cases = (
            (b'{"message": "rate limited"}', "not a list"),
            (b"[" + b" " * (update_check.RESPONSE_LIMIT + 1) + b"]", "too large"),
        )
        for body, reason in cases:
            with self.subTest(reason=reason), mock.patch.object(
                update_check.urllib.request, "urlopen", self._answer(body)
            ), self.assertRaisesRegex(ValueError, reason):
                update_check.fetch_releases()


class OpenTests(_ConfigTest):
    """Only the offered release page of this repository opens."""

    def test_open_uses_the_offer_and_nothing_else(self) -> None:
        """No offer opens nothing; an offer opens its page."""
        update_check.set_choice(enabled=True)
        with mock.patch.object(update_check.webbrowser, "open", return_value=True) as opened:
            self.assertFalse(update_check.open_release(now=1000.0, fetch=_Fetch([])))
            self.assertTrue(update_check.open_release(now=1000.0 + DAY, fetch=_Fetch([_release("v1.3.0")])))
        opened.assert_called_once_with(f"{REPO_PAGE}/tag/v1.3.0")

    def test_open_refuses_a_page_outside_this_repository(self) -> None:
        """Even if an offer carried a foreign URL, it is not opened."""
        offer = {"latest": {"version": "v1.3.0", "url": "https://evil.example/v1.3.0", "prerelease": False}}
        with mock.patch.object(update_check, "status", return_value=offer), mock.patch.object(
            update_check.webbrowser, "open", return_value=True
        ) as opened:
            self.assertFalse(update_check.open_release())
        opened.assert_not_called()


class RouteTests(_ConfigTest):
    """``GET`` and ``POST /api/update`` without a library and without GitHub."""

    def setUp(self) -> None:
        """Start the server and block real requests."""
        super().setUp()
        self._block = mock.patch.object(update_check, "fetch_releases", side_effect=AssertionError("no network"))
        self._block.start()
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        host, port = self.httpd.server_address[:2]
        self.base = f"http://{host}:{port}/api/update"

    def tearDown(self) -> None:
        """Stop the server."""
        self.httpd.shutdown()
        self.httpd.server_close()
        self._block.stop()
        super().tearDown()

    def post(self, body: object) -> tuple[int, dict[str, object]]:
        """POST JSON and return the status and body.

        Args:
            body: JSON body.

        Returns:
            Status code and decoded JSON.
        """
        request = urllib.request.Request(
            self.base, data=json.dumps(body).encode("utf-8"), headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            data = exc.read()
            exc.close()
            return exc.code, json.loads(data.decode("utf-8"))

    def test_get_while_unanswered_does_not_fetch(self) -> None:
        """The first launch reports ``enabled: null`` and makes no request."""
        with urllib.request.urlopen(self.base, timeout=5) as response:
            body = json.loads(response.read().decode("utf-8"))
        self.assertIsNone(body["enabled"])
        self.assertFalse(body["update"])

    def test_post_saves_one_choice_and_rejects_the_rest(self) -> None:
        """Valid choices are saved; malformed ones are 400 and change nothing."""
        self.assertEqual(self.post({"enabled": True})[1]["enabled"], True)
        self.assertEqual(self.post({"include_prereleases": True})[1]["include_prereleases"], True)
        self.assertEqual(self.post({"skip": "v1.3.0"})[1]["skipped"], "v1.3.0")
        for bad in ({}, {"enabled": "yes"}, {"enabled": 1}, {"skip": "soon"}, {"skip": 3},
                    {"open": "please"}, {"enabled": True, "skip": "v1.3.0"}):
            with self.subTest(body=bad):
                self.assertEqual(self.post(bad)[0], 400)
        values = update_check.state()
        self.assertEqual((values["enabled"], values["include_prereleases"], values["skipped"]), (True, True, "v1.3.0"))


if __name__ == "__main__":
    unittest.main()
