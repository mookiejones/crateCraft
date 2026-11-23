# Where Serato 5 stores the library on a Mac

This is a read-only note. It does not change a library. `python3 serato_probe.py` prints which of these paths exist. It does not open `master.sqlite`, `root.sqlite`, or `database V2`.

Serato 5.0.0 was probed read-only on 2026-10-28 on a Mac running Serato DJ Pro 5.0.0 build `5.0.0.1251` (issue #40). That probe recorded these paths. It did not record `PRAGMA user_version`. Serato 5.1.0 build 51025 was probed from a copied `master.sqlite` on 2026-11-21 (issue #471). `PRAGMA user_version` was 203. The observed `PRAGMA schema_version` was 44325. That cookie counts session tables, so the write gate uses `user_version` only. `python3 scripts/serato5-probe.py MASTER.sqlite` copies the file, then prints the schema from the copy. It does not open the original with SQLite. The paths below are the ones this app already uses, that 5.0.0 probe, and Serato's own support notes. Lucid beatgrid storage is still unconfirmed.

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

## Schema probe, Serato 5.1.0

Compared with every table crateCraft reads or writes. There is no 5.0.0 column dump in this repo. The test fixture adds `revision` (and `container_asset.container_id`, `smart_crate_rules.needs_refresh`) that this master does not have. Writers skip those columns when they are absent. Nothing the master writers assign changed type.

| Table | Result |
| --- | --- |
| `lock` | unchanged for `owner_process_id` and `owner_process_name`. Extra columns are not written |
| `asset` | write and read columns unchanged. `file_bit_rate` and `file_sample_rate` are `REAL` and are read, not written. `*_norm` columns are added and not written |
| `container` | write columns unchanged. `revision` is absent |
| `container_asset` | write columns unchanged. `revision` and `container_id` are absent. The master insert uses `location_container_id` |
| `location_container` | unchanged |
| `space_asset` | write columns unchanged. `revision` is absent |
| `smart_crate_rules` | write columns unchanged. `revision` and `needs_refresh` are absent |
| `dj_container_metadata` | write columns unchanged. `revision` is absent |
| `dj_asset_metadata` | deleted by `asset_id`. `external_id` is `INTEGER` and is not written |
| `history_session` | read columns unchanged. Extra text columns are not written |
| `history_entry` | read columns and the `file_name` update are unchanged. Extra columns are not written |
| `serato` | `revision` is absent, so the revision update is skipped |
| `updated_smart_crate` | `container_id` is present |
| `space`, `location`, `connection` | read columns unchanged |

A 5.1.0 library whose header `user_version` is not 203 stays read-only (`serato_schema_mismatch`). A file that is not SQLite stays read-only (`serato_schema_unreadable`). A missing library file is not that error. Protect Library on or unread still blocks. The dump is `tests/data/serato510/master.schema.sql`. The view uuid from the live file is redacted there.

## What this does not know

- Where Lucid or Flexible beatgrid bytes are stored. Do not guess a tag or a column.
- Whether a particular Mac's Serato 5 is using `master.sqlite` until `serato_probe.py` reports that the file exists. The 5.0.0 probe found `database V2` and no new database format inside `_Serato_`. Serato 4 and 5 still keep that file. The file Serato displays is `master.sqlite`.

## Windows, for the same generations

`database V2` and crates are `C:\Users\<name>\Music\_Serato_\`. `master.sqlite` is `%LOCALAPPDATA%\Serato\Library\master.sqlite`. An external drive is `<drive>:\_Serato_\`. Protect Library's Windows location is not in this note.
