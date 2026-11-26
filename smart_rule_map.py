"""Classify Serato smart-crate rules for a Rekordbox export.

The stored object is the one ``library._rules_blob`` writes: a dict with a
``rules`` list. A leaf uses the keys this repo already stores: ``type``,
``attribute``, ``operation``, ``version``, and ``value`` or
``partial_date``. A nested group uses ``conjunction`` and ``rules``.
``spaces`` and ``live_updates`` are ignored. This module does not open the
library, does not write XML, and does not invent a second rule format.

Rekordbox XML has no smart-list element. A class says whether a Rekordbox
smart list could mean the same test on a field this export already writes.
The export still writes a static playlist. It never rewrites one field into
another, and it never calls an approximate or impossible rule compatible.

Exact
    The leaf names a column the XML writes unchanged, and the operation is
    equality or a numeric bound:

    - ``genre``, ``artist``, ``album``, ``name`` (title), and ``comments``
      with ``IS``. Those columns are written as Genre, Artist, Album, Name,
      and Comments. The export does not translate them.
    - ``bpm`` with ``GREATER_THAN_OR_EQUAL_TO`` or ``LESS_THAN_OR_EQUAL_TO``.
      ``AverageBpm`` is the library BPM when that column is set.

Approximate
    The field exists, but Rekordbox would not apply the same test:

    - ``CONTAINS``, ``DOES_NOT_CONTAIN``, and ``IS_NOT`` on the string
      fields above. Serato folds case and spacing. Rekordbox does not.
    - ``key`` with any known string operation. The export can rewrite
      Tonality to Camelot or classical, so the stored spelling may not be
      the spelling Rekordbox keeps.
    - ``time_added`` with ``AFTER`` or ``BEFORE``. Rekordbox date added is
      when the track entered Rekordbox, not when Serato added it.
    - ``type`` with a known string operation. ``Kind`` in the file is the
      extension label, not Serato's type column.

Impossible
    There is no Rekordbox equivalent, so the rule is not mapped onto a
    different field:

    - ``location``, including ``location contains``. Rekordbox has no
      location-contains smart-list field. Lexicon marked that rule
      compatible and rewrote it as filename contains, which often matched
      nothing. This map does not do that.
    - ``filename``, ``file_name``, ``filepath``, and ``file_path``. They are
      not a stand-in for location. An unknown field is impossible, not exact.
    - ``stems_analyze_state``. Rekordbox has no stems-analyze field.
    - Any other attribute or operation, and a leaf that is not a rule object.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Literal

Classification = Literal["exact", "approximate", "impossible"]
RuleStatus = Literal["rules", "empty", "unreadable"]

_EXACT = frozenset(
    {
        ("genre", "IS"),
        ("artist", "IS"),
        ("album", "IS"),
        ("name", "IS"),
        ("comments", "IS"),
        ("bpm", "GREATER_THAN_OR_EQUAL_TO"),
        ("bpm", "LESS_THAN_OR_EQUAL_TO"),
    }
)
_APPROX_STRING = frozenset({"genre", "artist", "album", "name", "comments"})
_APPROX_STRING_OPS = frozenset({"CONTAINS", "DOES_NOT_CONTAIN", "IS_NOT"})
_KEY_OPS = frozenset({"IS", "IS_NOT", "CONTAINS", "DOES_NOT_CONTAIN"})
_PATH_FIELDS = frozenset({"location", "filename", "file_name", "filepath", "file_path", "path"})
_ATTR_LABEL = {
    "name": "title",
    "time_added": "date added",
    "stems_analyze_state": "stems",
    "file_name": "filename",
    "file_path": "file path",
    "filepath": "file path",
}
_OP_LABEL = {
    "IS": "is",
    "IS_NOT": "is not",
    "CONTAINS": "contains",
    "DOES_NOT_CONTAIN": "does not contain",
    "GREATER_THAN_OR_EQUAL_TO": "is at least",
    "LESS_THAN_OR_EQUAL_TO": "is at most",
    "AFTER": "is after",
    "BEFORE": "is before",
}
_APPROX_REASON = {
    "key": "The key text in this file can be rewritten to another notation.",
    "time_added": "Rekordbox date added is when the track entered Rekordbox, not when Serato added it.",
    "type": "Kind in this file is the extension label, not Serato's type field.",
}
_STRING_FOLD = "Serato folds case and spacing. Rekordbox does not use that fold."


@dataclass(frozen=True)
class ClassifiedRule:
    """One leaf after classification.

    Attributes:
        label: Field and operation in words, such as ``location contains``.
        classification: ``exact``, ``approximate``, or ``impossible``.
    """

    label: str
    classification: Classification


def quote_name(name: str) -> str:
    """Wrap a crate name in single quotes for a loss-report line.

    Args:
        name: Visible crate name. Extra whitespace is collapsed.

    Returns:
        The name in single quotes. An empty name becomes ``'Crate'``.
    """
    cleaned = " ".join(str(name).split()) or "Crate"
    return f"'{cleaned}'"


def classify_rule(rule: object) -> ClassifiedRule:
    """Classify one leaf.

    Args:
        rule: A dict with ``attribute`` and ``operation``. ``title`` is the
            same field as ``name``. Any other shape is impossible.

    Returns:
        The label and the class. Unknown fields are impossible.
    """
    if not isinstance(rule, Mapping):
        return ClassifiedRule("unreadable rule", "impossible")
    attribute = rule.get("attribute")
    operation = rule.get("operation")
    if not isinstance(attribute, str) or not attribute.strip():
        return ClassifiedRule("unreadable rule", "impossible")
    if not isinstance(operation, str) or not operation.strip():
        return ClassifiedRule("unreadable rule", "impossible")
    canonical = "name" if attribute.strip() == "title" else attribute.strip()
    label = _label(canonical, operation.strip())
    return ClassifiedRule(label, _class(canonical, operation.strip()))


def classify_blob(blob: object) -> tuple[RuleStatus, list[ClassifiedRule]]:
    """Classify every leaf in a rules object.

    Args:
        blob: The object ``library._rules_blob`` stores, or a dict that
            already has a ``rules`` list. Nested groups are walked. A group
            is not itself a rule.

    Returns:
        ``unreadable`` when the value has no rules list, ``empty`` when
        that list has no leaves, otherwise ``rules`` and the leaves in
        stored order.
    """
    if not isinstance(blob, Mapping):
        return "unreadable", []
    raw = blob.get("rules")
    if not isinstance(raw, list):
        return "unreadable", []
    if not raw:
        return "empty", []
    leaves = _walk(raw)
    if not leaves:
        return "empty", []
    return "rules", leaves


def visible_rules(status: str, rules: Sequence[ClassifiedRule]) -> list[ClassifiedRule]:
    """Return the leaves the dialog should show.

    Args:
        status: ``rules``, ``empty``, or ``unreadable``.
        rules: Leaves from :func:`classify_blob`.

    Returns:
        One impossible ``unreadable rule`` when the blob could not be read.
        Otherwise the leaves, which is empty when no rules are stored.
    """
    if status == "unreadable":
        return [ClassifiedRule("unreadable rule", "impossible")]
    return list(rules)


def report_lines(
    name: str,
    status: str,
    rules: Sequence[ClassifiedRule],
    *,
    frozen: bool,
    stored: int,
    written: int,
) -> list[str]:
    """Build the loss-report lines for one smart crate.

    Args:
        name: Visible crate name.
        status: ``rules``, ``empty``, or ``unreadable``.
        rules: Leaves from :func:`classify_blob`.
        frozen: True when the playlist is today's stored tracks.
        stored: Distinct tracks Serato had stored for the crate.
        written: How many of those tracks are in the playlist.

    Returns:
        One line per rule, then the frozen or not-frozen line. A count
        line is added only when ``stored`` and ``written`` differ. That
        line says the comparison did not run Rekordbox.
    """
    quoted = quote_name(name)
    lines: list[str] = []
    if status == "unreadable":
        lines.append(f"Smart crate {quoted}: rule 'unreadable rule' has no rekordbox equivalent.")
    elif status == "empty":
        lines.append(f"Smart crate {quoted}: no rules are stored.")
    else:
        for rule in rules:
            lines.append(_rule_line(quoted, rule))
    if frozen:
        lines.append(
            f"Smart crate {quoted} was exported as a frozen playlist of the tracks Serato had stored. "
            "This is not a rekordbox smart list."
        )
    else:
        lines.append(
            f"Smart crate {quoted} was not frozen. No rekordbox smart-list rule was written, "
            "and the rule was not rewritten as a different field."
        )
    if stored != written:
        lines.append(
            f"Smart crate {quoted}: Serato had stored {stored} tracks. This playlist lists {written}. "
            "This comparison did not run Rekordbox."
        )
    return lines


def _walk(items: Sequence[object]) -> list[ClassifiedRule]:
    """Classify a rules list, including one nested group level or more.

    Args:
        items: Leaves and groups from a ``rules`` list.

    Returns:
        Leaves in stored order. A value that is not a rule object is one
        impossible unreadable rule.
    """
    found: list[ClassifiedRule] = []
    for item in items:
        if not isinstance(item, Mapping):
            found.append(ClassifiedRule("unreadable rule", "impossible"))
            continue
        if "attribute" not in item and "conjunction" in item:
            child = item.get("rules")
            if not isinstance(child, list):
                found.append(ClassifiedRule("unreadable rule", "impossible"))
            else:
                found.extend(_walk(child))
            continue
        found.append(classify_rule(item))
    return found


def _class(attribute: str, operation: str) -> Classification:
    """Return the class for one canonical attribute and operation.

    Args:
        attribute: Field name after the title alias.
        operation: Serato operation text.

    Returns:
        ``exact``, ``approximate``, or ``impossible``. A path field is
        impossible even when the operation is one Rekordbox uses on a
        different field.
    """
    if attribute in _PATH_FIELDS or attribute == "stems_analyze_state":
        return "impossible"
    if (attribute, operation) in _EXACT:
        return "exact"
    if attribute in _APPROX_STRING and operation in _APPROX_STRING_OPS:
        return "approximate"
    if attribute == "key" and operation in _KEY_OPS:
        return "approximate"
    if attribute == "time_added" and operation in {"AFTER", "BEFORE"}:
        return "approximate"
    if attribute == "type" and operation in _KEY_OPS:
        return "approximate"
    return "impossible"


def _label(attribute: str, operation: str) -> str:
    """Return the words used in the loss report for one leaf.

    Args:
        attribute: Canonical field name.
        operation: Serato operation text.

    Returns:
        Lowercase field and operation, such as ``location contains``.
    """
    field = _ATTR_LABEL.get(attribute, attribute.replace("_", " "))
    word = _OP_LABEL.get(operation, operation.lower().replace("_", " "))
    return f"{field} {word}"


def _rule_line(quoted: str, rule: ClassifiedRule) -> str:
    """Return one rule sentence.

    Args:
        quoted: Crate name already wrapped by :func:`quote_name`.
        rule: Classified leaf.

    Returns:
        An exact, approximate, or impossible sentence. Approximate and
        impossible sentences do not call the rule fully compatible.
        Exact sentences say the rule is not a rekordbox smart-list rule.
    """
    if rule.classification == "impossible":
        return f"Smart crate {quoted}: rule '{rule.label}' has no rekordbox equivalent."
    if rule.classification == "approximate":
        reason = _APPROX_REASON.get(_reason_key(rule.label), _STRING_FOLD)
        return (
            f"Smart crate {quoted}: rule '{rule.label}' is approximate, not fully compatible. "
            f"{reason} It is not a rekordbox smart-list rule."
        )
    return (
        f"Smart crate {quoted}: rule '{rule.label}' is exact. "
        "The same field is already written on each track. It is not a rekordbox smart-list rule."
    )


def _reason_key(label: str) -> str:
    """Return the attribute key used to pick an approximate reason.

    Args:
        label: Field and operation in words.

    Returns:
        ``key``, ``time_added``, ``type``, or an empty string.
    """
    if label.startswith("key "):
        return "key"
    if label.startswith("date added "):
        return "time_added"
    if label.startswith("type "):
        return "type"
    return ""
