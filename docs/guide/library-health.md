# Library health report

**Library health** is a read-only one-page count of problems in the library database and in audio files on disk. It does not change the library, the crates, or the audio files. You can run it while Serato DJ Pro is open.

The report is under **Library health** in the rail, first in that group. It is not the same as [Before a gig](gig-check.md), which scores drives, streaming tracks, empty crates, and snapshots.

## Run the report

1. Open crateCraft.
2. Click **Library health** under **Library health**.
3. Click **All tracks** to check the space, or click one crate to check that crate and the crates inside it. The crate name is shown under the crate list.
4. Click **Check again** to refresh. Opening the view also runs the report.

A crate change, a space change, or **Reload** runs the report again.

If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

The same report from a terminal, in the repository directory:

```bash
python3 library_health.py
```

`--crate` is a crate id. `--space` selects the space. The default space is Serato Library. The command prints JSON. It does not write a file.

## What the report lists

| What you see | What it means | Where it opens |
| --- | --- | --- |
| **Missing files** | The library row has Serato's missing flag. | [Missing files](missing.md) |
| **No BPM** | BPM is blank or zero. | The track in Crates |
| **No key** | Key is blank. | The track in Crates |
| **No beatgrid** | The audio file has no Serato BeatGrid frame. An unreadable grid still counts as present. Missing or unplugged files are skipped. | The track in Crates |
| **No artwork** | The audio file has no ID3 picture, FLAC picture block, or MP4 cover. Missing or unplugged files are skipped. | The track in Crates |
| **Empty genre** | Genre is blank. | The track in Crates |
| **Not in a crate** | The track is in the space and not in any crate. Hidden when a crate is selected. | The track in Crates |
| **Unused files** | Audio files in the same music folders as library tracks that are not in the library. Hidden when a crate is selected. | [Organize files](files.md) |
| **Duplicate groups** | Same title, artist, and length in whole seconds. A crate that holds one copy still lists the group. | [Duplicates](duplicates.md) |
| **Suspect quality** | Fake 320s and lossless files that look lossy-sourced. The count lives on that view because it decodes audio. | [Suspect quality](bitrate-check.md) |

Each section shows a sample of up to 100 rows. The count is the full number.

Damaged audio files stay on [Damaged files](file-scan.md). Fake 320s stay on [Suspect quality](bitrate-check.md). The report always includes **Open Suspect quality**.
