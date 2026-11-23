# History

History is the record of tracks Serato has played. Browsing a session is read-only. **Rescue sessions** can restore chosen sessions from a backup or rebuild them as dated crates.

![History for a sample session named Friday. The row shows the deck, whether it played, and the start time.](../media/history.png)

1. Click **Music** in the drawer, then **History**.
2. Click a session in the list. The name is the session name, or **Session** when Serato stored no name. The number is how many tracks were played.
3. Read the rows. The columns are **Title**, **Artist**, **Deck**, **Played**, and **Time**. Time is when the play started. The list starts with the latest play.

The count above the list says **plays**, not tracks.

## Open the library track

1. Click a history row.
2. Read **Played**, **Deck**, **Started**, and **File**. **Notes** appears when the entry has notes.
3. Click **Open in library** when the button is there.

**Open in library** switches to the Library space, selects **Crates** and **All tracks**, and opens that track. A history row with no library track has no **Open in library** button.

If the sessions cannot be read, the page says **Could not read history.** If one session fails, it says **Could not read that session.** With no session selected, the list says **Choose a session.**

## Rescue sessions

Use this when a session disappeared after an upgrade or an accidental delete, or when Serato's history import left a gap.

1. Under the session list, open **Rescue sessions**.
2. Click **Scan sources** to list complete backups and snapshots. A Serato 3.x History folder is listed as **Not checked** and is not used for compare.
3. Pick a source, then **Compare** for a per-session diff. Nothing is written.
4. Type the source session ids (comma-separated).
5. Prefer **Rebuild as crates**. Quit Serato first. Dated crates land under **History rescue (crateCraft)** and do not overwrite a crate you already made.
6. **Restore sessions** writes those sessions back into live history only when this Serato version's history schema is checked. A refused restore says to rebuild as crates instead. Restore takes a snapshot first and reads the sessions back; a failed verify rolls back.
