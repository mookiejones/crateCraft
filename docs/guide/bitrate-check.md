# Suspect quality

**Suspect quality** is a check of the audio in the crate you have selected. It lists files whose stated bitrate is much higher than the spectrum shows (a fake 320), and lossless files that look like they were made from a lossy encode. This is a suspicion, not proof. The check itself does not change the library, the crates, or the files. You can run it while Serato DJ Pro is open.

Saving a crate of the flagged tracks writes the library. Quit Serato DJ Pro first.

The note under the crate list says **Needs a crate because it decodes audio.**

## Run the check

1. Open crateCraft.
2. Click **Suspect quality** under **Library health**.
3. Click one crate. The crate name is shown under the crate list. **All tracks** stays off, because a whole-space decode can take minutes.
4. Click **Check again**. The report groups fake 320s and lossless files that look lossy-sourced.

A crate change, a space change, or **Reload** repeats the check. If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

The same check from a terminal, in the repository directory:

```bash
python3 bitrate_check.py
```

`--crate` is a crate id. `--space` selects the space. The default space is Serato Library. Without `--crate` the command checks the whole space. The command prints the report. It does not write a file.

## What the report lists

| What you see | What it means |
| --- | --- |
| **Stated bitrate is much higher than the spectrum** | The file's stored bitrate is at least 1.5 times what the high-frequency cliff shows. 320 against 256 is too close to call. |
| **Lossless file looks like it came from a lossy encode** | A FLAC, WAV, or AIFF has a lossy encoder's high-frequency cliff. |
| **Could not find the file** | A count. Missing files, including a track on an unplugged drive, stay on [Missing files](missing.md). |
| **Could not be read** | A count. The file is on disk but the decoder could not open it. |
| **Too quiet to measure** | A count. Not enough loud frames in the sample. |
| **Format not decoded** | A count. An extension this check does not decode. |

An old recording or a lo-fi master can have a real cliff, so a listed file is not proof of a fake encode.

## Save a crate of flagged tracks

1. After a check that listed tracks, click **Save crate**. The page previews a crate named **Suspect quality**. Nothing is written yet.
2. Quit Serato DJ Pro.
3. Click **Confirm crate**. The crate is created at the space root through the same write path as a crate you make by hand.

**Save crate** stays off while **All tracks** is selected or when the check found no suspects. A preview with no flagged tracks does not write. A second save with the same name is still a new crate.

## Resize the list and the details

This view keeps the crate list and hides the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
