# Ready

**Ready** is a read-only gig check. It scores the library and lists what is holding it back. It does not change the library, the crates, or the audio files. You can run it while Serato DJ Pro is open.

## Run the check

1. Open crateCraft.
2. Click **Gig** in the drawer, then **Ready**.
3. Click **All tracks** to check the space, or click one crate to check that crate and the crates inside it. The sheet heading names the view. **Scope** under it shows All tracks or the crate. **All tracks** on that chip checks the whole space.
4. Walk the six steps: **Drives**, **Missing files**, **Cloud-only**, **Streaming**, **Empty crates**, and **Since last gig**. Each step says **Step N of 6**. One button names the thing to do, such as **Locate missing files**. **Back** returns to the previous step. **Exit gig check** leaves the check. Lists sit in groups you can open and close. Tab to a group heading, then Enter or Space to hide or show it.
5. Read the score on each step. It shows the number out of 100, such as **72/100**, and **✓ Ready** or **✕ Not ready**. Color is not the only signal. **Ready** means the score is at least 70 and nothing below is a hard stop. **Not ready** means do not treat the crate as ready to play.
6. The last screen says whether you are ready for the gig, the score, the crate, and the time of the check. **Check again** after you plug a drive back in or move a file. The new check reads the drives again. A drive that is plugged in is not still called **drive offline**. The report stays up while the new check runs. If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

## Older deck

**Player** sits next to **Check again**. **Not chosen** is the default. That choice does not warn.

Pick **XDJ-1000MK2** when that deck will play this library. When the space has 10,000 tracks or more, Ready shows a warning on every step. The warning names TIME, HOT CUE BANK, FILE NAME, and BITRATE. Those four root categories have no precomputed list, so that deck may scan every track and freeze. In rekordbox, open **Preferences › Category** and set those four to **Inactive**.

The count is every track in the space. A crate you selected does not shrink the count. A library under 10,000 tracks shows no warning. An empty library shows no warning. **Not chosen**, **Common club players**, and every other player in the list show no warning. The warning names only the XDJ-1000MK2.

This check does not change rekordbox. It does not write a USB stick. The score does not drop because of this warning.

## Tonight crates

**Tonight crates** sits next to **Check again** on Ready. One confirm builds ready-to-play crates under **`_crateCraft generated` / `Tonight`**: **Newest adds**, **Most played**, and one crate per decade from the year field. Quit Serato DJ Pro before confirm. A re-run replaces only that Tonight folder and the crates inside it. Crates you made yourself stay put. An empty plan does not write.

The same check from a terminal, in the repository directory:

```bash
python3 gig_check.py
```

`--crate` is a crate id, or `all`. `--space` selects the space. The default space is Serato Library. `--target` is a player id, or `unknown`. The default is `unknown`. `xdj-1000mk2` is the only id that can show the older-deck warning. The command prints the report. It does not write a file.

## Holding it back

The list under **Holding it back** is each reason the score is not 100.

| What you see | What to do |
| --- | --- |
| **Not ready**, and a drive name, with the words **drive offline** | Plug that drive in, then **Check again**. Tracks on it are not listed as missing files. The drive is named once. |
| **Not ready**, and missing files, with the words **file missing** | Each missing path is listed under **Missing files**. The drive is connected and the file does not open. [Missing files](missing.md) is where you point a track at a file that moved. |
| **Not ready**, and tracks with **no path** | The track has no file path and no drive location. Those lines stay on the missing step and are not mixed into the missing-file list. |
| **Not ready**, and cloud-only files | The path is in the library, but the audio is not fully on this computer. Download it in Finder or File Explorer before the gig. This check does not download it. A cloud placeholder is not a missing file. [Cloud-only](cloud-only.md) lists every one. |
| A file that could not be checked, with the word **unknown** | The check cannot tell whether the audio is on this computer, so it is not counted as local and it is not a missing file. An unsupported cloud folder is never treated as local. Nothing was changed. |
| A streaming track, with the word **streaming** | Apple Music tracks play only while you are logged in to Apple Music. They are counted on their own, not as missing files. |
| An empty crate | The line is **Serato may delete this crate when it closes.** Put a track in the crate if you want to keep it. Serato's own clean-up note describes empty crates disappearing after quit, and that note does not name a version. The Serato DJ 4.0 crate page does not say they are deleted. |
| **No snapshot in the last 7 days** | The score drops. A snapshot from the last 7 days does not drop it. |
| **No snapshots yet** | Nothing has been saved to compare with this library, so there is no list of what changed. The score still drops, because there is no snapshot from the last 7 days. Open **Backups** and click **Take a backup**. |
| **Snapshots could not be read.** | The snapshot store beside the library did not open. The score drops as if there were no recent snapshot. Open **Backups** to see what is wrong. |

A missing drive, or a missing file in the crate you selected, is **Not ready** even when the number would otherwise pass.

## What changed

**Check drive** sits beside this check in the same rail group. Pick a connected drive that has a `_Serato_` folder. The report is read-only. An unplugged drive is named and is not treated as a missing file. **Back up this stick** copies the stick's music and `_Serato_` to another drive or disk image without writing the stick. **Review stick cues** and **Import empty pads** sit under the report. Review writes nothing. Import copies cues into empty pads and does not replace a cue you already have. See [Check a portable drive](files.md#check-a-portable-drive) and [Back up this stick](files.md#back-up-this-stick).

**Cloud-only** sits beside this check in the same rail group. It lists tracks whose audio is still in the cloud, and files the check could not prove are on this computer. It does not download them. See [Cloud-only](cloud-only.md).

**Tempo drift** sits beside this check in the same rail group. It lists tracks whose tempo wanders or that look live, so you can give them a flexible beatgrid. It needs a crate. See [Tempo drift](tempo-drift.md).

**BPM check** sits beside this check in the same rail group. It flags a stored BPM that is about half or double the rest of the crate, then **×2** or **÷2** writes only that BPM after you confirm. The beatgrid is left alone. It needs a crate. See [BPM check](bpm-check.md).

**Won't play** sits beside this check in the same rail group. Pick a CDJ or XDJ, or Common club players. The list names tracks that player will refuse, with a reason and what to do. A file that could not be read stays unknown. The check only reads headers. See [Won't play](wont-play.md).

When a snapshot exists, **Since last gig** lists crates, cues, beatgrids, and tags that differ from the latest one. Title, artist, BPM, and key show the old value and the new value. The snapshots are the ones in **Backups**. The check compares the library copy and the cues and beatgrids saved in that snapshot with the library now. **Revert** opens the restore plan for that snapshot. Confirm stays off while Serato is running. The plan is a dry run; nothing is written until you confirm. With no snapshot, that section says **No snapshots yet**.
