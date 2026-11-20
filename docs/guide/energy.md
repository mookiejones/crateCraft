# Energy

**Energy** writes a level from 1 to 10 into a blank Grouping field so a Serato smart crate can match it. Apply writes the library through the same path as a crate edit. Quit Serato first. Audio files stay as they are.

The note under the heading says **Needs a crate. Writes Energy 1–10 into a blank Grouping field. Audio files stay. Quit Serato first.**

Pick a crate first. The check covers that crate and its subcrates. All tracks is refused. A Grouping field that already has text is left alone, including one that already says Energy 7.

## Write energy into Grouping

1. Open crateCraft.
2. Click **Health** in the drawer, then **Energy**.
3. Click the crate you want. The list shows each track whose Grouping is blank. **Energy** is 1 to 10. **Source** says whether that number came from the file or from the audio. **Grouping** is the text Apply will write, such as Energy 7.
4. Click **Apply**. Apply stays off when nothing can be written, when All tracks is selected, or while Serato has the library open.

**Check again** reloads the list. Choosing another crate, a space change, or **Reload** does the same.

If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

When no blank Grouping field can take a level, the report says **No blank Grouping field can take an energy level.**

While Serato has the library open, Apply stays off.

If Apply cannot finish, a snackbar at the bottom names the file (for example `master.sqlite`) and says to open the local log from **Settings**, or read the operation log on **Backups**. The full path stays in that local log. The snackbar does not ask you to delete a journal file.

## What Apply writes

Apply writes `Energy N` into Grouping on those library rows, and only when Grouping is still blank. A field that gained text since the list loaded is skipped. Cue points stay in the audio files. The files themselves are not rewritten.

The Energy column in the track list shows that 1–10 number when Grouping matches Energy N. Otherwise it still shows the star rating as 1 to 5.

## The crate list stays

This view keeps the crate list so you can pick the crate the check uses. The track sheet stays hidden. The width you set in **Crates** is kept for the next time you open a track list.
