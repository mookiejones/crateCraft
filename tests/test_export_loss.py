"""Silent-loss cases for rekordbox XML and one synthetic export.pdb page.

The fixtures are built here. They are not a Serato library, a USB stick,
or a real export.pdb. The tests fail when a tempo marker or a cue is
dropped without a loss-report line, when an emoji or non-Latin crate name
is rewritten, or when a truncated device-name row is copied forward.
"""

from __future__ import annotations

import base64
import struct
import unittest
from xml.etree import ElementTree

import export_pdb
import rekordbox
import tags
from tests.fixture import TempLibrary, open_database
from tests.test_rekordbox import _beatgrid, _cue, _entry, _geob, _id3


def _sample_bpm(entries: list[dict[str, str]], time_s: float) -> float | None:
    """Return the exported BPM in effect at one source time.

    The last TEMPO whose Inizio is at or before ``time_s`` wins. This is
    not the exporter's own helper, so a writer that only preserves the
    marker count still fails when the BPM at that time changed.

    Args:
        entries: TEMPO attribute dicts from ``tempo_entries``.
        time_s: Source marker time in seconds.

    Returns:
        The BPM, or None when no marker has started yet.
    """
    current: float | None = None
    for entry in entries:
        if float(entry["Inizio"]) <= time_s + 1e-9:
            current = float(entry["Bpm"])
    return current


def _marks(cues: list[tags.Cue]) -> tuple[list[dict[str, str]], list[str], list[str]]:
    """Run position_marks and collect the dedupe and trim names.

    Args:
        cues: Cue dicts. No audio file is read.

    Returns:
        The marks, the deduped names, and the trimmed names.
    """
    parsed: tags.SeratoTags = {
        "cues": cues,
        "loops": [],
        "flips": [],
        "beatgrid": [],
        "found": True,
    }
    deduped: list[str] = []
    trimmed: list[str] = []
    marks = rekordbox.position_marks(parsed, deduped_names=deduped, trimmed_names=trimmed)
    return marks, deduped, trimmed


