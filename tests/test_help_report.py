"""Tests for the Help issue link. No library file is opened."""

from __future__ import annotations

import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

import help_report
import server


class _Install:
    """Stand-in for a Serato install reading."""

    def __init__(self, version: str = "5.0.0", build: str = "5.0.0.1251", protect: str = "off") -> None:
        self.version = version
        self.build = build
        self.protect = protect


class RedactTests(unittest.TestCase):
    """Home paths and names."""

    def test_home_and_names_are_removed_unless_asked(self) -> None:
        """A Mac path and a Windows path lose the home and the file names.

        Returns:
            None.
        """
        mac = "Library file: /Users/ada/Music/House/track.mp3 in Friday.crate"
        self.assertEqual(
            help_report.redact(mac, Path("/Users/ada")),
            "Library file: ~/Music/House/[track] in [crate]",
        )
        windows = r"C:\Users\Ada\Music\Night.mp3"
        self.assertEqual(
            help_report.redact(windows, Path(r"C:\Users\Ada")),
            r"~\Music\[track]",
        )
        self.assertEqual(
            help_report.redact(windows, Path(r"C:\Users\ada")),
            r"~\Music\[track]",
        )
        kept = help_report.redact(mac, Path("/Users/ada"), include_names=True)
        self.assertIn("track.mp3", kept)
        self.assertIn("Friday.crate", kept)
        self.assertNotIn("/Users/ada", kept)
        self.assertEqual(help_report.redact("fine", Path("/")), "fine")
        self.assertNotIn("/Users/ada/", help_report.redact("other /Users/adam/track.mp3", Path("/Users/ada")))
        self.assertIn("/Users/adam/[track]", help_report.redact("other /Users/adam/track.mp3", Path("/Users/ada")))

    def test_diagnostics_have_no_path(self) -> None:
        """The seven lines name versions, not a library path.

        Returns:
            None.
        """
        fields = help_report.collect_diagnostics(_Install())
        self.assertEqual(
            set(fields),
            {
                "app_version",
                "commit",
                "os",
                "python",
                "serato_version",
                "serato_build",
                "protect_library",
            },
        )
        text = help_report.format_diagnostics(fields)
        self.assertIn("Serato version: 5.0.0", text)
        self.assertIn("Serato build: 5.0.0.1251", text)
        self.assertIn("Protect Library: off", text)
        self.assertNotIn("sqlite", text.lower())
        self.assertNotIn("/Users", text)
        blank = help_report.collect_diagnostics(_Install(version="  ", build="", protect="unknown"))
        self.assertEqual(blank["serato_version"], "unknown")
        self.assertEqual(blank["serato_build"], "unknown")
        self.assertIn("Protect Library: unknown", help_report.format_diagnostics(blank))


class LinkTests(unittest.TestCase):
    """URL shape, the length fallback, and the browser guard."""

    def test_bug_url_is_prefilled_and_redacted(self) -> None:
        """The bug template carries the words and not the home path.

        Returns:
            None.
        """
        link = help_report.build_issue(
            "bug",
            happened="It failed on /Users/ada/Music/track.mp3",
            expected="The crate Friday.crate would open",
            diagnostics="App version: 0.0.0+dev\nProtect Library: unknown",
            home=Path("/Users/ada"),
        )
        self.assertEqual(link.mode, "open")
        self.assertFalse(link.opened)
        self.assertIn("template=bug_report.yml", link.url)
        self.assertIn("happened=", link.url)
        self.assertIn("expected=", link.url)
        self.assertNotIn("/Users/ada", link.url)
        self.assertNotIn("track.mp3", link.url)
        self.assertNotIn("Friday.crate", link.url)
        self.assertIn("[track]", link.text)
        self.assertIn("[crate]", link.text)
        self.assertTrue(link.url.startswith(help_report.NEW_ISSUE + "?"))

    def test_feature_url_uses_the_feature_template(self) -> None:
        """A feature request does not use the bug fields.

        Returns:
            None.
        """
        link = help_report.build_issue(
            "feature",
            change="Show the drive",
            diagnostics="App version: 0.0.0+dev",
            home=Path("/Users/ada"),
        )
        self.assertIn("template=feature_request.yml", link.url)
        self.assertIn("change=", link.url)
        self.assertNotIn("happened=", link.url)
        self.assertIn("What should change\nShow the drive", link.text)

    def test_long_report_is_copied_instead_of_linked(self) -> None:
        """A URL past 6000 characters is not the one that would be opened.

        Returns:
            None.
        """
        link = help_report.build_issue(
            "bug",
            happened="x" * 5000,
            expected="y" * 2000,
            diagnostics="App version: 0.0.0+dev",
            home=Path("/Users/ada"),
            open_browser=True,
        )
        self.assertEqual(link.mode, "clipboard")
        self.assertFalse(link.opened)
        self.assertLess(len(link.url), help_report.URL_LIMIT)
        self.assertNotIn("xxxxx", link.url)
        self.assertIn("x" * 5000, link.text)
        self.assertTrue(link.url.endswith("template=bug_report.yml"))

    def test_browser_opens_only_this_repos_form(self) -> None:
        """webbrowser.open is called for the form and refused for anything else.

        Returns:
            None.
        """
        with mock.patch.object(help_report.webbrowser, "open", return_value=True) as opened:
            link = help_report.build_issue(
                "bug",
                happened="The count was wrong",
                expected="3",
                diagnostics="App version: 0.0.0+dev",
                home=Path("/tmp/nobody"),
                open_browser=True,
            )
        self.assertTrue(link.opened)
        self.assertEqual(link.mode, "open")
        target = opened.call_args.args[0]
        self.assertTrue(target.startswith("https://github.com/mookiejones/serato-library-manager/issues/new?"))
        self.assertFalse(help_report.open_in_browser("https://evil.example/issues/new?template=bug_report.yml"))
        self.assertFalse(help_report.open_in_browser(help_report.NEW_ISSUE + "?template=other.yml"))
        self.assertFalse(help_report.open_in_browser("https://github.com/other/serato-library-manager/issues/new?template=bug_report.yml"))
        self.assertFalse(opened.call_count > 1)

    def test_a_browser_refusal_does_not_pretend_it_opened(self) -> None:
        """A False from webbrowser becomes the clipboard mode.

        Returns:
            None.
        """
        with mock.patch.object(help_report.webbrowser, "open", return_value=False):
            link = help_report.build_issue(
                "bug",
                happened="Stopped",
                expected="It continues",
                diagnostics="App version: 0.0.0+dev",
                open_browser=True,
            )
        self.assertEqual(link.mode, "clipboard")
        self.assertFalse(link.opened)
        self.assertIn("template=bug_report.yml", link.url)

    def test_bad_fields_are_rejected(self) -> None:
        """An unknown kind, a non-string, and an oversized field fail.

        Returns:
            None.
        """
        with self.assertRaises(ValueError):
            help_report.build_issue("question", diagnostics="App version: 0.0.0+dev")
        with self.assertRaises(ValueError):
            help_report.build_issue("bug", happened=3, diagnostics="App version: 0.0.0+dev")  # type: ignore[arg-type]
        with self.assertRaises(ValueError):
            help_report.build_issue("bug", happened="z" * (help_report.FIELD_LIMIT + 1), diagnostics="ok")


