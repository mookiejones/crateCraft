"""Read-only "safe to update?" verdict for Serato, the OS, and hardware.

``evaluate`` does not update Serato, the operating system, or firmware.
It does not open the network. A caller may inject ``fetch``. A fetch that
fails is ``unknown``, never ``yes``. Tests pass facts and do not fetch.

macOS 27 needs Serato DJ Pro or Lite 5.1.0 or newer. Hardware the vendor
lists as in testing or unsupported is ``not_cleared`` even when the
versions match. Unknown hardware, an empty hardware list, an unknown
Serato version, or an unknown OS is ``unknown``, never ``yes``.

Facts were read on 2026-11-26 from Serato's own pages, not from Lexicon:

* https://support.serato.com/hc/en-us/articles/18264025096975-macOS-27-Golden-Gate-supported-from-Serato-DJ-Pro-Lite-5-1-0-primary-hardware-compatibility
* https://serato.com/dj/pro/downloads
* https://serato.com/dj/pro/downloads/archive (Serato DJ Pro 5.1.0, 2026-11-10)

Lexicon may be linked by the page. This module does not read it.
"""

from __future__ import annotations

import platform
import re
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date

VERDICT_YES = "yes"
VERDICT_NOT = "not_cleared"
VERDICT_UNKNOWN = "unknown"

CLEARED = "cleared"
IN_TESTING = "in_testing"
UNSUPPORTED = "unsupported"

FRESH_DAYS = 7
MACOS_27_MAJOR = 27
MIN_SERATO_MACOS_27 = "5.1.0"
SERATO_510_PUBLISHED = date(2026, 11, 10)

SERATO_DOWNLOADS = "https://serato.com/dj/pro/downloads"
SERATO_ARCHIVE = "https://serato.com/dj/pro/downloads/archive"
MACOS_27_ARTICLE = (
    "https://support.serato.com/hc/en-us/articles/"
    "18264025096975-macOS-27-Golden-Gate-supported-from-Serato-DJ-Pro-Lite-5-1-0-primary-hardware-compatibility"
)
LEXICON_UPDATES = "https://www.lexicondj.com/dj-software-updates"

_SPACE = re.compile(r"\s+")
_VERSION = re.compile(r"(\d+(?:\.\d+)*)")
_NOT_CLEARED = frozenset({"serato_below_os", "hardware_in_testing", "hardware_unsupported"})
_LABELS = {"serato": "Serato", "macos": "macOS", "windows": "Windows", "os": "OS"}

