# Damaged files

**Damaged files** is a read-only check of the audio files in the space or crate you have selected. It does not change the library, the crates, or the files. You can run it while Serato DJ Pro is open.

The note under the crate list says **Quick check reads the start of each file. Full decode needs a crate because it can take minutes.**

## Run the check

1. Open crateCraft.
2. Click **Library health** in the rail, then **Damaged files** above the sheet.
3. Click **All tracks** to check the space, or click one crate to check that crate and the crates inside it. The crate name is shown under the crate list.
4. Click **Quick check**. The report groups empty files, files that cannot be read, files whose bytes do not match the extension (a web page saved as `.mp3`), and files Serato has marked corrupt.
5. For a decode, click one crate first, then **Full decode**. That also lists files that will not decode, files that stop part way, and files shorter than the length stored in the library. **Full decode** stays off while **All tracks** is selected.

**Quick check** is the check that runs when you open the view. A crate change, a space change, or **Reload** repeats the last check. If the last check was a full decode and you then select **All tracks**, the page falls back to a quick check.

If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Quick check**.

The same check from a terminal, in the repository directory:

```bash
python3 file_scan.py
```

`--crate` is a crate id, or `all`. `--space` selects the space. `--depth full` decodes every file, including the whole space. The default space is Serato Library. The command prints the report. It does not write a file.

## What the report lists

| What you see | What it means |
| --- | --- |
| **Empty file** | The file is on disk and has no audio bytes. |
| **Could not read the file** | The path exists and could not be opened. |
| **Wrong format** | The bytes are not the container the extension says. The line can name what they look like, such as html. |
| **Serato marked this file corrupt** | Serato's own corrupt flag is set on that row. |
| **Could not decode** | No decoder produced sound. Full decode only. |
| **Decode error** | A decode stopped part way. Full decode only. |
| **Shorter than stored length** | The decode is much shorter than the length stored in the library. Full decode only. |

A track whose file is not on disk, including a track on an unplugged drive, is counted as skipped. Those tracks stay on [Missing files](missing.md). An extension this check does not know is counted and not listed.

The check does not write a crate of suspect files.

## Resize the list and the details

This view keeps the crate list and hides the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
