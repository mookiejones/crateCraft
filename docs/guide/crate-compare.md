# Compare crates

**Compare crates** shows tracks in both crates, only in A, or only in B. Save any set as a crate. Quit Serato first. Audio files stay as they are.

The note under the heading says **See tracks in both crates, only in A, or only in B. Save any set as a crate. Quit Serato first.**

This view covers the whole space. The crate list is hidden.

A smart crate is compared by the members Serato last stored, which can be out of date. The report says so when either crate is smart.

## Compare two crates

1. Open crateCraft.
2. Click **Music** in the drawer, then **Compare crates**.
3. Pick **Crate A** and **Crate B**. Turn on **Include subcrates** to count nested crates too.
4. Click **Compare**. The report lists **In both**, **Only in A**, and **Only in B**.
5. Click **Save crate** on a set. Save stays off when that set is empty, or while Serato has the library open.

**Compare** reloads the lists. A space change or **Reload** does the same.

If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Compare**.

When a set has no tracks, that group says **Nothing in this set.**

While Serato has the library open, Save crate stays off.

If Save crate cannot finish, a snackbar at the bottom names the file (for example `master.sqlite`) and says to open the local log from **Settings**, or read the operation log on **Backups**. The full path stays in that local log. The snackbar does not ask you to delete a journal file.

## What Save crate writes

Save crate re-reads both crates, then makes a normal crate of the tracks in that set. An empty set does not write. Cue points stay in the audio files. The files themselves are not rewritten.

The default name is **Both · A · B**, **Only in A**, or **Only in B**.

## Resize the list and the details

This view hides the crate list and the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
