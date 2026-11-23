# Gain changed

**Gain changed** lists tracks whose Serato Autotags Gain dB is not 0. Reset writes only that field to 0 dB. Markers2, BeatGrid, Overview, and Auto Gain stay as they were.

The note under the heading says **Tracks whose Autotags Gain dB is not 0. Reset writes only that field. Quit Serato first.**

This view covers the whole space. The crate list is hidden.

## Save a crate of non-zero gain

1. Open crateCraft.
2. Click **Health** in the drawer, then **Gain changed**.
3. The list shows each track whose Gain dB is not 0.
4. Click **Save crate**. The page shows the plan. Nothing is written until you confirm.
5. Click **Confirm crate**. Quit Serato first. The crate is named **Gain changed** under a labelled **crateCraft** folder.

## Reset Gain dB to 0

1. On the same view, click **Reset to 0 dB**. The page shows how many files would change. Nothing is written yet.
2. Click **Confirm reset**. Quit Serato first.
3. crateCraft takes a snapshot, writes only Autotags Gain dB to `0.000`, then reads each file back. If Gain dB is not 0, the library is put back.
4. Undo from **Backups** if you need the previous gain values.

**Check again** reloads the list. A space change or **Reload** does the same.

If the page cannot reach the library server, it says **Couldn't reach the library server. Check it's running, then press Check again**.

When no track has a non-zero stored gain, the report says **No track has a non-zero stored gain.**

While Serato has the library open, **Save crate** and **Reset to 0 dB** stay off.

## Resize the list and the details

This view hides the crate list and the track sheet, so there is no list/details divider here. The width you set in **Crates** is kept for the next time you open a track list.
