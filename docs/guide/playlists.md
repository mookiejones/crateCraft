# Playlists

**Export** writes an M3U playlist. **Rekordbox** writes `rekordbox.xml`. **Import** makes a crate from an M3U file. Both playlists use the tracks already in the library. Import does not copy audio onto the computer.

Quit Serato before you import. Export and Rekordbox only read the library. Rekordbox also reads cue points from the audio files and does not change them.

## Export

1. Select **Crates**.
2. Select the crate to export. Select **All tracks** to export the whole space.
3. Open **More** above the track list and click **Export**.

The browser downloads `crate.m3u`. **Export**, **Import**, and **Rekordbox** show only on **Crates**.

The file is an extended M3U. It has a playlist name, a length, and a path for each track. A streaming track is a comment that names the service, and it is left out of the playlist. A track with no path is a comment line that says it was omitted. Open the file in a text editor if you want to read it.

## Import

1. Select **Crates**.
2. Select the crate that should hold the new playlist. Select **All tracks** to put it at the top of the space.
3. Click **Import**.
4. Choose a `.m3u` or `.m3u8` file.

The crate name is the file name without `.m3u` or `.m3u8`. A file with no name becomes **Imported playlist**.

The bar reports how many tracks were added. Lines that do not match a track already in the library are counted in the same sentence: **lines did not match a library track.** Those lines are skipped. The page does not search the disk for a new file.

An empty playlist says **The playlist is empty.**

Import matches a line to a track that is already in the library. Put the audio in the library in Serato first when the path is new.

## Rekordbox

**Rekordbox** writes `rekordbox.xml`, the file Rekordbox imports. A CDJ USB is then prepared in Rekordbox. This app does not write the newer USB formats (Device Library Plus or OneLibrary). A follow-up can cover those. [Moving between Serato and Rekordbox](../coming-from-rekordbox.md) lists what the file keeps.

1. Select **Crates**.
2. Select the crate to export. Select **All tracks** to export the whole space.
3. Click **Rekordbox**.

**Rekordbox** opens a dialog that lists what could not be copied. Memory cues, Hot loops, and the key notation sit in that dialog. Changing them saves `settings.json` and refreshes the report. The file downloads after you confirm. The download is the XML from that same check, so a failed request is not saved as `rekordbox.xml`. A file that is locked or cannot be opened is still in the XML, without its cue points, and the dialog names that file. A path that contains a null character is exported as a missing file, and the dialog names that file too. A composed spelling and a decomposed spelling of the same path are exported once. The dialog counts that file as missing only when neither spelling is on disk. A beatgrid marker whose time or BPM is not a real number is left out and counted. A marker with under half a beat before the next marker or the end of the track is written one beat earlier when that still fits. When one beat would fall outside the track, the dialog names that marker.

**Memory cues** starts on. Each hot cue is then also saved as a memory cue, which is what some CDJ screens show. **Hot loops** starts off. The app stores Memory cues, Hot loops, and the key notation in `settings.json` and restores them the next time you open the page, including after a relaunch. If that save fails, the export still uses the boxes you see. The help line says Uses a free hot-cue pad. A saved loop then takes its own pad when that pad is free and the pad is one of the first eight. A loop whose pad is already taken stays a memory loop. A loop past those eight pads stays a memory loop too. While the box is clear, every saved loop stays a memory loop. **Key as stored** leaves the key text Serato has. Choose **Camelot key** or **Classical key** when Rekordbox is set to the other notation.

A smart crate stays an ordinary playlist. Its rules are not copied, and the file is not a Rekordbox smart list. The dialog names each rule **Exact**, **Approximate**, or **Impossible**. **Exact** means the same field is already written on the track. **Approximate** is not fully compatible. **Location contains** is **Impossible**. It is not rewritten as filename contains. **Freeze today's tracks** is on for each smart crate until you clear it. On, the playlist is the tracks Serato had stored. Clear the box and that playlist is empty. The rule is not rewritten as another field. When the number of stored tracks and the number of tracks in that playlist differ, the dialog says so. That count is not a count from Rekordbox. The check does not write the Serato library. The file downloads after you confirm.

The file lists each track's location, title, artist, album, genre, BPM, key, length, bitrate, and comments. Hot cues keep their number, name, and color. Two cues at the same millisecond are kept once, and the dialog names the one left out. Cues a few milliseconds apart stay. Hot cues stop at eight. Memory cues stop at 32, and the dialog names the ones left out. A crate name with an emoji or a non-Latin script is kept, and the dialog names it when a player may not show that name. Saved loops are loops. The beatgrid is included when the file has one, including a grid with a marker at each tempo change. A streaming track is left out, and the dialog names it. A track with no path is left out. An MP3 is shifted only when its LAME or Xing header says Serato and Rekordbox disagree, which is about 26 milliseconds. An AAC file is not shifted by that amount.

Crates become playlist folders. A subcrate stays inside its parent. A crate that has both tracks and subcrates becomes a folder, and its own tracks are a playlist with the same name inside that folder.

From the project folder, the same file can be written without opening the page. The command prints the same loss report the dialog shows:

```bash
python3 rekordbox.py -o rekordbox.xml
```

## Import into Rekordbox

In Rekordbox 6 and 7 the import control is at **Preferences**, **Advanced**, **Database**, **rekordbox xml**.

Since Rekordbox 5.6.1, importing an XML file does not update a track that is already in the collection. Rekordbox 6 and 7 do the same. The cues already in Rekordbox stay as they are.

To replace the cues, the beatgrid, and the tags on tracks that are already in the collection:

1. Open the **rekordbox xml** list in the sidebar.
2. Select all the tracks.
3. Right-click and choose **Import to Collection**.
4. Answer **Yes** to **load information from imported library**.

**This overwrites cues, the beatgrid, and tags in Rekordbox.** It does not merge them. A cue that exists only in Rekordbox is removed. Export a Rekordbox XML backup first if you need those cues.

Rekordbox can then export a USB for CDJs. Device Library Plus and OneLibrary drives are not produced by this export. Cue colors may snap to Rekordbox's palette. Flips are left out, because Rekordbox has no flip markers. A beatgrid with more than 4096 markers is left out and named in the loss report.