class TempoSpacingTests(unittest.TestCase):
    """Keep a tight tempo marker, or name it when it cannot be placed."""

    def test_a_marker_near_the_end_is_written_one_beat_earlier(self) -> None:
        """Move a last marker that has under half a beat of audio after it.

        The two BPMs differ, so copying the last tempo onto the earlier
        span would still leave two TEMPO rows and still fail this test.
        54 s and 56 s are exact, and 56.25 s of audio leaves 0.25 s after
        the 95 BPM marker. One beat at 95 BPM is about 0.632 s.

        Returns:
            None. The test fails if the marker stays too close to the end,
            moves later, or no longer matches the source BPM at 56 s.
        """
        duration = 56.25
        markers: list[tags.BeatMarker] = [
            {"position": 54.0, "beats": 4},
            {"position": 56.0, "bpm": 95.0},
        ]
        notes: list[str] = []
        entries = rekordbox.tempo_entries(markers, duration_s=duration, grid_notes=notes)
        self.assertEqual(len(entries), 2)
        written = float(entries[1]["Inizio"])
        beat = 60.0 / 95.0
        self.assertGreaterEqual(duration - written, beat - 0.002)
        self.assertLess(written, 56.0)
        self.assertAlmostEqual(_sample_bpm(entries, 54.0) or 0, 120.0, delta=0.001)
        self.assertAlmostEqual(_sample_bpm(entries, 56.0) or 0, 95.0, delta=0.001)
        self.assertTrue(any("written at" in line and "56.000" in line for line in notes))
        self.assertNotIn("left out", " ".join(notes))

    def test_markers_under_half_a_beat_apart_keep_each_source_bpm(self) -> None:
        """Separate two close markers without painting the earlier BPM over the later one.

        The middle marker's span is one beat in 1/32 s, which is over 999 BPM,
        so its written tempo is the final 100 BPM. That is under half a beat
        from the next marker. Sampling at 2 s must still read 100, not the
        120 BPM of the marker at 0.

        Returns:
            None. The test fails if the middle marker is dropped or left
            less than one beat from the next marker.
        """
        markers: list[tags.BeatMarker] = [
            {"position": 0.0, "beats": 4},
            {"position": 2.0, "beats": 1},
            {"position": 2.03125, "bpm": 100.0},
        ]
        notes: list[str] = []
        entries = rekordbox.tempo_entries(markers, duration_s=30.0, grid_notes=notes)
        self.assertEqual(len(entries), 3)
        gap = float(entries[2]["Inizio"]) - float(entries[1]["Inizio"])
        self.assertGreaterEqual(gap, 0.6 - 0.002)
        self.assertAlmostEqual(_sample_bpm(entries, 0.0) or 0, 120.0, delta=0.001)
        self.assertAlmostEqual(_sample_bpm(entries, 2.0) or 0, 100.0, delta=0.001)
        self.assertAlmostEqual(_sample_bpm(entries, 2.03125) or 0, 100.0, delta=0.001)
        self.assertTrue(any("written at" in line and "2.000" in line for line in notes))

    def test_a_marker_that_cannot_fit_is_named_and_not_silent(self) -> None:
        """Leave out a marker when one beat would start before the track.

        A 60 BPM marker needs a full second. The track is only half a
        second long, so the marker cannot move earlier and stay inside it.
        An empty TEMPO list with no sentence would hide the drop.

        Returns:
            None. The test fails if the marker is written inside the short
            track or the loss note omits its time.
        """
        notes: list[str] = []
        entries = rekordbox.tempo_entries(
            [{"position": 0.25, "bpm": 60.0}],
            duration_s=0.5,
            grid_notes=notes,
        )
        self.assertEqual(entries, [])
        text = " ".join(notes)
        self.assertIn("0.250", text)
        self.assertIn("left out", text)
        self.assertIn("60.00", text)

    def test_a_marker_with_half_a_beat_of_room_stays_put(self) -> None:
        """Do not move a marker that already has half a beat before the end.

        Returns:
            None. The test fails if a safe marker is shifted or omitted.
        """
        entries = rekordbox.tempo_entries(
            [{"position": 10.0, "bpm": 120.0}],
            duration_s=10.25,
        )
        self.assertEqual(entries[0]["Inizio"], "10.000")
        self.assertEqual(entries[0]["Bpm"], "120.00")

    def test_export_uses_the_track_length_when_it_places_the_last_marker(self) -> None:
        """Pass the library length into the grid so the end check runs on export.

        The audio file is a synthetic ID3 tag, not a decoded waveform.
        The loss report must name the move. The Serato database is the
        temporary library, and it is not written by the export.

        Returns:
            None. The test fails if the exported TEMPO stays under half a
            beat from the end or the report is silent.
        """
        payload = _beatgrid([(54.0, 4), (56.0, 95.0)])
        parsed = tags._parse_beatgrid(payload)
        with TempLibrary() as temp:
            audio = temp.root / "grid.wav"
            _id3(audio, [_geob("Serato BeatGrid", payload)])
            with open_database(temp.db) as conn:
                conn.execute(
                    """
                    UPDATE asset
                    SET portable_id = ?, file_name = 'grid.wav', length_ms = 56250
                    WHERE id = 1
                    """,
                    (str(audio),),
                )
            xml, report = rekordbox.export_rekordbox("Serato Library", None)
        tracks = rekordbox.parse_rekordbox(xml)["tracks"]
        assert isinstance(tracks, list)
        tempos = next(track["tempos"] for track in tracks if track["track_id"] == "1")
        assert isinstance(tempos, list)
        self.assertEqual(len(tempos), 2)
        written = float(tempos[1]["Inizio"])
        self.assertGreaterEqual(56.25 - written, (60.0 / 95.0) - 0.002)
        self.assertAlmostEqual(_sample_bpm(tempos, float(parsed[1]["position"])) or 0, 95.0, delta=0.02)
        self.assertAlmostEqual(_sample_bpm(tempos, float(parsed[0]["position"])) or 0, 120.0, delta=0.02)
        self.assertTrue(any("written at" in line and "56.000" in line for line in report))


