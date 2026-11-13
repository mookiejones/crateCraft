# Playback

Play a track that is already in the library. The sound stays on this computer. The request uses the track's library id.

Double-click a row, press **Enter**, or click **Play**. **Enter** on the list plays the selected track. **Enter** on a focused row plays that row. The list Play button and the detail Play button share one player. Click **Play** on the playing track to pause. Click **Play** on another row to start that track. Both buttons show Play or Pause.

After a track loads, **Play**, the title, the waveform, and the time sit in the top bar, between the Serato chip and Help. Pause keeps that bar. It hides again when there is no current track. When a track ends, the next row in the list starts.

Cue points from the file sit on the pads in the detail pane. Click a pad to jump there. A track with no cues has empty pads.

The waveform in the top bar is the same SWF1 view. Lows are red, mids are green, and highs are blue. Click or drag it to move through the track. Zoom and the whole-track overview stay off that bar.

If the file has no waveform, the bar says **Waveform unavailable for this format**. The track still plays.

**Play** and **Pause** are one button. Its name changes with the state. Hover a player control, or tab to it, and a note names the action. **Space**, **Left**, and **Right** are written there when they apply.

**Space** plays or pauses. When nothing is playing, it starts the selected track. It does nothing while you are typing in a field. **Left** moves 5 seconds back. **Right** moves 5 seconds forward. Those are the only playback keys in the shortcut table.

Playback does not change the audio file and does not add a history row. If the track is not in the library, or the file is missing, the bar says **Not in the library or file missing**. If the window cannot play the file, the bar says **This file cannot be played in this window.**

Music behind a shortcut folder still plays, including when that folder points at another disk. A shortcut that points at a file outside the folder named in the library does not.

The server builds a waveform for the same library id. WAV, AIFF, FLAC, MP3, and OGG are decoded here. M4A, AAC, and ALAC are decoded by the Mac or Windows audio system. On Linux they need ffmpeg already installed on this computer. This app does not include ffmpeg. Without a decoder the waveform is unavailable and the track still plays. A 60-minute stereo 44.1 kHz WAV is analyzed in 7.9 seconds and cached next to the app settings. The Serato folder and the audio file are not changed.
