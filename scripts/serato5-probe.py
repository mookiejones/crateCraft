#!/usr/bin/env python3
"""Print the schema of a Serato master.sqlite without opening that file.

The command copies the database into a temporary directory, then prints
``user_version``, ``schema_version``, and the ``CREATE`` text from the copy.
The original file is only read as bytes. A symlink is refused. Nothing is
written beside the database, and the Serato library is not modified.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import serato_schema


def main(argv: list[str] | None = None) -> int:
    """Print one probe record as JSON.

    Args:
        argv: Arguments after the program name, or None for ``sys.argv``.

    Returns:
        0 when the copy was read and the original was unchanged. 2 when the
        path is refused or the copy cannot be read.
    """
    args = list(sys.argv[1:] if argv is None else argv)
    if len(args) != 1 or args[0] in {"-h", "--help"}:
        sys.stderr.write("usage: python3 scripts/serato5-probe.py MASTER.sqlite\n")
        return 2 if args and args[0] not in {"-h", "--help"} else 0
    try:
        report = serato_schema.probe_database(Path(args[0]))
    except serato_schema.ProbeError as exc:
        sys.stderr.write(f"{exc}\n")
        return 2
    json.dump(report, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
