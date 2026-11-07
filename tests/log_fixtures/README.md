# Session log fixtures

`captured-serato4/` keeps the glog line shape, file name, Product name
line, Opening library line, `Surface Version: 4.1`, and backup lines from
a Serato DJ Pro 4.0.10 (4010213) session. `captured-serato5/` keeps the
same shape from a Serato DJ Pro 5.0.0 (5001251) session. Home directory,
host name, and library UUID are placeholders. Track paths are omitted.

The other folders are hand-written stand-ins for `_Serato_/Logs`. Serato's
support note says a session log's name carries the session date and the
time the session finished, and that the file names the Serato DJ version.
A published note on the Serato 5 library says the lines marked `[Library]`
name the database that session opened. `serato_logs.py` accepts those
markers and the captured glog lines, and treats anything else as unknown.

Nothing in this folder is a user's library. The paths are examples.
