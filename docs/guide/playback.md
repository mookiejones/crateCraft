# Play a track

Play a file that is already in the library. The app streams it from this computer. It does not upload the file, write to it, or add a Serato history row. The request uses the track's library id. A filesystem path is not accepted.

1. Click a track.
2. Double-click the row, press **Enter**, or click the play button on the row. **Enter** on the list plays the selected track. **Enter** on a focused row plays that row. In the detail pane, click **Play**. The list Play button and the detail Play button share one player. Click **Play** on the playing track to pause. Click **Play** on another row to start that track. Both buttons show Play or Pause.
3. After a track loads, the top bar is the deck. In a wide window it shows a zoomed waveform, a whole-track overview, pads 1–8, and **Play**, the title, and the time in the blank next to the pads, between the Serato chip and Help. Click a pad that has a cue to jump there. Empty pads do nothing. Zoom sits on the wave. A window narrower than 980px keeps **Play**, the title, a 32px wave, and the time. Pause keeps that bar. It hides again when there is no current track.

When a track ends, the next row in the list starts. The last row stops.

Cue points from the file sit on pads 1–8 in the top bar. Click a pad that has a cue to jump there. Empty pads do nothing. The detail pane still lists cue times and names. The name shows in that list. Hover a filled pad, or tab to it, and the note names the jump and the cue. The pad nearest the playhead is marked. A screen reader still hears Cue point and the number. A track with no cues has empty pads.

The waveform in the top bar is the same SWF1 view. Lows are red, mids are green, and highs are blue. The brighter core is the sustained level. The fainter edge is the peak. Click it, or drag, to move through the track. Zoom sits on the wave in a wide window.

If this computer cannot build a waveform for the file, the bar says **Waveform unavailable for this format**. The track still plays.

**Play** and **Pause** are one button. Its name changes with the state.

**W** or **Space** plays or pauses. When nothing is playing, it starts the selected track. It does nothing while you are typing in a field. **Alt+E** or **Left** moves 5 seconds back. **Alt+R** or **Right** moves 5 seconds forward. **1** through **8** jump to that cue pad. They do not set or delete a cue. The other playback keys are in [Keyboard shortcuts](shortcuts.md).

If the track is not in the library, or the file is missing, the bar says **Not in the library or file missing**. If this window cannot decode the file, the bar says **This file cannot be played in this window.**

MP3, M4A, AAC, ALAC, FLAC, WAV, AIFF, and OGG are the types the server will send.

The server can also build a frequency-colored waveform for that same library id. WAV, AIFF, FLAC, MP3, and OGG are decoded on this computer. M4A, AAC, and ALAC are decoded by the audio system on a Mac or a Windows PC. On Linux they are decoded when ffmpeg is already installed. This app does not include ffmpeg. If the file still cannot be read, the waveform says it is unavailable and playback still works. A 60-minute stereo 44.1 kHz WAV is analyzed in 7.9 seconds. The result is cached beside the app settings, not inside the Serato folder, and the audio file is not changed. Cue points, loops, and the beatgrid are read from the file and are not written back.

Music that lives behind a shortcut folder still plays, including when that folder points at another disk. A shortcut that points at a file outside the folder named in the library does not.
