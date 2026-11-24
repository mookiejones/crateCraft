# Re-analyze

**Re-analyze** marks chosen tracks unanalyzed so Serato rebuilds grids and overviews. crateCraft does not re-analyze the audio. Cue points stay.

The note under the heading says **Needs a crate. Marks tracks unanalyzed so Serato rebuilds grids and overviews. Cues stay. Quit Serato first.**

Pick a crate first. The check covers that crate and its subcrates. All tracks is refused.

## Mark tracks for Serato

1. Open crateCraft.
2. Click **Health** in the drawer, then **Re-analyze**.
3. Click the crate you want. The list shows tracks that still look analyzed. **Will clear** names BeatGrid and Autotags when that option is on.
4. Click **Preview**, then **Confirm re-analyze**. Confirm stays off when nothing can be marked, when All tracks is selected, or while Serato has the library open.

**Also clear BeatGrid and Autotags** starts on. Turn it off to mark the database only. **Include locked beatgrids** unlocks locked rows so Serato can rebuild them. Locked rows stay as they are when that option is off, and the other tracks in the crate are still marked. Changing either option turns Confirm off until you preview again. Markers2 cues stay either way.

**Check again** reloads the list. Choosing another crate, a space change, or **Reload** does the same.

When nothing needs a mark, the report says **Nothing to mark. Pick a crate that still has analysis.**

While Serato has the library open, Confirm stays off.

If Confirm cannot finish, a snackbar at the bottom names the file and says to open the local log from **Settings**, or read the operation log on **Backups**. The full path stays in that local log.

## What Confirm writes

Confirm clears the Serato-analyzed bit on those library rows, and on the copy Serato keeps for a connected drive. By default it also removes BeatGrid and Autotags from the files. Markers2 cues stay. Overview stays for Serato to overwrite. Then open the tracks in Serato (Analyze Files or load to a deck) so Serato rebuilds. If the drive copy does not take the mark, the library is put back. A drive that is not connected is named in the status line, and the mark on this computer stays.

A snapshot is taken first. If the mark does not stick, crateCraft puts the library back.
