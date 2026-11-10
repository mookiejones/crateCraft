# Security

The library browser is a local program. `server.py` binds `127.0.0.1` port `8765` and has no login. The desktop app binds `127.0.0.1` on a free port, then opens that page in a native window. The window uses the system web view and does not bundle Chromium. Do not publish that port, put the process behind a tunnel, or deploy it as a website. Anyone who can reach it can read and edit the Serato library on that machine. `POST /api/shutdown` and `POST /api/focus` are enabled only for the desktop process, and only with tokens that are not in the page.

Do not send `master.sqlite`, `root.sqlite`, or audio files with a report. Cue data lives in the audio file. The database lives outside this repository.

Anonymous usage counts and crash reports are off until the person opts in from the page. They never include track titles, crate names, file paths, or library rows. A missing `SENTRY_DSN` or `POSTHOG_KEY` disables that service. Release builds bake those client keys from Actions secrets of the same names. Do not commit a DSN or a project key. The copy of `_build_config.py` in git stays empty. [PRIVACY.md](PRIVACY.md) is the full note.

## Reporting a vulnerability

Use a GitHub private security advisory: [Open a security advisory](https://github.com/mookiejones/crateCraft/security/advisories/new).

Private vulnerability reporting is enabled on this repository. Do not open a public issue for a vulnerability.

GitHub secret scanning, push protection, vulnerability alerts, and Dependabot security updates are on for this repository.

## Downloads

Release builds are unsigned. GitHub Releases is the only download. The open steps are in [docs/first-install.md](docs/first-install.md).

The published release today is v0.1.1. Check those two files:

```bash
gh attestation verify Serato-Library-macos.zip --repo mookiejones/serato-library-manager
gh attestation verify crateCraft-windows.zip --repo mookiejones/crateCraft
```

A release built by [`.github/workflows/release.yml`](.github/workflows/release.yml) after the crateCraft rename uses the names below. Those files are not attached to v0.1.1. Check them on a release that includes them. A release from before the rename uses `Serato-Library-` in place of `crateCraft-` and was built as `mookiejones/serato-library-manager`; pass that name to `--repo` for it:

```bash
gh attestation verify crateCraft-macos-arm64.dmg --repo mookiejones/crateCraft
gh attestation verify crateCraft-macos-x64.dmg --repo mookiejones/crateCraft
gh attestation verify crateCraft-windows-setup.exe --repo mookiejones/crateCraft
gh attestation verify crateCraft-windows.zip --repo mookiejones/crateCraft
gh attestation verify SHA256SUMS --repo mookiejones/crateCraft
```

## Supported versions

| | |
| --- | --- |
| App | `1.1.0` in source. Latest GitHub Release: v0.1.1. |
| Python | 3.12 and 3.14 in CI. Frozen builds embed 3.12. |
| OS | macOS and Windows. |
| Serato | Serato DJ Pro. Writes and restores stay off on Serato 5 when Protect Library is on or unread, and when the version cannot be read. |

Report against the version you run. Say whether it is the v0.1.1 download or a build from source.
