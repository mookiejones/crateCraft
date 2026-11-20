"""Read one synthetic rekordbox ``export.pdb`` page and repair a device row.

This is not a USB writer. It does not open a drive, ``export.pdb`` on a
stick, or the Serato library. Tests build the page in memory. The layout
matches the public DeviceSQL page header far enough to catch two silent
losses: a row count stored in one byte, and a device-name row that is
copied forward after it has been cut off.

The three bytes at offset ``0x18`` pack two counts. The low 13 bits are
the number of row slots. The next 11 bits are how many of those rows are
still present. Byte ``0x18`` alone is only the low 8 bits of the slot
count. A page with 256 slots stores ``0`` there. A reader that uses that
byte as the count hides every row.
"""

from __future__ import annotations

import struct
from dataclasses import dataclass

PAGE_SIZE = 4096
HEADER_SIZE = 0x28
# Low 13 bits of the packed count at byte 0x18.
_SLOT_MASK = 0x1FFF
_PRESENT_SHIFT = 13
TABLE_DEVICE = 19
DEVICE_MAGIC = 0x0280
DEVICE_ROW_LENGTH = 68
_DATE_OFFSET = 8
_DATE_LENGTH = 16
_VERSION_OFFSET = 24
_VERSION = b"1000"
_NAME_OFFSET = 28
_NAME_LENGTH = 40
DEFAULT_DEVICE_NAME = "USB"
_DEFAULT_DATE = b"1970-01-01"


@dataclass(frozen=True)
class PdbPage:
    """Rows from one synthetic page.

    Attributes:
        page_index: Page number stored in the header.
        table_type: DeviceSQL table type. 19 is the device-name table.
        slot_count: Row slots from the 13-bit field, not from byte 0x18.
        present_count: Present rows from the following 11-bit field.
        rows: Present row bodies, in offset order.
    """

    page_index: int
    table_type: int
    slot_count: int
    present_count: int
    rows: tuple[bytes, ...]


def default_device_row(song_count: int = 0, name: str = DEFAULT_DEVICE_NAME) -> bytes:
    """Build a padded device-name row a player can read.

    The version is the four ASCII bytes ``1000``. The name is ASCII,
    cut at 40 bytes, and the rest of that field is NUL. The date is the
    fixed synthetic day ``1970-01-01``, space-padded to 16 bytes. Nothing
    here is read from a stick.

    Args:
        song_count: Track count stored at byte 4. A negative count is stored as 0.
        name: Device name. Non-ASCII bytes are dropped. Empty becomes ``USB``.

    Returns:
        A 68-byte row. The name field is 40 bytes.
    """
    count = song_count if isinstance(song_count, int) and not isinstance(song_count, bool) and song_count > 0 else 0
    raw_name = name.encode("ascii", "ignore") or DEFAULT_DEVICE_NAME.encode("ascii")
    name_field = raw_name[:_NAME_LENGTH].ljust(_NAME_LENGTH, b"\x00")
    date = _DEFAULT_DATE.ljust(_DATE_LENGTH, b" ")[:_DATE_LENGTH]
    return struct.pack("<HHI", DEVICE_MAGIC, 0x0003, count) + date + _VERSION + name_field


def device_row_complete(row: bytes) -> bool:
    """Return whether a device-name row has the fields a player reads.

    Args:
        row: One row body. A short row is incomplete.

    Returns:
        True when the row is long enough, starts with the device magic,
        and carries the ``1000`` version at the expected offset. A truncated
        date, a missing version, or a short name field is False.
    """
    if len(row) < DEVICE_ROW_LENGTH:
        return False
    magic = struct.unpack_from("<H", row, 0)[0]
    if magic != DEVICE_MAGIC:
        return False
    return row[_VERSION_OFFSET:_VERSION_OFFSET + 4] == _VERSION


def repair_device_row(row: bytes) -> tuple[bytes, str | None]:
    """Return the device-name row to write, and a report line when it was rebuilt.

    A complete row is returned unchanged. A row that is truncated or has
    no ``1000`` version is replaced by ``default_device_row``. The damaged
    bytes are not a prefix of the result and are not copied forward. A
    readable song count on a row that still starts with the device magic
    is kept. The date, version, and name come from the default.

    Args:
        row: Row body from ``parse_page``. It may be shorter than 68 bytes.

    Returns:
        The row to write, and None when the input was already complete.
        Otherwise a sentence that names the regeneration.
    """
    if device_row_complete(row):
        return row[:DEVICE_ROW_LENGTH], None
    song_count = 0
    if len(row) >= 8 and struct.unpack_from("<H", row, 0)[0] == DEVICE_MAGIC:
        song_count = struct.unpack_from("<I", row, 4)[0]
    fresh = default_device_row(song_count)
    line = (
        "Device-name row was truncated or could not be read. "
        f"It was regenerated as {DEFAULT_DEVICE_NAME}, zero-padded to {_NAME_LENGTH} bytes. "
        "The damaged row was not copied."
    )
    return fresh, line