# Names are the article's, without the firmware-updater asterisk.
_MACOS_27_CLEARED = (
    "Akai Pro AMX",
    "Allen & Heath Xone:43C",
    "AlphaTheta DJM-A7",
    "Denon DJ DS1",
    "Denon DJ MC2000",
    "Denon DJ MC4000",
    "Denon DJ MC6000MK2",
    "Denon DJ MC7000",
    "Denon DJ MCX8000",
    "Denon DJ PRIME 4+",
    "Denon DJ SC LIVE 2",
    "Denon DJ SC LIVE 4",
    "Denon DJ X1800 PRIME",
    "Denon DJ X1850 PRIME",
    "Gemini Slate",
    "Gemini Slate 4",
    "Hercules DJControl Inpulse 200",
    "Hercules DJControl Inpulse 200 MK2",
    "Hercules DJControl Inpulse 200 MK3",
    "Hercules DJControl Inpulse 300",
    "Hercules DJControl Inpulse 300 MK2",
    "Hercules DJControl Inpulse 500",
    "Hercules DJControl Inpulse T7",
    "Hercules DJControl T10",
    "Hercules DJControl Jogvision",
    "Hercules DJControl Starlight",
    "Mixars DUO (including MKII)",
    "Mixars PRIMO",
    "Mixars QUATTRO",
    "Native Instruments Traktor Kontrol S2 MK3",
    "Native Instruments Traktor Kontrol S3",
    "Native Instruments Traktor Kontrol Z2",
    "Numark DJ2GO2",
    "Numark DJ2GO2 Touch",
    "Numark MixDeck Express",
    "Numark MixDeck Quad",
    "Numark Mixstream Pro",
    "Numark Mixstream Pro Go",
    "Numark Mixtrack GO",
    "Numark Mixtrack Platinum",
    "Numark Mixtrack Platinum FX",
    "Numark Mixtrack Pro",
    "Numark Mixtrack Pro II",
    "Numark Mixtrack Pro III",
    "Numark Mixtrack Pro FX",
    "Numark Mixtrack Quad",
    "Numark N4",
    "Numark NS4FX",
    "Numark NS6II",
    "Numark NS7 III",
    "Numark NV",
    "Numark NVII",
    "Numark Party Mix",
    "Numark Party Mix II",
    "Numark Party Mix III",
    "Numark Party Mix Live",
    "Numark Party Mix Pro",
    "Numark Scratch",
    "Pioneer DJ DDJ-200",
    "Pioneer DJ DDJ-400",
    "Pioneer DJ DDJ-ERGO",
    "Pioneer DJ DDJ-RB",
    "Pioneer DJ DDJ-S1",
    "Pioneer DJ DDJ-SB",
    "Pioneer DJ DDJ-SB2",
    "Pioneer DJ DDJ-SR",
    "Pioneer DJ DDJ-SX",
    "Pioneer DJ DDJ-SX2",
    "Pioneer DJ DDJ-WeGO",
    "Pioneer DJ DDJ-WeGO3",
    "Pioneer DJ DJM-850",
    "Pioneer DJ DJM-900NXS",
    "Pioneer DJ DJM-900SRT",
    "Rane FOUR",
    "Rane MP2015",
    "Rane ONE",
    "Rane ONE MKII",
    "Rane PERFORMER",
    "Rane SEVENTY",
    "Rane SEVENTY A-Trak Edition",
    "Rane SEVENTY-TWO",
    "Rane SEVENTY-TWO MKII",
    "Rane SYSTEM ONE",
    "Reloop Beatmix 2",
    "Reloop Beatmix 4",
    "Reloop Elite",
    "Reloop Flux",
    "Reloop Flux GO",
    "Reloop Mixon 4",
    "Reloop Mixon 8",
    "Reloop Ready",
    "Reloop RMX-90 DVS",
    "Reloop Terminal Mix 4",
    "Reloop Terminal Mix 8",
    "Roland DJ-202",
    "Roland DJ-505",
    "Roland DJ-707M",
    "Roland DJ-808",
    "Vestax Typhoon",
    "Vestax VCI-100MKII",
    "Vestax VCI-300",
    "Vestax VCI-380",
    "Vestax VCI-400",
)

_MACOS_27_TESTING = (
    "AlphaTheta DJM-V5",
    "AlphaTheta Euphonia",
    "AlphaTheta OMNIS-DUO",
    "AlphaTheta XDJ-AZ",
    "Pioneer DJ DDJ-1000SRT",
    "Pioneer DJ DDJ-FLX2",
    "Pioneer DJ DDJ-FLX4",
    "Pioneer DJ DDJ-FLX6",
    "Pioneer DJ DDJ-FLX10",
    "Pioneer DJ DDJ-GRV6",
    "Pioneer DJ DDJ-REV1",
    "Pioneer DJ DDJ-REV5",
    "Pioneer DJ DDJ-REV7",
    "Pioneer DJ DDJ-SB3",
    "Pioneer DJ DDJ-SR2",
    "Pioneer DJ DDJ-SX3",
    "Pioneer DJ DDJ-SZ",
    "Pioneer DJ DDJ-SZ2",
    "Pioneer DJ DJM-250MK2",
    "Pioneer DJ DJM-450",
    "Pioneer DJ DJM-750MK2",
    "Pioneer DJ DJM-900NXS2",
    "Pioneer DJ DJM-A9",
    "Pioneer DJ DJM-S3",
    "Pioneer DJ DJM-S5",
    "Pioneer DJ DJM-S7",
    "Pioneer DJ DJM-S9",
    "Pioneer DJ DJM-S11",
    "Pioneer DJ DJM-V10",
    "Pioneer DJ OPUS-QUAD",
    "Pioneer DJ XDJ-RX3",
    "Pioneer DJ XDJ-XZ",
    "Reloop Terminal Mix 2",
)

_MACOS_27_UNSUPPORTED = (
    "Allen & Heath Xone:DB2",
    "Allen & Heath Xone:DB4",
    "Korg KAOSS DJ",
    "Novation Twitch",
    "Numark MixDeck",
    "Numark Mixtrack Edge",
    "Numark NS6",
    "Numark NS7",
    "Numark NS7 II",
    "Numark V7",
    "Rane SIXTY-ONE",
    "Rane SIXTY-TWO",
    "Rane SIXTY-FOUR",
    "Rane SIXTY-EIGHT",
    "Rane SL2",
    "Rane SL3",
    "Rane SL4",
    "Rane TTM 57MKII",
)


