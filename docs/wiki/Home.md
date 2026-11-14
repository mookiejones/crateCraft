# crateCraft

<!-- The logo on the banner is not approved yet. It may change. -->

![crateCraft Quick Start. Backups first. Cue points safe. Then go crate digging.](images/quickstart-banner-light.png)

**Five moves.** Backups first. Cue points safe. Then go crate digging.

Start here: **[Quick Start](Quick-Start)**. One page. Five steps.

1. 📥 Download
2. 💿 Install (Mac and Windows)
3. ▶️ Open
4. 🛡️ First backup
5. 🎧 Find your music

![Five Quick Start moves, looping.](images/quickstart-five-moves.gif)

A window on your computer for the Serato DJ Pro library. Crates, Cue points, and Backups stay on this machine.

- [Install on a Mac](Install-macOS)
- [Install on Windows](Install-Windows)

The long guide is published at <https://mookiejones.github.io/crateCraft/>.

## What you click

**crateCraft** sits in the top bar next to the menu. A chip there starts as **Checking**, then **Serato 4** or **Serato 5**.

The drawer has five primaries: **Music**, **Organize files**, **Health**, **Backups**, and **Gig**. The space menu sits in the crate list header. Children of the open parent sit in the drawer. Help and Settings stay in the top bar when the rail is mini. After you play a track, Play, the title, the waveform, and the time sit in the top bar. The heading at the top of the sheet names the open view and the space. The address bar keeps the open view and crate (`#library/crates` for All tracks). Refresh and the window Back button restore that screen. A hash the app does not know opens Crates. **Music** is Crates, History, and Play stats. **Health** is Overview, Missing files, Duplicates, Stems, Damaged files, Suspect quality, and Tag spellings. **Gig** is Ready, Check drive, and Tempo drift. Organize files and Backups have no extra children. Overview, Ready, Tempo drift, Damaged files, and Suspect quality show **Scope** for the selected crate, with **All tracks** on that chip to check the whole space. Mini rail leaves crate names next to the list. The desktop **Music** and **Tools** menus list those same destinations, in the same words.

Double-click a track to play it. After a track loads, **Play**, the title, the waveform, and the time sit in the top bar. Playback does not change the file.

The space menu shows **Library**, **Video**, **Apple Music**, and **Prepare**.

**Help** and **Settings** sit on the right of the top bar, even before a track loads. Settings lists the keys under **Keyboard shortcuts**. **?** opens that list. Ctrl+K or Command+K finds a view, crate, track, or file. Hover a control, or tab to it, to read what it does. If it has a shortcut, the note shows that key.

## Cue points and Backups

Cue points live in the audio file. A normal save does not rewrite them.

**Backups** keeps hash-checked copies of the library, the crates on each drive, and the Cue point frames stored in the audio files. The music itself is not copied.

Open **Backups**, choose **Review restore**, then **Restore**. Restore can rewrite the Serato tags (cue points, beatgrid, autotags) inside each audio file, and removes Serato tags the snapshot didn't have. The audio stream is hash-checked before and after; if it would change, the file is left as it was.

Quit Serato DJ Pro before a write. On Serato 5, writes and restores stay off.

## One download

GitHub Releases is the only download. There is no Homebrew formula, no winget package, and no other website.

**Rekordbox** can export `rekordbox.xml`. The guide marks that export **PREVIEW**.
