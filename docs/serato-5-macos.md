# Where Serato 5 stores the library on a Mac

This is a read-only note. It does not change a library. `python3 serato_probe.py` prints which of these paths exist. It does not open `master.sqlite`, `root.sqlite`, or `database V2`.

Serato 5 was not re-probed from this checkout. The paths below are the ones this app already uses, the 2026-10-28 read-only probe on a Mac running Serato DJ Pro 5.0.0 build `5.0.0.1251` (issue #40), and Serato's own support notes. Lucid beatgrid storage is still unconfirmed.

## What changed

| | Serato 3 | Serato 4 and Serato 5 |
| --- | --- | --- |
| Library Serato displays | `~/Music/_Serato_/database V2` | `~/Library/Application Support/Serato/Library/master.sqlite` |
| Internal-drive database | the same `database V2` | `root.sqlite` beside `master.sqlite` |
| `database V2` | the library | still written on quit, and read back if its checksum changed |
| Crates | `~/Music/_Serato_/Subcrates/*.crate` | the database is the list. A `.crate` file the database has never recorded is deleted at the next launch |
| External drive | `/Volumes/<name>/_Serato_/` with its own `database V2` and `Subcrates` | the same folder. Tracks on that drive are not in the internal `database V2` |
| Protect Library | not present | `library_protect` in `~/Library/Preferences/com.serato.seratodj.plist`. `1` is on, `0` is off. Missing or unreadable is unknown. It does not lock the database file |
| Build | the app version | `CFBundleShortVersionString` is the version (`5.0.0`). `CFBundleVersion` is the build (`5.0.0.1251` on the probed Mac). A build change under the same version is a different install |
| Logs | `~/Music/_Serato_/Logs` | the same folder. A `[Library]` line names the database that was opened |

Leave `_Serato_/Export Backups/` and `_Serato_/Lexicon/` alone. They are not the library.

## What this does not know

- Where Lucid or Flexible beatgrid bytes are stored. Do not guess a tag or a column.
- Whether a particular Mac's Serato 5 is using `master.sqlite` until `serato_probe.py` reports that the file exists. The 5.0.0 probe found `database V2` and no new database format inside `_Serato_`. Serato 4 and 5 still keep that file. The file Serato displays is `master.sqlite`.

## Windows, for the same generations

`database V2` and crates are `C:\Users\<name>\Music\_Serato_\`. `master.sqlite` is `%LOCALAPPDATA%\Serato\Library\master.sqlite`. An external drive is `<drive>:\_Serato_\`. Protect Library's Windows location is not in this note.