@dataclass(frozen=True, slots=True)
class Reason:
    """One sentence the DJ can read, plus a stable code for the page.

    Attributes:
        code: Catalog id. The page translates it.
        summary: English sentence for the CLI.
        params: Placeholder values for the catalog sentence.
    """

    code: str
    summary: str
    params: tuple[tuple[str, str], ...] = ()


@dataclass(frozen=True, slots=True)
class ReleaseFact:
    """One vendor release the freshness window can flag.

    Attributes:
        product: ``serato``, ``macos``, ``windows``, or ``os``.
        version: Version string as published.
        published: The day the vendor published it.
    """

    product: str
    version: str
    published: date


@dataclass(frozen=True, slots=True)
class OsRule:
    """One OS row in the vendor table.

    Attributes:
        os_name: ``macos``, ``windows``, or ``linux``.
        os_major: Major version this row covers. None covers every major.
        min_serato: Minimum Serato version, or None when this row has none.
        hardware: ``(name, status)`` pairs. Status is ``cleared``,
            ``in_testing``, or ``unsupported``.
    """

    os_name: str
    os_major: int | None
    min_serato: str | None
    hardware: tuple[tuple[str, str], ...]


@dataclass(frozen=True, slots=True)
class VendorFacts:
    """The table ``evaluate`` is allowed to trust.

    Attributes:
        rules: OS rows. A combo with no row is unknown.
        releases: Published releases. Only those inside 7 days are flagged.
        sources: Pages the rows were read from. Lexicon is not one of them.
    """

    rules: tuple[OsRule, ...]
    releases: tuple[ReleaseFact, ...]
    sources: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class UpdateSafety:
    """The verdict for one Serato, OS, and hardware combo.

    Attributes:
        verdict: ``yes``, ``not_cleared``, or ``unknown``.
        reasons: Why it is not ``yes``. Empty when the verdict is ``yes``.
        new_release_within_7_days: True when a Serato or OS release in
            ``facts`` was published within the last 7 days.
        releases: Those fresh releases only.
        serato_version: Version that was judged, or empty.
        os_name: Canonical OS name, or empty.
        os_version: Version string that was judged, or empty.
        os_label: Short label such as ``macOS 27.0``.
        hardware: Names that were judged. Empty when none were passed.
        sources: Pages the table cites.
    """

    verdict: str
    reasons: tuple[Reason, ...]
    new_release_within_7_days: bool
    releases: tuple[ReleaseFact, ...]
    serato_version: str
    os_name: str
    os_version: str
    os_label: str
    hardware: tuple[str, ...]
    sources: tuple[str, ...] = ()


def _norm(name: str) -> str:
    """Fold a hardware or OS name for a table lookup.

    Args:
        name: Text the caller passed.

    Returns:
        Stripped, case-folded text with inner whitespace collapsed.
    """
    return _SPACE.sub(" ", (name or "").strip()).casefold()


def _hardware_rows() -> tuple[tuple[str, str], ...]:
    """Build the macOS 27 hardware rows and reject a repeated name.

    Returns:
        Article order: cleared, then in testing, then unsupported.

    Raises:
        ValueError: If two rows normalize to the same name.
    """
    grouped = (
        (CLEARED, _MACOS_27_CLEARED),
        (IN_TESTING, _MACOS_27_TESTING),
        (UNSUPPORTED, _MACOS_27_UNSUPPORTED),
    )
    rows: list[tuple[str, str]] = []
    seen: set[str] = set()
    for status, names in grouped:
        for name in names:
            key = _norm(name)
            if not key or key in seen:
                raise ValueError(f"repeated hardware name: {name}")
            seen.add(key)
            rows.append((name, status))
    return tuple(rows)


def _macos_27_rule() -> OsRule:
    """Return the macOS 27 row from Serato's support article.

    Returns:
        The row tests and the live check share.
    """
    return OsRule("macos", MACOS_27_MAJOR, MIN_SERATO_MACOS_27, _hardware_rows())


DEFAULT_FACTS = VendorFacts(
    rules=(_macos_27_rule(),),
    releases=(ReleaseFact("serato", MIN_SERATO_MACOS_27, SERATO_510_PUBLISHED),),
    sources=(MACOS_27_ARTICLE, SERATO_DOWNLOADS, SERATO_ARCHIVE),
)


