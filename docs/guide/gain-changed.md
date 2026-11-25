# Gain changed

**Gain changed** lists tracks whose stored gain is not 0 dB. That number lives in the audio file, in Serato's Autotags, next to the automatic gain Serato calculated. This view changes only the stored gain you set. Auto gain, cue points, the beatgrid, the overview, and the analysis stay.

The note under the heading says **Lists tracks whose stored gain is not 0 dB. Saving a crate writes the library. Reset to 0 dB writes that gain in the audio file and leaves cues, the beatgrid, overview, and analysis alone. Quit Serato first.**

This view covers the whole space. Checking the list does not write anything. A file on an unplugged drive is not listed as a gain change. A stored-gain layout this app cannot read is left as it was.

## Save a crate

1. Open crateCraft.
2. Click **Health** in the drawer, then **Gain changed**.
3. The list shows each track and its stored gain, such as -1.500 dB.
4. Click **Save crate**. The page shows the plan. Nothing is written until you confirm.
5. Click **Confirm crate**. Quit Serato first. The crate is named **Gain changed** and sits inside **_crateCraft generated**. A crate you already named Gain changed, outside that folder, is left as it was.

**Check again** reloads the list.

When no track has a stored gain other than 0 dB, the report says **No track has a stored gain other than 0 dB.**

While Serato has the library open, **Save crate** and **Reset to 0 dB** stay off.

## Reset to 0 dB

1. On the same list, click **Reset to 0 dB**.
2. Read the plan. Nothing is written until you confirm.
3. Click **Confirm reset**. Quit Serato first.

crateCraft saves a snapshot, writes 0 dB into the stored-gain field, and reads that field back. If the gain is not 0 dB, or if cues, the beatgrid, the overview, or the analysis would change, the snapshot is put back and the page says so. The write does not fail quietly.

**Undo reset** puts that snapshot back. Quit Serato first.
