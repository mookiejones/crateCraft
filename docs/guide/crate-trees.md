# Crate trees

**Tree** makes a parent crate with a ⟳ subcrate per BPM band, key, or genre. Empty subcrates are not made. Quit Serato first. Audio files stay as they are.

The dialog says **The app makes a parent crate with a ⟳ subcrate per BPM band, key, or genre. Empty subcrates are not made. Serato plays them like any crate. Subcrates refresh when this app opens while Serato is closed, or when you press Refresh. Quit Serato DJ Pro first.**

This is a crate action on **Crates**, under **More**. It is not its own view.

## Build a crate tree

1. Open crateCraft.
2. Click **Crates**. Click **More**, then **Tree**.
3. Choose **BPM bands**, **Keys**, or **Genres**.
4. For BPM, set low, high, band width, and step. For genres, set fewest tracks per genre and most genres. Keys has no extra fields.
5. Optional: tick **Only tracks in** the selected crate and its subcrates when a normal crate is selected. The box starts on.
6. Read the preview. Create tree stays off when no subcrate would be made.
7. Click **Create tree**.

The default name is **BPM bands**, **Keys**, or **Genres**. Type another name to use that instead. The parent is a normal crate at the top of the space. The subcrates refresh like any preset crate.

While Serato has the library open, Tree stays off.

If Create tree cannot finish, a snackbar at the bottom names the file (for example `master.sqlite`) and says to open the local log from **Settings**, or read the operation log on **Backups**. The full path stays in that local log. The snackbar does not ask you to delete a journal file.

## What Create tree writes

Create tree counts the subcrates again, then makes the parent and every non-empty subcrate in one write. An empty tree does not write. Cue points stay in the audio files. The files themselves are not rewritten.

## Resize the list and the details

This dialog sits over **Crates**. The list/details divider stays the width you set.