def _version_tuple(text: str | None) -> tuple[int, ...] | None:
    """Parse a dotted version, ignoring a build in parentheses.

    Args:
        text: ``5.1.0``, ``5.1.0 (51025)``, blank, or ``unknown``.

    Returns:
        Integer components, or None when there is no dotted version.
    """
    raw = (text or "").strip()
    if not raw or raw.casefold() == "unknown":
        return None
    match = _VERSION.search(raw)
    if match is None:
        return None
    return tuple(int(part) for part in match.group(1).split("."))


def _version_less(left: tuple[int, ...], right: tuple[int, ...]) -> bool:
    """Return whether ``left`` is older than ``right``.

    Missing components count as zero, so ``5.1`` equals ``5.1.0``.

    Args:
        left: Parsed version.
        right: Parsed version.

    Returns:
        True when left is strictly older.
    """
    width = max(len(left), len(right))
    padded_left = left + (0,) * (width - len(left))
    padded_right = right + (0,) * (width - len(right))
    return padded_left < padded_right


def _os_name(name: str | None) -> str:
    """Return the canonical OS name, or empty when it is unknown.

    Args:
        name: ``macOS``, ``Darwin``, ``Windows``, ``Linux``, or blank.

    Returns:
        ``macos``, ``windows``, ``linux``, or empty.
    """
    key = _norm(name or "")
    if key in {"macos", "mac", "darwin", "osx", "mac os", "mac os x"}:
        return "macos"
    if key in {"windows", "win32", "win"}:
        return "windows"
    if key == "linux":
        return "linux"
    return ""


def _os_major(version: str | None) -> int | None:
    """Return the first number in an OS version.

    Args:
        version: ``27.0``, ``11``, or blank.

    Returns:
        The major, or None when the text has no number.
    """
    match = re.search(r"(\d+)", version or "")
    if match is None:
        return None
    return int(match.group(1))


def _os_label(name: str, version: str) -> str:
    """Return a short OS label for the page.

    Args:
        name: Canonical name.
        version: Version text.

    Returns:
        ``macOS 27.0`` or empty when the name is unknown.
    """
    pretty = {"macos": "macOS", "windows": "Windows", "linux": "Linux"}.get(name, "")
    if not pretty:
        return ""
    text = version.strip()
    return f"{pretty} {text}".strip() if text else pretty


def _product_label(product: str) -> str:
    """Return the DJ-facing name of a release product.

    Args:
        product: ``serato``, ``macos``, ``windows``, or another token.

    Returns:
        A short label. An unknown token is returned as passed.
    """
    return _LABELS.get(product, product)


def _match_rule(facts: VendorFacts, name: str, major: int | None) -> OsRule | None:
    """Return the first OS row that covers this system.

    Args:
        facts: Vendor table.
        name: Canonical OS name.
        major: Parsed major, or None.

    Returns:
        The row, or None when this OS is not in the table.
    """
    for rule in facts.rules:
        if rule.os_name != name:
            continue
        if rule.os_major is None or rule.os_major == major:
            return rule
    return None


def _hardware_status(rule: OsRule, name: str) -> str | None:
    """Return the vendor status for one hardware name.

    Args:
        rule: OS row whose hardware list applies.
        name: Name the caller passed.

    Returns:
        ``cleared``, ``in_testing``, ``unsupported``, or None.
    """
    key = _norm(name)
    for listed, status in rule.hardware:
        if _norm(listed) == key:
            return status
    return None


def _fresh(facts: VendorFacts, today: date) -> tuple[ReleaseFact, ...]:
    """Return releases published within the last 7 days, including today.

    A future date is not flagged. A date exactly 7 days ago is flagged.

    Args:
        facts: Vendor table.
        today: The day the check uses.

    Returns:
        Fresh releases in table order.
    """
    found: list[ReleaseFact] = []
    for release in facts.releases:
        age = (today - release.published).days
        if 0 <= age <= FRESH_DAYS:
            found.append(release)
    return tuple(found)


def _reason(code: str, summary: str, params: dict[str, str] | None = None) -> Reason:
    """Build one reason with stable placeholder order.

    Args:
        code: Catalog id.
        summary: English sentence.
        params: Placeholder values.

    Returns:
        A frozen reason.
    """
    pairs = tuple(sorted((params or {}).items()))
    return Reason(code, summary, pairs)


