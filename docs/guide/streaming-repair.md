# Streaming repair

**Streaming repair** points a greyed-out Beatport or Beatsource track at a local file. The library row stays, so its colour and its place in each crate stay. Cue points already in the local file are left as they are.

The note under the heading says the row stays and that cue points in the file are left as they are.

This view covers the whole space. The crate list is hidden.

## Repair a greyed-out track

1. Open crateCraft.
2. Click **Health** in the drawer, then **Streaming repair**.
3. The list shows each Beatport or Beatsource track that does not open as a local file. **Crates** names each crate and the position in that crate. **Local file** is the one match, when there is one.
4. Click **Repair**. Repair stays off when no track has one artist-and-title match, or while Serato has the library open.
5. Click **Confirm repair**. Quit Serato first.

**Check again** reloads the list. A space change or **Reload** does the same.

If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

When no greyed-out Beatport or Beatsource track is in the library, the report says **No greyed-out Beatport or Beatsource tracks.**

While Serato has the library open, Repair stays off.

If Confirm repair cannot finish, a snackbar at the bottom names the file (for example `master.sqlite`) and says to open the local log from **Settings**, or read the operation log on **Backups**. The full path stays in that local log. The snackbar does not ask you to delete a journal file.

## What Confirm repair writes

Confirm repair stores the local file on that same library row and marks the row as a local file. The colour, the title, the artist, and the position in each crate stay. The audio file is not rewritten. A file that is not the match on the list is refused, and nothing is written.

A shortcut, a file inside the Serato library folder, and a file inside `_Serato_` are refused.

## Resize the list and the details

This view hides the crate list and the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