class CueLossTests(unittest.TestCase):
    """Dedupe cues and cap hot cues and memory cues without failing the export."""

    def test_cues_at_the_same_millisecond_are_kept_once_and_named(self) -> None:
        """Drop the later cue when it starts on the same millisecond.

        A cue 4 ms away stays. That gap is a different hot-cue position.
        The dropped name is in the loss report. Writing both cues at the
        same time, dropping the near cue, or dropping one without naming
        it, fails.

        Returns:
            None. The test fails if Twin is written or missing from the report.
        """
        marks, deduped, _trimmed = _marks(
            [
                {"index": 0, "start_ms": 1000, "color": "#CC0000", "name": "Keep"},
                {"index": 3, "start_ms": 1000, "color": None, "name": "Twin"},
                {"index": 1, "start_ms": 1004, "color": None, "name": "Near"},
                {"index": 2, "start_ms": 5000, "color": None, "name": "Far"},
            ]
        )
        names = [mark["Name"] for mark in marks]
        self.assertIn("Keep", names)
        self.assertIn("Near", names)
        self.assertIn("Far", names)
        self.assertNotIn("Twin", names)
        self.assertEqual(deduped, ["Twin"])
        text = " ".join(rekordbox._loss_report({}, True, False, "asis", deduped_names=deduped))
        self.assertIn("Twin", text)
        self.assertIn("same time", text)

    def test_hot_cues_stop_at_eight_and_extra_memory_cues_are_named(self) -> None:
        """Cap pads A–H at eight and name memory cues past 32.

        Two cues share pad 0. Only one hot cue uses Num 0. Forty other
        cues are memory cues. The export returns marks instead of raising.
        The last eight names are in the loss report and are not written.

        Returns:
            None. The test fails if a ninth hot cue is written, a trimmed
            cue is silent, or position_marks raises.
        """
        cues: list[tags.Cue] = [
            {"index": 0, "start_ms": 0, "color": None, "name": "Pad"},
            {"index": 0, "start_ms": 2000, "color": None, "name": "Again"},
        ]
        for index in range(1, 8):
            cues.append({"index": index, "start_ms": 3000 + index * 1000, "color": None, "name": f"Hot {index}"})
        for offset in range(40):
            cues.append(
                {
                    "index": 8 + offset,
                    "start_ms": 20000 + offset * 1000,
                    "color": None,
                    "name": f"Mem {offset:02d}",
                }
            )
        marks, _deduped, trimmed = _marks(cues)
        hot = [mark for mark in marks if mark["Type"] == "0" and mark["Num"] != "-1"]
        memory = [mark for mark in marks if mark["Type"] == "0" and mark["Num"] == "-1"]
        self.assertLessEqual(len(hot), rekordbox.HOT_CUE_CAP)
        self.assertEqual(len(hot), len({mark["Num"] for mark in hot}))
        self.assertEqual([mark["Num"] for mark in hot].count("0"), 1)
        self.assertEqual(len(memory), rekordbox.MEMORY_CUE_CAP)
        self.assertIn("Mem 39", trimmed)
        self.assertNotIn("Mem 39", [mark["Name"] for mark in marks])
        text = " ".join(rekordbox._loss_report({}, True, False, "asis", trimmed_names=trimmed))
        self.assertIn("Mem 39", text)
        self.assertIn(str(rekordbox.MEMORY_CUE_CAP), text)

    def test_export_names_a_deduped_cue_and_a_trimmed_memory_cue(self) -> None:
        """Carry dedupe and the memory cap through the XML export.

        The file is a synthetic Markers2 tag. The export must finish, keep
        the hot-cue count at eight or fewer, and name both the duplicate
        and a trimmed memory cue. It does not write the Serato library.

        Returns:
            None. The test fails if either name is missing from the report
            or the duplicate is still a position mark.
        """
        body = b""
        body += _entry("CUE", _cue(0, 1000, b"\xCC\x00\x00", "Keep"))
        body += _entry("CUE", _cue(1, 1000, b"\x00\x00\x00", "Twin"))
        body += _entry("CUE", _cue(2, 1004, b"\x00\x11\x00", "Near"))
        for offset in range(40):
            body += _entry("CUE", _cue(8 + offset, 20000 + offset * 1000, b"\xFF\xFF\xFF", f"Mem {offset:02d}"))
        payload = b"\x01\x01" + base64.b64encode(body)
        with TempLibrary() as temp:
            audio = temp.root / "cues.wav"
            _id3(audio, [_geob("Serato Markers2", payload)])
            with open_database(temp.db) as conn:
                conn.execute(
                    "UPDATE asset SET portable_id = ?, file_name = 'cues.wav' WHERE id = 1",
                    (str(audio),),
                )
            xml, report = rekordbox.export_rekordbox("Serato Library", None)
        document = ElementTree.fromstring(xml.encode("utf-8"))
        track = next(item for item in document.find("COLLECTION").findall("TRACK") if item.get("TrackID") == "1")
        marks = list(track.findall("POSITION_MARK"))
        hot = [mark for mark in marks if mark.get("Type") == "0" and mark.get("Num") != "-1"]
        memory = [mark for mark in marks if mark.get("Type") == "0" and mark.get("Num") == "-1"]
        written = {mark.get("Name") for mark in marks}
        self.assertLessEqual(len(hot), 8)
        self.assertNotIn("Twin", written)
        self.assertIn("Near", written)
        self.assertNotIn("Mem 39", written)
        self.assertLessEqual(len(memory), rekordbox.MEMORY_CUE_CAP)
        text = " ".join(report)
        self.assertIn("Twin", text)
        self.assertIn("Mem 39", text)