def _failed(serato: str, os_name: str, os_version: str, hardware: tuple[str, ...]) -> UpdateSafety:
    """Return the fail-closed result for a fetch that did not load.

    Args:
        serato: Version text, possibly empty.
        os_name: Canonical OS name, possibly empty.
        os_version: OS version text.
        hardware: Names that were passed.

    Returns:
        ``unknown`` with ``fetch_failed`` and no fresh-release flag.
    """
    return UpdateSafety(
        VERDICT_UNKNOWN,
        (
            _reason(
                "fetch_failed",
                "The version list could not be read. Nothing was updated.",
            ),
        ),
        False,
        (),
        serato,
        os_name,
        os_version,
        _os_label(os_name, os_version),
        hardware,
        (),
    )


def evaluate(
    *,
    serato_version: str | None,
    os_name: str | None,
    os_version: str | None,
    hardware: Sequence[str] | None,
    facts: VendorFacts | None = None,
    fetch: Callable[[], VendorFacts] | None = None,
    today: date | None = None,
) -> UpdateSafety:
    """Judge one combo. Never ``yes`` when a fact is missing.

    ``not_cleared`` wins over ``unknown``. A release inside 7 days is
    flagged on every verdict except a failed fetch, which has no table.

    Args:
        serato_version: Installed Serato version. Blank or ``unknown``
            is not a version.
        os_name: OS name. ``Darwin`` is macOS.
        os_version: OS version, such as ``27.0`` or ``11``.
        hardware: Connected hardware names. None and an empty list are
            unknown, never yes.
        facts: Vendor table. None uses :data:`DEFAULT_FACTS`. Ignored
            when ``fetch`` is passed.
        fetch: Optional loader. A raise, or a value that is not
            ``VendorFacts``, is ``unknown``. Tests leave this None.
        today: The day the 7-day window uses. None uses the local date.

    Returns:
        A frozen verdict. It does not change a gig-check ready score.
    """
    day = date.today() if today is None else today
    names = tuple(str(item) for item in hardware) if hardware else ()
    version_text = (serato_version or "").strip()
    canonical = _os_name(os_name)
    version_os = (os_version or "").strip()
    if fetch is not None:
        try:
            loaded = fetch()
        except Exception:
            return _failed(version_text, canonical, version_os, names)
        if not isinstance(loaded, VendorFacts):
            return _failed(version_text, canonical, version_os, names)
        table = loaded
    else:
        table = DEFAULT_FACTS if facts is None else facts
    reasons: list[Reason] = []
    parsed = _version_tuple(version_text)
    major = _os_major(version_os)
    rule = _match_rule(table, canonical, major) if canonical and major is not None else None
    if parsed is None:
        reasons.append(_reason("serato_unknown", "The Serato version could not be read."))
    if not canonical or major is None:
        reasons.append(_reason("os_unknown", "The system version could not be read."))
    elif rule is None:
        label = _os_label(canonical, version_os)
        reasons.append(
            _reason(
                "no_os_rule",
                f"This check has no cleared list for {label}.",
                {"os": label},
            )
        )
    else:
        minimum = _version_tuple(rule.min_serato) if rule.min_serato else None
        if parsed is not None and minimum is not None and _version_less(parsed, minimum):
            reasons.append(
                _reason(
                    "serato_below_os",
                    (
                        f"macOS {rule.os_major} needs Serato DJ Pro or Lite {rule.min_serato} "
                        f"or newer. This install is {version_text}."
                    ),
                    {"os": str(rule.os_major), "need": rule.min_serato or "", "installed": version_text},
                )
            )
        if not names:
            reasons.append(
                _reason(
                    "hardware_missing",
                    "No connected hardware was listed, so this check cannot say the combo is safe.",
                )
            )
        for name in names:
            status = _hardware_status(rule, name)
            if status == IN_TESTING:
                reasons.append(
                    _reason(
                        "hardware_in_testing",
                        f"{name} is still in testing. It is not cleared.",
                        {"name": name},
                    )
                )
            elif status == UNSUPPORTED:
                reasons.append(
                    _reason(
                        "hardware_unsupported",
                        f"{name} is not supported on this system. It is not cleared.",
                        {"name": name},
                    )
                )
            elif status != CLEARED:
                reasons.append(
                    _reason(
                        "hardware_unknown",
                        f"{name} is not on the cleared list.",
                        {"name": name},
                    )
                )
    blocking = [item for item in reasons if item.code in _NOT_CLEARED]
    if blocking:
        verdict = VERDICT_NOT
        kept = tuple(reasons)
    elif reasons:
        verdict = VERDICT_UNKNOWN
        kept = tuple(reasons)
    else:
        verdict = VERDICT_YES
        kept = ()
    fresh = _fresh(table, day)
    return UpdateSafety(
        verdict,
        kept,
        bool(fresh),
        fresh,
        version_text,
        canonical,
        version_os,
        _os_label(canonical, version_os),
        names,
        table.sources,
    )