def build_page(table_type: int, rows: list[bytes], *, page_index: int = 1) -> bytes:
    """Build one synthetic 4096-byte page that holds these rows.

    Every row is present. Offsets are relative to the end of the 40-byte
    header. The slot count is the 13-bit field, so more than 255 rows do
    not wrap. This function does not write a file.

    Args:
        table_type: DeviceSQL table type stored in the header.
        rows: Row bodies, in order. Each body must fit in the page.
        page_index: Page number. Defaults to 1.

    Returns:
        One page of ``PAGE_SIZE`` bytes.

    Raises:
        ValueError: If the rows do not fit, or a row offset does not fit in 16 bits.
    """
    spans = _index_spans(len(rows), PAGE_SIZE)
    index_size = sum(2 * count + 4 for _slot, count, _at in spans)
    used = sum(len(row) for row in rows)
    free = PAGE_SIZE - HEADER_SIZE - used - index_size
    if free < 0:
        raise ValueError("Those rows do not fit in one page.")
    page = bytearray(PAGE_SIZE)
    struct.pack_into("<IIIIII", page, 0, 0, page_index, table_type, 0, 1, 0)
    packed = (len(rows) << _PRESENT_SHIFT) | len(rows)
    page[0x18:0x1B] = packed.to_bytes(3, "little")
    page[0x1B] = 0x24
    struct.pack_into("<HH", page, 0x1C, free, used)
    cursor = HEADER_SIZE
    offsets: list[int] = []
    for row in rows:
        offset = cursor - HEADER_SIZE
        if offset > 0xFFFF:
            raise ValueError("A row offset does not fit in 16 bits.")
        page[cursor:cursor + len(row)] = row
        offsets.append(offset)
        cursor += len(row)
    for slot, count, at in spans:
        size = 2 * count + 4
        present = (1 << count) - 1
        page[at + size - 4:at + size - 2] = present.to_bytes(2, "little")
        page[at + size - 2:at + size] = present.to_bytes(2, "little")
        for local in range(count):
            target = at + size - 6 - 2 * local
            page[target:target + 2] = offsets[slot + local].to_bytes(2, "little")
    return bytes(page)


def parse_page(page: bytes) -> PdbPage:
    """Read the present rows of one synthetic page.

    The slot count is the low 13 bits at offset ``0x18``. It is not byte
    ``0x18`` alone. A uint8 read of that byte wraps at 256 and would
    return no rows for a full page of playlist entries.

    Args:
        page: One page. It must be ``PAGE_SIZE`` bytes.

    Returns:
        The header counts and each present row body. Rows are in offset order.

    Raises:
        ValueError: If the page is the wrong size or the header counts are inconsistent.
    """
    if len(page) != PAGE_SIZE:
        raise ValueError("That page is not a 4096-byte export.pdb page.")
    page_index, table_type = struct.unpack_from("<II", page, 4)
    packed = int.from_bytes(page[0x18:0x1B], "little")
    slot_count = packed & _SLOT_MASK
    present_count = (packed >> _PRESENT_SHIFT) & 0x7FF
    used = struct.unpack_from("<H", page, 0x1E)[0]
    if used > PAGE_SIZE - HEADER_SIZE:
        raise ValueError("That page's row area does not fit.")
    found: list[tuple[int, bytes]] = []
    for slot, count, at in _index_spans(slot_count, PAGE_SIZE):
        size = 2 * count + 4
        if at < HEADER_SIZE:
            raise ValueError("That page's row index overlaps the header.")
        present = int.from_bytes(page[at + size - 4:at + size - 2], "little")
        for local in range(count):
            if (present >> local) & 1 == 0:
                continue
            target = at + size - 6 - 2 * local
            offset = int.from_bytes(page[target:target + 2], "little")
            found.append((offset, b""))
    found.sort(key=lambda item: item[0])
    rows: list[bytes] = []
    for index, (offset, _empty) in enumerate(found):
        if offset > used:
            raise ValueError("A row offset points past the row area.")
        end = found[index + 1][0] if index + 1 < len(found) else used
        if end < offset or HEADER_SIZE + end > PAGE_SIZE:
            raise ValueError("A row extends outside the page.")
        rows.append(page[HEADER_SIZE + offset:HEADER_SIZE + end])
    if present_count != len(rows):
        raise ValueError("The page's present count does not match its row index.")
    return PdbPage(page_index, table_type, slot_count, present_count, tuple(rows))


def repair_device_page(page: bytes) -> tuple[bytes, list[str]]:
    """Rebuild a device-name page without copying a damaged row.

    Args:
        page: One page from ``build_page`` or the same layout. Table type
            must be ``TABLE_DEVICE``.

    Returns:
        The rebuilt page and one report line for each row that was regenerated.
        A complete row is written back unchanged. A damaged row is the
        padded default, so the old bytes are absent from the result.

    Raises:
        ValueError: If the page is not a device-name page or cannot be parsed.
    """
    parsed = parse_page(page)
    if parsed.table_type != TABLE_DEVICE:
        raise ValueError("That page is not a device-name page.")
    rows: list[bytes] = []
    report: list[str] = []
    for row in parsed.rows:
        fresh, line = repair_device_row(row)
        rows.append(fresh)
        if line:
            report.append(line)
    rebuilt = build_page(parsed.table_type, rows, page_index=parsed.page_index)
    return rebuilt, report


def _index_spans(slot_count: int, page_size: int) -> list[tuple[int, int, int]]:
    """Locate each row-index group.

    Groups hold 16 rows, except the last group, which holds the remainder.
    Group 0 sits at the end of the page and grows backward. A full group
    is 36 bytes. A short group is two flag words plus two bytes per row,
    which is the same formula.

    Args:
        slot_count: Number of row slots from the 13-bit field.
        page_size: Page length in bytes.

    Returns:
        Tuples of ``(first_slot, row_count, byte_offset)`` from the start
        of the page. The list is empty when there are no slots.
    """
    spans: list[tuple[int, int, int]] = []
    cursor = page_size
    slot = 0
    left = slot_count
    while left:
        count = min(16, left)
        size = 2 * count + 4
        cursor -= size
        spans.append((slot, count, cursor))
        slot += count
        left -= count
    return spans
