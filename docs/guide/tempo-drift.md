# Tempo drift

**Tempo drift** is a read-only check of the audio in the crate you have selected. It lists tracks whose tempo wanders, whose name or comment looks like a live recording, or that Serato marked for a pending tempo map. Those tracks often need a flexible beatgrid before a gig. It does not change the library, the crates, or the files. It does not rewrite a wrong constant BPM. You can run it while Serato DJ Pro is open.

The note under the crate list says **Needs a crate because it decodes audio.**

## Run the check

1. Open Serato Library.
2. Click **Tempo drift** under **Before a gig**.
3. Click one crate. The crate name is shown under the crate list. **All tracks** stays off, because a whole-space decode can take minutes.
4. Click **Check again**. The report groups wandering tempos, live-looking names, and Serato's pending tempo-map mark.

A crate change, a space change, or **Reload** repeats the check. If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

The same check from a terminal, in the repository directory:

```bash
python3 tempo_drift.py
```

`--crate` is a crate id. `--space` selects the space. The default space is Serato Library. Without `--crate` the command checks the whole space. The command prints the report. It does not write a file.

## What the report lists

| What you see | What it means |
| --- | --- |
| **Tempo wanders** | Window tempos in the first three minutes disagree by about 6 BPM or more. The row can show the range. |
| **Looks like a live recording** | The title, artist, or comment has a live, bootleg, or concert word on its own. Alive, Olive, and livelihood are not listed. |
| **Serato marked a pending tempo map** | Serato's pending tempo-map flag is set on that row. |
| **Already has a flexible beatgrid** | A count. Those files already change tempo in the stored BeatGrid, so they are skipped. |
| **Could not find the file** | A count. Missing files, including a track on an unplugged drive, stay on [Missing files](missing.md). |
| **Could not be read** | A count. The file is on disk but the decoder could not open it. |
| **Too quiet to measure** | A count. Not enough confident windows in the first three minutes. |
| **Format not decoded** | A count. An extension this check does not decode. A live-looking name on that file is still listed. |

A grid that already changes tempo is not listed, even when the name looks live. 60 BPM against 120 BPM is treated as the same pulse, not as drift.

The check does not write a crate of flagged tracks. It does not rewrite BPM.

## Resize the list and the details

This view keeps the crate list and hides the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
