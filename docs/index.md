# crateCraft

crateCraft is a window on your computer for the Serato DJ Pro library. Browse crates, fix track details, clean up duplicate copies, and move files without sending your music anywhere.

The app talks only to this computer. It is not a website you log in to. Your tracks, crate names, and file paths stay here.

The first time you open it, setup finds your library and saves a safety copy before anything can change.

[Quick Start](quick-start.md) is five short steps: Download, Install (Mac and Windows), Open, First backup, Find your music. [Install the app](first-install.md). Read [Safety and backups](guide/safety.md) before the first edit.

![The library window on a sample collection. Crates are on the left. The open track is on the right.](media/crates.png)

## What you can do

- [Browse crates and tracks](guide/crates.md), and make, rename, color, and delete crates.
- [Play a track](guide/playback.md) in the window before you crate or tag it. Playback does not change the file. The server can build a waveform for that track. M4A, AAC, and ALAC use the Mac or Windows audio system, or ffmpeg on Linux when it is already installed. ffmpeg is not included. A 60-minute stereo 44.1 kHz WAV is analyzed in 7.9 seconds and cached beside the app settings.
- [Edit track details](guide/tags.md) that Serato stores in the library. Cue points stay in the audio file.
- Read [History](guide/history.md), find [missing files](guide/missing.md), run a [check before a gig](guide/gig-check.md), flag [tempo drift](guide/tempo-drift.md), check [suspect quality](guide/bitrate-check.md), and see [stems](guide/stems.md).
- [Merge duplicate copies](guide/duplicates.md) into the file you want to keep.
- Send tracks to [Prepare](guide/prepare.md).
- [Import and export M3U playlists](guide/playlists.md), and export rekordbox.xml for CDJs. [Moving between Serato and Rekordbox](coming-from-rekordbox.md) lists what that file keeps.
- [Save related tracks](guide/related.md), and open the live view in the separate listener app while you play.
- [Rename, move, replace, and trash files](guide/files.md) so crates and history follow the file. [Check drive](guide/files.md#check-a-portable-drive) reads a removable Serato drive. Nothing is copied or deleted.
- [Keep hash-checked snapshots and restore one](guide/safety.md#snapshots), including crates on each drive and the cue data stored in audio files. A restored crate file is also written into the library database, so Serato 4 and 5 do not delete it on the next launch. The music itself is not copied into the snapshot. Restore can rewrite the Serato tags (cue points, beatgrid, autotags) inside each audio file, and removes Serato tags the snapshot didn't have. The audio stream is hash-checked before and after; if it would change, the file is left as it was.
- Change [sharing, and open the log](guide/settings.md). [Help](guide/settings.md#help) is beside **Settings**. It shows what a report will include and does not post the issue.
- Use [keyboard shortcuts](guide/shortcuts.md) to search, switch views, and move through a list. The full list is in **Settings**. **?** opens it.

Pictures in this guide use a small sample library, not your collection.

## Duplicate merge

The recording below is also on the [Duplicates](guide/duplicates.md) page, where it plays in the page. Select the picture to open the video file. **Use in crates** on Other copies puts a replacement in those crates without merging the library rows.

[![Merge copies dialog. One file is selected to keep, and the plan lists crates and fields.](media/duplicate-merge-poster.jpg)](media/duplicate-merge.mp4)

## If something looks wrong

Start with [Troubleshooting](guide/troubleshooting.md).

The [Panic page](panic.md) covers red tracks, empty crates, a drive that will not mount, and a library that looks different after an update. Restore from the app is **Backups**, then **Review restore**.

[Is my library safe?](is-my-library-safe.md) describes restore, undo, snapshots, and the outside-change watcher. Those work. The [check before a gig](guide/gig-check.md) is in the app.

## For developers

The pages above are the user guide. The code reference, the GitHub setup, and the related-tracks file format stay in the repository and are linked from the **For developers** section of this site. They are not part of the DJ guide.