class CrateNameTests(unittest.TestCase):
    """Keep emoji and non-Latin crate names and name them in the loss report."""

    def test_emoji_and_non_latin_names_are_kept_and_named(self) -> None:
        """Write the crate name unchanged and list the ones a player may hide.

        Café stays Latin, so it is not on that line. The emoji and the
        Japanese name are. A rewrite to ASCII, or a silent keep, fails.
        The names are stored with SQL in the temporary library. The export
        does not write them back.

        Returns:
            None. The test fails if a Name attribute differs or the report
            omits a risky name.
        """
        self.assertFalse(rekordbox.name_may_not_display("Café Warmup"))
        self.assertFalse(rekordbox.name_may_not_display("House"))
        self.assertTrue(rekordbox.name_may_not_display("🔥 House"))
        self.assertTrue(rekordbox.name_may_not_display("東京"))
        with TempLibrary() as temp:
            with open_database(temp.db) as conn:
                for crate_id, name, order in (
                    (9, "🔥 House", 1),
                    (10, "Café Warmup", 2),
                    (11, "東京", 3),
                ):
                    conn.execute(
                        """
                        INSERT INTO container
                            (id, parent_id, name, type, list_order, space_id, time_added, expanded, portable_id)
                        VALUES (?, 1, ?, 1, ?, 1, 1, 0, '')
                        """,
                        (crate_id, name, order),
                    )
            xml, report = rekordbox.export_rekordbox("Serato Library", None)
        parsed = rekordbox.parse_rekordbox(xml)
        playlists = parsed["playlists"]
        assert isinstance(playlists, dict)
        names = {child["name"] for child in playlists["children"]}
        self.assertIn("🔥 House", names)
        self.assertIn("Café Warmup", names)
        self.assertIn("東京", names)
        self.assertNotIn("Crate", names)
        risk = [line for line in report if "may not display" in line]
        self.assertEqual(len(risk), 1)
        self.assertIn("🔥 House", risk[0])
        self.assertIn("東京", risk[0])
        self.assertNotIn("Café", risk[0])
        self.assertIn("🔥", xml)
        self.assertIn("東京", xml)


