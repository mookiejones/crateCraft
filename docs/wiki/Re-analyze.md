# Re-analyze

**Re-analyze** is under **Health**. Pick a crate. The list shows tracks that still look analyzed. **Preview** shows what will change. **Confirm re-analyze** marks them unanalyzed so Serato rebuilds grids and overviews. Cue points stay.

Example data. A Friday crate has three analyzed tracks. Preview lists them. Confirm clears the analyzed mark and, by default, BeatGrid and Autotags on those files. Markers2 cues stay. Open the tracks in Serato to rebuild.

```mermaid
flowchart LR
  crate["Crate"] --> preview["Preview"]
  preview --> confirm["Confirm re-analyze"]
  confirm --> mark["Unanalyzed mark"]
  mark --> serato["Open in Serato to rebuild"]
```

Quit Serato DJ Pro before you confirm. You can read the list while Serato is open. **All tracks** stays off. **Also clear BeatGrid and Autotags** starts on; turn it off to mark the database only. **Include locked beatgrids** unlocks those rows so Serato can rebuild them.

crateCraft does not re-analyze the audio. The undo is the snapshot taken just before the write.