class HelpRouteTests(unittest.TestCase):
    """GET and POST /api/help do not need a library."""

    def test_get_and_post_do_not_open_a_library(self) -> None:
        """Diagnostics come back, and POST opens only the GitHub form.

        Returns:
            None.
        """
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]
        try:
            with urllib.request.urlopen(f"http://{host}:{port}/api/help", timeout=5) as response:
                self.assertEqual(response.status, 200)
                body = json.loads(response.read().decode("utf-8"))
            self.assertIn("Protect Library:", body["diagnostics"])
            self.assertNotIn("master.sqlite", body["diagnostics"])
            self.assertIn("log", body)
            payload = json.dumps({
                "kind": "bug",
                "happened": "The button did nothing",
                "expected": "A dialog",
                "include_names": False,
                "open": False,
            }).encode("utf-8")
            request = urllib.request.Request(
                f"http://{host}:{port}/api/help",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=5) as response:
                posted = json.loads(response.read().decode("utf-8"))
            self.assertEqual(posted["mode"], "open")
            self.assertFalse(posted["opened"])
            self.assertIn("bug_report.yml", posted["url"])
            bad = json.dumps({"kind": "nope"}).encode("utf-8")
            refused = urllib.request.Request(f"http://{host}:{port}/api/help", data=bad)
            with self.assertRaises(urllib.error.HTTPError) as caught:
                urllib.request.urlopen(refused, timeout=5)
            self.assertEqual(caught.exception.code, 400)
        finally:
            httpd.shutdown()
            httpd.server_close()



class PageTests(unittest.TestCase):
    """GitHub pages open in the system browser, never in the app window."""

    def test_only_the_two_known_pages_open(self) -> None:
        """``repo`` and ``releases`` open their fixed URLs; anything else raises."""
        with mock.patch.object(help_report.webbrowser, "open", return_value=True) as opened:
            self.assertTrue(help_report.open_page("repo"))
            self.assertTrue(help_report.open_page("releases"))
            for bad in ("issues", "https://example.com", "", "REPO"):
                with self.subTest(page=bad), self.assertRaises(ValueError):
                    help_report.open_page(bad)
        self.assertEqual(
            [call.args[0] for call in opened.call_args_list],
            [
                "https://github.com/mookiejones/serato-library-manager",
                "https://github.com/mookiejones/serato-library-manager/releases",
            ],
        )

    def test_post_page_opens_the_browser_and_refuses_other_names(self) -> None:
        """POST ``page`` opens a known page; an unknown one is 400 and opens nothing."""
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        host, port = httpd.server_address[:2]

        def post(body: dict[str, object]) -> urllib.request.Request:
            return urllib.request.Request(
                f"http://{host}:{port}/api/help",
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )

        try:
            with mock.patch.object(help_report.webbrowser, "open", return_value=True) as opened:
                with urllib.request.urlopen(post({"page": "releases"}), timeout=5) as response:
                    self.assertEqual(json.loads(response.read().decode("utf-8")), {"opened": True})
                for bad in ({"page": "https://example.com"}, {"page": 3}):
                    with self.subTest(body=bad), self.assertRaises(urllib.error.HTTPError) as caught:
                        urllib.request.urlopen(post(bad), timeout=5)
                    self.assertEqual(caught.exception.code, 400)
            opened.assert_called_once_with("https://github.com/mookiejones/serato-library-manager/releases")
        finally:
            httpd.shutdown()
            httpd.server_close()

if __name__ == "__main__":
    unittest.main()
