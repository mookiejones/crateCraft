# BPM check

**BPM check** looks at the BPM stored on each track in the crate you have selected. It flags a track whose BPM is about half or double the rest of that crate, such as 64 in a crate of 124–130. **×2** or **÷2** writes only that stored BPM after you confirm. The beatgrid is left alone. Cue points stay in the audio file. It does not decode the audio.

The note under the crate list says the check needs a crate.

## Run the check

1. Quit Serato DJ Pro before you save a BPM. You can look at the list while Serato is open.
2. Open crateCraft.
3. Click **Gig** in the drawer, then **BPM check**.
4. Click one crate. The sheet heading names the view. **Scope** under it shows that crate. **All tracks** stays off.
5. Click **Check again**. Flagged tracks sit in a table. **Stored** is the BPM in the library. **Suggested** is double or half of that. **Fix** is **×2** or **÷2**.

A crate change, a space change, or **Reload** repeats the check. If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

The same check from a terminal, in the repository directory:

```bash
python3 bpm_sanity.py
```

`--crate` is a crate id. `--space` selects the space. The default space is Serato Library. Without `--crate` the command checks the whole space. The command prints the report. It does not write a file and it does not change the library.

## What the report lists

| What you see | What it means |
| --- | --- |
| **Most tracks sit near N BPM** | That number is the middle BPM of the crate. Half and double are judged against it. |
| **About half or double** | The stored BPM is about half (**×2**) or about double (**÷2**) that middle BPM. About 6 percent either way still counts. |
| **No half or double BPMs** | The stored BPMs already sit near one tempo. |
| **At least 3 tracks with a BPM** | Fewer than three tracks have a usable BPM, so nothing is flagged. |
| **Skipped** | A blank, zero, or unusable BPM was left out of the count. |

A crate split evenly between two tempos is not flagged. The list is the review. This check does not make a crate and it does not change a crate you already have.

## Save one BPM

Click **×2** or **÷2** on a row. The dialog names the track, the stored BPM, and the suggested BPM, and it says the beatgrid is left alone. **Cancel** writes nothing. Confirm writes only that BPM.

Serato DJ Pro must be quit. If it is open, the save is refused and edits stay off. If the library does not keep the new BPM, crateCraft puts the library back and says so.

This save is not added to the Gig Lock list. The undo is the snapshot taken just before the write.

## Resize the list and the details

This view keeps the crate list and hides the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
