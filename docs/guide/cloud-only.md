# Cloud-only

**Cloud-only** lists tracks whose path is in the library but whose audio is not fully on this computer. Download those files before a gig. The check does not download them, pin them, or change the Serato library. You can run it while Serato DJ Pro is open.

## Run the check

1. Open crateCraft.
2. Click **Gig** in the drawer, then **Cloud-only**.
3. Click **All tracks** to check the space, or click one crate to check that crate and the crates inside it. **Scope** shows All tracks or the crate.
4. Read the five lines. They keep four states apart, plus an unplugged drive:
   - **On this computer** means the audio is here and can play without a download.
   - **Cloud-only** means the path is here, but the audio is not fully on this computer. macOS marks that with a dataless file. Windows marks it when opening or reading the file would download it. An older iCloud placeholder named `.song.mp3.icloud` counts too.
   - **Missing** means the file is not on a connected drive. That is not a cloud placeholder. [Missing files](missing.md) is where you point a track at a file that moved.
   - **Not checked** means this check cannot tell, so the file is not counted as on this computer. A folder this check does not fully know, such as Google Drive under CloudStorage, is never treated as local.
   - **Unplugged drive** means the track stays in the crate. It is named under [Ready](gig-check.md), not as a missing file.
5. **Check again** looks at the files once more. It still does not download them.

## What to do

Download a cloud-only file in Finder or File Explorer before the gig. Opening it in crateCraft does not download it.

If the Serato library folder itself sits inside iCloud Drive, Dropbox, or OneDrive, the line says so. **Ready** is then **Not ready**. Optimize Mac Storage is named only when crateCraft can read that it is on. If it cannot tell, it does not say the switch is on or off.

A file that is only **Not checked** does not by itself make the gig **Not ready**. A cloud-only file does. **Ready** lists the paths on the **Cloud-only** step, separate from **Missing files**.

The same check from a terminal, in the repository directory, is part of the gig check:

```bash
python3 gig_check.py
```

The report includes **Cloud-only files** and **Could not check**. It does not write a file.