def installed_serato_version() -> str:
    """Return the installed Serato version, or ``unknown``.

    The installed app comes from ``snapshots.read_install``. When that
    is not a dotted version, a parsed ``serato_logs.read_session_log``
    is used. This function does not parse log text itself.

    Returns:
        A dotted version, or ``unknown``.
    """
    import serato_logs
    import snapshots

    install_version = (snapshots.read_install().version or "").strip()
    if _version_tuple(install_version) is not None:
        return install_version
    read = serato_logs.read_session_log()
    if read.state == "parsed" and _version_tuple(read.version) is not None:
        return read.version.strip()
    return "unknown"


def current_os() -> tuple[str, str]:
    """Return the OS name and version from ``platform``.

    Returns:
        ``macos`` and ``platform.mac_ver`` on Darwin, ``windows`` and
        ``platform.release`` on Windows, otherwise the system name and
        release. A missing system is ``unknown`` and an empty version.
    """
    system = platform.system()
    if system == "Darwin":
        return "macos", platform.mac_ver()[0].strip()
    if system == "Windows":
        return "windows", platform.release().strip()
    if not system:
        return "unknown", ""
    return system.casefold(), platform.release().strip()


def for_this_machine(
    *,
    today: date,
    serato_version: str | None = None,
    os_name: str | None = None,
    os_version: str | None = None,
    hardware: Sequence[str] | None = None,
    facts: VendorFacts | None = None,
    fetch: Callable[[], VendorFacts] | None = None,
) -> UpdateSafety:
    """Judge this computer, filling only the fields the caller left out.

    A missing hardware list stays missing. It is not replaced with a guess.
    There is no connected-hardware reader in this app.

    Args:
        today: The day the 7-day window uses.
        serato_version: Installed version. None reads the install and logs.
        os_name: OS name. None uses :func:`current_os`.
        os_version: OS version. None uses :func:`current_os`.
        hardware: Names, or None when nothing was listed.
        facts: Vendor table. None uses the baked table when ``fetch`` is absent.
        fetch: Optional loader. A failure is ``unknown``.

    Returns:
        The verdict for this machine.
    """
    version = installed_serato_version() if serato_version is None else serato_version
    detected_name, detected_version = current_os()
    name = detected_name if os_name is None else os_name
    number = detected_version if os_version is None else os_version
    return evaluate(
        serato_version=version,
        os_name=name,
        os_version=number,
        hardware=hardware,
        facts=facts,
        fetch=fetch,
        today=today,
    )


def to_dict(result: UpdateSafety) -> dict[str, object]:
    """Serialize a verdict for ``GET /api/gig-check``.

    Args:
        result: Check result.

    Returns:
        JSON-ready fields. ``releases`` lists only the fresh ones.
    """
    return {
        "verdict": result.verdict,
        "reasons": [
            {"code": item.code, "summary": item.summary, "params": dict(item.params)}
            for item in result.reasons
        ],
        "new_release_within_7_days": result.new_release_within_7_days,
        "releases": [
            {
                "product": item.product,
                "label": _product_label(item.product),
                "version": item.version,
                "published": item.published.isoformat(),
            }
            for item in result.releases
        ],
        "serato_version": result.serato_version,
        "os_name": result.os_name,
        "os_version": result.os_version,
        "os_label": result.os_label,
        "hardware": list(result.hardware),
        "sources": list(result.sources),
    }


def format_lines(result: UpdateSafety | None) -> list[str]:
    """Return the plain-text lines for the gig-check printout.

    Args:
        result: Verdict, or None when the report has none.

    Returns:
        A heading, the verdict word, each reason, and any fresh release.
    """
    if result is None:
        return ["Safe to update?", "Unknown"]
    word = {VERDICT_YES: "Yes", VERDICT_NOT: "Not cleared", VERDICT_UNKNOWN: "Unknown"}.get(
        result.verdict,
        "Unknown",
    )
    lines = ["Safe to update?", word]
    lines.extend(f"- {item.summary}" for item in result.reasons)
    if result.new_release_within_7_days:
        if result.releases:
            for release in result.releases:
                lines.append(
                    f"{_product_label(release.product)} {release.version} came out in the last 7 days."
                )
        else:
            lines.append("A Serato or system update came out in the last 7 days.")
    return lines
