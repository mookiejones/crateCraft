# Backup Mac

**Backup Mac** sends selected crates and their music to another computer running crateCraft on the same local network. The copy lands in a staged folder. The two libraries are not kept in sync. Nothing is sent until you preview and then send. Nothing is written into the receiving library until that computer confirms.

The note under the heading says **Send selected crates and their music to a paired Mac on this network. The copy stays in a staged folder until that Mac adds it.** A second line says **This is a one-time staged copy. The two libraries are not kept in sync.**

## Listen on the backup Mac

1. Open crateCraft on the computer that should receive the copy.
2. Click **Backups**.
3. Under **Backup Mac**, click **Listen**.
4. Read the port, the pairing code, and the address. Give those to the computer that will send.

**Stop listening** closes that port. A copy that already arrived stays until you remove it. Opening Backups does not start listening.

## Send from this Mac

1. Open **Backups**, then **Backup Mac**.
2. Type the other computer's address, port, and pairing code.
3. Tick the crates to send.
4. Click **Preview**. The page shows the file count, the size, and any file that would be skipped. A missing file, a file on a drive that is not connected, and a shortcut are listed. Nothing is sent.
5. Click **Send**.

The other computer stores the audio and the crate names, including crate colors, in a staged folder next to crateCraft's settings. It does not change that computer's Serato library. A file that fails during the copy is listed. The rest still arrive.

An address that is not on the local network is refused. A wrong pairing code is refused.

## Add the copy on the backup Mac

1. On the receiving computer, click **Refresh** under **Backup Mac**.
2. Choose the staged copy.
3. Click **Add to this library**. The page shows how many tracks this library already has. Nothing is written.
4. Click **Confirm add**. Quit Serato first.

crateCraft saves a snapshot, then creates **From backup Mac** inside **_crateCraft generated**. Each staged crate keeps its color. A track is added only when this library already has the same file. The others stay in the staged folder and are named in the list. Crate colors travel with the copy. The audio file is not rewritten.

**Undo add** puts that snapshot back. Quit Serato first.

**Remove staged copy**, then **Confirm remove**, deletes that staged folder. Crates already added stay until you undo.

While Serato has the library open, the add waits in **Gig Lock** instead of writing. A send does not. It only reads this library and writes the staged folder on the other computer.
