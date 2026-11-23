"""Compare the 5.1.0 schema dump with the columns crateCraft touches.

The dump is ``CREATE`` text from a copied master.sqlite. It has no rows.
The test does not open it as a database and does not open a live library.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

import serato_schema

SCHEMA = Path(__file__).resolve().parents[1] / "tests" / "data" / "serato510" / "master.schema.sql"


def _columns(sql: str) -> dict[str, dict[str, str]]:
    """Parse ``CREATE TABLE`` column types from a schema dump.

    Args:
        sql: ``.schema`` text. Comments are removed first.

    Returns:
        Table name to column name to the declared type word.
    """
    text = re.sub(r"/\*.*?\*/", "", sql, flags=re.S)
    text = re.sub(r"--.*?$", "", text, flags=re.M)
    tables: dict[str, dict[str, str]] = {}
    for match in re.finditer(
        r'CREATE TABLE\s+"?(\w+)"?\s*\((.*?)\)\s*;',
        text,
        flags=re.S | re.I,
    ):
        name, body = match.group(1), match.group(2)
        columns: dict[str, str] = {}
        depth = 0
        buf: list[str] = []
        parts: list[str] = []
        for char in body:
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
            if char == "," and depth == 0:
                parts.append("".join(buf))
                buf = []
            else:
                buf.append(char)
        parts.append("".join(buf))
        for part in parts:
            line = " ".join(part.split())
            if not line:
                continue
            token = line.split()[0].strip('"')
            if token.upper() in {"PRIMARY", "UNIQUE", "FOREIGN", "CONSTRAINT", "CHECK"}:
                continue
            pieces = line.split(None, 2)
            kind = pieces[1].strip(",").upper() if len(pieces) > 1 else ""
            if kind.startswith("("):
                kind = ""
            columns[token] = kind
        tables[name] = columns
    return tables


class Serato510SchemaTests(unittest.TestCase):
    def test_touched_columns_match_the_510_dump(self) -> None:
        """Every column crateCraft reads or writes is in the 5.1.0 dump.

        Optional ``revision`` columns the test fixture adds are absent, so
        the master writers take the branch that does not name them.
        ``file_bit_rate`` and ``file_sample_rate`` are REAL. They are read
        and are not written.

        Returns:
            None. The test fails if a touched column is missing or has a
            different declared type, or if a skipped column is present.
        """
        tables = _columns(SCHEMA.read_text(encoding="utf-8"))
        for table, columns in serato_schema.TOUCHED_COLUMNS.items():
            self.assertIn(table, tables)
            for column, kind in columns.items():
                with self.subTest(table=table, column=column):
                    self.assertEqual(tables[table].get(column), kind)
        for table, columns in serato_schema.ABSENT_ON_510.items():
            for column in columns:
                with self.subTest(table=table, column=column, absent=True):
                    self.assertNotIn(column, tables[table])
        self.assertEqual(serato_schema.PROBED_USER_VERSIONS["5.1.0"], 203)
        self.assertNotIn("5.0.0", serato_schema.PROBED_USER_VERSIONS)