class ExportPdbTests(unittest.TestCase):
    """Read a synthetic page without an 8-bit row count, and rebuild a bad device row."""

    def test_more_than_255_rows_survive_the_page_count(self) -> None:
        """Count 256 and 300 rows from the 13-bit field.

        Byte 0x18 is 0 when the page holds 256 slots, and 44 when it holds
        300. A uint8 counter would hide the rows or keep only that remainder.
        The rows are four-byte ids built in this test.

        Returns:
            None. The test fails if the parsed row count is the low byte
            or a row id is missing.
        """
        for count, low_byte in ((256, 0), (300, 44)):
            rows = [struct.pack("<I", index) for index in range(count)]
            page = export_pdb.build_page(8, rows)
            parsed = export_pdb.parse_page(page)
            self.assertEqual(page[0x18], low_byte, count)
            self.assertNotEqual(page[0x18], count)
            self.assertEqual(parsed.slot_count, count)
            self.assertEqual(parsed.present_count, count)
            self.assertEqual(len(parsed.rows), count)
            self.assertEqual(parsed.rows, tuple(rows))

    def test_a_truncated_device_row_is_regenerated_and_not_copied(self) -> None:
        """Replace a 20-byte device-name row with the padded default.

        The cut is inside a distinctive date and has no ``1000`` version.
        The rebuilt page must not contain that date. A complete row is
        copied unchanged and adds no report line. A full-length row with
        a bad version is also rebuilt, so its name is not copied either.

        Returns:
            None. The test fails if the damaged bytes are still in the page
            or a good row is rewritten.
        """
        mark = b"TRUNCATED!!!"
        song_count = 14
        prefix = struct.pack("<HHI", export_pdb.DEVICE_MAGIC, 0x0003, song_count)
        truncated = prefix + mark
        self.assertEqual(len(truncated), 20)
        self.assertNotIn(b"1000", truncated)
        page = export_pdb.build_page(export_pdb.TABLE_DEVICE, [truncated])
        rebuilt, report = export_pdb.repair_device_page(page)
        self.assertNotIn(mark, rebuilt)
        self.assertNotIn(truncated, rebuilt)
        text = " ".join(report)
        self.assertIn("regenerated", text)
        self.assertIn("USB", text)
        self.assertIn("not copied", text)
        self.assertNotIn(mark.decode("ascii"), text)
        rows = export_pdb.parse_page(rebuilt).rows
        self.assertEqual(rows, (export_pdb.default_device_row(song_count),))
        self.assertFalse(rows[0].startswith(truncated))
        self.assertEqual(len(rows[0]), export_pdb.DEVICE_ROW_LENGTH)
        self.assertIn(b"1000", rows[0])
        self.assertEqual(struct.unpack_from("<I", rows[0], 4)[0], song_count)

        good = export_pdb.default_device_row(3, "STAGE")
        kept, line = export_pdb.repair_device_row(good)
        self.assertIsNone(line)
        self.assertEqual(kept, good)
        good_page, good_report = export_pdb.repair_device_page(
            export_pdb.build_page(export_pdb.TABLE_DEVICE, [good])
        )
        self.assertEqual(good_report, [])
        self.assertEqual(export_pdb.parse_page(good_page).rows, (good,))

        damaged = bytearray(good)
        damaged[24:28] = b"9999"
        damaged[28:36] = b"EVILNAME"
        fresh, bad_line = export_pdb.repair_device_row(bytes(damaged))
        self.assertIsNotNone(bad_line)
        self.assertNotIn(b"EVILNAME", fresh)
        self.assertNotIn(b"9999", fresh)
        self.assertNotEqual(fresh, bytes(damaged))
