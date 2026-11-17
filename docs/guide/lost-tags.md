# Lost tags

**Lost tags** fills a blank title or artist in the library from the audio file. Apply writes those fields through the same library path as a crate edit. Quit Serato first. Audio files stay as they are.

The note under the heading says **Fill a blank title or artist from the file. Writes the library, not the audio. Quit Serato first.**

This view covers the whole space. The crate list is hidden. A field that already has a value is left alone, even when the file says something else.

## Fill blank titles and artists

1. Open crateCraft.
2. Click **Health** in the drawer, then **Lost tags**.
3. The list shows each track whose title or artist is blank in the library and set in the file. **In the library** is what Serato stored. **In the file** is what the audio file can fill.
4. Click **Apply**. Apply stays off when nothing can be filled, or while Serato has the library open.

**Check again** reloads the list. A space change or **Reload** does the same.

If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

When no blank title or artist can be filled from the file, the report says **No blank title or artist the file can fill.**

While Serato has the library open, Apply stays off.

If Apply cannot finish, a snackbar at the bottom names the file (for example `master.sqlite`) and says to open the local log from **Settings**, or read the operation log on **Backups**. The full path stays in that local log. The snackbar does not ask you to delete a journal file.

## What Apply writes

Apply writes the still-blank title and artist on those library rows. A field that gained a value since the list loaded is skipped. Cue points stay in the audio files. The files themselves are not rewritten.

## Resize the list and the details

This view hides the crate list and the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
