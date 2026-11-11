# Cue jump and cue edit (parked)

**Status:** PARKED. Research from 11 November 2026. Do not implement, file an issue, or open a product PR until Charles asks.

This is a feasibility note, not a spec. Jump is player-only. Edit is a library-safety write of Serato frames inside audio files.

Target inspected: `/Applications/Serato DJ Pro.app` (`com.serato.seratodj`, CFBundleVersion `5.0.0.1278`, 197 MB universal Mach-O). Hopper timed out at 120 seconds. Evidence is arm64 `strings` plus crateCraft’s parser and write path.

## Jump between cue points

Yes. Player-only. Serato’s binary is not required.

**Already ships.** Seek-bar cue marks call `seek(cue.seconds)` (`src/components/PlayerBar.tsx`). Wiki Playback: click a cue to jump. `GET /api/track` already returns `index`, `start_ms`, `color`, `name`.

**Not built**

- Click pad 1–8 in the detail pane (`src/components/CuePads.tsx` is display-only)
- Next / previous cue shortcuts (today: Space, ±5s, Shift ±30s)
- Click a cue tick on the waveform (overview seeks by x, not by pad)

Serato DJ’s own jump path (context only): `CUserIOPadsController::InitHotCueMode` for pads 0–7, plus `set_cue_point` and “Triggering cue point”. crateCraft only needs `start_ms` → `HTMLAudioElement.currentTime`.

## Modify cue points

Yes later, same safety class as snapshot restore. Cues are not in `master.sqlite`.

Serato DJ Pro 5.0.0 still names:

| Container | Frame / atom |
|---|---|
| ID3 GEOB | `Serato Markers2` and legacy `Serato Markers_` |
| FLAC | `SERATO_MARKERS_V2` |
| MP4 | `----:com.serato.dj:markersv2` and `markers` |

The app also has `MarkerTagV1Encoder`, `SynchSafeMarkerTagEncoder`, `MetadataStore::Push`, file classes for MP3 / FLAC / MP4 / AIFF / WAV / OGG, and `hot_cue_delete` / `Delete Cue`.

crateCraft already **parses** Markers2 (`tags.py` `_parse_markers2` / `_parse_cue`) and **writes exact frame bytes** (`snapshot_frames.restore_stored_frames`) for snapshot restore, duplicate merge, and file replace. Tests already encode a CUE record. There is no product encoder that rebuilds a payload from an edited pad list. `POST /api/track` saves library fields only.

A CUE blob is:

- byte 1 = pad index (0–7)
- bytes 2–5 = start ms, big-endian
- bytes 7–9 = RGB
- UTF-8 name at byte 12

Markers2 is `01 01` plus base64 of `CUE` / `LOOP` / `FLIP` entries. `COLOR` and `BPMLOCK` sit in the same payload and must be copied through, not dropped.

An editor would:

1. Quit Serato (same write gate as restore).
2. Snapshot first.
3. Rebuild Markers2 from the edited pads, keep LOOP / FLIP / COLOR / BPMLOCK.
4. Write through the existing ID3 / FLAC / MP4 replace path (audio hash unchanged).
5. Likely also refresh legacy `Serato Markers_` (`MarkerTagV1Encoder` is still in 5.0.0). crateCraft does not parse that frame today.
6. Probe a real file in Serato 5 after write before shipping.

**Risks**

- A generic ID3 rewrite can drop GEOB. Use the restore / copy path, not a generic tag library.
- Keep Serato’s stored millisecond value. Rekordbox export already shifts MP3 times from the LAME / Xing header.
- Serato 5 also has a `glamprey` metadata path (`HotCueAttributeConverter`, atoms `PCO2` / `PCOB` / `PCP2` / `PCPT` / `PMAI`). crateCraft does not parse it. If Serato 5 prefers that over Markers2 on load, an edited Markers2 might not stick. Restore of exact Markers2 bytes is the existing product path, so Markers2 is still live.
- Protect Library / unknown Serato version already block writes. Keep that.
- Do not edit the beatgrid here. Lucid / Flexible grid is still unverified.

## If this is picked up

| Feature | Scope |
|---|---|
| Jump from pads + next / prev cue | UI + `seek()` only. No file write. |
| Edit time / name / color / delete pad | Encoder + dual Markers2 / `Markers_` write + Serato 5 probe. Snapshot + quit Serato. Needs `needs-serato-5`. |
